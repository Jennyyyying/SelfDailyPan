// 全局状态
let currentUserIP = '';
let todoData = {};
let stickerLibrary = [];
let customEmojis = {
    low: '',
    medium: '',
    high: ''
};

// 初始化：获取用户IP并加载数据
async function init() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        currentUserIP = data.ip;
        loadUserData();
        loadStickerLibrary();
        loadCustomEmojis();
    } catch (err) {
        console.error('Failed to get IP:', err);
        currentUserIP = 'default-user';
        loadUserData();
    }
}

// 加载用户数据（基于IP）
function loadUserData() {
    const saved = localStorage.getItem(`todo-data-${currentUserIP}`);
    if (saved) {
        todoData = JSON.parse(saved);
    } else {
        todoData = {
            today: [],
            past: [],
            completionHistory: []
        };
    }
}

// 保存用户数据
function saveUserData() {
    localStorage.setItem(`todo-data-${currentUserIP}`, JSON.stringify(todoData));
}

// 切换界面
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'past-screen') renderPastLists();
    if (screenId === 'record-screen') renderCompletionChart();
}

// 待办项交互
function addTodoItem(text = '') {
    const todoItems = document.getElementById('todo-items');
    const item = document.createElement('div');
    item.className = 'todo-item';
    item.innerHTML = `
        <div class="todo-checkbox" onclick="toggleTodoStatus(this)"></div>
        <input type="text" class="todo-input" value="${text}" placeholder="XXX" onkeydown="handleTodoInput(event)">
    `;
    todoItems.appendChild(item);
}

function toggleTodoStatus(checkbox) {
    if (checkbox.classList.contains('partial')) {
        checkbox.classList.remove('partial');
        checkbox.classList.add('complete');
    } else if (checkbox.classList.contains('complete')) {
        checkbox.classList.remove('complete');
    } else {
        checkbox.classList.add('partial');
    }
}

function handleTodoInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTodoItem();
    }
}

// 贴纸功能
function openStickerPanel() {
    document.getElementById('sticker-panel').classList.toggle('hidden');
    renderStickerLibrary();
}

function renderStickerLibrary() {
    const library = document.getElementById('sticker-library');
    library.innerHTML = '';
    stickerLibrary.forEach((sticker, idx) => {
        const img = document.createElement('img');
        img.src = sticker;
        img.className = 'sticker-thumbnail';
        img.draggable = true;
        img.dataset.index = idx;
        img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', idx);
        });
        library.appendChild(img);
    });
}

function uploadSticker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                stickerLibrary.push(ev.target.result);
                saveStickerLibrary();
                renderStickerLibrary();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function saveStickerLibrary() {
    localStorage.setItem('sticker-library', JSON.stringify(stickerLibrary));
}

function loadStickerLibrary() {
    const saved = localStorage.getItem('sticker-library');
    if (saved) stickerLibrary = JSON.parse(saved);
}

// 自定义表情上传
function uploadEmoji(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                customEmojis[type] = ev.target.result;
                saveCustomEmojis();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

function saveCustomEmojis() {
    localStorage.setItem('custom-emojis', JSON.stringify(customEmojis));
}

function loadCustomEmojis() {
    const saved = localStorage.getItem('custom-emojis');
    if (saved) customEmojis = JSON.parse(saved);
}

// 初始化执行
init();
