// Professional Chat Engine
class ChatEngine {
     constructor() {
         this.lastMessageTime = 0;
         this.isProcessing = false;
         this.conversationHistory = [];
         this.init();
     }
 
     init() {
         this.setupEventListeners();
         this.showWelcomeMessage();
         this.loadConversationHistory();
     }
 
     setupEventListeners() {
         const sendMessageBtn = document.getElementById('sendMessageBtn');
         const chatInput = document.getElementById('chatInput');
         const imageSearchBtn = document.getElementById('imageSearchBtn');
         const imageUpload = document.getElementById('imageUpload');
         const voiceSearchBtn = document.getElementById('voiceSearchBtn');
         const clearChatBtn = document.getElementById('clearChatBtn');
 
         if (sendMessageBtn && chatInput) {
             sendMessageBtn.addEventListener('click', () => this.sendMessage());
             chatInput.addEventListener('keypress', (e) => {
                 if (e.key === 'Enter') this.sendMessage();
             });
 
             // Auto-resize input
             chatInput.addEventListener('input', () => {
                 this.autoResizeInput(chatInput);
             });
         }
 
         if (imageSearchBtn && imageUpload) {
             imageSearchBtn.addEventListener('click', () => imageUpload.click());
             imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
         }
 
         if (voiceSearchBtn) {
             voiceSearchBtn.addEventListener('click', () => this.startVoiceSearch());
         }
 
         if (clearChatBtn) {
             clearChatBtn.addEventListener('click', () => this.clearChat());
         }
 
         // Quick actions and categories
         this.setupQuickActions();
     }
 
     setupQuickActions() {
         let lastClickTime = 0;
 
         // Quick action buttons
         document.querySelectorAll('.quick-action-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 const now = Date.now();
                 if (now - lastClickTime < 1000) return;
                 lastClickTime = now;
 
                 e.preventDefault();
                 e.stopPropagation();
 
                 const query = btn.getAttribute('data-query');
                 document.getElementById('chatInput').value = query;
                 this.sendMessage();
             });
         });
 
         // Category cards (if any in your HTML)
         document.querySelectorAll('.category-card').forEach(card => {
             card.addEventListener('click', (e) => {
                 const now = Date.now();
                 if (now - lastClickTime < 1000) return;
                 lastClickTime = now;
 
                 e.preventDefault();
                 e.stopPropagation();
 
                 const category = card.getAttribute('data-category');
                 document.getElementById('chatInput').value = category;
                 this.sendMessage();
             });
         });
     }
 
     autoResizeInput(input) {
         input.style.height = 'auto';
         input.style.height = Math.min(input.scrollHeight, 120) + 'px';
     }
 
     async sendMessage() {
         if (this.isProcessing) return;
 
         const now = Date.now();
         if (now - this.lastMessageTime < 1500) return;
         this.lastMessageTime = now;
 
         const chatInput = document.getElementById('chatInput');
         const message = chatInput.value.trim();
         
         if (!message) return;
 
         // Add user message
         this.addMessageToChat(message, 'user');
         this.addToConversationHistory(message, 'user');
         chatInput.value = '';
         chatInput.style.height = 'auto';
         this.isProcessing = true;
 
         try {
             // Show typing indicator
             const typingIndicator = this.showTypingIndicator();
 
             // Simulate AI thinking (random delay between 1-3 seconds)
             const thinkingTime = 1000 + Math.random() * 2000;
             await this.delay(thinkingTime);
 
             // Remove typing indicator
             typingIndicator.remove();
 
             // Check if it's a conversation
             const conversationResponse = this.handleConversation(message);
             
             if (conversationResponse) {
                 this.addMessageToChat(conversationResponse, 'bot');
                 this.addToConversationHistory(conversationResponse, 'bot');
             } else {
                 // It's a product search
                 const searchMessage = CONFIG.MESSAGES.SEARCHING;
                 this.addMessageToChat(searchMessage, 'bot');
                 
                 await this.handleProductSearch(message);
             }
 
         } catch (error) {
             ErrorHandler.logError(error, 'sendMessage');
             const errorMessage = CONFIG.MESSAGES.ERROR;
             this.addMessageToChat(errorMessage, 'bot');
             this.addToConversationHistory(errorMessage, 'bot');
         } finally {
             this.isProcessing = false;
             this.saveConversationHistory();
         }
     }
 
     async handleProductSearch(query) {
         try {
             const result = await ProductService.searchProducts(query);
             
             if (result.products && result.products.length > 0) {
                 // Display products
                 if (window.productDisplay) {
                     window.productDisplay.displayProducts(result.products);
                 }
                 
                 // Add success message
                 const totalImages = result.products.reduce((sum, product) => 
                     sum + (product.images?.length || 1), 0
                 );
                 
                 let successMessage;
                 if (result.source === 'backend') {
                     successMessage = result.message || `Found ${result.products.length} products for you! 👇`;
                 } else {
                     successMessage = `✅ Showing ${result.products.length} demo products with ${totalImages} images below! 👇`;
                 }
                 
                 this.addMessageToChat(successMessage, 'bot');
                 this.addToConversationHistory(successMessage, 'bot');
             } else {
                 const noProductsMessage = "Sorry, I couldn't find any products matching your search. Try different keywords or describe what you're looking for!";
                 this.addMessageToChat(noProductsMessage, 'bot');
                 this.addToConversationHistory(noProductsMessage, 'bot');
             }
         } catch (error) {
             ErrorHandler.logError(error, 'handleProductSearch');
             const errorMessage = "I'm having trouble searching right now. Please try again in a moment.";
             this.addMessageToChat(errorMessage, 'bot');
             this.addToConversationHistory(errorMessage, 'bot');
         }
     }
 
     handleConversation(message) {
         const lowerMessage = message.toLowerCase().trim();
         
         // ===== GREETINGS =====
         if (/(^hi$|^hello$|^hey$|^hola$|^salam$|السلام|ہیلو)/i.test(lowerMessage) && 
             !/(product|search|find|buy|price)/i.test(lowerMessage)) {
             const greetings = [
                 "Hello! 👋 I'm your AI shopping assistant. How can I help you find the perfect products today?",
                 "Hi there! 🛍️ Welcome to your smart shopping experience. What would you like to explore?",
                 "Salaam! 🙏 I'm here to help you discover amazing products. What are you looking for?",
                 "Hey! 🤖 Ready for some smart shopping? I can help you find products, answer questions, or show recommendations!"
             ];
             return greetings[Math.floor(Math.random() * greetings.length)];
         }
         
         // ===== HOW ARE YOU =====
         if (/(how are you|how do you do|what's up|كيف حالك|آپ کیسے ہیں)/i.test(lowerMessage)) {
             const responses = [
                 "I'm doing great! Ready to help you find some amazing products. What can I assist you with today? 😊",
                 "I'm fantastic! Browsing through our product collection always puts me in a good mood. How can I help you shop?",
                 "Doing wonderful! There are so many great products available today. What would you like to explore?"
             ];
             return responses[Math.floor(Math.random() * responses.length)];
         }
         
         // ===== THANK YOU =====
         if (/(thank you|thanks|shukriya|شكرا|شکریہ)/i.test(lowerMessage)) {
             const responses = [
                 "You're welcome! 😊 Happy to help with your shopping needs.",
                 "My pleasure! Let me know if you need anything else.",
                 "You're most welcome! Happy shopping! 🛍️"
             ];
             return responses[Math.floor(Math.random() * responses.length)];
         }
         
         // ===== HELP & FEATURES =====
         if (/(help|what can you do|how does this work|features|سہولت|مساعدة|guide)/i.test(lowerMessage)) {
             return `I'm your AI Shopping Assistant! Here's what I can help you with:
 
 🔍 **Smart Product Search**
 • Search in any language: "laptops", "جوتے", "حذاء"
 • Natural language: "red shoes under 5000" or "mobile below 30000"
 • Mixed languages: "Show mujhe blue shoes"
 
 📸 **Visual Search** 
 • Upload product images to find similar items
 • Photo-based shopping
 
 🛒 **Shopping Assistance**
 • Add to cart & checkout guidance
 • Smart product recommendations
 • Price comparison help
 
 📦 **Order Support**
 • Shipping information & delivery times
 • Return policies & exchanges
 • Payment method guidance
 
 💬 **Multi-language Support**
 • English, Urdu, Arabic understanding
 • Mixed language queries work perfectly
 
 **Try asking me:**
 • "Show me laptops under 50000"
 • "سرخ جوتے دکھائیں"
 • "What's your return policy?"
 • "I need a mobile phone for gaming"
 
 What would you like to explore first?`;
         }
 
         // ===== SHIPPING & DELIVERY =====
         if (/(shipping|delivery|deliver|ship|when will it come|کھپت|شپنگ|التوصيل|الشحن)/i.test(lowerMessage)) {
             return `🚚 **Shipping Information:**
 
 • **Free Shipping**: On orders over $50 / ₨5000
 • **Delivery Time**: 3-5 business days
 • **Cash on Delivery**: Available across Pakistan
 • **Major Cities**: Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Peshawar, Multan
 • **Order Tracking**: Real-time tracking available
 • **International**: Selected countries worldwide
 
 Need specific delivery information for your location?`;
         }
 
         // ===== RETURNS & REFUNDS =====
         if (/(return|refund|exchange|replace|واپسی|مرتجعات|استرجاع)/i.test(lowerMessage)) {
             return `📦 **Return & Refund Policy:**
 
 • **Return Period**: 7 days from delivery
 • **Condition**: Products must be unused with original packaging
 • **Refund Processing**: 3-5 business days
 • **Free Returns**: For defective or wrong items
 • **Exchange**: Available for size/color changes
 
 For return requests, please contact our support team.`;
         }
 
         // ===== PRICING & DISCOUNTS =====
         if (/(discount|sale|offer|deal|cheap|affordable|بخصم|رخص|سستے)/i.test(lowerMessage)) {
             return `💰 **Current Offers:**
 
 • **Weekly Deals**: Check our special offers section
 • **Seasonal Sales**: Major discounts during holidays
 • **Student Discount**: 10% off with valid ID
 • **Bundle Offers**: Save on product combinations
 • **Clearance Sales**: Limited time great prices
 
 Looking for products in a specific budget? Tell me your price range!`;
         }
 
         // ===== CONTACT & SUPPORT =====
         if (/(contact|support|help desk|call|email|رابط|संपर्क|رابطہ)/i.test(lowerMessage)) {
             return `📞 **Contact Support:**
 
 • **Email**: support@aishop.com
 • **Phone**: +92-XXX-XXXXXXX
 • **Live Chat**: Available 9AM-6PM (PST)
 • **Response Time**: Within 24 hours
 • **Social Media**: @AI_Shop_Official
 
 Is there a specific issue I can help you with?`;
         }
 
         // ===== ABOUT & COMPANY =====
         if (/(who are you|what is this|about|company|من أنت|تم کون ہو)/i.test(lowerMessage)) {
             return `🏪 **About AI Shop:**
 
 I'm your AI shopping assistant powered by smart technology! I help you discover amazing products through:
 
 • **Intelligent Search**: Understands natural language
 • **Multi-language Support**: English, Urdu, Arabic
 • **Smart Recommendations**: Personalized suggestions
 • **Visual Search**: Find products using images
 
 I'm here to make your shopping experience smooth and enjoyable! 🛍️`;
         }
 
         // ===== GOODBYE =====
         if (/(bye|goodbye|see you|خدا حافظ|مع السلامة)/i.test(lowerMessage)) {
             const goodbyes = [
                 "Goodbye! 👋 Happy shopping! Come back anytime you need assistance.",
                 "See you later! 🛍️ Don't hesitate to return if you need more shopping help.",
                 "Take care! 🙏 I'll be here whenever you need product recommendations."
             ];
             return goodbyes[Math.floor(Math.random() * goodbyes.length)];
         }
 
         return null; // Not a conversation - handle as product search
     }
 
     addMessageToChat(message, sender) {
         const chatMessages = document.getElementById('chatMessages');
         if (!chatMessages) return;
 
         const messageDiv = document.createElement('div');
         messageDiv.className = `message ${sender}-message`;
         
         // Add timestamp
         const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         
         messageDiv.innerHTML = `
             <div class="message-avatar">
                 <i class="fas fa-${sender === 'bot' ? 'robot' : 'user'}"></i>
             </div>
             <div class="message-content">
                 ${this.formatMessage(message)}
                 <div class="message-timestamp">${timestamp}</div>
             </div>
         `;
 
         chatMessages.appendChild(messageDiv);
         
         // Smooth scroll to bottom
         chatMessages.scrollTo({
             top: chatMessages.scrollHeight,
             behavior: 'smooth'
         });
     }
 
     formatMessage(message) {
         if (!message) return '';
         
         // Convert line breaks and basic formatting
         return message
             .replace(/\n/g, '<br>')
             .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
             .replace(/\*(.*?)\*/g, '<em>$1</em>')
             .replace(/`(.*?)`/g, '<code>$1</code>')
             .replace(/- (.*?)(<br>|$)/g, '• $1<br>');
     }
 
     showTypingIndicator() {
         const chatMessages = document.getElementById('chatMessages');
         if (!chatMessages) return { remove: () => {} };
 
         const typingDiv = document.createElement('div');
         typingDiv.className = 'message bot-message typing-indicator';
         typingDiv.id = 'typing-indicator';
         
         typingDiv.innerHTML = `
             <div class="message-avatar">
                 <i class="fas fa-robot"></i>
             </div>
             <div class="message-content">
                 <div class="typing-dots">
                     <span></span>
                     <span></span>
                     <span></span>
                 </div>
                 <p>AI is thinking...</p>
             </div>
         `;
 
         chatMessages.appendChild(typingDiv);
         chatMessages.scrollTop = chatMessages.scrollHeight;
 
         return {
             remove: () => {
                 const indicator = document.getElementById('typing-indicator');
                 if (indicator) indicator.remove();
             }
         };
     }
 
     async handleImageUpload(event) {
         const file = event.target.files[0];
         if (!file) return;
 
         // Validate file type
         if (!file.type.startsWith('image/')) {
             this.addMessageToChat("Please select a valid image file (JPEG, PNG, etc.).", 'bot');
             return;
         }
 
         // Validate file size (max 5MB)
         if (file.size > 5 * 1024 * 1024) {
             this.addMessageToChat("Image size should be less than 5MB. Please choose a smaller image.", 'bot');
             return;
         }
 
         this.addMessageToChat("Searching for similar products... 📸", 'user');
         const typingIndicator = this.showTypingIndicator();
 
         try {
             const result = await ProductService.handleImageSearch(file);
             typingIndicator.remove();
             
             this.addMessageToChat(result.response, 'bot');
             this.addToConversationHistory(result.response, 'bot');
             
             if (result.products && result.products.length > 0) {
                 if (window.productDisplay) {
                     window.productDisplay.displayProducts(result.products);
                 }
             }
         } catch (error) {
             typingIndicator.remove();
             ErrorHandler.logError(error, 'handleImageUpload');
             const fallbackMessage = "🔍 I can help you search with keywords instead! Describe what you're looking for, or try uploading a different image.";
             this.addMessageToChat(fallbackMessage, 'bot');
             this.addToConversationHistory(fallbackMessage, 'bot');
         }
 
         event.target.value = '';
     }
 
     startVoiceSearch() {
         if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
             this.addMessageToChat("Voice search is not supported in your browser. Please try Chrome or Edge.", 'bot');
             return;
         }
 
         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
         const recognition = new SpeechRecognition();
         
         recognition.continuous = false;
         recognition.interimResults = false;
         recognition.lang = 'en-US';
 
         this.addMessageToChat("🎤 Listening... Speak now!", 'bot');
 
         recognition.start();
 
         recognition.onresult = (event) => {
             const transcript = event.results[0][0].transcript;
             document.getElementById('chatInput').value = transcript;
             this.addMessageToChat(`You said: "${transcript}"`, 'user');
             this.sendMessage();
         };
 
         recognition.onerror = (event) => {
             ErrorHandler.logError(new Error(event.error), 'voiceSearch');
             
             let errorMessage = "Sorry, I couldn't hear you clearly. ";
             switch (event.error) {
                 case 'no-speech':
                     errorMessage += "No speech was detected.";
                     break;
                 case 'audio-capture':
                     errorMessage += "No microphone was found.";
                     break;
                 case 'not-allowed':
                     errorMessage += "Microphone permission was denied.";
                     break;
                 default:
                     errorMessage += "Please try typing your message instead.";
             }
             
             this.addMessageToChat(errorMessage, 'bot');
         };
 
         recognition.onend = () => {
             // Auto-restart if no result after 5 seconds
             setTimeout(() => {
                 if (!document.getElementById('chatInput').value) {
                     this.addMessageToChat("Voice search timed out. Please try again or type your message.", 'bot');
                 }
             }, 5000);
         };
     }
 
     clearChat() {
         if (confirm("Are you sure you want to clear the chat history?")) {
             const chatMessages = document.getElementById('chatMessages');
             if (chatMessages) {
                 chatMessages.innerHTML = '';
                 this.conversationHistory = [];
                 localStorage.removeItem('chatHistory');
                 this.showWelcomeMessage();
             }
         }
     }
 
     showWelcomeMessage() {
         const welcomeMessage = `Hello! I'm your AI shopping assistant. I can help you:
 
 • Search products in any language
 • Find items using images  
 • Recommend products based on your preferences
 • Answer questions about shipping and payments
 
 What would you like to shop for today?`;
         
         this.addMessageToChat(welcomeMessage, 'bot');
         this.addToConversationHistory(welcomeMessage, 'bot');
     }
 
     addToConversationHistory(message, sender) {
         this.conversationHistory.push({
             message,
             sender,
             timestamp: new Date().toISOString()
         });
 
         // Keep only last 50 messages to prevent storage issues
         if (this.conversationHistory.length > 50) {
             this.conversationHistory = this.conversationHistory.slice(-50);
         }
     }
 
     saveConversationHistory() {
         try {
             localStorage.setItem('chatHistory', JSON.stringify(this.conversationHistory));
         } catch (error) {
             ErrorHandler.logError(error, 'saveConversationHistory');
         }
     }
 
     loadConversationHistory() {
         try {
             const savedHistory = localStorage.getItem('chatHistory');
             if (savedHistory) {
                 this.conversationHistory = JSON.parse(savedHistory);
                 
                 // Optionally restore last few messages
                 // this.restoreRecentMessages();
             }
         } catch (error) {
             ErrorHandler.logError(error, 'loadConversationHistory');
         }
     }
 
     restoreRecentMessages() {
         // Restore last 5 messages from history
         const recentMessages = this.conversationHistory.slice(-5);
         const chatMessages = document.getElementById('chatMessages');
         
         if (chatMessages && recentMessages.length > 0) {
             chatMessages.innerHTML = '';
             recentMessages.forEach(msg => {
                 this.addMessageToChat(msg.message, msg.sender);
             });
         }
     }
 
     delay(ms) {
         return new Promise(resolve => setTimeout(resolve, ms));
     }
 }
 
 // Make it available globally
 if (typeof window !== 'undefined') {
     window.ChatEngine = ChatEngine;
 }