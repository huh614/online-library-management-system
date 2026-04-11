class MemberDashboardView {
    constructor(container) {
        this.container = container;
        this.user = Auth.getUser();
        DB.syncOverdue();
        this.borrows = DB.getActiveBorrowsForMember(this.user.memberId);
        this.history = DB.getAll('borrows').filter(b => b.memberId === this.user.memberId && b.status === 'Returned');
    }

    render() {
        let activeRows = this.borrows.map(b => {
             const book = DB.getById('books', 'bookId', b.bookId) || { title: 'Unknown' };
             let statusBadge = '';
             let fineText = '';
             if (b.status === 'Overdue') {
                 statusBadge = '<span class="badge badge-danger">Overdue</span>';
                 fineText = `<div style="color:var(--danger-color); font-size:12px; margin-top:4px;">Fine: ₹${b.fine}</div>`;
             } else {
                 statusBadge = '<span class="badge badge-success">Active</span>';
             }

             return `
                <div class="glass" style="padding: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="book-cover" style="background: ${book.coverColor || '#CCC'}">${book.title.substring(0,2)}</div>
                        <div>
                            <div style="font-weight: 600;">${book.title}</div>
                            <div style="font-size: 13px; color: var(--text-muted);">Borrowed: ${b.borrowDate}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 4px;">Due Date</div>
                        <div style="font-weight: 600;">${b.dueDate}</div>
                        ${fineText}
                    </div>
                    <div>${statusBadge}</div>
                </div>
             `;
        }).join('');

        if (!activeRows) activeRows = '<div style="color:var(--text-muted); padding: 20px 0;">No active borrows.</div>';

        let historyRows = this.history.map(b => {
             const book = DB.getById('books', 'bookId', b.bookId) || { title: 'Unknown' };
             return `
                <tr>
                    <td>${book.title}</td>
                    <td>${b.borrowDate}</td>
                    <td>${b.returnDate}</td>
                </tr>
             `;
        }).join('');

        this.container.innerHTML = `
            <div class="view-section">
                <h1>My Profile</h1>
                
                <div class="flex gap-4" style="margin-bottom: 30px;">
                    <div class="glass" style="flex:1; padding: 20px; display: flex; align-items: center; gap: 20px;">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--accent-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600;">
                            ${this.user.name.charAt(0)}
                        </div>
                        <div>
                            <h2 style="margin: 0 0 4px 0">${this.user.name}</h2>
                            <div style="color: var(--text-muted); font-size: 14px;">Member ID: ${this.user.memberId} | ${this.user.membershipType} Plan</div>
                        </div>
                    </div>
                    <div class="glass" style="padding: 20px; display:flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 14px; color: var(--text-muted);">Total Borrowed</div>
                        <div style="font-size: 28px; font-weight: 700;">${this.borrows.length + this.history.length}</div>
                    </div>
                </div>

                <div class="flex gap-4">
                    <div style="flex: 2;">
                        <h2>Currently Reading</h2>
                        ${activeRows}
                    </div>
                    
                    <div class="glass" style="flex: 1; padding: 20px; height: fit-content;">
                        <h2>Past History</h2>
                        <div class="table-container" style="margin-top: 10px;">
                            <table style="font-size: 13px;">
                                <thead>
                                    <tr>
                                        <th>Book</th>
                                        <th>Borrowed</th>
                                        <th>Returned</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${historyRows || '<tr><td colspan="3">No history</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    destroy() {}
}

class MemberBooksView {
    constructor(container) {
        this.container = container;
        this.books = DB.getAllBooksWithAuthors();
    }

    render() {
        let grids = this.books.map(b => {
            const authorNames = b.authors.map(a => a.authorName).join(', ');
            const availStr = b.availableCopies > 0 ? `<span style="color: var(--success-color)">Available (${b.availableCopies})</span>` : `<span style="color: var(--danger-color)">Out of stock</span>`;
            return `
                <div class="glass book-card" style="padding: 16px; display: flex; flex-direction: column; border-radius: 12px; transition: transform 0.2s; cursor: pointer;">
                    <div style="height: 140px; background: ${b.coverColor}; border-radius: 8px; margin-bottom: 16px; display:flex; align-items:center; justify-content:center; color:white; font-size:24px; font-weight:700; text-align:center; padding: 10px; box-shadow: inset 0 0 20px rgba(0,0,0,0.1);">${b.title.substring(0,3)}</div>
                    <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${b.title}</div>
                    <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">${authorNames}</div>
                    <div style="font-size: 12px; background: rgba(134,134,139,0.1); padding: 4px 8px; border-radius: 4px; display:inline-block; margin-bottom: 12px; align-self: flex-start;">${b.genre}</div>
                    <div style="margin-top: auto; font-size: 13px; font-weight: 500;">
                        ${availStr}
                    </div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="view-section">
                <h1>Library Catalog</h1>
                
                <div class="input-group" style="max-width: 400px; margin-bottom: 24px;">
                    <input type="text" class="input-field" placeholder="Search by title, author, or genre..." id="search-m-books">
                </div>

                <style>
                    .m-books-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 20px;
                    }
                    .book-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                </style>

                <div class="m-books-grid" id="m-books-grid">
                    ${grids}
                </div>
            </div>
        `;

        document.getElementById('search-m-books').addEventListener('input', (e) => this.filter(e.target.value));
    }

    filter(term) {
        term = term.toLowerCase();
        const cards = document.getElementById('m-books-grid').querySelectorAll('.book-card');
        cards.forEach(card => {
            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(term) ? 'flex' : 'none';
        });
    }

    destroy() {}
}
