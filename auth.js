// =============================================
// auth.js - Authentication & Session Management
// =============================================

const Auth = {
    currentUser: null,

    init() {
        const session = localStorage.getItem('olms_session');
        if (session) {
            this.currentUser = JSON.parse(session);
        }
    },

    login(email, password, role) {
        let user = null;
        if (role === 'admin') {
            const admins = DB.getAll('librarians');
            user = admins.find(u => u.email === email && u.password === password);
        } else {
            const members = DB.getAll('members');
            user = members.find(u => u.email === email && u.password === password);
        }

        if (user) {
            user.role = role;
            this.currentUser = user;
            localStorage.setItem('olms_session', JSON.stringify(user));
            return true;
        }
        return false;
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('olms_session');
        window.location.reload();
    },

    getUser() {
        return this.currentUser;
    },

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
};

Auth.init();
