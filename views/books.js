class BooksView {
    constructor(container) {
        this.container = container;
        this.books = DB.getAllBooksWithAuthors();
    }

    render() {
        let rows = this.books.map(b => {
            const authorNames = b.authors.map(a => a.authorName).join(', ');
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="book-cover" style="background: ${b.coverColor}">${b.title.substring(0,2)}</div>
                            <div>
                                <div style="font-weight: 600;">${b.title}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">${b.bookId}</div>
                            </div>
                        </div>
                    </td>
                    <td>${authorNames}</td>
                    <td>${b.genre}</td>
                    <td>${b.availableCopies} / ${b.totalCopies}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="window.booksView.editBook('${b.bookId}')"><i class="ph ph-pencil-simple"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="view-section">
                <div class="flex justify-between items-center" style="margin-bottom: 20px;">
                    <h1>Books Catalog</h1>
                    <button class="btn btn-primary" id="btn-add-book"><i class="ph ph-plus"></i> Add Book</button>
                </div>
                
                <div class="glass" style="padding: 20px;">
                    <div class="input-group" style="max-width: 300px; margin-bottom: 10px;">
                        <input type="text" class="input-field" placeholder="Search books..." id="search-books">
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Book</th>
                                    <th>Author(s)</th>
                                    <th>Genre</th>
                                    <th>Availability</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="books-table-body">
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-add-book').addEventListener('click', () => this.showBookModal());
        document.getElementById('search-books').addEventListener('input', (e) => this.filter(e.target.value));
        window.booksView = this;
    }

    filter(term) {
        term = term.toLowerCase();
        const trs = document.getElementById('books-table-body').querySelectorAll('tr');
        trs.forEach(tr => {
            const text = tr.innerText.toLowerCase();
            tr.style.display = text.includes(term) ? '' : 'none';
        });
    }

    showBookModal(bookId = null) {
        let book = bookId ? DB.getById('books', 'bookId', bookId) : null;
        let title = book ? 'Edit Book' : 'Add New Book';
        
        const html = `
            <div class="input-group">
                <label>Title</label>
                <input type="text" id="b-title" class="input-field" value="${book ? book.title : ''}" required>
            </div>
            <div class="flex gap-4">
                <div class="input-group" style="flex:1">
                    <label>Publisher</label>
                    <input type="text" id="b-pub" class="input-field" value="${book ? book.publisher : ''}">
                </div>
                <div class="input-group" style="flex:1">
                    <label>Genre</label>
                    <input type="text" id="b-genre" class="input-field" value="${book ? book.genre : ''}">
                </div>
            </div>
            <div class="flex gap-4">
                <div class="input-group" style="flex:1">
                    <label>Total Copies</label>
                    <input type="number" id="b-total" class="input-field" value="${book ? book.totalCopies : 1}">
                </div>
                <div class="input-group" style="flex:1">
                    <label>Price (₹)</label>
                    <input type="number" id="b-price" class="input-field" value="${book ? book.price : ''}">
                </div>
            </div>
            <div class="input-group">
                <label>Cover Color Hex (e.g. #FF0000)</label>
                <input type="text" id="b-color" class="input-field" value="${book ? book.coverColor : '#A8D8EA'}">
            </div>
        `;

        App.showModal(title, html, () => {
            const newBook = {
                title: document.getElementById('b-title').value,
                publisher: document.getElementById('b-pub').value,
                genre: document.getElementById('b-genre').value,
                totalCopies: parseInt(document.getElementById('b-total').value),
                price: parseInt(document.getElementById('b-price').value),
                coverColor: document.getElementById('b-color').value
            };

            if (book) {
                // If copies changed, update available copies correctly
                const diff = newBook.totalCopies - book.totalCopies;
                newBook.availableCopies = book.availableCopies + diff;
                DB.update('books', 'bookId', bookId, newBook);
            } else {
                newBook.bookId = DB.nextId('books', 'bookId', 'BK');
                newBook.availableCopies = newBook.totalCopies;
                newBook.addedDate = new Date().toISOString().split('T')[0];
                DB.insert('books', newBook);
            }
            this.books = DB.getAllBooksWithAuthors();
            this.render();
        });
    }

    editBook(id) {
        this.showBookModal(id);
    }

    destroy() {
        delete window.booksView;
    }
}
