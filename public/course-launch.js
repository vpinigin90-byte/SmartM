(function () {
  const launchId = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() || "");
  const authView = document.querySelector("#course-auth-view");
  const playerView = document.querySelector("#course-player-view");
  const titleNode = document.querySelector("#course-title");
  const descriptionNode = document.querySelector("#course-description");
  const playerTitleNode = document.querySelector("#course-player-title");
  const learnerLabelNode = document.querySelector("#course-learner-label");
  const emailForm = document.querySelector("#course-email-form");
  const codeForm = document.querySelector("#course-code-form");
  const emailInput = document.querySelector("#course-email");
  const codeInput = document.querySelector("#course-code");
  const codeButton = document.querySelector("#course-code-button");
  const verifyButton = document.querySelector("#course-verify-button");
  const changeEmailButton = document.querySelector("#course-change-email-button");
  const statusNode = document.querySelector("#course-auth-status");
  const openLink = document.querySelector("#course-open-link");
  const continueLink = document.querySelector("#course-continue-link");
  const completeButton = document.querySelector("#course-complete-button");

  const clientSessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  let activeLaunch = null;
  let activeLearner = null;
  let eventQueue = [];
  let flushTimer = null;
  let startedAt = Date.now();
  let maxProgress = 0;

  function setStatus(message, kind = "") {
    statusNode.textContent = message;
    statusNode.className = `status${kind ? ` ${kind}` : ""}`;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Ошибка запроса.");
    }
    return payload;
  }

  function updateLaunchText(launch) {
    titleNode.textContent = launch.title || "Запуск курса";
    playerTitleNode.textContent = launch.title || "Scrolltool";
    descriptionNode.textContent = launch.description || "Подтвердите доступ, чтобы открыть материал.";
  }

  function showAuth() {
    authView.classList.remove("hidden-panel");
    playerView.classList.add("hidden-panel");
  }

  function showPlayer(courseUrl) {
    authView.classList.add("hidden-panel");
    playerView.classList.remove("hidden-panel");
    openLink.href = courseUrl;
    continueLink.href = courseUrl;
    learnerLabelNode.textContent = activeLearner?.email ? `Ученик: ${activeLearner.email}` : "";
    enqueueEvent("course_opened", { source: "protected_link" });
    enqueueEvent("course_started", {});
    enqueueEvent("course_redirected", { sourceUrl: courseUrl });
    flushEvents().finally(() => {
      window.setTimeout(() => {
        window.location.href = courseUrl;
      }, 500);
    });
  }

  function enqueueEvent(eventType, payload = {}) {
    eventQueue.push({
      eventId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      eventType,
      eventTime: new Date().toISOString(),
      payload,
    });
    if (eventQueue.length >= 10) {
      flushEvents();
    }
  }

  async function flushEvents(useBeacon = false) {
    if (!eventQueue.length) {
      return;
    }
    const events = eventQueue.splice(0, eventQueue.length);
    const body = JSON.stringify({ sessionId: clientSessionId, events });
    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(`/api/public/course-launches/${encodeURIComponent(launchId)}/events`, blob);
      return;
    }
    try {
      await api(`/api/public/course-launches/${encodeURIComponent(launchId)}/events`, {
        method: "POST",
        body,
      });
    } catch {
      eventQueue = [...events, ...eventQueue].slice(-50);
    }
  }

  function updateTimeProgress() {
    if (playerView.classList.contains("hidden-panel")) {
      return;
    }
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    const progressPercent = Math.min(95, Math.max(maxProgress, Math.floor(seconds / 6) * 5));
    if (progressPercent > maxProgress) {
      maxProgress = progressPercent;
      enqueueEvent("progress_changed", { progressPercent, source: "time_on_page" });
    }
    enqueueEvent("time_on_page", { seconds });
  }

  async function loadAccess() {
    setStatus("Проверяю доступ...", "");
    const payload = await api(`/api/public/course-launches/${encodeURIComponent(launchId)}/access`);
    activeLaunch = payload.launch;
    activeLearner = payload.learner;
    updateLaunchText(activeLaunch);
    if (payload.authorized && payload.courseUrl) {
      setStatus("", "");
      showPlayer(payload.courseUrl);
    } else {
      showAuth();
      setStatus("", "");
    }
  }

  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    codeButton.disabled = true;
    setStatus("Отправляю код...", "");
    try {
      const payload = await api(`/api/public/course-launches/${encodeURIComponent(launchId)}/auth/request-code`, {
        method: "POST",
        body: JSON.stringify({ email: emailInput.value.trim() }),
      });
      emailForm.classList.add("hidden-panel");
      codeForm.classList.remove("hidden-panel");
      codeInput.focus();
      setStatus(payload.devCode ? `Код для локального прототипа: ${payload.devCode}` : payload.message, "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      codeButton.disabled = false;
    }
  });

  codeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    verifyButton.disabled = true;
    setStatus("Проверяю код...", "");
    try {
      const payload = await api(`/api/public/course-launches/${encodeURIComponent(launchId)}/auth/verify-code`, {
        method: "POST",
        body: JSON.stringify({ email: emailInput.value.trim(), code: codeInput.value.trim() }),
      });
      activeLearner = payload.learner;
      setStatus("", "");
      showPlayer(payload.courseUrl);
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      verifyButton.disabled = false;
    }
  });

  changeEmailButton.addEventListener("click", () => {
    codeForm.classList.add("hidden-panel");
    emailForm.classList.remove("hidden-panel");
    codeInput.value = "";
    setStatus("", "");
    emailInput.focus();
  });

  completeButton.addEventListener("click", async () => {
    maxProgress = 100;
    enqueueEvent("course_completed", { progressPercent: 100, passed: true, source: "manual_prototype_button" });
    await flushEvents();
  });

  window.addEventListener("pagehide", () => {
    updateTimeProgress();
    flushEvents(true);
  });

  flushTimer = window.setInterval(() => {
    updateTimeProgress();
    flushEvents();
  }, 10000);

  loadAccess().catch((error) => {
    setStatus(error.message || "Не удалось открыть запуск курса.", "error");
    showAuth();
  });
})();
