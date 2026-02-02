/**
 * Study Mitra - Login System with Data Storage
 * Stores login data from manual login, Google, and Facebook
 */

// ================================
// USER DATA STORAGE CLASS
// ================================
class UserDataStore {
    constructor() {
        this.STORAGE_KEY = 'studymitra_users';
        this.SESSION_KEY = 'studymitra_session';
        this.initializeStore();
    }

    // Initialize storage if not exists
    initializeStore() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    }

    // Get all users
    getAllUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch (e) {
            console.error('Error reading users:', e);
            return [];
        }
    }

    // Save user data
    saveUser(userData) {
        const users = this.getAllUsers();

        // Check if user already exists (by email)
        const existingIndex = users.findIndex(u => u.email === userData.email);

        if (existingIndex >= 0) {
            // Update existing user
            users[existingIndex] = {
                ...users[existingIndex],
                ...userData,
                lastLogin: new Date().toISOString(),
                loginCount: (users[existingIndex].loginCount || 0) + 1
            };
        } else {
            // Add new user
            users.push({
                id: this.generateId(),
                ...userData,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                loginCount: 1
            });
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
        return users[existingIndex >= 0 ? existingIndex : users.length - 1];
    }

    // Find user by email
    findUserByEmail(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    // Validate login credentials
    validateLogin(email, password) {
        const user = this.findUserByEmail(email);
        if (user && user.password === password) {
            return user;
        }
        return null;
    }

    // Create session
    createSession(user) {
        const session = {
            userId: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return session;
    }

    // Get current session
    getSession() {
        try {
            const session = JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
            if (session && new Date(session.expiresAt) > new Date()) {
                return session;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // Clear session (logout)
    clearSession() {
        sessionStorage.removeItem(this.SESSION_KEY);
    }

    // Generate unique ID
    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Export all data (for debugging)
    exportData() {
        return {
            users: this.getAllUsers(),
            session: this.getSession()
        };
    }
}

// ================================
// TOAST NOTIFICATION SYSTEM
// ================================
class ToastNotification {
    constructor() {
        this.container = document.getElementById('toastContainer');
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>`,
            error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`,
            info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>`
        };

        toast.innerHTML = `
            ${icons[type]}
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });

        // Auto hide after 5 seconds
        setTimeout(() => this.hide(toast), 5000);
    }

    hide(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }
}

// ================================
// MAIN APPLICATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize classes
    const userStore = new UserDataStore();
    const toast = new ToastNotification();

    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const googleBtn = document.getElementById('googleBtn');
    const facebookBtn = document.getElementById('facebookBtn');

    // Check for existing session
    const existingSession = userStore.getSession();
    if (existingSession) {
        console.log('Existing session found:', existingSession);
        // You could auto-redirect to dashboard here
    }

    // ================================
    // PASSWORD TOGGLE
    // ================================
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        const eyeIcon = togglePasswordBtn.querySelector('.eye-icon');
        if (type === 'text') {
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            `;
        } else {
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    });

    // ================================
    // FORM VALIDATION
    // ================================
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const showError = (input, message) => {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.add('error');

        // Remove existing error
        const existingError = wrapper.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            ${message}
        `;
        wrapper.parentNode.appendChild(errorDiv);
    };

    const clearError = (input) => {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.remove('error');
        const existingError = wrapper.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
    };

    // Real-time validation
    emailInput.addEventListener('input', () => {
        if (emailInput.value && validateEmail(emailInput.value)) {
            clearError(emailInput);
        }
    });

    passwordInput.addEventListener('input', () => {
        if (passwordInput.value.length >= 6) {
            clearError(passwordInput);
        }
    });

    // ================================
    // MANUAL LOGIN FORM SUBMISSION
    // ================================
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearError(emailInput);
        clearError(passwordInput);

        let isValid = true;

        // Validate email
        if (!emailInput.value) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
        }

        // Validate password
        if (!passwordInput.value) {
            showError(passwordInput, 'Password is required');
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            showError(passwordInput, 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!isValid) return;

        // Show loading
        loadingOverlay.classList.remove('hidden');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if user exists
        const existingUser = userStore.findUserByEmail(emailInput.value);

        if (existingUser) {
            // Validate password
            if (existingUser.password === passwordInput.value) {
                // Update login info
                const updatedUser = userStore.saveUser({
                    email: emailInput.value,
                    password: passwordInput.value,
                    provider: 'manual'
                });

                // Create session
                userStore.createSession(updatedUser);

                loadingOverlay.classList.add('hidden');
                toast.show('Welcome back! Login successful.', 'success');

                console.log('Login successful:', updatedUser);
                console.log('All stored users:', userStore.getAllUsers());

                // Redirect after delay
                setTimeout(() => {
                    // window.location.href = '/dashboard';
                    console.log('Would redirect to dashboard');
                }, 1500);
            } else {
                loadingOverlay.classList.add('hidden');
                toast.show('Invalid password. Please try again.', 'error');
            }
        } else {
            // New user - save and create account
            const newUser = userStore.saveUser({
                email: emailInput.value,
                password: passwordInput.value,
                name: emailInput.value.split('@')[0],
                provider: 'manual'
            });

            // Create session
            userStore.createSession(newUser);

            loadingOverlay.classList.add('hidden');
            toast.show('Account created! Welcome to Study Mitra.', 'success');

            console.log('New user created:', newUser);
            console.log('All stored users:', userStore.getAllUsers());

            // Redirect after delay
            setTimeout(() => {
                // window.location.href = '/dashboard';
                console.log('Would redirect to dashboard');
            }, 1500);
        }
    });

    // ================================
    // GOOGLE LOGIN (Simulated)
    // ================================
    googleBtn.addEventListener('click', async () => {
        loadingOverlay.classList.remove('hidden');

        // Simulate Google OAuth flow
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulated Google user data
        // In production, this would come from Google OAuth API
        const googleUserData = {
            email: 'demo.user@gmail.com',
            name: 'Demo User',
            provider: 'google',
            providerId: 'google_' + Math.random().toString(36).substr(2, 9),
            avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=4285F4&color=fff',
            verified: true
        };

        // Save Google user
        const user = userStore.saveUser(googleUserData);
        userStore.createSession(user);

        loadingOverlay.classList.add('hidden');
        toast.show(`Welcome ${googleUserData.name}! Signed in with Google.`, 'success');

        console.log('Google login successful:', user);
        console.log('All stored users:', userStore.getAllUsers());

        // Redirect after delay
        setTimeout(() => {
            // window.location.href = '/dashboard';
            console.log('Would redirect to dashboard');
        }, 1500);
    });

    // ================================
    // FACEBOOK LOGIN (Simulated)
    // ================================
    facebookBtn.addEventListener('click', async () => {
        loadingOverlay.classList.remove('hidden');

        // Simulate Facebook OAuth flow
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulated Facebook user data
        // In production, this would come from Facebook OAuth API
        const facebookUserData = {
            email: 'demo.user@facebook.com',
            name: 'Demo Facebook User',
            provider: 'facebook',
            providerId: 'fb_' + Math.random().toString(36).substr(2, 9),
            avatar: 'https://ui-avatars.com/api/?name=Demo+FB&background=1877F2&color=fff',
            verified: true
        };

        // Save Facebook user
        const user = userStore.saveUser(facebookUserData);
        userStore.createSession(user);

        loadingOverlay.classList.add('hidden');
        toast.show(`Welcome ${facebookUserData.name}! Signed in with Facebook.`, 'success');

        console.log('Facebook login successful:', user);
        console.log('All stored users:', userStore.getAllUsers());

        // Redirect after delay
        setTimeout(() => {
            // window.location.href = '/dashboard';
            console.log('Would redirect to dashboard');
        }, 1500);
    });

    // Create account link is now a direct link to signup.html

    // ================================
    // RIPPLE EFFECT
    // ================================
    const addRipple = (e, element) => {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
        ripple.style.left = e.clientX - rect.left - ripple.offsetWidth / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - ripple.offsetHeight / 2 + 'px';
        element.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    };

    document.querySelectorAll('.btn-signin, .btn-social').forEach(btn => {
        btn.addEventListener('click', (e) => addRipple(e, btn));
    });

    // ================================
    // DEBUG: Console Commands
    // ================================
    console.log('%c Study Mitra Login System ', 'background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; font-size: 18px; font-weight: bold; padding: 10px 20px; border-radius: 10px;');
    console.log('%c Debug Commands: ', 'color: #a855f7; font-size: 14px; font-weight: bold;');
    console.log('  userStore.getAllUsers() - View all registered users');
    console.log('  userStore.getSession() - View current session');
    console.log('  userStore.exportData() - Export all data');
    console.log('  localStorage.clear() - Clear all data');

    // Make userStore globally accessible for debugging
    window.userStore = userStore;
});
