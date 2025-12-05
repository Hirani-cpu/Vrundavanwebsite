// Load and display rooms from Firebase with caching
let slideshowIntervals = {}; // Store slideshow intervals for each room
let roomsCache = null;
let roomsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
let currentRoomData = null; // Store current room data for availability checking
let allRoomsData = {}; // Store all rooms data indexed by name

// Room Booking Modal Functions - Define BEFORE DOM loads
window.openBookingModal = function(roomName, price, priceUnit) {
    console.log('Opening booking modal for:', roomName, price, priceUnit);
    currentRoomData = allRoomsData[roomName]; // Get room data from global storage

    document.getElementById('selectedRoomName').value = roomName;
    document.getElementById('selectedRoomPrice').value = price;
    document.getElementById('displayRoomName').value = roomName;
    document.getElementById('displayRoomPrice').value = `₹${price}/${priceUnit}`;
    document.getElementById('bookingModalTitle').textContent = `Book ${roomName}`;

    // Set minimum check-in date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('checkInDate').min = today;
    document.getElementById('checkOutDate').min = today;

    // Show modal
    document.getElementById('roomBookingModal').style.display = 'block';

    // Reset form
    document.getElementById('roomBookingForm').reset();
    document.getElementById('displayRoomName').value = roomName;
    document.getElementById('displayRoomPrice').value = `₹${price}/${priceUnit}`;

    // Reset guest counters
    document.getElementById('numRooms').value = 1;
    document.getElementById('numAdults').value = 1;
    document.getElementById('numChildren').value = 0;
    document.getElementById('roomAvailabilityWarning').style.display = 'none';

    document.getElementById('roomBookingForm').style.display = 'block';
    document.getElementById('bookingSuccessMessage').style.display = 'none';

    // Show total available rooms initially (before dates selected)
    showInitialAvailability();

    // Check availability when dates are selected
    checkRoomAvailability();
};

window.closeBookingModal = function() {
    document.getElementById('roomBookingModal').style.display = 'none';
    document.getElementById('roomBookingForm').reset();
    currentRoomData = null;
};

// Room counter functions
window.incrementRooms = function() {
    const input = document.getElementById('numRooms');
    input.value = parseInt(input.value) + 1;
    checkRoomAvailability();
};

window.decrementRooms = function() {
    const input = document.getElementById('numRooms');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        checkRoomAvailability();
    }
};

// Adult counter functions
window.incrementAdults = function() {
    const input = document.getElementById('numAdults');
    input.value = parseInt(input.value) + 1;
};

window.decrementAdults = function() {
    const input = document.getElementById('numAdults');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
};

// Children counter functions
window.incrementChildren = function() {
    const input = document.getElementById('numChildren');
    input.value = parseInt(input.value) + 1;
};

window.decrementChildren = function() {
    const input = document.getElementById('numChildren');
    if (parseInt(input.value) > 0) {
        input.value = parseInt(input.value) - 1;
    }
};

// Show initial availability (total currently available across all dates)
async function showInitialAvailability() {
    if (!currentRoomData || !firebase || !firebase.firestore) {
        return;
    }

    const totalRooms = currentRoomData.totalRooms || 1;
    const availableIndicator = document.getElementById('availableRoomsIndicator');
    const availableCountEl = document.getElementById('availableRoomsCount');

    try {
        const db = firebase.firestore();
        const roomName = currentRoomData.name;

        // Get all active bookings for this room type
        const bookings = await db.collection('roomBookings')
            .where('roomType', '==', roomName)
            .where('bookingStatus', 'in', ['pending', 'confirmed'])
            .get();

        // Count total rooms currently booked (across all dates)
        let totalBookedRooms = 0;
        bookings.forEach(doc => {
            const booking = doc.data();
            totalBookedRooms += (booking.numberOfRooms || 1);
        });

        const availableRooms = Math.max(0, totalRooms - totalBookedRooms);

        // Update availability indicator
        if (availableIndicator && availableCountEl) {
            availableCountEl.textContent = availableRooms;
            availableIndicator.style.display = 'block';

            // Change color based on availability
            if (availableRooms === 0) {
                availableIndicator.style.background = '#f8d7da';
                availableIndicator.style.color = '#721c24';
            } else if (availableRooms <= 3) {
                availableIndicator.style.background = '#fff3cd';
                availableIndicator.style.color = '#856404';
            } else {
                availableIndicator.style.background = '#d4edda';
                availableIndicator.style.color = '#155724';
            }
        }
    } catch (error) {
        console.error('Error checking initial availability:', error);
    }
}

// Check room availability for specific dates
async function checkRoomAvailability() {
    const numRoomsRequested = parseInt(document.getElementById('numRooms').value);
    const warningEl = document.getElementById('roomAvailabilityWarning');
    const availableIndicator = document.getElementById('availableRoomsIndicator');
    const availableCountEl = document.getElementById('availableRoomsCount');

    if (!currentRoomData) {
        return;
    }

    const totalRooms = currentRoomData.totalRooms || 1;
    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;

    // Calculate available rooms
    let availableRooms = totalRooms;

    // If dates are selected, check bookings for those dates
    if (checkInDate && checkOutDate && firebase && firebase.firestore) {
        const db = firebase.firestore();
        const roomName = currentRoomData.name;

        try {
            const bookings = await db.collection('roomBookings')
                .where('roomType', '==', roomName)
                .where('bookingStatus', 'in', ['pending', 'confirmed'])
                .get();

            // Count rooms booked during the requested period
            let bookedRooms = 0;
            bookings.forEach(doc => {
                const booking = doc.data();
                // Check if booking overlaps with requested dates
                if (booking.checkIn < checkOutDate && booking.checkOut > checkInDate) {
                    bookedRooms += (booking.numberOfRooms || 1);
                }
            });

            availableRooms = totalRooms - bookedRooms;
        } catch (error) {
            console.error('Error checking availability:', error);
        }

        // Update availability indicator with date-specific availability
        if (availableIndicator && availableCountEl) {
            availableCountEl.textContent = availableRooms;
            availableIndicator.style.display = 'block';

            // Change color based on availability
            if (availableRooms === 0) {
                availableIndicator.style.background = '#f8d7da';
                availableIndicator.style.color = '#721c24';
            } else if (availableRooms <= 3) {
                availableIndicator.style.background = '#fff3cd';
                availableIndicator.style.color = '#856404';
            } else {
                availableIndicator.style.background = '#d4edda';
                availableIndicator.style.color = '#155724';
            }
        }
    }

    // Show warning if requested exceeds available
    if (numRoomsRequested > availableRooms) {
        warningEl.textContent = `⚠️ ${numRoomsRequested} rooms not available. Only ${availableRooms} room${availableRooms !== 1 ? 's' : ''} remaining.`;
        warningEl.style.display = 'block';
    } else {
        warningEl.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadRooms();
});

async function loadRooms() {
    const roomsContainer = document.getElementById('roomsContainer');
    const roomsLoading = document.getElementById('roomsLoading');
    const noRooms = document.getElementById('noRooms');

    try {
        // Clear any existing slideshow intervals
        Object.values(slideshowIntervals).forEach(interval => clearInterval(interval));
        slideshowIntervals = {};

        // Use cache if available and fresh
        const now = Date.now();
        if (roomsCache && roomsCacheTime && (now - roomsCacheTime < CACHE_DURATION)) {
            console.log('✓ Using cached rooms data');
            renderRooms(roomsCache, roomsContainer, roomsLoading, noRooms);
            return;
        }

        console.log('⬇ Loading rooms from Firebase...');
        const db = firebase.firestore();
        const roomsSnapshot = await db.collection('rooms').orderBy('order', 'asc').get();

        // Cache the data
        roomsCache = roomsSnapshot;
        roomsCacheTime = now;

        renderRooms(roomsSnapshot, roomsContainer, roomsLoading, noRooms);

    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsLoading.innerHTML = '<p style="color: red;">Error loading rooms. Please try again later.</p>';
    }
}

function renderRooms(roomsSnapshot, roomsContainer, roomsLoading, noRooms) {
    roomsLoading.style.display = 'none';

    if (roomsSnapshot.empty) {
        noRooms.style.display = 'block';
        return;
    }

    // Clear container
    roomsContainer.innerHTML = '';

    // Build all room cards first
    const roomCards = [];
    const roomsData = [];

    let roomIndex = 0;
    roomsSnapshot.forEach((doc) => {
        const room = doc.data();
        console.log(`🏨 Room ${roomIndex + 1}: "${room.name}"`, {
            id: doc.id,
            order: room.order || 'MISSING',
            imageCount: room.imageUrls ? room.imageUrls.length : 0,
            imageUrls: room.imageUrls,
            firstImage: room.imageUrls && room.imageUrls[0] ? room.imageUrls[0].substring(0, 100) + '...' : 'none'
        });

        // Store room data globally for availability checking
        allRoomsData[room.name] = room;

        roomsData.push({ room, index: roomIndex });
        const roomCard = createRoomCard(room, `room-${roomIndex}`);
        roomCards.push(roomCard);
        roomIndex++;
    });

    // Insert all cards at once
    roomsContainer.innerHTML = roomCards.join('');

    // Start slideshows after DOM is updated (no cache busters for speed)
    roomsData.forEach(({ room, index }) => {
        if (room.imageUrls && room.imageUrls.length > 1) {
            startSlideshow(`room-${index}`, room.imageUrls);
        }
    });
}

function startSlideshow(roomId, images) {
    let currentIndex = 0;
    const imageContainer = document.getElementById(`${roomId}-image`);
    const counterElement = document.getElementById(`${roomId}-counter`);

    if (!imageContainer) return;

    const imgElement = imageContainer.querySelector('img');
    if (!imgElement) return;

    // Get images from data attribute (more reliable)
    let slideshowImages = images;
    try {
        const dataImages = imgElement.getAttribute('data-images');
        if (dataImages) {
            slideshowImages = JSON.parse(dataImages);
        }
    } catch (e) {
        console.error('Error parsing images:', e);
    }

    // Change image every 3 seconds
    slideshowIntervals[roomId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % slideshowImages.length;
        imgElement.src = slideshowImages[currentIndex];
        if (counterElement) {
            counterElement.textContent = `${currentIndex + 1}/${slideshowImages.length}`;
        }
    }, 3000);
}

function createRoomCard(room, roomId) {
    const features = room.features || [];
    const featuresHTML = features.map(feature => `<li>✓ ${feature}</li>`).join('');

    // Get images array (supports both old imageUrl and new imageUrls)
    let images = [];
    if (room.imageUrls && room.imageUrls.length > 0) {
        images = room.imageUrls;
    } else if (room.imageUrl) {
        images = [room.imageUrl];
    }

    // Don't add cache buster - let browser cache images for speed

    // Image counter badge (only show if multiple images)
    const imageCounter = images.length > 1 ? `<span class="image-counter" id="${roomId}-counter">1/${images.length}</span>` : '';

    // Use img tag with decoding hint for faster rendering
    let imageHTML = '';
    if (images.length > 0) {
        imageHTML = `<img src="${images[0]}" alt="${room.name}" data-images='${JSON.stringify(images)}' decoding="async" style="width: 100%; height: 100%; object-fit: contain;">`;
    } else {
        imageHTML = `<div style="width: 100%; height: 100%; background: ${room.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};"></div>`;
    }

    return `
        <div class="room-detail-card-compact">
            <div class="room-detail-image-compact" id="${roomId}-image" data-room-id="${roomId}">
                ${imageHTML}
                ${room.badge ? `<span class="room-badge ${room.badgeClass || ''}">${room.badge}</span>` : ''}
                ${imageCounter}
            </div>
            <div class="room-detail-content-compact">
                <h3 class="room-detail-name-compact">${room.name}</h3>
                <p class="room-detail-description-compact">${room.description}</p>

                ${features.length > 0 ? `
                <div class="room-features-compact">
                    <ul>
                        ${featuresHTML}
                    </ul>
                </div>
                ` : ''}

                <div class="room-detail-footer-compact">
                    <div class="room-price-info-compact">
                        <span class="price-label-compact">From</span>
                        <span class="room-price-compact">₹${room.price}<span class="price-unit">/${room.priceUnit || 'night'}</span></span>
                    </div>
                    <button class="btn btn-primary btn-compact" onclick="openBookingModal('${room.name}', ${room.price}, '${room.priceUnit || 'night'}')">Book Now</button>
                </div>
            </div>
        </div>
    `;
}

// Handle booking form submission
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('roomBookingForm');
    if (bookingForm) {
        console.log('✓ Room booking form found in rooms.js');

        // Remove any existing listeners and add ours with immediate execution
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation(); // Stop other handlers from interfering

            console.log('📝 Booking form submitted');

            const roomName = document.getElementById('selectedRoomName').value;
            const roomPrice = document.getElementById('selectedRoomPrice').value;
            const guestName = document.getElementById('guestName').value;
            const guestEmail = document.getElementById('guestEmail').value;
            const guestPhone = document.getElementById('guestPhone').value;
            const checkIn = document.getElementById('checkInDate').value;
            const checkOut = document.getElementById('checkOutDate').value;
            const numRooms = parseInt(document.getElementById('numRooms').value);
            const numAdults = parseInt(document.getElementById('numAdults').value);
            const numChildren = parseInt(document.getElementById('numChildren').value);
            const specialRequests = document.getElementById('specialRequests').value;

            console.log('Form data collected:', { roomName, roomPrice, guestName, guestEmail });

            // Calculate number of nights
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            const totalPrice = nights * roomPrice;

            if (nights <= 0) {
                alert('Check-out date must be after check-in date');
                return;
            }

            try {
                console.log('💾 Saving to Firebase...');

                // Check if Firebase is available
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase is not loaded');
                }

                // Get current logged-in user from localStorage (if any)
                const currentUserJson = localStorage.getItem('currentUser');
                const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null;
                const userId = currentUser ? currentUser.userId : null;
                const userEmail = currentUser ? currentUser.email : null;

                console.log('🔍 DEBUG: Current user object:', currentUser);
                console.log('🔍 DEBUG: userId:', userId);
                console.log('🔍 DEBUG: Will link booking to userId:', userId ? 'YES' : 'NO');

                const db = firebase.firestore();
                const bookingData = {
                    // Match admin panel expected field names
                    fullName: guestName,
                    email: guestEmail,
                    phone: guestPhone,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    numberOfRooms: numRooms,
                    adults: numAdults,
                    children: numChildren,
                    roomType: roomName,
                    roomPrice: parseInt(roomPrice),
                    numberOfNights: nights,
                    totalPrice: totalPrice * numRooms,
                    specialRequests: specialRequests,
                    bookingStatus: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Add userId if user is logged in
                if (userId) {
                    bookingData.userId = userId;
                    bookingData.userEmail = userEmail;
                    console.log('✓ Booking will be linked to user account:', userId);
                } else {
                    console.log('⚠️ Guest booking (not linked to account)');
                }

                console.log('🔍 DEBUG: Final booking data being saved:', bookingData);

                const docRef = await db.collection('roomBookings').add(bookingData);

                console.log('✅ Booking saved with ID:', docRef.id);
                console.log('✅ Booking has userId:', bookingData.userId ? 'YES - ' + bookingData.userId : 'NO - GUEST BOOKING');

                // Show success message with summary
                document.getElementById('roomBookingForm').style.display = 'none';
                document.getElementById('bookingSuccessMessage').style.display = 'block';
                document.getElementById('bookingSummary').innerHTML = `
                    <strong>Booking Summary:</strong><br>
                    Room: ${roomName}<br>
                    Number of Rooms: ${numRooms}<br>
                    Guest: ${guestName}<br>
                    Check-in: ${checkIn}<br>
                    Check-out: ${checkOut}<br>
                    Nights: ${nights}<br>
                    Guests: ${numAdults} Adult(s)${numChildren > 0 ? ', ' + numChildren + ' Child(ren)' : ''}<br>
                    Total Price: ₹${(totalPrice * numRooms).toLocaleString()}
                `;

            } catch (error) {
                console.error('❌ Error saving booking:', error);
                console.error('Error details:', error.message, error.code);
                alert('Error submitting booking: ' + error.message + '\nPlease try again or call us directly.');
            }
        }, true); // Use capture phase to run before other handlers
    }

    // Add event listeners for date changes to recheck availability
    const checkInDateInput = document.getElementById('checkInDate');
    const checkOutDateInput = document.getElementById('checkOutDate');

    if (checkInDateInput) {
        checkInDateInput.addEventListener('change', function() {
            checkRoomAvailability();
        });
    }

    if (checkOutDateInput) {
        checkOutDateInput.addEventListener('change', function() {
            checkRoomAvailability();
        });
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('roomBookingModal');
        if (event.target === modal) {
            closeBookingModal();
        }
    };
});
