// ===========================
// Admin Dashboard Logic
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthStatus();

    // Tab switching
    setupTabs();

    // Logout functionality
    setupLogout();

    // Load initial data
    loadRoomBookings();
    loadEventBookings();

    // Refresh buttons
    document.getElementById('refreshRoomBookings').addEventListener('click', function() {
        loadRoomBookings();
    });

    document.getElementById('refreshEventBookings').addEventListener('click', function() {
        loadEventBookings();
    });
});

// ===========================
// Authentication Guard
// ===========================
function checkAuthStatus() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is logged in
            const adminLoggedIn = localStorage.getItem('adminLoggedIn');
            const adminEmail = localStorage.getItem('adminEmail');

            if (adminLoggedIn === 'true' && adminEmail) {
                // Display admin email
                document.getElementById('adminEmailDisplay').textContent = adminEmail;
            } else {
                // Redirect to login
                redirectToLogin();
            }
        } else {
            // No user logged in, redirect to login
            redirectToLogin();
        }
    });
}

function redirectToLogin() {
    console.log('Not authenticated, redirecting to login...');
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminEmail');
    window.location.href = 'admin.html';
}

// ===========================
// Logout Functionality
// ===========================
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            auth.signOut().then(() => {
                localStorage.removeItem('adminLoggedIn');
                localStorage.removeItem('adminEmail');
                console.log('Admin logged out successfully');
                window.location.href = 'admin.html';
            }).catch((error) => {
                console.error('Logout error:', error);
                alert('Error logging out. Please try again.');
            });
        }
    });
}

// ===========================
// Tab Switching
// ===========================
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected tab content
            if (tabName === 'rooms') {
                document.getElementById('roomsTab').classList.add('active');
            } else if (tabName === 'events') {
                document.getElementById('eventsTab').classList.add('active');
            }
        });
    });
}

// ===========================
// Load Room Bookings from Firestore
// ===========================
function loadRoomBookings() {
    const loadingEl = document.getElementById('roomBookingsLoading');
    const tableEl = document.getElementById('roomBookingsTable');
    const noBookingsEl = document.getElementById('noRoomBookings');
    const tableBody = document.getElementById('roomBookingsTableBody');

    // Show loading
    loadingEl.style.display = 'block';
    tableEl.style.display = 'none';
    noBookingsEl.style.display = 'none';

    // Fetch data from Firestore - ordered by creation date (newest first)
    db.collection('roomBookings')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            // Clear table
            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                // No bookings
                loadingEl.style.display = 'none';
                noBookingsEl.style.display = 'block';
                updateStats(0, null);
            } else {
                // Has bookings
                loadingEl.style.display = 'none';
                tableEl.style.display = 'block';

                querySnapshot.forEach((doc) => {
                    const booking = doc.data();
                    const row = createRoomBookingRow(booking, doc.id);
                    tableBody.appendChild(row);
                });

                updateStats(querySnapshot.size, null);
            }
        })
        .catch((error) => {
            console.error('Error loading room bookings:', error);
            loadingEl.innerHTML = '<p style="color: red;">Error loading bookings. Please refresh.</p>';
            updateStats(0, null);
        });
}

// Create table row for room booking
function createRoomBookingRow(booking, docId) {
    const row = document.createElement('tr');

    // Format created date
    const createdDate = booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleString() : 'N/A';

    // Format check-in and check-out dates
    const checkInDate = booking.checkIn || 'N/A';
    const checkOutDate = booking.checkOut || 'N/A';

    // Format guests
    const guests = `${booking.adults || 0} Adults${booking.children > 0 ? ', ' + booking.children + ' Children' : ''}`;

    // Status
    const status = booking.bookingStatus || 'pending';
    const statusClass = status.toLowerCase();

    row.innerHTML = `
        <td>${createdDate}</td>
        <td><strong>${booking.fullName || 'N/A'}</strong></td>
        <td>
            ${booking.phone || 'N/A'}<br>
            <small style="color: #666;">${booking.email || 'N/A'}</small>
        </td>
        <td>${checkInDate}</td>
        <td>${checkOutDate}</td>
        <td>${guests}</td>
        <td>${booking.roomType || 'N/A'}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
    `;

    return row;
}

// ===========================
// Load Event Bookings from Firestore
// ===========================
function loadEventBookings() {
    const loadingEl = document.getElementById('eventBookingsLoading');
    const tableEl = document.getElementById('eventBookingsTable');
    const noBookingsEl = document.getElementById('noEventBookings');
    const tableBody = document.getElementById('eventBookingsTableBody');

    // Show loading
    loadingEl.style.display = 'block';
    tableEl.style.display = 'none';
    noBookingsEl.style.display = 'none';

    // Fetch data from Firestore - ordered by creation date (newest first)
    db.collection('eventBookings')
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            // Clear table
            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                // No bookings
                loadingEl.style.display = 'none';
                noBookingsEl.style.display = 'block';
                updateStats(null, 0);
            } else {
                // Has bookings
                loadingEl.style.display = 'none';
                tableEl.style.display = 'block';

                querySnapshot.forEach((doc) => {
                    const booking = doc.data();
                    const row = createEventBookingRow(booking, doc.id);
                    tableBody.appendChild(row);
                });

                updateStats(null, querySnapshot.size);
            }
        })
        .catch((error) => {
            console.error('Error loading event bookings:', error);
            loadingEl.innerHTML = '<p style="color: red;">Error loading bookings. Please refresh.</p>';
            updateStats(null, 0);
        });
}

// Create table row for event booking
function createEventBookingRow(booking, docId) {
    const row = document.createElement('tr');

    // Format created date
    const createdDate = booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleString() : 'N/A';

    // Format event date
    const eventDate = booking.eventDate || 'N/A';
    const timeSlot = booking.timeSlot || '';

    // Status
    const status = booking.bookingStatus || 'pending';
    const statusClass = status.toLowerCase();

    row.innerHTML = `
        <td>${createdDate}</td>
        <td><strong>${booking.fullName || 'N/A'}</strong></td>
        <td>
            ${booking.phone || 'N/A'}<br>
            <small style="color: #666;">${booking.email || 'N/A'}</small>
        </td>
        <td>${booking.eventType || 'N/A'}</td>
        <td>${eventDate}${timeSlot ? '<br><small>' + timeSlot + '</small>' : ''}</td>
        <td>${booking.guests || 'N/A'}</td>
        <td>${booking.preferredArea || 'N/A'}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
    `;

    return row;
}

// ===========================
// Update Statistics
// ===========================
let roomCount = 0;
let eventCount = 0;

function updateStats(rooms, events) {
    if (rooms !== null) {
        roomCount = rooms;
        document.getElementById('roomBookingsCount').textContent = rooms;
    }

    if (events !== null) {
        eventCount = events;
        document.getElementById('eventBookingsCount').textContent = events;
    }

    // Update total
    const total = roomCount + eventCount;
    document.getElementById('totalBookingsCount').textContent = total;
}
