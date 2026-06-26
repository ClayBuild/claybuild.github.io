// ============================================================================
// CLAY — Component Library v3
// Each design style produces DISTINCT HTML/CSS that matches its sample mock.
// Animations use pure CSS (no IntersectionObserver) for reliability.
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
function readableText(bg, light, dark) { return luminance(bg) > 0.5 ? dark : light; }
function withAlpha(hex, a) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ---- Per-style font + meta config ----
const STYLE_FONTS = {
  minimalism:   { body: "'Inter',sans-serif", head: "'Inter',sans-serif", hw: '800', gf: 'Inter:wght@300;400;500;600;700;800', ls: '-0.03em' },
  brutalism:    { body: "'Space Mono',monospace", head: "'Archivo Black',sans-serif", hw: '400', gf: 'Space+Mono:wght@400;700|Archivo+Black', ls: '-0.02em' },
  swiss:        { body: "'Inter',sans-serif", head: "'Inter',sans-serif", hw: '900', gf: 'Inter:wght@400;500;600;700;800;900', ls: '-0.04em' },
  neumorphism:  { body: "'Poppins',sans-serif", head: "'Poppins',sans-serif", hw: '600', gf: 'Poppins:wght@300;400;500;600;700', ls: '-0.02em' },
  editorial:    { body: "'Source Serif Pro',serif", head: "'Playfair Display',serif", hw: '700', gf: 'Playfair+Display:wght@400;700;900|Source+Serif+Pro:wght@400;600', ls: '-0.015em' },
  glassmorphism:{ body: "'Inter',sans-serif", head: "'Poppins',sans-serif", hw: '700', gf: 'Poppins:wght@400;500;600;700|Inter:wght@400;500;600', ls: '-0.02em' },
  'art-deco':   { body: "'Inter',sans-serif", head: "'Playfair Display',serif", hw: '700', gf: 'Playfair+Display:wght@400;700;900|Inter:wght@400;500;600', ls: '0.02em' },
  corporate:    { body: "'Inter',sans-serif", head: "'Inter',sans-serif", hw: '700', gf: 'Inter:wght@400;500;600;700;800', ls: '-0.02em' },
  playful:      { body: "'Nunito',sans-serif", head: "'Nunito',sans-serif", hw: '800', gf: 'Nunito:wght@400;600;700;800;900', ls: '-0.02em' },
  organic:      { body: "'Inter',sans-serif", head: "'Lora',serif", hw: '600', gf: 'Lora:wght@400;500;600;700|Inter:wght@400;500;600', ls: '-0.015em' },
};

// ============================================================================
// BASE CSS — shared reset + animation keyframes (pure CSS, no JS needed)
// ============================================================================
function baseCSS(p, style) {
  const sf = STYLE_FONTS[style] || STYLE_FONTS.minimalism;
  const bg = p[0], primary = p[1], secondary = p[2], accent = p[3], text = p[4];
  const onAccent = readableText(accent, '#FFF', '#000');
  const onPrimary = readableText(primary, '#FFF', '#000');

  // Glassmorphism has a colored gradient background, so ALL text must be light
  let muted, border, textColor;
  if (style === 'glassmorphism') {
    muted = 'rgba(255,255,255,0.7)';
    border = 'rgba(255,255,255,0.15)';
    textColor = '#FFFFFF';
  } else {
    muted = luminance(bg) > 0.5 ? '#6B7280' : '#9CA3AF';
    border = luminance(bg) > 0.5 ? '#E5E7EB' : '#374151';
    textColor = text;
  }

  return `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{--bg:${bg};--primary:${primary};--secondary:${secondary};--accent:${accent};--text:${textColor};
--on-accent:${onAccent};--on-primary:${onPrimary};--muted:${muted};--border:${border};}
html{scroll-behavior:smooth;}
body{font-family:${sf.body};background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
h1,h2,h3,h4{font-family:${sf.head};font-weight:${sf.hw};letter-spacing:${sf.ls};line-height:1.15;}
a{color:inherit;text-decoration:none;}
img{max-width:100%;display:block;}

/* Pure CSS load animations — no JS needed */
@keyframes fadeUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes slideLeft{from{opacity:0;transform:translateX(-40px);}to{opacity:1;transform:translateX(0);}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
@keyframes bounceIn{0%{opacity:0;transform:scale(0.7) translateY(20px);}60%{opacity:1;transform:scale(1.03) translateY(-5px);}100%{transform:scale(1) translateY(0);}}

.anim-1{animation:fadeUp 0.7s ease both;animation-delay:0.1s;}
.anim-2{animation:fadeUp 0.7s ease both;animation-delay:0.25s;}
.anim-3{animation:fadeUp 0.7s ease both;animation-delay:0.4s;}
.anim-4{animation:fadeUp 0.7s ease both;animation-delay:0.55s;}
.anim-5{animation:fadeUp 0.7s ease both;animation-delay:0.7s;}
.anim-fade{animation:fadeIn 1s ease both;}

@media(max-width:768px){
  .nav-links{display:none!important;}
  .grid-3{grid-template-columns:1fr!important;}
  .grid-2{grid-template-columns:1fr!important;}
  .grid-4{grid-template-columns:1fr!important;}
  .hero-split{grid-template-columns:1fr!important;}
  .footer-grid{grid-template-columns:1fr!important;}
}
@media(max-width:1024px){
  .grid-4{grid-template-columns:repeat(2,1fr)!important;}
}
`;
}

// ============================================================================
// NAV — style-specific
// ============================================================================
function renderNav(c, style, hasLogo, logoExt) {
  const links = c.nav_links || ['Home','About','Services','Contact'];
  const brand = c._brandDisplay || c.brand_name || 'Brand';
  const linksHtml = links.map(l => `<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.9rem;">${l}</a>`).join('');

  switch (style) {
    case 'brutalism':
      return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:var(--bg);border-bottom:4px solid var(--text);">
        <a href="#top" style="font-family:'Archivo Black',sans-serif;font-size:1.4rem;text-transform:uppercase;letter-spacing:-0.02em;color:var(--text);">${brand}</a>
        <div class="nav-links" style="display:flex;gap:0.5rem;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.8rem;font-weight:700;text-transform:uppercase;border:2px solid var(--text);padding:6px 12px;color:var(--text);">${l}</a>`).join('')}</div>
        <a href="#contact" style="background:var(--text);color:var(--bg);padding:0.6rem 1.3rem;font-weight:700;text-transform:uppercase;font-size:0.85rem;">${c.cta_text||'Contact'}</a>
      </nav>`;

    case 'sidebar':
      return `<div style="display:flex;min-height:100vh;">
        <aside style="width:250px;background:var(--primary);color:var(--on-primary);padding:2.5rem 1.5rem;position:fixed;height:100vh;overflow-y:auto;">
          <a href="#top" style="font-family:${STYLE_FONTS[style].head};font-weight:${STYLE_FONTS[style].hw};font-size:1.3rem;display:block;margin-bottom:2.5rem;color:inherit;">${brand}</a>
          <nav style="display:flex;flex-direction:column;gap:0.25rem;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.92rem;padding:0.6rem 0.85rem;opacity:0.75;">${l}</a>`).join('')}</nav>
        </aside><main style="margin-left:250px;flex:1;"><div id="top"></div>`;

    case 'editorial':
      return `<nav style="border-bottom:3px double var(--text);padding:1.5rem 2rem;display:flex;justify-content:space-between;align-items:flex-end;background:var(--bg);">
        <div style="font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);">Est. ${new Date().getFullYear()}</div>
        <a href="#top" style="font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:900;letter-spacing:-0.02em;color:var(--text);">${brand}</a>
        <div class="nav-links" style="display:flex;gap:1.5rem;align-items:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);">${l}</a>`).join('')}</div>
      </nav>`;

    case 'glassmorphism':
      return `<div style="background:linear-gradient(135deg,${c._gradient1||'#667eea'},${c._gradient2||'#764ba2'});min-height:100vh;">
        <nav style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2rem;background:rgba(255,255,255,0.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.15);position:sticky;top:0;z-index:100;">
          <a href="#top" style="font-family:'Poppins',sans-serif;font-weight:700;font-size:1.25rem;color:#fff;">${brand}</a>
          <div class="nav-links" style="display:flex;gap:2rem;align-items:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.9rem;color:rgba(255,255,255,0.85);">${l}</a>`).join('')}</div>
          <a href="#contact" style="background:rgba(255,255,255,0.2);color:#fff;padding:0.6rem 1.3rem;border-radius:12px;font-weight:600;font-size:0.88rem;border:1px solid rgba(255,255,255,0.25);">${c.cta_text||'Get in touch'}</a>
        </nav>`;

    case 'art-deco':
      return `<nav style="background:var(--bg);border-bottom:2px solid var(--accent);padding:1.25rem 2rem;display:flex;justify-content:space-between;align-items:center;">
        <a href="#top" style="font-family:'Playfair Display',serif;font-weight:700;font-size:1.4rem;color:var(--accent);letter-spacing:0.05em;">${brand}</a>
        <div class="nav-links" style="display:flex;gap:1.75rem;align-items:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.82rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--text);">${l}</a>`).join('')}</div>
        <a href="#contact" style="background:var(--accent);color:var(--on-accent);padding:0.6rem 1.5rem;font-size:0.82rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">${c.cta_text||'Contact'}</a>
      </nav>`;

    case 'playful':
      return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;background:var(--bg);border-bottom:3px solid var(--text);">
        <a href="#top" style="font-family:'Nunito',sans-serif;font-weight:900;font-size:1.4rem;color:var(--text);">${brand} <span style="color:var(--accent);">.</span></a>
        <div class="nav-links" style="display:flex;gap:1.5rem;align-items:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.95rem;font-weight:700;color:var(--text);">${l}</a>`).join('')}</div>
        <a href="#contact" style="background:var(--accent);color:var(--on-accent);padding:0.6rem 1.5rem;border-radius:20px;font-weight:800;font-size:0.9rem;box-shadow:0 4px 0 var(--text);">${c.cta_text||'Get started'}</a>
      </nav>`;

    case 'neumorphism':
      const neuBg = p_neuBg || '#e0e5ec';
      return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2rem;background:var(--bg);">
        <a href="#top" style="font-family:'Poppins',sans-serif;font-weight:600;font-size:1.2rem;color:var(--text);">${brand}</a>
        <div class="nav-links" style="display:flex;gap:0.5rem;align-items:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.88rem;padding:0.5rem 0.85rem;border-radius:10px;color:var(--muted);font-weight:500;">${l}</a>`).join('')}</div>
        <a href="#contact" style="background:var(--bg);color:var(--accent);padding:0.6rem 1.3rem;border-radius:12px;font-weight:600;font-size:0.88rem;box-shadow:4px 4px 8px var(--shadow-dark),-4px -4px 8px var(--shadow-light);">Sign in</a>
      </nav>`;

    case 'swiss':
      return `<nav style="display:grid;grid-template-columns:1fr 3fr 1fr;align-items:center;padding:1.25rem 2rem;background:var(--bg);border-bottom:2px solid var(--text);">
        <a href="#top" style="font-weight:900;font-size:1.1rem;letter-spacing:-0.03em;color:var(--text);">${brand}<span style="color:var(--accent);">.</span></a>
        <div class="nav-links" style="display:flex;gap:2rem;justify-content:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.85rem;font-weight:500;color:var(--muted);">${l}</a>`).join('')}</div>
        <div style="text-align:right;font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;">EN / DE</div>
      </nav>`;

    case 'organic':
      return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2rem;background:var(--bg);">
        <a href="#top" style="font-family:'Lora',serif;font-weight:600;font-size:1.25rem;color:var(--text);">${brand}</a>
        <div class="nav-links" style="display:flex;gap:2rem;align-items:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.9rem;color:var(--muted);">${l}</a>`).join('')}</div>
        <a href="#contact" style="background:var(--accent);color:var(--on-accent);padding:0.6rem 1.5rem;border-radius:24px;font-weight:600;font-size:0.88rem;">${c.cta_text||'Get in touch'}</a>
      </nav>`;

    default: // minimalism + corporate
      return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 2rem;background:var(--bg);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;backdrop-filter:blur(10px);">
        <a href="#top" style="font-weight:${style==='corporate'?'800':'700'};font-size:1.2rem;letter-spacing:-0.03em;color:var(--text);">${brand}</a>
        <div class="nav-links" style="display:flex;gap:2rem;align-items:center;">${links.map(l=>`<a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="font-size:0.9rem;color:var(--muted);font-weight:500;">${l}</a>`).join('')}</div>
        <a href="#contact" style="background:var(--accent);color:var(--on-accent);padding:0.6rem 1.3rem;border-radius:${style==='corporate'?'8px':'6px'};font-weight:600;font-size:0.88rem;">${c.cta_text||'Get in touch'}</a>
      </nav>`;
  }
}

// ============================================================================
// HERO — style-specific, each looks dramatically different
// ============================================================================
function renderHero(c, style) {
  const headline = c.headline || 'Welcome';
  const sub = c.subheadline || '';
  const cta = c.cta_text || 'Get started';

  switch (style) {
    case 'brutalism':
      return `<section style="padding:4rem 2rem;border-bottom:4px solid var(--text);">
        <h1 class="anim-1" style="font-family:'Archivo Black',sans-serif;font-size:clamp(2.5rem,7vw,5rem);text-transform:uppercase;line-height:0.9;letter-spacing:-0.03em;margin-bottom:1.5rem;">${headline}</h1>
        <p class="anim-2" style="font-size:1.1rem;max-width:600px;margin-bottom:2rem;line-height:1.4;">${sub}</p>
        <a href="#contact" class="anim-3" style="display:inline-block;background:var(--text);color:var(--bg);padding:1rem 2rem;font-weight:700;text-transform:uppercase;border:3px solid var(--text);font-size:0.95rem;">${cta} →</a>
      </section>
      <div style="background:var(--text);color:var(--bg);padding:0.5rem 2rem;font-size:0.75rem;letter-spacing:0.3em;text-transform:uppercase;overflow:hidden;white-space:nowrap;">★ ${c.brand_name||'Brand'} ★ ${c.tagline||'Website'} ★ ${c.brand_name||'Brand'} ★ ${c.tagline||'Website'} ★ ${c.brand_name||'Brand'} ★ ${c.tagline||'Website'} ★</div>`;

    case 'editorial':
      return `<section style="padding:3rem 2rem;max-width:780px;margin:0 auto;">
        <div class="anim-1" style="font-size:0.72rem;letter-spacing:0.25em;text-transform:uppercase;color:var(--accent);margin-bottom:0.75rem;font-family:'Inter',sans-serif;">— Feature</div>
        <h1 class="anim-2" style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4.5vw,3.2rem);font-weight:700;line-height:1.05;margin-bottom:1rem;">${headline}</h1>
        <p class="anim-3" style="font-size:1.2rem;font-style:italic;color:var(--muted);max-width:560px;margin-bottom:2rem;">${sub}</p>
        <div class="anim-4" style="font-size:0.75rem;color:var(--muted);border-left:2px solid var(--accent);padding-left:1rem;font-family:'Inter',sans-serif;">
          <strong style="display:block;color:var(--text);font-size:0.85rem;margin-bottom:0.25rem;">${c.brand_name||'Brand'}</strong>
          ${new Date().toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'})} · ${Math.floor(Math.random()*10)+3} min read
        </div>
      </section>`;

    case 'glassmorphism':
      return `<section style="padding:5rem 2rem;text-align:center;">
        <h1 class="anim-1" style="font-family:'Poppins',sans-serif;font-size:clamp(2.2rem,5vw,3.8rem);font-weight:700;color:#fff;line-height:1.1;margin-bottom:1rem;text-shadow:0 2px 20px rgba(0,0,0,0.15);">${headline}</h1>
        <p class="anim-2" style="font-size:1.15rem;color:rgba(255,255,255,0.85);max-width:520px;margin:0 auto 2rem;">${sub}</p>
        <div class="anim-3" style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <a href="#contact" style="background:rgba(255,255,255,0.95);color:var(--text);padding:0.85rem 1.85rem;border-radius:12px;font-weight:600;font-size:0.95rem;">${cta}</a>
          <a href="#about" style="background:rgba(255,255,255,0.15);color:#fff;padding:0.85rem 1.85rem;border-radius:12px;font-weight:600;font-size:0.95rem;border:1px solid rgba(255,255,255,0.25);">Learn more</a>
        </div>
      </section>`;

    case 'art-deco':
      return `<section style="padding:5rem 2rem;text-align:center;background:var(--bg);position:relative;">
        <div style="display:flex;align-items:center;justify-content:center;gap:1rem;margin-bottom:1.5rem;">
          <div style="width:60px;height:1px;background:var(--accent);"></div>
          <i class="fa-solid fa-diamond" style="color:var(--accent);font-size:0.8rem;"></i>
          <div style="width:60px;height:1px;background:var(--accent);"></div>
        </div>
        <h1 class="anim-1" style="font-family:'Playfair Display',serif;font-size:clamp(2rem,4.5vw,3.5rem);font-weight:700;color:var(--text);margin-bottom:1rem;">${headline}</h1>
        <p class="anim-2" style="font-size:1.15rem;color:var(--muted);max-width:500px;margin:0 auto 2rem;font-style:italic;">${sub}</p>
        <a href="#contact" class="anim-3" style="display:inline-block;background:var(--accent);color:var(--on-accent);padding:0.85rem 2.5rem;font-size:0.85rem;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;border:2px solid var(--accent);">${cta}</a>
      </section>`;

    case 'playful':
      return `<section style="padding:4rem 2rem;text-align:center;">
        <h1 class="anim-1" style="font-family:'Nunito',sans-serif;font-size:clamp(2.2rem,5vw,3.5rem);font-weight:900;color:var(--text);margin-bottom:1rem;line-height:1.1;">${headline}</h1>
        <p class="anim-2" style="font-size:1.2rem;color:var(--muted);max-width:500px;margin:0 auto 2rem;font-weight:600;">${sub}</p>
        <a href="#contact" class="anim-3" style="display:inline-block;background:var(--accent);color:var(--on-accent);padding:1rem 2rem;border-radius:20px;font-weight:800;font-size:1.05rem;box-shadow:0 5px 0 var(--text);">${cta}</a>
      </section>`;

    case 'neumorphism':
      return `<section style="padding:4rem 2rem;text-align:center;">
        <div class="anim-1" style="width:80px;height:80px;background:var(--bg);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:1.5rem;box-shadow:8px 8px 16px var(--shadow-dark),-8px -8px 16px var(--shadow-light);">
          <i class="fa-solid fa-circle-nodes" style="font-size:2rem;color:var(--accent);"></i>
        </div>
        <h1 class="anim-2" style="font-family:'Poppins',sans-serif;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:600;color:var(--text);margin-bottom:1rem;line-height:1.2;">${headline}</h1>
        <p class="anim-3" style="font-size:1.1rem;color:var(--muted);max-width:480px;margin:0 auto 2rem;">${sub}</p>
        <a href="#contact" class="anim-4" style="display:inline-block;background:var(--bg);color:var(--accent);padding:0.85rem 2rem;border-radius:14px;font-weight:600;font-size:0.95rem;box-shadow:6px 6px 12px var(--shadow-dark),-6px -6px 12px var(--shadow-light);">${cta}</a>
      </section>`;

    case 'swiss':
      return `<section style="padding:4rem 2rem;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
        <div>
          <div class="anim-1" style="font-size:0.72rem;font-weight:600;color:var(--accent);letter-spacing:0.15em;margin-bottom:0.75rem;">— 01</div>
          <h1 class="anim-2" style="font-size:clamp(2rem,4.5vw,3.5rem);font-weight:900;line-height:0.95;letter-spacing:-0.04em;margin-bottom:1.5rem;">${headline}</h1>
        </div>
        <div style="display:flex;flex-direction:column;justify-content:flex-end;">
          <p class="anim-3" style="font-size:1.1rem;color:var(--muted);margin-bottom:1.5rem;line-height:1.5;">${sub}</p>
          <a href="#contact" class="anim-4" style="display:inline-block;background:var(--text);color:var(--bg);padding:0.85rem 1.75rem;font-weight:600;font-size:0.9rem;align-self:flex-start;">${cta} →</a>
        </div>
      </section>`;

    case 'organic':
      return `<section style="padding:5rem 2rem;text-align:center;max-width:700px;margin:0 auto;">
        <div class="anim-1" style="width:60px;height:60px;background:var(--accent);border-radius:50% 50% 50% 0;display:inline-flex;align-items:center;justify-content:center;margin-bottom:1.5rem;">
          <i class="fa-solid fa-leaf" style="color:var(--on-accent);font-size:1.5rem;"></i>
        </div>
        <h1 class="anim-2" style="font-family:'Lora',serif;font-size:clamp(2rem,4.5vw,3.2rem);font-weight:600;color:var(--text);margin-bottom:1rem;line-height:1.15;">${headline}</h1>
        <p class="anim-3" style="font-size:1.15rem;color:var(--muted);max-width:480px;margin:0 auto 2rem;line-height:1.6;">${sub}</p>
        <a href="#contact" class="anim-4" style="display:inline-block;background:var(--accent);color:var(--on-accent);padding:0.85rem 2rem;border-radius:24px;font-weight:600;font-size:0.95rem;">${cta}</a>
      </section>`;

    default: // minimalism + corporate
      return `<section style="padding:5rem 2rem;text-align:center;max-width:800px;margin:0 auto;">
        <h1 class="anim-1" style="font-size:clamp(2rem,5vw,3.5rem);font-weight:${style==='corporate'?'800':'800'};margin-bottom:1rem;line-height:1.1;">${headline}</h1>
        <p class="anim-2" style="font-size:1.18rem;color:var(--muted);max-width:540px;margin:0 auto 2rem;line-height:1.6;">${sub}</p>
        <div class="anim-3" style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
          <a href="#contact" style="background:var(--accent);color:var(--on-accent);padding:0.85rem 1.75rem;border-radius:${style==='corporate'?'8px':'6px'};font-weight:600;font-size:0.95rem;">${cta}</a>
          <a href="#about" style="background:transparent;color:var(--text);padding:0.85rem 1.75rem;border:2px solid var(--border);border-radius:${style==='corporate'?'8px':'6px'};font-weight:600;font-size:0.95rem;">Learn more</a>
        </div>
      </section>`;
  }
}

// ============================================================================
// FEATURES — style-specific card grids
// ============================================================================
function renderFeatures(c, style) {
  const cards = c.cards || [];
  const title = c.title || 'What we offer';
  const subtitle = c.subtitle || '';

  switch (style) {
    case 'brutalism':
      return `<section id="services" style="padding:4rem 2rem;border-bottom:4px solid var(--text);">
        <h2 class="anim-1" style="font-family:'Archivo Black',sans-serif;font-size:clamp(1.8rem,4vw,3rem);text-transform:uppercase;margin-bottom:0.5rem;">${title}</h2>
        <p class="anim-2" style="font-size:0.95rem;margin-bottom:2rem;">// ${subtitle}</p>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:4px solid var(--text);">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="padding:2rem;border-right:4px solid var(--text);border-bottom:4px solid var(--text);${i%3===2?'border-right:none;':''}">
            <div style="font-family:'Archivo Black',sans-serif;font-size:2.5rem;line-height:1;margin-bottom:1rem;color:var(--accent);">0${i+1}</div>
            <h3 style="font-size:1.1rem;text-transform:uppercase;margin-bottom:0.5rem;">${card.title||''}</h3>
            <p style="font-size:0.88rem;line-height:1.5;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;

    case 'editorial':
      return `<section id="services" style="padding:4rem 2rem;max-width:780px;margin:0 auto;border-top:1px solid var(--border);">
        <h2 class="anim-1" style="font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:0.5rem;">${title}</h2>
        <p class="anim-2" style="font-style:italic;color:var(--muted);margin-bottom:2rem;font-size:1.05rem;">${subtitle}</p>
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
          ${cards.map((card,i)=>`<div class="anim-${Math.min(i+1,5)}" style="display:flex;gap:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border);">
            <div style="font-family:'Playfair Display',serif;font-size:2rem;color:var(--accent);font-weight:900;line-height:1;min-width:40px;">${String(i+1).padStart(2,'0')}</div>
            <div><h3 style="font-family:'Playfair Display',serif;font-size:1.2rem;margin-bottom:0.35rem;">${card.title||''}</h3>
            <p style="font-size:0.95rem;color:var(--muted);line-height:1.6;">${card.description||''}</p></div>
          </div>`).join('')}
        </div>
      </section>`;

    case 'glassmorphism':
      return `<section id="services" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
        <h2 class="anim-1" style="font-family:'Poppins',sans-serif;font-size:2rem;color:#fff;text-align:center;margin-bottom:0.5rem;">${title}</h2>
        <p class="anim-2" style="text-align:center;color:rgba(255,255,255,0.7);margin-bottom:2.5rem;">${subtitle}</p>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="background:rgba(255,255,255,0.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:1.75rem;color:#fff;">
            <div style="width:44px;height:44px;background:rgba(255,255,255,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;font-size:1.2rem;"><i class="${card.icon||'fa-solid fa-star'}"></i></div>
            <h3 style="font-family:'Poppins',sans-serif;font-size:1.1rem;margin-bottom:0.4rem;">${card.title||''}</h3>
            <p style="font-size:0.9rem;color:rgba(255,255,255,0.7);line-height:1.6;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;

    case 'art-deco':
      return `<section id="services" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:3rem;">
          <div style="display:flex;align-items:center;justify-content:center;gap:1rem;margin-bottom:1rem;">
            <div style="width:40px;height:1px;background:var(--accent);"></div>
            <i class="fa-solid fa-diamond" style="color:var(--accent);font-size:0.7rem;"></i>
            <div style="width:40px;height:1px;background:var(--accent);"></div>
          </div>
          <h2 class="anim-1" style="font-family:'Playfair Display',serif;font-size:2rem;color:var(--text);">${title}</h2>
          <p class="anim-2" style="color:var(--muted);font-style:italic;margin-top:0.5rem;">${subtitle}</p>
        </div>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="background:var(--bg);border:2px solid var(--accent);padding:2rem;position:relative;text-align:center;">
            <div style="position:absolute;top:8px;left:8px;right:8px;bottom:8px;border:1px solid var(--accent);opacity:0.3;pointer-events:none;"></div>
            <i class="${card.icon||'fa-solid fa-star'}" style="font-size:1.8rem;color:var(--accent);margin-bottom:1rem;"></i>
            <h3 style="font-family:'Playfair Display',serif;font-size:1.15rem;margin-bottom:0.5rem;color:var(--text);">${card.title||''}</h3>
            <p style="font-size:0.88rem;color:var(--muted);line-height:1.6;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;

    case 'playful':
      return `<section id="services" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
        <h2 class="anim-1" style="font-family:'Nunito',sans-serif;font-size:2.2rem;font-weight:900;text-align:center;margin-bottom:0.5rem;color:var(--text);">${title}</h2>
        <p class="anim-2" style="text-align:center;color:var(--muted);margin-bottom:2.5rem;font-weight:600;font-size:1.05rem;">${subtitle}</p>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="background:var(--bg);border:3px solid var(--text);border-radius:20px;padding:1.75rem;box-shadow:0 4px 0 var(--text);">
            <div style="width:50px;height:50px;background:var(--accent);color:var(--on-accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1rem;"><i class="${card.icon||'fa-solid fa-star'}"></i></div>
            <h3 style="font-family:'Nunito',sans-serif;font-size:1.15rem;font-weight:800;margin-bottom:0.4rem;">${card.title||''}</h3>
            <p style="font-size:0.92rem;color:var(--muted);line-height:1.6;font-weight:500;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;

    case 'neumorphism':
      return `<section id="services" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
        <h2 class="anim-1" style="font-family:'Poppins',sans-serif;font-size:1.8rem;font-weight:600;text-align:center;margin-bottom:0.5rem;color:var(--text);">${title}</h2>
        <p class="anim-2" style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">${subtitle}</p>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="background:var(--bg);border-radius:16px;padding:1.75rem;box-shadow:8px 8px 16px var(--shadow-dark),-8px -8px 16px var(--shadow-light);">
            <div style="width:48px;height:48px;background:var(--bg);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;box-shadow:inset 4px 4px 8px var(--shadow-dark),inset -4px -4px 8px var(--shadow-light);color:var(--accent);font-size:1.2rem;"><i class="${card.icon||'fa-solid fa-star'}"></i></div>
            <h3 style="font-family:'Poppins',sans-serif;font-size:1.05rem;font-weight:600;margin-bottom:0.4rem;">${card.title||''}</h3>
            <p style="font-size:0.9rem;color:var(--muted);line-height:1.6;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;

    case 'swiss':
      return `<section id="services" style="padding:4rem 2rem;max-width:1200px;margin:0 auto;border-top:1px solid var(--text);">
        <div style="display:grid;grid-template-columns:1fr 3fr;gap:2rem;margin-bottom:2rem;">
          <div class="anim-1" style="font-size:0.72rem;font-weight:600;color:var(--accent);letter-spacing:0.15em;">— A</div>
          <h2 class="anim-2" style="font-size:1.6rem;font-weight:900;">${title}</h2>
        </div>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--text);">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="padding:1.5rem 1.5rem 1.5rem 0;border-right:1px solid var(--text);border-bottom:1px solid var(--text);${i%3===2?'border-right:none;':''}">
            <div style="font-size:0.7rem;font-weight:600;color:var(--accent);letter-spacing:0.15em;margin-bottom:0.75rem;">— ${String.fromCharCode(66+i)}</div>
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;">${card.title||''}</h3>
            <p style="font-size:0.88rem;color:var(--muted);line-height:1.5;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;

    case 'organic':
      return `<section id="services" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
        <h2 class="anim-1" style="font-family:'Lora',serif;font-size:2rem;font-weight:600;text-align:center;margin-bottom:0.5rem;color:var(--text);">${title}</h2>
        <p class="anim-2" style="text-align:center;color:var(--muted);margin-bottom:2.5rem;font-size:1.05rem;">${subtitle}</p>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="background:var(--bg);border:1px solid var(--border);border-radius:24px;padding:1.75rem;box-shadow:0 4px 20px rgba(0,0,0,0.04);">
            <div style="width:50px;height:50px;background:var(--accent);color:var(--on-accent);border-radius:50% 50% 50% 0;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin-bottom:1rem;"><i class="${card.icon||'fa-solid fa-leaf'}"></i></div>
            <h3 style="font-family:'Lora',serif;font-size:1.1rem;font-weight:600;margin-bottom:0.4rem;">${card.title||''}</h3>
            <p style="font-size:0.92rem;color:var(--muted);line-height:1.6;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;

    default: // minimalism + corporate
      return `<section id="services" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
        <h2 class="anim-1" style="font-size:2rem;text-align:center;margin-bottom:0.5rem;">${title}</h2>
        <p class="anim-2" style="text-align:center;color:var(--muted);margin-bottom:2.5rem;font-size:1.05rem;">${subtitle}</p>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;">
          ${cards.map((card,i)=>`<div class="anim-${(i%3)+1}" style="background:var(--bg);border:1px solid var(--border);border-radius:${style==='corporate'?'8px':'12px'};padding:1.75rem;${style==='corporate'?'box-shadow:0 1px 3px rgba(0,0,0,0.05);':''}transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 25px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='';this.style.boxShadow='${style==='corporate'?'0 1px 3px rgba(0,0,0,0.05)':'none'}';">
            <div style="width:44px;height:44px;background:${style==='corporate'?'var(--accent)':withAlpha(accent,0.1)};color:${style==='corporate'?'var(--on-accent)':'var(--accent)'};border-radius:${style==='corporate'?'8px':'10px'};display:flex;align-items:center;justify-content:center;margin-bottom:1rem;font-size:1.2rem;"><i class="${card.icon||'fa-solid fa-star'}"></i></div>
            <h3 style="font-size:1.1rem;margin-bottom:0.5rem;">${card.title||''}</h3>
            <p style="font-size:0.92rem;color:var(--muted);line-height:1.6;">${card.description||''}</p>
          </div>`).join('')}
        </div>
      </section>`;
  }
}

// ============================================================================
// ABOUT, TESTIMONIAL, CTA, CONTACT, FOOTER — style-aware
// ============================================================================
function renderAbout(c, style) {
  const sf = STYLE_FONTS[style] || STYLE_FONTS.minimalism;
  const dropCap = style === 'editorial' ? 'class="anim-1" style="font-family:\'Source Serif Pro\',serif;font-size:1.1rem;color:var(--muted);line-height:1.8;"' : 'class="anim-1" style="font-size:1.1rem;color:var(--muted);line-height:1.7;"';
  const headingStyle = style === 'editorial' || style === 'art-deco' || style === 'organic'
    ? `font-family:'${sf.head.replace(/'/g,'')}';font-weight:${sf.hw};` : `font-weight:${sf.hw};`;
  return `<section id="about" style="padding:4rem 2rem;max-width:780px;margin:0 auto;">
    <h2 class="anim-1" style="font-size:1.8rem;margin-bottom:1.25rem;${headingStyle}">${c.title||'About us'}</h2>
    <p ${dropCap}>${c.body||''}</p>
  </section>`;
}

function renderTestimonial(c, style) {
  const sf = STYLE_FONTS[style] || STYLE_FONTS.minimalism;
  return `<section class="anim-fade" style="padding:4rem 2rem;background:var(--secondary);color:var(--on-primary);text-align:center;">
    <div style="max-width:680px;margin:0 auto;">
      <div style="font-size:2.5rem;color:var(--accent);margin-bottom:1rem;opacity:0.6;"><i class="fa-solid fa-quote-left"></i></div>
      <blockquote style="font-family:${sf.head};font-size:clamp(1.3rem,2.5vw,1.7rem);font-weight:${sf.hw};line-height:1.4;letter-spacing:${sf.ls};margin-bottom:1.5rem;">"${c.quote||''}"</blockquote>
      <p style="font-size:0.85rem;opacity:0.7;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${c.author||''}</p>
    </div>
  </section>`;
}

function renderCTA(c, style) {
  return `<section class="anim-fade" style="padding:4rem 2rem;text-align:center;background:var(--primary);color:var(--on-primary);">
    <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);margin-bottom:0.75rem;">${c.headline||'Ready to start?'}</h2>
    <p style="opacity:0.8;margin-bottom:2rem;max-width:480px;margin-left:auto;margin-right:auto;">${c.subtitle||''}</p>
    <a href="#contact" style="display:inline-block;background:var(--accent);color:var(--on-accent);padding:0.9rem 2.2rem;border-radius:${style==='playful'?'20px':style==='brutalism'?'0':'8px'};font-weight:700;font-size:1rem;${style==='playful'?'box-shadow:0 4px 0 rgba(0,0,0,0.2);':''}">${c.button_text||'Get started'}</a>
  </section>`;
}

function renderContact(c, style) {
  const sf = STYLE_FONTS[style] || STYLE_FONTS.minimalism;
  const r = style === 'playful' ? '20px' : style === 'brutalism' ? '0' : style === 'organic' ? '24px' : '8px';
  // Glassmorphism: translucent inputs with white text on the gradient bg
  const isGlass = style === 'glassmorphism';
  const inputBg = isGlass ? 'rgba(255,255,255,0.1)' : 'var(--bg)';
  const inputColor = isGlass ? '#FFFFFF' : 'var(--text)';
  const inputBorder = isGlass ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)';
  const inputPlaceholder = isGlass ? 'rgba(255,255,255,0.5)' : 'var(--muted)';
  const successBg = isGlass ? 'rgba(255,255,255,0.1)' : 'var(--bg)';
  return `<section id="contact" class="anim-fade" style="padding:4rem 2rem;max-width:640px;margin:0 auto;">
    <h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">${c.title||'Get in touch'}</h2>
    <p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">${c.subtitle||"We'd love to hear from you."}</p>
    <form onsubmit="event.preventDefault();this.querySelector('.ff').style.display='none';this.querySelector('.fs').style.display='block';" style="display:flex;flex-direction:column;gap:1rem;">
      <div class="ff" style="display:flex;flex-direction:column;gap:1rem;">
        <input type="text" placeholder="Your name" required style="padding:0.9rem 1.1rem;border:${inputBorder};border-radius:${r};font-size:0.95rem;background:${inputBg};color:${inputColor};font-family:${sf.body};">
        <input type="email" placeholder="Your email" required style="padding:0.9rem 1.1rem;border:${inputBorder};border-radius:${r};font-size:0.95rem;background:${inputBg};color:${inputColor};font-family:${sf.body};">
        <textarea placeholder="Your message" required rows="5" style="padding:0.9rem 1.1rem;border:${inputBorder};border-radius:${r};font-size:0.95rem;background:${inputBg};color:${inputColor};font-family:${sf.body};resize:vertical;"></textarea>
        <button type="submit" style="background:var(--accent);color:var(--on-accent);padding:0.9rem;border:none;border-radius:${r};font-weight:700;font-size:0.95rem;cursor:pointer;font-family:${sf.body};">Send message</button>
      </div>
      <div class="fs" style="display:none;text-align:center;padding:2.5rem;background:${successBg};border:${inputBorder};border-radius:${r};">
        <i class="fa-solid fa-circle-check" style="font-size:2.5rem;color:#16A34A;margin-bottom:0.75rem;"></i>
        <p style="font-weight:600;font-size:1.1rem;">Thank you! Your message has been sent.</p>
      </div>
    </form>
    ${c.contact_details ? `<div style="margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;font-size:0.9rem;color:var(--muted);">
      ${c.contact_details.email?`<span><i class="fa-solid fa-envelope" style="color:var(--accent);margin-right:0.3rem;"></i>${c.contact_details.email}</span>`:''}
      ${c.contact_details.phone?`<span><i class="fa-solid fa-phone" style="color:var(--accent);margin-right:0.3rem;"></i>${c.contact_details.phone}</span>`:''}
      ${c.contact_details.address?`<span><i class="fa-solid fa-location-dot" style="color:var(--accent);margin-right:0.3rem;"></i>${c.contact_details.address}</span>`:''}
    </div>`:''}
  </section>`;
}

function renderFooter(c, style) {
  const sf = STYLE_FONTS[style] || STYLE_FONTS.minimalism;
  const links = c.nav_links || ['Home','About','Services','Contact'];
  const socials = c.social_links || [];
  const year = new Date().getFullYear();
  const brandDisplay = c._brandDisplay || c.brand_name || 'Brand';

  if (style === 'brutalism') {
    return `<footer style="background:var(--text);color:var(--bg);padding:2rem;text-align:center;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;">© ${year} ${c.brand_name||'Brand'} // Built with Clay</footer>`;
  }
  if (style === 'minimalism' || style === 'swiss' || socials.length === 0) {
    return `<footer style="padding:2.5rem;text-align:center;border-top:1px solid var(--border);color:var(--muted);font-size:0.85rem;">© ${year} ${c.brand_name||'Brand'}. All rights reserved.</footer>`;
  }
  return `<footer style="background:var(--primary);color:var(--on-primary);padding:3.5rem 2rem;">
    <div class="footer-grid" style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:2.5rem;">
      <div><h3 style="font-family:${sf.head};font-weight:${sf.hw};font-size:1.3rem;margin-bottom:0.6rem;">${brandDisplay}</h3><p style="opacity:0.7;font-size:0.9rem;line-height:1.6;max-width:300px;">${c.tagline||''}</p></div>
      <div><h4 style="font-size:0.75rem;text-transform:uppercase;opacity:0.5;margin-bottom:0.85rem;letter-spacing:0.1em;font-weight:600;">Explore</h4>${links.map(l=>`<div style="margin-bottom:0.5rem;"><a href="#${l.toLowerCase().replace(/\s/g,'-')}" style="opacity:0.75;font-size:0.88rem;">${l}</a></div>`).join('')}</div>
      <div><h4 style="font-size:0.75rem;text-transform:uppercase;opacity:0.5;margin-bottom:0.85rem;letter-spacing:0.1em;font-weight:600;">Connect</h4>${socials.map(s=>`<div style="margin-bottom:0.5rem;"><a href="#" style="opacity:0.75;font-size:0.88rem;"><i class="fa-brands fa-${s}" style="margin-right:0.4rem;"></i>${s.charAt(0).toUpperCase()+s.slice(1)}</a></div>`).join('')}</div>
    </div>
    <div style="max-width:1100px;margin:2.5rem auto 0;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.1);text-align:center;opacity:0.5;font-size:0.82rem;">© ${year} ${c.brand_name||'Brand'}. All rights reserved.</div>
  </footer>`;
}

// ============================================================================
// RENDERER — assembles the full page, SPLIT into 3 real files
// ============================================================================
function renderSite(spec, palette, designStyle) {
  const sf = STYLE_FONTS[designStyle] || STYLE_FONTS.minimalism;
  const content = spec.content;

  // If a logo was uploaded, use it in the nav instead of the brand name text
  const hasLogo = spec.logo === true;
  const logoExt = spec.logo_ext || 'png';
  const brandDisplay = hasLogo
    ? `<img src="./logo.${logoExt}" alt="${content.brand_name||'Logo'}" style="height:36px;max-width:160px;object-fit:contain;">`
    : content.brand_name || 'Brand';

  // Replace brand_name in content with the logo-aware version for nav
  content._brandDisplay = brandDisplay;

  // Glassmorphism gradient
  if (designStyle === 'glassmorphism') {
    content._gradient1 = palette[1] || '#667eea';
    content._gradient2 = palette[3] || '#764ba2';
  }

  // Neumorphism shadow vars
  const neuShadows = designStyle === 'neumorphism'
    ? `--shadow-dark:${luminance(palette[0])>0.5?'#D1D5DB':'#1F2937'};--shadow-light:${luminance(palette[0])>0.5?'#FFFFFF':'#374151'};`
    : '';

  // ---- Build CSS file ----
  const cssContent = baseCSS(palette, designStyle) +
    (neuShadows ? `:root{${neuShadows}}` : '') +
    hoverCSS(designStyle);

  // ---- Build JS file ----
  const jsContent = `// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});
// Contact form handler
document.querySelectorAll('form').forEach(function(f){
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var ff=f.querySelector('.ff');var fs=f.querySelector('.fs');
    if(ff&&fs){ff.style.display='none';fs.style.display='block';}
  });
});
`;

  // ---- Build HTML file ----
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${content.brand_name||'Website'}${content.tagline?' - '+content.tagline:''}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${sf.gf}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./styles.css">
</head>
<body${designStyle==='glassmorphism'?' style="background:transparent;"':''}><div id="top"></div>`;

  // Nav
  html += renderNav(content, designStyle, hasLogo, logoExt);
  const isSidebar = (spec.components?.nav === 'sidebar');
  const isGlass = designStyle === 'glassmorphism';

  // Hero
  html += renderHero(content, designStyle);

  // Sections (shuffled for variety — see ai-generate)
  (spec.sections || []).forEach(section => {
    if (section.type === 'features') html += renderFeatures(section.content || content, designStyle);
    else if (section.type === 'about') html += renderAbout(section.content || content, designStyle);
    else if (section.type === 'testimonial') html += renderTestimonial(section.content || content, designStyle);
    else if (section.type === 'cta') html += renderCTA(section.content || content, designStyle);
    else if (section.type === 'contact') html += renderContact(section.content || content, designStyle);
    else if (section.type === 'gallery') html += renderGallery(section.content || content, designStyle);
    else if (section.type === 'pricing') html += renderPricing(section.content || content, designStyle);
    else if (section.type === 'stats') html += renderStats(section.content || content, designStyle);
    else if (section.type === 'products') html += renderProducts(section.content || content, designStyle);
    else if (section.type === 'menu') html += renderMenu(section.content || content, designStyle);
    else if (section.type === 'team') html += renderTeam(section.content || content, designStyle);
    else if (section.type === 'faq') html += renderFAQ(section.content || content, designStyle);
    else if (section.type === 'portfolio') html += renderPortfolio(section.content || content, designStyle);
    else if (section.type === 'cta-compact') html += renderCTACompact(section.content || content, designStyle);
  });

  // Footer
  html += renderFooter(content, designStyle);

  // Close wrappers
  if (isSidebar) html += `</main></div>`;
  if (isGlass) html += `</div>`;

  html += `<script src="./script.js" defer></script>`;
  html += `</body></html>`;

  return {
    'index.html': html,
    'styles.css': cssContent,
    'script.js': jsContent
  };
}

// ============================================================================
// HOVER CSS — per-style interactive hover states
// ============================================================================
function hoverCSS(style) {
  // Hover effects for ALL buttons (a[href] and button[type]) and cards.
  // Targets every interactive element, not just specific hrefs.
  const hovers = {
    playful: `
a[href],button[type],.clay-btn{transition:transform 0.15s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.15s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 7px 0 var(--text);}
a[href]:active,button[type]:active,.clay-btn:active{transform:translateY(3px) scale(0.98);box-shadow:0 1px 0 var(--text);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translateY(-4px) rotate(-1deg);box-shadow:0 8px 0 var(--accent);}`,
    brutalism: `
a[href],button[type],.clay-btn{transition:transform 0.1s,box-shadow 0.1s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translate(-2px,-2px);box-shadow:4px 4px 0 var(--accent);}
a[href]:active,button[type]:active,.clay-btn:active{transform:translate(0,0);box-shadow:0 0 0 var(--accent);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.1s,box-shadow 0.1s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--accent);}`,
    neumorphism: `
a[href],button[type],.clay-btn{transition:box-shadow 0.3s ease;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{box-shadow:inset 3px 3px 6px var(--shadow-dark),inset -3px -3px 6px var(--shadow-light);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:box-shadow 0.3s ease;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{box-shadow:inset 4px 4px 8px var(--shadow-dark),inset -4px -4px 8px var(--shadow-light);}`,
    glassmorphism: `
a[href],button[type],.clay-btn{transition:transform 0.2s,background 0.2s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translateY(-2px);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.3s,background 0.3s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translateY(-4px);}`,
    'art-deco': `
a[href],button[type],.clay-btn{transition:transform 0.3s,box-shadow 0.3s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translateY(-2px);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.3s,box-shadow 0.3s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,0.2);}`,
    editorial: `
a[href],button[type],.clay-btn{transition:transform 0.2s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translateY(-1px);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.2s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translateY(-2px);}`,
    swiss: `
a[href],button[type],.clay-btn{transition:background 0.2s,color 0.2s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{opacity:0.8;}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:border-color 0.2s,background 0.2s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{border-left-color:var(--text);}`,
    organic: `
a[href],button[type],.clay-btn{transition:transform 0.3s,box-shadow 0.3s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translateY(-2px);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.3s,box-shadow 0.3s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,0.1);}`,
    minimalism: `
a[href],button[type],.clay-btn{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translateY(-1px);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.06);}`,
    corporate: `
a[href],button[type],.clay-btn{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;}
a[href]:hover,button[type]:hover,.clay-btn:hover{transform:translateY(-2px);}
section .grid-3 > div,section .grid-2 > div,section .grid-4 > div{transition:transform 0.2s,box-shadow 0.2s;cursor:pointer;}
section .grid-3 > div:hover,section .grid-2 > div:hover,section .grid-4 > div:hover{transform:translateY(-3px);box-shadow:0 8px 25px rgba(0,0,0,0.1);}`,
  };
  return hovers[style] || hovers.minimalism;
}

// ============================================================================
// NEW COMPONENTS — gallery, pricing, stats (for variety + business types)
// ============================================================================
function renderGallery(c, style) {
  const items = c.items || [];
  return `<section id="gallery" class="anim-fade" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
    <h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">${c.title||'Gallery'}</h2>
    <p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">${c.subtitle||''}</p>
    <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
      ${items.map((item,i)=>`<div class="anim-${(i%3)+1}" style="aspect-ratio:1;background:var(--secondary);border-radius:${style==='organic'?'24px':style==='playful'?'20px':'8px'};display:flex;align-items:center;justify-content:center;color:var(--on-primary);font-size:0.85rem;opacity:0.85;overflow:hidden;position:relative;">
        <span style="text-align:center;padding:1rem;"><i class="fa-regular fa-image" style="font-size:1.5rem;display:block;margin-bottom:0.5rem;"></i>${item.caption||'Image'}</span>
      </div>`).join('')}
    </div>
  </section>`;
}

function renderPricing(c, style) {
  const plans = c.plans || [];
  return `<section id="pricing" class="anim-fade" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">
    <h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">${c.title||'Pricing'}</h2>
    <p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">${c.subtitle||''}</p>
    <div class="grid-${Math.min(plans.length,3)}" style="display:grid;grid-template-columns:repeat(${Math.min(plans.length,3)},1fr);gap:1.5rem;">
      ${plans.map((plan,i)=>`<div class="anim-${(i%3)+1}" style="background:var(--bg);border:${i===1?'2px':'1px'} solid ${i===1?'var(--accent)':'var(--border)'};border-radius:${style==='organic'?'24px':style==='playful'?'20px':'12px'};padding:2rem;text-align:center;${i===1?'transform:scale(1.05);':''}">
        <h3 style="font-size:1.1rem;margin-bottom:0.5rem;">${plan.name||'Plan'}</h3>
        <div style="font-size:2.5rem;font-weight:800;margin-bottom:1rem;color:var(--accent);">${plan.price||'$0'}<span style="font-size:0.9rem;color:var(--muted);font-weight:400;">/${plan.period||'mo'}</span></div>
        <ul style="list-style:none;text-align:left;margin-bottom:1.5rem;font-size:0.9rem;color:var(--muted);">
          ${(plan.features||[]).map(f=>`<li style="padding:0.3rem 0;"><i class="fa-solid fa-check" style="color:var(--accent);margin-right:0.5rem;"></i>${f}</li>`).join('')}
        </ul>
        <a href="#contact" style="display:block;background:${i===1?'var(--accent)':'var(--bg)'};color:${i===1?'var(--on-accent)':'var(--text)'};padding:0.75rem;border-radius:${style==='playful'?'16px':'8px'};font-weight:600;border:${i===1?'none':'1px solid var(--border)'};text-align:center;">${plan.cta||'Choose'}</a>
      </div>`).join('')}
    </div>
  </section>`;
}

function renderStats(c, style) {
  const stats = c.stats || [];
  const statsHtml = stats.map(function(s, i) {
    var animClass = 'anim-' + ((i % 3) + 1);
    return '<div class="' + animClass + '">' +
      '<div style="font-size:2.5rem;font-weight:800;color:var(--accent);margin-bottom:0.25rem;">' + (s.value || '0') + '</div>' +
      '<div style="font-size:0.85rem;opacity:0.7;">' + (s.label || '') + '</div>' +
      '</div>';
  }).join('');
  return '<section class="anim-fade" style="padding:3rem 2rem;background:var(--primary);color:var(--on-primary);">' +
    '<div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(' + Math.min(stats.length, 4) + ',1fr);gap:2rem;text-align:center;">' +
    statsHtml +
    '</div></section>';
}

// ============================================================================
// SHOPPING / E-COMMERCE COMPONENTS
// ============================================================================
function renderProducts(c, style) {
  const products = c.products || [];
  const r = style === 'playful' ? '20px' : style === 'brutalism' ? '0' : style === 'organic' ? '16px' : '8px';
  const productsHtml = products.map(function(p, i) {
    var animClass = 'anim-' + ((i % 3) + 1);
    return '<div class="' + animClass + '" style="background:var(--bg);border:1px solid var(--border);border-radius:' + r + ';overflow:hidden;display:flex;flex-direction:column;">' +
      '<div style="aspect-ratio:1;background:var(--secondary);display:flex;align-items:center;justify-content:center;color:var(--on-primary);font-size:2rem;opacity:0.4;">' +
        '<i class="fa-regular fa-image"></i>' +
      '</div>' +
      '<div style="padding:1rem;display:flex;flex-direction:column;gap:0.5rem;flex:1;">' +
        '<h3 style="font-size:1rem;margin:0;">' + (p.name || 'Product') + '</h3>' +
        '<p style="font-size:0.82rem;color:var(--muted);margin:0;flex:1;">' + (p.description || '') + '</p>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">' +
          '<span style="font-size:1.15rem;font-weight:800;color:var(--accent);">' + (p.price || '$0') + '</span>' +
          '<a href="#contact" style="background:var(--accent);color:var(--on-accent);padding:0.45rem 0.9rem;border-radius:' + r + ';font-size:0.82rem;font-weight:600;">' +
            '<i class="fa-solid fa-cart-plus" style="margin-right:0.3rem;"></i>Buy</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<section id="shop" class="anim-fade" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">' +
    '<h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">' + (c.title || 'Our products') + '</h2>' +
    '<p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">' + (c.subtitle || '') + '</p>' +
    '<div class="grid-4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;">' +
    productsHtml +
    '</div></section>';
}

function renderMenu(c, style) {
  const items = c.items || [];
  const r = style === 'playful' ? '16px' : style === 'brutalism' ? '0' : '8px';
  const itemsHtml = items.map(function(item, i) {
    var animClass = 'anim-' + ((i % 3) + 1);
    return '<div class="' + animClass + '" style="display:flex;justify-content:space-between;align-items:center;padding:1rem 0;border-bottom:1px solid var(--border);gap:1rem;">' +
      '<div style="flex:1;">' +
        '<div style="font-weight:700;font-size:1rem;">' + (item.name || 'Item') + '</div>' +
        '<div style="font-size:0.85rem;color:var(--muted);margin-top:0.2rem;">' + (item.description || '') + '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:1rem;">' +
        '<span style="font-weight:700;color:var(--accent);font-size:1.05rem;">' + (item.price || '') + '</span>' +
        '<a href="#contact" style="background:var(--accent);color:var(--on-accent);padding:0.35rem 0.8rem;border-radius:' + r + ';font-size:0.78rem;font-weight:600;">Order</a>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<section id="menu" class="anim-fade" style="padding:4rem 2rem;max-width:780px;margin:0 auto;">' +
    '<h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">' + (c.title || 'Menu') + '</h2>' +
    '<p style="text-align:center;color:var(--muted);margin-bottom:2rem;">' + (c.subtitle || '') + '</p>' +
    itemsHtml +
    '</section>';
}

function renderTeam(c, style) {
  const members = c.members || [];
  const r = style === 'playful' ? '20px' : style === 'brutalism' ? '0' : '50%';
  const membersHtml = members.map(function(m, i) {
    var animClass = 'anim-' + ((i % 3) + 1);
    return '<div class="' + animClass + '" style="text-align:center;">' +
      '<div style="width:120px;height:120px;border-radius:' + r + ';background:var(--secondary);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;color:var(--on-primary);font-size:2.5rem;opacity:0.4;">' +
        '<i class="fa-regular fa-user"></i>' +
      '</div>' +
      '<h3 style="font-size:1.05rem;margin-bottom:0.2rem;">' + (m.name || 'Team member') + '</h3>' +
      '<p style="font-size:0.85rem;color:var(--muted);">' + (m.role || '') + '</p>' +
    '</div>';
  }).join('');
  return '<section id="team" class="anim-fade" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">' +
    '<h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">' + (c.title || 'Our team') + '</h2>' +
    '<p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">' + (c.subtitle || '') + '</p>' +
    '<div class="grid-' + Math.min(members.length, 4) + '" style="display:grid;grid-template-columns:repeat(' + Math.min(members.length, 4) + ',1fr);gap:2rem;">' +
    membersHtml +
    '</div></section>';
}

function renderFAQ(c, style) {
  const faqs = c.faqs || [];
  const faqsHtml = faqs.map(function(f, i) {
    var animClass = 'anim-' + ((i % 3) + 1);
    return '<details class="' + animClass + '" style="border:1px solid var(--border);border-radius:8px;padding:1rem 1.25rem;margin-bottom:0.75rem;">' +
      '<summary style="font-weight:600;cursor:pointer;font-size:0.95rem;">' + (f.question || 'Question') + '</summary>' +
      '<p style="margin-top:0.75rem;color:var(--muted);font-size:0.9rem;line-height:1.6;">' + (f.answer || '') + '</p>' +
    '</details>';
  }).join('');
  return '<section id="faq" class="anim-fade" style="padding:4rem 2rem;max-width:780px;margin:0 auto;">' +
    '<h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">' + (c.title || 'FAQ') + '</h2>' +
    '<p style="text-align:center;color:var(--muted);margin-bottom:2rem;">' + (c.subtitle || '') + '</p>' +
    faqsHtml +
    '</section>';
}

function renderPortfolio(c, style) {
  const items = c.items || [];
  const r = style === 'playful' ? '20px' : style === 'brutalism' ? '0' : '8px';
  const itemsHtml = items.map(function(item, i) {
    var animClass = 'anim-' + ((i % 3) + 1);
    return '<div class="' + animClass + '" style="position:relative;aspect-ratio:4/3;background:var(--secondary);border-radius:' + r + ';overflow:hidden;display:flex;align-items:flex-end;padding:1rem;color:var(--on-primary);">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6),transparent 50%);"></div>' +
      '<div style="position:relative;">' +
        '<h3 style="font-size:1rem;margin:0;">' + (item.title || 'Project') + '</h3>' +
        '<p style="font-size:0.8rem;opacity:0.8;margin:0;">' + (item.category || '') + '</p>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<section id="portfolio" class="anim-fade" style="padding:4rem 2rem;max-width:1100px;margin:0 auto;">' +
    '<h2 style="font-size:1.8rem;text-align:center;margin-bottom:0.5rem;">' + (c.title || 'Our work') + '</h2>' +
    '<p style="text-align:center;color:var(--muted);margin-bottom:2.5rem;">' + (c.subtitle || '') + '</p>' +
    '<div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">' +
    itemsHtml +
    '</div></section>';
}

function renderCTACompact(c, style) {
  return '<section class="anim-fade" style="padding:3rem 2rem;text-align:center;background:var(--accent);color:var(--on-accent);">' +
    '<h2 style="font-size:1.5rem;margin-bottom:0.5rem;">' + (c.headline || 'Ready?') + '</h2>' +
    '<p style="margin-bottom:1.5rem;opacity:0.9;">' + (c.subtitle || '') + '</p>' +
    '<a href="#contact" style="display:inline-block;background:var(--on-accent);color:var(--accent);padding:0.75rem 1.75rem;border-radius:' + (style === 'playful' ? '16px' : '8px') + ';font-weight:700;">' + (c.button_text || 'Get started') + '</a>' +
  '</section>';
}

window.CLAY_COMPONENTS = { renderSite, STYLE_FONTS };
