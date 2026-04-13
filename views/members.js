class MembersView {
    constructor(container) {
        this.container = container;
        this.members = [];
    }

    async init() {
        this.members = await DB.getAll('members');
        this.render();
    }

    render() {
        let rows = this.members.map(m => `
            <tr>
                <td><strong>${m.memberId}</strong></td>
                <td>
                    <div style="display:flex; align-items:center; gap: 8px;">
                        <div style="width:32px; height:32px; border-radius:50%; background:var(--accent-color); color:white; display:flex; align-items:center; justify-content:center; font-weight:600;">
                            ${m.name.charAt(0)}
                        </div>
                        <div>
                            <div style="font-weight: 500">${m.name}</div>
                            <div style="font-size: 12px; color: var(--text-muted)">${m.email}</div>
                        </div>
                    </div>
                </td>
                <td>${m.membershipType}</td>
                <td>${m.joinDate}</td>
                <td>
                    ${m.status === 'Active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>'}
                </td>
                <td>
                    <button class="btn btn-secondary" style="padding: 4px 8px;" onclick="window.membersView.showMemberModal('${m.memberId}')">
                        <i class="ph ph-pencil"></i> Edit
                    </button>
                </td>
            </tr>
        `).join('');

        this.container.innerHTML = `
            <div class="view-section">
                <div class="flex" style="justify-content: space-between; align-items: center;">
                    <h1>Members Directory</h1>
                    <button class="btn btn-primary" onclick="window.membersView.showMemberModal()"><i class="ph ph-plus"></i> Add Member</button>
                </div>
                
                <div class="glass table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Member Profile</th>
                                <th>Type</th>
                                <th>Join Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.length ? rows : '<tr><td colspan="6" style="text-align:center;">No members found.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        window.membersView = this;
    }

    async showMemberModal(memberId = null) {
        let member = memberId ? this.members.find(m => m.memberId === memberId) : null;
        let title = member ? 'Edit Member' : 'Add New Member';

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
                    <input type="number" id="m-age" class="input-field" value="${member && member.age ? member.age : ''}">
                </div>
                <div class="input-group" style="flex:1">
                    <label>Membership Type</label>
                    <select id="m-type" class="input-field">
                        <option value="Student" ${member && member.membershipType === 'Student' ? 'selected' : ''}>Student</option>
                        <option value="Faculty" ${member && member.membershipType === 'Faculty' ? 'selected' : ''}>Faculty</option>
                        <option value="Premium" ${member && member.membershipType === 'Premium' ? 'selected' : ''}>Premium</option>
                    </select>
                </div>
            </div>
            <div class="input-group">
                <label>Status</label>
                <select id="m-status" class="input-field">
                    <option value="Active" ${member && member.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Inactive" ${member && member.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            ${!member ? `
            <div class="input-group">
                <label>Temporary Password</label>
                <input type="text" id="m-pass" class="input-field" value="member123" required>
            </div>
            ` : ''}
        `;

        App.showModal(title, html, async () => {
            const newMember = {
                name: document.getElementById('m-name').value,
                email: document.getElementById('m-email').value,
                phone: document.getElementById('m-phone').value,
                age: parseInt(document.getElementById('m-age').value) || null,
                membershipType: document.getElementById('m-type').value,
                status: document.getElementById('m-status').value
            };

            if (member) {
                await DB.update('members', 'memberId', memberId, newMember);
            } else {
                newMember.memberId = await DB.nextId('members', 'memberId', 'MEM');
                newMember.joinDate = new Date().toISOString().split('T')[0];
                newMember.password = document.getElementById('m-pass').value;
                await DB.insert('members', newMember);
            }
            this.members = await DB.getAll('members');
            this.render();
        });
    }

    destroy() {
        delete window.membersView;
    }
}
