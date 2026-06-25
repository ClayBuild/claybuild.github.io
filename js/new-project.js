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
  minimalism:   "Essential only. Whitespace, light typography, quiet confidence.",
  brutalism:    "Loud, raw, exposed. Big type, hard borders, zero apology.",
  swiss:        "Mathematical. 12-column grid, modular scale, asymmetric balance.",
  neumorphism:  "Soft, tactile, extruded shadows. Monochrome depth.",
  editorial:    "Newspaper-grade. Serif headlines, drop caps, ruled sections.",
  glassmorphism:"Frosted glass panels over vibrant gradients. Modern, airy.",
  "art-deco":   "1920s glamour. Gold + black, geometric patterns, ornate.",
  corporate:    "Professional B2B. Navy + white, structured, trustworthy.",
  playful:      "Bright, rounded, bouncy. Bold colors, casual and fun.",
  organic:      "Natural & biophilic. Sage greens, organic shapes, calm.",
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

  // Check if we're reusing an existing project (from project.html "Regenerate")
  const reuseId = new URLSearchParams(location.search).get('reuse');
  if (reuseId) {
    await loadExistingProject(reuseId);
  } else {
    // Populate step 1 with placeholder focus
    setTimeout(() => document.getElementById('idea').focus(), 100);
  }
})();

// Load an existing project's saved data and skip to the review step.
// This is used when the user clicks "Regenerate" on the project page.
async function loadExistingProject(projectId) {
  showLoadingScreen('Loading your project…');
  try {
    const { data: proj, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (error) throw error;
    if (!proj) throw new Error('Project not found');

    // Populate STATE from the saved project
    STATE.project_id = proj.id;
    STATE.business_idea = proj.business_idea || '';
    STATE.project_name = proj.name || '';
    STATE.ai_name = proj.name || '';
    STATE.slug = proj.slug || claySlugify(proj.name);

    const q = proj.questionnaire || {};
    STATE.questions = q.questions || [];
    STATE.answers = q.answers || {};

    // Try to recover palette / design style from the design_doc or answers
    // (we didn't save them as separate fields, so reconstruct from answers)
    if (STATE.answers) {
      Object.keys(STATE.answers).forEach(k => {
        const v = STATE.answers[k];
        if (typeof v === 'string') {
          if (['minimalism','brutalism','swiss','neumorphism','editorial','glassmorphism','art-deco','corporate','playful','organic'].includes(v.toLowerCase())) {
            STATE.design_style = v;
          }
        }
      });
    }

    // Populate the idea + name fields in case the user goes back
    document.getElementById('idea').value = STATE.business_idea;
    document.getElementById('proj-name').value = STATE.project_name;

    hideLoadingScreen();

    // Skip directly to the review step (step 6)
    // We need to render the review even if palette/styles aren't fully loaded
    // (the user can still regenerate from here)
    goToStep(6);
    renderReview();
    toast('Review your saved answers and click Generate to rebuild the website.');
  } catch (e) {
    hideLoadingScreen();
    toast('Could not load project: ' + (e.message || e), 5000);
    setTimeout(() => document.getElementById('idea').focus(), 100);
  }
}

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
  // Show loading spinner immediately so the user sees feedback (especially on retry)
  container.innerHTML = `
    <div style="text-align:center; padding:3rem;">
      <div class="spinner spinner-lg" style="margin:0 auto;"></div>
      <div style="margin-top:1rem; color:var(--grey-500); font-size:0.9rem;">Preparing your questions…</div>
    </div>`;
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
        <strong>Couldn't prepare your questions.</strong><br>
        ${escapeHtml(e.message || e)}
        <div style="margin-top:0.85rem; display:flex; gap:0.5rem;">
          <button class="btn btn-sm" id="retry-ai-init"><i class="fa-solid fa-rotate"></i> Try again</button>
          <button class="btn btn-ghost btn-sm" id="retry-ai-init-back">Back to idea</button>
        </div>
      </div>`;
    const retryBtn = container.querySelector('#retry-ai-init');
    if (retryBtn) retryBtn.addEventListener('click', runAiInit);
    const backBtn = container.querySelector('#retry-ai-init-back');
    if (backBtn) backBtn.addEventListener('click', () => goToStep(2));
  }
}

function renderQuestions() {
  const container = document.getElementById('questions-container');
  if (!STATE.questions.length) {
    container.innerHTML = '<div class="alert alert-info">No questions prepared. Click Continue to proceed.</div>';
    return;
  }
  container.innerHTML = STATE.questions.map(q => {
    const multi = q.multi_select === true;
    const current = STATE.answers[q.id];
    const isSel = (opt) => multi
      ? Array.isArray(current) && current.includes(opt)
      : current === opt;
    const multiHint = multi
      ? '<span class="q-multi-hint"><i class="fa-solid fa-check-double"></i> Select all that apply</span>'
      : '';
    return `
      <div class="q-card" data-qid="${q.id}" data-multi="${multi ? '1' : '0'}">
        <div class="q-title">${escapeHtml(q.question)}</div>
        ${q.help_text ? `<div class="q-help">${escapeHtml(q.help_text)}</div>` : ''}
        ${multiHint}
        <div class="q-options">
          ${q.options.map(opt => `
            <button type="button" class="q-opt ${isSel(opt) ? 'selected' : ''}" data-opt="${escapeAttr(opt)}">
              <span class="dot"></span>${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
        <div class="q-custom">
          <span class="label">${multi ? 'Or add your own (comma-separated):' : 'Or write your own:'}</span>
          <input class="input" type="text" data-custom="${q.id}" value="${customInputValue(q, current)}" placeholder="${multi ? 'Custom value, another value' : 'Custom answer…'}">
        </div>
      </div>
    `;
  }).join('');

  // Wire up option clicks
  container.querySelectorAll('.q-card').forEach(card => {
    const qid = card.dataset.qid;
    const multi = card.dataset.multi === '1';
    card.querySelectorAll('.q-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const opt = btn.dataset.opt;
        if (multi) {
          let arr = Array.isArray(STATE.answers[qid]) ? [...STATE.answers[qid]] : [];
          if (arr.includes(opt)) arr = arr.filter(x => x !== opt);
          else arr.push(opt);
          STATE.answers[qid] = arr;
          btn.classList.toggle('selected', arr.includes(opt));
        } else {
          STATE.answers[qid] = opt;
          card.querySelectorAll('.q-opt').forEach(b => b.classList.toggle('selected', b.dataset.opt === opt));
          card.querySelector(`input[data-custom="${qid}"]`).value = '';
        }
      });
    });
    const customInput = card.querySelector(`input[data-custom="${qid}"]`);
    customInput.addEventListener('input', () => {
      if (multi) {
        const parts = customInput.value.split(',').map(s => s.trim()).filter(Boolean);
        STATE.answers[qid] = parts;
        // Don't deselect option buttons in multi mode — user might mix presets + custom
      } else {
        STATE.answers[qid] = customInput.value;
        card.querySelectorAll('.q-opt').forEach(b => b.classList.remove('selected'));
      }
    });
  });
}

function customInputValue(q, current) {
  if (q.multi_select === true) {
    if (!Array.isArray(current) || current.length === 0) return '';
    // Show custom values that aren't in the preset options
    const custom = current.filter(v => !q.options.includes(v));
    return custom.join(', ');
  }
  // Single-select: show value only if it's not one of the preset options
  return (current && !q.options.includes(current)) ? escapeAttr(current) : '';
}

function formatAnswer(a) {
  if (Array.isArray(a)) return a.length ? a.join(', ') : '—';
  return a || '—';
}

// ============================================================================
// STEP 3 → 4: Brand / palette / logo
// ============================================================================
function step3Next() {
  // Validate that all questions have answers
  const missing = STATE.questions.filter(q => {
    const a = STATE.answers[q.id];
    if (Array.isArray(a)) return a.length === 0;
    return !a || a.toString().trim() === '';
  });
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
  document.getElementById('palette-preview-url').textContent = 'Palette preview · ' + p.name;
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
    document.getElementById('palette-preview-url').textContent = 'Palette preview · Logo colors';

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
  document.getElementById('style-preview-url').textContent = 'Design style · ' + style.charAt(0).toUpperCase() + style.slice(1);
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

  let brandSection;
  if (STATE.logo) {
    brandSection = `<dt>Logo</dt><dd>Uploaded — ${escapeHtml(STATE.logo.file.name)}. Colors extracted: ${(STATE.logo.info?.colors || []).join(', ')}</dd>`;
  } else if (STATE.palette && STATE.palette.name) {
    brandSection = `<dt>Palette</dt><dd>${escapeHtml(STATE.palette.name)} — ${(STATE.palette.colors || []).join(', ')}</dd>`;
  } else {
    brandSection = `<dt>Brand</dt><dd><em style="color:var(--grey-500);">Not set — click Edit to choose a palette or upload a logo.</em></dd>`;
  }

  container.innerHTML = `
    <div class="review-section">
      <div class="head"><h4>Identity</h4><a href="#" data-edit="2">Edit</a></div>
      <dl>
        <dt>Name</dt><dd>${escapeHtml(finalName)}</dd>
        <dt>Idea</dt><dd>${escapeHtml(STATE.business_idea)}</dd>
      </dl>
    </div>
    <div class="review-section">
      <div class="head"><h4>Questionnaire</h4><a href="#" data-edit="3">Edit</a></div>
      <dl>
        ${STATE.questions.map(q => `
          <dt>${escapeHtml(q.question)}</dt>
          <dd>${escapeHtml(formatAnswer(STATE.answers[q.id]))}</dd>
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
    // Reset all stages to initial state
    resetGenStages();

    // Get the authenticated user's id (required for the projects.owner_id column)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated. Please sign in again.');

    // ---- 1. Ensure project row exists in DB (silent — no stage update) ----
    // If we're reusing an existing project (STATE.project_id is set), update it.
    // Otherwise, check by slug and insert if new.
    let projectId;
    if (STATE.project_id) {
      // Reusing an existing project — just update it
      projectId = STATE.project_id;
      const { error: updErr } = await supabase.from('projects').update({
        name: finalName,
        slug: STATE.slug,
        business_idea: STATE.business_idea,
        questionnaire: { answers: STATE.answers, questions: STATE.questions },
        status: 'draft',
      }).eq('id', projectId);
      if (updErr) throw updErr;
    } else {
      // New project — check if slug exists first
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', STATE.slug)
        .maybeSingle();

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
          owner_id: user.id,
          business_idea: STATE.business_idea,
          questionnaire: { answers: STATE.answers, questions: STATE.questions },
          status: 'draft',
        }).select('id').single();
        if (error) throw error;
        projectId = proj.id;
      }
    }
    STATE.project_id = projectId;

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
    console.error('Generation failed:', e);
    // Show the error ON the generating screen (don't just close it — the user
    // needs to know what went wrong and have a way to retry).
    const errMsg = e.message || String(e);
    document.getElementById('gen-title').textContent = 'Generation failed';
    document.getElementById('gen-sub').innerHTML =
      '<span style="color:#DC2626; font-weight:500;">' + escapeHtml(errMsg) + '</span><br><br>' +
      'If this is a rate-limit error, wait 10 seconds and try again. ' +
      'Your project has been saved — you can retry generation without losing your answers.';
    document.querySelector('.generating-screen .icon-wrap').innerHTML =
      '<div style="width:48px; height:48px; border-radius:50%; background:#FEF2F2; color:#DC2626; display:flex; align-items:center; justify-content:center; font-size:1.5rem;"><i class="fa-solid fa-triangle-exclamation"></i></div>';
    document.getElementById('gen-steps').style.display = 'none';
    // Add retry button
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex; gap:0.5rem; justify-content:center; margin-top:1rem;';
    actionsDiv.innerHTML =
      '<button class="btn" id="gen-retry"><i class="fa-solid fa-rotate"></i> Try again</button>' +
      '<button class="btn btn-ghost" id="gen-back">Back to review</button>';
    genScreen.appendChild(actionsDiv);
    document.getElementById('gen-retry').addEventListener('click', () => {
      // Reset the screen and retry
      document.querySelector('.generating-screen .icon-wrap').innerHTML = '<div class="spinner"></div>';
      document.getElementById('gen-steps').style.display = '';
      actionsDiv.remove();
      generate();
    });
    document.getElementById('gen-back').addEventListener('click', () => {
      genScreen.classList.remove('show');
      document.body.style.overflow = '';
      actionsDiv.remove();
      // Reset icon for next time
      document.querySelector('.generating-screen .icon-wrap').innerHTML = '<div class="spinner"></div>';
      document.getElementById('gen-steps').style.display = '';
    });
  }
}

function resetGenStages() {
  document.querySelectorAll('#gen-steps div[data-stage]').forEach(el => {
    el.classList.remove('active','done');
  });
}
function updateGenStage(stage, state) {
  const el = document.querySelector(`#gen-steps div[data-stage="${stage}"]`);
  if (!el) return;
  el.classList.remove('active','done');
  if (state) el.classList.add(state);
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
