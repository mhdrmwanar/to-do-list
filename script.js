const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const todoDateLabel = document.getElementById('todoDateLabel');
const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
const sectionIds = ['dashboard', 'todo', 'calendar', 'progress', 'targets', 'notes'];
const taskCount = document.getElementById('taskCount');
const doneCount = document.getElementById('doneCount');
const progressPercent = document.getElementById('progressPercent');
const progressFill = document.getElementById('progressFill');
const metricComplete = document.getElementById('metricComplete');
const metricPending = document.getElementById('metricPending');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const todayLabel = document.getElementById('todayLabel');
const calendarGrid = document.getElementById('calendarGrid');
const calendarMonth = document.getElementById('calendarMonth');
const calendarSubtitle = document.getElementById('calendarSubtitle');
const selectedDateText = document.getElementById('selectedDateText');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const dayInput = document.getElementById('dayInput');

const initialTasks = {
  [new Date(2026, 6, 27).toISOString().slice(0, 10)]: [
    { id: 1, text: 'Review target mingguan', done: true },
    { id: 2, text: 'Selesaikan presentasi', done: false },
  ],
  [new Date(2026, 6, 30).toISOString().slice(0, 10)]: [
    { id: 3, text: 'Meeting penting', done: false },
    { id: 4, text: 'Buat ringkasan kerja', done: false },
  ],
};

let tasks = JSON.parse(localStorage.getItem('dailyflow-tasks') || 'null') || initialTasks;
let currentMonth = new Date();
let selectedDate = new Date();

function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateString = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  clockEl.textContent = timeString;
  dateEl.textContent = dateString;
  todayLabel.textContent = dateString;
}

function saveTasks() {
  localStorage.setItem('dailyflow-tasks', JSON.stringify(tasks));
}

function formatDateLabel(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getTaskKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTasksForSelectedDate() {
  const key = getTaskKey(selectedDate);
  return tasks[key] || [];
}

function renderTasks() {
  const selectedTasks = getTasksForSelectedDate();
  taskList.innerHTML = '';

  if (!selectedTasks.length) {
    const emptyState = document.createElement('li');
    emptyState.className = 'task-item';
    emptyState.innerHTML = '<span>Belum ada tugas untuk tanggal ini.</span>';
    taskList.appendChild(emptyState);
  }

  selectedTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.done ? 'done' : ''}`;

    item.innerHTML = `
      <label>
        <input type="checkbox" ${task.done ? 'checked' : ''} />
        <span>${task.text}</span>
      </label>
      <button class="delete-btn" type="button" aria-label="Hapus tugas">✕</button>
    `;

    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
      updateSummary();
    });

    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      const key = getTaskKey(selectedDate);
      tasks[key] = (tasks[key] || []).filter((itemTask) => itemTask.id !== task.id);
      saveTasks();
      renderTasks();
      updateSummary();
    });

    taskList.appendChild(item);
  });

  todoDateLabel.textContent = `Tanggal terpilih: ${formatDateLabel(selectedDate)}`;
  updateSummary();
}

function updateSummary() {
  const selectedTasks = getTasksForSelectedDate();
  const total = selectedTasks.length;
  const completed = selectedTasks.filter((task) => task.done).length;
  const pending = total - completed;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  taskCount.textContent = total;
  doneCount.textContent = completed;
  progressPercent.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
  metricComplete.textContent = completed;
  metricPending.textContent = pending;
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const key = getTaskKey(selectedDate);
  if (!tasks[key]) {
    tasks[key] = [];
  }

  tasks[key].unshift({ id: Date.now(), text: trimmed, done: false });
  saveTasks();
  renderTasks();
  taskInput.value = '';
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function populateYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);

  yearSelect.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join('');
}

function syncCalendarInputs() {
  yearSelect.value = selectedDate.getFullYear();
  monthSelect.value = selectedDate.getMonth();

  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  dayInput.max = daysInMonth;
  dayInput.value = Math.min(selectedDate.getDate(), daysInMonth);
}

function updateSelectedDateFromInputs() {
  const year = Number(yearSelect.value);
  const month = Number(monthSelect.value);
  let day = Number(dayInput.value);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  day = Math.min(Math.max(day, 1), daysInMonth);
  selectedDate = new Date(year, month, day);
  currentMonth = new Date(year, month, 1);
  syncCalendarInputs();
  renderCalendar();
}

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  calendarMonth.textContent = currentMonth.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
  calendarSubtitle.textContent = 'Klik tanggal untuk menandai agenda';

  calendarGrid.innerHTML = '';

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const date = new Date(year, month, dayNumber);
    const isCurrentMonth = date.getMonth() === month;
    const isToday = sameDate(date, new Date());
    const isSelected = sameDate(date, selectedDate);

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = date.getDate();
    button.className = [
      'calendar-cell',
      !isCurrentMonth ? 'calendar-cell-muted' : '',
      isToday && !isSelected ? 'calendar-cell-today' : '',
      isSelected ? 'calendar-cell-selected' : '',
    ].filter(Boolean).join(' ');

    button.addEventListener('click', () => {
      currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      selectedDate = new Date(date);
      syncCalendarInputs();
      renderCalendar();
    });

    calendarGrid.appendChild(button);
  }

  syncCalendarInputs();
  selectedDateText.textContent = formatDateLabel(selectedDate);
  renderTasks();
}

function setActiveNav(hash) {
  navLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === hash;
    link.classList.toggle('active', isActive);
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const targetId = link.getAttribute('href')?.replace('#', '');
    if (!targetId) return;

    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${targetId}`);
      setActiveNav(`#${targetId}`);
    }
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveNav(`#${entry.target.id}`);
      }
    });
  },
  { threshold: 0.4 }
);

sectionIds.forEach((id) => {
  const section = document.getElementById(id);
  if (section) observer.observe(section);
});

prevMonthBtn.addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  renderCalendar();
});

todayBtn.addEventListener('click', () => {
  selectedDate = new Date();
  currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  renderCalendar();
});

yearSelect.addEventListener('change', updateSelectedDateFromInputs);
monthSelect.addEventListener('change', updateSelectedDateFromInputs);
dayInput.addEventListener('change', updateSelectedDateFromInputs);

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTask(taskInput.value);
});

populateYearOptions();
updateClock();
setInterval(updateClock, 1000);
renderTasks();
renderCalendar();
