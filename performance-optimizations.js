/**
 * Performance & Mobile Optimization JavaScript
 * Enhances the existing WordPress/Astra/Elementor setup
 * Load this after jQuery and other core scripts
 */

(function($) {
    'use strict';

    // === PERFORMANCE OPTIMIZATIONS ===

    // Lazy loading implementation for older browsers
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // === MOBILE OPTIMIZATIONS ===

    // Touch gesture handling for better mobile UX
    function initTouchOptimizations() {
        let startY = 0;
        let startTime = 0;

        // Smooth scroll to top functionality
        function scrollToTop() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 0) {
                window.requestAnimationFrame(scrollToTop);
                window.scrollTo(0, scrollTop - scrollTop / 8);
            }
        }

        // Show/hide scroll-to-top button based on scroll position
        function toggleScrollButton() {
            const scrollButton = document.getElementById('ast-scroll-top');
            if (scrollButton) {
                if (window.pageYOffset > 300) {
                    scrollButton.style.display = 'block';
                } else {
                    scrollButton.style.display = 'none';
                }
            }
        }

        // Throttled scroll handler
        let scrollTimeout;
        function handleScroll() {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(toggleScrollButton, 10);
        }

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Enhanced scroll-to-top button
        $(document).on('click', '#ast-scroll-top', function(e) {
            e.preventDefault();
            scrollToTop();
        });
    }

    // === MENU OPTIMIZATIONS ===

    function initMobileMenu() {
        // Close mobile menu when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.main-header-bar, .ast-mobile-menu-trigger').length) {
                $('.main-header-bar').removeClass('ast-header-break-point');
            }
        });

        // Smooth scrolling for anchor links
        $('a[href^="#"]').on('click', function(e) {
            const target = $(this.getAttribute('href'));
            if (target.length) {
                e.preventDefault();
                $('html, body').animate({
                    scrollTop: target.offset().top - 100
                }, 800);
            }
        });
    }

    // === PERFORMANCE MONITORING ===

    function initPerformanceOptimizations() {
        // Preload critical resources
        function preloadCriticalResources() {
            const criticalResources = [
                '/wp-content/themes/astra/assets/css/minified/frontend.min.css',
                '/wp-content/themes/astra/assets/js/minified/frontend.min.js'
            ];

            criticalResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = resource.endsWith('.css') ? 'style' : 'script';
                link.href = resource;
                document.head.appendChild(link);
            });
        }

        // Defer non-critical CSS
        function deferNonCriticalCSS() {
            const noncriticalCSS = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
            noncriticalCSS.forEach(link => {
                if (!link.href.includes('frontend.min.css')) {
                    link.media = 'print';
                    link.onload = function() {
                        this.media = 'all';
                    };
                }
            });
        }

        // Only run on first load
        if (document.readyState === 'loading') {
            preloadCriticalResources();
            deferNonCriticalCSS();
        }
    }

    // === RESPONSIVE IMAGES ===

    function initResponsiveImages() {
        // Add responsive image handling
        const images = document.querySelectorAll('img:not([srcset])');
        images.forEach(img => {
            if (img.src && !img.srcset) {
                const src = img.src;
                const sizes = [300, 600, 900, 1200];
                const srcset = sizes.map(size => 
                    `${src}?w=${size} ${size}w`
                ).join(', ');
                
                img.srcset = srcset;
                img.sizes = '(max-width: 544px) 100vw, (max-width: 921px) 90vw, 1200px';
            }
        });
    }

    // === SERVICE WORKER FOR CACHING ===

    function initServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    // === ACCESSIBILITY ENHANCEMENTS ===

    function initAccessibility() {
        // Add skip link functionality
        const skipLink = $('<a href="#main" class="skip-link screen-reader-text">Skip to content</a>');
        $('body').prepend(skipLink);

        // Keyboard navigation for mobile menu
        $('.ast-mobile-menu-trigger').on('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                $(this).click();
            }
        });

        // Focus management for modals and dropdowns
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                $('.ast-dropdown-active').removeClass('ast-dropdown-active');
            }
        });
    }

    // === FORM OPTIMIZATIONS ===

    function initFormOptimizations() {
        // Auto-resize textareas
        $('textarea').on('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Add loading states to form submissions
        $('form').on('submit', function() {
            const submitBtn = $(this).find('input[type="submit"], button[type="submit"]');
            submitBtn.prop('disabled', true).addClass('loading');
            
            setTimeout(() => {
                submitBtn.prop('disabled', false).removeClass('loading');
            }, 5000); // Reset after 5 seconds as fallback
        });
    }

    // === INTERSECTION OBSERVER FOR ANIMATIONS ===

    function initScrollAnimations() {
        if ('IntersectionObserver' in window) {
            const animationObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('aos-animate');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            document.querySelectorAll('.elementor-element').forEach(el => {
                animationObserver.observe(el);
            });
        }
    }

    // === DEVICE DETECTION ===

    function detectDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768 && window.innerWidth <= 1024;
        
        document.body.classList.add(isMobile ? 'is-mobile' : 'is-desktop');
        if (isTablet) document.body.classList.add('is-tablet');
        
        // Store device info for CSS
        document.documentElement.style.setProperty('--device-type', isMobile ? 'mobile' : 'desktop');
    }

    // === INITIALIZATION ===

    $(document).ready(function() {
        // Core optimizations
        detectDevice();
        initLazyLoading();
        initTouchOptimizations();
        initMobileMenu();
        initAccessibility();
        initFormOptimizations();
        initScrollAnimations();
        
        // Performance optimizations
        initPerformanceOptimizations();
        initResponsiveImages();
        
        // Optional service worker
        // initServiceWorker(); // Uncomment if you want offline caching
    });

    // === RESIZE HANDLER ===

    let resizeTimeout;
    $(window).on('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Recalculate responsive elements
            initResponsiveImages();
        }, 250);
    });

})(jQuery);