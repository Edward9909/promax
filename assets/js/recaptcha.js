(function() {
  const siteKey = '6LdD_tksAAAAAP1NwHlAKZYlCAOhnghjcGYmfCfH';
  let loadPromise = null;

  window.recaptchaWidgetId = undefined;

  function renderRecaptcha() {
    const target = document.getElementById('recaptchaWidget');
    if (!target || !window.grecaptcha) return window.recaptchaWidgetId;
    if (window.recaptchaWidgetId !== undefined) return window.recaptchaWidgetId;
    if (typeof window.grecaptcha.render !== 'function') return window.recaptchaWidgetId;

    window.recaptchaWidgetId = window.grecaptcha.render(target, {
      sitekey: siteKey,
      theme: 'light',
      size: 'normal'
    });
    return window.recaptchaWidgetId;
  }

  function renderWhenReady() {
    if (!window.grecaptcha) return Promise.resolve(window.recaptchaWidgetId);
    if (typeof window.grecaptcha.render === 'function') {
      return Promise.resolve(renderRecaptcha());
    }
    if (typeof window.grecaptcha.ready === 'function') {
      return new Promise(resolve => {
        window.grecaptcha.ready(() => resolve(renderRecaptcha()));
      });
    }
    return Promise.resolve(window.recaptchaWidgetId);
  }

  window.onRecaptchaLoad = function() {
    renderWhenReady();
  };

  window.loadRecaptcha = function() {
    if (window.grecaptcha) {
      return renderWhenReady();
    }
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-recaptcha-api]');
      if (existing) {
        existing.addEventListener('load', () => renderWhenReady().then(resolve), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.recaptchaApi = 'true';
      script.onload = () => renderWhenReady().then(resolve);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return loadPromise;
  };

  function primeRecaptcha() {
    const form = document.getElementById('contactForm');
    const contact = document.getElementById('contacto');
    if (!form) return;

    form.addEventListener('focusin', () => window.loadRecaptcha(), { once: true });
    form.addEventListener('pointerenter', () => window.loadRecaptcha(), { once: true });
    form.addEventListener('touchstart', () => window.loadRecaptcha(), { once: true, passive: true });

    if (!contact || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        window.loadRecaptcha();
        observer.disconnect();
      }
    }, { rootMargin: '600px 0px' });
    observer.observe(contact);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', primeRecaptcha, { once: true });
  } else {
    primeRecaptcha();
  }
})();
