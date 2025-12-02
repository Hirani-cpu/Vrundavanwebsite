// Load and display restaurant menu from Firebase
document.addEventListener('DOMContentLoaded', function() {
    loadMenu();
});

async function loadMenu() {
    const menuCategories = document.getElementById('menuCategories');
    const menuLoading = document.getElementById('menuLoading');
    const noMenu = document.getElementById('noMenu');

    try {
        const db = firebase.firestore();

        // Load categories
        const categoriesSnapshot = await db.collection('menuCategories')
            .orderBy('order', 'asc')
            .get();

        menuLoading.style.display = 'none';

        if (categoriesSnapshot.empty) {
            noMenu.style.display = 'block';
            return;
        }

        menuCategories.innerHTML = '';

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

    const itemsHTML = items.map(item => {
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
                ${itemsHTML}
            </div>
        </div>
    `;
}

// Toggle category visibility
function toggleCategory(categoryId) {
    const categoryContent = document.getElementById(categoryId);
    const icon = document.getElementById(categoryId + '-icon');

    if (categoryContent.style.display === 'none') {
        categoryContent.style.display = 'block';
        icon.textContent = '▼';
    } else {
        categoryContent.style.display = 'none';
        icon.textContent = '▶';
    }
}
