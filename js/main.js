// Элементы на странице
const form = document.querySelector('#form');
const taskInput = document.querySelector('#taskInput');
const taskList = document.querySelector('#taskList');
const categories = document.querySelectorAll('.task-category');
const clearTasksBtn = document.querySelector('#clearTasksBtn');

// Валидные категории
const validCategories = ['pending', 'in-progress', 'completed', 'discarded'];

// Загрузка задач из localStorage при старте
try {
  loadTasks();
} catch (e) {
  console.error('Ошибка при загрузке задач:', e);
}

// Обработчики событий
form.addEventListener('submit', addTask);
document.addEventListener('click', handleTaskActions);
document.addEventListener('change', handleCheckboxChange);
clearTasksBtn.addEventListener('click', clearDiscarded);
setupDragAndDrop();

function addTask(event) {
  event.preventDefault();
  console.log('Добавление задачи...');
  const taskText = taskInput.value.trim();
  if (!taskText) {
    console.warn('Пустой текст задачи, игнорируем.');
    return;
  }

  try {
    const taskHTML = `
                    <li class="task-item" draggable="true">
                        <input type="checkbox" class="task-checkbox" id="checkbox-${Date.now()}">
                        <label class="checkbox-label" for="checkbox-${Date.now()}">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M5 12l5 5L19 7"/>
                            </svg>
                        </label>
                        <span class="task-title">${taskText}</span>
                        <input type="text" class="task-input-edit" value="${taskText}">
                        <div class="task-item__buttons">
                            <button type="button" data-action="redact" class="btn-action button__redact">
                                <svg class="button__redact-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 -0.5 66 66">
                                    <g fill="none" fill-rule="evenodd" stroke-width="2">
                                        <path d="M9.5 44.7 2 63l18.3-7.5" />
                                        <path d="M21.4 54.9c-.9.9-2.3.9-3.2 0l.8-4h-4.8v-4.8l-4 .8c-.9-.9-.9-2.3 0-3.2l42-42c.9-.9 2.3-.9 3.2 0l8.1 8.1c.9.9.9 2.3 0 3.2L21.4 54.9ZM14.1 46 50.4 9.7M19 50.9l36.3-36.3M47.2 6.5l11.3 11.3" />
                                    </g>
                                </svg>
                            </button>
                            <button type="button" data-action="save" class="btn-action button__save">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="none" stroke="currentColor" stroke-width="2" d="M5 12l5 5L19 7"/>
                                </svg>
                            </button>
                            <button type="button" data-action="delete" class="btn-action">
                                <img src="./img/cross.svg" alt="Delete" width="18" height="18">
                            </button>
                        </div>
                    </li>`;

    taskList.insertAdjacentHTML('beforeend', taskHTML);
    console.log('Задача добавлена в DOM:', taskText);
    taskInput.value = '';
    taskInput.focus();
    saveTasks();
  } catch (e) {
    console.error('Ошибка при добавлении задачи:', e);
  }
}

function handleTaskActions(event) {
  const action = event.target.closest('.btn-action')?.dataset.action;
  if (!action) return;

  const taskItem = event.target.closest('.task-item');
  if (!taskItem) return;

  try {
    if (action === 'redact') {
      startEditing(taskItem);
    } else if (action === 'save') {
      saveTask(taskItem);
    } else if (action === 'delete') {
      deleteTask(taskItem);
    }
  } catch (e) {
    console.error('Ошибка при обработке действия:', e);
  }
}

function handleCheckboxChange(event) {
  if (event.target.classList.contains('task-checkbox')) {
    try {
      const taskItem = event.target.closest('.task-item');
      const completedList = document.querySelector('.task-category.completed');
      if (event.target.checked) {
        taskItem.remove();
        completedList.appendChild(taskItem);
        console.log('Задача перемещена в "Готово"');
      }
      saveTasks();
    } catch (e) {
      console.error('Ошибка при обработке чекбокса:', e);
    }
  }
}

function startEditing(taskItem) {
  const taskTitle = taskItem.querySelector('.task-title');
  const taskInputEdit = taskItem.querySelector('.task-input-edit');
  const redactButton = taskItem.querySelector('.button__redact');
  const saveButton = taskItem.querySelector('.button__save');

  taskTitle.classList.add('editing');
  taskInputEdit.classList.add('editing');
  redactButton.classList.add('editing');
  saveButton.classList.add('editing');
  taskInputEdit.focus();
}

function saveTask(taskItem) {
  const taskInputEdit = taskItem.querySelector('.task-input-edit');
  const taskTitle = taskItem.querySelector('.task-title');
  const redactButton = taskItem.querySelector('.button__redact');
  const saveButton = taskItem.querySelector('.button__save');
  const newText = taskInputEdit.value.trim();

  if (newText) {
    taskTitle.textContent = newText;
    taskInputEdit.value = newText;
  } else {
    taskItem.remove();
  }

  taskTitle.classList.remove('editing');
  taskInputEdit.classList.remove('editing');
  redactButton.classList.remove('editing');
  saveButton.classList.remove('editing');
  saveTasks();
}

function deleteTask(taskItem) {
  const discardedList = document.querySelector('.task-category.discarded');
  if (!taskItem.closest('.discarded')) {
    taskItem.remove();
    discardedList.appendChild(taskItem);
    taskItem.querySelector('.task-checkbox').checked = false;
    console.log('Задача перемещена в "Корзину"');
  } else {
    taskItem.remove();
    console.log('Задача удалена из "Корзины"');
  }
  saveTasks();
}

function clearDiscarded() {
  try {
    const discardedList = document.querySelector('.task-category.discarded');
    const tasks = discardedList.querySelectorAll('.task-item');
    tasks.forEach(task => task.remove());
    console.log('Корзина очищена');
    saveTasks();
  } catch (e) {
    console.error('Ошибка при очистке корзины:', e);
  }
}

function setupDragAndDrop() {
  categories.forEach(category => {
    category.addEventListener('dragover', (e) => {
      e.preventDefault();
      category.classList.add('over');
    });

    category.addEventListener('dragleave', () => {
      category.classList.remove('over');
    });

    category.addEventListener('drop', (e) => {
      e.preventDefault();
      category.classList.remove('over');
      const task = document.querySelector('.task-item.dragging');
      if (task) {
        category.appendChild(task);
        if (!category.classList.contains('completed')) {
          task.querySelector('.task-checkbox').checked = false;
        }
        console.log('Задача перетащена в', category.classList);
        saveTasks();
      }
    });
  });

  document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task-item')) {
      e.target.classList.add('dragging');
    }
  });

  document.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('task-item')) {
      e.target.classList.remove('dragging');
    }
  });
}

function saveTasks() {
  try {
    const tasks = {};
    categories.forEach(category => {
      const categoryClass = Array.from(category.classList).find(cls => validCategories.includes(cls));
      if (categoryClass) {
        tasks[categoryClass] = [];
        category.querySelectorAll('.task-item').forEach(task => {
          tasks[categoryClass].push({
            text: task.querySelector('.task-title').textContent,
            checked: task.querySelector('.task-checkbox').checked
          });
        });
      }
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log('Задачи сохранены в localStorage:', tasks);
  } catch (e) {
    console.error('Ошибка при сохранении задач:', e);
  }
}

function loadTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '{}');
    console.log('Загружены задачи из localStorage:', tasks);
    for (const [categoryClass, taskList] of Object.entries(tasks)) {
      if (!validCategories.includes(categoryClass)) {
        console.warn(`Невалидная категория в localStorage: ${categoryClass}. Пропускаем.`);
        continue;
      }

      const category = document.querySelector(`.task-category.${categoryClass}`);
      if (category && Array.isArray(taskList)) {
        taskList.forEach(taskData => {
          const safeTaskText = taskData.text.replace(/</g, '<').replace(/>/g, '>');
          const taskHTML = `
                                <li class="task-item" draggable="true">
                                    <input type="checkbox" class="task-checkbox" id="checkbox-${Date.now() + Math.random()}" ${taskData.checked ? 'checked' : ''}>
                                    <label class="checkbox-label" for="checkbox-${Date.now() + Math.random()}">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M5 12l5 5L19 7"/>
                                        </svg>
                                    </label>
                                    <span class="task-title">${safeTaskText}</span>
                                    <input type="text" class="task-input-edit" value="${safeTaskText}">
                                    <div class="task-item__buttons">
                                        <button type="button" data-action="redact" class="btn-action button__redact">
                                            <svg class="button__redact-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 -0.5 66 66">
                                                <g fill="none" fill-rule="evenodd" stroke-width="2">
                                                    <path d="M9.5 44.7 2 63l18.3-7.5" />
                                                    <path d="M21.4 54.9c-.9.9-2.3.9-3.2 0l.8-4h-4.8v-4.8l-4 .8c-.9-.9-.9-2.3 0-3.2l42-42c.9-.9 2.3-.9 3.2 0l8.1 8.1c.9.9.9 2.3 0 3.2L21.4 54.9ZM14.1 46 50.4 9.7M19 50.9l36.3-36.3M47.2 6.5l11.3 11.3" />
                                                </g>
                                            </svg>
                                        </button>
                                        <button type="button" data-action="save" class="btn-action button__save">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                                <path fill="none" stroke="currentColor" stroke-width="2" d="M5 12l5 5L19 7"/>
                                            </svg>
                                        </button>
                                        <button type="button" data-action="delete" class="btn-action">
                                            <img src="./img/cross.svg" alt="Delete" width="18" height="18">
                                        </button>
                                    </div>
                                </li>`;
          category.insertAdjacentHTML('beforeend', taskHTML);
        });
      }
    }
  } catch (e) {
    console.error('Ошибка при загрузке задач:', e);
  }
}
