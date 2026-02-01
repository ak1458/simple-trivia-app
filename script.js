// DOM Elements
const playground = document.getElementById('playground');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalButton = document.getElementById('modalButton');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');

// State
let playgroundRect = null;
let dodgeCount = 0;
let yesSizeMultiplier = 1;
let isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastFocusedElement = null;
let yesClickCount = 0;

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

// PRE-LOADER: Create iframes immediately
function preloadGifs() {
    const preloadContainer = document.getElementById('preloadContainer');

    uniqueGifUrls.forEach(url => {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.width = "100%";
        iframe.height = "220";
        iframe.frameBorder = "0";
        iframe.allowFullscreen = true;
        iframe.loading = "eager"; // Force immediate load
        iframe.style.borderRadius = "12px";
        iframe.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        iframe.style.pointerEvents = "none"; // No hover interaction
        // Note: We don't hide with display:none because some browsers throttle loading.
        // Instead, the container is hidden.

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

function updatePlaygroundBounds() {
    playgroundRect = playground.getBoundingClientRect();
}

function getThreshold() {
    if (!playgroundRect) updatePlaygroundBounds();
    const minDim = Math.min(playgroundRect.width, playgroundRect.height);
    return Math.max(120, minDim / 4);
}

function getEdgePosition() {
    if (!playgroundRect) updatePlaygroundBounds();
    const padding = 18;
    const edges = ['top', 'right', 'bottom', 'left'];
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const maxX = playgroundRect.width - padding * 2;
    const maxY = playgroundRect.height - padding * 2;
    let x, y;
    switch (edge) {
        case 'top': x = padding + Math.random() * maxX; y = padding; break;
        case 'right': x = playgroundRect.width - padding; y = padding + Math.random() * maxY; break;
        case 'bottom': x = padding + Math.random() * maxX; y = playgroundRect.height - padding; break;
        case 'left': x = padding; y = padding + Math.random() * maxY; break;
    }
    return { x, y };
}

function setNoToEdge() {
    if (isReduced) return;
    const pos = getEdgePosition();
    btnNo.style.left = `${pos.x}px`;
    btnNo.style.top = `${pos.y}px`;
    dodgeCount++;
    if (dodgeCount % 2 === 0 && yesSizeMultiplier < 1.3) {
        yesSizeMultiplier += 0.05;
        btnYes.style.transform = `scale(${yesSizeMultiplier})`;
    }
}

function handleMouseMove(e) {
    if (isReduced) return;
    if (!playgroundRect) updatePlaygroundBounds();
    const mouseX = e.clientX - playgroundRect.left;
    const mouseY = e.clientY - playgroundRect.top;
    const btnRect = btnNo.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2 - playgroundRect.left;
    const btnCenterY = btnRect.top + btnRect.height / 2 - playgroundRect.top;
    const dx = mouseX - btnCenterX;
    const dy = mouseY - btnCenterY;
    const distance = Math.hypot(dx, dy);
    if (distance < getThreshold()) setNoToEdge();
}

function handleNoHover() {
    if (isReduced) return;
    setNoToEdge();
}

function handleNoClick(e) {
    e.preventDefault();
    e.stopPropagation();
    setNoToEdge();
}

function handleNoTouch(e) {
    e.preventDefault();
    e.stopPropagation();
    setNoToEdge();
}

// Event: Yes button click - show STICKER INSTANTLY
function handleYesClick() {
    const result = getResult();
    yesClickCount++;

    modalTitle.textContent = result.title;
    modalMessage.textContent = result.message;

    // Grab cached iframe
    const cachedFrame = gifCache[result.gif];
    modalIcon.innerHTML = ''; // Clear previous
    if (cachedFrame) {
        // Move iframe from preload to modal
        // Note: Moving DOM nodes preserves their state (loaded content)
        modalIcon.appendChild(cachedFrame);
    } else {
        // Fallback (race condition protection)
        modalIcon.innerHTML = `<iframe src="${result.gif}" width="100%" height="220" frameBorder="0" allowfullscreen style="border-radius: 12px; pointer-events: none;">`;
    }

    lastFocusedElement = document.activeElement;
    modalOverlay.classList.add('active');
    modalClose.focus();
}

function closeModal() {
    modalOverlay.classList.remove('active');
    // Move frame back to cache container? 
    // Ideally we'd clone or manage it, but simple append works.
    // If we close, the frame is effectively hidden.
    // To allow reuse, we should move it back if we want to keep it "alive" 
    // without reloading, OR just re-append it next time (which is what we do).
    // The issue is if we clear innerHTML, we might lose it if not appended elsewhere.

    // Better strategy for "close": Move the child BACK to preloadContainer so it stays alive
    const currentFrame = modalIcon.firstElementChild;
    if (currentFrame && currentFrame.tagName === 'IFRAME') {
        document.getElementById('preloadContainer').appendChild(currentFrame);
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

function init() {
    updatePlaygroundBounds();
    setNoToEdge();
    preloadGifs(); // START EAGER LOADING NOW

    playground.addEventListener('mousemove', handleMouseMove);
    btnNo.addEventListener('mouseenter', handleNoHover);
    btnNo.addEventListener('click', handleNoClick);
    btnYes.addEventListener('click', handleYesClick);
    btnNo.addEventListener('touchstart', handleNoTouch, { passive: false });
    btnNo.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    modalClose.addEventListener('click', closeModal);
    modalButton.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            updatePlaygroundBounds();
        }, 150);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
