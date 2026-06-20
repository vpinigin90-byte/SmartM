const slotsNode = document.querySelector("#public-slots");
const statusNode = document.querySelector("#booking-status");
const summaryNode = document.querySelector("#booking-summary");
const refreshButton = document.querySelector("#refresh-slots-button");
const formPanel = document.querySelector("#booking-form-panel");
const form = document.querySelector("#booking-form");
const startInput = document.querySelector("#booking-start");
const endInput = document.querySelector("#booking-end");
const selectedSlotSummaryNode = document.querySelector("#selected-slot-summary");
const clientNameInput = document.querySelector("#client-name");
const clientEmailInput = document.querySelector("#client-email");
const clientPhoneInput = document.querySelector("#client-phone");
const clientCommentInput = document.querySelector("#client-comment");
const bookButton = document.querySelector("#book-slot-button");
const cancelButton = document.querySelector("#cancel-booking-button");

const state = {
  slots: [],
  selectedSlot: null,
};

function setStatus(message, kind = "") {
  statusNode.textContent = message;
  statusNode.className = `status${kind ? ` ${kind}` : ""}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toLocalDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatDateTimeLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTimeLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSlotsRange() {
  const start = toLocalDayStart(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Ошибка запроса.");
  }
  return payload;
}

function groupSlotsByDay(slots) {
  const buckets = new Map();
  for (const slot of slots) {
    const dayKey = toLocalDayStart(new Date(slot.start)).toISOString();
    if (!buckets.has(dayKey)) {
      buckets.set(dayKey, []);
    }
    buckets.get(dayKey).push(slot);
  }
  return buckets;
}

function renderSlots() {
  if (!state.slots.length) {
    slotsNode.classList.add("empty");
    slotsNode.innerHTML = "<p>Свободных слотов пока нет. Попробуйте обновить список позже.</p>";
    summaryNode.textContent = "На ближайшие дни нет доступных окон для демо.";
    return;
  }

  const buckets = groupSlotsByDay(state.slots);
  slotsNode.classList.remove("empty");
  summaryNode.textContent = `Найдено слотов: ${state.slots.length}. Длительность демо - 60 минут.`;
  slotsNode.innerHTML = [...buckets.entries()]
    .map(([dayKey, daySlots]) => {
      const list = daySlots
        .map(
          (slot, index) => `
            <li class="slot-item public-slot-item">
              <strong>${formatTimeLabel(new Date(slot.start))} - ${formatTimeLabel(new Date(slot.end))}</strong>
              <button class="secondary-button" type="button" data-start="${escapeHtml(slot.start)}" data-end="${escapeHtml(slot.end)}" data-index="${index}">
                Выбрать
              </button>
            </li>`,
        )
        .join("");

      return `<article class="day-card"><h3>${formatDateLabel(new Date(dayKey))}</h3><ul class="slot-list">${list}</ul></article>`;
    })
    .join("");
}

async function loadSlots() {
  const { start, end } = getSlotsRange();
  refreshButton.disabled = true;
  setStatus("Ищем свободные окна...", "");

  try {
    const params = new URLSearchParams({
      rangeStartIso: start.toISOString(),
      rangeEndIso: end.toISOString(),
      allowedStartTime: "09:00",
      allowedEndTime: "18:00",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const payload = await apiRequest(`/api/public/slots?${params.toString()}`);
    state.slots = payload.slots || [];
    renderSlots();
    setStatus("Слоты обновлены.", "success");
  } catch (error) {
    slotsNode.classList.add("empty");
    slotsNode.innerHTML = "<p>Не удалось загрузить слоты.</p>";
    setStatus(error.message, "error");
  } finally {
    refreshButton.disabled = false;
  }
}

function selectSlot(start, end) {
  state.selectedSlot = { start, end };
  startInput.value = start;
  endInput.value = end;
  selectedSlotSummaryNode.textContent = `Вы выбрали ${formatDateTimeLabel(new Date(start))} - ${formatTimeLabel(new Date(end))}.`;
  formPanel.classList.remove("hidden-panel");
  formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetSelection() {
  state.selectedSlot = null;
  startInput.value = "";
  endInput.value = "";
  form.reset();
  formPanel.classList.add("hidden-panel");
}

async function submitBooking(event) {
  event.preventDefault();
  if (!state.selectedSlot) {
    setStatus("Сначала выберите слот.", "error");
    return;
  }

  bookButton.disabled = true;
  setStatus("Бронируем встречу...", "");

  try {
    await apiRequest("/api/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: startInput.value,
        end: endInput.value,
        clientName: clientNameInput.value.trim(),
        clientEmail: clientEmailInput.value.trim(),
        clientPhone: clientPhoneInput.value.trim(),
        comment: clientCommentInput.value.trim(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    setStatus("Готово. Встреча создана в календаре, участник добавлен по указанному e-mail.", "success");
    resetSelection();
    await loadSlots();
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    bookButton.disabled = false;
  }
}

slotsNode.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-start][data-end]");
  if (!button) {
    return;
  }

  selectSlot(button.dataset.start, button.dataset.end);
});

refreshButton.addEventListener("click", loadSlots);
cancelButton.addEventListener("click", resetSelection);
form.addEventListener("submit", submitBooking);

loadSlots();
