// ============================================================================
// CLAY — Component Library
// Pre-built, polished website components in 10 design styles.
// The AI outputs a structured spec; the renderer assembles these components.
// ============================================================================

// ---- Color contrast helper ----
function luminance(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(c1, c2) {
  const l1 = luminance(c1), l2 = luminance(c2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function readableText(bg, light, dark) {
  return luminance(bg) > 0.5 ? dark : light;
}

// ---- CSS variables from palette ----
function paletteVars(p) {
  const bg = p[0] || '#FFFFFF';
  const primary = p[1] || '#000000';
  const secondary = p[2] || '#555555';
  const accent = p[3] || '#3B82F6';
  const text = p[4] || '#1A1A1A';
  const textOnAccent = readableText(accent, '#FFFFFF', '#000000');
  const textOnPrimary = readableText(primary, '#FFFFFF', '#000000');
  const muted = luminance(bg) > 0.5 ? '#6B7280' : '#9CA3AF';
  const border = luminance(bg) > 0.5 ? '#E5E7EB' : '#374151';
  return `--bg:${bg};--primary:${primary};--secondary:${secondary};--accent:${accent};--text:${text};--text-on-accent:${textOnAccent};--text-on-primary:${textOnPrimary};--muted:${muted};--border:${border};`;
}

// ============================================================================
// NAV COMPONENTS
// ============================================================================
const NAV = {
  topbar: (content, style) => `
<nav style="display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:var(--primary);color:var(--text-on-primary);position:sticky;top:0;z-index:100;${style === 'brutalism' ? 'border-bottom:4px solid var(--accent);' : ''}">
  <a href="#top" style="color:inherit;text-decoration:none;font-weight:800;font-size:1.25rem;letter-spacing:-0.03em;">${content.brand_name || 'Brand'}</a>
  <div style="display:flex;gap:1.5rem;align-items:center;" class="nav-links">
    ${(content.nav_links || ['Home', 'About', 'Services', 'Contact']).map((l, i) => `<a href="#${l.toLowerCase().replace(/\s/g, '-')}" style="color:inherit;text-decoration:none;font-size:0.9rem;opacity:0.85;transition:opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.85">${l}</a>`).join('')}
  </div>
  <a href="#contact" style="background:var(--accent);color:var(--text-on-accent);padding:0.5rem 1.2rem;border-radius:6px;text-decoration:none;font-weight:600;font-size:0.88rem;">${content.cta_text || 'Get in touch'}</a>
</nav>
<style>@media(max-width:768px){.nav-links{display:none!important;}}</style>`,

  sidebar: (content, style) => `
<div style="display:flex;min-height:100vh;">
  <aside style="width:240px;background:var(--primary);color:var(--text-on-primary);padding:2rem 1.5rem;position:fixed;height:100vh;overflow-y:auto;">
    <a href="#top" style="color:inherit;text-decoration:none;font-weight:800;font-size:1.3rem;letter-spacing:-0.03em;display:block;margin-bottom:2rem;">${content.brand_name || 'Brand'}</a>
    <nav style="display:flex;flex-direction:column;gap:0.5rem;">
      ${(content.nav_links || ['Home', 'About', 'Services', 'Contact']).map(l => `<a href="#${l.toLowerCase().replace(/\s/g, '-')}" style="color:inherit;text-decoration:none;font-size:0.92rem;padding:0.5rem 0.75rem;border-radius:6px;opacity:0.8;transition:opacity 0.2s,background 0.2s;" onmouseover="this.style.opacity=1;this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.opacity=0.8;this.style.background='transparent'">${l}</a>`).join('')}
    </nav>
  </aside>
  <main style="margin-left:240px;flex:1;">
  <div id="top"></div>`,
  // sidebar needs a closing </main></div> at the end — handled in renderer

  minimal: (content, style) => `
<nav style="display:flex;align-items:center;justify-content:space-between;padding:1.5rem 2rem;background:var(--bg);border-bottom:1px solid var(--border);">
  <a href="#top" style="color:var(--text);text-decoration:none;font-weight:700;font-size:1.1rem;letter-spacing:-0.02em;">${content.brand_name || 'Brand'}</a>
  <div style="display:flex;gap:2rem;align-items:center;" class="nav-links">
    ${(content.nav_links || ['About', 'Services', 'Contact']).map(l => `<a href="#${l.toLowerCase().replace(/\s/g, '-')}" style="color:var(--muted);text-decoration:none;font-size:0.88rem;transition:color 0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">${l}</a>`).join('')}
  </div>
</nav>
<style>@media(max-width:768px){.nav-links{display:none!important;}}</style>`,
};

// ============================================================================
// HERO COMPONENTS
// ============================================================================
const HERO = {
  centered: (content, style) => `
<section style="padding:5rem 2rem;text-align:center;max-width:800px;margin:0 auto;">
  <h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:1.1;letter-spacing:-0.03em;color:var(--text);margin-bottom:1rem;">${content.headline || 'Welcome'}</h1>
  <p style="font-size:1.15rem;color:var(--muted);max-width:540px;margin:0 auto 2rem;line-height:1.6;">${content.subheadline || ''}</p>
  <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
    <a href="#contact" style="background:var(--accent);color:var(--text-on-accent);padding:0.85rem 1.75rem;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem;">${content.cta_text || 'Get started'}</a>
    <a href="#about" style="background:transparent;color:var(--text);padding:0.85rem 1.75rem;border:2px solid var(--border);border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem;">Learn more</a>
  </div>
</section>`,

  split: (content, style) => `
<section style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;padding:4rem 2rem;max-width:1100px;margin:0 auto;align-items:center;">
  <div>
    <h1 style="font-size:clamp(1.8rem,4vw,3rem);font-weight:800;line-height:1.1;letter-spacing:-0.03em;color:var(--text);margin-bottom:1rem;">${content.headline || 'Welcome'}</h1>
    <p style="font-size:1.1rem;color:var(--muted);margin-bottom:1.5rem;line-height:1.6;">${content.subheadline || ''}</p>
    <a href="#contact" style="display:inline-block;background:var(--accent);color:var(--text-on-accent);padding:0.85rem 1.75rem;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem;">${content.cta_text || 'Get started'}</a>
  </div>
  <div style="background:var(--secondary);border-radius:12px;min-height:300px;display:flex;align-items:center;justify-content:center;color:var(--text-on-primary);font-size:0.9rem;opacity:0.9;">
    ${content.hero_image_placeholder || '<i>Image placeholder</i>'}
  </div>
</section>
<style>@media(max-width:768px){section[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important;}}</style>`,

  bold: (content, style) => `
<section style="background:var(--primary);color:var(--text-on-primary);padding:6rem 2rem;text-align:center;">
  <h1 style="font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;line-height:1.05;letter-spacing:-0.04em;margin-bottom:1.5rem;">${content.headline || 'Welcome'}</h1>
  <p style="font-size:1.2rem;opacity:0.8;max-width:560px;margin:0 auto 2.5rem;line-height:1.6;">${content.subheadline || ''}</p>
  <a href="#contact" style="display:inline-block;background:var(--accent);color:var(--text-on-accent);padding:1rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;">${content.cta_text || 'Get started'}</a>
</section>`,
};

// ============================================================================
// FEATURES / CARD GRID
// ============================================================================
const FEATURES = {
  '3-col': (content, style) => `
<section id="services" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
  <h2 style="font-size:2rem;font-weight:800;text-align:center;margin-bottom:0.5rem;color:var(--text);letter-spacing:-0.03em;">${content.title || 'What we offer'}</h2>
  <p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">${content.subtitle || ''}</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
    ${(content.cards || []).map(card => `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:1.75rem;${style === 'brutalism' ? 'border:3px solid var(--text);box-shadow:6px 6px 0 var(--accent);' : ''}">
        <div style="width:44px;height:44px;background:var(--accent-light,var(--bg));border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;color:var(--accent);font-size:1.2rem;"><i class="${card.icon || 'fa-solid fa-star'}"></i></div>
        <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:0.5rem;color:var(--text);">${card.title || ''}</h3>
        <p style="font-size:0.92rem;color:var(--muted);line-height:1.6;margin:0;">${card.description || ''}</p>
      </div>
    `).join('')}
  </div>
</section>
<style>@media(max-width:768px){div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important;}}</style>`,

  '2-col': (content, style) => `
<section id="services" style="padding:4rem 2rem;max-width:900px;margin:0 auto;">
  <h2 style="font-size:2rem;font-weight:800;text-align:center;margin-bottom:2.5rem;color:var(--text);letter-spacing:-0.03em;">${content.title || 'What we offer'}</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;">
    ${(content.cards || []).map(card => `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:2rem;display:flex;gap:1rem;align-items:flex-start;">
        <div style="width:48px;height:48px;background:var(--accent);color:var(--text-on-accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;"><i class="${card.icon || 'fa-solid fa-star'}"></i></div>
        <div>
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.4rem;color:var(--text);">${card.title || ''}</h3>
          <p style="font-size:0.92rem;color:var(--muted);line-height:1.6;margin:0;">${card.description || ''}</p>
        </div>
      </div>
    `).join('')}
  </div>
</section>
<style>@media(max-width:768px){div[style*="repeat(2,1fr)"]{grid-template-columns:1fr!important;}}</style>`,
};

// ============================================================================
// ABOUT SECTION
// ============================================================================
const ABOUT = {
  standard: (content, style) => `
<section id="about" style="padding:4rem 2rem;max-width:800px;margin:0 auto;">
  <h2 style="font-size:2rem;font-weight:800;margin-bottom:1rem;color:var(--text);letter-spacing:-0.03em;">${content.title || 'About us'}</h2>
  <p style="font-size:1.05rem;color:var(--muted);line-height:1.7;">${content.body || ''}</p>
</section>`,
};

// ============================================================================
// TESTIMONIAL
// ============================================================================
const TESTIMONIAL = {
  single: (content, style) => `
<section style="padding:4rem 2rem;background:var(--secondary);color:var(--text-on-primary);">
  <blockquote style="max-width:700px;margin:0 auto;text-align:center;font-size:1.5rem;font-weight:500;line-height:1.5;letter-spacing:-0.02em;">
    "${content.quote || ''}"
  </blockquote>
  <p style="text-align:center;margin-top:1.5rem;font-size:0.9rem;opacity:0.7;">— ${content.author || ''}</p>
</section>`,
};

// ============================================================================
// CTA BAND
// ============================================================================
const CTA = {
  band: (content, style) => `
<section style="padding:4rem 2rem;text-align:center;background:var(--primary);color:var(--text-on-primary);">
  <h2 style="font-size:2rem;font-weight:800;margin-bottom:0.75rem;letter-spacing:-0.03em;">${content.headline || 'Ready to start?'}</h2>
  <p style="opacity:0.8;margin-bottom:2rem;max-width:480px;margin-left:auto;margin-right:auto;">${content.subtitle || ''}</p>
  <a href="#contact" style="display:inline-block;background:var(--accent);color:var(--text-on-accent);padding:0.9rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;">${content.button_text || 'Get started'}</a>
</section>`,
};

// ============================================================================
// CONTACT FORM
// ============================================================================
const CONTACT = {
  standard: (content, style) => `
<section id="contact" style="padding:4rem 2rem;max-width:600px;margin:0 auto;">
  <h2 style="font-size:2rem;font-weight:800;margin-bottom:0.5rem;color:var(--text);letter-spacing:-0.03em;text-align:center;">${content.title || 'Get in touch'}</h2>
  <p style="text-align:center;color:var(--muted);margin-bottom:2rem;">${content.subtitle || 'We\'d love to hear from you.'}</p>
  <form onsubmit="event.preventDefault();this.querySelector('.form-success').style.display='block';this.querySelector('.form-fields').style.display='none';" style="display:flex;flex-direction:column;gap:1rem;">
    <div class="form-fields" style="display:flex;flex-direction:column;gap:1rem;">
      <input type="text" placeholder="Your name" required style="padding:0.85rem 1rem;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;background:var(--bg);color:var(--text);">
      <input type="email" placeholder="Your email" required style="padding:0.85rem 1rem;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;background:var(--bg);color:var(--text);">
      <textarea placeholder="Your message" required rows="5" style="padding:0.85rem 1rem;border:1px solid var(--border);border-radius:8px;font-size:0.95rem;background:var(--bg);color:var(--text);resize:vertical;"></textarea>
      <button type="submit" style="background:var(--accent);color:var(--text-on-accent);padding:0.85rem;border:none;border-radius:8px;font-weight:600;font-size:0.95rem;cursor:pointer;">Send message</button>
    </div>
    <div class="form-success" style="display:none;text-align:center;padding:2rem;background:var(--bg);border-radius:8px;color:var(--text);">
      <i class="fa-solid fa-check-circle" style="font-size:2rem;color:#16A34A;margin-bottom:0.5rem;"></i>
      <p style="font-weight:600;margin:0;">Thank you! Your message has been sent.</p>
    </div>
  </form>
  ${content.contact_details ? `<div style="margin-top:2rem;padding-top:2rem;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:center;font-size:0.88rem;color:var(--muted);">
    ${content.contact_details.email ? `<span><i class="fa-solid fa-envelope" style="color:var(--accent);"></i> ${content.contact_details.email}</span>` : ''}
    ${content.contact_details.phone ? `<span><i class="fa-solid fa-phone" style="color:var(--accent);"></i> ${content.contact_details.phone}</span>` : ''}
    ${content.contact_details.address ? `<span><i class="fa-solid fa-location-dot" style="color:var(--accent);"></i> ${content.contact_details.address}</span>` : ''}
  </div>` : ''}
</section>`,
};

// ============================================================================
// FOOTER
// ============================================================================
const FOOTER = {
  minimal: (content, style) => `
<footer style="padding:2rem;text-align:center;border-top:1px solid var(--border);color:var(--muted);font-size:0.85rem;">
  <p style="margin:0;">&copy; ${new Date().getFullYear()} ${content.brand_name || 'Brand'}. All rights reserved.</p>
</footer>`,

  rich: (content, style) => `
<footer style="background:var(--primary);color:var(--text-on-primary);padding:3rem 2rem;">
  <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:2rem;">
    <div>
      <h3 style="font-weight:800;font-size:1.2rem;margin-bottom:0.5rem;">${content.brand_name || 'Brand'}</h3>
      <p style="opacity:0.7;font-size:0.9rem;line-height:1.6;">${content.tagline || ''}</p>
    </div>
    <div>
      <h4 style="font-size:0.8rem;text-transform:uppercase;opacity:0.6;margin-bottom:0.75rem;letter-spacing:0.05em;">Links</h4>
      ${(content.nav_links || ['Home', 'About', 'Services', 'Contact']).map(l => `<div style="margin-bottom:0.4rem;"><a href="#${l.toLowerCase().replace(/\s/g, '-')}" style="color:inherit;text-decoration:none;opacity:0.8;font-size:0.88rem;">${l}</a></div>`).join('')}
    </div>
    <div>
      <h4 style="font-size:0.8rem;text-transform:uppercase;opacity:0.6;margin-bottom:0.75rem;letter-spacing:0.05em;">Connect</h4>
      ${(content.social_links || []).map(s => `<div style="margin-bottom:0.4rem;"><a href="#" style="color:inherit;text-decoration:none;opacity:0.8;font-size:0.88rem;"><i class="fa-brands fa-${s}"></i> ${s.charAt(0).toUpperCase() + s.slice(1)}</a></div>`).join('')}
    </div>
  </div>
  <div style="max-width:1100px;margin:2rem auto 0;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1);text-align:center;opacity:0.6;font-size:0.82rem;">
    &copy; ${new Date().getFullYear()} ${content.brand_name || 'Brand'}. All rights reserved.
  </div>
</footer>
<style>@media(max-width:768px){footer div[style*="grid-template-columns:2fr 1fr 1fr"]{grid-template-columns:1fr!important;gap:1.5rem;}}</style>`,
};

// ============================================================================
// RENDERER — assembles the full page from a spec
// ============================================================================
function renderSite(spec, palette, designStyle) {
  const cssVars = paletteVars(palette);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${spec.content.brand_name || 'Website'} — ${spec.content.tagline || ''}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',system-ui,sans-serif; ${cssVars} }
  html { scroll-behavior:smooth; }
  a { transition:opacity 0.2s; }
</style>
</head>
<body>`;

  // Logo (if uploaded)
  if (spec.logo) {
    // Replace brand_name text with logo image in nav
    spec.content.brand_name_html = `<img src="./logo.${spec.logo_ext || 'png'}" alt="${spec.content.brand_name || 'Logo'}" style="height:32px;max-width:150px;object-fit:contain;">`;
  }

  // Nav
  const navVariant = spec.components.nav || 'topbar';
  if (NAV[navVariant]) html += NAV[navVariant](spec.content, designStyle);

  // Sidebar nav needs special handling
  const isSidebar = navVariant === 'sidebar';

  // Hero
  const heroVariant = spec.components.hero || 'centered';
  if (HERO[heroVariant]) html += HERO[heroVariant](spec.content, designStyle);

  // Sections
  (spec.sections || []).forEach(section => {
    const componentMap = { features: FEATURES, about: ABOUT, testimonial: TESTIMONIAL, cta: CTA, contact: CONTACT };
    const variantMap = componentMap[section.type];
    if (variantMap && variantMap[section.variant]) {
      html += variantMap[section.variant](section.content || spec.content, designStyle);
    }
  });

  // Footer
  const footerVariant = spec.components.footer || 'minimal';
  if (FOOTER[footerVariant]) html += FOOTER[footerVariant](spec.content, designStyle);

  // Close sidebar nav
  if (isSidebar) html += `</main></div>`;

  // Script (smooth scroll, fade-in animations)
  html += `
<script>
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth' }); }
  });
});
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.style.opacity = '1'; });
}, { threshold: 0.1 });
document.querySelectorAll('section').forEach(s => {
  s.style.opacity = '0'; s.style.transition = 'opacity 0.6s'; observer.observe(s);
});
</script>
</body>
</html>`;

  return {
    'index.html': html,
    'styles.css': '/* Styles are inline for portability. This file is intentionally minimal. */\n',
    'script.js': '// Interactions are inline in index.html for portability.\n'
  };
}

// Expose globally
window.CLAY_COMPONENTS = { renderSite, paletteVars };
