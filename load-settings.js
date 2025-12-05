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

        // Update Logo - just change src for instant update
        if (settings.siteLogoUrl) {
            const logoImg = document.getElementById('logoImg');
            if (logoImg) {
                logoImg.src = settings.siteLogoUrl;
            }
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
        const contactLists = document.querySelectorAll('.footer-contact');
        contactLists.forEach(list => {
            const allItems = list.querySelectorAll('li');

            // Find phone items (those with 📞)
            const phoneItems = Array.from(allItems).filter(li => li.textContent.includes('📞'));
            if (phoneItems.length >= 1) {
                if (settings.contactPhone1 && settings.contactPhone1.trim()) {
                    phoneItems[0].textContent = `📞 ${settings.contactPhone1}`;
                    phoneItems[0].style.display = '';
                } else {
                    phoneItems[0].style.display = 'none';
                }
            }
            if (phoneItems.length >= 2) {
                if (settings.contactPhone2 && settings.contactPhone2.trim()) {
                    phoneItems[1].textContent = `📞 ${settings.contactPhone2}`;
                    phoneItems[1].style.display = '';
                } else {
                    phoneItems[1].style.display = 'none';
                }
            }

            // Find email items (those with 📧 or @)
            const emailItems = Array.from(allItems).filter(li => li.textContent.includes('📧') || li.textContent.includes('@'));
            if (emailItems.length >= 1) {
                if (settings.contactEmail1 && settings.contactEmail1.trim()) {
                    emailItems[0].textContent = `📧 ${settings.contactEmail1}`;
                    emailItems[0].style.display = '';
                } else {
                    emailItems[0].style.display = 'none';
                }
            }
            if (emailItems.length >= 2) {
                if (settings.contactEmail2 && settings.contactEmail2.trim()) {
                    emailItems[1].textContent = `📧 ${settings.contactEmail2}`;
                    emailItems[1].style.display = '';
                } else {
                    emailItems[1].style.display = 'none';
                }
            }

            // Find address items (those with 📍)
            const addressItems = Array.from(allItems).filter(li => li.textContent.includes('📍'));
            if (addressItems.length > 0) {
                if (settings.contactAddress && settings.contactAddress.trim()) {
                    addressItems[0].textContent = `📍 ${settings.contactAddress}`;
                    addressItems[0].style.display = '';
                } else {
                    addressItems[0].style.display = 'none';
                }
            }
        });

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

        // Update Contact Page Contact Information
        if (window.location.pathname.includes('contact.html')) {
            // Update phone numbers
            const contactPhones = document.querySelectorAll('.contact-detail-info a[href^="tel:"]');
            if (contactPhones.length >= 1 && settings.contactPhone1) {
                contactPhones[0].href = `tel:${settings.contactPhone1.replace(/\s/g, '')}`;
                contactPhones[0].textContent = settings.contactPhone1;
            }
            if (contactPhones.length >= 2 && settings.contactPhone2) {
                contactPhones[1].href = `tel:${settings.contactPhone2.replace(/\s/g, '')}`;
                contactPhones[1].textContent = settings.contactPhone2;
                contactPhones[1].parentElement.style.display = ''; // Show if available
            } else if (contactPhones.length >= 2) {
                contactPhones[1].parentElement.style.display = 'none'; // Hide if not set
            }

            // Update emails
            const contactEmails = document.querySelectorAll('.contact-detail-info a[href^="mailto:"]');
            if (contactEmails.length >= 1 && settings.contactEmail1) {
                contactEmails[0].href = `mailto:${settings.contactEmail1}`;
                contactEmails[0].textContent = settings.contactEmail1;
            }
            if (contactEmails.length >= 2 && settings.contactEmail2) {
                contactEmails[1].href = `mailto:${settings.contactEmail2}`;
                contactEmails[1].textContent = settings.contactEmail2;
                contactEmails[1].parentElement.style.display = ''; // Show if available
            } else if (contactEmails.length >= 2) {
                contactEmails[1].parentElement.style.display = 'none'; // Hide if not set
            }

            // Update address
            if (settings.contactAddress) {
                const addressItems = document.querySelectorAll('.contact-detail-item');
                addressItems.forEach(item => {
                    if (item.textContent.includes('Location') || item.textContent.includes('📍')) {
                        const addressInfo = item.querySelector('.contact-detail-info');
                        if (addressInfo) {
                            const h3 = addressInfo.querySelector('h3');
                            const addressLines = settings.contactAddress.split('\n');
                            addressInfo.innerHTML = '<h3>Location</h3>';
                            addressLines.forEach(line => {
                                if (line.trim()) {
                                    const p = document.createElement('p');
                                    p.textContent = line.trim();
                                    addressInfo.appendChild(p);
                                }
                            });
                        }
                    }
                });
            }

            // Update operating hours
            const hoursItems = document.querySelectorAll('.contact-detail-item');
            hoursItems.forEach(item => {
                if (item.textContent.includes('Operating Hours') || item.textContent.includes('🕐')) {
                    const hoursInfo = item.querySelector('.contact-detail-info');
                    if (hoursInfo) {
                        hoursInfo.innerHTML = '<h3>Operating Hours</h3>';

                        if (settings.receptionHours) {
                            const receptionP = document.createElement('p');
                            receptionP.innerHTML = `<strong>Reception:</strong> ${settings.receptionHours}`;
                            hoursInfo.appendChild(receptionP);
                        }

                        if (settings.restaurantHours) {
                            const restaurantP = document.createElement('p');
                            restaurantP.innerHTML = `<strong>Restaurant:</strong> ${settings.restaurantHours}`;
                            hoursInfo.appendChild(restaurantP);
                        }

                        if (settings.poolHours) {
                            const poolP = document.createElement('p');
                            poolP.innerHTML = `<strong>Pool:</strong> ${settings.poolHours}`;
                            hoursInfo.appendChild(poolP);
                        }
                    }
                }
            });
        }

        // Update Social Media Links in Footer
        if (settings.facebookUrl) {
            const facebookLink = document.getElementById('facebookLink');
            if (facebookLink) {
                facebookLink.href = settings.facebookUrl;
                facebookLink.style.display = 'block';
            }
        }

        if (settings.instagramUrl) {
            const instagramLink = document.getElementById('instagramLink');
            if (instagramLink) {
                instagramLink.href = settings.instagramUrl;
                instagramLink.style.display = 'block';
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
