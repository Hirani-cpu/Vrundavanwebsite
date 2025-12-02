// ===========================
// Admin Login Logic
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminEmail = document.getElementById('adminEmail');
    const adminPassword = document.getElementById('adminPassword');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminErrorMessage = document.getElementById('adminErrorMessage');
    const adminLoading = document.getElementById('adminLoading');

    // Handle admin login form submission
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = adminEmail.value.trim();
        const password = adminPassword.value;

        // Validation
        if (!email || !password) {
            showError('Please enter both email and password.');
            return;
        }

        // Show loading state
        adminLoginBtn.disabled = true;
        adminLoading.classList.add('show');
        hideError();

        // Firebase Authentication - Sign in with email and password
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login successful
                console.log('Admin logged in successfully:', userCredential.user.email);

                // Store admin session
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminEmail', userCredential.user.email);

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                // Login failed
                console.error('Login error:', error);

                // Show user-friendly error message
                let errorMsg = 'Login failed. Please try again.';

                if (error.code === 'auth/user-not-found') {
                    errorMsg = 'No admin account found with this email.';
                } else if (error.code === 'auth/wrong-password') {
                    errorMsg = 'Incorrect password. Please try again.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = 'Invalid email address format.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg = 'Too many failed attempts. Please try again later.';
                } else {
                    errorMsg = error.message;
                }

                showError(errorMsg);

                // Reset loading state
                adminLoginBtn.disabled = false;
                adminLoading.classList.remove('show');
            });
    });

    // Show error message
    function showError(message) {
        adminErrorMessage.textContent = message;
        adminErrorMessage.classList.add('show');
    }

    // Hide error message
    function hideError() {
        adminErrorMessage.classList.remove('show');
    }

    // Check if admin is already logged in via Firebase Auth
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is already logged in with Firebase Auth - redirect immediately
            console.log('✅ Admin already logged in:', user.email);
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminEmail', user.email);
            window.location.href = 'dashboard.html';
        }
    });
});
