// Load and display rooms from Firebase with caching
let slideshowIntervals = {}; // Store slideshow intervals for each room
let roomsCache = null;
let roomsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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
        imageHTML = `<img src="${images[0]}" alt="${room.name}" data-images='${JSON.stringify(images)}' decoding="async" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        imageHTML = `<div style="width: 100%; height: 100%; background: ${room.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};"></div>`;
    }

    return `
        <div class="room-detail-card-compact">
            <div class="room-detail-image-compact" id="${roomId}-image" style="position: relative; overflow: hidden;" data-room-id="${roomId}">
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

// Room Booking Modal Functions
function openBookingModal(roomName, price, priceUnit) {
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
    document.getElementById('roomBookingForm').style.display = 'block';
    document.getElementById('bookingSuccessMessage').style.display = 'none';
}

function closeBookingModal() {
    document.getElementById('roomBookingModal').style.display = 'none';
    document.getElementById('roomBookingForm').reset();
}

// Handle booking form submission
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('roomBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const roomName = document.getElementById('selectedRoomName').value;
            const roomPrice = document.getElementById('selectedRoomPrice').value;
            const guestName = document.getElementById('guestName').value;
            const guestEmail = document.getElementById('guestEmail').value;
            const guestPhone = document.getElementById('guestPhone').value;
            const checkIn = document.getElementById('checkInDate').value;
            const checkOut = document.getElementById('checkOutDate').value;
            const numGuests = document.getElementById('numGuests').value;
            const specialRequests = document.getElementById('specialRequests').value;

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
                // Save to Firebase
                const db = firebase.firestore();
                await db.collection('bookings').add({
                    roomName: roomName,
                    roomPrice: roomPrice,
                    guestName: guestName,
                    guestEmail: guestEmail,
                    guestPhone: guestPhone,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    numberOfGuests: numGuests,
                    numberOfNights: nights,
                    totalPrice: totalPrice,
                    specialRequests: specialRequests,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Show success message with summary
                document.getElementById('roomBookingForm').style.display = 'none';
                document.getElementById('bookingSuccessMessage').style.display = 'block';
                document.getElementById('bookingSummary').innerHTML = `
                    <strong>Booking Summary:</strong><br>
                    Room: ${roomName}<br>
                    Guest: ${guestName}<br>
                    Check-in: ${checkIn}<br>
                    Check-out: ${checkOut}<br>
                    Nights: ${nights}<br>
                    Guests: ${numGuests}<br>
                    Total Price: ₹${totalPrice.toLocaleString()}
                `;

            } catch (error) {
                console.error('Error saving booking:', error);
                alert('Error submitting booking. Please try again or call us directly.');
            }
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
