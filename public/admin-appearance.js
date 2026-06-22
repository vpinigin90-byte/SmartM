(function () {
  const appearanceForm = document.querySelector("#appearance-form");
  const appearanceTabButton = document.querySelector('[data-tab="appearance"]');
  const adminView = document.querySelector("#admin-view");
  const appearancePreviewNode = document.querySelector("#appearance-preview");
  const resetAppearanceButton = document.querySelector("#reset-appearance-button");
  const PREVIEW_MESSAGE_TYPE = "scrolltool-preview-appearance";
  if (!appearanceForm || !appearanceTabButton || !adminView) {
    return;
  }

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
    formLabelColor: '#f7fbff',
    formMutedColor: '#dfeaf7',
    formInputBackground: '#2d5c86',
    formInputTextColor: '#f7fbff',
    formPlaceholderColor: '#bfd0e1',
    formInputBorderColor: '#7da0bd',
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
    primaryButtonBorderColor: '#2a3b4d',
    primaryButtonHeight: 38,
    primaryButtonFontFamily: 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif',
    primaryButtonFontWeight: 600,
    primaryButtonFontSize: 13,
    iconButtonBackground: '#40678b',
    iconButtonTextColor: '#f7fbff',
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

  const FIELD_IDS = {
    fontFamily: 'appearance-font-family',
    titleFontWeight: 'appearance-title-font-weight',
    bodyFontWeight: 'appearance-body-font-weight',
    pageBackground: 'appearance-page-background',
    pageBackgroundImage: 'appearance-page-background-image',
    cardBackground: 'appearance-card-background',
    desktopContentWidth: 'appearance-desktop-content-width',
    textColor: 'appearance-text-color',
    mutedTextColor: 'appearance-muted-text-color',
    heroBackground: 'appearance-hero-background',
    heroTitleColor: 'appearance-hero-title-color',
    heroLeadColor: 'appearance-hero-lead-color',
    heroTitleSize: 'appearance-hero-title-size',
    bodyTextSize: 'appearance-body-text-size',
    heroTitleFontFamily: 'appearance-hero-title-font-family',
    heroTitleFontWeight: 'appearance-hero-title-font-weight',
    heroLeadFontFamily: 'appearance-hero-lead-font-family',
    heroLeadFontWeight: 'appearance-hero-lead-font-weight',
    heroLeadFontSize: 'appearance-hero-lead-font-size',
    pickerTitleFontFamily: 'appearance-picker-title-font-family',
    pickerTitleFontWeight: 'appearance-picker-title-font-weight',
    pickerTitleFontSize: 'appearance-picker-title-font-size',
    calendarMonthFontFamily: 'appearance-calendar-month-font-family',
    calendarMonthFontWeight: 'appearance-calendar-month-font-weight',
    calendarMonthFontSize: 'appearance-calendar-month-font-size',
    calendarWeekdayFontFamily: 'appearance-calendar-weekday-font-family',
    calendarWeekdayFontWeight: 'appearance-calendar-weekday-font-weight',
    calendarWeekdayFontSize: 'appearance-calendar-weekday-font-size',
    calendarDateFontFamily: 'appearance-calendar-date-font-family',
    calendarDateFontWeight: 'appearance-calendar-date-font-weight',
    calendarDateFontSize: 'appearance-calendar-date-font-size',
    panelRadius: 'appearance-panel-radius',
    dateTextColor: 'appearance-date-text-color',
    weekdayTextColor: 'appearance-weekday-text-color',
    dateMutedColor: 'appearance-date-muted-color',
    dateHoverBackground: 'appearance-date-hover-background',
    dateActiveBackground: 'appearance-date-active-background',
    dateActiveTextColor: 'appearance-date-active-text-color',
    dateButtonHeight: 'appearance-date-button-height',
    timeBackground: 'appearance-time-background',
    timeTextColor: 'appearance-time-text-color',
    timeBorderColor: 'appearance-time-border-color',
    timeActiveBackground: 'appearance-time-active-background',
    timeActiveTextColor: 'appearance-time-active-text-color',
    timeActiveBorderColor: 'appearance-time-active-border-color',
    timeButtonHeight: 'appearance-time-button-height',
    timeSlotFontFamily: 'appearance-time-slot-font-family',
    timeSlotFontWeight: 'appearance-time-slot-font-weight',
    timeSlotFontSize: 'appearance-time-slot-font-size',
    timeMetaFontFamily: 'appearance-time-meta-font-family',
    timeMetaFontWeight: 'appearance-time-meta-font-weight',
    timeMetaFontSize: 'appearance-time-meta-font-size',
    formGradientStart: 'appearance-form-gradient-start',
    formGradientMid: 'appearance-form-gradient-mid',
    formGradientEnd: 'appearance-form-gradient-end',
    formTitleColor: 'appearance-form-title-color',
    formLabelColor: 'appearance-form-label-color',
    formMutedColor: 'appearance-form-muted-color',
    formInputBackground: 'appearance-form-input-background',
    formInputTextColor: 'appearance-form-input-text-color',
    formPlaceholderColor: 'appearance-form-placeholder-color',
    formInputBorderColor: 'appearance-form-input-border-color',
    formInputHeight: 'appearance-form-input-height',
    formTitleFontFamily: 'appearance-form-title-font-family',
    formTitleFontWeight: 'appearance-form-title-font-weight',
    formTitleFontSize: 'appearance-form-title-font-size',
    formMetaFontFamily: 'appearance-form-meta-font-family',
    formMetaFontWeight: 'appearance-form-meta-font-weight',
    formMetaFontSize: 'appearance-form-meta-font-size',
    formLabelFontFamily: 'appearance-form-label-font-family',
    formLabelFontWeight: 'appearance-form-label-font-weight',
    formLabelFontSize: 'appearance-form-label-font-size',
    formInputFontFamily: 'appearance-form-input-font-family',
    formInputFontWeight: 'appearance-form-input-font-weight',
    formInputFontSize: 'appearance-form-input-font-size',
    formConsentFontFamily: 'appearance-form-consent-font-family',
    formConsentFontWeight: 'appearance-form-consent-font-weight',
    formConsentFontSize: 'appearance-form-consent-font-size',
    primaryButtonBackground: 'appearance-primary-button-background',
    primaryButtonTextColor: 'appearance-primary-button-text-color',
    primaryButtonBorderColor: 'appearance-primary-button-border-color',
    primaryButtonHeight: 'appearance-primary-button-height',
    primaryButtonFontFamily: 'appearance-primary-button-font-family',
    primaryButtonFontWeight: 'appearance-primary-button-font-weight',
    primaryButtonFontSize: 'appearance-primary-button-font-size',
    iconButtonBackground: 'appearance-icon-button-background',
    iconButtonTextColor: 'appearance-icon-button-text-color',
    successModalIcon: 'appearance-success-modal-icon',
    successModalTitle: 'appearance-success-modal-title',
    successModalMessage: 'appearance-success-modal-message',
    successModalButtonText: 'appearance-success-modal-button-text',
    successModalBackground: 'appearance-success-modal-background',
    successModalBackdrop: 'appearance-success-modal-backdrop',
    successModalTitleColor: 'appearance-success-modal-title-color',
    successModalTextColor: 'appearance-success-modal-text-color',
    successModalIconBackground: 'appearance-success-modal-icon-background',
    successModalIconColor: 'appearance-success-modal-icon-color',
    successModalButtonBackground: 'appearance-success-modal-button-background',
    successModalButtonTextColor: 'appearance-success-modal-button-text-color',
    successModalButtonBorderColor: 'appearance-success-modal-button-border-color',
    successModalTitleFontFamily: 'appearance-success-modal-title-font-family',
    successModalTitleFontWeight: 'appearance-success-modal-title-font-weight',
    successModalTitleFontSize: 'appearance-success-modal-title-font-size',
    successModalTextFontFamily: 'appearance-success-modal-text-font-family',
    successModalTextFontWeight: 'appearance-success-modal-text-font-weight',
    successModalTextFontSize: 'appearance-success-modal-text-font-size',
    successModalButtonFontFamily: 'appearance-success-modal-button-font-family',
    successModalButtonFontWeight: 'appearance-success-modal-button-font-weight',
    successModalButtonFontSize: 'appearance-success-modal-button-font-size',
  };

  const NUMBER_FIELDS = new Set([
    'heroTitleSize',
    'bodyTextSize',
    'titleFontWeight',
    'bodyFontWeight',
    'desktopContentWidth',
    'heroTitleFontWeight',
    'heroLeadFontWeight',
    'heroLeadFontSize',
    'pickerTitleFontWeight',
    'pickerTitleFontSize',
    'calendarMonthFontWeight',
    'calendarMonthFontSize',
    'calendarWeekdayFontWeight',
    'calendarWeekdayFontSize',
    'calendarDateFontWeight',
    'calendarDateFontSize',
    'panelRadius',
    'dateButtonHeight',
    'timeSlotFontWeight',
    'timeSlotFontSize',
    'timeMetaFontWeight',
    'timeMetaFontSize',
    'timeButtonHeight',
    'formTitleFontWeight',
    'formTitleFontSize',
    'formMetaFontWeight',
    'formMetaFontSize',
    'formLabelFontWeight',
    'formLabelFontSize',
    'formInputFontWeight',
    'formInputFontSize',
    'formConsentFontWeight',
    'formConsentFontSize',
    'formInputHeight',
    'primaryButtonFontWeight',
    'primaryButtonFontSize',
    'primaryButtonHeight',
    'successModalTitleFontWeight',
    'successModalTitleFontSize',
    'successModalTextFontWeight',
    'successModalTextFontSize',
    'successModalButtonFontWeight',
    'successModalButtonFontSize',
  ]);

  const FONT_FAMILY_OPTIONS = [
    ['Inter', 'Inter, "Avenir Next", "Segoe UI", Arial, sans-serif'],
    ['Mulish', '"Mulish", "Segoe UI", Arial, sans-serif'],
    ['Arial', 'Arial, "Helvetica Neue", Helvetica, sans-serif'],
    ['Verdana', 'Verdana, Geneva, sans-serif'],
    ['Tahoma', 'Tahoma, "Segoe UI", sans-serif'],
    ['Trebuchet MS', '"Trebuchet MS", Arial, sans-serif'],
    ['Georgia', 'Georgia, "Times New Roman", serif'],
  ];

  const FONT_WEIGHT_OPTIONS = [
    ['Light', 300],
    ['Regular', 400],
    ['Medium', 500],
    ['Semibold', 600],
    ['Bold', 700],
    ['ExtraBold', 800],
    ['Black', 900],
  ];

  const TYPOGRAPHY_GROUPS = [
    {
      groupIndex: 1,
      title: 'Типографика первого экрана',
      hint: 'Управление заголовком и описанием над календарём.',
      fields: [
        { key: 'heroTitleFontFamily', label: 'Шрифт заголовка', type: 'family' },
        { key: 'heroTitleFontWeight', label: 'Начертание заголовка', type: 'weight' },
        { key: 'heroTitleSize', label: 'Размер заголовка, px', type: 'size', min: 24, max: 72, step: 1 },
        { key: 'heroLeadFontFamily', label: 'Шрифт описания', type: 'family' },
        { key: 'heroLeadFontWeight', label: 'Начертание описания', type: 'weight' },
        { key: 'heroLeadFontSize', label: 'Размер описания, px', type: 'size', min: 10, max: 28, step: 1 },
      ],
    },
    {
      groupIndex: 2,
      title: 'Типографика календаря',
      hint: 'Тексты заголовка шага, месяца, дней недели и чисел в календаре.',
      fields: [
        { key: 'pickerTitleFontFamily', label: 'Шрифт заголовка шага', type: 'family' },
        { key: 'pickerTitleFontWeight', label: 'Начертание заголовка шага', type: 'weight' },
        { key: 'pickerTitleFontSize', label: 'Размер заголовка шага, px', type: 'size', min: 12, max: 36, step: 1 },
        { key: 'calendarMonthFontFamily', label: 'Шрифт месяца', type: 'family' },
        { key: 'calendarMonthFontWeight', label: 'Начертание месяца', type: 'weight' },
        { key: 'calendarMonthFontSize', label: 'Размер месяца, px', type: 'size', min: 10, max: 28, step: 1 },
        { key: 'calendarWeekdayFontFamily', label: 'Шрифт дней недели', type: 'family' },
        { key: 'calendarWeekdayFontWeight', label: 'Начертание дней недели', type: 'weight' },
        { key: 'calendarWeekdayFontSize', label: 'Размер дней недели, px', type: 'size', min: 9, max: 24, step: 1 },
        { key: 'calendarDateFontFamily', label: 'Шрифт чисел', type: 'family' },
        { key: 'calendarDateFontWeight', label: 'Начертание чисел', type: 'weight' },
        { key: 'calendarDateFontSize', label: 'Размер чисел, px', type: 'size', min: 10, max: 30, step: 1 },
      ],
    },
    {
      groupIndex: 3,
      title: 'Типографика слотов',
      hint: 'Подписи выбранной даты и время внутри кнопок слотов.',
      fields: [
        { key: 'timeMetaFontFamily', label: 'Шрифт служебного текста', type: 'family' },
        { key: 'timeMetaFontWeight', label: 'Начертание служебного текста', type: 'weight' },
        { key: 'timeMetaFontSize', label: 'Размер служебного текста, px', type: 'size', min: 9, max: 24, step: 1 },
        { key: 'timeSlotFontFamily', label: 'Шрифт слотов времени', type: 'family' },
        { key: 'timeSlotFontWeight', label: 'Начертание слотов времени', type: 'weight' },
        { key: 'timeSlotFontSize', label: 'Размер слотов времени, px', type: 'size', min: 10, max: 28, step: 1 },
      ],
    },
    {
      groupIndex: 4,
      title: 'Типографика формы',
      hint: 'Заголовок формы, подписи, поля ввода, служебный текст и согласие под кнопкой.',
      fields: [
        { key: 'formTitleFontFamily', label: 'Шрифт заголовка формы', type: 'family' },
        { key: 'formTitleFontWeight', label: 'Начертание заголовка формы', type: 'weight' },
        { key: 'formTitleFontSize', label: 'Размер заголовка формы, px', type: 'size', min: 12, max: 36, step: 1 },
        { key: 'formMetaFontFamily', label: 'Шрифт служебного текста', type: 'family' },
        { key: 'formMetaFontWeight', label: 'Начертание служебного текста', type: 'weight' },
        { key: 'formMetaFontSize', label: 'Размер служебного текста, px', type: 'size', min: 8, max: 20, step: 1 },
        { key: 'formLabelFontFamily', label: 'Шрифт подписей полей', type: 'family' },
        { key: 'formLabelFontWeight', label: 'Начертание подписей полей', type: 'weight' },
        { key: 'formLabelFontSize', label: 'Размер подписей полей, px', type: 'size', min: 8, max: 22, step: 1 },
        { key: 'formInputFontFamily', label: 'Шрифт текста в полях', type: 'family' },
        { key: 'formInputFontWeight', label: 'Начертание текста в полях', type: 'weight' },
        { key: 'formInputFontSize', label: 'Размер текста в полях, px', type: 'size', min: 9, max: 24, step: 1 },
        { key: 'formConsentFontFamily', label: 'Шрифт текста согласия', type: 'family' },
        { key: 'formConsentFontWeight', label: 'Начертание текста согласия', type: 'weight' },
        { key: 'formConsentFontSize', label: 'Размер текста согласия, px', type: 'size', min: 8, max: 18, step: 1 },
      ],
    },
    {
      groupIndex: 5,
      title: 'Типографика кнопок',
      hint: 'Текст основной кнопки бронирования.',
      fields: [
        { key: 'primaryButtonFontFamily', label: 'Шрифт кнопки', type: 'family' },
        { key: 'primaryButtonFontWeight', label: 'Начертание кнопки', type: 'weight' },
        { key: 'primaryButtonFontSize', label: 'Размер текста кнопки, px', type: 'size', min: 10, max: 24, step: 1 },
      ],
    },
    {
      groupIndex: 6,
      title: 'Типографика сообщения об успехе',
      hint: 'Заголовок, текст и кнопка pop-up окна после успешного бронирования.',
      fields: [
        { key: 'successModalTitleFontFamily', label: 'Шрифт заголовка окна', type: 'family' },
        { key: 'successModalTitleFontWeight', label: 'Начертание заголовка окна', type: 'weight' },
        { key: 'successModalTitleFontSize', label: 'Размер заголовка, px', type: 'size', min: 14, max: 36, step: 1 },
        { key: 'successModalTextFontFamily', label: 'Шрифт текста окна', type: 'family' },
        { key: 'successModalTextFontWeight', label: 'Начертание текста окна', type: 'weight' },
        { key: 'successModalTextFontSize', label: 'Размер текста, px', type: 'size', min: 10, max: 24, step: 1 },
        { key: 'successModalButtonFontFamily', label: 'Шрифт кнопки окна', type: 'family' },
        { key: 'successModalButtonFontWeight', label: 'Начертание кнопки окна', type: 'weight' },
        { key: 'successModalButtonFontSize', label: 'Размер кнопки, px', type: 'size', min: 10, max: 24, step: 1 },
      ],
    },
  ];

  const UPLOAD_FIELDS = [
    {
      key: 'pageBackgroundImage',
      fileId: 'appearance-page-background-image-file',
      clearId: 'appearance-page-background-image-clear',
      metaId: 'appearance-page-background-image-meta',
      emptyText: 'Изображение не выбрано.',
      filledText: 'Фоновое изображение загружено.',
    },
    {
      key: 'successModalIcon',
      fileId: 'appearance-success-modal-icon-file',
      clearId: 'appearance-success-modal-icon-clear',
      metaId: 'appearance-success-modal-icon-meta',
      emptyText: 'Иконка не выбрана.',
      filledText: 'Иконка загружена.',
    },
  ];

  function renderFieldMarkup(field) {
    const id = FIELD_IDS[field.key];
    if (field.type === 'family') {
      return `
        <label class="field compact-field">
          <span>${field.label}</span>
          <select id="${id}">
            ${FONT_FAMILY_OPTIONS.map(([label, value]) => `<option value='${value}'>${label}</option>`).join('')}
          </select>
        </label>
      `;
    }
    if (field.type === 'weight') {
      return `
        <label class="field compact-field">
          <span>${field.label}</span>
          <select id="${id}">
            ${FONT_WEIGHT_OPTIONS.map(([label, value]) => `<option value="${value}">${label}</option>`).join('')}
          </select>
        </label>
      `;
    }
    return `
      <label class="field compact-field">
        <span>${field.label}</span>
        <input id="${id}" type="number" min="${field.min}" max="${field.max}" step="${field.step || 1}" />
      </label>
    `;
  }

  function injectTypographyControls() {
    const groups = appearanceForm.querySelectorAll('.appearance-group');
    TYPOGRAPHY_GROUPS.forEach((groupConfig) => {
      const groupNode = groups[groupConfig.groupIndex];
      if (!groupNode || groupNode.querySelector(`[data-appearance-typography="${groupConfig.title}"]`)) {
        return;
      }
      groupNode.insertAdjacentHTML(
        'beforeend',
        `
          <div class="appearance-subsection" data-appearance-typography="${groupConfig.title}">
            <div class="appearance-group-head">
              <h3>${groupConfig.title}</h3>
              <p class="appearance-hint">${groupConfig.hint}</p>
            </div>
            <div class="appearance-grid">
              ${groupConfig.fields.map(renderFieldMarkup).join('')}
            </div>
          </div>
        `,
      );
    });
  }

  injectTypographyControls();

  const fields = Object.fromEntries(
    Object.entries(FIELD_IDS).map(([key, id]) => [key, document.querySelector(`#${id}`)]),
  );
  const uploadFields = Object.fromEntries(
    UPLOAD_FIELDS.map((config) => [
      config.key,
      {
        ...config,
        fileInput: document.querySelector(`#${config.fileId}`),
        clearButton: document.querySelector(`#${config.clearId}`),
        metaNode: document.querySelector(`#${config.metaId}`),
      },
    ]),
  );

  let hasLoaded = false;
  let previewFrame = null;
  let pendingPreviewSettings = normalizeAppearance(DEFAULT_APPEARANCE);

  function normalizeAppearance(settings = {}) {
    const normalized = { ...DEFAULT_APPEARANCE, ...settings };
    NUMBER_FIELDS.forEach((key) => {
      normalized[key] = Number(normalized[key]) || DEFAULT_APPEARANCE[key];
    });
    return normalized;
  }

  function updateUploadMeta(key, value) {
    const config = uploadFields[key];
    if (!config?.metaNode) {
      return;
    }
    const hasValue = Boolean(String(value || "").trim());
    config.metaNode.textContent = hasValue ? config.filledText : config.emptyText;
  }

  function fillForm(settings) {
    Object.entries(fields).forEach(([key, input]) => {
      if (!input) {
        return;
      }
      input.value = settings[key];
    });
    Object.entries(uploadFields).forEach(([key, config]) => {
      if (config.fileInput) {
        config.fileInput.value = "";
      }
      updateUploadMeta(key, settings[key]);
    });
  }

  function collectAppearance() {
    const payload = {};
    Object.entries(fields).forEach(([key, input]) => {
      if (!input) {
        return;
      }
      payload[key] = NUMBER_FIELDS.has(key) ? Number(input.value) || DEFAULT_APPEARANCE[key] : input.value;
    });
    return normalizeAppearance(payload);
  }

  function escapeAttribute(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll("'", '&#39;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function handlePreviewResize(event) {
    if (!previewFrame || event.source !== previewFrame.contentWindow) {
      return;
    }
    if (!event.data || event.data.type !== 'scrolltool-booking-resize') {
      return;
    }
    const nextHeight = Number(event.data.height);
    if (!nextHeight || Number.isNaN(nextHeight)) {
      return;
    }
    previewFrame.style.height = `${Math.max(520, Math.min(nextHeight, 1600))}px`;
  }

  function ensurePreviewFrame() {
    if (!appearancePreviewNode) {
      return;
    }

    if (previewFrame) {
      return;
    }

    appearancePreviewNode.innerHTML = `
      <div class="appearance-preview-shell">
        <div class="appearance-preview-meta">
          <div>
            <strong>Живое мини-превью</strong>
            <span>Это реальная страница бронирования. Несохранённые изменения подставляются в неё сразу.</span>
          </div>
          <span class="appearance-preview-badge">Без сохранения</span>
        </div>
        <div class="appearance-preview-frame-wrap">
          <iframe
            id="appearance-preview-frame"
            class="appearance-preview-frame"
            src="/booking?embed=1"
            title="Предпросмотр страницы бронирования"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    `;

    previewFrame = document.querySelector('#appearance-preview-frame');
    window.addEventListener('message', handlePreviewResize);

    previewFrame?.addEventListener('load', () => {
      if (pendingPreviewSettings) {
        previewFrame.contentWindow?.postMessage(
          { type: PREVIEW_MESSAGE_TYPE, appearance: pendingPreviewSettings },
          window.location.origin,
        );
      }
    });
  }

  function renderPreview(settings) {
    if (!appearancePreviewNode) {
      return;
    }
    pendingPreviewSettings = normalizeAppearance(settings);
    ensurePreviewFrame();
    if (!previewFrame?.contentWindow) {
      return;
    }
    previewFrame.contentWindow.postMessage(
      { type: PREVIEW_MESSAGE_TYPE, appearance: pendingPreviewSettings },
      window.location.origin,
    );
  }

  function readAssetFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
      reader.readAsDataURL(file);
    });
  }

  async function handleUploadField(key, file) {
    if (!fields[key]) {
      return;
    }
    if (!file) {
      fields[key].value = "";
      updateUploadMeta(key, "");
      renderPreview(collectAppearance());
      return;
    }
    try {
      fields[key].value = await readAssetFile(file);
      updateUploadMeta(key, fields[key].value);
      renderPreview(collectAppearance());
    } catch (error) {
      setStatus(error.message || "Не удалось загрузить изображение.", "error");
    }
  }

  async function loadAppearance(force = false) {
    if (hasLoaded && !force) {
      return;
    }
    try {
      const payload = await apiRequest('/api/appearance');
      const settings = normalizeAppearance(payload.appearance || {});
      fillForm(settings);
      renderPreview(settings);
      hasLoaded = true;
    } catch (error) {
      setStatus(error.message || 'Не удалось загрузить настройки внешнего вида.', 'error');
    }
  }

  async function saveAppearance(event) {
    event.preventDefault();
    const submitButton = document.querySelector('#save-appearance-button');
    if (submitButton) {
      submitButton.disabled = true;
    }
    setStatus('Сохраняю настройки внешнего вида...', '');
    try {
      const payload = await apiRequest('/api/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectAppearance()),
      });
      const settings = normalizeAppearance(payload.appearance || {});
      fillForm(settings);
      renderPreview(settings);
      hasLoaded = true;
      setStatus('Настройки внешнего вида сохранены.', 'success');
    } catch (error) {
      setStatus(error.message || 'Не удалось сохранить настройки внешнего вида.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  async function resetAppearance() {
    resetAppearanceButton.disabled = true;
    setStatus('Возвращаю стандартное оформление...', '');
    try {
      const payload = await apiRequest('/api/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const settings = normalizeAppearance(payload.appearance || {});
      fillForm(settings);
      renderPreview(settings);
      hasLoaded = true;
      setStatus('Стандартное оформление восстановлено.', 'success');
    } catch (error) {
      setStatus(error.message || 'Не удалось сбросить оформление.', 'error');
    } finally {
      resetAppearanceButton.disabled = false;
    }
  }

  appearanceForm.addEventListener('submit', saveAppearance);
  appearanceForm.addEventListener('input', () => renderPreview(collectAppearance()));
  resetAppearanceButton.addEventListener('click', resetAppearance);
  appearanceTabButton.addEventListener('click', () => loadAppearance());
  Object.entries(uploadFields).forEach(([key, config]) => {
    config.fileInput?.addEventListener('change', (event) => {
      handleUploadField(key, event.target.files?.[0] || null);
    });
    config.clearButton?.addEventListener('click', () => {
      handleUploadField(key, null);
    });
  });

  new MutationObserver(() => {
    if (!adminView.classList.contains('hidden-panel')) {
      loadAppearance();
    }
  }).observe(adminView, { attributes: true, attributeFilter: ['class'] });
})();
