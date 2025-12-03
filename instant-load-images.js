// INSTANT IMAGE LOADING - Eliminates gradient flash
// Runs BEFORE Firebase loads, applies cached images immediately

(function() {
    'use strict';

    const CACHE_KEY = 'vrundavan_image_cache_v1';

    // Get cached images from localStorage
    function getCachedImages() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : {};
        } catch (e) {
            console.error('Error reading image cache:', e);
            return {};
        }
    }

    // Save image to cache
    function cacheImage(elementId, imageUrl) {
        try {
            const cache = getCachedImages();
            cache[elementId] = imageUrl;
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            console.log('💾 Cached image:', elementId);
        } catch (e) {
            console.error('Error caching image:', e);
        }
    }

    // Apply cached images INSTANTLY (before Firebase loads)
    function applyInstantImages() {
        const cache = getCachedImages();
        let appliedCount = 0;

        for (const elementId in cache) {
            const imageUrl = cache[elementId];
            const element = document.querySelector(`[data-edit-id="${elementId}"]`);

            if (element && imageUrl) {
                if (element.tagName === 'IMG') {
                    element.src = imageUrl;
                } else {
                    // Apply background image and override inline gradient
                    element.style.background = `url('${imageUrl}') center/cover no-repeat`;
                    element.style.backgroundSize = 'cover';
                    element.style.backgroundPosition = 'center';

                    // Hide label text
                    const label = element.querySelector('.amenity-label, span');
                    if (label) {
                        label.style.display = 'none';
                    }
                }
                appliedCount++;
            }
        }

        if (appliedCount > 0) {
            console.log(`⚡ INSTANT: Applied ${appliedCount} cached images (NO gradient flash!)`);
        }
    }

    // Apply images as soon as DOM elements exist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyInstantImages);
    } else {
        applyInstantImages();
    }

    // Re-apply after a short delay to catch dynamically generated IDs
    setTimeout(applyInstantImages, 100);

    // Expose for admin to save images to cache
    window.vrundavanImageCache = {
        cache: cacheImage,
        apply: applyInstantImages,
        get: getCachedImages,
        clear: () => localStorage.removeItem(CACHE_KEY)
    };

    console.log('⚡ Instant image loading initialized - NO MORE GRADIENT FLASH!');
})();
