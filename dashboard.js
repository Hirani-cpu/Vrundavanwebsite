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
    // SIMPLE AUTH CHECK - No more annoying password prompts!
    auth.onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
            // Firebase Auth session exists - admin is logged in!
            console.log('✅ Admin authenticated via Firebase Auth:', firebaseUser.email);

            // Check if user is actually an admin
            const ADMIN_EMAILS = [
                'admin@vrundavanresort.com',
                'vishal@vrundavanresort.com'
            ];

            if (ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase())) {
                // Valid admin user
                document.getElementById('adminEmailDisplay').textContent = firebaseUser.email;
                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminEmail', firebaseUser.email);
                console.log('✅ Admin access granted');
            } else {
                // Logged in but not an admin
                alert('You do not have admin access. This page is restricted to administrators only.');
                window.location.href = 'account.html';
            }
        } else {
            // Not logged in at all - redirect to login page
            console.log('❌ No Firebase auth session found');
            redirectToLogin();
        }
    });
}

function getCurrentUser() {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

function redirectToLogin() {
    console.log('Not authenticated, redirecting to login...');
    alert('Please login to access the admin dashboard.');
    window.location.href = 'login.html';
}

// ===========================
// Logout Functionality
// ===========================
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear localStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');

            // Sign out from Firebase Auth if logged in
            auth.signOut().then(() => {
                console.log('Logged out successfully');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Logout error:', error);
                // Still redirect even if Firebase logout fails
                window.location.href = 'index.html';
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
            const tabMap = {
                'rooms': 'roomsTab',
                'events': 'eventsTab',
                'messages': 'messagesTab',
                'manage-rooms': 'manageRoomsTab',
                'manage-menu': 'manageMenuTab',
                'manage-gallery': 'manageGalleryTab',
                'site-settings': 'siteSettingsTab'
            };

            const contentId = tabMap[tabName];
            if (contentId) {
                document.getElementById(contentId).classList.add('active');
            }

            // Load data for management tabs
            if (tabName === 'messages' && typeof loadMessages === 'function') {
                loadMessages();
            }
            if (tabName === 'manage-rooms' && typeof loadRoomsList === 'function') {
                loadRoomsList();
            }
            if (tabName === 'manage-menu' && typeof loadMenuList === 'function') {
                loadMenuList();
            }
            if (tabName === 'manage-gallery' && typeof loadGalleryList === 'function') {
                loadGalleryList();
            }
            if (tabName === 'site-settings' && typeof loadSiteSettings === 'function') {
                loadSiteSettings();
            }
        });
    });
}

// ===========================
// Load Room Bookings from Firestore (Grouped by Date)
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

    console.log('Fetching room bookings from Firestore...');

    db.collection('roomBookings')
        .get()
        .then((querySnapshot) => {
            console.log('Room bookings query successful. Count:', querySnapshot.size);
            // Clear table
            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                loadingEl.style.display = 'none';
                noBookingsEl.style.display = 'block';
                updateStats(0, null);
            } else {
                // Group bookings by check-in date
                const bookingsByDate = {};

                querySnapshot.forEach((doc) => {
                    const booking = doc.data();
                    const checkInDate = booking.checkIn || 'No Date';

                    if (!bookingsByDate[checkInDate]) {
                        bookingsByDate[checkInDate] = [];
                    }

                    bookingsByDate[checkInDate].push({
                        id: doc.id,
                        data: booking
                    });
                });

                // Sort dates
                const sortedDates = Object.keys(bookingsByDate).sort((a, b) => {
                    if (a === 'No Date') return 1;
                    if (b === 'No Date') return -1;
                    return new Date(b) - new Date(a); // Newest first
                });

                // Create grouped rows
                sortedDates.forEach(date => {
                    // Add date header row
                    const dateHeaderRow = createDateHeaderRow(date, bookingsByDate[date].length);
                    tableBody.appendChild(dateHeaderRow);

                    // Add booking rows for this date
                    bookingsByDate[date].forEach(booking => {
                        const row = createRoomBookingRow(booking.data, booking.id);
                        tableBody.appendChild(row);
                    });
                });

                loadingEl.style.display = 'none';
                tableEl.style.display = 'block';
                updateStats(querySnapshot.size, null);
            }
        })
        .catch((error) => {
            console.error('Error loading room bookings:', error);
            loadingEl.innerHTML = '<p style="color: red;">Error loading bookings. Please refresh.</p>';
            updateStats(0, null);
        });
}

// Create date header row
function createDateHeaderRow(date, count) {
    const row = document.createElement('tr');
    row.className = 'date-header-row';

    const formattedDate = date === 'No Date' ? 'No Check-in Date' : new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    row.innerHTML = `
        <td colspan="8" style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; font-weight: bold; padding: 12px 15px; font-size: 1.05rem;">
            📅 ${formattedDate} <span style="opacity: 0.9; font-size: 0.9rem;">(${count} booking${count !== 1 ? 's' : ''})</span>
        </td>
    `;

    row.style.cursor = 'default';

    return row;
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

    // Add click handler to open modal
    row.addEventListener('click', function() {
        openBookingModal(docId, 'room', booking);
    });

    row.style.cursor = 'pointer';

    return row;
}

// ===========================
// Load Event Bookings from Firestore (Grouped by Date)
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

    db.collection('eventBookings')
        .get()
        .then((querySnapshot) => {
            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                loadingEl.style.display = 'none';
                noBookingsEl.style.display = 'block';
                updateStats(null, 0);
            } else {
                // Group bookings by event date
                const bookingsByDate = {};

                querySnapshot.forEach((doc) => {
                    const booking = doc.data();
                    const eventDate = booking.eventDate || 'No Date';

                    if (!bookingsByDate[eventDate]) {
                        bookingsByDate[eventDate] = [];
                    }

                    bookingsByDate[eventDate].push({
                        id: doc.id,
                        data: booking
                    });
                });

                // Sort dates
                const sortedDates = Object.keys(bookingsByDate).sort((a, b) => {
                    if (a === 'No Date') return 1;
                    if (b === 'No Date') return -1;
                    return new Date(b) - new Date(a); // Newest first
                });

                // Create grouped rows
                sortedDates.forEach(date => {
                    // Add date header row
                    const dateHeaderRow = createEventDateHeaderRow(date, bookingsByDate[date].length);
                    tableBody.appendChild(dateHeaderRow);

                    // Add booking rows for this date
                    bookingsByDate[date].forEach(booking => {
                        const row = createEventBookingRow(booking.data, booking.id);
                        tableBody.appendChild(row);
                    });
                });

                loadingEl.style.display = 'none';
                tableEl.style.display = 'block';
                updateStats(null, querySnapshot.size);
            }
        })
        .catch((error) => {
            console.error('Error loading event bookings:', error);
            loadingEl.innerHTML = '<p style="color: red;">Error loading bookings. Please refresh.</p>';
            updateStats(null, 0);
        });
}

// Create date header row for events
function createEventDateHeaderRow(date, count) {
    const row = document.createElement('tr');
    row.className = 'date-header-row';

    const formattedDate = date === 'No Date' ? 'No Event Date' : new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    row.innerHTML = `
        <td colspan="8" style="background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%); color: white; font-weight: bold; padding: 12px 15px; font-size: 1.05rem;">
            🎉 ${formattedDate} <span style="opacity: 0.9; font-size: 0.9rem;">(${count} event${count !== 1 ? 's' : ''})</span>
        </td>
    `;

    row.style.cursor = 'default';

    return row;
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

    // Add click handler to open modal
    row.addEventListener('click', function() {
        openBookingModal(docId, 'event', booking);
    });

    row.style.cursor = 'pointer';

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

// ===========================
// Modal Management System
// ===========================
let currentBookingId = null;
let currentBookingType = null;
let currentBookingData = null;

// Open modal with booking details
function openBookingModal(bookingId, bookingType, bookingData) {
    currentBookingId = bookingId;
    currentBookingType = bookingType;
    currentBookingData = bookingData;

    const modal = document.getElementById('bookingModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const adminNotes = document.getElementById('adminNotes');

    // Set title
    modalTitle.textContent = bookingType === 'room' ? '🏨 Room Booking Details' : '🎉 Event Booking Details';

    // Clear previous notes
    adminNotes.value = bookingData.adminNotes || '';

    // Generate modal content based on booking type
    if (bookingType === 'room') {
        modalBody.innerHTML = generateRoomBookingDetails(bookingData, bookingId);
    } else {
        modalBody.innerHTML = generateEventBookingDetails(bookingData, bookingId);
    }

    // Show modal
    modal.style.display = 'block';
}

// Generate room booking details HTML
function generateRoomBookingDetails(booking, docId) {
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

    const createdDate = booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleString('en-US') : 'N/A';

    const status = booking.bookingStatus || 'pending';
    const statusColor = status === 'confirmed' ? '#28a745' : status === 'rejected' ? '#dc3545' : '#ffc107';

    return `
        <div class="booking-detail-item">
            <label>Booking ID</label>
            <div class="value">${docId}</div>
        </div>
        <div class="booking-detail-item">
            <label>Current Status</label>
            <div class="value">
                <span class="booking-status-display" style="background: ${statusColor}; color: white;">
                    ${status.toUpperCase()}
                </span>
            </div>
        </div>
        <div class="booking-detail-item">
            <label>Guest Name</label>
            <div class="value">${booking.fullName || 'N/A'}</div>
        </div>
        <div class="booking-detail-item">
            <label>Contact Information</label>
            <div class="value">
                📞 ${booking.phone || 'N/A'}<br>
                📧 ${booking.email || 'N/A'}
            </div>
        </div>
        <div class="booking-detail-item">
            <label>Check-in Date</label>
            <div class="value">${checkInDate}</div>
        </div>
        <div class="booking-detail-item">
            <label>Check-out Date</label>
            <div class="value">${checkOutDate}</div>
        </div>
        <div class="booking-detail-item">
            <label>Room Type</label>
            <div class="value">${booking.roomType || 'N/A'}</div>
        </div>
        <div class="booking-detail-item">
            <label>Number of Rooms</label>
            <div class="value" style="font-size: 1.2rem; font-weight: 700; color: #2d5016;">${booking.numberOfRooms || 1} Room${(booking.numberOfRooms || 1) > 1 ? 's' : ''}</div>
        </div>
        <div class="booking-detail-item">
            <label>Guests</label>
            <div class="value">${booking.adults || 0} Adult(s)${booking.children > 0 ? ', ' + booking.children + ' Child(ren)' : ''}</div>
        </div>
        ${booking.specialRequests ? `
        <div class="booking-detail-item">
            <label>Special Requests</label>
            <div class="value">${booking.specialRequests}</div>
        </div>
        ` : ''}
        <div class="booking-detail-item">
            <label>Booking Submitted On</label>
            <div class="value">${createdDate}</div>
        </div>
        ${booking.adminNotes ? `
        <div class="booking-detail-item">
            <label>Previous Admin Notes</label>
            <div class="value">${booking.adminNotes}</div>
        </div>
        ` : ''}
    `;
}

// Generate event booking details HTML
function generateEventBookingDetails(booking, docId) {
    const eventDate = new Date(booking.eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const createdDate = booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleString('en-US') : 'N/A';

    const status = booking.bookingStatus || 'pending';
    const statusColor = status === 'confirmed' ? '#28a745' : status === 'rejected' ? '#dc3545' : '#ffc107';

    return `
        <div class="booking-detail-item">
            <label>Booking ID</label>
            <div class="value">${docId}</div>
        </div>
        <div class="booking-detail-item">
            <label>Current Status</label>
            <div class="value">
                <span class="booking-status-display" style="background: ${statusColor}; color: white;">
                    ${status.toUpperCase()}
                </span>
            </div>
        </div>
        <div class="booking-detail-item">
            <label>Guest Name</label>
            <div class="value">${booking.fullName || 'N/A'}</div>
        </div>
        <div class="booking-detail-item">
            <label>Contact Information</label>
            <div class="value">
                📞 ${booking.phone || 'N/A'}<br>
                📧 ${booking.email || 'N/A'}
            </div>
        </div>
        <div class="booking-detail-item">
            <label>Event Type</label>
            <div class="value">${booking.eventType || 'N/A'}</div>
        </div>
        <div class="booking-detail-item">
            <label>Event Date</label>
            <div class="value">${eventDate}</div>
        </div>
        <div class="booking-detail-item">
            <label>Time Slot</label>
            <div class="value">${booking.timeSlot || 'N/A'}</div>
        </div>
        <div class="booking-detail-item">
            <label>Expected Guests</label>
            <div class="value">${booking.guests || 'N/A'}</div>
        </div>
        <div class="booking-detail-item">
            <label>Preferred Venue</label>
            <div class="value">${booking.preferredArea || 'N/A'}</div>
        </div>
        ${booking.message ? `
        <div class="booking-detail-item">
            <label>Additional Details</label>
            <div class="value">${booking.message}</div>
        </div>
        ` : ''}
        <div class="booking-detail-item">
            <label>Booking Submitted On</label>
            <div class="value">${createdDate}</div>
        </div>
        ${booking.adminNotes ? `
        <div class="booking-detail-item">
            <label>Previous Admin Notes</label>
            <div class="value">${booking.adminNotes}</div>
        </div>
        ` : ''}
    `;
}

// Close modal
function closeModal() {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    currentBookingId = null;
    currentBookingType = null;
    currentBookingData = null;
}

// Update booking status in Firestore
function updateBookingStatus(status) {
    if (!currentBookingId || !currentBookingType) {
        alert('Error: No booking selected');
        return;
    }

    const adminNotes = document.getElementById('adminNotes').value.trim();
    const collection = currentBookingType === 'room' ? 'roomBookings' : 'eventBookings';

    // Confirm action
    const confirmMessage = status === 'confirmed'
        ? 'Are you sure you want to APPROVE this booking?'
        : 'Are you sure you want to REJECT this booking?';

    if (!confirm(confirmMessage)) {
        return;
    }

    // Disable buttons during update
    const btnApprove = document.getElementById('btnApprove');
    const btnReject = document.getElementById('btnReject');
    btnApprove.disabled = true;
    btnReject.disabled = true;
    btnApprove.textContent = 'Updating...';
    btnReject.textContent = 'Updating...';

    // Prepare update data
    const updateData = {
        bookingStatus: status,
        updatedAt: new Date().toISOString()
    };

    if (adminNotes) {
        updateData.adminNotes = adminNotes;
    }

    console.log('Preparing update for booking:', currentBookingId);
    console.log('Collection:', collection);
    console.log('Status:', status);
    console.log('Admin notes:', adminNotes || 'none');

    // Update in Firestore
    console.log('Updating booking:', currentBookingId, 'in collection:', collection);
    console.log('Update data:', updateData);

    // Add timeout fallback
    let updateTimeout = setTimeout(() => {
        console.error('Update timeout - operation taking too long');
        alert('Update is taking too long. Please check your internet connection and try again.');
        btnApprove.disabled = false;
        btnReject.disabled = false;
        btnApprove.textContent = '✓ Approve Booking';
        btnReject.textContent = '✗ Reject Booking';
    }, 10000); // 10 second timeout

    // Try using set with merge instead of update
    db.collection(collection)
        .doc(currentBookingId)
        .set(updateData, { merge: true })
        .then(() => {
            clearTimeout(updateTimeout); // Clear the timeout
            console.log('Booking updated successfully');

            // Re-enable buttons first
            btnApprove.disabled = false;
            btnReject.disabled = false;
            btnApprove.textContent = '✓ Approve Booking';
            btnReject.textContent = '✗ Reject Booking';

            // Close modal first
            closeModal();

            // Show success alert
            alert(`Booking ${status === 'confirmed' ? 'APPROVED' : 'REJECTED'} successfully!`);

            // Reload bookings immediately after alert is dismissed
            if (currentBookingType === 'room') {
                loadRoomBookings();
            } else {
                loadEventBookings();
            }
        })
        .catch((error) => {
            clearTimeout(updateTimeout); // Clear the timeout
            console.error('Error updating booking:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Full error object:', error);

            // Show detailed error message
            if (error.code === 'permission-denied') {
                alert('Permission denied! Please update Firestore security rules to allow updates.\n\nGo to Firebase Console → Firestore Database → Rules\nand ensure "allow read, write: if true;" is set for both collections.');
            } else {
                alert('Error updating booking: ' + error.message + '\n\nError Code: ' + error.code + '\n\nCheck browser console for details.');
            }

            // Re-enable buttons
            btnApprove.disabled = false;
            btnReject.disabled = false;
            btnApprove.textContent = '✓ Approve Booking';
            btnReject.textContent = '✗ Reject Booking';
        });
}

// Delete booking from Firestore
function deleteBooking() {
    if (!currentBookingId || !currentBookingType) {
        alert('Error: No booking selected');
        return;
    }

    const collection = currentBookingType === 'room' ? 'roomBookings' : 'eventBookings';

    // Strong confirmation for delete action
    if (!confirm('⚠️ Are you sure you want to DELETE this booking?\n\nThis action CANNOT be undone!\n\nThe booking will be permanently removed from the system.')) {
        return;
    }

    // Disable all buttons during delete
    const btnApprove = document.getElementById('btnApprove');
    const btnReject = document.getElementById('btnReject');
    const btnDelete = document.getElementById('btnDelete');
    const btnCancel = document.getElementById('btnCancelModal');

    btnApprove.disabled = true;
    btnReject.disabled = true;
    btnDelete.disabled = true;
    btnCancel.disabled = true;

    const originalDeleteText = btnDelete.textContent;
    btnDelete.textContent = 'Deleting...';

    console.log('Deleting booking:', currentBookingId, 'from collection:', collection);

    // Add timeout fallback
    let deleteTimeout = setTimeout(() => {
        console.error('Delete timeout - operation taking too long');
        alert('Delete is taking too long. Please check your internet connection and try again.');
        btnApprove.disabled = false;
        btnReject.disabled = false;
        btnDelete.disabled = false;
        btnCancel.disabled = false;
        btnDelete.textContent = originalDeleteText;
    }, 10000); // 10 second timeout

    // Delete from Firestore
    db.collection(collection)
        .doc(currentBookingId)
        .delete()
        .then(() => {
            clearTimeout(deleteTimeout); // Clear the timeout
            console.log('Booking deleted successfully');

            // Re-enable buttons first
            btnApprove.disabled = false;
            btnReject.disabled = false;
            btnDelete.disabled = false;
            btnCancel.disabled = false;
            btnDelete.textContent = originalDeleteText;

            // Close modal first
            closeModal();

            // Show success alert
            alert('✅ Booking deleted successfully!');

            // Reload bookings immediately after alert is dismissed
            if (currentBookingType === 'room') {
                loadRoomBookings();
            } else {
                loadEventBookings();
            }
        })
        .catch((error) => {
            clearTimeout(deleteTimeout); // Clear the timeout
            console.error('Error deleting booking:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            // Show detailed error message
            if (error.code === 'permission-denied') {
                alert('❌ Permission denied!\n\nPlease update Firestore security rules to allow deletes.\n\nGo to Firebase Console → Firestore Database → Rules\nand ensure "allow read, write: if true;" is set for both collections.');
            } else {
                alert('❌ Error deleting booking: ' + error.message + '\n\nError Code: ' + error.code + '\n\nCheck browser console for details.');
            }

            // Re-enable buttons
            btnApprove.disabled = false;
            btnReject.disabled = false;
            btnDelete.disabled = false;
            btnCancel.disabled = false;
            btnDelete.textContent = originalDeleteText;
        });
}

// Setup modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close modal button
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('btnCancelModal').addEventListener('click', closeModal);

    // Click outside modal to close
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('bookingModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Approve button
    document.getElementById('btnApprove').addEventListener('click', function() {
        updateBookingStatus('confirmed');
    });

    // Reject button
    document.getElementById('btnReject').addEventListener('click', function() {
        updateBookingStatus('rejected');
    });

    // Delete button
    document.getElementById('btnDelete').addEventListener('click', function() {
        deleteBooking();
    });

    // ===========================
    // Site Settings Functionality
    // ===========================

    // Site Settings Form Submit
    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSiteSettings();
        });
    }
});

// ===========================
// Site Settings Functions
// ===========================

// Load site settings from Firebase
function loadSiteSettings() {
    const loadingMessage = document.getElementById('settingsLoadingMessage');
    const form = document.getElementById('siteSettingsForm');

    loadingMessage.style.display = 'block';
    form.style.display = 'none';

    console.log('Loading site settings...');

    // Get settings from Firebase (stored in 'siteSettings' collection with a single document ID 'main')
    db.collection('siteSettings')
        .doc('main')
        .get()
        .then((doc) => {
            if (doc.exists) {
                const settings = doc.data();
                console.log('Settings loaded:', settings);

                // Populate form with existing settings
                document.getElementById('siteName').value = settings.siteName || '';
                document.getElementById('siteTagline').value = settings.siteTagline || '';
                document.getElementById('siteLogoUrl').value = settings.siteLogoUrl || '';

                // Show logo preview
                const logoPreview = document.getElementById('currentLogoPreview');
                if (settings.siteLogoUrl) {
                    logoPreview.innerHTML = `<img src="${settings.siteLogoUrl}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;">`;
                }

                document.getElementById('contactPhone1').value = settings.contactPhone1 || '';
                document.getElementById('contactPhone2').value = settings.contactPhone2 || '';
                document.getElementById('contactEmail1').value = settings.contactEmail1 || '';
                document.getElementById('contactEmail2').value = settings.contactEmail2 || '';
                document.getElementById('contactAddress').value = settings.contactAddress || '';
                document.getElementById('contactWhatsApp').value = settings.contactWhatsApp || '';
                document.getElementById('checkInTime').value = settings.checkInTime || '';
                document.getElementById('checkOutTime').value = settings.checkOutTime || '';
                document.getElementById('restaurantHours').value = settings.restaurantHours || '';
                document.getElementById('receptionHours').value = settings.receptionHours || '';
                document.getElementById('poolHours').value = settings.poolHours || '';
                document.getElementById('socialFacebook').value = settings.facebookUrl || '';
                document.getElementById('socialInstagram').value = settings.instagramUrl || '';
                document.getElementById('socialTwitter').value = settings.twitterUrl || '';
            } else {
                console.log('No settings found. Using defaults.');
                // Set default values
                document.getElementById('siteName').value = 'Vrundavan Resort & Restaurant';
                document.getElementById('siteTagline').value = 'Your perfect destination for relaxation, dining, and celebrations in the heart of nature';
                document.getElementById('siteLogo').value = '🌳';
                document.getElementById('contactPhone1').value = '+91 98765 43210';
                document.getElementById('contactPhone2').value = '+91 98765 43211';
                document.getElementById('contactEmail1').value = 'info@vrundavanresort.com';
                document.getElementById('contactEmail2').value = 'bookings@vrundavanresort.com';
                document.getElementById('contactAddress').value = 'Countryside Location';
                document.getElementById('checkInTime').value = '12:00 PM onwards';
                document.getElementById('checkOutTime').value = '11:00 AM';
                document.getElementById('restaurantHours').value = '8:00 AM - 11:00 PM';
                document.getElementById('receptionHours').value = '24/7';
                document.getElementById('poolHours').value = '6:00 AM - 8:00 PM';
            }

            loadingMessage.style.display = 'none';
            form.style.display = 'block';
        })
        .catch((error) => {
            console.error('Error loading settings:', error);
            loadingMessage.innerHTML = '<p style="color: red;">Error loading settings. Please refresh.</p>';
        });
}

// EXTREME compression for INSTANT upload
async function compressLogoImage(file, maxWidth = 200, quality = 0.5) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');

                // ALWAYS resize to exactly maxWidth for consistent tiny size
                const aspectRatio = img.width / img.height;
                let width, height;

                if (aspectRatio > 1) {
                    width = maxWidth;
                    height = maxWidth / aspectRatio;
                } else {
                    height = maxWidth;
                    width = maxWidth * aspectRatio;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');

                // Disable image smoothing for faster processing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'low';

                ctx.drawImage(img, 0, 0, width, height);

                // EXTREME compression for tiny file size
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress logo'));
                            return;
                        }
                        const compressedFile = new File([blob], 'logo.jpg', {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        const duration = Date.now() - startTime;
                        console.log(`⚡ Logo compressed in ${duration}ms: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

// Save site settings to Firebase
async function saveSiteSettings() {
    const form = document.getElementById('siteSettingsForm');
    const successMessage = document.getElementById('settingsSaveSuccess');
    const saveButton = form.querySelector('button[type="submit"]');
    const logoUpload = document.getElementById('logoImageUpload');

    // Disable button during save
    saveButton.disabled = true;
    saveButton.textContent = '💾 Saving...';

    try {
        let logoUrl = document.getElementById('siteLogoUrl').value; // Keep existing logo if no new upload

        // Upload logo if a new file was selected
        if (logoUpload.files && logoUpload.files[0]) {
            const logoFile = logoUpload.files[0];

            // Show immediate preview from file
            const tempUrl = URL.createObjectURL(logoFile);
            document.getElementById('currentLogoPreview').innerHTML = `<img src="${tempUrl}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px; opacity: 0.5;">`;

            saveButton.textContent = '⚡ Compressing...';

            // EXTREME compression for INSTANT upload (200px, 50% quality = ~10-20KB)
            const compressedLogo = await compressLogoImage(logoFile, 200, 0.5);

            // Show compressed preview immediately
            const compressedUrl = URL.createObjectURL(compressedLogo);
            document.getElementById('currentLogoPreview').innerHTML = `<img src="${compressedUrl}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;">`;

            saveButton.textContent = '📤 Uploading...';
            const uploadStart = Date.now();

            // Upload to Firebase Storage
            const storageRef = storage.ref();
            const logoRef = storageRef.child(`siteSettings/logo-${Date.now()}.jpg`);

            const snapshot = await logoRef.put(compressedLogo);
            logoUrl = await snapshot.ref.getDownloadURL();

            const uploadTime = Date.now() - uploadStart;
            console.log(`✓ Logo uploaded in ${uploadTime}ms:`, logoUrl);
        }

        saveButton.textContent = '💾 Saving settings...';

        const settings = {
            siteName: document.getElementById('siteName').value.trim(),
            siteTagline: document.getElementById('siteTagline').value.trim(),
            siteLogoUrl: logoUrl || '',
            contactPhone1: document.getElementById('contactPhone1').value.trim(),
            contactPhone2: document.getElementById('contactPhone2').value.trim(),
            contactEmail1: document.getElementById('contactEmail1').value.trim(),
            contactEmail2: document.getElementById('contactEmail2').value.trim(),
            contactAddress: document.getElementById('contactAddress').value.trim(),
            contactWhatsApp: document.getElementById('contactWhatsApp').value.trim(),
            checkInTime: document.getElementById('checkInTime').value.trim(),
            checkOutTime: document.getElementById('checkOutTime').value.trim(),
            restaurantHours: document.getElementById('restaurantHours').value.trim(),
            receptionHours: document.getElementById('receptionHours').value.trim(),
            poolHours: document.getElementById('poolHours').value.trim(),
            facebookUrl: document.getElementById('socialFacebook').value.trim(),
            instagramUrl: document.getElementById('socialInstagram').value.trim(),
            twitterUrl: document.getElementById('socialTwitter').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('Saving settings:', settings);

        // Save to Firebase
        await db.collection('siteSettings').doc('main').set(settings);

        // INSTANT UPDATE: Save to localStorage cache for zero-delay loading
        localStorage.setItem('siteSettings', JSON.stringify(settings));

        console.log('✓ Settings saved successfully (Firebase + Cache)');
        saveButton.disabled = false;
        saveButton.textContent = '💾 Save Settings';

        // Show success message
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings: ' + error.message);
        saveButton.disabled = false;
        saveButton.textContent = '💾 Save Settings';
    }
}

// ===========================
// Messages Management
// ===========================

// Load messages from Firebase
function loadMessages() {
    const loadingEl = document.getElementById('messagesLoading');
    const tableEl = document.getElementById('messagesTable');
    const noMessagesEl = document.getElementById('noMessages');
    const tableBody = document.getElementById('messagesTableBody');

    // Show loading
    loadingEl.style.display = 'block';
    tableEl.style.display = 'none';
    noMessagesEl.style.display = 'none';

    console.log('Fetching messages from Firestore...');

    db.collection('messages')
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            console.log('Messages query successful. Count:', querySnapshot.size);

            // Clear table
            tableBody.innerHTML = '';

            if (querySnapshot.empty) {
                loadingEl.style.display = 'none';
                noMessagesEl.style.display = 'block';
            } else {
                querySnapshot.forEach((doc) => {
                    const message = doc.data();
                    const row = createMessageRow(message, doc.id);
                    tableBody.appendChild(row);
                });

                loadingEl.style.display = 'none';
                tableEl.style.display = 'block';
            }
        })
        .catch((error) => {
            console.error('Error loading messages:', error);
            loadingEl.innerHTML = '<p style="color: red;">Error loading messages. Please refresh.</p>';
        });
}

// Create table row for message
function createMessageRow(message, docId) {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';

    // Highlight unread messages
    if (message.status === 'unread') {
        row.style.backgroundColor = '#f0f9ff';
        row.style.fontWeight = '600';
    }

    const timestamp = message.timestamp ? message.timestamp.toDate() : new Date(message.createdAt);
    const formattedDate = timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusBadge = message.status === 'unread'
        ? '<span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">New</span>'
        : '<span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">Read</span>';

    // Truncate long messages
    const truncatedMessage = message.message.length > 50
        ? message.message.substring(0, 50) + '...'
        : message.message;

    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${message.name || 'N/A'}</td>
        <td><a href="mailto:${message.email}" style="color: #2d5016;">${message.email}</a></td>
        <td>${message.phone || 'N/A'}</td>
        <td style="font-weight: 600;">${message.subject}</td>
        <td title="${message.message}">${truncatedMessage}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn-view" onclick="viewMessage('${docId}')" style="margin-right: 5px;">👁️ View</button>
            <button class="btn-delete" onclick="deleteMessage('${docId}')">🗑️ Delete</button>
        </td>
    `;

    // Mark as read when clicked
    row.addEventListener('click', function(e) {
        if (!e.target.closest('button')) {
            viewMessage(docId);
        }
    });

    return row;
}

// View full message
window.viewMessage = async function(messageId) {
    try {
        const doc = await db.collection('messages').doc(messageId).get();

        if (!doc.exists) {
            alert('Message not found');
            return;
        }

        const message = doc.data();

        // Mark as read
        if (message.status === 'unread') {
            await db.collection('messages').doc(messageId).update({
                status: 'read'
            });
        }

        const timestamp = message.timestamp ? message.timestamp.toDate() : new Date(message.createdAt);
        const formattedDate = timestamp.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const modalContent = `
            <div style="padding: 20px;">
                <h3 style="color: #2d5016; margin-bottom: 20px;">📬 ${message.subject}</h3>

                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 5px 0;"><strong>From:</strong> ${message.name}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${message.email}">${message.email}</a></p>
                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${message.phone || 'Not provided'}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                </div>

                <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <p style="margin: 0; white-space: pre-wrap;">${message.message}</p>
                </div>

                <div style="margin-top: 20px; text-align: right;">
                    <a href="mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}" class="btn-primary" style="display: inline-block; padding: 10px 20px; text-decoration: none;">
                        ✉️ Reply via Email
                    </a>
                </div>
            </div>
        `;

        // Show in modal (reuse booking modal)
        document.getElementById('modalTitle').textContent = 'Message Details';
        document.getElementById('modalBody').innerHTML = modalContent;
        document.getElementById('adminNotes').style.display = 'none';
        document.querySelector('.modal-actions').style.display = 'none';
        document.getElementById('bookingModal').style.display = 'flex';

        // Reload messages to update read status
        loadMessages();

    } catch (error) {
        console.error('Error viewing message:', error);
        alert('Error loading message: ' + error.message);
    }
};

// Delete message
window.deleteMessage = async function(messageId) {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        return;
    }

    try {
        await db.collection('messages').doc(messageId).delete();
        console.log('✅ Message deleted');
        alert('Message deleted successfully');
        loadMessages();
    } catch (error) {
        console.error('❌ Error deleting message:', error);
        alert('Error deleting message: ' + error.message);
    }
};

// Refresh messages button
const refreshMessagesBtn = document.getElementById('refreshMessages');
if (refreshMessagesBtn) {
    refreshMessagesBtn.addEventListener('click', loadMessages);
}
