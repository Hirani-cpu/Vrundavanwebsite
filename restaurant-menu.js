// Load and display restaurant menu from Firebase
let allCategories = []; // Store all categories for search

document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
});

async function loadMenu() {
    const menuCategories = document.getElementById('menuCategories');
    const menuLoading = document.getElementById('menuLoading');
    const noMenu = document.getElementById('noMenu');

    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase not loaded');
        }

        const db = firebase.firestore();

        // Add search box and controls immediately (before loading data)
        const controlsHTML = `
            <div class="menu-controls">
                <div class="menu-search-box" style="flex: 1;">
                    <input type="text" class="menu-search-input" id="menuSearch" placeholder="🔍 Search menu items..." oninput="searchMenu(this.value)">
                </div>
                <div>
                    <button class="collapse-btn" onclick="collapseAllCategories()">📁 Collapse All</button>
                    <button class="collapse-btn" onclick="expandAllCategories()">📂 Expand All</button>
                </div>
            </div>
        `;
        menuCategories.innerHTML = controlsHTML;

        // Show a better loading message
        menuLoading.innerHTML = '<p>⏳ Loading menu from database...</p>';

        // Load categories
        const categoriesSnapshot = await db.collection('menuCategories')
            .orderBy('order', 'asc')
            .get();

        menuLoading.style.display = 'none';

        if (categoriesSnapshot.empty) {
            noMenu.style.display = 'block';
            return;
        }

        allCategories = []; // Reset

        // For each category, load its items
        for (const catDoc of categoriesSnapshot.docs) {
            const category = catDoc.data();
            const categoryId = catDoc.id;

            // Load items for this category
            let itemsSnapshot;
            try {
                itemsSnapshot = await db.collection('menuItems')
                    .where('categoryId', '==', categoryId)
                    .orderBy('order', 'asc')
                    .get();
            } catch (indexError) {
                console.warn('Index not found, querying without orderBy:', indexError);
                // If composite index doesn't exist, query without orderBy
                itemsSnapshot = await db.collection('menuItems')
                    .where('categoryId', '==', categoryId)
                    .get();
            }

            const items = [];
            itemsSnapshot.forEach(doc => {
                items.push(doc.data());
            });

            // Store for search
            allCategories.push({
                category: category,
                items: items
            });

            const categoryCard = createCategoryCard(category, items);
            menuCategories.innerHTML += categoryCard;
        }

    } catch (error) {
        console.error('Error loading menu:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        menuLoading.style.display = 'none';

        let errorMessage = '<p style="color: red;">Error loading menu: ' + error.message + '</p>';

        if (error.code === 'failed-precondition' || error.message.includes('index')) {
            errorMessage += '<p style="color: orange; margin-top: 10px;">This error requires creating a Firestore index. Check the browser console for a link to create the index automatically.</p>';
        }

        if (error.code === 'permission-denied') {
            errorMessage += '<p style="color: orange; margin-top: 10px;">Permission denied. Please check your Firestore security rules.</p>';
        }

        noMenu.innerHTML = errorMessage;
        noMenu.style.display = 'block';
    }
}

function createCategoryCard(category, items) {
    const categoryId = 'category-' + Math.random().toString(36).substr(2, 9);

    // Group items by subcategory
    const subcategories = {};
    items.forEach(item => {
        const subcategory = item.subcategory || '';
        if (!subcategories[subcategory]) {
            subcategories[subcategory] = [];
        }
        subcategories[subcategory].push(item);
    });

    // Sort subcategories by the minimum order number of items in each subcategory
    // This ensures subcategories appear in the order you set them (not alphabetically)
    const sortedSubcategoryKeys = Object.keys(subcategories).sort((a, b) => {
        // Items without subcategory come first
        if (a === '') return -1;
        if (b === '') return 1;

        // Get the minimum order from each subcategory
        const minOrderA = Math.min(...subcategories[a].map(item => item.order || 999));
        const minOrderB = Math.min(...subcategories[b].map(item => item.order || 999));

        return minOrderA - minOrderB;
    });

    // Build HTML for each subcategory
    let allItemsHTML = '';
    for (const subcategoryKey of sortedSubcategoryKeys) {
        const subcategoryItems = subcategories[subcategoryKey];

        // Sort items within subcategory by price (ascending - lowest first)
        subcategoryItems.sort((a, b) => (a.price || 0) - (b.price || 0));

        const itemsHTML = subcategoryItems.map(item => {
            const badgeHTML = item.type === 'VEG'
                ? '<span class="badge-veg">🥬 VEG</span>'
                : item.type === 'NON-VEG'
                ? '<span class="badge-nonveg">🍗 NON-VEG</span>'
                : '';

            return `
                <div class="menu-item-compact">
                    <div class="menu-item-row">
                        <div class="menu-item-info">
                            <h4 class="menu-item-name">${item.name} ${badgeHTML}</h4>
                            ${item.description ? `<p class="menu-item-desc">${item.description}</p>` : ''}
                        </div>
                        <span class="menu-item-price">₹${item.price}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add subcategory heading if it exists
        const subcategoryHeading = subcategoryKey ? `
            <h4 style="color: #4a7c2c; font-size: 1.1rem; margin: 20px 0 15px 0; padding-left: 10px; border-left: 4px solid #4a7c2c; font-weight: 600;">
                ${subcategoryKey}
            </h4>
        ` : '';

        allItemsHTML += subcategoryHeading + itemsHTML;
    }

    return `
        <div class="menu-category-modern ${category.specialClass || ''}">
            <div class="category-header-modern" onclick="toggleCategory('${categoryId}')">
                <div class="category-title-wrapper">
                    <span class="category-icon">${category.icon || '📋'}</span>
                    <h3 class="category-title-modern">${category.name}</h3>
                    <span class="item-count">${items.length} items</span>
                </div>
                <span class="toggle-icon" id="${categoryId}-icon">▼</span>
            </div>
            <div class="menu-items-grid" id="${categoryId}" style="display: block;">
                ${allItemsHTML}
            </div>
        </div>
    `;
}

// Toggle category visibility
window.toggleCategory = function(categoryId) {
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

// Collapse all categories
window.collapseAllCategories = function() {
    document.querySelectorAll('.menu-items-grid').forEach(grid => {
        grid.style.display = 'none';
    });
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▶';
    });
}

// Expand all categories
window.expandAllCategories = function() {
    document.querySelectorAll('.menu-items-grid').forEach(grid => {
        grid.style.display = 'block';
    });
    document.querySelectorAll('.toggle-icon').forEach(icon => {
        icon.textContent = '▼';
    });
}

// Search menu items
window.searchMenu = function(query) {
    query = query.toLowerCase().trim();

    if (query === '') {
        // Show all categories and items
        document.querySelectorAll('.menu-category-modern').forEach(cat => {
            cat.style.display = 'block';
        });
        document.querySelectorAll('.menu-item-compact').forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }

    // Search through all items
    document.querySelectorAll('.menu-category-modern').forEach(categoryDiv => {
        let categoryHasMatch = false;
        const items = categoryDiv.querySelectorAll('.menu-item-compact');

        items.forEach(item => {
            const name = item.querySelector('.menu-item-name').textContent.toLowerCase();
            const desc = item.querySelector('.menu-item-desc')?.textContent.toLowerCase() || '';

            if (name.includes(query) || desc.includes(query)) {
                item.style.display = 'flex';
                categoryHasMatch = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Show/hide category based on matches
        if (categoryHasMatch) {
            categoryDiv.style.display = 'block';
            // Auto-expand category with matches
            const categoryId = categoryDiv.querySelector('.menu-items-grid').id;
            document.getElementById(categoryId).style.display = 'block';
            document.getElementById(categoryId + '-icon').textContent = '▼';
        } else {
            categoryDiv.style.display = 'none';
        }
    });
}
