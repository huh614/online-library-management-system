class DashboardView {
    constructor(container) {
        this.container = container;
        this.stats = null;
        this.members = [];
        this.books = [];
    }

    async init() {
        this.stats = await DB.getStats();
        this.members = await DB.getAll('members');
        this.books = await DB.getAll('books');
        this.render();
    }

    render() {
        if (!this.stats) return;
        const stats = this.stats;
        
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
                        <h2>Recent Activity</h2>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Action</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.renderRecentActivity(stats.recentBorrows)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="glass" style="flex: 1; padding: 20px; display: flex; flex-direction: column;">
                        <h2>System Health</h2>
                        <div class="flex-col gap-4" style="margin-top: 15px; flex: 1;">
                            <div class="health-item">
                                <div class="flex justify-between" style="font-size: 13px; margin-bottom: 5px;">
                                    <span>Database Storage</span>
                                    <span>68%</span>
                                </div>
                                <div style="height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; overflow: hidden;">
                                    <div style="width: 68%; height: 100%; background: var(--accent-color);"></div>
                                </div>
                            </div>
                            <div class="health-item">
                                <div class="flex justify-between" style="font-size: 13px; margin-bottom: 5px;">
                                    <span>Active Sessions</span>
                                    <span>${stats.activeMembers + 2}</span>
                                </div>
                                <div style="height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; overflow: hidden;">
                                    <div style="width: 45%; height: 100%; background: var(--success-color);"></div>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: 20px;">
                            <p style="color: var(--text-muted); font-size: 13px;">Total Fines Collected:</p>
                            <h3 style="color: var(--danger-color); font-size: 24px;">₹${stats.totalFines}</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    renderRecentActivity(borrows) {
        if (!borrows.length) return '<tr><td colspan="4">No recent activity</td></tr>';
        
        return borrows.map(b => {
             const member = this.members.find(m => m.memberId === b.memberId) || { name: 'Unknown' };
             const book = this.books.find(bk => bk.bookId === b.bookId) || { title: 'Unknown' };
             
             let statusBadge = '';
             let actionText = 'Borrowed';
             if (b.status === 'Active') statusBadge = '<span class="badge badge-success">Live</span>';
             else if (b.status === 'Overdue') {
                 statusBadge = '<span class="badge badge-danger">Alert</span>';
                 actionText = 'Overdue';
             }
             else {
                 statusBadge = '<span class="badge badge-warning">Done</span>';
                 actionText = 'Returned';
             }

             return `
                <tr>
                    <td>
                         <div style="font-weight: 500">${member.name}</div>
                         <div style="font-size: 11px; color: var(--text-muted)">${book.title}</div>
                    </td>
                    <td>${actionText}</td>
                    <td>${b.borrowDate}</td>
                    <td>${statusBadge}</td>
                </tr>
             `;
        }).join('');
    }

    destroy() {}
}
