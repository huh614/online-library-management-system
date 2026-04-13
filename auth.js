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

    async login(email, password, role) {
        let user = null;
        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            if (res.ok) {
                user = await res.json();
            }
        } catch (e) {
            console.warn("Backend server not reachable. Authenticating via LocalStorage.");
            // Offline/LocalStorage Fallback
            const members = await DB.getAll(role === 'admin' ? 'librarians' : 'members');
            user = members.find(u => u.email === email && u.password === password);
            if (user) user.role = role;
        }

        if (user) {
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
