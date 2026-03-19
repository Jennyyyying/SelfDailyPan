// 全局状态
let currentUserIP = '';
let todoData = {};
let personalStickers = {};
let globalStickers = [];
let customEmojis = { low: '', medium: '', high: '' };
let currentChartView = 'month';

// 初始化
async function init() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        currentUserIP = data.ip;
    } catch (err) {
        currentUserIP = 'default-user';
    }
    await loadGlobalStickers();
    loadUserData();
    loadPersonalStickers();
    loadCustomEmojis();
    initStickerCanvas();
}

// 加载公共贴纸
async function loadGlobalStickers() {
    try {
        const res = await fetch("https://api.github.com/repos/Jennyyyying/SelfDailyPan/contents/stickers");
        const files = await res.json();
        globalStickers = files
            .filter(file => file.name.endsWith(".png") || file.name.endsWith(".jpg") || file.name.endsWith(".jpeg"))
            .map(file => file.download_url);
    } catch (err) {
        console.error("加载公共贴纸失败:", err);
        globalStickers = [];
    }
}

// 加载用户数据
function loadUserData() {
    const saved = localStorage.getItem(`todo-data-${currentUserIP}`);
    todoData = saved ? JSON.parse(saved) : { today: [], past: [], completionHistory: [] };
}

// 保存用户数据
function saveUserData() {
    localStorage.setItem(`todo-data-${currentUserIP}`, JSON.stringify(todoData));
}

// 加载个人贴纸
function loadPersonalStickers() {
    const saved = localStorage.getItem(`personal-stickers-${currentUserIP}`);
    personalStickers = saved ? JSON.parse(saved) : { stickers: [] };
}

// 保存个人贴纸
function savePersonalStickers() {
    localStorage.setItem(`personal-stickers-${currentUserIP}`, JSON.stringify(personalStickers));
}

// 切换界面
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    if (screenId === 'todo-screen') {
        renderTodoItems();
        openStickerPanel();
        openStickerPanel();
    }
    if (screenId === 'past-screen') renderPastLists();
    if (screenId === 'record-screen') renderCompletionChart();
}

// 渲染待办项
function renderTodoItems() {
    const todoItems = document.getElementById('todo-items');
    todoItems.innerHTML = '';
    if (todoData.today.length === 0) {
        addTodoItem();
    } else {
        todoData.today.forEach(item => {
            const itemEl = createTodoItemElement(item);
            todoItems.appendChild(itemEl);
        });
    }
}

// 创建待办项元素
function createTodoItemElement(item) {
    const itemEl = document.createElement('div');
    itemEl.className = 'todo-item';
    const checkboxClass = item.status === 'partial' ? 'partial' : item.status === 'complete' ? 'complete' : '';
    itemEl.innerHTML = `
        <div class="todo-checkbox ${checkboxClass}" onclick="toggleTodoStatus(this, ${item.id})"></div>
        <input type="text" class="todo-input" value="${item.text}" placeholder="XXX" onchange="updateTodoText(${item.id}, this.value)" onkeydown="handleTodoInput(event, ${item.id})">
    `;
    return itemEl;
}

// 添加待办项
function addTodoItem(text = '') {
    const newItem = { id: Date.now(), text: text, status: '' };
    todoData.today.push(newItem);
    saveUserData();
    renderTodoItems();
    // 自动聚焦到最后一个输入框
    setTimeout(() => {
        const inputs = document.querySelectorAll('.todo-input');
        inputs[inputs.length - 1].focus();
    }, 0);
}

// 切换待办状态
function toggleTodoStatus(checkbox, id) {
    const item = todoData.today.find(i => i.id === id);
    if (!item) return;
    if (item.status === '') {
        item.status = 'partial';
        checkbox.classList.add('partial');
    } else if (item.status === 'partial') {
        item.status = 'complete';
        checkbox.classList.remove('partial');
        checkbox.classList.add('complete');
    } else {
        item.status = '';
        checkbox.classList.remove('complete');
    }
    saveUserData();
}

// 更新待办文本
function updateTodoText(id, text) {
    const item = todoData.today.find(i => i.id === id);
    if (item) {
        item.text = text;
        saveUserData();
    }
}

// 回车新增待办并自动聚焦
function handleTodoInput(e, id) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTodoItem();
    }
}

// 打开/关闭贴纸面板
function openStickerPanel() {
    const panel = document.getElementById('sticker-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderStickerLibrary();
}

// 渲染贴纸库
function renderStickerLibrary() {
    const library = document.getElementById('sticker-library');
    library.innerHTML = '';
    if (globalStickers.length > 0) {
        library.innerHTML += '<h4>公共贴纸</h4>';
        globalStickers.forEach((sticker, idx) => {
            const img = document.createElement('img');
            img.src = sticker;
            img.className = 'sticker-thumbnail';
            img.draggable = true;
            img.dataset.type = 'global';
            img.dataset.index = idx;
            img.addEventListener('dragstart', handleDragStart);
            library.appendChild(img);
        });
    }
    library.innerHTML += '<h4>我的贴纸</h4>';
    if (personalStickers.stickers.length === 0) {
        library.innerHTML += '<p style="font-size:12px;color:#666;">暂无贴纸，点击下方按钮上传</p>';
    } else {
        personalStickers.stickers.forEach((sticker, idx) => {
            const img = document.createElement('img');
            img.src = sticker;
            img.className = 'sticker-thumbnail';
            img.draggable = true;
            img.dataset.type = 'personal';
            img.dataset.index = idx;
            img.addEventListener('dragstart', handleDragStart);
            library.appendChild(img);
        });
    }
}

// 拖拽开始事件
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        type: e.target.dataset.type,
        index: e.target.dataset.index
    }));
}

// 初始化贴纸画布拖放
function initStickerCanvas() {
    const canvas = document.getElementById('sticker-canvas');
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const { type, index } = data;
        let src;
        if (type === 'global') src = globalStickers[index];
        else if (type === 'personal') src = personalStickers.stickers[index];
        if (src) createSticker(src, e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top);
    });
}

// 创建贴纸元素
function createSticker(src, x, y) {
    const sticker = document.createElement('img');
    sticker.src = src;
    sticker.className = 'sticker';
    sticker.style.left = `${x}px`;
    sticker.style.top = `${y}px`;
    sticker.draggable = true;

    sticker.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.sticker').forEach(s => s.style.border = 'none');
        sticker.style.border = '2px solid #a0c4ff';
    });

    sticker.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'sticker-move');
        sticker.dataset.startX = e.clientX;
        sticker.dataset.startY = e.clientY;
    });
    sticker.addEventListener('dragend', (e) => {
        const dx = e.clientX - parseInt(sticker.dataset.startX);
        const dy = e.clientY - parseInt(sticker.dataset.startY);
        sticker.style.left = `${parseInt(sticker.style.left) + dx}px`;
        sticker.style.top = `${parseInt(sticker.style.top) + dy}px`;
    });

    document.getElementById('sticker-canvas').appendChild(sticker);
}

// 上传个人贴纸
function uploadPersonalSticker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                personalStickers.stickers.push(ev.target.result);
                savePersonalStickers();
                renderStickerLibrary();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// 加载自定义表情
function loadCustomEmojis() {
    const saved = localStorage.getItem('custom-emojis');
    if (saved) customEmojis = JSON.parse(saved);
}

// 保存自定义表情
function saveCustomEmojis() {
    localStorage.setItem('custom-emojis', JSON.stringify(customEmojis));
}

// 上传自定义表情
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
                renderCompletionChart();
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// 渲染历史列表
function renderPastLists() {
    const pastLists = document.getElementById('past-lists');
    pastLists.innerHTML = '';
    if (todoData.past.length === 0) {
        pastLists.innerHTML = '<p>暂无历史记录</p>';
        return;
    }
    todoData.past.forEach(list => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <span class="list-date" onclick="viewPastListDetail('${list.date}')">${list.date}</span>
            <div class="list-actions">
                <button class="icon-btn" onclick="editPastList('${list.date}')">✏️</button>
                <button class="icon-btn" onclick="confirmDeletePastList('${list.date}')">🗑️</button>
            </div>
        `;
        pastLists.appendChild(item);
    });
}

// 确认删除历史列表
function confirmDeletePastList(date) {
    if (confirm(`确定要删除 ${date} 的待办列表吗？`)) {
        todoData.past = todoData.past.filter(l => l.date !== date);
        saveUserData();
        renderPastLists();
    }
}

// 渲染完成度图表
function renderCompletionChart() {
    const canvas = document.getElementById('completion-chart');
    const ctx = canvas.getContext('2d');
    const completionRate = calculateOverallCompletionRate();
    document.getElementById('completion-title').textContent = `Completion Rate: ${completionRate}%`;
    const emojiContainer = document.getElementById('emoji-container');
    emojiContainer.innerHTML = '';
    if (completionRate < 40) {
        emojiContainer.innerHTML = customEmojis.low ? `<img src="${customEmojis.low}" style="width:24px;height:24px;">` : '😞';
    } else if (completionRate < 80) {
        emojiContainer.innerHTML = customEmojis.medium ? `<img src="${customEmojis.medium}" style="width:24px;height:24px;">` : '😐';
    } else {
        emojiContainer.innerHTML = customEmojis.high ? `<img src="${customEmojis.high}" style="width:24px;height:24px;">` : '😄';
    }
}

// 计算总体完成度
function calculateOverallCompletionRate() {
    if (todoData.past.length === 0 && todoData.today.length === 0) return 0;
    let total = 0, completed = 0;
    todoData.today.forEach(item => { total++; if (item.status === 'complete') completed++; });
    todoData.past.forEach(list => { list.items.forEach(item => { total++; if (item.status === 'complete') completed++; }); });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
}

// 切换图表视图
function toggleChartView(view) {
    currentChartView = view;
    renderCompletionChart();
}

// 启动
init();
