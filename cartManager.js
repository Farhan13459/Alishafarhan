// Professional Cart Management
class CartManager {
     constructor() {
         this.cart = this.loadCart();
         this.init();
     }
 
     init() {
         this.updateCartCount();
         this.setupCartEventListeners();
     }
 
     loadCart() {
         try {
             return JSON.parse(localStorage.getItem('cart')) || [];
         } catch (error) {
             ErrorHandler.logError(error, 'loadCart');
             return [];
         }
     }
 
     saveCart() {
         try {
             localStorage.setItem('cart', JSON.stringify(this.cart));
         } catch (error) {
             ErrorHandler.logError(error, 'saveCart');
         }
     }
 
     addToCart(product) {
         const existingItemIndex = this.cart.findIndex(item => item._id === product._id);
         
         if (existingItemIndex !== -1) {
             this.cart[existingItemIndex].quantity = (this.cart[existingItemIndex].quantity || 1) + 1;
         } else {
             this.cart.push({
                 ...product,
                 quantity: 1,
                 addedAt: new Date().toISOString()
             });
         }
         
         this.saveCart();
         this.updateCartCount();
         this.showAddToCartFeedback(product.name);
     }
 
     removeFromCart(index) {
         this.cart.splice(index, 1);
         this.saveCart();
         this.updateCartCount();
         this.renderCartItems();
     }
 
     updateQuantity(index, change) {
         const newQuantity = (this.cart[index].quantity || 1) + change;
         
         if (newQuantity <= 0) {
             this.removeFromCart(index);
         } else {
             this.cart[index].quantity = newQuantity;
             this.saveCart();
             this.updateCartCount();
             this.renderCartItems();
         }
     }
 
     updateCartCount() {
         const cartCount = document.getElementById('cartCount');
         if (!cartCount) return;
 
         const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
         cartCount.textContent = totalItems;
         
         // Add animation
         cartCount.classList.add('pulse');
         setTimeout(() => cartCount.classList.remove('pulse'), 300);
     }
 
     showAddToCartFeedback(productName) {
         // Show toast notification
         const toast = document.createElement('div');
         toast.className = 'cart-toast';
         toast.innerHTML = `
             <div class="toast-content">
                 ✅ ${productName} added to cart!
             </div>
         `;
         
         document.body.appendChild(toast);
         setTimeout(() => toast.remove(), 2000);
     }
 
     setupCartEventListeners() {
         const cartBox = document.getElementById('cartBox');
         const cartModal = document.getElementById('cartModal');
         const closeCart = document.getElementById('closeCart');
 
         if (cartBox) {
             cartBox.addEventListener('click', () => {
                 this.renderCartItems();
                 cartModal.classList.remove('hidden');
             });
         }
 
         if (closeCart) {
             closeCart.addEventListener('click', () => {
                 cartModal.classList.add('hidden');
             });
         }
 
         if (cartModal) {
             cartModal.addEventListener('click', (e) => {
                 if (e.target === cartModal) {
                     cartModal.classList.add('hidden');
                 }
             });
         }
 
         // Checkout button
         const checkoutBtn = document.getElementById('checkoutBtn');
         if (checkoutBtn) {
             checkoutBtn.addEventListener('click', () => this.handleCheckout());
         }
     }
 
     renderCartItems() {
         const cartItems = document.getElementById('cartItems');
         if (!cartItems) return;
 
         if (this.cart.length === 0) {
             cartItems.innerHTML = `
                 <li class="empty-cart">
                     <div>🛒</div>
                     <p>Your cart is empty</p>
                     <small>Add some products to get started!</small>
                 </li>
             `;
             this.hideCartTotal();
             return;
         }
 
         cartItems.innerHTML = this.cart.map((item, index) => `
             <li class="cart-item">
                 <div class="cart-item-info">
                     <strong>${this.escapeHtml(item.name)}</strong>
                     <div class="cart-item-price">${this.escapeHtml(item.price)}</div>
                     <div class="quantity-controls">
                         <button class="quantity-btn" onclick="window.cartManager.updateQuantity(${index}, -1)">−</button>
                         <span class="quantity-value">${item.quantity}</span>
                         <button class="quantity-btn" onclick="window.cartManager.updateQuantity(${index}, 1)">+</button>
                     </div>
                     ${item.quantity > 1 ? `
                         <div class="item-total">
                             Total: $${this.calculateItemTotal(item).toFixed(2)}
                         </div>
                     ` : ''}
                 </div>
                 <button class="remove-btn" onclick="window.cartManager.removeFromCart(${index})">
                     🗑️ Remove
                 </button>
             </li>
         `).join('');
 
         this.showCartTotal();
     }
 
     calculateItemTotal(item) {
         const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
         return price * (item.quantity || 1);
     }
 
     showCartTotal() {
         const total = this.cart.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
         const cartTotal = document.querySelector('.cart-total');
         const checkoutBtn = document.getElementById('checkoutBtn');
 
         if (cartTotal) {
             cartTotal.classList.add('show');
             document.getElementById('cartTotalAmount').textContent = `$${total.toFixed(2)}`;
         }
 
         if (checkoutBtn) checkoutBtn.classList.add('show');
     }
 
     hideCartTotal() {
         const cartTotal = document.querySelector('.cart-total');
         const checkoutBtn = document.getElementById('checkoutBtn');
         
         if (cartTotal) cartTotal.classList.remove('show');
         if (checkoutBtn) checkoutBtn.classList.remove('show');
     }
 
     handleCheckout() {
         if (this.cart.length === 0) {
             alert("Your cart is empty!");
             return;
         }
 
         const total = this.cart.reduce((sum, item) => sum + this.calculateItemTotal(item), 0);
         alert(`Thank you for your order! 🎉\nTotal: $${total.toFixed(2)}\n\nThis is a demo purchase.`);
         
         // Clear cart after successful checkout
         this.cart = [];
         this.saveCart();
         this.updateCartCount();
         this.renderCartItems();
     }
 
     escapeHtml(text) {
         const div = document.createElement('div');
         div.textContent = text;
         return div.innerHTML;
     }
 }