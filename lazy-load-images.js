// Ultra-fast lazy loading for images
// Loads images only when they're about to appear on screen

(function() {
    'use strict';

    // Add loading="lazy" to all images for native browser lazy loading
    function addNativeLazyLoading() {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.loading = 'lazy';
        });
    }

    // Lazy load background images
    function lazyLoadBackgrounds() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const bgImage = element.getAttribute('data-bg');

                    if (bgImage) {
                        element.style.backgroundImage = `url('${bgImage}')`;
                        element.removeAttribute('data-bg');
                        observer.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before element enters viewport
        });

        // Observe all elements with data-bg attribute
        document.querySelectorAll('[data-bg]').forEach(el => {
            observer.observe(el);
        });
    }

    // Preload critical images that are above the fold
    function preloadCriticalImages() {
        // Preload hero images and first section images
        const criticalImages = document.querySelectorAll('.hero, .hero-home, .page-hero');

        criticalImages.forEach(element => {
            const bgImage = window.getComputedStyle(element).backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const imageUrl = bgImage.match(/url\(["']?([^"']*)["']?\)/)?.[1];
                if (imageUrl) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'image';
                    link.href = imageUrl;
                    document.head.appendChild(link);
                }
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            addNativeLazyLoading();
            lazyLoadBackgrounds();
            preloadCriticalImages();
        });
    } else {
        addNativeLazyLoading();
        lazyLoadBackgrounds();
        preloadCriticalImages();
    }

    console.log('⚡ Lazy loading initialized for ultra-fast image loading');
})();
