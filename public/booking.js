const datesNode = document.querySelector("#public-dates");
const calendarPanel = document.querySelector("#public-calendar-panel");
const calendarMonthLabelNode = document.querySelector("#calendar-month-label");
const calendarPrevButton = document.querySelector("#calendar-prev-button");
const calendarNextButton = document.querySelector("#calendar-next-button");
const slotsPanel = document.querySelector("#public-slots-panel");
const slotsNode = document.querySelector("#public-slots");
const statusNode = document.querySelector("#booking-status");
const selectedDateSummaryNode = document.querySelector("#selected-date-summary");
const selectedDatePanel = document.querySelector("#selected-date-panel");
const bookingTitleNode = document.querySelector("#booking-title");
const bookingWidget = document.querySelector(".smartm-widget");
const bookingShell = document.querySelector(".booking-shell");
const formPanel = document.querySelector("#booking-form-panel");
const form = document.querySelector("#booking-form");
const startInput = document.querySelector("#booking-start");
const endInput = document.querySelector("#booking-end");
const bookingWebsiteInput = document.querySelector("#booking-website");
const clientFormTitleNode = document.querySelector("#client-form-title");
const selectedSlotSummaryNode = document.querySelector("#selected-slot-summary");
const clientFirstNameInput = document.querySelector("#client-first-name");
const clientLastNameInput = document.querySelector("#client-last-name");
const clientEmailInput = document.querySelector("#client-email");
const clientPhoneCountryInput = document.querySelector("#client-phone-country");
const clientPhoneInput = document.querySelector("#client-phone");
const clientTelegramInput = document.querySelector("#client-telegram");
const telegramOptInNode = document.querySelector("#booking-telegram-opt-in");
const telegramReminderCheckbox = document.querySelector("#client-telegram-reminders");
const companyNameInput = document.querySelector("#company-name");
const positionSelect = document.querySelector("#client-position");
const customPositionInput = document.querySelector("#custom-position");
const additionalAttendeesInput = document.querySelector("#additional-attendees");
const clientCommentInput = document.querySelector("#client-comment");
const addCommentButton = document.querySelector("#add-comment-button");
const bookButton = document.querySelector("#book-slot-button");
const submitProxyButton = document.querySelector(".booking-submit-proxy");
const cancelButtons = [...document.querySelectorAll(".booking-cancel-button")];
const changeTimeButton = document.querySelector("#change-time-button");
const bookingSuccessModal = document.querySelector("#booking-success-modal");
const bookingSuccessBackdrop = document.querySelector("#booking-success-backdrop");
const bookingSuccessCloseButton = document.querySelector("#booking-success-close");
const bookingSuccessMessageNode = document.querySelector("#booking-success-message");
const bookingTelegramReminderNode = document.querySelector("#booking-telegram-reminder");
const bookingTelegramReminderLink = document.querySelector("#booking-telegram-reminder-link");
const stepIndicators = [...document.querySelectorAll("[data-step-indicator]")];
const urlParams = new URLSearchParams(window.location.search);
const isEmbedded = urlParams.get("embed") === "1";
const showSuccessPreview = urlParams.get("successPreview") === "1";

const state = {
  slots: [],
  slotsByDay: new Map(),
  selectedDayKey: null,
  selectedSlot: null,
  visibleMonthStart: null,
  isLoadingSlots: true,
  validationStarted: false,
  meetingRules: {
    workingDays: [1, 2, 3, 4, 5],
    allowSameDay: false,
  },
};

const PHONE_MASKS = {
  RU: { placeholder: "(999)-999-99-99", countryCode: "7", localLength: 10, trunkPrefix: "8", groups: [3, 3, 2, 2] },
  KZ: { placeholder: "(999)-999-99-99", countryCode: "7", localLength: 10, trunkPrefix: "8", groups: [3, 3, 2, 2] },
  BY: { placeholder: "(99)-999-99-99", countryCode: "375", localLength: 9, groups: [2, 3, 2, 2] },
  UZ: { placeholder: "(99)-999-99-99", countryCode: "998", localLength: 9, groups: [2, 3, 2, 2] },
  AM: { placeholder: "(99)-999-999", countryCode: "374", localLength: 8, groups: [2, 3, 3] },
};

const PHONE_COUNTRIES = {
  AF: "93", AL: "355", DZ: "213", AD: "376", AO: "244", AG: "1-268", AR: "54", AM: "374", AU: "61", AT: "43", AZ: "994",
  BS: "1-242", BH: "973", BD: "880", BB: "1-246", BY: "375", BE: "32", BZ: "501", BJ: "229", BT: "975", BO: "591", BA: "387",
  BW: "267", BR: "55", BN: "673", BG: "359", BF: "226", BI: "257", CV: "238", KH: "855", CM: "237", CA: "1", CF: "236",
  TD: "235", CL: "56", CN: "86", CO: "57", KM: "269", CG: "242", CD: "243", CR: "506", CI: "225", HR: "385", CU: "53",
  CY: "357", CZ: "420", DK: "45", DJ: "253", DM: "1-767", DO: "1-809", EC: "593", EG: "20", SV: "503", GQ: "240",
  ER: "291", EE: "372", SZ: "268", ET: "251", FJ: "679", FI: "358", FR: "33", GA: "241", GM: "220", GE: "995", DE: "49",
  GH: "233", GR: "30", GD: "1-473", GT: "502", GN: "224", GW: "245", GY: "592", HT: "509", HN: "504", HU: "36", IS: "354",
  IN: "91", ID: "62", IR: "98", IQ: "964", IE: "353", IL: "972", IT: "39", JM: "1-876", JP: "81", JO: "962", KZ: "7",
  KE: "254", KI: "686", KP: "850", KR: "82", KW: "965", KG: "996", LA: "856", LV: "371", LB: "961", LS: "266", LR: "231",
  LY: "218", LI: "423", LT: "370", LU: "352", MG: "261", MW: "265", MY: "60", MV: "960", ML: "223", MT: "356", MH: "692",
  MR: "222", MU: "230", MX: "52", FM: "691", MD: "373", MC: "377", MN: "976", ME: "382", MA: "212", MZ: "258", MM: "95",
  NA: "264", NR: "674", NP: "977", NL: "31", NZ: "64", NI: "505", NE: "227", NG: "234", MK: "389", NO: "47", OM: "968",
  PK: "92", PW: "680", PA: "507", PG: "675", PY: "595", PE: "51", PH: "63", PL: "48", PT: "351", QA: "974", RO: "40",
  RU: "7", RW: "250", KN: "1-869", LC: "1-758", VC: "1-784", WS: "685", SM: "378", ST: "239", SA: "966", SN: "221",
  RS: "381", SC: "248", SL: "232", SG: "65", SK: "421", SI: "386", SB: "677", SO: "252", ZA: "27", SS: "211", ES: "34",
  LK: "94", SD: "249", SR: "597", SE: "46", CH: "41", SY: "963", TJ: "992", TZ: "255", TH: "66", TL: "670", TG: "228",
  TO: "676", TT: "1-868", TN: "216", TR: "90", TM: "993", TV: "688", UG: "256", UA: "380", AE: "971", GB: "44", US: "1",
  UY: "598", UZ: "998", VU: "678", VA: "379", VE: "58", VN: "84", YE: "967", ZM: "260", ZW: "263", XK: "383", PS: "970", TW: "886",
};

const FIELD_ERRORS = {
  firstName: document.querySelector("#client-first-name-error"),
  lastName: document.querySelector("#client-last-name-error"),
  email: document.querySelector("#client-email-error"),
  phone: document.querySelector("#client-phone-error"),
  telegram: document.querySelector("#client-telegram-error"),
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

function clearBookingFormErrors() {
  document.querySelectorAll(".field.invalid").forEach((field) => field.classList.remove("invalid"));
  document.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
}

function validateAfterSubmit(validate) {
  if (!state.validationStarted) {
    return;
  }
  validate();
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
  const isValid = config.localLength
    ? digits.length === config.localLength
    : digits.length >= config.minLength && digits.length <= config.maxLength;
  const error = isValid ? "" : "Укажите корректный телефон.";
  setFieldState(clientPhoneInput, FIELD_ERRORS.phone, error);
  return !error;
}

function validateTelegramField() {
  const value = clientTelegramInput?.value.trim().replace(/^@+/, "") || "";
  const wantsReminders = Boolean(telegramReminderCheckbox?.checked);
  let error = "";
  if (wantsReminders && !value) {
    error = "Укажите Telegram username.";
  } else if (value && !/^[A-Za-z0-9_]{5,32}$/.test(value)) {
    error = "Укажите корректный Telegram username.";
  }
  if (clientTelegramInput) {
    setFieldState(clientTelegramInput, FIELD_ERRORS.telegram, error);
  }
  return !error;
}

function syncTelegramReminderOptInVisibility() {
  if (!telegramOptInNode || !telegramReminderCheckbox) {
    return;
  }
  telegramOptInNode.classList.remove("hidden-panel");
  requestAnimationFrame(notifyParentHeight);
}

function validatePositionField() {
  setFieldState(positionSelect, FIELD_ERRORS.position, "");
  positionSelect.closest(".field")?.classList.remove("invalid");
  return true;
}

function validateCustomPositionField() {
  if (positionSelect.value !== "Другое") {
    setFieldState(customPositionInput, FIELD_ERRORS.customPosition, "");
    return true;
  }
  return validateRequiredText(customPositionInput, FIELD_ERRORS.customPosition, "Укажите свою должность.");
}

function validateBookingForm() {
  state.validationStarted = true;
  const checks = [
    () => validateRequiredText(clientFirstNameInput, FIELD_ERRORS.firstName, "Укажите имя."),
    () => validateRequiredText(clientLastNameInput, FIELD_ERRORS.lastName, "Укажите фамилию."),
    validateEmailField,
    validatePhoneField,
    validateTelegramField,
    () => validateRequiredText(companyNameInput, FIELD_ERRORS.company, "Укажите наименование компании."),
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
  if (!statusNode) {
    return;
  }
  statusNode.textContent = message;
  statusNode.className = `status${kind ? ` ${kind}` : ""}`;
  notifyParentHeight();
}

function notifyParentHeight() {
  if (!isEmbedded || window.parent === window) {
    return;
  }
  const height = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight,
  );
  window.parent.postMessage({ type: "scrolltool-booking-resize", height }, "*");
}

function setBookingSuccessModal(open, message = "", options = {}) {
  if (!bookingSuccessModal) {
    return;
  }
  bookingSuccessModal.classList.toggle("hidden-panel", !open);
  bookingSuccessModal.setAttribute("aria-hidden", String(!open));
  document.body.classList.toggle("modal-open", open);
  if (open && bookingSuccessMessageNode && message) {
    bookingSuccessMessageNode.textContent = message;
  }
  const telegramReminderUrl = options.telegramReminderUrl || "";
  if (bookingTelegramReminderNode && bookingTelegramReminderLink) {
    bookingTelegramReminderNode.classList.toggle("hidden-panel", !open || !telegramReminderUrl);
    bookingTelegramReminderLink.href = telegramReminderUrl || "#";
  }
  requestAnimationFrame(notifyParentHeight);
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

function formatDatePanelTitle(date) {
  const formatted = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
}

function formatShortDateLabel(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatCalendarMonthLabel(date) {
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(date);
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getAvailableMonthBounds() {
  const { start, end } = getSlotsRange();
  const lastDay = new Date(end);
  lastDay.setDate(lastDay.getDate() - 1);
  return {
    min: startOfMonth(start),
    max: startOfMonth(lastDay),
  };
}

function clampMonthToBounds(monthStart, bounds) {
  const target = startOfMonth(monthStart || new Date());
  if (target < bounds.min) {
    return new Date(bounds.min);
  }
  if (target > bounds.max) {
    return new Date(bounds.max);
  }
  return target;
}

function hasAvailableSlotsInMonth(monthStart) {
  const month = startOfMonth(monthStart);
  return [...state.slotsByDay.keys()].some((dayKey) => {
    const day = new Date(dayKey);
    return day.getFullYear() === month.getFullYear() && day.getMonth() === month.getMonth();
  });
}

function getFirstAvailableDayInMonth(monthStart) {
  const month = startOfMonth(monthStart);
  return [...state.slotsByDay.keys()].find((dayKey) => {
    const day = new Date(dayKey);
    return day.getFullYear() === month.getFullYear() && day.getMonth() === month.getMonth();
  }) || null;
}

function getAvailableMonthInDirection(monthStart, direction, bounds) {
  let month = addMonths(monthStart, direction);
  while (month >= bounds.min && month <= bounds.max) {
    if (hasAvailableSlotsInMonth(month)) {
      return month;
    }
    month = addMonths(month, direction);
  }
  return null;
}

function formatCalendarNavigationLabel(date) {
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(date);
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function renderCalendarNavigationButton(button, targetMonth, direction) {
  if (!button) {
    return;
  }

  const isAvailable = Boolean(targetMonth);
  button.disabled = !isAvailable;
  button.classList.toggle("hidden-panel", !isAvailable);
  button.classList.toggle("is-previous", direction < 0);
  button.classList.toggle("is-next", direction > 0);
  if (!isAvailable) {
    return;
  }

  const label = formatCalendarNavigationLabel(targetMonth);
  button.setAttribute("aria-label", `${direction > 0 ? "Следующий" : "Предыдущий"} месяц: ${label}`);
  const labelNode = button.querySelector(".calendar-nav-label");
  if (labelNode) {
    labelNode.textContent = label;
  }
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

function formatSelectedSlotTitle(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateLabel = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(start);
  return `${dateLabel}, ${formatTimeLabel(start)} – ${formatTimeLabel(end)}`;
}

function getSlotsRange() {
  const start = toLocalDayStart(new Date());
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 21);
  return { start, end };
}

function normalizeMeetingRules(source = {}) {
  const workingDays = Array.isArray(source.workingDays)
    ? source.workingDays.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    : [1, 2, 3, 4, 5];

  return {
    workingDays: [...new Set(workingDays)].sort((left, right) => left - right),
    allowSameDay: Boolean(source.allowSameDay),
  };
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
  if (state.isLoadingSlots) {
    calendarPanel.classList.remove("hidden-panel");
    selectedDatePanel.classList.remove("hidden-panel");
    slotsPanel.classList.remove("hidden-panel");
    calendarPanel.setAttribute("aria-busy", "true");
    if (calendarMonthLabelNode) {
      calendarMonthLabelNode.textContent = "Загружаем даты";
    }
    selectedDateSummaryNode.textContent = "Ищем доступное время";
    datesNode.className = "calendar-grid calendar-grid-loading";
    datesNode.innerHTML = Array.from({ length: 35 }, () => '<span class="calendar-loading-cell" aria-hidden="true"></span>').join("");
    slotsNode.className = "time-grid time-grid-loading";
    slotsNode.innerHTML = '<span class="time-loading-cell" aria-hidden="true"></span><span class="time-loading-cell" aria-hidden="true"></span>';
    if (calendarPrevButton) {
      calendarPrevButton.disabled = true;
      calendarPrevButton.classList.add("hidden-panel");
    }
    if (calendarNextButton) {
      calendarNextButton.disabled = true;
      calendarNextButton.classList.add("hidden-panel");
    }
    return;
  }

  const bounds = getAvailableMonthBounds();
  if (!bounds) {
    state.visibleMonthStart = startOfMonth(new Date());
    datesNode.classList.add("empty");
    datesNode.innerHTML = "<p>Свободных дат пока нет. Попробуйте позже.</p>";
    calendarPanel.classList.remove("hidden-panel");
    selectedDatePanel.classList.add("hidden-panel");
    slotsPanel.classList.add("hidden-panel");
    formPanel.classList.add("hidden-panel");
    if (calendarMonthLabelNode) {
      calendarMonthLabelNode.textContent = formatCalendarMonthLabel(state.visibleMonthStart);
    }
    if (calendarPrevButton) {
      calendarPrevButton.disabled = true;
      calendarPrevButton.classList.add("hidden-panel");
    }
    if (calendarNextButton) {
      calendarNextButton.disabled = true;
      calendarNextButton.classList.add("hidden-panel");
    }
    renderSlotsForSelectedDate();
    return;
  }

  const preferredMonth = state.visibleMonthStart
    || (state.selectedDayKey ? startOfMonth(new Date(state.selectedDayKey)) : startOfMonth(new Date()));
  state.visibleMonthStart = clampMonthToBounds(preferredMonth, bounds);
  calendarPanel.removeAttribute("aria-busy");

  if (calendarMonthLabelNode) {
    calendarMonthLabelNode.textContent = formatCalendarMonthLabel(state.visibleMonthStart);
  }
  const previousAvailableMonth = getAvailableMonthInDirection(state.visibleMonthStart, -1, bounds);
  const nextAvailableMonth = getAvailableMonthInDirection(state.visibleMonthStart, 1, bounds);
  renderCalendarNavigationButton(calendarPrevButton, previousAvailableMonth, -1);
  renderCalendarNavigationButton(calendarNextButton, nextAvailableMonth, 1);

  const monthStart = state.visibleMonthStart;
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const availableDays = new Set(state.slotsByDay.keys());
  const todayStart = toLocalDayStart(new Date());
  const workingDays = new Set(state.meetingRules.workingDays);

  const html = [];
  const leadingEmptyCells = (monthStart.getDay() + 6) % 7;
  const calendarGridStart = new Date(monthStart);
  calendarGridStart.setDate(calendarGridStart.getDate() - leadingEmptyCells);
  const calendarGridEnd = new Date(monthEnd);
  calendarGridEnd.setDate(calendarGridEnd.getDate() + (6 - ((calendarGridEnd.getDay() + 6) % 7)));
  const visibleGridStart = new Date(calendarGridStart);

  // Keep the current week intact, but remove rows that ended before today.
  while (visibleGridStart <= calendarGridEnd) {
    const visibleWeekEnd = new Date(visibleGridStart);
    visibleWeekEnd.setDate(visibleWeekEnd.getDate() + 6);
    if (visibleWeekEnd >= todayStart) {
      break;
    }
    visibleGridStart.setDate(visibleGridStart.getDate() + 7);
  }

  for (const weekStart = new Date(visibleGridStart); weekStart <= calendarGridEnd; weekStart.setDate(weekStart.getDate() + 7)) {
    const weekDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      return date;
    });
    const hasAvailableSlot = weekDates.some((date) => (
      date.getMonth() === monthStart.getMonth()
      && availableDays.has(toLocalDayStart(date).toISOString())
    ));

    if (!hasAvailableSlot) {
      continue;
    }

    for (const cellDate of weekDates) {
      if (cellDate.getMonth() !== monthStart.getMonth()) {
        html.push('<span class="date-option-spacer" aria-hidden="true"></span>');
        continue;
      }
      const dayKey = toLocalDayStart(cellDate).toISOString();
      const isPastDisplayOnly = cellDate < todayStart;
      const isSameDayDisabled =
        !state.meetingRules.allowSameDay && cellDate.getTime() === todayStart.getTime();
      const isWeekdayDisabled = !workingDays.has(cellDate.getDay());
      const isAvailable = availableDays.has(dayKey);
      const isDisabledDisplayOnly = isPastDisplayOnly || isSameDayDisabled || isWeekdayDisabled;

      if (isDisabledDisplayOnly) {
        html.push(
          `<span class="date-option is-disabled" aria-hidden="true"><strong>${cellDate.getDate()}</strong></span>`,
        );
        continue;
      }

      const isSelected = state.selectedDayKey === dayKey;
      const classes = ["date-option"];
      if (isSelected) {
        classes.push("active");
      }
      if (isAvailable) {
        classes.push("has-slots");
      }

      html.push(
        `<button class="${classes.join(" ")}" type="button" data-day="${escapeHtml(dayKey)}" data-has-slots="${isAvailable ? "1" : "0"}"${isAvailable ? "" : " disabled"}><strong>${cellDate.getDate()}</strong></button>`,
      );
    }
  }

  if (!html.length) {
    datesNode.classList.add("empty");
    datesNode.innerHTML = "<p>Свободных дат в этом месяце нет.</p>";
    calendarPanel.classList.remove("hidden-panel");
    return;
  }

  datesNode.className = "calendar-grid";
  calendarPanel.classList.remove("hidden-panel");
  datesNode.innerHTML = html.join("");
}

function renderSlotsForSelectedDate() {
  if (!state.selectedDayKey) {
    selectedDateSummaryNode.textContent = "Выберите дату";
    selectedDatePanel.classList.remove("hidden-panel");
    slotsPanel.classList.remove("hidden-panel");
    slotsNode.classList.add("empty");
    slotsNode.innerHTML = "<p>Слоты появятся здесь после выбора даты в календаре.</p>";
    return;
  }

  const slots = state.slotsByDay.get(state.selectedDayKey) || [];
  const selectedDate = new Date(state.selectedDayKey);
  selectedDateSummaryNode.textContent = formatDatePanelTitle(selectedDate);
  selectedDatePanel.classList.remove("hidden-panel");
  slotsPanel.classList.remove("hidden-panel");

  if (!slots.length) {
    slotsNode.classList.add("empty");
    slotsNode.innerHTML = "<p>На эту дату свободных слотов нет. Выберите другой день.</p>";
    return;
  }

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
  state.isLoadingSlots = true;
  renderDates();
  setStatus("", "");

  try {
    const params = new URLSearchParams({
      rangeStartIso: start.toISOString(),
      rangeEndIso: end.toISOString(),
    });
    const payload = await apiRequest(`/api/public/slots?${params.toString()}`);
    state.slots = payload.slots || [];
    state.slotsByDay = groupSlotsByDay(state.slots);
    state.meetingRules = normalizeMeetingRules(payload.meetingRules || {});
    state.selectedDayKey = state.slots.length
      ? toLocalDayStart(new Date(state.slots[0].start)).toISOString()
      : null;
    state.visibleMonthStart = state.selectedDayKey
      ? startOfMonth(new Date(state.selectedDayKey))
      : null;
    state.selectedSlot = null;
    state.isLoadingSlots = false;
    resetSelection(false);
    setStep(state.selectedDayKey ? "time" : "date");
    renderDates();
    renderSlotsForSelectedDate();
  } catch (error) {
    state.isLoadingSlots = false;
    datesNode.classList.add("empty");
    calendarPanel.classList.remove("hidden-panel");
    datesNode.innerHTML = "<p>Не удалось загрузить даты.</p>";
    selectedDatePanel.classList.add("hidden-panel");
    slotsPanel.classList.add("hidden-panel");
    if (calendarPrevButton) {
      calendarPrevButton.disabled = true;
      calendarPrevButton.classList.add("hidden-panel");
    }
    if (calendarNextButton) {
      calendarNextButton.disabled = true;
      calendarNextButton.classList.add("hidden-panel");
    }
    setStatus(error.message, "error");
  }
}

function selectDate(dayKey) {
  state.selectedDayKey = dayKey;
  state.visibleMonthStart = startOfMonth(new Date(dayKey));
  state.selectedSlot = null;
  state.validationStarted = false;
  clearBookingFormErrors();
  formPanel.classList.add("hidden-panel");
  setStep("time");
  renderDates();
  renderSlotsForSelectedDate();
}

function selectSlot(start, end) {
  state.selectedSlot = { start, end };
  state.validationStarted = false;
  clearBookingFormErrors();
  startInput.value = start;
  endInput.value = end;
  slotsNode.querySelectorAll(".time-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.start === start && button.dataset.end === end);
  });
  if (clientFormTitleNode) {
    clientFormTitleNode.textContent = formatSelectedSlotTitle(start, end);
  }
  selectedSlotSummaryNode.textContent = "Заполните данные, чтобы назначить встречу и отправить приглашение.";
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

function getPhoneCountryName(countryCode) {
  try {
    return new Intl.DisplayNames(["ru"], { type: "region" }).of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

function populatePhoneCountries() {
  if (!clientPhoneCountryInput) {
    return;
  }

  const selectedCountry = clientPhoneCountryInput.value || "RU";
  const countryEntries = Object.entries(PHONE_COUNTRIES)
    .map(([countryCode, dialCode]) => ({ countryCode, dialCode, name: getPhoneCountryName(countryCode) }))
    .sort((first, second) => first.name.localeCompare(second.name, "ru"));
  const frequentCountries = new Set(["RU", "KZ", "BY", "UZ", "AM"]);
  const option = ({ countryCode, dialCode }) => (
    `<option value="${countryCode}" data-dial-code="${dialCode}">${escapeHtml(getPhoneCountryName(countryCode))} +${dialCode}</option>`
  );
  const frequentOptions = countryEntries.filter(({ countryCode }) => frequentCountries.has(countryCode)).map(option).join("");
  const allOptions = countryEntries.filter(({ countryCode }) => !frequentCountries.has(countryCode)).map(option).join("");

  clientPhoneCountryInput.innerHTML = `<optgroup label="Часто используемые">${frequentOptions}</optgroup><optgroup label="Все страны">${allOptions}</optgroup>`;
  clientPhoneCountryInput.value = PHONE_COUNTRIES[selectedCountry] ? selectedCountry : "RU";
}

function getPhoneMaskConfig() {
  const countryCode = clientPhoneCountryInput.value;
  if (PHONE_MASKS[countryCode]) {
    return PHONE_MASKS[countryCode];
  }

  const dialCode = clientPhoneCountryInput.selectedOptions[0]?.dataset.dialCode?.replace(/\D/g, "") || "";
  return {
    placeholder: "Номер телефона",
    countryCode: dialCode,
    minLength: 6,
    maxLength: Math.max(6, 15 - dialCode.length),
    groups: [],
  };
}

function extractDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePhoneDigits(value, config) {
  let digits = extractDigits(value);
  const maxLength = config.localLength || config.maxLength || 15;
  if (config.trunkPrefix && digits.startsWith(config.trunkPrefix) && digits.length > maxLength) {
    digits = digits.slice(1);
  }
  if (config.countryCode && digits.startsWith(config.countryCode) && digits.length > maxLength) {
    digits = digits.slice(config.countryCode.length);
  }
  return digits.slice(0, maxLength);
}

function formatPhoneDigits(digits, config) {
  if (!digits) {
    return "";
  }

  const groups = [];
  let cursor = 0;
  for (const size of config.groups || []) {
    if (cursor >= digits.length) {
      break;
    }
    groups.push(digits.slice(cursor, cursor + size));
    cursor += size;
  }

  if (!groups.length) {
    return digits;
  }

  const [firstGroup, ...restGroups] = groups;
  let formatted = `(${firstGroup}`;
  if (firstGroup.length === (config.groups?.[0] || firstGroup.length)) {
    formatted += ")";
  }

  if (!restGroups.length) {
    return formatted;
  }

  const joinedRest = restGroups.join("-");
  return joinedRest ? `${formatted}-${joinedRest}` : formatted;
}

function applyPhoneMask(rawValue = "") {
  const config = getPhoneMaskConfig();
  const digits = normalizePhoneDigits(rawValue || clientPhoneInput.value, config);
  clientPhoneInput.value = formatPhoneDigits(digits, config);
}

function syncPhoneMask() {
  const config = getPhoneMaskConfig();
  clientPhoneInput.placeholder = config.placeholder;
  applyPhoneMask(clientPhoneInput.value);
}

function getPhoneValueForSubmit() {
  const config = getPhoneMaskConfig();
  const localValue = clientPhoneInput.value.trim();
  if (!localValue) {
    return "";
  }
  return `+${config.countryCode} ${localValue}`;
}

function getPositionValue() {
  return positionSelect.value === "Другое" ? customPositionInput.value.trim() : positionSelect.value;
}

function syncCustomPosition() {
  const isCustom = positionSelect.value === "Другое";
  const customPositionField = document.querySelector("#custom-position-field");
  customPositionField?.classList.toggle("hidden-panel", !isCustom);
  customPositionInput.required = isCustom;
  if (isCustom) {
    customPositionInput.focus();
  } else {
    customPositionInput.value = "";
    setFieldState(customPositionInput, FIELD_ERRORS.customPosition, "");
  }
}

function setCommentFieldOpen(open) {
  if (!addCommentButton || !clientCommentInput) {
    return;
  }
  addCommentButton.classList.toggle("hidden-panel", open);
  clientCommentInput.classList.toggle("hidden-panel", !open);
  if (open) {
    clientCommentInput.focus();
  }
}

function resetSelection(resetForm = true) {
  state.selectedSlot = null;
  state.validationStarted = false;
  startInput.value = "";
  endInput.value = "";
  if (resetForm) {
    form.reset();
    syncCustomPosition();
    syncPhoneMask();
    setCommentFieldOpen(false);
    syncTelegramReminderOptInVisibility();
  }
  bookingWidget.classList.toggle("hidden-panel", Boolean(state.selectedSlot));
  formPanel.classList.add("hidden-panel");
  calendarPanel.classList.remove("hidden-panel");
  selectedDatePanel.classList.remove("hidden-panel");
  slotsPanel.classList.remove("hidden-panel");
  setStep(state.selectedDayKey ? "time" : "date");
  renderSlotsForSelectedDate();
}

function resetBookingFlow() {
  state.selectedDayKey = null;
  state.selectedSlot = null;
  state.validationStarted = false;
  startInput.value = "";
  endInput.value = "";
  form.reset();
  syncCustomPosition();
  syncPhoneMask();
  setCommentFieldOpen(false);
  clearBookingFormErrors();
  bookingWidget.classList.remove("hidden-panel");
  formPanel.classList.add("hidden-panel");
  selectedDatePanel.classList.remove("hidden-panel");
  slotsPanel.classList.remove("hidden-panel");
  calendarPanel.classList.remove("hidden-panel");
  setStatus("", "");
  setStep("date");
  renderDates();
  renderSlotsForSelectedDate();
}

function setSubmitButtonsDisabled(disabled) {
  bookButton.disabled = disabled;
  if (submitProxyButton) {
    submitProxyButton.disabled = disabled;
  }
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
  const clientTelegram = clientTelegramInput?.value.trim() || "";
  const telegramReminderRequested = Boolean(telegramReminderCheckbox?.checked);
  setSubmitButtonsDisabled(true);
  setStatus("Бронируем встречу...", "");

  try {
    const result = await apiRequest("/api/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: startInput.value,
        end: endInput.value,
        clientName: getClientFullName(),
        clientEmail: clientEmailInput.value.trim(),
        clientPhone: getPhoneValueForSubmit(),
        clientTelegram,
        telegramReminderRequested,
        companyName: companyNameInput.value.trim(),
        position,
        additionalAttendees: additionalAttendeesInput.value.trim(),
        comment: clientCommentInput.value.trim(),
        website: bookingWebsiteInput?.value || "",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    resetSelection();
    setStatus("", "");
    setBookingSuccessModal(true, "", {
      telegramReminderUrl: telegramReminderRequested ? result.telegramReminderUrl || "" : "",
    });
    loadSlots().catch((error) => {
      setStatus(error.message || "Не удалось обновить доступные слоты.", "error");
    });
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setSubmitButtonsDisabled(false);
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

if (calendarPrevButton) {
  calendarPrevButton.addEventListener("click", () => {
    const bounds = getAvailableMonthBounds();
    if (!bounds || !state.visibleMonthStart) {
      return;
    }
    const previousMonth = getAvailableMonthInDirection(state.visibleMonthStart, -1, bounds);
    if (!previousMonth) {
      return;
    }
    state.visibleMonthStart = previousMonth;
    state.selectedDayKey = getFirstAvailableDayInMonth(previousMonth);
    renderDates();
    renderSlotsForSelectedDate();
  });
}
if (calendarNextButton) {
  calendarNextButton.addEventListener("click", () => {
    const bounds = getAvailableMonthBounds();
    if (!bounds || !state.visibleMonthStart) {
      return;
    }
    const nextMonth = getAvailableMonthInDirection(state.visibleMonthStart, 1, bounds);
    if (!nextMonth) {
      return;
    }
    state.visibleMonthStart = nextMonth;
    state.selectedDayKey = getFirstAvailableDayInMonth(nextMonth);
    renderDates();
    renderSlotsForSelectedDate();
  });
}
changeTimeButton.addEventListener("click", () => {
  state.selectedSlot = null;
  state.validationStarted = false;
  startInput.value = "";
  endInput.value = "";
  clearBookingFormErrors();
  bookingWidget.classList.remove("hidden-panel");
  formPanel.classList.add("hidden-panel");
  calendarPanel.classList.remove("hidden-panel");
  slotsPanel.classList.remove("hidden-panel");
  selectedDatePanel.classList.remove("hidden-panel");
  setStep("time");
  renderDates();
  renderSlotsForSelectedDate();
});
cancelButtons.forEach((button) => {
  button.addEventListener("click", resetBookingFlow);
});
positionSelect.addEventListener("change", () => {
  syncCustomPosition();
  validateAfterSubmit(validateCustomPositionField);
});
clientPhoneCountryInput.addEventListener("change", () => {
  syncPhoneMask();
  validateAfterSubmit(validatePhoneField);
});
clientPhoneInput.addEventListener("input", () => {
  applyPhoneMask(clientPhoneInput.value);
  validateAfterSubmit(validatePhoneField);
});
if (clientTelegramInput) {
  clientTelegramInput.addEventListener("input", () => {
    syncTelegramReminderOptInVisibility();
    if (
      telegramReminderCheckbox?.checked
      || clientTelegramInput.closest(".field")?.classList.contains("invalid")
    ) {
      validateTelegramField();
      return;
    }
    validateAfterSubmit(validateTelegramField);
  });
  clientTelegramInput.addEventListener("blur", () => validateAfterSubmit(validateTelegramField));
}
if (telegramReminderCheckbox) {
  telegramReminderCheckbox.addEventListener("change", validateTelegramField);
}
syncTelegramReminderOptInVisibility();
clientFirstNameInput.addEventListener("blur", () => validateAfterSubmit(() => validateRequiredText(clientFirstNameInput, FIELD_ERRORS.firstName, "Укажите имя.")));
clientFirstNameInput.addEventListener("input", () => validateAfterSubmit(() => validateRequiredText(clientFirstNameInput, FIELD_ERRORS.firstName, "Укажите имя.")));
clientLastNameInput.addEventListener("blur", () => validateAfterSubmit(() => validateRequiredText(clientLastNameInput, FIELD_ERRORS.lastName, "Укажите фамилию.")));
clientLastNameInput.addEventListener("input", () => validateAfterSubmit(() => validateRequiredText(clientLastNameInput, FIELD_ERRORS.lastName, "Укажите фамилию.")));
clientEmailInput.addEventListener("input", () => validateAfterSubmit(validateEmailField));
clientEmailInput.addEventListener("blur", () => validateAfterSubmit(validateEmailField));
companyNameInput.addEventListener("input", () => validateAfterSubmit(() => validateRequiredText(companyNameInput, FIELD_ERRORS.company, "Укажите наименование компании.")));
companyNameInput.addEventListener("blur", () => validateAfterSubmit(() => validateRequiredText(companyNameInput, FIELD_ERRORS.company, "Укажите наименование компании.")));
customPositionInput.addEventListener("input", () => validateAfterSubmit(validateCustomPositionField));
customPositionInput.addEventListener("blur", () => validateAfterSubmit(validateCustomPositionField));
if (addCommentButton) {
  addCommentButton.addEventListener("click", () => setCommentFieldOpen(true));
}
form.addEventListener("submit", submitBooking);
if (bookingSuccessCloseButton) {
  bookingSuccessCloseButton.addEventListener("click", () => setBookingSuccessModal(false));
}
if (bookingSuccessBackdrop) {
  bookingSuccessBackdrop.addEventListener("click", () => setBookingSuccessModal(false));
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && bookingSuccessModal && !bookingSuccessModal.classList.contains("hidden-panel")) {
    setBookingSuccessModal(false);
  }
});

if (isEmbedded) {
  document.body.classList.add("embedded-booking");
}

populatePhoneCountries();
syncCustomPosition();
syncPhoneMask();
setStep("date");
if (showSuccessPreview) {
  setBookingSuccessModal(true);
}
loadSlots().finally(() => {
  if (showSuccessPreview) {
    setBookingSuccessModal(true);
  }
  notifyParentHeight();
});

window.addEventListener("load", notifyParentHeight);
window.addEventListener("resize", notifyParentHeight);
if (window.ResizeObserver) {
  const parentHeightObserver = new ResizeObserver(() => notifyParentHeight());
  parentHeightObserver.observe(document.body);
  parentHeightObserver.observe(document.documentElement);
  if (bookingShell) {
    parentHeightObserver.observe(bookingShell);
  }
}
if (window.MutationObserver) {
  new MutationObserver(() => notifyParentHeight()).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
}
