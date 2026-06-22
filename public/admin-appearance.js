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
    formLabelColor: '#f7fbff',
    formMutedColor: '#dfeaf7',
    formInputBackground: '#2d5c86',
    formInputTextColor: '#f7fbff',
    formPlaceholderColor: '#bfd0e1',
    formInputBorderColor: '#7da0bd',
    formInputHeight: 34,
    primaryButtonBackground: '#ffffff',
    primaryButtonTextColor: '#0c1c2c',
    primaryButtonBorderColor: '#2a3b4d',
    primaryButtonHeight: 38,
    iconButtonBackground: '#40678b',
    iconButtonTextColor: '#f7fbff',
  };

  const FIELD_IDS = {
    fontFamily: 'appearance-font-family',
    titleFontWeight: 'appearance-title-font-weight',
    bodyFontWeight: 'appearance-body-font-weight',
    pageBackground: 'appearance-page-background',
    cardBackground: 'appearance-card-background',
    textColor: 'appearance-text-color',
    mutedTextColor: 'appearance-muted-text-color',
    heroBackground: 'appearance-hero-background',
    heroTitleColor: 'appearance-hero-title-color',
    heroLeadColor: 'appearance-hero-lead-color',
    heroTitleSize: 'appearance-hero-title-size',
    bodyTextSize: 'appearance-body-text-size',
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
    primaryButtonBackground: 'appearance-primary-button-background',
    primaryButtonTextColor: 'appearance-primary-button-text-color',
    primaryButtonBorderColor: 'appearance-primary-button-border-color',
    primaryButtonHeight: 'appearance-primary-button-height',
    iconButtonBackground: 'appearance-icon-button-background',
    iconButtonTextColor: 'appearance-icon-button-text-color',
  };

  const NUMBER_FIELDS = new Set([
    'heroTitleSize',
    'bodyTextSize',
    'titleFontWeight',
    'bodyFontWeight',
    'panelRadius',
    'dateButtonHeight',
    'timeButtonHeight',
    'formInputHeight',
    'primaryButtonHeight',
  ]);

  const fields = Object.fromEntries(
    Object.entries(FIELD_IDS).map(([key, id]) => [key, document.querySelector(`#${id}`)]),
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

  function fillForm(settings) {
    Object.entries(fields).forEach(([key, input]) => {
      if (!input) {
        return;
      }
      input.value = settings[key];
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

  new MutationObserver(() => {
    if (!adminView.classList.contains('hidden-panel')) {
      loadAppearance();
    }
  }).observe(adminView, { attributes: true, attributeFilter: ['class'] });
})();
