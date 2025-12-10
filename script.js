(function () {  
  const galleryEl = document.getElementById('gallery');  
  const resultsCountEl = document.getElementById('results-count');  
  const yearEl = document.getElementById('year');  
  const searchEl = document.getElementById('search');  
  const countryEl = document.getElementById('filter-country');  
  const yearFilterEl = document.getElementById('filter-year');  
  const themeEl = document.getElementById('filter-theme');  
  const sortEl = document.getElementById('sort-by');  
  const showFavEl = document.getElementById('show-favorites');  
  const clearBtn = document.getElementById('clear-filters');  
  const themeToggleEl = document.getElementById('theme-toggle');  
  
  const modalEl = document.getElementById('modal');  
  const modalCloseEl = document.getElementById('modal-close');  
  const modalBackdropEl = document.getElementById('modal-backdrop');  
  const modalImageEl = document.getElementById('modal-image');  
  const modalTitleEl = document.getElementById('modal-title');  
  const modalFavEl = document.getElementById('modal-fav');  
  const detailCountryEl = document.getElementById('detail-country');  
  const detailYearEl = document.getElementById('detail-year');  
  const detailThemeEl = document.getElementById('detail-theme');  
  const detailCatalogEl = document.getElementById('detail-catalog');  
  const detailFaceEl = document.getElementById('detail-face');  
  const detailConditionEl = document.getElementById('detail-condition');  
  const detailTagsEl = document.getElementById('detail-tags');  
  const detailDescriptionEl = document.getElementById('detail-description');  
  
  const state = {  
    stamps: [],  
    filtered: [],  
    favorites: new Set(),  
    currentStamp: null  
  };  
  
  const FAVORITES_KEY = 'stampFavorites';  
  const THEME_KEY = 'stampTheme';  
  
  function loadFavorites() {  
    try {  
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');  
      state.favorites = new Set(saved);  
    } catch { state.favorites = new Set(); }  
  }  
  
  function saveFavorites() {  
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(state.favorites)));  
  }  
  
  function loadTheme() {  
    const saved = localStorage.getItem(THEME_KEY);  
    if (saved) {  
      document.documentElement.setAttribute('data-theme', saved);  
      themeToggleEl.checked = saved === 'dark';  
    } else {  
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;  
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');  
      themeToggleEl.checked = prefersDark;  
    }  
  }  
  
  function saveTheme() {  
    const theme = themeToggleEl.checked ? 'dark' : 'light';  
    document.documentElement.setAttribute('data-theme', theme);  
    localStorage.setItem(THEME_KEY, theme);  
  }  
  
  function fetchStamps() {  
    return fetch('data/stamps.json', { cache: 'no-store' })  
      .then(r => r.json())  
      .then(data => {  
        state.stamps = data.map(s => normalizeStamp(s));  
      });  
  }  
  
  function normalizeStamp(s) {  
    return {  
      id: s.id || cryptoRandomId(),  
      title: s.title || 'Untitled',  
      country: s.country || 'Unknown',  
      year: +s.year || null,  
      theme: Array.isArray(s.theme) ? s.theme : (s.theme ? [s.theme] : []),  
      catalogNumber: s.catalogNumber || '',  
      faceValue: s.faceValue || '',  
      condition: s.condition || '',  
      description: s.description || '',  
      tags: Array.isArray(s.tags) ? s.tags : (s.tags ? [s.tags] : []),  
      image: s.image || { thumb: '', full: '' }  
    };  
  }  
  
  function cryptoRandomId() {  
    if (window.crypto?.getRandomValues) {  
      const arr = new Uint32Array(2);  
      window.crypto.getRandomValues(arr);  
      return `id-${arr[0].toString(16)}-${arr[1].toString(16)}`;  
    }  
    return 'id-' + Math.random().toString(36).slice(2);  
  }  
  
  function populateFilters() {  
    const countries = Array.from(new Set(state.stamps.map(s => s.country))).sort((a, b) => a.localeCompare(b));  
    const years = Array.from(new Set(state.stamps.map(s => s.year).filter(Boolean))).sort((a, b) => b - a);  
    const themes = Array.from(new Set(state.stamps.flatMap(s => s.theme))).sort((a, b) => a.localeCompare(b));  
  
    addOptions(countryEl, countries);  
    addOptions(yearFilterEl, years);  
    addOptions(themeEl, themes);  
  }  
  
  function addOptions(selectEl, list) {  
    const frag = document.createDocumentFragment();  
    list.forEach(val => {  
      const opt = document.createElement('option');  
      opt.value = String(val);  
      opt.textContent = String(val);  
      frag.appendChild(opt);  
    });  
    selectEl.appendChild(frag);  
  }  
  
  function applyFilters() {  
    const query = searchEl.value.trim().toLowerCase();  
    const country = countryEl.value;  
    const year = yearFilterEl.value;  
    const theme = themeEl.value;  
    const favoritesOnly = showFavEl.checked;  
  
    let res = state.stamps.filter(s => {  
      const matchesQuery = !query ||  
        s.title.toLowerCase().includes(query) ||  
        s.country.toLowerCase().includes(query) ||  
        s.tags.some(t => t.toLowerCase().includes(query)) ||  
        s.theme.some(t => t.toLowerCase().includes(query)) ||  
        (s.catalogNumber && s.catalogNumber.toLowerCase().includes(query));  
      const matchesCountry = country === 'all' || s.country === country;  
      const matchesYear = year === 'all' || String(s.year) === year;  
      const matchesTheme = theme === 'all' || s.theme.includes(theme);  
      const matchesFav = !favoritesOnly || state.favorites.has(s.id);  
      return matchesQuery && matchesCountry && matchesYear && matchesTheme && matchesFav;  
    });  
  
    const sortBy = sortEl.value;  
    res.sort((a, b) => {  
      switch (sortBy) {  
        case 'year-desc': return (b.year || 0) - (a.year || 0);  
        case 'year-asc': return (a.year || 0) - (b.year || 0);  
        case 'country-asc': return a.country.localeCompare(b.country) || a.title.localeCompare(b.title);  
        case 'title-asc': return a.title.localeCompare(b.title);  
        default: return 0;  
      }  
    });  
  
    state.filtered = res;  
    resultsCountEl.textContent = `${res.length} stamp${res.length === 1 ? '' : 's'} ${query || country !== 'all' || year !== 'all' || theme !== 'all' || favoritesOnly ? 'matching filters' : 'in collection'}.`;  
    renderGallery();  
  }  
  
  function renderGallery() {  
    galleryEl.innerHTML = '';  
    const frag = document.createDocumentFragment();  
  
    state.filtered.forEach(stamp => {  
      const card = createCard(stamp);  
      frag.appendChild(card);  
    });  
  
    galleryEl.appendChild(frag);  
  }  
  
  function createCard(stamp) {  
    const article = document.createElement('article');  
    article.className = 'card';  
    article.setAttribute('role', 'listitem');  
  
    // Image  
    const imgWrap = document.createElement('div');  
    imgWrap.className = 'card-image-wrap';  
  
    const img = document.createElement('img');  
    img.className = 'card-image';  
    img.loading = 'lazy';  
    img.src = stamp.image.thumb || stamp.image.full || 'https://placehold.co/400x500?text=Stamp';  
    img.alt = `${stamp.title} (${stamp.country}${stamp.year ? ', ' + stamp.year : ''})`;  
    imgWrap.appendChild(img);  
  
    // Body  
    const body = document.createElement('div');  
    body.className = 'card-body';  
  
    const title = document.createElement('h3');  
    title.className = 'card-title';  
    title.textContent = stamp.title;  
  
    const meta = document.createElement('div');  
    meta.className = 'card-meta';  
    meta.textContent = `${stamp.country}${stamp.year ? ' • ' + stamp.year : ''}`;  
  
    const tags = document.createElement('div');  
    tags.className = 'tag-list';  
    stamp.theme.slice(0, 3).forEach(t => {  
      const tag = document.createElement('span');  
      tag.className = 'tag';  
      tag.textContent = t;  
      tags.appendChild(tag);  
    });  
  
    body.appendChild(title);  
    body.appendChild(meta);  
    if (stamp.theme.length) body.appendChild(tags);  
  
    const actions = document.createElement('div');  
    actions.className = 'card-actions';  
  
    const fav = document.createElement('button');  
    fav.className = 'fav-btn';  
    fav.type = 'button';  
    fav.setAttribute('aria-pressed', state.favorites.has(stamp.id) ? 'true' : 'false');  
    fav.textContent = state.favorites.has(stamp.id) ? '★ Favorite' : '☆ Add favorite';  
    fav.addEventListener('click', (e) => {  
      e.stopPropagation();  
      toggleFavorite(stamp.id, fav);  
    });  
  
    const view = document.createElement('button');  
    view.className = 'view-btn';  
    view.type = 'button';  
    view.textContent = 'View details';  
    view.addEventListener('click', (e) => {  
      e.stopPropagation();  
      openModal(stamp);  
    });  
  
    actions.appendChild(fav);  
    actions.appendChild(view);  
  
    article.appendChild(imgWrap);  
    article.appendChild(body);  
    article.appendChild(actions);  
  
    // Card click also opens modal  
    article.addEventListener('click', () => openModal(stamp));  
  
    return article;  
  }  
  
  function toggleFavorite(id, buttonEl) {  
    if (state.favorites.has(id)) {  
      state.favorites.delete(id);  
    } else {  
      state.favorites.add(id);  
    }  
    saveFavorites();  
    if (buttonEl) {  
      const pressed = state.favorites.has(id);  
      buttonEl.setAttribute('aria-pressed', pressed ? 'true' : 'false');  
      buttonEl.textContent = pressed ? '★ Favorite' : '☆ Add favorite';  
    }  
    // Update modal fav state if applicable  
    if (state.currentStamp?.id === id) {  
      updateModalFavButton();  
    }  
    // If filtering by favorites, re-apply filters  
    if (showFavEl.checked) applyFilters();  
  }  
  
  function openModal(stamp) {  
    state.currentStamp = stamp;  
    modalImageEl.src = stamp.image.full || stamp.image.thumb || 'https://placehold.co/800x1000?text=Stamp';  
    modalImageEl.alt = `${stamp.title} full image`;  
    modalTitleEl.textContent = stamp.title;  
    detailCountryEl.textContent = stamp.country || '—';  
    detailYearEl.textContent = stamp.year || '—';  
    detailThemeEl.textContent = stamp.theme && stamp.theme.length ? stamp.theme.join(', ') : '—';  
    detailCatalogEl.textContent = stamp.catalogNumber || '—';  
    detailFaceEl.textContent = stamp.faceValue || '—';  
    detailConditionEl.textContent = stamp.condition || '—';  
    detailTagsEl.textContent = stamp.tags && stamp.tags.length ? stamp.tags.join(', ') : '—';  
    detailDescriptionEl.textContent = stamp.description || '—';  
    updateModalFavButton();  
  
    modalEl.setAttribute('aria-hidden', 'false');  
    // Focus management  
    modalCloseEl.focus();  
    document.addEventListener('keydown', handleEscapeClose);  
    modalBackdropEl.addEventListener('click', closeModal);  
    modalCloseEl.addEventListener('click', closeModal);  
    modalFavEl.addEventListener('click', () => toggleFavorite(stamp.id));  
  }  
  
  function updateModalFavButton() {  
    const pressed = state.currentStamp && state.favorites.has(state.currentStamp.id);  
    modalFavEl.setAttribute('aria-pressed', pressed ? 'true' : 'false');  
    modalFavEl.textContent = pressed ? '★ Remove favorite' : '☆ Add to favorites';  
  }  
  
  function closeModal() {  
    modalEl.setAttribute('aria-hidden', 'true');  
    document.removeEventListener('keydown', handleEscapeClose);  
    modalBackdropEl.removeEventListener('click', closeModal);  
    modalCloseEl.removeEventListener('click', closeModal);  
    modalFavEl.removeEventListener('click', () => {});  
    state.currentStamp = null;  
  }  
  
  function handleEscapeClose(e) {  
    if (e.key === 'Escape') closeModal();  
  }  
  
  function debounce(fn, delay = 250) {  
    let t;  
    return (...args) => {  
      clearTimeout(t);  
      t = setTimeout(() => fn(...args), delay);  
    };  
  }  
  
  function clearFilters() {  
    searchEl.value = '';  
    countryEl.value = 'all';  
    yearFilterEl.value = 'all';  
    themeEl.value = 'all';  
    sortEl.value = 'year-desc';  
    showFavEl.checked = false;  
    applyFilters();  
    searchEl.focus();  
  }  
  
  function initEvents() {  
    searchEl.addEventListener('input', debounce(applyFilters, 200));  
    countryEl.addEventListener('change', applyFilters);  
    yearFilterEl.addEventListener('change', applyFilters);  
    themeEl.addEventListener('change', applyFilters);  
    sortEl.addEventListener('change', applyFilters);  
    showFavEl.addEventListener('change', applyFilters);  
    clearBtn.addEventListener('click', clearFilters);  
    themeToggleEl.addEventListener('change', saveTheme);  
  }  
  
  async function init() {  
    yearEl.textContent = new Date().getFullYear();  
    loadFavorites();  
    loadTheme();  
    await fetchStamps();  
    populateFilters();  
    applyFilters();  
    initEvents();  
  }  
  
  init();  
})();  