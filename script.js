// Wait for DOM to load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Jayakirana Store: DOM Loaded");

  AOS.init({ duration: 800, once: true });

  // === HERO SLIDER ===
  let slideIndex = 0;
  const slides = document.querySelectorAll('.slide');
  function showSlide(n) {
    slides.forEach(s => s.classList.remove('active'));
    slideIndex = (n + slides.length) % slides.length;
    slides[slideIndex].classList.add('active');
  }
  function changeSlide(n) { showSlide(slideIndex + n); }
  setInterval(() => changeSlide(1), 5000);
  showSlide(0);

  // === QUICK CAROUSEL ===
  let quickProducts = [];
  const quickCarousel = document.getElementById('quickCarousel');
  let carouselIndex = 0;

  function renderQuickCarousel(items) {
    quickProducts = items.filter(p => p.quick);
    if (quickProducts.length === 0) {
      quickCarousel.innerHTML = '<p style="color:#fff; text-align:center;">No quick items</p>';
      return;
    }
    quickCarousel.innerHTML = quickProducts.map(p => productCard(p)).join('');
    updateCarousel();
  }

  function updateCarousel() {
    const width = quickCarousel.children[0]?.offsetWidth || 250;
    quickCarousel.style.transform = `translateX(-${carouselIndex * (width + 16)}px)`;
  }

  document.querySelector('.carousel-prev').onclick = () => {
    carouselIndex = (carouselIndex - 1 + quickProducts.length) % quickProducts.length;
    updateCarousel();
  };
  document.querySelector('.carousel-next').onclick = () => {
    carouselIndex = (carouselIndex + 1) % quickProducts.length;
    updateCarousel();
  };

  // === PRODUCTS ===
  const productsGrid = document.getElementById('products');
  let allProducts = [];

  fetch('products.json')
    .then(r => {
      if (!r.ok) throw new Error("products.json not found!");
      return r.json();
    })
    .then(data => {
      console.log("Products loaded:", data);
      allProducts = data;
      renderProducts(allProducts);
      renderQuickCarousel(allProducts);
    })
    .catch(err => {
      console.error("ERROR:", err);
      productsGrid.innerHTML = `<p style="color:red; text-align:center;">ERROR: ${err.message}</p>`;
    });

  function renderProducts(list) {
    if (list.length === 0) {
      productsGrid.innerHTML = '<p style="text-align:center; color:#777;">No products found.</p>';
      return;
    }
    productsGrid.innerHTML = list.map(p => productCard(p)).join('');
  }

  function productCard(p) {
    const quickBadge = p.quick ? `<span class="quick-badge">QUICK</span>` : '';
    const branches = Object.entries(p.branches).map(([b, d]) => {
      const icon = d.available 
        ? `<span style="color:#27ae60;">Available</span>` 
        : `<span style="color:#e74c3c;">Not available</span>`;
      const qty = d.qty > 0 ? ` (${d.qty})` : '';
      return `<p class="branch-avail"><strong>${formatBranch(b)}</strong>: ${icon}${qty}</p>`;
    }).join('');

    return `
      <div class="card">
        ${quickBadge}
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
        <div class="branch-list">${branches}</div>
      </div>
    `;
  }

  function formatBranch(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // === CATEGORY FILTER ===
  document.querySelectorAll('.categories button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.categories button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category === cat);
      renderProducts(filtered);
    });
  });

  // === SEARCH BAR (NOW WORKING!) ===
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      if (term === '') {
        renderProducts(allProducts);
        return;
      }
      const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
      renderProducts(filtered);
    });
  } else {
    console.error("Search input not found!");
  }

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
});
