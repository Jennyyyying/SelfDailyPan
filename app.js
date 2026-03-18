// 全局状态
let currentUserIP = '';
let todoData = {};
// 个人本地贴纸库（按IP隔离）
let personalStickers = {};
// 公共全局贴纸库（自动从仓库加载）
let globalStickers = [];
let customEmojis = { low: '', medium: '', high: '' };
let currentChartView = 'month';

// 初始化：获取用户IP并加载所有数据
async function init() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        currentUserIP = data.ip;
    } catch (err) {
        console.error('Failed to get IP:', err);
        currentUserIP = 'default-user';
    }
    await loadGlobalStickers(); // 先加载公共贴纸
    loadUserData();
    loadPersonalStickers();
    loadCustomEmojis();
}

// 自动加载仓库 /stickers/ 下的所有公共贴纸
async function loadGlobalStickers() {
    try {
        const res = await fetch(
            "https://api.github.com/repos/Jennyyyying/SelfDailyPan/contents/stickers"
        );
        const files = await res.json();
        // 过滤图片文件并生成可访问URL
        globalStickers = files
            .filter(file => 
                file.name.endsWith(".png") || 
                file.name.endsWith(".jpg") || 
                file.name.endsWith(".jpeg")
            )
            .map(file => file.download_url);
    } catch (err) {
        console.error("加载公共贴纸失败:", err);
        globalStickers = [];
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

// 加载个人贴纸
function loadPersonalStickers() {
    const saved = localStorage.getItem(`personal-stickers-${currentUserIP}`);
    if (saved) {
        personalStickers = JSON.parse(saved);
    } else {
        personalStickers = { stickers: [] };
    }
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
        openStickerPanel(); // 打开贴纸面板
        openStickerPanel(); // 关闭贴纸面板（重置状态）
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
    const item = document.createElement('div');
    item.className = 'todo-item';
    const checkboxClass = item.status === 'partial' ? 'partial' : item.status === 'complete' ? 'complete' : '';
    item.innerHTML = `
        <div class="todo-checkbox ${checkboxClass}" onclick="toggleTodoStatus(this, ${item.id})"></div>
        <input type="text" class="todo-input" value="${item.text}" placeholder="XXX" onchange="updateTodoText(${item.id}, this.value)" onkeydown="handleTodoInput(event, ${item.id})">
    `;
    return item;
}

// 添加待办项
function addTodoItem(text = '') {
    const newItem = {
        id: Date.now(),
        text: text,
        status: '' // ''=未开始, 'partial'=半完成, 'complete'=已完成
    };
    todoData.today.push(newItem);
    saveUserData();
    renderTodoItems();
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

// 处理回车新增待办
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
    if (!panel.classList.contains('hidden')) {
        renderStickerLibrary();
    }
}

// 渲染贴纸面板（公共+个人）
function renderStickerLibrary() {
    const library = document.getElementById('sticker-library');
    library.innerHTML = '';
    
    // 公共贴纸区
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

    // 个人贴纸区
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
    // 这里简化实现，实际可使用Chart.js等库完善图表
    const completionRate = calculateOverallCompletionRate();
    document.getElementById('completion-title').textContent = `Completion Rate: ${completionRate}%`;
    const emojiContainer = document.getElementById('emoji-container');
    emojiContainer.innerHTML = '';
    if (completionRate < 40) {
        if (customEmojis.low) {
            const img = document.createElement('img');
            img.src = customEmojis.low;
            img.style.width = '24px';
            img.style.height = '24px';
            emojiContainer.appendChild(img);
        } else {
            emojiContainer.textContent = '😞';
        }
    } else if (completionRate < 80) {
        if (customEmojis.medium) {
            const img = document.createElement('img');
            img.src = customEmojis.medium;
            img.style.width = '24px';
            img.style.height = '24px';
            emojiContainer.appendChild(img);
        } else {
            emojiContainer.textContent = '😊';
        }
    } else {
        if (customEmojis.high) {
            const img = document.createElement('img');
            img.src = customEmojis.high;
            img.style.width = '24px';
            img.style.height = '24px';
            emojiContainer.appendChild(img);
        } else {
            emojiContainer.textContent = '😄';
        }
    }
}

// 计算总体完成度
function calculateOverallCompletionRate() {
    if (todoData.past.length === 0 && todoData.today.length === 0) return 0;
    let total = 0;
    let completed = 0;
    // 统计今日待办
    todoData.today.forEach(item => {
        total++;
        if (item.status === 'complete') completed++;
    });
    // 统计历史待办
    todoData.past.forEach(list => {
        list.items.forEach(item => {
            total++;
            if (item.status === 'complete') completed++;
        });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
}

// 切换图表视图
function toggleChartView(view) {
    currentChartView = view;
    renderCompletionChart();
}

// 初始化执行
init();
