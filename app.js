let currentUserIP = "user-" + Math.random().toString(36).substr(2, 9);
let todoData = {};
let personalStickers = {};
let globalStickers = [];
let customEmojis = { low: "", medium: "", high: "" };

const STORAGE_KEY_TODO = "todo-user-data";
const STORAGE_KEY_STICKERS = "stickers-user-data";
const STORAGE_KEY_EMOJIS = "emojis-user-data";

async function init() {
    loadAllData();
    await loadGlobalStickers();
    initStickerCanvas();
}

function loadAllData() {
    // ✅ 永久加载：待办数据
    const todoSaved = localStorage.getItem(STORAGE_KEY_TODO);
    todoData = todoSaved ? JSON.parse(todoSaved) : { today: [], past: [], completionHistory: [] };

    // ✅ 永久加载：个人贴纸
    const stickersSaved = localStorage.getItem(STORAGE_KEY_STICKERS);
    personalStickers = stickersSaved ? JSON.parse(stickersSaved) : { stickers: [] };

    // ✅ 永久加载：自定义表情
    const emojisSaved = localStorage.getItem(STORAGE_KEY_EMOJIS);
    customEmojis = emojisSaved ? JSON.parse(emojis) : { low: "", medium: "", high: "" };
}

// ✅ 永久保存：待办
function saveTodo() {
    localStorage.setItem(STORAGE_KEY_TODO, JSON.stringify(todoData));
}

// ✅ 永久保存：贴纸
function saveStickers() {
    localStorage.setItem(STORAGE_KEY_STICKERS, JSON.stringify(personalStickers));
}

// ✅ 永久保存：表情
function saveEmojis() {
    localStorage.setItem(STORAGE_KEY_EMOJIS, JSON.stringify(customEmojis));
}

// ------------------------------
// 公共贴纸（你上传到GitHub的）
// ------------------------------
async function loadGlobalStickers() {
    try {
        const res = await fetch("https://api.github.com/repos/Jennyyyying/SelfDailyPan/contents/stickers");
        const files = await res.json();
        globalStickers = files
            .filter(f => f.name.match(/\.(png|jpg|jpeg)$/i))
            .map(f => f.download_url);
    } catch (e) {
        globalStickers = [];
    }
}

// ------------------------------
// 界面切换
// ------------------------------
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    if (id === "todo-screen") renderTodoItems();
    if (id === "past-screen") renderPastLists();
    if (id === "record-screen") renderCompletionChart();
}

// ------------------------------
// 待办列表（回车自动聚焦 + 自动保存）
// ------------------------------
function renderTodoItems() {
    const container = document.getElementById("todo-items");
    container.innerHTML = "";
    if (todoData.today.length === 0) addTodoItem();

    todoData.today.forEach(item => {
        const el = document.createElement("div");
        el.className = "todo-item";
        const cls = item.status === "partial" ? "partial" : item.status === "complete" ? "complete" : "";
        el.innerHTML = `
            <div class="todo-checkbox ${cls}" onclick="toggleStatus(${item.id})"></div>
            <input class="todo-input" type="text" value="${item.text}" 
                oninput="updateText(${item.id}, this.value)" 
                onkeydown="onKeyDown(event, ${item.id})">
        `;
        container.appendChild(el);
    });

    setTimeout(() => {
        const inputs = document.querySelectorAll(".todo-input");
        inputs[inputs.length - 1]?.focus();
    }, 0);
}

function addTodoItem(text = "") {
    todoData.today.push({
        id: Date.now(),
        text: text,
        status: ""
    });
    saveTodo();
    renderTodoItems();
}

function toggleStatus(id) {
    const item = todoData.today.find(i => i.id === id);
    if (!item) return;
    if (item.status === "") item.status = "partial";
    else if (item.status === "partial") item.status = "complete";
    else item.status = "";
    saveTodo();
    renderTodoItems();
}

function updateText(id, val) {
    const item = todoData.today.find(i => i.id === id);
    if (item) {
        item.text = val;
        saveTodo();
    }
}

function onKeyDown(e, id) {
    if (e.key === "Enter") {
        e.preventDefault();
        addTodoItem();
    }
}

// ------------------------------
// 贴纸拖拽（图片显示 + 不显示网址）
// ------------------------------
function openStickerPanel() {
    const p = document.getElementById("sticker-panel");
    p.classList.toggle("hidden");
    if (!p.classList.contains("hidden")) renderStickers();
}

function renderStickers() {
    const lib = document.getElementById("sticker-library");
    lib.innerHTML = "";

    if (globalStickers.length > 0) {
        lib.innerHTML += `<h4>Public Stickers</h4>`;
        globalStickers.forEach((src, i) => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "sticker-thumbnail";
            img.draggable = true;
            img.dataset.type = "global";
            img.dataset.index = i;
            img.addEventListener("dragstart", e => {
                e.dataTransfer.setData("text", JSON.stringify({ t: "g", i }));
            });
            lib.appendChild(img);
        });
    }

    lib.innerHTML += `<h4>My Stickers</h4>`;
    if (personalStickers.stickers.length === 0) {
        lib.innerHTML += `<p style="font-size:12px;color:#888;">No stickers yet</p>`;
    } else {
        personalStickers.stickers.forEach((src, i) => {
            const img = document.createElement("img");
            img.src = src;
            img.className = "sticker-thumbnail";
            img.draggable = true;
            img.dataset.type = "personal";
            img.dataset.index = i;
            img.addEventListener("dragstart", e => {
                e.dataTransfer.setData("text", JSON.stringify({ t: "p", i }));
            });
            lib.appendChild(img);
        });
    }
}

function initStickerCanvas() {
    const c = document.getElementById("sticker-canvas");
    c.addEventListener("dragover", e => e.preventDefault());
    c.addEventListener("drop", e => {
        e.preventDefault();
        try {
            const d = JSON.parse(e.dataTransfer.getData("text"));
            let src;
            if (d.t === "g") src = globalStickers[d.i];
            if (d.t === "p") src = personalStickers.stickers[d.i];
            if (!src) return;

            const img = document.createElement("img");
            img.src = src;
            img.className = "sticker";
            const rect = c.getBoundingClientRect();
            img.style.left = (e.clientX - rect.left - 35) + "px";
            img.style.top = (e.clientY - rect.top - 35) + "px";
            c.appendChild(img);
        } catch (_) {}
    });
}

function uploadPersonalSticker() {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = "image/*";
    i.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = ev => {
            personalStickers.stickers.push(ev.target.result);
            saveStickers();
            renderStickers();
        };
        r.readAsDataURL(file);
    };
    i.click();
}

// ------------------------------
// 历史列表 & 完成率
// ------------------------------
function renderPastLists() {
    const box = document.getElementById("past-lists");
    box.innerHTML = `<p style="padding:10px;">No history yet</p>`;
}

function renderCompletionChart() {
    const title = document.getElementById("completion-title");
    const total = todoData.today.length;
    const done = todoData.today.filter(i => i.status === "complete").length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    title.innerText = `Completion Rate: ${rate}%`;
}

function toggleChartView(v) {}

// ------------------------------
// 启动
// ------------------------------
init();
