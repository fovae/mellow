// Page Loader
document.addEventListener('DOMContentLoaded', () => {
    const loadScreen = document.querySelector('.load-screen');

    setTimeout(() => {
        loadScreen.classList.add('hidden');
        document.body.style.overflow = 'auto';

        setTimeout(() => { loadScreen.remove(); checkUsernameAndPrompt(); }, 1000);
    }, 3000);
});
// Username prompt: integrated and resilient
function showUsernameModal() {
    if (document.getElementById('pwa-username-modal')) return;

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'pwa-username-modal';

    const modal = document.createElement('div');
    modal.className = 'welcome-modal-content';
    modal.innerHTML = `
        <h3 style="margin:0 0 12px;font-size:18px;">What should we call you?</h3>
        <input id="pwa-username-input" placeholder="Your name" autocomplete="name" />
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
            <button id="pwa-username-save" class="btn-primary">Save</button>
            <button id="pwa-username-cancel" class="btn-secondary">Skip</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = document.getElementById('pwa-username-input');
    const saveBtn = document.getElementById('pwa-username-save');
    const cancelBtn = document.getElementById('pwa-username-cancel');

    // Auto-focus input (after appended)
    setTimeout(() => {
        try { input.focus(); input.select(); } catch (e) {}
    }, 50);

    function closeModal() {
        const el = document.getElementById('pwa-username-modal');
        if (el) el.remove();
    }

    function save() {
        const v = (input.value || '').trim();
        if (!v) {
            input.focus();
            input.style.boxShadow = '0 0 0 4px rgba(58,134,255,.12)';
            return;
        }
        localStorage.setItem('pwa_username', v);
        // update UI if present
        const span = document.querySelector('.username'); if (span) span.textContent = v;
        closeModal();
    }

    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', () => {
        // assign a random guest nickname and save it so modal won't reappear
        const guests = [
            'Mystic Leaf','Happy Pebble','Silver Fox','Cloud Jumper','Little Fern',
            'Blue Owl','Calm River','Sunny Ray','Night Owl','Forest Friend'
        ];
        const name = guests[Math.floor(Math.random()*guests.length)];
        try { localStorage.setItem('pwa_username', name); } catch (e) {}
        const span = document.querySelector('.username'); if (span) span.textContent = name;
        closeModal();
    });

    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
}

function checkUsernameAndPrompt() {
    try {
        const saved = localStorage.getItem('pwa_username');
        // only prompt when key is completely missing (null)
        if (saved === null) {
            showUsernameModal();
        } else if (saved) {
            // populate UI with the stored name (could be guest or real)
            const span = document.querySelector('.username'); if (span) span.textContent = saved;
        }
    } catch (e) { console.warn('localStorage not available', e); }
}

// Re-run check when the app's clear-data button is used
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-danger');
    if (!btn) return;
    try { localStorage.removeItem('pwa_username'); } catch (e) {}
    // Slight delay to let any other clear logic run first
    setTimeout(checkUsernameAndPrompt, 250);
});

// Also listen for storage changes (other tabs)
window.addEventListener('storage', (e) => {
    if (e.key === 'pwa_username' && !e.newValue) checkUsernameAndPrompt();
});

// Menu and Screen Logic
const burger = document.getElementById('burger');
const sideMenu = document.getElementById('sideMenu');
const menuItems = document.querySelectorAll('.menu-item');
const screens = document.querySelectorAll('.screen');

burger.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
});

// Menu item click logic
menuItems.forEach(item => {
    item.addEventListener('click', () => {

        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const target = item.dataset.screen;

        screens.forEach(screen => {
            screen.classList.remove('active');
            if (screen.id === target) {
                screen.classList.add('active');
            }
        });

        sideMenu.classList.remove('open');
    });
});

// Flashcard flip interaction
document.addEventListener('DOMContentLoaded', () => {
    const flashcard = document.querySelector('.flashcard');
    if (flashcard) {
        flashcard.addEventListener('click', (e) => {
            e.stopPropagation();
            flashcard.classList.toggle('flipped');
        });
    }
});
