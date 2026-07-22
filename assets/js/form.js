// ---- EMAILJS INIT ----
emailjs.init('w2EzKh2wh_jMBFtp7');

// ---- FORM SUBMIT WITH reCAPTCHA ----
(function() {
  const form = document.getElementById('contactForm');
  const btn = document.getElementById('submitBtn');
  const lbl = document.getElementById('submitLabel');
  const status = document.getElementById('formStatus');
  if (!form || !btn || !lbl || !status) return;

  const fields = [
    { id:'fName', errorId:'fNameError', message:'Escribe tu nombre.' },
    { id:'fEmail', errorId:'fEmailError', message:'Escribe un correo valido.', validate:value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
    { id:'fTipo', errorId:'fTipoError', message:'Indica el tipo de proyecto.' },
    { id:'fDesc', errorId:'fDescError', message:'Describe el proyecto con al menos 20 caracteres.', validate:value => value.length >= 20 }
  ];

  function setStatus(message, type) {
    status.textContent = message || '';
    status.className = 'form-status' + (type ? ' ' + type : '');
  }

  function setFieldError(field, message) {
    const input = document.getElementById(field.id);
    const error = document.getElementById(field.errorId);
    if (!input || !error) return;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message || '';
  }

  function validateForm() {
    let valid = true;
    fields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;
      const value = input.value.trim();
      const ok = value && (!field.validate || field.validate(value));
      setFieldError(field, ok ? '' : field.message);
      if (!ok) valid = false;
    });
    return valid;
  }

  fields.forEach(field => {
    const input = document.getElementById(field.id);
    if (!input) return;
    input.addEventListener('input', () => setFieldError(field, ''));
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    setStatus('', '');

    if (!validateForm()) {
      lbl.textContent = 'REVISA LOS DATOS';
      setStatus('Hay campos pendientes antes de enviar el brief.', 'error');
      setTimeout(() => { lbl.textContent = 'ENVIAR BRIEF'; }, 2500);
      return;
    }

    if (!window.grecaptcha || recaptchaWidgetId === undefined) {
      setStatus('No se pudo cargar el captcha. Intenta recargar la pagina o escribenos por WhatsApp.', 'error');
      return;
    }

    const captchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
    if (!captchaResponse) {
      lbl.textContent = 'VERIFICA CAPTCHA';
      setStatus('Confirma el captcha para poder enviar el brief.', 'error');
      setTimeout(() => { lbl.textContent = 'ENVIAR BRIEF'; }, 2500);
      return;
    }

    btn.disabled = true;
    lbl.textContent = 'ENVIANDO...';
    btn.style.opacity = '0.65';
    setStatus('Enviando tu solicitud...', '');

    emailjs.sendForm('service_l1zeno9', 'template_52q16jo', '#contactForm')
      .then(() => {
        lbl.textContent = 'BRIEF ENVIADO';
        btn.style.opacity = '1';
        form.reset();
        fields.forEach(field => setFieldError(field, ''));
        grecaptcha.reset(recaptchaWidgetId);
        setStatus('Solicitud enviada. Te contactaremos por correo o WhatsApp para revisar el proyecto.', 'success');
        setTimeout(() => {
          lbl.textContent = 'ENVIAR BRIEF';
          btn.disabled = false;
        }, 3500);
      })
      .catch((error) => {
        console.error('EmailJS error:', error);
        lbl.textContent = 'NO SE ENVIO';
        btn.disabled = false;
        btn.style.opacity = '1';
        grecaptcha.reset(recaptchaWidgetId);
        setStatus('No se pudo enviar. Intenta de nuevo o escribenos directo por WhatsApp.', 'error');
        setTimeout(() => { lbl.textContent = 'ENVIAR BRIEF'; }, 5000);
      });
  });
})();
