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
            const itemsSnapshot = await db.collection('menuItems')
                .where('categoryId', '==', categoryId)
                .orderBy('order', 'asc')
                .get();

            const items = [];
            itemsSnapshot.forEach(doc => {
                items.push(doc.data());
            });

            const categoryCard = createCategoryCard(category, items);
            menuCategories.innerHTML += categoryCard;
        }

    } catch (error) {
        console.error('Error loading menu:', error);
        menuLoading.innerHTML = '<p style="color: red;">Error loading menu. Please try again later.</p>';
    }
}

function createCategoryCard(category, items) {
    const itemsHTML = items.map(item => {
        const badgeHTML = item.type ? `<span class="badge-${item.type.toLowerCase()}">${item.type}</span>` : '';

        return `
            <div class="menu-item">
                <div class="menu-item-header">
                    <h4>${item.name}</h4>
                    <span class="menu-price">₹${item.price}</span>
                </div>
                <p>${item.description || ''}</p>
                ${badgeHTML}
            </div>
        `;
    }).join('');

    return `
        <div class="menu-category ${category.specialClass || ''}">
            <h3 class="category-title">${category.icon || ''} ${category.name}</h3>
            <div class="${category.itemsClass || 'menu-items'}">
                ${itemsHTML}
            </div>
        </div>
    `;
}
