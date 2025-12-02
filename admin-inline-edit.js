// ===========================
// Admin Inline Editing System
// Allows admins to edit content directly on pages
// ===========================

(function() {
    'use strict';

    let isAdmin = false;
    let currentEditElement = null;

    // Check if current user is admin
    function checkAdminStatus() {
        // Check Firebase Auth
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    isAdmin = true;
                    console.log('✏️ Admin editing mode enabled');
                    initializeAdminEditing();
                } else {
                    // Check localStorage
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                    const adminEmails = ['admin@vrundavanresort.com', 'vishal@vrundavanresort.com'];

                    if (currentUser.email && adminEmails.includes(currentUser.email.toLowerCase())) {
                        isAdmin = true;
                        console.log('✏️ Admin editing mode enabled (localStorage)');
                        initializeAdminEditing();
                    }
                }
            });
        } else {
            // No auth, check localStorage only
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const adminEmails = ['admin@vrundavanresort.com', 'vishal@vrundavanresort.com'];

            if (currentUser.email && adminEmails.includes(currentUser.email.toLowerCase())) {
                isAdmin = true;
                console.log('✏️ Admin editing mode enabled (localStorage)');
                initializeAdminEditing();
            }
        }
    }

    // Initialize admin editing UI
    function initializeAdminEditing() {
        if (!isAdmin) return;

        // Add edit buttons to editable elements
        setTimeout(() => {
            addEditButtonsToImages();
            addEditButtonsToAmenities();
            addEditButtonsToEvents();
        }, 1000); // Wait for page content to load
    }

    // Add edit buttons to hero/feature images
    function addEditButtonsToImages() {
        const editableImages = document.querySelectorAll('[data-admin-editable="image"]');

        editableImages.forEach((element) => {
            if (element.querySelector('.admin-edit-btn')) return; // Already has button

            const editBtn = createEditButton('image');
            editBtn.onclick = () => openImageEditor(element);

            // Position button relative to parent
            element.style.position = 'relative';
            element.appendChild(editBtn);
        });
    }

    // Add edit buttons to amenity cards
    function addEditButtonsToAmenities() {
        const amenityCards = document.querySelectorAll('[data-admin-editable="amenity"]');

        amenityCards.forEach((card) => {
            if (card.querySelector('.admin-edit-btn')) return;

            const editBtn = createEditButton('amenity');
            editBtn.onclick = () => openAmenityEditor(card);

            card.style.position = 'relative';
            card.appendChild(editBtn);
        });
    }

    // Add edit buttons to event sections
    function addEditButtonsToEvents() {
        const eventSections = document.querySelectorAll('[data-admin-editable="event"]');

        eventSections.forEach((section) => {
            if (section.querySelector('.admin-edit-btn')) return;

            const editBtn = createEditButton('event');
            editBtn.onclick = () => openEventEditor(section);

            section.style.position = 'relative';
            section.appendChild(editBtn);
        });
    }

    // Create edit button
    function createEditButton(type = 'default') {
        const btn = document.createElement('button');
        btn.className = 'admin-edit-btn';
        btn.innerHTML = '✏️';
        btn.title = 'Edit (Admin Only)';

        // Styles
        btn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #4a7c2c;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 18px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;

        btn.onmouseover = () => {
            btn.style.background = '#4a7c2c';
            btn.style.transform = 'scale(1.1)';
        };

        btn.onmouseout = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.95)';
            btn.style.transform = 'scale(1)';
        };

        return btn;
    }

    // Open image editor modal
    function openImageEditor(element) {
        currentEditElement = element;
        const currentImage = element.style.backgroundImage?.match(/url\(["']?([^"']*)["']?\)/)?.[1] ||
                           element.querySelector('img')?.src || '';

        const modal = createModal('Edit Image', `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600;">Current Image:</label>
                <div style="width: 100%; height: 200px; background: #f5f5f5; border-radius: 8px; background-image: url('${currentImage}'); background-size: cover; background-position: center;"></div>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600;">Upload New Image:</label>
                <input type="file" id="adminImageUpload" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #4a7c2c; border-radius: 8px;">
                <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">Recommended: 1920x1080px for hero images, 500x500px for cards</p>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="adminSaveImage" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Save Image</button>
                <button id="adminCancelImage" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('adminSaveImage').onclick = () => saveImage(element);
        document.getElementById('adminCancelImage').onclick = () => closeModal();
    }

    // Open amenity editor modal
    function openAmenityEditor(card) {
        currentEditElement = card;

        const title = card.querySelector('h3, .amenity-name')?.textContent || '';
        const description = card.querySelector('p, .amenity-description')?.textContent || '';
        const icon = card.querySelector('.amenity-icon')?.textContent || '📍';
        const currentImage = card.style.backgroundImage?.match(/url\(["']?([^"']*)["']?\)/)?.[1] ||
                           card.querySelector('img')?.src || '';

        const modal = createModal('Edit Amenity', `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Icon (Emoji):</label>
                <input type="text" id="amenityIcon" value="${icon}" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 24px;" maxlength="2">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Title:</label>
                <input type="text" id="amenityTitle" value="${title}" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Description:</label>
                <textarea id="amenityDescription" rows="3" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;">${description}</textarea>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Current Image:</label>
                <div style="width: 100%; height: 150px; background: #f5f5f5; border-radius: 8px; background-image: url('${currentImage}'); background-size: cover; background-position: center;"></div>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Upload New Image (Optional):</label>
                <input type="file" id="amenityImageUpload" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #4a7c2c; border-radius: 8px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="adminSaveAmenity" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Save Changes</button>
                <button id="adminCancelAmenity" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('adminSaveAmenity').onclick = () => saveAmenity(card);
        document.getElementById('adminCancelAmenity').onclick = () => closeModal();
    }

    // Open event editor modal
    function openEventEditor(section) {
        currentEditElement = section;

        const title = section.querySelector('h2, h3, .event-title')?.textContent || '';
        const description = section.querySelector('p, .event-description')?.textContent || '';
        const currentImage = section.style.backgroundImage?.match(/url\(["']?([^"']*)["']?\)/)?.[1] ||
                           section.querySelector('img')?.src || '';

        const modal = createModal('Edit Event Section', `
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Title:</label>
                <input type="text" id="eventTitle" value="${title}" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Description:</label>
                <textarea id="eventDescription" rows="4" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; resize: vertical;">${description}</textarea>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Current Image:</label>
                <div style="width: 100%; height: 150px; background: #f5f5f5; border-radius: 8px; background-image: url('${currentImage}'); background-size: cover; background-position: center;"></div>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">Upload New Image (Optional):</label>
                <input type="file" id="eventImageUpload" accept="image/*" style="width: 100%; padding: 10px; border: 2px dashed #4a7c2c; border-radius: 8px;">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="adminSaveEvent" style="flex: 1; padding: 12px; background: #4a7c2c; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Save Changes</button>
                <button id="adminCancelEvent" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
            </div>
        `);

        document.getElementById('adminSaveEvent').onclick = () => saveEvent(section);
        document.getElementById('adminCancelEvent').onclick = () => closeModal();
    }

    // Create modal
    function createModal(title, content) {
        // Remove existing modal if any
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
            z-index: 10000;
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

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        return modal;
    }

    // Close modal
    function closeModal() {
        const modal = document.getElementById('adminEditModal');
        if (modal) modal.remove();
        currentEditElement = null;
    }

    // Save image
    async function saveImage(element) {
        const fileInput = document.getElementById('adminImageUpload');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select an image to upload.');
            return;
        }

        try {
            const btn = document.getElementById('adminSaveImage');
            btn.textContent = 'Uploading...';
            btn.disabled = true;

            // Compress and upload image
            const compressedFile = await compressImage(file, 1920, 0.8);
            const imageUrl = await uploadToFirebase(compressedFile, 'page-content');

            // Update element
            if (element.style.backgroundImage !== undefined) {
                element.style.backgroundImage = `url('${imageUrl}')`;
            } else {
                const img = element.querySelector('img');
                if (img) img.src = imageUrl;
            }

            // Save to Firestore
            const elementId = element.dataset.editId || generateId();
            element.dataset.editId = elementId;

            await saveToFirestore('pageContent', elementId, {
                imageUrl: imageUrl,
                pageType: window.location.pathname,
                elementType: 'image',
                updatedAt: new Date().toISOString()
            });

            alert('✅ Image updated successfully!');
            closeModal();
        } catch (error) {
            console.error('Error saving image:', error);
            alert('Error uploading image: ' + error.message);
            document.getElementById('adminSaveImage').disabled = false;
        }
    }

    // Save amenity
    async function saveAmenity(card) {
        const icon = document.getElementById('amenityIcon').value;
        const title = document.getElementById('amenityTitle').value;
        const description = document.getElementById('amenityDescription').value;
        const fileInput = document.getElementById('amenityImageUpload');
        const file = fileInput?.files[0];

        if (!title) {
            alert('Please enter a title.');
            return;
        }

        try {
            const btn = document.getElementById('adminSaveAmenity');
            btn.textContent = 'Saving...';
            btn.disabled = true;

            let imageUrl = null;
            if (file) {
                const compressedFile = await compressImage(file, 800, 0.8);
                imageUrl = await uploadToFirebase(compressedFile, 'amenities');
            }

            // Update card
            const iconElement = card.querySelector('.amenity-icon');
            const titleElement = card.querySelector('h3, .amenity-name');
            const descElement = card.querySelector('p, .amenity-description');

            if (iconElement) iconElement.textContent = icon;
            if (titleElement) titleElement.textContent = title;
            if (descElement) descElement.textContent = description;

            if (imageUrl) {
                if (card.style.backgroundImage !== undefined) {
                    card.style.backgroundImage = `url('${imageUrl}')`;
                } else {
                    const img = card.querySelector('img');
                    if (img) img.src = imageUrl;
                }
            }

            // Save to Firestore
            const amenityId = card.dataset.editId || generateId();
            card.dataset.editId = amenityId;

            await saveToFirestore('amenities', amenityId, {
                icon: icon,
                title: title,
                description: description,
                imageUrl: imageUrl || card.style.backgroundImage?.match(/url\(["']?([^"']*)["']?\)/)?.[1] || '',
                pageType: window.location.pathname,
                updatedAt: new Date().toISOString()
            });

            alert('✅ Amenity updated successfully!');
            closeModal();
        } catch (error) {
            console.error('Error saving amenity:', error);
            alert('Error saving amenity: ' + error.message);
            document.getElementById('adminSaveAmenity').disabled = false;
        }
    }

    // Save event
    async function saveEvent(section) {
        const title = document.getElementById('eventTitle').value;
        const description = document.getElementById('eventDescription').value;
        const fileInput = document.getElementById('eventImageUpload');
        const file = fileInput?.files[0];

        if (!title) {
            alert('Please enter a title.');
            return;
        }

        try {
            const btn = document.getElementById('adminSaveEvent');
            btn.textContent = 'Saving...';
            btn.disabled = true;

            let imageUrl = null;
            if (file) {
                const compressedFile = await compressImage(file, 1200, 0.8);
                imageUrl = await uploadToFirebase(compressedFile, 'events');
            }

            // Update section
            const titleElement = section.querySelector('h2, h3, .event-title');
            const descElement = section.querySelector('p, .event-description');

            if (titleElement) titleElement.textContent = title;
            if (descElement) descElement.textContent = description;

            if (imageUrl) {
                if (section.style.backgroundImage !== undefined) {
                    section.style.backgroundImage = `url('${imageUrl}')`;
                } else {
                    const img = section.querySelector('img');
                    if (img) img.src = imageUrl;
                }
            }

            // Save to Firestore
            const eventId = section.dataset.editId || generateId();
            section.dataset.editId = eventId;

            await saveToFirestore('eventContent', eventId, {
                title: title,
                description: description,
                imageUrl: imageUrl || section.style.backgroundImage?.match(/url\(["']?([^"']*)["']?\)/)?.[1] || '',
                pageType: window.location.pathname,
                updatedAt: new Date().toISOString()
            });

            alert('✅ Event content updated successfully!');
            closeModal();
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event: ' + error.message);
            document.getElementById('adminSaveEvent').disabled = false;
        }
    }

    // Compress image
    function compressImage(file, maxWidth = 1200, quality = 0.8) {
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
                        resolve(compressedFile);
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
        });
    }

    // Upload to Firebase Storage
    async function uploadToFirebase(file, folder) {
        if (!storage) {
            throw new Error('Firebase Storage not initialized');
        }

        const fileName = `${folder}/${Date.now()}-${file.name}`;
        const storageRef = storage.ref();
        const fileRef = storageRef.child(fileName);

        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return downloadURL;
    }

    // Save to Firestore
    async function saveToFirestore(collection, docId, data) {
        if (!db) {
            console.warn('Firestore not initialized, data not saved to cloud');
            return;
        }

        await db.collection(collection).doc(docId).set(data, { merge: true });
    }

    // Generate unique ID
    function generateId() {
        return 'edit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAdminStatus);
    } else {
        checkAdminStatus();
    }

    // Expose for debugging
    window.adminInlineEdit = {
        isAdmin: () => isAdmin,
        refresh: initializeAdminEditing
    };
})();
