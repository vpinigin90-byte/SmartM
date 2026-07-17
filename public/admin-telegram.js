(() => {
  const form = document.querySelector("#telegram-form");
  const tabButton = document.querySelector('[data-tab="telegram"]');
  const testButton = document.querySelector("#test-telegram-button");
  const connectionStatusNode = document.querySelector("#telegram-connection-status");
  const adminStatusNode = document.querySelector("#telegram-admin-status");

  if (!form || !tabButton || !testButton || !connectionStatusNode || !adminStatusNode) {
    return;
  }

  const fields = {
    enabled: document.querySelector("#telegram-enabled"),
    botUsername: document.querySelector("#telegram-bot-username"),
    botToken: document.querySelector("#telegram-bot-token"),
  };

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getFormData() {
    return {
      enabled: fields.enabled.checked,
      botUsername: fields.botUsername.value.trim(),
      botToken: fields.botToken.value.trim(),
    };
  }

  function renderConnectionStatus(settings) {
    const testedAt = settings.lastConnectionTestAt;
    if (!testedAt) {
      connectionStatusNode.innerHTML = "<p>Подключение Telegram-бота ещё не проверялось.</p>";
      return;
    }

    const label = settings.lastConnectionTestStatus === "success" ? "Подключено" : "Ошибка подключения";
    connectionStatusNode.innerHTML = `
      <p><strong>${label}</strong> · ${escapeHtml(new Date(testedAt).toLocaleString("ru-RU"))}</p>
      <p>${escapeHtml(settings.lastConnectionTestMessage || "Без дополнительного сообщения.")}</p>
    `;
  }

  function renderAdminStatus(settings) {
    if (settings.adminChatConnected) {
      adminStatusNode.innerHTML = `
        <p><strong>Администраторский чат подключён.</strong></p>
        <p>Служебные уведомления о встречах будут отправляться в этот чат после запуска сценария напоминаний.</p>
      `;
      return;
    }

    if (settings.adminConnectUrl) {
      adminStatusNode.innerHTML = `
        <p>Откройте ссылку в своём Telegram и нажмите <strong>Start</strong>. Так сервер безопасно получит chat ID без ручного ввода.</p>
        <p><a class="telegram-connect-link" href="${escapeHtml(settings.adminConnectUrl)}" target="_blank" rel="noreferrer">Подключить администраторский чат</a></p>
      `;
      return;
    }

    adminStatusNode.innerHTML = "<p>Сначала сохраните токен и проверьте подключение Telegram-бота.</p>";
  }

  function applySettings(settings) {
    fields.enabled.checked = Boolean(settings.enabled);
    fields.botUsername.value = settings.botUsername || "";
    fields.botToken.value = settings.botToken || "";
    renderConnectionStatus(settings);
    renderAdminStatus(settings);
  }

  async function loadSettings() {
    const payload = await apiRequest("/api/integrations/telegram");
    applySettings(payload.telegram || {});
  }

  async function saveSettings(event) {
    event.preventDefault();
    setStatus("Сохраняю настройки Telegram...", "");
    try {
      const payload = await apiRequest("/api/integrations/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getFormData()),
      });
      applySettings(payload.telegram || {});
      setStatus("Настройки Telegram сохранены.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  async function testConnection() {
    testButton.disabled = true;
    setStatus("Проверяю Telegram-бота и устанавливаю webhook...", "");
    try {
      const payload = await apiRequest("/api/integrations/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getFormData()),
      });
      applySettings(payload.telegram || {});
      setStatus(payload.message || "Telegram-бот подключён.", "success");
    } catch (error) {
      setStatus(error.message, "error");
      loadSettings().catch(() => null);
    } finally {
      testButton.disabled = false;
    }
  }

  form.addEventListener("submit", saveSettings);
  testButton.addEventListener("click", testConnection);
  tabButton.addEventListener("click", () => {
    loadSettings().catch((error) => setStatus(error.message, "error"));
  });
})();
