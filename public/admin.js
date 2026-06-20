const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const employeePriorityInput = document.querySelector("#employee-priority");
const employeeIdInput = document.querySelector("#employee-id");
const employeeNameInput = document.querySelector("#employee-name");
const employeePanelTitle = document.querySelector("#employee-panel-title");
const loginView = document.querySelector("#login-view");
const adminView = document.querySelector("#admin-view");
const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-button");
const loginStatusNode = document.querySelector("#login-status");
const adminUsernameInput = document.querySelector("#admin-username");
const adminPasswordInput = document.querySelector("#admin-password");
const logoutButton = document.querySelector("#logout-button");
const statusNode = document.querySelector("#status");
const summaryNode = document.querySelector("#summary");
const eventsSummaryNode = document.querySelector("#events-summary");
const meetingSummaryNode = document.querySelector("#meeting-summary");
const slotsNode = document.querySelector("#slots");
const meetingSlotsNode = document.querySelector("#meeting-slots");
const eventsNode = document.querySelector("#events");
const employeesListNode = document.querySelector("#employees-list");
const saveButton = document.querySelector("#save-button");
const checkButton = document.querySelector("#check-button");
const reloadCalendarsButton = document.querySelector("#reload-calendars-button");
const loadEventsButton = document.querySelector("#load-events-button");
const addEmployeeButton = document.querySelector("#add-employee-button");
const toggleEventFormButton = document.querySelector("#toggle-event-form-button");
const loadMeetingSlotsButton = document.querySelector("#load-meeting-slots-button");
const meetingEmployeeASelect = document.querySelector("#meeting-employee-a");
const meetingEmployeeBSelect = document.querySelector("#meeting-employee-b");
const meetingRulesPreviewNode = document.querySelector("#meeting-rules-preview");
const meetingRulesForm = document.querySelector("#meeting-rules-form");
const excludedDateInput = document.querySelector("#excluded-date-input");
const excludedDatesListNode = document.querySelector("#excluded-dates-list");
const addExcludedDateButton = document.querySelector("#add-excluded-date-button");
const allowedStartTimeInput = document.querySelector("#allowed-start-time");
const allowedEndTimeInput = document.querySelector("#allowed-end-time");
const eventFormPanel = document.querySelector("#event-form-panel");
const togglePasswordButton = document.querySelector("#toggle-password");
const togglePasswordLabel = document.querySelector(".toggle-label");
const credentialsForm = document.querySelector("#credentials-form");
const calendarSelect = document.querySelector("#calendar-select");
const eventForm = document.querySelector("#event-form");
const eventSubmitButton = document.querySelector("#event-submit-button");
const eventResetButton = document.querySelector("#event-reset-button");
const eventUrlInput = document.querySelector("#event-url");
const eventUidInput = document.querySelector("#event-uid");
const eventEtagInput = document.querySelector("#event-etag");
const eventSummaryInput = document.querySelector("#event-summary");
const eventStartInput = document.querySelector("#event-start");
const eventEndInput = document.querySelector("#event-end");
const eventLocationInput = document.querySelector("#event-location");
const eventDescriptionInput = document.querySelector("#event-description");
const embedCodeInput = document.querySelector("#embed-code");
const copyEmbedCodeButton = document.querySelector("#copy-embed-code-button");
const tabButtons = [...document.querySelectorAll(".tab-button")];
const tabPanels = [...document.querySelectorAll("[data-tab-panel]")];

const EMBED_CODE = String.raw`<div class="scrolltool-demo-widget">
  <style>
    .scrolltool-demo-widget{max-width:760px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:12px;background:#fff;color:#18181b;font-family:Inter,"Segoe UI",Arial,sans-serif;box-shadow:0 10px 26px rgba(24,24,27,.08)}
    .scrolltool-demo-widget *{box-sizing:border-box}
    .scrolltool-demo-widget h2{margin:0 0 8px;font-size:26px;line-height:1.15}
    .scrolltool-demo-widget h3{margin:0 0 10px;font-size:18px}
    .scrolltool-demo-widget p{margin:0;color:#71717a;line-height:1.5}
    .scrolltool-demo-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}
    .scrolltool-demo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:10px;margin-top:16px}
    .scrolltool-demo-times{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}
    .scrolltool-demo-date,.scrolltool-demo-time,.scrolltool-demo-button,.scrolltool-demo-secondary{min-height:42px;border:1px solid #e4e4e7;border-radius:8px;padding:10px 12px;background:#fff;color:#18181b;font:inherit;font-weight:700;cursor:pointer;text-align:left}
    .scrolltool-demo-date span{display:block;margin-top:4px;color:#71717a;font-size:12px}
    .scrolltool-demo-date.is-active,.scrolltool-demo-date:hover,.scrolltool-demo-time:hover{border-color:rgba(20,83,45,.28);background:#ecf7f0;color:#14532d}
    .scrolltool-demo-button{background:#18181b;color:#fafafa;text-align:center}
    .scrolltool-demo-secondary{text-align:center;background:#f4f4f2}
    .scrolltool-demo-form{display:grid;gap:12px;margin-top:18px}
    .scrolltool-demo-split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .scrolltool-demo-field{display:grid;gap:7px}
    .scrolltool-demo-field span{font-size:13px;font-weight:700}
    .scrolltool-demo-field input,.scrolltool-demo-field select,.scrolltool-demo-field textarea{width:100%;min-height:42px;border:1px solid #dedee3;border-radius:8px;padding:10px 12px;font:inherit}
    .scrolltool-demo-field textarea{min-height:92px;resize:vertical}
    .scrolltool-demo-status{display:none;margin:14px 0 0;padding:12px 14px;border:1px solid #e4e4e7;border-radius:8px;background:#f4f4f2;color:#71717a}
    .scrolltool-demo-status.is-visible{display:block}
    .scrolltool-demo-status.is-success{border-color:rgba(20,83,45,.18);background:#ecf7f0;color:#14532d}
    .scrolltool-demo-status.is-error{border-color:rgba(185,28,28,.2);background:#fef2f2;color:#b91c1c}
    .scrolltool-demo-hidden{display:none!important}
    @media(max-width:640px){.scrolltool-demo-widget{padding:18px}.scrolltool-demo-head,.scrolltool-demo-split{display:grid;grid-template-columns:1fr}}
  </style>
  <div class="scrolltool-demo-head">
    <div>
      <h2>Выберите время для демо Scrolltool</h2>
      <p data-summary>Сначала выберите дату, затем удобное время.</p>
    </div>
    <button class="scrolltool-demo-secondary" type="button" data-refresh>Обновить</button>
  </div>
  <div class="scrolltool-demo-status" data-status></div>
  <div class="scrolltool-demo-grid" data-dates><p>Загружаем даты...</p></div>
  <div class="scrolltool-demo-hidden" data-time-panel>
    <h3 data-date-title></h3>
    <div class="scrolltool-demo-times" data-times></div>
  </div>
  <form class="scrolltool-demo-form scrolltool-demo-hidden" data-form>
    <p data-slot-title></p>
    <div class="scrolltool-demo-split">
      <label class="scrolltool-demo-field"><span>Имя</span><input data-name autocomplete="name" required></label>
      <label class="scrolltool-demo-field"><span>E-mail</span><input data-email type="email" autocomplete="email" required></label>
    </div>
    <div class="scrolltool-demo-split">
      <label class="scrolltool-demo-field"><span>Телефон</span><input data-phone type="tel" autocomplete="tel" required></label>
      <label class="scrolltool-demo-field"><span>Наименование компании</span><input data-company autocomplete="organization" required></label>
    </div>
    <div class="scrolltool-demo-split">
      <label class="scrolltool-demo-field"><span>Должность</span><select data-position required><option value="">Выберите должность</option><option>Разработчик курсов</option><option>Методист онлайн-курсов</option><option>Бизнес-тренер</option><option>Руководитель обучения</option><option>HR-директор</option><option>Другое</option></select></label>
      <label class="scrolltool-demo-field scrolltool-demo-hidden" data-custom-wrap><span>Своя должность</span><input data-custom-position></label>
    </div>
    <label class="scrolltool-demo-field"><span>Комментарий</span><textarea data-comment placeholder="Что хотите обсудить на демо"></textarea></label>
    <button class="scrolltool-demo-button" type="submit" data-submit>Забронировать демо</button>
  </form>
  <script>
  (function(){
    var root=document.currentScript.closest('.scrolltool-demo-widget');
    var SLOTS_ENDPOINT='https://meet.scroll-tool.ru/api/public/slots';
    var BOOKINGS_ENDPOINT='https://meet.scroll-tool.ru/api/public/bookings';
    var state={slots:[],byDay:new Map(),day:null,slot:null};
    var dates=root.querySelector('[data-dates]');
    var times=root.querySelector('[data-times]');
    var timePanel=root.querySelector('[data-time-panel]');
    var form=root.querySelector('[data-form]');
    var status=root.querySelector('[data-status]');
    var refresh=root.querySelector('[data-refresh]');
    var position=root.querySelector('[data-position]');
    var customWrap=root.querySelector('[data-custom-wrap]');
    var customPosition=root.querySelector('[data-custom-position]');
    function esc(value){return String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;")}
    function dayStart(date){return new Date(date.getFullYear(),date.getMonth(),date.getDate())}
    function fmtDate(date){return new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(date)}
    function fmtShort(date){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(date)}
    function fmtTime(date){return new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(date)}
    function setStatus(text,kind){status.textContent=text;status.className='scrolltool-demo-status'+(text?' is-visible':'')+(kind?' is-'+kind:'')}
    function range(){var start=dayStart(new Date());var end=new Date(start);end.setDate(end.getDate()+7);return{start:start,end:end}}
    function group(slots){var map=new Map();slots.forEach(function(slot){var key=dayStart(new Date(slot.start)).toISOString();if(!map.has(key))map.set(key,[]);map.get(key).push(slot)});return map}
    function renderDates(){if(!state.byDay.size){dates.innerHTML='<p>Свободных дат пока нет.</p>';return}dates.innerHTML=Array.from(state.byDay.entries()).map(function(item){var key=item[0],list=item[1],date=new Date(key);return '<button class="scrolltool-demo-date'+(key===state.day?' is-active':'')+'" type="button" data-day="'+esc(key)+'"><strong>'+fmtShort(date)+'</strong><span>'+list.length+' слотов</span></button>'}).join('')}
    function renderTimes(){var list=state.byDay.get(state.day)||[];root.querySelector('[data-date-title]').textContent=fmtDate(new Date(state.day));times.innerHTML=list.map(function(slot){return '<button class="scrolltool-demo-time" type="button" data-start="'+esc(slot.start)+'" data-end="'+esc(slot.end)+'">'+fmtTime(new Date(slot.start))+' - '+fmtTime(new Date(slot.end))+'</button>'}).join('');timePanel.classList.remove('scrolltool-demo-hidden')}
    function load(){var r=range();refresh.disabled=true;setStatus('Загружаем свободные даты...','');var params=new URLSearchParams({rangeStartIso:r.start.toISOString(),rangeEndIso:r.end.toISOString(),allowedStartTime:'09:00',allowedEndTime:'18:00',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});return fetch(SLOTS_ENDPOINT+'?'+params.toString()).then(function(res){return res.json().then(function(data){if(!res.ok)throw new Error(data.error||'Ошибка запроса.');return data})}).then(function(data){state.slots=data.slots||[];state.byDay=group(state.slots);state.day=null;state.slot=null;timePanel.classList.add('scrolltool-demo-hidden');form.classList.add('scrolltool-demo-hidden');renderDates();setStatus('Даты обновлены.','success')}).catch(function(error){dates.innerHTML='<p>Не удалось загрузить даты.</p>';setStatus(error.message,'error')}).finally(function(){refresh.disabled=false})}
    function syncCustom(){var custom=position.value==='Другое';customWrap.classList.toggle('scrolltool-demo-hidden',!custom);customPosition.required=custom;if(!custom)customPosition.value=''}
    dates.addEventListener('click',function(event){var button=event.target.closest('[data-day]');if(!button)return;state.day=button.dataset.day;state.slot=null;form.classList.add('scrolltool-demo-hidden');renderDates();renderTimes()});
    times.addEventListener('click',function(event){var button=event.target.closest('[data-start][data-end]');if(!button)return;state.slot={start:button.dataset.start,end:button.dataset.end};root.querySelector('[data-slot-title]').textContent='Вы выбрали '+fmtDate(new Date(state.day))+', '+fmtTime(new Date(state.slot.start))+' - '+fmtTime(new Date(state.slot.end));form.classList.remove('scrolltool-demo-hidden')});
    position.addEventListener('change',syncCustom);
    refresh.addEventListener('click',load);
    form.addEventListener('submit',function(event){event.preventDefault();if(!state.slot){setStatus('Сначала выберите время.','error');return}var finalPosition=position.value==='Другое'?customPosition.value.trim():position.value;if(!finalPosition){setStatus('Укажите должность.','error');return}var submit=root.querySelector('[data-submit]');submit.disabled=true;setStatus('Бронируем встречу...','');fetch(BOOKINGS_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({start:state.slot.start,end:state.slot.end,clientName:root.querySelector('[data-name]').value.trim(),clientEmail:root.querySelector('[data-email]').value.trim(),clientPhone:root.querySelector('[data-phone]').value.trim(),companyName:root.querySelector('[data-company]').value.trim(),position:finalPosition,comment:root.querySelector('[data-comment]').value.trim(),timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone})}).then(function(res){return res.json().then(function(data){if(!res.ok)throw new Error(data.error||'Ошибка бронирования.');return data})}).then(function(){form.reset();syncCustom();form.classList.add('scrolltool-demo-hidden');return load().then(function(){setStatus('Готово. Встреча создана в календаре.','success')})}).catch(function(error){setStatus(error.message,'error')}).finally(function(){submit.disabled=false})});
    syncCustom();load();
  })();
  </script>
</div>`;

const state = {
  employees: [],
  activeEmployeeId: null,
  calendars: [],
  events: [],
  eventsRangeStart: null,
  eventsRangeEnd: null,
  eventFormVisible: false,
  sharedMeetingSlots: [],
  meetingRules: {
    excludedDates: [],
    allowedStartTime: "09:00",
    allowedEndTime: "18:00",
  },
};

function setStatus(message, kind = "") {
  statusNode.textContent = message;
  statusNode.className = `status${kind ? ` ${kind}` : ""}`;
}

function setLoginStatus(message, kind = "") {
  loginStatusNode.textContent = message;
  loginStatusNode.className = `status${kind ? ` ${kind}` : ""}`;
}

function setAdminVisible(visible) {
  loginView.classList.toggle("hidden-panel", visible);
  adminView.classList.toggle("hidden-panel", !visible);
}

function renderEmbedCode() {
  if (embedCodeInput) {
    embedCodeInput.value = EMBED_CODE;
  }
}

async function copyEmbedCode() {
  if (!embedCodeInput) {
    return;
  }

  embedCodeInput.select();
  try {
    await navigator.clipboard.writeText(embedCodeInput.value);
    setStatus("Код для сайта скопирован.", "success");
  } catch {
    document.execCommand("copy");
    setStatus("Код для сайта скопирован.", "success");
  }
}

function getActiveEmployee() {
  return (
    state.employees.find((employee) => employee.id === state.activeEmployeeId) ||
    state.employees[0] ||
    null
  );
}

function switchTab(tabName) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
  });
}

function renderEmployees() {
  if (!state.employees.length) {
    employeesListNode.classList.add("empty");
    employeesListNode.innerHTML = "<p>Сотрудников пока нет.</p>";
    return;
  }

  employeesListNode.classList.remove("empty");
  employeesListNode.innerHTML = state.employees
    .map(
      (employee) => `
        <article class="employee-card${employee.id === state.activeEmployeeId ? " active" : ""}">
          <div class="employee-card-head">
            <div>
              <strong>${escapeHtml(employee.name)}</strong>
              <p>${escapeHtml(employee.email)}</p>
              <p>Приоритет: ${escapeHtml(employee.priority || 100)}</p>
            </div>
            ${employee.id === state.activeEmployeeId ? '<span class="employee-badge">Активный</span>' : ""}
          </div>
          <div class="employee-card-actions">
            <button class="ghost-button" type="button" data-action="select-employee" data-id="${escapeHtml(employee.id)}">
              Открыть
            </button>
            <button class="secondary-button danger-button" type="button" data-action="delete-employee" data-id="${escapeHtml(employee.id)}">
              Удалить
            </button>
          </div>
        </article>`,
    )
    .join("");
}

function renderMeetingEmployeeSelectors() {
  if (!state.employees.length) {
    meetingEmployeeASelect.innerHTML = '<option value="">Сотрудник не выбран</option>';
    meetingEmployeeBSelect.innerHTML = '<option value="">Сотрудник не выбран</option>';
    return;
  }

  const previousA = meetingEmployeeASelect.value;
  const previousB = meetingEmployeeBSelect.value;
  const options = state.employees
    .map(
      (employee) =>
        `<option value="${escapeHtml(employee.id)}">${escapeHtml(employee.name)} · ${escapeHtml(employee.email)}</option>`,
    )
    .join("");

  meetingEmployeeASelect.innerHTML = options;
  meetingEmployeeBSelect.innerHTML = options;

  meetingEmployeeASelect.value =
    state.employees.some((employee) => employee.id === previousA) ? previousA : state.employees[0]?.id || "";
  meetingEmployeeBSelect.value =
    state.employees.some((employee) => employee.id === previousB)
      ? previousB
      : state.employees[1]?.id || state.employees[0]?.id || "";
}

function renderExcludedDates() {
  if (!state.meetingRules.excludedDates.length) {
    excludedDatesListNode.classList.add("empty");
    excludedDatesListNode.innerHTML = "<p>Исключённых дат пока нет.</p>";
    return;
  }

  excludedDatesListNode.classList.remove("empty");
  excludedDatesListNode.innerHTML = state.meetingRules.excludedDates
    .map(
      (date) => `
        <div class="rule-chip">
          <span>${escapeHtml(date)}</span>
          <button class="ghost-button" type="button" data-action="remove-excluded-date" data-date="${escapeHtml(date)}">Убрать</button>
        </div>`,
    )
    .join("");
}

function renderMeetingRulesPreview() {
  const excludedDatesText = state.meetingRules.excludedDates.length
    ? `Исключены даты: ${state.meetingRules.excludedDates.join(", ")}.`
    : "Исключённых дат нет.";
  meetingRulesPreviewNode.innerHTML = `<p>${excludedDatesText} Разрешённое время: ${escapeHtml(state.meetingRules.allowedStartTime)}-${escapeHtml(state.meetingRules.allowedEndTime)}.</p>`;
}

function fillEmployeeForm(employee = null) {
  const activeEmployee = employee || getActiveEmployee();

  if (!activeEmployee) {
    employeeIdInput.value = "";
    employeeNameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";
    employeePriorityInput.value = "100";
    employeePanelTitle.textContent = "Новый сотрудник";
    return;
  }

  employeeIdInput.value = activeEmployee.id;
  employeeNameInput.value = activeEmployee.name;
  emailInput.value = activeEmployee.email;
  passwordInput.value = activeEmployee.password;
  employeePriorityInput.value = activeEmployee.priority || 100;
  employeePanelTitle.textContent = activeEmployee.name;
}

function startNewEmployee() {
  employeeIdInput.value = "";
  employeeNameInput.value = "";
  emailInput.value = "";
  passwordInput.value = "";
  employeePriorityInput.value = "100";
  employeePanelTitle.textContent = "Новый сотрудник";
}

function applyEmployeesConfig(config) {
  state.employees = config.employees || [];
  state.activeEmployeeId =
    config.activeEmployeeId || state.employees[0]?.id || null;
  renderEmployees();
  renderMeetingEmployeeSelectors();
  fillEmployeeForm();
}

function setEventFormVisibility(visible) {
  state.eventFormVisible = visible;
  eventFormPanel.classList.toggle("hidden-panel", !visible);
  toggleEventFormButton.textContent = visible ? "Скрыть форму встреч" : "Показать форму встреч";
}

function toLocalDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDayEnd(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
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
    year: "numeric",
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

function formatInterval(start, end) {
  const isMidnightEnd =
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getTime() > start.getTime();

  return `${formatTimeLabel(start)} - ${isMidnightEnd ? "24:00" : formatTimeLabel(end)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toDateTimeLocalValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value) {
  return new Date(value).toISOString();
}

function getDefaultEventsRange() {
  const start = toLocalDayStart(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return { start, end };
}

function buildFreeSlots(busyIntervals, rangeStart, rangeEnd) {
  const busy = busyIntervals
    .map((interval) => ({
      start: new Date(interval.start),
      end: new Date(interval.end),
    }))
    .sort((left, right) => left.start - right.start);

  const days = [];

  for (let cursor = toLocalDayStart(rangeStart); cursor < rangeEnd; cursor = toLocalDayEnd(cursor)) {
    const dayStart = new Date(cursor);
    const dayEnd = toLocalDayEnd(dayStart);
    const dayBusy = busy
      .map((interval) => ({
        start: new Date(Math.max(interval.start.getTime(), dayStart.getTime())),
        end: new Date(Math.min(interval.end.getTime(), dayEnd.getTime())),
      }))
      .filter((interval) => interval.end > interval.start);

    const free = [];
    let freeStart = new Date(dayStart);

    for (const interval of dayBusy) {
      if (interval.start > freeStart) {
        free.push({ start: new Date(freeStart), end: new Date(interval.start) });
      }
      if (interval.end > freeStart) {
        freeStart = new Date(interval.end);
      }
    }

    if (freeStart < dayEnd) {
      free.push({ start: freeStart, end: dayEnd });
    }

    days.push({ date: new Date(dayStart), free });
  }

  return days;
}

function groupEventsByDay(events, rangeStart, rangeEnd) {
  const buckets = new Map();

  for (let cursor = toLocalDayStart(rangeStart); cursor < rangeEnd; cursor = toLocalDayEnd(cursor)) {
    buckets.set(toLocalDayStart(cursor).toISOString(), []);
  }

  for (const event of events) {
    const eventStart = new Date(event.start);
    const dayKey = toLocalDayStart(eventStart).toISOString();
    if (!buckets.has(dayKey)) {
      buckets.set(dayKey, []);
    }
    buckets.get(dayKey).push(event);
  }

  return buckets;
}

function renderSlots(result, rangeStart, rangeEnd) {
  const days = buildFreeSlots(result.busy, rangeStart, rangeEnd);
  const eventsByDay = groupEventsByDay(result.events, rangeStart, rangeEnd);

  summaryNode.textContent = `Проверено календарей: ${result.calendars.length}. Найдено событий: ${result.events.length}. Свободные окна считаются как интервалы без busy-слотов.`;

  const html = days
    .map((day) => {
      const dayKey = toLocalDayStart(day.date).toISOString();
      const dayEvents = eventsByDay.get(dayKey) || [];
      const freeList = day.free.length
        ? `<ul class="slot-list">${day.free
            .map((slot) => `<li class="slot-item"><strong>${formatInterval(slot.start, slot.end)}</strong><span>свободно</span></li>`)
            .join("")}</ul>`
        : "<p>Свободных окон нет.</p>";

      const eventList = dayEvents.length
        ? `<div class="day-grid"><h4>Занятые события</h4><ul class="event-list">${dayEvents
            .map((event) => `<li class="event-item"><strong>${escapeHtml(event.summary)}</strong><span class="event-meta">${event.isAllDay ? "весь день" : formatInterval(new Date(event.start), new Date(event.end))} · ${escapeHtml(event.calendarName)}</span></li>`)
            .join("")}</ul></div>`
        : "";

      return `<article class="day-card"><h3>${formatDateLabel(day.date)}</h3>${freeList}${eventList}</article>`;
    })
    .join("");

  slotsNode.classList.remove("empty");
  slotsNode.innerHTML = html;
}

function renderSharedMeetingSlots(slots, employeeNames, rangeStart, rangeEnd) {
  if (!slots.length) {
    meetingSlotsNode.classList.add("empty");
    meetingSlotsNode.innerHTML = "<p>Общих слотов на ближайшие 3 дня не найдено.</p>";
    meetingSummaryNode.textContent = `Проверены сотрудники: ${employeeNames.join(" и ")}. Общих слотов нет.`;
    return;
  }

  const buckets = new Map();
  for (let cursor = toLocalDayStart(rangeStart); cursor < rangeEnd; cursor = toLocalDayEnd(cursor)) {
    buckets.set(toLocalDayStart(cursor).toISOString(), []);
  }

  for (const slot of slots) {
    const dayKey = toLocalDayStart(new Date(slot.start)).toISOString();
    if (!buckets.has(dayKey)) {
      buckets.set(dayKey, []);
    }
    buckets.get(dayKey).push(slot);
  }

  meetingSummaryNode.textContent = `Проверены сотрудники: ${employeeNames.join(" и ")}. Длительность слота 1 час, шаг между стартами 1 час 30 минут, горизонт 3 дня, действуют ограничения по датам и времени.`;
  meetingSlotsNode.classList.remove("empty");
  meetingSlotsNode.innerHTML = [...buckets.entries()]
    .map(([dayKey, daySlots]) => {
      const dayDate = new Date(dayKey);
      const list = daySlots.length
        ? `<ul class="slot-list">${daySlots
            .map(
              (slot) => `<li class="slot-item"><strong>${formatInterval(new Date(slot.start), new Date(slot.end))}</strong><span>оба свободны</span></li>`,
            )
            .join("")}</ul>`
        : "<p>Нет общих слотов.</p>";

      return `<article class="day-card"><h3>${formatDateLabel(dayDate)}</h3>${list}</article>`;
    })
    .join("");
}

function renderCalendars() {
  if (!state.calendars.length) {
    calendarSelect.innerHTML = '<option value="">Календари не найдены</option>';
    return;
  }

  const previousValue = calendarSelect.value;
  calendarSelect.innerHTML = state.calendars
    .map((calendar) => `<option value="${escapeHtml(calendar.url)}">${escapeHtml(calendar.name)}</option>`)
    .join("");

  if (state.calendars.some((calendar) => calendar.url === previousValue)) {
    calendarSelect.value = previousValue;
  }
}

function renderEvents() {
  if (!state.events.length) {
    eventsNode.classList.add("empty");
    eventsNode.innerHTML = "<p>В выбранном диапазоне событий нет.</p>";
    eventsSummaryNode.textContent = "Диапазон событий загружен, но список пуст.";
    return;
  }

  const recurringCount = state.events.filter((event) => event.isRecurring).length;
  eventsNode.classList.remove("empty");
  eventsSummaryNode.textContent = `Загружено событий: ${state.events.length}. Повторяющихся инстансов: ${recurringCount}. Показан диапазон на 30 дней вперёд.`;
  eventsNode.innerHTML = `<ul class="event-list full">${state.events
    .map(
      (event, index) => `
        <li class="event-row">
          <div class="event-content">
            <div class="event-title-row">
              <strong>${escapeHtml(event.summary)}</strong>
              ${event.isRecurring ? '<span class="event-badge">Экземпляр серии</span>' : ""}
            </div>
            <span class="event-meta">${formatDateTimeLabel(new Date(event.start))} - ${formatDateTimeLabel(new Date(event.end))}</span>
            <span class="event-meta">${escapeHtml(event.calendarName)}${event.location ? ` · ${escapeHtml(event.location)}` : ""}</span>
            ${event.recurrenceId ? `<span class="event-meta">RECURRENCE-ID: ${escapeHtml(event.recurrenceId)}</span>` : ""}
            ${event.description ? `<p class="event-description">${escapeHtml(event.description)}</p>` : ""}
          </div>
          <div class="event-actions">
            <button class="ghost-button" type="button" data-action="edit-event" data-index="${index}">Редактировать</button>
            <button class="secondary-button danger-button" type="button" data-action="delete-event" data-index="${index}">Удалить</button>
          </div>
        </li>`,
    )
    .join("")}</ul>`;
}

function resetEventForm() {
  eventUrlInput.value = "";
  eventUidInput.value = "";
  eventEtagInput.value = "";
  eventSummaryInput.value = "";
  eventLocationInput.value = "";
  eventDescriptionInput.value = "";

  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  eventStartInput.value = toDateTimeLocalValue(start);
  eventEndInput.value = toDateTimeLocalValue(end);
  eventSubmitButton.textContent = "Создать событие";
}

function fillEventForm(event) {
  eventUrlInput.value = event.eventUrl || "";
  eventUidInput.value = event.uid || "";
  eventEtagInput.value = event.etag || "";
  eventSummaryInput.value = event.summary || "";
  eventLocationInput.value = event.location || "";
  eventDescriptionInput.value = event.description || "";
  eventStartInput.value = toDateTimeLocalValue(new Date(event.start));
  eventEndInput.value = toDateTimeLocalValue(new Date(event.end));
  if (event.calendarUrl) {
    calendarSelect.value = event.calendarUrl;
  }
  eventSubmitButton.textContent = "Сохранить изменения";
  setEventFormVisibility(true);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Ошибка запроса.");
  }
  return payload;
}

async function checkAdminSession() {
  const payload = await apiRequest("/api/admin/session");
  return Boolean(payload.authenticated);
}

async function loginAdmin(event) {
  event.preventDefault();
  loginButton.disabled = true;
  setLoginStatus("Проверяю доступ...", "");

  try {
    await apiRequest("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminUsernameInput.value.trim(),
        password: adminPasswordInput.value,
      }),
    });
    adminPasswordInput.value = "";
    setAdminVisible(true);
    setLoginStatus("", "");
    await initializeAdmin();
  } catch (error) {
    setLoginStatus(error.message, "error");
  } finally {
    loginButton.disabled = false;
  }
}

async function logoutAdmin() {
  await apiRequest("/api/admin/logout", { method: "POST" }).catch(() => null);
  setAdminVisible(false);
  setStatus("", "");
  setLoginStatus("Вы вышли из админ-панели.", "success");
}

async function loadEmployees() {
  const config = await apiRequest("/api/employees");
  applyEmployeesConfig(config);
}

async function saveEmployee() {
  setStatus("Сохраняю сотрудника...", "");
  saveButton.disabled = true;

  try {
    const config = await apiRequest("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: employeeIdInput.value.trim(),
        name: employeeNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        priority: Number(employeePriorityInput.value) || 100,
      }),
    });

    applyEmployeesConfig(config);
    setStatus("Сотрудник сохранён.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
}

async function activateEmployee(employeeId) {
  try {
    const config = await apiRequest("/api/employees/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employeeId }),
    });
    applyEmployeesConfig(config);
    state.calendars = [];
    state.events = [];
    renderCalendars();
    renderEvents();
    setStatus("Активный сотрудник переключен.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function deleteEmployee(employeeId) {
  try {
    const config = await apiRequest("/api/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employeeId }),
    });
    applyEmployeesConfig(config);
    state.calendars = [];
    state.events = [];
    renderCalendars();
    renderEvents();
    setStatus("Сотрудник удалён.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function loadCalendars() {
  reloadCalendarsButton.disabled = true;
  try {
    const payload = await apiRequest("/api/calendars");
    state.calendars = payload.calendars || [];
    renderCalendars();
    setStatus(`Календари обновлены: ${state.calendars.length}.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    reloadCalendarsButton.disabled = false;
  }
}

async function loadEvents() {
  const { start, end } = getDefaultEventsRange();
  state.eventsRangeStart = start;
  state.eventsRangeEnd = end;
  loadEventsButton.disabled = true;
  setStatus("Загружаю события...", "");

  try {
    const payload = await apiRequest(
      `/api/events?rangeStartIso=${encodeURIComponent(start.toISOString())}&rangeEndIso=${encodeURIComponent(end.toISOString())}`,
    );
    state.events = payload.events || [];
    if (!state.calendars.length) {
      state.calendars = payload.calendars || [];
      renderCalendars();
    }
    renderEvents();
    setStatus("События загружены.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    loadEventsButton.disabled = false;
  }
}

async function loadSharedMeetingSlots() {
  const employeeAId = meetingEmployeeASelect.value;
  const employeeBId = meetingEmployeeBSelect.value;

  if (!employeeAId || !employeeBId) {
    setStatus("Выберите двух сотрудников.", "error");
    return;
  }

  if (employeeAId === employeeBId) {
    setStatus("Для встречи нужны два разных сотрудника.", "error");
    return;
  }

  const rangeStart = toLocalDayStart(new Date());
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 3);
  loadMeetingSlotsButton.disabled = true;
  setStatus("Ищу общие слоты встречи...", "");

  try {
    const payload = await apiRequest("/api/meeting-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeIds: [employeeAId, employeeBId],
        rangeStartIso: rangeStart.toISOString(),
        rangeEndIso: rangeEnd.toISOString(),
        excludedDates: state.meetingRules.excludedDates,
        allowedStartTime: state.meetingRules.allowedStartTime,
        allowedEndTime: state.meetingRules.allowedEndTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    state.sharedMeetingSlots = payload.slots || [];
    renderSharedMeetingSlots(
      state.sharedMeetingSlots,
      (payload.employees || []).map((employee) => employee.name),
      rangeStart,
      rangeEnd,
    );
    setStatus("Общие слоты загружены.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    loadMeetingSlotsButton.disabled = false;
  }
}

function addExcludedDate() {
  const value = excludedDateInput.value;
  if (!value) {
    return;
  }

  if (!state.meetingRules.excludedDates.includes(value)) {
    state.meetingRules.excludedDates = [...state.meetingRules.excludedDates, value].sort();
  }

  excludedDateInput.value = "";
  renderExcludedDates();
  renderMeetingRulesPreview();
}

function applyMeetingRules() {
  state.meetingRules.allowedStartTime = allowedStartTimeInput.value || "09:00";
  state.meetingRules.allowedEndTime = allowedEndTimeInput.value || "18:00";
  renderMeetingRulesPreview();
  setStatus("Ограничения применены.", "success");
}

async function checkSlots() {
  const rangeStart = toLocalDayStart(new Date());
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 14);

  setStatus("Проверяю календари Mail.ru по CalDAV...", "");
  checkButton.disabled = true;

  try {
    const payload = await apiRequest("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        rangeStartIso: rangeStart.toISOString(),
        rangeEndIso: rangeEnd.toISOString(),
      }),
    });

    renderSlots(payload, rangeStart, rangeEnd);
    switchTab("calendar");
    setStatus("Слоты обновлены.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    checkButton.disabled = false;
  }
}

function getEventPayloadFromForm() {
  return {
    calendarUrl: calendarSelect.value,
    eventUrl: eventUrlInput.value,
    uid: eventUidInput.value,
    etag: eventEtagInput.value,
    summary: eventSummaryInput.value.trim(),
    location: eventLocationInput.value.trim(),
    description: eventDescriptionInput.value.trim(),
    start: fromDateTimeLocalValue(eventStartInput.value),
    end: fromDateTimeLocalValue(eventEndInput.value),
  };
}

async function submitEventForm(event) {
  event.preventDefault();
  eventSubmitButton.disabled = true;
  const payload = getEventPayloadFromForm();
  const isEditing = Boolean(payload.eventUrl);
  setStatus(isEditing ? "Обновляю событие..." : "Создаю событие...", "");

  try {
    await apiRequest("/api/events", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    resetEventForm();
    await loadEvents();
    setStatus(isEditing ? "Событие обновлено." : "Событие создано.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    eventSubmitButton.disabled = false;
  }
}

async function deleteEventByIndex(index) {
  const event = state.events[index];
  if (!event || !event.eventUrl) {
    setStatus("Удаление недоступно для этого события.", "error");
    return;
  }

  setStatus("Удаляю событие...", "");

  try {
    await apiRequest("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventUrl: event.eventUrl,
        etag: event.etag,
      }),
    });
    await loadEvents();
    setStatus("Событие удалено.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

credentialsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveEmployee();
});

loginForm.addEventListener("submit", loginAdmin);
logoutButton.addEventListener("click", logoutAdmin);
copyEmbedCodeButton.addEventListener("click", copyEmbedCode);
checkButton.addEventListener("click", checkSlots);
reloadCalendarsButton.addEventListener("click", loadCalendars);
loadEventsButton.addEventListener("click", loadEvents);
addEmployeeButton.addEventListener("click", startNewEmployee);
loadMeetingSlotsButton.addEventListener("click", loadSharedMeetingSlots);
addExcludedDateButton.addEventListener("click", addExcludedDate);
toggleEventFormButton.addEventListener("click", () => {
  setEventFormVisibility(!state.eventFormVisible);
});

eventForm.addEventListener("submit", submitEventForm);
eventResetButton.addEventListener("click", resetEventForm);
meetingRulesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyMeetingRules();
});

eventsNode.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  if (button.dataset.action === "edit-event") {
    fillEventForm(state.events[index]);
    return;
  }

  if (button.dataset.action === "delete-event") {
    await deleteEventByIndex(index);
  }
});

employeesListNode.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  if (button.dataset.action === "select-employee") {
    await activateEmployee(button.dataset.id);
    return;
  }

  if (button.dataset.action === "delete-employee") {
    await deleteEmployee(button.dataset.id);
  }
});

excludedDatesListNode.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='remove-excluded-date']");
  if (!button) {
    return;
  }

  state.meetingRules.excludedDates = state.meetingRules.excludedDates.filter(
    (date) => date !== button.dataset.date,
  );
  renderExcludedDates();
  renderMeetingRulesPreview();
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

togglePasswordButton.addEventListener("click", () => {
  const shouldShowPassword = passwordInput.type === "password";
  passwordInput.type = shouldShowPassword ? "text" : "password";
  togglePasswordLabel.textContent = shouldShowPassword ? "Скрыть" : "Показать";
  togglePasswordButton.setAttribute("aria-label", shouldShowPassword ? "Скрыть пароль" : "Показать пароль");
});

function initializeAdmin() {
  renderEmbedCode();
  resetEventForm();
  setEventFormVisibility(false);
  renderExcludedDates();
  renderMeetingRulesPreview();
  allowedStartTimeInput.value = state.meetingRules.allowedStartTime;
  allowedEndTimeInput.value = state.meetingRules.allowedEndTime;

  return loadEmployees()
    .then(() => {
      renderCalendars();
      renderEvents();
    })
    .catch(() => {
      setStatus("Не удалось загрузить сотрудников.", "error");
    });
}

setAdminVisible(false);
checkAdminSession()
  .then((authenticated) => {
    if (!authenticated) {
      return;
    }

    setAdminVisible(true);
    return initializeAdmin();
  })
  .catch(() => {
    setAdminVisible(false);
  });
