import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import { createIcons } from 'lucide';
import {
  ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye, Edit2, Trash2, Construction, CreditCard, Printer, DollarSign, TrendingUp, AlertCircle, Users
} from 'lucide';
import { products, categories, brands } from '../data/mockData.js';

const defaultOrders = [
  {
    id: 'KML-20268493',
    customerName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '0300-1234567',
    address: '123 Luxury Avenue, Gulberg III, Lahore',
    date: 'July 1, 2026',
    total: 69720,
    deliveryCharges: 250,
    status: 'Delivered',
    items: [ { name: 'Premium Frame Model 12', qty: 1, price: 69470, image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=200&q=80' } ]
  },
  {
    id: 'KML-20267211',
    customerName: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    phone: '0321-7654321',
    address: 'Flat 402, Block 17, Gulistan-e-Johar, Karachi',
    date: 'June 15, 2026',
    total: 50540,
    deliveryCharges: 250,
    status: 'Processing',
    items: [ { name: 'Premium Frame Model 4', qty: 1, price: 50290, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=200&q=80' } ]
  },
  {
    id: 'KML-20261102',
    customerName: 'Ali Khan',
    email: 'ali.khan@example.com',
    phone: '0333-9876543',
    address: 'House 14, Sector F-7/2, Islamabad',
    date: 'June 10, 2026',
    total: 35000,
    deliveryCharges: 250,
    status: 'Pending',
    items: [ { name: 'Premium Frame Model 8', qty: 1, price: 34750, image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=200&q=80' } ]
  },
  {
    id: 'KML-20260942',
    customerName: 'Fatima Ahmed',
    email: 'fatima@example.com',
    phone: '0345-1122334',
    address: '54-A, DHA Phase 5, Lahore',
    date: 'June 05, 2026',
    total: 24500,
    deliveryCharges: 250,
    status: 'Shipped',
    items: [ { name: 'Premium Frame Model 15', qty: 1, price: 24250, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=200&q=80' } ]
  },
  {
    id: 'KML-20260531',
    customerName: 'Zainab Bibi',
    email: 'zainab@example.com',
    phone: '0312-3456789',
    address: 'Near Liberty Roundabout, Gulberg, Lahore',
    date: 'May 28, 2026',
    total: 18000,
    deliveryCharges: 250,
    status: 'Cancelled',
    items: [ { name: 'Premium Frame Model 20', qty: 1, price: 17750, image: 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=200&q=80' } ]
  }
];


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
      
      const newOrder = {
        id: 'KML-' + Math.floor(10000000 + Math.random() * 90000000),
        customerName: this.form.firstName + ' ' + this.form.lastName,
        email: this.form.email,
        phone: this.form.phone,
        address: this.form.address + ', ' + this.form.city + ' ' + this.form.zip,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        total: this.$store.cart.total + 250,
        deliveryCharges: 250,
        status: 'Pending',
        items: this.$store.cart.items.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          image: item.image
        }))
      };

      try {
        const saved = localStorage.getItem('kamal_orders');
        let orders = saved ? JSON.parse(saved) : [...defaultOrders];
        orders.unshift(newOrder);
        localStorage.setItem('kamal_orders', JSON.stringify(orders));
      } catch (e) {
        console.error("Error saving order:", e);
      }

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
    get mockOrders() {
      try {
        const saved = localStorage.getItem('kamal_orders');
        if (saved) {
          return JSON.parse(saved);
        } else {
          localStorage.setItem('kamal_orders', JSON.stringify(defaultOrders));
          return defaultOrders;
        }
      } catch (e) {
        return defaultOrders;
      }
    },
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

Alpine.data('adminPage', () => ({
  sidebarOpen: false,
  activeTab: 'dashboard',
  
  // Products management state
  searchQuery: '',
  isModalOpen: false,
  editingProduct: null,
  products: products, 
  categories: categories,
  brands: brands,
  form: {
    id: null,
    name: '',
    categoryId: '',
    brandId: '',
    price: '',
    discountPrice: '',
    stockQuantity: 10,
    deliveryCharges: 250,
    description: '',
    image: '',
    inStock: true
  },
  page: 1,
  itemsPerPage: 8,
  
  // Orders management state
  orders: [],
  ordersPage: 1,
  ordersItemsPerPage: 8,
  ordersFilter: 'all',
  ordersSearchQuery: '',
  selectedOrder: null,
  isOrderModalOpen: false,

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.itemsPerPage));
  },
  
  get paginatedProducts() {
    const start = (this.page - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  },
  
  get filteredProducts() {
    if (this.searchQuery === '') {
      return this.products;
    }
    const query = this.searchQuery.toLowerCase();
    return this.products.filter(p => p.name.toLowerCase().includes(query) || (p.brandName && p.brandName.toLowerCase().includes(query)));
  },
  
  // Orders getters
  get filteredOrders() {
    let result = this.orders;
    if (this.ordersFilter !== 'all') {
      result = result.filter(o => o.status === this.ordersFilter);
    }
    if (this.ordersSearchQuery !== '') {
      const q = this.ordersSearchQuery.toLowerCase();
      result = result.filter(o => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
    }
    return result;
  },

  get totalOrdersPages() {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.ordersItemsPerPage));
  },

  get paginatedOrders() {
    const start = (this.ordersPage - 1) * this.ordersItemsPerPage;
    return this.filteredOrders.slice(start, start + this.ordersItemsPerPage);
  },
  
  get dashboardStats() {
    const deliveredRevenue = this.orders
      .filter(o => o.status === 'Delivered')
      .reduce((sum, o) => sum + o.total, 0);
    const lowStock = this.products.filter(p => p.stockQuantity < 15).length;
    
    return {
      revenue: deliveredRevenue,
      ordersCount: this.orders.length,
      productsCount: this.products.length,
      lowStockCount: lowStock
    };
  },
  
  get recentOrders() {
    return this.orders.slice(0, 5);
  },
  
  get topSellingProducts() {
    return [...this.products]
      .sort((a, b) => b.reviewsCount * b.rating - a.reviewsCount * a.rating)
      .slice(0, 4);
  },
  
  openModal(product = null) {
    this.editingProduct = product;
    if (product) {
      this.form = {
        id: product.id,
        name: product.name || '',
        categoryId: product.categoryId || '',
        brandId: product.brandId || '',
        price: product.price || '',
        discountPrice: product.discountPrice || '',
        stockQuantity: product.stockQuantity || 0,
        deliveryCharges: product.deliveryCharges || 250,
        description: product.description || '',
        image: product.image || '',
        inStock: product.inStock !== undefined ? product.inStock : true
      };
    } else {
      this.form = {
        id: null,
        name: '',
        categoryId: '',
        brandId: '',
        price: '',
        discountPrice: '',
        stockQuantity: 10,
        deliveryCharges: 250,
        description: '',
        image: '',
        inStock: true
      };
    }
    this.isModalOpen = true;
  },
  
  closeModal() {
    this.isModalOpen = false;
    this.editingProduct = null;
  },
  
  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an image under 5MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.form.image = e.target.result;
    };
    reader.readAsDataURL(file);
  },
  
  saveProduct() {
    if (!this.form.name || !this.form.categoryId || !this.form.brandId || !this.form.price || !this.form.image) {
      alert("Please fill in all required fields and upload an image.");
      return;
    }
    
    const cat = this.categories.find(c => c.id == this.form.categoryId);
    const brand = this.brands.find(b => b.id == this.form.brandId);
    
    const productData = {
      ...this.form,
      price: Number(this.form.price),
      discountPrice: this.form.discountPrice ? Number(this.form.discountPrice) : null,
      stockQuantity: Number(this.form.stockQuantity),
      deliveryCharges: Number(this.form.deliveryCharges),
      categoryId: Number(this.form.categoryId),
      brandId: Number(this.form.brandId),
      categoryName: cat ? cat.name : '',
      brandName: brand ? brand.name : '',
      inStock: Number(this.form.stockQuantity) > 0,
      slug: this.form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      images: [this.form.image],
      rating: 5.0,
      reviewsCount: 0,
      isNew: true,
      colors: ['Black'],
      sizes: ['Medium']
    };
    
    if (this.editingProduct) {
      const index = this.products.findIndex(p => p.id === this.editingProduct.id);
      if (index !== -1) {
        this.products[index] = { ...this.products[index], ...productData };
      }
    } else {
      const newId = this.products.length > 0 ? Math.max(...this.products.map(p => p.id)) + 1 : 1;
      productData.id = newId;
      this.products.unshift(productData);
    }
    
    localStorage.setItem('kamal_products', JSON.stringify(this.products));
    this.closeModal();
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
  },
  
  deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
      this.products = this.products.filter(p => p.id !== id);
      localStorage.setItem('kamal_products', JSON.stringify(this.products));
    }
  },

  // Orders Actions
  openOrderModal(order) {
    this.selectedOrder = JSON.parse(JSON.stringify(order)); // deep clone
    this.isOrderModalOpen = true;
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
  },

  closeOrderModal() {
    this.isOrderModalOpen = false;
    this.selectedOrder = null;
  },

  updateOrderStatus(orderId, newStatus) {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.orders[index].status = newStatus;
      localStorage.setItem('kamal_orders', JSON.stringify(this.orders));
      if (this.selectedOrder && this.selectedOrder.id === orderId) {
        this.selectedOrder.status = newStatus;
      }
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    }
  },
  
  init() {
    // Load orders
    try {
      const savedOrders = localStorage.getItem('kamal_orders');
      if (savedOrders) {
        this.orders = JSON.parse(savedOrders);
      } else {
        this.orders = [...defaultOrders];
        localStorage.setItem('kamal_orders', JSON.stringify(this.orders));
      }
    } catch(e) {
      this.orders = [...defaultOrders];
    }

    let hash = window.location.hash.replace('#', '');
    if (['dashboard', 'products', 'orders', 'customers', 'settings'].includes(hash)) {
      this.activeTab = hash;
    }
    this.$watch('activeTab', (value) => { 
      window.location.hash = value; 
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    });
    this.$watch('page', () => {
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    });
    this.$watch('searchQuery', () => { 
      this.page = 1; 
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    });
    
    // Orders watches
    this.$watch('ordersPage', () => {
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    });
    this.$watch('ordersFilter', () => {
      this.ordersPage = 1;
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    });
    this.$watch('ordersSearchQuery', () => {
      this.ordersPage = 1;
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    });

    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
  }
}));

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
          ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye, Edit2, Trash2, Construction, CreditCard, Printer, DollarSign, TrendingUp, AlertCircle, Users
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
      ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye, Edit2, Trash2, Construction, CreditCard, Printer, DollarSign, TrendingUp, AlertCircle, Users
    }
  });
});
