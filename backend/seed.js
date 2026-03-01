const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'), { verbose: console.log });
db.pragma('journal_mode = WAL');

console.log("Initializing database schema...");
// --- Database Schema ---
db.exec(`
    DROP TABLE IF EXISTS pets;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS admins;
    DROP TABLE IF EXISTS adoption_list;

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

    CREATE TABLE IF NOT EXISTS adoption_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        proposed_price REAL,
        payment_method TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

const seedData = async () => {
    console.log("Seeding data...");

    // Seed Admin
    const adminCheck = db.prepare('SELECT * FROM admins WHERE email = ?').get('puppycamco@gmail.com');
    if (!adminCheck) {
        const hash = await bcrypt.hash('admin123', 10);
        db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run('puppycamco@gmail.com', hash);
        console.log("Seeded basic admin account: puppycamco@gmail.com / admin123");
    } else {
        console.log("Admin account already exists.");
    }

    // Function to encode image file to base64
    const fileToBase64 = (filePath) => {
        if (fs.existsSync(filePath)) {
            const bitmap = fs.readFileSync(filePath);
            const ext = path.extname(filePath).substring(1);
            return `data:image/${ext};base64,` + Buffer.from(bitmap).toString('base64');
        }
        return null;
    };

    // Clear and re-seed pets
    db.exec("DELETE FROM pets; DELETE FROM sqlite_sequence WHERE name='pets';");

    const petsToSeed = [
        { name: 'Bella', breed: 'Golden Retriever', age: '10 Weeks', description: 'Energetic and eager to please. The perfect family dog.', old_price: 900, new_price: 650, gender: 'Female', color: 'Golden', travel_ready: 1, img: './pictures/1.jpg' },
        { name: 'Charlie', breed: 'French Bulldog', age: '12 Weeks', description: 'Stocky, smushy-faced, and full of personality!', old_price: 850, new_price: 700, gender: 'Male', color: 'Fawn', travel_ready: 1, img: './pictures/2.jpg' },
        { name: 'Luna', breed: 'Poodle', age: '9 Weeks', description: 'Highly intelligent and hypoallergenic. A very elegant pup.', old_price: 750, new_price: 600, gender: 'Female', color: 'White', travel_ready: 0, img: './pictures/3.jpg' },
        { name: 'Max', breed: 'German Shepherd', age: '14 Weeks', description: 'Loyal and protective. Has started basic commands.', old_price: 650, new_price: 550, gender: 'Male', color: 'Black & Tan', travel_ready: 1, img: './pictures/4.jpg' },
        { name: 'Daisy', breed: 'Beagle', age: '11 Weeks', description: 'Curious and merry, with a nose for adventure!', old_price: null, new_price: 450, gender: 'Female', color: 'Tri-color', travel_ready: 0, img: './pictures/5.jpg' },
        { name: 'Rocky', breed: 'Rottweiler', age: '10 Weeks', description: 'Strong, calm, and confident. Will be a great guardian.', old_price: 800, new_price: 650, gender: 'Male', color: 'Black/Mahogany', travel_ready: 1, img: './pictures/6.jpg' },
        { name: 'Lindy', breed: 'Yorkshire Terrier', age: '8 Weeks', description: 'Tiny but mighty! Loves to cuddle and play.', old_price: 950, new_price: 750, gender: 'Female', color: 'Blue & Gold', travel_ready: 1, img: './pictures/7.jpg' },
        { name: 'Zoey', breed: 'Bernedoodle', age: '10 Weeks', description: 'Fluffy, affectionate, and great with kids.', old_price: 850, new_price: 680, gender: 'Female', color: 'Tricolor', travel_ready: 1, img: './pictures/8.jpg' },
        { name: 'Bear', breed: 'French Bulldog', age: '11 Weeks', description: 'Chunky monkey with the cutest bat ears.', old_price: 800, new_price: 600, gender: 'Male', color: 'Blue Fawn', travel_ready: 0, img: './pictures/9.jpg' },
        { name: 'Milo', breed: 'Corgi', age: '9 Weeks', description: 'Short legs, big heart. Always ready for a walk.', old_price: 700, new_price: 550, gender: 'Male', color: 'Sable', travel_ready: 1, img: './pictures/10.jpg' },
        { name: 'Ruby', breed: 'Cavalier King Charles', age: '12 Weeks', description: 'Gentle, affectionate, and graceful.', old_price: null, new_price: 650, gender: 'Female', color: 'Blenheim', travel_ready: 1, img: './pictures/11.jpg' }
    ];

    const insertPetStmt = db.prepare('INSERT INTO pets (name, breed, age, gender, color, travel_ready, old_price, new_price, description, image_base64) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

    // Dynamically fetch actual images from the pictures folder
    let availableImages = [];
    try {
        const picturesDir = path.join(__dirname, 'pictures');
        if (fs.existsSync(picturesDir)) {
            const files = fs.readdirSync(picturesDir);
            availableImages = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png')).map(f => path.join(picturesDir, f));
        }
    } catch (e) { console.error("Could not read pictures directory", e); }

    let seededCount = 0;
    for (let i = 0; i < petsToSeed.length; i++) {
        const pet = petsToSeed[i];

        let imgSrc = null;
        if (availableImages.length > 0) {
            imgSrc = availableImages[i % availableImages.length];
        }

        let base64img = imgSrc ? fileToBase64(imgSrc) : null;

        if (base64img) {
            insertPetStmt.run(
                pet.name, pet.breed, pet.age, pet.gender, pet.color,
                pet.travel_ready ? 1 : 0, pet.old_price, pet.new_price, pet.description, base64img
            );
            seededCount++;
        } else {
            console.warn(`Warning: Image not found for pet ${pet.name}`);
            insertPetStmt.run(
                pet.name, pet.breed, pet.age, pet.gender, pet.color,
                pet.travel_ready ? 1 : 0, pet.old_price, pet.new_price, pet.description, null
            );
            seededCount++;
        }
    }

    console.log(`Seeded ${seededCount} pets into the database.`);

    // Pre-seed some initial products if none exist
    const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    if (prodCount === 0) {
        let logoImg = fileToBase64(path.join(__dirname, 'logo puppy.png'));
        db.prepare('INSERT INTO products (name, old_price, new_price, description, image_base64) VALUES (?, ?, ?, ?, ?)').run(
            'Premium Kitten Nutrition Food', 25.00, 19.99, 'High-quality dry food optimized for kitten growth and immune system support.', logoImg
        );
        console.log("Seeded 1 product into the database.");
    }

    // Pre-seed some reviews
    const revCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
    if (revCount === 0) {
        db.prepare('INSERT INTO reviews (customer_name, rating, comment) VALUES (?, ?, ?)').run(
            'Sarah Jenkins', 5, 'Puppy Cam Co made finding my new kitten so incredibly easy! The staff was super helpful and the kitten was in perfect health.'
        );
        db.prepare('INSERT INTO reviews (customer_name, rating, comment) VALUES (?, ?, ?)').run(
            'Mark H.', 5, 'Great quality pet food. My adopted kitten loves it and delivery was extremely fast to Liverpool.'
        );
        console.log("Seeded 2 customer reviews into the database.");
    }

    // Pre-seed some sample users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        const userHash = await bcrypt.hash('user123', 10);
        db.prepare('INSERT INTO users (full_name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?)').run(
            'John Customer', 'john@example.com', userHash, '+44 7700 900000', '10 Main St, London'
        );
        db.prepare('INSERT INTO users (full_name, email, password_hash, phone, address) VALUES (?, ?, ?, ?, ?)').run(
            'Jane Doe', 'jane@example.com', userHash, '+44 7700 900111', '5 Puppy Lane, Manchester'
        );
        console.log("Seeded 2 sample users into the database.");
    }

    // Pre-seed some sample adoption orders
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM adoption_list').get().count;
    if (orderCount === 0) {
        const john = db.prepare('SELECT id FROM users WHERE email = ?').get('john@example.com');
        const puppy = db.prepare('SELECT id, name, new_price FROM pets LIMIT 1').get();
        const product = db.prepare('SELECT id, name, new_price FROM products LIMIT 1').get();

        if (john && puppy && product) {
            const sid = 'SUB-SEED01';
            const stmt = db.prepare('INSERT INTO adoption_list (submission_id, customer_name, email, phone, address, item_type, item_id, item_name, proposed_price, payment_method, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

            // Order with 2 items
            stmt.run(sid, 'John Customer', 'john@example.com', '+44 7700 900000', '10 Main St, London', 'pet', puppy.id, puppy.name, puppy.new_price, 'Credit Card', john.id);
            stmt.run(sid, 'John Customer', 'john@example.com', '+44 7700 900000', '10 Main St, London', 'product', product.id, product.name, product.new_price, 'Credit Card', john.id);

            console.log("Seeded 1 sample order (2 items) into the database.");
        }
    }

    console.log("Initialization complete!");
};

seedData().catch(console.error);
