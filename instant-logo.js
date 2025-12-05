// INSTANT LOGO LOADER - Preloads logo from cache BEFORE page renders
(function() {
    const cached = localStorage.getItem('siteSettings');
    if (cached) {
        try {
            const s = JSON.parse(cached);
            if (s.siteLogoUrl) {
                // Preload the logo image IMMEDIATELY
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = s.siteLogoUrl;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);

                // Inject CSS to show logo instantly
                const style = document.createElement('style');
                style.textContent = `.logo-image img { content: url('${s.siteLogoUrl}') !important; }`;
                document.head.appendChild(style);

                // Cache the logo URL globally for instant access
                window.__logoUrl = s.siteLogoUrl;
            }
        } catch (e) {
            console.error('Logo cache error:', e);
        }
    }
})();
