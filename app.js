// =============================================
// app.js - Main Application Logic & UI Manager
// =============================================

const App = {
    currentView: null,

    async init() {
        // Init Auth first to see if logged in
        Auth.init();
        
        await DB.seed(); // Wait for server to seed if it hasn't

        this.cacheDOM();
        this.bindEvents();
        this.initTheme();

        if (Auth.getUser()) {
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    cacheDOM() {
        this.loginScreen = document.getElementById('login-screen');
        this.appContainer = document.getElementById('app-container');
        this.viewContainer = document.getElementById('view-container');
        this.modalContainer = document.getElementById('modal-container');
        
        this.userNameEl = document.getElementById('current-user-name');
        this.userRoleEl = document.getElementById('current-user-role');
        
        this.navItems = document.querySelectorAll('.nav-item');
    },

    bindEvents() {
        // Login Tabs
        document.querySelectorAll('.role-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Demo Fill
        document.getElementById('fill-demo-btn').addEventListener('click', () => {
            const role = document.querySelector('.role-tab.active').dataset.role;
            if (role === 'admin') {
                document.getElementById('login-email').value = 'admin@library.com';
                document.getElementById('login-password').value = 'admin123';
            } else {
                document.getElementById('login-email').value = 'member@library.com';
                document.getElementById('login-password').value = 'member123';
            }
        });

        // Login/Signup Toggle
        let isSignup = false;
        const toggleSignupBtn = document.getElementById('toggle-signup');
        if (toggleSignupBtn) {
            toggleSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                isSignup = !isSignup;
                const signupFields = document.getElementById('signup-fields');
                const formTitle = document.getElementById('form-title');
                const submitBtn = document.getElementById('submit-btn');
                const roleTabs = document.querySelector('.role-tabs');
                
                if (isSignup) {
                    signupFields.style.display = 'block';
                    formTitle.textContent = 'Member Registration';
                    submitBtn.textContent = 'Sign Up';
                    toggleSignupBtn.textContent = 'Already a Member? Sign In Here';
                    roleTabs.style.display = 'none'; // Only members can sign up
                    document.getElementById('signup-name').required = true;
                    // Auto-select member role
                    document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
                    document.querySelector('.role-tab[data-role="member"]').classList.add('active');
                } else {
                    signupFields.style.display = 'none';
                    formTitle.textContent = 'Library Login';
                    submitBtn.textContent = 'Sign In';
                    toggleSignupBtn.textContent = 'New Member? Sign Up Here';
                    roleTabs.style.display = 'flex';
                    document.getElementById('signup-name').required = false;
                }
            });
        }

        // Login Form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const activeTab = document.querySelector('.role-tab.active');
            let role = activeTab ? activeTab.dataset.role : 'member';

            document.getElementById('login-error').style.display = 'none';
            document.getElementById('signup-success').style.display = 'none';

            if (isSignup) {
                // Register new member
                const name = document.getElementById('signup-name').value;
                const members = await DB.getAll('members');
                if (members.find(m => m.email === email)) {
                    document.getElementById('login-error').textContent = 'Email already exists!';
                    document.getElementById('login-error').style.display = 'block';
                    return;
                }

                const newMember = {
                    memberId: await DB.nextId('members', 'memberId', 'MEM'),
                    name: name,
                    email: email,
                    password: pass,
                    membershipType: 'Student', // Default
                    phone: '',
                    age: null,
                    joinDate: new Date().toISOString().split('T')[0],
                    status: 'Active'
                };
                await DB.insert('members', newMember);
                
                document.getElementById('signup-success').style.display = 'block';
                // Switch back to login
                setTimeout(() => {
                    toggleSignupBtn.click();
                    document.getElementById('login-password').value = pass;
                    document.getElementById('signup-success').style.display = 'block';
                }, 1500);
            } else {
                const success = await Auth.login(email, pass, role);
                if (success) {
                    this.showApp();
                } else {
                    document.getElementById('login-error').textContent = 'Invalid credentials';
                    document.getElementById('login-error').style.display = 'block';
                }
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => Auth.logout());

        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.navItems.forEach(ni => ni.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.loadView(target.dataset.view);
            });
        });

        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark-theme');
            const isDark = document.documentElement.classList.contains('dark-theme');
            document.getElementById('theme-toggle').innerHTML = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
        });
    },

    initTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class="ph ph-sun"></i>';
        }
    },

    showLogin() {
        this.loginScreen.classList.remove('hidden');
        this.appContainer.classList.add('hidden');
    },

    showApp() {
        this.loginScreen.classList.add('hidden');
        this.appContainer.classList.remove('hidden');
        
        const user = Auth.getUser();
        this.userNameEl.textContent = user.firstName ? `${user.firstName} ${user.lastName}` : user.name;
        this.userRoleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

        // Adjust Sidebar visibility
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = Auth.isAdmin() ? 'flex' : 'none');
        document.querySelectorAll('.member-only').forEach(el => el.style.display = Auth.isAdmin() ? 'none' : 'flex');

        // Load Default View
        const defaultView = Auth.isAdmin() ? 'dashboard' : 'member-dashboard';
        const defaultNav = document.querySelector(`.nav-item[data-view="${defaultView}"]`);
        if (defaultNav) {
            this.navItems.forEach(ni => ni.classList.remove('active'));
            defaultNav.classList.add('active');
            this.loadView(defaultView);
        }
    },

    async loadView(viewName) {
        this.viewContainer.innerHTML = '';
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy();
        }

        let ViewClass;
        switch (viewName) {
            case 'dashboard': ViewClass = DashboardView; break;
            case 'books': ViewClass = BooksView; break;
            case 'members': ViewClass = MembersView; break;
            case 'circulation': ViewClass = CirculationView; break;
            case 'member-dashboard': ViewClass = MemberDashboardView; break;
            case 'member-books': ViewClass = MemberBooksView; break;
        }

        if (ViewClass) {
            this.currentView = new ViewClass(this.viewContainer);
            if (typeof this.currentView.init === 'function') {
                await this.currentView.init();
            } else {
                this.currentView.render();
            }
        }
    },

    showModal(title, contentHTML, onAction = null, actionText = 'Save') {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        
        overlay.innerHTML = `
            <div class="modal-content glass">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close"><i class="ph ph-x"></i></button>
                </div>
                <div class="modal-body">${contentHTML}</div>
                ${onAction ? `
                <div class="modal-footer" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-action">${actionText}</button>
                </div>
                ` : ''}
            </div>
        `;

        this.modalContainer.appendChild(overlay);

        const closeBtn = overlay.querySelector('.modal-close');
        const cancelBtn = overlay.querySelector('.modal-cancel');
        const actionBtn = overlay.querySelector('.modal-action');

        const close = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };

        if (closeBtn) closeBtn.onclick = close;
        if (cancelBtn) cancelBtn.onclick = close;
        
        if (actionBtn && onAction) {
            actionBtn.onclick = () => {
                if (onAction(overlay) !== false) close();
            };
        }
    }
};

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
