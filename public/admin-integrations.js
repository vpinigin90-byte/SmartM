(function () {
  const form = document.querySelector("#mts-link-form");
  const tabButton = document.querySelector('[data-tab="mts-link"]');
  const testStatusNode = document.querySelector("#mts-link-test-status");
  const lastSuccessNode = document.querySelector("#mts-link-last-success");
  const testButton = document.querySelector("#test-mts-link-button");

  if (!form || !tabButton) {
    return;
  }

  const DEFAULT_SETTINGS = {
    enabled: false,
    accountMode: "shared",
    baseUrl: "https://userapi.mts-link.ru/v3",
    accessToken: "",
    organizerName: "Команда Scrolltool",
    defaultRoomTitleTemplate: "Демо Scrolltool для {{companyName}}",
    defaultRoomDescriptionTemplate:
      "Клиент: {{clientName}}\nE-mail: {{clientEmail}}\nКомпания: {{companyName}}\nДолжность: {{position}}\nСотрудник: {{employeeName}}\nНачало: {{start}}\nОкончание: {{end}}",
    timeZone: "Europe/Moscow",
    defaultDurationMinutes: 60,
    insertLinkIntoLocation: true,
    insertLinkIntoDescription: true,
    appendMeetingMetaToDescription: true,
    fallbackWithoutLink: true,
    failureWarningText: "MTS Link недоступен, бронь создана без ссылки.",
    requestTimeoutMs: 15000,
    lastTestAt: null,
    lastTestStatus: null,
    lastTestMessage: "",
    lastSuccessMeeting: null,
  };

  const fields = {
    enabled: document.querySelector("#mts-link-enabled"),
    accountMode: document.querySelector("#mts-link-account-mode"),
    baseUrl: document.querySelector("#mts-link-base-url"),
    accessToken: document.querySelector("#mts-link-access-token"),
    organizerName: document.querySelector("#mts-link-organizer-name"),
    defaultRoomTitleTemplate: document.querySelector("#mts-link-title-template"),
    defaultRoomDescriptionTemplate: document.querySelector("#mts-link-description-template"),
    timeZone: document.querySelector("#mts-link-time-zone"),
    defaultDurationMinutes: document.querySelector("#mts-link-default-duration"),
    insertLinkIntoLocation: document.querySelector("#mts-link-insert-location"),
    insertLinkIntoDescription: document.querySelector("#mts-link-insert-description"),
    appendMeetingMetaToDescription: document.querySelector("#mts-link-append-meta"),
    fallbackWithoutLink: document.querySelector("#mts-link-fallback-without-link"),
    failureWarningText: document.querySelector("#mts-link-failure-warning"),
    requestTimeoutMs: document.querySelector("#mts-link-timeout"),
  };

  let hasLoaded = false;

  function normalizeSettings(settings = {}) {
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      defaultDurationMinutes: Number(settings.defaultDurationMinutes) || DEFAULT_SETTINGS.defaultDurationMinutes,
      requestTimeoutMs: Number(settings.requestTimeoutMs) || DEFAULT_SETTINGS.requestTimeoutMs,
    };
  }

  function fillForm(settings) {
    const normalized = normalizeSettings(settings);
    Object.entries(fields).forEach(([key, input]) => {
      if (!input) {
        return;
      }
      if (input.type === "checkbox") {
        input.checked = Boolean(normalized[key]);
      } else {
        input.value = normalized[key] ?? "";
      }
    });
    renderLastTest(normalized);
    renderLastSuccess(normalized.lastSuccessMeeting);
  }

  function collectSettings() {
    return normalizeSettings({
      enabled: fields.enabled.checked,
      accountMode: fields.accountMode.value.trim() || "shared",
      baseUrl: fields.baseUrl.value.trim(),
      accessToken: fields.accessToken.value.trim(),
      organizerName: fields.organizerName.value.trim(),
      defaultRoomTitleTemplate: fields.defaultRoomTitleTemplate.value.trim(),
      defaultRoomDescriptionTemplate: fields.defaultRoomDescriptionTemplate.value.trim(),
      timeZone: fields.timeZone.value.trim(),
      defaultDurationMinutes: Number(fields.defaultDurationMinutes.value) || DEFAULT_SETTINGS.defaultDurationMinutes,
      insertLinkIntoLocation: fields.insertLinkIntoLocation.checked,
      insertLinkIntoDescription: fields.insertLinkIntoDescription.checked,
      appendMeetingMetaToDescription: fields.appendMeetingMetaToDescription.checked,
      fallbackWithoutLink: fields.fallbackWithoutLink.checked,
      failureWarningText: fields.failureWarningText.value.trim(),
      requestTimeoutMs: Number(fields.requestTimeoutMs.value) || DEFAULT_SETTINGS.requestTimeoutMs,
    });
  }

  function renderLastTest(settings) {
    if (!testStatusNode) {
      return;
    }
    if (!settings.lastTestAt) {
      testStatusNode.innerHTML = "<p>Проверка подключения ещё не запускалась.</p>";
      return;
    }
    const label = settings.lastTestStatus === "success" ? "Успешно" : "Ошибка";
    testStatusNode.innerHTML = `
      <p><strong>${label}</strong> · ${escapeHtml(new Date(settings.lastTestAt).toLocaleString("ru-RU"))}</p>
      <p>${escapeHtml(settings.lastTestMessage || "Без дополнительного сообщения.")}</p>
    `;
  }

  function renderLastSuccess(lastSuccessMeeting) {
    if (!lastSuccessNode) {
      return;
    }
    if (!lastSuccessMeeting) {
      lastSuccessNode.innerHTML = "<p>Пока успешных встреч через MTS Link не было.</p>";
      return;
    }
    lastSuccessNode.innerHTML = `
      <p><strong>Создано:</strong> ${escapeHtml(new Date(lastSuccessMeeting.createdAt).toLocaleString("ru-RU"))}</p>
      <p><strong>Event ID:</strong> ${escapeHtml(lastSuccessMeeting.eventId || "—")}</p>
      <p><strong>Session ID:</strong> ${escapeHtml(lastSuccessMeeting.meetingId || "—")}</p>
      <p><strong>Ссылка:</strong> ${lastSuccessMeeting.meetingUrl ? `<a href="${escapeHtml(lastSuccessMeeting.meetingUrl)}" target="_blank" rel="noreferrer">${escapeHtml(lastSuccessMeeting.meetingUrl)}</a>` : "—"}</p>
      <p><strong>HTTP статус:</strong> ${escapeHtml(lastSuccessMeeting.rawStatus || "—")}</p>
    `;
  }

  async function loadSettings(force = false) {
    if (hasLoaded && !force) {
      return;
    }
    const payload = await apiRequest("/api/integrations/mts-link");
    fillForm(payload.mtsLink || {});
    hasLoaded = true;
  }

  async function saveSettings(event) {
    event.preventDefault();
    const submitButton = event.submitter || form.querySelector('button[type="submit"]');
    submitButton && (submitButton.disabled = true);
    setStatus("Сохраняю настройки MTS Link...", "");
    try {
      const payload = await apiRequest("/api/integrations/mts-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectSettings()),
      });
      fillForm(payload.mtsLink || {});
      setStatus("Настройки MTS Link сохранены.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      submitButton && (submitButton.disabled = false);
    }
  }

  async function testConnection() {
    testButton.disabled = true;
    setStatus("Проверяю подключение к MTS Link...", "");
    try {
      const payload = await apiRequest("/api/integrations/mts-link/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectSettings()),
      });
      fillForm(payload.mtsLink || {});
      setStatus(payload.message || "Подключение к MTS Link успешно.", "success");
    } catch (error) {
      try {
        await loadSettings(true);
      } catch {
        // Ignore reload errors after failed test.
      }
      setStatus(error.message, "error");
    } finally {
      testButton.disabled = false;
    }
  }

  form.addEventListener("submit", saveSettings);
  testButton?.addEventListener("click", testConnection);
  tabButton.addEventListener("click", () => loadSettings().catch((error) => setStatus(error.message, "error")));

  window.refreshMtsLinkAdmin = function refreshMtsLinkAdmin() {
    return loadSettings(true).catch((error) => {
      setStatus(error.message, "error");
    });
  };
})();
