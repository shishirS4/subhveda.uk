/* Subhveda — enhancements.
   Deliberately dependency-free: no smooth-scroll library, no CDN scripts.
   Icons come from js/icons.js (Solar Icon Set, MIT). */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileNavigation = window.matchMedia('(max-width: 1060px)');

const ICONS = window.SHUBH_ICONS || {};
const LEGACY_EMOJI = {
  '🔮': 'planet', '🪔': 'fire', '🌟': 'sun', '🕉️': 'sun', '📿': 'medal', '🪷': 'heart',
  '📜': 'book', '👨‍🏫': 'user', '👩‍🏫': 'user', '🌐': 'global', '🤝': 'heart',
  '🙏': 'heart', '❤️': 'heart', '📚': 'book', '🌏': 'global', '💬': 'chat',
  '📧': 'letter', '📍': 'pin', '🕐': 'clock'
};

function iconMarkup(name, size = 20) {
  const icon = ICONS[name];
  if (!icon) return '';
  return `<svg viewBox="${icon.vb}" width="${size}" height="${size}" aria-hidden="true">${icon.b}</svg>`;
}

function translate(key, fallback = key) {
  const lang = window.ShubhVedaI18n?.getCurrentLang() || 'en';
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? fallback;
}

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initBackgroundVideos();
  initHeader();
  initMobileMenu();
  initSmoothScroll();
  initBackToTop();
  initFAQ();
  initVideos();
  initCounters();
  ['testimonials-container', 'home-testimonials-container'].forEach(id => {
    if (!document.getElementById(id)) return;
    renderTestimonials('all', id);
    initTestimonialFilters(id);
  });
  initScrollAnimations();
  document.querySelectorAll('form.contact-form:not(.kundali-form), .contact-form form').forEach(form => {
    form.addEventListener('submit', handleContactForm);
  });
});

/* ------------------------------------------------------------------
   Icons — every element carrying data-icon gets a Solar icon.
------------------------------------------------------------------ */
function initIcons() {
  document.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon || LEGACY_EMOJI[el.textContent.trim()];
    const markup = iconMarkup(name);
    if (!markup) return;
    el.innerHTML = markup;
    if (!el.matches('a, button')) el.setAttribute('aria-hidden', 'true');
  });
}

/* ------------------------------------------------------------------
   Ambient video (hero). Autoplays muted, fades in only once it can
   actually play, pauses off-screen and when the tab is hidden.
------------------------------------------------------------------ */
function initBackgroundVideos() {
  const players = [...document.querySelectorAll('.hero-media video, .video-card video')];
  if (!players.length) return;

  players.forEach(video => {
    const card = video.closest('.hero-media, .video-card');
    const reveal = () => card?.classList.add('is-ready');
    if (video.readyState >= 2) reveal();
    video.addEventListener('loadeddata', reveal);
    video.addEventListener('playing', reveal, { once: true });
    video.addEventListener('error', () => card?.classList.remove('is-ready'));

    if (reducedMotion.matches) {
      video.pause();
      video.removeAttribute('autoplay');
      return;
    }
    const attempt = () => {
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') promise.catch(() => {});
    };
    if (video.readyState >= 3) attempt();
    else video.addEventListener('canplay', attempt, { once: true });
  });

  if (!('IntersectionObserver' in window)) return;
  const visibility = new WeakMap();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { visibility.set(entry.target, entry.isIntersecting); });
    players.forEach(video => {
      const visible = visibility.get(video);
      if (visible && !document.hidden && !reducedMotion.matches) {
        const promise = video.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: .12 });
  players.forEach(video => {
    visibility.set(video, true);
    observer.observe(video);
  });
  document.addEventListener('visibilitychange', () => {
    players.forEach(video => {
      if (document.hidden) video.pause();
      else if (visibility.get(video) !== false && !reducedMotion.matches) {
        const promise = video.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
      }
    });
  });
}

function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function initMobileMenu() {
  const button = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav-menu');
  if (!button || !nav) return;
  const setOpen = (open, returnFocus = false) => {
    button.classList.toggle('active', open);
    nav.classList.toggle('active', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    if (returnFocus) button.focus();
  };
  button.addEventListener('click', () => setOpen(!nav.classList.contains('active')));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('click', event => {
    if (!nav.classList.contains('active')) return;
    if (!button.contains(event.target) && !nav.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (!nav.classList.contains('active')) return;
    if (event.key === 'Escape') setOpen(false, true);
    if (event.key !== 'Tab') return;
    const items = [...nav.querySelectorAll('a, button'), button];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  mobileNavigation.addEventListener('change', () => setOpen(false));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', `#${id}`);
    });
  });
}

let revealObserver;
function initScrollAnimations(root = document) {
  if (!('IntersectionObserver' in window)) return;
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  }
  root.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right').forEach(el => {
    if (el.classList.contains('reveal-ready')) return;
    if (reducedMotion.matches) { el.classList.add('visible'); return; }
    el.classList.add('reveal-ready');
    revealObserver.observe(el);
  });
}

function initBackToTop() {
  const button = document.querySelector('.back-to-top');
  if (!button) return;
  let ticking = false;
  const update = () => {
    button.classList.toggle('visible', window.scrollY > 700);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    document.querySelector('.logo')?.focus({ preventScroll: true });
  });
  update();
}

function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((button, index) => {
    const item = button.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    if (!answer) return;
    answer.id = `faq-answer-${index}`;
    button.id = `faq-question-${index}`;
    button.setAttribute('aria-controls', answer.id);
    button.setAttribute('aria-expanded', 'false');
    answer.setAttribute('role', 'region');
    answer.setAttribute('aria-labelledby', button.id);
    button.addEventListener('click', () => {
      const open = !item.classList.contains('active');
      document.querySelectorAll('.faq-item.active').forEach(other => {
        other.classList.remove('active');
        other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('active', open);
      button.setAttribute('aria-expanded', String(open));
    });
  });
}

function initCounters() {
  const stats = document.querySelectorAll('[data-count]');
  if (!stats.length || reducedMotion.matches || !('IntersectionObserver' in window)) return;
  const format = value => new Intl.NumberFormat('en-IN').format(value);
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const step = now => {
        const progress = Math.min((now - start) / 1300, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = progress < 1 ? Math.round(target * eased) : target;
        el.textContent = format(value);
        if (suffix) el.append(Object.assign(document.createElement('span'), { textContent: suffix }));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: .5 });
  stats.forEach(el => observer.observe(el));
}

function initVideos() {
  const videos = [...document.querySelectorAll('.ceremony-media video')];
  if (!videos.length) return;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const pauseOthers = current => videos.forEach(other => { if (other !== current) other.pause(); });

  videos.forEach(video => {
    const card = video.closest('.ceremony-card');
    if (!card) return;

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    const title = card.querySelector('h3')?.textContent?.trim();
    card.setAttribute('aria-label', title ? `${title} — play video` : 'Play ceremony video');

    const sync = () => card.classList.toggle('is-playing', !video.paused && !video.ended);
    video.addEventListener('play', () => { pauseOthers(video); sync(); });
    video.addEventListener('pause', sync);
    video.addEventListener('ended', sync);

    const toggle = () => {
      if (video.paused) {
        video.muted = false;
        video.dataset.userPlayed = '1';
        const attempt = video.play();
        if (attempt) attempt.catch(() => {});
      } else if (video.muted) {
        video.muted = false;
        video.dataset.userPlayed = '1';
      } else {
        video.pause();
      }
    };

    card.addEventListener('click', event => {
      if (event.target.closest('a, button')) return;
      toggle();
    });
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle();
    });

    if (finePointer) {
      card.addEventListener('mouseenter', () => {
        if (video.paused && video.dataset.userPlayed !== '1') {
          video.muted = true;
          const attempt = video.play();
          if (attempt) attempt.catch(() => {});
        }
      });
      card.addEventListener('mouseleave', () => {
        if (video.dataset.userPlayed !== '1') {
          video.pause();
          try { video.currentTime = 0; } catch (error) {}
        }
      });
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(video => video.pause());
  });
}

function getWhatsAppLink(service = '') {
  const message = service
    ? `Namaste! I am interested in the ${service} service at Subhveda. Please share the details.`
    : 'Namaste! I would like to inquire about the services at Subhveda.';
  return `https://api.whatsapp.com/send?phone=919891646982&text=${encodeURIComponent(message)}`;
}

// Client statements. Names are proper nouns; quote text is localised via
// `testimonial_text_<id>` keys so it switches with the language selector.
// The order here is the order shown on the page and in the home-page strip.
const TESTIMONIALS_DATA = [
  { id: 1, name: 'Priya Sharma', location: 'Mumbai, India', rating: 5, service: 'puja', text: 'We had the Navagraha Puja done at home last month. Panditji came with everything prepared and explained each step as it happened. My mother-in-law, who is very particular about rituals, said afterwards that she had no complaints — and that never happens with her. The house has felt lighter since.' },
  { id: 7, name: 'Anjali Deshmukh', location: 'Sydney, Australia', rating: 5, service: 'astrology', text: "We have lived in Sydney for eleven years, and I had no one to read my kundali properly here. Panditji did the reading over a video call and explained every dosha in simple words — even which days to avoid travelling. What he said about my husband's job change came true within months. Now my whole family books calls with him before any big decision." },
  { id: 11, name: 'Sanjay Kapoor', location: 'London, UK', rating: 5, service: 'anushthan', text: "We have taken Subhveda's services from London for about four years now. It started with my daughter's kundali matching — Panditji told us plainly what he saw, the good and the not so good, which I appreciated. Then he gave the muhurat for our shop opening, and business has been steady since. Practical advice, no drama." },
  { id: 2, name: 'Anita Thapa', location: 'Kathmandu, Nepal', rating: 5, service: 'graha-shanti', text: 'I had my Graha Shanti done through Subhveda two years ago. I was not sure at first, because I have done pujas before that did not change anything. But the stomach trouble and sleeplessness I had for years started easing within a month. I do not know if it was the puja or my faith, but I am better today, and that is what matters to me.' },
  { id: 8, name: 'Bikash Adhikari', location: 'Sydney, Australia', rating: 5, service: 'anushthan', text: 'Our family did the Maha Mrityunjay Anushthan online from Sydney, while my parents sat through it in Kathmandu at the same time. Panditji stayed on a call with us the whole time and counted every mantra himself — it honestly felt like we were sitting in the same room. My father has been doing well since then, God has been kind. We have done two more pujas with them after that.' },
  { id: 10, name: 'Sunita Shrestha', location: 'New York, USA', rating: 5, service: 'astrology', text: 'I have had my kundali read in Kathmandu many times, but the way Panditji explained it over a video call was different. He went through my janam patri line by line, told me honestly about a difficult time coming in my marriage, and gave simple remedies — he never scared me with heavy rituals. I have done two more readings with him since, and each time I have been satisfied.' },
  { id: 9, name: 'Rajesh Patel', location: 'New York, USA', rating: 5, service: 'anushthan', text: "I arranged a Navagraha Anushthan for my parents in Varanasi while sitting in New York. I was worried about how it would go without me there, but Subhveda sent videos of each day's havan and the prasad reached home on time. Panditji called me daily to explain what was done. My father kept saying it felt like I was right there with them." },
  { id: 3, name: 'Vikram Singh', location: 'Delhi, India', rating: 5, service: 'astrology', text: "I started consulting Panditji on my father's advice four years ago, mostly before big decisions. Twice I was about to change jobs and he told me to wait — and both times staying put turned out to be right. He never sugar-coats anything, and he never asks for money in between, only the fixed consultation fee. That is rare these days." },
  { id: 4, name: 'Suman Gurung', location: 'Pokhara, Nepal', rating: 5, service: 'sanskar', text: "We did our son's naming ceremony in Pokhara with Subhveda last year. What I liked was that Panditji asked us beforehand about our family tradition from Gorkha — which side the mother's family sits, how we do the naamkaran — and followed it exactly. My grandparents were worried it would not be done the old way. In the end they were the happiest." },
  { id: 5, name: 'Deepak Joshi', location: 'Varanasi, India', rating: 5, service: 'anushthan', text: "We had a seven-day anushthan at our home in Varanasi for my son's exams and the family's well-being. Seven days of havans at home is not easy to manage, but the team came early every morning, finished before we left for work, and never once changed the timing. The mantra pronunciation was spot on — my uncle is a Sanskrit teacher and he said so himself." },
  { id: 6, name: 'Meena Devi', location: 'Lalitpur, Nepal', rating: 5, service: 'astrology', text: 'I have been taking Jyotish readings from Subhveda for the last three years, mostly about my children. Panditji remembers our family details from previous calls — that is what made me trust him. Last year he warned me not to lend money to a relative, I did not listen, and I am still chasing that money. Now I do not take a step without asking him first.' },
  { id: 12, name: 'Niruta Gurung', location: 'London, UK', rating: 5, service: 'astrology', text: 'Nepali by birth and settled in London for twelve years, I had almost given up on finding a purohit who understood our traditions. Then my sister told me about Subhveda. The consultation happened in Nepali, everything was explained with my janma nakshatra in mind, and I finally got answers to questions I had carried for years. I have already sent three of my friends to them.' }
];

function renderTestimonials(filter = 'all', containerId = 'testimonials-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const filtered = TESTIMONIALS_DATA.filter(item => filter === 'all' || item.service === filter);
  const limit = Number(container.dataset.limit) || filtered.length;
  container.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = translate('testimonials_empty', 'No testimonials in this category yet.');
    container.append(empty);
    return;
  }
  filtered.slice(0, limit).forEach(item => {
    const card = document.createElement('article');
    card.className = 'testimonial-card glass fade-in';
    card.innerHTML = '<div class="testimonial-body"><div class="testimonial-stars"></div><blockquote class="testimonial-text"></blockquote><div class="testimonial-author"><div class="testimonial-info"><h5></h5><span></span><br><span class="testimonial-service"></span></div></div></div>';
    const stars = card.querySelector('.testimonial-stars');
    stars.innerHTML = iconMarkup('star', 15).repeat(item.rating);
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', `${item.rating} / 5`);
    card.querySelector('.testimonial-text').textContent = `“${translate(`testimonial_text_${item.id}`, item.text)}”`;
    card.querySelector('h5').textContent = item.name;
    card.querySelector('.testimonial-info > span:not(.testimonial-service)').textContent = translate(`testimonial_loc_${item.id}`, item.location);
    card.querySelector('.testimonial-service').textContent = translate(`filter_${item.service.replace(/-/g, '_')}`, item.service);
    container.append(card);
  });
  initScrollAnimations(container);
}

function initTestimonialFilters(containerId) {
  const section = document.getElementById(containerId)?.closest('section');
  section?.querySelectorAll('.filter-btn').forEach(button => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      section.querySelectorAll('.filter-btn').forEach(other => {
        other.classList.toggle('active', other === button);
        other.setAttribute('aria-pressed', String(other === button));
      });
      renderTestimonials(button.dataset.filter, containerId);
    });
  });
}

// Re-render testimonials on language change so quotes update live.
document.addEventListener('languagechange', () => {
  ['testimonials-container', 'home-testimonials-container'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    const active = container.closest('section')?.querySelector('.filter-btn.active');
    renderTestimonials(active?.dataset.filter || 'all', id);
  });
});

function handleContactForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const message = [
    'Namaste! I would like to enquire at Subhveda.',
    `Name: ${String(data.get('name') || '').trim()}`,
    `Phone: ${String(data.get('phone') || '').trim()}`,
    data.get('email') ? `Email: ${String(data.get('email')).trim()}` : '',
    `Service: ${data.get('service')}`,
    data.get('message') ? `Message: ${String(data.get('message')).trim()}` : ''
  ].filter(Boolean).join('\n');
  window.open(`https://api.whatsapp.com/send?phone=919891646982&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}
