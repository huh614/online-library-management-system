// =============================================
// db.js - LocalStorage Database Layer
// Simulates a relational DBMS for OLMS
// =============================================

const DB = {
  // ── Seed Demo Data ─────────────────────────
  seed() {
    if (localStorage.getItem('db_seeded')) return;

    this.save('librarians', [
      {
        librarianId: 'LIB001', firstName: 'Priya', lastName: 'Sharma',
        phone: '9876543210', email: 'admin@library.com',
        password: 'admin123', role: 'admin', joinDate: '2023-01-15'
      }
    ]);

    this.save('members', [
      {
        memberId: 'MEM001', name: 'Rahul Verma', age: 22,
        membershipType: 'Student', phone: '9123456789',
        email: 'member@library.com', password: 'member123',
        joinDate: '2024-06-01', status: 'Active'
      },
      {
        memberId: 'MEM002', name: 'Anjali Patel', age: 28,
        membershipType: 'Premium', phone: '9234567890',
        email: 'anjali@example.com', password: 'anjali123',
        joinDate: '2024-03-15', status: 'Active'
      },
      {
        memberId: 'MEM003', name: 'Vikram Singh', age: 35,
        membershipType: 'Regular', phone: '9345678901',
        email: 'vikram@example.com', password: 'vikram123',
        joinDate: '2023-11-20', status: 'Active'
      }
    ]);

    this.save('authors', [
      { authorId: 'AUT001', authorName: 'Chetan Bhagat', dateOfBirth: '1974-04-22', nationality: 'Indian' },
      { authorId: 'AUT002', authorName: 'Arundhati Roy', dateOfBirth: '1961-11-24', nationality: 'Indian' },
      { authorId: 'AUT003', authorName: 'Ruskin Bond', dateOfBirth: '1934-05-19', nationality: 'Indian' },
      { authorId: 'AUT004', authorName: 'R.K. Narayan', dateOfBirth: '1906-10-10', nationality: 'Indian' },
      { authorId: 'AUT005', authorName: 'Amish Tripathi', dateOfBirth: '1974-10-18', nationality: 'Indian' },
      { authorId: 'AUT006', authorName: 'Vikram Seth', dateOfBirth: '1952-06-20', nationality: 'Indian' }
    ]);

    this.save('books', [
      {
        bookId: 'BK001', title: '5 Point Someone', price: 199, publisher: 'Rupa Publications',
        genre: 'Fiction', totalCopies: 5, availableCopies: 3,
        coverColor: '#FF6B6B', addedDate: '2023-05-10', isbn: '978-8129135551'
      },
      {
        bookId: 'BK002', title: 'The God of Small Things', price: 350, publisher: 'IndiaInk',
        genre: 'Literary Fiction', totalCopies: 4, availableCopies: 2,
        coverColor: '#4ECDC4', addedDate: '2023-06-20', isbn: '978-0679457312'
      },
      {
        bookId: 'BK003', title: 'The Blue Umbrella', price: 150, publisher: 'Rupa Publications',
        genre: 'Children', totalCopies: 6, availableCopies: 6,
        coverColor: '#45B7D1', addedDate: '2023-07-05', isbn: '978-8129116703'
      },
      {
        bookId: 'BK004', title: 'Malgudi Days', price: 280, publisher: 'Penguin Books',
        genre: 'Short Stories', totalCopies: 3, availableCopies: 1,
        coverColor: '#96CEB4', addedDate: '2023-08-15', isbn: '978-0143031567'
      },
      {
        bookId: 'BK005', title: 'The Immortals of Meluha', price: 395, publisher: 'Westland',
        genre: 'Mythology', totalCopies: 7, availableCopies: 4,
        coverColor: '#FFEAA7', addedDate: '2023-09-01', isbn: '978-8184953930'
      },
      {
        bookId: 'BK006', title: 'A Suitable Boy', price: 650, publisher: 'HarperCollins',
        genre: 'Literary Fiction', totalCopies: 2, availableCopies: 0,
        coverColor: '#DDA0DD', addedDate: '2023-10-10', isbn: '978-0062390936'
      },
      {
        bookId: 'BK007', title: 'Half Girlfriend', price: 215, publisher: 'Rupa Publications',
        genre: 'Romance', totalCopies: 5, availableCopies: 5,
        coverColor: '#F7DC6F', addedDate: '2024-01-08', isbn: '978-8129135576'
      },
      {
        bookId: 'BK008', title: 'Revolution 2020', price: 175, publisher: 'Rupa Publications',
        genre: 'Fiction', totalCopies: 4, availableCopies: 2,
        coverColor: '#A8D8EA', addedDate: '2024-02-20', isbn: '978-8129117571'
      }
    ]);

    this.save('book_authors', [
      { bookId: 'BK001', authorId: 'AUT001' },
      { bookId: 'BK002', authorId: 'AUT002' },
      { bookId: 'BK003', authorId: 'AUT003' },
      { bookId: 'BK004', authorId: 'AUT004' },
      { bookId: 'BK005', authorId: 'AUT005' },
      { bookId: 'BK006', authorId: 'AUT006' },
      { bookId: 'BK007', authorId: 'AUT001' },
      { bookId: 'BK008', authorId: 'AUT001' }
    ]);

    // Sample borrow records
    const today = new Date();
    const past = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() - d); return dt.toISOString().split('T')[0]; };
    const future = (d) => { const dt = new Date(today); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0]; };

    this.save('borrows', [
      {
        borrowId: 'BOR001', memberId: 'MEM001', bookId: 'BK001',
        borrowDate: past(20), dueDate: past(6), returnDate: past(3),
        status: 'Returned', fine: 0
      },
      {
        borrowId: 'BOR002', memberId: 'MEM001', bookId: 'BK004',
        borrowDate: past(10), dueDate: future(4), returnDate: null,
        status: 'Active', fine: 0
      },
      {
        borrowId: 'BOR003', memberId: 'MEM002', bookId: 'BK002',
        borrowDate: past(20), dueDate: past(6), returnDate: null,
        status: 'Overdue', fine: 30
      },
      {
        borrowId: 'BOR004', memberId: 'MEM003', bookId: 'BK006',
        borrowDate: past(5), dueDate: future(9), returnDate: null,
        status: 'Active', fine: 0
      }
    ]);

    localStorage.setItem('db_seeded', 'true');
  },

  // ── CRUD Helpers ───────────────────────────
  getAll(table) {
    return JSON.parse(localStorage.getItem(table) || '[]');
  },

  getById(table, idField, id) {
    return this.getAll(table).find(r => r[idField] === id) || null;
  },

  save(table, data) {
    localStorage.setItem(table, JSON.stringify(data));
  },

  insert(table, record) {
    const data = this.getAll(table);
    data.push(record);
    this.save(table, data);
    return record;
  },

  update(table, idField, id, updates) {
    const data = this.getAll(table).map(r =>
      r[idField] === id ? { ...r, ...updates } : r
    );
    this.save(table, data);
  },

  delete(table, idField, id) {
    const data = this.getAll(table).filter(r => r[idField] !== id);
    this.save(table, data);
  },

  // ── ID Generators ──────────────────────────
  nextId(table, idField, prefix) {
    const records = this.getAll(table);
    if (!records.length) return `${prefix}001`;
    const nums = records.map(r => parseInt(r[idField].replace(prefix, '')) || 0);
    return `${prefix}${String(Math.max(...nums) + 1).padStart(3, '0')}`;
  },

  // ── Query Helpers ──────────────────────────
  getBookWithAuthor(bookId) {
    const book = this.getById('books', 'bookId', bookId);
    if (!book) return null;
    const ba = this.getAll('book_authors').filter(x => x.bookId === bookId);
    const authors = ba.map(x => this.getById('authors', 'authorId', x.authorId)).filter(Boolean);
    return { ...book, authors };
  },

  getAllBooksWithAuthors() {
    return this.getAll('books').map(b => {
      const ba = this.getAll('book_authors').filter(x => x.bookId === b.bookId);
      const authors = ba.map(x => this.getById('authors', 'authorId', x.authorId)).filter(Boolean);
      return { ...b, authors };
    });
  },

  getActiveBorrowsForMember(memberId) {
    return this.getAll('borrows').filter(b => b.memberId === memberId && b.status !== 'Returned');
  },

  // Update overdue statuses
  syncOverdue() {
    const today = new Date().toISOString().split('T')[0];
    const borrows = this.getAll('borrows');
    let changed = false;
    borrows.forEach(b => {
      if (b.status === 'Active' && b.dueDate < today) {
        b.status = 'Overdue';
        const days = Math.floor((new Date(today) - new Date(b.dueDate)) / 86400000);
        b.fine = days * 5;
        changed = true;
      }
    });
    if (changed) this.save('borrows', borrows);
  },

  // Stats for dashboard
  getStats() {
    this.syncOverdue();
    const books = this.getAll('books');
    const members = this.getAll('members');
    const borrows = this.getAll('borrows');
    const active = borrows.filter(b => b.status === 'Active' || b.status === 'Overdue');
    const overdue = borrows.filter(b => b.status === 'Overdue');
    const totalFines = borrows.reduce((s, b) => s + (b.fine || 0), 0);

    return {
      totalBooks: books.reduce((s, b) => s + b.totalCopies, 0),
      uniqueTitles: books.length,
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'Active').length,
      activeBorrows: active.length,
      overdueBooks: overdue.length,
      availableBooks: books.reduce((s, b) => s + b.availableCopies, 0),
      totalFines,
      recentBorrows: borrows.slice(-5).reverse()
    };
  }
};
