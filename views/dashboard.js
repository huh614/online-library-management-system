class DashboardView {
    constructor(container) {
        this.container = container;
    }

    render() {
        const stats = DB.getStats();
        
        let html = `
            <div class="view-section">
                <h1>Overview</h1>
                
                <div class="stats-grid">
                    <div class="stat-card glass">
                        <div class="stat-icon" style="background: rgba(0, 113, 227, 0.1); color: var(--accent-color);">
                            <i class="ph-fill ph-books"></i>
                        </div>
                        <div class="stat-value">${stats.totalBooks}</div>
                        <div class="stat-label">Total Books Collection</div>
                    </div>
                    
                    <div class="stat-card glass">
                        <div class="stat-icon" style="background: rgba(52, 199, 89, 0.1); color: var(--success-color);">
                            <i class="ph-fill ph-users"></i>
                        </div>
                        <div class="stat-value">${stats.activeMembers}</div>
                        <div class="stat-label">Active Members</div>
                    </div>
                    
                    <div class="stat-card glass">
                        <div class="stat-icon" style="background: rgba(255, 149, 0, 0.1); color: var(--warning-color);">
                            <i class="ph-fill ph-arrows-left-right"></i>
                        </div>
                        <div class="stat-value">${stats.activeBorrows}</div>
                        <div class="stat-label">Active Borrows</div>
                    </div>
                    
                    <div class="stat-card glass">
                        <div class="stat-icon" style="background: rgba(255, 59, 48, 0.1); color: var(--danger-color);">
                            <i class="ph-fill ph-warning-circle"></i>
                        </div>
                        <div class="stat-value">${stats.overdueBooks}</div>
                        <div class="stat-label">Overdue Returns</div>
                    </div>
                </div>

                <div class="flex gap-4" style="margin-top: 20px;">
                    <div class="glass" style="flex: 2; padding: 20px;">
                        <h2>Recent Borrows</h2>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Book</th>
                                        <th>Borrow Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.renderRecentBorrows(stats.recentBorrows)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="glass" style="flex: 1; padding: 20px;">
                        <h2>Quick Actions</h2>
                        <div class="flex-col gap-2" style="margin-top: 15px;">
                            <button class="btn btn-secondary" onclick="document.querySelector('.nav-item[data-view=\\'circulation\\']').click()">Issue Book</button>
                            <button class="btn btn-secondary" onclick="document.querySelector('.nav-item[data-view=\\'books\\']').click()">Add New Book</button>
                            <button class="btn btn-secondary" onclick="document.querySelector('.nav-item[data-view=\\'members\\']').click()">Register Member</button>
                        </div>
                        <div style="margin-top: 30px;">
                            <p style="color: var(--text-muted); font-size: 13px;">Total Fines Collected:</p>
                            <h3 style="color: var(--danger-color); font-size: 24px;">₹${stats.totalFines}</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    renderRecentBorrows(borrows) {
        if (!borrows.length) return '<tr><td colspan="4">No recent activity</td></tr>';
        
        return borrows.map(b => {
             const member = DB.getById('members', 'memberId', b.memberId) || { name: 'Unknown' };
             const book = DB.getById('books', 'bookId', b.bookId) || { title: 'Unknown' };
             
             let statusBadge = '';
             if (b.status === 'Active') statusBadge = '<span class="badge badge-success">Active</span>';
             else if (b.status === 'Overdue') statusBadge = '<span class="badge badge-danger">Overdue</span>';
             else statusBadge = '<span class="badge badge-warning">Returned</span>';

             return `
                <tr>
                    <td>${member.name}</td>
                    <td>${book.title}</td>
                    <td>${b.borrowDate}</td>
                    <td>${statusBadge}</td>
                </tr>
             `;
        }).join('');
    }

    destroy() {}
}
