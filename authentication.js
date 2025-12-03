// ===========================
// Firebase Authentication & User Management
// ===========================

(function() {
    'use strict';

    console.log('🔐 Authentication module loaded');

    // ===========================
    // SIGNUP (Registration)
    // ===========================
    document.addEventListener('DOMContentLoaded', function() {
        const registerForm = document.getElementById('registerForm');

        if (registerForm) {
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const name = document.getElementById('registerName').value.trim();
                const email = document.getElementById('registerEmail').value.trim();
                const phone = document.getElementById('registerPhone').value.trim();
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const agreeTerms = document.getElementById('agreeTerms').checked;

                // Validation
                if (!name) {
                    alert('Please enter your full name.');
                    document.getElementById('registerName').focus();
                    return;
                }

                if (!email) {
                    alert('Please enter your email address.');
                    document.getElementById('registerEmail').focus();
                    return;
                }

                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    alert('Please enter a valid email address.');
                    document.getElementById('registerEmail').focus();
                    return;
                }

                if (!phone) {
                    alert('Please enter your phone number.');
                    document.getElementById('registerPhone').focus();
                    return;
                }

                if (!password) {
                    alert('Please create a password.');
                    document.getElementById('registerPassword').focus();
                    return;
                }

                if (password.length < 6) {
                    alert('Password must be at least 6 characters long.');
                    document.getElementById('registerPassword').focus();
                    return;
                }

                if (password !== confirmPassword) {
                    alert('Passwords do not match.');
                    document.getElementById('confirmPassword').focus();
                    return;
                }

                if (!agreeTerms) {
                    alert('Please agree to the Terms & Conditions.');
                    return;
                }

                // Show loading state
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.textContent = 'Creating Account...';
                submitBtn.disabled = true;

                try {
                    // Create Firebase Auth account
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    console.log('✅ Firebase Auth account created:', user.uid);

                    // Update user profile with display name
                    await user.updateProfile({
                        displayName: name
                    });

                    // Create user profile in Firestore
                    await db.collection('users').doc(user.uid).set({
                        userId: user.uid,
                        name: name,
                        email: email,
                        phone: phone,
                        joinDate: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        role: 'user' // Default role
                    });

                    console.log('✅ User profile saved to Firestore');

                    // Save to localStorage for navigation
                    const currentUser = {
                        userId: user.uid,
                        name: name,
                        email: email,
                        phone: phone
                    };
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));

                    // Check if registered user is admin and set/clear flags accordingly
                    const adminEmails = ['admin@vrundavanresort.com', 'vishal@vrundavanresort.com'];
                    if (adminEmails.includes(email.toLowerCase())) {
                        localStorage.setItem('adminLoggedIn', 'true');
                        localStorage.setItem('adminEmail', email);
                        console.log('✅ Admin account created');
                    } else {
                        // IMPORTANT: Clear admin flags for non-admin users
                        localStorage.removeItem('adminLoggedIn');
                        localStorage.removeItem('adminEmail');
                        console.log('ℹ️ Regular user account created (not admin)');
                    }

                    // Show success message
                    const summaryHTML = `
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone}</p>
                        <p>✅ Your account has been successfully created in the database!</p>
                        <p>You are now logged in and can manage your bookings.</p>
                    `;

                    document.getElementById('registerSummary').innerHTML = summaryHTML;

                    // Hide form and show success
                    registerForm.style.display = 'none';
                    document.getElementById('registerSuccessMessage').style.display = 'block';

                    // Scroll to success message
                    document.getElementById('registerSuccessMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Redirect to account page after 3 seconds
                    setTimeout(function() {
                        window.location.href = 'account.html';
                    }, 3000);

                } catch (error) {
                    console.error('❌ Registration error:', error);

                    let errorMessage = 'Registration failed. Please try again.';

                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = '❌ This email is already registered!\n\nPlease login or use a different email address.';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = 'Password is too weak. Please use at least 6 characters.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Invalid email address format.';
                    } else {
                        errorMessage = 'Error: ' + error.message;
                    }

                    alert(errorMessage);

                    // Reset button
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                }
            });
        }
    });

    // ===========================
    // LOGIN
    // ===========================
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const loginSuccessMessage = document.getElementById('loginSuccessMessage');

        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;

                // Validation
                if (!email || !password) {
                    alert('Please enter both email and password.');
                    return;
                }

                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    alert('Please enter a valid email address.');
                    return;
                }

                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.textContent = 'Logging in...';
                submitBtn.disabled = true;

                try {
                    // SET PERSISTENCE TO LOCAL - Stay logged in even after closing browser!
                    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                    console.log('🔒 Auth persistence set to LOCAL (stays logged in)');

                    // Login with Firebase Auth
                    const userCredential = await auth.signInWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    console.log('✅ Login successful:', user.uid);

                    // Get user profile from Firestore
                    const userDoc = await db.collection('users').doc(user.uid).get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();

                        // Update last login time
                        await db.collection('users').doc(user.uid).update({
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        // Save to localStorage for navigation
                        const currentUser = {
                            userId: user.uid,
                            name: userData.name || user.displayName || email.split('@')[0],
                            email: userData.email || user.email,
                            phone: userData.phone || ''
                        };
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));

                        // Check if admin and set/clear flags accordingly
                        const adminEmails = ['admin@vrundavanresort.com', 'vishal@vrundavanresort.com'];
                        if (adminEmails.includes(email.toLowerCase()) || userData.role === 'admin') {
                            localStorage.setItem('adminLoggedIn', 'true');
                            localStorage.setItem('adminEmail', email);
                            console.log('✅ Admin user logged in');
                        } else {
                            // IMPORTANT: Clear admin flags for non-admin users
                            localStorage.removeItem('adminLoggedIn');
                            localStorage.removeItem('adminEmail');
                            console.log('ℹ️ Regular user logged in (not admin)');
                        }

                        console.log('✅ User profile loaded from Firestore');

                    } else {
                        // User authenticated but no profile in Firestore - create one
                        const currentUser = {
                            userId: user.uid,
                            name: user.displayName || email.split('@')[0],
                            email: user.email,
                            phone: ''
                        };

                        await db.collection('users').doc(user.uid).set({
                            userId: user.uid,
                            name: currentUser.name,
                            email: currentUser.email,
                            phone: '',
                            joinDate: firebase.firestore.FieldValue.serverTimestamp(),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                            role: 'user'
                        });

                        localStorage.setItem('currentUser', JSON.stringify(currentUser));

                        // Check if user is admin and set/clear flags accordingly
                        const adminEmails = ['admin@vrundavanresort.com', 'vishal@vrundavanresort.com'];
                        if (adminEmails.includes(user.email.toLowerCase())) {
                            localStorage.setItem('adminLoggedIn', 'true');
                            localStorage.setItem('adminEmail', user.email);
                            console.log('✅ Admin user (profile auto-created)');
                        } else {
                            // IMPORTANT: Clear admin flags for non-admin users
                            localStorage.removeItem('adminLoggedIn');
                            localStorage.removeItem('adminEmail');
                            console.log('ℹ️ Regular user (profile auto-created, not admin)');
                        }

                        console.log('✅ User profile created in Firestore');
                    }

                    // Hide form and show success
                    loginForm.style.display = 'none';
                    loginSuccessMessage.style.display = 'block';

                    // Redirect to account page
                    setTimeout(function() {
                        window.location.href = 'account.html';
                    }, 2000);

                } catch (error) {
                    console.error('❌ Login error:', error);

                    let errorMessage = 'Login failed. Please try again.';

                    if (error.code === 'auth/user-not-found') {
                        errorMessage = '❌ No account found with this email!\n\nPlease check your email or create a new account.';
                    } else if (error.code === 'auth/wrong-password') {
                        errorMessage = '❌ Incorrect password!\n\nPlease try again or reset your password.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Invalid email address format.';
                    } else if (error.code === 'auth/too-many-requests') {
                        errorMessage = '❌ Too many failed login attempts!\n\nPlease try again later or reset your password.';
                    } else {
                        errorMessage = 'Error: ' + error.message;
                    }

                    alert(errorMessage);

                    // Reset button
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                }
            });
        }
    });

    // ===========================
    // FORGOT PASSWORD
    // ===========================
    document.addEventListener('DOMContentLoaded', function() {
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');

        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const email = document.getElementById('forgotEmail').value.trim();

                if (!email) {
                    alert('Please enter your email address.');
                    return;
                }

                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    alert('Please enter a valid email address.');
                    return;
                }

                // Show loading
                const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.textContent = 'Sending...';
                submitBtn.disabled = true;

                try {
                    // Send password reset email via Firebase Auth
                    await auth.sendPasswordResetEmail(email);

                    console.log('✅ Password reset email sent to:', email);

                    // Hide form and show success
                    forgotPasswordForm.style.display = 'none';
                    document.getElementById('forgotSuccessMessage').style.display = 'block';

                    // Scroll to success message
                    document.getElementById('forgotSuccessMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });

                } catch (error) {
                    console.error('❌ Password reset error:', error);

                    let errorMessage = 'Failed to send reset email. Please try again.';

                    if (error.code === 'auth/user-not-found') {
                        errorMessage = '❌ No account found with this email address!';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = 'Invalid email address format.';
                    } else {
                        errorMessage = 'Error: ' + error.message;
                    }

                    alert(errorMessage);

                    // Reset button
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                }
            });
        }
    });

    // ===========================
    // LOGOUT
    // ===========================
    window.handleLogout = async function() {
        try {
            await auth.signOut();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
            console.log('✅ Logged out successfully');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('❌ Logout error:', error);
            alert('Error logging out. Please try again.');
        }
    };

})();
