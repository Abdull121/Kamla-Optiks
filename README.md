# Kamal Optiks E-Commerce Frontend

Premium, modern, Gen Z luxury eyewear ecommerce frontend built with HTML5, Tailwind CSS v4, Alpine.js, and Vite.

## Features
- **Modern Aesthetic**: Glassmorphism, soft shadows, micro-animations, and premium typography.
- **Fully Responsive**: Mobile-first design that scales beautifully to large screens.
- **Dynamic Frontend**: Powered by Alpine.js for smooth cart operations, product filtering, and interactive galleries without a complex backend framework.
- **Production Ready**: Optimized via Vite for extremely fast load times, perfect for shared hosting.

## Folder Structure
```text
kamal-optics/
├── src/
│   ├── assets/       # Images and static assets
│   ├── components/   # Reusable UI partials
│   ├── css/          # Tailwind entry and global styles (style.css)
│   ├── data/         # Mock data for products, categories, and brands
│   └── js/           # Alpine.js logic and store management (main.js)
├── index.html        # Homepage
├── shop.html         # Product Listing & Filtering
├── product.html      # Product Details & Gallery
├── checkout.html     # Cart & Checkout flow
├── dashboard.html    # User Account & Orders
├── about.html        # About Us
├── contact.html      # Contact Page
├── faq.html          # Frequently Asked Questions
├── package.json      # Dependencies and scripts
└── vite.config.js    # Build configuration
```

## Local Development
To run this project locally:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Tech Stack
- **HTML5**: Semantic and accessible markup.
- **Tailwind CSS v4**: Utility-first CSS for rapid UI development and custom design tokens.
- **Alpine.js**: Lightweight JavaScript framework for reactive components and state management (Cart, Wishlist).
- **Vite**: Next-generation frontend tooling for fast compilation and optimized production builds.
- **Lucide Icons**: Beautiful, consistent icon set.
