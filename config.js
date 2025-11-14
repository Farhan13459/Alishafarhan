// Professional Configuration Management
const CONFIG = {
     API: {
         ENDPOINTS: {
             CHAT: '/api/chat',
             SEARCH: '/api/search', 
             PRODUCTS: '/api/products',
             IMAGE_SEARCH: '/api/image-search'
         },
         FALLBACK_ENDPOINTS: [
             '/api/chat',
             'http://localhost:3000/api/chat',
             'http://localhost:5000/api/chat'
         ],
         TIMEOUT: 10000
     },
     
     UI: {
         TYPING_DELAY: { MIN: 1000, MAX: 2000 },
         DEBOUNCE_DELAY: 300,
         AUTO_SLIDE_INTERVAL: 3000
     },
     
     FEATURES: {
         VOICE_SEARCH: true,
         IMAGE_SEARCH: true,
         OFFLINE_MODE: true
     },
     
     MESSAGES: {
         GREETINGS: [
             "Hello! 👋 I'm your AI shopping assistant. How can I help you find the perfect products today?",
             "Hi there! 🛍️ Welcome to your smart shopping experience. What would you like to explore?",
             "Salaam! 🙏 I'm here to help you discover amazing products. What are you looking for?"
         ],
         ERROR: "Sorry, I encountered an error. Please try again.",
         SEARCHING: "🔍 Searching for the best products for you..."
     }
 };
 
 // Environment detection
 const ENV = {
     IS_DEV: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
     IS_PROD: !window.location.hostname.includes('localhost')
 };
 
 // Make it available globally
 if (typeof window !== 'undefined') {
     window.CONFIG = CONFIG;
     window.ENV = ENV;
 }