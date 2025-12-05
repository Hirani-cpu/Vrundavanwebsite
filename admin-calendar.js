// ===========================
// Admin Booking Calendar System
// ===========================

let currentCalendarDate = new Date();
let allBookingsData = {
    rooms: [],
    events: []
};

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be initialized
    setTimeout(() => {
        loadBookingsForCalendar();
        setupCalendarNavigation();
    }, 1000);
});

// ===========================
// Load All Bookings for Calendar
// ===========================
function loadBookingsForCalendar() {
    console.log('Loading bookings for calendar...');

    // Load room bookings
    db.collection('roomBookings').get()
        .then((querySnapshot) => {
            allBookingsData.rooms = [];
            querySnapshot.forEach((doc) => {
                allBookingsData.rooms.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            console.log('Loaded', allBookingsData.rooms.length, 'room bookings');

            // Load event bookings
            return db.collection('eventBookings').get();
        })
        .then((querySnapshot) => {
            allBookingsData.events = [];
            querySnapshot.forEach((doc) => {
                allBookingsData.events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            console.log('Loaded', allBookingsData.events.length, 'event bookings');

            // Render calendar
            renderCalendar(currentCalendarDate);
        })
        .catch((error) => {
            console.error('Error loading bookings for calendar:', error);
        });
}

// ===========================
// Setup Calendar Navigation
// ===========================
function setupCalendarNavigation() {
    document.getElementById('prevMonthBtn').addEventListener('click', function() {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar(currentCalendarDate);
    });

    document.getElementById('nextMonthBtn').addEventListener('click', function() {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar(currentCalendarDate);
    });
}

// ===========================
// Render Calendar
// ===========================
function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;

    // Get calendar container
    const calendarEl = document.getElementById('bookingCalendar');
    calendarEl.innerHTML = '';

    // Add day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarEl.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Add previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayEl = createCalendarDay(daysInPrevMonth - i, month - 1, year, true);
        calendarEl.appendChild(dayEl);
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = createCalendarDay(day, month, year, false);
        calendarEl.appendChild(dayEl);
    }

    // Add next month's days to complete the grid
    const totalCells = calendarEl.children.length - 7; // Subtract day headers
    const remainingCells = (Math.ceil(totalCells / 7) * 7) - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createCalendarDay(day, month + 1, year, true);
        calendarEl.appendChild(dayEl);
    }
}

// ===========================
// Create Calendar Day Element
// ===========================
function createCalendarDay(day, month, year, isOtherMonth) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';

    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }

    // Check if today
    const today = new Date();
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayEl.classList.add('today');
    }

    // Create date string for comparison
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);

    // Find bookings for this day
    const dayBookings = getBookingsForDate(dateStr);

    // Add booking badges
    if (dayBookings.rooms.length > 0) {
        const roomBadge = document.createElement('span');
        roomBadge.className = 'calendar-booking-badge room';

        // Calculate TOTAL number of rooms (sum of all numberOfRooms)
        const totalRooms = dayBookings.rooms.reduce((sum, booking) => {
            return sum + (booking.numberOfRooms || 1);
        }, 0);

        // Get unique room types
        const roomTypes = [...new Set(dayBookings.rooms.map(b => b.roomType))];
        roomBadge.textContent = `🏨 ${totalRooms} Room${totalRooms > 1 ? 's' : ''}`;
        dayEl.appendChild(roomBadge);

        // Show room types
        if (roomTypes.length <= 2) {
            roomTypes.forEach(roomType => {
                const roomTypeEl = document.createElement('small');
                roomTypeEl.style.display = 'block';
                roomTypeEl.style.fontSize = '0.7rem';
                roomTypeEl.style.color = '#155724';
                roomTypeEl.textContent = roomType;
                dayEl.appendChild(roomTypeEl);
            });
        }
    }

    if (dayBookings.events.length > 0) {
        const eventBadge = document.createElement('span');
        eventBadge.className = 'calendar-booking-badge event';
        eventBadge.textContent = `🎉 ${dayBookings.events.length} Event${dayBookings.events.length > 1 ? 's' : ''}`;
        dayEl.appendChild(eventBadge);
    }

    // Add click handler if there are bookings
    if (dayBookings.rooms.length > 0 || dayBookings.events.length > 0) {
        dayEl.style.cursor = 'pointer';
        dayEl.addEventListener('click', function() {
            showDayDetails(dateStr, dayBookings);
        });
    }

    return dayEl;
}

// ===========================
// Get Bookings for Specific Date
// ===========================
function getBookingsForDate(dateStr) {
    const result = {
        rooms: [],
        events: []
    };

    // Check room bookings (date must be between check-in and check-out)
    allBookingsData.rooms.forEach(booking => {
        if (booking.checkIn && booking.checkOut) {
            if (dateStr >= booking.checkIn && dateStr < booking.checkOut) {
                result.rooms.push(booking);
            }
        }
    });

    // Check event bookings (exact date match)
    allBookingsData.events.forEach(booking => {
        if (booking.eventDate === dateStr) {
            result.events.push(booking);
        }
    });

    return result;
}

// ===========================
// Show Day Details Modal
// ===========================
function showDayDetails(dateStr, bookings) {
    const modal = document.getElementById('dayDetailsModal');
    const title = document.getElementById('dayDetailsTitle');
    const body = document.getElementById('dayDetailsBody');

    // Format date
    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    title.textContent = `📅 Bookings for ${formattedDate}`;

    // Clear previous content
    body.innerHTML = '';

    // Add room bookings
    if (bookings.rooms.length > 0) {
        // Calculate total rooms across all bookings
        const totalRooms = bookings.rooms.reduce((sum, booking) => {
            return sum + (booking.numberOfRooms || 1);
        }, 0);

        const roomsHeader = document.createElement('h3');
        roomsHeader.style.color = '#2d5016';
        roomsHeader.style.marginTop = '0';
        roomsHeader.textContent = `🏨 Room Bookings (${bookings.rooms.length} booking${bookings.rooms.length > 1 ? 's' : ''}, ${totalRooms} room${totalRooms > 1 ? 's' : ''} total)`;
        body.appendChild(roomsHeader);

        bookings.rooms.forEach(booking => {
            const card = createDayBookingCard(booking, 'room');
            body.appendChild(card);
        });
    }

    // Add event bookings
    if (bookings.events.length > 0) {
        const eventsHeader = document.createElement('h3');
        eventsHeader.style.color = '#2d5016';
        eventsHeader.style.marginTop = '20px';
        eventsHeader.textContent = `🎉 Event Bookings (${bookings.events.length})`;
        body.appendChild(eventsHeader);

        bookings.events.forEach(booking => {
            const card = createDayBookingCard(booking, 'event');
            body.appendChild(card);
        });
    }

    // Show modal
    modal.style.display = 'block';
}

// ===========================
// Create Day Booking Card
// ===========================
function createDayBookingCard(booking, type) {
    const card = document.createElement('div');
    card.className = 'day-booking-card';
    card.style.cursor = 'pointer';

    if (type === 'room') {
        const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        card.innerHTML = `
            <h4>🏨 ${booking.roomType || 'Room Booking'}</h4>
            <p style="background: #d4edda; padding: 8px; border-radius: 4px; margin: 8px 0; font-weight: 700; color: #155724;"><strong>📊 Number of Rooms:</strong> ${booking.numberOfRooms || 1} Room${(booking.numberOfRooms || 1) > 1 ? 's' : ''}</p>
            <p><strong>Guest:</strong> ${booking.fullName || 'N/A'}</p>
            <p><strong>Contact:</strong> ${booking.phone || 'N/A'} | ${booking.email || 'N/A'}</p>
            <p><strong>Stay Period:</strong> ${checkIn} → ${checkOut} (${booking.numberOfNights || '?'} night${booking.numberOfNights !== 1 ? 's' : ''})</p>
            <p><strong>Guests:</strong> ${booking.adults || 0} Adult(s)${booking.children > 0 ? ', ' + booking.children + ' Child(ren)' : ''}</p>
            <p><strong>Status:</strong> <span class="status-badge ${booking.bookingStatus || 'pending'}">${(booking.bookingStatus || 'pending').toUpperCase()}</span></p>
            ${booking.specialRequests ? '<p><strong>Special Requests:</strong> ' + booking.specialRequests + '</p>' : ''}
        `;
    } else {
        card.innerHTML = `
            <h4>🎉 ${booking.eventType || 'Event Booking'}</h4>
            <p><strong>Guest:</strong> ${booking.fullName || 'N/A'}</p>
            <p><strong>Contact:</strong> ${booking.phone || 'N/A'} | ${booking.email || 'N/A'}</p>
            <p><strong>Time Slot:</strong> ${booking.timeSlot || 'N/A'}</p>
            <p><strong>Expected Guests:</strong> ${booking.guests || 'N/A'}</p>
            <p><strong>Venue:</strong> ${booking.preferredArea || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-badge ${booking.bookingStatus || 'pending'}">${(booking.bookingStatus || 'pending').toUpperCase()}</span></p>
        `;
    }

    // Add click to view full details
    card.addEventListener('click', function() {
        closeDayDetails();
        openBookingModal(booking.id, type, booking);
    });

    return card;
}

// ===========================
// Close Day Details Modal
// ===========================
function closeDayDetails() {
    document.getElementById('dayDetailsModal').style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('dayDetailsModal');
    if (event.target === modal) {
        closeDayDetails();
    }
});
