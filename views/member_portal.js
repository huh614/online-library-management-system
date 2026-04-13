// Member Dashboard View
class MemberDashboardView {
    constructor(container) {
        this.container = container;
        this.user = Auth.getUser();
        this.borrows = [];
        this.history = [];
        this.books = [];
    }

    async init() {
        await DB.syncOverdue();
        this.borrows = await DB.getActiveBorrowsForMember(this.user.memberId);
        const allBorrows = await DB.getAll('borrows');
        this.history = allBorrows.filter(b => b.memberId === this.user.memberId && b.status === 'Returned');
        this.books = await DB.getAll('books');
        
        const wishlistIds = await DB.getWishlist(this.user.memberId);
        this.wishlist = this.books.filter(b => wishlistIds.includes(b.bookId));
        this.render();
    }

    render() {
        // Active Borrows Grid
        let activeHTML = this.borrows.map(b => {
             const book = this.books.find(bk => bk.bookId === b.bookId) || { title: 'Unknown', coverColor: '#ccc' };
             let statusLine = b.status === 'Overdue' 
                ? `<span style="color:var(--danger-color)">Overdue (₹${b.fine} Fine)</span>`
                : `<span style="color:var(--success-color)">Due: ${b.dueDate}</span>`;

             const returnBtn = b.status !== 'Returned' ? `<button class="btn btn-secondary" style="margin-top: 8px; font-size: 12px; padding: 4px 8px; width: 100%;" onclick="window.memberDashboardView.returnBook('${b.borrowId}')">Return Book</button>` : '';

             return `
                <div class="glass" style="padding: 12px; display: flex; align-items: center; gap: 12px; border-radius: 10px;">
                    <div style="width: 50px; height: 75px; background: ${book.coverColor}; border-radius: 4px;"></div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">${book.title}</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Borrowed: ${b.borrowDate}</div>
                        <div style="font-size: 13px; font-weight: 500; margin-top: 6px;">${statusLine}</div>
                        ${returnBtn}
                    </div>
                </div>
             `;
        }).join('');

        if (!activeHTML) activeHTML = '<p style="color:var(--text-muted)">You have no active borrowed books.</p>';

        // History Table
        let historyRows = this.history.map(b => {
            const book = this.books.find(bk => bk.bookId === b.bookId) || { title: 'Unknown' };
            return `
                <tr>
                    <td>${book.title}</td>
                    <td>${b.borrowDate}</td>
                    <td>${b.returnDate}</td>
                    <td><span class="badge badge-warning">Returned</span></td>
                </tr>
            `;
        }).join('');

        const html = `
            <div class="view-section">
                <div class="flex justify-between items-center">
                    <h1>My Profile</h1>
                    <button class="btn btn-secondary" onclick="window.memberDashboardView.showEditProfileModal()">
                        <i class="ph ph-user-circle"></i> Edit Profile
                    </button>
                </div>
                <div class="flex gap-4" style="margin-top: 20px;">
                    <!-- Left: Current Books & Wishlist -->
                    <div style="flex: 1;">
                        <h2 style="margin-bottom: 15px;">Currently Reading</h2>
                        <div class="flex-col gap-3">
                            ${activeHTML}
                        </div>
                        
                        <h2 style="margin-top: 30px; margin-bottom: 15px;">My Wishlist</h2>
                        <div class="flex-col gap-3">
                            ${this.wishlist.length ? this.wishlist.map(b => `
                                <div class="glass" style="padding: 10px; display: flex; align-items: center; justify-content: space-between; border-radius: 8px;">
                                     <div style="display: flex; align-items: center; gap: 10px;">
                                         <div style="width: 30px; height: 45px; background: ${b.coverColor}; border-radius: 2px;"></div>
                                         <div style="font-weight: 500">${b.title}</div>
                                     </div>
                                     <button class="btn btn-secondary" style="padding: 4px;" onclick="window.memberDashboardView.removeFromWishlist('${b.bookId}')"><i class="ph ph-trash"></i></button>
                                </div>
                            `).join('') : '<p style="color:var(--text-muted)">Your wishlist is empty.</p>'}
                        </div>
                    </div>
                    
                    <!-- Right: Details & History -->
                    <div style="flex: 2; display: flex; flex-direction: column; gap: 20px;">
                        <div class="glass" style="padding: 20px;">
                            <h2>Member Details</h2>
                            <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted)">Member ID</div>
                                    <div style="font-weight: 500;">${this.user.memberId}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted)">Membership Type</div>
                                    <div style="font-weight: 500;">${this.user.membershipType || 'Standard'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted)">Email</div>
                                    <div style="font-weight: 500;">${this.user.email}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-muted)">Status</div>
                                    <div><span class="badge badge-success">Active</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="glass" style="padding: 20px; flex: 1;">
                            <h2>Borrowing History</h2>
                            <div class="table-container" style="margin-top: 15px;">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Book Title</th>
                                            <th>Borrowed On</th>
                                            <th>Returned On</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${historyRows.length ? historyRows : '<tr><td colspan="4">No past borrowing history.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.container.innerHTML = html;
        window.memberDashboardView = this;
    }

    async returnBook(borrowId) {
        const _all = await DB.getAll('borrows');
        const borrow = _all.find(b => b.borrowId === borrowId);
        if (!borrow) return;

        let fineHTML = '';
        if (borrow.status === 'Overdue') {
            fineHTML = `
                <div style="margin-top: 15px; padding: 10px; background: rgba(255,59,48,0.1); border: 1px solid var(--danger-color); border-radius: 8px;">
                    <p style="color: var(--danger-color); font-weight: 600; margin: 0 0 5px 0;">Late Return Fine: ₹${borrow.fine}</p>
                    <label style="font-size: 12px; display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="member-fine-paid"> I agree to pay the fine at the library desk
                    </label>
                </div>
            `;
        }

        const book = this.books.find(bk => bk.bookId === borrow.bookId);

        const html = `
            <p>Are you sure you want to return <strong>${book ? book.title : 'this book'}</strong>?</p>
            ${fineHTML}
        `;

        App.showModal('Process Return', html, async (modal) => {
            if (borrow.status === 'Overdue') {
               const paid = modal.querySelector('#member-fine-paid').checked;
               if (!paid) { alert("You must agree to pay the fine to process return."); return false; }
            }

            const today = new Date().toISOString().split('T')[0];
            await DB.processReturn(borrowId, borrow.bookId, today);

            this.init(); // Refresh data
        }, 'Return Book');
    }

    async removeFromWishlist(bookId) {
        await DB.toggleWishlist(this.user.memberId, bookId, false);
        this.init();
    }

    showEditProfileModal() {
        const html = `
            <div class="input-group">
                <label>Full Name</label>
                <input type="text" id="p-name" class="input-field" value="${this.user.name}" required>
            </div>
            <div class="input-group">
                <label>Phone Number</label>
                <input type="text" id="p-phone" class="input-field" value="${this.user.phone || ''}">
            </div>
            <div class="input-group">
                <label>New Password (leave blank to keep current)</label>
                <input type="password" id="p-pass" class="input-field" placeholder="••••••••">
            </div>
        `;

        App.showModal('Edit Profile', html, async () => {
             const updates = {
                 name: document.getElementById('p-name').value,
                 phone: document.getElementById('p-phone').value
             };
             const pass = document.getElementById('p-pass').value;
             if (pass) updates.password = pass;

             await DB.update('members', 'memberId', this.user.memberId, updates);
             
             // Update session
             this.user = { ...this.user, ...updates };
             localStorage.setItem('olms_session', JSON.stringify(this.user));
             
             this.init();
        }, 'Update Profile');
    }

    destroy() {
        delete window.memberDashboardView;
    }
}

// Member Books Catalog View
class MemberBooksView {
    constructor(container) {
        this.container = container;
        this.books = [];
        this.wishlistIds = [];
    }

    async init() {
        this.books = await DB.getAllBooksWithAuthors();
        this.wishlistIds = await DB.getWishlist(Auth.getUser().memberId);
        this.render();
    }

    render() {
        let grids = this.books.map(b => {
            const authorNames = b.authors && b.authors.length ? b.authors.map(a => a.authorName).join(', ') : 'Unknown Author';
            const badge = b.availableCopies > 0 
                ? `<span class="badge badge-success" style="position: absolute; top: 10px; right: 10px;">Available</span>`
                : `<span class="badge badge-danger" style="position: absolute; top: 10px; right: 10px;">Out of Stock</span>`;

            const inWishlist = this.wishlistIds.includes(b.bookId);
            const heartIcon = inWishlist ? '<i class="ph-fill ph-heart" style="color:var(--danger-color)"></i>' : '<i class="ph ph-heart"></i>';

            const borrowBtn = b.availableCopies > 0 ? `<button class="btn btn-primary" style="margin-top: 10px; width: 100%; justify-content: center;" onclick="window.memberBooksView.borrowBook('${b.bookId}')">Borrow Now</button>` : '';

            return `
                <div class="glass book-card" style="padding: 16px; display: flex; flex-direction: column; border-radius: 12px; transition: transform 0.2s; cursor: pointer; position: relative;">
                    ${badge}
                    <button style="position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px);" onclick="window.memberBooksView.toggleWishlist('${b.bookId}', ${!inWishlist})">
                        ${heartIcon}
                    </button>
                    <div style="height: 180px; background: ${b.coverColor}; border-radius: 8px; margin-bottom: 15px;"></div>
                    <div style="flex: 1;">
                        <h3 style="font-size: 16px; margin-bottom: 4px; line-height: 1.3;">${b.title}</h3>
                        <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px;">By ${authorNames}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                            <span style="font-weight: 600; font-size: 14px;">${b.genre || 'General'}</span>
                            <span style="color: var(--text-muted); font-size: 12px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${b.availableCopies} left</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <div style="flex: 1;">${borrowBtn ? borrowBtn.replace('margin-top: 10px;', '') : ''}</div>
                        <button class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="window.memberBooksView.readExcerpt('${b.bookId}')">E-Book</button>
                    </div>
                </div>
            `;
        }).join('');

        const genres = [...new Set(this.books.map(b => b.genre || 'General'))];
        const genreBtns = ['All', ...genres].map(g => `
            <button class="btn btn-secondary category-chip ${g === 'All' ? 'active-chip' : ''}" data-genre="${g}">${g}</button>
        `).join('');

        this.container.innerHTML = `
            <div class="view-section">
                <div class="flex justify-between items-center" style="margin-bottom: 24px;">
                    <h1>Library Catalog</h1>
                    <div class="flex gap-2">
                         <select id="sort-m-books" class="input-field" style="width: 150px; padding: 6px 10px;">
                            <option value="newest">Newest First</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="az">Title: A-Z</option>
                         </select>
                    </div>
                </div>
                
                <div class="flex gap-4 items-center" style="margin-bottom: 20px;">
                    <div class="input-group" style="max-width: 400px; margin-bottom: 0; flex: 1;">
                        <input type="text" class="input-field" placeholder="Search by title, author..." id="search-m-books">
                    </div>
                </div>

                <div class="category-scroll" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 15px; margin-bottom: 20px;">
                    ${genreBtns}
                </div>

                <style>
                    .m-books-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                        gap: 24px;
                    }
                    .book-card:hover { transform: translateY(-5px); }
                    .category-chip { border-radius: 20px; white-space: nowrap; padding: 6px 16px; font-size: 13px; }
                    .active-chip { background: var(--accent-color) !important; color: white !important; }
                    .category-scroll::-webkit-scrollbar { height: 4px; }
                    .category-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
                </style>

                <div class="m-books-grid" id="m-books-grid">
                    ${grids}
                </div>
            </div>
        `;

        // Event Listeners
        document.getElementById('search-m-books').addEventListener('input', () => this.applyFilters());
        document.getElementById('sort-m-books').addEventListener('change', () => {
             this.sortBooks();
             this.render();
        });
        this.container.querySelectorAll('.category-chip').forEach(btn => {
            btn.onclick = () => {
                this.container.querySelectorAll('.category-chip').forEach(b => b.classList.remove('active-chip'));
                btn.classList.add('active-chip');
                this.applyFilters();
            };
        });
        window.memberBooksView = this;
    }

    sortBooks() {
        const val = document.getElementById('sort-m-books').value;
        if (val === 'price-low') this.books.sort((a,b) => a.price - b.price);
        else if (val === 'price-high') this.books.sort((a,b) => b.price - a.price);
        else if (val === 'az') this.books.sort((a,b) => a.title.localeCompare(b.title));
        else if (val === 'newest') this.books.sort((a,b) => new Date(b.addedDate) - new Date(a.addedDate));
    }

    applyFilters() {
        const term = document.getElementById('search-m-books').value.toLowerCase();
        const genre = this.container.querySelector('.category-chip.active-chip').dataset.genre;
        
        const cards = document.getElementById('m-books-grid').querySelectorAll('.book-card');
        cards.forEach((card, index) => {
            const b = this.books[index];
            const matchesText = b.title.toLowerCase().includes(term) || (b.authors && b.authors.some(a => a.authorName.toLowerCase().includes(term)));
            const matchesGenre = genre === 'All' || b.genre === genre;
            card.style.display = (matchesText && matchesGenre) ? 'flex' : 'none';
        });
    }

    async borrowBook(bookId) {
        const _books = await DB.getAll('books');
        const book = _books.find(b => b.bookId === bookId);
        if (!book || book.availableCopies <= 0) return;

        App.showModal('Confirm Borrow', `<p>Would you like to borrow <strong>${book.title}</strong>?</p>`, async () => {
            const today = new Date();
            const borrowDate = today.toISOString().split('T')[0];
            const due = new Date();
            due.setDate(today.getDate() + 14); // 14 days loan period
            const dueDate = due.toISOString().split('T')[0];

            await DB.insert('borrows', {
                borrowId: await DB.nextId('borrows', 'borrowId', 'BOR'),
                memberId: Auth.getUser().memberId, 
                bookId, 
                borrowDate, 
                dueDate, 
                returnDate: null,
                status: 'Active', 
                fine: 0
            });

            this.books = await DB.getAllBooksWithAuthors();
            this.render();

            setTimeout(() => {
                App.showModal('Success', `<p>You have successfully borrowed <strong>${book.title}</strong>.<br> Due date is <strong>${dueDate}</strong>.</p>`, () => {}, 'Okay');
            }, 350);

            return true;
        }, 'Borrow Book');
    }

    async toggleWishlist(bookId, isAdding) {
        await DB.toggleWishlist(Auth.getUser().memberId, bookId, isAdding);
        this.init();
    }

    readExcerpt(bookId) {
        const book = this.books.find(b => b.bookId === bookId);
        const html = `
            <div style="background: var(--panel-bg); padding: 15px; border-radius: 8px; font-family: serif; line-height: 1.6; border: 1px solid var(--border);">
                <h4 style="margin-bottom: 10px;">Chapter 1: The Beginning</h4>
                <p>The sky above the port was the color of television, tuned to a dead channel. It was the best of times, it was the blurst of times...</p>
                <p style="margin-top: 10px;">This is a premium digital reading preview for <strong>${book.title}</strong>. Full digital access is available for Premium members.</p>
            </div>
        `;
        App.showModal(`Digital Preview: ${book.title}`, html, null, 'Close');
    }

    destroy() {
        delete window.memberBooksView;
    }
}
