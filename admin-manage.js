// Admin Management Functions for Rooms, Menu, and Gallery

// Use the db variable from dashboard.js (already declared there)
let currentEditingRoomId = null;
let currentEditingCategoryId = null;
let currentEditingMenuItemId = null;
let currentEditingGalleryId = null;

// Fast image compression function - compresses images to ~200KB for instant uploads
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if image is too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }
                        // Create new file from blob
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
}

// Firebase Storage upload function with compression
async function uploadImageToStorage(file, folder) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('Original file:', { name: file.name, size: (file.size / 1024).toFixed(0) + 'KB' });

            // Check file type
            if (!file.type.startsWith('image/')) {
                reject(new Error('File must be an image'));
                return;
            }

            // Compress image for faster upload (reduces to ~200KB)
            const compressedFile = await compressImage(file);

            // Create unique filename
            const timestamp = Date.now();
            const filename = `${folder}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

            // Get Firebase Storage reference
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error('Firebase Storage not initialized');
            }

            const storage = firebase.storage();
            const storageRef = storage.ref();
            const fileRef = storageRef.child(filename);

            // Upload compressed file
            const uploadTask = fileRef.put(compressedFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (progress % 25 === 0) console.log(`Upload: ${Math.round(progress)}%`);
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        console.log('✓ Uploaded successfully');
                        resolve(downloadURL);
                    } catch (urlError) {
                        reject(urlError);
                    }
                }
            );
        } catch (error) {
            console.error('Error:', error);
            reject(error);
        }
    });
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin-manage.js: DOM loaded, setting up event listeners...');

    // Check Firebase Auth status
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Firebase Auth: User is authenticated:', user.email);
            console.log('User UID:', user.uid);
        } else {
            console.warn('⚠️ Firebase Auth: No user authenticated! Admin functions may not work.');
            console.log('Please login via admin.html first.');
        }
    });

    setTimeout(setupManagementEventListeners, 100); // Small delay to ensure all elements are ready
});

function setupManagementEventListeners() {
    console.log('Setting up management event listeners...');

    // ==================== ROOMS MANAGEMENT ====================

    const addRoomBtn = document.getElementById('addRoomBtn');
    if (addRoomBtn) {
        console.log('Add Room button found!');
        addRoomBtn.addEventListener('click', function() {
            console.log('Add Room button clicked!');
            currentEditingRoomId = null;
            document.getElementById('roomModalTitle').textContent = 'Add New Room';
            document.getElementById('roomForm').reset();
            document.getElementById('roomImagePreview').innerHTML = ''; // Clear image preview
            document.getElementById('roomModal').style.display = 'block';
        });
    } else {
        console.error('Add Room button NOT found!');
    }

    const roomModalClose = document.getElementById('roomModalClose');
    if (roomModalClose) {
        roomModalClose.addEventListener('click', function() {
            document.getElementById('roomModal').style.display = 'none';
        });
    }

    const cancelRoomBtn = document.getElementById('cancelRoomBtn');
    if (cancelRoomBtn) {
        cancelRoomBtn.addEventListener('click', function() {
            document.getElementById('roomModal').style.display = 'none';
        });
    }

    const saveRoomBtn = document.getElementById('saveRoomBtn');
    if (saveRoomBtn) {
        saveRoomBtn.addEventListener('click', async function() {
            const imageFiles = document.getElementById('roomImageFile').files;
            let imageUrls = [];

            try {
                // Show saving message
                saveRoomBtn.disabled = true;
                saveRoomBtn.textContent = 'Compressing & uploading...';

                // Upload all images in parallel for speed (instead of sequential)
                if (imageFiles && imageFiles.length > 0) {
                    const uploadPromises = Array.from(imageFiles).map(file =>
                        uploadImageToStorage(file, 'rooms')
                    );
                    imageUrls = await Promise.all(uploadPromises);
                    console.log(`✓ All ${imageUrls.length} images uploaded`);
                } else if (!currentEditingRoomId) {
                    // New room MUST have images
                    alert('Please select at least one image for the room');
                    saveRoomBtn.disabled = false;
                    saveRoomBtn.textContent = 'Save Room';
                    return;
                }

                // If editing and no new images selected, keep existing images
                if (currentEditingRoomId && imageUrls.length === 0) {
                    const existingDoc = await db.collection('rooms').doc(currentEditingRoomId).get();
                    imageUrls = existingDoc.data().imageUrls || [];
                }

                const roomData = {
                    name: document.getElementById('roomName').value,
                    description: document.getElementById('roomDescription').value,
                    price: parseInt(document.getElementById('roomPrice').value),
                    priceUnit: document.getElementById('roomPriceUnit').value || 'night',
                    badge: document.getElementById('roomBadge').value,
                    badgeClass: document.getElementById('roomBadgeClass').value,
                    imageUrls: imageUrls, // Array of image URLs
                    imageUrl: imageUrls[0] || '', // First image for backward compatibility
                    gradient: document.getElementById('roomGradient').value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    features: document.getElementById('roomFeatures').value.split('\n').filter(f => f.trim()),
                    order: parseInt(document.getElementById('roomOrder').value)
                };

                console.log('💾 Saving room data:', {
                    mode: currentEditingRoomId ? '✏️ EDITING' : '➕ ADDING NEW',
                    roomId: currentEditingRoomId || 'NEW',
                    name: roomData.name,
                    imageCount: roomData.imageUrls.length,
                    imageUrls: roomData.imageUrls
                });

                saveRoomBtn.textContent = 'Saving...';

                if (currentEditingRoomId) {
                    await db.collection('rooms').doc(currentEditingRoomId).update(roomData);
                    console.log('✅ Room UPDATED:', currentEditingRoomId);
                    alert('✅ Room updated successfully!');
                } else {
                    const docRef = await db.collection('rooms').add(roomData);
                    console.log('✅ NEW Room added with ID:', docRef.id);
                    alert('✅ New room added successfully!');
                }
                document.getElementById('roomModal').style.display = 'none';
                document.getElementById('roomForm').reset();
                document.getElementById('roomImagePreview').innerHTML = '';
                currentEditingRoomId = null;
                loadRoomsList();
            } catch (error) {
                console.error('Error saving room:', error);
                alert('Error saving room: ' + error.message);
            } finally {
                saveRoomBtn.disabled = false;
                saveRoomBtn.textContent = 'Save Room';
            }
        });
    }

    // Add image preview for room upload (multiple images)
    const roomImageFile = document.getElementById('roomImageFile');
    if (roomImageFile) {
        roomImageFile.addEventListener('change', function(e) {
            const files = e.target.files;
            const previewDiv = document.getElementById('roomImagePreview');
            previewDiv.innerHTML = '';

            if (files && files.length > 0) {
                Array.from(files).forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const div = document.createElement('div');
                        div.style.cssText = 'position: relative; display: inline-block;';
                        div.innerHTML = `
                            <img src="${e.target.result}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid #4a7c2c;">
                            <span style="position: absolute; top: 5px; right: 5px; background: #4a7c2c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7rem;">${index + 1}</span>
                        `;
                        previewDiv.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                });

                const info = document.createElement('div');
                info.style.cssText = 'width: 100%; margin-top: 10px; font-size: 0.8rem; color: #666;';
                info.textContent = `✓ ${files.length} image(s) selected`;
                previewDiv.appendChild(info);
            }
        });
    }

    // ==================== MENU MANAGEMENT ====================

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        console.log('Add Category button found!');
        addCategoryBtn.addEventListener('click', function() {
            console.log('Add Category button clicked!');
            currentEditingCategoryId = null;
            document.getElementById('categoryModalTitle').textContent = 'Add Menu Category';
            document.getElementById('categoryForm').reset();
            document.getElementById('categoryModal').style.display = 'block';
        });
    } else {
        console.error('Add Category button NOT found!');
    }

    const categoryModalClose = document.getElementById('categoryModalClose');
    if (categoryModalClose) {
        categoryModalClose.addEventListener('click', function() {
            document.getElementById('categoryModal').style.display = 'none';
        });
    }

    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', function() {
            document.getElementById('categoryModal').style.display = 'none';
        });
    }

    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', async function() {
            const categoryData = {
                name: document.getElementById('categoryName').value,
                icon: document.getElementById('categoryIcon').value,
                order: parseInt(document.getElementById('categoryOrder').value),
                specialClass: document.getElementById('categorySpecialClass').value,
                itemsClass: document.getElementById('categoryItemsClass').value || 'menu-items'
            };

            try {
                if (currentEditingCategoryId) {
                    await db.collection('menuCategories').doc(currentEditingCategoryId).update(categoryData);
                    alert('Category updated successfully!');
                } else {
                    await db.collection('menuCategories').add(categoryData);
                    alert('Category added successfully!');
                }
                document.getElementById('categoryModal').style.display = 'none';
                loadMenuList();
            } catch (error) {
                console.error('Error saving category:', error);
                alert('Error saving category: ' + error.message);
            }
        });
    }

    const addMenuItemBtn = document.getElementById('addMenuItemBtn');
    if (addMenuItemBtn) {
        console.log('Add Menu Item button found!');
        addMenuItemBtn.addEventListener('click', async function() {
            console.log('Add Menu Item button clicked!');
            currentEditingMenuItemId = null;
            document.getElementById('menuItemModalTitle').textContent = 'Add Menu Item';
            document.getElementById('menuItemForm').reset();
            await loadCategoriesDropdown();
            document.getElementById('menuItemModal').style.display = 'block';
        });
    } else {
        console.error('Add Menu Item button NOT found!');
    }

    const menuItemModalClose = document.getElementById('menuItemModalClose');
    if (menuItemModalClose) {
        menuItemModalClose.addEventListener('click', function() {
            document.getElementById('menuItemModal').style.display = 'none';
        });
    }

    const cancelMenuItemBtn = document.getElementById('cancelMenuItemBtn');
    if (cancelMenuItemBtn) {
        cancelMenuItemBtn.addEventListener('click', function() {
            document.getElementById('menuItemModal').style.display = 'none';
        });
    }

    const saveMenuItemBtn = document.getElementById('saveMenuItemBtn');
    if (saveMenuItemBtn) {
        saveMenuItemBtn.addEventListener('click', async function() {
            const menuItemData = {
                categoryId: document.getElementById('menuItemCategory').value,
                name: document.getElementById('menuItemName').value,
                description: document.getElementById('menuItemDescription').value,
                price: parseInt(document.getElementById('menuItemPrice').value),
                type: document.getElementById('menuItemType').value,
                order: parseInt(document.getElementById('menuItemOrder').value)
            };

            try {
                if (currentEditingMenuItemId) {
                    await db.collection('menuItems').doc(currentEditingMenuItemId).update(menuItemData);
                    alert('Menu item updated successfully!');
                } else {
                    await db.collection('menuItems').add(menuItemData);
                    alert('Menu item added successfully!');
                }
                document.getElementById('menuItemModal').style.display = 'none';
                loadMenuList();
            } catch (error) {
                console.error('Error saving menu item:', error);
                alert('Error saving menu item: ' + error.message);
            }
        });
    }

    // ==================== GALLERY MANAGEMENT ====================

    const addGalleryImageBtn = document.getElementById('addGalleryImageBtn');
    if (addGalleryImageBtn) {
        console.log('Add Gallery Image button found!');
        addGalleryImageBtn.addEventListener('click', function() {
            console.log('Add Gallery Image button clicked!');
            currentEditingGalleryId = null;
            document.getElementById('galleryImageModalTitle').textContent = 'Add Gallery Image';
            document.getElementById('galleryImageForm').reset();
            document.getElementById('galleryImageModal').style.display = 'block';
        });
    } else {
        console.error('Add Gallery Image button NOT found!');
    }

    const galleryImageModalClose = document.getElementById('galleryImageModalClose');
    if (galleryImageModalClose) {
        galleryImageModalClose.addEventListener('click', function() {
            document.getElementById('galleryImageModal').style.display = 'none';
        });
    }

    const cancelGalleryImageBtn = document.getElementById('cancelGalleryImageBtn');
    if (cancelGalleryImageBtn) {
        cancelGalleryImageBtn.addEventListener('click', function() {
            document.getElementById('galleryImageModal').style.display = 'none';
        });
    }

    const saveGalleryImageBtn = document.getElementById('saveGalleryImageBtn');
    if (saveGalleryImageBtn) {
        saveGalleryImageBtn.addEventListener('click', async function() {
            const imageFile = document.getElementById('galleryImageFile').files[0];

            if (!imageFile && !currentEditingGalleryId) {
                alert('Please select an image to upload');
                return;
            }

            let imageUrl = '';

            try {
                // Show saving message
                saveGalleryImageBtn.disabled = true;
                saveGalleryImageBtn.textContent = 'Compressing & uploading...';

                // Upload image if selected
                if (imageFile) {
                    imageUrl = await uploadImageToStorage(imageFile, 'gallery');
                }

                const galleryData = {
                    title: document.getElementById('galleryImageTitle').value,
                    category: document.getElementById('galleryImageCategory').value,
                    imageUrl: imageUrl || document.getElementById('galleryImageGradient').value,
                    gradient: document.getElementById('galleryImageGradient').value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    order: parseInt(document.getElementById('galleryImageOrder').value)
                };

                if (currentEditingGalleryId) {
                    await db.collection('gallery').doc(currentEditingGalleryId).update(galleryData);
                    alert('Gallery image updated successfully!');
                } else {
                    await db.collection('gallery').add(galleryData);
                    alert('Gallery image added successfully!');
                }
                document.getElementById('galleryImageModal').style.display = 'none';
                document.getElementById('galleryImageForm').reset();
                document.getElementById('galleryImagePreview').innerHTML = '';
                loadGalleryList();
            } catch (error) {
                console.error('Error saving gallery image:', error);
                alert('Error saving gallery image: ' + error.message);
            } finally {
                saveGalleryImageBtn.disabled = false;
                saveGalleryImageBtn.textContent = 'Save Image';
            }
        });
    }

    // Add image preview for gallery upload
    const galleryImageFile = document.getElementById('galleryImageFile');
    if (galleryImageFile) {
        galleryImageFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('galleryImagePreview').innerHTML = `
                        <div style="position: relative; display: inline-block;">
                            <img src="${e.target.result}" style="max-width: 200px; max-height: 150px; border-radius: 6px; border: 2px solid #4a7c2c;">
                            <span style="display: block; margin-top: 5px; font-size: 0.8rem; color: #666;">✓ Image selected: ${file.name}</span>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Close modals when clicking outside
    window.onclick = function(event) {
        const modals = ['roomModal', 'categoryModal', 'menuItemModal', 'galleryImageModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && event.target == modal) {
                modal.style.display = 'none';
            }
        });
    };

    console.log('All event listeners set up successfully!');
}

// ==================== ROOMS FUNCTIONS ====================

async function loadRoomsList() {
    const roomsList = document.getElementById('roomsList');
    const loading = document.getElementById('roomsListLoading');

    if (!roomsList || !loading) return;

    loading.style.display = 'block';
    roomsList.innerHTML = '';

    try {
        const snapshot = await db.collection('rooms').orderBy('order', 'asc').get();

        loading.style.display = 'none';

        if (snapshot.empty) {
            roomsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No rooms added yet. Click "+ Add New Room" to get started!</p>';
            return;
        }

        // Create compact table view
        let tableHTML = `
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                <h3 style="margin: 0 0 15px 0; color: #2d5016; font-size: 1.1rem;">📋 All Rooms (${snapshot.size} total)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 10px; text-align: left; font-weight: 600; color: #2d5016; width: 5%;">#</th>
                            <th style="padding: 10px; text-align: left; font-weight: 600; color: #2d5016; width: 10%;">Image</th>
                            <th style="padding: 10px; text-align: left; font-weight: 600; color: #2d5016; width: 20%;">Room Name</th>
                            <th style="padding: 10px; text-align: left; font-weight: 600; color: #2d5016; width: 10%;">Price</th>
                            <th style="padding: 10px; text-align: left; font-weight: 600; color: #2d5016; width: 10%;">Badge</th>
                            <th style="padding: 10px; text-align: left; font-weight: 600; color: #2d5016; width: 30%;">Description</th>
                            <th style="padding: 10px; text-align: center; font-weight: 600; color: #2d5016; width: 15%;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        snapshot.forEach(doc => {
            const room = doc.data();

            // Debug: Log what we're loading
            console.log(`📄 Loading room: "${room.name}" (ID: ${doc.id})`, {
                imageUrls: room.imageUrls,
                imageUrlsCount: room.imageUrls ? room.imageUrls.length : 0
            });

            const badgeHTML = room.badge
                ? `<span style="background: #4a7c2c; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem;">${room.badge}</span>`
                : '<span style="color: #999;">-</span>';

            // Get images (supports both old and new format)
            let images = [];
            if (room.imageUrls && room.imageUrls.length > 0) {
                images = room.imageUrls;
            } else if (room.imageUrl) {
                images = [room.imageUrl];
            }

            // Add cache buster to admin images too
            const cacheBuster = Date.now();
            const firstImage = images.length > 0 ? `${images[0]}${images[0].includes('?') ? '&' : '?'}t=${cacheBuster}` : '';

            const imageHTML = images.length > 0
                ? `<div style="position: relative; display: inline-block;">
                    <img src="${firstImage}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                    ${images.length > 1 ? `<span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; padding: 1px 4px; border-radius: 3px; font-size: 0.65rem;">${images.length}</span>` : ''}
                   </div>`
                : `<div style="width: 60px; height: 40px; background: ${room.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🏨</div>`;

            tableHTML += `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px; color: #666;">${room.order}</td>
                    <td style="padding: 10px;">${imageHTML}</td>
                    <td style="padding: 10px; font-weight: 500; color: #2d5016;">${room.name}</td>
                    <td style="padding: 10px; font-weight: 600; color: #4a7c2c;">₹${room.price}/${room.priceUnit || 'night'}</td>
                    <td style="padding: 10px;">${badgeHTML}</td>
                    <td style="padding: 10px; font-size: 0.8rem; color: #666; line-height: 1.3;">${room.description ? room.description.substring(0, 80) + (room.description.length > 80 ? '...' : '') : '-'}</td>
                    <td style="padding: 10px; text-align: center;">
                        <button class="btn-edit" data-room-id="${doc.id}" style="padding: 6px 12px; background: #4a7c2c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;">✏️ Edit</button>
                        <button class="btn-delete-item" data-room-id="${doc.id}" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">🗑️ Delete</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        roomsList.innerHTML = tableHTML;
        attachRoomEventListeners();

    } catch (error) {
        console.error('Error loading rooms:', error);
        loading.innerHTML = '<p style="color: red;">Error loading rooms.</p>';
    }
}

function attachRoomEventListeners() {
    document.querySelectorAll('.btn-edit[data-room-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const roomId = this.getAttribute('data-room-id');
            await editRoom(roomId);
        });
    });

    document.querySelectorAll('.btn-delete-item[data-room-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const roomId = this.getAttribute('data-room-id');
            if (confirm('Are you sure you want to delete this room?')) {
                await deleteRoom(roomId);
            }
        });
    });
}

async function editRoom(roomId) {
    try {
        const doc = await db.collection('rooms').doc(roomId).get();
        const room = doc.data();

        currentEditingRoomId = roomId;
        document.getElementById('roomModalTitle').textContent = 'Edit Room';

        document.getElementById('roomName').value = room.name || '';
        document.getElementById('roomDescription').value = room.description || '';
        document.getElementById('roomPrice').value = room.price || 0;
        document.getElementById('roomPriceUnit').value = room.priceUnit || 'night';
        document.getElementById('roomBadge').value = room.badge || '';
        document.getElementById('roomBadgeClass').value = room.badgeClass || '';
        document.getElementById('roomGradient').value = room.gradient || '';
        document.getElementById('roomFeatures').value = (room.features || []).join('\n');
        document.getElementById('roomOrder').value = room.order || 1;

        // Show existing images if any
        const previewDiv = document.getElementById('roomImagePreview');
        if (room.imageUrls && room.imageUrls.length > 0) {
            previewDiv.innerHTML = '';
            room.imageUrls.forEach((url, index) => {
                const div = document.createElement('div');
                div.style.cssText = 'position: relative; display: inline-block;';
                div.innerHTML = `
                    <img src="${url}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid #4a7c2c;">
                    <span style="position: absolute; top: 5px; right: 5px; background: #4a7c2c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7rem;">${index + 1}</span>
                `;
                previewDiv.appendChild(div);
            });
            const info = document.createElement('div');
            info.style.cssText = 'width: 100%; margin-top: 10px; font-size: 0.8rem; color: #666;';
            info.innerHTML = `Current: ${room.imageUrls.length} image(s)<br><small>Select new files to replace all images, or leave empty to keep existing images</small>`;
            previewDiv.appendChild(info);
        }

        document.getElementById('roomModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading room:', error);
        alert('Error loading room: ' + error.message);
    }
}

async function deleteRoom(roomId) {
    try {
        await db.collection('rooms').doc(roomId).delete();
        alert('Room deleted successfully!');
        loadRoomsList();
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Error deleting room: ' + error.message);
    }
}

// ==================== MENU FUNCTIONS ====================

async function loadCategoriesDropdown() {
    const select = document.getElementById('menuItemCategory');
    select.innerHTML = '<option value="">Select Category</option>';

    try {
        const snapshot = await db.collection('menuCategories').orderBy('order', 'asc').get();
        snapshot.forEach(doc => {
            const category = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

let allMenuData = []; // Store all menu data for search

async function loadMenuList() {
    const menuList = document.getElementById('menuList');
    const loading = document.getElementById('menuListLoading');

    if (!menuList || !loading) return;

    loading.style.display = 'block';
    menuList.innerHTML = '';

    try {
        const categoriesSnapshot = await db.collection('menuCategories').orderBy('order', 'asc').get();

        loading.style.display = 'none';

        if (categoriesSnapshot.empty) {
            menuList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No categories added yet. Click "+ Add Category" to get started!</p>';
            return;
        }

        // Add search and controls at the top
        const controlsHTML = `
            <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <input type="text" id="adminMenuSearch" placeholder="🔍 Search menu items or categories..."
                           style="flex: 1; min-width: 300px; padding: 10px 15px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.9rem; outline: none;"
                           oninput="searchAdminMenu(this.value)">
                    <button onclick="collapseAllAdminCategories()" style="padding: 10px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">📁 Collapse All</button>
                    <button onclick="expandAllAdminCategories()" style="padding: 10px 16px; background: #4a7c2c; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">📂 Expand All</button>
                </div>
                <div id="adminMenuStats" style="margin-top: 10px; font-size: 0.85rem; color: #666;"></div>
            </div>
        `;
        menuList.innerHTML = controlsHTML;

        allMenuData = []; // Reset
        let totalItems = 0;

        for (const catDoc of categoriesSnapshot.docs) {
            const category = catDoc.data();

            // Category header - collapsible and compact
            const categoryId = 'admin-cat-' + catDoc.id;
            const categoryHeader = `
                <div class="admin-category-wrapper" data-category-id="${catDoc.id}" style="margin-bottom: 10px;">
                    <div class="category-header" onclick="toggleAdminCategory('${categoryId}')" style="background: linear-gradient(135deg, #4a7c2c 0%, #2d5016 100%); color: white; padding: 8px 12px; border-radius: 5px; margin: 12px 0 6px 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="toggle-icon" id="${categoryId}-icon" style="font-size: 0.9rem; transition: transform 0.2s;">▼</span>
                            <span style="font-size: 1.1rem;">${category.icon || '📋'}</span>
                            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600;">${category.name}</h3>
                            <span class="category-item-count" style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">Loading...</span>
                        </div>
                        <div style="display: flex; gap: 6px;" onclick="event.stopPropagation();">
                            <button class="btn-edit" data-category-id="${catDoc.id}" style="padding: 5px 10px; background: white; color: #4a7c2c; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">✏️</button>
                            <button class="btn-delete-item" data-category-id="${catDoc.id}" style="padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.8rem;">🗑️</button>
                        </div>
                    </div>
            `;
            menuList.innerHTML += categoryHeader;

            let itemsSnapshot;
            try {
                itemsSnapshot = await db.collection('menuItems')
                    .where('categoryId', '==', catDoc.id)
                    .orderBy('order', 'asc')
                    .get();
            } catch (indexError) {
                console.warn('Index error for menu items, trying without orderBy:', indexError);
                // If index doesn't exist, query without orderBy
                itemsSnapshot = await db.collection('menuItems')
                    .where('categoryId', '==', catDoc.id)
                    .get();
            }

            // Update item count
            const itemCount = itemsSnapshot.size;
            totalItems += itemCount;

            // Store for search
            const categoryData = {
                id: catDoc.id,
                categoryId: categoryId,
                name: category.name,
                icon: category.icon,
                items: []
            };

            if (itemsSnapshot.empty) {
                menuList.innerHTML += `
                    <div id="${categoryId}" class="admin-category-items" style="display: block;">
                        <p style="text-align: center; color: #999; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px; font-size: 0.85rem;">No items yet.</p>
                    </div>
                </div>
                `;
            } else {
                // Create ultra-compact table for menu items
                let tableHTML = `
                    <div id="${categoryId}" class="admin-category-items" style="display: block;">
                        <table class="admin-menu-table" style="width: 100%; border-collapse: collapse; margin-bottom: 10px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden; font-size: 0.8rem;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 1px solid #dee2e6;">
                                    <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #2d5016; font-size: 0.75rem; width: 3%;">#</th>
                                    <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #2d5016; font-size: 0.75rem; width: 25%;">Item</th>
                                    <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #2d5016; font-size: 0.75rem; width: 7%;">Price</th>
                                    <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #2d5016; font-size: 0.75rem; width: 7%;">Type</th>
                                    <th style="padding: 6px 8px; text-align: left; font-weight: 600; color: #2d5016; font-size: 0.75rem; width: 48%;">Description</th>
                                    <th style="padding: 6px 8px; text-align: center; font-weight: 600; color: #2d5016; font-size: 0.75rem; width: 10%;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                let itemIndex = 1;
                itemsSnapshot.forEach(itemDoc => {
                    const item = itemDoc.data();

                    // Store for search
                    categoryData.items.push({
                        id: itemDoc.id,
                        name: item.name,
                        description: item.description || '',
                        price: item.price,
                        type: item.type
                    });

                    const typeBadge = item.type === 'VEG'
                        ? '<span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.65rem; font-weight: 600;">🥬</span>'
                        : item.type === 'NON-VEG'
                        ? '<span style="background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.65rem; font-weight: 600;">🍗</span>'
                        : '<span style="color: #999; font-size: 0.7rem;">-</span>';

                    tableHTML += `
                        <tr class="menu-item-row" data-item-id="${itemDoc.id}" style="border-bottom: 1px solid #f8f8f8;">
                            <td style="padding: 6px 8px; color: #999; font-size: 0.75rem;">${itemIndex}</td>
                            <td class="item-name" style="padding: 6px 8px; font-weight: 500; color: #2d5016; font-size: 0.8rem; line-height: 1.3;">${item.name}</td>
                            <td style="padding: 6px 8px; font-weight: 600; color: #4a7c2c; font-size: 0.8rem;">₹${item.price}</td>
                            <td style="padding: 6px 8px;">${typeBadge}</td>
                            <td class="item-desc" style="padding: 6px 8px; font-size: 0.75rem; color: #666; line-height: 1.2;">${item.description || '-'}</td>
                            <td style="padding: 6px 8px; text-align: center;">
                                <button class="btn-edit" data-menu-item-id="${itemDoc.id}" style="padding: 4px 8px; background: #4a7c2c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.7rem; margin-right: 3px;">✏️</button>
                                <button class="btn-delete-item" data-menu-item-id="${itemDoc.id}" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.7rem;">🗑️</button>
                            </td>
                        </tr>
                    `;
                    itemIndex++;
                });

                tableHTML += `
                            </tbody>
                        </table>
                    </div>
                </div>
                `;

                menuList.innerHTML += tableHTML;
            }

            allMenuData.push(categoryData);

            // Update item count badge
            document.querySelectorAll('.category-item-count').forEach((badge, idx) => {
                if (idx === allMenuData.length - 1) {
                    badge.textContent = `${itemCount} items`;
                }
            });
        }

        // Update stats
        document.getElementById('adminMenuStats').innerHTML = `
            <strong>Total:</strong> ${categoriesSnapshot.size} categories, ${totalItems} items
        `;

        attachMenuEventListeners();

    } catch (error) {
        console.error('Error loading menu:', error);
        loading.innerHTML = '<p style="color: red;">Error loading menu.</p>';
    }
}

// Toggle admin category visibility
window.toggleAdminCategory = function(categoryId) {
    const categoryContent = document.getElementById(categoryId);
    const icon = document.getElementById(categoryId + '-icon');

    if (categoryContent && icon) {
        if (categoryContent.style.display === 'none') {
            categoryContent.style.display = 'block';
            icon.textContent = '▼';
        } else {
            categoryContent.style.display = 'none';
            icon.textContent = '▶';
        }
    }
}

// Collapse all admin categories
window.collapseAllAdminCategories = function() {
    document.querySelectorAll('.admin-category-items').forEach(items => {
        items.style.display = 'none';
    });
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▶';
    });
}

// Expand all admin categories
window.expandAllAdminCategories = function() {
    document.querySelectorAll('.admin-category-items').forEach(items => {
        items.style.display = 'block';
    });
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▼';
    });
}

// Search admin menu
window.searchAdminMenu = function(query) {
    query = query.toLowerCase().trim();

    if (query === '') {
        // Show all categories and items
        document.querySelectorAll('.admin-category-wrapper').forEach(cat => {
            cat.style.display = 'block';
        });
        document.querySelectorAll('.menu-item-row').forEach(row => {
            row.style.display = '';
        });
        return;
    }

    // Search through all items and categories
    document.querySelectorAll('.admin-category-wrapper').forEach(categoryDiv => {
        let categoryHasMatch = false;
        const categoryHeader = categoryDiv.querySelector('.category-header h3');
        const categoryName = categoryHeader ? categoryHeader.textContent.toLowerCase() : '';

        // Check if category name matches
        if (categoryName.includes(query)) {
            categoryHasMatch = true;
            // Show all items in this category
            categoryDiv.querySelectorAll('.menu-item-row').forEach(row => {
                row.style.display = '';
            });
        } else {
            // Check individual items
            const rows = categoryDiv.querySelectorAll('.menu-item-row');
            rows.forEach(row => {
                const name = row.querySelector('.item-name')?.textContent.toLowerCase() || '';
                const desc = row.querySelector('.item-desc')?.textContent.toLowerCase() || '';

                if (name.includes(query) || desc.includes(query)) {
                    row.style.display = '';
                    categoryHasMatch = true;
                } else {
                    row.style.display = 'none';
                }
            });
        }

        // Show/hide category based on matches
        if (categoryHasMatch) {
            categoryDiv.style.display = 'block';
            // Auto-expand category with matches
            const categoryItems = categoryDiv.querySelector('.admin-category-items');
            if (categoryItems) {
                categoryItems.style.display = 'block';
                const icon = categoryDiv.querySelector('.toggle-icon');
                if (icon) icon.textContent = '▼';
            }
        } else {
            categoryDiv.style.display = 'none';
        }
    });
}

function attachMenuEventListeners() {
    document.querySelectorAll('.btn-edit[data-category-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const categoryId = this.getAttribute('data-category-id');
            await editCategory(categoryId);
        });
    });

    document.querySelectorAll('.btn-delete-item[data-category-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const categoryId = this.getAttribute('data-category-id');
            if (confirm('Are you sure you want to delete this category?')) {
                await deleteCategory(categoryId);
            }
        });
    });

    document.querySelectorAll('.btn-edit[data-menu-item-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const itemId = this.getAttribute('data-menu-item-id');
            await editMenuItem(itemId);
        });
    });

    document.querySelectorAll('.btn-delete-item[data-menu-item-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const itemId = this.getAttribute('data-menu-item-id');
            if (confirm('Are you sure you want to delete this menu item?')) {
                await deleteMenuItem(itemId);
            }
        });
    });
}

async function editCategory(categoryId) {
    try {
        const doc = await db.collection('menuCategories').doc(categoryId).get();
        const category = doc.data();

        currentEditingCategoryId = categoryId;
        document.getElementById('categoryModalTitle').textContent = 'Edit Category';

        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryIcon').value = category.icon || '';
        document.getElementById('categoryOrder').value = category.order;
        document.getElementById('categorySpecialClass').value = category.specialClass || '';
        document.getElementById('categoryItemsClass').value = category.itemsClass || 'menu-items';

        document.getElementById('categoryModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading category:', error);
        alert('Error loading category: ' + error.message);
    }
}

async function deleteCategory(categoryId) {
    try {
        await db.collection('menuCategories').doc(categoryId).delete();
        alert('Category deleted successfully!');
        loadMenuList();
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category: ' + error.message);
    }
}

async function editMenuItem(itemId) {
    try {
        const doc = await db.collection('menuItems').doc(itemId).get();
        const item = doc.data();

        currentEditingMenuItemId = itemId;
        document.getElementById('menuItemModalTitle').textContent = 'Edit Menu Item';

        await loadCategoriesDropdown();

        document.getElementById('menuItemCategory').value = item.categoryId;
        document.getElementById('menuItemName').value = item.name;
        document.getElementById('menuItemDescription').value = item.description || '';
        document.getElementById('menuItemPrice').value = item.price;
        document.getElementById('menuItemType').value = item.type || '';
        document.getElementById('menuItemOrder').value = item.order;

        document.getElementById('menuItemModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading menu item:', error);
        alert('Error loading menu item: ' + error.message);
    }
}

async function deleteMenuItem(itemId) {
    try {
        await db.collection('menuItems').doc(itemId).delete();
        alert('Menu item deleted successfully!');
        loadMenuList();
    } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Error deleting menu item: ' + error.message);
    }
}

// ==================== GALLERY FUNCTIONS ====================

async function loadGalleryList() {
    const galleryList = document.getElementById('galleryList');
    const loading = document.getElementById('galleryListLoading');

    if (!galleryList || !loading) return;

    loading.style.display = 'block';
    galleryList.innerHTML = '';

    try {
        const snapshot = await db.collection('gallery').orderBy('order', 'asc').get();

        loading.style.display = 'none';

        if (snapshot.empty) {
            galleryList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No gallery images added yet. Click "+ Add Image" to get started!</p>';
            return;
        }

        snapshot.forEach(doc => {
            const image = doc.data();
            const card = createGalleryCard(doc.id, image);
            galleryList.innerHTML += card;
        });

        attachGalleryEventListeners();

    } catch (error) {
        console.error('Error loading gallery:', error);
        loading.innerHTML = '<p style="color: red;">Error loading gallery.</p>';
    }
}

function createGalleryCard(id, image) {
    return `
        <div class="item-card">
            <h3>${image.title}</h3>
            <p><strong>Category:</strong> ${image.category}</p>
            <p><strong>Order:</strong> ${image.order}</p>
            ${image.imageUrl ? `<p><strong>Has Image:</strong> Yes</p>` : `<p><strong>Has Image:</strong> No (using gradient)</p>`}
            <div class="item-card-actions">
                <button class="btn-edit" data-gallery-id="${id}">Edit</button>
                <button class="btn-delete-item" data-gallery-id="${id}">Delete</button>
            </div>
        </div>
    `;
}

function attachGalleryEventListeners() {
    document.querySelectorAll('.btn-edit[data-gallery-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const galleryId = this.getAttribute('data-gallery-id');
            await editGalleryImage(galleryId);
        });
    });

    document.querySelectorAll('.btn-delete-item[data-gallery-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const galleryId = this.getAttribute('data-gallery-id');
            if (confirm('Are you sure you want to delete this gallery image?')) {
                await deleteGalleryImage(galleryId);
            }
        });
    });
}

async function editGalleryImage(galleryId) {
    try {
        const doc = await db.collection('gallery').doc(galleryId).get();
        const image = doc.data();

        currentEditingGalleryId = galleryId;
        document.getElementById('galleryImageModalTitle').textContent = 'Edit Gallery Image';

        document.getElementById('galleryImageTitle').value = image.title;
        document.getElementById('galleryImageCategory').value = image.category;
        document.getElementById('galleryImageUrl').value = image.imageUrl || '';
        document.getElementById('galleryImageGradient').value = image.gradient || '';
        document.getElementById('galleryImageOrder').value = image.order;

        document.getElementById('galleryImageModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading gallery image:', error);
        alert('Error loading gallery image: ' + error.message);
    }
}

async function deleteGalleryImage(galleryId) {
    try {
        await db.collection('gallery').doc(galleryId).delete();
        alert('Gallery image deleted successfully!');
        loadGalleryList();
    } catch (error) {
        console.error('Error deleting gallery image:', error);
        alert('Error deleting gallery image: ' + error.message);
    }
}
