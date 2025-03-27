document.addEventListener('DOMContentLoaded', () => {

    // --- Stripe Initialization (TEST MODE) ---
    // Use your actual **TEST** publishable key from Stripe dashboard
    const stripePublishableKey = 'pk_test_51QyioDBcEjlS3Zgvs8S3q4eZqz52CLFp9EvVmS5GtGnDMwnm2tY9e79VtkpNfSe4PAdYmPfqy1Ybhp0hn5Di4HQZ00eYBvTMs3'; // Provided TEST key - verify it's correct
    let stripe;
    try {
        // Check if Stripe object exists before initializing
        if (typeof Stripe === 'function') {
             stripe = Stripe(stripePublishableKey);
             console.log("Stripe.js initialized with test key.");
        } else {
            console.error("Stripe.js not loaded! Cannot initialize Stripe. Check script tag.");
        }
    } catch(e) {
        console.error("Error initializing Stripe:", e);
        // Optionally disable checkout features if Stripe fails to load
        const checkoutBtn = document.getElementById('checkout-btn');
        if(checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Payment Unavailable';
            checkoutBtn.title = 'Payment system failed to load.';
        }
    }

    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.getElementById('main-navigation'); // Use ID for reliability
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click from closing menu immediately
            const isExpanded = mainNav.classList.toggle('active'); // Toggle class
            menuToggle.classList.toggle('active'); // For toggle button animation
            menuToggle.setAttribute('aria-expanded', isExpanded); // Update ARIA state
        });

        // Close menu if clicking outside of it
        document.addEventListener('click', (event) => {
            if (mainNav.classList.contains('active') && !mainNav.contains(event.target) && !menuToggle.contains(event.target)) {
                mainNav.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false'); // Reset ARIA state
            }
        });
    } else {
        console.warn("Mobile menu toggle button or main navigation element not found.");
    }

    // --- Sticky Header Shadow ---
     const header = document.querySelector('.sticky-header');
    if (header) {
        const scrollHandler = () => {
            // Add shadow when scrolled down, remove when at top
            header.classList.toggle('scrolled', window.scrollY > 10);
        };
        window.addEventListener('scroll', scrollHandler, { passive: true }); // Use passive listener for performance
        scrollHandler(); // Initial check in case page loads scrolled
    } else {
        console.warn("Sticky header element not found.");
    }

    // --- Cart Elements ---
    const cartIcon = document.querySelector('.cart-icon');
    const cartDropdown = document.querySelector('.cart-dropdown');
    const cartCountSpan = document.querySelector('.cart-count');
    const cartItemsContainer = cartDropdown?.querySelector('.cart-items'); // Optional chaining
    const cartTotalSpan = cartDropdown?.querySelector('.cart-total');
    const clearCartButton = cartDropdown?.querySelector('.clear-cart-btn');
    const viewCartBtnDropdown = cartDropdown?.querySelector('.view-cart-btn');
    const dropdownEmptyMsg = '<p class="cart-empty-msg">Your cart is empty.</p>';

    // Cart Page Elements
    const cartPageTableBody = document.getElementById('cart-items-body');
    const cartPageSubtotalSpan = document.getElementById('cart-subtotal');
    const cartPageGrandTotalSpan = document.getElementById('cart-grand-total');
    const cartPageCheckoutBtn = document.getElementById('checkout-btn');
    const cartPageContentsDiv = document.getElementById('cart-contents'); // Wrapper for table + summary
    const emptyCartMessageDiv = document.getElementById('empty-cart-message'); // Empty cart message container

    // --- Cart Data ---
    const CART_STORAGE_KEY = 'cognivaraCart'; // Consistent key
    let cart = [];
    try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        cart = storedCart ? JSON.parse(storedCart) : [];
        if (!Array.isArray(cart)) { // Basic validation
            console.warn('Stored cart was not an array, resetting.');
            cart = [];
        }
    } catch (e) {
        console.error("Error parsing cart from localStorage:", e);
        cart = []; // Reset cart on error
    }

    // --- Utility Functions ---
    const saveCart = () => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (e) {
            console.error("Error saving cart to localStorage:", e);
            alert("Could not save cart data. Please ensure storage is enabled.");
        }
        // Update UI elements whenever cart is saved
        renderCartDropdown();
        renderCartPage(); // Ensure both dropdown and page are updated
    };

    const formatCurrency = (amount) => {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            console.warn("formatCurrency received non-numeric value:", amount);
            return "$NaN"; // Return clear indicator of error
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
    };

    // --- Cart Rendering ---
    const renderCartDropdown = () => {
        // Check if all required dropdown elements exist
        if (!cartItemsContainer || !cartTotalSpan || !cartCountSpan || !viewCartBtnDropdown || !clearCartButton) {
            // Don't log error constantly, just return if dropdown isn't present on the page
            return;
        }

        cartItemsContainer.innerHTML = ''; // Clear previous items
        let dropdownTotal = 0;
        let totalQuantity = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = dropdownEmptyMsg;
            cartTotalSpan.textContent = formatCurrency(0);
            viewCartBtnDropdown.classList.add('disabled'); // Add disabled class for styling
            viewCartBtnDropdown.setAttribute('aria-disabled', 'true'); // ARIA state
            clearCartButton.disabled = true;
        } else {
            cart.forEach(item => {
                // Ensure price and quantity are numbers for calculation
                const itemPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 0;
                const itemTotal = itemPrice * itemQuantity;

                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                // Simple structure for dropdown item
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <span class="cart-item-name">${item.name} (x${itemQuantity})</span>
                        <span class="cart-item-price">${formatCurrency(itemTotal)}</span>
                    </div>`;
                cartItemsContainer.appendChild(itemElement);

                dropdownTotal += itemTotal;
                totalQuantity += itemQuantity;
            });

            cartTotalSpan.textContent = formatCurrency(dropdownTotal);
            viewCartBtnDropdown.classList.remove('disabled');
            viewCartBtnDropdown.removeAttribute('aria-disabled');
            clearCartButton.disabled = false;
        }

        // Update cart count bubble
        cartCountSpan.textContent = totalQuantity;
        // Show/hide count bubble based on quantity
        cartCountSpan.style.display = totalQuantity > 0 ? 'flex' : 'none';
    };

    const renderCartPage = () => {
        // Only run if we are on the cart page (check for specific elements)
        if (!cartPageTableBody || !cartPageSubtotalSpan || !cartPageGrandTotalSpan || !cartPageCheckoutBtn || !cartPageContentsDiv || !emptyCartMessageDiv) {
            // console.log("Not on cart page or elements missing.");
            return; // Exit if not on cart page
        }

        cartPageTableBody.innerHTML = ''; // Clear previous rows
        let pageSubtotal = 0;

        if (cart.length === 0) {
            cartPageContentsDiv.style.display = 'none'; // Hide table and summary box
            emptyCartMessageDiv.style.display = 'block'; // Show empty cart message
            cartPageCheckoutBtn.disabled = true; // Disable checkout button
            cartPageSubtotalSpan.textContent = formatCurrency(0);
            cartPageGrandTotalSpan.textContent = formatCurrency(0);
        } else {
            cartPageContentsDiv.style.display = 'grid'; // Show table and summary box (use 'grid' or 'block' as per your CSS)
            emptyCartMessageDiv.style.display = 'none'; // Hide empty cart message

            cart.forEach(item => {
                const numericPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 0;
                const lineTotal = numericPrice * itemQuantity;
                pageSubtotal += lineTotal;

                const row = document.createElement('tr');
                row.classList.add('cart-item-row');
                row.dataset.productId = item.id; // Add product ID to row for easier targeting if needed

                row.innerHTML = `
                    <td data-label="Product" colspan="2">
                        <div class="cart-item-info">
                             <!-- Add image here if desired: <img src="path/to/${item.id}.jpg" alt="${item.name}" width="50"> -->
                            <span class="cart-item-name">${item.name}</span>
                        </div>
                    </td>
                    <td data-label="Price" class="cart-item-price">${formatCurrency(numericPrice)}</td>
                    <td data-label="Quantity">
                        <div class="quantity-control">
                            <input type="number" class="quantity-input" value="${itemQuantity}" min="1" max="99" data-product-id="${item.id}" aria-label="Quantity for ${item.name}">
                        </div>
                    </td>
                    <td data-label="Total" class="line-item-total">${formatCurrency(lineTotal)}</td>
                    <td data-label="Remove">
                        <button type="button" class="remove-item-btn" data-product-id="${item.id}" aria-label="Remove ${item.name} from cart">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </td>
                `;
                cartPageTableBody.appendChild(row);
            });

            cartPageSubtotalSpan.textContent = formatCurrency(pageSubtotal);
            // Assuming grand total is same as subtotal for now (no tax/shipping)
            cartPageGrandTotalSpan.textContent = formatCurrency(pageSubtotal);
            cartPageCheckoutBtn.disabled = false; // Enable checkout button
        }
    };

    // --- Cart Actions ---
    const addToCart = (id, name, price) => {
        if (!id || !name || price === undefined) {
            console.error(`Attempted to add item with invalid data: id=${id}, name=${name}, price=${price}`);
            alert("Error: Could not add item due to missing information.");
            return;
        }

        const existingItemIndex = cart.findIndex(item => item.id === id);
        const numericPrice = parseFloat(price);

        if (isNaN(numericPrice) || numericPrice < 0) {
            console.error(`Invalid price for product ${name} (ID: ${id}): "${price}".`);
            alert(`Error: Invalid price for ${name}. Item not added.`);
            return;
        }

        if (existingItemIndex > -1) {
            // Item exists, increment quantity
            cart[existingItemIndex].quantity += 1;
        } else {
            // New item, add to cart
            cart.push({ id, name, price: numericPrice, quantity: 1 });
        }
        saveCart(); // Save and update UI
        // Optionally provide feedback to the user (e.g., flash message, update button text)
        console.log(`${name} added to cart.`);
    };

    const clearCart = () => {
        if (confirm("Are you sure you want to remove all items from your cart?")) {
            cart = []; // Empty the cart array
            saveCart(); // Save the empty cart and update UI
            if (cartDropdown) {
                cartDropdown.classList.remove('active'); // Close dropdown if open
            }
            console.log("Cart cleared.");
        }
    };

    const updateQuantity = (id, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);

        // Validate quantity (must be at least 1, max 99)
        if (isNaN(quantity) || quantity < 1) {
            console.warn(`Invalid quantity ${newQuantity} for item ${id}. Setting to 1.`);
            // Optionally alert user or just enforce minimum
            quantity = 1;
             // Find the input field and reset its value visually
             const inputField = cartPageTableBody?.querySelector(`.quantity-input[data-product-id="${id}"]`);
             if (inputField) inputField.value = quantity;
        } else if (quantity > 99) {
             console.warn(`Quantity ${newQuantity} exceeds max (99) for item ${id}. Setting to 99.`);
             quantity = 99;
             const inputField = cartPageTableBody?.querySelector(`.quantity-input[data-product-id="${id}"]`);
             if (inputField) inputField.value = quantity;
        }


        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            cart[itemIndex].quantity = quantity;
            saveCart(); // Save changes and update UI
        } else {
            console.error(`Item with ID ${id} not found in cart for quantity update.`);
        }
    };

    const removeItem = (id) => {
        const initialLength = cart.length;
        const itemName = cart.find(item => item.id === id)?.name || 'Item'; // Get name for confirmation
        if (confirm(`Remove ${itemName} (ID: ${id}) from cart?`)) {
            cart = cart.filter(item => item.id !== id); // Filter out the item
            if (cart.length < initialLength) {
                saveCart(); // Save changes and update UI only if an item was actually removed
                console.log(`Item ${id} removed from cart.`);
            } else {
                console.error(`Item ${id} not found for removal, or removal failed.`);
            }
        }
    };

    // --- Stripe Checkout Handler (Using Price IDs & Email) ---
    const handleCheckout = async () => {
        console.log("Attempting checkout...");

        // 1. Check if Stripe is loaded
        if (!stripe) {
            alert("Payment processing is currently unavailable. Please try again later or contact support.");
            console.error("Stripe object not available during checkout attempt.");
            return;
        }

        // 2. Check if cart is empty
        if (cart.length === 0) {
            alert("Your cart is empty. Please add products before checking out.");
            return;
        }

        // 3. Validate Email (Optional)
        const emailInput = document.getElementById('customer-email');
        let customerEmail = '';
        if (emailInput) {
            customerEmail = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
            // Only validate if the field is not empty
            if (customerEmail && !emailRegex.test(customerEmail)) {
                 alert("Please enter a valid email address for order confirmation, or leave it blank.");
                 emailInput.focus();
                 return; // Stop checkout if email is present but invalid
            }
            console.log("Customer email:", customerEmail || 'Not provided');
        } else {
            console.warn("Customer email input field not found.");
        }


        // 4. Disable button and show processing state
        if(cartPageCheckoutBtn) {
            cartPageCheckoutBtn.disabled = true;
            cartPageCheckoutBtn.textContent = 'Processing...';
        }

        console.log("Current cart for checkout:", JSON.stringify(cart));

        try {
            // --- !!! IMPORTANT: REPLACE PLACEHOLDERS BELOW !!! ---
            // Map your internal product IDs (used in data-product-id) to your Stripe Price IDs.
            // Find Price IDs in your Stripe Dashboard: Products -> Select Product -> Pricing section -> Copy API ID (e.g., price_123...)
            const priceIdMap = {
                // 'your_internal_product_id': 'stripe_price_id_test_or_live',
                'neuro01':   'price_1QyjN8BcEjlS3ZgvXjY0nNqK',   // <-- REPLACE with your actual Stripe Price ID
                'mito01':    'price_1QyjNYBcEjlS3Zgv4Kj4L2bK',    // <-- REPLACE with your actual Stripe Price ID
                'restore01': 'price_1QyjNoBcEjlS3ZgvP802JgYt', // <-- REPLACE with your actual Stripe Price ID
                'sleep01':   'price_1QyjODBcEjlS3ZgvR0HkOq0j',   // <-- REPLACE with your actual Stripe Price ID
                'immune01':  'price_1QyjOlBcEjlS3ZgvxT1W3f3n',  // <-- REPLACE with your actual Stripe Price ID
                'gut01':     'price_1QyjPKBcEjlS3ZgvvxR0oP4D'      // <-- REPLACE with your actual Stripe Price ID
                 // Add mappings for ALL products that can be purchased
            };
            // --- End of Price ID Map ---

            let lineItems = [];
            let processingError = false;

            cart.forEach((item, index) => {
                const priceId = priceIdMap[item.id];
                if (!priceId) { // Check if mapping exists
                    console.error(`Item ${index} (${item.name}, ID: ${item.id}) is missing a mapping in priceIdMap. Skipping.`);
                    processingError = true;
                    return; // Skip this item
                }
                 // Optional: Check if it looks like a placeholder (useful during development)
                // if (priceId.includes('YOUR_') || priceId === 'stripe_price_id_test_or_live') {
                //     console.error(`Item ${index} (${item.name}, ID: ${item.id}) still uses a placeholder Price ID: '${priceId}'. Update script.js! Skipping.`);
                //     processingError = true;
                //     return; // Skip this item
                // }

                // Ensure quantity is a positive integer
                const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

                lineItems.push({ price: priceId, quantity: quantity });
            });

            // If any item failed mapping or cart became empty after filtering, stop checkout
            if (processingError || lineItems.length === 0) {
                alert("Error processing cart items. Some products might be misconfigured. Please review your cart or contact support.");
                 // Re-enable button
                if(cartPageCheckoutBtn) {
                    cartPageCheckoutBtn.disabled = false;
                    cartPageCheckoutBtn.textContent = 'Proceed to Checkout';
                }
                return;
            }

            console.log("Formatted line items for Stripe:", JSON.stringify(lineItems));

            // 5. Define Success and Cancel URLs
            // Ensure these pages (success.html, cancel.html) exist at the root level
            const success_url = `${window.location.origin}/success.html`;
            const cancel_url = `${window.location.origin}/cancel.html`;
            console.log(`Redirect URLs: success=${success_url}, cancel=${cancel_url}`);

            // 6. Call Stripe redirectToCheckout
            const checkoutOptions = {
                 lineItems: lineItems,
                 mode: 'payment', // Or 'subscription' if applicable
                 successUrl: success_url,
                 cancelUrl: cancel_url,
                 // Pass email only if it's provided and valid (or just pass it, Stripe handles empty string okay)
                 customerEmail: customerEmail || undefined,
                 // billingAddressCollection: 'auto', // Optional: collect billing address
                 // shippingAddressCollection: { // Optional: collect shipping address
                 //    allowedCountries: ['US', 'CA'], // Specify allowed countries
                 // },
             };

            console.log("Calling Stripe redirectToCheckout with options:", checkoutOptions);
            const { error } = await stripe.redirectToCheckout(checkoutOptions);

            // 7. Handle Redirect Error (if redirect itself fails)
            if (error) {
                console.error('Stripe redirectToCheckout error:', error);
                alert(`Checkout Error: ${error.message}`);
                 // Re-enable button on failure
                if(cartPageCheckoutBtn) {
                    cartPageCheckoutBtn.disabled = false;
                    cartPageCheckoutBtn.textContent = 'Proceed to Checkout';
                }
            }
            // If successful, the user is redirected to Stripe, and the script execution might pause/stop here.

        } catch (err) {
            // Catch any unexpected errors during preparation
            console.error('Unexpected error during checkout preparation:', err);
            alert(`An unexpected error occurred: ${err.message || err}. Please try again.`);
             // Re-enable button
             if(cartPageCheckoutBtn) {
                cartPageCheckoutBtn.disabled = false;
                cartPageCheckoutBtn.textContent = 'Proceed to Checkout';
             }
        }
        // Note: The button might remain disabled if the redirect starts successfully.
        // Handling this perfectly often requires server-side logic or listening for page unload events, which can be complex.
    }; // End handleCheckout

    // --- Event Listeners ---

    // Cart Icon Click -> Toggle Dropdown
    if (cartIcon && cartDropdown) {
        cartIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent click propagating to document listener
            cartDropdown.classList.toggle('active');
        });
        // Close dropdown if clicking outside
        document.addEventListener('click', (event) => {
            if (cartDropdown.classList.contains('active') && !cartDropdown.contains(event.target) && !cartIcon.contains(event.target)) {
                cartDropdown.classList.remove('active');
            }
        });
    }

    // Add to Cart Buttons (delegated listener could be more efficient if many buttons)
    const allAddToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    allAddToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.productId;
            const name = button.dataset.productName;
            const price = button.dataset.productPrice;

            // Basic validation before adding
            if (!id || !name || price === undefined || price === "") {
                console.error(`Add to Cart button missing data! ID: ${id}, Name: ${name}, Price: ${price}`);
                alert("Error: Could not add item. Product data missing.");
                return;
            }

            addToCart(id, name, price);

            // Visual feedback
            const originalText = button.textContent;
            button.textContent = 'Added!';
            button.classList.add('added'); // You might need CSS for .added state
            button.disabled = true; // Prevent multi-clicks

            // Reset button state after a short delay
            setTimeout(() => {
                // Check if button still exists in the DOM
                if (document.body.contains(button)) {
                    button.textContent = originalText; // Restore original text
                    button.classList.remove('added');
                    button.disabled = false; // Re-enable
                }
            }, 1500); // Reset after 1.5 seconds
        });
    });

    // Clear Cart Button (in dropdown)
    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    // Cart Page Interactions (Quantity update, Remove item)
    if (cartPageTableBody) {
        // Use event delegation for dynamic elements
        cartPageTableBody.addEventListener('change', (event) => {
            // Handle quantity changes
            if (event.target.classList.contains('quantity-input')) {
                updateQuantity(event.target.dataset.productId, event.target.value);
            }
        });

        cartPageTableBody.addEventListener('click', (event) => {
            // Handle remove button clicks
            const removeButton = event.target.closest('.remove-item-btn'); // Use closest to handle clicks on SVG too
            if (removeButton) {
                removeItem(removeButton.dataset.productId);
            }
        });
    }

    // Checkout Button Click (on Cart Page)
    if (cartPageCheckoutBtn) {
        cartPageCheckoutBtn.addEventListener('click', handleCheckout);
    }

    // --- Initial Render on Page Load ---
    renderCartDropdown();
    renderCartPage(); // Call this to set up cart page state

    // --- Intersection Observer for Animations (Optional Enhancement) ---
    const observedElements = document.querySelectorAll('.product-card, .welcome-section, .about-snippet, .trust-item'); // Add more selectors as needed
    if ("IntersectionObserver" in window && observedElements.length > 0) {
        const observerOptions = {
            root: null, // relative to document viewport
            rootMargin: '0px',
            threshold: 0.1 // trigger when 10% of the element is visible
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Add a class to trigger animation (defined in CSS)
                    entry.target.classList.add('fade-in-up'); // Example class
                    observer.unobserve(entry.target); // Stop observing once animated
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        observedElements.forEach(el => {
             el.style.opacity = '0'; // Start elements as invisible if using fade-in
             observer.observe(el);
        });
    } else if (observedElements.length > 0) {
        // Fallback for browsers without IntersectionObserver: just make them visible
        observedElements.forEach(el => { el.style.opacity = '1'; });
    }
     // CSS needed for .fade-in-up:
     // .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
     // @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }


}); // End DOMContentLoaded