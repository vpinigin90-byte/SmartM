(function () {
  const PREVIEW_MESSAGE_TYPE = 'scrolltool-preview-appearance';
  const DEFAULT_APPEARANCE = {
    fontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    titleFontWeight: 700,
    bodyFontWeight: 400,
    pageBackground: '#f7f7f5',
    cardBackground: '#ffffff',
    textColor: '#18181b',
    mutedTextColor: '#71717a',
    heroBackground: '#ffffff',
    heroTitleColor: '#18181b',
    heroLeadColor: '#71717a',
    heroTitleSize: 38,
    bodyTextSize: 13,
    panelRadius: 14,
    dateTextColor: '#18181b',
    weekdayTextColor: '#9ca3af',
    dateMutedColor: '#71717a',
    dateHoverBackground: '#f4f4f2',
    dateActiveBackground: '#efe9ff',
    dateActiveTextColor: '#5b3fd8',
    dateButtonHeight: 54,
    timeBackground: '#ffffff',
    timeTextColor: '#18181b',
    timeBorderColor: '#e4e4e7',
    timeActiveBackground: '#ecf7f0',
    timeActiveTextColor: '#14532d',
    timeActiveBorderColor: '#14532d',
    timeButtonHeight: 56,
    formGradientStart: '#0b314d',
    formGradientMid: '#123f5f',
    formGradientEnd: '#0a2840',
    formTitleColor: '#f7fbff',
    formLabelColor: '#f2f8ff',
    formMutedColor: '#dfeaf7',
    formInputBackground: '#2d5c86',
    formInputTextColor: '#f7fbff',
    formPlaceholderColor: '#bfd0e1',
    formInputBorderColor: '#a0c0db',
    formInputHeight: 34,
    primaryButtonBackground: '#ffffff',
    primaryButtonTextColor: '#0c1c2c',
    primaryButtonBorderColor: '#081d30',
    primaryButtonHeight: 38,
    iconButtonBackground: '#6591b3',
    iconButtonTextColor: '#f2f8ff',
  };

  const CSS_VARIABLES = {
    fontFamily: '--booking-font-family',
    titleFontWeight: '--booking-title-font-weight',
    bodyFontWeight: '--booking-body-font-weight',
    pageBackground: '--booking-page-background',
    cardBackground: '--booking-card-background',
    textColor: '--booking-text-color',
    mutedTextColor: '--booking-muted-text-color',
    heroBackground: '--booking-hero-background',
    heroTitleColor: '--booking-hero-title-color',
    heroLeadColor: '--booking-hero-lead-color',
    heroTitleSize: '--booking-title-size',
    bodyTextSize: '--booking-body-size',
    panelRadius: '--booking-panel-radius',
    dateTextColor: '--booking-date-text-color',
    weekdayTextColor: '--booking-weekday-text-color',
    dateMutedColor: '--booking-date-muted-color',
    dateHoverBackground: '--booking-date-hover-background',
    dateActiveBackground: '--booking-date-active-background',
    dateActiveTextColor: '--booking-date-active-text-color',
    dateButtonHeight: '--booking-date-button-height',
    timeBackground: '--booking-time-background',
    timeTextColor: '--booking-time-text-color',
    timeBorderColor: '--booking-time-border-color',
    timeActiveBackground: '--booking-time-active-background',
    timeActiveTextColor: '--booking-time-active-text-color',
    timeActiveBorderColor: '--booking-time-active-border-color',
    timeButtonHeight: '--booking-time-button-height',
    formGradientStart: '--booking-form-gradient-start',
    formGradientMid: '--booking-form-gradient-mid',
    formGradientEnd: '--booking-form-gradient-end',
    formTitleColor: '--booking-form-title-color',
    formLabelColor: '--booking-form-label-color',
    formMutedColor: '--booking-form-muted-color',
    formInputBackground: '--booking-form-input-background',
    formInputTextColor: '--booking-form-input-text-color',
    formPlaceholderColor: '--booking-form-placeholder-color',
    formInputBorderColor: '--booking-form-input-border-color',
    formInputHeight: '--booking-form-input-height',
    primaryButtonBackground: '--booking-primary-button-background',
    primaryButtonTextColor: '--booking-primary-button-text-color',
    primaryButtonBorderColor: '--booking-primary-button-border-color',
    primaryButtonHeight: '--booking-primary-button-height',
    iconButtonBackground: '--booking-icon-button-background',
    iconButtonTextColor: '--booking-icon-button-text-color',
  };

  function normalizeAppearance(settings = {}) {
    return { ...DEFAULT_APPEARANCE, ...(settings || {}) };
  }

  function applyAppearance(settings) {
    const root = document.documentElement;
    const normalized = normalizeAppearance(settings);
    Object.entries(CSS_VARIABLES).forEach(([key, variable]) => {
      root.style.setProperty(variable, String(normalized[key]));
    });
  }

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) {
      return;
    }
    if (!event.data || event.data.type !== PREVIEW_MESSAGE_TYPE) {
      return;
    }
    applyAppearance(event.data.appearance || DEFAULT_APPEARANCE);
  });

  fetch('/api/public/appearance')
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => applyAppearance(payload?.appearance || DEFAULT_APPEARANCE))
    .catch(() => applyAppearance(DEFAULT_APPEARANCE));
})();
