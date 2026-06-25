// ============================================================================
// CLAY — New Project Wizard
// State machine: idea → name → AI questions → logo/palette → design style → review → generate
// ============================================================================

const STATE = {
  business_idea: "",
  project_name: null,        // what the user typed (may be "")
  ai_name: null,             // name from ai-init (used if user left blank)
  slug: null,
  tagline: "",
  questions: [],             // [{id,question,help_text,options,default}]
  color_palettes: [],        // [{name,colors:[5]}]
  design_styles: [],         // ["minimalism","swiss",...]
  answers: {},               // {question_id: value}
  logo: null,                // {file, dataUrl, mime, ext, info:{description,colors,...}} | null
  palette: null,             // {name, colors:[5]} — chosen if no logo
  custom_palette_inputs: null,
  design_style: null,        // string
  project_id: null,          // uuid once project row created
  design_doc: null,
  generation_prompt: null,
  website_files: null,
};

const STYLE_DESCRIPTIONS = {
  minimalism:  "Essential only. Whitespace, light typography, quiet confidence.",
  brutalism:   "Loud, raw, exposed. Big type, hard borders, zero apology.",
  swiss:       "Mathematical. 12-column grid, modular scale, asymmetric balance.",
  neumorphism: "Soft, tactile, extruded shadows. Monochrome depth.",
  editorial:   "Newspaper-grade. Serif headlines, drop caps, ruled sections.",
};

// ============================================================================
// INIT
// ============================================================================
(async function () {
  const session = await clayRequireAuth();
  if (!session) return;

  // Back buttons
  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.back) - 1));
  });

  // Step navigation
  document.getElementById('step1-next').addEventListener('click', step1Next);
  document.getElementById('step2-next').addEventListener('click', step2Next);
  document.getElementById('step3-next').addEventListener('click', step3Next);
  document.getElementById('step4-next').addEventListener('click', step4Next);
  document.getElementById('step5-next').addEventListener('click', step5Next);
  document.getElementById('generate-btn').addEventListener('click', generate);

  // Fullscreen previews
  document.getElementById('palette-fullscreen').addEventListener('click', () => openPreviewModal('palette'));
  document.getElementById('style-fullscreen').addEventListener('click', () => openPreviewModal('style'));
  document.getElementById('modal-close').addEventListener('click', closePreviewModal);

  // Logo upload
  setupLogoUpload();

  // Custom palette
  setupCustomPalette();

  // Populate step 1 with placeholder focus
  setTimeout(() => document.getElementById('idea').focus(), 100);
})();

// ============================================================================
// STEP NAVIGATION
// ============================================================================
function goToStep(n) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.wizard-step[data-step="${n}"]`).classList.add('active');
  document.querySelectorAll('.wizard-progress .step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.remove('active','done');
    if (sn < n) s.classList.add('done');
    else if (sn === n) s.classList.add('active');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// STEP 1: IDEA
// ============================================================================
function step1Next() {
  const idea = document.getElementById('idea').value.trim();
  if (idea.length < 10) {
    toast('Please describe your idea in at least a sentence.');
    return;
  }
  STATE.business_idea = idea;
  goToStep(2);
}

// ============================================================================
// STEP 2: NAME → call ai-init
// ============================================================================
async function step2Next() {
  const name = document.getElementById('proj-name').value.trim();
  STATE.project_name = name; // may be ""

  goToStep(3);
  await runAiInit();
}

async function runAiInit() {
  const container = document.getElementById('questions-container');
  try {
    const result = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.AI_INIT, {
      idea: STATE.business_idea,
      name: STATE.project_name || null,
    });

    STATE.ai_name = result.name;
    STATE.tagline = result.tagline || '';
    STATE.questions = result.questions || [];
    STATE.color_palettes = result.color_palettes || [];
    STATE.design_styles = result.design_styles || [];

    // Default answers to the AI's suggested defaults
    STATE.questions.forEach(q => {
      if (q.default && !STATE.answers[q.id]) STATE.answers[q.id] = q.default;
    });

    renderQuestions();
    renderPalettes();
    renderStyles();

    document.getElementById('step3-next').disabled = false;
  } catch (e) {
    container.innerHTML = `
      <div class="alert alert-error">
        Couldn't prepare your questions: ${escapeHtml(e.message || e)}.
        <br><button class="btn btn-sm" style="margin-top:0.75rem;" onclick="runAiInit()">Try again</button>
      </div>`;
  }
}

function renderQuestions() {
  const container = document.getElementById('questions-container');
  if (!STATE.questions.length) {
    container.innerHTML = '<div class="alert alert-info">No questions prepared. Click Continue to proceed.</div>';
    return;
  }
  container.innerHTML = STATE.questions.map(q => {
    const current = STATE.answers[q.id];
    return `
      <div class="q-card" data-qid="${q.id}">
        <div class="q-title">${escapeHtml(q.question)}</div>
        ${q.help_text ? `<div class="q-help">${escapeHtml(q.help_text)}</div>` : ''}
        <div class="q-options">
          ${q.options.map(opt => `
            <button type="button" class="q-opt ${current === opt ? 'selected' : ''}" data-opt="${escapeAttr(opt)}">
              <span class="dot"></span>${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
        <div class="q-custom">
          <span class="label">Or write your own:</span>
          <input class="input" type="text" data-custom="${q.id}" value="${current && !q.options.includes(current) ? escapeAttr(current) : ''}" placeholder="Custom answer…">
        </div>
      </div>
    `;
  }).join('');

  // Wire up option clicks
  container.querySelectorAll('.q-card').forEach(card => {
    const qid = card.dataset.qid;
    card.querySelectorAll('.q-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = btn.dataset.opt;
        STATE.answers[qid] = opt;
        card.querySelectorAll('.q-opt').forEach(b => b.classList.toggle('selected', b.dataset.opt === opt));
        card.querySelector(`input[data-custom="${qid}"]`).value = '';
      });
    });
    const customInput = card.querySelector(`input[data-custom="${qid}"]`);
    customInput.addEventListener('input', () => {
      STATE.answers[qid] = customInput.value;
      // Deselect option buttons
      card.querySelectorAll('.q-opt').forEach(b => b.classList.remove('selected'));
    });
  });
}

// ============================================================================
// STEP 3 → 4: Brand / palette / logo
// ============================================================================
function step3Next() {
  // Validate that all questions have answers
  const missing = STATE.questions.filter(q => !STATE.answers[q.id] || STATE.answers[q.id].toString().trim() === '');
  if (missing.length) {
    toast(`Please answer all questions (${missing.length} remaining).`);
    return;
  }
  goToStep(4);
  // Initialize palette preview with first palette
  if (!STATE.palette && STATE.color_palettes[0]) {
    selectPalette(STATE.color_palettes[0]);
  }
}

function renderPalettes() {
  const grid = document.getElementById('palette-grid');
  grid.innerHTML = STATE.color_palettes.map((p, idx) => `
    <div class="palette-card" data-idx="${idx}">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="palette-swatches">
        ${p.colors.map(c => `<div style="background:${escapeAttr(c)}"></div>`).join('')}
      </div>
      <div class="palette-hex">
        ${p.colors.map(c => `<span>${escapeHtml(c)}</span>`).join('')}
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.palette-card').forEach(card => {
    card.addEventListener('click', () => selectPalette(STATE.color_palettes[card.dataset.idx]));
  });
}

function selectPalette(p) {
  // If a logo is uploaded, palette selection is overridden by logo — show note
  if (STATE.logo) {
    toast('Logo colors are being used. Remove the logo to switch to a palette.');
    return;
  }
  STATE.palette = p;
  document.querySelectorAll('.palette-card').forEach((card, idx) => {
    card.classList.toggle('selected', STATE.color_palettes[idx] === p);
  });
  // Update preview
  const url = clayPalettePreviewUrl(p);
  document.getElementById('palette-preview').src = url;
  document.getElementById('palette-preview-url').textContent = url.replace(/^\.\//, '');
}

function setupCustomPalette() {
  const wrap = document.getElementById('custom-palette');
  // Sync color picker <-> hex text
  wrap.querySelectorAll('input[type=color]').forEach(c => {
    c.addEventListener('input', () => {
      wrap.querySelector(`input[data-slot-text="${c.dataset.slot}"]`).value = c.value.toUpperCase();
    });
  });
  wrap.querySelectorAll('input[data-slot-text]').forEach(t => {
    t.addEventListener('input', () => {
      const v = t.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        wrap.querySelector(`input[type=color][data-slot="${t.dataset.slotText}"]`).value = v;
      }
    });
  });
  document.getElementById('custom-palette-apply').addEventListener('click', () => {
    const slots = wrap.querySelectorAll('input[type=color]');
    const colors = Array.from(slots).map(s => s.value.toUpperCase());
    const custom = { name: 'Custom palette', colors };
    STATE.color_palettes.push(custom);
    renderPalettes();
    selectPalette(custom);
    // Scroll the new card into view
    const cards = document.querySelectorAll('.palette-card');
    cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Custom palette added.');
  });
}

function setupLogoUpload() {
  const drop = document.getElementById('logo-drop');
  const input = document.getElementById('logo-input');

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) handleLogoFile(input.files[0]);
  });

  document.getElementById('logo-remove').addEventListener('click', removeLogo);
}

async function handleLogoFile(file) {
  if (file.size > 4 * 1024 * 1024) {
    toast('Logo must be under 4MB.');
    return;
  }
  const dataUrl = await clayFileToBase64(file);
  const { mime, base64 } = clayParseDataUrl(dataUrl);
  const ext = clayExtFromMime(mime);

  // Show preview immediately
  document.getElementById('logo-preview-img').src = dataUrl;
  document.getElementById('logo-file-name').textContent = file.name;
  document.getElementById('logo-preview-wrap').classList.remove('hidden');
  document.getElementById('logo-colors').innerHTML = '<span class="spinner"></span>';
  document.getElementById('logo-desc').textContent = 'Analyzing logo…';

  STATE.logo = { file, dataUrl, mime, ext, info: null };

  try {
    const info = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.AI_LOGO_VISION, {
      image_base64: base64,
      mime_type: mime,
    });
    STATE.logo.info = info;

    const colors = (info.colors || []).slice(0, 5);
    document.getElementById('logo-colors').innerHTML = colors.map(c =>
      `<span style="background:${escapeAttr(c)}" title="${escapeAttr(c)}"></span>`
    ).join('');
    document.getElementById('logo-desc').textContent = info.description || '';

    // Clear palette selection (logo takes priority)
    STATE.palette = null;
    document.querySelectorAll('.palette-card').forEach(c => c.classList.remove('selected'));

    // Build a synthetic palette from the logo colors for preview
    const logoPalette = {
      name: 'Logo colors',
      colors: [
        info.recommended_background || '#ffffff',
        colors[0] || '#000000',
        colors[1] || '#555555',
        info.recommended_accent || colors[2] || '#ff6b35',
        info.recommended_text_color || '#1a1a1a',
      ],
    };
    // Update preview iframe with logo palette
    const url = clayPalettePreviewUrl(logoPalette);
    document.getElementById('palette-preview').src = url;
    document.getElementById('palette-preview-url').textContent = 'palette-preview.html (logo colors)';

    toast('Logo analyzed. Brand colors extracted.');
  } catch (e) {
    document.getElementById('logo-desc').textContent = 'Analysis failed: ' + (e.message || e);
    toast('Logo analysis failed, but you can still continue with a palette.');
  }
}

function removeLogo() {
  STATE.logo = null;
  document.getElementById('logo-preview-wrap').classList.add('hidden');
  document.getElementById('logo-input').value = '';
  // Reset preview to first palette
  if (STATE.color_palettes[0]) selectPalette(STATE.color_palettes[0]);
}

// ============================================================================
// STEP 4 → 5: design style
// ============================================================================
function step4Next() {
  if (!STATE.logo && !STATE.palette) {
    toast('Please upload a logo or pick a color palette.');
    return;
  }
  goToStep(5);
}

function renderStyles() {
  const grid = document.getElementById('style-grid');
  grid.innerHTML = STATE.design_styles.map(style => `
    <div class="style-card" data-style="${escapeAttr(style)}">
      <div class="thumb"><iframe src="./samples/${escapeAttr(style)}.html" loading="lazy" sandbox="allow-same-origin"></iframe></div>
      <div class="body">
        <div class="name">${escapeHtml(style)}</div>
        <div class="desc">${escapeHtml(STYLE_DESCRIPTIONS[style] || '')}</div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => selectStyle(card.dataset.style));
  });
}

function selectStyle(style) {
  STATE.design_style = style;
  document.querySelectorAll('.style-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.style === style);
  });
  document.getElementById('style-preview').src = `./samples/${style}.html`;
  document.getElementById('style-preview-label').textContent = style.charAt(0).toUpperCase() + style.slice(1);
  document.getElementById('style-preview-url').textContent = `samples/${style}.html`;
  document.getElementById('step5-next').disabled = false;
}

// ============================================================================
// STEP 5 → 6: review
// ============================================================================
function step5Next() {
  if (!STATE.design_style) {
    toast('Please pick a design style.');
    return;
  }
  goToStep(6);
  renderReview();
}

function renderReview() {
  const container = document.getElementById('review-container');
  const finalName = STATE.project_name || STATE.ai_name || 'Untitled project';
  STATE.slug = claySlugify(finalName);

  const brandSection = STATE.logo
    ? `<dt>Logo</dt><dd>Uploaded — ${escapeHtml(STATE.logo.file.name)}. Colors extracted: ${(STATE.logo.info?.colors || []).join(', ')}</dd>`
    : `<dt>Palette</dt><dd>${escapeHtml(STATE.palette?.name || '')} — ${(STATE.palette?.colors || []).join(', ')}</dd>`;

  container.innerHTML = `
    <div class="review-section">
      <div class="head"><h4>Identity</h4><a href="#" data-edit="2">Edit</a></div>
      <dl>
        <dt>Name</dt><dd>${escapeHtml(finalName)}</dd>
        <dt>Slug</dt><dd class="mono">${escapeHtml(STATE.slug)}</dd>
        <dt>Idea</dt><dd>${escapeHtml(STATE.business_idea)}</dd>
      </dl>
    </div>
    <div class="review-section">
      <div class="head"><h4>Questionnaire</h4><a href="#" data-edit="3">Edit</a></div>
      <dl>
        ${STATE.questions.map(q => `
          <dt>${escapeHtml(q.question)}</dt>
          <dd>${escapeHtml(STATE.answers[q.id] || '—')}</dd>
        `).join('')}
      </dl>
    </div>
    <div class="review-section">
      <div class="head"><h4>Brand</h4><a href="#" data-edit="4">Edit</a></div>
      <dl>${brandSection}</dl>
    </div>
    <div class="review-section">
      <div class="head"><h4>Design style</h4><a href="#" data-edit="5">Edit</a></div>
      <dl><dt>Style</dt><dd>${escapeHtml(STATE.design_style)}</dd></dl>
    </div>
  `;

  container.querySelectorAll('[data-edit]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      goToStep(parseInt(a.dataset.edit));
    });
  });
}

// ============================================================================
// GENERATE
// ============================================================================
async function generate() {
  const genScreen = document.getElementById('generating');
  genScreen.classList.add('show');
  document.body.style.overflow = 'hidden';

  const finalName = STATE.project_name || STATE.ai_name || 'Untitled project';
  STATE.slug = claySlugify(finalName) || 'project-' + Date.now().toString(36);

  try {
    // ---- 1. Ensure project row exists in DB ----
    updateGenStage('save', 'active');
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', STATE.slug)
      .maybeSingle();

    let projectId;
    if (existing?.id) {
      projectId = existing.id;
      await supabase.from('projects').update({
        name: finalName,
        business_idea: STATE.business_idea,
        questionnaire: { answers: STATE.answers, questions: STATE.questions },
        status: 'draft',
      }).eq('id', projectId);
    } else {
      const { data: proj, error } = await supabase.from('projects').insert({
        name: finalName,
        slug: STATE.slug,
        business_idea: STATE.business_idea,
        questionnaire: { answers: STATE.answers, questions: STATE.questions },
        status: 'draft',
      }).select('id').single();
      if (error) throw error;
      projectId = proj.id;
    }
    STATE.project_id = projectId;
    updateGenStage('save', 'done');

    // ---- 2. Generate design doc + generation prompt ----
    updateGenStage('design', 'active');
    updateGenTitle('Designing your design system…');

    const designPayload = {
      business_idea: STATE.business_idea,
      project_name: finalName,
      slug: STATE.slug,
      questionnaire: { answers: STATE.answers, questions: STATE.questions },
      design_style: STATE.design_style,
      logo_info: STATE.logo?.info || null,
      palette: STATE.logo ? null : STATE.palette,
    };

    const designResult = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.AI_DESIGN_DOC, designPayload);
    STATE.design_doc = designResult.design_doc;
    STATE.generation_prompt = designResult.generation_prompt;

    // Save design_doc to DB
    await supabase.from('projects').update({ design_doc: STATE.design_doc }).eq('id', projectId);
    updateGenStage('design', 'done');

    // ---- 3. Generate the website code ----
    updateGenStage('code', 'active');
    updateGenTitle('Writing your HTML, CSS & JavaScript…');

    const genResult = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.AI_GENERATE, {
      generation_prompt: STATE.generation_prompt,
      design_doc: STATE.design_doc,
      slug: STATE.slug,
    });
    STATE.website_files = genResult.files;
    updateGenStage('code', 'done');

    // ---- 4. Save files + (optional) upload logo to storage ----
    updateGenTitle('Saving to your project…');
    await supabase.from('projects').update({
      website_files: STATE.website_files,
      status: 'generated',
    }).eq('id', projectId);

    if (STATE.logo) {
      try {
        const path = `${projectId}/logo.${STATE.logo.ext}`;
        await supabase.storage.from('project-assets').upload(path, STATE.logo.file, { upsert: true });
        await supabase.from('projects').update({ logo_path: path }).eq('id', projectId);
      } catch (e) {
        console.warn('Logo upload to storage failed:', e);
      }
    }
    updateGenStage('save', 'done');

    // ---- 5. Redirect to project view ----
    updateGenTitle('Done. Taking you to your preview…');
    setTimeout(() => {
      window.location.href = `./project.html?id=${projectId}&fresh=1`;
    }, 800);

  } catch (e) {
    genScreen.classList.remove('show');
    document.body.style.overflow = '';
    toast('Generation failed: ' + (e.message || e), 8000);
    console.error(e);
  }
}

function updateGenStage(stage, state) {
  const el = document.querySelector(`#gen-steps div[data-stage="${stage}"]`);
  if (!el) return;
  el.classList.remove('active','done');
  el.classList.add(state);
}
function updateGenTitle(t) { document.getElementById('gen-title').textContent = t; }

// ============================================================================
// FULLSCREEN PREVIEW MODAL
// ============================================================================
function openPreviewModal(kind) {
  const iframe = document.getElementById('modal-iframe');
  const title = document.getElementById('modal-title');
  if (kind === 'palette') {
    iframe.src = document.getElementById('palette-preview').src;
    title.textContent = 'Palette preview';
  } else if (kind === 'style') {
    iframe.src = document.getElementById('style-preview').src;
    title.textContent = 'Design style preview';
  }
  document.getElementById('preview-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePreviewModal() {
  document.getElementById('preview-modal').classList.remove('open');
  document.getElementById('modal-iframe').src = 'about:blank';
  document.body.style.overflow = '';
}

// ============================================================================
// UTILITIES
// ============================================================================
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
