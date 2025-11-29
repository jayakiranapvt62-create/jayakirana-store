// Wait for DOM ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("Jayakirana Store Loaded");

  AOS.init({ duration: 800, once: true });

  // Global products
  let allProducts = [];

  // === HERO SLIDER ===
  let slideIndex = 0;
  const slides = document.querySelectorAll('.slide');
  function showSlide(n) {
    slides.forEach(s => s.classList.remove('active'));
    slideIndex = (n + slides.length) % slides.length;
    slides[slideIndex].classList.add('active');
  }
  window.changeSlide = function(n) { showSlide(slideIndex + n); };
  setInterval(() => changeSlide(1), 5000);
  showSlide(0);

  // === LOAD PRODUCTS ===
  const productsGrid = document.getElementById('products');
  const quickCarousel = document.getElementById('quickCarousel');
  fetch('products.json')
    .then(r => {
      if (!r.ok) throw new Error(`products.json not found! (Status: ${r.status})`);
      return r.json();
    })
    .then(data => {
      console.log("Products loaded:", data);
      allProducts = data;
      renderProducts(allProducts);
      renderQuickCarousel(allProducts);
      initSearchSuggestions(allProducts);
    })
    .catch(err => {
      console.error("ERROR:", err);
      productsGrid.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">ERROR: ${err.message}<br>Upload products.json to fix!</p>`;
    });

  // === RENDER PRODUCTS ===
  function renderProducts(list) {
    if (list.length === 0) {
      productsGrid.innerHTML = '<p style="text-align:center; color:#777; padding:2rem;">No products found.</p>';
      return;
    }
    productsGrid.innerHTML = list.map(p => `
      <div class="card" onclick="showProductDetail(${p.id})">
        ${p.quick ? '<span class="quick-badge">QUICK</span>' : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x180?text=${encodeURIComponent(p.name)}'">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
        <div class="branch-list">
          ${Object.entries(p.branches).map(([b, d]) => {
            const status = d.available ? 'Available' : 'Not available';
            const color = d.available ? '#27ae60' : '#e74c3c';
            const qty = d.qty > 0 ? ` (${d.qty})` : '';
            return `<p class="branch-avail"><strong>${formatBranch(b)}:</strong> <span style="color:${color};">${status}</span>${qty}</p>`;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  // === QUICK CAROUSEL (FIXED) ===
  let carouselIndex = 0;
  function renderQuickCarousel(items) {
    const quickItems = items.filter(p => p.quick);
    if (quickItems.length === 0) {
      quickCarousel.innerHTML = '<p style="color:#fff; text-align:center; padding:2rem;">No quick movement items right now.</p>';
      return;
    }
    quickCarousel.innerHTML = quickItems.map(p => `
      <div class="card" style="min-width:250px;" onclick="showProductDetail(${p.id})">
        ${p.quick ? '<span class="quick-badge">QUICK</span>' : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x180?text=${encodeURIComponent(p.name)}'">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
        <p class="qty">In Stock</p>
      </div>
    `).join('');
    
    // Auto-scroll every 3s
    setInterval(() => {
      carouselIndex = (carouselIndex + 1) % quickItems.length;
      updateCarousel(quickItems.length);
    }, 3000);

    // Manual nav
    document.querySelector('.carousel-prev').onclick = () => {
      carouselIndex = (carouselIndex - 1 + quickItems.length) % quickItems.length;
      updateCarousel(quickItems.length);
    };
    document.querySelector('.carousel-next').onclick = () => {
      carouselIndex = (carouselIndex + 1) % quickItems.length;
      updateCarousel(quickItems.length);
    };
  }

  function updateCarousel(numItems) {
    const cardWidth = 250 + 16; // width + gap
    quickCarousel.style.transform = `translateX(-${carouselIndex * cardWidth}px)`;
  }

  // === SEARCH SUGGESTIONS ===
  function initSearchSuggestions(products) {
    const searchInput = document.getElementById('searchInput');
    const suggestions = document.getElementById('searchSuggestions');
    let suggestionIndex = -1;

    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      suggestions.innerHTML = '';
      suggestionIndex = -1;

      if (term === '') {
        suggestions.classList.remove('show');
        renderProducts(allProducts);
        return;
      }

      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
      );

      if (filtered.length > 0) {
        suggestions.innerHTML = filtered.slice(0, 5).map((p, idx) => 
          `<div class="suggestion-item" onclick="selectSuggestion('${p.name}')">${p.name} <span style="color:#7f8c8d;">(${p.category})</span></div>`
        ).join('');
        suggestions.classList.add('show');
      } else {
        suggestions.classList.remove('show');
      }

      renderProducts(filtered);
    });

    // Keyboard nav
    searchInput.addEventListener('keydown', (e) => {
      const items = suggestions.querySelectorAll('.suggestion-item');
      if (e.key === 'ArrowDown') {
        suggestionIndex = Math.min(suggestionIndex + 1, items.length - 1);
        updateSuggestionHighlight(items);
      } else if (e.key === 'ArrowUp') {
        suggestionIndex = Math.max(suggestionIndex - 1, -1);
        updateSuggestionHighlight(items);
      } else if (e.key === 'Enter' && suggestionIndex >= 0) {
        e.preventDefault();
        selectSuggestion(items[suggestionIndex].textContent.trim().split(' (')[0]);
      }
    });

    function updateSuggestionHighlight(items) {
      items.forEach((item, idx) => item.classList.toggle('active', idx === suggestionIndex));
    }

    function selectSuggestion(name) {
      searchInput.value = name;
      suggestions.classList.remove('show');
      const filtered = allProducts.filter(p => p.name.toLowerCase() === name.toLowerCase());
      renderProducts(filtered);
    }

    // Hide on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.classList.remove('show');
      }
    });
  }

  // === CATEGORY FILTER ===
  document.querySelectorAll('.categories button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.categories button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
      renderProducts(filtered);
      document.getElementById('searchInput').value = ''; // Clear search
      document.getElementById('searchSuggestions').classList.remove('show');
    });
  });

  // === CONTACT FORM ===
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const msg = document.getElementById('formMsg');
      msg.textContent = 'Sending...';
      setTimeout(() => {
        msg.style.color = '#27ae60';
        msg.textContent = 'Thank you! We’ll contact you soon.';
        form.reset();
      }, 1000);
    });
  }

  // === HELPER ===
  function formatBranch(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
});

// === PRODUCT DETAIL MODAL (New Page Simulation) ===
function showProductDetail(id) {
  const product = window.allProducts.find(p => p.id === id);
  if (!product) return;

  // Replace body with detail view (simple SPA)
  document.body.innerHTML = `
    <style>
      body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; }
      .product-detail { padding: 2rem; max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      .detail-header { display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; }
      .product-img { width: 100%; max-width: 400px; height: 300px; object-fit: cover; border-radius: 8px; }
      .detail-content h1 { font-size: 2rem; color: #2c3e50; }
      .detail-price { font-size: 1.5rem; color: #e74c3c; font-weight: bold; }
      .detail-desc { margin: 1rem 0; color: #555; }
      .branch-detail { margin: 1rem 0; }
      .branch-item { display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0; }
      .branch-available { color: #27ae60; font-weight: bold; } .branch-unavailable { color: #e74c3c; font-weight: bold; }
      .order-btn { background: #25D366; color: #fff; padding: 1rem 2rem; border: none; border-radius: 25px; font-size: 1.1rem; cursor: pointer; margin-top: 1rem; }
      .order-btn:hover { background: #128C7E; }
      .back-btn { background: #7f8c8d; color: #fff; padding: 0.5rem 1rem; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 1rem; }
    </style>
    <div class="product-detail">
      <button class="back-btn" onclick="history.back()">← Back to Store</button>
      <div class="detail-header">
        <img class="product-img" src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}'">
        <div class="detail-content">
          <h1>${product.name}</h1>
          <p class="detail-price">₹${product.price}</p>
          <p class="detail-desc">${product.description}</p>
          <div class="branch-detail">
            <h3>Availability:</h3>
            ${Object.entries(product.branches).map(([b, d]) => {
              const icon = d.available ? '✅' : '❌';
              const status = d.available ? 'Available' : 'Not available';
              const colorClass = d.available ? 'branch-available' : 'branch-unavailable';
              const qty = d.qty > 0 ? ` (${d.qty} left)` : '';
              return `<div class="branch-item"><strong>${formatBranch(b)}:</strong> ${icon} <span class="${colorClass}">${status}${qty}</span></div>`;
            }).join('')}
          </div>
          <button class="order-btn" onclick="orderViaWhatsApp(${product.id})">Order via WhatsApp</button>
        </div>
      </div>
    </div>
    <script>
      function formatBranch(name) { return name.charAt(0).toUpperCase() + name.slice(1); }
      function orderViaWhatsApp(id) {
        const product = window.allProducts.find(p => p.id === id);
        const msg = `Hi! I want to order: ${product.name} (₹${product.price})`;
        window.open('https://wa.me/94771095638?text=' + encodeURIComponent(msg), '_blank');
      }
    </script>
  `;
}

function selectSuggestion(name) {
  // Trigger detail view
  const product = window.allProducts.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (product) showProductDetail(product.id);
}
