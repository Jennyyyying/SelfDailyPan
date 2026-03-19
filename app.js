let currentPage = "home";
let todos = [];
let stickers = [];

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(page).classList.add("active");

  if (page === "history") loadHistory();
  if (page === "stats") loadStats();
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

/* TODO */

function addTodo(text = "", state = 0) {
  let div = document.createElement("div");
  div.className = "todo-item";

  let box = document.createElement("div");
  box.className = "checkbox";

  let txt = document.createElement("div");
  txt.contentEditable = true;
  txt.innerText = text;

  let clickCount = 0;

  box.onclick = () => {
    clickCount++;
    if (clickCount === 1) {
      setTimeout(() => {
        if (clickCount === 1) {
          box.className = "checkbox half";
        } else {
          box.className = "checkbox full";
        }
        clickCount = 0;
      }, 200);
    }
  };

  if (state === 1) box.classList.add("half");
  if (state === 2) box.classList.add("full");

  div.appendChild(box);
  div.appendChild(txt);

  document.getElementById("todo-list").appendChild(div);
}

/* 保存 */

function saveToday() {
  let items = [];
  document.querySelectorAll(".todo-item").forEach(item => {
    let text = item.children[1].innerText;
    let box = item.children[0];

    let state = 0;
    if (box.classList.contains("half")) state = 1;
    if (box.classList.contains("full")) state = 2;

    items.push({ text, state });
  });

  let data = JSON.parse(localStorage.getItem("data") || "{}");
  data[getToday()] = { todos: items, stickers };

  localStorage.setItem("data", JSON.stringify(data));
  alert("Saved!");
}

/* 历史 */

function loadHistory() {
  let data = JSON.parse(localStorage.getItem("data") || "{}");
  let container = document.getElementById("history-list");
  container.innerHTML = "";

  Object.keys(data).forEach(date => {
    let div = document.createElement("div");
    div.innerText = date;

    let del = document.createElement("button");
    del.innerText = "🗑";
    del.onclick = () => {
      if (confirm("Delete?")) {
        delete data[date];
        localStorage.setItem("data", JSON.stringify(data));
        loadHistory();
      }
    };

    div.appendChild(del);
    container.appendChild(div);
  });
}

/* 统计 */

function loadStats() {
  let data = JSON.parse(localStorage.getItem("data") || "{}");

  let dates = [];
  let rates = [];

  Object.keys(data).forEach(date => {
    let todos = data[date].todos;
    let done = todos.filter(t => t.state === 2).length;
    let rate = todos.length ? done / todos.length : 0;

    dates.push(date);
    rates.push(rate * 100);
  });

  let avg = rates.reduce((a, b) => a + b, 0) / (rates.length || 1);

  document.getElementById("rate-title").innerText = avg.toFixed(1) + "%";

  let emoji = document.getElementById("rate-emoji");
  if (avg < 40) emoji.src = "emoji/low.png";
  else if (avg < 80) emoji.src = "emoji/mid.png";
  else emoji.src = "emoji/high.png";

  new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: dates,
      datasets: [{
        label: "Completion %",
        data: rates
      }]
    }
  });
}

/* 贴纸 */

function openStickerPanel() {
  let panel = document.getElementById("sticker-panel");
  panel.classList.toggle("hidden");

  panel.innerHTML = "";

  for (let i = 1; i <= 10; i++) {
    let img = document.createElement("img");
    img.src = "stickers/" + i + ".png";
    img.width = 50;

    img.onclick = () => addSticker(img.src);

    panel.appendChild(img);
  }
}

function addSticker(src) {
  let img = document.createElement("img");
  img.src = src;
  img.className = "sticker";

  img.style.left = "50px";
  img.style.top = "50px";

  dragElement(img);

  document.getElementById("sticker-layer").appendChild(img);
}

/* 拖拽 */

function dragElement(el) {
  let offsetX, offsetY;

  el.onmousedown = e => {
    offsetX = e.offsetX;
    offsetY = e.offsetY;

    document.onmousemove = e => {
      el.style.left = (e.pageX - offsetX) + "px";
      el.style.top = (e.pageY - offsetY) + "px";
    };

    document.onmouseup = () => {
      document.onmousemove = null;
    };
  };
}
