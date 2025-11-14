// Professional Utility Functions
class Utils {
     static debounce(func, wait) {
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
 
     static formatPrice(price) {
         if (!price) return '$0';
         return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
     }
 
     static escapeHtml(text) {
         if (!text) return '';
         const div = document.createElement('div');
         div.textContent = text;
         return div.innerHTML;
     }
 
     static showNotification(message, type = 'info') {
         const notification = document.createElement('div');
         notification.className = `notification ${type}`;
         notification.innerHTML = `
             <div class="notification-content">
                 <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
                 <span>${this.escapeHtml(message)}</span>
             </div>
         `;
 
         document.body.appendChild(notification);
 
         // Add styles if not exists
         if (!document.querySelector('#notification-styles')) {
             const styles = document.createElement('style');
             styles.id = 'notification-styles';
             styles.textContent = `
                 .notification {
                     position: fixed;
                     top: 20px;
                     right: 20px;
                     background: white;
                     border-left: 4px solid #2563eb;
                     border-radius: 8px;
                     padding: 16px;
                     box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                     z-index: 10000;
                     max-width: 400px;
                     animation: slideInRight 0.3s ease-out;
                 }
                 .notification.success { border-left-color: #10b981; }
                 .notification.error { border-left-color: #ef4444; }
                 .notification-content {
                     display: flex;
                     align-items: center;
                     gap: 12px;
                 }
                 @keyframes slideInRight {
                     from { transform: translateX(100%); opacity: 0; }
                     to { transform: translateX(0); opacity: 1; }
                 }
             `;
             document.head.appendChild(styles);
         }
 
         setTimeout(() => {
             notification.remove();
         }, 5000);
     }
 
     static loadScript(src) {
         return new Promise((resolve, reject) => {
             const script = document.createElement('script');
             script.src = src;
             script.onload = resolve;
             script.onerror = reject;
             document.head.appendChild(script);
         });
     }
 
     static getRandomGreeting() {
         const greetings = CONFIG.MESSAGES.GREETINGS;
         return greetings[Math.floor(Math.random() * greetings.length)];
     }
 }
 
 // Error Handler
 class ErrorHandler {
     static logError(error, context = '') {
         console.error(`💥 Error in ${context}:`, error);
         
         if (ENV.IS_DEV) {
             Utils.showNotification(`Debug: ${error.message}`, 'error');
         }
     }
 
     static handleApiError(error) {
         console.error('API Error:', error);
         return {
             success: false,
             message: CONFIG.MESSAGES.ERROR,
             products: []
         };
     }
 }
 
 // Make available globally
 if (typeof window !== 'undefined') {
     window.Utils = Utils;
     window.ErrorHandler = ErrorHandler;
 }