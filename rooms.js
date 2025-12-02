// Load and display rooms from Firebase
document.addEventListener('DOMContentLoaded', function() {
    loadRooms();
});

let slideshowIntervals = {}; // Store slideshow intervals for each room

async function loadRooms() {
    const roomsContainer = document.getElementById('roomsContainer');
    const roomsLoading = document.getElementById('roomsLoading');
    const noRooms = document.getElementById('noRooms');

    try {
        const db = firebase.firestore();
        const roomsSnapshot = await db.collection('rooms').orderBy('order', 'asc').get();

        roomsLoading.style.display = 'none';

        if (roomsSnapshot.empty) {
            noRooms.style.display = 'block';
            return;
        }

        roomsContainer.innerHTML = '';

        roomsSnapshot.forEach((doc, index) => {
            const room = doc.data();
            const roomCard = createRoomCard(room, `room-${index}`);
            roomsContainer.innerHTML += roomCard;
        });

        // Start slideshows for rooms with multiple images
        roomsSnapshot.forEach((doc, index) => {
            const room = doc.data();
            if (room.imageUrls && room.imageUrls.length > 1) {
                startSlideshow(`room-${index}`, room.imageUrls);
            }
        });

    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsLoading.innerHTML = '<p style="color: red;">Error loading rooms. Please try again later.</p>';
    }
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
