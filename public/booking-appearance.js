(function () {
  const PREVIEW_MESSAGE_TYPE = 'scrolltool-preview-appearance';
  const DEFAULT_APPEARANCE = {
    fontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    titleFontWeight: 800,
    bodyFontWeight: 400,
    pageBackground: '#000000',
    pageBackgroundImage: "",
    cardBackground: '#15181a',
    desktopContentWidth: 1180,
    textColor: '#f4f6f2',
    mutedTextColor: '#9ba3a6',
    heroBackground: '#0d0f10',
    heroTitleColor: '#f4f6f2',
    heroLeadColor: '#c7ccca',
    heroTitleSize: 42,
    bodyTextSize: 14,
    heroTitleFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    heroTitleFontWeight: 800,
    heroLeadFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    heroLeadFontWeight: 400,
    heroLeadFontSize: 13,
    pickerTitleFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    pickerTitleFontWeight: 800,
    pickerTitleFontSize: 20,
    calendarMonthFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    calendarMonthFontWeight: 800,
    calendarMonthFontSize: 16,
    calendarWeekdayFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    calendarWeekdayFontWeight: 400,
    calendarWeekdayFontSize: 13,
    calendarDateFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    calendarDateFontWeight: 400,
    calendarDateFontSize: 17,
    panelRadius: 18,
    dateTextColor: '#f4f6f2',
    weekdayTextColor: '#9ba3a6',
    dateMutedColor: '#9ba3a6',
    dateHoverBackground: '#1c2023',
    dateActiveBackground: '#c9ff14',
    dateActiveTextColor: '#0b0d0e',
    dateButtonHeight: 54,
    timeBackground: '#111415',
    timeTextColor: '#f4f6f2',
    timeBorderColor: '#2a3033',
    timeActiveBackground: '#c9ff14',
    timeActiveTextColor: '#0b0d0e',
    timeActiveBorderColor: '#c9ff14',
    timeButtonHeight: 56,
    timeSlotFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    timeSlotFontWeight: 400,
    timeSlotFontSize: 16,
    timeMetaFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    timeMetaFontWeight: 400,
    timeMetaFontSize: 14,
    formGradientStart: '#0d0f10',
    formGradientMid: '#15181a',
    formGradientEnd: '#0c0e0f',
    formTitleColor: '#f4f6f2',
    formLabelColor: '#f4f6f2',
    formMutedColor: '#9ba3a6',
    formInputBackground: '#0c0e0f',
    formInputTextColor: '#f4f6f2',
    formPlaceholderColor: '#7e878a',
    formInputBorderColor: '#343b3f',
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
    primaryButtonBackground: '#c9ff14',
    primaryButtonTextColor: '#0b0d0e',
    primaryButtonBorderColor: '#c9ff14',
    primaryButtonHeight: 38,
    primaryButtonFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    primaryButtonFontWeight: 600,
    primaryButtonFontSize: 13,
    iconButtonBackground: '#252a2d',
    iconButtonTextColor: '#c9ff14',
    successModalIcon: "/calendar-love-02.svg",
    successModalTitle: "Встреча назначена!",
    successModalMessage: "Проверьте свой календарь или\u00a0уведомления в\u00a0вашем почтовом ящике.",
    successModalButtonText: "Понятно",
    successModalBackground: '#15181a',
    successModalBackdrop: '#000000',
    successModalTitleColor: '#f4f6f2',
    successModalTextColor: '#c7ccca',
    successModalIconBackground: '#c9ff14',
    successModalIconColor: '#0b0d0e',
    successModalButtonBackground: '#c9ff14',
    successModalButtonTextColor: '#0b0d0e',
    successModalButtonBorderColor: '#c9ff14',
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
      successIconNode.textContent = hasCustomIcon ? "" : "◷";
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
