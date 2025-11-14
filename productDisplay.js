// HORIZONTAL PRODUCT DISPLAY - NO HEADER
class ProductDisplay {
    constructor() {
        this.currentProducts = null;
    }

    displayProducts(products) {
        const productContainer = document.getElementById('productContainer');
        if (!productContainer) {
            console.error('Product container not found');
            return;
        }

        if (!products || products.length === 0) {
            productContainer.innerHTML = this.getNoProductsHTML();
            return;
        }

        this.currentProducts = products;

        // SIMPLE HORIZONTAL LAYOUT WITHOUT HEADER
        productContainer.innerHTML = `
            <div class="product-grid">
                ${products.map((product, index) => this.createProductCard(product, index)).join('')}
            </div>
        `;

        this.initializeInteractions();
    }

    createProductCard(product, index) {
        const images = product.images && product.images.length > 0 
            ? product.images 
            : ['https://via.placeholder.com/300x200/cccccc/666666?text=No+Image'];

        const firstImage = images[0];
        const productId = product._id || product.id || `product-${index}`;

        return `
            <div class="product-card" data-product-id="${productId}">
                <div class="slider">
                    <img src="${firstImage}" 
                         alt="${product.name}"
                         onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=Image+Error'">
                    ${images.length > 1 ? `
                        <div class="image-counter">
                            <i class="fas fa-images"></i> ${images.length}
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">${product.price || 'N/A'}</div>
                    <p class="product-description">
                        ${product.description || 'Quality product with excellent features.'}
                    </p>
                    
                    <div class="product-meta">
                        <span class="category-badge">${product.category || 'General'}</span>
                    </div>
                    
                    <button class="add-to-cart-btn" data-product='${JSON.stringify(product)}'>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    initializeInteractions() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const productData = button.getAttribute('data-product');
                if (productData) {
                    try {
                        const product = JSON.parse(productData);
                        this.handleAddToCart(product, button);
                    } catch (error) {
                        console.error('Error parsing product data:', error);
                    }
                }
            });
        });

        // Product click for details
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const productId = card.dataset.productId;
                    const product = this.getProductById(productId);
                    if (product) {
                        this.showProductDetail(product);
                    }
                }
            });
        });
    }

    getProductById(productId) {
        if (this.currentProducts) {
            return this.currentProducts.find(product => 
                (product._id === productId) || 
                (product.id === productId)
            );
        }
        return null;
    }

    showProductDetail(product) {
        const productDetailModal = document.getElementById('productDetailModal');
        const productDetailContent = document.getElementById('productDetailContent');
        
        if (!productDetailModal || !productDetailContent) return;

        const images = product.images && product.images.length > 0 
            ? product.images 
            : ['https://via.placeholder.com/500x400/cccccc/666666?text=No+Image'];

        productDetailContent.innerHTML = `
            <div style="display: flex; gap: 2rem; padding: 1rem;">
                <div style="flex: 1;">
                    <img src="${images[0]}" 
                         alt="${product.name}"
                         style="width: 100%; border-radius: 12px;"
                         onerror="this.src='https://via.placeholder.com/500x400/cccccc/666666?text=Image+Error'">
                </div>
                <div style="flex: 1;">
                    <h2 style="margin-bottom: 1rem;">${product.name}</h2>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #2563eb; margin-bottom: 1rem;">
                        ${product.price || 'N/A'}
                    </div>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 1.5rem;">
                        ${product.description || 'No description available.'}
                    </p>
                    <button onclick="window.productDisplay.handleAddToCartFromDetail(${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                            style="width: 100%; padding: 1rem; background: var(--gradient-primary); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;

        productDetailModal.classList.remove("hidden");
    }

    handleAddToCart(product, button) {
        if (window.cartManager) {
            window.cartManager.addToCart(product);
            
            if (button) {
                button.innerHTML = '<i class="fas fa-check"></i> Added ✓';
                button.classList.add("added");
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
                    button.classList.remove("added");
                }, 2000);
            }
        }
    }

    handleAddToCartFromDetail(product) {
        this.handleAddToCart(product);
    }

    getNoProductsHTML() {
        return `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                <h3>No Products Found</h3>
                <p>Try different search terms or browse our categories</p>
            </div>
        `;
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.productDisplay = new ProductDisplay();
    window.ProductDisplay = ProductDisplay;
}