class CirculationView {
    constructor(container) {
        this.container = container;
    }

    async init() {
        await DB.syncOverdue();
        this.borrows = await DB.getAll('borrows');
        this.render();
    }

    render() {
        let memberNames = {};
        let bookTitles = {};
        
        let rows = this.borrows.slice().reverse().map(b => {
             const returnAction = b.status !== 'Returned' 
                ? `<button class="btn btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="window.circView.returnBook('${b.borrowId}')">Process Return</button>`
                : `<span style="color:var(--text-muted);font-size:12px;">Returned on ${b.returnDate}</span>`;

             return `
                <tr>
                    <td>
                        <div style="font-weight:600" class="book-title-cell" data-id="${b.bookId}">Loading...</div>
                        <div style="font-size:12px; color:var(--text-muted)">${b.bookId}</div>
                    </td>
                    <td>
                        <div class="member-name-cell" data-id="${b.memberId}">Loading...</div>
                        <div style="font-size:12px; color:var(--text-muted)">${b.memberId}</div>
                    </td>
                    <td>${b.borrowDate}</td>
                    <td>${b.dueDate}</td>
                    <td>${statusBadge}</td>
                    <td>${returnAction}</td>
                </tr>
             `;
        }).join('');

        this.container.innerHTML = `
            <div class="view-section">
                <div class="flex justify-between items-center" style="margin-bottom: 20px;">
                    <h1>Circulation Desk</h1>
                    <button class="btn btn-primary" id="btn-issue"><i class="ph ph-hand-pointing"></i> Issue Book</button>
                </div>
                
                <div class="glass" style="padding: 20px;">
                    <h2>Borrow History</h2>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Book</th>
                                    <th>Member</th>
                                    <th>Borrow Date</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-issue').addEventListener('click', () => this.showIssueModal());
        window.circView = this;
        this.fetchDetails();
    }

    async fetchDetails() {
        const books = await DB.getAll('books');
        const members = await DB.getAll('members');
        document.querySelectorAll('.book-title-cell').forEach(el => {
            const b = books.find(x => x.bookId === el.dataset.id);
            el.textContent = b ? b.title : 'Unknown';
        });
        document.querySelectorAll('.member-name-cell').forEach(el => {
            const m = members.find(x => x.memberId === el.dataset.id);
            el.textContent = m ? m.name : 'Unknown';
        });
    }

    async showIssueModal() {
        const _books = await DB.getAll('books');
        const books = _books.filter(b => b.availableCopies > 0);
        const _members = await DB.getAll('members');
        const members = _members.filter(m => m.status === 'Active');

        const bookOpts = books.map(b => `<option value="${b.bookId}">${b.title} (${b.availableCopies} available)</option>`).join('');
        const memberOpts = members.map(m => `<option value="${m.memberId}">${m.name} (${m.memberId})</option>`).join('');

        const html = `
            <div class="input-group">
                <label>Select Member</label>
                <select id="i-member" class="input-field">
                    ${memberOpts}
                </select>
            </div>
            <div class="input-group">
                <label>Select Book</label>
                <select id="i-book" class="input-field">
                    ${bookOpts}
                </select>
            </div>
            <div class="input-group">
                <label>Loan Period (Days)</label>
                <input type="number" id="i-days" class="input-field" value="14">
            </div>
        `;

        App.showModal('Issue Book', html, async () => {
             const memberId = document.getElementById('i-member').value;
             const bookId = document.getElementById('i-book').value;
             const days = parseInt(document.getElementById('i-days').value) || 14;

             if (!memberId || !bookId) {
                 alert("Select both member and book.");
                 return false;
             }

             const today = new Date();
             const borrowDate = today.toISOString().split('T')[0];
             const due = new Date();
             due.setDate(today.getDate() + days);
             const dueDate = due.toISOString().split('T')[0];

             await DB.insert('borrows', {
                 borrowId: await DB.nextId('borrows', 'borrowId', 'BOR'),
                 memberId, bookId, borrowDate, dueDate, returnDate: null,
                 status: 'Active', fine: 0
             });

             this.borrows = await DB.getAll('borrows');
             this.render();
        }, 'Issue Book');
    }

    async returnBook(borrowId) {
        const _all = await DB.getAll('borrows');
        const borrow = _all.find(b => b.borrowId === borrowId);
        if (!borrow) return;

        let fineHTML = '';
        if (borrow.status === 'Overdue') {
            fineHTML = `
                <div style="padding: 10px; background: rgba(255, 59, 48, 0.1); color: var(--danger-color); border-radius: 8px; margin-bottom: 15px;">
                    <strong>Fine Due: ₹${borrow.fine}</strong><br>
                    <label style="display:flex; align-items:center; gap:8px; margin-top:5px; color:var(--text);">
                        <input type="checkbox" id="fine-paid" checked> Collected fine amount
                    </label>
                </div>
            `;
        }

        const html = `
            <p>Confirm return of this book?</p>
            ${fineHTML}
        `;

        App.showModal('Process Return', html, async (modal) => {
            if (borrow.status === 'Overdue') {
               const paid = modal.querySelector('#fine-paid').checked;
               if (!paid) { alert("Fine must be collected to process return."); return false; }
            }

            const today = new Date().toISOString().split('T')[0];
            await DB.processReturn(borrowId, borrow.bookId, today);

            this.borrows = await DB.getAll('borrows');
            this.render();
        }, 'Confirm Return');
    }

    destroy() {
        delete window.circView;
    }
}
