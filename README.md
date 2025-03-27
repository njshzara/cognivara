# cognivara
# CogniVara Website Project

This repository contains the front-end code (HTML, CSS, JavaScript) for the CogniVara e-commerce website, focusing on science-based wellness products.

## Features

*   Homepage with hero section, featured products, and informational snippets.
*   Product listing page.
*   Product detail page template.
*   Shopping cart functionality using `localStorage`.
*   Cart dropdown in the header.
*   Mobile-responsive design (Mobile First).
*   Sticky header.
*   Basic Stripe checkout integration (using Test Price IDs - **requires configuration**).
*   Success and Cancellation pages for payment status.

## File Structure

*   `index.html`: The main homepage.
*   `products.html`: Displays all available products.
*   `cart.html`: The dedicated shopping cart page.
*   `product-detail-base.html`: A template for creating individual product detail pages. **Use this to create pages like `product-detail-neuro.html`, etc.**
*   `success.html`: Page shown after successful Stripe payment.
*   `cancel.html`: Page shown after cancelled Stripe payment.
*   `style.css`: Contains all the CSS rules for styling the website.
*   `script.js`: Handles dynamic behavior, including mobile menu, sticky header, cart management, and Stripe checkout initiation.
*   `assets/`: Directory for images, videos, etc. (Contains `fitness.mp4` and `artificial-background.jpg` for the demo).
*   `README.md`: This file.

## Setup & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd cognivara
    ```
2.  **Configure Stripe:**
    *   Open `script.js`.
    *   Find the `priceIdMap` object.
    *   **Replace the placeholder values** (e.g., `'price_YOUR_NEURO_ID'`) with your actual **Stripe Test Price IDs** corresponding to each `data-product-id`. You can find these in your Stripe Dashboard under Products > Prices.
    *   Ensure your Stripe Test Publishable Key (`pk_test_...`) is correctly set at the top of `script.js` (it seems correct based on the initial code).
3.  **Create Product Detail Pages:**
    *   For each product listed in `index.html` and `products.html`, create a specific HTML file (e.g., `product-detail-neuro.html`).
    *   Use `product-detail-base.html` as the starting template for these files.
    *   Fill in the product-specific details (name, price, description, benefits, usage, image/placeholder, and update the `data-*` attributes on the 'Add to Cart' button).
    *   Update the "Learn More" links (`<a>` tags) in `index.html` and `products.html` to point to these newly created detail pages.
4.  **Run Locally:** Simply open the `index.html` file in your web browser. Since it's a front-end-only project for now (using client-side Stripe checkout), no special server is strictly required for basic browsing and cart functionality.

## Development Notes

*   **Styling:** Uses a mobile-first approach with CSS variables for theming. Media queries are used for tablet and desktop layouts.
*   **Cart:** Managed entirely client-side using `localStorage` under the key `cognivaraCart`.
*   **Stripe:** Uses Stripe.js v3 and the `redirectToCheckout` method with Price IDs. This is a client-only integration suitable for simpler scenarios. For more complex needs (inventory management, server-side validation), a backend integration would be necessary.
*   **Dependencies:** Requires `Inter` font from Google Fonts and Stripe.js.

## Future Improvements

*   Implement a proper backend for order processing, inventory management, user accounts, and secure Stripe integration (using Payment Intents).
*   Add form validation for contact forms (if any).
*   Improve accessibility further (more ARIA roles where needed).
*   Add loading states for asynchronous operations.
*   Implement actual image loading instead of placeholders.
*   Add a real FAQ section.
*   Create dedicated About Us, Privacy Policy, ToS pages.