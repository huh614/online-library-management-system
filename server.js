const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./backend/database.js');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from current directory
app.use(express.static(path.join(__dirname, '/')));

// --- API Endpoints ---

// Data Seed Check
app.get('/api/seed', (req, res) => {
    db.seedDatabase(() => {
        res.json({ success: true, message: 'Database functionality active.' });
    });
});

// Users/Auth
app.post('/api/login', (req, res) => {
    const { email, password, role } = req.body;
    let table = role === 'admin' ? 'librarians' : 'members';
    db.all(`SELECT * FROM ${table} WHERE email = ? AND password = ?`, [email, password], (err, rows) => {
        if (err || !rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        let user = rows[0];
        user.role = role;
        res.json(user);
    });
});

app.get('/api/members', (req, res) => {
    db.all(`SELECT * FROM members`, [], (err, rows) => {
        res.json(rows || []);
    });
});

app.post('/api/members', (req, res) => {
    const { memberId, name, age, membershipType, phone, email, password, joinDate, status } = req.body;
    db.run(`INSERT INTO members (memberId, name, age, membershipType, phone, email, password, joinDate, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [memberId, name, age, membershipType, phone, email, password, joinDate, status], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.put('/api/members/:id', (req, res) => {
    const { name, age, membershipType, phone, email, status } = req.body;
    db.run(`UPDATE members SET name=?, age=?, membershipType=?, phone=?, email=?, status=? WHERE memberId=?`,
        [name, age, membershipType, phone, email, status, req.params.id], function(err) {
            res.json({ success: !err });
        });
});

// Books
app.get('/api/books', (req, res) => {
    db.all(`
        SELECT b.*, 
               '[' || IFNULL(GROUP_CONCAT(json_object('authorId', a.authorId, 'authorName', a.authorName)), '') || ']' as authorsRaw 
        FROM books b 
        LEFT JOIN book_authors ba ON b.bookId = ba.bookId
        LEFT JOIN authors a ON ba.authorId = a.authorId
        GROUP BY b.bookId
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const books = rows.map(r => {
             try {
                r.authors = r.authorsRaw && r.authorsRaw !== '[]' ? JSON.parse(r.authorsRaw) : [];
             } catch(e) { r.authors = []; }
             delete r.authorsRaw;
             return r;
        });
        res.json(books);
    });
});

app.post('/api/books', (req, res) => {
    const b = req.body;
    db.run(`INSERT INTO books (bookId, title, price, publisher, genre, totalCopies, availableCopies, coverColor, addedDate, isbn)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.bookId, b.title, b.price, b.publisher, b.genre, b.totalCopies, b.availableCopies, b.coverColor, b.addedDate, b.isbn || ''], 
        function(err) {
            res.json({ success: !err });
        });
});

app.put('/api/books/:id', (req, res) => {
    const b = req.body;
    db.run(`UPDATE books SET title=?, price=?, publisher=?, genre=?, totalCopies=?, availableCopies=?, coverColor=? WHERE bookId=?`,
        [b.title, b.price, b.publisher, b.genre, b.totalCopies, b.availableCopies, b.coverColor, req.params.id], function(err) {
            res.json({ success: !err });
        });
});

// Borrows
app.get('/api/borrows', (req, res) => {
    db.all(`SELECT * FROM borrows`, [], (err, rows) => {
        res.json(rows || []);
    });
});

app.get('/api/borrows/member/:memberId', (req, res) => {
    db.all(`SELECT * FROM borrows WHERE memberId = ?`, [req.params.memberId], (err, rows) => {
        res.json(rows || []);
    });
});

app.post('/api/borrows', (req, res) => {
    const b = req.body;
    db.run(`INSERT INTO borrows (borrowId, memberId, bookId, borrowDate, dueDate, returnDate, status, fine)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.borrowId, b.memberId, b.bookId, b.borrowDate, b.dueDate, b.returnDate, b.status, b.fine],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`UPDATE books SET availableCopies = availableCopies - 1 WHERE bookId = ?`, [b.bookId], () => {
                res.json({ success: true });
            });
        });
});

app.put('/api/borrows/:id/return', (req, res) => {
    const { returnDate, bookId } = req.body;
    db.run(`UPDATE borrows SET status = 'Returned', returnDate = ? WHERE borrowId = ?`, [returnDate, req.params.id], function(err) {
        db.run(`UPDATE books SET availableCopies = availableCopies + 1 WHERE bookId = ?`, [bookId], () => {
             res.json({ success: true });
        });
    });
});

app.post('/api/sync-overdue', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    db.all(`SELECT * FROM borrows WHERE status = 'Active' AND dueDate < ?`, [today], (err, rows) => {
        if (!rows || rows.length === 0) return res.json({ success: true });
        
        let count = 0;
        rows.forEach(b => {
             const days = Math.floor((new Date(today) - new Date(b.dueDate)) / 86400000);
             const fine = days * 5;
             db.run(`UPDATE borrows SET status = 'Overdue', fine = ? WHERE borrowId = ?`, [fine, b.borrowId], () => {
                 count++;
                 if (count === rows.length) res.json({ success: true });
             });
        });
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
