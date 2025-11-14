// ===== PROFESSIONAL PRODUCT MANAGEMENT SYSTEM =====
// Enhanced with AI recommendations, multi-language support, and professional UI

class ProductManager {
    constructor() {
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.recommendedProducts = [];
        this.userPreferences = this.loadUserPreferences();
        this.init();
    }

    init() {
        this.initializeDOMElements();
        this.setupEventListeners();
        this.loadProduct();
    }

    // ===== DOM INITIALIZATION =====
    initializeDOMElements() {
        // Main sections
        this.loadingState = document.getElementById('loadingState');
        this.productDetailSection = document.getElementById('productDetailSection');
        this.errorState = document.getElementById('errorState');
        this.recommendedSection = document.getElementById('recommendedSection');
        
        // Product images
        this.mainProductImage = document.getElementById('mainProductImage');
        this.prevImageBtn = document.getElementById('prevImageBtn');
        this.nextImageBtn = document.getElementById('nextImageBtn');
        this.thumbnailDotsContainer = document.getElementById('thumbnailDots');
        this.imageCounter = document.getElementById('imageCounter');
        
        // Product info
        this.productTitle = document.getElementById('productTitle');
        this.productPrice = document.getElementById('productPrice');
        this.originalPrice = document.getElementById('originalPrice');
        this.discountBadge = document.getElementById('discountBadge');
        this.productDescription = document.getElementById('productDescription');
        this.productFeatures = document.getElementById('productFeatures');
        this.productSpecs = document.getElementById('productSpecs');
        
        // Actions
        this.addToCartDetailBtn = document.getElementById('addToCartDetailBtn');
        this.wishlistBtn = document.getElementById('wishlistBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.quantityInput = document.getElementById('quantityInput');
        
        // Variants
        this.colorOptions = document.getElementById('colorOptions');
        this.sizeOptions = document.getElementById('sizeOptions');
        
        // Recommendations
        this.recommendedProductsGrid = document.getElementById('recommendedProductsGrid');
        
        // Shipping info
        this.shippingInfo = document.getElementById('shippingInfo');
        this.stockStatus = document.getElementById('stockStatus');
    }

    // ===== PRODUCT DATA MANAGEMENT =====
    async loadProduct() {
        const productId = this.getProductIdFromUrl();
        
        if (!productId) {
            this.showError('Product ID not found in URL');
            return;
        }

        this.showLoading();

        try {
            const product = await this.fetchProduct(productId);
            this.currentProduct = product;
            this.renderProductDetail();
            await this.loadRecommendedProducts();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Failed to load product. Please try again.');
        }
    }

    async fetchProduct(productId) {
        // Simulate API call - replace with actual backend endpoint
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const product = await response.json();
        
        // Ensure product has required fields
        return this.normalizeProductData(product);
    }

    normalizeProductData(product) {
        // Ensure all required fields exist with fallbacks
        return {
            id: product.id || product._id,
            name: product.name || 'Unnamed Product',
            name_ur: product.name_ur || product.name,
            name_ar: product.name_ar || product.name,
            price: product.price || 0,
            originalPrice: product.originalPrice || product.price,
            currency: product.currency || 'PKR',
            category: product.category || 'general',
            description: product.description || 'No description available.',
            description_ur: product.description_ur || product.description,
            description_ar: product.description_ar || product.description,
            images: product.images && product.images.length > 0 ? product.images : [
                'https://via.placeholder.com/800x600/ffffff/cccccc?text=No+Image+Available'
            ],
            features: product.features || [],
            specifications: product.specifications || {},
            colors: product.colors || ['Default'],
            sizes: product.sizes || ['One Size'],
            brand: product.brand || 'Unknown Brand',
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
            stock: product.stock || 0,
            tags: product.tags || [],
            shipping: product.shipping || {
                free: true,
                deliveryTime: '3-5 days',
                cod: true
            }
        };
    }

    // ===== RENDERING PRODUCT DETAILS =====
    renderProductDetail() {
        if (!this.currentProduct) return;

        const product = this.currentProduct;

        // Update basic info
        this.productTitle.textContent = product.name;
        this.productPrice.textContent = this.formatPrice(product.price, product.currency);
        
        // Handle pricing and discounts
        this.renderPricingInfo(product);
        
        // Update description and features
        this.renderProductDescription(product);
        this.renderProductFeatures(product);
        this.renderProductSpecifications(product);
        
        // Render images
        this.renderProductImages(product);
        
        // Render variants
        this.renderColorOptions(product);
        this.renderSizeOptions(product);
        
        // Update stock and shipping info
        this.renderStockInfo(product);
        this.renderShippingInfo(product);
        
        // Update action buttons
        this.updateActionButtons(product);
        
        // Show product section
        this.showProductDetail();
    }

    renderPricingInfo(product) {
        const hasDiscount = product.originalPrice > product.price;
        
        if (hasDiscount) {
            this.originalPrice.innerHTML = `
                <span class="original-price">${this.formatPrice(product.originalPrice, product.currency)}</span>
                <span class="discount-percent">
                    ${this.calculateDiscountPercent(product.originalPrice, product.price)}% OFF
                </span>
            `;
            this.originalPrice.style.display = 'block';
            
            if (this.discountBadge) {
                this.discountBadge.textContent = `Save ${this.calculateDiscountPercent(product.originalPrice, product.price)}%`;
                this.discountBadge.style.display = 'inline-block';
            }
        } else {
            this.originalPrice.style.display = 'none';
            if (this.discountBadge) {
                this.discountBadge.style.display = 'none';
            }
        }
    }

    renderProductDescription(product) {
        this.productDescription.innerHTML = `
            <p>${this.escapeHtml(product.description)}</p>
            <div class="product-meta">
                <span class="brand">Brand: <strong>${this.escapeHtml(product.brand)}</strong></span>
                <span class="rating">
                    <i class="fas fa-star"></i>
                    ${product.rating} (${product.reviewCount} reviews)
                </span>
            </div>
        `;
    }

    renderProductFeatures(product) {
        if (product.features && product.features.length > 0) {
            this.productFeatures.innerHTML = `
                <h4>Key Features</h4>
                <ul>
                    ${product.features.map(feature => `
                        <li>
                            <i class="fas fa-check-circle"></i>
                            ${this.escapeHtml(feature)}
                        </li>
                    `).join('')}
                </ul>
            `;
            this.productFeatures.style.display = 'block';
        } else {
            this.productFeatures.style.display = 'none';
        }
    }

    renderProductSpecifications(product) {
        if (product.specifications && Object.keys(product.specifications).length > 0) {
            this.productSpecs.innerHTML = `
                <h4>Specifications</h4>
                <div class="specs-grid">
                    ${Object.entries(product.specifications).map(([key, value]) => `
                        <div class="spec-item">
                            <span class="spec-key">${this.escapeHtml(key)}:</span>
                            <span class="spec-value">${this.escapeHtml(value)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            this.productSpecs.style.display = 'block';
        } else {
            this.productSpecs.style.display = 'none';
        }
    }

    // ===== IMAGE GALLERY MANAGEMENT =====
    renderProductImages(product) {
        if (!product.images || product.images.length === 0) {
            this.mainProductImage.src = 'https://via.placeholder.com/800x600/ffffff/cccccc?text=No+Image+Available';
            this.hideImageNavigation();
            return;
        }

        this.currentImageIndex = 0;
        this.updateMainImage();
        this.renderThumbnailDots();
        this.updateImageCounter();
    }

    updateMainImage() {
        if (!this.currentProduct) return;

        const imageUrl = this.currentProduct.images[this.currentImageIndex];
        this.mainProductImage.src = imageUrl;
        this.mainProductImage.alt = this.currentProduct.name;
        
        // Add loading state
        this.mainProductImage.classList.add('loading');
        this.mainProductImage.onload = () => {
            this.mainProductImage.classList.remove('loading');
        };
        
        this.mainProductImage.onerror = () => {
            this.mainProductImage.src = 'https://via.placeholder.com/800x600/ffffff/cccccc?text=Image+Not+Found';
            this.mainProductImage.classList.remove('loading');
        };

        this.updateActiveDot();
        this.updateImageCounter();
    }

    renderThumbnailDots() {
        if (!this.thumbnailDotsContainer || !this.currentProduct) return;
        
        this.thumbnailDotsContainer.innerHTML = '';
        
        this.currentProduct.images.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'thumbnail-dot';
            dot.innerHTML = '<i class="fas fa-circle"></i>';
            dot.addEventListener('click', () => {
                this.currentImageIndex = index;
                this.updateMainImage();
            });
            this.thumbnailDotsContainer.appendChild(dot);
        });
    }

    updateActiveDot() {
        const dots = this.thumbnailDotsContainer?.querySelectorAll('.thumbnail-dot');
        if (!dots) return;
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentImageIndex);
        });
    }

    updateImageCounter() {
        if (this.imageCounter && this.currentProduct) {
            this.imageCounter.textContent = `${this.currentImageIndex + 1} / ${this.currentProduct.images.length}`;
        }
    }

    nextImage() {
        if (!this.currentProduct) return;
        
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentProduct.images.length;
        this.updateMainImage();
    }

    previousImage() {
        if (!this.currentProduct) return;
        
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentProduct.images.length) % this.currentProduct.images.length;
        this.updateMainImage();
    }

    hideImageNavigation() {
        if (this.prevImageBtn) this.prevImageBtn.style.display = 'none';
        if (this.nextImageBtn) this.nextImageBtn.style.display = 'none';
        if (this.thumbnailDotsContainer) this.thumbnailDotsContainer.style.display = 'none';
        if (this.imageCounter) this.imageCounter.style.display = 'none';
    }

    // ===== VARIANT SELECTION =====
    renderColorOptions(product) {
        if (!this.colorOptions || !product.colors) return;
        
        this.colorOptions.innerHTML = product.colors.map(color => `
            <button class="color-option" data-color="${this.escapeHtml(color)}" 
                    style="background-color: ${this.getColorValue(color)}"
                    title="${this.escapeHtml(color)}">
                ${color === 'Multi' ? '<i class="fas fa-palette"></i>' : ''}
            </button>
        `).join('');
    }

    renderSizeOptions(product) {
        if (!this.sizeOptions || !product.sizes) return;
        
        this.sizeOptions.innerHTML = product.sizes.map(size => `
            <button class="size-option" data-size="${this.escapeHtml(size)}">
                ${this.escapeHtml(size)}
            </button>
        `).join('');
    }

    getColorValue(color) {
        const colorMap = {
            'Black': '#000000',
            'White': '#ffffff',
            'Red': '#dc2626',
            'Blue': '#2563eb',
            'Green': '#16a34a',
            'Yellow': '#eab308',
            'Silver': '#cbd5e1',
            'Gold': '#f59e0b'
        };
        return colorMap[color] || '#6b7280';
    }

    // ===== RECOMMENDATIONS =====
    async loadRecommendedProducts() {
        try {
            // Simulate API call for recommendations
            const response = await fetch(`/api/products/recommended/${this.currentProduct.id}`);
            this.recommendedProducts = await response.json();
            this.renderRecommendedProducts();
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.recommendedProducts = [];
        }
    }

    renderRecommendedProducts() {
        if (!this.recommendedProductsGrid || this.recommendedProducts.length === 0) {
            if (this.recommendedSection) {
                this.recommendedSection.style.display = 'none';
            }
            return;
        }

        this.recommendedProductsGrid.innerHTML = this.recommendedProducts.map(product => `
            <div class="recommended-product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.images[0]}" alt="${this.escapeHtml(product.name)}" loading="lazy">
                    ${product.originalPrice > product.price ? `
                        <span class="discount-badge">
                            -${this.calculateDiscountPercent(product.originalPrice, product.price)}%
                        </span>
                    ` : ''}
                </div>
                <div class="product-info">
                    <h4 class="product-name">${this.escapeHtml(product.name)}</h4>
                    <div class="product-pricing">
                        <span class="current-price">${this.formatPrice(product.price, product.currency)}</span>
                        ${product.originalPrice > product.price ? `
                            <span class="original-price">${this.formatPrice(product.originalPrice, product.currency)}</span>
                        ` : ''}
                    </div>
                    <div class="product-rating">
                        <div class="stars">
                            ${this.renderStars(product.rating)}
                        </div>
                        <span class="review-count">(${product.reviewCount})</span>
                    </div>
                </div>
                <button class="quick-add-btn" onclick="productManager.quickAddToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        `).join('');

        if (this.recommendedSection) {
            this.recommendedSection.style.display = 'block';
        }
    }

    renderStars(rating) {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push('<i class="fas fa-star"></i>');
            } else if (i === fullStars && hasHalfStar) {
                stars.push('<i class="fas fa-star-half-alt"></i>');
            } else {
                stars.push('<i class="far fa-star"></i>');
            }
        }
        return stars.join('');
    }

    // ===== ACTION HANDLERS =====
    updateActionButtons(product) {
        const isOutOfStock = product.stock <= 0;
        
        if (this.addToCartDetailBtn) {
            this.addToCartDetailBtn.disabled = isOutOfStock;
            this.addToCartDetailBtn.innerHTML = isOutOfStock ? 
                '<i class="fas fa-times-circle"></i> Out of Stock' :
                '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }

        if (this.wishlistBtn) {
            const isInWishlist = this.isInWishlist(product.id);
            this.wishlistBtn.innerHTML = isInWishlist ?
                '<i class="fas fa-heart"></i>' :
                '<i class="far fa-heart"></i>';
            this.wishlistBtn.classList.toggle('in-wishlist', isInWishlist);
        }
    }

    async addToCart() {
        if (!this.currentProduct) return;

        const quantity = this.quantityInput ? parseInt(this.quantityInput.value) || 1 : 1;
        
        try {
            // Add to cart logic
            if (typeof window.cartManager !== 'undefined') {
                await window.cartManager.addItem(this.currentProduct, quantity);
            } else {
                // Fallback to local storage
                this.addToLocalCart(this.currentProduct, quantity);
            }
            
            this.showAddToCartSuccess();
        } catch (error) {
            this.showError('Failed to add item to cart');
        }
    }

    toggleWishlist() {
        if (!this.currentProduct) return;

        const isInWishlist = this.isInWishlist(this.currentProduct.id);
        
        if (isInWishlist) {
            this.removeFromWishlist(this.currentProduct.id);
            this.wishlistBtn.innerHTML = '<i class="far fa-heart"></i>';
            this.wishlistBtn.classList.remove('in-wishlist');
        } else {
            this.addToWishlist(this.currentProduct);
            this.wishlistBtn.innerHTML = '<i class="fas fa-heart"></i>';
            this.wishlistBtn.classList.add('in-wishlist');
        }
    }

    shareProduct() {
        if (!this.currentProduct) return;

        const shareUrl = `${window.location.origin}${window.location.pathname}?id=${this.currentProduct.id}`;
        const shareText = `Check out ${this.currentProduct.name} - ${this.formatPrice(this.currentProduct.price, this.currentProduct.currency)}`;

        if (navigator.share) {
            navigator.share({
                title: this.currentProduct.name,
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showToast('Product link copied to clipboard!');
            });
        }
    }

    quickAddToCart(productId) {
        const product = this.recommendedProducts.find(p => p.id === productId);
        if (product) {
            // Implement quick add logic
            this.showToast(`${product.name} added to cart!`);
        }
    }

    // ===== UI STATE MANAGEMENT =====
    showLoading() {
        if (this.loadingState) this.loadingState.style.display = 'flex';
        if (this.productDetailSection) this.productDetailSection.style.display = 'none';
        if (this.errorState) this.errorState.style.display = 'none';
        if (this.recommendedSection) this.recommendedSection.style.display = 'none';
    }

    hideLoading() {
        if (this.loadingState) this.loadingState.style.display = 'none';
    }

    showProductDetail() {
        if (this.productDetailSection) this.productDetailSection.style.display = 'block';
        if (this.errorState) this.errorState.style.display = 'none';
    }

    showError(message = 'An error occurred') {
        if (this.errorState) {
            this.errorState.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Product Not Found</h3>
                    <p>${this.escapeHtml(message)}</p>
                    <button class="btn btn-primary" onclick="window.location.href='index.html'">
                        <i class="fas fa-arrow-left"></i>
                        Back to Home
                    </button>
                </div>
            `;
            this.errorState.style.display = 'flex';
        }
        
        if (this.loadingState) this.loadingState.style.display = 'none';
        if (this.productDetailSection) this.productDetailSection.style.display = 'none';
        if (this.recommendedSection) this.recommendedSection.style.display = 'none';
    }

    showAddToCartSuccess() {
        if (this.addToCartDetailBtn) {
            const originalText = this.addToCartDetailBtn.innerHTML;
            this.addToCartDetailBtn.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
            this.addToCartDetailBtn.classList.add('success');
            
            setTimeout(() => {
                this.addToCartDetailBtn.innerHTML = originalText;
                this.addToCartDetailBtn.classList.remove('success');
            }, 2000);
        }
        
        this.showToast('Product added to cart successfully!');
    }

    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // ===== UTILITY FUNCTIONS =====
    getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    formatPrice(price, currency) {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: currency || 'PKR'
        }).format(price);
    }

    calculateDiscountPercent(original, current) {
        return Math.round(((original - current) / original) * 100);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderStockInfo(product) {
        if (!this.stockStatus) return;
        
        if (product.stock > 10) {
            this.stockStatus.innerHTML = '<i class="fas fa-check-circle"></i> In Stock';
            this.stockStatus.className = 'stock-status in-stock';
        } else if (product.stock > 0) {
            this.stockStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Only ${product.stock} left!`;
            this.stockStatus.className = 'stock-status low-stock';
        } else {
            this.stockStatus.innerHTML = '<i class="fas fa-times-circle"></i> Out of Stock';
            this.stockStatus.className = 'stock-status out-of-stock';
        }
    }

    renderShippingInfo(product) {
        if (!this.shippingInfo || !product.shipping) return;
        
        this.shippingInfo.innerHTML = `
            <div class="shipping-item">
                <i class="fas fa-shipping-fast"></i>
                <span>${product.shipping.free ? 'Free Shipping' : 'Shipping Calculated at Checkout'}</span>
            </div>
            <div class="shipping-item">
                <i class="fas fa-clock"></i>
                <span>Delivery: ${product.shipping.deliveryTime}</span>
            </div>
            ${product.shipping.cod ? `
                <div class="shipping-item">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Cash on Delivery Available</span>
                </div>
            ` : ''}
        `;
    }

    // ===== WISHLIST MANAGEMENT =====
    loadUserPreferences() {
        return JSON.parse(localStorage.getItem('userPreferences')) || {
            language: 'en',
            currency: 'PKR',
            wishlist: []
        };
    }

    saveUserPreferences() {
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    }

    isInWishlist(productId) {
        return this.userPreferences.wishlist.includes(productId);
    }

    addToWishlist(product) {
        if (!this.isInWishlist(product.id)) {
            this.userPreferences.wishlist.push(product.id);
            this.saveUserPreferences();
        }
    }

    removeFromWishlist(productId) {
        this.userPreferences.wishlist = this.userPreferences.wishlist.filter(id => id !== productId);
        this.saveUserPreferences();
    }

    addToLocalCart(product, quantity) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                ...product,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count in navbar
        this.updateCartCount();
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Image navigation
        if (this.prevImageBtn) {
            this.prevImageBtn.addEventListener('click', () => this.previousImage());
        }
        if (this.nextImageBtn) {
            this.nextImageBtn.addEventListener('click', () => this.nextImage());
        }

        // Action buttons
        if (this.addToCartDetailBtn) {
            this.addToCartDetailBtn.addEventListener('click', () => this.addToCart());
        }
        if (this.wishlistBtn) {
            this.wishlistBtn.addEventListener('click', () => this.toggleWishlist());
        }
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', () => this.shareProduct());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousImage();
            } else if (e.key === 'ArrowRight') {
                this.nextImage();
            }
        });

        // Touch gestures for mobile
        let touchStartX = 0;
        this.mainProductImage?.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.mainProductImage?.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    this.nextImage();
                } else {
                    this.previousImage();
                }
            }
        });
    }
}

// ===== INITIALIZATION =====
let productManager;

document.addEventListener('DOMContentLoaded', () => {
    productManager = new ProductManager();
});

// Global functions for HTML onclick handlers
window.quickAddToCart = function(productId) {
    if (productManager) {
        productManager.quickAddToCart(productId);
    }
};

// Make productManager globally available
window.productManager = productManager;