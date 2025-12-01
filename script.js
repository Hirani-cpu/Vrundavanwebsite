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
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navLinksContainer.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);

            if (!isClickInsideNav && !isClickOnHamburger && navLinksContainer.classList.contains('active')) {
                navLinksContainer.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });

        // Close menu when clicking on a nav link
        const navLinks = navLinksContainer.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navLinksContainer.classList.remove('active');
                hamburger.classList.remove('active');
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
    // Room Booking Form
    // ===========================

    const roomBookingForm = document.getElementById('roomBookingForm');
    const roomSuccessMessage = document.getElementById('roomSuccessMessage');
    const roomBookingSummary = document.getElementById('roomBookingSummary');

    if (roomBookingForm) {
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
    // Event Booking Form
    // ===========================

    const eventBookingForm = document.getElementById('eventBookingForm');
    const eventSuccessMessage = document.getElementById('eventSuccessMessage');
    const eventBookingSummary = document.getElementById('eventBookingSummary');

    if (eventBookingForm) {
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
        generalEnquiryForm.addEventListener('submit', function(e) {
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

            // Hide form and show success message
            generalEnquiryForm.style.display = 'none';
            enquirySuccessMessage.style.display = 'block';

            // Scroll to success message
            enquirySuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
// Login Form Handler
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            // Validation
            if (!email) {
                alert('Please enter your email address.');
                document.getElementById('loginEmail').focus();
                return;
            }

            if (!password) {
                alert('Please enter your password.');
                document.getElementById('loginPassword').focus();
                return;
            }

            // Simple email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                alert('Please enter a valid email address.');
                document.getElementById('loginEmail').focus();
                return;
            }

            // Hide form and show success
            loginForm.style.display = 'none';
            document.getElementById('loginSuccessMessage').style.display = 'block';

            // Scroll to success message
            document.getElementById('loginSuccessMessage').scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Simulate redirect after 3 seconds
            setTimeout(function() {
                console.log('User logged in with:', email);
            }, 3000);
        });
    }
});

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

    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Update navigation based on login state
function updateNavigationState() {
    const currentUser = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const userNav = document.getElementById('userNav');

    if (currentUser && loginLink && userNav) {
        // User is logged in - show user info, hide login button
        loginLink.style.display = 'none';
        userNav.style.display = 'flex';

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

            // Check if user exists in registered users
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            const user = registeredUsers.find(u => u.email === email && u.password === password);

            if (user) {
                // Login successful
                const currentUser = {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    joinDate: user.joinDate
                };

                saveUser(currentUser);

                // Hide form and show success
                loginForm.style.display = 'none';
                loginSuccessMessage.style.display = 'block';

                // Redirect to account page after 2 seconds
                setTimeout(function() {
                    window.location.href = 'account.html';
                }, 2000);
            } else {
                alert('Invalid email or password. Please try again or create a new account.');
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

            // Setup delete account button
            const deleteAccountBtn = document.getElementById('deleteAccountBtn');
            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', handleDeleteAccount);
            }
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

    // Stats (placeholder values for now)
    const totalBookings = document.getElementById('totalBookings');
    const upcomingBookings = document.getElementById('upcomingBookings');
    const totalNights = document.getElementById('totalNights');

    if (totalBookings) totalBookings.textContent = '0';
    if (upcomingBookings) upcomingBookings.textContent = '0';
    if (totalNights) totalNights.textContent = '0';
}

// Setup account page tab switching
function setupAccountTabs() {
    const tabLinks = document.querySelectorAll('.account-menu-item');
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

// Handle account deletion
function handleDeleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');

    if (confirmed) {
        const doubleConfirm = confirm('This will permanently delete all your data. Are you absolutely sure?');

        if (doubleConfirm) {
            const currentUser = getCurrentUser();

            if (currentUser) {
                // Remove user from registered users
                const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                const updatedUsers = registeredUsers.filter(u => u.email !== currentUser.email);
                localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

                // Remove current user session
                localStorage.removeItem('currentUser');

                alert('Your account has been deleted successfully.');
                window.location.href = 'index.html';
            }
        }
    }
}
