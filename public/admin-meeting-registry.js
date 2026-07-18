(function () {
  const openButton = document.querySelector("#meeting-registry-button");
  const refreshButton = document.querySelector("#refresh-meeting-registry-button");
  const panel = document.querySelector('[data-tab-panel="meeting-registry"]');
  const listNode = document.querySelector("#meeting-registry-list");
  const statusNode = document.querySelector("#meeting-registry-status");
  const activeCountNode = document.querySelector("#meeting-registry-active-count");
  const deletedCountNode = document.querySelector("#meeting-registry-deleted-count");
  const filters = [...document.querySelectorAll("[data-registry-filter]")];
  let meetings = [];
  let filter = "active";

  if (!openButton || !panel || !listNode) return;

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function formatDateRange(meeting) {
    const start = new Date(meeting.start);
    const end = new Date(meeting.end);
    return `${start.toLocaleDateString("ru-RU")}<br><strong>${start.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</strong>`;
  }

  function formatCancellationAction(label, status, attempts, error) {
    const labels = {
      completed: "выполнено",
      pending: "ожидает повтора",
      failed: "ошибка",
      not_required: "не требуется",
    };
    const attemptText = attempts > 1 ? `, попыток: ${attempts}` : "";
    const errorText = error ? `<br><small title="${escapeHtml(error)}">${escapeHtml(error)}</small>` : "";
    return `<span><strong>${label}:</strong> ${labels[status] || "неизвестно"}${attemptText}${errorText}</span>`;
  }

  function formatCancellation(meeting) {
    if (meeting.status !== "deleted") {
      return "-";
    }
    if (!meeting.cancellation) {
      return "Дополнительные действия не требуются";
    }
    return [
      formatCancellationAction(
        "MTS Link",
        meeting.cancellation.mtsStatus,
        meeting.cancellation.mtsAttempts,
        meeting.cancellation.mtsLastError,
      ),
      formatCancellationAction(
        "Telegram",
        meeting.cancellation.telegramStatus,
        meeting.cancellation.telegramAttempts,
        meeting.cancellation.telegramLastError,
      ),
    ].join("<br>");
  }

  function render() {
    const active = meetings.filter((item) => item.status === "active");
    const deleted = meetings.filter((item) => item.status === "deleted");
    activeCountNode.textContent = String(active.length);
    deletedCountNode.textContent = String(deleted.length);
    filters.forEach((button) => button.classList.toggle("active", button.dataset.registryFilter === filter));
    const selected = filter === "active" ? active : deleted;
    if (!selected.length) {
      listNode.innerHTML = `<tr><td colspan="6">${filter === "active" ? "Актуальных встреч за выбранный период нет." : "Удалённых встреч за выбранный период нет."}</td></tr>`;
      return;
    }
    listNode.innerHTML = selected.map((meeting) => `
      <tr>
        <td>${formatDateRange(meeting)}</td>
        <td>${escapeHtml(meeting.title)}</td>
        <td>${meeting.source === "api" ? "API meet.scroll-tool.ru" : "Календарь Mail.ru"}</td>
        <td>${meeting.participation === "organizer" ? "Я назначил" : meeting.participation === "invitee" ? "Меня пригласили" : "Не определено"}</td>
        <td>${meeting.attendees?.length ? escapeHtml(meeting.attendees.join(", ")) : "-"}</td>
        <td>${formatCancellation(meeting)}</td>
      </tr>`).join("");
  }

  async function loadRegistry() {
    refreshButton && (refreshButton.disabled = true);
    statusNode.textContent = "Обновляю реестр по календарю Mail.ru...";
    statusNode.className = "status";
    try {
      const payload = await apiRequest("/api/meeting-registry");
      meetings = payload.meetings || [];
      render();
      statusNode.textContent = payload.syncError || "Реестр обновлён.";
      statusNode.className = `status ${payload.syncError ? "error" : "success"}`;
    } catch (error) {
      statusNode.textContent = error.message || "Не удалось обновить реестр.";
      statusNode.className = "status error";
    } finally {
      refreshButton && (refreshButton.disabled = false);
    }
  }

  function openRegistry() {
    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.remove("active");
      button.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll("[data-tab-panel]").forEach((item) => {
      item.classList.remove("active");
      item.classList.add("hidden-panel");
      item.hidden = true;
    });
    panel.classList.add("active");
    panel.classList.remove("hidden-panel");
    panel.hidden = false;
    loadRegistry();
  }

  openButton.addEventListener("click", openRegistry);
  refreshButton?.addEventListener("click", loadRegistry);
  filters.forEach((button) => button.addEventListener("click", () => { filter = button.dataset.registryFilter; render(); }));
})();
