// =============================================
// db.js - Network Database Layer (Async API)
// =============================================

const BASE_URL = 'http://localhost:3000/api';

const DB = {
  async seed() {
    try {
      await fetch(`${BASE_URL}/seed`);
    } catch (e) {
      console.warn("Backend server not running at localhost:3000. Start it via `node server.js` before using the application features.");
    }
  },

  async getAll(table) {
    const res = await fetch(`${BASE_URL}/${table}`);
    return res.json();
  },

  async insert(table, record) {
    const res = await fetch(`${BASE_URL}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return res.json();
  },

  async update(table, idField, id, updates) {
    const res = await fetch(`${BASE_URL}/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  async delete(table, idField, id) {
    const res = await fetch(`${BASE_URL}/${table}/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // ── Specific Queries ─────────────────────────
  async nextId(table, idField, prefix) {
    const records = await this.getAll(table);
    if (!records || !records.length) return `${prefix}001`;
    const nums = records.map(r => parseInt(r[idField].replace(prefix, '')) || 0);
    return `${prefix}${String(Math.max(...nums) + 1).padStart(3, '0')}`;
  },

  async getAllBooksWithAuthors() {
    const res = await fetch(`${BASE_URL}/books`);
    return res.json();
  },

  async getActiveBorrowsForMember(memberId) {
    const res = await fetch(`${BASE_URL}/borrows/member/${memberId}`);
    const borrows = await res.json();
    return borrows.filter(b => b.status !== 'Returned');
  },

  async syncOverdue() {
    await fetch(`${BASE_URL}/sync-overdue`, { method: 'POST' });
  },

  async processReturn(borrowId, bookId, returnDate) {
    await fetch(`${BASE_URL}/borrows/${borrowId}/return`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnDate, bookId })
    });
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
