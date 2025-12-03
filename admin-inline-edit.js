// ===========================
// Admin Inline Editing System V2
// Click to edit EVERYTHING on the page
// ===========================

(function() {
    'use strict';

    let isAdmin = false;
    let adminIndicator = null;

    // Quick login popup - login directly from any page
    function showQuickLogin() {
        const loginModal = document.createElement('div');
        loginModal.id = 'quickLoginModal';
        loginModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        loginModal.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 15px; max-width: 400px; width: 90%;">
                <h2 style="margin: 0 0 10px 0; color: #2d5016;">🔐 Firebase Login</h2>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Login to enable image uploads</p>
                <div id="quickLoginError" style="display: none; background: #fee; color: #c33; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 14px;"></div>
                <input type="email" id="quickEmail" placeholder="Email" value="admin@vrundavanresort.com" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                <input type="password" id="quickPassword" placeholder="Password" style="width: 100%; padding: 12px; margin-bottom: 20px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                <div style="display: flex; gap: 10px;">
                    <button id="quickLoginBtn" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Login</button>
                    <button id="quickLoginCancel" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(loginModal);

        document.getElementById('quickLoginCancel').onclick = () => {
            loginModal.remove();
        };

        document.getElementById('quickLoginBtn').onclick = async () => {
            const email = document.getElementById('quickEmail').value.trim();
            const password = document.getElementById('quickPassword').value;
            const errorDiv = document.getElementById('quickLoginError');
            const btn = document.getElementById('quickLoginBtn');

            if (!email || !password) {
                errorDiv.textContent = 'Please enter email and password';
                errorDiv.style.display = 'block';
                return;
            }

            btn.textContent = 'Logging in...';
            btn.disabled = true;
            errorDiv.style.display = 'none';

            try {
                // Make sure auth is initialized
                if (!window.auth) {
                    if (firebase.auth) {
                        window.auth = firebase.auth();
                    } else {
                        throw new Error('Firebase Auth not loaded. Please refresh the page.');
                    }
                }

                await window.auth.signInWithEmailAndPassword(email, password);
                btn.textContent = '✅ Success!';
                btn.style.background = '#51cf66';

                localStorage.setItem('adminLoggedIn', 'true');
                localStorage.setItem('adminEmail', email);

                setTimeout(() => {
                    loginModal.remove();
                    location.reload(); // Reload to show green badge
                }, 1000);
            } catch (error) {
                console.error('Login error:', error);
                let errorMsg = 'Login failed';
                if (error.code === 'auth/wrong-password') errorMsg = 'Wrong password';
                else if (error.code === 'auth/user-not-found') errorMsg = 'User not found';
                else if (error.code === 'auth/invalid-email') errorMsg = 'Invalid email';
                else errorMsg = error.message;

                errorDiv.textContent = errorMsg;
                errorDiv.style.display = 'block';
                btn.textContent = 'Login';
                btn.disabled = false;
            }
        };

        // Allow Enter key to submit
        document.getElementById('quickPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('quickLoginBtn').click();
            }
        });
    }

    // Diagnostic function to check authentication status
    function showAuthDiagnostics() {
        let report = '🔍 AUTHENTICATION DIAGNOSTICS\n\n';

        // Check Firebase Auth
        report += '=== FIREBASE AUTH ===\n';
        if (typeof auth === 'undefined') {
            report += '❌ auth is undefined\n';
        } else if (!auth) {
            report += '❌ auth is null\n';
        } else {
            report += '✅ auth object exists\n';
            if (auth.currentUser) {
                report += `✅ LOGGED IN: ${auth.currentUser.email}\n`;
                report += `   UID: ${auth.currentUser.uid}\n`;
            } else {
                report += '❌ NO CURRENT USER (not logged in with Firebase Auth)\n';
            }
        }

        // Check LocalStorage
        report += '\n=== LOCALSTORAGE ===\n';
        const adminLoggedIn = localStorage.getItem('adminLoggedIn');
        const adminEmail = localStorage.getItem('adminEmail');
        const currentUser = localStorage.getItem('currentUser');
        report += `adminLoggedIn: ${adminLoggedIn || 'not set'}\n`;
        report += `adminEmail: ${adminEmail || 'not set'}\n`;
        report += `currentUser: ${currentUser ? 'exists' : 'not set'}\n`;

        // Check Firebase Storage
        report += '\n=== FIREBASE STORAGE ===\n';
        if (typeof storage === 'undefined' || !storage) {
            report += '❌ storage not initialized\n';
        } else {
            report += '✅ storage object exists\n';
        }

        // Conclusion
        report += '\n=== CONCLUSION ===\n';
        if (auth && auth.currentUser) {
            report += '✅ You CAN upload images (Firebase Auth OK)\n';
        } else {
            report += '❌ You CANNOT upload images\n';
            report += '   → You must login via admin.html\n';
            report += '   → LocalStorage login does NOT work for uploads\n';
        }

        alert(report);
        console.log(report);
    }

    // Check if current user is admin
    async function checkAdminStatus() {
        console.log('🔍 Checking admin status...');

        // Check if Admin Editor Mode is disabled
        const editorModeEnabled = localStorage.getItem('adminEditorModeEnabled');
        if (editorModeEnabled === 'false') {
            console.log('❌ Admin Editor Mode is disabled by user');
            return; // Don't activate admin mode
        }

        // Check Firebase Auth FIRST
        if (typeof auth !== 'undefined' && auth) {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // Check if user is ACTUALLY an admin
                    const adminEmails = ['admin@vrundavanresort.com', 'vishal@vrundavanresort.com'];
                    let userIsAdmin = adminEmails.includes(user.email.toLowerCase());

                    // Also check role from Firestore
                    if (!userIsAdmin && typeof db !== 'undefined' && db) {
                        try {
                            const userDoc = await db.collection('users').doc(user.uid).get();
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                userIsAdmin = userData.role === 'admin';
                            }
                        } catch (error) {
                            console.error('Error checking user role:', error);
                        }
                    }

                    if (userIsAdmin) {
                        isAdmin = true;
                        console.log('✅ Admin mode activated via Firebase Auth:', user.email);
                        showAdminMode();
                    } else {
                        console.log('❌ User is not an admin:', user.email);
                        isAdmin = false;
                    }
                } else {
                    checkLocalStorageAdmin();
                }
            });
        } else {
            // No Firebase Auth, check localStorage
            setTimeout(() => checkLocalStorageAdmin(), 500);
        }
    }

    function checkLocalStorageAdmin() {
        // Check if Admin Editor Mode is disabled
        const editorModeEnabled = localStorage.getItem('adminEditorModeEnabled');
        if (editorModeEnabled === 'false') {
            console.log('❌ Admin Editor Mode is disabled by user');
            return; // Don't activate admin mode
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const adminEmails = ['admin@vrundavanresort.com', 'vishal@vrundavanresort.com'];

        // STRICT CHECK: Only activate if email is in admin list
        if (currentUser.email && adminEmails.includes(currentUser.email.toLowerCase())) {
            isAdmin = true;
            console.log('✅ Admin mode activated via localStorage:', currentUser.email);
            showAdminMode();
        } else {
            console.log('❌ Not logged in as admin. Email:', currentUser.email || 'no email');
            isAdmin = false;
        }
    }

    // Show admin mode indicator and initialize editing
    function showAdminMode() {
        if (!isAdmin) return;

        // Create admin mode banner
        createAdminBanner();

        // Wait for page to fully load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeAllEditing);
        } else {
            setTimeout(initializeAllEditing, 1000);
        }
    }

    // Create admin mode indicator banner
    function createAdminBanner() {
        if (document.getElementById('adminModeBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'adminModeBanner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%);
            color: white;
            padding: 10px 20px;
            text-align: center;
            z-index: 999999;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;

        // Check Firebase Auth status
        let authStatus = '❌ Not logged in with Firebase Auth';
        let authColor = '#ff6b6b';
        if (typeof auth !== 'undefined' && auth && auth.currentUser) {
            authStatus = `✅ Firebase Auth: ${auth.currentUser.email}`;
            authColor = '#51cf66';
        } else {
            authStatus = '⚠️ LocalStorage only - Image uploads may fail';
            authColor = '#ffd43b';
        }

        // Add login button if not logged in with Firebase Auth
        let loginButton = '';
        if (!auth || !auth.currentUser) {
            loginButton = `<button id="quickFirebaseLogin" style="
                margin-left: 10px;
                padding: 5px 15px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
                animation: pulse 2s infinite;
            ">🔐 Login to Upload Images</button>`;
        }

        banner.innerHTML = `
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            </style>
            ✏️ ADMIN EDITING MODE - Click any ✏️ pencil icon to edit content
            <span style="margin-left: 20px; background: ${authColor}; color: #000; padding: 5px 10px; border-radius: 5px; font-size: 12px;">${authStatus}</span>
            ${loginButton}
            <button id="adminModeToggle" style="
                margin-left: 20px;
                padding: 5px 15px;
                background: white;
                color: #2d5016;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
            ">Refresh Editors</button>
        `;
        document.body.insertBefore(banner, document.body.firstChild);
        document.body.style.paddingTop = '50px';

        document.getElementById('adminModeToggle').onclick = initializeAllEditing;

        // Add quick login button handler
        if (!auth || !auth.currentUser) {
            const loginBtn = document.getElementById('quickFirebaseLogin');
            if (loginBtn) {
                loginBtn.onclick = showQuickLogin;
            }
        }

        adminIndicator = banner;

        // If not Firebase Auth, just show in banner - NO POPUP, NO REDIRECT
        // User can manually go to admin.html if they want to login
    }

    // Initialize ALL editing capabilities
    function initializeAllEditing() {
        console.log('🎨 Initializing admin editing for ALL elements...');

        // Remove existing edit buttons first
        document.querySelectorAll('.admin-edit-btn').forEach(btn => btn.remove());

        // Add edit buttons to EVERYTHING (this assigns persistent IDs)
        addEditToSections();
        addEditToHeadings();
        addEditToImages();
        addEditToCards();
        addEditToHeroSection();

        // Load saved images from Firestore AFTER IDs are assigned
        loadSavedImages();

        console.log('✅ Admin editing initialized!');
    }

    // Load all saved images from Firestore and apply them
    async function loadSavedImages() {
        if (typeof db === 'undefined' || !db) {
            console.log('⚠️ Firestore not available, skipping image load');
            return;
        }

        try {
            const pageUrl = window.location.pathname;
            console.log('📥 Loading saved images for:', pageUrl);

            // Load all saved content for this page
            const snapshot = await db.collection('pageContent')
                .where('pageType', '==', pageUrl)
                .where('elementType', '==', 'image')
                .get();

            if (snapshot.empty) {
                console.log('No saved images found for this page');
                return;
            }

            let appliedCount = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                const elementId = doc.id;
                const imageUrl = data.imageUrl;

                // Find element with this ID
                const element = document.querySelector(`[data-edit-id="${elementId}"]`);
                if (element && imageUrl) {
                    // Apply the saved image
                    if (element.tagName === 'IMG') {
                        element.src = imageUrl;
                    } else {
                        // Apply the image - overriding any inline gradient
                        element.style.background = `url('${imageUrl}') center/cover no-repeat`;
                        element.style.backgroundSize = 'cover';
                        element.style.backgroundPosition = 'center';

                        // Hide label text
                        const label = element.querySelector('.amenity-label, span');
                        if (label && label.textContent && label.textContent.trim()) {
                            label.style.display = 'none';
                        }
                    }
                    appliedCount++;
                    console.log(`✅ Applied saved image to:`, elementId);
                }
            });

            if (appliedCount > 0) {
                console.log(`✅ Applied ${appliedCount} saved images`);
            }
        } catch (error) {
            console.error('Error loading saved images:', error);
        }
    }

    // Add edit to all major sections
    function addEditToSections() {
        const sections = document.querySelectorAll('section, .section, .container');
        console.log(`Found ${sections.length} sections`);

        sections.forEach((section, index) => {
            if (!section.querySelector('.admin-edit-btn') && section.offsetHeight > 50) {
                const btn = createEditButton('section');
                btn.onclick = () => openSectionEditor(section);
                section.style.position = 'relative';
                section.appendChild(btn);
            }
        });
    }

    // Add edit to all headings
    function addEditToHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .section-title, .hero-title, .welcome-heading, .hero-subtitle, .highlight-item h4, .service-feature h3');
        console.log(`Found ${headings.length} headings`);

        headings.forEach((heading, index) => {
            if (!heading.closest('.admin-edit-btn') &&
                !heading.querySelector('.admin-edit-btn') &&
                heading.textContent.trim() &&
                heading.offsetHeight > 0) {

                // Assign persistent ID based on content and position
                if (!heading.dataset.editId) {
                    heading.dataset.editId = generatePersistentId(heading, 'heading', index);
                }

                const wrapper = document.createElement('span');
                wrapper.style.cssText = 'position: relative; display: inline-block;';

                heading.parentNode.insertBefore(wrapper, heading);
                wrapper.appendChild(heading);

                const btn = createEditButton('text', 'small');
                btn.onclick = () => openTextEditor(heading);
                wrapper.appendChild(btn);
            }
        });

        // Add edit to ALL paragraphs (descriptions, content, etc.)
        const paragraphs = document.querySelectorAll('p, .amenity-description, .event-description, .room-description, .venue-content p, .amenity-detailed-content p, .highlight-item p, .service-feature p, .intro-text p, .package-price, .package-subtitle');
        console.log(`Found ${paragraphs.length} paragraphs`);

        paragraphs.forEach((p, index) => {
            // Skip if already has edit button, is in footer, or is empty
            if (!p.closest('.admin-edit-btn') &&
                !p.querySelector('.admin-edit-btn') &&
                !p.closest('.footer') &&
                p.textContent.trim() &&
                p.offsetHeight > 0) {

                // Assign persistent ID based on content and position
                if (!p.dataset.editId) {
                    p.dataset.editId = generatePersistentId(p, 'paragraph', index);
                }

                const wrapper = document.createElement('span');
                wrapper.style.cssText = 'position: relative; display: block;';

                p.parentNode.insertBefore(wrapper, p);
                wrapper.appendChild(p);

                const btn = createEditButton('text', 'small');
                btn.onclick = () => openTextEditor(p);
                wrapper.appendChild(btn);
            }
        });

        // Add edit to list items and feature items
        const features = document.querySelectorAll('.feature-item-small, .venue-feature, .event-features-list li, .policy-card li, ul li, ol li');
        console.log(`Found ${features.length} feature items`);

        features.forEach((feature, index) => {
            if (!feature.closest('.admin-edit-btn') &&
                !feature.querySelector('.admin-edit-btn') &&
                !feature.closest('.footer') &&
                !feature.closest('.nav-links') &&
                feature.textContent.trim() &&
                feature.offsetHeight > 0) {

                // Assign persistent ID based on content and position
                if (!feature.dataset.editId) {
                    feature.dataset.editId = generatePersistentId(feature, 'feature', index);
                }

                const wrapper = document.createElement('span');
                wrapper.style.cssText = 'position: relative; display: block;';

                feature.parentNode.insertBefore(wrapper, feature);
                wrapper.appendChild(feature);

                const btn = createEditButton('text', 'small');
                btn.onclick = () => openTextEditor(feature);
                wrapper.appendChild(btn);
            }
        });
    }

    // Add edit to all images
    function addEditToImages() {
        // Hero sections
        const heroes = document.querySelectorAll('.hero, .hero-home, .cta-section');
        console.log(`Found ${heroes.length} hero sections`);

        heroes.forEach((hero, index) => {
            if (!hero.querySelector('.admin-edit-btn')) {
                // Assign persistent ID
                if (!hero.dataset.editId) {
                    hero.dataset.editId = generatePersistentId(hero, 'hero', index);
                }
                const btn = createEditButton('image');
                btn.onclick = () => openImageEditor(hero);
                hero.style.position = 'relative';
                hero.appendChild(btn);
            }
        });

        // Image placeholder elements (like Resort View)
        const placeholders = document.querySelectorAll('.image-placeholder');
        console.log(`Found ${placeholders.length} image placeholders`);

        placeholders.forEach((placeholder, index) => {
            if (!placeholder.querySelector('.admin-edit-btn')) {
                // Assign persistent ID
                if (!placeholder.dataset.editId) {
                    placeholder.dataset.editId = generatePersistentId(placeholder, 'placeholder', index);
                }
                const btn = createEditButton('image', 'small');
                btn.onclick = () => openImageEditor(placeholder);
                placeholder.style.position = 'relative';
                placeholder.appendChild(btn);
            }
        });

        // Amenity detailed images (Swimming pool, Party hall, Garden, Restaurant)
        const amenityImages = document.querySelectorAll('.amenity-detailed-image');
        console.log(`Found ${amenityImages.length} amenity detailed images`);

        amenityImages.forEach((img, index) => {
            if (!img.querySelector('.admin-edit-btn')) {
                // Assign persistent ID
                if (!img.dataset.editId) {
                    img.dataset.editId = generatePersistentId(img, 'amenity-image', index);
                }
                const btn = createEditButton('image');
                btn.onclick = () => openImageEditor(img);
                img.style.position = 'relative';
                img.appendChild(btn);
            }
        });

        // Venue images (Events & Parties page - Garden/Lawn, AC Party Hall, etc.)
        const venueImages = document.querySelectorAll('.venue-image');
        console.log(`Found ${venueImages.length} venue images`);

        venueImages.forEach((img, index) => {
            if (!img.querySelector('.admin-edit-btn')) {
                // Assign persistent ID
                if (!img.dataset.editId) {
                    img.dataset.editId = generatePersistentId(img, 'venue-image', index);
                }
                const btn = createEditButton('image');
                btn.onclick = () => openImageEditor(img);
                img.style.position = 'relative';
                img.appendChild(btn);
            }
        });

        // Service cards with background images (Fine Dining, etc.)
        const serviceCards = document.querySelectorAll('.service-card');
        console.log(`Found ${serviceCards.length} service cards`);

        serviceCards.forEach((card, index) => {
            if (!card.querySelector('.admin-edit-btn')) {
                // Assign persistent ID
                if (!card.dataset.editId) {
                    const cardTitle = card.querySelector('h3')?.textContent || 'service';
                    card.dataset.editId = `service-card_${cardTitle.replace(/\s+/g, '-').toLowerCase()}_${index}`;
                }
                const btn = createEditButton('image', 'small');
                btn.onclick = () => openImageEditor(card);
                card.style.position = 'relative';
                card.appendChild(btn);
            }
        });

        // Image elements
        const images = document.querySelectorAll('img');
        console.log(`Found ${images.length} images`);

        images.forEach((img, index) => {
            if (!img.closest('.admin-edit-btn') && img.offsetHeight > 50) {
                // Assign persistent ID
                if (!img.dataset.editId) {
                    img.dataset.editId = generatePersistentId(img, 'img', index);
                }
                const wrapper = img.parentElement;
                if (wrapper && !wrapper.querySelector('.admin-edit-btn')) {
                    const btn = createEditButton('image', 'small');
                    btn.onclick = () => openImageEditorForImg(img);
                    wrapper.style.position = 'relative';
                    wrapper.appendChild(btn);
                }
            }
        });
    }

    // Add edit to all card-like elements
    function addEditToCards() {
        const cards = document.querySelectorAll(
            '.amenity-card, .event-type-card, .venue-detail-card, .feature-card, ' +
            '.room-detail-card, .room-detail-card-compact, .service-card, .cta-card'
        );
        console.log(`Found ${cards.length} cards`);

        cards.forEach((card) => {
            if (!card.querySelector('.admin-edit-btn')) {
                const btn = createEditButton('card');
                btn.onclick = () => openCardEditor(card);
                card.style.position = 'relative';
                card.appendChild(btn);
            }
        });
    }

    // Add edit to hero section specifically
    function addEditToHeroSection() {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            const title = heroContent.querySelector('.hero-title, h1');
            const subtitle = heroContent.querySelector('.hero-subtitle, p');

            if (title && !title.querySelector('.admin-edit-btn')) {
                const btn = createEditButton('text', 'small');
                btn.onclick = () => openTextEditor(title);
                title.style.position = 'relative';
                title.style.display = 'inline-block';
                title.appendChild(btn);
            }

            if (subtitle && !subtitle.querySelector('.admin-edit-btn')) {
                const btn = createEditButton('text', 'small');
                btn.onclick = () => openTextEditor(subtitle);
                subtitle.style.position = 'relative';
                subtitle.style.display = 'inline-block';
                subtitle.appendChild(btn);
            }
        }
    }

    // Create edit button
    function createEditButton(type = 'default', size = 'normal') {
        const btn = document.createElement('button');
        btn.className = 'admin-edit-btn';
        btn.innerHTML = '✏️';
        btn.title = `Edit ${type} (Admin Only)`;

        const isSmall = size === 'small';

        btn.style.cssText = `
            position: absolute;
            top: ${isSmall ? '5px' : '10px'};
            right: ${isSmall ? '5px' : '10px'};
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #4a7c2c;
            border-radius: 50%;
            width: ${isSmall ? '30px' : '40px'};
            height: ${isSmall ? '30px' : '40px'};
            font-size: ${isSmall ? '14px' : '18px'};
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        btn.onmouseover = () => {
            btn.style.background = '#4a7c2c';
            btn.style.transform = 'scale(1.15)';
        };

        btn.onmouseout = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.95)';
            btn.style.transform = 'scale(1)';
        };

        return btn;
    }

    // Open text editor
    function openTextEditor(element) {
        const currentText = element.textContent || element.innerText || '';
        const tagName = element.tagName.toLowerCase();

        const modal = createModal('Edit Text', `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Element Type:</label>
                <input type="text" value="${tagName}" disabled style="width: 100%; padding: 10px; background: #f5f5f5; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Text Content:</label>
                <textarea id="textContent" rows="5" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical; font-family: inherit;">${currentText}</textarea>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="saveText" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Save Text</button>
                <button id="cancelText" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('saveText').onclick = () => {
            const newText = document.getElementById('textContent').value;

            // Use element's persistent ID (should already be set)
            const elementId = element.dataset.editId;
            if (!elementId) {
                alert('⚠️ Element ID not found. Please refresh the page and try again.');
                closeModal();
                return;
            }

            // Update UI IMMEDIATELY (no waiting)
            element.textContent = newText;
            closeModal();
            showToast('✅ Text updated!', 'success');

            // Cache in localStorage for instant load on next page refresh
            cacheTextEdit(elementId, newText);

            // Save to Firebase in background (non-blocking)
            saveToFirestore('pageText', elementId, {
                text: newText,
                tagName: tagName,
                pageUrl: window.location.pathname,
                updatedAt: new Date().toISOString()
            }).then(() => {
                console.log('✅ Text saved with ID:', elementId);
            }).catch(err => {
                console.error('Error saving:', err);
                showToast('⚠️ Failed to save to database', 'error');
            });
        };

        document.getElementById('cancelText').onclick = () => closeModal();
    }

    // Open image editor
    function openImageEditor(element) {
        const currentBg = element.style.backgroundImage?.match(/url\(["']?([^"']*)["']?\)/)?.[1] || '';

        const modal = createModal('Edit Background Image', `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600;">Current Image:</label>
                <div style="width: 100%; height: 200px; background: #f5f5f5; border-radius: 8px; background-image: ${element.style.backgroundImage || 'none'}; background-size: cover; background-position: center;"></div>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600;">Upload New Image:</label>
                <input type="file" id="imageUpload" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #4a7c2c; border-radius: 8px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="saveImage" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Upload & Save</button>
                <button id="deleteImage" style="flex: 1; padding: 12px; background: #ff6b6b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Delete Image</button>
                <button id="cancelImage" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('saveImage').onclick = () => saveImage(element, 'background');
        document.getElementById('deleteImage').onclick = () => deleteImage(element, 'background');
        document.getElementById('cancelImage').onclick = () => closeModal();
    }

    // Open image editor for <img> tags
    function openImageEditorForImg(img) {
        const modal = createModal('Edit Image', `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600;">Current Image:</label>
                <img src="${img.src}" style="width: 100%; height: auto; max-height: 200px; object-fit: contain; border-radius: 8px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600;">Upload New Image:</label>
                <input type="file" id="imageUpload" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #4a7c2c; border-radius: 8px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="saveImage" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Upload & Save</button>
                <button id="deleteImage" style="flex: 1; padding: 12px; background: #ff6b6b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Delete Image</button>
                <button id="cancelImage" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('saveImage').onclick = () => saveImage(img, 'src');
        document.getElementById('deleteImage').onclick = () => deleteImage(img, 'src');
        document.getElementById('cancelImage').onclick = () => closeModal();
    }

    // Open card editor (comprehensive)
    function openCardEditor(card) {
        const title = card.querySelector('h1, h2, h3, h4, .amenity-name, .event-title, .room-name')?.textContent || '';
        const description = card.querySelector('p, .amenity-description, .event-description, .room-description')?.textContent || '';
        const icon = card.querySelector('.amenity-icon, .event-type-icon')?.textContent || '';

        const modal = createModal('Edit Card Content', `
            ${icon ? `<div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Icon (Emoji):</label>
                <input type="text" id="cardIcon" value="${icon}" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 24px;" maxlength="2">
            </div>` : ''}
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Title:</label>
                <input type="text" id="cardTitle" value="${title}" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Description:</label>
                <textarea id="cardDescription" rows="4" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;">${description}</textarea>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Upload New Image (Optional):</label>
                <input type="file" id="cardImageUpload" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #4a7c2c; border-radius: 8px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="saveCard" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Save Changes</button>
                <button id="cancelCard" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('saveCard').onclick = () => saveCard(card);
        document.getElementById('cancelCard').onclick = () => closeModal();
    }

    // Open section editor
    function openSectionEditor(section) {
        const headings = Array.from(section.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent).join(', ') || 'No headings';
        const hasBackgroundImage = section.style.backgroundImage && section.style.backgroundImage !== 'none';

        const modal = createModal('Edit Section', `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Section Contains:</label>
                <input type="text" value="${headings}" disabled style="width: 100%; padding: 10px; background: #f5f5f5; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            <div style="margin-bottom: 20px;">
                <p style="color: #666; font-size: 0.95rem;">This section contains multiple elements. You can:</p>
                <ul style="color: #666; font-size: 0.95rem; margin-top: 10px;">
                    <li>Click individual text ✏️ icons to edit text</li>
                    <li>Click card ✏️ icons to edit cards</li>
                    <li>Upload or delete the background image here</li>
                </ul>
            </div>
            ${hasBackgroundImage ? `
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Current Background:</label>
                    <div style="width: 100%; height: 150px; background-image: ${section.style.backgroundImage}; background-size: cover; background-position: center; border-radius: 8px;"></div>
                </div>
            ` : ''}
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Section Background Image (Optional):</label>
                <input type="file" id="sectionImageUpload" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #4a7c2c; border-radius: 8px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="saveSection" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Upload Image</button>
                ${hasBackgroundImage ? '<button id="deleteSectionBg" style="flex: 1; padding: 12px; background: #ff6b6b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Delete Image</button>' : ''}
                <button id="cancelSection" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('saveSection').onclick = () => saveImage(section, 'background');

        const deleteSectionBtn = document.getElementById('deleteSectionBg');
        if (deleteSectionBtn) {
            deleteSectionBtn.onclick = () => deleteImage(section, 'background');
        }

        document.getElementById('cancelSection').onclick = () => closeModal();
    }

    // Save card
    async function saveCard(card) {
        const iconInput = document.getElementById('cardIcon');
        const icon = iconInput ? iconInput.value : null;
        const title = document.getElementById('cardTitle').value;
        const description = document.getElementById('cardDescription').value;
        const fileInput = document.getElementById('cardImageUpload');
        const file = fileInput?.files[0];

        if (!title) {
            alert('Please enter a title.');
            return;
        }

        try {
            const btn = document.getElementById('saveCard');
            btn.textContent = 'Saving...';
            btn.disabled = true;

            // Update text
            if (icon) {
                const iconElement = card.querySelector('.amenity-icon, .event-type-icon');
                if (iconElement) iconElement.textContent = icon;
            }

            const titleElement = card.querySelector('h1, h2, h3, h4, .amenity-name, .event-title, .room-name');
            if (titleElement) titleElement.textContent = title;

            const descElement = card.querySelector('p, .amenity-description, .event-description, .room-description');
            if (descElement) descElement.textContent = description;

            // Upload image if provided
            let imageUrl = card.style.backgroundImage?.match(/url\(["']?([^"']*)["']?\)/)?.[1] || '';
            if (file) {
                const compressedFile = await compressImage(file); // Use HIGH QUALITY defaults
                imageUrl = await uploadToFirebase(compressedFile, 'cards');

                if (card.style.backgroundImage !== undefined) {
                    card.style.backgroundImage = `url('${imageUrl}')`;
                }
            }

            // Save to Firestore with the card's ID
            const cardId = card.dataset.editId || generateId();
            card.dataset.editId = cardId;

            // Determine collection based on card type
            let collection = 'cardContent';
            if (card.classList.contains('amenity-card')) {
                collection = 'amenities';
            } else if (card.classList.contains('venue-detail-card') || card.classList.contains('event-type-card')) {
                collection = 'eventContent';
            }

            // Close modal immediately (instant feedback)
            closeModal();
            showToast('✅ Card updated!', 'success');

            // Save to Firestore in background
            saveToFirestore(collection, cardId, {
                icon: icon || '',
                title: title,
                description: description,
                imageUrl: imageUrl,
                pageUrl: window.location.pathname,
                updatedAt: new Date().toISOString()
            }).then(() => {
                console.log('✅ Card saved to database');
            }).catch(err => {
                console.error('Error saving card metadata:', err);
                showToast('⚠️ Failed to save to database', 'error');
            });
        } catch (error) {
            console.error('Error saving card:', error);

            // If auth error, redirect to admin.html
            if (error.message.includes('NOT LOGGED IN WITH FIREBASE AUTH')) {
                if (confirm(error.message)) {
                    window.location.href = 'admin.html';
                }
            } else if (error.message.includes('unauthorized') || error.code === 'storage/unauthorized') {
                if (confirm('❌ Firebase Storage Error: Unauthorized\n\nYou are NOT logged in with Firebase Auth.\nYou must login via admin.html first.\n\nClick OK to go to admin.html now.')) {
                    window.location.href = 'admin.html';
                }
            } else {
                alert('Error: ' + error.message);
            }

            document.getElementById('saveCard').disabled = false;
        }
    }

    // Save image
    async function saveImage(element, updateType) {
        const fileInput = document.getElementById('imageUpload') || document.getElementById('sectionImageUpload');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select an image to upload.');
            return;
        }

        try {
            const btn = document.getElementById('saveImage') || document.getElementById('saveSection');
            btn.textContent = 'Uploading...';
            btn.disabled = true;

            const compressedFile = await compressImage(file); // Use HIGH QUALITY defaults
            const imageUrl = await uploadToFirebase(compressedFile, 'images');

            if (updateType === 'background') {
                // Apply the image - overriding any inline gradient
                element.style.background = `url('${imageUrl}') center/cover no-repeat`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';

                // Hide label text when image is uploaded
                const label = element.querySelector('.amenity-label, span');
                if (label && label.textContent && label.textContent.trim()) {
                    label.style.display = 'none';
                }
            } else if (updateType === 'src') {
                element.src = imageUrl;
            }

            // Save to Firestore
            const elementId = element.dataset.editId || generateId();
            element.dataset.editId = elementId;

            // Save to Firestore in background
            saveToFirestore('pageContent', elementId, {
                imageUrl: imageUrl,
                pageType: window.location.pathname,
                elementType: 'image',
                updatedAt: new Date().toISOString()
            }).then(() => {
                console.log('✅ Image saved to database');
            }).catch(err => {
                console.error('Error saving image metadata:', err);
            });

            // Close modal immediately after UI update
            closeModal();
            showToast('✅ Image uploaded!', 'success');
        } catch (error) {
            console.error('Error saving image:', error);

            // If auth error, redirect to admin.html
            if (error.message.includes('NOT LOGGED IN WITH FIREBASE AUTH')) {
                if (confirm(error.message)) {
                    window.location.href = 'admin.html';
                }
            } else if (error.message.includes('unauthorized') || error.code === 'storage/unauthorized') {
                if (confirm('❌ Firebase Storage Error: Unauthorized\n\nYou are NOT logged in with Firebase Auth.\nYou must login via admin.html first.\n\nClick OK to go to admin.html now.')) {
                    window.location.href = 'admin.html';
                }
            } else {
                alert('Error uploading image: ' + error.message);
            }
        }
    }

    // Delete image
    async function deleteImage(element, updateType) {
        if (!confirm('⚠️ Are you sure you want to delete this image?\n\nThis will remove the image and restore the default gradient background.')) {
            return;
        }

        try {
            const btn = document.getElementById('deleteImage');
            if (btn) {
                btn.textContent = 'Deleting...';
                btn.disabled = true;
            }

            // Remove the image
            if (updateType === 'background') {
                // Remove background image, keep original gradient if it exists
                element.style.backgroundImage = 'none';

                // If element has a data-original-bg attribute, restore it
                const originalBg = element.getAttribute('data-original-bg');
                if (originalBg) {
                    element.style.background = originalBg;
                }
            } else if (updateType === 'src') {
                // For <img> tags, remove src or set to placeholder
                element.src = '';
                element.alt = 'Image removed';
            }

            // Delete from Firestore if it exists
            const elementId = element.dataset.editId;
            if (elementId) {
                await db.collection('pageContent').doc(elementId).delete();
                console.log('✅ Image deleted from database');
            }

            alert('✅ Image deleted successfully!');
            closeModal();
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Error deleting image: ' + error.message);

            const btn = document.getElementById('deleteImage');
            if (btn) {
                btn.textContent = 'Delete Image';
                btn.disabled = false;
            }
        }
    }

    // Helper: HIGH QUALITY compression for professional images
    function compressImage(file, maxWidth = 1920, quality = 0.92) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const aspectRatio = img.width / img.height;
                    let width, height;

                    // Only resize if VERY large (keep full resolution for most images)
                    if (img.width > maxWidth) {
                        width = maxWidth;
                        height = maxWidth / aspectRatio;
                    } else {
                        width = img.width;
                        height = img.height;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');

                    // MAXIMUM quality smoothing for professional images
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        console.log(`📸 HIGH QUALITY: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
                        resolve(compressedFile);
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
        });
    }

    // Helper: Upload to Firebase
    async function uploadToFirebase(file, folder) {
        if (typeof storage === 'undefined' || !storage) {
            throw new Error('Firebase Storage not initialized');
        }

        // CHECK: Is user authenticated with Firebase Auth?
        if (typeof auth === 'undefined' || !auth || !auth.currentUser) {
            throw new Error('❌ NOT LOGGED IN WITH FIREBASE AUTH!\n\nYou must login via admin.html first.\nLocalStorage login does NOT work for image uploads.\n\nClick OK to go to admin.html now.');
        }

        console.log('✅ Firebase Auth OK:', auth.currentUser.email);
        console.log('📤 Uploading to:', folder);

        const fileName = `${folder}/${Date.now()}-${file.name}`;
        const storageRef = storage.ref();
        const fileRef = storageRef.child(fileName);

        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();

        console.log('✅ Upload successful:', downloadURL);
        return downloadURL;
    }

    // Helper: Save to Firestore
    async function saveToFirestore(collection, docId, data) {
        if (typeof db === 'undefined' || !db) {
            console.warn('Firestore not initialized');
            return;
        }

        await db.collection(collection).doc(docId).set(data, { merge: true });
    }

    // Helper: Generate ID
    function generateId() {
        return 'edit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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

    // Cache text edit in localStorage for instant load
    function cacheTextEdit(elementId, text) {
        try {
            const pageUrl = window.location.pathname;
            const cacheKey = `textEdits_${pageUrl}`;
            const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            cached[elementId] = text;
            localStorage.setItem(cacheKey, JSON.stringify(cached));
            console.log('📦 Cached text edit:', elementId);
        } catch (err) {
            console.error('Error caching text:', err);
        }
    }

    // Show toast notification (non-blocking)
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#4a7c2c' : '#dc3545'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            font-weight: 600;
            z-index: 99999999;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Create modal
    function createModal(title, content) {
        const existingModal = document.getElementById('adminEditModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'adminEditModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999998;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 15px; padding: 30px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <h2 style="margin: 0 0 20px 0; color: #2d5016; font-family: 'Playfair Display', serif;">${title}</h2>
                ${content}
            </div>
        `;

        document.body.appendChild(modal);

        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        return modal;
    }

    // Close modal
    function closeModal() {
        const modal = document.getElementById('adminEditModal');
        if (modal) modal.remove();
    }

    // Load saved images for ALL users (not just admins)
    // This runs on EVERY page load for EVERYONE
    async function loadPublicSavedImages() {
        if (typeof db === 'undefined' || !db) {
            console.log('⚠️ Firestore not available for public image load');
            return;
        }

        try {
            const pageUrl = window.location.pathname;
            console.log('🌍 Loading public images for:', pageUrl);

            const snapshot = await db.collection('pageContent')
                .where('pageType', '==', pageUrl)
                .where('elementType', '==', 'image')
                .get();

            if (snapshot.empty) {
                console.log('No public images found for this page');
                return;
            }

            let appliedCount = 0;
            console.log('📦 Found', snapshot.size, 'saved images in database');

            snapshot.forEach(doc => {
                const data = doc.data();
                const elementId = doc.id;
                const imageUrl = data.imageUrl;

                console.log('🖼️ Processing:', elementId, '→', imageUrl?.substring(0, 50) + '...');

                if (!imageUrl) {
                    console.log('⚠️ Skipping - no imageUrl');
                    return;
                }

                // Try to find element by ID first
                let element = document.querySelector(`[data-edit-id="${elementId}"]`);

                // If not found, try to assign IDs and find elements by common selectors
                if (!element) {
                    // Service cards - match by title
                    if (elementId.startsWith('service-card_')) {
                        console.log('🔍 Looking for service card:', elementId);
                        const cards = document.querySelectorAll('.service-card');
                        console.log('📋 Found', cards.length, 'service cards');

                        cards.forEach((card, index) => {
                            const cardTitle = card.querySelector('h3')?.textContent || 'service';
                            const expectedId = `service-card_${cardTitle.replace(/\s+/g, '-').toLowerCase()}_${index}`;
                            console.log(`  Card ${index}: "${cardTitle}" → ID: ${expectedId}`);

                            if (!card.dataset.editId) {
                                card.dataset.editId = expectedId;
                            }
                            if (card.dataset.editId === elementId) {
                                element = card;
                                console.log('✅ MATCHED! Found element for:', elementId);
                            }
                        });

                        if (!element) {
                            console.log('❌ NO MATCH found for:', elementId);
                        }
                    }

                    // Hero sections
                    if (elementId.startsWith('hero_')) {
                        const heroes = document.querySelectorAll('.hero, .hero-home, .cta-section');
                        heroes.forEach((hero, index) => {
                            if (!hero.dataset.editId) {
                                hero.dataset.editId = generatePersistentId(hero, 'hero', index);
                            }
                            if (hero.dataset.editId === elementId) {
                                element = hero;
                            }
                        });
                    }

                    // Venue images
                    if (elementId.startsWith('venue-image_')) {
                        const venues = document.querySelectorAll('.venue-image');
                        venues.forEach((venue, index) => {
                            if (!venue.dataset.editId) {
                                venue.dataset.editId = generatePersistentId(venue, 'venue-image', index);
                            }
                            if (venue.dataset.editId === elementId) {
                                element = venue;
                            }
                        });
                    }

                    // Amenity images
                    if (elementId.startsWith('amenity-image_')) {
                        const amenities = document.querySelectorAll('.amenity-detailed-image');
                        amenities.forEach((amenity, index) => {
                            if (!amenity.dataset.editId) {
                                amenity.dataset.editId = generatePersistentId(amenity, 'amenity-image', index);
                            }
                            if (amenity.dataset.editId === elementId) {
                                element = amenity;
                            }
                        });
                    }
                }

                if (element && imageUrl) {
                    // Apply the saved image
                    if (element.tagName === 'IMG') {
                        console.log('🖼️ Applying to <img> tag');
                        element.src = imageUrl;
                    } else {
                        console.log('🎨 Applying as background image to:', elementId);
                        // Apply the image - overriding any inline gradient
                        element.style.background = `url('${imageUrl}') center/cover no-repeat`;
                        element.style.backgroundSize = 'cover';
                        element.style.backgroundPosition = 'center';

                        // Hide label text
                        const label = element.querySelector('.amenity-label, span');
                        if (label && label.textContent && label.textContent.trim()) {
                            label.style.display = 'none';
                            console.log('   Hidden label text');
                        }

                        console.log('✅ Applied! New background:', element.style.background.substring(0, 60));
                    }
                    appliedCount++;
                    console.log(`✅ Applied public image to:`, elementId);
                } else {
                    console.log('❌ Could not apply - element:', !!element, 'imageUrl:', !!imageUrl);
                }
            });

            if (appliedCount > 0) {
                console.log(`✅ Applied ${appliedCount} public images for all users`);
            }
        } catch (error) {
            console.error('Error loading public images:', error);
        }
    }

    // Initialize - load public images for EVERYONE
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkAdminStatus(); // Check if admin
            loadPublicSavedImages(); // Load images for everyone
        });
    } else {
        checkAdminStatus();
        loadPublicSavedImages();
    }

    // Expose for debugging
    window.adminInlineEdit = {
        isAdmin: () => isAdmin,
        refresh: initializeAllEditing,
        loadPublicImages: loadPublicSavedImages
    };
})();
