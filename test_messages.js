const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'backend', 'database.sqlite'));

try {
    console.log('Testing Admin Messages Query...');
    const chats = db.prepare(`
        SELECT messages.*, users.full_name as user_name 
        FROM messages 
        LEFT JOIN users ON messages.user_id = users.id 
        ORDER BY created_at ASC
    `).all();
    console.log('Success! Rows found:', chats.length);
    if (chats.length > 0) console.log('Sample row:', JSON.stringify(chats[0], null, 2));
} catch (err) {
    console.error('SQL Error:', err);
}
