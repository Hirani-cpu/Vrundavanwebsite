// ===========================
// Load Saved Admin Edits on Page Load
// ===========================

(function() {
    'use strict';

    console.log('📥 Loading saved edits...');

    // Wait for Firebase to be ready
    function waitForFirebase(callback) {
        if (typeof db !== 'undefined' && db) {
            callback();
        } else {
            setTimeout(() => waitForFirebase(callback), 100);
        }
    }

    // Load all saved edits
    function loadSavedEdits() {
        const currentPage = window.location.pathname;
        console.log('📄 Current page:', currentPage);

        // Load saved text edits
        loadTextEdits(currentPage);

        // Load saved images
        loadImageEdits(currentPage);

        // Load saved card content
        loadCardEdits();

        // Load saved amenities
        loadAmenityEdits();

        // Load saved events
        loadEventEdits();
    }

    // Load text edits
    async function loadTextEdits(pageUrl) {
        try {
            const snapshot = await db.collection('pageText')
                .where('pageUrl', '==', pageUrl)
                .get();

            if (snapshot.empty) {
                console.log('No saved text edits found');
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const editId = doc.id; // Use document ID as the edit ID
                console.log('📝 Loading text edit:', editId, data.tagName, data.text.substring(0, 50));

                // Try to find element by data-edit-id first (most accurate)
                let element = document.querySelector(`[data-edit-id="${editId}"]`);

                if (element) {
                    // Element already has the ID, update it
                    element.textContent = data.text;
                    console.log('✅ Updated element by ID:', editId);
                } else {
                    // Element doesn't have ID yet - this shouldn't happen often
                    // Just skip it, the element will get an ID when admin edits it
                    console.log('⚠️ No element found for ID:', editId);
                }
            });

            console.log(`✅ Loaded ${snapshot.size} text edits`);
        } catch (error) {
            console.error('Error loading text edits:', error);
        }
    }

    // Load image edits
    async function loadImageEdits(pageUrl) {
        try {
            const snapshot = await db.collection('pageContent')
                .where('pageType', '==', pageUrl)
                .where('elementType', '==', 'image')
                .get();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const elementId = doc.id;

                console.log('🖼️ Loading image edit:', elementId);

                // Find element by data-edit-id
                const element = document.querySelector(`[data-edit-id="${elementId}"]`);
                if (element && data.imageUrl) {
                    element.style.backgroundImage = `url('${data.imageUrl}')`;
                    element.style.backgroundSize = 'cover';
                    element.style.backgroundPosition = 'center';

                    // Hide label text when image is loaded
                    const label = element.querySelector('.amenity-label, .venue-capacity-badge, span');
                    if (label && label.textContent && label.textContent.trim()) {
                        label.style.display = 'none';
                    }

                    console.log('✅ Applied image to:', elementId);
                }
            });

            console.log(`✅ Loaded ${snapshot.size} image edits`);
        } catch (error) {
            console.error('Error loading image edits:', error);
        }
    }

    // Load card edits
    async function loadCardEdits() {
        // This would load generic card edits
        // For now, amenities and events are handled separately
    }

    // Load amenity edits
    async function loadAmenityEdits() {
        try {
            const snapshot = await db.collection('amenities').get();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const amenityId = doc.id;

                console.log('🏨 Loading amenity edit:', amenityId);

                const card = document.querySelector(`[data-edit-id="${amenityId}"]`);
                if (card) {
                    // Update icon
                    if (data.icon) {
                        const iconEl = card.querySelector('.amenity-icon');
                        if (iconEl) iconEl.textContent = data.icon;
                    }

                    // Update title
                    if (data.title) {
                        const titleEl = card.querySelector('h3, .amenity-name');
                        if (titleEl) titleEl.textContent = data.title;
                    }

                    // Update description
                    if (data.description) {
                        const descEl = card.querySelector('p, .amenity-description');
                        if (descEl) descEl.textContent = data.description;
                    }

                    // Update image
                    if (data.imageUrl) {
                        card.style.backgroundImage = `url('${data.imageUrl}')`;
                        card.style.backgroundSize = 'cover';
                        card.style.backgroundPosition = 'center';

                        // Hide label text when image is loaded
                        const label = card.querySelector('.amenity-label, .venue-capacity-badge, span');
                        if (label && label.textContent && label.textContent.trim()) {
                            label.style.display = 'none';
                        }
                    }

                    console.log('✅ Applied amenity:', data.title);
                }
            });

            console.log(`✅ Loaded ${snapshot.size} amenity edits`);
        } catch (error) {
            console.error('Error loading amenity edits:', error);
        }
    }

    // Load event edits
    async function loadEventEdits() {
        try {
            const snapshot = await db.collection('eventContent').get();

            snapshot.forEach((doc) => {
                const data = doc.data();
                const eventId = doc.id;

                console.log('🎉 Loading event edit:', eventId);

                const section = document.querySelector(`[data-edit-id="${eventId}"]`);
                if (section) {
                    // Update title
                    if (data.title) {
                        const titleEl = section.querySelector('h2, h3, .event-title');
                        if (titleEl) titleEl.textContent = data.title;
                    }

                    // Update description
                    if (data.description) {
                        const descEl = section.querySelector('p, .event-description');
                        if (descEl) descEl.textContent = data.description;
                    }

                    // Update image
                    if (data.imageUrl) {
                        const imageEl = section.querySelector('.venue-image, [data-admin-editable="image"]');
                        if (imageEl) {
                            imageEl.style.backgroundImage = `url('${data.imageUrl}')`;
                            imageEl.style.backgroundSize = 'cover';
                            imageEl.style.backgroundPosition = 'center';

                            // Hide label text when image is loaded
                            const label = imageEl.querySelector('.amenity-label, .venue-capacity-badge, span');
                            if (label && label.textContent && label.textContent.trim()) {
                                label.style.display = 'none';
                            }
                        }
                    }

                    console.log('✅ Applied event:', data.title);
                }
            });

            console.log(`✅ Loaded ${snapshot.size} event edits`);
        } catch (error) {
            console.error('Error loading event edits:', error);
        }
    }

    // Initialize when DOM and Firebase are ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            waitForFirebase(loadSavedEdits);
        });
    } else {
        waitForFirebase(loadSavedEdits);
    }

    // Expose for manual reload
    window.reloadEdits = loadSavedEdits;
})();
