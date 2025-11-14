const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const fs = require("fs");
const PORT = 3000;

// Import AI search and scraper
const { smartSearch, translateToEnglish, extractProductKeyword, extractKeywords, calculateSimilarity } = require("./nlp");
const { scrapeDarazProduct, searchAndScrapeDarazProduct } = require("./scraper");
const { signupUser, loginUser, authenticateToken, requireAdmin, generateToken } = require("./auth");
const multer = require('multer');

// Load product data - use absolute path for reliability
const productsPath = path.join(__dirname, "products.json");
let products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

// Ensure all products have unique IDs
products.forEach((product, index) => {
  if (!product._id && !product.id) {
    product._id = `product-${index}-${Date.now()}`;
  } else if (product.id && !product._id) {
    product._id = product.id;
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (optional, for testing)
app.use(express.static(path.join(__dirname, "../frontend")));

// Serve uploaded images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Helper function to save products
function saveProducts() {
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
}

// Health check route
app.get("/", (req, res) => {
  res.send("AI Shop backend is running ✅");
});

// ==================== CHATBOT ROUTES ====================

/**
 * AI Chat Assistant Endpoint
 * Handles natural language queries in any language
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: "Message is required",
        response: "Please type a message so I can help you find products!"
      });
    }

    console.log(`[CHAT] Received message: "${message}"`);

    // Process the message using NLP
    const processedQuery = translateToEnglish(message);
    const productKeyword = extractProductKeyword(message);
    const keywords = extractKeywords(message);
    
    console.log(`[CHAT] Processed: "${processedQuery}", Keyword: "${productKeyword}", Keywords:`, keywords);

    // Generate AI response
    let aiResponse = "";
    let foundProducts = [];
    
    // Check for greeting
    if (isGreeting(message)) {
      aiResponse = getGreetingResponse();
    } 
    // Check for help request
    else if (isHelpRequest(message)) {
      aiResponse = getHelpResponse();
    }
    // Check for shipping/payment questions
    else if (isShippingQuestion(message)) {
      aiResponse = getShippingResponse();
    }
    // Check for product search
    else {
      // Search for products
      foundProducts = smartSearch(message, products);
      
      if (foundProducts.length > 0) {
        aiResponse = generateProductResponse(message, foundProducts, productKeyword);
      } else {
        aiResponse = generateNoProductsResponse(message, productKeyword);
        
        // Try to scrape from Daraz if no products found
        try {
          const scrapedProduct = await searchAndScrapeDarazProduct(message, translateToEnglish);
          if (scrapedProduct) {
            products.push(scrapedProduct);
            saveProducts();
            foundProducts = [scrapedProduct];
            aiResponse += `\n\nI found a product for you: **${scrapedProduct.name}** - ${scrapedProduct.price}`;
          }
        } catch (scrapeError) {
          console.log(`[CHAT] Daraz scrape failed: ${scrapeError.message}`);
        }
      }
    }

    // Limit products to 6 for chat response
    const displayProducts = foundProducts.slice(0, 6);

    res.json({
      success: true,
      response: aiResponse,
      products: displayProducts,
      query: message,
      processedQuery: processedQuery,
      productKeyword: productKeyword,
      foundCount: foundProducts.length
    });

  } catch (error) {
    console.error("[CHAT] Error:", error);
    res.status(500).json({
      error: "Chat processing failed",
      response: "I'm having trouble processing your request. Please try again!",
      products: []
    });
  }
});

/**
 * Image Search Endpoint
 * Handles visual product search
 */
app.post("/api/image-search", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Image file is required",
        response: "Please upload an image file to search for similar products."
      });
    }

    console.log(`[IMAGE-SEARCH] Received image: ${req.file.filename}`);

    // In a real implementation, you would:
    // 1. Use computer vision API (Google Vision, AWS Rekognition)
    // 2. Extract product features/colors/styles
    // 3. Search database for similar products
    
    // For now, we'll simulate image search by returning random products
    // or products that match common image search terms
    
    const imagePath = `/uploads/${req.file.filename}`;
    
    // Simulate image analysis
    const simulatedKeywords = ['clothing', 'electronics', 'accessories'];
    const randomKeyword = simulatedKeywords[Math.floor(Math.random() * simulatedKeywords.length)];
    
    const foundProducts = products
      .filter(product => 
        product.category?.toLowerCase().includes(randomKeyword) || 
        Math.random() > 0.7 // Random selection for demo
      )
      .slice(0, 8);

    let response = "I found these products that might match what you're looking for:";
    
    if (foundProducts.length === 0) {
      response = "I couldn't find similar products. Try searching with different keywords or upload another image.";
    }

    res.json({
      success: true,
      response: response,
      products: foundProducts,
      imageUrl: imagePath,
      analyzedFeatures: [randomKeyword, 'similar style', 'matching category']
    });

  } catch (error) {
    console.error("[IMAGE-SEARCH] Error:", error);
    res.status(500).json({
      error: "Image search failed",
      response: "Sorry, I couldn't process your image. Please try again with a different image.",
      products: []
    });
  }
});

// ==================== CHATBOT HELPER FUNCTIONS ====================

function isGreeting(message) {
  const greetings = [
    'hello', 'hi', 'hey', 'hola', 'salam', 'السلام', 'ہیلو',
    'good morning', 'good afternoon', 'good evening',
    'how are you', 'what\'s up'
  ];
  const lowerMessage = message.toLowerCase();
  return greetings.some(greeting => lowerMessage.includes(greeting));
}

function isHelpRequest(message) {
  const helpWords = ['help', 'what can you do', 'how to use', 'guide', 'support'];
  const lowerMessage = message.toLowerCase();
  return helpWords.some(word => lowerMessage.includes(word));
}

function isShippingQuestion(message) {
  const shippingWords = [
    'shipping', 'delivery', 'ship', 'deliver', 'when will it arrive',
    'shipping cost', 'delivery time', 'free shipping', 'کھپت', 'شپنگ',
    'الشحن', 'التوصيل'
  ];
  const lowerMessage = message.toLowerCase();
  return shippingWords.some(word => lowerMessage.includes(word));
}

function getGreetingResponse() {
  const greetings = [
    "Hello! 👋 I'm your AI shopping assistant. How can I help you today?",
    "Hi there! 🛍️ I'm here to help you find the perfect products. What are you looking for?",
    "Welcome! 🤖 I can help you search for products, answer questions, and more. What would you like to shop for?",
    "Salaam! 🙏 I'm your shopping assistant. How can I assist you today?"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function getHelpResponse() {
  return `I can help you with:

🔍 **Product Search**: "Show me laptops under $500" or "سرخ جوتے دکھائیں"
📸 **Image Search**: Upload a photo to find similar products  
🛒 **Shopping Assistance**: "Add this to cart" or "Show me more options"
📦 **Shipping Info**: "Do you ship to Lahore?" or "What's the delivery time?"
💬 **Multi-language**: I understand English, Urdu, Arabic, and mixed languages

What would you like to do?`;
}

function getShippingResponse() {
  return `🚚 **Shipping Information:**

• **Free Shipping**: On orders over $50
• **Delivery Time**: 3-5 business days
• **Cities Served**: Lahore, Karachi, Islamabad, and all major cities
• **Cash on Delivery**: Available nationwide
• **International**: Shipping available to selected countries

Need specific shipping info for your location? Just let me know your city!`;
}

function generateProductResponse(query, products, keyword) {
  const productCount = products.length;
  const topProduct = products[0];
  
  const responses = [
    `I found ${productCount} products matching "${query}":`,
    `Here are ${productCount} products for "${keyword}":`,
    `Great choice! I found ${productCount} options for you:`,
    `Search results for "${query}" (${productCount} products):`
  ];
  
  let response = responses[Math.floor(Math.random() * responses.length)];
  
  // Add some personalized recommendations
  if (productCount > 3) {
    response += `\n\n💡 **Tip**: The top result "${topProduct.name}" is very popular with customers!`;
  }
  
  if (containsPriceQuery(query)) {
    response += `\n💰 I've filtered results based on your budget preference.`;
  }
  
  return response;
}

function generateNoProductsResponse(query, keyword) {
  const responses = [
    `I couldn't find products matching "${query}". Try different keywords like "${keyword || 'laptops, shoes, mobile phones'}".`,
    `No products found for "${query}". Would you like to search for "${keyword || 'similar items'}" instead?`,
    `Sorry, I couldn't find "${query}". Try these categories: laptops, mobile phones, shoes, watches, or cameras.`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

function containsPriceQuery(message) {
  const pricePatterns = [
    /under\s*\$\d+/i,
    /less than\s*\$\d+/i,
    /cheap/i,
    /affordable/i,
    /budget/i,
    /price/i,
    /cost/i,
    /\$\d+/,
    /rs\s*\d+/i,
    /pkr\s*\d+/i
  ];
  
  return pricePatterns.some(pattern => pattern.test(message));
}

// ==================== EXISTING ROUTES (Keep all your existing routes below) ====================

// Authentication routes
app.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Only allow admin role creation if explicitly set (for initial setup)
    const userRole = role === 'admin' ? 'admin' : 'user';
    
    const user = await signupUser(email, password, name, userRole);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
      token
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Login route
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await loginUser(email, password);

    res.json({
      success: true,
      message: "Login successful",
      ...result
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message });
  }
});

// Verify token route
app.get("/auth/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Get all products API
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Get single product by ID API
app.get("/api/product/:id", (req, res) => {
  try {
    // Set content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    // Decode the product ID from URL
    const productId = decodeURIComponent(req.params.id);
    
    // Try to find product by _id or id field
    let product = products.find(p => {
      const pId = p._id || p.id;
      return pId === productId || pId === decodeURIComponent(productId);
    });
    
    // If not found by ID, try by index (for backward compatibility)
    if (!product) {
      const index = parseInt(productId);
      if (!isNaN(index) && index >= 0 && index < products.length) {
        product = products[index];
      }
    }
    
    if (product) {
      // Return full product data including images, price, description
      res.json({
        _id: product._id || product.id,
        name: product.name,
        price: product.price,
        description: product.description || '',
        images: product.images || [],
        category: product.category || '',
        url: product.url || '',
        scrapedAt: product.scrapedAt || ''
      });
    } else {
      res.status(404).json({ 
        error: "Product not found", 
        message: `No product found with ID: ${productId}` 
      });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

// AI Smart Search API with Urdu and natural language support
app.get("/api/search", (req, res) => {
  try {
    // Set content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    const query = req.query.q?.trim() || "";
    
    // If query is empty, return all products
    if (!query) {
      return res.json(products);
    }
    
    // Use AI smart search
    const results = smartSearch(query, products);
    
    // Ensure we always return an array
    const response = Array.isArray(results) ? results : [];
    
    res.json(response);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed", message: error.message });
  }
});

// Daraz Scraper API - URL based
app.post("/api/scrape", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    
    if (!url.includes('daraz')) {
      return res.status(400).json({ error: "Invalid Daraz URL" });
    }
    
    // Scrape the product
    const scrapedProduct = await scrapeDarazProduct(url);
    
    // Assign unique ID if not present
    if (!scrapedProduct._id && !scrapedProduct.id) {
      scrapedProduct._id = `product-${products.length}-${Date.now()}`;
    } else if (scrapedProduct.id && !scrapedProduct._id) {
      scrapedProduct._id = scrapedProduct.id;
    }
    
    // Add to products array
    products.push(scrapedProduct);
    
    // Save to file
    saveProducts();
    
    res.json({
      success: true,
      product: scrapedProduct,
      message: `Product scraped successfully! Found ${scrapedProduct.images.length} images.`
    });
    
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({
      error: "Scraping failed",
      message: error.message
    });
  }
});

// Helper function to create a product from search query (fallback)
function createProductFromQuery(query, translatedQuery) {
  const productName = translatedQuery || query;
  const capitalizedName = productName.charAt(0).toUpperCase() + productName.slice(1).toLowerCase();
  
  // Get relevant images based on product type
  const productImages = {
    'laptop': [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'
    ],
    'shoes': [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop'
    ],
    'mobile': [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=400&fit=crop'
    ],
    'headphone': [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop'
    ],
    'camera': [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop'
    ],
    'watch': [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=400&fit=crop'
    ]
  };
  
  // Find matching images based on product keyword
  let images = [];
  const queryLower = productName.toLowerCase();
  for (const [key, imgs] of Object.entries(productImages)) {
    if (queryLower.includes(key)) {
      images = imgs;
      break;
    }
  }
  
  // Default images if no match
  if (images.length === 0) {
    images = [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop'
    ];
  }
  
  return {
    _id: `product-${products.length}-${Date.now()}`,
    name: capitalizedName,
    price: '$49.99',
    description: `High-quality ${productName}. Search for "${query}"`,
    images: images,
    category: productName.toLowerCase(),
    createdAt: new Date().toISOString(),
    searchQuery: query,
    translatedQuery: translatedQuery || query,
    scraped: false
  };
}

// Daraz Search and Scrape API - Query based (NEW)
app.post("/api/search-scrape", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    console.log(`[API] Received search-scrape request for: "${query}"`);
    
    let scrapedProduct;
    let translatedQuery = query;
    
    try {
      // Try to extract product keyword first
      translatedQuery = extractProductKeyword(query) || translateToEnglish(query) || query;
      console.log(`[API] Extracted keyword: "${translatedQuery}"`);
    } catch (error) {
      console.warn(`[API] Keyword extraction error: ${error.message}`);
      translatedQuery = query;
    }
    
    try {
      // Try to search and scrape product from Daraz
      console.log(`[API] Attempting to scrape from Daraz...`);
      scrapedProduct = await searchAndScrapeDarazProduct(query, translateToEnglish);
      console.log(`[API] Successfully scraped from Daraz: ${scrapedProduct.name}`);
    } catch (scrapeError) {
      console.warn(`[API] Daraz scraping failed: ${scrapeError.message}`);
      console.log(`[API] Creating product from search query as fallback...`);
      
      // Fallback: Create a product from the search query
      scrapedProduct = createProductFromQuery(query, translatedQuery);
      console.log(`[API] Created fallback product: ${scrapedProduct.name}`);
    }
    
    // Assign unique ID if not present
    if (!scrapedProduct._id && !scrapedProduct.id) {
      scrapedProduct._id = `product-${products.length}-${Date.now()}`;
    } else if (scrapedProduct.id && !scrapedProduct._id) {
      scrapedProduct._id = scrapedProduct.id;
    }
    
    // Add to products array
    products.push(scrapedProduct);
    
    // Save to file
    saveProducts();
    
    const isScraped = scrapedProduct.scraped !== false;
    res.json({
      success: true,
      product: scrapedProduct,
      message: isScraped 
        ? `Product found and scraped successfully! Found ${scrapedProduct.images.length} images.`
        : `Product created from search query "${query}". You can edit it in the admin panel.`,
      searchQuery: query,
      translatedQuery: scrapedProduct.translatedQuery || translatedQuery,
      scraped: isScraped
    });
    
  } catch (error) {
    console.error("[API] Search-scrape error:", error);
    res.status(500).json({
      error: "Search and scrape failed",
      message: error.message
    });
  }
});

// Add product manually API (public - for backward compatibility)
app.post("/api/products", (req, res) => {
  try {
    const newProduct = req.body;
    
    if (!newProduct.name) {
      return res.status(400).json({ error: "Product name is required" });
    }
    
    // Ensure images array exists
    if (!newProduct.images || !Array.isArray(newProduct.images)) {
      newProduct.images = ["https://via.placeholder.com/400?text=No+Image"];
    }
    
    // Assign unique ID
    if (!newProduct._id && !newProduct.id) {
      newProduct._id = `product-${products.length}-${Date.now()}`;
    }
    
    products.push(newProduct);
    saveProducts();
    
    res.json({
      success: true,
      product: newProduct,
      message: "Product added successfully"
    });
    
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: "Failed to add product", message: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Create new product (Admin only)
app.post("/api/admin/product", authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { name, price, description, category } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: "Product name and price are required" });
    }

    // Get uploaded image URLs
    const uploadedImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Get images from request body (FormData handling)
    let imageUrls = [];
    
    // Check for imageUrls field (from textarea)
    if (req.body.imageUrls) {
      if (typeof req.body.imageUrls === 'string') {
        imageUrls = req.body.imageUrls.split('\n')
          .map(url => url.trim())
          .filter(url => url.startsWith('http'));
      }
    }
    
    // Also check for images array (if sent as array)
    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        const urlImages = req.body.images.filter(img => typeof img === 'string' && img.startsWith('http'));
        imageUrls = [...imageUrls, ...urlImages];
      } else if (typeof req.body.images === 'string') {
        const urlImages = req.body.images.split(/[\n,]/)
          .map(url => url.trim())
          .filter(url => url.startsWith('http'));
        imageUrls = [...imageUrls, ...urlImages];
      }
    }
    
    // Combine uploaded images and URL images
    const allImages = [...uploadedImages, ...imageUrls];
    
    // If no images provided, use placeholder
    if (allImages.length === 0) {
      allImages.push("https://via.placeholder.com/400?text=No+Image");
    }

    const newProduct = {
      _id: `product-${products.length}-${Date.now()}`,
      name,
      price,
      description: description || '',
      category: category || '',
      images: allImages,
      createdAt: new Date().toISOString(),
      createdBy: req.user.userId
    };

    products.push(newProduct);
    saveProducts();

    res.status(201).json({
      success: true,
      product: newProduct,
      message: "Product created successfully"
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Failed to create product", message: error.message });
  }
});

// Update product (Admin only)
app.put("/api/admin/product/:id", authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const productId = decodeURIComponent(req.params.id);
    const { name, price, description, category, images } = req.body;

    const productIndex = products.findIndex(p => {
      const pId = p._id || p.id;
      return pId === productId;
    });

    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get uploaded image URLs
    const uploadedImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Get images from request body (FormData handling)
    let imageUrls = [];
    
    // Check for imageUrls field (from textarea)
    if (req.body.imageUrls) {
      if (typeof req.body.imageUrls === 'string') {
        imageUrls = req.body.imageUrls.split('\n')
          .map(url => url.trim())
          .filter(url => url.startsWith('http') || url.startsWith('/uploads/'));
      }
    }
    
    // Also check for images parameter (if sent)
    if (images) {
      if (Array.isArray(images)) {
        // Filter out file objects, keep only URL strings
        const urlImages = images.filter(img => typeof img === 'string' && (img.startsWith('http') || img.startsWith('/uploads/')));
        imageUrls = [...imageUrls, ...urlImages];
      } else if (typeof images === 'string') {
        // Handle single string or newline/comma-separated URLs
        const urlImages = images.split(/[\n,]/)
          .map(url => url.trim())
          .filter(url => url.startsWith('http') || url.startsWith('/uploads/'));
        imageUrls = [...imageUrls, ...urlImages];
      }
    }

    // Combine uploaded images and URL images
    let allImages = [...uploadedImages, ...imageUrls];
    
    // If no new images provided, keep existing images
    if (allImages.length === 0 && uploadedImages.length === 0 && imageUrls.length === 0) {
      allImages = products[productIndex].images || [];
    }

    // Update product
    products[productIndex] = {
      ...products[productIndex],
      name: name || products[productIndex].name,
      price: price || products[productIndex].price,
      description: description !== undefined ? description : products[productIndex].description,
      category: category !== undefined ? category : products[productIndex].category,
      images: allImages,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.userId
    };

    saveProducts();

    res.json({
      success: true,
      product: products[productIndex],
      message: "Product updated successfully"
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Failed to update product", message: error.message });
  }
});

// Delete product (Admin only)
app.delete("/api/admin/product/:id", authenticateToken, requireAdmin, (req, res) => {
  try {
    const productId = decodeURIComponent(req.params.id);

    const productIndex = products.findIndex(p => {
      const pId = p._id || p.id;
      return pId === productId;
    });

    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete associated image files
    const product = products[productIndex];
    if (product.images) {
      product.images.forEach(imageUrl => {
        if (imageUrl.startsWith('/uploads/')) {
          const imagePath = path.join(__dirname, imageUrl);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      });
    }

    products.splice(productIndex, 1);
    saveProducts();

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product", message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📦 Loaded ${products.length} products`);
  console.log(`🤖 AI Smart Search enabled (Urdu & Natural Language support)`);
  console.log(`💬 Chatbot API ready at /api/chat`);
  console.log(`📸 Image Search ready at /api/image-search`);
  console.log(`🕷️  Daraz Scraper ready`);
  console.log(`🔐 Authentication system ready`);
  console.log(`\n💡 To create an admin user, run: node create-admin.js <email> <password> <name>`);
});