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
  document.getElementById('slug-badge').textContent = PROJECT.slug || 'no-slug';
  document.getElementById('created-at').textContent = new Date(PROJECT.created_at).toLocaleDateString();
  document.getElementById('updated-at').textContent = clayTimeAgo(PROJECT.updated_at);

  const status = PROJECT.status || 'draft';
  const pill = document.getElementById('status-pill');
  pill.textContent = status.toUpperCase();
  pill.className = `status-pill ${status}`;

  // For published sites, change the Publish button to "Republish"
  if (status === 'published' && PROJECT.published_url) {
    const btn = document.getElementById('publish-btn');
    btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Republish';
    btn.title = 'Push the current website files to GitHub again (updates the live site)';
  }

  // Wire ALL buttons first, before any rendering that might throw
  wireButtons();

  // Files
  try {
    const files = PROJECT.website_files || {};
    const fileNames = Object.keys(files);
    document.getElementById('file-count').textContent = fileNames.length;

    if (fileNames.length === 0) {
      document.getElementById('preview-iframe').srcdoc = '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;color:#666">No files yet. Generate your website to see a preview.</body></html>';
    } else {
      renderPreview(files);
      renderFileBrowser(files);
    }
  } catch (e) { console.warn('File rendering error:', e); }

  // Sidebar
  try {
    renderSidebar();
  } catch (e) { console.warn('Sidebar rendering error:', e); }

  // Now update the publish card (may replace #publish-btn-2, so wire it inside updatePublishCard)
  try {
    updatePublishCard();
  } catch (e) { console.warn('Publish card error:', e); }
}

function wireButtons() {
  document.getElementById('publish-btn').addEventListener('click', openPublishModal);
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
  document.getElementById('edit-btn').addEventListener('click', () => {
    location.href = `./new-project.html?reuse=${PROJECT.id}&edit=1`;
  });
  document.getElementById('data-btn').addEventListener('click', () => {
    location.href = `./data.html?id=${PROJECT.id}`;
  });

  // File download function (used by file browser icons + download all)
  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
  window.downloadFile = downloadFile;
  document.getElementById('download-all')?.addEventListener('click', function() {
    if (!PROJECT.website_files) return;
    Object.keys(PROJECT.website_files).forEach(function(name) {
      var mime = name.endsWith('.html') ? 'text/html' : name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'text/javascript' : 'text/plain';
      downloadFile(name, PROJECT.website_files[name], mime);
    });
    toast('All files downloaded.');
  });
  document.getElementById('delete-btn').addEventListener('click', deleteProject);

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
    return `<div class="file" data-file="${escapeAttr(name)}"><i class="${ic}"></i> <span class="file-name">${escapeHtml(name)}</span> <i class="fa-solid fa-download file-download-icon" data-download="${escapeAttr(name)}" style="margin-left:auto;opacity:0.4;cursor:pointer;font-size:0.72rem;"></i></div>`;
  }).join('');

  browser.querySelectorAll('.file').forEach(el => {
    el.addEventListener('click', (e) => {
      // If clicking the download icon, download instead of select
      if (e.target.classList.contains('file-download-icon')) {
        e.stopPropagation();
        const fname = e.target.dataset.download;
        const mime = fname.endsWith('.html') ? 'text/html' : fname.endsWith('.css') ? 'text/css' : fname.endsWith('.js') ? 'text/javascript' : 'text/plain';
        downloadFile(fname, files[fname], mime);
        return;
      }
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
  const q = PROJECT.questionnaire || {};
  const answers = q.answers || {};
  const questions = q.questions || [];

  // Design style
  let style = q.design_style || '—';
  if (style === '—') {
    Object.keys(answers).forEach(k => {
      const v = answers[k];
      if (typeof v === 'string') {
        if (['minimalism','brutalism','swiss','neumorphism','editorial','glassmorphism','art-deco','corporate','playful','organic'].includes(v.toLowerCase())) {
          style = v;
        }
      }
    });
  }
  if (style === '—' && PROJECT.design_doc) {
    const styleMatch = PROJECT.design_doc.match(/design style[:\s]+([a-z-]+)/i);
    if (styleMatch) style = styleMatch[1];
  }
  if (style !== '—') style = style.charAt(0).toUpperCase() + style.slice(1);

  // Logo
  let logo = 'None uploaded';
  if (PROJECT.logo_path) {
    logo = '<a href="#" id="view-logo"><i class="fa-regular fa-image"></i> View logo</a>';
  } else if (q.logo_info) {
    logo = 'Uploaded (analyzed)';
  }

  document.getElementById('kv-style').textContent = style;
  document.getElementById('kv-logo').innerHTML = logo;

  // Wire up the View Logo button to open the logo in a new tab
  const viewLogoBtn = document.getElementById('view-logo');
  if (viewLogoBtn && PROJECT.logo_path) {
    viewLogoBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const { data } = await supabase.storage.from('project-assets').createSignedUrl(PROJECT.logo_path, 3600);
        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
      } catch (err) { toast('Could not load logo.'); }
    });
  }

  // Palette: show as visual swatches instead of text
  // If a logo was uploaded, derive palette from logo_info
  const swatchEl = document.getElementById('kv-palette-swatches');
  const hexEl = document.getElementById('kv-palette-hex');

  let paletteColors = null;
  if (q.palette && q.palette.colors && q.palette.colors.length) {
    paletteColors = q.palette.colors;
  } else if (q.logo_info) {
    // Derive palette from logo info
    paletteColors = [
      q.logo_info.recommended_background || '#FFFFFF',
      (q.logo_info.colors || ['#000000'])[0] || '#000000',
      (q.logo_info.colors || ['#555555'])[1] || '#555555',
      q.logo_info.recommended_accent || '#3B82F6',
      q.logo_info.recommended_text_color || '#1A1A1A',
    ];
  }

  if (paletteColors && swatchEl) {
    swatchEl.innerHTML = paletteColors.map(c => `<div style="background:${escapeAttr(c)}; flex:1;" title="${escapeAttr(c)}"></div>`).join('');
    hexEl.innerHTML = ''; // No hex codes, just visual swatches
  } else if (swatchEl) {
    swatchEl.innerHTML = '<div style="flex:1; display:flex; align-items:center; justify-content:center; color:var(--grey-400); font-size:0.78rem;">No palette</div>';
    hexEl.innerHTML = '';
  }

  // Questionnaire — full-width card grid
  const qaList = document.getElementById('qa-list');
  if (questions.length === 0) {
    qaList.innerHTML = '<div style="font-size:0.85rem; color:var(--text-3);">No answers recorded.</div>';
  } else {
    qaList.innerHTML = questions.map(q => {
      const answer = answers[q.id];
      const display = Array.isArray(answer) ? answer.join(', ') : (answer || '\u2014');
      return `
        <div class="qa-card-item">
          <div class="qa-q">${escapeHtml(q.question || q.id)}</div>
          <div class="qa-a">${escapeHtml(display)}</div>
        </div>
      `;
    }).join('');
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
      <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
        <a href="${escapeAttr(PROJECT.published_url)}" target="_blank" rel="noopener" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.7rem 1.3rem; background:#FFFFFF !important; color:var(--accent) !important; border:none; border-radius:var(--radius); font-weight:700; font-size:0.9rem; text-decoration:none !important; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><i class="fa-solid fa-arrow-up-right-from-square"></i> Open site</a>
        <button id="copy-link-btn" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.7rem 1.3rem; background:rgba(255,255,255,0.15) !important; color:#FFFFFF !important; border:1px solid rgba(255,255,255,0.3) !important; border-radius:var(--radius); font-weight:700; font-size:0.9rem; cursor:pointer; transition:background 0.15s;"><i class="fa-solid fa-link"></i> Copy link</button>
      </div>
      <button id="republish-btn" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.7rem 1.3rem; background:rgba(255,255,255,0.1) !important; color:#FFFFFF !important; border:1px solid rgba(255,255,255,0.25) !important; border-radius:var(--radius); font-weight:700; font-size:0.9rem; cursor:pointer; transition:background 0.15s;"><i class="fa-solid fa-rotate"></i> Republish</button>
    `;
    document.getElementById('copy-link-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(PROJECT.published_url).then(() => {
        toast('Link copied to clipboard!');
      }).catch(() => {
        toast('Could not copy link. Here it is: ' + PROJECT.published_url);
      });
    });
    document.getElementById('republish-btn').addEventListener('click', openPublishModal);
  } else if (PROJECT.website_files && PROJECT.website_files['index.html']) {
    card.innerHTML = `
      <h4>Ready to publish?</h4>
      <p>Your website will be live at a URL like claybuild.github.io/your-project/ in about 60 seconds.</p>
      <button id="publish-btn-2" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.7rem 1.3rem; background:#FFFFFF !important; color:var(--accent) !important; border:none !important; border-radius:var(--radius); font-weight:700; font-size:0.9rem; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><i class="fa-solid fa-rocket"></i> Publish now</button>
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

async function deleteProject() {
  if (!confirm('Delete this project? This will permanently remove it from your dashboard and delete the published folder from GitHub. This cannot be undone.')) return;

  try {
    // If the project was published, delete the folder from the GitHub repo
    if (PROJECT.slug) {
      try {
        await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.PUBLISH, {
          action: 'delete',
          slug: PROJECT.slug,
        });
      } catch (e) {
        console.warn('Folder deletion failed (non-fatal):', e);
        // Continue with DB deletion even if folder deletion fails
      }
    }

    // Delete from Supabase Storage if there's a logo
    if (PROJECT.logo_path) {
      try {
        await supabase.storage.from('project-assets').remove([PROJECT.logo_path]);
      } catch (e) { console.warn('Logo deletion failed:', e); }
    }

    // Delete the project row (cascades to project_assets, deployments, etc.)
    const { error } = await supabase.from('projects').delete().eq('id', PROJECT.id);
    if (error) throw error;

    toast('Project deleted.');
    setTimeout(() => { window.location.href = './dashboard.html'; }, 800);
  } catch (e) {
    toast('Could not delete project: ' + (e.message || e), 5000);
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
  // Reset the spinner (in case it was replaced with a checkmark on a previous deploy)
  var spinWrap = document.getElementById('deploy-spinner-wrap');
  if (spinWrap) spinWrap.innerHTML = '<div class="spinner spinner-lg"></div>';
  document.getElementById('deploy-title').textContent = 'Publishing your website…';
  document.getElementById('deploy-sub').textContent = 'This usually takes 45–60 seconds. Your site will appear at the link below.';
  setDeployStage('push', 'active');
  window._deployPollStart = null;

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
  // Track how long we've been polling. After 90 seconds, assume the site
  // is live (GitHub Pages builds typically take 30-60s, but the status
  // API can be flaky) and show the URL with the hard-refresh disclaimer.
  if (!window._deployPollStart) window._deployPollStart = Date.now();
  const elapsed = Date.now() - window._deployPollStart;

  try {
    const result = await clayInvoke(CLAY_CONFIG.EDGE_FUNCTIONS.PUBLISH_STATUS, {});
    console.log('[Clay] Deploy status:', result);

    if (result.ready || elapsed > 90000) {
      // Either the build is confirmed ready, OR we've waited 90s (timeout fallback)
      setDeployStage('build', 'done');
      setDeployStage('ready', 'done');
      // Hide the spinner — replace with a checkmark icon
      var spinWrap = document.getElementById('deploy-spinner-wrap');
      if (spinWrap) spinWrap.innerHTML = '<div style="width:48px;height:48px;border-radius:50%;background:var(--success-light);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto;"><i class="fa-solid fa-check"></i></div>';
      if (elapsed > 90000 && !result.ready) {
        document.getElementById('deploy-title').textContent = 'Your site should be live!';
        document.getElementById('deploy-sub').textContent = 'We timed out waiting for the build status, but your site is likely ready. If you see a 404, wait 30 seconds and do a hard refresh (instructions below).';
      } else {
        document.getElementById('deploy-title').textContent = 'Your site is live!';
        document.getElementById('deploy-sub').textContent = 'Open it in a new tab. If you see a 404, do a hard refresh (instructions below).';
      }
      document.getElementById('deploy-success').classList.remove('hidden');
      const url = PROJECT.published_url || `https://claybuild.github.io/${PROJECT.slug}/`;
      document.getElementById('deploy-success-url').textContent = url;
      document.getElementById('deploy-success-url').href = url;
      document.getElementById('deploy-open').href = url;
      document.getElementById('deploy-actions').classList.add('hidden');
      document.getElementById('deploy-done-actions').classList.remove('hidden');

      // Update deployment record
      try {
        await supabase.from('deployments').update({ status: 'success' }).eq('project_id', PROJECT.id).order('created_at', { ascending: false }).limit(1);
      } catch (e) { console.warn('Deploy record update failed:', e); }
      updatePublishCard();
      window._deployPollStart = null;
      return;
    }
    setDeployStage('build', 'done');
    setDeployStage('ready', 'active');
    document.getElementById('deploy-title').textContent = 'Waiting for deployment to go live…';
    publishPollTimer = setTimeout(pollDeployStatus, 5000);
  } catch (e) {
    console.warn('Status poll error:', e);
    // On error, still check the timeout
    if (elapsed > 90000) {
      // Timeout — show the URL anyway
      setDeployStage('build', 'done');
      setDeployStage('ready', 'done');
      var spinWrap2 = document.getElementById('deploy-spinner-wrap');
      if (spinWrap2) spinWrap2.innerHTML = '<div style="width:48px;height:48px;border-radius:50%;background:var(--success-light);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto;"><i class="fa-solid fa-check"></i></div>';
      document.getElementById('deploy-title').textContent = 'Your site should be live!';
      document.getElementById('deploy-sub').textContent = 'We timed out waiting for the build status, but your site is likely ready. If you see a 404, wait 30 seconds and do a hard refresh.';
      document.getElementById('deploy-success').classList.remove('hidden');
      const url = PROJECT.published_url || `https://claybuild.github.io/${PROJECT.slug}/`;
      document.getElementById('deploy-success-url').textContent = url;
      document.getElementById('deploy-success-url').href = url;
      document.getElementById('deploy-open').href = url;
      document.getElementById('deploy-actions').classList.add('hidden');
      document.getElementById('deploy-done-actions').classList.remove('hidden');
      updatePublishCard();
      window._deployPollStart = null;
      return;
    }
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
