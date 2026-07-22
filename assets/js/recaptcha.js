/* onRecaptchaLoad debe existir en window ANTES de que api.js termine de cargar */
  var recaptchaWidgetId;
  function onRecaptchaLoad() {
    recaptchaWidgetId = grecaptcha.render('recaptchaWidget', {
      sitekey: '6LdD_tksAAAAAP1NwHlAKZYlCAOhnghjcGYmfCfH',
      theme:   'light',
      size:    'normal'
    });
  }
