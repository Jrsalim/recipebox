# 🍳 RecipeBox

> **A modern, lightweight recipe discovery app built with vanilla JavaScript — no frameworks, no build step, no dependencies.**

Browse thousands of recipes from around the world, save your favorites, generate shopping lists automatically, and switch between light and dark themes — all in a single-page web app that fits in three files.

---

## ✨ Features

- 🔍 **Smart search** — find any recipe by name with instant results
- 📂 **Browse by category** — Beef, Chicken, Desserts, Vegetarian, Seafood and more
- 🌍 **Explore world cuisines** — 28 regional cuisines with flag indicators
- 🎲 **Random recipe** — discover something new with one click
- ❤️ **Favorites system** — save recipes permanently across browser sessions
- 🛒 **Auto-generated shopping list** — turn any recipe into a checkable shopping list
- 🕐 **Session history** — recently viewed recipes and search history (per session)
- 🌙 **Dark / light theme** — fully themed with smooth transitions
- 📱 **Fully responsive** — mobile-first design that works on every screen

---

## 🛠️ Tech stack

| Layer       | Technology                                                                |
| ----------- | ------------------------------------------------------------------------- |
| Markup      | Semantic HTML5                                                            |
| Styling     | Modern CSS3 (CSS custom properties, grid, flexbox)                        |
| Logic       | Vanilla JavaScript (ES2020+, async/await, modules-by-convention)          |
| Data        | [TheMealDB](https://www.themealdb.com/) public REST API                   |
| Persistence | Web Storage API (`localStorage` + `sessionStorage`)                       |
| Build tools | **None.** Open `index.html` and it works.                                 |

---

## 🚀 Getting started

Clone and run — no `npm install`, no compilation, no configuration.

```bash
git clone https://github.com/your-username/recipebox.git
cd recipebox
```

Then either:

```bash
# Option A — Open directly
open index.html

# Option B — Serve locally (recommended for full AJAX support)
python3 -m http.server 8000
# Visit http://localhost:8000
```

---

## 🏗️ Architecture

The app is structured as a **single-page application** with clean separation of concerns. The entire codebase fits in three files:

```
recipebox/
├── index.html      ← Markup & structure
├── styles.css      ← Design system, themes, responsive layout
└── app.js          ← Application logic (organized in 7 modules)
```

### Code organization (`app.js`)

```
┌─────────────────────────────────────────────────────────┐
│ 1. STATE             Centralized application state      │
│ 2. API service       All AJAX calls to TheMealDB        │
│ 3. Storage service   Encapsulated Web Storage logic     │
│ 4. Helpers           Toast, loader, ingredient parser   │
│ 5. UI module         DOM rendering for every view       │
│ 6. Event handlers    Search, navigation, theme toggle   │
│ 7. Initialization    Bootstrap on DOMContentLoaded      │
└─────────────────────────────────────────────────────────┘
```

Each module has a **single responsibility**:

- The `API` module knows nothing about the DOM.
- The `Storage` module knows nothing about the DOM.
- The `UI` module assembles data from `API` and `Storage` and renders it.
- Event handlers orchestrate everything.

This makes the code easy to test, extend, and reason about.

---

## 🔌 API integration

RecipeBox consumes 7 endpoints from TheMealDB via `fetch()` with `async/await`:

| Endpoint                  | Purpose                       |
| ------------------------- | ----------------------------- |
| `search.php?s={name}`     | Search recipes by name        |
| `lookup.php?i={id}`       | Get full recipe details       |
| `random.php`              | Random recipe                 |
| `categories.php`          | List all categories           |
| `filter.php?c={category}` | Recipes in a category         |
| `list.php?a=list`         | List all cuisines             |
| `filter.php?a={area}`     | Recipes from a cuisine        |

Every request is wrapped in `try/catch` with proper error UI fallback.

---

## 💾 Persistence strategy

RecipeBox uses **both** Web Storage APIs intentionally, each for a different lifetime:

### `localStorage` — persistent across sessions

```js
recipebox_favorites    // Saved recipes (id, name, image, category, area)
recipebox_shopping     // Shopping list items with checked state
recipebox_theme        // "light" | "dark"
```

### `sessionStorage` — cleared when the tab closes

```js
recipebox_search_history    // Last 10 searches
recipebox_recently_viewed   // Last 8 viewed recipes
```

All values are serialized via `JSON.stringify` and parsed defensively on read.

---

## 🎨 Design system

Built around **CSS custom properties** for easy theming. Switching to dark mode is a single attribute change on the `<html>` element:

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

```css
:root {
  --color-primary: #ff6b35;
  --bg-body: #fff8f3;
  --text-primary: #1d1d1d;
  /* ...50+ tokens */
}

[data-theme="dark"] {
  --bg-body: #1a1a2e;
  --text-primary: #f0f0f0;
  /* ...overridden tokens */
}
```

The entire app re-themes instantly without any JS recompute or DOM rebuild.

---

## 📐 Highlighted technical choices

- **Vanilla JS, on purpose.** Frameworks are great, but they hide the fundamentals. This project sticks to native APIs (`fetch`, `Web Storage`, `addEventListener`) to demonstrate real DOM mastery.
- **No build step.** Anyone can open the source, read it, modify it, and run it in seconds.
- **Progressive enhancement.** Core navigation works even before AJAX data loads.
- **Accessibility.** ARIA labels, keyboard navigation (Esc closes the modal), focus management, semantic HTML.
- **Mobile-first.** The layout starts narrow and scales up. No retrofitting.
- **Defensive coding.** Every API call has error handling, every storage read defaults safely.

---

## 🧪 What to inspect in DevTools

If you're curious about the internals, here's where to look:

| DevTools tab                   | What you'll see                                          |
| ------------------------------ | -------------------------------------------------------- |
| **Network**                    | Live AJAX requests to TheMealDB                          |
| **Application → Local Storage** | Favorites, shopping list, theme preference              |
| **Application → Session Storage** | Search history, recently viewed                       |
| **Elements**                   | Dynamically generated DOM (everything is built on the fly) |

---

## 📦 What's next

Possible enhancements I'm considering:

- [ ] Offline support via Service Worker
- [ ] PWA install prompt
- [ ] User-authored notes per recipe
- [ ] Filter by available ingredients ("what's in my fridge?")
- [ ] Meal planner / weekly calendar view
- [ ] Export shopping list as PDF or share via URL

---

## 📄 License

MIT — free to use, modify, and share. Recipe data is provided by [TheMealDB](https://www.themealdb.com/) under their open data license.
