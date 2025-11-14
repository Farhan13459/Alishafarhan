// checkout.js - Checkout and Payment Functionality

// Ensure this runs after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCheckout);
} else {
    initializeCheckout();
}

function initializeCheckout() {
    // Initialize checkout
    loadCheckoutItems();
    setupEventListeners();
    calculateTotals();
    
    // Sync with cart manager if available
    if (window.checkoutCartManager) {
        window.checkoutCartManager.updateCartCount();
    }
}
 
 // Load cart items into checkout
 function loadCheckoutItems() {
     const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
     const checkoutItemsContainer = document.getElementById('checkoutItems');
     
     if (!checkoutItemsContainer) {
         console.error('Checkout items container not found');
         return;
     }
     
     if (cartItems.length === 0) {
         checkoutItemsContainer.innerHTML = `
             <div style="text-align: center; padding: 40px; color: #666;">
                 <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                 <p>Your cart is empty</p>
                 <a href="index.html" style="color: #667eea; text-decoration: none; font-weight: 500;">Continue Shopping</a>
             </div>
         `;
         const placeOrderBtn = document.getElementById('placeOrderBtn');
         if (placeOrderBtn) {
             placeOrderBtn.disabled = true;
         }
         return;
     }
 
     let itemsHTML = '';
     cartItems.forEach((item, index) => {
         // Handle price parsing - support various formats
         const priceStr = item.price || '0';
         const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
         const itemTotal = (price * (item.quantity || 1)).toFixed(2);
         
         // Handle images - use first image or placeholder
         const itemImage = (item.images && item.images.length > 0) 
             ? item.images[0] 
             : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop';
         
         itemsHTML += `
             <div class="checkout-item">
                 <img src="${itemImage}" alt="${escapeHtml(item.name)}" class="checkout-item-image" 
                      onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop'">
                 <div class="checkout-item-details">
                     <div class="checkout-item-name">${escapeHtml(item.name)}</div>
                     <div class="checkout-item-price">$${itemTotal}</div>
                     <div class="checkout-item-quantity">Quantity: ${item.quantity || 1}</div>
                 </div>
             </div>
         `;
     });
     
     checkoutItemsContainer.innerHTML = itemsHTML;
 }
 
 // Helper function to escape HTML
 function escapeHtml(text) {
     if (!text) return '';
     const div = document.createElement('div');
     div.textContent = text;
     return div.innerHTML;
 }
 
 // Setup all event listeners
 function setupEventListeners() {
     // Payment method selection
     const paymentOptions = document.querySelectorAll('.payment-option');
     paymentOptions.forEach(option => {
         option.addEventListener('click', function() {
             paymentOptions.forEach(opt => opt.classList.remove('active'));
             this.classList.add('active');
             
             const method = this.dataset.method;
             showPaymentForm(method);
         });
     });
 
     // Billing address toggle
     const sameAsShippingCheckbox = document.getElementById('sameAsShipping');
     const billingAddressForm = document.getElementById('billingAddressForm');
     
     sameAsShippingCheckbox.addEventListener('change', function() {
         billingAddressForm.style.display = this.checked ? 'none' : 'block';
     });
 
     // Card number formatting
     const cardNumberInput = document.getElementById('cardNumber');
     cardNumberInput.addEventListener('input', function(e) {
         let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
         let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
         e.target.value = formattedValue;
     });
 
     // Expiry date formatting
     const expiryDateInput = document.getElementById('expiryDate');
     expiryDateInput.addEventListener('input', function(e) {
         let value = e.target.value.replace(/\D/g, '');
         if (value.length >= 2) {
             value = value.substring(0, 2) + '/' + value.substring(2, 4);
         }
         e.target.value = value;
     });
 
     // CVV input restriction
     const cvvInput = document.getElementById('cvv');
     cvvInput.addEventListener('input', function(e) {
         e.target.value = e.target.value.replace(/\D/g, '');
     });
 
     // Form validation on input
     const formInputs = document.querySelectorAll('input[required], select[required]');
     formInputs.forEach(input => {
         input.addEventListener('blur', validateField);
         input.addEventListener('input', function() {
             this.style.borderColor = '#e9ecef';
             const errorElement = this.parentNode.querySelector('.error-message');
             if (errorElement) {
                 errorElement.remove();
             }
         });
     });
 
     // Place order button
     const placeOrderBtn = document.getElementById('placeOrderBtn');
     placeOrderBtn.addEventListener('click', placeOrder);
 
     // Real-time total calculation when form changes
     const formElements = document.querySelectorAll('input, select');
     formElements.forEach(element => {
         element.addEventListener('change', calculateTotals);
     });
 }
 
 // Show appropriate payment form based on selection
 function showPaymentForm(method) {
     const forms = document.querySelectorAll('.payment-form');
     forms.forEach(form => form.classList.remove('active'));
     
     document.getElementById(`${method}PaymentForm`).classList.add('active');
 }
 
 // Calculate order totals
 function calculateTotals() {
     const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
     let subtotal = 0;

     cartItems.forEach(item => {
         // Handle price parsing - support various formats
         const priceStr = item.price || '0';
         const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
         subtotal += price * (item.quantity || 1);
     });
 
     // Shipping calculation
     let shippingCost = 4.99; // Standard shipping
     if (subtotal >= 50) {
         shippingCost = 0; // Free shipping over $50
     }
 
     // Tax calculation (8% example)
     const taxRate = 0.08;
     const taxAmount = subtotal * taxRate;
 
     const total = subtotal + shippingCost + taxAmount;
 
     // Update UI
     document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
     document.getElementById('shippingCost').textContent = shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`;
     document.getElementById('taxAmount').textContent = `$${taxAmount.toFixed(2)}`;
     document.getElementById('totalAmount').innerHTML = `<strong>$${total.toFixed(2)}</strong>`;
 
     // Update shipping cost in localStorage for order processing
     localStorage.setItem('shippingCost', shippingCost.toFixed(2));
     localStorage.setItem('taxAmount', taxAmount.toFixed(2));
     localStorage.setItem('orderTotal', total.toFixed(2));
 }
 
 // Validate individual form field
 function validateField(e) {
     const field = e.target;
     const value = field.value.trim();
     const fieldName = field.previousElementSibling.textContent;
     
     // Remove existing error message
     const existingError = field.parentNode.querySelector('.error-message');
     if (existingError) {
         existingError.remove();
     }
 
     let isValid = true;
     let errorMessage = '';
 
     // Required field validation
     if (!value) {
         isValid = false;
         errorMessage = `${fieldName} is required`;
     } else {
         // Specific validations based on field type
         switch(field.id) {
             case 'email':
                 if (!isValidEmail(value)) {
                     isValid = false;
                     errorMessage = 'Please enter a valid email address';
                 }
                 break;
             case 'phone':
                 if (!isValidPhone(value)) {
                     isValid = false;
                     errorMessage = 'Please enter a valid phone number';
                 }
                 break;
             case 'cardNumber':
                 if (!isValidCardNumber(value)) {
                     isValid = false;
                     errorMessage = 'Please enter a valid card number';
                 }
                 break;
             case 'expiryDate':
                 if (!isValidExpiryDate(value)) {
                     isValid = false;
                     errorMessage = 'Please enter a valid expiry date (MM/YY)';
                 }
                 break;
             case 'cvv':
                 if (!isValidCVV(value)) {
                     isValid = false;
                     errorMessage = 'Please enter a valid CVV';
                 }
                 break;
             case 'zipCode':
                 if (!isValidZipCode(value)) {
                     isValid = false;
                     errorMessage = 'Please enter a valid ZIP code';
                 }
                 break;
         }
     }
 
     // Display error or clear styling
     if (!isValid) {
         field.style.borderColor = '#dc3545';
         const errorElement = document.createElement('div');
         errorElement.className = 'error-message';
         errorElement.style.color = '#dc3545';
         errorElement.style.fontSize = '12px';
         errorElement.style.marginTop = '5px';
         errorElement.textContent = errorMessage;
         field.parentNode.appendChild(errorElement);
     } else {
         field.style.borderColor = '#28a745';
     }
 
     return isValid;
 }
 
 // Validation functions
 function isValidEmail(email) {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
 }
 
 function isValidPhone(phone) {
     const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
     return phoneRegex.test(phone.replace(/\D/g, ''));
 }
 
 function isValidCardNumber(cardNumber) {
     const cleaned = cardNumber.replace(/\s/g, '');
     return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
 }
 
 function isValidExpiryDate(expiryDate) {
     const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
     if (!regex.test(expiryDate)) return false;
 
     const [month, year] = expiryDate.split('/');
     const now = new Date();
     const currentYear = now.getFullYear() % 100;
     const currentMonth = now.getMonth() + 1;
 
     if (parseInt(year) < currentYear) return false;
     if (parseInt(year) === currentYear && parseInt(month) < currentMonth) return false;
 
     return true;
 }
 
 function isValidCVV(cvv) {
     return /^\d{3,4}$/.test(cvv);
 }
 
 function isValidZipCode(zipCode) {
     return /^\d{5}(-\d{4})?$/.test(zipCode) || /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(zipCode.toUpperCase());
 }
 
 // Validate entire form
 function validateForm() {
     const requiredFields = document.querySelectorAll('input[required], select[required]');
     let isValid = true;
 
     requiredFields.forEach(field => {
         // Create a blur event to trigger validation
         const event = new Event('blur');
         field.dispatchEvent(event);
         
         // Check if field has error
         if (field.parentNode.querySelector('.error-message')) {
             isValid = false;
         }
     });
 
     // Additional validation for payment method
     const selectedPaymentMethod = document.querySelector('.payment-option.active').dataset.method;
     if (selectedPaymentMethod === 'card') {
         const cardFields = ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'];
         cardFields.forEach(fieldId => {
             const field = document.getElementById(fieldId);
             if (!field.value.trim()) {
                 isValid = false;
                 field.style.borderColor = '#dc3545';
             }
         });
     }
 
     return isValid;
 }
 
 // Place order function
 async function placeOrder() {
     const placeOrderBtn = document.getElementById('placeOrderBtn');
     
     // Validate form
     if (!validateForm()) {
         showNotification('Please fix the errors in the form before proceeding.', 'error');
         return;
     }
 
     // Check if cart is empty
     const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
     if (cartItems.length === 0) {
         showNotification('Your cart is empty. Please add items before placing an order.', 'error');
         return;
     }
 
     // Disable button and show loading state
     placeOrderBtn.disabled = true;
     placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';
 
     try {
         // Collect order data
         const orderData = collectOrderData();
         
         // Simulate API call to process payment
         const paymentResult = await processPayment(orderData);
         
         if (paymentResult.success) {
             // Save order to localStorage (in real app, send to backend)
             saveOrder(orderData, paymentResult);
             
             // Clear cart using cart manager if available
             if (window.checkoutCartManager) {
                 window.checkoutCartManager.cart = [];
                 window.checkoutCartManager.saveCart();
                 window.checkoutCartManager.updateCartCount();
             } else {
                 // Fallback to direct localStorage
                 localStorage.removeItem('cart');
             }
             
             // Show success message
             showNotification('Order placed successfully! Redirecting...', 'success');
             
             // Redirect to success page
             setTimeout(() => {
                 window.location.href = 'payment-success.html';
             }, 1500);
             
         } else {
             throw new Error(paymentResult.message || 'Payment failed');
         }
         
     } catch (error) {
         console.error('Order processing error:', error);
         showNotification(error.message || 'There was an error processing your order. Please try again.', 'error');
         
         // Re-enable button
         placeOrderBtn.disabled = false;
         placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order';
     }
 }
 
 // Collect all order data from form
 function collectOrderData() {
     const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
     const selectedPaymentMethod = document.querySelector('.payment-option.active').dataset.method;
     
     const orderData = {
         orderId: generateOrderId(),
         timestamp: new Date().toISOString(),
         items: cartItems,
         shipping: {
             firstName: document.getElementById('firstName').value,
             lastName: document.getElementById('lastName').value,
             email: document.getElementById('email').value,
             phone: document.getElementById('phone').value,
             address: document.getElementById('address').value,
             city: document.getElementById('city').value,
             state: document.getElementById('state').value,
             zipCode: document.getElementById('zipCode').value,
             country: document.getElementById('country').value
         },
         billing: document.getElementById('sameAsShipping').checked ? 
             'same_as_shipping' : {
                 address: document.getElementById('billingAddress').value
             },
         payment: {
             method: selectedPaymentMethod,
             // In real application, never store sensitive card data like this
             // This is just for demonstration
             ...(selectedPaymentMethod === 'card' ? {
                 cardLast4: document.getElementById('cardNumber').value.slice(-4)
             } : {})
         },
         totals: {
             subtotal: document.getElementById('subtotal').textContent.replace('$', ''),
             shipping: document.getElementById('shippingCost').textContent === 'FREE' ? '0.00' : 
                      document.getElementById('shippingCost').textContent.replace('$', ''),
             tax: document.getElementById('taxAmount').textContent.replace('$', ''),
             total: document.getElementById('totalAmount').querySelector('strong').textContent.replace('$', '')
         }
     };
 
     return orderData;
 }
 
 // Generate unique order ID
 function generateOrderId() {
     const timestamp = Date.now().toString(36);
     const random = Math.random().toString(36).substr(2, 5);
     return `ORD-${timestamp}-${random}`.toUpperCase();
 }
 
 // Simulate payment processing
 function processPayment(orderData) {
     return new Promise((resolve, reject) => {
         // Simulate API call delay
         setTimeout(() => {
             // Simulate random payment failures (10% chance)
             if (Math.random() < 0.1) {
                 reject(new Error('Payment declined by bank. Please try a different payment method.'));
                 return;
             }
 
             // Simulate successful payment
             resolve({
                 success: true,
                 transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                 message: 'Payment processed successfully'
             });
         }, 2000);
     });
 }
 
 // Save order to localStorage (in real app, send to backend)
 function saveOrder(orderData, paymentResult) {
     const orders = JSON.parse(localStorage.getItem('orders')) || [];
     
     const completeOrder = {
         ...orderData,
         payment: {
             ...orderData.payment,
             transactionId: paymentResult.transactionId,
             status: 'completed'
         },
         status: 'confirmed',
         trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 10).toUpperCase(),
         estimatedDelivery: getEstimatedDeliveryDate()
     };
     
     orders.push(completeOrder);
     localStorage.setItem('orders', JSON.stringify(orders));
     
     // Also save current order for success page
     localStorage.setItem('currentOrder', JSON.stringify(completeOrder));
 }
 
 // Calculate estimated delivery date
 function getEstimatedDeliveryDate() {
     const deliveryDate = new Date();
     deliveryDate.setDate(deliveryDate.getDate() + 3); // 3 days from now
     return deliveryDate.toISOString().split('T')[0];
 }
 
 // Show notification message
 function showNotification(message, type = 'info') {
     // Remove existing notification
     const existingNotification = document.querySelector('.checkout-notification');
     if (existingNotification) {
         existingNotification.remove();
     }
 
     const notification = document.createElement('div');
     notification.className = `checkout-notification checkout-notification-${type}`;
     notification.innerHTML = `
         <div style="display: flex; align-items: center; gap: 10px;">
             <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i>
             <span>${message}</span>
         </div>
         <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer;">
             <i class="fas fa-times"></i>
         </button>
     `;
 
     // Add styles
     notification.style.cssText = `
         position: fixed;
         top: 20px;
         right: 20px;
         background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
         color: white;
         padding: 15px 20px;
         border-radius: 8px;
         box-shadow: 0 4px 15px rgba(0,0,0,0.2);
         z-index: 1000;
         display: flex;
         align-items: center;
         justify-content: space-between;
         gap: 15px;
         max-width: 400px;
         animation: slideInRight 0.3s ease;
     `;
 
     document.body.appendChild(notification);
 
     // Auto remove after 5 seconds
     setTimeout(() => {
         if (notification.parentElement) {
             notification.remove();
         }
     }, 5000);
 }
 
 // Add CSS for animations
 const style = document.createElement('style');
 style.textContent = `
     @keyframes slideInRight {
         from {
             transform: translateX(100%);
             opacity: 0;
         }
         to {
             transform: translateX(0);
             opacity: 1;
         }
     }
     
     .checkout-item {
         display: flex;
         gap: 15px;
         padding: 15px 0;
         border-bottom: 1px solid #f0f0f0;
     }
     
     .checkout-item:last-child {
         border-bottom: none;
     }
     
     .checkout-item-image {
         width: 60px;
         height: 60px;
         border-radius: 8px;
         object-fit: cover;
     }
     
     .checkout-item-details {
         flex: 1;
     }
     
     .checkout-item-name {
         font-weight: 500;
         margin-bottom: 5px;
     }
     
     .checkout-item-price {
         color: #667eea;
         font-weight: 600;
     }
     
     .checkout-item-quantity {
         color: #666;
         font-size: 14px;
     }
 `;
 document.head.appendChild(style);
 
 // Export functions for global access (if needed)
 window.validateForm = validateForm;
 window.placeOrder = placeOrder;
 window.showNotification = showNotification;