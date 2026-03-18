// 全局状态：拆分贴纸库
let currentUserIP = '';
let todoData = {};
// 个人本地贴纸库（按IP隔离）
let personalStickers = {};
// 公共全局贴纸库（管理员添加，所有用户可见）
const globalStickers = [
    // 这里放你上传的公共贴纸URL，示例：
    // "https://your-domain.com/stickers/star.png",
    // "https://your-domain.com/stickers/heart.png"
];
let customEmojis = { low: '', medium: '', high: '' };

// 初始化加载个人贴纸
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

// 渲染贴纸面板（合并公共+个人）
function renderStickerLibrary() {
    const library = document.getElementById('sticker-library');
    library.innerHTML = '';
    
    // 先渲染公共贴纸
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

    // 再渲染个人贴纸
    library.innerHTML += '<h4>我的贴纸</h4>';
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

// 上传个人贴纸（所有用户可操作）
function uploadPersonalSticker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*'; // 支持png/jpg等格式
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

// 拖拽事件处理
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
        type: e.target.dataset.type,
        index: e.target.dataset.index
    }));
}
