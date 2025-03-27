document.addEventListener('DOMContentLoaded', () => {

    // --- Stripe Initialization (TEST MODE) ---
    const stripePublishableKey = 'pk_test_51QyioDBcEjlS3Zgvs8S3q4eZqz52CLFp9EvVmS5GtGnDMwnm2tY9e79VtkpNfSe4PAdYmPfqy1Ybhp0hn5Di4HQZ00eYBvTMs3'; // YOUR PROVIDED TEST KEY
    let stripe;
    try {
        if (typeof Stripe === 'function') {
             stripe = Stripe(stripePublishableKey);
             console.log("Stripe.js initialized with test key.");
        } else {
            console.error("Stripe.js not loaded! Cannot initialize Stripe.");
        }
    } catch(e) {
        console.error("Error initializing Stripe:", e);
    }


    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', (event) => { event.stopPropagation(); mainNav.classList.toggle('active'); menuToggle.classList.toggle('active'); });
        document.addEventListener('click', (event) => { if (mainNav.classList.contains('active') && !mainNav.contains(event.target) && !menuToggle.contains(event.target)) { mainNav.classList.remove('active'); menuToggle.classList.remove('active'); } });
    } else { console.warn("Mobile menu elements not found."); }

    // --- Sticky Header Shadow ---
     const header = document.querySelector('.sticky-header');
    if (header) {
        const scrollHandler = () => { header.classList.toggle('scrolled', window.scrollY > 10); };
        window.addEventListener('scroll', scrollHandler); scrollHandler();
    } else { console.warn("Sticky header element not found."); }

    // --- Cart Elements ---
    const cartIcon = document.querySelector('.cart-icon');
    const cartDropdown = document.querySelector('.cart-dropdown');
    const cartCountSpan = document.querySelector('.cart-count');
    const cartItemsContainer = cartDropdown?.querySelector('.cart-items');
    const cartTotalSpan = cartDropdown?.querySelector('.cart-total');
    const clearCartButton = cartDropdown?.querySelector('.clear-cart-btn');
    const viewCartBtnDropdown = cartDropdown?.querySelector('.view-cart-btn');
    const dropdownEmptyMsg = '<p class="cart-empty-msg">Your cart is empty.</p>';
    const cartPageTableBody = document.getElementById('cart-items-body');
    const cartPageSubtotalSpan = document.getElementById('cart-subtotal');
    const cartPageGrandTotalSpan = document.getElementById('cart-grand-total');
    const cartPageCheckoutBtn = document.getElementById('checkout-btn'); // Checkout button for cart page
    const cartPageContentsDiv = document.getElementById('cart-contents');
    const emptyCartMessageDiv = document.getElementById('empty-cart-message');


    // --- Cart Data ---
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('veridianCart')) || [];
    } catch (e) {
        console.error("Error parsing cart from localStorage:", e); cart = [];
    }

    // --- Utility Functions ---
    const saveCart = () => {
        try { localStorage.setItem('veridianCart', JSON.stringify(cart)); }
        catch (e) { console.error("Error saving cart to localStorage:", e); }
        renderCartDropdown(); // Always update dropdown
        renderCartPage(); // Update cart page if present
    };

    const formatCurrency = (amount) => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) { console.warn("formatCurrency received non-numeric value:", amount); return "$NaN"; }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
    };

    // --- Cart Rendering ---
    const renderCartDropdown = () => {
        if (!cartItemsContainer || !cartTotalSpan || !cartCountSpan || !viewCartBtnDropdown || !clearCartButton) return;
        cartItemsContainer.innerHTML = ''; let dropdownTotal = 0; let totalQuantity = 0;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = dropdownEmptyMsg; cartTotalSpan.textContent = formatCurrency(0);
            viewCartBtnDropdown.classList.add('disabled'); viewCartBtnDropdown.style.pointerEvents = 'none';
            clearCartButton.disabled = true;
        } else {
            cart.forEach(item => {
                const itemTotal = (Number(item.price) || 0) * item.quantity;
                const itemElement = document.createElement('div'); itemElement.classList.add('cart-item');
                itemElement.innerHTML = `<div class="cart-item-details"><span class="cart-item-name">${item.name} (x${item.quantity})</span><span class="cart-item-price">${formatCurrency(itemTotal)}</span></div>`;
                cartItemsContainer.appendChild(itemElement); dropdownTotal += itemTotal; totalQuantity += item.quantity;
            });
            cartTotalSpan.textContent = formatCurrency(dropdownTotal);
            viewCartBtnDropdown.classList.remove('disabled'); viewCartBtnDropdown.style.pointerEvents = 'auto';
            clearCartButton.disabled = false;
        }
        cartCountSpan.textContent = totalQuantity; cartCountSpan.style.display = totalQuantity > 0 ? 'flex' : 'none';
    };

    const renderCartPage = () => {
        if (!cartPageTableBody) return; // Only run if on cart page
        if (!cartPageSubtotalSpan || !cartPageGrandTotalSpan || !cartPageCheckoutBtn || !cartPageContentsDiv || !emptyCartMessageDiv) { console.error("Missing required elements on cart page!"); return; }
        cartPageTableBody.innerHTML = ''; let pageSubtotal = 0;
        if (cart.length === 0) {
            cartPageContentsDiv.style.display = 'none'; emptyCartMessageDiv.style.display = 'block';
            cartPageCheckoutBtn.disabled = true; cartPageSubtotalSpan.textContent = formatCurrency(0); cartPageGrandTotalSpan.textContent = formatCurrency(0);
        } else {
            // Ensure contents div is displayed correctly (block or grid based on CSS)
            cartPageContentsDiv.style.display = 'block'; // Or 'grid' if cart-page-wrapper is the direct child
            emptyCartMessageDiv.style.display = 'none';
            cart.forEach(item => {
                const numericPrice = Number(item.price) || 0; const lineTotal = numericPrice * item.quantity; pageSubtotal += lineTotal;
                const row = document.createElement('tr'); row.classList.add('cart-item-row');
                row.innerHTML = `
                    <td colspan="2"><div class="cart-item-info"><span class="cart-item-name">${item.name}</span></div></td>
                    <td class="cart-item-price">${formatCurrency(numericPrice)}</td>
                    <td><div class="quantity-control"><input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" data-product-id="${item.id}" aria-label="Quantity for ${item.name}"></div></td>
                    <td class="line-item-total">${formatCurrency(lineTotal)}</td>
                    <td><button class="remove-item-btn" data-product-id="${item.id}" aria-label="Remove ${item.name}"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></td>
                `;
                cartPageTableBody.appendChild(row);
            });
            cartPageSubtotalSpan.textContent = formatCurrency(pageSubtotal); cartPageGrandTotalSpan.textContent = formatCurrency(pageSubtotal); // Update Grand total too
            cartPageCheckoutBtn.disabled = false;
        }
    };

    // --- Cart Actions ---
    const addToCart = (id, name, price) => {
        const existingItemIndex = cart.findIndex(item => item.id === id); const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) { console.error(`Invalid price detected for ${name}: "${price}".`); alert(`Error: Invalid price.`); return; }
        if (existingItemIndex > -1) { cart[existingItemIndex].quantity += 1; }
        else { cart.push({ id, name, price: numericPrice, quantity: 1 }); }
        saveCart();
    };

    const clearCart = () => { cart = []; saveCart(); if (cartDropdown) cartDropdown.classList.remove('active'); };

    const updateQuantity = (id, newQuantity) => {
        newQuantity = parseInt(newQuantity, 10);
        if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1; if (newQuantity > 99) newQuantity = 99;
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex > -1) { cart[itemIndex].quantity = newQuantity; saveCart(); }
        else { console.error(`Item ${id} not found for quantity update.`); }
    };

    const removeItem = (id) => {
        const initialLength = cart.length; cart = cart.filter(item => item.id !== id);
        if (cart.length < initialLength) { saveCart(); }
        else { console.error(`Item ${id} not found for removal.`); }
    };

    // --- Stripe Checkout Handler (Refined Structure Check) ---
    const handleCheckout = async () => {
        console.log("handleCheckout called.");

        if (!stripe) {
            alert("Payment processing is currently unavailable."); console.error("Stripe object not initialized."); return;
        }
        if (cart.length === 0) {
            alert("Your cart is empty."); return;
        }

        // *** Get and Validate Email ***
        const emailInput = document.getElementById('customer-email');
        let customerEmail = '';
        if (emailInput) {
            customerEmail = emailInput.value.trim();
            // Basic email format check (not exhaustive)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(customerEmail)) {
                 alert("Please enter a valid email address.");
                 emailInput.focus(); // Focus the input for correction
                 return; // Stop checkout
            }
            console.log("Customer Email:", customerEmail);
        } else {
            console.warn("Email input field not found.");
            // Decide if email is mandatory - for now, we proceed without it if field missing
        }
        // ****************************


        if(cartPageCheckoutBtn) {
            cartPageCheckoutBtn.disabled = true;
            cartPageCheckoutBtn.textContent = 'Processing...';
        }

        console.log("Raw cart data:", JSON.stringify(cart, null, 2));

        try {
            // *** Map Cart Items to Price IDs ***
            // Replace these with the ACTUAL TEST Price IDs from your Stripe Dashboard
            const priceIdMap = {
                'neuro01': 'price_TEST_NEURO_ID',       // <-- Replace with actual ID
                'mito01': 'price_TEST_MITO_ID',        // <-- Replace with actual ID
                'restore01': 'price_TEST_RESTORE_ID',    // <-- Replace with actual ID
                'sleep01': 'price_TEST_SLEEP_ID',      // <-- Replace with actual ID
                'immune01': 'price_TEST_IMMUNE_ID',     // <-- Replace with actual ID
                'gut01': 'price_TEST_GUT_ID',        // <-- Replace with actual ID
                // Add mappings for ALL products you might add to cart
            };

            let lineItems = [];
            let processingError = false;

            cart.forEach((item, index) => {
                const priceId = priceIdMap[item.id]; // Look up Price ID
                if (!priceId) {
                    console.error(`Item ${index} (${item.name}, ID: ${item.id}) has no matching Price ID in priceIdMap. Skipping.`);
                    processingError = true;
                    return; // Skip item if no Price ID found
                }

                // Structure using Price ID
                lineItems.push({
                    price: priceId,         // *** USE PRICE ID HERE ***
                    quantity: item.quantity,
                });
            }); // End forEach

            if (processingError || lineItems.length === 0) {
                alert("Error processing cart items. Could not find necessary product information.");
                if(cartPageCheckoutBtn) { /* Re-enable button */ }
                return;
            }

            console.log("Final line items (using Price IDs):", JSON.stringify(lineItems, null, 2));
            // **********************************

            const success_url = `${window.location.origin}/success.html`;
            const cancel_url = `${window.location.origin}/cancel.html`;
            console.log(`Attempting redirect: success=${success_url}, cancel=${cancel_url}`);

            try {
                 const checkoutOptions = {
                     lineItems: lineItems,
                     mode: 'payment',
                     successUrl: success_url,
                     cancelUrl: cancel_url,
                     // *** ADD CUSTOMER EMAIL ***
                     customerEmail: customerEmail || undefined, // Pass email if available
                     // **************************
                 };
                console.log("Calling redirectToCheckout with options:", checkoutOptions);
                const { error } = await stripe.redirectToCheckout(checkoutOptions);

                if (error) {
                    console.error('Stripe redirectToCheckout error object:', error);
                    alert(`Error redirecting: ${error.message}`);
                     if(cartPageCheckoutBtn) { /* Re-enable button */ }
                }
            } catch (redirectError) {
                  console.error('EXCEPTION during stripe.redirectToCheckout await:', redirectError);
                  alert(`An exception occurred trying to redirect: ${redirectError.message || redirectError}`);
                   if(cartPageCheckoutBtn) { /* Re-enable button */ }
            }

        } catch (err) {
            console.error('EXCEPTION in handleCheckout (preparation):', err);
            alert(`An unexpected error occurred: ${err.message || err}`);
             if(cartPageCheckoutBtn) { /* Re-enable button */ }
        } finally {
             // Re-enable button in case of non-redirect error
             if (cartPageCheckoutBtn && cartPageCheckoutBtn.textContent === 'Processing...') {
                 cartPageCheckoutBtn.disabled = false;
                 cartPageCheckoutBtn.textContent = 'Proceed to Checkout';
             }
        }
    }; // End handleCheckout


    // --- Event Listeners ---
    if (cartIcon && cartDropdown) { // Header Cart Dropdown
        cartIcon.addEventListener('click', (event) => { event.stopPropagation(); cartDropdown.classList.toggle('active'); });
        document.addEventListener('click', (event) => { if (cartDropdown.classList.contains('active') && !cartDropdown.contains(event.target) && !cartIcon.contains(event.target)) { cartDropdown.classList.remove('active'); } });
    }
    const allAddToCartButtons = document.querySelectorAll('.add-to-cart-btn'); // Add to Cart Buttons
    allAddToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.productId; const name = button.dataset.productName; const price = button.dataset.productPrice;
            if (!id || !name || price === undefined || price === "") { console.error(`Button missing data!`); alert("Error: Could not add item."); return; }
            addToCart(id, name, price);
            button.textContent = 'Added!'; button.classList.add('added'); button.disabled = true;
            setTimeout(() => { if (button) { button.textContent = 'Add to Cart'; button.classList.remove('added'); button.disabled = false; } }, 1500);
        });
    });
    if (clearCartButton) { clearCartButton.addEventListener('click', clearCart); } // Clear Cart Button
    if (cartPageTableBody) { // Cart Page Listeners
        cartPageTableBody.addEventListener('change', (event) => { if (event.target.classList.contains('quantity-input')) { updateQuantity(event.target.dataset.productId, event.target.value); } });
        cartPageTableBody.addEventListener('click', (event) => { const removeButton = event.target.closest('.remove-item-btn'); if (removeButton) { removeItem(removeButton.dataset.productId); } });
    }
    // Checkout Button Listener (on Cart Page)
    if (cartPageCheckoutBtn) {
        cartPageCheckoutBtn.addEventListener('click', handleCheckout);
    }

    // --- Initial Render ---
    renderCartDropdown();
    renderCartPage(); // Renders cart page content if elements exist

    // --- Intersection Observer ---
    const productCards = document.querySelectorAll('.product-card');
    if ("IntersectionObserver" in window && productCards.length > 0) {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
        const observerCallback = (entries, observer) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.animation = `fadeInUp 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) forwards`; observer.unobserve(entry.target); } }); };
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        productCards.forEach(card => { observer.observe(card); });
    } else if (productCards.length > 0) { productCards.forEach(card => { card.style.opacity = '1'; }); }

}); // End DOMContentLoaded