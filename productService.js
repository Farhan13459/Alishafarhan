// Professional Product Service
class ProductService {
     static async searchProducts(query) {
         try {
             // Try backend endpoints first
             for (const endpoint of CONFIG.API.FALLBACK_ENDPOINTS) {
                 try {
                     const response = await this.fetchWithTimeout(endpoint, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ message: query })
                     });
 
                     if (response.ok) {
                         const data = await response.json();
                         
                         if (data.products && Array.isArray(data.products)) {
                             return {
                                 products: data.products,
                                 message: data.message,
                                 source: 'backend'
                             };
                         }
                     }
                 } catch (error) {
                     console.log(`Endpoint failed: ${endpoint}`);
                     continue;
                 }
             }
 
             // Fallback to demo products
             return {
                 products: this.generateDemoProducts(query),
                 message: `Showing demo products for "${query}"`,
                 source: 'demo'
             };
 
         } catch (error) {
             ErrorHandler.logError(error, 'searchProducts');
             return {
                 products: this.generateDemoProducts(query),
                 message: 'Using demo products due to technical issues',
                 source: 'fallback'
             };
         }
     }
 
     static async fetchWithTimeout(url, options = {}) {
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
 
         try {
             const response = await fetch(url, {
                 ...options,
                 signal: controller.signal
             });
             clearTimeout(timeoutId);
             return response;
         } catch (error) {
             clearTimeout(timeoutId);
             throw error;
         }
     }
 
     static generateDemoProducts(query) {
         const lowerQuery = query.toLowerCase();
         
         // LAPTOPS
         if (lowerQuery.includes('laptop') || lowerQuery.includes('کمپیوٹر') || lowerQuery.includes('حاسوب')) {
             return [
                 {
                     "_id": "demo-laptop-1",
                     "name": "Dell Inspiron 15 Laptop",
                     "price": "$45,999",
                     "description": "15.6 inch FHD display, Intel Core i5, 8GB RAM, 512GB SSD, Windows 11 - Perfect for students and professionals",
                     "category": "laptop",
                     "images": [
                         "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
                         "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=300&fit=crop"
                     ]
                 },
                 {
                     "_id": "demo-laptop-2",
                     "name": "HP Pavilion Gaming Laptop", 
                     "price": "$52,499",
                     "description": "Gaming laptop with NVIDIA graphics, 16GB RAM, 1TB HDD, backlit keyboard - Ideal for gaming and heavy tasks",
                     "category": "laptop",
                     "images": [
                         "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop",
                         "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop"
                     ]
                 }
             ];
         }
         
         // MOBILE PHONES
         else if (lowerQuery.includes('mobile') || lowerQuery.includes('phone') || lowerQuery.includes('فون') || lowerQuery.includes('هاتف')) {
             return [
                 {
                     "_id": "demo-mobile-1", 
                     "name": "Samsung Galaxy S23",
                     "price": "$89,999",
                     "description": "Latest Samsung smartphone with 128GB storage, 5G support, amazing camera system - Flagship performance",
                     "category": "mobile",
                     "images": [
                         "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
                         "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop"
                     ]
                 },
                 {
                     "_id": "demo-mobile-2",
                     "name": "iPhone 14 Pro",
                     "price": "$124,999",
                     "description": "Apple iPhone 14 Pro with dynamic island, 256GB, professional camera system - Premium experience",
                     "category": "mobile", 
                     "images": [
                         "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=300&fit=crop",
                         "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop"
                     ]
                 }
             ];
         }
         
         // SHOES
         else if (lowerQuery.includes('shoe') || lowerQuery.includes('جوتے') || lowerQuery.includes('حذاء') || lowerQuery.includes('sports') || lowerQuery.includes('running')) {
             const isRed = lowerQuery.includes('red') || lowerQuery.includes('سرخ') || lowerQuery.includes('أحمر');
             
             return [
                 {
                     "_id": "demo-shoes-1",
                     "name": isRed ? "Nike Running Shoes Red" : "Nike Running Shoes",
                     "price": "$8,499",
                     "description": "Men's running shoes" + (isRed ? " in vibrant red color" : "") + ". Comfortable for sports, gym, and casual wear with advanced cushioning",
                     "category": "shoes",
                     "images": [
                         "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
                         "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=300&fit=crop"
                     ]
                 }
             ];
         }
         
         // DEFAULT PRODUCTS
         else {
             return [
                 {
                     "_id": "default-1",
                     "name": "Premium Gaming Laptop",
                     "price": "$45,999",
                     "description": "High-performance gaming laptop with dedicated graphics, perfect for gaming and professional work",
                     "category": "laptop",
                     "images": [
                         "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop"
                     ]
                 },
                 {
                     "_id": "default-2", 
                     "name": "Latest Smartphone",
                     "price": "$35,999",
                     "description": "Feature-rich smartphone with excellent camera, long battery life, and premium design",
                     "category": "mobile",
                     "images": [
                         "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop"
                     ]
                 }
             ];
         }
     }
 
     static async handleImageSearch(file) {
         try {
             const formData = new FormData();
             formData.append('image', file);
 
             const response = await this.fetchWithTimeout(CONFIG.API.ENDPOINTS.IMAGE_SEARCH, {
                 method: 'POST',
                 body: formData
             });
 
             if (!response.ok) throw new Error(`HTTP ${response.status}`);
             return await response.json();
         } catch (error) {
             ErrorHandler.logError(error, 'handleImageSearch');
             throw new Error('Image search failed');
         }
     }
 
     static async getInitialProducts() {
         try {
             const response = await this.fetchWithTimeout(CONFIG.API.ENDPOINTS.PRODUCTS);
             if (response.ok) {
                 return await response.json();
             }
             throw new Error('Failed to fetch initial products');
         } catch (error) {
             ErrorHandler.logError(error, 'getInitialProducts');
             return this.generateDemoProducts('latest');
         }
     }
 }
 
 // Make it available globally
 if (typeof window !== 'undefined') {
     window.ProductService = ProductService;
 }