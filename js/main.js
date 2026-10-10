const root = document.documentElement;
const themeToggle = document.querySelector('.theme-toggle');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

try {
  const saved = localStorage.getItem('sh-theme');
  if (saved === 'dark' || saved === 'light') root.dataset.theme = saved;
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';
} catch {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';
}

function themeLabel() {
  const dark = root.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
themeLabel();
themeToggle.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('sh-theme', root.dataset.theme); } catch {}
  themeLabel();
});

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('is-open')) {
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    menuToggle.focus();
  }
});

const navLinks = [...document.querySelectorAll('.nav > a')];
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach((a) => {
        const match = a.getAttribute('href') === `#${entry.target.id}`;
        if (match) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-30% 0px -60% 0px' });
  navLinks.forEach((a) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) spy.observe(target);
  });

  const reveal = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.section, .hero-text, .hero-photo').forEach((el) => {
    el.classList.add('reveal');
    reveal.observe(el);
  });
}

document.querySelector('#year').textContent = String(new Date().getFullYear());

document.querySelectorAll('.video-embed').forEach((embed) => {
  const play = embed.querySelector('.video-play');
  if (!play) return;
  play.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.className = 'video-frame';
    frame.src = `https://www.youtube-nocookie.com/embed/${embed.dataset.video}?autoplay=1&rel=0`;
    frame.title = embed.dataset.title || 'Paper video';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.setAttribute('allowfullscreen', '');
    embed.replaceChildren(frame);
  });
});

document.querySelectorAll('.ws-slider').forEach((slider) => {
  const viewport = slider.querySelector('.ws-viewport');
  const cards = [...slider.querySelectorAll('.ws-card')];
  const prev = slider.querySelector('.ws-arrow--prev');
  const next = slider.querySelector('.ws-arrow--next');
  const dotsBox = slider.querySelector('.ws-dots');
  if (!viewport || !cards.length || !prev || !next) return;

  const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const step = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : viewport.clientWidth);
  const positionCount = () => Math.max(1, Math.round((viewport.scrollWidth - viewport.clientWidth) / step()) + 1);
  const currentPosition = () => Math.min(positionCount() - 1, Math.round(viewport.scrollLeft / step()));

  const buildDots = () => {
    if (!dotsBox) return;
    const count = positionCount();
    if (dotsBox.children.length === count) return;
    dotsBox.replaceChildren(...Array.from({ length: count }, (_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ws-dot';
      dot.setAttribute('aria-label', `Go to position ${i + 1} of ${count}`);
      dot.addEventListener('click', () => viewport.scrollTo({ left: i * step(), behavior: smooth }));
      return dot;
    }));
  };

  const update = () => {
    buildDots();
    prev.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 2;
    [...(dotsBox?.children ?? [])].forEach((dot, i) => dot.classList.toggle('is-active', i === currentPosition()));
  };

  prev.addEventListener('click', () => viewport.scrollBy({ left: -step(), behavior: smooth }));
  next.addEventListener('click', () => viewport.scrollBy({ left: step(), behavior: smooth }));
  viewport.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
  });
  update();
});

const galleryImgs = [...document.querySelectorAll('.ws-media img')];
if (galleryImgs.length) {
  const lb = document.createElement('dialog');
  lb.className = 'lightbox';
  lb.setAttribute('aria-label', 'Workshop photo gallery');
  lb.innerHTML = '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure><span class="lb-count" aria-hidden="true"></span><button class="lb-close" type="button" aria-label="Close gallery"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><button class="lb-arrow lb-arrow--prev" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button class="lb-arrow lb-arrow--next" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('.lb-img');
  const lbCaption = lb.querySelector('.lb-caption');
  const lbCount = lb.querySelector('.lb-count');
  let lbIndex = 0;

  const show = (i) => {
    lbIndex = (i + galleryImgs.length) % galleryImgs.length;
    const src = galleryImgs[lbIndex];
    lbImg.src = src.currentSrc || src.src;
    lbImg.alt = src.alt;
    lbCaption.textContent = src.alt;
    lbCount.textContent = `${lbIndex + 1} / ${galleryImgs.length}`;
  };

  galleryImgs.forEach((im, i) => {
    const zoom = document.createElement('button');
    zoom.type = 'button';
    zoom.className = 'ws-zoom';
    zoom.setAttribute('aria-label', `Open photo: ${im.alt}`);
    im.replaceWith(zoom);
    zoom.appendChild(im);
    zoom.addEventListener('click', () => {
      show(i);
      if (!lb.open) lb.showModal();
    });
  });

  lb.querySelector('.lb-arrow--prev').addEventListener('click', () => show(lbIndex - 1));
  lb.querySelector('.lb-arrow--next').addEventListener('click', () => show(lbIndex + 1));
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(lbIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(lbIndex + 1); }
  });
}
