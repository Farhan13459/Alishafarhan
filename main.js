// Main Application Entry Point
class ShoppingApp {
     constructor() {
         this.isInitialized = false;
         this.init();
     }
 
     async init() {
         try {
             console.log('🔄 Initializing Shopping App...');
             
             // Initialize error handling first
             ErrorHandler.init();
             
             // Wait for DOM to be ready
             await this.waitForDOM();
             
             // Initialize all managers
             await this.initializeManagers();
             
             // Setup global event listeners
             this.setupGlobalListeners();
             
             this.isInitialized = true;
             console.log('✅ Shopping App initialized successfully');
             
         } catch (error) {
             ErrorHandler.logError(error, 'App initialization');
             this.showErrorScreen();
         }
     }
 
     async waitForDOM() {
         return new Promise((resolve) => {
             if (document.readyState === 'loading') {
                 document.addEventListener('DOMContentLoaded', resolve);
             } else {
                 resolve();
             }
         });
     }
 
     async initializeManagers() {
         // Make managers globally available
         window.cartManager = new CartManager();
         window.chatEngine = new ChatEngine();
         window.productDisplay = new ProductDisplay();
         
         // Initialize product detail modal
         this.initializeProductDetailModal();
         
         // Load initial products
         await this.loadInitialProducts();
     }
 
     initializeProductDetailModal() {
         // Your existing product detail modal initialization
         const productDetailModal = document.getElementById('productDetailModal');
         const closeDetailBtn = document.getElementById('closeDetailBtn');
 
         if (closeDetailBtn) {
             closeDetailBtn.addEventListener('click', () => {
                 productDetailModal.classList.add('hidden');
             });
         }
 
         if (productDetailModal) {
             productDetailModal.addEventListener('click', (e) => {
                 if (e.target === productDetailModal) {
                     productDetailModal.classList.add('hidden');
                 }
             });
         }
 
         // Escape key support
         document.addEventListener('keydown', (e) => {
             if (e.key === 'Escape' && productDetailModal && !productDetailModal.classList.contains('hidden')) {
                 productDetailModal.classList.add('hidden');
             }
         });
     }
 
     async loadInitialProducts() {
         try {
             // Try to load initial products from backend
             const response = await fetch(CONFIG.API.ENDPOINTS.PRODUCTS);
             if (response.ok) {
                 const products = await response.json();
                 if (products.length > 0) {
                     window.productDisplay.displayProducts(products.slice(0, 6));
                     return;
                 }
             }
         } catch (error) {
             console.log('Using demo initial products');
         }
 
         // Fallback to demo products
         const demoProducts = ProductService.generateDemoProducts('latest');
         window.productDisplay.displayProducts(demoProducts.slice(0, 4));
     }
 
     setupGlobalListeners() {
         // Global keyboard shortcuts
         document.addEventListener('keydown', (e) => {
             // Ctrl+K for search focus
             if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                 e.preventDefault();
                 const chatInput = document.getElementById('chatInput');
                 if (chatInput) chatInput.focus();
             }
             
             // Escape to close modals
             if (e.key === 'Escape') {
                 this.closeAllModals();
             }
         });
 
         // Handle page visibility changes
         document.addEventListener('visibilitychange', () => {
             if (!document.hidden && window.cartManager) {
                 window.cartManager.updateCartCount();
             }
         });
     }
 
     closeAllModals() {
         const modals = document.querySelectorAll('.modal');
         modals.forEach(modal => {
             modal.classList.add('hidden');
         });
     }
 
     showErrorScreen() {
         document.body.innerHTML = `
             <div class="error-screen">
                 <div class="error-content">
                     <h1>😔 Something went wrong</h1>
                     <p>We're having trouble loading the shopping app.</p>
                     <button onclick="location.reload()" class="retry-btn">Try Again</button>
                     <button onclick="window.shoppingApp.resetApp()" class="reset-btn">Reset App</button>
                 </div>
             </div>
         `;
     }
 
     resetApp() {
         localStorage.clear();
         sessionStorage.clear();
         location.reload();
     }
 }
 
 // Initialize the application
 document.addEventListener('DOMContentLoaded', () => {
     window.shoppingApp = new ShoppingApp();
 });
 
 // Emergency recovery function
 window.emergencyRecovery = function() {
     console.log('🚨 Emergency recovery initiated...');
     if (window.shoppingApp) {
         window.shoppingApp.init();
     } else {
         window.shoppingApp = new ShoppingApp();
     }
 };