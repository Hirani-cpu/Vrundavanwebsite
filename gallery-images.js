// Load and display gallery images from Firebase
document.addEventListener('DOMContentLoaded', function() {
    loadGallery();
});

async function loadGallery() {
    const galleryContainer = document.getElementById('galleryContainer');
    const galleryLoadingSection = document.getElementById('galleryLoadingSection');
    const noGallerySection = document.getElementById('noGallerySection');

    try {
        const db = firebase.firestore();
        const imagesSnapshot = await db.collection('gallery')
            .orderBy('order', 'asc')
            .get();

        galleryLoadingSection.style.display = 'none';

        if (imagesSnapshot.empty) {
            noGallerySection.style.display = 'block';
            return;
        }

        // Group images by category
        const categories = {};
        imagesSnapshot.forEach(doc => {
            const image = doc.data();
            const category = image.category || 'Uncategorized';

            if (!categories[category]) {
                categories[category] = {
                    name: category,
                    sectionClass: image.sectionClass || 'section',
                    images: []
                };
            }

            categories[category].images.push(image);
        });

        galleryContainer.innerHTML = '';

        // Create sections for each category
        let sectionIndex = 0;
        for (const categoryKey in categories) {
            const category = categories[categoryKey];
            const sectionClass = sectionIndex % 2 === 0 ? 'section section-alt' : 'section';
            const section = createGallerySection(category.name, category.images, sectionClass);
            galleryContainer.innerHTML += section;
            sectionIndex++;
        }

    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryLoadingSection.innerHTML = '<div class="container"><p style="color: red; text-align: center; padding: 60px 20px;">Error loading gallery. Please try again later.</p></div>';
    }
}

function createGallerySection(categoryName, images, sectionClass) {
    const imagesHTML = images.map(image => {
        // Use image URL if available, otherwise use gradient
        let backgroundStyle = '';
        if (image.imageUrl) {
            backgroundStyle = `background: url('${image.imageUrl}') center/cover;`;
        } else {
            backgroundStyle = `background: ${image.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};`;
        }

        return `
            <div class="gallery-item" style="${backgroundStyle}">
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
