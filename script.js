document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const addTaskBtn = document.getElementById('add-task');
    const modal = document.getElementById('task-modal');
    const deleteModal = document.getElementById('delete-modal');
    const closeBtns = document.querySelectorAll('.close');
    const taskForm = document.getElementById('task-form');
    const todoList = document.getElementById('todo-list');
    const searchInput = document.getElementById('search-input');
    const themeToggle = document.getElementById('theme-toggle');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const filterButtons = document.querySelectorAll('.btn-filter');
    
    // Variabel state
    let currentTheme = localStorage.getItem('theme') || 'light';
    let taskToDelete = null;
    let draggedItem = null;
    
    // Inisialisasi tema
    function initTheme() {
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon();
    }
    
    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    // Load tasks dari localStorage
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        return savedTasks ? JSON.parse(savedTasks) : [
            { 
                id: 1, 
                title: 'Mengerjakan proyek', 
                description: 'Selesaikan bagian frontend', 
                date: getFormattedDate(new Date(Date.now() + 86400000 * 3)), // 3 hari dari sekarang
                completed: false,
                priority: 'high',
                category: 'Work'
            },
            { 
                id: 2, 
                title: 'Belajar JavaScript', 
                description: 'Pelajari konsep async/await', 
                date: getFormattedDate(new Date(Date.now() + 86400000)), // Besok
                completed: true,
                priority: 'medium',
                category: 'Study'
            }
        ];
    }
    
    let tasks = loadTasks();
    
    // Helper functions
    function getFormattedDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        
        return [year, month, day].join('-');
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Tampilkan modal
    function showModal(modalElement) {
        modalElement.style.display = 'block';
    }
    
    // Tutup modal
    function closeModal(modalElement) {
        modalElement.style.display = 'none';
    }
    
    // Toggle task completion
    function toggleTaskComplete(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTasks(getCurrentFilter());
    }
    
    // Delete task
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks(getCurrentFilter());
    }
    
    // Get current filter
    function getCurrentFilter() {
        const activeFilter = document.querySelector('.btn-filter.active');
        return activeFilter ? activeFilter.dataset.filter : 'all';
    }
    
    // Render tasks
    function renderTasks(filter = 'all') {
        const searchTerm = searchInput.value.toLowerCase();
        let filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                               task.description.toLowerCase().includes(searchTerm) ||
                               task.category.toLowerCase().includes(searchTerm);
            if (filter === 'completed') return task.completed && matchesSearch;
            if (filter === 'active') return !task.completed && matchesSearch;
            return matchesSearch;
        });
        
        renderTaskList(filteredTasks);
    }
    
    function renderTaskList(taskList) {
        todoList.innerHTML = '';
        
        if (taskList.length === 0) {
            todoList.innerHTML = '<p class="no-tasks">Tidak ada tugas yang ditemukan.</p>';
            return;
        }
        
        taskList.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            taskItem.draggable = true;
            
            const priorityClass = `priority-${task.priority}`;
            const priorityText = task.priority === 'high' ? 'Tinggi' : 
                              task.priority === 'medium' ? 'Sedang' : 'Rendah';
            
            taskItem.innerHTML = `
                <div class="task-info">
                    <div class="task-title">
                        <span class="priority ${priorityClass}">${priorityText}</span>
                        ${task.category ? `<span class="category">${task.category}</span>` : ''}
                        ${task.title}
                    </div>
                    <div class="task-desc">${task.description}</div>
                    <div class="task-date">Jatuh tempo: ${task.date || '-'}</div>
                </div>
                <div class="task-actions">
                    <button class="task-btn complete-btn" data-id="${task.id}" aria-label="${task.completed ? 'Tandai belum selesai' : 'Tandai selesai'}">
                        ${task.completed ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>'}
                    </button>
                    <button class="task-btn delete-btn" data-id="${task.id}" aria-label="Hapus tugas">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            todoList.appendChild(taskItem);
        });
        
        // Add event listeners to buttons
        document.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-id'));
                toggleTaskComplete(taskId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-id'));
                showDeleteModal(taskId);
            });
        });
    }
    
    // Show delete confirmation modal
    function showDeleteModal(taskId) {
        taskToDelete = taskId;
        showModal(deleteModal);
    }
    
    // Drag and drop functionality
    function setupDragAndDrop() {
        todoList.addEventListener('dragstart', function(e) {
            if (e.target.classList.contains('task-item')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        todoList.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const afterElement = getDragAfterElement(todoList, e.clientY);
            const currentDragged = document.querySelector('.dragging');
            
            if (afterElement == null) {
                todoList.appendChild(currentDragged);
            } else {
                todoList.insertBefore(currentDragged, afterElement);
            }
        });
        
        todoList.addEventListener('dragend', function(e) {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                updateTaskOrder();
            }
        });
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    function updateTaskOrder() {
        const taskElements = todoList.querySelectorAll('.task-item');
        const newOrder = Array.from(taskElements).map(el => parseInt(el.dataset.id));
        
        // Sort tasks array based on DOM order
        tasks.sort((a, b) => {
            return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
        });
        
        saveTasks();
    }
    
    // Event listeners
    addTaskBtn.addEventListener('click', () => showModal(modal));
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-desc').value;
        const date = document.getElementById('task-date').value;
        const priority = document.getElementById('task-priority').value;
        const category = document.getElementById('task-category').value;
        
        const newTask = {
            id: Date.now(),
            title,
            description,
            date,
            priority,
            category,
            completed: false
        };
        
        tasks.unshift(newTask); // Add to beginning of array
        saveTasks();
        renderTasks(getCurrentFilter());
        
        taskForm.reset();
        closeModal(modal);
    });
    
    searchInput.addEventListener('input', () => {
        renderTasks(getCurrentFilter());
    });
    
    themeToggle.addEventListener('click', function() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        updateThemeIcon();
    });
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTasks(this.dataset.filter);
        });
    });
    
    confirmDeleteBtn.addEventListener('click', function() {
        if (taskToDelete) {
            deleteTask(taskToDelete);
        }
        closeModal(deleteModal);
        taskToDelete = null;
    });
    
    cancelDeleteBtn.addEventListener('click', function() {
        closeModal(deleteModal);
        taskToDelete = null;
    });
    
    // Initialize
    initTheme();
    setupDragAndDrop();
    renderTasks();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('task-date').valueAsDate = tomorrow;
});