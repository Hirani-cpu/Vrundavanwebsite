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

    // Generate persistent ID based on element content and position
    // This ensures the same element gets the same ID across page refreshes
    function generatePersistentId(element, type, index) {
        const pageUrl = window.location.pathname;
        const tagName = element.tagName.toLowerCase();
        const textContent = element.textContent.trim().substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');

        // Create hash from content
        let hash = 0;
        const str = pageUrl + tagName + textContent + index;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        return `${type}_${Math.abs(hash)}_${index}`;
    }

    // Assign IDs to all text elements BEFORE loading edits
    function assignPersistentIds() {
        console.log('🔢 Assigning persistent IDs to text elements...');

        // Assign IDs to headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .section-title, .hero-title, .welcome-heading, .hero-subtitle, .highlight-item h4, .service-feature h3');
        headings.forEach((heading, index) => {
            if (!heading.dataset.editId && !heading.closest('.footer') && !heading.closest('.nav-links') && heading.textContent.trim()) {
                heading.dataset.editId = generatePersistentId(heading, 'heading', index);
            }
        });

        // Assign IDs to paragraphs
        const paragraphs = document.querySelectorAll('p, .amenity-description, .event-description, .room-description, .venue-content p, .amenity-detailed-content p, .highlight-item p, .service-feature p, .intro-text p');
        paragraphs.forEach((p, index) => {
            if (!p.dataset.editId && !p.closest('.footer') && p.textContent.trim()) {
                p.dataset.editId = generatePersistentId(p, 'paragraph', index);
            }
        });

        // Assign IDs to features/list items
        const features = document.querySelectorAll('.feature-item-small, .venue-feature, .event-features-list li, .policy-card li, ul li, ol li');
        features.forEach((feature, index) => {
            if (!feature.dataset.editId && !feature.closest('.footer') && !feature.closest('.nav-links') && feature.textContent.trim()) {
                feature.dataset.editId = generatePersistentId(feature, 'feature', index);
            }
        });

        console.log('✅ IDs assigned');
    }

    // Apply cached edits from localStorage (instant, no flash)
    function applyCachedEdits() {
        const pageUrl = window.location.pathname;
        const cacheKey = `textEdits_${pageUrl}`;
        const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');

        const cachedCount = Object.keys(cached).length;
        if (cachedCount === 0) {
            console.log('📦 No cached edits found');
            return;
        }

        console.log(`📦 Applying ${cachedCount} cached edits instantly...`);

        Object.keys(cached).forEach(elementId => {
            const element = document.querySelector(`[data-edit-id="${elementId}"]`);
            if (element) {
                element.textContent = cached[elementId];
                console.log('⚡ Applied cached edit:', elementId);
            }
        });
    }

    // Load all saved edits
    function loadSavedEdits() {
        const currentPage = window.location.pathname;
        console.log('📄 Current page:', currentPage);

        // FIRST: Assign persistent IDs to all text elements
        assignPersistentIds();

        // SECOND: Apply cached edits INSTANTLY (no waiting for Firebase)
        applyCachedEdits();

        // THIRD: Load from Firebase in background (to sync any changes from other devices)
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

            const cacheKey = `textEdits_${pageUrl}`;
            const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');

            snapshot.forEach((doc) => {
                const data = doc.data();
                const editId = doc.id; // Use document ID as the edit ID
                console.log('📝 Loading text edit from Firebase:', editId, data.tagName, data.text.substring(0, 50));

                // Try to find element by data-edit-id first (most accurate)
                let element = document.querySelector(`[data-edit-id="${editId}"]`);

                if (element) {
                    // Only update if Firebase has different text than what's currently displayed
                    if (element.textContent !== data.text) {
                        element.textContent = data.text;
                        console.log('🔄 Synced from Firebase:', editId);
                    }

                    // Update cache with latest from Firebase
                    cached[editId] = data.text;
                } else {
                    console.log('⚠️ No element found for ID:', editId);
                }
            });

            // Save updated cache
            localStorage.setItem(cacheKey, JSON.stringify(cached));
            console.log('💾 Cache updated with Firebase data');

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
