// Professional Error Handling
class ErrorHandler {
     static init() {
         // Global error handlers
         window.addEventListener('error', this.handleGlobalError.bind(this));
         window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
         
         // Console error interception
         this.interceptConsoleErrors();
     }
 
     static handleGlobalError(event) {
         const error = event.error || event;
         this.logError(error, 'Global Error');
         this.showUserFriendlyError();
         return false;
     }
 
     static handlePromiseRejection(event) {
         const error = event.reason;
         this.logError(error, 'Unhandled Promise Rejection');
         this.showUserFriendlyError();
     }
 
     static logError(error, context = '') {
         const errorData = {
             timestamp: new Date().toISOString(),
             context,
             message: error?.message || 'Unknown error',
             stack: error?.stack,
             url: window.location.href,
             userAgent: navigator.userAgent
         };
 
         console.error('🚨 Error:', errorData);
         
         // Send to monitoring service in production
         if (ENV?.IS_PROD) {
             this.reportToMonitoring(errorData);
         }
     }
 
     static reportToMonitoring(errorData) {
         // Can integrate with Sentry, LogRocket, etc.
         try {
             fetch('/api/errors', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(errorData)
             }).catch(console.error);
         } catch (e) {
             console.error('Failed to report error:', e);
         }
     }
 
     static showUserFriendlyError() {
         // Show gentle error message to user
         const existingError = document.querySelector('.error-toast');
         if (existingError) return;
 
         const errorToast = document.createElement('div');
         errorToast.className = 'error-toast';
         errorToast.innerHTML = `
             <div class="error-content">
                 <span>⚠️ Something went wrong. Please try again.</span>
                 <button onclick="this.parentElement.parentElement.remove()">×</button>
             </div>
         `;
         
         // Add styles if not exists
         if (!document.querySelector('#error-toast-styles')) {
             const styles = document.createElement('style');
             styles.id = 'error-toast-styles';
             styles.textContent = `
                 .error-toast {
                     position: fixed;
                     top: 20px;
                     right: 20px;
                     background: #ff4444;
                     color: white;
                     padding: 15px 20px;
                     border-radius: 8px;
                     box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                     z-index: 10000;
                     max-width: 300px;
                     animation: slideIn 0.3s ease;
                 }
                 .error-content {
                     display: flex;
                     justify-content: space-between;
                     align-items: center;
                     gap: 15px;
                 }
                 .error-toast button {
                     background: none;
                     border: none;
                     color: white;
                     font-size: 18px;
                     cursor: pointer;
                     padding: 0;
                     width: 20px;
                     height: 20px;
                 }
                 @keyframes slideIn {
                     from { transform: translateX(100%); opacity: 0; }
                     to { transform: translateX(0); opacity: 1; }
                 }
             `;
             document.head.appendChild(styles);
         }
         
         document.body.appendChild(errorToast);
         setTimeout(() => {
             if (errorToast.parentElement) {
                 errorToast.remove();
             }
         }, 5000);
     }
 
     static interceptConsoleErrors() {
         const originalError = console.error;
         console.error = function(...args) {
             originalError.apply(console, args);
             // Log to error tracking if it looks like an error object
             if (args[0] instanceof Error) {
                 ErrorHandler.logError(args[0], 'Console Error');
             }
         };
     }
 
     static createErrorBoundary(componentName) {
         return (error, errorInfo) => {
             this.logError(error, `React Error Boundary: ${componentName}`);
             if (errorInfo?.componentStack) {
                 console.error('Component Stack:', errorInfo.componentStack);
             }
         };
     }
 }
 
 // Make it available globally
 if (typeof window !== 'undefined') {
     window.ErrorHandler = ErrorHandler;
 }