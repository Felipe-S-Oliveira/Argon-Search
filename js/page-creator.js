const pageCreator = {
  // Admin Credentials
  ADMIN_USER: 'admin',
  ADMIN_PASS: 'argon@2026',
  isAuthenticated: false,

  // Hierarchical Block State (Paragraphs & Components)
  blocks: [],

  init() {
    this.isAuthenticated = sessionStorage.getItem('argon_admin_auth') === 'true';
    if (this.isAuthenticated) {
      document.getElementById('adminStudioBtn').style.display = 'inline-block';
    }

    // Seed initial sample blocks so the studio isn't empty on first open
    this.seedDefaultBlocks();

    // Global Hard Shortcut Listener: Ctrl + Shift + Alt + A
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (this.isAuthenticated) {
          this.openStudio();
        } else {
          this.openLoginModal();
        }
      }
    });
  },

  seedDefaultBlocks() {
    this.blocks = [
      {
        id: this.uid(),
        type: 'badges',
        hasChildren: true,
        children: [
          { id: this.uid(), badgeType: 'primary', text: 'Script Oficial' },
          { id: this.uid(), badgeType: 'neutral', text: '⏱ 2 min de leitura' }
        ]
      },
      {
        id: this.uid(),
        type: 'lead',
        hasChildren: false,
        text: 'Utilize este guia para conduzir a abordagem com clareza, contornar resistências e garantir a conversão.'
      },
      {
        id: this.uid(),
        type: 'alert',
        hasChildren: false,
        variant: 'critical',
        title: 'Ponto Crítico de Qualidade',
        text: 'Sempre confirme os dados positivos do titular antes de prosseguir para o agendamento.'
      },
      {
        id: this.uid(),
        type: 'h2',
        hasChildren: false,
        text: '1. Script de Abordagem Recomendado'
      },
      {
        id: this.uid(),
        type: 'paragraph',
        hasChildren: false,
        text: 'Leia o parágrafo abaixo mantendo **energia na voz** e utilizando o nome do cliente:'
      },
      {
        id: this.uid(),
        type: 'script',
        hasChildren: false,
        title: 'Abordagem de Retenção e Valor',
        text: 'Olá, **{Nome do Cliente}**! Identifiquei aqui no sistema uma atualização exclusiva para o seu endereço que libera o roteador Wi-Fi 6 sem custo de adesão.'
      }
    ];
  },

  uid() {
    return 'blk_' + Math.random().toString(36).substring(2, 9);
  },

  /* =========================================================
     AUTHENTICATION FLOW
     ========================================================= */
  openLoginModal() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('adminLoginForm').reset();
    document.getElementById('adminLoginModal').style.display = 'flex';
    setTimeout(() => document.getElementById('adminUser').focus(), 50);
  },

  closeLoginModal() {
    document.getElementById('adminLoginModal').style.display = 'none';
  },

  handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value;

    if (user === this.ADMIN_USER && pass === this.ADMIN_PASS) {
      this.isAuthenticated = true;
      sessionStorage.setItem('argon_admin_auth', 'true');
      document.getElementById('adminStudioBtn').style.display = 'inline-block';
      this.closeLoginModal();
      this.openStudio();
      app.showToast('🔓 Modo Administrador desbloqueado!');
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  },

  logout() {
    this.isAuthenticated = false;
    sessionStorage.removeItem('argon_admin_auth');
    document.getElementById('adminStudioBtn').style.display = 'none';
    app.goHome();
    app.showToast('🔒 Sessão de administrador encerrada.');
  },

  openStudio() {
    if (!this.isAuthenticated) {
      this.openLoginModal();
      return;
    }
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('serpView').style.display = 'none';
    document.getElementById('guidelineView').style.display = 'none';
    document.getElementById('creatorView').style.display = 'block';
    document.getElementById('navLogo').style.display = 'block';
    document.getElementById('compactSearchWrapper').style.display = 'block';
    document.getElementById('topNav').classList.add('bordered');

    this.renderBlocksEditor();
    this.updatePreview();
  },

  /* =========================================================
     BLOCK & CHILD MANAGEMENT
     ========================================================= */
  createBlockObject(type) {
    const id = this.uid();
    switch (type) {
      case 'paragraph':
        return { id, type, hasChildren: false, text: 'Digite o texto do parágrafo aqui...' };
      case 'lead':
        return { id, type, hasChildren: false, text: 'Resumo introdutório de destaque da diretriz.' };
      case 'h2':
        return { id, type, hasChildren: false, text: 'Novo Subtítulo de Seção' };
      case 'script':
        return { id, type, hasChildren: false, title: 'Script Falado', text: 'Olá, **{Nome do Cliente}**! Aqui é da Argon Fibra...' };
      case 'alert':
        return { id, type, hasChildren: false, variant: 'regulatory', title: 'Aviso Importante', text: 'Descrição detalhada do alerta.' };
      case 'calc':
        return { id, type, hasChildren: false };
      case 'list':
        return {
          id, type, hasChildren: true,
          children: [
            { id: this.uid(), text: 'Primeiro item da lista' },
            { id: this.uid(), text: 'Segundo item da lista' }
          ]
        };
      case 'badges':
        return {
          id, type, hasChildren: true,
          children: [
            { id: this.uid(), badgeType: 'primary', text: 'Nova Tag' }
          ]
        };
      case 'steps':
        return {
          id, type, hasChildren: true,
          children: [
            { id: this.uid(), title: 'Primeiro Passo', text: 'Explicação do que o operador deve fazer.' }
          ]
        };
      case 'dos-donts':
        return {
          id, type, hasChildren: true,
          children: [
            { id: this.uid(), kind: 'dont', text: 'Frase proibida na operação.' },
            { id: this.uid(), kind: 'do', text: 'Frase recomendada de alta conversão.' }
          ]
        };
      case 'plans':
        return {
          id, type, hasChildren: true,
          children: [
            {
              id: this.uid(),
              speed: '700 Mega Ultra',
              price: 'R$ 99,90',
              chip: 'MAIS VENDIDO',
              featured: 'true',
              features: 'Download 700 Mbps\nRoteador Wi-Fi 6 incluso\nInstalação Grátis'
            }
          ]
        };
      case 'accordion':
        return {
          id, type, hasChildren: true,
          summary: '💬 Objeção do Cliente: "Preciso pensar mais um pouco"',
          children: [
            { id: this.uid(), type: 'paragraph', hasChildren: false, text: 'Acolha o cliente e isole a objeção antes de aplicar o script:' },
            { id: this.uid(), type: 'script', hasChildren: false, title: 'Reversão Imediata', text: 'Compreendo perfeitamente, **{Nome do Cliente}**! Para você decidir com segurança, garantimos a reserva hoje...' }
          ]
        };
      default:
        return { id, type: 'paragraph', hasChildren: false, text: '' };
    }
  },

  addBlock(type) {
    this.blocks.push(this.createBlockObject(type));
    this.renderBlocksEditor();
    this.updatePreview();
  },

  removeBlock(index) {
    this.blocks.splice(index, 1);
    this.renderBlocksEditor();
    this.updatePreview();
  },

  moveBlock(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= this.blocks.length) return;
    const temp = this.blocks[index];
    this.blocks[index] = this.blocks[target];
    this.blocks[target] = temp;
    this.renderBlocksEditor();
    this.updatePreview();
  },

  addChild(blockIndex, childPreset = null) {
    const parent = this.blocks[blockIndex];
    if (!parent || !parent.hasChildren) return;

    if (parent.type === 'list') {
      parent.children.push({ id: this.uid(), text: 'Novo item da lista' });
    } else if (parent.type === 'badges') {
      parent.children.push({ id: this.uid(), badgeType: 'primary', text: 'Etiqueta' });
    } else if (parent.type === 'steps') {
      parent.children.push({ id: this.uid(), title: 'Título do Passo', text: 'Descrição da etapa.' });
    } else if (parent.type === 'dos-donts') {
      parent.children.push({ id: this.uid(), kind: childPreset || 'do', text: 'Texto do item...' });
    } else if (parent.type === 'plans') {
      parent.children.push({
        id: this.uid(),
        speed: '400 Mega',
        price: 'R$ 79,90',
        chip: '',
        featured: 'false',
        features: 'Download 400 Mbps\nInstalação Grátis'
      });
    } else if (parent.type === 'accordion') {
      // Accordion supports nested blocks (Paragraph, Script, Alert)
      parent.children.push(this.createBlockObject(childPreset || 'paragraph'));
    }

    this.renderBlocksEditor();
    this.updatePreview();
  },

  removeChild(blockIndex, childIndex) {
    this.blocks[blockIndex].children.splice(childIndex, 1);
    this.renderBlocksEditor();
    this.updatePreview();
  },

  /* =========================================================
     RENDER EDITOR UI
     ========================================================= */
  renderBlocksEditor() {
    const container = document.getElementById('blocksContainer');
    if (!this.blocks.length) {
      container.innerHTML = `<p class="mdx-p" style="color:#70757a; text-align:center; padding:16px;">Nenhum parágrafo ou componente adicionado. Use os botões abaixo para construir sua página.</p>`;
      return;
    }

    const labels = {
      paragraph: '📝 Parágrafo Livre (Sem Filhos)',
      lead: '✨ Texto Lead de Abertura (Sem Filhos)',
      h2: '🔖 Subtítulo H2 (Sem Filhos)',
      script: '🎙️ Caixa de Script Copiável (Sem Filhos)',
      alert: '⚠️ Caixa de Alerta / Aviso (Sem Filhos)',
      calc: '🧮 Widget Calculadora Anatel (Sem Filhos)',
      list: '📋 Lista de Itens (Componente Pai c/ Filhos)',
      badges: '🏷️ Grupo de Badges (Componente Pai c/ Filhos)',
      steps: '🔢 Passo a Passo Numerado (Componente Pai c/ Filhos)',
      'dos-donts': '⚖️ Grade O Que Fazer vs. Evitar (Componente Pai c/ Filhos)',
      plans: '💎 Matriz de Planos (Componente Pai c/ Filhos)',
      accordion: '📂 Sanfona de Objeção (Container Pai c/ Blocos Filhos)'
    };

    container.innerHTML = this.blocks.map((blk, bIdx) => `
      <div class="block-card ${blk.hasChildren ? 'is-parent' : ''}">
        <div class="block-top">
          <span class="block-type-tag">${labels[blk.type] || blk.type}</span>
          <div class="block-controls">
            <button class="block-btn" title="Subir" onclick="pageCreator.moveBlock(${bIdx}, -1)">↑</button>
            <button class="block-btn" title="Descer" onclick="pageCreator.moveBlock(${bIdx}, 1)">↓</button>
            <button class="block-btn del" title="Excluir Bloco" onclick="pageCreator.removeBlock(${bIdx})">✕</button>
          </div>
        </div>
        ${this.renderBlockFields(blk, bIdx)}
      </div>
    `).join('');
  },

  renderBlockFields(blk, bIdx) {
    // LEAF COMPONENTS (NO CHILDREN)
    if (blk.type === 'paragraph' || blk.type === 'lead') {
      return `
        <div class="form-group" style="margin:0;">
          <textarea rows="2" oninput="pageCreator.blocks[${bIdx}].text = this.value; pageCreator.updatePreview()">${this.esc(blk.text)}</textarea>
        </div>
      `;
    }

    if (blk.type === 'h2') {
      return `
        <div class="form-group" style="margin:0;">
          <input type="text" value="${this.esc(blk.text)}" oninput="pageCreator.blocks[${bIdx}].text = this.value; pageCreator.updatePreview()">
        </div>
      `;
    }

    if (blk.type === 'script') {
      return `
        <div class="form-group">
          <label>Título da Caixa de Script</label>
          <input type="text" value="${this.esc(blk.title)}" oninput="pageCreator.blocks[${bIdx}].title = this.value; pageCreator.updatePreview()">
        </div>
        <div class="form-group" style="margin:0;">
          <label>Fala do Operador (Copiável em 1 clique)</label>
          <textarea rows="3" oninput="pageCreator.blocks[${bIdx}].text = this.value; pageCreator.updatePreview()">${this.esc(blk.text)}</textarea>
        </div>
      `;
    }

    if (blk.type === 'alert') {
      return `
        <div class="creator-meta-grid">
          <div class="form-group">
            <label>Nível do Alerta</label>
            <select onchange="pageCreator.blocks[${bIdx}].variant = this.value; pageCreator.updatePreview()">
              <option value="critical" ${blk.variant === 'critical' ? 'selected' : ''}>Crítico / Proibido (Vermelho)</option>
              <option value="warning" ${blk.variant === 'warning' ? 'selected' : ''}>Atenção (Amarelo)</option>
              <option value="success" ${blk.variant === 'success' ? 'selected' : ''}>Dica de Ouro (Verde)</option>
              <option value="regulatory" ${blk.variant === 'regulatory' ? 'selected' : ''}>Regulatório / Anatel (Azul)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Título do Alerta</label>
            <input type="text" value="${this.esc(blk.title)}" oninput="pageCreator.blocks[${bIdx}].title = this.value; pageCreator.updatePreview()">
          </div>
        </div>
        <div class="form-group" style="margin:0;">
          <label>Texto do Alerta</label>
          <textarea rows="2" oninput="pageCreator.blocks[${bIdx}].text = this.value; pageCreator.updatePreview()">${this.esc(blk.text)}</textarea>
        </div>
      `;
    }

    if (blk.type === 'calc') {
      return `<p class="mdx-p" style="margin:0; font-size:13px; color:#5f6368;">Este bloco renderiza automaticamente a <strong>Calculadora Interativa de Multa Proporcional Anatel</strong>.</p>`;
    }

    // PARENT COMPONENTS (WITH CHILDREN)
    if (blk.type === 'list') {
      return `
        <div class="children-container">
          ${blk.children.map((ch, cIdx) => `
            <div class="child-item">
              <div class="child-item-top">
                <span>• Item #${cIdx + 1}</span>
                <button class="block-btn del" onclick="pageCreator.removeChild(${bIdx},${cIdx})">✕</button>
              </div>
              <input type="text" value="${this.esc(ch.text)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].text = this.value; pageCreator.updatePreview()">
            </div>
          `).join('')}
          <div class="add-child-bar">
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx})">+ Adicionar Item na Lista</button>
          </div>
        </div>
      `;
    }

    if (blk.type === 'badges') {
      return `
        <div class="children-container">
          ${blk.children.map((ch, cIdx) => `
            <div class="child-item">
              <div class="child-item-top">
                <span>🏷️ Badge #${cIdx + 1}</span>
                <button class="block-btn del" onclick="pageCreator.removeChild(${bIdx},${cIdx})">✕</button>
              </div>
              <div class="creator-meta-grid">
                <select onchange="pageCreator.blocks[${bIdx}].children[${cIdx}].badgeType = this.value; pageCreator.updatePreview()">
                  <option value="primary" ${ch.badgeType === 'primary' ? 'selected' : ''}>Azul (Primary)</option>
                  <option value="warning" ${ch.badgeType === 'warning' ? 'selected' : ''}>Laranja/Vermelho (Warning)</option>
                  <option value="success" ${ch.badgeType === 'success' ? 'selected' : ''}>Verde (Success)</option>
                  <option value="neutral" ${ch.badgeType === 'neutral' ? 'selected' : ''}>Cinza (Neutral)</option>
                </select>
                <input type="text" value="${this.esc(ch.text)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].text = this.value; pageCreator.updatePreview()">
              </div>
            </div>
          `).join('')}
          <div class="add-child-bar">
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx})">+ Adicionar Badge Filho</button>
          </div>
        </div>
      `;
    }

    if (blk.type === 'steps') {
      return `
        <div class="children-container">
          ${blk.children.map((ch, cIdx) => `
            <div class="child-item">
              <div class="child-item-top">
                <span>Passo ${cIdx + 1}</span>
                <button class="block-btn del" onclick="pageCreator.removeChild(${bIdx},${cIdx})">✕</button>
              </div>
              <div class="form-group">
                <input type="text" placeholder="Título do Passo" value="${this.esc(ch.title)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].title = this.value; pageCreator.updatePreview()">
              </div>
              <div class="form-group" style="margin:0;">
                <textarea rows="2" placeholder="Descrição do Passo" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].text = this.value; pageCreator.updatePreview()">${this.esc(ch.text)}</textarea>
              </div>
            </div>
          `).join('')}
          <div class="add-child-bar">
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx})">+ Adicionar Passo Filho</button>
          </div>
        </div>
      `;
    }

    if (blk.type === 'dos-donts') {
      return `
        <div class="children-container">
          ${blk.children.map((ch, cIdx) => `
            <div class="child-item">
              <div class="child-item-top">
                <span>${ch.kind === 'dont' ? '❌ Evite Falar (Dont)' : '✅ Prefira Falar (Do)'}</span>
                <button class="block-btn del" onclick="pageCreator.removeChild(${bIdx},${cIdx})">✕</button>
              </div>
              <input type="text" value="${this.esc(ch.text)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].text = this.value; pageCreator.updatePreview()">
            </div>
          `).join('')}
          <div class="add-child-bar">
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx}, 'dont')">+ Adicionar Item Proibido (❌)</button>
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx}, 'do')">+ Adicionar Item Recomendado (✅)</button>
          </div>
        </div>
      `;
    }

    if (blk.type === 'plans') {
      return `
        <div class="children-container">
          ${blk.children.map((ch, cIdx) => `
            <div class="child-item">
              <div class="child-item-top">
                <span>💎 Card de Plano #${cIdx + 1}</span>
                <button class="block-btn del" onclick="pageCreator.removeChild(${bIdx},${cIdx})">✕</button>
              </div>
              <div class="creator-meta-grid">
                <div class="form-group">
                  <label>Velocidade / Nome</label>
                  <input type="text" value="${this.esc(ch.speed)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].speed = this.value; pageCreator.updatePreview()">
                </div>
                <div class="form-group">
                  <label>Preço Mensal</label>
                  <input type="text" value="${this.esc(ch.price)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].price = this.value; pageCreator.updatePreview()">
                </div>
                <div class="form-group">
                  <label>Selo Destaque (Opcional)</label>
                  <input type="text" value="${this.esc(ch.chip)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].chip = this.value; pageCreator.updatePreview()">
                </div>
                <div class="form-group">
                  <label>Card em Destaque Azul?</label>
                  <select onchange="pageCreator.blocks[${bIdx}].children[${cIdx}].featured = this.value; pageCreator.updatePreview()">
                    <option value="true" ${ch.featured === 'true' ? 'selected' : ''}>Sim</option>
                    <option value="false" ${ch.featured !== 'true' ? 'selected' : ''}>Não</option>
                  </select>
                </div>
              </div>
              <div class="form-group" style="margin:0;">
                <label>Benefícios (1 por linha)</label>
                <textarea rows="3" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].features = this.value; pageCreator.updatePreview()">${this.esc(ch.features)}</textarea>
              </div>
            </div>
          `).join('')}
          <div class="add-child-bar">
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx})">+ Adicionar Plano Filho</button>
          </div>
        </div>
      `;
    }

    if (blk.type === 'accordion') {
      return `
        <div class="form-group">
          <label>Título da Objeção / Pergunta (Cabeçalho Clicável)</label>
          <input type="text" value="${this.esc(blk.summary)}" oninput="pageCreator.blocks[${bIdx}].summary = this.value; pageCreator.updatePreview()">
        </div>
        <div class="children-container">
          ${blk.children.map((ch, cIdx) => `
            <div class="child-item">
              <div class="child-item-top">
                <span>Bloco Interno #${cIdx + 1} (${ch.type.toUpperCase()})</span>
                <button class="block-btn del" onclick="pageCreator.removeChild(${bIdx},${cIdx})">✕</button>
              </div>
              ${ch.type === 'script' ? `
                <div class="form-group">
                  <label>Título do Script</label>
                  <input type="text" value="${this.esc(ch.title)}" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].title = this.value; pageCreator.updatePreview()">
                </div>
                <textarea rows="2" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].text = this.value; pageCreator.updatePreview()">${this.esc(ch.text)}</textarea>
              ` : `
                <textarea rows="2" oninput="pageCreator.blocks[${bIdx}].children[${cIdx}].text = this.value; pageCreator.updatePreview()">${this.esc(ch.text)}</textarea>
              `}
            </div>
          `).join('')}
          <div class="add-child-bar">
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx}, 'paragraph')">+ Parágrafo Filho</button>
            <button class="btn-add-child" onclick="pageCreator.addChild(${bIdx}, 'script')">+ ScriptBox Filho</button>
          </div>
        </div>
      `;
    }

    return '';
  },

  /* =========================================================
     MDX GENERATOR & LIVE PREVIEW
     ========================================================= */
  generateMDXString() {
    const id = document.getElementById('metaId').value.trim() || 'dir-custom';
    const title = document.getElementById('metaTitle').value.trim() || 'Nova Diretriz';
    const shortcut = document.getElementById('metaShortcut').value.trim() || title;
    const category = document.getElementById('metaCategory').value;
    const catLabels = { scripts: 'Scripts', objecoes: 'Objeções', regulatorio: 'Regulatório', simuladores: 'Simuladores' };
    const categoryLabel = catLabels[category] || 'Scripts';
    const description = document.getElementById('metaDesc').value.trim();
    const kwArray = document.getElementById('metaKeywords').value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const frontmatter = [
      '---',
      `id: ${id}`,
      `title: ${title}`,
      `shortcut: ${shortcut}`,
      `category: ${category}`,
      `categoryLabel: ${categoryLabel}`,
      `breadcrumb: argon.internal › diretrizes › ${id}`,
      `readingTime: 3 min de leitura`,
      `description: ${description}`,
      `keywords: ${JSON.stringify(kwArray)}`,
      '---',
      ''
    ].join('\n');

    const bodyBlocks = [];

    // Automatically inject H1 from metadata after badges (or at top)
    let h1Injected = false;

    this.blocks.forEach((blk) => {
      if (blk.type === 'badges') {
        const inner = blk.children
          .map(c => `  <Badge type="${c.badgeType}">${c.text}</Badge>`)
          .join('\n');
        bodyBlocks.push(`<Badges>\n${inner}\n</Badges>`);
        if (!h1Injected) {
          bodyBlocks.push(`# ${title}`);
          h1Injected = true;
        }
      } else {
        if (!h1Injected) {
          bodyBlocks.push(`# ${title}`);
          h1Injected = true;
        }
        bodyBlocks.push(this.serializeBlockToMDX(blk));
      }
    });

    if (!h1Injected) {
      bodyBlocks.push(`# ${title}`);
    }

    return frontmatter + bodyBlocks.join('\n\n') + '\n';
  },

  serializeBlockToMDX(blk) {
    switch (blk.type) {
      case 'paragraph':
        return blk.text;
      case 'lead':
        return `<Lead>${blk.text}</Lead>`;
      case 'h2':
        return `## ${blk.text}`;
      case 'script':
        return `<ScriptBox title="${blk.title}">\n${blk.text}\n</ScriptBox>`;
      case 'alert':
        return `<Alert type="${blk.variant}" title="${blk.title}">\n${blk.text}\n</Alert>`;
      case 'calc':
        return `<AnatelCalculator />`;
      case 'list':
        return blk.children.map(c => `- ${c.text}`).join('\n');
      case 'steps': {
        const steps = blk.children
          .map(c => `  <Step title="${c.title}">\n    ${c.text}\n  </Step>`)
          .join('\n');
        return `<Steps>\n${steps}\n</Steps>`;
      }
      case 'dos-donts': {
        const items = blk.children
          .map(c => c.kind === 'dont' ? `  <Dont>${c.text}</Dont>` : `  <Do>${c.text}</Do>`)
          .join('\n');
        return `<DosAndDonts>\n${items}\n</DosAndDonts>`;
      }
      case 'plans': {
        const plans = blk.children.map(c => {
          const lines = c.features.split('\n').map(l => `    - ${l.replace(/^-\s*/, '').trim()}`).join('\n');
          const chipAttr = c.chip ? ` chip="${c.chip}"` : '';
          const featAttr = c.featured === 'true' ? ` featured="true"` : '';
          return `  <Plan speed="${c.speed}" price="${c.price}"${chipAttr}${featAttr}>\n${lines}\n  </Plan>`;
        }).join('\n');
        return `<PlanMatrix>\n${plans}\n</PlanMatrix>`;
      }
      case 'accordion': {
        const inner = blk.children.map(ch => this.serializeBlockToMDX(ch)).join('\n\n');
        return `<Accordion summary="${blk.summary}">\n${inner}\n</Accordion>`;
      }
      default:
        return '';
    }
  },

  updatePreview() {
    const rawMDX = this.generateMDXString();
    const compiled = MDXParser.parse(rawMDX);

    document.getElementById('liveVisualPreview').innerHTML = compiled.html;
    document.getElementById('liveCodePreview').textContent = rawMDX;
  },

  switchPreviewTab(tab) {
    const isVisual = tab === 'visual';
    document.getElementById('tabVisualBtn').classList.toggle('active', isVisual);
    document.getElementById('tabCodeBtn').classList.toggle('active', !isVisual);
    document.getElementById('liveVisualPreview').style.display = isVisual ? 'block' : 'none';
    document.getElementById('liveCodePreview').style.display = isVisual ? 'none' : 'block';
  },

  /* =========================================================
     EXPORT (.MDX DOWNLOAD) & LIVE PUBLISH TO APP
     ========================================================= */
  saveAndPublish() {
    const rawMDX = this.generateMDXString();
    const parsed = MDXParser.parse(rawMDX);
    const newDoc = {
      id: parsed.metadata.id,
      ...parsed.metadata,
      html: parsed.html,
      plainText: parsed.plainText,
      rawMDX
    };

    // Persist in localStorage so custom guidelines survive page reloads
    const savedCustom = JSON.parse(localStorage.getItem('argon_custom_mdx') || '[]');
    const existingIdx = savedCustom.findIndex(item => item.id === newDoc.id);
    if (existingIdx >= 0) {
      savedCustom[existingIdx] = rawMDX;
    } else {
      savedCustom.push({ id: newDoc.id, rawMDX });
    }
    localStorage.setItem('argon_custom_mdx', JSON.stringify(savedCustom));

    // Inject or update live in app.guidelines
    const liveIdx = app.guidelines.findIndex(g => g.id === newDoc.id);
    if (liveIdx >= 0) {
      app.guidelines[liveIdx] = newDoc;
    } else {
      app.guidelines.push(newDoc);
    }

    app.renderHomePills();
    app.renderAppsMenu();
    app.openGuideline(newDoc.id);
    app.showToast(`🚀 Diretriz "${newDoc.id}" publicada com sucesso!`);
  },

  downloadMDX() {
    const rawMDX = this.generateMDXString();
    const id = document.getElementById('metaId').value.trim() || 'nova-diretriz';
    const blob = new Blob([rawMDX], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.mdx`;
    a.click();
    URL.revokeObjectURL(url);
    app.showToast(`⬇️ Arquivo ${id}.mdx baixado!`);
  },

  resetBuilder() {
    if (!confirm('Deseja limpar todos os blocos atuais e iniciar uma página em branco?')) return;
    this.blocks = [];
    this.renderBlocksEditor();
    this.updatePreview();
  },

  esc(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
};

window.addEventListener('DOMContentLoaded', () => pageCreator.init());