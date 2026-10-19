const app = {
  guidelines: [],
  activeCategory: 'all',
  lastQuery: '',

  async init() {
    this.bindEvents();
    await this.loadAllGuidelines();
    this.renderHomePills();
    this.renderAppsMenu();
  },

  bindEvents() {
    const homeInput = document.getElementById('homeSearchInput');
    const compactInput = document.getElementById('compactSearchInput');
    const homeClear = document.getElementById('homeClearBtn');
    const compactClear = document.getElementById('compactClearBtn');

    // Search inputs
    homeInput.addEventListener('input', (e) => {
      const val = e.target.value;
      homeClear.style.display = val ? 'block' : 'none';
      this.showSuggestions(val, 'homeSuggestions');
    });

    homeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('homeSuggestions').classList.remove('open');
        this.performSearch(homeInput.value);
      }
    });

    compactInput.addEventListener('input', (e) => {
      const val = e.target.value;
      compactClear.style.display = val ? 'block' : 'none';
      this.showSuggestions(val, 'compactSuggestions');
    });

    compactInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('compactSuggestions').classList.remove('open');
        this.performSearch(compactInput.value);
      }
    });

    homeClear.addEventListener('click', () => {
      homeInput.value = '';
      homeClear.style.display = 'none';
      document.getElementById('homeSuggestions').classList.remove('open');
      homeInput.focus();
    });

    compactClear.addEventListener('click', () => {
      compactInput.value = '';
      compactClear.style.display = 'none';
      document.getElementById('compactSuggestions').classList.remove('open');
      compactInput.focus();
    });

    // SERP Category Tabs
    document.querySelectorAll('.serp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.serp-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.dataset.cat;
        this.performSearch(this.lastQuery, false);
      });
    });

    // 9-dot App Menu Toggle
    const appsBtn = document.getElementById('appsBtn');
    const appsMenu = document.getElementById('appsMenu');
    appsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      appsMenu.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      appsMenu.classList.remove('open');
      document.getElementById('homeSuggestions').classList.remove('open');
      document.getElementById('compactSuggestions').classList.remove('open');
    });

    // Local Folder Fallback Input (if running over file:// without HTTP server)
    document.getElementById('localFolderInput').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files).filter(f => f.name.endsWith('.mdx'));
      if (!files.length) return;
      this.guidelines = [];
      for (const file of files) {
        const raw = await file.text();
        const parsed = MDXParser.parse(raw);
        this.guidelines.push({
          id: parsed.metadata.id || file.name.replace('.mdx', ''),
          ...parsed.metadata,
          html: parsed.html,
          plainText: parsed.plainText
        });
      }
      this.guidelines.sort((a, b) => a.id.localeCompare(b.id));
      document.getElementById('folderLoaderBtn').style.display = 'none';
      this.renderHomePills();
      this.renderAppsMenu();
      this.showToast(`✓ ${this.guidelines.length} diretrizes .mdx carregadas!`);
    });
  },

  async loadAllGuidelines() {
    try {
      const res = await fetch('guidelines/index.json');
      if (!res.ok) throw new Error('Falha ao ler index.json');
      const manifest = await res.json();

      const loaded = [];
      for (const file of manifest.files) {
        const mdxRes = await fetch(`guidelines/${file}`);
        const rawText = await mdxRes.text();
        const parsed = MDXParser.parse(rawText);
        loaded.push({
          id: parsed.metadata.id,
          ...parsed.metadata,
          html: parsed.html,
          plainText: parsed.plainText
        });
      }
      this.guidelines = loaded;
    } catch (err) {
      console.warn('Execução via file:// detectada ou servidor ausente. Habilitando botão de carregamento local.', err);
      document.getElementById('folderLoaderBtn').style.display = 'inline-block';
    }

    // Load any custom guidelines created in Page Creator Studio
    const savedCustom = JSON.parse(localStorage.getItem('argon_custom_mdx') || '[]');
    savedCustom.forEach(entry => {
      const raw = typeof entry === 'string' ? entry : entry.rawMDX;
      const parsed = MDXParser.parse(raw);
      const doc = {
        id: parsed.metadata.id,
        ...parsed.metadata,
        html: parsed.html,
        plainText: parsed.plainText
      };
      const idx = this.guidelines.findIndex(g => g.id === doc.id);
      if (idx >= 0) this.guidelines[idx] = doc;
      else this.guidelines.push(doc);
    });
  },

  renderHomePills() {
    const container = document.getElementById('homeQuickPills');
    container.innerHTML = this.guidelines.map(g => `
      <button class="quick-pill" onclick="app.openGuideline('${g.id}')">
        ${g.shortcut || g.title}
      </button>
    `).join('');
  },

  renderAppsMenu() {
    const grid = document.getElementById('appsGrid');
    const icons = ['📞', '🛡️', '⚡', '💎', '🎙️', '⭐', '🧮'];
    grid.innerHTML = this.guidelines.map((g, i) => `
      <a href="#" class="app-item" onclick="app.openGuideline('${g.id}'); return false;">
        <span class="app-item-icon">${icons[i % icons.length]}</span>
        <span>${g.shortcut || g.id.toUpperCase()}</span>
      </a>
    `).join('');
  },

  showSuggestions(query, dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const q = query.trim().toLowerCase();

    const matches = this.guidelines.filter(g => {
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (g.keywords && g.keywords.some(k => k.toLowerCase().includes(q))) ||
        g.plainText.toLowerCase().includes(q)
      );
    }).slice(0, 6);

    if (!matches.length) {
      dropdown.classList.remove('open');
      return;
    }

    dropdown.innerHTML = matches.map(g => `
      <div class="suggestion-item" onclick="app.openGuideline('${g.id}')">
        <div class="suggestion-left">
          <span>🔍</span>
          <span>${this.highlightTerms(g.title, q)}</span>
        </div>
        <span class="suggestion-cat">${g.categoryLabel || g.category}</span>
      </div>
    `).join('');

    dropdown.classList.add('open');
  },

  searchByCategory(cat) {
    this.activeCategory = cat;
    document.querySelectorAll('.serp-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
    this.performSearch('');
  },

  performSearch(query, resetCategory = true) {
    this.lastQuery = query.trim();
    if (resetCategory) {
      this.activeCategory = 'all';
      document.querySelectorAll('.serp-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === 'all');
      });
    }

    // Switch UI to SERP
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('guidelineView').style.display = 'none';
    document.getElementById('serpView').style.display = 'block';
    document.getElementById('navLogo').style.display = 'block';
    document.getElementById('compactSearchWrapper').style.display = 'block';
    document.getElementById('topNav').classList.add('bordered');
    document.getElementById('creatorView').style.display = 'none';

    const compactInput = document.getElementById('compactSearchInput');
    compactInput.value = this.lastQuery;
    document.getElementById('compactClearBtn').style.display = this.lastQuery ? 'block' : 'none';

    const q = this.lastQuery.toLowerCase();
    const filtered = this.guidelines.filter(g => {
      const catMatch = this.activeCategory === 'all' || g.category === this.activeCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (g.keywords && g.keywords.some(k => k.toLowerCase().includes(q))) ||
        g.plainText.toLowerCase().includes(q)
      );
    });

    document.getElementById('serpStats').textContent =
      `Aproximadamente ${filtered.length} diretriz(es) encontrada(s) (0,02 segundos)`;

    const resultsEl = document.getElementById('serpResults');
    if (!filtered.length) {
      resultsEl.innerHTML = `<p class="mdx-p">Nenhuma diretriz encontrada para <strong>"${this.lastQuery}"</strong>. Tente buscar por <em>"caro"</em>, <em>"LGPD"</em>, <em>"fidelidade"</em> ou <em>"planos"</em>.</p>`;
      return;
    }

    resultsEl.innerHTML = filtered.map(g => `
      <div class="serp-item">
        <div class="serp-breadcrumb">${g.breadcrumb}</div>
        <a class="serp-title" onclick="app.openGuideline('${g.id}')">${this.highlightTerms(g.title, q)}</a>
        <div class="serp-snippet">${this.highlightTerms(g.description, q)}</div>
      </div>
    `).join('');
  },

  openGuideline(id) {
    const g = this.guidelines.find(item => item.id === id);
    if (!g) return;

    document.getElementById('homeView').style.display = 'none';
    document.getElementById('serpView').style.display = 'none';
    document.getElementById('guidelineView').style.display = 'block';
    document.getElementById('navLogo').style.display = 'block';
    document.getElementById('compactSearchWrapper').style.display = 'block';
    document.getElementById('topNav').classList.add('bordered');
    document.getElementById('creatorView').style.display = 'none';

    document.getElementById('guidelineBreadcrumb').textContent = g.breadcrumb;
    document.getElementById('guidelineContent').innerHTML = g.html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  goBackToSearch() {
    this.performSearch(this.lastQuery, false);
  },

  goHome() {
    document.getElementById('homeView').style.display = 'flex';
    document.getElementById('serpView').style.display = 'none';
    document.getElementById('guidelineView').style.display = 'none';
    document.getElementById('navLogo').style.display = 'none';
    document.getElementById('compactSearchWrapper').style.display = 'none';
    document.getElementById('topNav').classList.remove('bordered');
    document.getElementById('homeSearchInput').value = '';
    document.getElementById('homeClearBtn').style.display = 'none';
    document.getElementById('creatorView').style.display = 'none';
  },

  highlightTerms(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<strong>$1</strong>');
  },

  copyScript(btn, encodedText) {
    const text = decodeURIComponent(encodedText);
    navigator.clipboard.writeText(text);
    const original = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '✓ Copiado!';
    this.showToast('✓ Script copiado para a área de transferência!');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = original;
    }, 1800);
  },

  runAnatelCalc() {
    const fineTotal = parseFloat(document.getElementById('calcFineTotal')?.value) || 0;
    const monthsLeft = parseFloat(document.getElementById('calcMonthsLeft')?.value) || 0;
    const currentBill = parseFloat(document.getElementById('calcCurrentBill')?.value) || 0;
    const argonBill = parseFloat(document.getElementById('calcArgonBill')?.value) || 0;

    const proportionalFine = (fineTotal / 12) * Math.min(Math.max(monthsLeft, 0), 12);
    const annualSavings = (currentBill - argonBill) * 12;
    const netBenefit = annualSavings - proportionalFine;

    const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    document.getElementById('resProportionalFine').textContent = fmt(proportionalFine);
    document.getElementById('resAnnualSavings').textContent = fmt(annualSavings);
    const netEl = document.getElementById('resNetBenefit');
    netEl.textContent = `${netBenefit >= 0 ? '+ ' : ''}${fmt(netBenefit)}`;
    netEl.className = `calc-stat-value ${netBenefit >= 0 ? 'positive' : ''}`;
  },

  showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }
};

window.addEventListener('DOMContentLoaded', () => app.init());