/**
 * Study Mitra - Signup System with Data Storage
 * Handles user registration from manual signup, Google, and Facebook
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

    initializeStore() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    }

    getAllUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch (e) {
            console.error('Error reading users:', e);
            return [];
        }
    }

    saveUser(userData) {
        const users = this.getAllUsers();
        const existingIndex = users.findIndex(u => u.email === userData.email);

        if (existingIndex >= 0) {
            users[existingIndex] = {
                ...users[existingIndex],
                ...userData,
                lastLogin: new Date().toISOString(),
                loginCount: (users[existingIndex].loginCount || 0) + 1
            };
        } else {
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

    findUserByEmail(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    userExists(email) {
        return this.findUserByEmail(email) !== undefined;
    }

    createSession(user) {
        const session = {
            userId: user.id,
            email: user.email,
            name: user.name,
            provider: user.provider,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return session;
    }

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

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

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

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });

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
    const userStore = new UserDataStore();
    const toast = new ToastNotification();

    // DOM Elements
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const passwordStrength = document.getElementById('passwordStrength');
    const googleBtn = document.getElementById('googleBtn');
    const facebookBtn = document.getElementById('facebookBtn');

    // Check for existing session
    const existingSession = userStore.getSession();
    if (existingSession) {
        toast.show('You are already logged in!', 'info');
        setTimeout(() => {
            // window.location.href = '/dashboard';
        }, 2000);
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
    // PASSWORD STRENGTH CHECKER
    // ================================
    const checkPasswordStrength = (password) => {
        let strength = 0;

        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        return strength;
    };

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;

        if (password.length === 0) {
            passwordStrength.classList.remove('show', 'weak', 'medium', 'strong');
            return;
        }

        passwordStrength.classList.add('show');
        const strength = checkPasswordStrength(password);
        const strengthText = passwordStrength.querySelector('.strength-text');

        passwordStrength.classList.remove('weak', 'medium', 'strong');

        if (strength <= 2) {
            passwordStrength.classList.add('weak');
            strengthText.textContent = 'Weak';
        } else if (strength <= 4) {
            passwordStrength.classList.add('medium');
            strengthText.textContent = 'Medium';
        } else {
            passwordStrength.classList.add('strong');
            strengthText.textContent = 'Strong';
        }
    });

    // ================================
    // FORM VALIDATION
    // ================================
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        if (!phone) return true; // Optional field
        const phoneRegex = /^(\+977)?[9][6-8]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const showError = (input, message) => {
        const wrapper = input.closest('.input-wrapper');
        wrapper.classList.add('error');

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
    fullNameInput.addEventListener('input', () => {
        if (fullNameInput.value.length >= 2) {
            clearError(fullNameInput);
        }
    });

    emailInput.addEventListener('input', () => {
        if (emailInput.value && validateEmail(emailInput.value)) {
            clearError(emailInput);
        }
    });

    phoneInput.addEventListener('input', () => {
        if (validatePhone(phoneInput.value)) {
            clearError(phoneInput);
        }
    });

    confirmPasswordInput.addEventListener('input', () => {
        if (confirmPasswordInput.value === passwordInput.value) {
            clearError(confirmPasswordInput);
        }
    });

    // ================================
    // FORM SUBMISSION
    // ================================
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear all errors
        [fullNameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput].forEach(clearError);

        let isValid = true;

        // Validate full name
        if (!fullNameInput.value || fullNameInput.value.length < 2) {
            showError(fullNameInput, 'Please enter your full name');
            isValid = false;
        }

        // Validate email
        if (!emailInput.value) {
            showError(emailInput, 'Email is required');
            isValid = false;
        } else if (!validateEmail(emailInput.value)) {
            showError(emailInput, 'Please enter a valid email');
            isValid = false;
        } else if (userStore.userExists(emailInput.value)) {
            showError(emailInput, 'This email is already registered');
            isValid = false;
        }

        // Validate phone (optional)
        if (phoneInput.value && !validatePhone(phoneInput.value)) {
            showError(phoneInput, 'Please enter a valid Nepal phone number');
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

        // Validate confirm password
        if (!confirmPasswordInput.value) {
            showError(confirmPasswordInput, 'Please confirm your password');
            isValid = false;
        } else if (confirmPasswordInput.value !== passwordInput.value) {
            showError(confirmPasswordInput, 'Passwords do not match');
            isValid = false;
        }

        // Validate terms agreement
        if (!agreeTermsCheckbox.checked) {
            toast.show('Please agree to the Terms of Service', 'error');
            isValid = false;
        }

        if (!isValid) return;

        // Show loading
        loadingOverlay.classList.remove('hidden');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create new user
        const newUser = userStore.saveUser({
            name: fullNameInput.value.trim(),
            email: emailInput.value.trim().toLowerCase(),
            phone: phoneInput.value.trim() || null,
            password: passwordInput.value,
            provider: 'manual',
            verified: false,
            agreedToTerms: true,
            agreedAt: new Date().toISOString()
        });

        // Create session
        userStore.createSession(newUser);

        loadingOverlay.classList.add('hidden');
        toast.show('Account created successfully! Welcome to Study Mitra.', 'success');

        console.log('New user registered:', newUser);
        console.log('All users:', userStore.getAllUsers());

        // Redirect to dashboard after delay
        setTimeout(() => {
            // window.location.href = '/dashboard';
            // For demo, redirect to login page
            window.location.href = 'index.html';
        }, 2000);
    });

    // ================================
    // GOOGLE SIGNUP
    // ================================
    googleBtn.addEventListener('click', async () => {
        loadingOverlay.classList.remove('hidden');

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulated Google user data
        const googleUserData = {
            email: 'newuser.google@gmail.com',
            name: 'Google User',
            provider: 'google',
            providerId: 'google_' + Math.random().toString(36).substr(2, 9),
            avatar: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff',
            verified: true
        };

        // Check if user already exists
        if (userStore.userExists(googleUserData.email)) {
            loadingOverlay.classList.add('hidden');
            toast.show('Account already exists. Redirecting to login...', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }

        const user = userStore.saveUser(googleUserData);
        userStore.createSession(user);

        loadingOverlay.classList.add('hidden');
        toast.show(`Welcome ${googleUserData.name}! Account created with Google.`, 'success');

        console.log('Google signup successful:', user);
        console.log('All users:', userStore.getAllUsers());

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });

    // ================================
    // FACEBOOK SIGNUP
    // ================================
    facebookBtn.addEventListener('click', async () => {
        loadingOverlay.classList.remove('hidden');

        await new Promise(resolve => setTimeout(resolve, 2000));

        const facebookUserData = {
            email: 'newuser.fb@facebook.com',
            name: 'Facebook User',
            provider: 'facebook',
            providerId: 'fb_' + Math.random().toString(36).substr(2, 9),
            avatar: 'https://ui-avatars.com/api/?name=FB+User&background=1877F2&color=fff',
            verified: true
        };

        if (userStore.userExists(facebookUserData.email)) {
            loadingOverlay.classList.add('hidden');
            toast.show('Account already exists. Redirecting to login...', 'info');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }

        const user = userStore.saveUser(facebookUserData);
        userStore.createSession(user);

        loadingOverlay.classList.add('hidden');
        toast.show(`Welcome ${facebookUserData.name}! Account created with Facebook.`, 'success');

        console.log('Facebook signup successful:', user);
        console.log('All users:', userStore.getAllUsers());

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });

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
    // DEBUG CONSOLE
    // ================================
    console.log('%c Study Mitra Signup ', 'background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; font-size: 18px; font-weight: bold; padding: 10px 20px; border-radius: 10px;');
    console.log('%c Debug Commands: ', 'color: #a855f7; font-size: 14px; font-weight: bold;');
    console.log('  userStore.getAllUsers() - View all registered users');
    console.log('  userStore.exportData() - Export all data');

    window.userStore = userStore;
});
