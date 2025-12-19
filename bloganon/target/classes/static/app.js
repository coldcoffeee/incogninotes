// javascript
// Base URLs and endpoints
const API_POSTS = `/api/posts`;
const WS_ENDPOINT = `/ws`;
const TOPIC_POSTS = "/topic/posts";

// DOM elements
const form = document.getElementById("postForm");
const postsDiv = document.getElementById("posts");

// Utils
function escapeHtml(str) {
    const s = (str ?? "").toString();
    return s.replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[m]));
}

function formatTime(iso) {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        // e.g., 2025-12-19 14:05:07
        const pad = n => String(n).padStart(2, "0");
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        const ss = pad(d.getSeconds());
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    } catch {
        return "";
    }
}

// Enhance UX: add focus flicker class briefly
["name", "content"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const addFx = () => {
        el.classList.add("focus-fx");
        setTimeout(() => el.classList.remove("focus-fx"), 400);
    };
    el.addEventListener("focus", addFx);
    // also on click for mobile browsers where focus may be delayed
    el.addEventListener("click", addFx);
});

function renderPost({ name, content, createdAt }) {
    const article = document.createElement("article");
    const ts = formatTime(createdAt);
    article.innerHTML = `
        <strong>${escapeHtml(name ?? "Anonymous")}</strong>
        ${ts ? `<span class="timestamp">${escapeHtml(ts)}</span>` : ""}
        <p>${escapeHtml(content ?? "")}</p>
    `;
    // add glow effect on first render
    article.classList.add("glow-in");
    setTimeout(() => article.classList.remove("glow-in"), 1000);
    return article;
}

// Initial load
async function loadPosts() {
    const res = await fetch(API_POSTS);
    const posts = await res.json();

    postsDiv.innerHTML = "";
    posts.forEach(p => postsDiv.appendChild(renderPost(p)));
}

// Live character counter and validation for 1000-char limit
(function setupCharCounter(){
    const textarea = document.getElementById("content");
    const counter = document.getElementById("charCounter");
    if (!textarea || !counter) return;

    const max = 1000;
    const update = () => {
        const len = (textarea.value || "").length;
        counter.textContent = `${len} / ${max}`;
        if (len > max) {
            counter.style.color = "#ff6b6b"; // red-ish
        } else {
            counter.style.color = "";
        }
    };
    textarea.addEventListener("input", update);
    update();
})();

// Live name counter (30-char limit)
(function setupNameCounter(){
    const nameInput = document.getElementById("name");
    const counter = document.getElementById("nameCounter");
    if (!nameInput || !counter) return;
    const max = 30;
    const update = () => {
        const len = (nameInput.value || "").length;
        counter.textContent = `${len} / ${max}`;
        counter.style.color = len > max ? "#ff6b6b" : "";
    };
    nameInput.addEventListener("input", update);
    update();
})();

// Restore saved name from sessionStorage, if present
(function restoreSavedName(){
    const saved = sessionStorage.getItem("savedName");
    if (saved && saved.trim()) {
        const nameInput = document.getElementById("name");
        if (nameInput) {
            nameInput.value = saved;
            const event = new Event("input");
            nameInput.dispatchEvent(event); // update counter
        }
    }
})();

// Submit handler
form.addEventListener("submit", async e => {
    e.preventDefault();

    const nameEl = document.getElementById("name");
    const name = nameEl.value;
    const contentEl = document.getElementById("content");
    const content = contentEl.value;

    // Frontend validations
    if (name && name.length > 30) {
        nameEl.classList.add("focus-fx");
        setTimeout(() => nameEl.classList.remove("focus-fx"), 400);
        return;
    }
    if (!content || content.trim().length === 0) {
        contentEl.classList.add("focus-fx");
        setTimeout(() => contentEl.classList.remove("focus-fx"), 400);
        return;
    }
    if (content.length > 1000) {
        contentEl.classList.add("focus-fx");
        setTimeout(() => contentEl.classList.remove("focus-fx"), 400);
        return;
    }

    const res = await fetch(API_POSTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, content })
    });

    if (!res.ok) {
        return;
    }

    // On successful submit, persist name for the session if provided and not Anonymous
    const trimmed = (name || "").trim();
    if (trimmed && trimmed.toLowerCase() !== "anonymous") {
        sessionStorage.setItem("savedName", trimmed);
    }

    // Do not clear the name field; only clear the content and update its counter
    contentEl.value = "";
    const ev = new Event("input");
    contentEl.dispatchEvent(ev);
});

// WebSocket
let stompClient = null;

function connectSocket() {
    const socket = new SockJS(WS_ENDPOINT);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        stompClient.subscribe(TOPIC_POSTS, message => {
            const post = JSON.parse(message.body);
            const node = renderPost(post);
            postsDiv.prepend(node);

            // Play sound on new incoming post
            playPop();

            while (postsDiv.children.length > 100) {
                postsDiv.removeChild(postsDiv.lastChild);
            }
        });
    });
}

// Sound toggle and pop playback
const popEl = document.getElementById("popSound");
const soundToggle = document.getElementById("soundToggle");
let soundOn = true;

function playPop() {
    if (!popEl || !soundOn) return;
    try {
        popEl.currentTime = 0;
        // Attempt playback; ignore any autoplay errors
        popEl.play().catch(() => {});
    } catch {}
}

// Ensure user gesture enables audio output
(function primeAudio(){
    if (!popEl) return;
    const prime = () => {
        // Try a silent play to satisfy gesture requirement
        popEl.muted = true;
        popEl.play().catch(() => {});
        popEl.pause();
        popEl.muted = false;
        window.removeEventListener("click", prime);
        window.removeEventListener("touchstart", prime);
        window.removeEventListener("keydown", prime);
    };
    window.addEventListener("click", prime);
    window.addEventListener("touchstart", prime);
    window.addEventListener("keydown", prime);
})();

if (soundToggle) {
    soundToggle.addEventListener("click", () => {
        soundOn = !soundOn;
        soundToggle.textContent = soundOn ? "🔊 Sound: On" : "🔇 Sound: Off";
    });
}

// Snoopy theme toggle + heart spawner
const heartsLayer = document.getElementById("heartsLayer");
let heartsTimer = null;

function isSnoopyName(name) {
    const n = (name || "").trim();
    return n.length > 0 && n.toLowerCase() === "tisha";
}

function setSnoopyTheme(enabled) {
    const body = document.body;
    if (enabled) {
        body.classList.add("snoopy-theme");
        startHearts();
    } else {
        body.classList.remove("snoopy-theme");
        stopHearts();
    }
}

function spawnHeart() {
    if (!heartsLayer) return;
    const sprite = document.createElement("div");
    sprite.className = "heart-sprite";
    const img = document.createElement("img");
    img.src = "/heart-pixelated.png";
    img.alt = "heart";
    sprite.appendChild(img);

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Slight random size variation (18-28px) and rotation (-25 to 25 deg)
    const size = Math.floor(18 + Math.random() * 10);
    const rot = Math.floor(-25 + Math.random() * 50);
    sprite.style.setProperty("--heart-size", `${size}px`);
    sprite.style.setProperty("--heart-rot", `${rot}deg`);

    // random position anywhere within viewport, with small padding
    const x = Math.floor(Math.random() * (w - size - 8)) + 4;
    const y = Math.floor(Math.random() * (h - size - 8)) + 4;
    sprite.style.left = x + "px";
    sprite.style.top = y + "px";

    heartsLayer.appendChild(sprite);
    // remove after animation completes
    setTimeout(() => {
        if (sprite.parentNode) sprite.parentNode.removeChild(sprite);
    }, 1300);
}

function startHearts() {
    if (heartsTimer) return;
    // spawn at a gentle random cadence
    heartsTimer = setInterval(() => {
        // sometimes skip to keep it light
        if (Math.random() < 0.6) spawnHeart();
    }, 800);
}
function stopHearts() {
    if (heartsTimer) {
        clearInterval(heartsTimer);
        heartsTimer = null;
    }
    if (heartsLayer) heartsLayer.innerHTML = "";
}

// react to name changes
(function bindSnoopyToggle(){
    const nameInput = document.getElementById("name");
    if (!nameInput) return;
    const apply = () => setSnoopyTheme(isSnoopyName(nameInput.value));
    nameInput.addEventListener("input", apply);
    // apply on load if name restored
    apply();
})();

// Boot
loadPosts();
connectSocket();
