import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import { createIcons } from 'lucide';
import {
  ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye, Edit2, Trash2, Construction, CreditCard, Printer, DollarSign, TrendingUp, AlertCircle, Users, LayoutDashboard, List, Tag, Settings, Home, ShoppingBag, Sun, FileText, Info, Filter
} from 'lucide';
window.hideGlobalLoader = function() {
  const loader = document.getElementById('full-page-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }
};

// Fallback to ensure the loader never gets stuck infinitely
setTimeout(() => {
  window.hideGlobalLoader();
}, 5000);

window.getImageUrl = function(path) {
  if (!path || typeof path !== 'string') return 'https://via.placeholder.com/150';
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  return path.startsWith('/') ? path : '/' + path;
};

window.getColorHex = function(colorName) {
  if (!colorName) return 'transparent';
  const name = colorName.toLowerCase().trim();
  const map = {
    'brown': '#6b4423',
    'clear': 'transparent',
    'tortoise': '#703A12',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'gunmetal': '#2a3439',
    'matte black': '#28282B',
    'rose gold': '#B76E79',
    'navy': '#000080',
    'maroon': '#800000',
    'transparent': 'transparent'
  };
  return map[name] || colorName;
};


function assignRandomRatings(products) {
  products.forEach(p => {
    if (!p.rating || p.rating === 0 || p.rating === 5 || p.rating === '5') {
      const idHash = p.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      p.rating = (4.0 + (idHash % 11) / 10).toFixed(1);
    }
  });
  return products;
}

export const USE_REAL_BACKEND = true; // Set to true when deploying to Hostinger
export const API_BASE_URL = '/api';
window.Alpine = Alpine;
Alpine.plugin(collapse);

// Initialize global store for Cart and Wishlist

Alpine.store('settings', {
  globalShippingFee: 250,
  async init() {
    if (!USE_REAL_BACKEND) return;
    try {
      const res = await fetch(`${API_BASE_URL}/settings.php`);
      if (res.ok) {
        const data = await res.json();
        if (data.global_shipping_fee) {
          this.globalShippingFee = parseFloat(data.global_shipping_fee);
        }
      }
    } catch(e) { console.error('Failed to init settings', e); }
  }
});

Alpine.store('search', {
  isOpen: false,
  query: '',
  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
    }
  },
  submit(e) {
    if (e) e.preventDefault();
    if (this.query.trim()) {
      window.location.href = '/shop.html?search=' + encodeURIComponent(this.query.trim());
      this.isOpen = false;
    }
  }
});

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
    const existing = this.items.find(i => 
      i.id === product.id && 
      i.selectedColor === product.selectedColor && 
      i.selectedSize === product.selectedSize &&
      i.lensOption === product.lensOption
    );
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
  categories: [],
  trendingProducts: [],
  isLoading: false,
async init() {
    this.isLoading = true;
    // Start with empty array — do NOT fall back to mock data when real backend is on
    let currentProducts = [];
    if (USE_REAL_BACKEND) {
      try {
        const ts = Date.now(); // cache-bust
        const res = await fetch(`${API_BASE_URL}/products.php?_=${ts}`);
        if (res.ok) currentProducts = assignRandomRatings(await res.json());
        
        const catRes = await fetch(`${API_BASE_URL}/categories.php?_=${ts}`);
        if (catRes.ok) this.categories = await catRes.json();
      } catch(e) { console.error(e); }
    } else {
      const saved = localStorage.getItem('kamal_products');
      if (saved) currentProducts = assignRandomRatings(JSON.parse(saved));
    }
    this.trendingProducts = currentProducts.filter(p => p.isTrending || p.is_trending).slice(0, 8);
    // Only fallback if NOT using real backend
    if (this.trendingProducts.length === 0 && !USE_REAL_BACKEND) {
      this.trendingProducts = currentProducts.slice(0, 4);
    }
    this.isLoading = false;
      window.hideGlobalLoader();
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
  }
}));

Alpine.data('shopPage', () => ({
  mobileFiltersOpen: false,
  isLoading: true,
  products: [],
  categories: [],
  brands: [],
  selectedCategories: [],
  selectedBrands: [],
  maxPrice: 150000,
  sortBy: 'newest',
  page: 1,
  itemsPerPage: 12,
  searchQuery: '',
  
  get filteredProducts() {
    let result = this.products;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.brandName && p.brandName.toLowerCase().includes(q)));
    }
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
async init() {
    this.isLoading = true;
    let fetchedProducts = [];
    if (USE_REAL_BACKEND) {
      try {
        const ts = Date.now();
        const [productsRes, catRes, brandRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products.php?_=${ts}`),
          fetch(`${API_BASE_URL}/categories.php?_=${ts}`),
          fetch(`${API_BASE_URL}/brands.php?_=${ts}`)
        ]);
        if (productsRes.ok) fetchedProducts = assignRandomRatings(await productsRes.json());
        if (catRes.ok) this.categories = await catRes.json();
        if (brandRes.ok) this.brands = await brandRes.json();
      } catch(e) { console.error('shopPage init error:', e); }
    } else {
      const saved = localStorage.getItem('kamal_products');
      if (saved) fetchedProducts = assignRandomRatings(JSON.parse(saved));
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('category');
    if (categorySlug && this.categories) {
      const cat = this.categories.find(c => c.slug === categorySlug || c.name.toLowerCase() === categorySlug.toLowerCase());
      if (cat) {
        this.selectedCategories = [cat.id.toString()];
      }
    }
    
    const searchParam = urlParams.get('search');
    if (searchParam) {
      this.searchQuery = searchParam;
    }

    this.products = fetchedProducts;
    
    this.$watch('selectedCategories', () => { this.page = 1; });
    this.$watch('selectedBrands', () => { this.page = 1; });
    this.$watch('maxPrice', () => { this.page = 1; });
    this.$watch('sortBy', () => { this.page = 1; });
    
    setTimeout(() => { 
      this.isLoading = false;
      window.hideGlobalLoader();
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    }, 100);
  }
}));

Alpine.data('productPage', () => ({
  
    lensType: 'no_eyesight',
    prescriptionMethod: 'enter',
    ipd: '',
    prescriptionImage: '',
    sphRight: '0', cylRight: '0', axisRight: '0',
    sphLeft: '0', cylLeft: '0', axisLeft: '0',
product: null,
  activeImage: '',
  selectedColor: '',
  selectedSize: '',
  quantity: 1,
  isUploadingPrescription: false,
  getColorClass(colorName) {
    const map = {
      'Black': 'bg-black',
      'Tortoise': 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")] bg-amber-900',
      'Clear': 'bg-gray-100 border border-gray-300'
    };
    return map[colorName] || 'bg-gray-500';
  },
  addToCart() {
    if (!this.product) return;
    const item = { 
      ...this.product,
      selectedColor: this.selectedColor,
      selectedSize: this.selectedSize
    };
    
    // Add prescription data if applicable
    if (this.product.categoryName && this.product.categoryName.toLowerCase() !== 'sunglasses') {
      item.lensOption = this.lensType;
      if (this.lensType === 'eyesight') {
        if (this.prescriptionMethod === 'manual' || this.prescriptionMethod === 'enter') {
          item.prescription = {
            type: 'manual',
            right: { sph: this.sphRight, cyl: this.cylRight, axis: this.axisRight },
            left: { sph: this.sphLeft, cyl: this.cylLeft, axis: this.axisLeft },
            ipd: this.ipd
          };
        } else if (this.prescriptionMethod === 'upload') {
          item.prescription = {
            type: 'upload',
            image: this.prescriptionImage
          };
        }
      }
    }

    for(let i=0; i<this.quantity; i++){
      this.$store.cart.add(item);
    }
  },

    uploadPrescription(event) {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("File is too large. Please select an image under 2MB.");
        return;
      }
      
      this.isUploadingPrescription = true;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        
        if (!USE_REAL_BACKEND) {
          this.prescriptionImage = base64;
          this.isUploadingPrescription = false;
          return;
        }
        
        try {
          const res = await fetch(`${API_BASE_URL}/upload.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          });
          const data = await res.json();
          if (res.ok && data.path) {
            this.prescriptionImage = `${API_BASE_URL}/image.php?file=${data.path}`;
          } else {
            alert('Failed to upload image.');
          }
        } catch(err) {
          console.error(err);
          alert('Error uploading image.');
        } finally {
          this.isUploadingPrescription = false;
        }
      };
      reader.readAsDataURL(file);
    },
async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id')) || 1;
    let currentProducts = [];
    
    if (USE_REAL_BACKEND) {
      try {
        const res = await fetch(`${API_BASE_URL}/products.php`);
        if (res.ok) currentProducts = await res.json();
      } catch(e) { console.error(e); }
    } else {
      const saved = localStorage.getItem('kamal_products');
      if (saved) currentProducts = JSON.parse(saved);
    }
    
    this.product = currentProducts.find(p => p.id === id) || currentProducts[0];
    if (this.product) {
      this.activeImage = this.product.images ? this.product.images[0] : this.product.image;
      
      if (this.product.colors) {
        this.product.colors = this.product.colors.map(c => typeof c === 'string' ? { name: c, qty: 10 } : c);
        const availableColor = this.product.colors.find(c => c.qty > 0);
        this.selectedColor = availableColor ? availableColor.name : (this.product.colors[0]?.name || this.product.color || 'Black');
        
        // Setup watcher to change image when color changes
        this.$watch('selectedColor', (newColor) => {
          const colObj = this.product.colors.find(c => c.name === newColor);
          if (colObj && colObj.image) {
            this.activeImage = colObj.image;
          } else {
            this.activeImage = this.product.images && this.product.images.length > 0 ? this.product.images[0] : this.product.image;
          }
        });
        
        // Trigger initial image update if the selected color has an image
        const initialColObj = this.product.colors.find(c => c.name === this.selectedColor);
        if (initialColObj && initialColObj.image) {
          this.activeImage = initialColObj.image;
        }
      } else {
        this.selectedColor = this.product.color || 'Black';
      }
      
      this.selectedSize = this.product.sizes ? this.product.sizes[0] : 'Medium';
      
      if (USE_REAL_BACKEND && this.product.categoryId) {
        try {
          const catRes = await fetch(`${API_BASE_URL}/categories.php`);
          if (catRes.ok) {
            const categories = await catRes.json();
            const cat = categories.find(c => c.id == this.product.categoryId);
            if (cat) this.product.categoryName = cat.name;
          }
        } catch(e) { console.error(e); }
      }
    }
    
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 100);
  }
}));

Alpine.data('checkoutPage', () => ({
  paymentMethod: 'cod',
  isProcessing: false,
  showSuccess: false,
  form: { email: '', firstName: '', lastName: '', address: '', city: '', zip: '', phone: '' },
  async processCheckout() {
    this.isProcessing = true;
    
    if (USE_REAL_BACKEND) {
      try {
        const payload = {
          customer: {
            fullName: this.form.firstName + ' ' + this.form.lastName,
            email: this.form.email,
            phone: this.form.phone,
            address: this.form.address + ', ' + this.form.city + ' ' + this.form.zip
          },
          cart: this.$store.cart.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            lensOption: item.lensOption,
            prescription: item.prescription
          })),
          subtotal: this.$store.cart.total,
          deliveryCharges: this.$store.settings.globalShippingFee,
          total: this.$store.cart.total + this.$store.settings.globalShippingFee
        };
        
        const res = await fetch(`${API_BASE_URL}/checkout.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error("Checkout failed on server");
      } catch (err) {
        console.error("Checkout error:", err);
        alert("There was an error processing your order. Please try again.");
        this.isProcessing = false;
        return;
      }
    } else {
      // Local mock checkout
      const newOrder = {
        id: 'KML-' + Math.floor(10000000 + Math.random() * 90000000),
        customerName: this.form.firstName + ' ' + this.form.lastName,
        email: this.form.email,
        phone: this.form.phone,
        address: this.form.address + ', ' + this.form.city + ' ' + this.form.zip,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        total: this.$store.cart.total + this.$store.settings.globalShippingFee,
        deliveryCharges: this.$store.settings.globalShippingFee,
        status: 'Pending',
        items: this.$store.cart.items.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          image: item.image,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          lensOption: item.lensOption,
          prescriptionData: item.prescription
        }))
      };

      try {
        const saved = localStorage.getItem('kamal_orders');
        let orders = saved ? JSON.parse(saved) : []; // defaultOrders not available in this scope, so use []
        orders.unshift(newOrder);
        localStorage.setItem('kamal_orders', JSON.stringify(orders));
      } catch (e) {
        console.error("Error saving order:", e);
      }
    }

    // Success for both paths
    setTimeout(() => {
      this.isProcessing = false;
      this.showSuccess = true;  // Show success FIRST
      // Small delay before clearing cart so showSuccess check takes effect
      setTimeout(() => {
        this.$store.cart.items = [];
        this.$store.cart.save();
      }, 50);
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
          return [];
        }
      } catch (e) {
        return [];
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
    settings: { global_shipping_fee: 250.00 },
  activeTab: 'dashboard',
  
  // Products management state
  searchQuery: '',
  isModalOpen: false,
  isSubmitting: false,
  submittingId: null,
  editingProduct: null,
  products: [],
  categories: [],
  brands: [],

  // Category management state
  isCategoryModalOpen: false,
  editingCategory: null,
  categoryForm: {
    id: null,
    name: '',
    slug: '',
    image: ''
  },

  // Brand management state
  isBrandModalOpen: false,
  editingBrand: null,
  brandForm: {
    id: null,
    name: '',
    slug: '',
    image: ''
  },

  form: {
    id: null,
    name: '',
    sku: '',
    categoryId: '',
    brandId: '',
    price: '',
    discountPrice: '',
    stockQuantity: 10,
    deliveryCharges: 250,
    description: '',
        color: '',
        image: '',
    inStock: true,
    isTrending: false
  },
  page: 1,
  itemsPerPage: 8,
  
  itemsPerPage: 8,
  
  // Orders management state
  orders: [],
  ordersPage: 1,
  ordersItemsPerPage: 8,
  ordersFilter: 'all',
  ordersSearchQuery: '',
  selectedOrder: null,
  selectedOrderItem: null, // Track clicked item for detailed view
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
    this._imageFiles = [];
    this._imageFile = null;
    this.editingProduct = product;
    if (product) {
      this.form = {
        id: product.id,
        name: product.name || '',
        sku: product.sku || '',
        categoryId: product.categoryId || '',
        brandId: product.brandId || '',
        price: product.price || '',
        discountPrice: product.discountPrice || '',
        stockQuantity: product.stockQuantity || 0,
        deliveryCharges: product.deliveryCharges || 250,
        description: product.description || '',
        color: product.color || '',
        image: product.image || '',
        inStock: product.inStock !== undefined ? product.inStock : true,
        isTrending: product.isTrending || false,
        colors: (product.colors || (product.color ? [product.color] : [])).map(c => typeof c === 'string' ? { name: c, qty: 10 } : c),
        sizes: product.sizes || [],
        images: (product.images && product.images.length > 0) ? product.images : (product.image ? [product.image] : [])
      };
    } else {
      this.form = {
        id: null,
        name: '',
        sku: '',
        categoryId: '',
        brandId: '',
        price: 0,
        discountPrice: null,
        stockQuantity: 10,
        deliveryCharges: 250,
        description: '',
        image: '',
        inStock: true,
        isTrending: false,
        colors: [],
        sizes: [],
        images: []
      };
    }
    this.isModalOpen = true;
  },
  
  closeModal() {
    this._imageFiles = [];
    this.isModalOpen = false;
    this.editingProduct = null;
  },
  
  newColor: '',
  newSize: '',
  _imageFiles: [],
  addColor() {
    if (this.newColor.trim() && !this.form.colors.some(c => c.name === this.newColor.trim())) {
      this.form.colors.push({ name: this.newColor.trim(), qty: 10 });
    }
    this.newColor = '';
  },
  removeColor(index) {
    this.form.colors.splice(index, 1);
  },
  addSize() {
    if (this.newSize.trim() && !this.form.sizes.includes(this.newSize.trim())) {
      this.form.sizes.push(this.newSize.trim());
    }
    this.newSize = '';
  },
  removeSize(index) {
    this.form.sizes.splice(index, 1);
  },
  handleImagesUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    
    const currentCount = this.form.images.length;
    const remaining = 3 - currentCount;
    const filesToAdd = files.slice(0, remaining);
    
    if (files.length > remaining) {
      alert("Maximum 3 images allowed. Only " + remaining + " images were added.");
    }
    
    filesToAdd.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert("File " + file.name + " is too large.");
        return;
      }
      this._imageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.form.images.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  },
  removeImage(index) {
    const img = this.form.images[index];
    this.form.images.splice(index, 1);
    if (img.startsWith('data:')) {
      // It's a new upload, we just clear the _imageFiles completely and ask user to re-upload new ones.
      // This is a simple safe fallback for the UI to keep indices matched.
      // For a perfect UX, we'd map it, but clearing and letting them re-select is fine for admin.
      this._imageFiles = [];
      this.form.images = this.form.images.filter(i => !i.startsWith('data:'));
      if (img.startsWith('data:')) { alert("Please re-select any new images you wanted to keep."); }
    }
  },
  handleColorImageUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB for the color variant.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.form.colors[index].image = e.target.result;
    };
    reader.readAsDataURL(file);
  },
  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select an image under 5MB.");
      return;
    }
    
    // Store the raw File object for FormData upload
    this._imageFile = file;
    
    // Create base64 preview only for the UI
    const reader = new FileReader();
    reader.onload = (e) => {
      this.form.image = e.target.result; // preview only
    };
    reader.readAsDataURL(file);
  },
  
  async saveProduct() {
    const hasImage = this.form.image || (this.form.images && this.form.images.length > 0);
    if (!this.form.name || !this.form.categoryId || !this.form.brandId || !this.form.price || !hasImage) {
      alert("Please fill in all required fields and upload at least one image.");
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
      color: this.form.color || '',
      categoryId: this.form.categoryId,
      brandId: this.form.brandId,
      categoryName: cat ? cat.name : '',
      brandName: brand ? brand.name : '',
      inStock: Number(this.form.stockQuantity) > 0,
      isTrending: this.form.isTrending,
      slug: this.form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      images: [this.form.image],
      rating: 5.0,
      reviewsCount: 0,
      isNew: true,
      colors: ['Black'],
      sizes: ['Medium']
    };
    
    this.isSubmitting = true;
    
    if (USE_REAL_BACKEND) {
      try {
        let res;
        // Use FormData to upload the actual image file (not base64)
        const formData = new FormData();
        formData.append('name', this.form.name);
        formData.append('sku', this.form.sku || '');
        formData.append('categoryId', this.form.categoryId);
        formData.append('brandId', this.form.brandId);
        formData.append('price', this.form.price);
        formData.append('discountPrice', this.form.discountPrice || '');
        formData.append('stockQuantity', this.form.stockQuantity);
        formData.append('deliveryCharges', this.form.deliveryCharges);
        formData.append('description', this.form.description || '');
        formData.append('color', this.form.color || '');
        formData.append('inStock', Number(this.form.stockQuantity) > 0 ? '1' : '0');
        formData.append('isTrending', this.form.isTrending ? '1' : '0');
        
        // Append the actual image File if available
        // Append the actual single image File if available
        if (this._imageFile) {
          formData.append('image', this._imageFile);
        } else {
          // Fallback: If no single new image file, extract the first existing image from the multi-image array
          const existingFirst = (this.form.images && this.form.images.length > 0 && !this.form.images[0].startsWith('data:')) ? this.form.images[0] : '';
          formData.append('existingImage', existingFirst);
        }
        
        // Append multiple images
        if (this._imageFiles && this._imageFiles.length > 0) {
          this._imageFiles.forEach((file) => {
            formData.append('images[]', file);
          });
        }
        
        if (this.form.images && this.form.images.length > 0) {
          const existingImages = this.form.images.filter(img => !img.startsWith('data:'));
          if (existingImages.length > 0) {
            formData.append('existingImages', JSON.stringify(existingImages));
          }
        }
        
        // Append colors and sizes
        if (this.form.colors && this.form.colors.length > 0) {
          formData.append('colors', JSON.stringify(this.form.colors));
        }
        if (this.form.sizes && this.form.sizes.length > 0) {
          formData.append('sizes', JSON.stringify(this.form.sizes));
        }
        
        if (this.editingProduct) {
          formData.append('id', this.editingProduct.id);
          res = await fetch(`${API_BASE_URL}/products.php?_method=PUT`, {
            method: 'POST',
            body: formData
          });
        } else {
          res = await fetch(`${API_BASE_URL}/products.php`, {
            method: 'POST',
            body: formData
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (!this.editingProduct && data.id) productData.id = data.id;
          if (data.image) productData.image = data.image; // Use server-side path
        } else {
          const errText = await res.text();
          console.error('Server error:', errText);
          alert('Failed to save product on server');
          this.isSubmitting = false;
          return;
        }
      } catch (err) {
        console.error('Save product error:', err);
        this.isSubmitting = false;
        return;
      }
    }
    
    // Refresh products from server to get consistent state
    if (USE_REAL_BACKEND) {
      try {
        const ts = Date.now();
        const refreshRes = await fetch(`${API_BASE_URL}/products.php?_=${ts}`);
        if (refreshRes.ok) this.products = await refreshRes.json();
      } catch(e) { console.error('Refresh error:', e); }
    } else {
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
    }
    
    this._imageFile = null;
    this.isSubmitting = false;
    this.closeModal();
    setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
  },
  
  async deleteProduct(id) {
    if (confirm("Are you sure you want to delete this product?")) {
      this.submittingId = id;
      if (USE_REAL_BACKEND) {
        try {
          const res = await fetch(`${API_BASE_URL}/products.php?id=${id}&_method=DELETE`, {
            method: 'POST'
          });
          if (!res.ok) {
            alert('Failed to delete product from server');
            this.submittingId = null;
            return;
          }
        } catch (err) {
          console.error("Delete error:", err);
          this.submittingId = null;
          return;
        }
      }
      
      // Refresh from server to ensure consistency
      if (USE_REAL_BACKEND) {
        try {
          const ts = Date.now();
          const refreshRes = await fetch(`${API_BASE_URL}/products.php?_=${ts}`);
          if (refreshRes.ok) this.products = await refreshRes.json();
        } catch(e) {
          // Fallback to local filter if refresh fails
          this.products = this.products.filter(p => p.id !== id);
        }
      } else {
        this.products = this.products.filter(p => p.id !== id);
        localStorage.setItem('kamal_products', JSON.stringify(this.products));
      }
      this.submittingId = null;
    }
  },

  // Categories CRUD
  openCategoryModal(category = null) {
    this.editingCategory = category;
    if (category) {
      this.categoryForm = { ...category };
    } else {
      this.categoryForm = { id: null, name: '', slug: '', image: '' };
    }
    this.isCategoryModalOpen = true;
  },

  closeCategoryModal() {
    this.isCategoryModalOpen = false;
    this.editingCategory = null;
  },

  handleCategoryImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large."); return;
    }
    this._categoryImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.categoryForm.image = e.target.result; };
    reader.readAsDataURL(file);
  },

  async saveCategory() {
    if (!this.categoryForm.name || !this.categoryForm.slug) {
      alert("Please provide category name and slug."); return;
    }
    this.isSubmitting = true;
    const catData = { ...this.categoryForm };
    if (USE_REAL_BACKEND) {
      try {
        let res;
        const formData = new FormData();
        formData.append('name', this.categoryForm.name);
        formData.append('slug', this.categoryForm.slug);
        if (this._categoryImageFile) {
          formData.append('image', this._categoryImageFile);
        } else if (this.categoryForm.image && !this.categoryForm.image.startsWith('data:')) {
          formData.append('existingImage', this.categoryForm.image);
        }
        if (this.editingCategory) {
          formData.append('id', this.editingCategory.id);
          res = await fetch(`${API_BASE_URL}/categories.php?_method=PUT`, {
            method: 'POST', body: formData
          });
        } else {
          res = await fetch(`${API_BASE_URL}/categories.php`, {
            method: 'POST', body: formData
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (data.image) catData.image = data.image;
          if (!this.editingCategory && data.id) catData.id = data.id;
        } else {
          alert('Failed to save category'); 
          this.isSubmitting = false;
          return;
        }
      } catch (err) { 
        console.error(err); 
        this.isSubmitting = false;
        return; 
      }
    }
    
    // Refresh from server
    if (USE_REAL_BACKEND) {
      try {
        const ts = Date.now();
        const catRes = await fetch(`${API_BASE_URL}/categories.php?_=${ts}`);
        if (catRes.ok) this.categories = await catRes.json();
      } catch(e) { console.error(e); }
    } else {
      if (this.editingCategory) {
        const idx = this.categories.findIndex(c => c.id === this.editingCategory.id);
        if (idx !== -1) this.categories[idx] = { ...this.categories[idx], ...catData };
      } else {
        catData.id = Date.now();
        this.categories.push(catData);
      }
    }
    this._categoryImageFile = null;
    this.isSubmitting = false;
    this.closeCategoryModal();
  },

  async deleteCategory(id) {
    if (confirm("Are you sure you want to delete this category?")) {
      this.submittingId = 'cat_' + id;
      if (USE_REAL_BACKEND) {
        try {
          const res = await fetch(`${API_BASE_URL}/categories.php?id=${id}&_method=DELETE`, { method: 'POST' });
          if (!res.ok) { 
            alert('Failed to delete category'); 
            this.submittingId = null;
            return; 
          }
        } catch (err) { 
          console.error(err); 
          this.submittingId = null;
          return; 
        }
      }
      this.categories = this.categories.filter(c => c.id !== id);
      this.submittingId = null;
    }
  },

  // Brands CRUD
  openBrandModal(brand = null) {
    this.editingBrand = brand;
    if (brand) {
      this.brandForm = { ...brand };
    } else {
      this.brandForm = { id: null, name: '', slug: '', image: '' };
    }
    this.isBrandModalOpen = true;
  },

  closeBrandModal() {
    this.isBrandModalOpen = false;
    this.editingBrand = null;
  },

  handleBrandImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large."); return;
    }
    this._brandImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.brandForm.image = e.target.result; };
    reader.readAsDataURL(file);
  },

  async saveBrand() {
    if (!this.brandForm.name || !this.brandForm.slug) {
      alert("Please provide brand name and slug."); return;
    }
    this.isSubmitting = true;
    const brandData = { ...this.brandForm };
    if (USE_REAL_BACKEND) {
      try {
        let res;
        const formData = new FormData();
        formData.append('name', this.brandForm.name);
        formData.append('slug', this.brandForm.slug);
        if (this._brandImageFile) {
          formData.append('image', this._brandImageFile);
        } else if (this.brandForm.image && !this.brandForm.image.startsWith('data:')) {
          formData.append('existingImage', this.brandForm.image);
        }
        if (this.editingBrand) {
          formData.append('id', this.editingBrand.id);
          res = await fetch(`${API_BASE_URL}/brands.php?_method=PUT`, {
            method: 'POST', body: formData
          });
        } else {
          res = await fetch(`${API_BASE_URL}/brands.php`, {
            method: 'POST', body: formData
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (data.image) brandData.image = data.image;
          if (!this.editingBrand && data.id) brandData.id = data.id;
        } else {
          alert('Failed to save brand');
          this.isSubmitting = false;
          return;
        }
      } catch (err) {
        console.error(err);
        this.isSubmitting = false;
        return;
      }
    }

    // Refresh from server
    if (USE_REAL_BACKEND) {
      try {
        const ts = Date.now();
        const brandRes = await fetch(`${API_BASE_URL}/brands.php?_=${ts}`);
        if (brandRes.ok) this.brands = await brandRes.json();
      } catch(e) { console.error(e); }
    } else {
      if (this.editingBrand) {
        const idx = this.brands.findIndex(b => b.id === this.editingBrand.id);
        if (idx !== -1) this.brands[idx] = { ...this.brands[idx], ...brandData };
      } else {
        brandData.id = Date.now();
        this.brands.push(brandData);
      }
    }
    this._brandImageFile = null;
    this.isSubmitting = false;
    this.closeBrandModal();
  },

  async deleteBrand(id) {
    if (confirm("Are you sure you want to delete this brand?")) {
      this.submittingId = 'brand_' + id;
      if (USE_REAL_BACKEND) {
        try {
          const res = await fetch(`${API_BASE_URL}/brands.php?id=${id}&_method=DELETE`, { method: 'POST' });
          if (!res.ok) {
            alert('Failed to delete brand');
            this.submittingId = null;
            return;
          }
        } catch (err) {
          console.error(err);
          this.submittingId = null;
          return;
        }
      }
      this.brands = this.brands.filter(b => b.id !== id);
      this.submittingId = null;
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

  async updateOrderStatus(orderId, newStatus) {
    if (USE_REAL_BACKEND) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders.php`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, status: newStatus })
        });
        if (!res.ok) {
          alert('Failed to update status on server');
          return;
        }
      } catch (err) {
        console.error("Update status error:", err);
        return;
      }
    }

    const index = this.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this.orders[index].status = newStatus;
      if (!USE_REAL_BACKEND) {
        localStorage.setItem('kamal_orders', JSON.stringify(this.orders));
      }
      if (this.selectedOrder && this.selectedOrder.id === orderId) {
        this.selectedOrder.status = newStatus;
      }
      setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50);
    }
  },

  async fetchSettings() {
    if (!USE_REAL_BACKEND) return;
    try {
      const res = await fetch(`${API_BASE_URL}/settings.php`);
      if (res.ok) {
        const data = await res.json();
        if (data.global_shipping_fee) {
          this.settings.global_shipping_fee = parseFloat(data.global_shipping_fee);
        }
      }
    } catch(e) { console.error('Failed to fetch settings', e); }
  },
  async saveSettings() {
    if (!USE_REAL_BACKEND) return;
    try {
      const res = await fetch(`${API_BASE_URL}/settings.php`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(this.settings)
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch(e) {
      alert('Error saving settings.');
    }
  },
async init() {
    this.fetchSettings();
    if (USE_REAL_BACKEND) {
      try {
        const ts = Date.now(); // cache-bust to bypass LiteSpeed cache
        const prodRes = await fetch(`${API_BASE_URL}/products.php?_=${ts}`);
        if (prodRes.ok) this.products = await prodRes.json();
        
        const catRes = await fetch(`${API_BASE_URL}/categories.php?_=${ts}`);
        if (catRes.ok) this.categories = await catRes.json();

        const brandRes = await fetch(`${API_BASE_URL}/brands.php?_=${ts}`);
        if (brandRes.ok) this.brands = await brandRes.json();

        const ordRes = await fetch(`${API_BASE_URL}/orders.php?_=${ts}`);
        if (ordRes.ok) this.orders = await ordRes.json();
      } catch (err) {
        console.error("Backend fetch error:", err);
      }
      window.hideGlobalLoader();
    } else {
      // Load mock products
      try {
        const savedProducts = localStorage.getItem('kamal_products');
        if (savedProducts) {
          this.products = JSON.parse(savedProducts);
        } else {
          localStorage.setItem('kamal_products', JSON.stringify(this.products));
        }
      } catch(e) {}
      
      // Load mock orders
      try {
        const savedOrders = localStorage.getItem('kamal_orders');
        if (savedOrders) {
          this.orders = JSON.parse(savedOrders);
        } else {
          this.orders = [];
          localStorage.setItem('kamal_orders', JSON.stringify(this.orders));
        }
      } catch(e) {
        this.orders = [];
      }
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

const getGlobalSkeletonHTML = () => {
  const cards = Array(6).fill(`
    <div class="bg-white rounded-[16px] overflow-hidden soft-shadow flex flex-col h-full animate-pulse">
      <div class="aspect-[4/3] bg-gray-200"></div>
      <div class="p-5 flex-1 flex flex-col gap-3">
        <div class="h-4 bg-gray-200 rounded w-1/4"></div>
        <div class="h-6 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div class="mt-auto flex justify-between items-center">
          <div class="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-pulse">
        <div>
          <div class="h-10 bg-gray-200 rounded w-64 mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
      
      <div class="flex gap-8">
        <aside class="hidden md:block w-64 flex-shrink-0 animate-pulse space-y-8">
          <div>
            <div class="h-6 bg-gray-200 rounded w-24 mb-4"></div>
            <div class="space-y-3">
              <div class="h-4 bg-gray-200 rounded w-full"></div>
              <div class="h-4 bg-gray-200 rounded w-5/6"></div>
              <div class="h-4 bg-gray-200 rounded w-4/5"></div>
              <div class="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
          <div>
            <div class="h-6 bg-gray-200 rounded w-24 mb-4"></div>
            <div class="space-y-3">
              <div class="h-4 bg-gray-200 rounded w-11/12"></div>
              <div class="h-4 bg-gray-200 rounded w-4/5"></div>
              <div class="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </aside>
        <div class="flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${cards}
          </div>
        </div>
      </div>
    </div>
  `;
};

// Single Page Application (SPA) Transition Router
async function navigateTo(url, pushState = true) {
  const main = document.querySelector('main');
  if (!main) return;

  // Show skeleton instantly
  main.innerHTML = getGlobalSkeletonHTML();
  main.style.opacity = '1';
  main.style.transition = 'none';

  // Wait a tiny bit for the DOM to paint the skeleton before fetching
  await new Promise(resolve => setTimeout(resolve, 50));

  await performNavigation(url, main, pushState);
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
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          main.parentNode.replaceChild(newMain, main);
          updateActiveNavLink(url);
          window.Alpine.initTree(newMain);
          createIcons({
            icons: { ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye, Edit2, Trash2, Construction, CreditCard, Printer, DollarSign, TrendingUp, AlertCircle, Users, LayoutDashboard, List, Tag, Settings, Home, ShoppingBag, Sun, FileText, Info, Filter }
          });
        });
      } else {
        newMain.style.opacity = '0';
        main.parentNode.replaceChild(newMain, main);
        updateActiveNavLink(url);
        window.Alpine.initTree(newMain);
        createIcons({
          icons: { ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye, Edit2, Trash2, Construction, CreditCard, Printer, DollarSign, TrendingUp, AlertCircle, Users, LayoutDashboard, List, Tag, Settings, Home, ShoppingBag, Sun, FileText, Info, Filter }
        });
        requestAnimationFrame(() => {
          newMain.style.transition = 'opacity 150ms ease';
          newMain.style.opacity = '1';
        });
      }

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

    // Force hard navigation if switching between admin and public pages
    const isCurrentAdmin = currentUrl.pathname.includes('admin');
    const isTargetAdmin = targetUrl.pathname.includes('admin');
    if (isCurrentAdmin !== isTargetAdmin) {
      return;
    }

    // Force hard navigation if link has data-no-route attribute
    if (link.hasAttribute('data-no-route')) {
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
      ShoppingCart, Search, Menu, X, User, Heart, ChevronRight, ChevronLeft, ChevronDown, Star, Check, ShieldCheck, Truck, ArrowRight, Package, MapPin, LogOut, PackageX, Plus, Loader2, Phone, Mail, Clock, Eye, Edit2, Trash2, Construction, CreditCard, Printer, DollarSign, TrendingUp, AlertCircle, Users, LayoutDashboard, List, Tag, Settings, Home, ShoppingBag, Sun, FileText, Info, Filter
    }
  });
});

