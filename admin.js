// admin.js - Admin Panel Functionality

const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});


const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});


const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});


const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});


const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});


const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});


const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});


const API_BASE_URL = 'http://localhost:3000';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('adminToken');
}

// Set token in localStorage
function setToken(token) {
  localStorage.setItem('adminToken', token);
}

// Remove token from localStorage
function removeToken() {
  localStorage.removeItem('adminToken');
}

// Check if user is authenticated
function isAuthenticated() {
  return getToken() !== null;
}

// Get auth headers
function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Show/hide sections
function showLogin() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('signupSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showSignup() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('signupSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// Show error message
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
  setTimeout(() => {
    errorEl.classList.add('hidden');
  }, 5000);
}

// Show success message
function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.classList.remove('hidden');
  setTimeout(() => {
    successEl.classList.add('hidden');
  }, 3000);
}

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Check if user is admin
      if (data.user.role !== 'admin') {
        showError('loginError', 'Access denied. Admin role required.');
        return;
      }

      // Save token
      setToken(data.token);
      
      // Show admin panel
      showAdminPanel();
      
      // Load products
      loadProducts();
    } else {
      showError('loginError', data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('loginError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
  removeToken();
  showLogin();
  document.getElementById('loginForm').reset();
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const products = await response.json();

    const productsList = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
      productsList.innerHTML = '<p>No products found.</p>';
      return;
    }

    productsList.innerHTML = products.map(product => {
      const firstImage = product.images && product.images.length > 0 
        ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}${product.images[0]}`)
        : 'https://via.placeholder.com/80?text=No+Image';
      
      return `
        <div class="product-item">
          <img src="${firstImage}" alt="${product.name}" class="product-item-image" onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
          <div class="product-item-info">
            <h3>${product.name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
            <p><strong>Images:</strong> ${product.images ? product.images.length : 0}</p>
          </div>
          <div class="product-item-actions">
            <button class="btn btn-primary" onclick="editProduct('${product._id || product.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id || product.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('productsList').innerHTML = '<p style="color: red;">Failed to load products.</p>';
  }
}

// Add product form
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('productName').value;
  const price = document.getElementById('productPrice').value;
  const description = document.getElementById('productDescription').value;
  const category = document.getElementById('productCategory').value;
  const imageFiles = document.getElementById('productImages').files;
  const imageUrlsText = document.getElementById('imageUrls').value;

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add image URLs as separate entries
  // Note: FormData handles arrays, but we'll send URLs in the textarea format
  // For better handling, we'll send image URLs in a separate field
  if (imageUrls.length > 0) {
    // Append each URL separately
    imageUrls.forEach(url => {
      formData.append('imageUrls[]', url);
    });
    // Also append as a single string for backend parsing
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess('productFormSuccess', 'Product added successfully!');
      document.getElementById('productForm').reset();
      document.getElementById('imagePreview').innerHTML = '';
      document.getElementById('productImages').value = '';
      
      // Reload products
      loadProducts();
    } else {
      showError('productFormError', data.error || 'Failed to add product');
    }
  } catch (error) {
    console.error('Error adding product:', error);
    showError('productFormError', 'Failed to add product. Please try again.');
  }
});

// Image preview for add product form
document.getElementById('productImages').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  preview.innerHTML = '';

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="removeImagePreview(this)">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Remove image preview
window.removeImagePreview = function(button) {
  button.parentElement.remove();
  // Note: This doesn't remove from file input, just from preview
};

// Delete product
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      alert(data.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product. Please try again.');
  }
};

// Edit product
window.editProduct = async function(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/product/${encodeURIComponent(productId)}`);
    const product = await response.json();

    if (!product || product.error) {
      alert('Product not found');
      return;
    }

    // Populate edit form
    document.getElementById('editProductId').value = product._id || product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description || '';
    document.getElementById('editProductCategory').value = product.category || '';

    // Store original images for later use
    window.editingProductImages = product.images || [];

    // Show current images
    const editPreview = document.getElementById('editImagePreview');
    editPreview.innerHTML = '';
    if (product.images && product.images.length > 0) {
      product.images.forEach((imageUrl, index) => {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.setAttribute('data-image-url', imageUrl);
        div.innerHTML = `
          <img src="${fullUrl}" alt="Image ${index + 1}" onerror="this.src='https://via.placeholder.com/100?text=Error'">
          <button type="button" class="remove-image" onclick="removeEditImagePreview(this, '${imageUrl}')">×</button>
        `;
        editPreview.appendChild(div);
      });
    }

    // Show edit modal
    document.getElementById('editModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    alert('Failed to load product for editing');
  }
};

// Remove image from edit preview
window.removeEditImagePreview = function(button, imageUrl) {
  // Remove from preview
  button.parentElement.remove();
  
  // Remove from stored images array
  if (window.editingProductImages) {
    window.editingProductImages = window.editingProductImages.filter(url => url !== imageUrl);
  }
};

// Close edit modal
window.closeEditModal = function() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editProductForm').reset();
  document.getElementById('editImagePreview').innerHTML = '';
};

// Update product form
document.getElementById('editProductForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('editProductId').value;
  const name = document.getElementById('editProductName').value;
  const price = document.getElementById('editProductPrice').value;
  const description = document.getElementById('editProductDescription').value;
  const category = document.getElementById('editProductCategory').value;
  const imageFiles = document.getElementById('editProductImages').files;
  const imageUrlsText = document.getElementById('editImageUrls').value;

  // Get current images from preview (images that weren't removed)
  const currentImages = [];
  document.querySelectorAll('#editImagePreview .image-preview-item').forEach(item => {
    const imageUrl = item.getAttribute('data-image-url');
    if (imageUrl) {
      currentImages.push(imageUrl);
    } else {
      // Check if it's a new uploaded image (data URL)
      const img = item.querySelector('img');
      if (img && img.src.startsWith('data:')) {
        // Skip data URLs, they'll be uploaded as files
      }
    }
  });

  // Get image URLs from textarea
  const imageUrls = imageUrlsText.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0 && url.startsWith('http'));

  // Create FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('category', category);

  // Add current images
  currentImages.forEach(url => {
    formData.append('images', url);
  });

  // Add new image files
  for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
  }

  // Add new image URLs
  if (imageUrls.length > 0) {
    formData.append('imageUrls', imageUrls.join('\n'));
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/product/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('Product updated successfully!');
      closeEditModal();
      loadProducts();
    } else {
      showError('editFormError', data.error || 'Failed to update product');
    }
  } catch (error) {
    console.error('Error updating product:', error);
    showError('editFormError', 'Failed to update product. Please try again.');
  }
});

// Image preview for edit form
document.getElementById('editProductImages').addEventListener('change', function(e) {
  const preview = document.getElementById('editImagePreview');

  for (let file of e.target.files) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-image" onclick="this.parentElement.remove()">×</button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  }
});

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, role: 'user' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Note: Regular signup creates a 'user' role, not 'admin'
      // Admin users need to be created via create-admin.js script
      alert('Account created! However, admin access requires special setup. Contact system administrator.');
      showLogin();
    } else {
      showError('signupError', data.error || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    showError('signupError', 'Failed to connect to server. Make sure backend is running.');
  }
});

// Toggle between login and signup
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  showSignup();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  showLogin();
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  // Verify token if exists
  const token = getToken();
  if (token) {
    // Verify token with server
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.user.role === 'admin') {
        showAdminPanel();
        loadProducts();
      } else {
        removeToken();
        showLogin();
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      removeToken();
      showLogin();
    });
  } else {
    showLogin();
  }
});

