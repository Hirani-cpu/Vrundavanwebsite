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

                // Show success and let user choose where to go
                adminLoginBtn.textContent = '✅ Login Successful!';
                adminLoginBtn.style.background = '#51cf66';
                adminLoading.classList.remove('show');

                setTimeout(() => {
                    adminLoginForm.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <h2 style="color: #2d5016; margin-bottom: 20px;">✅ Login Successful!</h2>
                            <p style="margin-bottom: 30px;">Logged in as: <strong>${userCredential.user.email}</strong></p>
                            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                                <a href="dashboard.html" style="padding: 15px 30px; background: #4a7c2c; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
                                <a href="index.html" style="padding: 15px 30px; background: #2d5016; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Website</a>
                            </div>
                        </div>
                    `;
                }, 1000);
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
    // Show message but DON'T auto-redirect - let them choose manually
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Admin already logged in:', user.email);
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminEmail', user.email);

            // Just show a message in the form area
            const form = document.getElementById('adminLoginForm');
            if (form) {
                form.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <h2 style="color: #2d5016; margin-bottom: 20px;">✅ Already Logged In</h2>
                        <p style="margin-bottom: 30px;">You are logged in as: <strong>${user.email}</strong></p>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="dashboard.html" style="padding: 15px 30px; background: #4a7c2c; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
                            <a href="index.html" style="padding: 15px 30px; background: #2d5016; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Website</a>
                        </div>
                    </div>
                `;
            }
        }
    });
});
