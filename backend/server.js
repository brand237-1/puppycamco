const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Middleware
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'puppy-cam-co-secret-key-123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Setup Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize SQLite Database
const dbPath = process.env.DISK_PATH || (fs.existsSync('/data') ? '/data/database.sqlite' : path.join(__dirname, 'database.sqlite'));
const db = new Database(dbPath, {
    verbose: (sql) => console.log(`[SQL] ${sql}`),
    timeout: 10000
});
db.pragma('journal_mode = WAL');

// --- Database Schema ---
db.exec(`
    CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        breed TEXT,
        age TEXT,
        gender TEXT,
        color TEXT,
        travel_ready BOOLEAN DEFAULT 0,
        old_price REAL,
        new_price REAL,
        description TEXT,
        image_base64 TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        old_price REAL,
        new_price REAL NOT NULL,
        description TEXT,
        image_base64 TEXT
    );
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        image_base64 TEXT
    );
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        sender TEXT NOT NULL, -- 'user' or 'admin'
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS adoption_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id TEXT,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        proposed_price REAL,
        payment_method TEXT,
        address TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// --- Seed & Migrations ---
async function initDB() {
    const hash = await bcrypt.hash('P1bugatti', 10);
    const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get('kingkenzy237@gmail.com');
    if (!existingAdmin) {
        db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run('kingkenzy237@gmail.com', hash);
        console.log("Seeded admin account (kingkenzy237@gmail.com)");
    } else {
        db.prepare('UPDATE admins SET password_hash = ? WHERE email = ?').run(hash, 'kingkenzy237@gmail.com');
        console.log("Updated admin password");
    }

    const msgInfo = db.pragma('table_info(messages)');
    if (!msgInfo.some(c => c.name === 'is_read')) {
        db.exec("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0");
    }

    // Cleanup notifications older than 7 days
    try {
        db.prepare("DELETE FROM notifications WHERE created_at < datetime('now', '-7 days')").run();
    } catch (e) { }
}
initDB();

// --- Auth Middleware ---
const requireAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
};

// Intercept for detailed error logging
app.use((req, res, next) => {
    const originalStatus = res.status;
    res.status = function (code) {
        if (code >= 400) {
            console.log(`[HTTP ERROR STATUS] ${req.method} ${req.url} -> ${code}`);
        }
        return originalStatus.apply(this, arguments);
    };
    next();
});

// --- API Endpoints ---

// Admin Auth
app.post('/api/admin/login', async (req, res) => {
    try {
        const email = req.body.email || req.body.username;
        const password = req.body.password;
        const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
        if (admin && await bcrypt.compare(password, admin.password_hash)) {
            req.session.isAdmin = true;
            return res.json({ message: 'Login successful' });
        }
        res.status(401).json({ error: 'Invalid credentials' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/check', (req, res) => {
    res.json({ loggedIn: !!req.session.isAdmin });
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out' });
});

// User Auth
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, email, password, phone, address } = req.body;
        const hash = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (full_name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(fullName, email, hash, phone, address);
        req.session.userId = result.lastInsertRowid;
        req.session.save((err) => {
            if (err) return res.status(500).json({ error: 'Session save failed' });
            res.json({ success: true });
        });
    } catch (e) {
        if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (user && await bcrypt.compare(password, user.password_hash)) {
            req.session.userId = user.id;
            return req.session.save((err) => {
                if (err) return res.status(500).json({ error: 'Session save failed' });
                res.json({ success: true });
            });
        }
        res.status(401).json({ error: 'Invalid email or password' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/status', (req, res) => {
    res.json({ loggedIn: !!req.session.userId });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Profile & Data
app.get('/api/user/profile', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
    const user = db.prepare('SELECT id, full_name, email, phone, address, created_at FROM users WHERE id = ?').get(req.session.userId);
    res.json(user);
});

// Pets
app.get('/api/pets', (req, res) => res.json(db.prepare('SELECT * FROM pets').all()));

app.post('/api/pets', requireAdmin, upload.single('image'), (req, res) => {
    try {
        const { name, breed, age, gender, color, travel_ready, old_price, new_price, description } = req.body;
        let image_base64 = null;
        if (req.file) {
            image_base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
        const tReady = travel_ready === 'true' || travel_ready === '1' || travel_ready === true ? 1 : 0;
        const stmt = db.prepare('INSERT INTO pets (name, breed, age, gender, color, travel_ready, old_price, new_price, description, image_base64) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const result = stmt.run(name, breed, age, gender, color, tReady, old_price, new_price, description, image_base64);
        res.json({ id: result.lastInsertRowid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pets/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM pets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Products
app.get('/api/products', (req, res) => res.json(db.prepare('SELECT * FROM products').all()));

app.post('/api/products', requireAdmin, upload.single('image'), (req, res) => {
    try {
        const { name, old_price, new_price, description } = req.body;
        let image_base64 = null;
        if (req.file) {
            image_base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
        const stmt = db.prepare('INSERT INTO products (name, old_price, new_price, description, image_base64) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(name, old_price, new_price, description, image_base64);
        res.json({ id: result.lastInsertRowid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Reviews
app.get('/api/reviews', (req, res) => res.json(db.prepare('SELECT * FROM reviews').all()));

app.post('/api/reviews', upload.single('image'), (req, res) => {
    try {
        const { customer_name, rating, comment } = req.body;
        let image_base64 = null;
        if (req.file) {
            image_base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
        const stmt = db.prepare('INSERT INTO reviews (customer_name, rating, comment, image_base64) VALUES (?, ?, ?, ?)');
        const result = stmt.run(customer_name, rating, comment, image_base64);
        res.json({ id: result.lastInsertRowid });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/reviews/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Adoption
app.post('/api/adoption-list', (req, res) => {
    try {
        const { customerName, email, phone, address, items, paymentMethod, proposedPrice } = req.body;
        const userId = req.session.userId || null;
        const submissionId = 'SUB-' + Date.now();
        const stmt = db.prepare('INSERT INTO adoption_list (submission_id, customer_name, email, phone, address, item_type, item_id, item_name, proposed_price, payment_method, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        db.transaction(() => {
            for (const item of items) {
                stmt.run(submissionId, customerName, email, phone, address, item.type, item.id, item.name, proposedPrice ? (proposedPrice / items.length) : null, paymentMethod, userId);
            }
        })();
        res.json({ success: true, submissionId });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/adoption-list', requireAdmin, (req, res) => {
    try {
        const list = db.prepare('SELECT * FROM adoption_list ORDER BY created_at DESC').all();
        res.json(list);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin Users
app.get('/api/admin/users', requireAdmin, (req, res) => {
    try {
        const users = db.prepare('SELECT id, full_name, email, phone, address, created_at FROM users ORDER BY created_at DESC').all();
        res.json(users);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Messaging
app.get('/api/messages', (req, res) => {
    try {
        if (req.session.isAdmin) {
            const msgs = db.prepare('SELECT m.*, u.full_name as user_name FROM messages m LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at ASC').all();
            return res.json(msgs);
        } else if (req.session.userId) {
            const msgs = db.prepare('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC').all(req.session.userId);
            return res.json(msgs);
        }
        res.status(401).json({ error: 'Unauthorized' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/messages', (req, res) => {
    try {
        const { message, userId } = req.body;
        const finalUserId = req.session.isAdmin ? userId : req.session.userId;
        const sender = req.session.isAdmin ? 'admin' : 'user';
        if (!finalUserId) return res.status(401).json({ error: 'Unauthorized/User ID required' });
        db.prepare('INSERT INTO messages (user_id, sender, message) VALUES (?, ?, ?)').run(finalUserId, sender, message);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/unread-counts', (req, res) => {
    try {
        if (req.session.isAdmin) {
            const total = db.prepare("SELECT COUNT(*) as count FROM messages WHERE is_read = 0 AND sender = 'user'").get().count;
            const perUser = db.prepare("SELECT user_id, COUNT(*) as count FROM messages WHERE is_read = 0 AND sender = 'user' GROUP BY user_id").all();
            return res.json({ total, perUser });
        } else if (req.session.userId) {
            const chat = db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND sender = "admin" AND is_read = 0').get(req.session.userId).count;
            const notifications = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.session.userId).count;
            return res.json({ chat, notifications });
        }
        res.status(401).json({ error: 'Unauthorized' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/messages/mark-read', (req, res) => {
    try {
        if (req.session.isAdmin) {
            const { userId } = req.body;
            db.prepare("UPDATE messages SET is_read = 1 WHERE user_id = ? AND sender = 'user'").run(userId);
        } else if (req.session.userId) {
            db.prepare("UPDATE messages SET is_read = 1 WHERE user_id = ? AND sender = 'admin'").run(req.session.userId);
        } else {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Notifications
app.post('/api/notifications', requireAdmin, (req, res) => {
    try {
        const { userId, message } = req.body;
        db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(userId, message);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notifications', (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
        const list = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
        res.json(list);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER EXCEPTION:', err);
    res.status(500).json({ error: 'Internal Server Error', detail: err.message });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
