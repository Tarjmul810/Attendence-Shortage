const STORAGE_KEY = "attendance_shortage_data_v1";
const REQUIRED_PERCENTAGE = 75;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const state = loadState();

const subjectForm = document.getElementById("subject-form");
const subjectNameInput = document.getElementById("subject-name");
const subjectDurationInput = document.getElementById("subject-duration");
const daysGrid = document.getElementById("days-grid");
const subjectsList = document.getElementById("subjects-list");
const todayLabel = document.getElementById("today-label");
const todayClasses = document.getElementById("today-classes");
const summaryBody = document.getElementById("summary-body");
const overallRow = document.getElementById("overall-row");
const resetBtn = document.getElementById("reset-btn");

renderDayCheckboxes();
wireEvents();
renderAll();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { subjects: [], attendance: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      attendance: parsed.attendance && typeof parsed.attendance === "object" ? parsed.attendance : {}
    };
  } catch {
    return { subjects: [], attendance: {} };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderDayCheckboxes() {
  daysGrid.innerHTML = "";
  DAYS.forEach((day, index) => {
    const label = document.createElement("label");
    label.className = "day-check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(index);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(day.slice(0, 3)));
    daysGrid.appendChild(label);
  });
}

function wireEvents() {
  subjectForm.addEventListener("submit", onAddSubject);
  resetBtn.addEventListener("click", onResetSession);
}

function onAddSubject(event) {
  event.preventDefault();

  const name = subjectNameInput.value.trim();
  const duration = Number(subjectDurationInput.value);
  const selectedDays = [...daysGrid.querySelectorAll("input[type='checkbox']")]
    .filter((input) => input.checked)
    .map((input) => Number(input.value));

  if (!name) {
    alert("Please enter a subject name.");
    return;
  }
  if (selectedDays.length === 0) {
    alert("Please select at least one class day.");
    return;
  }

  state.subjects.push({
    id: crypto.randomUUID(),
    name,
    days: selectedDays,
    duration
  });

  subjectForm.reset();
  saveState();
  renderAll();
}

function onResetSession() {
  const yes = confirm("This will remove all subjects and attendance data. Continue?");
  if (!yes) {
    return;
  }

  state.subjects = [];
  state.attendance = {};
  saveState();
  renderAll();
}

function removeSubject(subjectId) {
  state.subjects = state.subjects.filter((subject) => subject.id !== subjectId);
  Object.keys(state.attendance).forEach((key) => {
    if (key.endsWith(`|${subjectId}`)) {
      delete state.attendance[key];
    }
  });
  saveState();
  renderAll();
}

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setTodayStatus(subjectId, status) {
  const key = `${getTodayDateKey()}|${subjectId}`;
  state.attendance[key] = status;
  saveState();
  renderAll();
}

function renderAll() {
  renderSubjects();
  renderTodayClasses();
  renderSummary();
}

function renderSubjects() {
  subjectsList.innerHTML = "";
  if (state.subjects.length === 0) {
    subjectsList.innerHTML = '<li class="empty">No subjects added yet.</li>';
    return;
  }

  state.subjects.forEach((subject) => {
    const li = document.createElement("li");
    const dayText = subject.days.map((day) => DAYS[day].slice(0, 3)).join(", ");
    const info = document.createElement("div");
    info.textContent = `${subject.name} • ${subject.duration === 2 ? "100 min" : "50 min"} • ${dayText}`;

    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeSubject(subject.id));

    li.appendChild(info);
    li.appendChild(remove);
    subjectsList.appendChild(li);
  });
}

function renderTodayClasses() {
  const now = new Date();
  const todayDay = now.getDay();
  const todayString = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  todayLabel.textContent = `Today: ${todayString}`;
  todayClasses.innerHTML = "";

  const classes = state.subjects.filter((subject) => subject.days.includes(todayDay));
  if (classes.length === 0) {
    todayClasses.innerHTML = '<p class="empty">No classes scheduled for today.</p>';
    return;
  }

  const dateKey = getTodayDateKey();
  classes.forEach((subject) => {
    const wrap = document.createElement("div");
    wrap.className = "today-item";

    const label = document.createElement("div");
    label.innerHTML = `<strong>${subject.name}</strong><br><small>${subject.duration === 2 ? "100 min = 2 classes" : "50 min = 1 class"}</small>`;

    const actions = document.createElement("div");
    actions.className = "status-actions";

    [
      { value: "attended", text: "Attended" },
      { value: "missed", text: "Missed" },
      { value: "holiday", text: "Holiday" }
    ].forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "status-btn";
      btn.textContent = option.text;
      const recordKey = `${dateKey}|${subject.id}`;
      if (state.attendance[recordKey] === option.value) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => setTodayStatus(subject.id, option.value));
      actions.appendChild(btn);
    });

    wrap.appendChild(label);
    wrap.appendChild(actions);
    todayClasses.appendChild(wrap);
  });
}

function renderSummary() {
  summaryBody.innerHTML = "";

  if (state.subjects.length === 0) {
    summaryBody.innerHTML = '<tr><td colspan="6" class="empty">Add subjects to see summary.</td></tr>';
    overallRow.innerHTML = "";
    return;
  }

  let overallTotal = 0;
  let overallAttended = 0;

  state.subjects.forEach((subject) => {
    const { totalUnits, attendedUnits } = computeSubjectSummary(subject);
    overallTotal += totalUnits;
    overallAttended += attendedUnits;

    const percentage = totalUnits === 0 ? 0 : (attendedUnits / totalUnits) * 100;
    const shortage = percentage < REQUIRED_PERCENTAGE;
    const canSkip = ((attendedUnits / (totalUnits + subject.duration)) * 100) >= REQUIRED_PERCENTAGE;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${subject.name}</td>
      <td>${totalUnits}</td>
      <td>${attendedUnits}</td>
      <td>${percentage.toFixed(1)}%</td>
      <td class="${shortage ? "status-shortage" : "status-ok"}">${shortage ? "Shortage" : "Safe"}</td>
      <td class="${canSkip ? "skip-yes" : "skip-no"}">${canSkip ? "Yes" : "No"}</td>
    `;
    summaryBody.appendChild(tr);
  });

  const overallPercentage = overallTotal === 0 ? 0 : (overallAttended / overallTotal) * 100;
  overallRow.innerHTML = `
    <th>Overall</th>
    <th>${overallTotal}</th>
    <th>${overallAttended}</th>
    <th>${overallPercentage.toFixed(1)}%</th>
    <th class="${overallPercentage < REQUIRED_PERCENTAGE ? "status-shortage" : "status-ok"}">${overallPercentage < REQUIRED_PERCENTAGE ? "Shortage" : "Safe"}</th>
    <th>-</th>
  `;
}

function computeSubjectSummary(subject) {
  let totalUnits = 0;
  let attendedUnits = 0;

  Object.entries(state.attendance).forEach(([key, status]) => {
    const [, subjectId] = key.split("|");
    if (subjectId !== subject.id || status === "holiday") {
      return;
    }

    totalUnits += subject.duration;
    if (status === "attended") {
      attendedUnits += subject.duration;
    }
  });

  return { totalUnits, attendedUnits };
}
