(function () {
  const launchesCountNode = document.querySelector("#course-dashboard-launches-count");
  const learnersCountNode = document.querySelector("#course-dashboard-learners-count");
  const eventsCountNode = document.querySelector("#course-dashboard-events-count");
  const statusNode = document.querySelector("#course-dashboard-status");
  const launchListNode = document.querySelector("#course-launch-list");
  const learnersListNode = document.querySelector("#course-learners-list");
  const eventsListNode = document.querySelector("#course-events-list");
  const refreshButton = document.querySelector("#refresh-course-dashboard-button");

  let dashboardState = {
    launches: [],
    activeLaunchId: null,
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function setDashboardStatus(message, kind = "") {
    statusNode.textContent = message;
    statusNode.className = `status${kind ? ` ${kind}` : ""}`;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      setDashboardStatus("Ссылка скопирована.", "success");
    } catch {
      setDashboardStatus("Не удалось скопировать ссылку.", "error");
    }
  }

  function getActiveSummary() {
    return dashboardState.launches.find((item) => item.launch.id === dashboardState.activeLaunchId) || dashboardState.launches[0] || null;
  }

  function renderLaunches() {
    if (!dashboardState.launches.length) {
      launchListNode.innerHTML = '<div class="rules-preview"><p>Запусков пока нет.</p></div>';
      return;
    }

    launchListNode.innerHTML = dashboardState.launches
      .map((summary) => {
        const launch = summary.launch;
        const active = launch.id === dashboardState.activeLaunchId;
        return `
          <article class="course-launch-card${active ? " active" : ""}" data-launch-id="${escapeHtml(launch.id)}">
            <div>
              <p class="eyebrow">${launch.accessMode === "open" ? "Открытый доступ" : "E-mail OTP"}</p>
              <h3>${escapeHtml(launch.title)}</h3>
              <p>${escapeHtml(launch.description || "Без описания")}</p>
              <a href="${escapeHtml(launch.publicUrl)}" target="_blank" rel="noopener">${escapeHtml(launch.publicUrl)}</a>
            </div>
            <div class="course-launch-metrics">
              <span>${summary.metrics.learnersCount} учеников</span>
              <span>${summary.metrics.completedCount} завершили</span>
              <span>${summary.metrics.eventsCount} событий</span>
            </div>
            <div class="actions">
              <button class="secondary-button" type="button" data-action="select-launch" data-launch-id="${escapeHtml(launch.id)}">Показать</button>
              <button class="ghost-button" type="button" data-action="copy-launch" data-url="${escapeHtml(launch.publicUrl)}">Скопировать ссылку</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderLearners(summary) {
    const learners = summary?.learners || [];
    if (!learners.length) {
      learnersListNode.innerHTML = '<tr><td colspan="4">По этому запуску пока нет учеников.</td></tr>';
      return;
    }

    learnersListNode.innerHTML = learners
      .map((learner) => `
        <tr>
          <td>${escapeHtml(learner.email)}</td>
          <td>${learner.progressPercent}%</td>
          <td>${learner.eventsCount}</td>
          <td>${formatDate(learner.completedAt)}</td>
        </tr>
      `)
      .join("");
  }

  function renderEvents(summary) {
    const events = summary?.recentEvents || [];
    if (!events.length) {
      eventsListNode.classList.add("empty");
      eventsListNode.innerHTML = "<p>Событий пока нет.</p>";
      return;
    }

    eventsListNode.classList.remove("empty");
    eventsListNode.innerHTML = events
      .map((event) => `
        <article class="course-event-row">
          <div>
            <strong>${escapeHtml(event.eventType)}</strong>
            <span>${escapeHtml(event.learnerEmail)} · ${formatDate(event.eventTime)}</span>
          </div>
          <code>${escapeHtml(JSON.stringify(event.payload || {}))}</code>
        </article>
      `)
      .join("");
  }

  function renderDashboard(payload) {
    dashboardState.launches = payload.launches || [];
    if (!dashboardState.activeLaunchId || !dashboardState.launches.some((item) => item.launch.id === dashboardState.activeLaunchId)) {
      dashboardState.activeLaunchId = dashboardState.launches[0]?.launch.id || null;
    }

    launchesCountNode.textContent = payload.totals?.launchesCount ?? 0;
    learnersCountNode.textContent = payload.totals?.learnersCount ?? 0;
    eventsCountNode.textContent = payload.totals?.eventsCount ?? 0;

    const activeSummary = getActiveSummary();
    renderLaunches();
    renderLearners(activeSummary);
    renderEvents(activeSummary);
  }

  async function refreshCourseDashboards() {
    refreshButton.disabled = true;
    setDashboardStatus("Загружаю аналитику...", "");
    try {
      const payload = await apiRequest("/api/course-launches/admin/overview");
      renderDashboard(payload);
      setDashboardStatus("Аналитика обновлена.", "success");
    } catch (error) {
      setDashboardStatus(error.message || "Не удалось загрузить аналитику.", "error");
    } finally {
      refreshButton.disabled = false;
    }
  }

  launchListNode.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    if (button.dataset.action === "select-launch") {
      dashboardState.activeLaunchId = button.dataset.launchId;
      const activeSummary = getActiveSummary();
      renderLaunches();
      renderLearners(activeSummary);
      renderEvents(activeSummary);
      return;
    }
    if (button.dataset.action === "copy-launch") {
      copyText(button.dataset.url || "");
    }
  });

  refreshButton.addEventListener("click", refreshCourseDashboards);
  window.refreshCourseDashboards = refreshCourseDashboards;
})();
