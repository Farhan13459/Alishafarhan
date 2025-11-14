// Initialize DOM elements
let chatInput, sendMessageBtn, chatMessages, productContainer, cartCount, cartBox, cartModal, cartItems, closeCart;
let productDetailModal, closeDetailBtn, productDetailContent;
let imageSearchBtn, imageUpload, voiceSearchBtn, clearChatBtn;

function initializeDOMElements() {
  chatInput = document.getElementById("chatInput");
  sendMessageBtn = document.getElementById("sendMessageBtn");
  chatMessages = document.getElementById("chatMessages");
  productContainer = document.getElementById("productContainer");
  cartCount = document.getElementById("cartCount");
  cartBox = document.getElementById("cartBox");
  cartModal = document.getElementById("cartModal");
  cartItems = document.getElementById("cartItems");
  closeCart = document.getElementById("closeCart");
  imageSearchBtn = document.getElementById("imageSearchBtn");
  imageUpload = document.getElementById("imageUpload");
  voiceSearchBtn = document.getElementById("voiceSearchBtn");
  clearChatBtn = document.getElementById("clearChat");

  initializeChatListeners();
  initializeCartListeners();
  initializeProductDetailModal();
  updateCartCount();
}

// Chat functionality
function initializeChatListeners() {
  // Send message on button click
  sendMessageBtn.addEventListener("click", sendMessage);
  
  // Send message on Enter key
  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });
  
  // Image search functionality
  imageSearchBtn.addEventListener("click", () => imageUpload.click());
  imageUpload.addEventListener("change", handleImageUpload);
  
  // Voice search functionality
  voiceSearchBtn.addEventListener("click", startVoiceSearch);
  
  // Clear chat
  clearChatBtn.addEventListener("click", clearChat);
  
  // Quick action buttons
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.getAttribute('data-query');
      chatInput.value = query;
      sendMessage();
    });
  });
  
  // Category cards
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category');
      chatInput.value = category;
      sendMessage();
    });
  });
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add user message to chat
  addMessageToChat(message, 'user');
  chatInput.value = '';
  
  // Show typing indicator
  const typingIndicator = showTypingIndicator();
  
  try {
    // Send message to backend
    const response = await fetch(`http://localhost:5000/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Remove typing indicator
    typingIndicator.remove();
    
    // Add bot response to chat
    addMessageToChat(data.response, 'bot');
    
    // Display products if any
    if (data.products && data.products.length > 0) {
      displayProducts(data.products);
    }
    
  } catch (error) {
    console.error("Chat error:", error);
    typingIndicator.remove();
    
    // Fallback: Search products directly
    searchProducts(message);
    addMessageToChat(`I found some products related to "${message}". Here are the results:`, 'bot');
  }
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Add user message with image
  addMessageToChat(`Searching for similar products...`, 'user');
  
  // Show typing indicator
  const typingIndicator = showTypingIndicator();
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`http://localhost:5000/image-search`, {
      method: "POST",
      body: formData
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Remove typing indicator
    typingIndicator.remove();
    
    // Add bot response to chat
    addMessageToChat(data.response, 'bot');
    
    // Display products if any
    if (data.products && data.products.length > 0) {
      displayProducts(data.products);
    }
    
  } catch (error) {
    console.error("Image search error:", error);
    typingIndicator.remove();
    addMessageToChat("Sorry, I couldn't process your image search. Please try again.", 'bot');
  }
  
  // Reset file input
  event.target.value = '';
}

function startVoiceSearch() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Voice search is not supported in your browser.");
    return;
  }
  
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.start();
  
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    sendMessage();
  };
  
  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
  };
}

function addMessageToChat(message, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = `<p>${message}</p>`;
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message typing-indicator';
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = '<i class="fas fa-robot"></i>';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = '<p><i class="fas fa-ellipsis-h"></i> Typing...</p>';
  
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(content);
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return typingDiv;
}

function clearChat() {
  if (confirm("Are you sure you want to clear the chat?")) {
    chatMessages.innerHTML = `
      <div class="message bot-message">
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <p>Hello! I'm your AI shopping assistant. I can help you:</p>
          <ul>
            <li>Search products in any language</li>
            <li>Find items using images</li>
            <li>Recommend products based on your preferences</li>
            <li>Answer questions about shipping and payments</li>
          </ul>
          <p>What would you like to shop for today?</p>
        </div>
      </div>
    `;
  }
}

// Cart functionality (keep existing cart functions)
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(product) {
  const idx = cart.findIndex(item => item.name === product.name);
  if (idx !== -1) {
    cart[idx].quantity = (cart[idx].quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  if (!cartCount) return;
  const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  cartCount.textContent = total;
}

function renderCartItems() {
  if (!cartItems) return;
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = "<li style='text-align:center;color:#666;padding:20px;'>No items in cart.</li>";
    const cartTotal = document.querySelector('.cart-total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (cartTotal) cartTotal.classList.remove('show');
    if (checkoutBtn) checkoutBtn.classList.remove('show');
    return;
  }

  const cartTotal = document.querySelector('.cart-total');
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (cartTotal) cartTotal.classList.add('show');
  if (checkoutBtn) checkoutBtn.classList.add('show');

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    const quantity = item.quantity || 1;
    const price = parseFloat(item.price?.replace(/[^0-9.]/g, '') || 0);
    const itemTotal = price * quantity;

    li.innerHTML = `
      <div class="cart-item-info">
        <strong>${item.name}</strong>
        <div class="cart-item-price">${item.price} ${quantity > 1 ? `× ${quantity}` : ''}</div>
        <div class="quantity-controls">
          <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">−</button>
          <span class="quantity-value">${quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
        </div>
        ${quantity > 1 ? `<div style="margin-top:5px;font-size:12px;color:#666;">Total: $${itemTotal.toFixed(2)}</div>` : ''}
      </div>
      <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>
    `;
    cartItems.appendChild(li);
  });

  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.price?.replace(/[^0-9.]/g, '') || 0);
    return sum + price * (item.quantity || 1);
  }, 0);
  
  const cartTotalAmount = document.getElementById('cartTotalAmount');
  if (cartTotalAmount) cartTotalAmount.textContent = `$${total.toFixed(2)}`;
}

window.updateQuantity = function(idx, change) {
  const item = cart[idx];
  const newQty = (item.quantity || 1) + change;
  if (newQty <= 0) {
    removeFromCart(idx);
  } else {
    item.quantity = newQty;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
  }
};

window.removeFromCart = function(idx) {
  cart.splice(idx, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCartItems();
};

function initializeCartListeners() {
  if (cartBox) cartBox.addEventListener("click", () => { 
    renderCartItems(); 
    cartModal.classList.remove("hidden"); 
  });
  
  if (closeCart) closeCart.addEventListener("click", () => { 
    cartModal.classList.add("hidden"); 
  });
  
  if (cartModal) cartModal.addEventListener("click", e => { 
    if (e.target === cartModal) cartModal.classList.add("hidden"); 
  });

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) { 
      alert("Cart is empty!"); 
      return; 
    }
    const total = cart.reduce((sum, item) => {
      const price = parseFloat(item.price?.replace(/[^0-9.]/g, '') || 0);
      return sum + price * (item.quantity || 1);
    }, 0);
    alert(`Thank you! Total: $${total.toFixed(2)}\nDemo purchase only.`);
  });
}

// Product Detail Modal functionality
function initializeProductDetailModal() {
  productDetailModal = document.getElementById("productDetailModal");
  closeDetailBtn = document.getElementById("closeDetailBtn");
  productDetailContent = document.getElementById("productDetailContent");

  if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", () => {
      productDetailModal.classList.add("hidden");
    });
  }

  if (productDetailModal) {
    productDetailModal.addEventListener("click", (e) => {
      if (e.target === productDetailModal) {
        productDetailModal.classList.add("hidden");
      }
    });
  }

  // Add keyboard escape support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && productDetailModal && !productDetailModal.classList.contains('hidden')) {
      productDetailModal.classList.add('hidden');
    }
  });
}

// Show product details in modal
function showProductDetail(product) {
  if (!productDetailModal || !productDetailContent) return;

  const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const images = product.images && Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : ["https://via.placeholder.com/500x400/cccccc/666666?text=No+Image+Available"];

  productDetailContent.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-image-section">
        <img src="${escapeHtml(images[0])}" 
             class="product-detail-main-image" 
             alt="${escapeHtml(product.name)}"
             id="detailMainImage">
        ${images.length > 1 ? `
          <div class="product-detail-thumbnails">
            ${images.map((img, index) => `
              <img src="${escapeHtml(img)}" 
                   class="product-detail-thumbnail ${index === 0 ? 'active' : ''}" 
                   alt="Thumbnail ${index + 1}"
                   data-index="${index}"
                   onclick="changeDetailImage(${index})">
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <div class="product-detail-info">
        <h2>${escapeHtml(product.name)}</h2>
        <div class="product-detail-price">${escapeHtml(product.price || 'Price N/A')}</div>
        <div class="product-detail-description">
          ${product.description ? `
            <p>${escapeHtml(product.description)}</p>
          ` : `
            <p>No detailed description available for this product.</p>
            <p style="color: #888; font-style: italic; margin-top: 10px;">
              This is a sample product demonstration. In a real application, 
              this would contain detailed product specifications and features.
            </p>
          `}
        </div>
        
        <div class="product-detail-actions">
          <button class="detail-add-to-cart-btn" onclick="addToCartFromDetail(product)">
            Add to Cart 🛒
          </button>
          <button class="back-to-products-btn" onclick="productDetailModal.classList.add('hidden')">
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  `;

  // Initialize thumbnail functionality
  if (images.length > 1) {
    const thumbnails = productDetailContent.querySelectorAll('.product-detail-thumbnail');
    thumbnails.forEach(thumb => {
      thumb.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        changeDetailImage(index);
      });
    });
  }

  productDetailModal.classList.remove("hidden");
}

// Change main image in detail view
window.changeDetailImage = function(index) {
  const mainImage = document.getElementById('detailMainImage');
  const thumbnails = document.querySelectorAll('.product-detail-thumbnail');
  
  if (mainImage && thumbnails.length > 0) {
    const product = getCurrentProduct();
    if (product && product.images && product.images[index]) {
      mainImage.src = product.images[index];
      
      // Update active thumbnail
      thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
      });
    }
  }
};

// Get current product
function getCurrentProduct() {
  return window.currentProduct || null;
}

// Add to cart from detail view
window.addToCartFromDetail = function(product) {
  addToCart(product);
  
  // Update button state
  const addBtn = document.querySelector('.detail-add-to-cart-btn');
  if (addBtn) {
    addBtn.textContent = "✓ Added to Cart";
    addBtn.classList.add("added");
    setTimeout(() => {
      addBtn.textContent = "Add to Cart 🛒";
      addBtn.classList.remove("added");
    }, 2000);
  }
};

// Product display with slider & add-to-cart
function displayProducts(products) {
  if (!productContainer) return;
  productContainer.innerHTML = "";

  if (!products || products.length === 0) {
    productContainer.innerHTML = "<p class='no-result'>No products found.</p>";
    return;
  }

  products.forEach((product, i) => {
    if (!product.images || !Array.isArray(product.images) || product.images.length === 0) {
      product.images = ["https://via.placeholder.com/400?text=No+Image"];
    }

    const card = document.createElement("div");
    card.className = "product-card";
    let currentIndex = 0;

    const dotsHTML = product.images.length > 1
      ? `<div class="slider-dots">${product.images.map((_, idx) =>
          `<span class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>`
        ).join('')}</div>`
      : '';

    const productId = product._id || product.id || `product-${i}-${Date.now()}`;
    if (!product._id) product._id = productId;

    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    card.innerHTML = `
      <div class="product-card-content">
        <div class="slider">
          <img src="${escapeHtml(product.images[0])}" class="product-image" alt="${escapeHtml(product.name)}">
          ${product.images.length > 1 ? '<button class="prev-btn">←</button>' : ''}
          ${product.images.length > 1 ? '<button class="next-btn">→</button>' : ''}
          ${dotsHTML}
        </div>
        <h4>${escapeHtml(product.name)}</h4>
        <p class="price">${escapeHtml(product.price || 'Price N/A')}</p>
      </div>
      <button class="add-btn">Add to Cart</button>
    `;

    const imageElement = card.querySelector(".product-image");
    const prevBtn = card.querySelector(".prev-btn");
    const nextBtn = card.querySelector(".next-btn");
    const addBtn = card.querySelector(".add-btn");
    const dots = card.querySelectorAll(".dot");

    if (imageElement) {
      imageElement.onerror = function() { 
        this.onerror = null; 
        this.src = "https://via.placeholder.com/400x250/cccccc/666666?text=Image+Not+Found"; 
      };
    }

    const updateSlider = (newIndex) => {
      currentIndex = newIndex;
      if (imageElement && product.images[currentIndex]) {
        imageElement.src = product.images[currentIndex];
      }
      dots.forEach((dot, idx) => {
        if (dot) dot.classList.toggle('active', idx === currentIndex);
      });
    };

    if (product.images.length > 1) {
      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => { 
          e.stopPropagation(); 
          updateSlider((currentIndex - 1 + product.images.length) % product.images.length); 
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => { 
          e.stopPropagation(); 
          updateSlider((currentIndex + 1) % product.images.length); 
        });
      }
      
      dots.forEach((dot, idx) => {
        if (dot) {
          dot.addEventListener("click", e => { 
            e.stopPropagation(); 
            updateSlider(idx); 
          });
        }
      });

      let autoSlide;
      card.addEventListener("mouseenter", () => { 
        autoSlide = setInterval(() => updateSlider((currentIndex + 1) % product.images.length), 3000); 
      });
      card.addEventListener("mouseleave", () => clearInterval(autoSlide));
    }

    if (addBtn) {
      addBtn.addEventListener("click", (e) => { 
        e.stopPropagation(); 
        addToCart(product); 
        addBtn.textContent = "Added ✓"; 
        addBtn.classList.add("added"); 
        setTimeout(() => {
          addBtn.textContent = "Add to Cart";
          addBtn.classList.remove("added");
        }, 2000); 
      });
    }

    const content = card.querySelector(".product-card-content");
    if (content) {
      content.addEventListener("click", e => { 
        if (!e.target.closest("button")) {
          window.currentProduct = product;
          showProductDetail(product);
        }
      });
    }

    productContainer.appendChild(card);
  });
}

// Backend search
async function searchProducts(query) {
  try {
    const res = await fetch(`http://localhost:5000/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    displayProducts(data);
  } catch (err) {
    console.error("Search error:", err);
    if (productContainer) {
      productContainer.innerHTML = "<p class='no-result'>Failed to fetch products. Make sure server is running.</p>";
    }
    // Fallback: Show some sample products if server is down
    displaySampleProducts();
  }
}

// Display sample products when server is not available
function displaySampleProducts() {
  const sampleProducts = [
    {
      name: "Sample Laptop",
      price: "$999.99",
      images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop"],
      _id: "sample-laptop-1"
    },
    {
      name: "Sample Shoes",
      price: "$79.99",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop"],
      _id: "sample-shoes-1"
    },
    {
      name: "Sample Mobile",
      price: "$599.99",
      images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop"],
      _id: "sample-mobile-1"
    }
  ];
  displayProducts(sampleProducts);
}

// Initialize everything
function initializeApp() {
  initializeDOMElements();
  fetchProducts();
}

// Fetch products (on page load)
async function fetchProducts(query = "") { 
  await searchProducts(query); 
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}