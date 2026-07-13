const fs = require('fs');
const files = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'about.html', 'faq.html', 'contact.html'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<a href="\/dashboard\.html"[^>]*>\s*<i data-lucide="user"[^>]*><\/i>\s*<\/a>/g, '');
  fs.writeFileSync(file, content);
}
