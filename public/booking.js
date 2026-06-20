const datesNode = document.querySelector("#public-dates");
const slotsPanel = document.querySelector("#public-slots-panel");
const slotsNode = document.querySelector("#public-slots");
const statusNode = document.querySelector("#booking-status");
const selectedDateSummaryNode = document.querySelector("#selected-date-summary");
const selectedDatePanel = document.querySelector("#selected-date-panel");
const refreshButton = document.querySelector("#refresh-slots-button");
const changeDateButton = document.querySelector("#change-date-button");
const bookingTitleNode = document.querySelector("#booking-title");
const bookingWidget = document.querySelector(".smartm-widget");
const formPanel = document.querySelector("#booking-form-panel");
const form = document.querySelector("#booking-form");
const startInput = document.querySelector("#booking-start");
const endInput = document.querySelector("#booking-end");
const selectedSlotSummaryNode = document.querySelector("#selected-slot-summary");
const clientFirstNameInput = document.querySelector("#client-first-name");
const clientLastNameInput = document.querySelector("#client-last-name");
const clientEmailInput = document.querySelector("#client-email");
const clientPhoneCountryInput = document.querySelector("#client-phone-country");
const clientPhoneInput = document.querySelector("#client-phone");
const companyNameInput = document.querySelector("#company-name");
const positionSelect = document.querySelector("#client-position");
const customPositionInput = document.querySelector("#custom-position");
const additionalAttendeesInput = document.querySelector("#additional-attendees");
const clientCommentInput = document.querySelector("#client-comment");
const bookButton = document.querySelector("#book-slot-button");
const changeTimeButton = document.querySelector("#change-time-button");
const stepIndicators = [...document.querySelectorAll("[data-step-indicator]")];

const state = {
  slots: [],
  slotsByDay: new Map(),
  selectedDayKey: null,
  selectedSlot: null,
};

const PHONE_MASKS = {
  RU: { placeholder: "+7 (999) 000-00-00", countryCode: "7", localLength: 10, trunkPrefix: "8" },
  KZ: { placeholder: "+7 (999) 000-00-00", countryCode: "7", localLength: 10, trunkPrefix: "8" },
  BY: { placeholder: "+375 (29) 000-00-00", countryCode: "375", localLength: 9 },
  UZ: { placeholder: "+998 (90) 000-00-00", countryCode: "998", localLength: 9 },
  AM: { placeholder: "+374 (10) 000-000", countryCode: "374", localLength: 8 },
};

const FIELD_ERRORS = {
  firstName: document.querySelector("#client-first-name-error"),
  lastName: document.querySelector("#client-last-name-error"),
  email: document.querySelector("#client-email-error"),
  phone: document.querySelector("#client-phone-error"),
  company: document.querySelector("#company-name-error"),
  position: document.querySelector("#client-position-error"),
  customPosition: document.querySelector("#custom-position-error"),
};


function setFieldState(input, errorNode, message = "") {
  const field = input.closest(".field");
  field?.classList.toggle("invalid", Boolean(message));
  if (errorNode) {
    errorNode.textContent = message;
  }
}

function validateRequiredText(input, errorNode, message) {
  const value = input.value.trim();
  const error = value ? "" : message;
  setFieldState(input, errorNode, error);
  return !error;
}

function validateEmailField() {
  const email = clientEmailInput.value.trim();
  let error = "";
  if (!email) {
    error = "Укажите e-mail.";
  } else if (!isValidEmail(email)) {
    error = "Укажите корректный e-mail.";
  }
  setFieldState(clientEmailInput, FIELD_ERRORS.email, error);
  return !error;
}

function validatePhoneField() {
  const config = getPhoneMaskConfig();
  const digits = normalizePhoneDigits(clientPhoneInput.value, config);
  const error = digits.length === config.localLength ? "" : "Укажите корректный телефон.";
  setFieldState(clientPhoneInput, FIELD_ERRORS.phone, error);
  return !error;
}

function validatePositionField() {
  const hasValue = Boolean(positionSelect.value);
  setFieldState(positionSelect, FIELD_ERRORS.position, "");
  positionSelect.closest(".field")?.classList.toggle("invalid", !hasValue);
  return hasValue;
}

function validateCustomPositionField() {
  if (positionSelect.value !== "Другое") {
    setFieldState(customPositionInput, FIELD_ERRORS.customPosition, "");
    return true;
  }
  return validateRequiredText(customPositionInput, FIELD_ERRORS.customPosition, "Укажите свою должность.");
}

function validateBookingForm() {
  const checks = [
    () => validateRequiredText(clientFirstNameInput, FIELD_ERRORS.firstName, "Укажите имя."),
    () => validateRequiredText(clientLastNameInput, FIELD_ERRORS.lastName, "Укажите фамилию."),
    validateEmailField,
    validatePhoneField,
    () => validateRequiredText(companyNameInput, FIELD_ERRORS.company, "Укажите наименование компании."),
    validatePositionField,
    validateCustomPositionField,
  ];

  let firstInvalid = null;
  for (const check of checks) {
    const valid = check();
    if (!valid && !firstInvalid) {
      firstInvalid = document.querySelector(".field.invalid input, .field.invalid select");
    }
  }

  if (firstInvalid) {
    firstInvalid.focus();
  }
  return !firstInvalid;
}

function setStatus(message, kind = "") {
  statusNode.textContent = message;
  statusNode.className = `status${kind ? ` ${kind}` : ""}`;
}

function setStep(stepName) {
  const order = ["date", "time", "details"];
  const activeIndex = order.indexOf(stepName);
  stepIndicators.forEach((indicator) => {
    const index = order.indexOf(indicator.dataset.stepIndicator);
    indicator.classList.toggle("active", index === activeIndex);
    indicator.classList.toggle("complete", index < activeIndex);
  });
  if (bookingTitleNode) {
    bookingTitleNode.textContent = stepName === "time"
      ? "Выберите время"
      : stepName === "details"
        ? "Введите ваши данные"
        : "Выберите дату";
  }
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
    selectedDatePanel.classList.add("hidden-panel");
    slotsPanel.classList.add("hidden-panel");
    formPanel.classList.add("hidden-panel");
    return;
  }

  datesNode.classList.remove("empty");
  datesNode.innerHTML = [...state.slotsByDay.entries()]
    .map(([dayKey, slots]) => {
      const date = new Date(dayKey);
      return `
        <button class="date-option" type="button" data-day="${escapeHtml(dayKey)}">
          <strong>${formatShortDateLabel(date)}</strong>
        </button>`;
    })
    .join("");
}

function renderSlotsForSelectedDate() {
  const slots = state.slotsByDay.get(state.selectedDayKey) || [];
  if (!state.selectedDayKey || !slots.length) {
    selectedDatePanel.classList.add("hidden-panel");
    slotsPanel.classList.add("hidden-panel");
    datesNode.classList.remove("hidden-panel");
    return;
  }

  const selectedDate = new Date(state.selectedDayKey);
  selectedDateSummaryNode.textContent = formatDateLabel(selectedDate);
  selectedDatePanel.classList.remove("hidden-panel");
  datesNode.classList.add("hidden-panel");
  slotsPanel.classList.remove("hidden-panel");
  slotsNode.classList.remove("empty");
  slotsNode.innerHTML = slots
    .map(
      (slot) => `
        <button class="time-option" type="button" data-start="${escapeHtml(slot.start)}" data-end="${escapeHtml(slot.end)}">
          <span>${formatTimeLabel(new Date(slot.start))} – ${formatTimeLabel(new Date(slot.end))}</span>
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
    setStep("date");
    renderDates();
    setStatus("Доступные даты обновлены.", "success");
  } catch (error) {
    datesNode.classList.add("empty");
    datesNode.classList.remove("hidden-panel");
    datesNode.innerHTML = "<p>Не удалось загрузить даты.</p>";
    selectedDatePanel.classList.add("hidden-panel");
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
  setStep("time");
  renderSlotsForSelectedDate();
}

function selectSlot(start, end) {
  state.selectedSlot = { start, end };
  startInput.value = start;
  endInput.value = end;
  slotsNode.querySelectorAll(".time-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.start === start && button.dataset.end === end);
  });
  selectedSlotSummaryNode.textContent = `Вы выбрали ${formatDateTimeLabel(new Date(start))} - ${formatTimeLabel(new Date(end))}.`;
  bookingWidget.classList.add("hidden-panel");
  formPanel.classList.remove("hidden-panel");
  setStep("details");
  formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());
}

function syncEmailValidity() {
  return validateEmailField();
}

function getClientFullName() {
  return [clientFirstNameInput.value.trim(), clientLastNameInput.value.trim()].filter(Boolean).join(" ");
}

function getPhoneMaskConfig() {
  return PHONE_MASKS[clientPhoneCountryInput.value] || PHONE_MASKS.RU;
}

function extractDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePhoneDigits(value, config) {
  let digits = extractDigits(value);
  if (config.trunkPrefix && digits.startsWith(config.trunkPrefix) && digits.length > config.localLength) {
    digits = digits.slice(1);
  }
  if (config.countryCode && digits.startsWith(config.countryCode) && digits.length > config.localLength) {
    digits = digits.slice(config.countryCode.length);
  }
  return digits.slice(0, config.localLength);
}

function applyPhoneMask(rawValue = "") {
  const config = getPhoneMaskConfig();
  const digits = normalizePhoneDigits(rawValue || clientPhoneInput.value, config);
  const placeholderChars = config.placeholder.split("");
  let digitIndex = 0;
  const masked = placeholderChars.map((char) => {
    if (!/\d/.test(char)) {
      return char;
    }
    if (digitIndex >= digits.length) {
      return "";
    }
    return digits[digitIndex++];
  }).join("");
  clientPhoneInput.value = masked;
}

function syncPhoneMask() {
  const config = getPhoneMaskConfig();
  clientPhoneInput.placeholder = config.placeholder;
  applyPhoneMask(clientPhoneInput.value);
}

function getPositionValue() {
  return positionSelect.value === "Другое" ? customPositionInput.value.trim() : positionSelect.value;
}

function syncCustomPosition() {
  const isCustom = positionSelect.value === "Другое";
  positionSelect.classList.toggle("hidden-panel", isCustom);
  customPositionInput.classList.toggle("hidden-panel", !isCustom);
  customPositionInput.required = isCustom;
  if (isCustom) {
    customPositionInput.focus();
  } else {
    customPositionInput.value = "";
    setFieldState(customPositionInput, FIELD_ERRORS.customPosition, "");
  }
}

function resetSelection(resetForm = true) {
  state.selectedSlot = null;
  startInput.value = "";
  endInput.value = "";
  if (resetForm) {
    form.reset();
    syncCustomPosition();
    syncPhoneMask();
  }
  bookingWidget.classList.toggle("hidden-panel", Boolean(state.selectedSlot));
  formPanel.classList.add("hidden-panel");
  datesNode.classList.toggle("hidden-panel", Boolean(state.selectedDayKey));
  selectedDatePanel.classList.toggle("hidden-panel", !state.selectedDayKey);
  slotsPanel.classList.toggle("hidden-panel", !state.selectedDayKey);
  setStep(state.selectedDayKey ? "time" : "date");
}

async function submitBooking(event) {
  event.preventDefault();
  if (!state.selectedSlot) {
    setStatus("Сначала выберите слот.", "error");
    return;
  }

  if (!validateBookingForm()) {
    setStatus("Проверьте обязательные поля формы.", "error");
    return;
  }

  const position = getPositionValue();
  bookButton.disabled = true;
  setStatus("Бронируем встречу...", "");

  try {
    await apiRequest("/api/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: startInput.value,
        end: endInput.value,
        clientName: getClientFullName(),
        clientEmail: clientEmailInput.value.trim(),
        clientPhone: clientPhoneInput.value.trim(),
        companyName: companyNameInput.value.trim(),
        position,
        additionalAttendees: additionalAttendeesInput.value.trim(),
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
changeTimeButton.addEventListener("click", () => {
  state.selectedSlot = null;
  startInput.value = "";
  endInput.value = "";
  bookingWidget.classList.remove("hidden-panel");
  formPanel.classList.add("hidden-panel");
  slotsPanel.classList.remove("hidden-panel");
  selectedDatePanel.classList.remove("hidden-panel");
  datesNode.classList.add("hidden-panel");
  setStep("time");
});
changeDateButton.addEventListener("click", () => {
  state.selectedDayKey = null;
  state.selectedSlot = null;
  bookingWidget.classList.remove("hidden-panel");
  selectedDatePanel.classList.add("hidden-panel");
  slotsPanel.classList.add("hidden-panel");
  datesNode.classList.remove("hidden-panel");
  formPanel.classList.add("hidden-panel");
  setStep("date");
  renderDates();
});
positionSelect.addEventListener("change", () => {
  syncCustomPosition();
  validatePositionField();
  validateCustomPositionField();
});
clientPhoneCountryInput.addEventListener("change", () => {
  syncPhoneMask();
  validatePhoneField();
});
clientPhoneInput.addEventListener("input", () => {
  applyPhoneMask(clientPhoneInput.value);
  validatePhoneField();
});
clientFirstNameInput.addEventListener("blur", () => validateRequiredText(clientFirstNameInput, FIELD_ERRORS.firstName, "Укажите имя."));
clientFirstNameInput.addEventListener("input", () => validateRequiredText(clientFirstNameInput, FIELD_ERRORS.firstName, "Укажите имя."));
clientLastNameInput.addEventListener("blur", () => validateRequiredText(clientLastNameInput, FIELD_ERRORS.lastName, "Укажите фамилию."));
clientLastNameInput.addEventListener("input", () => validateRequiredText(clientLastNameInput, FIELD_ERRORS.lastName, "Укажите фамилию."));
clientEmailInput.addEventListener("input", validateEmailField);
clientEmailInput.addEventListener("blur", validateEmailField);
companyNameInput.addEventListener("blur", () => validateRequiredText(companyNameInput, FIELD_ERRORS.company, "Укажите наименование компании."));
companyNameInput.addEventListener("input", () => validateRequiredText(companyNameInput, FIELD_ERRORS.company, "Укажите наименование компании."));
customPositionInput.addEventListener("input", validateCustomPositionField);
customPositionInput.addEventListener("blur", validateCustomPositionField);
form.addEventListener("submit", submitBooking);

syncCustomPosition();
syncPhoneMask();
setStep("date");
loadSlots();
