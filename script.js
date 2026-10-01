// DOM Elements
const playground = document.getElementById('playground');
const question = document.getElementById('question');
const hint = document.getElementById('hint');
const tally = document.getElementById('tally');
const tallyCount = document.getElementById('tallyCount');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalButton = document.getElementById('modalButton');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const preloadContainer = document.getElementById('preloadContainer');

// State
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let dodgeCount = 0;
let lastDodgeAt = 0;
let lastFocusedElement = null;
let yesClickCount = 0;
let lastWidth = window.innerWidth;

// Hint text shown as No keeps escaping (index = dodges / 2)
const taunts = [
    'Take your time. There is a right answer.',
    'Hm. That one is slippery.',
    'It really does not want to be clicked.',
    'Yes is right there, you know.',
    'Yes is getting bigger. Just saying.',
    'You are very persistent. I like that.',
    'Okay, now you are just playing with me.',
    'The No button has left the chat.'
];

// USER PROVIDED STICKERS (Tenor Embed IDs)
// 1. Love Sticker (19980517)
// 2. Love GIF (5156837190595508362)
// 3. Bubu Dudu Kisses (16518562412394508022)
// 4. Kiss Hog (18419127890251290205)
// 5. Honkai Star Rail (12448557298959934938)
// 6. I Did It (3549346552628358702)

// Fixed Sequence for first 3 clicks
const fixedSequence = [
    {
        title: 'So Sweet! 💋',
        message: 'A gentle kiss for my favorite person! 😘',
        gif: 'https://tenor.com/embed/19980517' // 1. Love Sticker
    },
    {
        title: 'Yay! 🎉',
        message: 'I knew you\'d say yes! 💕',
        gif: 'https://tenor.com/embed/5156837190595508362' // 2. Love GIF
    },
    {
        title: 'Forever & Always! 💍',
        message: 'You are stuck with me now! 🤭',
        gif: 'https://tenor.com/embed/16518562412394508022' // 3. Bubu Dudu Kisses
    }
];

// Randomized Results
const randomResults = [
    {
        title: 'Hehe gotcha! 😈',
        message: 'You gave up trying to click No, didn\'t you? 😎',
        gif: 'https://tenor.com/embed/18419127890251290205', // 4. Kiss Hog
        weight: 3
    },
    {
        title: 'YIPPEE!! ✨',
        message: 'Best. Answer. Ever. 🌟',
        gif: 'https://tenor.com/embed/12448557298959934938', // 5. Honkai Star Rail
        weight: 3
    },
    {
        title: 'Mission Accomplished 🚀',
        message: 'The "No" button never stood a chance. 😏',
        gif: 'https://tenor.com/embed/3549346552628358702', // 6. I Did It
        weight: 3
    },
    {
        title: 'Aww! 🥰',
        message: 'My heart is literally melting right now! 💖',
        gif: 'https://tenor.com/embed/19980517', // Reuse #1
        weight: 2
    },
    {
        title: 'Soulmates? 🥺',
        message: 'I think we just had a moment. ✨',
        gif: 'https://tenor.com/embed/16518562412394508022', // Reuse #3
        weight: 2
    }
];

// Calculate unique URLs for preloading
const uniqueGifUrls = [
    ...new Set([
        ...fixedSequence.map(item => item.gif),
        ...randomResults.map(item => item.gif)
    ])
];
const gifCache = {}; // Map URL -> Iframe Element

// PRE-LOADER: create iframes up front inside a hidden container so they are ready on click.
// (display:none would let some browsers throttle loading, so the container is hidden instead.)
function preloadGifs() {
    uniqueGifUrls.forEach(url => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = 'Reaction sticker';
        iframe.tabIndex = -1;
        iframe.loading = 'eager';
        preloadContainer.appendChild(iframe);
        gifCache[url] = iframe;
    });
}

// Utility: Get result based on click count
function getResult() {
    if (yesClickCount < fixedSequence.length) {
        return fixedSequence[yesClickCount];
    }
    const totalWeight = randomResults.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of randomResults) {
        random -= item.weight;
        if (random <= 0) return item;
    }
    return randomResults[0];
}

// --- DODGE LOGIC ---

// Element rect relative to the playground
function relRect(el) {
    const p = playground.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
        left: r.left - p.left,
        top: r.top - p.top,
        right: r.right - p.left,
        bottom: r.bottom - p.top
    };
}

function overlaps(a, b, gap) {
    return a.left < b.right + gap && a.right > b.left - gap &&
        a.top < b.bottom + gap && a.bottom > b.top - gap;
}

// Move No to a random free spot inside the playground, as far from `from` as possible
function dodge(from) {
    const now = performance.now();
    if (now - lastDodgeAt < 120) return;
    lastDodgeAt = now;

    // First escape: pin No where it currently sits, then let it run
    if (!btnNo.classList.contains('loose')) {
        // Reparent so the playground (not the animated button row) is the containing block
        const r = relRect(btnNo);
        btnNo.style.left = `${r.left}px`;
        btnNo.style.top = `${r.top}px`;
        btnNo.classList.add('loose');
        playground.appendChild(btnNo);
        void btnNo.offsetWidth; // commit start position so the jump animates
    }

    const pad = 16;
    const width = playground.clientWidth;
    const height = playground.clientHeight;
    const bw = btnNo.offsetWidth;
    const bh = btnNo.offsetHeight;
    const current = relRect(btnNo);
    const origin = from || { x: (current.left + current.right) / 2, y: (current.top + current.bottom) / 2 };
    const avoid = [relRect(btnYes), relRect(question)];
    const farEnough = Math.min(width, height) / 3;

    let best = null;
    for (let i = 0; i < 40; i++) {
        const x = pad + Math.random() * Math.max(0, width - bw - pad * 2);
        const y = pad + Math.random() * Math.max(0, height - bh - pad * 2);
        const box = { left: x, top: y, right: x + bw, bottom: y + bh };
        if (avoid.some(a => overlaps(box, a, 12))) continue;
        const d = Math.hypot(x + bw / 2 - origin.x, y + bh / 2 - origin.y);
        if (!best || d > best.d) best = { x, y, d };
        if (d > farEnough) break;
    }
    if (!best) best = { x: pad, y: height - bh - pad };

    btnNo.style.left = `${best.x}px`;
    btnNo.style.top = `${best.y}px`;
    btnNo.style.setProperty('--tilt', `${(Math.random() * 16 - 8).toFixed(1)}deg`);

    dodgeCount++;
    tallyCount.textContent = dodgeCount;
    tally.classList.add('show');

    if (dodgeCount % 2 === 0) {
        const scale = Math.min(1.35, 1 + dodgeCount * 0.025);
        btnYes.style.setProperty('--yes-scale', scale);
        hint.textContent = taunts[Math.min(dodgeCount / 2, taunts.length - 1)];
        hint.classList.remove('bump');
        void hint.offsetWidth;
        hint.classList.add('bump');
    }
}

// Mouse: run away before the cursor even reaches the button
function handlePointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    const p = playground.getBoundingClientRect();
    const x = e.clientX - p.left;
    const y = e.clientY - p.top;
    const r = relRect(btnNo);
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    if (Math.hypot(dx, dy) < 56) dodge({ x, y });
}

function handleNoPress(e) {
    e.preventDefault();
    e.stopPropagation();
    dodge();
}

// Little burst of hearts from the Yes button
function burstHearts() {
    if (reduceMotion.matches) return;
    const r = btnYes.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 18; i++) {
        const heart = document.createElement('span');
        const angle = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 140;
        heart.className = 'heart';
        heart.textContent = '♥';
        heart.style.left = `${cx}px`;
        heart.style.top = `${cy}px`;
        heart.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        heart.style.setProperty('--dy', `${Math.sin(angle) * dist - 60}px`);
        heart.style.setProperty('--r', `${Math.random() * 120 - 60}deg`);
        heart.style.setProperty('--s', (0.8 + Math.random()).toFixed(2));
        heart.addEventListener('animationend', () => heart.remove());
        document.body.appendChild(heart);
    }
}

// Event: Yes button click - show STICKER INSTANTLY
function handleYesClick() {
    const result = getResult();
    yesClickCount++;
    burstHearts();

    modalTitle.textContent = result.title;
    modalMessage.textContent = result.message;

    // Move the already-loaded iframe into the modal (moving keeps its loaded state)
    modalIcon.innerHTML = '';
    const cachedFrame = gifCache[result.gif];
    if (cachedFrame) {
        modalIcon.appendChild(cachedFrame);
    } else {
        // Fallback (race condition protection)
        modalIcon.innerHTML = `<iframe src="${result.gif}" title="Reaction sticker" tabindex="-1"></iframe>`;
    }

    lastFocusedElement = document.activeElement;
    modalOverlay.classList.add('active');
    modalClose.focus();
}

function closeModal() {
    modalOverlay.classList.remove('active');

    // Move the frame back to the preload container so it stays alive for next time
    const currentFrame = modalIcon.firstElementChild;
    if (currentFrame && currentFrame.tagName === 'IFRAME') {
        preloadContainer.appendChild(currentFrame);
    }

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

function handleOverlayClick(e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
}

// Layout changed width: put No back beside Yes (height-only changes are mobile address-bar noise)
function handleResize() {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    btnNo.classList.remove('loose');
    btnYes.after(btnNo);
    btnNo.style.left = '';
    btnNo.style.top = '';
}

function init() {
    preloadGifs(); // START EAGER LOADING NOW

    playground.addEventListener('pointermove', handlePointerMove);
    btnNo.addEventListener('mouseenter', () => dodge());
    btnNo.addEventListener('click', handleNoPress);
    btnNo.addEventListener('touchstart', handleNoPress, { passive: false });
    btnNo.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    btnYes.addEventListener('click', handleYesClick);
    modalClose.addEventListener('click', closeModal);
    modalButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 150);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
