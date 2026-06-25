// ============================================================================
// CLAY — Project View
// Loads a project, shows live preview, file browser, and publish flow.
// ============================================================================

let PROJECT = null;
let activeFile = null;
let publishPollTimer = null;

(async function () {
  const session = await clayRequireAuth();
  if (!session) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    toast('No project ID specified.');
    setTimeout(() => location.href = './dashboard.html', 1200);
    return;
  }

  try {
    const { data: proj, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!proj) throw new Error('Project not found');

    PROJECT = proj;
    renderProject();

    // If fresh generation, show a celebratory toast
    if (new URLSearchParams(location.search).get('fresh') === '1') {
      setTimeout(() => toast('Your website is ready! Review the preview below.'), 400);
    }
  } catch (e) {
    document.getElementById('loading').innerHTML = `
      <div class="alert alert-error" style="max-width:480px; margin:0 auto;">
        Could not load project: ${escapeHtml(e.message || e)}
        <br><a href="./dashboard.html" class="btn btn-sm" style="margin-top:0.75rem;">Back to dashboard</a>
      </div>`;
  }
})();

function renderProject() {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');

  document.getElementById('proj-name').textContent = PROJECT.name || 'Untitled';
  document.getElementById('proj-idea').textContent = PROJECT.business_idea || '';
  document.getElementById('slug-stamp').textContent = PROJECT.slug || 'no-slug';
  document.getElementById('created-at').textContent = new Date(PROJECT.created_at).toLocaleDateString();
  document.getElementById('updated-at').textContent = clayTimeAgo(PROJECT.updated_at);

  const status = PROJECT.status || 'draft';
  const pill = document.getElementById('status-pill');
  pill.textContent = status.toUpperCase();
  pill.className = `status-pill ${status}`;

  // Files
  const files = PROJECT.website_files || {};
  const fileNames = Object.keys(files);
  document.getElementById('file-count').textContent = fileNames.length;

  if (fileNames.length === 0) {
    document.getElementById('preview-iframe').srcdoc = '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#666">No files yet. Generate your website to see a preview.</body></html>';
  } else {
    renderPreview(files);
    renderFileBrowser(files);
  }

  // Sidebar
  renderSidebar();

  // Publish card state
  updatePublishCard();

  // Wire buttons
  document.getElementById('publish-btn').addEventListener('click', openPublishModal);
  document.getElementById('publish-btn-2').addEventListener('click', openPublishModal);
  document.getElementById('publish-cancel').addEventListener('click', closePublishModal);
  document.getElementById('publish-confirm').addEventListener('click', confirmPublish);
  document.getElementById('refresh-preview').addEventListener('click', () => {
    const iframe = document.getElementById('preview-iframe');
    iframe.srcdoc = iframe.srcdoc;
  });
  document.getElementById('fullscreen-preview').addEventListener('click', () => {
    if (PROJECT.website_files && PROJECT.website_files['index.html']) {
      const blob = new Blob([clayBuildPreviewSrcDoc(PROJECT.website_files)], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
    }
  });
  document.getElementById('regenerate-btn').addEventListener('click', () => {
    if (confirm('Regenerate this project? This will overwrite the current files. The questionnaire and design choices will be reused.')) {
      location.href = `./new-project.html?reuse=${PROJECT.id}`;
    }
  });

  // Deploy modal buttons
  document.getElementById('deploy-cancel-bg').addEventListener('click', () => {
    document.getElementById('deploy-modal').classList.remove('open');
  });
  document.getElementById('deploy-close').addEventListener('click', () => {
    document.getElementById('deploy-modal').classList.remove('open');
  });
}

function renderPreview(files) {
  const srcDoc = clayBuildPreviewSrcDoc(files);
  document.getElementById('preview-iframe').srcdoc = srcDoc;
  document.getElementById('preview-url').textContent = `claybuild.github.io/${PROJECT.slug || 'project'}/`;
}

function renderFileBrowser(files) {
  const browser = document.getElementById('file-browser');
  const icons = { '.html': 'fa-brands fa-html5', '.css': 'fa-brands fa-css3-alt', '.js': 'fa-brands fa-js' };
  browser.innerHTML = Object.keys(files).map(name => {
    const ext = '.' + name.split('.').pop();
    const ic = icons[ext] || 'fa-regular fa-file';
    return `<div class="file" data-file="${escapeAttr(name)}"><i class="${ic}"></i> ${escapeHtml(name)}</div>`;
  }).join('');

  browser.querySelectorAll('.file').forEach(el => {
    el.addEventListener('click', () => {
      browser.querySelectorAll('.file').forEach(f => f.classList.remove('active'));
      el.classList.add('active');
      activeFile = el.dataset.file;
      const code = files[activeFile] || '';
      document.getElementById('code-viewer').textContent = code;
    });
  });

  // Auto-select index.html
  if (files['index.html']) {
    browser.querySelector('.file[data-file="index.html"]')?.click();
  }
}

function renderSidebar() {
  // Design card
  const q = PROJECT.questionnaire || {};
  const answers = q.answers || {};
  const questions = q.questions || [];

  // Try to find design style and palette
  let style = '—', palette = '—', logo = '—';
  if (PROJECT.design_doc) {
    const styleMatch = PROJECT.design_doc.match(/design style[:\s]+([a-z]+)/i);
    if (styleMatch) style = styleMatch[1];
  }
  // Look in answers
  Object.keys(answers).forEach(k => {
    const v = answers[k];
    if (typeof v === 'string') {
      if (['minimalism','brutalism','swiss','neumorphism','editorial'].includes(v.toLowerCase())) {
        style = v;
      }
    }
  });

  if (PROJECT.logo_path) {
    logo = `<a href="#" id="view-logo"><i class="fa-regular fa-image"></i> View logo</a>`;
  } else {
    logo = 'None uploaded';
  }

  document.getElementById('kv-style').textContent = style;
  document.getElementById('kv-palette').textContent = palette;
  document.getElementById('kv-logo').innerHTML = logo;

  // Questionnaire
  const qaList = document.getElementById('qa-list');
  if (questions.length === 0) {
    qaList.innerHTML = '<div style="font-size:0.85rem; color:var(--ink-3);">No questionnaire data.</div>';
  } else {
    qaList.innerHTML = questions.map(q => `
      <div class="kv"><span class="k">${escapeHtml(q.id)}</span><span class="v">${escapeHtml(answers[q.id] || '—')}</span></div>
    `).join('');
  }
}

// ============================================================================
// PUBLISH FLOW
// ============================================================================
function updatePublishCard() {
  const card = document.getElementById('publish-card');
  if (PROJECT.status === 'published' && PROJECT.published_url) {
    card.innerHTML = `
      <h4>Your site is live</h4>
      <p>Open it, share it, or republish if you've made changes.</p>
      <a class="btn" href="${escapeAttr(PROJECT.published_url)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open site</a>
      <div class="published-url"><a href="${escapeAttr(PROJECT.published_url)}" target="_blank" rel="noopener">${escapeHtml(PROJECT.published_url)}</a></div>
    `;
  } else if (PROJECT.website_files && PROJECT.website_files['index.html']) {
    card.innerHTML = `
      <h4>Ready to publish?</h4>
      <p>Your website will be live at a URL like claybuild.github.io/your-project/ in about 60 seconds.</p>
      <button class="btn" id="publish-btn-2"><i class="fa-solid fa-rocket"></i> Publish now</button>
    `;
    document.getElementById('publish-btn-2').addEventListener('click', openPublishModal);
  } else {
    card.innerHTML = `
      <h4>Nothing to publish yet</h4>
      <p>Generate your website first, then you can publish it.</p>
      <a class="btn" href="./new-project.html?reuse=${PROJECT.id}">Generate website</a>
    `;
  }
}

function openPublishModal() {
  if (!PROJECT.website_files || !PROJECT.website_files['index.html']) {
    toast('Generate your website first.');
    return;
  }
  document.getElementById('publish-slug').value = PROJECT.slug || claySlugify(PROJECT.name);
  document.getElementById('publish-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  validateSlug();
}

function closePublishModal() {
  document.getElementById('publish-modal').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('publish-slug')?.addEventListener('input', validateSlug);

async function validateSlug() {
  const slug = document.getElementById('publish-slug').value.trim();
  const status = document.getElementById('slug-status');
  const err = document.getElementById('publish-modal-error');
  err.classList.add('hidden');

  if (!clayIsValidSlug(slug)) {
    status.textContent = 'Use 2–40 lowercase letters, numbers, and hyphens.';
    status.style.color = '#b3261e';
    return false;
  }

  // Check uniqueness (must not collide with another project's slug)
  const { data } = await supabase
    .from('projects')
    .select('id, name')
    .eq('slug', slug)
    .neq('id', PROJECT.id)
    .maybeSingle();

  if (data) {
    status.textContent = `Already taken by "${data.name}". Try another.`;
    status.style.color = '#b3261e';
    return false;
  }

  status.textContent = `Your URL: claybuild.github.io/${slug}/`;
  status.style.color = 'var(--ink-3)';
  return true;
}

async function confirmPublish() {
  const slug = document.getElementById('publish-slug').value.trim();
  const ok = await validateSlug();
  if (!ok) return;

  closePublishModal();
  openDeployModal(slug);
}

async function openDeployModal(slug) {
  document.getElementById('deploy-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('deploy-url').textContent = `https://claybuild.github.io/${slug}/`;
  document.getElementById('deploy-success').classList.add('hidden');
  document.getElementById('deploy-done-actions').classList.add('hidden');
  document.getElementById('deploy-actions').classList.remove('hidden');
  setDeployStage('push', 'active');

  const files = PROJECT.website_files;
  let logo_base64 = null, logo_ext = null;
  if (PROJECT.logo_path) {
    try {
      const { data } = await supabase.storage.from('project-assets').download(PROJECT.logo_path);
      if (data) {
        const buf = await data.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        logo_base64 = btoa(bin);
        logo_ext = PROJECT.logo_path.split('.').pop();
      }
    } catch (e) { console.warn('Logo fetch failed:', e); }
  }

  try {
    // 1. Call publish edge function
    setDeployStage('push', 'active');
    setDeployStage('build', '');
    setDeployStage('ready', '');
    document.getElementById('deploy-title').textContent = 'Pushing files to GitHub…';

    const result = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.PUBLISH, {
      slug,
      files,
      logo_base64,
      logo_ext,
    });

    // Record deployment in DB
    await supabase.from('deployments').insert({
      project_id: PROJECT.id,
      github_folder: slug,
      github_commit: result.last_commit,
      status: 'building',
      published_url: result.published_url,
    });

    // Update project slug + status
    await supabase.from('projects').update({
      slug,
      status: 'published',
      published_url: result.published_url,
    }).eq('id', PROJECT.id);
    PROJECT.slug = slug;
    PROJECT.published_url = result.published_url;
    PROJECT.status = 'published';

    setDeployStage('push', 'done');
    setDeployStage('build', 'active');
    document.getElementById('deploy-title').textContent = 'Triggering GitHub Pages build…';

    // 2. Poll for status
    setTimeout(() => pollDeployStatus(), 2500);
  } catch (e) {
    document.getElementById('deploy-title').textContent = 'Deployment failed';
    document.getElementById('deploy-sub').innerHTML = `<span style="color:#b3261e;">${escapeHtml(e.message || e)}</span>`;
    document.getElementById('deploy-actions').innerHTML = `<button class="btn" onclick="location.reload()">Retry</button>`;
  }
}

async function pollDeployStatus() {
  try {
    const result = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.PUBLISH_STATUS, {});
    if (result.ready) {
      setDeployStage('build', 'done');
      setDeployStage('ready', 'done');
      document.getElementById('deploy-title').textContent = 'Your site is live!';
      document.getElementById('deploy-sub').textContent = 'Open it in a new tab. If you see a 404, do a hard refresh (instructions below).';
      document.getElementById('deploy-success').classList.remove('hidden');
      const url = PROJECT.published_url || `https://claybuild.github.io/${PROJECT.slug}/`;
      document.getElementById('deploy-success-url').textContent = url;
      document.getElementById('deploy-success-url').href = url;
      document.getElementById('deploy-open').href = url;
      document.getElementById('deploy-actions').classList.add('hidden');
      document.getElementById('deploy-done-actions').classList.remove('hidden');

      // Update deployment record
      await supabase.from('deployments').update({ status: 'success' }).eq('project_id', PROJECT.id).order('created_at', { ascending: false }).limit(1);
      updatePublishCard();
      return;
    }
    setDeployStage('build', 'done');
    setDeployStage('ready', 'active');
    document.getElementById('deploy-title').textContent = 'Waiting for deployment to go live…';
    publishPollTimer = setTimeout(pollDeployStatus, 5000);
  } catch (e) {
    console.warn('Status poll error:', e);
    publishPollTimer = setTimeout(pollDeployStatus, 8000);
  }
}

function setDeployStage(stage, state) {
  const el = document.querySelector(`#deploy-progress .line[data-stage="${stage}"]`);
  if (!el) return;
  el.classList.remove('active','done');
  if (state) el.classList.add(state);
}

// ============================================================================
// UTILITIES
// ============================================================================
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
