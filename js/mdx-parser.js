const MDXParser = {
  /**
   * Parses raw .mdx content into { metadata, html, plainText }
   */
  parse(rawContent) {
    const { metadata, body } = this.extractFrontmatter(rawContent);
    const html = this.compileBody(body, metadata);
    const plainText = body
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#*_`>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return { metadata, html, plainText };
  },

  /**
   * Extracts YAML-like frontmatter between --- delimiters
   */
  extractFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { metadata: {}, body: raw };

    const yamlLines = match[1].split(/\r?\n/);
    const metadata = {};

    yamlLines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      // Parse arrays like ["a", "b"]
      if (val.startsWith('[') && val.endsWith(']')) {
        try {
          val = JSON.parse(val);
        } catch {
          val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
        }
      }
      metadata[key] = val;
    });

    return { metadata, body: match[2] };
  },

  /**
   * Main compiler pipeline:
   * 1. Extracts custom XML blocks & replaces them with placeholders
   * 2. Compiles standard Markdown
   * 3. Re-injects compiled XML components
   */
  compileBody(body, metadata) {
    const blocks = [];
    const saveBlock = (renderedHtml) => {
      const id = `@@MDX_BLOCK_${blocks.length}@@`;
      blocks.push(renderedHtml);
      return `\n\n${id}\n\n`;
    };

    let text = body;

    // 1. <Badges>...</Badges>
    text = text.replace(/<Badges>([\s\S]*?)<\/Badges>/gi, (_, inner) => {
      const badgesHtml = inner.replace(
        /<Badge\s+type="([^"]+)"\s*>([\s\S]*?)<\/Badge>/gi,
        (__, type, label) => `<span class="badge badge-${type}">${label.trim()}</span>`
      );
      return saveBlock(`<div class="mdx-badges">${badgesHtml}</div>`);
    });

    // 2. <Lead>...</Lead>
    text = text.replace(/<Lead>([\s\S]*?)<\/Lead>/gi, (_, inner) => {
      return saveBlock(`<p class="mdx-lead">${this.parseInline(inner.trim())}</p>`);
    });

    // 3. <Alert type="..." title="...">...</Alert>
    text = text.replace(/<Alert\s+type="([^"]+)"\s+title="([^"]+)"\s*>([\s\S]*?)<\/Alert>/gi, (_, type, title, inner) => {
      const icons = { critical: '!', success: '✓', regulatory: 'ℹ', warning: '⚠' };
      const icon = icons[type] || 'ℹ';
      return saveBlock(`
        <div class="alert-box alert-${type}">
          <div class="alert-icon">${icon}</div>
          <div>
            <div class="alert-title">${title}</div>
            <div class="alert-body">${this.parseInline(inner.trim())}</div>
          </div>
        </div>
      `);
    });

    // 4. <ScriptBox title="...">...</ScriptBox>
    text = text.replace(/<ScriptBox\s+title="([^"]+)"\s*>([\s\S]*?)<\/ScriptBox>/gi, (_, title, inner) => {
      const cleanSpeech = inner.trim();
      const encodedSpeech = encodeURIComponent(cleanSpeech.replace(/\*\*/g, ''));
      return saveBlock(`
        <div class="script-box">
          <div class="script-box-header">
            <span class="script-box-title">🎙️ ${title}</span>
            <button class="btn-copy" onclick="app.copyScript(this, '${encodedSpeech}')">📋 Copiar Script</button>
          </div>
          <div class="script-speech">"${this.parseInline(cleanSpeech)}"</div>
        </div>
      `);
    });

    // 5. <Steps> & <Step title="...">
    text = text.replace(/<Steps>([\s\S]*?)<\/Steps>/gi, (_, inner) => {
      let stepCount = 0;
      const stepsHtml = inner.replace(/<Step\s+title="([^"]+)"\s*>([\s\S]*?)<\/Step>/gi, (__, title, content) => {
        stepCount++;
        return `
          <div class="step-item">
            <div class="step-number">${stepCount}</div>
            <div class="step-content">
              <div class="step-title">${title}</div>
              <div class="mdx-p">${this.parseInline(content.trim())}</div>
            </div>
          </div>
        `;
      });
      return saveBlock(`<div class="steps-container">${stepsHtml}</div>`);
    });

    // 6. <DosAndDonts>
    text = text.replace(/<DosAndDonts>([\s\S]*?)<\/DosAndDonts>/gi, (_, inner) => {
      const donts = [];
      const dos = [];
      inner.replace(/<Dont>([\s\S]*?)<\/Dont>/gi, (__, item) => donts.push(`<li>❌ ${this.parseInline(item.trim())}</li>`));
      inner.replace(/<Do>([\s\S]*?)<\/Do>/gi, (__, item) => dos.push(`<li>✅ ${this.parseInline(item.trim())}</li>`));

      return saveBlock(`
        <div class="dos-donts-grid">
          <div class="dont-col">
            <div class="col-header">Evite Falar (Proibido)</div>
            <ul class="mdx-list" style="list-style:none; margin-left:0;">${donts.join('')}</ul>
          </div>
          <div class="do-col">
            <div class="col-header">Prefira Falar (Recomendado)</div>
            <ul class="mdx-list" style="list-style:none; margin-left:0;">${dos.join('')}</ul>
          </div>
        </div>
      `);
    });

    // 7. <PlanMatrix> & <Plan>
    text = text.replace(/<PlanMatrix>([\s\S]*?)<\/PlanMatrix>/gi, (_, inner) => {
      const plansHtml = inner.replace(
        /<Plan\s+speed="([^"]+)"\s+price="([^"]+)"(?:\s+chip="([^"]+)")?(?:\s+featured="([^"]+)")?\s*>([\s\S]*?)<\/Plan>/gi,
        (__, speed, price, chip, featured, featuresRaw) => {
          const isFeatured = featured === 'true';
          const items = featuresRaw
            .trim()
            .split(/\r?\n/)
            .map(l => l.replace(/^-\s*/, '').trim())
            .filter(Boolean)
            .map(l => `<li>✓ ${this.parseInline(l)}</li>`)
            .join('');

          return `
            <div class="plan-card ${isFeatured ? 'featured' : ''}">
              ${chip ? `<span class="plan-chip">${chip}</span>` : ''}
              <div class="plan-speed">${speed}</div>
              <div class="plan-price">${price} <small>/mês</small></div>
              <ul class="mdx-list" style="list-style:none; margin-left:0;">${items}</ul>
            </div>
          `;
        }
      );
      return saveBlock(`<div class="plan-grid">${plansHtml}</div>`);
    });

    // 8. <Accordion summary="...">...</Accordion>
    text = text.replace(/<Accordion\s+summary="([^"]+)"\s*>([\s\S]*?)<\/Accordion>/gi, (_, summary, inner) => {
      const compiledInner = this.compileBody(inner.trim(), metadata);
      return saveBlock(`
        <div class="accordion-item">
          <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
            <span>${summary}</span>
            <span>⌄</span>
          </button>
          <div class="accordion-body">${compiledInner}</div>
        </div>
      `);
    });

    // 9. <AnatelCalculator />
    text = text.replace(/<AnatelCalculator\s*\/?>/gi, () => {
      return saveBlock(this.renderAnatelCalculator());
    });

    // Compile standard Markdown line by line
    const htmlLines = this.parseMarkdownLines(text);

    // Restore XML blocks
    let finalHtml = htmlLines;
    blocks.forEach((blockHtml, idx) => {
      finalHtml = finalHtml.replace(`@@MDX_BLOCK_${idx}@@`, blockHtml);
    });

    return finalHtml;
  },

  /**
   * Parses headings, lists, and paragraphs
   */
  parseMarkdownLines(text) {
    const lines = text.split(/\r?\n/);
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        continue;
      }

      if (line.startsWith('@@MDX_BLOCK_')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += line;
      } else if (line.startsWith('# ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h1 class="mdx-h1">${this.parseInline(line.slice(2))}</h1>`;
      } else if (line.startsWith('## ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2 class="mdx-h2">${this.parseInline(line.slice(3))}</h2>`;
      } else if (line.startsWith('### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3 class="mdx-h3">${this.parseInline(line.slice(4))}</h3>`;
      } else if (line.startsWith('- ')) {
        if (!inList) {
          html += '<ul class="mdx-list">';
          inList = true;
        }
        html += `<li>${this.parseInline(line.slice(2))}</li>`;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p class="mdx-p">${this.parseInline(line)}</p>`;
      }
    }

    if (inList) html += '</ul>';
    return html;
  },

  /**
   * Parses inline formatting: **bold**, *italic*, `code`, <kbd>
   */
  parseInline(str) {
    return str
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  },

  /**
   * Renders the interactive Anatel Fine & Savings Simulator widget
   */
  renderAnatelCalculator() {
    return `
      <div class="calc-widget">
        <div class="calc-grid">
          <div class="calc-field">
            <label>Multa Total do Contrato (R$)</label>
            <input type="number" id="calcFineTotal" value="360" oninput="app.runAnatelCalc()">
          </div>
          <div class="calc-field">
            <label>Meses Restantes de Fidelidade (1 a 12)</label>
            <input type="number" id="calcMonthsLeft" value="4" min="0" max="12" oninput="app.runAnatelCalc()">
          </div>
          <div class="calc-field">
            <label>Mensalidade Atual no Concorrente (R$)</label>
            <input type="number" id="calcCurrentBill" value="139.90" step="0.10" oninput="app.runAnatelCalc()">
          </div>
          <div class="calc-field">
            <label>Nova Mensalidade Argon (R$)</label>
            <input type="number" id="calcArgonBill" value="99.90" step="0.10" oninput="app.runAnatelCalc()">
          </div>
        </div>
        <div class="calc-results">
          <div>
            <div class="calc-stat-label">Multa Proporcional (Anatel)</div>
            <div class="calc-stat-value" id="resProportionalFine">R$ 120,00</div>
          </div>
          <div>
            <div class="calc-stat-label">Economia Anual na Argon</div>
            <div class="calc-stat-value positive" id="resAnnualSavings">R$ 480,00</div>
          </div>
          <div>
            <div class="calc-stat-label">Saldo Líquido p/ o Cliente</div>
            <div class="calc-stat-value positive" id="resNetBenefit">+ R$ 360,00</div>
          </div>
        </div>
      </div>
    `;
  }
};