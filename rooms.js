// Load and display rooms from Firebase
document.addEventListener('DOMContentLoaded', function() {
    loadRooms();
});

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

        roomsSnapshot.forEach(doc => {
            const room = doc.data();
            const roomCard = createRoomCard(room);
            roomsContainer.innerHTML += roomCard;
        });

    } catch (error) {
        console.error('Error loading rooms:', error);
        roomsLoading.innerHTML = '<p style="color: red;">Error loading rooms. Please try again later.</p>';
    }
}

function createRoomCard(room) {
    const features = room.features || [];
    const featuresHTML = features.map(feature => `<li>✓ ${feature}</li>`).join('');

    // Determine background style - use image if available, otherwise use gradient
    let backgroundStyle = '';
    if (room.imageUrl) {
        backgroundStyle = `background: url('${room.imageUrl}') center/cover;`;
    } else {
        backgroundStyle = `background: ${room.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};`;
    }

    return `
        <div class="room-detail-card">
            <div class="room-detail-image" style="${backgroundStyle}">
                ${room.badge ? `<span class="room-badge ${room.badgeClass || ''}">${room.badge}</span>` : ''}
            </div>
            <div class="room-detail-content">
                <h2 class="room-detail-name">${room.name}</h2>
                <p class="room-detail-description">${room.description}</p>

                ${features.length > 0 ? `
                <div class="room-features-detailed">
                    <h3>Room Features:</h3>
                    <ul>
                        ${featuresHTML}
                    </ul>
                </div>
                ` : ''}

                <div class="room-detail-footer">
                    <div class="room-price-info">
                        <span class="price-label">Starting from</span>
                        <span class="room-price-large">₹${room.price}<span>/${room.priceUnit || 'night'}</span></span>
                    </div>
                    <a href="contact.html" class="btn btn-primary">Book Now</a>
                </div>
            </div>
        </div>
    `;
}
