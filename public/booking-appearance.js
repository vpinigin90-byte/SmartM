(function () {
  const PREVIEW_MESSAGE_TYPE = 'scrolltool-preview-appearance';
  const DEFAULT_APPEARANCE = {
    fontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    titleFontWeight: 700,
    bodyFontWeight: 400,
    pageBackground: '#f7f7f5',
    pageBackgroundImage: "",
    cardBackground: '#ffffff',
    desktopContentWidth: 1120,
    textColor: '#18181b',
    mutedTextColor: '#71717a',
    heroBackground: '#ffffff',
    heroTitleColor: '#18181b',
    heroLeadColor: '#71717a',
    heroTitleSize: 38,
    bodyTextSize: 13,
    heroTitleFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    heroTitleFontWeight: 700,
    heroLeadFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    heroLeadFontWeight: 400,
    heroLeadFontSize: 13,
    pickerTitleFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    pickerTitleFontWeight: 700,
    pickerTitleFontSize: 20,
    calendarMonthFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    calendarMonthFontWeight: 700,
    calendarMonthFontSize: 16,
    calendarWeekdayFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    calendarWeekdayFontWeight: 400,
    calendarWeekdayFontSize: 13,
    calendarDateFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    calendarDateFontWeight: 400,
    calendarDateFontSize: 17,
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
    timeSlotFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    timeSlotFontWeight: 400,
    timeSlotFontSize: 16,
    timeMetaFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    timeMetaFontWeight: 400,
    timeMetaFontSize: 14,
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
    formTitleFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    formTitleFontWeight: 700,
    formTitleFontSize: 20,
    formMetaFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    formMetaFontWeight: 400,
    formMetaFontSize: 10,
    formLabelFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    formLabelFontWeight: 400,
    formLabelFontSize: 10,
    formInputFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    formInputFontWeight: 400,
    formInputFontSize: 11,
    formConsentFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    formConsentFontWeight: 400,
    formConsentFontSize: 9,
    primaryButtonBackground: '#ffffff',
    primaryButtonTextColor: '#0c1c2c',
    primaryButtonBorderColor: '#081d30',
    primaryButtonHeight: 38,
    primaryButtonFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    primaryButtonFontWeight: 600,
    primaryButtonFontSize: 13,
    iconButtonBackground: '#6591b3',
    iconButtonTextColor: '#f2f8ff',
    successModalIcon: "",
    successModalTitle: "Встреча забронирована",
    successModalMessage: "Встреча создана в календаре, участник добавлен по указанному e-mail.",
    successModalButtonText: "Понятно",
    successModalBackground: '#ffffff',
    successModalBackdrop: '#07121e',
    successModalTitleColor: '#0f172a',
    successModalTextColor: '#5b6472',
    successModalIconBackground: '#dff6e7',
    successModalIconColor: '#166534',
    successModalButtonBackground: '#ffffff',
    successModalButtonTextColor: '#0c1c2c',
    successModalButtonBorderColor: '#081d30',
    successModalTitleFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    successModalTitleFontWeight: 700,
    successModalTitleFontSize: 24,
    successModalTextFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    successModalTextFontWeight: 400,
    successModalTextFontSize: 15,
    successModalButtonFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    successModalButtonFontWeight: 600,
    successModalButtonFontSize: 13,
  };

  const CSS_VARIABLES = {
    fontFamily: '--booking-font-family',
    titleFontWeight: '--booking-title-font-weight',
    bodyFontWeight: '--booking-body-font-weight',
    pageBackground: '--booking-page-background',
    cardBackground: '--booking-card-background',
    desktopContentWidth: '--booking-desktop-content-width',
    textColor: '--booking-text-color',
    mutedTextColor: '--booking-muted-text-color',
    heroBackground: '--booking-hero-background',
    heroTitleColor: '--booking-hero-title-color',
    heroLeadColor: '--booking-hero-lead-color',
    heroTitleSize: '--booking-title-size',
    bodyTextSize: '--booking-body-size',
    heroTitleFontFamily: '--booking-hero-title-font-family',
    heroTitleFontWeight: '--booking-hero-title-font-weight',
    heroLeadFontFamily: '--booking-hero-lead-font-family',
    heroLeadFontWeight: '--booking-hero-lead-font-weight',
    heroLeadFontSize: '--booking-hero-lead-font-size',
    pickerTitleFontFamily: '--booking-picker-title-font-family',
    pickerTitleFontWeight: '--booking-picker-title-font-weight',
    pickerTitleFontSize: '--booking-picker-title-font-size',
    calendarMonthFontFamily: '--booking-calendar-month-font-family',
    calendarMonthFontWeight: '--booking-calendar-month-font-weight',
    calendarMonthFontSize: '--booking-calendar-month-font-size',
    calendarWeekdayFontFamily: '--booking-calendar-weekday-font-family',
    calendarWeekdayFontWeight: '--booking-calendar-weekday-font-weight',
    calendarWeekdayFontSize: '--booking-calendar-weekday-font-size',
    calendarDateFontFamily: '--booking-calendar-date-font-family',
    calendarDateFontWeight: '--booking-calendar-date-font-weight',
    calendarDateFontSize: '--booking-calendar-date-font-size',
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
    timeSlotFontFamily: '--booking-time-slot-font-family',
    timeSlotFontWeight: '--booking-time-slot-font-weight',
    timeSlotFontSize: '--booking-time-slot-font-size',
    timeMetaFontFamily: '--booking-time-meta-font-family',
    timeMetaFontWeight: '--booking-time-meta-font-weight',
    timeMetaFontSize: '--booking-time-meta-font-size',
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
    formTitleFontFamily: '--booking-form-title-font-family',
    formTitleFontWeight: '--booking-form-title-font-weight',
    formTitleFontSize: '--booking-form-title-font-size',
    formMetaFontFamily: '--booking-form-meta-font-family',
    formMetaFontWeight: '--booking-form-meta-font-weight',
    formMetaFontSize: '--booking-form-meta-font-size',
    formLabelFontFamily: '--booking-form-label-font-family',
    formLabelFontWeight: '--booking-form-label-font-weight',
    formLabelFontSize: '--booking-form-label-font-size',
    formInputFontFamily: '--booking-form-input-font-family',
    formInputFontWeight: '--booking-form-input-font-weight',
    formInputFontSize: '--booking-form-input-font-size',
    formConsentFontFamily: '--booking-form-consent-font-family',
    formConsentFontWeight: '--booking-form-consent-font-weight',
    formConsentFontSize: '--booking-form-consent-font-size',
    primaryButtonBackground: '--booking-primary-button-background',
    primaryButtonTextColor: '--booking-primary-button-text-color',
    primaryButtonBorderColor: '--booking-primary-button-border-color',
    primaryButtonHeight: '--booking-primary-button-height',
    primaryButtonFontFamily: '--booking-primary-button-font-family',
    primaryButtonFontWeight: '--booking-primary-button-font-weight',
    primaryButtonFontSize: '--booking-primary-button-font-size',
    iconButtonBackground: '--booking-icon-button-background',
    iconButtonTextColor: '--booking-icon-button-text-color',
    successModalBackground: '--booking-success-modal-background',
    successModalBackdrop: '--booking-success-modal-backdrop',
    successModalTitleColor: '--booking-success-modal-title-color',
    successModalTextColor: '--booking-success-modal-text-color',
    successModalIconBackground: '--booking-success-modal-icon-background',
    successModalIconColor: '--booking-success-modal-icon-color',
    successModalButtonBackground: '--booking-success-modal-button-background',
    successModalButtonTextColor: '--booking-success-modal-button-text-color',
    successModalButtonBorderColor: '--booking-success-modal-button-border-color',
    successModalTitleFontFamily: '--booking-success-modal-title-font-family',
    successModalTitleFontWeight: '--booking-success-modal-title-font-weight',
    successModalTitleFontSize: '--booking-success-modal-title-font-size',
    successModalTextFontFamily: '--booking-success-modal-text-font-family',
    successModalTextFontWeight: '--booking-success-modal-text-font-weight',
    successModalTextFontSize: '--booking-success-modal-text-font-size',
    successModalButtonFontFamily: '--booking-success-modal-button-font-family',
    successModalButtonFontWeight: '--booking-success-modal-button-font-weight',
    successModalButtonFontSize: '--booking-success-modal-button-font-size',
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
    root.style.setProperty(
      '--booking-page-background-image',
      normalized.pageBackgroundImage ? `url("${String(normalized.pageBackgroundImage).replaceAll('"', '\\"')}")` : 'none',
    );

    const successTitleNode = document.querySelector("#booking-success-title");
    const successMessageNode = document.querySelector("#booking-success-message");
    const successConfirmNode = document.querySelector("#booking-success-confirm");
    const successIconNode = document.querySelector(".booking-modal-icon");

    if (successTitleNode) {
      successTitleNode.textContent = normalized.successModalTitle;
    }
    if (successMessageNode) {
      successMessageNode.textContent = normalized.successModalMessage;
      successMessageNode.dataset.defaultMessage = normalized.successModalMessage;
    }
    if (successConfirmNode) {
      successConfirmNode.textContent = normalized.successModalButtonText;
    }
    if (successIconNode) {
      const hasCustomIcon = Boolean(normalized.successModalIcon);
      successIconNode.classList.toggle('has-image', hasCustomIcon);
      successIconNode.style.backgroundImage = hasCustomIcon
        ? `url("${String(normalized.successModalIcon).replaceAll('"', '\\"')}")`
        : "none";
      successIconNode.textContent = hasCustomIcon ? "" : "✓";
    }
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
