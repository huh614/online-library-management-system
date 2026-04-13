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
        try {
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            if (!res.ok) return false;

            const user = await res.json();
            if (user) {
                this.currentUser = user;
                localStorage.setItem('olms_session', JSON.stringify(user));
                return true;
            }
        } catch (e) {
            console.error("Login Error: ", e);
            alert("Backend server connection failed. Ensure `node server.js` is running.");
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
