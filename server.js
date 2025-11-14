const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Load product list
const products = JSON.parse(fs.readFileSync("./products.json", "utf-8"));

// Import the enhanced NLP processor
const { smartSearch, nlpProcessor, translateToEnglish } = require('./nlp.js');

// Enhanced chat endpoint with conversation context
app.post("/api/chat", (req, res) => {
  try {
    const { message, userId = 'default', clearContext = false } = req.body;
    
    if (!message || message.trim() === '') {
      return res.json({
        success: false,
        message: "👋 Hello! I'm your shopping assistant. What would you like to search for today?",
        products: [],
        count: 0,
        type: 'greeting'
      });
    }

    // Clear context if requested
    if (clearContext) {
      nlpProcessor.clearContext(userId);
    }

    console.log(`\n📱 USER [${userId}]: "${message}"`);
    
    // Use enhanced smartSearch with user context
    const searchResult = smartSearch(message, products, userId);
    
    // Get conversation context for response
    const userContext = nlpProcessor.getContext(userId);
    
    res.json({
      success: searchResult.success,
      message: searchResult.message,
      products: searchResult.products,
      count: searchResult.count,
      type: searchResult.type,
      context: {
        userId: userId,
        lastCategory: userContext?.lastCategory,
        hasPreviousProducts: userContext?.lastProducts?.length > 0
      },
      timestamp: searchResult.timestamp
    });
    
  } catch (error) {
    console.error("💥 Chat endpoint error:", error);
    res.status(500).json({
      success: false,
      message: "I'm having trouble processing your request right now. Please try again in a moment.",
      products: [],
      count: 0,
      type: 'error'
    });
  }
});

// Enhanced search endpoint with filters
app.get("/api/search", (req, res) => {
  try {
    const { q: query, category, minPrice, maxPrice, brand, sortBy } = req.query;
    
    let filteredProducts = [...products];
    
    // Apply filters
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (brand) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(brand.toLowerCase())
      );
    }
    
    if (minPrice || maxPrice) {
      filteredProducts = filteredProducts.filter(product => {
        const price = parseInt(product.price.replace(/[^0-9]/g, ''));
        const min = minPrice ? parseInt(minPrice) : 0;
        const max = maxPrice ? parseInt(maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }
    
    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'price-low':
          filteredProducts.sort((a, b) => 
            parseInt(a.price.replace(/[^0-9]/g, '')) - parseInt(b.price.replace(/[^0-9]/g, ''))
          );
          break;
        case 'price-high':
          filteredProducts.sort((a, b) => 
            parseInt(b.price.replace(/[^0-9]/g, '')) - parseInt(a.price.replace(/[^0-9]/g, ''))
          );
          break;
        case 'rating':
          filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'discount':
          filteredProducts.sort((a, b) => {
            const discountA = a.discount ? parseInt(a.discount) : 0;
            const discountB = b.discount ? parseInt(b.discount) : 0;
            return discountB - discountA;
          });
          break;
        case 'name':
          filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
    }
    
    // If query provided, use NLP search
    if (query && query.trim()) {
      const searchResult = smartSearch(query, filteredProducts);
      filteredProducts = searchResult.products;
    }
    
    res.json({
      success: true,
      products: filteredProducts,
      count: filteredProducts.length,
      filters: {
        category,
        brand,
        minPrice,
        maxPrice,
        sortBy
      }
    });
    
  } catch (error) {
    console.error("🔍 Search endpoint error:", error);
    res.status(500).json({
      success: false,
      products: [],
      count: 0,
      message: "Search service temporarily unavailable"
    });
  }
});

// Get all products with optional filtering
app.get("/api/products", (req, res) => {
  try {
    const { category, limit } = req.query;
    
    let filteredProducts = [...products];
    
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (limit) {
      filteredProducts = filteredProducts.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      products: filteredProducts,
      count: filteredProducts.length,
      categories: [...new Set(products.map(p => p.category))].sort()
    });
    
  } catch (error) {
    console.error("📦 Products endpoint error:", error);
    res.status(500).json({
      success: false,
      products: [],
      count: 0
    });
  }
});

// Get product by ID
app.get("/api/products/:id", (req, res) => {
  try {
    const productId = req.params.id;
    const product = products.find(p => p._id === productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    
    res.json({
      success: true,
      product: product
    });
    
  } catch (error) {
    console.error("🔍 Product detail error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product details"
    });
  }
});

// Get categories
app.get("/api/categories", (req, res) => {
  try {
    const categories = [...new Set(products.map(p => p.category))].sort();
    
    res.json({
      success: true,
      categories: categories,
      count: categories.length
    });
    
  } catch (error) {
    console.error("📂 Categories endpoint error:", error);
    res.status(500).json({
      success: false,
      categories: [],
      count: 0
    });
  }
});

// Get brands
app.get("/api/brands", (req, res) => {
  try {
    const brands = [...new Set(products.map(p => {
      // Extract brand from product name (simple extraction)
      const name = p.name.toLowerCase();
      if (name.includes('apple')) return 'Apple';
      if (name.includes('samsung')) return 'Samsung';
      if (name.includes('dell')) return 'Dell';
      if (name.includes('nike')) return 'Nike';
      if (name.includes('adidas')) return 'Adidas';
      if (name.includes('sony')) return 'Sony';
      if (name.includes('canon')) return 'Canon';
      if (name.includes('jbl')) return 'JBL';
      if (name.includes('bose')) return 'Bose';
      if (name.includes('lg')) return 'LG';
      if (name.includes('levis')) return 'Levi\'s';
      if (name.includes('haier')) return 'Haier';
      return 'Other';
    }))].sort();
    
    res.json({
      success: true,
      brands: brands.filter(b => b !== 'Other'),
      count: brands.length - 1
    });
    
  } catch (error) {
    console.error("🏷️ Brands endpoint error:", error);
    res.status(500).json({
      success: false,
      brands: [],
      count: 0
    });
  }
});

// Get user context
app.get("/api/context/:userId", (req, res) => {
  try {
    const userId = req.params.userId;
    const context = nlpProcessor.getContext(userId);
    
    res.json({
      success: true,
      context: context || {
        lastCategory: null,
        lastProducts: [],
        preferences: {}
      }
    });
    
  } catch (error) {
    console.error("🧠 Context endpoint error:", error);
    res.status(500).json({
      success: false,
      context: null
    });
  }
});

// Clear user context
app.delete("/api/context/:userId", (req, res) => {
  try {
    const userId = req.params.userId;
    nlpProcessor.clearContext(userId);
    
    res.json({
      success: true,
      message: "Conversation context cleared"
    });
    
  } catch (error) {
    console.error("🗑️ Clear context error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing context"
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "🛍️ AI Shopping Assistant API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    stats: {
      totalProducts: products.length,
      categories: [...new Set(products.map(p => p.category))].length,
      nlpEnabled: true
    }
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
    type: 'error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    type: 'error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🛍️  AI Shopping Assistant Server Started");
  console.log(`✅ Running on http://localhost:${PORT}`);
  console.log(`📦 Loaded ${products.length} products`);
  console.log(`📂 ${[...new Set(products.map(p => p.category))].length} categories available`);
  console.log("🧠 Enhanced NLP with context awareness enabled");
  console.log("🔍 Smart search with intent detection ready");
  console.log("💬 Multi-language support active");
  
  // Display available categories
  const categories = [...new Set(products.map(p => p.category))].sort();
  console.log(`\n🏷️ Available categories: ${categories.join(', ')}`);
});