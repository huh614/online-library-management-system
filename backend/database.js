const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'library.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Librarians (Admins)
    db.run(`CREATE TABLE IF NOT EXISTS librarians (
        librarianId TEXT PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        email TEXT,
        password TEXT,
        role TEXT,
        joinDate TEXT
    )`);

    // Members
    db.run(`CREATE TABLE IF NOT EXISTS members (
        memberId TEXT PRIMARY KEY,
        name TEXT,
        age INTEGER,
        membershipType TEXT,
        phone TEXT,
        email TEXT,
        password TEXT,
        joinDate TEXT,
        status TEXT
    )`);

    // Books
    db.run(`CREATE TABLE IF NOT EXISTS books (
        bookId TEXT PRIMARY KEY,
        title TEXT,
        price INTEGER,
        publisher TEXT,
        genre TEXT,
        totalCopies INTEGER,
        availableCopies INTEGER,
        coverColor TEXT,
        addedDate TEXT,
        isbn TEXT
    )`);

    // Authors
    db.run(`CREATE TABLE IF NOT EXISTS authors (
        authorId TEXT PRIMARY KEY,
        authorName TEXT,
        dateOfBirth TEXT,
        nationality TEXT
    )`);

    // Book <-> Authors mapping
    db.run(`CREATE TABLE IF NOT EXISTS book_authors (
        bookId TEXT,
        authorId TEXT,
        PRIMARY KEY (bookId, authorId)
    )`);

    // Borrows
    db.run(`CREATE TABLE IF NOT EXISTS borrows (
        borrowId TEXT PRIMARY KEY,
        memberId TEXT,
        bookId TEXT,
        borrowDate TEXT,
        dueDate TEXT,
        returnDate TEXT,
        status TEXT,
        fine INTEGER
    )`);
});

function seedDatabase(callback) {
    db.get("SELECT COUNT(*) as count FROM librarians", (err, row) => {
        if (row && row.count === 0) {
            // Insert Data
            console.log("Seeding initial database...");
            db.run(`INSERT INTO librarians (librarianId, firstName, lastName, phone, email, password, role, joinDate) 
                    VALUES ('LIB001', 'Priya', 'Sharma', '9876543210', 'admin@library.com', 'admin123', 'admin', '2023-01-15')`);
            
            db.run(`INSERT INTO members (memberId, name, age, membershipType, phone, email, password, joinDate, status) 
                    VALUES ('MEM001', 'Rahul Verma', 22, 'Student', '9123456789', 'member@library.com', 'member123', '2024-06-01', 'Active')`);
            
            db.run(`INSERT INTO members (memberId, name, age, membershipType, phone, email, password, joinDate, status) 
                    VALUES ('MEM002', 'Anjali Patel', 28, 'Premium', '9234567890', 'anjali@example.com', 'anjali123', '2024-03-15', 'Active')`);

            db.run(`INSERT INTO authors (authorId, authorName, dateOfBirth, nationality) VALUES ('AUT001', 'Chetan Bhagat', '1974-04-22', 'Indian')`);
            
            db.run(`INSERT INTO books (bookId, title, price, publisher, genre, totalCopies, availableCopies, coverColor, addedDate, isbn) 
                    VALUES ('BK001', '5 Point Someone', 199, 'Rupa Publications', 'Fiction', 5, 3, '#FF6B6B', '2023-05-10', '978-8129135551')`);
            
            db.run(`INSERT INTO book_authors (bookId, authorId) VALUES ('BK001', 'AUT001')`);

            setTimeout(() => callback(), 500);
        } else {
            callback();
        }
    });
}

db.seedDatabase = seedDatabase;
module.exports = db;
