// ===========================
// DOM Content Loaded
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // ===========================
    // Mobile Hamburger Menu
    // ===========================

    const hamburger = document.getElementById('hamburger');
    const navLinksContainer = document.getElementById('navLinks');

    if (hamburger && navLinksContainer) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navLinksContainer.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);

            if (!isClickInsideNav && !isClickOnHamburger && navLinksContainer.classList.contains('active')) {
                navLinksContainer.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });

        // Close menu when clicking on a nav link
        const navLinks = navLinksContainer.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navLinksContainer.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // ===========================
    // Sticky Header on Scroll
    // ===========================

    const header = document.getElementById('header');

    if (header) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;

            // Add shadow on scroll
            if (currentScroll > 50) {
                header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            }
        });
    }

    // ===========================
    // Room Booking Form (Basic Handler - DISABLED, using Firebase handler instead)
    // ===========================

    const roomBookingForm = document.getElementById('roomBookingForm');
    const roomSuccessMessage = document.getElementById('roomSuccessMessage');
    const roomBookingSummary = document.getElementById('roomBookingSummary');

    // DISABLED: Firebase handler takes precedence
    if (false && roomBookingForm) {
        roomBookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form data
            const formData = {
                name: document.getElementById('roomName').value.trim(),
                phone: document.getElementById('roomPhone').value.trim(),
                email: document.getElementById('roomEmail').value.trim(),
                checkIn: document.getElementById('checkIn').value,
                checkOut: document.getElementById('checkOut').value,
                adults: document.getElementById('adults').value,
                children: document.getElementById('children').value,
                roomType: document.getElementById('roomType').value,
                requests: document.getElementById('roomRequests').value.trim()
            };

            // Simple validation
            if (!formData.name) {
                alert('Please enter your full name.');
                document.getElementById('roomName').focus();
                return;
            }

            if (!formData.phone) {
                alert('Please enter your phone number.');
                document.getElementById('roomPhone').focus();
                return;
            }

            if (!formData.email) {
                alert('Please enter your email address.');
                document.getElementById('roomEmail').focus();
                return;
            }

            if (!formData.checkIn || !formData.checkOut) {
                alert('Please select check-in and check-out dates.');
                return;
            }

            // Validate dates
            const checkInDate = new Date(formData.checkIn);
            const checkOutDate = new Date(formData.checkOut);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (checkInDate < today) {
                alert('Check-in date cannot be in the past.');
                document.getElementById('checkIn').focus();
                return;
            }

            if (checkOutDate <= checkInDate) {
                alert('Check-out date must be after check-in date.');
                document.getElementById('checkOut').focus();
                return;
            }

            if (!formData.adults) {
                alert('Please select number of adults.');
                document.getElementById('adults').focus();
                return;
            }

            if (!formData.roomType) {
                alert('Please select a room type.');
                document.getElementById('roomType').focus();
                return;
            }

            // Calculate nights
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

            // Format dates for display
            const checkInFormatted = formatDate(checkInDate);
            const checkOutFormatted = formatDate(checkOutDate);

            // Create summary
            let summaryHTML = `
                <p><strong>Name:</strong> ${formData.name}</p>
                <p><strong>Phone:</strong> ${formData.phone}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Check-in:</strong> ${checkInFormatted}</p>
                <p><strong>Check-out:</strong> ${checkOutFormatted}</p>
                <p><strong>Duration:</strong> ${nights} night${nights > 1 ? 's' : ''}</p>
                <p><strong>Guests:</strong> ${formData.adults} Adult${formData.adults > 1 ? 's' : ''}${formData.children > 0 ? ', ' + formData.children + ' Child' + (formData.children > 1 ? 'ren' : '') : ''}</p>
                <p><strong>Room Type:</strong> ${formData.roomType}</p>
            `;

            if (formData.requests) {
                summaryHTML += `<p><strong>Special Requests:</strong> ${formData.requests}</p>`;
            }

            roomBookingSummary.innerHTML = summaryHTML;

            // Hide form and show success message
            roomBookingForm.style.display = 'none';
            roomSuccessMessage.style.display = 'block';

            // Scroll to success message
            roomSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // ===========================
    // Event Booking Form (Basic Handler - DISABLED, using Firebase handler instead)
    // ===========================

    const eventBookingForm = document.getElementById('eventBookingForm');
    const eventSuccessMessage = document.getElementById('eventSuccessMessage');
    const eventBookingSummary = document.getElementById('eventBookingSummary');

    // DISABLED: Firebase handler takes precedence
    if (false && eventBookingForm) {
        eventBookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form data
            const formData = {
                name: document.getElementById('eventName').value.trim(),
                phone: document.getElementById('eventPhone').value.trim(),
                email: document.getElementById('eventEmail').value.trim(),
                eventType: document.getElementById('eventType').value,
                guests: document.getElementById('guests').value,
                venue: document.getElementById('venue').value,
                eventDate: document.getElementById('eventDate').value,
                timeSlot: document.getElementById('timeSlot').value,
                details: document.getElementById('eventDetails').value.trim()
            };

            // Simple validation
            if (!formData.name) {
                alert('Please enter your full name.');
                document.getElementById('eventName').focus();
                return;
            }

            if (!formData.phone) {
                alert('Please enter your phone number.');
                document.getElementById('eventPhone').focus();
                return;
            }

            if (!formData.email) {
                alert('Please enter your email address.');
                document.getElementById('eventEmail').focus();
                return;
            }

            if (!formData.eventType) {
                alert('Please select an event type.');
                document.getElementById('eventType').focus();
                return;
            }

            if (!formData.guests || formData.guests < 10) {
                alert('Please enter a valid number of expected guests (minimum 10).');
                document.getElementById('guests').focus();
                return;
            }

            if (!formData.venue) {
                alert('Please select a preferred venue.');
                document.getElementById('venue').focus();
                return;
            }

            if (!formData.eventDate) {
                alert('Please select an event date.');
                document.getElementById('eventDate').focus();
                return;
            }

            // Validate event date is not in the past
            const eventDate = new Date(formData.eventDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (eventDate < today) {
                alert('Event date cannot be in the past.');
                document.getElementById('eventDate').focus();
                return;
            }

            if (!formData.timeSlot) {
                alert('Please select a time slot.');
                document.getElementById('timeSlot').focus();
                return;
            }

            // Format date for display
            const eventDateFormatted = formatDate(eventDate);

            // Create summary
            let summaryHTML = `
                <p><strong>Name:</strong> ${formData.name}</p>
                <p><strong>Phone:</strong> ${formData.phone}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Event Type:</strong> ${formData.eventType}</p>
                <p><strong>Expected Guests:</strong> ${formData.guests}</p>
                <p><strong>Preferred Venue:</strong> ${formData.venue}</p>
                <p><strong>Event Date:</strong> ${eventDateFormatted}</p>
                <p><strong>Time Slot:</strong> ${formData.timeSlot}</p>
            `;

            if (formData.details) {
                summaryHTML += `<p><strong>Additional Details:</strong> ${formData.details}</p>`;
            }

            eventBookingSummary.innerHTML = summaryHTML;

            // Hide form and show success message
            eventBookingForm.style.display = 'none';
            eventSuccessMessage.style.display = 'block';

            // Scroll to success message
            eventSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // ===========================
    // General Enquiry Form
    // ===========================

    const generalEnquiryForm = document.getElementById('generalEnquiryForm');
    const enquirySuccessMessage = document.getElementById('enquirySuccessMessage');

    if (generalEnquiryForm) {
        generalEnquiryForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form data
            const formData = {
                name: document.getElementById('enquiryName').value.trim(),
                email: document.getElementById('enquiryEmail').value.trim(),
                phone: document.getElementById('enquiryPhone').value.trim(),
                subject: document.getElementById('enquirySubject').value.trim(),
                message: document.getElementById('enquiryMessage').value.trim()
            };

            // Simple validation
            if (!formData.name) {
                alert('Please enter your name.');
                document.getElementById('enquiryName').focus();
                return;
            }

            if (!formData.email) {
                alert('Please enter your email address.');
                document.getElementById('enquiryEmail').focus();
                return;
            }

            if (!formData.subject) {
                alert('Please enter a subject.');
                document.getElementById('enquirySubject').focus();
                return;
            }

            if (!formData.message) {
                alert('Please enter your message.');
                document.getElementById('enquiryMessage').focus();
                return;
            }

            // Show loading state
            const submitBtn = generalEnquiryForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                // Save message to Firebase
                await db.collection('messages').add({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || '',
                    subject: formData.subject,
                    message: formData.message,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'unread',
                    createdAt: new Date().toISOString()
                });

                console.log('✅ Message saved to Firebase');

                // Hide form and show success message
                generalEnquiryForm.style.display = 'none';
                enquirySuccessMessage.style.display = 'block';

                // Scroll to success message
                enquirySuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

            } catch (error) {
                console.error('❌ Error saving message:', error);
                alert('Failed to send message. Please try again.');

                // Reset button
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // ===========================
    // Helper Functions
    // ===========================

    function formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // ===========================
    // Set minimum dates for date inputs
    // ===========================

    const today = new Date().toISOString().split('T')[0];

    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const eventDateInput = document.getElementById('eventDate');

    if (checkInInput) {
        checkInInput.setAttribute('min', today);
    }

    if (checkOutInput) {
        checkOutInput.setAttribute('min', today);
    }

    if (eventDateInput) {
        eventDateInput.setAttribute('min', today);
    }

    // Update checkout min date when check-in changes
    if (checkInInput && checkOutInput) {
        checkInInput.addEventListener('change', function() {
            const checkInDate = new Date(this.value);
            checkInDate.setDate(checkInDate.getDate() + 1);
            const minCheckOut = checkInDate.toISOString().split('T')[0];
            checkOutInput.setAttribute('min', minCheckOut);

            // Reset checkout if it's before new check-in
            if (checkOutInput.value && checkOutInput.value <= this.value) {
                checkOutInput.value = minCheckOut;
            }
        });
    }

    // ===========================
    // Scroll Animations (Optional)
    // ===========================

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe animated elements
    const animatedElements = document.querySelectorAll('.room-card, .amenity-card, .gallery-item, .service-card, .why-card, .event-type-card');

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // ===========================
    // Console Welcome Message
    // ===========================

    console.log('%c Welcome to Vrundavan Resort & Restaurant ',
        'background: #2d5016; color: #fff; font-size: 16px; padding: 10px; border-radius: 5px;');
    console.log('%c This is a static front-end demo. No actual bookings are processed. ',
        'color: #4a7c2c; font-size: 12px;');
});

// ===========================
// Reset Form Functions (Global)
// ===========================

function resetRoomForm() {
    const roomBookingForm = document.getElementById('roomBookingForm');
    const roomSuccessMessage = document.getElementById('roomSuccessMessage');

    if (roomBookingForm && roomSuccessMessage) {
        roomBookingForm.reset();
        roomBookingForm.style.display = 'flex';
        roomSuccessMessage.style.display = 'none';

        // Scroll to form
        roomBookingForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function resetEventForm() {
    const eventBookingForm = document.getElementById('eventBookingForm');
    const eventSuccessMessage = document.getElementById('eventSuccessMessage');

    if (eventBookingForm && eventSuccessMessage) {
        eventBookingForm.reset();
        eventBookingForm.style.display = 'flex';
        eventSuccessMessage.style.display = 'none';

        // Scroll to form
        eventBookingForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function resetEnquiryForm() {
    const generalEnquiryForm = document.getElementById('generalEnquiryForm');
    const enquirySuccessMessage = document.getElementById('enquirySuccessMessage');

    if (generalEnquiryForm && enquirySuccessMessage) {
        generalEnquiryForm.reset();
        generalEnquiryForm.style.display = 'flex';
        enquirySuccessMessage.style.display = 'none';

        // Scroll to form
        generalEnquiryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ===========================
// Login Page Functions
// ===========================

// Show/Hide Auth Forms
function showLogin(e) {
    if (e) e.preventDefault();

    document.getElementById('loginFormContainer').classList.add('active');
    document.getElementById('registerFormContainer').classList.remove('active');
    document.getElementById('forgotPasswordContainer').classList.remove('active');

    // Scroll to top of form
    document.getElementById('loginFormContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showRegister(e) {
    if (e) e.preventDefault();

    document.getElementById('loginFormContainer').classList.remove('active');
    document.getElementById('registerFormContainer').classList.add('active');
    document.getElementById('forgotPasswordContainer').classList.remove('active');

    // Scroll to top of form
    document.getElementById('registerFormContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showForgotPassword(e) {
    if (e) e.preventDefault();

    document.getElementById('loginFormContainer').classList.remove('active');
    document.getElementById('registerFormContainer').classList.remove('active');
    document.getElementById('forgotPasswordContainer').classList.add('active');

    // Scroll to top of form
    document.getElementById('forgotPasswordContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===========================
// Register Form Handler
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
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

            // Email validation
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

            // Create summary
            const summaryHTML = `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p>Your account has been successfully created. You can now login to manage your bookings.</p>
            `;

            document.getElementById('registerSummary').innerHTML = summaryHTML;

            // Hide form and show success
            registerForm.style.display = 'none';
            document.getElementById('registerSuccessMessage').style.display = 'block';

            // Scroll to success message
            document.getElementById('registerSuccessMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Log registration
            console.log('New user registered:', { name, email, phone });
        });
    }
});

// ===========================
// Forgot Password Form Handler
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('forgotEmail').value.trim();

            // Validation
            if (!email) {
                alert('Please enter your email address.');
                document.getElementById('forgotEmail').focus();
                return;
            }

            // Email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert('Please enter a valid email address.');
                document.getElementById('forgotEmail').focus();
                return;
            }

            // Hide form and show success
            forgotPasswordForm.style.display = 'none';
            document.getElementById('forgotSuccessMessage').style.display = 'block';

            // Scroll to success message
            document.getElementById('forgotSuccessMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Log password reset request
            console.log('Password reset requested for:', email);
        });
    }
});

// ===========================
// User Authentication System
// ===========================

// Check if user is logged in and update navigation on all pages
document.addEventListener('DOMContentLoaded', function() {
    updateNavigationState();

    // Logout button handler in Account Sidebar
    const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
});

// Update navigation based on login state
function updateNavigationState() {
    const currentUser = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const userNav = document.getElementById('userNav');

    if (currentUser && loginLink && userNav) {
        // User is logged in - show user info, hide login button
        document.body.classList.add('logged-in');
        loginLink.style.display = 'none';
        userNav.style.display = 'inline-flex';

        // Update user info
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');

        if (userName) {
            userName.textContent = currentUser.name.split(' ')[0]; // First name only
        }

        if (userAvatar) {
            userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        }
    } else if (loginLink && userNav) {
        // User is not logged in - show login button, hide user info
        document.body.classList.remove('logged-in');
        loginLink.style.display = 'inline-block';
        userNav.style.display = 'none';
    }
}

// Get current logged-in user from localStorage
function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Save user to localStorage
function saveUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Logout handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ===========================
// Updated Login Form Handler with Authentication
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginSuccessMessage = document.getElementById('loginSuccessMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;

            // Validation
            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            // Email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // FIRST: Try Firebase Auth for admin accounts
            if (auth) {
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        // Firebase Auth success - this is an admin account
                        console.log('✅ Admin logged in via Firebase Auth:', userCredential.user.email);

                        const currentUser = {
                            userId: userCredential.user.uid,
                            name: userCredential.user.displayName || email.split('@')[0],
                            email: userCredential.user.email,
                            phone: userCredential.user.phoneNumber || '',
                            joinDate: new Date().toISOString()
                        };

                        saveUser(currentUser);
                        localStorage.setItem('adminLoggedIn', 'true');
                        localStorage.setItem('adminEmail', userCredential.user.email);

                        // Hide form and show success
                        loginForm.style.display = 'none';
                        loginSuccessMessage.style.display = 'block';

                        // Redirect to account page
                        setTimeout(function() {
                            window.location.href = 'account.html';
                        }, 2000);
                    })
                    .catch((error) => {
                        // Firebase Auth failed - try localStorage for regular users
                        console.log('Not a Firebase Auth user, checking localStorage...');

                        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                        const user = registeredUsers.find(u => u.email === email && u.password === password);

                        if (user) {
                            // Login successful via localStorage
                            const currentUser = {
                                userId: user.userId || user.email,
                                name: user.name,
                                email: user.email,
                                phone: user.phone,
                                joinDate: user.joinDate
                            };

                            saveUser(currentUser);

                            // Hide form and show success
                            loginForm.style.display = 'none';
                            loginSuccessMessage.style.display = 'block';

                            // Redirect to account page
                            setTimeout(function() {
                                window.location.href = 'account.html';
                            }, 2000);
                        } else {
                            // Both auth methods failed
                            alert('Invalid email or password. Please try again or create a new account.');
                        }
                    });
            } else {
                // Firebase Auth not available - use localStorage only
                const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                const user = registeredUsers.find(u => u.email === email && u.password === password);

                if (user) {
                    const currentUser = {
                        userId: user.userId || user.email,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        joinDate: user.joinDate
                    };

                    saveUser(currentUser);
                    loginForm.style.display = 'none';
                    loginSuccessMessage.style.display = 'block';

                    setTimeout(function() {
                        window.location.href = 'account.html';
                    }, 2000);
                } else {
                    alert('Invalid email or password. Please try again or create a new account.');
                }
            }
        });
    }
});

// ===========================
// Updated Register Form Handler with User Storage
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerSuccessMessage = document.getElementById('registerSuccessMessage');
    const registerSummary = document.getElementById('registerSummary');

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = {
                name: document.getElementById('registerName').value.trim(),
                email: document.getElementById('registerEmail').value.trim(),
                phone: document.getElementById('registerPhone').value.trim(),
                password: document.getElementById('registerPassword').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            // Validation
            if (!formData.name || !formData.email || !formData.phone || !formData.password) {
                alert('Please fill in all required fields.');
                return;
            }

            // Email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(formData.email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Password validation
            if (formData.password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            // Terms agreement check
            const agreeTerms = document.getElementById('agreeTerms').checked;
            if (!agreeTerms) {
                alert('Please agree to the Terms & Conditions to continue.');
                return;
            }

            // Check if email already exists
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            if (registeredUsers.some(u => u.email === formData.email)) {
                alert('An account with this email already exists. Please login instead.');
                return;
            }

            // Save user to registered users list
            const newUser = {
                userId: formData.email, // Use email as unique userId
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password, // Note: In production, never store plain passwords!
                joinDate: new Date().toISOString()
            };

            registeredUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

            // Display success message
            registerForm.style.display = 'none';
            registerSuccessMessage.style.display = 'block';

            if (registerSummary) {
                registerSummary.innerHTML = `
                    <p><strong>Name:</strong> ${formData.name}</p>
                    <p><strong>Email:</strong> ${formData.email}</p>
                    <p><strong>Phone:</strong> ${formData.phone}</p>
                `;
            }

            registerSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

            console.log('User registered successfully:', formData.email);
        });
    }
});

// ===========================
// Account Page Functionality
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the account page
    const accountContent = document.getElementById('accountContent');
    const notLoggedInMessage = document.getElementById('notLoggedInMessage');

    if (accountContent && notLoggedInMessage) {
        const currentUser = getCurrentUser();

        if (currentUser) {
            // User is logged in - show account content
            notLoggedInMessage.style.display = 'none';
            accountContent.style.display = 'block';

            // Populate user profile data
            populateAccountData(currentUser);

            // Setup tab switching
            setupAccountTabs();

            // Setup password change functionality
            setupPasswordChange();
        } else {
            // User is not logged in - show login message
            notLoggedInMessage.style.display = 'block';
            accountContent.style.display = 'none';
        }
    }
});

// Populate account page with user data
function populateAccountData(user) {
    // Profile avatar and info
    const profileAvatarLarge = document.getElementById('profileAvatarLarge');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');

    if (profileAvatarLarge) {
        profileAvatarLarge.textContent = user.name.charAt(0).toUpperCase();
    }

    if (profileName) {
        profileName.textContent = user.name;
    }

    if (profileEmail) {
        profileEmail.textContent = user.email;
    }

    // Profile details
    const accountName = document.getElementById('accountName');
    const accountEmail = document.getElementById('accountEmail');
    const accountPhone = document.getElementById('accountPhone');
    const accountJoinDate = document.getElementById('accountJoinDate');

    if (accountName) {
        accountName.textContent = user.name;
    }

    if (accountEmail) {
        accountEmail.textContent = user.email;
    }

    if (accountPhone) {
        accountPhone.textContent = user.phone || 'Not provided';
    }

    if (accountJoinDate) {
        const joinDate = new Date(user.joinDate);
        accountJoinDate.textContent = joinDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Load user bookings from Firestore
    loadUserBookings(user.email, user.userId);

    // Check if user is admin and show admin panel link in sidebar
    if (typeof isAdminUser === 'function' && isAdminUser(user.email)) {
        const adminPanelLink = document.getElementById('adminPanelLink');
        if (adminPanelLink) {
            adminPanelLink.style.display = 'block';
            console.log('Admin panel link shown in sidebar for:', user.email);
        }

        // Update profile badge to show "Admin"
        const profileBadge = document.getElementById('profileBadge');
        if (profileBadge) {
            profileBadge.textContent = 'Admin';
            profileBadge.classList.add('admin-badge');
        }
    }
}

// Setup account page tab switching
function setupAccountTabs() {
    const tabLinks = document.querySelectorAll('.account-menu-item[data-tab]');
    const tabs = {
        'profile': document.getElementById('profileTab'),
        'bookings': document.getElementById('bookingsTab'),
        'settings': document.getElementById('settingsTab')
    };

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const tabName = this.getAttribute('data-tab');

            // Remove active class from all links and tabs
            tabLinks.forEach(l => l.classList.remove('active'));
            Object.values(tabs).forEach(t => {
                if (t) t.classList.remove('active');
            });

            // Add active class to clicked link and corresponding tab
            this.classList.add('active');
            if (tabs[tabName]) {
                tabs[tabName].classList.add('active');
            }
        });
    });
}

// Setup password change functionality
function setupPasswordChange() {
    const showPasswordFormBtn = document.getElementById('showPasswordFormBtn');
    const passwordChangeForm = document.getElementById('passwordChangeForm');
    const cancelPasswordChangeBtn = document.getElementById('cancelPasswordChangeBtn');
    const changePasswordFormElement = document.getElementById('changePasswordFormElement');
    const passwordChangeSuccess = document.getElementById('passwordChangeSuccess');

    // Show password change form
    if (showPasswordFormBtn) {
        showPasswordFormBtn.addEventListener('click', function() {
            passwordChangeForm.style.display = 'block';
            showPasswordFormBtn.style.display = 'none';
            passwordChangeSuccess.style.display = 'none';
        });
    }

    // Cancel password change
    if (cancelPasswordChangeBtn) {
        cancelPasswordChangeBtn.addEventListener('click', function() {
            passwordChangeForm.style.display = 'none';
            showPasswordFormBtn.style.display = 'inline-block';
            changePasswordFormElement.reset();
        });
    }

    // Handle password change form submission
    if (changePasswordFormElement) {
        changePasswordFormElement.addEventListener('submit', function(e) {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            // Get current user
            const currentUser = getCurrentUser();
            if (!currentUser) {
                alert('Please login first.');
                return;
            }

            // Get registered users
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const userIndex = registeredUsers.findIndex(u => u.email === currentUser.email);

            if (userIndex === -1) {
                alert('User not found.');
                return;
            }

            // Validate current password
            if (registeredUsers[userIndex].password !== currentPassword) {
                alert('Current password is incorrect.');
                document.getElementById('currentPassword').focus();
                return;
            }

            // Validate new password
            if (newPassword.length < 6) {
                alert('New password must be at least 6 characters long.');
                document.getElementById('newPassword').focus();
                return;
            }

            if (newPassword !== confirmNewPassword) {
                alert('New passwords do not match.');
                document.getElementById('confirmNewPassword').focus();
                return;
            }

            if (newPassword === currentPassword) {
                alert('New password must be different from current password.');
                document.getElementById('newPassword').focus();
                return;
            }

            // Update password
            registeredUsers[userIndex].password = newPassword;
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

            // Show success message
            changePasswordFormElement.reset();
            changePasswordFormElement.style.display = 'none';
            passwordChangeSuccess.style.display = 'block';

            // Reset form after 3 seconds
            setTimeout(function() {
                passwordChangeForm.style.display = 'none';
                showPasswordFormBtn.style.display = 'inline-block';
                passwordChangeSuccess.style.display = 'none';
            }, 3000);

            console.log('Password changed successfully for:', currentUser.email);
        });
    }
}

// ===========================
// Admin Email List
// ===========================
// Add admin email addresses here
const ADMIN_EMAILS = [
    'admin@vrundavanresort.com',
    'vishal@vrundavanresort.com'
    // Add more admin emails as needed
];

// Check if user is admin
function isAdminUser(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ===========================
// Load User Bookings from Firestore
// ===========================
function loadUserBookings(userEmail, userId) {
    // Check if Firebase is available
    if (typeof db === 'undefined') {
        console.warn('Firebase not initialized - cannot load bookings');
        return;
    }

    console.log('Loading bookings for user:', userEmail, 'userId:', userId);

    let roomBookingsCount = 0;
    let eventBookingsCount = 0;
    let upcomingRoomBookings = 0;
    let totalNights = 0;

    // Fetch room bookings for this user by userId (preferred) or email (fallback)
    const roomBookingsQuery = userId
        ? db.collection('roomBookings').where('userId', '==', userId)
        : db.collection('roomBookings').where('email', '==', userEmail);

    roomBookingsQuery
        .get()
        .then((querySnapshot) => {
            roomBookingsCount = querySnapshot.size;
            console.log('✓ Found', roomBookingsCount, 'room bookings linked to this account');

            const bookingsList = document.getElementById('bookingsList');
            if (bookingsList) {
                bookingsList.innerHTML = ''; // Clear existing content

                if (querySnapshot.size > 0) {
                    querySnapshot.forEach((doc) => {
                        const booking = doc.data();
                        const bookingCard = createRoomBookingCard(booking, doc.id);
                        bookingsList.appendChild(bookingCard);

                        // Calculate upcoming bookings and nights
                        const checkIn = new Date(booking.checkIn);
                        const checkOut = new Date(booking.checkOut);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        if (checkIn >= today) {
                            upcomingRoomBookings++;
                        }

                        // Calculate nights
                        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                        totalNights += nights;
                    });
                }
            }

            // Fetch event bookings for this user
            const eventBookingsQuery = userId
                ? db.collection('eventBookings').where('userId', '==', userId)
                : db.collection('eventBookings').where('email', '==', userEmail);

            return eventBookingsQuery.get();
        })
        .then((querySnapshot) => {
            eventBookingsCount = querySnapshot.size;
            console.log('✓ Found', eventBookingsCount, 'event bookings linked to this account');

            const bookingsList = document.getElementById('bookingsList');
            if (bookingsList && querySnapshot.size > 0) {
                querySnapshot.forEach((doc) => {
                    const booking = doc.data();
                    const bookingCard = createEventBookingCard(booking, doc.id);
                    bookingsList.appendChild(bookingCard);
                });
            }

            // Update statistics
            const totalBookings = document.getElementById('totalBookings');
            const upcomingBookings = document.getElementById('upcomingBookings');
            const totalNightsEl = document.getElementById('totalNights');

            if (totalBookings) totalBookings.textContent = roomBookingsCount + eventBookingsCount;
            if (upcomingBookings) upcomingBookings.textContent = upcomingRoomBookings;
            if (totalNightsEl) totalNightsEl.textContent = totalNights;

            // Hide or show the default message
            const bookingsInfo = document.querySelector('.bookings-info');
            if (bookingsInfo && (roomBookingsCount > 0 || eventBookingsCount > 0)) {
                bookingsInfo.style.display = 'none';
            }
        })
        .catch((error) => {
            console.error('Error loading user bookings:', error);
        });
}

// Create room booking card for display
function createRoomBookingCard(booking, docId) {
    const card = document.createElement('div');
    card.className = 'booking-card';

    const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const createdDate = booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';

    const status = booking.bookingStatus || 'pending';
    const statusClass = status.toLowerCase();

    card.innerHTML = `
        <div class="booking-header">
            <h4>🏨 Room Booking</h4>
            <span class="status-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
        <div class="booking-details">
            <p><strong>Booking ID:</strong> ${docId}</p>
            <p><strong>Room Type:</strong> ${booking.roomType}</p>
            <p><strong>Check-in:</strong> ${checkInDate}</p>
            <p><strong>Check-out:</strong> ${checkOutDate}</p>
            <p><strong>Guests:</strong> ${booking.adults} Adult(s)${booking.children > 0 ? ', ' + booking.children + ' Child(ren)' : ''}</p>
            <p><strong>Booked on:</strong> ${createdDate}</p>
            ${booking.specialRequests ? '<p><strong>Special Requests:</strong> ' + booking.specialRequests + '</p>' : ''}
            ${booking.adminNotes ? '<p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 10px;"><strong>📝 Admin Notes:</strong><br>' + booking.adminNotes + '</p>' : ''}
        </div>
    `;

    return card;
}

// Create event booking card for display
function createEventBookingCard(booking, docId) {
    const card = document.createElement('div');
    card.className = 'booking-card';

    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const createdDate = booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'N/A';

    const status = booking.bookingStatus || 'pending';
    const statusClass = status.toLowerCase();

    card.innerHTML = `
        <div class="booking-header">
            <h4>🎉 Event Booking</h4>
            <span class="status-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
        <div class="booking-details">
            <p><strong>Booking ID:</strong> ${docId}</p>
            <p><strong>Event Type:</strong> ${booking.eventType}</p>
            <p><strong>Event Date:</strong> ${eventDate}</p>
            <p><strong>Time Slot:</strong> ${booking.timeSlot || 'N/A'}</p>
            <p><strong>Expected Guests:</strong> ${booking.guests}</p>
            <p><strong>Preferred Venue:</strong> ${booking.preferredArea}</p>
            <p><strong>Booked on:</strong> ${createdDate}</p>
            ${booking.message ? '<p><strong>Additional Details:</strong> ' + booking.message + '</p>' : ''}
            ${booking.adminNotes ? '<p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin-top: 10px;"><strong>📝 Admin Notes:</strong><br>' + booking.adminNotes + '</p>' : ''}
        </div>
    `;

    return card;
}

// ===========================
// Firebase Integration for Booking Forms
// ===========================

// Helper function to format dates
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper function to run code when DOM is ready
function whenReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

// Check if Firebase is available before adding handlers
if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
    console.log('Firebase is initialized, adding booking form handlers...');

    // ===========================
    // Room Booking Form - Firebase Integration
    // ===========================
    whenReady(function() {
        const roomBookingForm = document.getElementById('roomBookingForm');

        // Skip if this is the rooms.html page (has modal booking instead)
        if (roomBookingForm && !document.getElementById('selectedRoomName')) {
            console.log('Attaching Firebase handler to room booking form...');
            // Remove existing event listener and replace with Firebase version
            roomBookingForm.addEventListener('submit', function(e) {
                e.preventDefault();

                // Get form data
                const formData = {
                    fullName: document.getElementById('roomName').value.trim(),
                    phone: document.getElementById('roomPhone').value.trim(),
                    email: document.getElementById('roomEmail').value.trim(),
                    checkIn: document.getElementById('checkIn').value,
                    checkOut: document.getElementById('checkOut').value,
                    adults: parseInt(document.getElementById('adults').value),
                    children: parseInt(document.getElementById('children').value),
                    roomType: document.getElementById('roomType').value,
                    specialRequests: document.getElementById('roomRequests').value.trim(),
                    bookingStatus: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Simple validation
                if (!formData.fullName) {
                    alert('Please enter your full name.');
                    document.getElementById('roomName').focus();
                    return;
                }

                if (!formData.phone) {
                    alert('Please enter your phone number.');
                    document.getElementById('roomPhone').focus();
                    return;
                }

                if (!formData.email) {
                    alert('Please enter your email address.');
                    document.getElementById('roomEmail').focus();
                    return;
                }

                if (!formData.checkIn || !formData.checkOut) {
                    alert('Please select check-in and check-out dates.');
                    return;
                }

                // Validate dates
                const checkInDate = new Date(formData.checkIn);
                const checkOutDate = new Date(formData.checkOut);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (checkInDate < today) {
                    alert('Check-in date cannot be in the past.');
                    document.getElementById('checkIn').focus();
                    return;
                }

                if (checkOutDate <= checkInDate) {
                    alert('Check-out date must be after check-in date.');
                    document.getElementById('checkOut').focus();
                    return;
                }

                if (!formData.adults) {
                    alert('Please select number of adults.');
                    document.getElementById('adults').focus();
                    return;
                }

                if (!formData.roomType) {
                    alert('Please select a room type.');
                    document.getElementById('roomType').focus();
                    return;
                }

                // Show loading state
                const submitButton = roomBookingForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';

                // Save to Firestore
                db.collection('roomBookings')
                    .add(formData)
                    .then((docRef) => {
                        console.log('Room booking saved with ID:', docRef.id);

                        // Calculate nights for display
                        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

                        // Format dates for display
                        const checkInFormatted = formatDate(checkInDate);
                        const checkOutFormatted = formatDate(checkOutDate);

                        // Create summary
                        const roomBookingSummary = document.getElementById('roomBookingSummary');
                        if (roomBookingSummary) {
                            let summaryHTML = `
                                <p><strong>Booking ID:</strong> ${docRef.id.substring(0, 8).toUpperCase()}</p>
                                <p><strong>Name:</strong> ${formData.fullName}</p>
                                <p><strong>Phone:</strong> ${formData.phone}</p>
                                <p><strong>Email:</strong> ${formData.email}</p>
                                <p><strong>Check-in:</strong> ${checkInFormatted}</p>
                                <p><strong>Check-out:</strong> ${checkOutFormatted}</p>
                                <p><strong>Duration:</strong> ${nights} night${nights > 1 ? 's' : ''}</p>
                                <p><strong>Guests:</strong> ${formData.adults} Adult${formData.adults > 1 ? 's' : ''}${formData.children > 0 ? ', ' + formData.children + ' Child' + (formData.children > 1 ? 'ren' : '') : ''}</p>
                                <p><strong>Room Type:</strong> ${formData.roomType}</p>
                            `;

                            if (formData.specialRequests) {
                                summaryHTML += `<p><strong>Special Requests:</strong> ${formData.specialRequests}</p>`;
                            }

                            roomBookingSummary.innerHTML = summaryHTML;
                        }

                        // Hide form and show success message
                        roomBookingForm.style.display = 'none';
                        const roomSuccessMessage = document.getElementById('roomSuccessMessage');
                        if (roomSuccessMessage) {
                            roomSuccessMessage.style.display = 'block';
                            // Scroll to success message
                            roomSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }

                        // Reset form
                        roomBookingForm.reset();
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    })
                    .catch((error) => {
                        console.error('Error saving room booking:', error);
                        alert('Error submitting booking. Please try again or contact us directly.');
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    });
            });
        } else {
            console.warn('Room booking form not found on this page.');
        }
    });

    // ===========================
    // Event Booking Form - Firebase Integration
    // ===========================
    whenReady(function() {
        const eventBookingForm = document.getElementById('eventBookingForm');

        if (eventBookingForm) {
            console.log('Attaching Firebase handler to event booking form...');
            // Remove existing event listener and replace with Firebase version
            eventBookingForm.addEventListener('submit', function(e) {
                e.preventDefault();

                // Get form data
                const formData = {
                    fullName: document.getElementById('eventName').value.trim(),
                    phone: document.getElementById('eventPhone').value.trim(),
                    email: document.getElementById('eventEmail').value.trim(),
                    eventType: document.getElementById('eventType').value,
                    guests: parseInt(document.getElementById('guests').value),
                    preferredArea: document.getElementById('venue').value,
                    eventDate: document.getElementById('eventDate').value,
                    timeSlot: document.getElementById('timeSlot').value,
                    message: document.getElementById('eventDetails').value.trim(),
                    bookingStatus: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Simple validation
                if (!formData.fullName) {
                    alert('Please enter your full name.');
                    document.getElementById('eventName').focus();
                    return;
                }

                if (!formData.phone) {
                    alert('Please enter your phone number.');
                    document.getElementById('eventPhone').focus();
                    return;
                }

                if (!formData.email) {
                    alert('Please enter your email address.');
                    document.getElementById('eventEmail').focus();
                    return;
                }

                if (!formData.eventType) {
                    alert('Please select an event type.');
                    document.getElementById('eventType').focus();
                    return;
                }

                if (!formData.guests || formData.guests < 10) {
                    alert('Please enter a valid number of expected guests (minimum 10).');
                    document.getElementById('guests').focus();
                    return;
                }

                if (!formData.preferredArea) {
                    alert('Please select a preferred venue.');
                    document.getElementById('venue').focus();
                    return;
                }

                if (!formData.eventDate) {
                    alert('Please select an event date.');
                    document.getElementById('eventDate').focus();
                    return;
                }

                // Validate event date is not in the past
                const eventDate = new Date(formData.eventDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (eventDate < today) {
                    alert('Event date cannot be in the past.');
                    document.getElementById('eventDate').focus();
                    return;
                }

                if (!formData.timeSlot) {
                    alert('Please select a preferred time slot.');
                    document.getElementById('timeSlot').focus();
                    return;
                }

                // Show loading state
                const submitButton = eventBookingForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';

                // Save to Firestore
                db.collection('eventBookings')
                    .add(formData)
                    .then((docRef) => {
                        console.log('Event booking saved with ID:', docRef.id);

                        // Format event date for display
                        const eventDateFormatted = formatDate(eventDate);

                        // Create summary
                        const eventBookingSummary = document.getElementById('eventBookingSummary');
                        if (eventBookingSummary) {
                            let summaryHTML = `
                                <p><strong>Booking ID:</strong> ${docRef.id.substring(0, 8).toUpperCase()}</p>
                                <p><strong>Name:</strong> ${formData.fullName}</p>
                                <p><strong>Phone:</strong> ${formData.phone}</p>
                                <p><strong>Email:</strong> ${formData.email}</p>
                                <p><strong>Event Type:</strong> ${formData.eventType}</p>
                                <p><strong>Expected Guests:</strong> ${formData.guests}</p>
                                <p><strong>Preferred Venue:</strong> ${formData.preferredArea}</p>
                                <p><strong>Event Date:</strong> ${eventDateFormatted}</p>
                                <p><strong>Time Slot:</strong> ${formData.timeSlot}</p>
                            `;

                            if (formData.message) {
                                summaryHTML += `<p><strong>Additional Details:</strong> ${formData.message}</p>`;
                            }

                            eventBookingSummary.innerHTML = summaryHTML;
                        }

                        // Hide form and show success message
                        eventBookingForm.style.display = 'none';
                        const eventSuccessMessage = document.getElementById('eventSuccessMessage');
                        if (eventSuccessMessage) {
                            eventSuccessMessage.style.display = 'block';
                            // Scroll to success message
                            eventSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }

                        // Reset form
                        eventBookingForm.reset();
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    })
                    .catch((error) => {
                        console.error('Error saving event booking:', error);
                        alert('Error submitting booking. Please try again or contact us directly.');
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    });
            });
        } else {
            console.warn('Event booking form not found on this page.');
        }
    });
} else {
    console.warn('Firebase not initialized - booking forms will NOT work. Please check firebase-config.js');
}

