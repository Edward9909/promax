(function() {
  window.dataLayer = window.dataLayer || [];

  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function projectSlugFromUrl(url) {
    try {
      var parsed = new URL(url, window.location.origin);
      var parts = parsed.pathname.split('/').filter(Boolean);
      return parts[0] === 'portafolio' ? (parts[1] || 'portafolio') : '';
    } catch (error) {
      return '';
    }
  }

  window.promaxTrack = function(eventName, params) {
    var payload = Object.assign({
      page_path: window.location.pathname,
      page_title: document.title
    }, params || {});

    window.dataLayer.push(Object.assign({ event: eventName }, payload));

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  };

  document.addEventListener('click', function(event) {
    var link = event.target.closest('a');
    var projectCard = event.target.closest('.project-card');

    if (link) {
      var href = link.getAttribute('href') || '';
      var text = cleanText(link.textContent || link.getAttribute('aria-label'));

      if (href.indexOf('wa.me') !== -1) {
        window.promaxTrack('click_whatsapp', {
          link_text: text || 'WhatsApp',
          link_url: href
        });
        return;
      }

      if (href === '#contacto' || href === '/#contacto') {
        window.promaxTrack('click_cotizar_proyecto', {
          link_text: text || 'Cotizar proyecto',
          link_url: href
        });
      }

      if (href.indexOf('/portafolio/') === 0 && href !== '/portafolio/') {
        window.promaxTrack('click_pagina_proyecto', {
          project_slug: projectSlugFromUrl(href),
          link_text: text,
          link_url: href
        });
      }
    }

    if (projectCard && !event.target.closest('a')) {
      var projectTitle = projectCard.querySelector('.project-name');
      window.promaxTrack('apertura_galeria_proyecto', {
        project_name: cleanText(projectTitle ? projectTitle.textContent : '')
      });
    }
  }, { passive: true });

  document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.indexOf('/portafolio/') === 0 && window.location.pathname !== '/portafolio/') {
      window.promaxTrack('vista_pagina_proyecto', {
        project_slug: projectSlugFromUrl(window.location.href)
      });
    }
  });
})();
