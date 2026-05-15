/* ============================================================
   RecipeBox — Application logic
   ------------------------------------------------------------
   Core capabilities:
   1. DOM manipulation (createElement, querySelector, etc.)
   2. Dynamic content & style modification
   3. AJAX requests (fetch) against TheMealDB API
   4. Persistence via localStorage and sessionStorage
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   1) GLOBAL APPLICATION STATE
------------------------------------------------------------ */
const state = {
  currentView: 'home',
  currentRecipes: [],
  currentRecipe: null,
};

/* ------------------------------------------------------------
   2) API SERVICE — All AJAX requests (fetch)
   Documentation: https://www.themealdb.com/api.php
------------------------------------------------------------ */
const API = {
  BASE_URL: 'https://www.themealdb.com/api/json/v1/1',

  /** Search recipes by name. */
  async searchByName(name) {
    const res = await fetch(`${this.BASE_URL}/search.php?s=${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.meals || [];
  },

  /** Full recipe details by ID. */
  async lookupById(id) {
    const res = await fetch(`${this.BASE_URL}/lookup.php?i=${id}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.meals ? data.meals[0] : null;
  },

  /** A random recipe. */
  async getRandom() {
    const res = await fetch(`${this.BASE_URL}/random.php`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.meals ? data.meals[0] : null;
  },

  /** List of all available categories. */
  async getCategories() {
    const res = await fetch(`${this.BASE_URL}/categories.php`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.categories || [];
  },

  /** Recipes filtered by category. */
  async filterByCategory(category) {
    const res = await fetch(`${this.BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.meals || [];
  },

  /** List of all available cuisines/areas. */
  async getAreas() {
    const res = await fetch(`${this.BASE_URL}/list.php?a=list`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.meals || [];
  },

  /** Recipes filtered by cuisine/area. */
  async filterByArea(area) {
    const res = await fetch(`${this.BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.meals || [];
  },
};

/* ------------------------------------------------------------
   3) STORAGE SERVICE — localStorage & sessionStorage
   - localStorage  : favorites, shopping list, theme (persistent)
   - sessionStorage: search history, recently viewed (session only)
------------------------------------------------------------ */
const Storage = {
  // localStorage keys
  KEY_FAVORITES: 'recipebox_favorites',
  KEY_SHOPPING: 'recipebox_shopping',
  KEY_THEME: 'recipebox_theme',
  // sessionStorage keys
  KEY_HISTORY: 'recipebox_search_history',
  KEY_RECENT: 'recipebox_recently_viewed',

  /* ----- FAVORITES (localStorage) ----- */
  getFavorites() {
    return JSON.parse(localStorage.getItem(this.KEY_FAVORITES)) || [];
  },
  isFavorite(id) {
    return this.getFavorites().some((r) => r.idMeal === id);
  },
  toggleFavorite(recipe) {
    const favorites = this.getFavorites();
    const index = favorites.findIndex((r) => r.idMeal === recipe.idMeal);
    if (index >= 0) {
      favorites.splice(index, 1);
      localStorage.setItem(this.KEY_FAVORITES, JSON.stringify(favorites));
      return false; // removed
    } else {
      // Store only the useful fields (saves space)
      favorites.push({
        idMeal: recipe.idMeal,
        strMeal: recipe.strMeal,
        strMealThumb: recipe.strMealThumb,
        strCategory: recipe.strCategory,
        strArea: recipe.strArea,
      });
      localStorage.setItem(this.KEY_FAVORITES, JSON.stringify(favorites));
      return true; // added
    }
  },

  /* ----- SHOPPING LIST (localStorage) ----- */
  getShoppingList() {
    return JSON.parse(localStorage.getItem(this.KEY_SHOPPING)) || [];
  },
  addToShoppingList(items) {
    const list = this.getShoppingList();
    items.forEach((item) => {
      // Avoid exact duplicates
      if (!list.some((i) => i.text === item.text && i.source === item.source)) {
        list.push({ ...item, id: Date.now() + Math.random(), checked: false });
      }
    });
    localStorage.setItem(this.KEY_SHOPPING, JSON.stringify(list));
  },
  toggleShoppingItem(id) {
    const list = this.getShoppingList();
    const item = list.find((i) => i.id === id);
    if (item) {
      item.checked = !item.checked;
      localStorage.setItem(this.KEY_SHOPPING, JSON.stringify(list));
    }
  },
  removeShoppingItem(id) {
    const list = this.getShoppingList().filter((i) => i.id !== id);
    localStorage.setItem(this.KEY_SHOPPING, JSON.stringify(list));
  },
  clearShoppingList() {
    localStorage.removeItem(this.KEY_SHOPPING);
  },

  /* ----- THEME (localStorage) ----- */
  getTheme() {
    return localStorage.getItem(this.KEY_THEME) || 'light';
  },
  setTheme(theme) {
    localStorage.setItem(this.KEY_THEME, theme);
  },

  /* ----- SEARCH HISTORY (sessionStorage) ----- */
  getSearchHistory() {
    return JSON.parse(sessionStorage.getItem(this.KEY_HISTORY)) || [];
  },
  addToSearchHistory(query) {
    let history = this.getSearchHistory();
    // Remove if already present, then prepend
    history = history.filter((q) => q.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    history = history.slice(0, 10); // Cap at 10 entries
    sessionStorage.setItem(this.KEY_HISTORY, JSON.stringify(history));
  },
  clearSearchHistory() {
    sessionStorage.removeItem(this.KEY_HISTORY);
  },

  /* ----- RECENTLY VIEWED RECIPES (sessionStorage) ----- */
  getRecentlyViewed() {
    return JSON.parse(sessionStorage.getItem(this.KEY_RECENT)) || [];
  },
  addToRecentlyViewed(recipe) {
    let recent = this.getRecentlyViewed();
    recent = recent.filter((r) => r.idMeal !== recipe.idMeal);
    recent.unshift({
      idMeal: recipe.idMeal,
      strMeal: recipe.strMeal,
      strMealThumb: recipe.strMealThumb,
      strCategory: recipe.strCategory,
      strArea: recipe.strArea,
    });
    recent = recent.slice(0, 8); // Cap at 8 entries
    sessionStorage.setItem(this.KEY_RECENT, JSON.stringify(recent));
  },
};

/* ------------------------------------------------------------
   4) HELPERS / UTILITIES
------------------------------------------------------------ */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/** Show a transient toast message. */
function showToast(message, duration = 2500) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  // Force reflow so the animation triggers
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration);
}

/** Show a loader while requests are in flight. */
function showLoader() {
  $('#main-content').innerHTML = `
    <div class="loader">
      <div class="loader-spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

/** Extract ingredients from a TheMealDB recipe.
 *  The API returns strIngredient1..20 and strMeasure1..20. */
function extractIngredients(recipe) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: (measure || '').trim(),
      });
    }
  }
  return ingredients;
}

/** Update the nav badge counters. */
function updateBadges() {
  $('#badge-favorites').textContent = Storage.getFavorites().length;
  $('#badge-shopping').textContent = Storage.getShoppingList().length;
}

/* ------------------------------------------------------------
   5) RENDERING — Dynamic UI generation (DOM)
------------------------------------------------------------ */
const UI = {
  /** Return the HTML for a recipe card. */
  recipeCardHTML(recipe) {
    const fav = Storage.isFavorite(recipe.idMeal) ? '❤️' : '';
    return `
      <article class="card" data-id="${recipe.idMeal}">
        <img class="card-image" src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy" />
        <div class="card-body">
          <h3 class="card-title">${recipe.strMeal} ${fav}</h3>
          <div class="card-meta">
            ${recipe.strCategory ? `<span class="card-tag">${recipe.strCategory}</span>` : ''}
            ${recipe.strArea ? `<span>${recipe.strArea}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  },

  /** Render a grid of recipe cards. */
  renderRecipesGrid(recipes, emptyMessage = 'No recipes found.') {
    if (!recipes.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🍽️</div>
          <h3>${emptyMessage}</h3>
          <p>Try a different search or browse the categories.</p>
        </div>
      `;
    }
    return `<div class="cards-grid">${recipes.map((r) => this.recipeCardHTML(r)).join('')}</div>`;
  },

  /** View: Home page. */
  async renderHome() {
    const recent = Storage.getRecentlyViewed();
    const history = Storage.getSearchHistory();

    $('#main-content').innerHTML = `
      <section class="hero">
        <h2>🍳 Welcome to RecipeBox</h2>
        <p>Discover thousands of recipes from around the world, save your favorites, and build your shopping list.</p>
        <button class="hero-btn" id="hero-random">🎲 Surprise me</button>
      </section>

      ${recent.length ? `
        <h2 class="section-title">🕐 Recently viewed <small style="font-size:0.8rem;color:var(--text-muted);font-weight:400;">(current session)</small></h2>
        ${this.renderRecipesGrid(recent)}
      ` : `
        <h2 class="section-title">✨ How it works</h2>
        <div class="cards-grid">
          <div class="card" style="cursor:default;padding:1.5rem;">
            <h3 style="color:var(--color-primary);margin-bottom:0.5rem;">🔍 Search</h3>
            <p>Use the search bar to find any recipe by name.</p>
          </div>
          <div class="card" style="cursor:default;padding:1.5rem;">
            <h3 style="color:var(--color-primary);margin-bottom:0.5rem;">📂 Filter</h3>
            <p>Browse recipes by category or regional cuisine.</p>
          </div>
          <div class="card" style="cursor:default;padding:1.5rem;">
            <h3 style="color:var(--color-primary);margin-bottom:0.5rem;">❤️ Save</h3>
            <p>Add your favorite recipes to your favorites (saved permanently).</p>
          </div>
          <div class="card" style="cursor:default;padding:1.5rem;">
            <h3 style="color:var(--color-primary);margin-bottom:0.5rem;">🛒 Cook</h3>
            <p>Auto-generate your shopping list from any recipe.</p>
          </div>
        </div>
      `}

      ${history.length ? `
        <h2 class="section-title" style="margin-top:2rem;">🔎 Recent searches</h2>
        <div class="chips">
          ${history.map((q) => `<button class="chip" data-search="${q}">${q}</button>`).join('')}
        </div>
      ` : ''}
    `;

    // Hero "Surprise me" button
    $('#hero-random')?.addEventListener('click', () => navigateTo('random'));

    // Re-run a search from history
    $$('.chip[data-search]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.search;
        $('#search-input').value = query;
        handleSearch(query);
      });
    });
  },

  /** View: Categories. */
  async renderCategories() {
    showLoader();
    try {
      const categories = await API.getCategories();
      $('#main-content').innerHTML = `
        <h2 class="section-title">📂 Choose a category</h2>
        <div class="cards-grid">
          ${categories
            .map(
              (c) => `
              <article class="card" data-category="${c.strCategory}">
                <img class="card-image" src="${c.strCategoryThumb}" alt="${c.strCategory}" loading="lazy" />
                <div class="card-body">
                  <h3 class="card-title">${c.strCategory}</h3>
                  <p style="font-size:0.85rem;color:var(--text-muted);">
                    ${c.strCategoryDescription.slice(0, 80)}...
                  </p>
                </div>
              </article>`
            )
            .join('')}
        </div>
      `;

      // Click on a category to display its recipes
      $$('.card[data-category]').forEach((card) => {
        card.addEventListener('click', async () => {
          const cat = card.dataset.category;
          showLoader();
          try {
            const recipes = await API.filterByCategory(cat);
            $('#main-content').innerHTML = `
              <h2 class="section-title">📂 ${cat}</h2>
              <button class="btn btn-secondary" id="back-categories" style="margin-bottom:1.5rem;">← All categories</button>
              ${UI.renderRecipesGrid(recipes)}
            `;
            $('#back-categories').addEventListener('click', () => UI.renderCategories());
            attachCardClickHandlers();
          } catch (err) {
            UI.renderError(err);
          }
        });
      });
    } catch (err) {
      UI.renderError(err);
    }
  },

  /** View: Cuisines (areas). */
  async renderAreas() {
    showLoader();
    try {
      const areas = await API.getAreas();
      // Approximate flags for each cuisine
      const flags = {
        American: '🇺🇸', British: '🇬🇧', Canadian: '🇨🇦', Chinese: '🇨🇳',
        Croatian: '🇭🇷', Dutch: '🇳🇱', Egyptian: '🇪🇬', Filipino: '🇵🇭',
        French: '🇫🇷', Greek: '🇬🇷', Indian: '🇮🇳', Irish: '🇮🇪',
        Italian: '🇮🇹', Jamaican: '🇯🇲', Japanese: '🇯🇵', Kenyan: '🇰🇪',
        Malaysian: '🇲🇾', Mexican: '🇲🇽', Moroccan: '🇲🇦', Polish: '🇵🇱',
        Portuguese: '🇵🇹', Russian: '🇷🇺', Spanish: '🇪🇸', Thai: '🇹🇭',
        Tunisian: '🇹🇳', Turkish: '🇹🇷', Vietnamese: '🇻🇳', Ukrainian: '🇺🇦',
      };

      $('#main-content').innerHTML = `
        <h2 class="section-title">🌍 World cuisines</h2>
        <p class="section-subtitle">Pick a regional cuisine to discover its signature recipes.</p>
        <div class="chips">
          ${areas.map((a) => `
            <button class="chip" data-area="${a.strArea}">
              ${flags[a.strArea] || '🌐'} ${a.strArea}
            </button>
          `).join('')}
        </div>
        <div id="area-results"></div>
      `;

      $$('.chip[data-area]').forEach((chip) => {
        chip.addEventListener('click', async () => {
          // Active state
          $$('.chip[data-area]').forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');

          const area = chip.dataset.area;
          $('#area-results').innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';
          try {
            const recipes = await API.filterByArea(area);
            $('#area-results').innerHTML = UI.renderRecipesGrid(recipes);
            attachCardClickHandlers();
          } catch (err) {
            UI.renderError(err);
          }
        });
      });
    } catch (err) {
      UI.renderError(err);
    }
  },

  /** View: Random recipe. */
  async renderRandom() {
    showLoader();
    try {
      const recipe = await API.getRandom();
      if (recipe) {
        UI.openRecipeModal(recipe);
        // After closing the modal, fall back to home
        UI.renderHome();
      }
    } catch (err) {
      UI.renderError(err);
    }
  },

  /** View: Favorites (from localStorage). */
  renderFavorites() {
    const favorites = Storage.getFavorites();
    $('#main-content').innerHTML = `
      <h2 class="section-title">❤️ My favorites <small style="font-size:0.9rem;color:var(--text-muted);font-weight:400;">(${favorites.length} recipe${favorites.length > 1 ? 's' : ''})</small></h2>
      <p class="section-subtitle">Your favorite recipes are saved in <code>localStorage</code> — they persist even after closing the browser.</p>
      ${UI.renderRecipesGrid(favorites, "You don't have any favorites yet. Click ❤️ on a recipe to add it.")}
    `;
    attachCardClickHandlers();
  },

  /** View: Shopping list (from localStorage). */
  renderShopping() {
    const list = Storage.getShoppingList();
    $('#main-content').innerHTML = `
      <h2 class="section-title">🛒 My shopping list</h2>
      <p class="section-subtitle">Automatically built from recipe ingredients. Saved in <code>localStorage</code>.</p>

      ${list.length ? `
        <div style="margin-bottom:1.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button class="btn btn-danger" id="clear-shopping">🗑️ Clear all</button>
          <span style="margin-left:auto;color:var(--text-muted);font-size:0.9rem;align-self:center;">
            ${list.filter((i) => i.checked).length} / ${list.length} checked
          </span>
        </div>
        <div id="shopping-list">
          ${list.map((item) => `
            <div class="shopping-item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
              <input type="checkbox" ${item.checked ? 'checked' : ''} />
              <div class="shopping-text">
                <div>${item.measure ? `<strong>${item.measure}</strong> ` : ''}${item.text}</div>
                <div class="shopping-source">📖 ${item.source}</div>
              </div>
              <button class="btn-remove" aria-label="Remove">×</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h3>Empty list</h3>
          <p>Open a recipe and click "Add to my list" to fill it up.</p>
        </div>
      `}
    `;

    // Check / uncheck items
    $$('.shopping-item input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        const itemEl = e.target.closest('.shopping-item');
        const id = parseFloat(itemEl.dataset.id);
        Storage.toggleShoppingItem(id);
        UI.renderShopping();
      });
    });

    // Remove a single item
    $$('.shopping-item .btn-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.shopping-item');
        const id = parseFloat(itemEl.dataset.id);
        Storage.removeShoppingItem(id);
        UI.renderShopping();
        updateBadges();
      });
    });

    // Clear the whole list
    $('#clear-shopping')?.addEventListener('click', () => {
      if (confirm('Clear the entire shopping list?')) {
        Storage.clearShoppingList();
        UI.renderShopping();
        updateBadges();
        showToast('List cleared');
      }
    });
  },

  /** View: Session history (from sessionStorage). */
  renderHistory() {
    const history = Storage.getSearchHistory();
    const recent = Storage.getRecentlyViewed();

    $('#main-content').innerHTML = `
      <h2 class="section-title">🕐 Session history</h2>
      <p class="section-subtitle">This data is stored in <code>sessionStorage</code> and will be cleared when you close the tab.</p>

      <div class="recipe-section">
        <h3 style="color:var(--color-primary);margin-bottom:1rem;">🔎 Searches</h3>
        ${history.length ? `
          <div class="chips">
            ${history.map((q) => `<button class="chip" data-search="${q}">${q}</button>`).join('')}
          </div>
          <button class="btn btn-secondary" id="clear-history" style="margin-top:0.5rem;">Clear history</button>
        ` : `<p style="color:var(--text-muted);">No searches in this session.</p>`}
      </div>

      <div class="recipe-section" style="margin-top:2rem;">
        <h3 style="color:var(--color-primary);margin-bottom:1rem;">👀 Viewed recipes</h3>
        ${recent.length ? UI.renderRecipesGrid(recent)
          : `<p style="color:var(--text-muted);">No recipes viewed in this session.</p>`}
      </div>
    `;

    $$('.chip[data-search]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.search;
        $('#search-input').value = query;
        handleSearch(query);
      });
    });

    $('#clear-history')?.addEventListener('click', () => {
      Storage.clearSearchHistory();
      UI.renderHistory();
      showToast('History cleared');
    });

    attachCardClickHandlers();
  },

  /** View: Search results. */
  renderSearchResults(recipes, query) {
    $('#main-content').innerHTML = `
      <h2 class="section-title">🔍 Results for "${query}"</h2>
      <p class="section-subtitle">${recipes.length} recipe${recipes.length > 1 ? 's' : ''} found.</p>
      ${UI.renderRecipesGrid(recipes, `No results for "${query}"`)}
    `;
    attachCardClickHandlers();
  },

  /** Render an error message. */
  renderError(err) {
    console.error(err);
    $('#main-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>${err.message || 'Please check your internet connection.'}</p>
      </div>
    `;
  },

  /** Open the recipe detail modal. */
  async openRecipeModal(recipeOrId) {
    showLoader();
    let recipe = recipeOrId;
    // If we only have an ID/partial object (e.g. from favorites), fetch the details
    if (typeof recipeOrId === 'string' || !recipe.strInstructions) {
      const id = typeof recipeOrId === 'string' ? recipeOrId : recipeOrId.idMeal;
      try {
        recipe = await API.lookupById(id);
      } catch (err) {
        UI.renderError(err);
        return;
      }
    }
    if (!recipe) return;

    // Track as "recently viewed" (sessionStorage)
    Storage.addToRecentlyViewed(recipe);
    state.currentRecipe = recipe;

    const ingredients = extractIngredients(recipe);
    const isFav = Storage.isFavorite(recipe.idMeal);

    // Build the modal content (explicit DOM manipulation)
    const modalBody = $('#modal-body');
    modalBody.innerHTML = `
      <img class="recipe-detail-image" src="${recipe.strMealThumb}" alt="${recipe.strMeal}" />
      <div class="recipe-detail-body">
        <h2 class="recipe-detail-title" id="modal-title">${recipe.strMeal}</h2>
        <div class="recipe-detail-meta">
          ${recipe.strCategory ? `<span>📂 ${recipe.strCategory}</span>` : ''}
          ${recipe.strArea ? `<span>🌍 ${recipe.strArea}</span>` : ''}
          ${recipe.strTags ? `<span>🏷️ ${recipe.strTags.replaceAll(',', ', ')}</span>` : ''}
        </div>

        <div class="recipe-actions">
          <button class="btn ${isFav ? 'btn-danger' : 'btn-primary'}" id="btn-favorite">
            ${isFav ? '💔 Remove from favorites' : '❤️ Add to favorites'}
          </button>
          <button class="btn btn-secondary" id="btn-add-shopping">🛒 Add to my list</button>
          ${recipe.strYoutube ? `<a class="btn btn-secondary" href="${recipe.strYoutube}" target="_blank" rel="noopener">▶️ Video</a>` : ''}
          ${recipe.strSource ? `<a class="btn btn-secondary" href="${recipe.strSource}" target="_blank" rel="noopener">🔗 Source</a>` : ''}
        </div>

        <div class="recipe-section">
          <h3>🥕 Ingredients</h3>
          <ul class="ingredients-list">
            ${ingredients.map((ing) => `
              <li>
                <span>${ing.name}</span>
                <strong>${ing.measure}</strong>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="recipe-section">
          <h3>👨‍🍳 Instructions</h3>
          <p class="instructions">${recipe.strInstructions}</p>
        </div>
      </div>
    `;

    // Show the modal (dynamic class toggle)
    $('#modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Event: toggle favorite
    $('#btn-favorite').addEventListener('click', () => {
      const added = Storage.toggleFavorite(recipe);
      showToast(added ? '❤️ Added to favorites' : '💔 Removed from favorites');
      updateBadges();
      // Visually refresh the button
      const btn = $('#btn-favorite');
      if (added) {
        btn.className = 'btn btn-danger';
        btn.textContent = '💔 Remove from favorites';
      } else {
        btn.className = 'btn btn-primary';
        btn.textContent = '❤️ Add to favorites';
      }
    });

    // Event: add ingredients to the shopping list
    $('#btn-add-shopping').addEventListener('click', () => {
      const items = ingredients.map((ing) => ({
        text: ing.name,
        measure: ing.measure,
        source: recipe.strMeal,
      }));
      Storage.addToShoppingList(items);
      updateBadges();
      showToast(`🛒 ${items.length} ingredient${items.length > 1 ? 's' : ''} added`);
    });
  },

  closeModal() {
    $('#modal').classList.add('hidden');
    document.body.style.overflow = '';
    state.currentRecipe = null;
  },
};

/* ------------------------------------------------------------
   6) EVENT HANDLERS
------------------------------------------------------------ */

/** Attach a click handler to every visible recipe card. */
function attachCardClickHandlers() {
  $$('.card[data-id]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      UI.openRecipeModal(id);
    });
  });
}

/** Search by name (triggered by the search input). */
async function handleSearch(query) {
  if (!query || query.trim().length < 2) {
    showToast('Type at least 2 characters');
    return;
  }
  query = query.trim();
  Storage.addToSearchHistory(query);
  showLoader();
  try {
    const recipes = await API.searchByName(query);
    UI.renderSearchResults(recipes, query);
    setActiveNav(null); // No nav button is active for search results
  } catch (err) {
    UI.renderError(err);
  }
}

/** Visually update the active nav button. */
function setActiveNav(view) {
  $$('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
}

/** Internal routing between views. */
function navigateTo(view) {
  state.currentView = view;
  setActiveNav(view);

  switch (view) {
    case 'home':       UI.renderHome();       break;
    case 'categories': UI.renderCategories(); break;
    case 'areas':      UI.renderAreas();      break;
    case 'random':     UI.renderRandom();     break;
    case 'favorites':  UI.renderFavorites();  break;
    case 'shopping':   UI.renderShopping();   break;
    case 'history':    UI.renderHistory();    break;
    default:           UI.renderHome();
  }
}

/** Toggle between light and dark theme. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  Storage.setTheme(next);
  $('.theme-icon').textContent = next === 'dark' ? '☀️' : '🌙';
}

/* ------------------------------------------------------------
   7) INITIALIZATION
------------------------------------------------------------ */
function init() {
  // Restore the saved theme from localStorage
  const savedTheme = Storage.getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);
  $('.theme-icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  // Initial badge counts
  updateBadges();

  // Main navigation
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  // Theme toggle
  $('#theme-toggle').addEventListener('click', toggleTheme);

  // Search form
  $('#search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleSearch($('#search-input').value);
  });

  // Modal close handlers
  $('#modal-close').addEventListener('click', () => UI.closeModal());
  $('#modal-overlay').addEventListener('click', () => UI.closeModal());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) {
      UI.closeModal();
    }
  });

  // Initial view
  navigateTo('home');
}

// Bootstrap when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
