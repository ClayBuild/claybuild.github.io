// ============================================================================
// CLAY — Component Library v2
// Production-ready components with per-style polish, animations, and hover states.
// Each of the 10 design styles gets its own distinct visual treatment.
// ============================================================================

// ---- Color helpers ----
function luminance(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function readableText(bg, light, dark) {
  return luminance(bg) > 0.5 ? dark : light;
}

// ============================================================================
// STYLE CONFIGURATION — defines each style's personality
// ============================================================================
const STYLE_CONFIG = {
  minimalism: {
    font: "'Inter', sans-serif",
    headingFont: "'Inter', sans-serif",
    headingWeight: '800',
    googleFonts: 'Inter:wght@300;400;500;600;700;800',
    radius: '4px',
    cardBorder: '1px solid var(--border)',
    cardShadow: 'none',
    cardHoverShadow: '0 8px 24px rgba(0,0,0,0.06)',
    cardHoverTransform: 'translateY(-2px)',
    btnRadius: '4px',
    btnTransition: 'all 0.2s ease',
    navBg: 'var(--bg)',
    navBorder: '1px solid var(--border)',
    sectionPadding: '6rem 2rem',
    maxWidth: '1100px',
    animation: 'fade-up',
    letterSpacing: '-0.03em',
  },
  brutalism: {
    font: "'Space Mono', monospace",
    headingFont: "'Archivo Black', sans-serif",
    headingWeight: '400',
    googleFonts: 'Space+Mono:wght@400;700|Archivo+Black',
    radius: '0',
    cardBorder: '3px solid var(--text)',
    cardShadow: '6px 6px 0 var(--text)',
    cardHoverShadow: '8px 8px 0 var(--accent)',
    cardHoverTransform: 'translate(-2px,-2px)',
    btnRadius: '0',
    btnTransition: 'all 0.1s ease',
    navBg: 'var(--bg)',
    navBorder: '4px solid var(--text)',
    sectionPadding: '5rem 2rem',
    maxWidth: '1200px',
    animation: 'slide-in',
    letterSpacing: '-0.02em',
  },
  swiss: {
    font: "'Inter', sans-serif",
    headingFont: "'Inter', sans-serif",
    headingWeight: '900',
    googleFonts: 'Inter:wght@400;500;600;700;800;900',
    radius: '0',
    cardBorder: '1px solid var(--border)',
    cardShadow: 'none',
    cardHoverShadow: 'none',
    cardHoverTransform: 'none',
    btnRadius: '0',
    btnTransition: 'background 0.2s, color 0.2s',
    navBg: 'var(--bg)',
    navBorder: '2px solid var(--text)',
    sectionPadding: '5rem 2rem',
    maxWidth: '1200px',
    animation: 'fade-up',
    letterSpacing: '-0.04em',
  },
  neumorphism: {
    font: "'Poppins', sans-serif",
    headingFont: "'Poppins', sans-serif",
    headingWeight: '600',
    googleFonts: 'Poppins:wght@300;400;500;600;700',
    radius: '16px',
    cardBorder: 'none',
    cardShadow: '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)',
    cardHoverShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
    cardHoverTransform: 'none',
    btnRadius: '12px',
    btnTransition: 'all 0.3s ease',
    navBg: 'var(--bg)',
    navBorder: 'none',
    sectionPadding: '4rem 2rem',
    maxWidth: '1100px',
    animation: 'scale-in',
    letterSpacing: '-0.02em',
  },
  editorial: {
    font: "'Source Serif Pro', serif",
    headingFont: "'Playfair Display', serif",
    headingWeight: '700',
    googleFonts: 'Playfair+Display:wght@400;700;900|Source+Serif+Pro:wght@400;600',
    radius: '2px',
    cardBorder: '1px solid var(--border)',
    cardShadow: 'none',
    cardHoverShadow: '0 4px 12px rgba(0,0,0,0.08)',
    cardHoverTransform: 'translateY(-2px)',
    btnRadius: '2px',
    btnTransition: 'all 0.2s ease',
    navBg: 'var(--bg)',
    navBorder: '3px double var(--text)',
    sectionPadding: '5rem 2rem',
    maxWidth: '780px',
    animation: 'fade-up',
    letterSpacing: '-0.015em',
  },
  glassmorphism: {
    font: "'Inter', sans-serif",
    headingFont: "'Poppins', sans-serif",
    headingWeight: '700',
    googleFonts: 'Poppins:wght@400;500;600;700|Inter:wght@400;500;600',
    radius: '16px',
    cardBorder: '1px solid rgba(255,255,255,0.2)',
    cardShadow: '0 8px 32px rgba(0,0,0,0.1)',
    cardHoverShadow: '0 12px 40px rgba(0,0,0,0.15)',
    cardHoverTransform: 'translateY(-4px)',
    btnRadius: '12px',
    btnTransition: 'all 0.3s ease',
    navBg: 'rgba(255,255,255,0.1)',
    navBorder: '1px solid rgba(255,255,255,0.15)',
    sectionPadding: '5rem 2rem',
    maxWidth: '1100px',
    animation: 'scale-in',
    letterSpacing: '-0.02em',
  },
  'art-deco': {
    font: "'Inter', sans-serif",
    headingFont: "'Playfair Display', serif",
    headingWeight: '700',
    googleFonts: 'Playfair+Display:wght@400;700;900|Inter:wght@400;500;600',
    radius: '2px',
    cardBorder: '2px solid var(--accent)',
    cardShadow: '0 4px 20px rgba(0,0,0,0.15)',
    cardHoverShadow: '0 8px 30px rgba(0,0,0,0.2)',
    cardHoverTransform: 'translateY(-3px)',
    btnRadius: '2px',
    btnTransition: 'all 0.3s ease',
    navBg: 'var(--bg)',
    navBorder: '2px solid var(--accent)',
    sectionPadding: '5rem 2rem',
    maxWidth: '1100px',
    animation: 'fade-up',
    letterSpacing: '0.02em',
  },
  corporate: {
    font: "'Inter', sans-serif",
    headingFont: "'Inter', sans-serif",
    headingWeight: '700',
    googleFonts: 'Inter:wght@400;500;600;700;800',
    radius: '8px',
    cardBorder: '1px solid var(--border)',
    cardShadow: '0 1px 3px rgba(0,0,0,0.05)',
    cardHoverShadow: '0 8px 25px rgba(0,0,0,0.1)',
    cardHoverTransform: 'translateY(-3px)',
    btnRadius: '8px',
    btnTransition: 'all 0.2s ease',
    navBg: 'var(--bg)',
    navBorder: '1px solid var(--border)',
    sectionPadding: '5rem 2rem',
    maxWidth: '1140px',
    animation: 'fade-up',
    letterSpacing: '-0.02em',
  },
  playful: {
    font: "'Nunito', sans-serif",
    headingFont: "'Nunito', sans-serif",
    headingWeight: '800',
    googleFonts: 'Nunito:wght@400;600;700;800;900',
    radius: '20px',
    cardBorder: 'none',
    cardShadow: '0 4px 0 var(--text)',
    cardHoverShadow: '0 6px 0 var(--accent)',
    cardHoverTransform: 'translateY(-2px)',
    btnRadius: '16px',
    btnTransition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
    navBg: 'var(--bg)',
    navBorder: 'none',
    sectionPadding: '4rem 2rem',
    maxWidth: '1100px',
    animation: 'bounce-in',
    letterSpacing: '-0.02em',
  },
  organic: {
    font: "'Inter', sans-serif",
    headingFont: "'Lora', serif",
    headingWeight: '600',
    googleFonts: 'Lora:wght@400;500;600;700|Inter:wght@400;500;600',
    radius: '24px',
    cardBorder: '1px solid var(--border)',
    cardShadow: '0 4px 20px rgba(0,0,0,0.06)',
    cardHoverShadow: '0 8px 30px rgba(0,0,0,0.1)',
    cardHoverTransform: 'translateY(-3px)',
    btnRadius: '24px',
    btnTransition: 'all 0.3s ease',
    navBg: 'var(--bg)',
    navBorder: 'none',
    sectionPadding: '5rem 2rem',
    maxWidth: '1100px',
    animation: 'fade-up',
    letterSpacing: '-0.015em',
  },
};

// ============================================================================
// CSS GENERATION — per-style CSS including animations and hover states
// ============================================================================
function generateCSS(p, style) {
  const cfg = STYLE_CONFIG[style] || STYLE_CONFIG.minimalism;
  const bg = p[0], primary = p[1], secondary = p[2], accent = p[3], text = p[4];
  const textOnAccent = readableText(accent, '#FFFFFF', '#000000');
  const textOnPrimary = readableText(primary, '#FFFFFF', '#000000');
  const muted = luminance(bg) > 0.5 ? '#6B7280' : '#9CA3AF';
  const border = luminance(bg) > 0.5 ? '#E5E7EB' : '#374151';
  const shadowDark = luminance(bg) > 0.5 ? '#D1D5DB' : '#1F2937';
  const shadowLight = luminance(bg) > 0.5 ? '#FFFFFF' : '#374151';

  return `
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg:${bg}; --primary:${primary}; --secondary:${secondary}; --accent:${accent}; --text:${text};
  --text-on-accent:${textOnAccent}; --text-on-primary:${textOnPrimary};
  --muted:${muted}; --border:${border}; --shadow-dark:${shadowDark}; --shadow-light:${shadowLight};
  --radius:${cfg.radius}; --btn-radius:${cfg.btnRadius};
}
html { scroll-behavior:smooth; }
body {
  font-family:${cfg.font};
  background:var(--bg); color:var(--text);
  line-height:1.6; -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4 { font-family:${cfg.headingFont}; font-weight:${cfg.headingWeight}; letter-spacing:${cfg.letterSpacing}; line-height:1.15; }
a { color:inherit; text-decoration:none; transition:${cfg.btnTransition}; }
img { max-width:100%; display:block; }
.container { max-width:${cfg.maxWidth}; margin:0 auto; padding:0 2rem; }

/* ---- Animations ---- */
@keyframes fadeUp { from{opacity:0;transform:translateY(24px);} to{opacity:1;transform:translateY(0);} }
@keyframes slideIn { from{opacity:0;transform:translateX(-30px);} to{opacity:1;transform:translateX(0);} }
@keyframes scaleIn { from{opacity:0;transform:scale(0.95);} to{opacity:1;transform:scale(1);} }
@keyframes bounceIn { 0%{opacity:0;transform:scale(0.8);} 60%{opacity:1;transform:scale(1.05);} 100%{transform:scale(1);} }

[data-animate] { opacity:0; }
[data-animate].visible { animation: ${cfg.animation} 0.6s ease forwards; }

/* ---- Cards ---- */
.clay-card {
  background:var(--bg);
  border:${cfg.cardBorder};
  border-radius:var(--radius);
  box-shadow:${cfg.cardShadow};
  transition:transform 0.3s ease, box-shadow 0.3s ease;
  padding:1.75rem;
}
.clay-card:hover {
  transform:${cfg.cardHoverTransform};
  box-shadow:${cfg.cardHoverShadow};
}

/* ---- Buttons ---- */
.clay-btn {
  display:inline-flex; align-items:center; gap:0.5rem;
  background:var(--accent); color:var(--text-on-accent);
  padding:0.85rem 1.75rem;
  border-radius:var(--btn-radius);
  font-weight:700; font-size:0.95rem;
  border:none; cursor:pointer;
  transition:${cfg.btnTransition};
  font-family:${cfg.font};
}
.clay-btn:hover { transform:translateY(-2px); filter:brightness(1.1); }
.clay-btn-ghost {
  background:transparent; color:var(--text);
  border:2px solid var(--text);
}
.clay-btn-ghost:hover { background:var(--text); color:var(--bg); }

/* ---- Glassmorphism specific ---- */
${style === 'glassmorphism' ? `
.clay-glass { background:rgba(255,255,255,0.1); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.15); }
.clay-card.clay-glass { background:rgba(255,255,255,0.08); }
` : ''}

/* ---- Neumorphism specific ---- */
${style === 'neumorphism' ? `
.clay-neu { background:var(--bg); box-shadow:8px 8px 16px var(--shadow-dark),-8px -8px 16px var(--shadow-light); border:none; }
.clay-neu-inset { box-shadow:inset 4px 4px 8px var(--shadow-dark),inset -4px -4px 8px var(--shadow-light); }
.clay-card.clay-neu:hover { box-shadow:inset 4px 4px 8px var(--shadow-dark),inset -4px -4px 8px var(--shadow-light); transform:none; }
` : ''}

/* ---- Brutalism specific ---- */
${style === 'brutalism' ? `
.clay-card { transition:transform 0.1s, box-shadow 0.1s; }
.clay-card:hover { transform:translate(-3px,-3px); box-shadow:9px 9px 0 var(--accent); }
.clay-btn { border:3px solid var(--text); }
.clay-btn:hover { transform:translate(-2px,-2px); box-shadow:4px 4px 0 var(--text); filter:none; }
` : ''}

/* ---- Playful specific ---- */
${style === 'playful' ? `
.clay-card { border:3px solid var(--text); }
.clay-card:hover { transform:translateY(-4px) rotate(-1deg); box-shadow:0 8px 0 var(--accent); }
.clay-btn:hover { transform:translateY(-3px) scale(1.05); }
` : ''}

/* ---- Art Deco specific ---- */
${style === 'art-deco' ? `
.clay-card { position:relative; }
.clay-card::before { content:''; position:absolute; top:8px; left:8px; right:8px; bottom:8px; border:1px solid var(--accent); pointer-events:none; opacity:0.3; }
.clay-deco-line { display:flex; align-items:center; gap:1rem; margin:1rem 0; }
.clay-deco-line::before, .clay-deco-line::after { content:''; flex:1; height:1px; background:var(--accent); }
` : ''}

/* ---- Editorial specific ---- */
${style === 'editorial' ? `
.clay-drop-cap::first-letter { font-family:${cfg.headingFont}; font-size:4rem; font-weight:900; float:left; line-height:0.9; padding:0.3rem 0.5rem 0 0; color:var(--accent); }
` : ''}

/* ---- Swiss specific ---- */
${style === 'swiss' ? `
.clay-card { border-left:4px solid var(--accent); border-radius:0; }
.clay-card:hover { background:var(--bg); border-left-color:var(--text); }
` : ''}

/* ---- Responsive ---- */
@media (max-width:768px) {
  .clay-nav-links { display:none !important; }
  .clay-grid-3 { grid-template-columns:1fr !important; }
  .clay-grid-2 { grid-template-columns:1fr !important; }
  .clay-hero-split { grid-template-columns:1fr !important; }
}
`;
}

// ============================================================================
// COMPONENT FUNCTIONS — each returns HTML string
// ============================================================================
const NAV = {
  topbar: (c, cfg) => `
<nav style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2rem;background:${cfg.navBg};border-bottom:${cfg.navBorder};backdrop-filter:blur(10px);position:sticky;top:0;z-index:100;">
  <a href="#top" style="font-family:${cfg.headingFont};font-weight:${cfg.headingWeight};font-size:1.25rem;letter-spacing:${cfg.letterSpacing};color:var(--text);">${c.brand_name || 'Brand'}</a>
  <div class="clay-nav-links" style="display:flex;gap:2rem;align-items:center;">
    ${(c.nav_links || ['Home','About','Services','Contact']).map(l => `<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.9rem;color:var(--muted);font-weight:500;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">${l}</a>`).join('')}
  </div>
  <a href="#contact" class="clay-btn" style="padding:0.6rem 1.3rem;font-size:0.88rem;">${c.cta_text || 'Get in touch'}</a>
</nav>`,

  sidebar: (c, cfg) => `
<div style="display:flex;min-height:100vh;">
  <aside style="width:250px;background:var(--primary);color:var(--text-on-primary);padding:2.5rem 1.5rem;position:fixed;height:100vh;overflow-y:auto;">
    <a href="#top" style="font-family:${cfg.headingFont};font-weight:${cfg.headingWeight};font-size:1.3rem;letter-spacing:${cfg.letterSpacing};display:block;margin-bottom:2.5rem;color:inherit;">${c.brand_name || 'Brand'}</a>
    <nav style="display:flex;flex-direction:column;gap:0.25rem;">
      ${(c.nav_links || ['Home','About','Services','Contact']).map(l => `<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.92rem;padding:0.6rem 0.85rem;border-radius:${cfg.radius};opacity:0.75;transition:${cfg.btnTransition};" onmouseover="this.style.opacity=1;this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.opacity=0.75;this.style.background='transparent'">${l}</a>`).join('')}
    </nav>
  </aside>
  <main style="margin-left:250px;flex:1;">
  <div id="top"></div>`,

  minimal: (c, cfg) => `
<nav style="display:flex;align-items:center;justify-content:space-between;padding:1.75rem 2rem;background:var(--bg);border-bottom:${cfg.navBorder};">
  <a href="#top" style="font-family:${cfg.headingFont};font-weight:${cfg.headingWeight};font-size:1.15rem;letter-spacing:${cfg.letterSpacing};color:var(--text);">${c.brand_name || 'Brand'}</a>
  <div class="clay-nav-links" style="display:flex;gap:2.5rem;align-items:center;">
    ${(c.nav_links || ['About','Services','Contact']).map(l => `<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.88rem;color:var(--muted);font-weight:500;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">${l}</a>`).join('')}
  </div>
</nav>`,
};

const HERO = {
  centered: (c, cfg) => `
<section data-animate style="padding:${cfg.sectionPadding};text-align:center;max-width:800px;margin:0 auto;">
  <h1 style="font-size:clamp(2rem,5vw,3.5rem);margin-bottom:1rem;">${c.headline || 'Welcome'}</h1>
  <p style="font-size:1.18rem;color:var(--muted);max-width:560px;margin:0 auto 2rem;line-height:1.6;">${c.subheadline || ''}</p>
  <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
    <a href="#contact" class="clay-btn">${c.cta_text || 'Get started'}</a>
    <a href="#about" class="clay-btn clay-btn-ghost">Learn more</a>
  </div>
</section>`,

  split: (c, cfg) => `
<section data-animate class="clay-hero-split" style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;padding:${cfg.sectionPadding};max-width:${cfg.maxWidth};margin:0 auto;align-items:center;">
  <div>
    <h1 style="font-size:clamp(1.8rem,4vw,3rem);margin-bottom:1rem;">${c.headline || 'Welcome'}</h1>
    <p style="font-size:1.1rem;color:var(--muted);margin-bottom:1.75rem;line-height:1.6;">${c.subheadline || ''}</p>
    <a href="#contact" class="clay-btn">${c.cta_text || 'Get started'}</a>
  </div>
  <div style="background:var(--secondary);border-radius:var(--radius);min-height:320px;display:flex;align-items:center;justify-content:center;color:var(--text-on-primary);font-size:0.9rem;opacity:0.85;${style === 'neumorphism' ? 'box-shadow:8px 8px 16px var(--shadow-dark),-8px -8px 16px var(--shadow-light);' : ''}">
    <span style="opacity:0.6;"><i class="fa-regular fa-image" style="font-size:2rem;"></i><br><br>Image placeholder</span>
  </div>
</section>`,

  bold: (c, cfg) => `
<section data-animate style="background:var(--primary);color:var(--text-on-primary);padding:${cfg.sectionPadding};text-align:center;">
  <h1 style="font-size:clamp(2.5rem,6vw,4.5rem);margin-bottom:1.5rem;">${c.headline || 'Welcome'}</h1>
  <p style="font-size:1.2rem;opacity:0.8;max-width:580px;margin:0 auto 2.5rem;line-height:1.6;">${c.subheadline || ''}</p>
  <a href="#contact" class="clay-btn" style="font-size:1.05rem;padding:1rem 2.2rem;">${c.cta_text || 'Get started'}</a>
</section>`,
};

const FEATURES = {
  '3-col': (c, cfg) => `
<section id="services" data-animate style="padding:${cfg.sectionPadding};max-width:${cfg.maxWidth};margin:0 auto;">
  <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);text-align:center;margin-bottom:0.5rem;">${c.title || 'What we offer'}</h2>
  <p style="text-align:center;color:var(--muted);margin-bottom:3rem;font-size:1.05rem;">${c.subtitle || ''}</p>
  <div class="clay-grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
    ${(c.cards || []).map((card, i) => `
      <div class="clay-card${cfg === STYLE_CONFIG.neumorphism ? ' clay-neu' : ''}${cfg === STYLE_CONFIG.glassmorphism ? ' clay-glass' : ''}" data-animate style="animation-delay:${i * 0.1}s;">
        <div style="width:48px;height:48px;background:var(--accent);color:var(--text-on-accent);border-radius:${cfg.radius};display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;font-size:1.25rem;"><i class="${card.icon || 'fa-solid fa-star'}"></i></div>
        <h3 style="font-size:1.15rem;margin-bottom:0.5rem;">${card.title || ''}</h3>
        <p style="font-size:0.92rem;color:var(--muted);line-height:1.6;margin:0;">${card.description || ''}</p>
      </div>
    `).join('')}
  </div>
</section>`,

  '2-col': (c, cfg) => `
<section id="services" data-animate style="padding:${cfg.sectionPadding};max-width:900px;margin:0 auto;">
  <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);text-align:center;margin-bottom:3rem;">${c.title || 'What we offer'}</h2>
  <div class="clay-grid-2" style="display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;">
    ${(c.cards || []).map((card, i) => `
      <div class="clay-card${cfg === STYLE_CONFIG.neumorphism ? ' clay-neu' : ''}${cfg === STYLE_CONFIG.glassmorphism ? ' clay-glass' : ''}" data-animate style="animation-delay:${i * 0.1}s;display:flex;gap:1rem;align-items:flex-start;">
        <div style="width:52px;height:52px;background:var(--accent);color:var(--text-on-accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;"><i class="${card.icon || 'fa-solid fa-star'}"></i></div>
        <div>
          <h3 style="font-size:1.1rem;margin-bottom:0.4rem;">${card.title || ''}</h3>
          <p style="font-size:0.92rem;color:var(--muted);line-height:1.6;margin:0;">${card.description || ''}</p>
        </div>
      </div>
    `).join('')}
  </div>
</section>`,
};

const ABOUT = {
  standard: (c, cfg) => `
<section id="about" data-animate style="padding:${cfg.sectionPadding};max-width:780px;margin:0 auto;">
  <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);margin-bottom:1.25rem;">${c.title || 'About us'}</h2>
  <p class="clay-drop-cap" style="font-size:1.1rem;color:var(--muted);line-height:1.8;">${c.body || ''}</p>
</section>`,
};

const TESTIMONIAL = {
  single: (c, cfg) => `
<section data-animate style="padding:${cfg.sectionPadding};background:var(--secondary);color:var(--text-on-primary);text-align:center;">
  <div style="max-width:720px;margin:0 auto;">
    <div style="font-size:3rem;color:var(--accent);margin-bottom:1rem;opacity:0.5;"><i class="fa-solid fa-quote-left"></i></div>
    <blockquote style="font-family:${cfg.headingFont};font-size:clamp(1.3rem,2.5vw,1.8rem);font-weight:${cfg.headingWeight};line-height:1.4;letter-spacing:${cfg.letterSpacing};margin-bottom:1.5rem;">
      "${c.quote || ''}"
    </blockquote>
    <p style="font-size:0.9rem;opacity:0.7;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${c.author || ''}</p>
  </div>
</section>`,
};

const CTA = {
  band: (c, cfg) => `
<section data-animate style="padding:${cfg.sectionPadding};text-align:center;background:var(--primary);color:var(--text-on-primary);">
  <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);margin-bottom:0.75rem;">${c.headline || 'Ready to start?'}</h2>
  <p style="opacity:0.8;margin-bottom:2rem;max-width:480px;margin-left:auto;margin-right:auto;font-size:1.05rem;">${c.subtitle || ''}</p>
  <a href="#contact" class="clay-btn" style="font-size:1rem;padding:1rem 2.2rem;">${c.button_text || 'Get started'}</a>
</section>`,
};

const CONTACT = {
  standard: (c, cfg) => `
<section id="contact" data-animate style="padding:${cfg.sectionPadding};max-width:640px;margin:0 auto;">
  <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);text-align:center;margin-bottom:0.5rem;">${c.title || 'Get in touch'}</h2>
  <p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;font-size:1.05rem;">${c.subtitle || "We'd love to hear from you."}</p>
  <form onsubmit="event.preventDefault();this.querySelector('.clay-form-fields').style.display='none';this.querySelector('.clay-form-success').style.display='block';" style="display:flex;flex-direction:column;gap:1rem;">
    <div class="clay-form-fields" style="display:flex;flex-direction:column;gap:1rem;">
      <input type="text" placeholder="Your name" required style="padding:0.9rem 1.1rem;border:1px solid var(--border);border-radius:${cfg.radius};font-size:0.95rem;background:var(--bg);color:var(--text);font-family:${cfg.font};transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
      <input type="email" placeholder="Your email" required style="padding:0.9rem 1.1rem;border:1px solid var(--border);border-radius:${cfg.radius};font-size:0.95rem;background:var(--bg);color:var(--text);font-family:${cfg.font};transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'">
      <textarea placeholder="Your message" required rows="5" style="padding:0.9rem 1.1rem;border:1px solid var(--border);border-radius:${cfg.radius};font-size:0.95rem;background:var(--bg);color:var(--text);font-family:${cfg.font};resize:vertical;transition:border-color 0.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='var(--border)'"></textarea>
      <button type="submit" class="clay-btn" style="justify-content:center;padding:0.9rem;">Send message</button>
    </div>
    <div class="clay-form-success" style="display:none;text-align:center;padding:2.5rem;background:var(--bg);border-radius:${cfg.radius};border:1px solid var(--border);">
      <i class="fa-solid fa-circle-check" style="font-size:2.5rem;color:#16A34A;margin-bottom:0.75rem;"></i>
      <p style="font-weight:600;font-size:1.1rem;margin:0;">Thank you! Your message has been sent.</p>
    </div>
  </form>
  ${c.contact_details ? `<div style="margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;font-size:0.9rem;color:var(--muted);">
    ${c.contact_details.email ? `<span style="display:flex;align-items:center;gap:0.5rem;"><i class="fa-solid fa-envelope" style="color:var(--accent);"></i> ${c.contact_details.email}</span>` : ''}
    ${c.contact_details.phone ? `<span style="display:flex;align-items:center;gap:0.5rem;"><i class="fa-solid fa-phone" style="color:var(--accent);"></i> ${c.contact_details.phone}</span>` : ''}
    ${c.contact_details.address ? `<span style="display:flex;align-items:center;gap:0.5rem;"><i class="fa-solid fa-location-dot" style="color:var(--accent);"></i> ${c.contact_details.address}</span>` : ''}
  </div>` : ''}
</section>`,
};

const FOOTER = {
  minimal: (c, cfg) => `
<footer style="padding:2.5rem 2rem;text-align:center;border-top:1px solid var(--border);color:var(--muted);font-size:0.85rem;">
  <p style="margin:0;">&copy; ${new Date().getFullYear()} ${c.brand_name || 'Brand'}. All rights reserved.</p>
</footer>`,

  rich: (c, cfg) => `
<footer style="background:var(--primary);color:var(--text-on-primary);padding:3.5rem 2rem;">
  <div style="max-width:${cfg.maxWidth};margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:2.5rem;">
    <div>
      <h3 style="font-family:${cfg.headingFont};font-weight:${cfg.headingWeight};font-size:1.3rem;margin-bottom:0.6rem;letter-spacing:${cfg.letterSpacing};">${c.brand_name || 'Brand'}</h3>
      <p style="opacity:0.7;font-size:0.9rem;line-height:1.6;max-width:300px;">${c.tagline || ''}</p>
    </div>
    <div>
      <h4 style="font-size:0.75rem;text-transform:uppercase;opacity:0.5;margin-bottom:0.85rem;letter-spacing:0.1em;font-weight:600;">Explore</h4>
      ${(c.nav_links || ['Home','About','Services','Contact']).map(l => `<div style="margin-bottom:0.5rem;"><a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="opacity:0.75;font-size:0.88rem;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.75">${l}</a></div>`).join('')}
    </div>
    <div>
      <h4 style="font-size:0.75rem;text-transform:uppercase;opacity:0.5;margin-bottom:0.85rem;letter-spacing:0.1em;font-weight:600;">Connect</h4>
      ${(c.social_links || []).map(s => `<div style="margin-bottom:0.5rem;"><a href="#" style="opacity:0.75;font-size:0.88rem;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.75"><i class="fa-brands fa-${s}" style="margin-right:0.4rem;"></i>${s.charAt(0).toUpperCase()+s.slice(1)}</a></div>`).join('')}
    </div>
  </div>
  <div style="max-width:${cfg.maxWidth};margin:2.5rem auto 0;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1);text-align:center;opacity:0.5;font-size:0.82rem;">
    &copy; ${new Date().getFullYear()} ${c.brand_name || 'Brand'}. All rights reserved.
  </div>
</footer>
<style>@media(max-width:768px){footer div[style*="grid-template-columns:2fr 1fr 1fr"]{grid-template-columns:1fr!important;gap:1.5rem;}}</style>`,
};

// ============================================================================
// RENDERER — assembles the full page
// ============================================================================
function renderSite(spec, palette, designStyle) {
  const cfg = STYLE_CONFIG[designStyle] || STYLE_CONFIG.minimalism;
  const css = generateCSS(palette, designStyle);

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${spec.content.brand_name || 'Website'}${spec.content.tagline ? ' — ' + spec.content.tagline : ''}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${cfg.googleFonts}&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<div id="top"></div>`;

  // Nav
  const navVariant = spec.components.nav || 'topbar';
  if (NAV[navVariant]) html += NAV[navVariant](spec.content, cfg);
  const isSidebar = navVariant === 'sidebar';

  // Hero
  const heroVariant = spec.components.hero || 'centered';
  if (HERO[heroVariant]) html += HERO[heroVariant](spec.content, cfg);

  // Sections
  (spec.sections || []).forEach(section => {
    const map = { features: FEATURES, about: ABOUT, testimonial: TESTIMONIAL, cta: CTA, contact: CONTACT };
    const variants = map[section.type];
    if (variants && variants[section.variant]) {
      html += variants[section.variant](section.content || spec.content, cfg);
    }
  });

  // Footer
  const footerVariant = spec.components.footer || 'minimal';
  if (FOOTER[footerVariant]) html += FOOTER[footerVariant](spec.content, cfg);

  if (isSidebar) html += `</main></div>`;

  // Animation observer script
  html += `
<script>
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior:'smooth' }); }
  });
});
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
}, { threshold:0.1, rootMargin:'0px 0px -50px 0px' });
document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
</script>
</body>
</html>`;

  return {
    'index.html': html,
    'styles.css': '/* Generated by Clay component renderer. Styles are inline for portability. */\n',
    'script.js': '// Generated by Clay component renderer. Scripts are inline for portability. //\n'
  };
}

window.CLAY_COMPONENTS = { renderSite, STYLE_CONFIG };
