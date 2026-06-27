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

  // Name choice radio buttons
  const customRadio = document.getElementById('name-choice-custom');
  const generateRadio = document.getElementById('name-choice-generate');
  const nameInput = document.getElementById('proj-name');
  const nameHint = document.getElementById('name-hint');

  function updateNameChoice() {
    const isCustom = customRadio.checked;
    nameInput.disabled = !isCustom;
    nameInput.style.opacity = isCustom ? '1' : '0.4';
    nameHint.textContent = isCustom ? 'Type your project name above.' : 'Clay will generate a creative name based on your idea.';
  }
  customRadio.addEventListener('change', updateNameChoice);
  generateRadio.addEventListener('change', updateNameChoice);
  updateNameChoice();

  // Custom palette
  setupCustomPalette();

  // Check if we're reusing an existing project (from project.html "Regenerate" or "Edit")
  const reuseId = new URLSearchParams(location.search).get('reuse');
  const editMode = new URLSearchParams(location.search).get('edit') === '1';
  const ideaParam = new URLSearchParams(location.search).get('idea');

  if (reuseId) {
    await loadExistingProject(reuseId, editMode);
  } else if (ideaParam) {
    // User came from home page or dashboard with a pre-filled idea
    document.getElementById('idea').value = ideaParam;
    STATE.business_idea = ideaParam;
    // Auto-advance to step 2 (name)
    setTimeout(function() { goToStep(2); }, 200);
  } else {
    // Populate step 1 with placeholder focus
    setTimeout(() => document.getElementById('idea').focus(), 100);
  }
})();

// Load an existing project's saved data.
// If editMode is true, start from step 1 (idea) so the user can walk through
// each step with pre-filled values. Otherwise, jump to the review step (step 6).
async function loadExistingProject(projectId, editMode) {
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

    // Recover design_style + palette from the enriched questionnaire
    if (q.design_style) STATE.design_style = q.design_style;
    if (q.palette) STATE.palette = q.palette;
    if (q.logo_info) {
      STATE.logo = { info: q.logo_info, file: null, dataUrl: null, mime: null, ext: null };
      // Try to fetch the actual logo image from storage for preview
      if (proj.logo_path) {
        try {
          const { data } = await supabase.storage.from('project-assets').createSignedUrl(proj.logo_path, 3600);
          if (data?.signedUrl) {
            STATE.logo.dataUrl = data.signedUrl;
            STATE.logo.ext = proj.logo_path.split('.').pop();
          }
        } catch (e) { console.warn('Logo fetch failed:', e); }
      }
    }

    // Restore the full AI-recommended palette list if it was saved
    if (q.color_palettes && q.color_palettes.length > 0) {
      STATE.color_palettes = q.color_palettes;
    } else if (STATE.palette) {
      // Fallback: if we have a selected palette but no list, seed with just that one
      STATE.color_palettes = [STATE.palette];
    }

    // Fallback: try to recover design_style from answers if not in questionnaire
    if (!STATE.design_style && STATE.answers) {
      Object.keys(STATE.answers).forEach(k => {
        const v = STATE.answers[k];
        if (typeof v === 'string') {
          if (['minimalism','brutalism','swiss','neumorphism','editorial','glassmorphism','art-deco','corporate','playful','organic'].includes(v.toLowerCase())) {
            STATE.design_style = v;
          }
        }
      });
    }

    // Populate the idea + name fields
    document.getElementById('idea').value = STATE.business_idea;
    document.getElementById('proj-name').value = STATE.project_name;

    hideLoadingScreen();

    if (editMode) {
      // Edit mode: start from step 1 so the user can walk through each step
      goToStep(1);
      toast('Edit your choices and click Generate when ready.');
    } else {
      // Regenerate mode: jump to review
      goToStep(6);
      renderReview();
      toast('Review your saved answers and click Generate to rebuild the website.');
    }
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
  // If the idea changed, mark it so step2Next knows to re-generate questions
  if (idea !== STATE.business_idea) {
    STATE._ideaChanged = true;
    // Clear existing questions/answers/palettes since they're stale
    STATE.questions = [];
    STATE.answers = {};
    STATE.color_palettes = [];
    STATE.design_styles = [];
  }
  STATE.business_idea = idea;
  goToStep(2);
}

// ============================================================================
// STEP 2: NAME → call ai-init (only if questions don't already exist or idea changed)
// ============================================================================
async function step2Next() {
  const generateMode = document.getElementById('name-choice-generate').checked;
  const name = generateMode ? '' : document.getElementById('proj-name').value.trim();

  if (!generateMode && name.length < 2) {
    toast('Please enter a project name, or select "Generate one for me".');
    return;
  }

  STATE.project_name = name; // may be "" if generate mode
  STATE._generateName = generateMode; // flag for generate() to know

  goToStep(3);

  // If we already have questions AND the idea hasn't changed, just re-render
  // the existing questions instead of calling the AI again. This makes the
  // edit flow much smoother — the user can go back, tweak answers, and
  // continue without waiting for a new AI call.
  if (STATE.questions && STATE.questions.length > 0 && !STATE._ideaChanged) {
    renderQuestions();
    renderPalettes();
    renderStyles();
    document.getElementById('step3-next').disabled = false;
    return;
  }

  // Otherwise, call the AI to generate fresh questions
  STATE._ideaChanged = false; // reset the flag
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

  // If a logo was previously uploaded (edit flow), show its preview
  if (STATE.logo && STATE.logo.info) {
    const previewWrap = document.getElementById('logo-preview-wrap');
    const previewImg = document.getElementById('logo-preview-img');
    const fileName = document.getElementById('logo-file-name');
    const colors = document.getElementById('logo-colors');
    const desc = document.getElementById('logo-desc');
    if (previewWrap && previewImg) {
      if (STATE.logo.dataUrl) previewImg.src = STATE.logo.dataUrl;
      if (fileName) fileName.textContent = 'logo.' + (STATE.logo.ext || 'png');
      const logoColors = (STATE.logo.info.colors || []).slice(0, 5);
      if (colors) colors.innerHTML = logoColors.map(c => `<span style="background:${escapeAttr(c)}" title="${escapeAttr(c)}"></span>`).join('');
      if (desc) desc.textContent = STATE.logo.info.description || '';
      previewWrap.classList.remove('hidden');
    }
    // Show logo colors in the palette preview
    const logoPalette = {
      name: 'Logo colors',
      colors: [
        STATE.logo.info.recommended_background || '#ffffff',
        (STATE.logo.info.colors || ['#000000'])[0] || '#000000',
        (STATE.logo.info.colors || ['#555555'])[1] || '#555555',
        STATE.logo.info.recommended_accent || '#3B82F6',
        STATE.logo.info.recommended_text_color || '#1A1A1A',
      ],
    };
    const url = clayPalettePreviewUrl(logoPalette);
    document.getElementById('palette-preview').src = url;
    document.getElementById('palette-preview-url').textContent = 'Palette preview. Logo colors';
  } else if (STATE.palette) {
    selectPalette(STATE.palette);
  } else if (STATE.color_palettes[0]) {
    selectPalette(STATE.color_palettes[0]);
  }
}

function renderPalettes() {
  const grid = document.getElementById('palette-grid');
  const paletteMatches = (a, b) => a && b && a.name === b.name && JSON.stringify(a.colors) === JSON.stringify(b.colors);
  grid.innerHTML = STATE.color_palettes.map((p, idx) => `
    <div class="palette-card ${paletteMatches(STATE.palette, p) ? 'selected' : ''}" data-idx="${idx}">
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
  // Compare by value (name + colors) not by reference, so it works when
  // palettes are restored from the database (different object instances)
  const paletteMatches = (a, b) => a && b && a.name === b.name && JSON.stringify(a.colors) === JSON.stringify(b.colors);
  document.querySelectorAll('.palette-card').forEach((card, idx) => {
    card.classList.toggle('selected', paletteMatches(STATE.color_palettes[idx], p));
  });
  // Update preview
  const url = clayPalettePreviewUrl(p);
  document.getElementById('palette-preview').src = url;
  document.getElementById('palette-preview-url').textContent = 'Palette preview · ' + p.name;
}

function setupCustomPalette() {
  const trigger = document.getElementById('custom-palette-trigger');
  const builder = document.getElementById('custom-palette-builder');
  const cardsContainer = document.getElementById('custom-palette-cards');
  const labels = ['Background', 'Primary', 'Secondary', 'Accent', 'Text'];
  const defaults = ['#FFFFFF', '#000000', '#555555', '#2563EB', '#0F172A'];
  let colors = [...defaults];

  // Build color cards
  function renderCards() {
    cardsContainer.innerHTML = labels.map((label, i) => {
      return '<div class="color-card" data-slot="' + i + '">' +
        '<div class="swatch" style="background:' + colors[i] + '"></div>' +
        '<div class="hex">' + colors[i] + '</div>' +
        '<div class="lbl">' + label + '</div>' +
        '<input type="color" value="' + colors[i] + '" data-slot="' + i + '">' +
      '</div>';
    }).join('');

    // Wire up color pickers
    cardsContainer.querySelectorAll('input[type=color]').forEach(input => {
      input.addEventListener('input', function() {
        const slot = parseInt(this.dataset.slot);
        colors[slot] = this.value.toUpperCase();
        const card = cardsContainer.querySelector('.color-card[data-slot="' + slot + '"]');
        card.querySelector('.swatch').style.background = colors[slot];
        card.querySelector('.hex').textContent = colors[slot];
      });
    });
  }

  trigger.addEventListener('click', () => {
    builder.classList.toggle('open');
    if (builder.classList.contains('open')) renderCards();
  });

  document.getElementById('custom-palette-apply').addEventListener('click', () => {
    const custom = { name: 'Custom palette', colors: [...colors] };
    STATE.color_palettes.push(custom);
    renderPalettes();
    selectPalette(custom);
    builder.classList.remove('open');
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
  // Always show ALL 10 styles — don't rely on the AI to shortlist.
  const ALL_STYLES = ["minimalism","brutalism","swiss","neumorphism","editorial","glassmorphism","art-deco","corporate","playful","organic"];
  grid.innerHTML = ALL_STYLES.map(style => `
    <div class="style-card ${STATE.design_style === style ? 'selected' : ''}" data-style="${escapeAttr(style)}">
      <div class="thumb"><iframe src="./samples/${escapeAttr(style)}.html" loading="lazy" sandbox="allow-same-origin allow-scripts"></iframe></div>
      <div class="body">
        <div class="name">${escapeHtml(style)}</div>
        <div class="desc">${escapeHtml(STYLE_DESCRIPTIONS[style] || '')}</div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => selectStyle(card.dataset.style));
  });

  // If a style was already selected (edit flow), show its preview
  if (STATE.design_style) {
    document.getElementById('style-preview').src = `./samples/${STATE.design_style}.html`;
    document.getElementById('style-preview-label').textContent = STATE.design_style.charAt(0).toUpperCase() + STATE.design_style.slice(1);
    document.getElementById('style-preview-url').textContent = 'Design style · ' + STATE.design_style.charAt(0).toUpperCase() + STATE.design_style.slice(1);
    document.getElementById('step5-next').disabled = false;
  }
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
    const logoColors = STATE.logo.info?.colors || [];
    const swatches = logoColors.map(c => `<span style="display:inline-block; width:24px; height:24px; background:${escapeAttr(c)}; border-radius:4px; border:1px solid var(--grey-200); margin-right:4px;" title="${escapeAttr(c)}"></span>`).join('');
    const logoName = STATE.logo.file?.name || ('logo.' + (STATE.logo.ext || 'png'));
    brandSection = `<dt>Logo</dt><dd>Uploaded ${escapeHtml(logoName)}<br>${swatches}</dd>`;
  } else if (STATE.palette && STATE.palette.name) {
    const swatches = (STATE.palette.colors || []).map(c => `<span style="display:inline-block; width:24px; height:24px; background:${escapeAttr(c)}; border-radius:4px; border:1px solid var(--grey-200); margin-right:4px;" title="${escapeAttr(c)}"></span>`).join('');
    brandSection = `<dt>Palette</dt><dd>${escapeHtml(STATE.palette.name)}<br>${swatches}</dd>`;
  } else {
    brandSection = `<dt>Brand</dt><dd><em style="color:var(--grey-500);">Not set. Click Edit to choose a palette or upload a logo.</em></dd>`;
  }

  container.innerHTML = `
    <div class="review-section">
      <div class="head"><h4>Identity</h4><a href="#" data-edit="1">Edit</a></div>
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

    // ---- 1b. Save design_style + palette to the questionnaire JSON NOW ----
    const enrichedQuestionnaire = {
      answers: STATE.answers,
      questions: STATE.questions,
      design_style: STATE.design_style,
      palette: STATE.logo ? null : STATE.palette,
      color_palettes: STATE.color_palettes,
      logo_info: STATE.logo?.info || null,
    };
    await supabase.from('projects').update({
      questionnaire: enrichedQuestionnaire,
    }).eq('id', projectId);

    // ---- 2. Generate the website spec (structured JSON, not raw code) ----
    updateGenStage('design', 'active');
    updateGenTitle('Planning your website…');

    let specResult = null;
    let specError = null;
    for (let specAttempt = 0; specAttempt < 3; specAttempt++) {
      if (specAttempt > 0) {
        updateGenTitle('Still planning (attempt ' + (specAttempt + 1) + ' of 3)…');
        await new Promise(r => setTimeout(r, 2000));
      }
      try {
        specResult = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.AI_GENERATE, {
          business_idea: STATE.business_idea,
          project_name: finalName,
          generate_name: STATE._generateName || false,
          questionnaire: { answers: STATE.answers, questions: STATE.questions },
          design_style: STATE.design_style,
          palette: STATE.logo ? null : STATE.palette,
          logo_info: STATE.logo?.info || null,
          slug: STATE.slug,
        });
        if (specResult && specResult.spec && specResult.spec.content) break;
        specError = 'Spec missing content field.';
        specResult = null;
      } catch (e) {
        specError = e.message || String(e);
        console.warn('[Clay] Spec attempt ' + (specAttempt + 1) + ' failed:', specError);
      }
    }

    if (!specResult || !specResult.spec) {
      throw new Error('Could not plan your website after 3 attempts. ' + (specError || 'Unknown error.') + ' Click Try Again to retry.');
    }
    updateGenStage('design', 'done');

    // ---- 3. Render the website from the spec using pre-built components ----
    updateGenStage('code', 'active');
    updateGenTitle('Creating your website…');

    const spec = specResult.spec;

    // ---- 2b. Shuffle sections for structural variety ----
    // The AI tends to always output the same section order. We shuffle the
    // middle sections (keeping contact last) so every generation looks different.
    if (spec.sections && spec.sections.length > 2) {
      // Find the contact section (always last)
      const contactIdx = spec.sections.findIndex(s => s.type === 'contact');
      let contactSection = null;
      let middleSections = [...spec.sections];

      if (contactIdx >= 0) {
        contactSection = middleSections.splice(contactIdx, 1)[0];
      }

      // Shuffle the middle sections
      for (let i = middleSections.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [middleSections[i], middleSections[j]] = [middleSections[j], middleSections[i]];
      }

      // Reassemble: shuffled middle sections + contact at the end
      spec.sections = contactSection ? [...middleSections, contactSection] : middleSections;
    }

    const palette = STATE.logo?.info ? [
      STATE.logo.info.recommended_background || '#FFFFFF',
      (STATE.logo.info.colors || ['#000000'])[0],
      (STATE.logo.info.colors || ['#555555'])[1] || '#555555',
      STATE.logo.info.recommended_accent || '#3B82F6',
      STATE.logo.info.recommended_text_color || '#1A1A1A',
    ] : (STATE.palette ? STATE.palette.colors : ['#FFFFFF', '#000000', '#555555', '#3B82F6', '#1A1A1A']);

    // If the AI generated a name (generate_name mode), use it
    if (STATE._generateName && spec.content.brand_name) {
      STATE.ai_name = spec.content.brand_name;
      // Update the project name in the DB
      const finalNameFromAI = spec.content.brand_name;
      STATE.slug = claySlugify(finalNameFromAI) || STATE.slug;
      await supabase.from('projects').update({
        name: finalNameFromAI,
        slug: STATE.slug,
      }).eq('id', projectId);
    }

    // If a logo was uploaded, tell the renderer to use it
    if (STATE.logo) {
      spec.logo = true;
      spec.logo_ext = STATE.logo.ext;
    }

    // Use the component library to render the final HTML
    STATE.website_files = window.CLAY_COMPONENTS.renderSite(spec, palette, STATE.design_style);

    updateGenStage('code', 'done');

    // ---- 4. Save files + (optional) upload logo to storage ----
    updateGenTitle('Saving your project…');
    await supabase.from('projects').update({
      website_files: STATE.website_files,
      design_doc: JSON.stringify(spec, null, 2), // save the spec as the design_doc for reference
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
    updateGenTitle('Done! Taking you to your preview…');
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
