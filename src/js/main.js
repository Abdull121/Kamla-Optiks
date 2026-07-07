import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import { createIcons } from 'lucide';
import {
  ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye
} from 'lucide';
import { products, categories, brands } from '../data/mockData.js';

window.Alpine = Alpine;
Alpine.plugin(collapse);

// Initialize global store for Cart and Wishlist
Alpine.store('cart', {
  items: [],
  isOpen: false,
  init() {
    const saved = localStorage.getItem('kamal_cart');
    if (saved) {
      this.items = JSON.parse(saved);
    }
  },
  add(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.save();
    this.isOpen = true;
  },
  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  },
  updateQuantity(id, qty) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, qty);
      this.save();
    }
  },
  get total() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  get count() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },
  save() {
    localStorage.setItem('kamal_cart', JSON.stringify(this.items));
  },
  toggle() {
    this.isOpen = !this.isOpen;
  }
});

Alpine.store('wishlist', {
  items: [],
  init() {
    const saved = localStorage.getItem('kamal_wishlist');
    if (saved) {
      this.items = JSON.parse(saved);
    }
  },
  toggle(product) {
    const exists = this.items.find(i => i.id === product.id);
    if (exists) {
      this.items = this.items.filter(i => i.id !== product.id);
    } else {
      this.items.push(product);
    }
    this.save();
  },
  has(id) {
    return this.items.some(i => i.id === id);
  },
  save() {
    localStorage.setItem('kamal_wishlist', JSON.stringify(this.items));
  }
});

// Components
Alpine.data('homePage', () => ({
  trendingProducts: products.slice(0, 4),
  init() {
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
  }
}));

Alpine.data('shopPage', () => ({
  mobileFiltersOpen: false,
  products: products,
  categories: categories,
  brands: brands,
  selectedCategories: [],
  selectedBrands: [],
  maxPrice: 150000,
  sortBy: 'newest',
  page: 1,
  itemsPerPage: 12,
  
  get filteredProducts() {
    let result = this.products;
    if (this.selectedCategories.length > 0) {
      result = result.filter(p => this.selectedCategories.includes(p.categoryId.toString()) || this.selectedCategories.includes(p.categoryId));
    }
    if (this.selectedBrands.length > 0) {
      result = result.filter(p => this.selectedBrands.includes(p.brandId.toString()) || this.selectedBrands.includes(p.brandId));
    }
    result = result.filter(p => (p.discountPrice || p.price) <= this.maxPrice);
    if (this.sortBy === 'price-low') {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (this.sortBy === 'price-high') {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (this.sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      result.sort((a, b) => b.id - a.id);
    }
    return result;
  },
  get totalPages() { return Math.ceil(this.filteredProducts.length / this.itemsPerPage); },
  get paginatedProducts() {
    const start = (this.page - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  },
  resetFilters() {
    this.selectedCategories = [];
    this.selectedBrands = [];
    this.maxPrice = 150000;
    this.sortBy = 'newest';
    this.page = 1;
  },
  init() {
    this.$watch('selectedCategories', () => { this.page = 1; });
    this.$watch('selectedBrands', () => { this.page = 1; });
    this.$watch('maxPrice', () => { this.page = 1; });
    this.$watch('sortBy', () => { this.page = 1; });
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
  }
}));

Alpine.data('productPage', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = parseInt(urlParams.get('id')) || 1;
  const product = products.find(p => p.id === id) || products[0];
  
  return {
    product: product,
    activeImage: product.images[0],
    selectedColor: product.colors[0],
    selectedSize: product.sizes[0],
    quantity: 1,
    getColorClass(colorName) {
      const map = {
        'Black': 'bg-black',
        'Tortoise': 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] bg-amber-900',
        'Clear': 'bg-gray-100 border border-gray-300'
      };
      return map[colorName] || 'bg-gray-500';
    },
    addToCart() {
      const item = { ...this.product };
      for(let i=0; i<this.quantity; i++){
        this.$store.cart.add(item);
      }
    },
    init() {
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
    }
  }
});

Alpine.data('checkoutPage', () => ({
  paymentMethod: 'cod',
  isProcessing: false,
  showSuccess: false,
  form: { email: '', firstName: '', lastName: '', address: '', city: '', zip: '', phone: '' },
  processCheckout() {
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.showSuccess = true;
      this.$store.cart.items = [];
      this.$store.cart.save();
    }, 1500);
  },
  init() {
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
  }
}));

Alpine.data('dashboardPage', () => {
  let hash = window.location.hash.replace('#', '');
  if (!['orders', 'wishlist', 'profile', 'addresses'].includes(hash)) {
    hash = 'orders';
  }
  return {
    activeTab: hash,
    mockOrders: [
      { id: 'KML-20268493', date: 'July 1, 2026', total: '69,720', status: 'Delivered', items: [ { name: 'Premium Frame Model 12', qty: 1, image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=200&q=80' } ] },
      { id: 'KML-20267211', date: 'June 15, 2026', total: '50,540', status: 'Processing', items: [ { name: 'Premium Frame Model 4', qty: 1, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=200&q=80' } ] }
    ],
    logout() {
      alert('Logged out');
      window.location.href = '/';
    },
    init() {
      this.$watch('activeTab', (value) => { window.location.hash = value; });
      setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
          this.$watch('activeTab', () => { setTimeout(() => window.lucide.createIcons(), 50); });
        }
      }, 100);
    }
  }
});

Alpine.start();

// Single Page Application (SPA) Transition Router
async function navigateTo(url, pushState = true) {
  const main = document.querySelector('main');
  if (!main) return;

  if (document.startViewTransition) {
    document.startViewTransition(async () => {
      await performNavigation(url, main, pushState);
    });
  } else {
    main.style.opacity = '0';
    main.style.transition = 'opacity 150ms ease';
    setTimeout(async () => {
      await performNavigation(url, main, pushState);
      main.style.opacity = '1';
    }, 150);
  }
}

async function performNavigation(url, main, pushState) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch page');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    document.title = doc.title;

    const newMain = doc.querySelector('main');
    if (newMain) {
      // Replace entire DOM node to prevent Alpine state leakage and attribute merging bugs
      main.parentNode.replaceChild(newMain, main);

      // Update Nav highlighting
      updateActiveNavLink(url);

      // Re-initialize Alpine tree on new navigation
      window.Alpine.initTree(newMain);

      // Re-initialize icons
      createIcons({
        icons: {
          ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye
        }
      });

      if (pushState) {
        window.history.pushState({}, '', url);
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
    } else {
      window.location.href = url;
    }
  } catch (error) {
    console.error('Navigation error:', error);
    window.location.href = url;
  }
}

function updateActiveNavLink(url) {
  const currentPath = new URL(url, window.location.origin).pathname;

  document.querySelectorAll('header nav a').forEach(a => {
    const linkPath = new URL(a.href, window.location.origin).pathname;
    if (linkPath === currentPath) {
      a.classList.add('text-accent');
      a.classList.remove('hover:text-accent');
    } else {
      a.classList.remove('text-accent');
      a.classList.add('hover:text-accent');
    }
  });
}

// Router Event Listeners
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (link && link.href && link.host === window.location.host && !link.hasAttribute('download') && link.target !== '_blank') {
    const currentUrl = new URL(window.location.href);
    const targetUrl = new URL(link.href);
    
    // Allow default anchor scrolling for same-page hash links
    if (currentUrl.pathname === targetUrl.pathname && targetUrl.hash) {
      return;
    }

    e.preventDefault();
    navigateTo(link.href);
  }
});

window.addEventListener('popstate', () => {
  navigateTo(window.location.href, false);
});

document.addEventListener('DOMContentLoaded', () => {
  updateActiveNavLink(window.location.href);
  createIcons({
    icons: {
      ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye
    }
  });
});
