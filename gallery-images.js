// Load and display gallery images from Firebase with caching
let galleryCache = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

document.addEventListener('DOMContentLoaded', function() {
    loadGallery();
});

async function loadGallery() {
    const galleryContainer = document.getElementById('galleryContainer');
    const galleryLoadingSection = document.getElementById('galleryLoadingSection');
    const noGallerySection = document.getElementById('noGallerySection');

    try {
        // Use cache if available and fresh
        const now = Date.now();
        if (galleryCache && cacheTime && (now - cacheTime < CACHE_DURATION)) {
            console.log('✓ Using cached gallery data');
            renderGallery(galleryCache, galleryContainer, galleryLoadingSection, noGallerySection);
            return;
        }

        console.log('⬇ Loading gallery from Firebase...');
        const db = firebase.firestore();
        const imagesSnapshot = await db.collection('gallery')
            .orderBy('order', 'asc')
            .get();

        // Cache the data
        galleryCache = imagesSnapshot;
        cacheTime = now;

        renderGallery(imagesSnapshot, galleryContainer, galleryLoadingSection, noGallerySection);

    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryLoadingSection.innerHTML = '<div class="container"><p style="color: red; text-align: center; padding: 60px 20px;">Error loading gallery. Please try again later.</p></div>';
    }
}

function renderGallery(imagesSnapshot, galleryContainer, galleryLoadingSection, noGallerySection) {
    galleryLoadingSection.style.display = 'none';

    if (imagesSnapshot.empty) {
        noGallerySection.style.display = 'block';
        return;
    }

    // Group images by category, then by subcategory
    const categories = {};
    imagesSnapshot.forEach(doc => {
        const image = doc.data();
        const category = image.category || 'Uncategorized';
        const subcategory = image.subcategory || '';

        if (!categories[category]) {
            categories[category] = {
                name: category,
                subcategories: {}
            };
        }

        if (!categories[category].subcategories[subcategory]) {
            categories[category].subcategories[subcategory] = [];
        }

        categories[category].subcategories[subcategory].push(image);
    });

    galleryContainer.innerHTML = '';

    // Create sections for each category
    let sectionIndex = 0;
    for (const categoryKey in categories) {
        const category = categories[categoryKey];
        const sectionClass = sectionIndex % 2 === 0 ? 'section section-alt' : 'section';

        // Create section with subcategories
        const section = createGallerySectionWithSubcategories(category.name, category.subcategories, sectionClass);
        galleryContainer.innerHTML += section;
        sectionIndex++;
    }
}

function createGallerySectionWithSubcategories(categoryName, subcategories, sectionClass) {
    let subcategoriesHTML = '';

    // Sort subcategories - empty string first (no subcategory), then alphabetically
    const sortedSubcategoryKeys = Object.keys(subcategories).sort((a, b) => {
        if (a === '') return -1;
        if (b === '') return 1;
        return a.localeCompare(b);
    });

    for (const subcategoryKey of sortedSubcategoryKeys) {
        const images = subcategories[subcategoryKey];

        const imagesHTML = images.map(image => {
            // Use img tag with async decoding for faster rendering
            let imageHTML = '';
            if (image.imageUrl) {
                imageHTML = `<img src="${image.imageUrl}" alt="${image.title || 'Gallery image'}" decoding="async" style="width: 100%; height: 100%; object-fit: contain;">`;
            } else {
                imageHTML = `<div style="width: 100%; height: 100%; background: ${image.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; border-radius: 15px;"></div>`;
            }

            return `
                <div class="gallery-item" style="position: relative; overflow: hidden;">
                    ${imageHTML}
                    <div class="gallery-overlay">
                        <span>${image.title || 'Image'}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Don't show subcategory label - it's just for internal organization
        // Images are grouped together but without visible heading
        subcategoriesHTML += `
            <div class="gallery-grid" style="margin-bottom: ${subcategoryKey ? '40px' : '0'};">
                ${imagesHTML}
            </div>
        `;
    }

    return `
        <section class="${sectionClass}">
            <div class="container">
                <h2 class="section-title">${categoryName}</h2>
                ${subcategoriesHTML}
            </div>
        </section>
    `;
}

function createGallerySection(categoryName, images, sectionClass) {
    const imagesHTML = images.map(image => {
        // Use img tag with async decoding for faster rendering
        let imageHTML = '';
        if (image.imageUrl) {
            imageHTML = `<img src="${image.imageUrl}" alt="${image.title || 'Gallery image'}" decoding="async" style="width: 100%; height: 100%; object-fit: contain;">`;
        } else {
            imageHTML = `<div style="width: 100%; height: 100%; background: ${image.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; border-radius: 15px;"></div>`;
        }

        return `
            <div class="gallery-item" style="position: relative; overflow: hidden;">
                ${imageHTML}
                <div class="gallery-overlay">
                    <span>${image.title || 'Image'}</span>
                </div>
            </div>
        `;
    }).join('');

    return `
        <section class="${sectionClass}">
            <div class="container">
                <h2 class="section-title">${categoryName}</h2>
                <div class="gallery-grid">
                    ${imagesHTML}
                </div>
            </div>
        </section>
    `;
}
