// UI + game loop + persistence only. ALL game rules and data structures are the Python in js/templates.js.
let py = null, S = null;                          // Pyodide, latest game snapshot
let savedCode = JSON.parse(localStorage.getItem("savedDSACode") || "{}");
const $ = (id) => document.getElementById(id);
const VERSION = "1.0.0";   // version of the Python templates: change it only when the topics change (it clears old saves)
const SIZE = 6;
let sortDir = {}, sortSeed = 1, sortAnim = null, sortData = null;
let tool = "hand", selCrop = "Cabbage", sideTab = "shop", tab = "garden", soundOn = localStorage.getItem("gardenSound") !== "off";
let lastTick = Date.now(), lastVer = -1, treeData = null, bstData = null, animT = null, animB = null, winShown = false, busy = false;
const CAT_COLOR = { Garden: "#16a34a", Vegetable: "#dc2626", Herb: "#65a30d", Flower: "#ca8a04", Grain: "#d97706", Fruit: "#ea580c" };
const TOOLS = [["hand", "✋", "Q", "Plant / Harvest"], ["water", "💧", "W", "Water"], ["spray", "🧴", "E", "Spray pests"], ["inspect", "🔍", "R", "Inspect (BST)"]];

if (localStorage.getItem("templateVersion") !== VERSION) {   // topics changed in this version
  localStorage.setItem("savedDSACode_backup", JSON.stringify(savedCode));
  savedCode = {}; localStorage.setItem("savedDSACode", "{}");
  localStorage.removeItem("gardenGameSave"); localStorage.setItem("templateVersion", VERSION);
}

/* ---------- Python bridge ---------- */
async function initPyodide() {
  py = await loadPyodide();
  py.setStdout({ batched: (t) => { $("output-console").innerHTML += t + "<br>"; } });
}
const call = (fn, ...args) => py.globals.get(fn)(...args);
async function runTopics() {                      // run topics 1..8 (saved code or the template)
  const out = $("output-console"); out.innerHTML = "";
  for (const k of Object.keys(topicTemplates)) {
    await py.runPythonAsync(savedCode[k] || topicTemplates[k].code);
    if (!py.globals.has(topicTemplates[k].expect)) throw new Error(`Topic ${k}: your code must create "${topicTemplates[k].expect}".`);
  }
}
function saveGame() { try { if (py && py.globals.has("save_json")) localStorage.setItem("gardenGameSave", JSON.stringify({ t: Date.now(), d: call("save_json") })); } catch (e) { console.error(e); } }
function loadGame() {
  const raw = localStorage.getItem("gardenGameSave");
  if (!raw) return apply(JSON.parse(call("game_state")));
  try { const s = JSON.parse(raw); apply(JSON.parse(call("load_json", s.d, Math.max(0, (Date.now() - s.t) / 1000)))); }
  catch (e) { console.error("bad save", e); apply(JSON.parse(call("game_state"))); }
}
async function reloadAll() {                      // Run button: keep the game, reload the code
  const out = $("output-console");
  saveGame();
  try { await runTopics(); loadGame(); out.innerHTML += `<span class="text-emerald-300">✔ Topics 1–10 loaded. Back to the game!</span>`; toast("Your code ran ✔"); }
  catch (e) { out.innerHTML += `<span class="text-red-400">Error: ${e.message}</span>`; }
}
function act(cmd, args = {}) {                    // every player action goes through Python
  if (!py || busy) return;
  apply(JSON.parse(call("game_do", cmd, JSON.stringify(args))));
}
function loop() {                                 // real-time clock
  const now = Date.now(), dt = Math.min((now - lastTick) / 1000, 120); lastTick = now;
  if (!py || !py.globals.has("game_tick")) return;
  try { apply(JSON.parse(call("game_tick", dt))); } catch (e) { console.error(e); }
}

/* ---------- render ---------- */
function apply(s) {
  S = s; render();
  for (const e of s.events) handleEvent(e);
  if (s.msg) { toast(s.msg); if (/·.*step\(s\)/.test(s.msg)) $("inspect-out").textContent = s.msg; }
  if (s.won && !winShown) { winShown = true; $("win").classList.remove("hidden"); sfx("win"); }
  if (tab === "lab" && s.ver !== lastVer) refreshLab();
  lastVer = s.ver;
}
function render() {
  const s = S, pct = (v, m = 100) => Math.min(100, (v / m) * 100) + "%";
  $("h-level").textContent = s.level; $("h-coins").textContent = s.coins;
  $("h-xp").textContent = s.xp_to ? `${s.xp}/${s.xp_to} xp` : `${s.xp} xp (MAX)`;
  $("b-xp").style.width = s.xp_to ? ((s.xp - s.xp_from) / (s.xp_to - s.xp_from)) * 100 + "%" : "100%";
  for (const k of ["water", "energy", "hope"]) { $("h-" + k).textContent = s[k]; $("b-" + k).style.width = pct(s[k]); }
  const day = Math.floor(s.clock / 120) + 1, ph = (s.clock % 120) / 120;    // 120 s = one day
  const night = ph > 0.65 ? Math.min(1, (ph - 0.65) / 0.1, (1 - ph) / 0.05) : 0;
  $("h-day").textContent = day; $("h-tod").textContent = night > 0.5 ? "🌙" : ph > 0.5 ? "🌇" : "☀️";
  $("night").style.opacity = (night * 0.5).toFixed(2); $("h-plants").textContent = s.plants;
  const w = s.weather_info[s.weather];
  $("wb-emoji").textContent = w.emoji; $("wb-name").textContent = s.weather; $("wb-left").textContent = s.weather_left;
  $("wb-mult").textContent = w.grow; $("wb-text").textContent = w.text;
  $("wx").className = "overlay w-" + s.weather;
  $("forecast").innerHTML = s.forecast.map((n, i) => `<div class="item flex justify-between"><span>${s.weather_info[n].emoji} <b>${n}</b></span><span class="text-emerald-300/80">${i === 0 ? "Next out (front)" : "#" + (i + 1)}</span></div>`).join("");
  $("action-stack").innerHTML = [...s.history].reverse().map((a, i) => `<div class="item">${i === 0 ? "TOP → " : "→ "}Planted ${a.crop} (${a.r},${a.c})</div>`).join("") || "<i class='text-emerald-300/60'>Stack is empty</i>";
  setAmbience(s.weather); renderGrid(); renderHotbar(); renderSide();
  $("btn-boost").disabled = s.energy < 40;
}
function renderGrid() {
  const g = $("garden-grid");
  if (!g.children.length) for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const b = document.createElement("button"); b.className = "tile"; b.dataset.r = r; b.dataset.c = c;
    b.onclick = () => onTile(r, c); g.appendChild(b);
  }
  S.cells.forEach((row, r) => row.forEach((p, c) => {
    const b = g.children[r * SIZE + c], sig = JSON.stringify(p);
    if (b._sig === sig) return; b._sig = sig;
    if (!p) { b.className = "tile"; b.innerHTML = ""; b.title = `grid[${r}][${c}] · empty`; return; }
    const sick = p.h === "Pest-Infested", wilt = p.h === "Wilted", dead = p.h === "Dead";
    b.className = "tile" + (p.ripe && !dead ? " ripe" : "") + (dead ? " dead" : "") + (sick ? " sick" : "") + (wilt ? " wilted" : "") + (p.m ? " mutated" : "");
    const size = dead ? 28 : Math.round(16 + 24 * Math.min(1, p.p / 100));
    const face = dead ? "🥀" : p.p < 34 ? "🌱" : p.e;
    b.innerHTML = `<span class="plant" style="font-size:${size}px">${face}</span>` + (p.m ? `<span class="mut m-${p.m}">${p.m}</span>` : "") +
      (wilt ? '<span class="badge">💧</span>' : sick ? '<span class="badge">🐛</span>' : "") + `<div class="pg"><i style="width:${p.p}%"></i></div>`;
    b.title = `grid[${r}][${c}] · ${p.crop} · ${p.stage} · ${p.h}${p.m ? " · " + p.m : ""} · ${p.w} kg · ₱${p.val}`;
  }));
}
function renderHotbar() {
  const s = S;
  $("hotbar").innerHTML = TOOLS.map(([id, e, k, tip]) => `<div class="slot ${tool === id ? "sel" : ""}" data-tool="${id}" title="${tip}"><span class="k">${k}</span>${e}</div>`).join("") +
    `<div class="w-px bg-emerald-800 mx-1"></div>` +
    s.crops.map((c, i) => {
      const lock = c.level > s.level, n = s.seeds[c.name] || 0;
      return `<div class="slot ${lock ? "lock" : ""} ${tool === "hand" && selCrop === c.name ? "sel" : ""}" data-crop="${c.name}" title="${c.name}${lock ? " · Level " + c.level : ""}"><span class="k">${(i + 1) % 10}</span>${lock ? "🔒" : c.e}<span class="n">${n}</span></div>`;
    }).join("");
}
function renderSide() {
  const s = S; let h = "";
  if (sideTab === "shop") {
    const chips = [["level", "Level"], ["cost", "Price"], ["secs", "Time"], ["value", "Value"], ["name", "A–Z"]].map(([k, l]) => `<button class="btn ${s.shop_sort === k ? "bg-lime-700" : "bg-[#2a3825] border border-emerald-800"} !py-1 !px-2" data-shopsort="${k}">${l}</button>`).join("");
    h = `<div class="flex flex-wrap items-center gap-1"><span class="text-emerald-300">Restock <b>${s.restock_left}s</b> · merge sort:</span>${chips}</div>` + s.crops.map((c) => {
      const lock = c.level > s.level, st = s.stock[c.name] || 0, ok = !lock && st > 0 && s.coins >= c.cost;
      const col = { common: "text-emerald-300", uncommon: "text-sky-300", rare: "text-fuchsia-300" }[c.rarity];
      return `<div class="item flex items-center gap-2 ${lock ? "dim" : ""}"><span class="text-xl">${c.e}</span><div class="flex-1"><b>${c.name}</b> <span class="${col}">${c.rarity}</span><div class="text-emerald-200/70">${lock ? "🔒 Level " + c.level : `${c.secs}s · ₱${c.value} · stock ${st}`}</div></div><button class="btn ${ok ? "bg-emerald-700" : "bg-stone-700"}" data-buy="${c.name}" ${ok ? "" : "disabled"}>🪙 ${c.cost}</button></div>`;
    }).join("");
  } else if (sideTab === "basket") {
    const sb = [["weight", "Weight"], ["value", "Value"], ["name", "Name"], ["mutation", "Mutation"]].map(([k, l]) => `<button class="btn bg-[#2a3825] border border-emerald-800 !py-1 !px-2" data-sort="${k}">${l} ${sortDir[k] === false ? "▲" : "▼"}</button>`).join("");
    h = `<div class="text-emerald-300">${s.basket.length}/${s.basket_max} fruits · insertion sort:</div><div class="flex flex-wrap gap-1">${sb}</div><div class="text-amber-300">${s.basket_note || ""}</div>` + (s.basket.map((f) => `<div class="item flex justify-between"><span>${f.emoji} ${f.crop} ${f.mut ? `<span class="mut m-${f.mut} px-1 rounded text-[10px] text-black font-black">${f.mut}</span>` : ""}</span><span class="text-yellow-300">${f.weight}kg · ₱${f.value}</span></div>`).join("") || "<i class='text-emerald-300/60'>Empty. Harvest something first!</i>") +
      `<button id="side-sell" class="btn bg-yellow-600 w-full justify-center mt-2">Sell All</button>`;
  } else if (sideTab === "orders") {
    h = `<div class="text-emerald-300">Neighbors waiting in line (FIFO). Only the one at the front can be delivered.</div>` + (s.orders.map((o, i) => {
      const have = s.basket.filter((f) => f.crop === o.crop).length;
      return `<div class="item ${i ? "dim" : ""}"><div class="flex justify-between"><b>${o.face} ${o.npc}</b><span>${i === 0 ? "FRONT · " + Math.ceil(o.ttl) + "s" : "#" + (i + 1)}</span></div>
        <div>${o.qty}× ${o.emoji} ${o.crop} <span class="text-emerald-300">(you have ${have})</span> → <b class="text-yellow-300">🪙 ${o.reward}</b></div>
        ${i === 0 ? `<button class="btn ${have >= o.qty ? "bg-emerald-700" : "bg-stone-700"} w-full justify-center mt-1" id="side-deliver" ${have >= o.qty ? "" : "disabled"}>Deliver</button>` : ""}</div>`;
    }).join("") || "<i class='text-emerald-300/60'>No orders yet…</i>");
  } else if (sideTab === "board") {
    h = `<div class="text-emerald-300">Village Harvest Leaderboard. Score = profit + 10×harvests + 25×deliveries. Sorted with merge sort.</div>` +
      s.board.map((r) => `<div class="item flex items-center gap-2 ${r.me ? "!border-lime-400" : ""}"><span class="w-6 text-center font-black ${r.rank === 1 ? "text-yellow-300" : ""}">${r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}</span><span class="text-xl">${r.face}</span><b class="flex-1">${r.name}</b><span class="text-yellow-300 font-black">${r.score}</span></div>`).join("") +
      `<div class="text-emerald-400/70">${s.board_note}</div>`;
  } else {
    h = s.quests.map((q) => `<div class="item"><div class="flex justify-between"><b>${q.text}</b><span>🪙 ${q.reward}</span></div><div class="bar mt-1"><div class="bg-lime-400" style="width:${(q.value / q.target) * 100}%"></div></div>
      <div class="flex justify-between mt-1"><span>${q.value}/${q.target}</span>${q.done ? "<span class='text-emerald-300'>✔ Claimed</span>" : `<button class="btn ${q.value >= q.target ? "bg-emerald-700" : "bg-stone-700"}" data-claim="${q.i}" ${q.value >= q.target ? "" : "disabled"}>Claim</button>`}</div></div>`).join("");
  }
  if ($("side")._h !== h) { const sc = $("side").scrollTop; $("side").innerHTML = h; $("side").scrollTop = sc; $("side")._h = h; }
}

/* ---------- input ---------- */
function onTile(r, c) {
  const p = S.cells[r][c];
  if (tool === "inspect") return act("inspect", { r, c });
  if (tool === "water") return act("water", { r, c });
  if (tool === "spray") return act("spray", { r, c });
  if (p) return act("harvest", { r, c });                    // ripe -> harvest, dead -> clear
  act("plant", { r, c, name: selCrop });
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tool],[data-crop],[data-buy],[data-claim],[data-tab],[data-side],[data-sort],[data-shopsort]"); resumeAudio();
  if (!t) return;
  if (t.dataset.tool) { tool = t.dataset.tool; renderHotbar(); }
  else if (t.dataset.crop) { selCrop = t.dataset.crop; tool = "hand"; renderHotbar(); }
  else if (t.dataset.buy) act("buy", { name: t.dataset.buy });
  else if (t.dataset.claim) act("claim", { i: +t.dataset.claim });
  else if (t.dataset.sort) { const k = t.dataset.sort, desc = sortDir[k] !== false; act("sort_basket", { by: k, desc }); sortDir[k] = !desc; }
  else if (t.dataset.shopsort) act("shop_sort", { by: t.dataset.shopsort });
  else if (t.dataset.tab) switchTab(t.dataset.tab);
  else if (t.dataset.side) { sideTab = t.dataset.side; document.querySelectorAll("[data-side]").forEach((b) => b.classList.toggle("on", b === t)); $("side")._h = null; renderSide(); }
});
document.addEventListener("click", (e) => {
  if (e.target.closest("#side-sell")) act("sell");
  if (e.target.closest("#side-deliver")) act("deliver");
});
document.addEventListener("keydown", (e) => {
  if (["TEXTAREA", "INPUT", "SELECT"].includes(e.target.tagName) || e.ctrlKey || e.metaKey || !S || tab !== "garden") return;
  const k = e.key.toLowerCase();
  if (/^[0-9]$/.test(k)) { const c = S.crops[(+k + 9) % 10]; if (c && c.level <= S.level) { selCrop = c.name; tool = "hand"; renderHotbar(); } return; }
  const map = {
    q: () => (tool = "hand"), w: () => (tool = "water"), e: () => (tool = "spray"), r: () => (tool = "inspect"),
    h: () => act("harvest_all"), p: () => act("prune"), s: () => act("sell"), b: () => act("boost"), u: () => act("undo")
  };
  if (map[k]) { map[k](); renderHotbar(); }
});
function switchTab(t) {
  tab = t;
  for (const v of ["garden", "lab", "code"]) $("view-" + v).classList.toggle("hidden", v !== t);
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  if (t === "lab") refreshLab();
}

/* ---------- effects: toast, floating text, sound ---------- */
function toast(msg) {
  const d = document.createElement("div"); d.className = "toast"; d.textContent = msg; $("toasts").appendChild(d);
  while ($("toasts").children.length > 3) $("toasts").firstChild.remove();
  setTimeout(() => d.remove(), Math.max(2600, msg.length * 55));
}
function handleEvent(e) {
  if (e.t === "toast") toast(e.text);
  else if (e.t === "sfx") sfx(e.name);
  else if (e.t === "fx") {
    let x = innerWidth / 2, y = 120;
    if (e.r !== null && e.r !== undefined && tab === "garden") { const b = $("garden-grid").children[e.r * SIZE + e.c].getBoundingClientRect(); x = b.left + b.width / 2 - 16; y = b.top; }
    const f = document.createElement("div"); f.className = "floaty"; f.textContent = e.text; f.style.left = x + "px"; f.style.top = y + "px";
    f.style.color = e.good ? "#fde047" : "#fca5a5"; document.body.appendChild(f); setTimeout(() => f.remove(), 1400);
  }
}
let ac = null;
function resumeAudio() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); startMusic(); } catch (e) { } }
const SFX = {
  plant: [[300, .06]], harvest: [[520, .07], [700, .09]], sell: [[660, .06], [880, .06], [1100, .1]], buy: [[440, .06]], water: [[250, .08]], spray: [[200, .08]],
  deliver: [[523, .08], [659, .08], [784, .12]], quest: [[523, .08], [784, .08], [1046, .14]], undo: [[330, .06], [250, .06]], weather: [[200, .12]], restock: [[600, .05], [800, .05]],
  boost: [[400, .06], [800, .1]], clear: [[180, .1]], win: [[523, .12], [659, .12], [784, .12], [1046, .3]]
};
function sfx(name) {
  if (!soundOn || !ac || !SFX[name]) return;
  let t = ac.currentTime;
  for (const [f, d] of SFX[name]) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = "triangle"; o.frequency.value = f;
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d); t += d * 0.8;
  }
}


/* ---------- relaxing background music (made with WebAudio: no audio files, no extra library) ---------- */
let musicOn = localStorage.getItem("gardenMusic") !== "off", mus = null;
const CHORDS = [[48, 55, 59, 64], [45, 52, 60, 64], [41, 48, 57, 64], [43, 50, 59, 62]];   // soft chords (MIDI notes): Cmaj7, Am7, Fmaj7, G6
const BELLS = [72, 74, 76, 79, 81, 84];                                                   // C major pentatonic: always sounds pleasant
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function startMusic() {
  if (!musicOn || !ac || mus) return;
  const out = ac.createGain(); out.gain.value = 0; out.connect(ac.destination);
  out.gain.linearRampToValueAtTime(0.6, ac.currentTime + 4);                                // slow fade in
  const echo = ac.createDelay(1), fb = ac.createGain(), lp = ac.createBiquadFilter();       // soft echo for the bells
  echo.delayTime.value = 0.45; fb.gain.value = 0.38; lp.type = "lowpass"; lp.frequency.value = 1800;
  echo.connect(lp); lp.connect(fb); fb.connect(echo); lp.connect(out);
  const pad = ac.createBiquadFilter(); pad.type = "lowpass"; pad.frequency.value = 900; pad.connect(out);
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;                          // white noise -> wind and rain
  const srcs = [], noise = (type, freq, q) => {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = buf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(out); s.start(); srcs.push(s); return g;
  };
  const wind = noise("bandpass", 500, 0.6), rain = noise("highpass", 3500, 0.5);
  const lfo = ac.createOscillator(), lg = ac.createGain();                                  // slow breathing of the wind
  lfo.frequency.value = 0.07; lg.gain.value = 0.008; lfo.connect(lg); lg.connect(wind.gain); lfo.start(); srcs.push(lfo);
  mus = { out, echo, pad, wind, rain, srcs, timers: [], step: 0 };
  setAmbience(S ? S.weather : "Sunny");
  const chord = () => {
    if (!mus) return;
    const t = ac.currentTime + 0.05;
    for (const m of CHORDS[mus.step++ % CHORDS.length]) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = hz(m);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 3); g.gain.linearRampToValueAtTime(0, t + 9.5);
      o.connect(g); g.connect(pad); o.start(t); o.stop(t + 10);
    }
    mus.timers.push(setTimeout(chord, 8000));
  };
  const bell = () => {
    if (!mus) return;
    if (!document.hidden) {
      const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine"; o.frequency.value = hz(BELLS[Math.floor(Math.random() * BELLS.length)]);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
      o.connect(g); g.connect(out); g.connect(echo); o.start(t); o.stop(t + 3.6);
    }
    mus.timers.push(setTimeout(bell, 2500 + Math.random() * 3500));
  };
  chord(); mus.timers.push(setTimeout(bell, 3000));
}
function stopMusic() {
  if (!mus) return;
  const m = mus; mus = null; m.timers.forEach(clearTimeout);
  m.out.gain.cancelScheduledValues(ac.currentTime); m.out.gain.setTargetAtTime(0, ac.currentTime, 0.4);   // fade out
  setTimeout(() => { m.srcs.forEach((s) => { try { s.stop(); } catch (e) { } }); m.out.disconnect(); }, 2000);
}
function setAmbience(weather) {                    // the sound of the weather mixes into the music
  if (!mus) return;
  const rain = { Rain: 0.05, Thunderstorm: 0.07, Typhoon: 0.08 }[weather] || 0, wind = { Typhoon: 0.06, Heatwave: 0.005 }[weather] ?? 0.02;
  mus.rain.gain.setTargetAtTime(rain, ac.currentTime, 1.5); mus.wind.gain.setTargetAtTime(wind, ac.currentTime, 1.5);
}

/* ---------- DSA Lab ---------- */
function refreshLab() { if (!py || !py.globals.has("tree_json")) return; setTree(JSON.parse(call("tree_json"))); setBST(JSON.parse(call("bst_json"))); drawHashAll(JSON.parse(call("hash_json", ""))); sortSetup(false); }
function drawBinary(svgId, root, height, visited = []) {  // draws ANY binary tree as circles and lines
  const el = $(svgId);
  if (!root) { el.setAttribute("width", 420); el.setAttribute("height", 60); el.innerHTML = `<text x="20" y="35" fill="#6ee7b7" font-size="13">Empty tree. Plant something first (or use the Demo tree).</text>`; return; }
  const pos = {}; let i = 0;
  (function lay(n, d) { if (!n) return; lay(n.left, d + 1); pos[n.id] = { x: i++, y: d, n, p: null }; lay(n.right, d + 1); })(root, 0);
  (function link(n) { if (!n) return; for (const c of [n.left, n.right]) if (c) { pos[c.id].p = n; link(c); } })(root);
  const GX = 46, GY = 62, R = 18, W = Math.max(i * GX + 20, 320), H = (height + 1) * GY + 20;
  const px = (id) => 20 + pos[id].x * GX, py_ = (id) => 24 + pos[id].y * GY;
  let svg = "";
  for (const id in pos) if (pos[id].p) svg += `<line x1="${px(pos[id].p.id)}" y1="${py_(pos[id].p.id)}" x2="${px(id)}" y2="${py_(id)}" stroke="#6ee7b7" stroke-opacity=".5" stroke-width="3"/>`;
  for (const id in pos) {
    const n = pos[id].n, k = visited.indexOf(+id), cur = k === visited.length - 1 && k >= 0;
    const fill = k < 0 ? (CAT_COLOR[n.cat] || "#3b82f6") : cur ? "#facc15" : "#38bdf8";
    const ring = n.health === "Wilted" ? "#38bdf8" : n.health === "Pest-Infested" ? "#ef4444" : n.health === "Dead" ? "#6b7280" : n.mutation ? "#f0abfc" : "#fff";
    const info = n.stage ? ` · ${n.stage} · ${n.health}${n.mutation ? " · " + n.mutation : ""}${n.bf !== undefined ? " · balance factor " + n.bf : ""}` : "";
    svg += `<g><title>${n.name}${info} · depth ${pos[id].y}</title><circle cx="${px(id)}" cy="${py_(id)}" r="${R}" fill="${fill}" stroke="${ring}" stroke-width="${cur || ring !== "#fff" ? 3 : 1.5}"/>
      <text x="${px(id)}" y="${py_(id) + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#0b1220">${n.label}</text>
      ${n.bf !== undefined ? `<text x="${px(id)}" y="${py_(id) + R + 12}" text-anchor="middle" font-size="10" font-weight="700" fill="${Math.abs(n.bf) > 1 ? "#f87171" : "#94a3b8"}">bf ${n.bf}</text>` : ""}
      ${k >= 0 ? `<text x="${px(id) + R - 2}" y="${py_(id) - R + 2}" font-size="11" font-weight="700" fill="#fde68a">${k + 1}</text>` : ""}</g>`;
  }
  el.setAttribute("width", W); el.setAttribute("height", H); el.innerHTML = svg;
}
function setTree(d) {
  treeData = d; clearInterval(animT);
  $("t-size").textContent = d.size; $("t-height").textContent = d.height;
  $("tree-title").textContent = d.expected ? "(Example tree A–F)" : "(Garden)";
  $("t-out").textContent = ""; $("t-check").textContent = ""; drawBinary("tree-svg", d.root, d.height);
}
function runTraversal(kind) {
  const seq = treeData && treeData.orders[kind]; if (!seq) return toast("Run the code first.");
  clearInterval(animT); let k = 0; $("t-check").textContent = "";
  animT = setInterval(() => {
    k++; drawBinary("tree-svg", treeData.root, treeData.height, seq.slice(0, k).map((s) => s[0]));
    $("t-out").textContent = kind.toUpperCase() + ": " + seq.slice(0, k).map((s) => s[1]).join(" → ");
    if (k >= seq.length) {
      clearInterval(animT);
      if (treeData.expected) {
        const ok = seq.map((s) => s[1]).join(" ") === treeData.expected[kind];
        $("t-check").innerHTML = ok ? `<span class="text-emerald-300">✔ Matches expected: ${treeData.expected[kind]}</span>` : `<span class="text-red-400">✘ Expected ${treeData.expected[kind]}</span>`;
      }
    }
  }, 450);
}
function setBST(d) {
  bstData = d; clearInterval(animB);
  $("b-size").textContent = d.size; $("b-height").textContent = Math.max(0, d.height);
  $("bst-title").textContent = d.which === "garden" ? `(Garden tree = AVL: key = row×${SIZE} + col)` : d.which === "avl" ? "(AVL demo: self-balancing with rotations)" : "(Plain BST demo: practice insert / delete)";
  const b = d.balance, icon = { Balanced: "✔", "Slightly lopsided": "≈", Skewed: "⚠" }[b.label] || "";
  $("b-balance").textContent = d.size ? `${icon} ${b.label}: height ${b.height}, best possible ${b.best}` + (b.label === "Skewed" ? " · searching is close to O(n). Try Rebuild balanced." : "") : "";
  $("b-out").textContent = d.msg || ""; $("b-check").textContent = "";
  drawBinary("bst-svg", d.root, d.height);
  if (d.path.length) animateSeq(d.path, () => { });
}
function animateSeq(ids, done) {
  clearInterval(animB); let k = 0;
  animB = setInterval(() => { k++; drawBinary("bst-svg", bstData.root, bstData.height, ids.slice(0, k)); if (k >= ids.length) { clearInterval(animB); done(); } }, 450);
}
function runBST(kind) {
  const seq = bstData && bstData.orders[kind]; if (!seq || !seq.length) return toast("The tree is empty.");
  $("b-check").textContent = "";
  animateSeq(seq.map((s) => s[0]), () => {
    const keys = seq.map((s) => +s[1]);
    if (kind === "inorder") $("b-check").innerHTML = keys.every((x, i) => !i || keys[i - 1] < x) ? `<span class="text-emerald-300">✔ Inorder gives ascending (sorted) keys. That is the BST property.</span>` : `<span class="text-red-400">✘ Not sorted</span>`;
  });
  let k = 0; const t = setInterval(() => { k++; $("b-out").textContent = kind.toUpperCase() + ": " + seq.slice(0, k).map((s) => s[1]).join(" → "); if (k >= seq.length) clearInterval(t); }, 450);
}
const REQ = [["Python OOP", "Crop, ResourceStorage, Plant, Game, GardenTree(BinaryTree) (Topics 1, 4, 5, 10)", "Every crop, shop, basket and mutation is an object"],
["Stack", "ActionHistoryStack push/pop (Topic 2)", "Undo (↩) returns the seed; Action History panel"],
["Queue", "ClimateQueue, OrderQueue deque (Topic 3)", "Weather forecast and the line of neighbor orders"],
["2D list / array", "GardenGrid.cells[row][col] 6×6 (Topic 4)", "The garden field (36 tiles)"],
["Hierarchical tree", "TreeNode, BinaryTree, GardenTree (Topic 5)", "DSA Lab: Garden tree; each plant is a node"],
["BFS / DFS", "bfs, preorder, inorder, postorder, dfs_stack (Topic 6)", "DSA Lab animations; Postorder = Prune Dead"],
["BST insert/search/delete", "BST + find_min (Topic 7)", "Plant = insert, Inspect = search, Harvest = delete"],
["Node mutation", "BSTNode.refresh, copy_from (Topic 7, 10)", "Every tick updates the node (stage/health/mutation); delete case 3 copies the successor"],
["AVL tree", "AVLTree, right_rotate, left_rotate, _rebalance (Topic 7)", "The garden tree is an AVL tree: always balanced, even with sorted planting; AVL demo in the DSA Lab"],
["Sorting", "insertion_sort, merge_sort + bubble, selection, quick (Topic 8)", "Basket sort (insertion), Shop sort and Leaderboard (merge), Sorting Lab animation"],
["Hash table", "HashTable (chaining), OpenAddressTable, rehash (Topic 9)", "Plant ID registry that rehashes when more plants are added; Hash Table Lab"]];
/* ----- Sorting Lab ----- */
function sortSetup(redraw = true) {
  if (!py || !py.globals.has("sort_lab")) return;
  if (!$("sort-table").children.length) {
    const algo = $("sort-algo").value;
    $("sort-table").innerHTML = JSON.parse(call("sort_table")).map((r) => `<tr data-id="${r.id}"><td class="p-1.5 font-bold">${r.name}</td><td class="p-1.5">${r.best}</td><td class="p-1.5">${r.avg}</td><td class="p-1.5">${r.worst}</td><td class="p-1.5">${r.space}</td><td class="p-1.5">${r.stable}</td></tr>`).join("");
  }
  const name = $("sort-algo").value;
  [...$("sort-table").children].forEach((tr) => tr.classList.toggle("text-lime-300", tr.dataset.id === name));
  if (redraw || !sortData) { clearInterval(sortAnim); sortData = JSON.parse(call("sort_lab", name, Math.max(5, Math.min(40, +$("sort-size").value || 16)), sortSeed)); drawBars(sortData.frames[0], []); $("sort-out").textContent = "Array ready. Press Sort."; $("sort-info").textContent = ""; }
}
function drawBars(arr, hot) {
  $("sort-bars").innerHTML = arr.map((v, i) => `<div class="flex-1 rounded-t text-[9px] text-center text-black font-bold ${hot.includes(i) ? "bg-yellow-300" : "bg-sky-400"}" style="height:${v * 1.5}px">${arr.length <= 22 ? v : ""}</div>`).join("");
}
function runSort() {
  sortSetup(true); const d = sortData; let k = 0; clearInterval(sortAnim);
  sortAnim = setInterval(() => {
    k++; const f = d.frames[Math.min(k, d.frames.length - 1)], p = d.frames[Math.max(0, Math.min(k, d.frames.length - 1) - 1)];
    drawBars(f, f.map((v, i) => (v !== p[i] ? i : -1)).filter((i) => i >= 0));
    $("sort-out").textContent = `${d.info.name}: step ${Math.min(k, d.frames.length - 1)} / ${d.frames.length - 1}`;
    if (k >= d.frames.length - 1) {
      clearInterval(sortAnim); drawBars(d.frames[d.frames.length - 1], []);
      $("sort-out").innerHTML = `${d.info.name} finished. Comparisons: <b>${d.comps}</b> for ${d.frames[0].length} numbers. ${d.sorted ? "✔ Correctly sorted" : "✘ NOT sorted"}. Best ${d.info.best} · Avg ${d.info.avg} · Worst ${d.info.worst} · Space ${d.info.space} · Stable: ${d.info.stable}`;
    }
  }, 160);
}
/* ----- Hash Table Lab ----- */
function drawHashTable(el, t, title) {
  if (!t) { el.innerHTML = "<i class='text-emerald-300/60'>Start the game code first.</i>"; return; }
  const thr = Math.min(100, (t.max_load / (t.kind === "chain" ? 1.5 : 1)) * 100);
  let h = `<div class="mb-1">Size <b>${t.size}</b> · keys <b>${t.count}</b> · load factor <b class="${t.load > t.max_load ? "text-red-400" : "text-lime-300"}">${t.load}</b> (rehash above ${t.max_load}) · collisions <b>${t.collisions}</b> · rehashes <b>${t.rehashes}</b>${t.kind === "chain" ? ` · longest chain <b>${t.max_chain}</b>` : ""}</div>`;
  h += `<div class="bar mb-2 relative"><div class="bg-gradient-to-r from-lime-400 to-rose-400" style="width:${Math.min(100, (t.load / (t.kind === "chain" ? 1.5 : 1)) * 100)}%"></div></div>`;
  h += `<div class="max-h-56 overflow-auto space-y-0.5">` + t.slots.map((s, i) => t.kind === "chain"
    ? `<div class="flex gap-1 items-center"><span class="w-6 text-right text-slate-400">${i}</span><span class="text-slate-500">→</span>${s.map((k) => `<span class="px-1.5 rounded bg-sky-800">${k}</span>`).join('<span class="text-slate-500">→</span>') || '<span class="text-slate-600">empty</span>'}</div>`
    : `<div class="flex gap-1 items-center"><span class="w-6 text-right text-slate-400">${i}</span><span class="px-1.5 rounded ${s === null ? "text-slate-600" : s === "x" ? "bg-red-900 text-red-200" : "bg-fuchsia-800"}">${s === null ? "empty" : s === "x" ? "✖ deleted" : s}</span></div>`).join("") + `</div>`;
  el.innerHTML = h;
}
function drawHashAll(d) {
  drawHashTable($("hash-garden"), d.garden); drawHashTable($("hash-chain"), d.chain); drawHashTable($("hash-open"), d.open);
  if (d.msg) $("hash-out").textContent = d.msg;
}
function initLab() {
  $("sort-algo").onchange = () => sortSetup(true); $("sort-size").onchange = () => sortSetup(true);
  $("btn-sort-new").onclick = () => { sortSeed++; sortSetup(true); }; $("btn-sort-go").onclick = runSort;
  document.querySelectorAll("[data-hop]").forEach((b) => (b.onclick = () => { const k = $("hash-key").value.trim(); if (!k && !["reset", "sample"].includes(b.dataset.hop)) return toast("Type a key (for example a crop name)."); drawHashAll(JSON.parse(call("hash_op", b.dataset.hop, k))); }));
  $("btn-avl").onclick = () => setBST(JSON.parse(call("avl_demo")));
  $("reqmap").innerHTML = REQ.map((r) => `<tr><td class="p-1.5 font-bold text-lime-200">${r[0]}</td><td class="p-1.5 code-font">${r[1]}</td><td class="p-1.5">${r[2]}</td></tr>`).join("");
  document.querySelectorAll("[data-trav]").forEach((b) => (b.onclick = () => runTraversal(b.dataset.trav)));
  document.querySelectorAll("[data-btrav]").forEach((b) => (b.onclick = () => runBST(b.dataset.btrav)));
  document.querySelectorAll("[data-bshow]").forEach((b) => (b.onclick = () => setBST(JSON.parse(call("show_bst", b.dataset.bshow)))));
  document.querySelectorAll("[data-bop]").forEach((b) => (b.onclick = () => {
    const v = parseInt($("bst-key").value);
    if (isNaN(v) || v < 0 || v > 99) return toast("Type a number from 0 to 99."); setBST(JSON.parse(call("bst_op", b.dataset.bop, v)));
  }));
  $("btn-gtree").onclick = () => setTree(JSON.parse(call("show_garden_tree")));
  $("btn-demo").onclick = () => setTree(JSON.parse(call("show_demo")));
  $("btn-resetdemo").onclick = () => setBST(JSON.parse(call("reset_demo")));
  $("btn-skew").onclick = () => setBST(JSON.parse(call("skew_demo")));
  $("btn-rebuild").onclick = () => setBST(JSON.parse(call("rebuild")));
}

/* ---------- code editor ---------- */
function initEditor() {
  Object.keys(topicTemplates).forEach((k) => { const o = document.createElement("option"); o.value = k; o.textContent = topicTemplates[k].title; $("topic-selector").appendChild(o); });
  const load = () => { const k = $("topic-selector").value; $("code-editor").value = savedCode[k] || topicTemplates[k].code; };
  $("topic-selector").onchange = load; load();
  $("code-editor").oninput = () => { savedCode[$("topic-selector").value] = $("code-editor").value; localStorage.setItem("savedDSACode", JSON.stringify(savedCode)); };
  $("btn-reset").onclick = () => { const k = $("topic-selector").value; delete savedCode[k]; localStorage.setItem("savedDSACode", JSON.stringify(savedCode)); load(); };
  $("btn-runall").onclick = reloadAll;
}

/* ---------- start ---------- */
window.onload = async () => {
  initEditor(); initLab(); lucide.createIcons();
  $("btn-music").textContent = musicOn ? "🎵" : "🔕";
  $("btn-music").onclick = () => { musicOn = !musicOn; localStorage.setItem("gardenMusic", musicOn ? "on" : "off"); $("btn-music").textContent = musicOn ? "🎵" : "🔕"; if (musicOn) { resumeAudio(); startMusic(); } else stopMusic(); };
  $("btn-sound").textContent = soundOn ? "🔊" : "🔇";
  $("btn-sound").onclick = () => { soundOn = !soundOn; localStorage.setItem("gardenSound", soundOn ? "on" : "off"); $("btn-sound").textContent = soundOn ? "🔊" : "🔇"; resumeAudio(); };
  $("btn-new").onclick = () => { if (confirm("Start a new game? The current one will be erased.")) { winShown = false; act("new_game"); } };
  $("btn-undo").onclick = () => act("undo"); $("btn-hall").onclick = () => act("harvest_all"); $("btn-prune").onclick = () => act("prune");
  $("btn-boost").onclick = () => act("boost"); $("btn-sell").onclick = () => act("sell");
  $("win-go").onclick = () => $("win").classList.add("hidden");
  $("win-new").onclick = () => { $("win").classList.add("hidden"); winShown = false; act("new_game"); };
  try {
    await initPyodide(); $("status").textContent = "Running your Python code…";
    await runTopics(); loadGame(); lastTick = Date.now();
    $("loading").classList.add("hidden");
    setInterval(loop, 1000); setInterval(saveGame, 5000);
    window.addEventListener("beforeunload", saveGame);
    document.addEventListener("visibilitychange", () => { if (document.hidden) { saveGame(); if (ac) ac.suspend(); } else { if (ac && (soundOn || musicOn)) ac.resume(); loop(); } });
  } catch (e) { $("status").innerHTML = `<span class="text-red-400">Error: ${e.message}. Open the Code Editor tab and reset the topic.</span>`; $("loading").classList.add("hidden"); switchTab("code"); $("output-console").innerHTML += `<span class="text-red-400">${e.message}</span>`; console.error(e); }
};
