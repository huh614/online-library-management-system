// =============================================
// db.js - Smart Hybrid DB (Backend + Local Storage Fallback)
// =============================================

const BASE_URL = 'http://localhost:3000/api';
let useBackend = true; // Flips to false if backend is unreachable

const DB = {
  // Helper for mock data creation
  generateMockData() {
    return {
      members: [
        { memberId: 'MEM001', name: 'Rahul Verma', age: 22, membershipType: 'Student', phone: '9123456789', email: 'member@library.com', password: 'member123', joinDate: '2024-06-01', status: 'Active' },
        { memberId: 'MEM002', name: 'Anjali Patel', age: 28, membershipType: 'Premium', phone: '9234567890', email: 'anjali@example.com', password: 'anjali123', joinDate: '2024-03-15', status: 'Active' }
      ],
      books: [
        { bookId: 'BK001', title: '5 Point Someone', price: 199, publisher: 'Rupa Publications', genre: 'Fiction', totalCopies: 5, availableCopies: 3, coverColor: '#FF6B6B', addedDate: '2023-05-10', authors: [{authorId: 'AUT001', authorName: 'Chetan Bhagat'}] },
        { bookId: 'BK002', title: 'Digital Fortress', price: 450, publisher: 'St. Martin', genre: 'Thriller', totalCopies: 3, availableCopies: 3, coverColor: '#4ECDC4', addedDate: '2023-08-20', authors: [] }
      ],
      borrows: []
    };
  },

  async seed() {
    try {
      if (useBackend) {
          await fetch(`${BASE_URL}/seed`);
          return;
      }
    } catch (e) {
      console.warn("Backend not detected at localhost:3000. Falling back to LocalStorage mode.");
      useBackend = false;
    }

    // Local Storage Fallback Seeding
    if (!useBackend && !localStorage.getItem('db_seeded')) {
        const mock = this.generateMockData();
        localStorage.setItem('books', JSON.stringify(mock.books));
        localStorage.setItem('members', JSON.stringify(mock.members));
        localStorage.setItem('borrows', JSON.stringify(mock.borrows));
        localStorage.setItem('db_seeded', 'true');
    }
  },

  async getAll(table) {
    if (useBackend) {
      try {
        const res = await fetch(`${BASE_URL}/${table}`);
        if(res.ok) return await res.json();
      } catch (e) { useBackend = false; }
    }
    return JSON.parse(localStorage.getItem(table) || '[]');
  },

  async insert(table, record) {
    if (useBackend) {
      try {
        const res = await fetch(`${BASE_URL}/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
        if(res.ok) return await res.json();
      } catch (e) { useBackend = false; }
    }
    const data = await this.getAll(table);
    data.push(record);
    localStorage.setItem(table, JSON.stringify(data));
    return record;
  },

  async update(table, idField, id, updates) {
    if (useBackend) {
      try {
        const res = await fetch(`${BASE_URL}/${table}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if(res.ok) return await res.json();
      } catch (e) { useBackend = false; }
    }
    const data = await this.getAll(table);
    const index = data.findIndex(r => r[idField] === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      localStorage.setItem(table, JSON.stringify(data));
      return data[index];
    }
  },

  async delete(table, idField, id) {
    if (useBackend) {
      try {
        const res = await fetch(`${BASE_URL}/${table}/${id}`, { method: 'DELETE' });
        if(res.ok) return await res.json();
      } catch (e) { useBackend = false; }
    }
    const data = await this.getAll(table);
    const filtered = data.filter(r => r[idField] !== id);
    localStorage.setItem(table, JSON.stringify(filtered));
  },

  // ── Specific Queries ─────────────────────────
  async nextId(table, idField, prefix) {
    const records = await this.getAll(table);
    if (!records || !records.length) return `${prefix}001`;
    const nums = records.map(r => parseInt(r[idField].replace(prefix, '')) || 0);
    return `${prefix}${String(Math.max(...nums) + 1).padStart(3, '0')}`;
  },

  async getAllBooksWithAuthors() {
    if (useBackend) {
       try {
         const res = await fetch(`${BASE_URL}/books`);
         if(res.ok) return await res.json();
       } catch (e) { useBackend = false; }
    }
    return await this.getAll('books'); // The mock data has authors integrated for simplicity
  },

  async getActiveBorrowsForMember(memberId) {
    if (useBackend) {
       try {
         const res = await fetch(`${BASE_URL}/borrows/member/${memberId}`);
         if(res.ok) {
            const borrows = await res.json();
            return borrows.filter(b => b.status !== 'Returned');
         }
       } catch (e) { useBackend = false; }
    }
    const borrows = await this.getAll('borrows');
    return borrows.filter(b => b.memberId === memberId && b.status !== 'Returned');
  },

  async syncOverdue() {
    if (useBackend) {
       try {
         await fetch(`${BASE_URL}/sync-overdue`, { method: 'POST' });
         return;
       } catch (e) { useBackend = false; }
    }
    const today = new Date().toISOString().split('T')[0];
    const borrows = await this.getAll('borrows');
    let changed = false;
    borrows.forEach(b => {
      if (b.status === 'Active' && b.dueDate < today) {
        b.status = 'Overdue';
        const days = Math.floor((new Date(today) - new Date(b.dueDate)) / 86400000);
        b.fine = days * 5;
        changed = true;
      }
    });
    if (changed) localStorage.setItem('borrows', JSON.stringify(borrows));
  },

  async processReturn(borrowId, bookId, returnDate) {
    if (useBackend) {
       try {
         await fetch(`${BASE_URL}/borrows/${borrowId}/return`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ returnDate, bookId })
         });
         return;
       } catch (e) { useBackend = false; }
    }
    await this.update('borrows', 'borrowId', borrowId, { status: 'Returned', returnDate });
    const book = (await this.getAll('books')).find(b => b.bookId === bookId);
    if(book) await this.update('books', 'bookId', bookId, { availableCopies: book.availableCopies + 1 });
  },

  async getStats() {
    await this.syncOverdue();
    const books = await this.getAll('books');
    const members = await this.getAll('members');
    const borrows = await this.getAll('borrows');
    
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
