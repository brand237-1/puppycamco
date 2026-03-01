const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = fs.existsSync('/data') ? '/data/database.sqlite' : path.join(__dirname, 'backend', 'database.sqlite');
const db = new Database(dbPath);

const pets = [
    {
        name: 'Luna',
        breed: 'Golden Retriever',
        age: '8 Weeks',
        gender: 'Female',
        color: 'Cream',
        travel_ready: 1,
        old_price: 1800,
        new_price: 1500,
        description: 'Luna is a sweet and playful Golden Retriever puppy. She is vet-checked, vaccinated, and ready for her forever home.'
    },
    {
        name: 'Max',
        breed: 'French Bulldog',
        age: '10 Weeks',
        gender: 'Male',
        color: 'Fawn',
        travel_ready: 1,
        old_price: 2500,
        new_price: 2200,
        description: 'Max is a charming Frenchie with a big personality. He is great with kids and other pets.'
    },
    {
        name: 'Bella',
        breed: 'Poodle',
        age: '9 Weeks',
        gender: 'Female',
        color: 'White',
        travel_ready: 1,
        old_price: 2100,
        new_price: 1900,
        description: 'Bella is an intelligent and elegant Poodle puppy. She is hypoallergenic and has a wonderful temperament.'
    }
];

const insert = db.prepare(`
    INSERT INTO pets (name, breed, age, gender, color, travel_ready, old_price, new_price, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

pets.forEach(pet => {
    insert.run(pet.name, pet.breed, pet.age, pet.gender, pet.color, pet.travel_ready, pet.old_price, pet.new_price, pet.description);
});

console.log('Successfully inserted 3 sample pets.');
db.close();
