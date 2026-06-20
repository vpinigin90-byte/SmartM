const datesNode = document.querySelector("#public-dates");
const slotsPanel = document.querySelector("#public-slots-panel");
const slotsNode = document.querySelector("#public-slots");
const statusNode = document.querySelector("#booking-status");
const summaryNode = document.querySelector("#booking-summary");
const selectedDateSummaryNode = document.querySelector("#selected-date-summary");
const refreshButton = document.querySelector("#refresh-slots-button");
const changeDateButton = document.querySelector("#change-date-button");
const formPanel = document.querySelector("#booking-form-panel");
const form = document.querySelector("#booking-form");
const startInput = document.querySelector("#booking-start");
const endInput = document.querySelector("#booking-end");
const selectedSlotSummaryNode = document.querySelector("#selected-slot-summary");
const clientNameInput = document.querySelector("#client-name");
const clientEmailInput = document.querySelector("#client-email");
const clientPhoneInput = document.querySelector("#client-phone");
const companyNameInput = document.querySelector("#company-name");
const positionSelect = document.querySelector("#client-position");
const customPositionField = document.querySelector("#custom-position-field");
const customPositionInput = document.querySelector("#custom-position");
const clientCommentInput = document.querySelector("#client-comment");
const bookButton = document.querySelector("#book-slot-button");
const cancelButton = document.querySelector("#cancel-booking-button");

const state = {
  slots: [],
  slotsByDay: new Map(),
  selectedDayKey: null,
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

function formatShortDateLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
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

function renderDates() {
  if (!state.slotsByDay.size) {
    datesNode.classList.add("empty");
    datesNode.innerHTML = "<p>Свободных дат пока нет. Попробуйте обновить список позже.</p>";
    summaryNode.textContent = "На ближайшие дни нет доступных окон для демо.";
    slotsPanel.classList.add("hidden-panel");
    formPanel.classList.add("hidden-panel");
    return;
  }

  datesNode.classList.remove("empty");
  summaryNode.textContent = "Выберите дату, чтобы увидеть доступное время.";
  datesNode.innerHTML = [...state.slotsByDay.entries()]
    .map(([dayKey, slots]) => {
      const date = new Date(dayKey);
      const isSelected = dayKey === state.selectedDayKey;
      return `
        <button class="date-option${isSelected ? " active" : ""}" type="button" data-day="${escapeHtml(dayKey)}">
          <strong>${formatShortDateLabel(date)}</strong>
          <span>${slots.length} слотов</span>
        </button>`;
    })
    .join("");
}

function renderSlotsForSelectedDate() {
  const slots = state.slotsByDay.get(state.selectedDayKey) || [];
  if (!state.selectedDayKey || !slots.length) {
    slotsPanel.classList.add("hidden-panel");
    return;
  }

  const selectedDate = new Date(state.selectedDayKey);
  selectedDateSummaryNode.textContent = formatDateLabel(selectedDate);
  slotsPanel.classList.remove("hidden-panel");
  slotsNode.classList.remove("empty");
  slotsNode.innerHTML = slots
    .map(
      (slot) => `
        <button class="time-option" type="button" data-start="${escapeHtml(slot.start)}" data-end="${escapeHtml(slot.end)}">
          ${formatTimeLabel(new Date(slot.start))} - ${formatTimeLabel(new Date(slot.end))}
        </button>`,
    )
    .join("");
}

async function loadSlots() {
  const { start, end } = getSlotsRange();
  refreshButton.disabled = true;
  setStatus("Ищем свободные даты...", "");

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
    state.slotsByDay = groupSlotsByDay(state.slots);
    state.selectedDayKey = null;
    state.selectedSlot = null;
    resetSelection(false);
    renderDates();
    setStatus("Доступные даты обновлены.", "success");
  } catch (error) {
    datesNode.classList.add("empty");
    datesNode.innerHTML = "<p>Не удалось загрузить даты.</p>";
    slotsPanel.classList.add("hidden-panel");
    setStatus(error.message, "error");
  } finally {
    refreshButton.disabled = false;
  }
}

function selectDate(dayKey) {
  state.selectedDayKey = dayKey;
  state.selectedSlot = null;
  formPanel.classList.add("hidden-panel");
  renderDates();
  renderSlotsForSelectedDate();
}

function selectSlot(start, end) {
  state.selectedSlot = { start, end };
  startInput.value = start;
  endInput.value = end;
  selectedSlotSummaryNode.textContent = `Вы выбрали ${formatDateTimeLabel(new Date(start))} - ${formatTimeLabel(new Date(end))}.`;
  formPanel.classList.remove("hidden-panel");
  formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getPositionValue() {
  return positionSelect.value === "Другое" ? customPositionInput.value.trim() : positionSelect.value;
}

function syncCustomPosition() {
  const isCustom = positionSelect.value === "Другое";
  customPositionField.classList.toggle("hidden-panel", !isCustom);
  customPositionInput.required = isCustom;
  if (!isCustom) {
    customPositionInput.value = "";
  }
}

function resetSelection(resetForm = true) {
  state.selectedSlot = null;
  startInput.value = "";
  endInput.value = "";
  if (resetForm) {
    form.reset();
    syncCustomPosition();
  }
  formPanel.classList.add("hidden-panel");
}

async function submitBooking(event) {
  event.preventDefault();
  if (!state.selectedSlot) {
    setStatus("Сначала выберите слот.", "error");
    return;
  }

  const position = getPositionValue();
  if (!position) {
    setStatus("Укажите должность.", "error");
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
        companyName: companyNameInput.value.trim(),
        position,
        comment: clientCommentInput.value.trim(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    resetSelection();
    await loadSlots();
    setStatus("Готово. Встреча создана в календаре, участник добавлен по указанному e-mail.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    bookButton.disabled = false;
  }
}

datesNode.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-day]");
  if (!button) {
    return;
  }

  selectDate(button.dataset.day);
});

slotsNode.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-start][data-end]");
  if (!button) {
    return;
  }

  selectSlot(button.dataset.start, button.dataset.end);
});

refreshButton.addEventListener("click", loadSlots);
changeDateButton.addEventListener("click", () => {
  state.selectedDayKey = null;
  slotsPanel.classList.add("hidden-panel");
  formPanel.classList.add("hidden-panel");
  renderDates();
});
cancelButton.addEventListener("click", resetSelection);
positionSelect.addEventListener("change", syncCustomPosition);
form.addEventListener("submit", submitBooking);

syncCustomPosition();
loadSlots();
