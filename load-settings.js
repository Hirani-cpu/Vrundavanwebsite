// ===========================
// Load Site Settings from Firebase
// and Apply to Current Page
// ===========================

(function() {
    'use strict';

    // Register Service Worker for permanent image caching
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✓ Service Worker registered for image caching');
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Wait for Firebase to be ready
    function waitForFirebase(callback) {
        if (typeof db !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForFirebase(callback), 100);
        }
    }

    // Load and apply settings
    function loadAndApplySettings() {
        // INSTANT LOAD: Use cached settings first for ZERO delay
        const cachedSettings = localStorage.getItem('siteSettings');
        if (cachedSettings) {
            try {
                const settings = JSON.parse(cachedSettings);
                console.log('⚡ INSTANT: Using cached settings');
                applySettings(settings);
            } catch (e) {
                console.error('Cache parse error:', e);
            }
        }

        // Then update from Firebase in background
        console.log('🔧 Loading site settings from Firebase...');

        db.collection('siteSettings')
            .doc('main')
            .get()
            .then((doc) => {
                if (doc.exists) {
                    const settings = doc.data();
                    console.log('✓ Settings loaded from Firebase');

                    // Save to cache for next time
                    localStorage.setItem('siteSettings', JSON.stringify(settings));

                    // Apply settings (will update if different from cache)
                    applySettings(settings);
                } else {
                    console.log('⚠️ No custom settings found. Using defaults.');
                }
            })
            .catch((error) => {
                console.error('Error loading settings:', error);
            });
    }

    // Apply settings to the current page
    function applySettings(settings) {
        // Update Site Name/Title
        if (settings.siteName) {
            // Update navigation logo text
            const navLogoLinks = document.querySelectorAll('.logo a, .navbar .logo a');
            navLogoLinks.forEach(link => {
                link.textContent = settings.siteName;
            });

            // Update footer heading
            const footerHeadings = document.querySelectorAll('.footer-section h3');
            footerHeadings.forEach(h3 => {
                if (h3.textContent.includes('Vrundavan') || h3.textContent.includes('Resort')) {
                    h3.textContent = settings.siteName;
                }
            });

            // Update copyright text
            const copyrightTexts = document.querySelectorAll('.footer-bottom p');
            copyrightTexts.forEach(p => {
                const yearSpan = p.querySelector('#currentYear');
                const currentYear = yearSpan ? yearSpan.textContent : new Date().getFullYear();
                if (p.textContent.includes('Vrundavan') || p.textContent.includes('All rights reserved')) {
                    p.innerHTML = `&copy; <span id="currentYear">${currentYear}</span> ${settings.siteName}. All rights reserved.`;
                }
            });

            // Update document title if on home page
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                document.title = settings.siteName;
            }
        }

        // Update Logo with aggressive caching
        if (settings.siteLogoUrl) {
            // Preload image for instant display (forces browser cache)
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = settings.siteLogoUrl;
            preloadLink.crossOrigin = 'anonymous'; // Fix CORS preload warning
            document.head.appendChild(preloadLink);

            const logoElements = document.querySelectorAll('.logo-image, .navbar .logo .logo-image');
            logoElements.forEach(el => {
                el.innerHTML = `<img src="${settings.siteLogoUrl}" alt="Logo" style="width: 100px; height: 100px; object-fit: contain;" loading="eager" decoding="sync">`;
            });

            // Force download to browser cache immediately
            const img = new Image();
            img.src = settings.siteLogoUrl;
        }

        // Update Tagline
        if (settings.siteTagline) {
            // Find tagline in footer
            const footerSections = document.querySelectorAll('.footer-section p');
            footerSections.forEach(p => {
                if (p.textContent.includes('perfect destination') || p.textContent.includes('relaxation')) {
                    p.textContent = settings.siteTagline;
                }
            });
        }

        // Update Contact Information in Footer
        if (settings.contactPhone1 || settings.contactPhone2) {
            const contactLists = document.querySelectorAll('.footer-contact');
            contactLists.forEach(list => {
                const phoneItems = list.querySelectorAll('li');
                if (phoneItems.length >= 2) {
                    if (settings.contactPhone1) phoneItems[0].textContent = `📞 ${settings.contactPhone1}`;
                    if (settings.contactPhone2) phoneItems[1].textContent = `📞 ${settings.contactPhone2}`;
                }
            });
        }

        if (settings.contactEmail1 || settings.contactEmail2) {
            const contactLists = document.querySelectorAll('.footer-contact');
            contactLists.forEach(list => {
                const emailItems = Array.from(list.querySelectorAll('li')).filter(li => li.textContent.includes('@'));
                if (emailItems.length >= 1 && settings.contactEmail1) {
                    emailItems[0].textContent = `📧 ${settings.contactEmail1}`;
                }
                if (emailItems.length >= 2 && settings.contactEmail2) {
                    emailItems[1].textContent = `📧 ${settings.contactEmail2}`;
                }
            });
        }

        if (settings.contactAddress) {
            const contactLists = document.querySelectorAll('.footer-contact');
            contactLists.forEach(list => {
                const addressItems = Array.from(list.querySelectorAll('li')).filter(li => li.textContent.includes('📍'));
                if (addressItems.length > 0) {
                    addressItems[0].textContent = `📍 ${settings.contactAddress}`;
                }
            });
        }

        // Update phone links (CTA sections, contact page, etc.)
        if (settings.contactPhone1) {
            const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
            phoneLinks.forEach(link => {
                const cleanPhone = settings.contactPhone1.replace(/\s/g, '');
                link.href = `tel:${cleanPhone}`;
                if (link.textContent.includes('Call:') || link.textContent.includes('📞')) {
                    link.textContent = `Call: ${settings.contactPhone1}`;
                }
            });
        }

        // Update business hours if on rooms page
        if (window.location.pathname.includes('rooms.html')) {
            if (settings.checkInTime) {
                const checkInElements = document.querySelectorAll('.policy-card li');
                checkInElements.forEach(li => {
                    if (li.innerHTML.includes('Check-in:')) {
                        li.innerHTML = `<strong>Check-in:</strong> ${settings.checkInTime}`;
                    }
                });
            }
            if (settings.checkOutTime) {
                const checkOutElements = document.querySelectorAll('.policy-card li');
                checkOutElements.forEach(li => {
                    if (li.innerHTML.includes('Check-out:')) {
                        li.innerHTML = `<strong>Check-out:</strong> ${settings.checkOutTime}`;
                    }
                });
            }
            if (settings.restaurantHours) {
                const restaurantHoursElements = document.querySelectorAll('.policy-card li');
                restaurantHoursElements.forEach(li => {
                    if (li.innerHTML.includes('Restaurant open')) {
                        li.innerHTML = `Restaurant open ${settings.restaurantHours}`;
                    }
                });
            }
        }

        console.log('✓ Settings applied to page');
    }

    // Initialize when DOM and Firebase are ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            waitForFirebase(loadAndApplySettings);
        });
    } else {
        waitForFirebase(loadAndApplySettings);
    }
})();
