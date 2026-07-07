# Hostinger Deployment Guide for Kamal Optiks

Because this frontend was built using HTML, Tailwind, Alpine.js, and Vite, it compiles down to pure static files (HTML, CSS, JS). This makes it incredibly easy and highly optimized to deploy on Hostinger Shared Hosting.

## Step 1: Build the Project
Before deploying, you must generate the production-ready files.
Run the following command in your terminal:
```bash
npm run build
```
This will create a `dist/` directory containing all your optimized HTML, CSS, JavaScript, and assets.

## Step 2: Access Hostinger File Manager
1. Log in to your Hostinger hPanel.
2. Navigate to **Websites** and click **Manage** next to your domain.
3. Scroll down to the **Files** section and click on **File Manager**.

## Step 3: Upload to `public_html`
1. In the File Manager, navigate to the `public_html` directory.
2. **Clear existing files**: If there is a default `default.php` or `index.html` from Hostinger, delete it.
3. Open the `dist/` folder that was created on your computer in Step 1.
4. **Upload**: Drag and drop all the *contents* of the `dist/` folder (the HTML files and the `assets` folder) directly into the `public_html` directory in the Hostinger File Manager.

## Step 4: Add `.htaccess` (Optional but Recommended)
To improve performance (browser caching) and ensure HTML extensionless URLs if you prefer them later, create a new file named `.htaccess` in `public_html` and add:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Remove .html extension
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^([^\.]+)$ $1.html [NC,L]
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/x-javascript "access plus 1 month"
    ExpiresByType application/x-shockwave-flash "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresDefault "access plus 2 days"
</IfModule>
```

## Step 5: Verification
1. Visit your domain in the browser.
2. The website should load instantly with a high Lighthouse score.
3. Test the Cart and Checkout to ensure Alpine.js is working correctly.

You are now live!
