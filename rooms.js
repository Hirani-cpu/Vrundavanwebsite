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

    // Start slideshows after DOM is updated with cache-busted URLs
    const cacheBuster = Date.now();
    roomsData.forEach(({ room, index }) => {
        if (room.imageUrls && room.imageUrls.length > 1) {
            // Add cache buster to slideshow images too
            const cachedUrls = room.imageUrls.map(url => {
                const separator = url.includes('?') ? '&' : '?';
                return `${url}${separator}t=${cacheBuster}`;
            });
            startSlideshow(`room-${index}`, cachedUrls);
        }
    });
}

function startSlideshow(roomId, images) {
    let currentIndex = 0;
    const imageElement = document.getElementById(`${roomId}-image`);
    const counterElement = document.getElementById(`${roomId}-counter`);

    if (!imageElement) return;

    // Change image every 3 seconds
    slideshowIntervals[roomId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % images.length;
        imageElement.style.backgroundImage = `url('${images[currentIndex]}')`;
        if (counterElement) {
            counterElement.textContent = `${currentIndex + 1}/${images.length}`;
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

    // Add cache buster to prevent old images from showing
    const cacheBuster = Date.now();
    const addCacheBuster = (url) => {
        if (!url) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${cacheBuster}`;
    };

    // Apply cache buster to all images
    images = images.map(url => addCacheBuster(url));

    // Determine background style - use first image if available, otherwise use gradient
    let backgroundStyle = '';
    if (images.length > 0) {
        backgroundStyle = `background: url('${images[0]}') center/cover no-repeat;`;
    } else {
        backgroundStyle = `background: ${room.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};`;
    }

    // Image counter badge (only show if multiple images)
    const imageCounter = images.length > 1 ? `<span class="image-counter" id="${roomId}-counter">1/${images.length}</span>` : '';

    return `
        <div class="room-detail-card-compact">
            <div class="room-detail-image-compact" id="${roomId}-image" style="${backgroundStyle}">
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
                    <a href="contact.html" class="btn btn-primary btn-compact">Book Now</a>
                </div>
            </div>
        </div>
    `;
}
