const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = fs.existsSync('/data') ? '/data/database.sqlite' : path.join(__dirname, 'backend', 'database.sqlite');
console.log('Using DB Path:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('DATABASE FILE NOT FOUND!');
    process.exit(1);
}

const db = new Database(dbPath);

console.log('\n--- SCHEMA ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => {
    console.log(`\nTable: ${table.name}`);
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
    });
});

console.log('\n--- USERS COUNT ---');
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
console.log('Total users:', userCount);

console.log('\n--- LATEST USERS ---');
const latestUsers = db.prepare('SELECT id, full_name, email FROM users ORDER BY id DESC LIMIT 5').all();
console.log(latestUsers);

console.log('\n--- PETS WITH IMAGES ---');
const pets = db.prepare('SELECT id, name, breed, (image_base64 IS NOT NULL) as has_image FROM pets').all();
console.log(pets);

db.close();
