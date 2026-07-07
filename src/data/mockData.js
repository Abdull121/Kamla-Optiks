export const categories = [
  { id: 1, name: 'Prescription Glasses', slug: 'prescription-glasses' },
  { id: 2, name: 'Computer Glasses', slug: 'computer-glasses' },
  { id: 3, name: 'Blue Light Glasses', slug: 'blue-light-glasses' },
  { id: 4, name: 'Sunglasses', slug: 'sunglasses' },
  { id: 5, name: 'Reading Glasses', slug: 'reading-glasses' },
  { id: 6, name: 'Contact Lenses', slug: 'contact-lenses' },
  { id: 7, name: 'Frames', slug: 'frames' },
  { id: 8, name: 'Accessories', slug: 'accessories' },
  { id: 9, name: 'Kids Glasses', slug: 'kids-glasses' },
  { id: 10, name: 'Sports Eyewear', slug: 'sports-eyewear' },
];

export const brands = [
  { id: 1, name: 'Kamal Exclusives', slug: 'kamal-exclusives' },
  { id: 2, name: 'Ray-Ban', slug: 'ray-ban' },
  { id: 3, name: 'Gentle Monster', slug: 'gentle-monster' },
  { id: 4, name: 'Oakley', slug: 'oakley' },
  { id: 5, name: 'Tom Ford', slug: 'tom-ford' }
];

const generateProducts = () => Array.from({ length: 50 }).map((_, i) => {
  const categoryId = Math.floor(Math.random() * 8) + 1;
  const brandId = Math.floor(Math.random() * 5) + 1;
  const price = (Math.floor(Math.random() * 300) + 50) * 280;
  const isNew = Math.random() > 0.8;
  const isBestseller = Math.random() > 0.8;
  
  return {
    id: i + 1,
    name: `Premium Frame Model ${i + 1}`,
    slug: `premium-frame-model-${i + 1}`,
    description: `A luxurious and modern eyewear piece perfect for everyday use. Designed with precision and premium materials.`,
    price: price,
    discountPrice: Math.random() > 0.7 ? Math.round(price * 0.8) : null,
    deliveryCharges: 250,
    categoryId: categoryId,
    categoryName: categories.find(c => c.id === categoryId)?.name,
    brandId: brandId,
    brandName: brands.find(b => b.id === brandId)?.name,
    image: `https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80`,
    images: [
      `https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80`,
      `https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80`,
      `https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=800&q=80`
    ],
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
    reviewsCount: Math.floor(Math.random() * 200),
    isNew,
    isBestseller,
    colors: ['Black', 'Tortoise', 'Clear'],
    sizes: ['Small', 'Medium', 'Large'],
    material: 'Acetate',
    shape: ['Square', 'Round', 'Aviator'][Math.floor(Math.random() * 3)],
    gender: ['Unisex', 'Men', 'Women'][Math.floor(Math.random() * 3)],
    inStock: true,
    stockQuantity: Math.floor(Math.random() * 50) + 10
  };
});

let loadedProducts = [];
try {
  const saved = localStorage.getItem('kamal_products');
  if (saved) {
    loadedProducts = JSON.parse(saved);
  } else {
    loadedProducts = generateProducts();
    localStorage.setItem('kamal_products', JSON.stringify(loadedProducts));
  }
} catch(e) {
  loadedProducts = generateProducts();
}

export const products = loadedProducts;
