let data = JSON.parse(localStorage.getItem("data") || "{}");
let stickers = [];

function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    if (id === "todo") initTodo();
    if (id === "past") renderPast();
    if (id === "record") renderChart();
}

/* TODO */

function initTodo() {
    let area = document.getElementById("todo-area");
    area.innerHTML = "";

    let today = getToday();
    if (!data[today]) data[today] = [];

    if (data[today].length === 0) addLine();

    data[today].forEach(item => createLine(item));
}

function createLine(item) {
    let area = document.getElementById("todo-area");

    let div = document.createElement("div");
    div.className = "todo-line";

    let box = document.createElement("div");
    box.className = "box " + item.state;

    let clickTimer;

    box.onclick = () => {
        if (clickTimer) {
            clearTimeout(clickTimer);
            item.state = "full";
        } else {
            clickTimer = setTimeout(() => {
                item.state = "partial";
                clickTimer = null;
                save();
                initTodo();
            }, 200);
        }
        save();
        initTodo();
    };

    let input = document.createElement("input");
    input.className = "input";
    input.value = item.text;

    input.oninput = () => {
        item.text = input.value;
        save();
    };

    input.onkeydown = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            addLine();
        }
    };

    div.appendChild(box);
    div.appendChild(input);
    area.appendChild(div);

    setTimeout(() => input.focus(), 0);
}

function addLine() {
    let today = getToday();
    data[today].push({ text: "", state: "" });
    save();
    initTodo();
}

function save() {
    localStorage.setItem("data", JSON.stringify(data));
}

function getToday() {
    return new Date().toISOString().split("T")[0];
}

/* Past */

function renderPast() {
    let box = document.getElementById("past-content");
    box.innerHTML = "";

    let keys = Object.keys(data);

    if (keys.length === 0) {
        box.innerHTML = `
            <div style="color:gray">
            Let's start our day.
            <button onclick="show('todo')">＋</button>
            </div>
        `;
        return;
    }

    keys.forEach(k => {
        let div = document.createElement("div");
        div.innerText = k;
        box.appendChild(div);
    });
}

/* Chart */

let chart;

function renderChart() {
    let keys = Object.keys(data);
    let rates = [];

    keys.forEach(k => {
        let list = data[k];
        let done = list.filter(i => i.state === "full").length;
        let r = list.length ? done / list.length * 100 : 0;
        rates.push(r);
    });

    let noData = document.getElementById("no-data");

    if (keys.length === 0) {
        noData.style.display = "block";
        return;
    }

    noData.style.display = "none";

    let avg = rates.reduce((a,b)=>a+b,0)/rates.length;
    document.getElementById("big-rate").innerText = avg.toFixed(0) + "%";

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "line",
        data: {
            labels: keys,
            datasets: [{ data: rates }]
        }
    });
}
