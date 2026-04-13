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

    // Wishlists
    db.run(`CREATE TABLE IF NOT EXISTS wishlists (
        memberId TEXT,
        bookId TEXT,
        PRIMARY KEY (memberId, bookId)
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
            db.run(`INSERT INTO members (memberId, name, age, membershipType, phone, email, password, joinDate, status) 
                    VALUES ('MEM003', 'Rohan Kapoor', 20, 'Student', '9345678901', 'rohan@example.com', 'rohan123', '2024-06-10', 'Active')`);

            // Authors
            const authors = [
                ['AUT001', 'Chetan Bhagat', '1974-04-22', 'Indian'],
                ['AUT002', 'James Clear', '1986-01-22', 'American'],
                ['AUT003', 'George Orwell', '1903-06-25', 'British'],
                ['AUT004', 'Paulo Coelho', '1947-08-24', 'Brazilian'],
                ['AUT005', 'Yuval Noah Harari', '1976-02-24', 'Israeli'],
                ['AUT006', 'J.K. Rowling', '1965-07-31', 'British']
            ];
            authors.forEach(a => db.run(`INSERT INTO authors (authorId, authorName, dateOfBirth, nationality) VALUES (?, ?, ?, ?)`, a));
            
            // Books
            const books = [
                ['BK001', '5 Point Someone', 199, 'Rupa Publications', 'Fiction', 5, 3, '#FF6B6B', '2023-05-10', '978-8129135551'],
                ['BK002', 'Atomic Habits', 399, 'Penguin', 'Self-Help', 12, 12, '#FFB347', '2023-08-12', '978-1847941831'],
                ['BK003', '1984', 299, 'Secker & Warburg', 'Dystopian', 8, 8, '#ff4d4d', '2023-09-01', '978-0451524935'],
                ['BK004', 'The Alchemist', 350, 'HarperTorch', 'Fiction', 10, 10, '#f9ca24', '2023-11-15', '978-0062315007'],
                ['BK005', 'Sapiens', 450, 'Harper', 'History', 6, 6, '#48dbfb', '2024-01-05', '978-0062316097'],
                ['BK006', 'Harry Potter', 500, 'Bloomsbury', 'Fantasy', 15, 15, '#c56cf0', '2024-02-14', '978-0747532699']
            ];
            books.forEach(b => db.run(`INSERT INTO books (bookId, title, price, publisher, genre, totalCopies, availableCopies, coverColor, addedDate, isbn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, b));
            
            // Book-Author Map
            const bookAuthors = [
                ['BK001', 'AUT001'], ['BK002', 'AUT002'], ['BK003', 'AUT003'],
                ['BK004', 'AUT004'], ['BK005', 'AUT005'], ['BK006', 'AUT006']
            ];
            bookAuthors.forEach(ba => db.run(`INSERT INTO book_authors (bookId, authorId) VALUES (?, ?)`, ba));

            setTimeout(() => callback(), 500);
        } else {
            callback();
        }
    });
}

db.seedDatabase = seedDatabase;
module.exports = db;
