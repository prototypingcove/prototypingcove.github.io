/**
 * Responsive Images JavaScript
 * Handles WebP detection, responsive image loading, and performance optimization
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        lazyLoadOffset: 50, // Load images 50px before they enter viewport
        webpSupported: false,
        breakpoints: {
            mobile: 544,
            tablet: 921,
            desktop: 1200
        }
    };

    // State management
    let imagesObserver = null;
    let isWebPSupported = false;

    /**
     * Detect WebP support
     */
    function detectWebPSupport() {
        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = function () {
                resolve(webP.height === 2);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    /**
     * Get current viewport breakpoint
     */
    function getCurrentBreakpoint() {
        const width = window.innerWidth;
        if (width <= CONFIG.breakpoints.mobile) return 'mobile';
        if (width <= CONFIG.breakpoints.tablet) return 'tablet';
        return 'desktop';
    }

    /**
     * Generate responsive image sources
     */
    function generateResponsiveSources(basePath, extension, alt = '') {
        const breakpoint = getCurrentBreakpoint();
        const webpExt = isWebPSupported ? 'webp' : extension;
        
        // Remove existing extension from basePath
        const baseWithoutExt = basePath.replace(/\.[^/.]+$/, '');
        
        return {
            mobile: `${baseWithoutExt}-mobile.${webpExt}`,
            tablet: `${baseWithoutExt}-tablet.${webpExt}`,
            desktop: `${baseWithoutExt}-desktop.${webpExt}`,
            default: isWebPSupported ? `${baseWithoutExt}.webp` : basePath,
            current: breakpoint === 'mobile' ? `${baseWithoutExt}-mobile.${webpExt}` :
                    breakpoint === 'tablet' ? `${baseWithoutExt}-tablet.${webpExt}` :
                    `${baseWithoutExt}-desktop.${webpExt}`
        };
    }

    /**
     * Create responsive picture element
     */
    function createResponsivePicture(imagePath, alt = '', className = '') {
        const extension = imagePath.split('.').pop();
        const sources = generateResponsiveSources(imagePath, extension, alt);
        
        const picture = document.createElement('picture');
        picture.className = className;

        // WebP sources with responsive breakpoints
        if (isWebPSupported) {
            // Desktop WebP
            const desktopSourceWebP = document.createElement('source');
            desktopSourceWebP.srcset = sources.desktop;
            desktopSourceWebP.media = `(min-width: ${CONFIG.breakpoints.tablet + 1}px)`;
            desktopSourceWebP.type = 'image/webp';
            picture.appendChild(desktopSourceWebP);

            // Tablet WebP
            const tabletSourceWebP = document.createElement('source');
            tabletSourceWebP.srcset = sources.tablet;
            tabletSourceWebP.media = `(min-width: ${CONFIG.breakpoints.mobile + 1}px) and (max-width: ${CONFIG.breakpoints.tablet}px)`;
            tabletSourceWebP.type = 'image/webp';
            picture.appendChild(tabletSourceWebP);

            // Mobile WebP
            const mobileSourceWebP = document.createElement('source');
            mobileSourceWebP.srcset = sources.mobile;
            mobileSourceWebP.media = `(max-width: ${CONFIG.breakpoints.mobile}px)`;
            mobileSourceWebP.type = 'image/webp';
            picture.appendChild(mobileSourceWebP);
        }

        // Fallback sources (original format)
        // Desktop fallback
        const desktopSource = document.createElement('source');
        desktopSource.srcset = imagePath;
        desktopSource.media = `(min-width: ${CONFIG.breakpoints.tablet + 1}px)`;
        picture.appendChild(desktopSource);

        // Tablet fallback
        const tabletSource = document.createElement('source');
        tabletSource.srcset = imagePath;
        tabletSource.media = `(min-width: ${CONFIG.breakpoints.mobile + 1}px) and (max-width: ${CONFIG.breakpoints.tablet}px)`;
        picture.appendChild(tabletSource);

        // Mobile fallback
        const mobileSource = document.createElement('source');
        mobileSource.srcset = imagePath;
        mobileSource.media = `(max-width: ${CONFIG.breakpoints.mobile}px)`;
        picture.appendChild(mobileSource);

        // Final fallback img
        const img = document.createElement('img');
        img.src = sources.current;
        img.alt = alt;
        img.className = 'responsive-image';
        img.loading = 'lazy';
        picture.appendChild(img);

        return picture;
    }

    /**
     * Enhanced lazy loading with Intersection Observer
     */
    function initLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for browsers without IntersectionObserver
            loadAllImages();
            return;
        }

        const imageObserverConfig = {
            root: null,
            rootMargin: `${CONFIG.lazyLoadOffset}px`,
            threshold: 0.01
        };

        imagesObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    imagesObserver.unobserve(img);
                }
            });
        }, imageObserverConfig);

        // Observe all lazy images
        document.querySelectorAll('img[loading="lazy"], .lazy-image').forEach(img => {
            imagesObserver.observe(img);
        });
    }

    /**
     * Load individual image
     */
    function loadImage(img) {
        const container = img.closest('.responsive-image-container');
        
        if (container) {
            container.classList.add('loading');
        }

        // Handle data-src for lazy loading
        if (img.dataset.src && !img.src) {
            img.src = img.dataset.src;
        }

        // Handle data-srcset for responsive images
        if (img.dataset.srcset && !img.srcset) {
            img.srcset = img.dataset.srcset;
        }

        img.onload = () => {
            img.classList.add('loaded');
            if (container) {
                container.classList.remove('loading');
            }
        };

        img.onerror = () => {
            console.warn('Failed to load image:', img.src);
            if (container) {
                container.classList.remove('loading');
            }
        };
    }

    /**
     * Load all images (fallback)
     */
    function loadAllImages() {
        document.querySelectorAll('img[loading="lazy"], .lazy-image').forEach(loadImage);
    }

    /**
     * Convert existing images to responsive format
     */
    function convertExistingImages() {
        const images = document.querySelectorAll('img:not(.responsive-image):not(.converted)');
        
        images.forEach(img => {
            // Skip if already processed or is an icon/logo
            if (img.classList.contains('converted') || 
                img.classList.contains('custom-logo') ||
                img.width < 100 || img.height < 100) {
                return;
            }

            const container = document.createElement('div');
            container.className = 'responsive-image-container';
            
            // Wrap the image
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);
            
            // Add responsive class
            img.classList.add('responsive-image', 'converted');
            
            // Set up lazy loading if not already set
            if (!img.loading) {
                img.loading = 'lazy';
            }
        });
    }

    /**
     * Handle viewport changes
     */
    function handleViewportChange() {
        // Reload images if breakpoint changed significantly
        const images = document.querySelectorAll('.responsive-image');
        images.forEach(img => {
            if (img.dataset.originalSrc) {
                const sources = generateResponsiveSources(img.dataset.originalSrc, 'jpg');
                if (img.src !== sources.current) {
                    img.src = sources.current;
                }
            }
        });
    }

    /**
     * Preload critical images
     */
    function preloadCriticalImages() {
        // Preload above-the-fold images
        const criticalImages = document.querySelectorAll('.above-the-fold img, .hero-image');
        
        criticalImages.forEach(img => {
            img.loading = 'eager';
            if (img.dataset.src) {
                img.src = img.dataset.src;
            }
        });
    }

    /**
     * Generate srcset for responsive images
     */
    function generateSrcSet(basePath) {
        const extension = basePath.split('.').pop();
        const baseWithoutExt = basePath.replace(/\.[^/.]+$/, '');
        
        if (isWebPSupported) {
            return `${baseWithoutExt}-mobile.webp 480w, ${baseWithoutExt}-tablet.webp 768w, ${baseWithoutExt}-desktop.webp 1200w`;
        } else {
            return `${basePath} 1200w`; // Fallback to original
        }
    }

    /**
     * Update existing WordPress images with responsive features
     */
    function enhanceWordPressImages() {
        // Enhance WordPress image blocks
        document.querySelectorAll('.wp-block-image img, .elementor-image img').forEach(img => {
            if (!img.classList.contains('enhanced')) {
                const originalSrc = img.src;
                img.dataset.originalSrc = originalSrc;
                
                // Generate responsive srcset
                const srcset = generateSrcSet(originalSrc);
                if (srcset !== `${originalSrc} 1200w`) {
                    img.srcset = srcset;
                    img.sizes = '(max-width: 544px) 100vw, (max-width: 921px) 90vw, 1200px';
                }
                
                img.classList.add('enhanced', 'responsive-image');
            }
        });
    }

    /**
     * Initialize responsive images system
     */
    async function init() {
        console.log('🖼️ Initializing responsive images...');
        
        // Detect WebP support
        isWebPSupported = await detectWebPSupport();
        CONFIG.webpSupported = isWebPSupported;
        
        // Add class to document for CSS targeting
        if (isWebPSupported) {
            document.documentElement.classList.add('webp');
            console.log('✅ WebP support detected');
        } else {
            document.documentElement.classList.add('no-webp');
            console.log('❌ WebP not supported, using fallbacks');
        }
        
        // Initialize components
        preloadCriticalImages();
        convertExistingImages();
        enhanceWordPressImages();
        initLazyLoading();
        
        console.log('🎉 Responsive images initialized');
    }

    /**
     * Reinitialize on dynamic content changes
     */
    function reinitialize() {
        convertExistingImages();
        enhanceWordPressImages();
        
        // Re-observe new lazy images
        if (imagesObserver) {
            document.querySelectorAll('img[loading="lazy"]:not(.observed)').forEach(img => {
                imagesObserver.observe(img);
                img.classList.add('observed');
            });
        }
    }

    // Event listeners
    window.addEventListener('load', init);
    window.addEventListener('resize', debounce(handleViewportChange, 250));
    
    // Handle dynamic content (Elementor, AJAX)
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if new images were added
                const hasNewImages = Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && (node.tagName === 'IMG' || node.querySelector('img'))
                );
                
                if (hasNewImages) {
                    setTimeout(reinitialize, 100);
                }
            }
        });
    });

    // Start observing DOM changes
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    /**
     * Utility: Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Export for global access
    window.ResponsiveImages = {
        generateResponsiveSources,
        createResponsivePicture,
        isWebPSupported: () => isWebPSupported,
        reinitialize,
        CONFIG
    };

})();