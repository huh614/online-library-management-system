class MembersView {
    constructor(container) {
        this.container = container;
        this.members = DB.getAll('members');
    }

    render() {
        let rows = this.members.map(m => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${m.name}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${m.email}</div>
                </td>
                <td>${m.memberId}</td>
                <td>${m.membershipType}</td>
                <td>${m.phone}</td>
                <td>
                    <span class="badge ${m.status === 'Active' ? 'badge-success' : 'badge-danger'}">${m.status}</span>
                </td>
                <td>
                    <button class="btn btn-secondary" onclick="window.membersView.editMember('${m.memberId}')"><i class="ph ph-pencil-simple"></i></button>
                </td>
            </tr>
        `).join('');

        this.container.innerHTML = `
            <div class="view-section">
                <div class="flex justify-between items-center" style="margin-bottom: 20px;">
                    <h1>Members Database</h1>
                    <button class="btn btn-primary" id="btn-add-member"><i class="ph ph-user-plus"></i> Register Member</button>
                </div>
                
                <div class="glass" style="padding: 20px;">
                    <div class="input-group" style="max-width: 300px; margin-bottom: 10px;">
                        <input type="text" class="input-field" placeholder="Search members..." id="search-members">
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name & Email</th>
                                    <th>ID</th>
                                    <th>Type</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="members-table-body">
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-add-member').addEventListener('click', () => this.showMemberModal());
        document.getElementById('search-members').addEventListener('input', (e) => this.filter(e.target.value));
        window.membersView = this;
    }

    filter(term) {
        term = term.toLowerCase();
        const trs = document.getElementById('members-table-body').querySelectorAll('tr');
        trs.forEach(tr => {
            const text = tr.innerText.toLowerCase();
            tr.style.display = text.includes(term) ? '' : 'none';
        });
    }

    showMemberModal(memberId = null) {
        let member = memberId ? DB.getById('members', 'memberId', memberId) : null;
        let title = member ? 'Edit Member' : 'Register Member';
        
        const html = `
            <div class="input-group">
                <label>Full Name</label>
                <input type="text" id="m-name" class="input-field" value="${member ? member.name : ''}" required>
            </div>
            <div class="flex gap-4">
                <div class="input-group" style="flex:1">
                    <label>Email Address</label>
                    <input type="email" id="m-email" class="input-field" value="${member ? member.email : ''}" required>
                </div>
                <div class="input-group" style="flex:1">
                    <label>Phone Number</label>
                    <input type="text" id="m-phone" class="input-field" value="${member ? member.phone : ''}">
                </div>
            </div>
            <div class="flex gap-4">
                <div class="input-group" style="flex:1">
                    <label>Age</label>
                    <input type="number" id="m-age" class="input-field" value="${member ? member.age : ''}">
                </div>
                <div class="input-group" style="flex:1">
                    <label>Membership Type</label>
                    <select id="m-type" class="input-field">
                        <option value="Student" ${member && member.membershipType === 'Student' ? 'selected' : ''}>Student</option>
                        <option value="Regular" ${member && member.membershipType === 'Regular' ? 'selected' : ''}>Regular</option>
                        <option value="Premium" ${member && member.membershipType === 'Premium' ? 'selected' : ''}>Premium</option>
                    </select>
                </div>
            </div>
            ${!member ? `
            <div class="input-group">
                <label>Account Password (Default: member123)</label>
                <input type="text" id="m-pass" class="input-field" value="member123">
            </div>
            ` : `
            <div class="input-group">
                <label>Status</label>
                <select id="m-status" class="input-field">
                    <option value="Active" ${member.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Suspended" ${member.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                </select>
            </div>
            `}
        `;

        App.showModal(title, html, () => {
            const newMember = {
                name: document.getElementById('m-name').value,
                email: document.getElementById('m-email').value,
                phone: document.getElementById('m-phone').value,
                age: parseInt(document.getElementById('m-age').value),
                membershipType: document.getElementById('m-type').value
            };

            if (member) {
                newMember.status = document.getElementById('m-status').value;
                DB.update('members', 'memberId', memberId, newMember);
            } else {
                newMember.memberId = DB.nextId('members', 'memberId', 'MEM');
                newMember.password = document.getElementById('m-pass').value;
                newMember.joinDate = new Date().toISOString().split('T')[0];
                newMember.status = 'Active';
                DB.insert('members', newMember);
            }
            this.members = DB.getAll('members');
            this.render();
        });
    }

    editMember(id) {
        this.showMemberModal(id);
    }

    destroy() {
        delete window.membersView;
    }
}
