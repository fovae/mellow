// ============================================
// CORE STATE MANAGEMENT
// ============================================

// Generate UUID-like ID using timestamp + random
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize appState in localStorage if it doesn't exist
function initializeAppState() {
    try {
        const existingState = localStorage.getItem('appState');
        if (existingState) return JSON.parse(existingState);

        // Default dictionaries with 20 basic words each and progress tracking
        const defaultDictionaries = [
            {
                id: generateId(),
                name: 'English → Spanish',
                emoji: '🇪🇸',
                description: 'Learn Spanish vocabulary',
                progress: 0, // Number of words marked as learned
                words: [
                    { id: generateId(), word: 'hello', translation: 'hola', isFavourite: false },
                    { id: generateId(), word: 'goodbye', translation: 'adiós', isFavourite: false },
                    { id: generateId(), word: 'thank you', translation: 'gracias', isFavourite: false },
                    { id: generateId(), word: 'please', translation: 'por favor', isFavourite: false },
                    { id: generateId(), word: 'water', translation: 'agua', isFavourite: false },
                    { id: generateId(), word: 'food', translation: 'comida', isFavourite: false },
                    { id: generateId(), word: 'love', translation: 'amor', isFavourite: false },
                    { id: generateId(), word: 'friend', translation: 'amigo', isFavourite: false },
                    { id: generateId(), word: 'book', translation: 'libro', isFavourite: false },
                    { id: generateId(), word: 'music', translation: 'música', isFavourite: false },
                    { id: generateId(), word: 'happy', translation: 'feliz', isFavourite: false },
                    { id: generateId(), word: 'sad', translation: 'triste', isFavourite: false },
                    { id: generateId(), word: 'morning', translation: 'mañana', isFavourite: false },
                    { id: generateId(), word: 'night', translation: 'noche', isFavourite: false },
                    { id: generateId(), word: 'sun', translation: 'sol', isFavourite: false },
                    { id: generateId(), word: 'moon', translation: 'luna', isFavourite: false },
                    { id: generateId(), word: 'star', translation: 'estrella', isFavourite: false },
                    { id: generateId(), word: 'tree', translation: 'árbol', isFavourite: false },
                    { id: generateId(), word: 'flower', translation: 'flor', isFavourite: false },
                    { id: generateId(), word: 'beautiful', translation: 'hermoso', isFavourite: false }
                ]
            },
            {
                id: generateId(),
                name: 'English → Japanese',
                emoji: '🇯🇵',
                description: 'Learn Japanese vocabulary',
                progress: 0,
                words: [
                    { id: generateId(), word: 'hello', translation: 'こんにちは', isFavourite: false },
                    { id: generateId(), word: 'goodbye', translation: 'さようなら', isFavourite: false },
                    { id: generateId(), word: 'thank you', translation: 'ありがとう', isFavourite: false },
                    { id: generateId(), word: 'please', translation: 'お願いします', isFavourite: false },
                    { id: generateId(), word: 'water', translation: '水', isFavourite: false },
                    { id: generateId(), word: 'food', translation: '食べ物', isFavourite: false },
                    { id: generateId(), word: 'love', translation: '愛', isFavourite: false },
                    { id: generateId(), word: 'friend', translation: '友達', isFavourite: false },
                    { id: generateId(), word: 'book', translation: '本', isFavourite: false },
                    { id: generateId(), word: 'music', translation: '音楽', isFavourite: false },
                    { id: generateId(), word: 'happy', translation: '幸せ', isFavourite: false },
                    { id: generateId(), word: 'sad', translation: '悲しい', isFavourite: false },
                    { id: generateId(), word: 'morning', translation: '朝', isFavourite: false },
                    { id: generateId(), word: 'night', translation: '夜', isFavourite: false },
                    { id: generateId(), word: 'sun', translation: '太陽', isFavourite: false },
                    { id: generateId(), word: 'moon', translation: '月', isFavourite: false },
                    { id: generateId(), word: 'star', translation: '星', isFavourite: false },
                    { id: generateId(), word: 'tree', translation: '木', isFavourite: false },
                    { id: generateId(), word: 'flower', translation: '花', isFavourite: false },
                    { id: generateId(), word: 'beautiful', translation: '美しい', isFavourite: false }
                ]
            },
            {
                id: generateId(),
                name: 'English → Russian',
                emoji: '🇷🇺',
                description: 'Learn Russian vocabulary',
                progress: 0,
                words: [
                    { id: generateId(), word: 'hello', translation: 'привет', isFavourite: false },
                    { id: generateId(), word: 'goodbye', translation: 'до свидания', isFavourite: false },
                    { id: generateId(), word: 'thank you', translation: 'спасибо', isFavourite: false },
                    { id: generateId(), word: 'please', translation: 'пожалуйста', isFavourite: false },
                    { id: generateId(), word: 'water', translation: 'вода', isFavourite: false },
                    { id: generateId(), word: 'food', translation: 'еда', isFavourite: false },
                    { id: generateId(), word: 'love', translation: 'любовь', isFavourite: false },
                    { id: generateId(), word: 'friend', translation: 'друг', isFavourite: false },
                    { id: generateId(), word: 'book', translation: 'книга', isFavourite: false },
                    { id: generateId(), word: 'music', translation: 'музыка', isFavourite: false },
                    { id: generateId(), word: 'happy', translation: 'счастливый', isFavourite: false },
                    { id: generateId(), word: 'sad', translation: 'грустный', isFavourite: false },
                    { id: generateId(), word: 'morning', translation: 'утро', isFavourite: false },
                    { id: generateId(), word: 'night', translation: 'ночь', isFavourite: false },
                    { id: generateId(), word: 'sun', translation: 'солнце', isFavourite: false },
                    { id: generateId(), word: 'moon', translation: 'луна', isFavourite: false },
                    { id: generateId(), word: 'star', translation: 'звезда', isFavourite: false },
                    { id: generateId(), word: 'tree', translation: 'дерево', isFavourite: false },
                    { id: generateId(), word: 'flower', translation: 'цветок', isFavourite: false },
                    { id: generateId(), word: 'beautiful', translation: 'красивый', isFavourite: false }
                ]
            }
        ];

        const initialState = {
            dictionaries: defaultDictionaries,
            activeDictionaryId: null,
            totalTimeActive: 0 // in seconds
        };

        localStorage.setItem('appState', JSON.stringify(initialState));
        return initialState;
    } catch (e) {
        console.warn('localStorage not available', e);
        return null;
    }
}

// Get current appState from localStorage
function getAppState() {
    try {
        const state = localStorage.getItem('appState');
        return state ? JSON.parse(state) : initializeAppState();
    } catch (e) {
        console.warn('Error reading appState', e);
        return null;
    }
}

// Save appState to localStorage
function saveAppState(state) {
    try {
        localStorage.setItem('appState', JSON.stringify(state));
    } catch (e) {
        console.warn('Error saving appState', e);
    }
}

// ============================================
// DASHBOARD STATISTICS
// ============================================

function updateDashboard() {
    const state = getAppState();
    if (!state) return;

    // Calculate total dictionaries
    const totalDicts = state.dictionaries.length;
    const countDictsEl = document.getElementById('count-dictionaries');
    if (countDictsEl) countDictsEl.textContent = totalDicts;

    // Calculate total words across all dictionaries
    let totalWords = 0;
    state.dictionaries.forEach(dict => {
        totalWords += dict.words.length;
    });
    const countWordsEl = document.getElementById('count-words');
    if (countWordsEl) countWordsEl.textContent = totalWords.toLocaleString();

    // Calculate total favourites
    let totalFavourites = 0;
    state.dictionaries.forEach(dict => {
        totalFavourites += dict.words.filter(w => w.isFavourite).length;
    });
    const countFavouritesEl = document.getElementById('count-favourites');
    if (countFavouritesEl) countFavouritesEl.textContent = totalFavourites;

    // Convert totalTimeActive to HH:MM or MM format
    const totalSeconds = state.totalTimeActive;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    let timeDisplay = '';
    if (hours > 0) {
        timeDisplay = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        timeDisplay = `${minutes}m`;
    } else {
        timeDisplay = '0m';
    }
    const countHoursEl = document.getElementById('count-hours');
    if (countHoursEl) countHoursEl.textContent = timeDisplay;

    // Update active dictionary display
    updateActiveDictionaryUI(state);
}

// ============================================
// ACTIVE DICTIONARY MANAGEMENT
// ============================================

function updateActiveDictionaryUI(state) {
    const nameEl = document.getElementById('active-dict-name');
    const subEl = document.getElementById('active-dict-sub');
    const emojiEl = document.getElementById('active-dict-emoji');

    if (!state.activeDictionaryId) {
        if (nameEl) nameEl.textContent = 'Select a dictionary';
        if (subEl) subEl.textContent = 'Tap to choose';
        if (emojiEl) emojiEl.textContent = '📚';
        updateMenuFeatureLocking(state);
        return;
    }

    const activeDict = state.dictionaries.find(d => d.id === state.activeDictionaryId);
    if (activeDict) {
        if (nameEl) nameEl.textContent = activeDict.name;
        if (subEl) subEl.textContent = `${activeDict.words.length} words · Tap to change`;
        if (emojiEl) emojiEl.textContent = activeDict.emoji;
    }

    updateMenuFeatureLocking(state);
}

function showDictionarySelector() {
    const state = getAppState();
    if (!state) return;

    // Create modal for dictionary selection
    let modal = document.getElementById('dict-selector-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'dict-selector-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '500px';

    let html = '<h3 style="margin:0 0 16px;font-size:18px;">Select a Dictionary</h3>';
    state.dictionaries.forEach(dict => {
        html += `
            <button class="dict-selector-btn" data-dict-id="${dict.id}" style="
                width: 100%;
                background: linear-gradient(135deg, rgba(246, 247, 251, .6), rgba(246, 247, 251, .3));
                border: 1px solid rgba(123, 63, 242, .15);
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 12px;
                cursor: pointer;
                text-align: left;
                font-family: inherit;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <div style="font-size: 20px; margin-bottom: 4px;">${dict.emoji}</div>
                <div style="font-weight: 600; color: #1F2430;">${dict.name}</div>
                <div style="font-size: 12px; color: #8e8e93;">${dict.words.length} words</div>
            </button>
        `;
    });

    content.innerHTML = html;
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Close modal on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Handle dictionary selection
    document.querySelectorAll('.dict-selector-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dictId = btn.dataset.dictId;
            state.activeDictionaryId = dictId;
            saveAppState(state);
            updateDashboard();
            overlay.remove();
        });
    });
}

function updateMenuFeatureLocking(state) {
    const menuItems = document.querySelectorAll('.menu-item');
    const cardsItem = Array.from(menuItems).find(item => item.dataset.screen === 'cards');
    const testsItem = Array.from(menuItems).find(item => item.dataset.screen === 'tests');

    if (!state.activeDictionaryId) {
        // Disable Cards and Tests
        if (cardsItem) {
            cardsItem.classList.add('disabled');
            cardsItem.style.opacity = '0.5';
            cardsItem.style.pointerEvents = 'none';
        }
        if (testsItem) {
            testsItem.classList.add('disabled');
            testsItem.style.opacity = '0.5';
            testsItem.style.pointerEvents = 'none';
        }
    } else {
        // Enable Cards and Tests
        if (cardsItem) {
            cardsItem.classList.remove('disabled');
            cardsItem.style.opacity = '1';
            cardsItem.style.pointerEvents = 'auto';
        }
        if (testsItem) {
            testsItem.classList.remove('disabled');
            testsItem.style.opacity = '1';
            testsItem.style.pointerEvents = 'auto';
        }
    }
}

// ============================================
// SVG ICON GENERATORS
// ============================================

function createTrashIcon(fill = '#ff3b30') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', fill);
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    svg.innerHTML = `
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    `;
    return svg;
}

function createEyeIcon(fill = '#3a86ff') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', fill);
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    svg.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    `;
    return svg;
}

function createBookmarkIcon(isFavourite = false, size = 20) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('fill', isFavourite ? 'url(#bookmarkGradient)' : 'none');
    svg.setAttribute('stroke', isFavourite ? 'none' : '#8e8e93');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.style.cssText = 'transition: all 0.3s ease; cursor: pointer;';
    
    if (isFavourite) {
        svg.innerHTML = `
            <defs>
                <linearGradient id="bookmarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#3a86ff;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#7b3ff2;stop-opacity:1" />
                </linearGradient>
            </defs>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        `;
    } else {
        svg.innerHTML = `
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        `;
    }
    return svg;
}

// ============================================
// DICTIONARY CRUD OPERATIONS
// ============================================

function renderDictionaries() {
    const state = getAppState();
    if (!state) return;

    const grid = document.querySelector('.dictionaries-grid');
    if (!grid) return;

    // Clear existing cards (but keep FAB button)
    const existingCards = grid.querySelectorAll('.dict-card');
    existingCards.forEach(card => card.remove());

    // Render each dictionary
    state.dictionaries.forEach(dict => {
        const card = createDictionaryCard(dict, state);
        grid.insertBefore(card, grid.querySelector('.fab'));
    });
}

function createDictionaryCard(dict, state) {
    const card = document.createElement('div');
    card.className = 'dict-card';
    card.dataset.dictId = dict.id;

    // Highlight active dictionary
    if (state.activeDictionaryId === dict.id) {
        card.style.border = '2px solid rgba(58, 134, 255, 0.5)';
        card.style.background = 'linear-gradient(135deg, rgba(58, 134, 255, 0.15), rgba(123, 63, 242, 0.15))';
    }

    // Calculate progress percentage
    const totalWords = dict.words.length;
    const learnedWords = dict.progress || 0;
    const progressPercent = totalWords > 0 ? (learnedWords / totalWords) * 100 : 0;

    const description = dict.description || 'Add a description';

    card.innerHTML = `
        <div class="dict-header">
            <div class="dict-emoji">${dict.emoji}</div>
            <button class="dict-menu-btn" data-dict-id="${dict.id}">⋮</button>
        </div>
        <div class="dict-title">${dict.name}</div>
        <div class="dict-description" style="font-size: 12px; color: #8e8e93; margin: 4px 0 8px; height: 18px; overflow: hidden;">${description}</div>
        <div class="dict-count">${dict.words.length} words</div>
        <div class="dict-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%;"></div>
            </div>
        </div>
        <div class="dict-actions" style="display: flex; gap: 8px; margin-top: 12px; justify-content: space-between;">
            <button class="dict-select-btn" data-dict-id="${dict.id}" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #3a86ff, #7b3ff2); color: #F6F7FB; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s;">Select</button>
            <button class="dict-expand-btn" data-dict-id="${dict.id}" style="padding: 8px 12px; background: rgba(58, 134, 255, 0.1); border: 1px solid rgba(58, 134, 255, 0.3); border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;"></button>
            <button class="dict-delete-btn" data-dict-id="${dict.id}" style="padding: 8px 12px; background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.3); border-radius: 8px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;"></button>
        </div>
        <div class="dict-expanded" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(123, 63, 242, 0.1); max-height: 0; overflow: hidden; transition: max-height 0.3s ease;">
            <div class="dict-words-list"></div>
            <button class="dict-add-word-btn" data-dict-id="${dict.id}" style="width: 100%; padding: 8px; margin-top: 8px; background: linear-gradient(135deg, rgba(58, 134, 255, 0.15), rgba(123, 63, 242, 0.15)); border: 1px dashed rgba(123, 63, 242, 0.4); border-radius: 8px; color: #3a86ff; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s;">+ Add Word</button>
        </div>
    `;

    // Event listeners for all action buttons
    const selectBtn = card.querySelector('.dict-select-btn');
    const expandBtn = card.querySelector('.dict-expand-btn');
    const deleteBtn = card.querySelector('.dict-delete-btn');
    const addWordBtn = card.querySelector('.dict-add-word-btn');
    const menuBtn = card.querySelector('.dict-menu-btn');

    // Add SVG icons to buttons
    expandBtn.appendChild(createEyeIcon('#3a86ff'));
    deleteBtn.appendChild(createTrashIcon('#ff3b30'));

    selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeDictionaryId = dict.id;
        saveAppState(state);
        updateDashboard();
        renderDictionaries();
    });

    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCardExpand(dict.id, card);
    });

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteDictionary(dict.id, dict.name);
    });

    addWordBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAddWordModal(dict.id);
    });

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDictionaryMenu(dict.id);
    });

    return card;
}

function showDictionaryMenu(dictId) {
    let menu = document.getElementById('dict-menu-modal');
    if (menu) menu.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'dict-menu-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '300px';

    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="dict-edit-words-btn" class="btn-secondary" style="width: 100%; text-align: center; padding: 10px;">
                Edit Words
            </button>
            <button id="dict-rename-btn" class="btn-secondary" style="width: 100%; text-align: center; padding: 10px;">
                Rename Dictionary
            </button>
            <button id="dict-desc-btn" class="btn-secondary" style="width: 100%; text-align: center; padding: 10px;">
                Edit Description
            </button>
            <button id="dict-emoji-btn" class="btn-secondary" style="width: 100%; text-align: center; padding: 10px;">
                Change Icon
            </button>
            <button id="dict-delete-btn" class="btn-danger" style="width: 100%; text-align: center; padding: 10px;">
                Delete Dictionary
            </button>
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Handler for Edit Words
    document.getElementById('dict-edit-words-btn').addEventListener('click', () => {
        overlay.remove();
        showWordManagement(dictId);
    });

    // Handler for Rename
    document.getElementById('dict-rename-btn').addEventListener('click', () => {
        overlay.remove();
        renameDictionary(dictId);
    });

    // Handler for Edit Description
    document.getElementById('dict-desc-btn').addEventListener('click', () => {
        overlay.remove();
        editDictionaryDescription(dictId);
    });

    // Handler for Edit Icon
    document.getElementById('dict-emoji-btn').addEventListener('click', () => {
        overlay.remove();
        editDictionaryEmoji(dictId);
    });

    // Handler for Delete
    document.getElementById('dict-delete-btn').addEventListener('click', () => {
        overlay.remove();
        confirmDeleteDictionary(dictId);
    });
}

function renameDictionary(dictId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    let modal = document.getElementById('rename-dict-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'rename-dict-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';

    content.innerHTML = `
        <h3 style="margin:0 0 16px;font-size:18px;">Rename Dictionary</h3>
        <input id="rename-input" type="text" value="${dict.name}" placeholder="Dictionary name" autocomplete="off" style="width: 80%; padding: 10px; margin: 15px 0; border: 1px solid #007bff; border-radius: 10px;" />
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
            <button id="rename-save-btn" class="btn-primary">Save</button>
            <button id="rename-cancel-btn" class="btn-secondary">Cancel</button>
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const input = document.getElementById('rename-input');
    setTimeout(() => input.focus(), 50);

    const saveBtn = document.getElementById('rename-save-btn');
    const cancelBtn = document.getElementById('rename-cancel-btn');

    saveBtn.addEventListener('click', () => {
        const newName = input.value.trim();
        if (newName && newName !== dict.name) {
            dict.name = newName;
            saveAppState(state);
            updateDashboard();
            renderDictionaries();
        }
        overlay.remove();
    });

    cancelBtn.addEventListener('click', () => overlay.remove());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });
}

function confirmDeleteDictionary(dictId, dictName = '') {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    let confirmModal = document.getElementById('delete-confirm-modal');
    if (confirmModal) confirmModal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'delete-confirm-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '380px';
    content.style.textAlign = 'center';

    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = 'width: 60px; height: 60px; background: rgba(255, 59, 48, 0.1); border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;';
    const trashIcon = createTrashIcon('#ff3b30');
    trashIcon.setAttribute('width', '32');
    trashIcon.setAttribute('height', '32');
    iconContainer.appendChild(trashIcon);

    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 8px; font-size: 20px; color: #1F2430; font-weight: 700;';
    title.textContent = 'Delete Dictionary?';

    const description = document.createElement('p');
    description.style.cssText = 'color: #8e8e93; margin: 0 0 24px; font-size: 14px; line-height: 1.5;';
    description.innerHTML = `Are you sure you want to delete <strong style="color: #1F2430;">${dict.name}</strong>? This action cannot be undone and all words will be lost.`;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = 'display: flex; gap: 12px; justify-content: center;';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'delete-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn-secondary';
    cancelBtn.style.cssText = 'flex: 1; padding: 10px; background: rgba(58, 134, 255, 0.1); color: #3a86ff; border: 1px solid rgba(58, 134, 255, 0.3); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s;';

    const deleteBtn = document.createElement('button');
    deleteBtn.id = 'delete-confirm-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.cssText = 'flex: 1; padding: 10px; background: linear-gradient(135deg, #ff3b30, #ff453a); color: #F6F7FB; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s;';

    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(deleteBtn);

    content.appendChild(iconContainer);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(buttonsContainer);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    deleteBtn.addEventListener('click', () => {
        // Remove the dictionary
        state.dictionaries = state.dictionaries.filter(d => d.id !== dictId);

        // If active dictionary was deleted, reset it
        if (state.activeDictionaryId === dictId) {
            state.activeDictionaryId = null;
        }

        saveAppState(state);
        updateDashboard();
        renderDictionaries();
        overlay.remove();
    });

    cancelBtn.addEventListener('click', () => {
        overlay.remove();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('delete-confirm-modal');
            if (modal) modal.remove();
        }
    });
}

function deleteDictionary(dictId) {
    // Legacy wrapper for backward compatibility
    confirmDeleteDictionary(dictId);
}

function showAddDictionaryModal() {
    let modal = document.getElementById('add-dict-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'add-dict-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';

    const languages = [
        { name: 'English → Spanish', emoji: '🇪🇸' },
        { name: 'English → French', emoji: '🇫🇷' },
        { name: 'English → German', emoji: '🇩🇪' },
        { name: 'English → Italian', emoji: '🇮🇹' },
        { name: 'English → Portuguese', emoji: '🇵🇹' },
        { name: 'English → Dutch', emoji: '🇳🇱' },
        { name: 'English → Polish', emoji: '🇵🇱' },
        { name: 'English → Japanese', emoji: '🇯🇵' },
        { name: 'English → Korean', emoji: '🇰🇷' },
        { name: 'English → Chinese', emoji: '🇨🇳' }
    ];

    let html = '<h3 style="margin:0 0 16px;font-size:18px;">Create New Dictionary</h3>';
    html += '<p style="font-size: 12px; color: #8e8e93; margin-bottom: 12px;">Select a language:</p>';

    languages.forEach(lang => {
        html += `
            <button class="lang-option-btn" data-name="${lang.name}" data-emoji="${lang.emoji}" style="
                width: 100%;
                background: linear-gradient(135deg, rgba(246, 247, 251, .6), rgba(246, 247, 251, .3));
                border: 1px solid rgba(123, 63, 242, .15);
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 12px;
                cursor: pointer;
                text-align: left;
                font-family: inherit;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <span style="font-size: 20px; margin-right: 12px;">${lang.emoji}</span>
                <span style="font-weight: 600; color: #1F2430;">${lang.name}</span>
            </button>
        `;
    });

    content.innerHTML = html;
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Language selection handler
    document.querySelectorAll('.lang-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.name;
            const emoji = btn.dataset.emoji;
            overlay.remove();
            promptDictionaryName(name, emoji);
        });
    });
}

function promptDictionaryName(languageTemplate, emoji) {
    let modal = document.getElementById('name-dict-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'name-dict-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';

    content.innerHTML = `
        <h3 style="margin:0 0 16px;font-size:18px;">Dictionary Name</h3>
        <p style="font-size: 12px; color: #8e8e93; margin-bottom: 12px;">${emoji} ${languageTemplate}</p>
        <input id="dict-name-input" type="text" placeholder="e.g., Spanish 101" autocomplete="off" style="width: 80%; padding: 10px; margin: 15px 0; border: 1px solid #007bff; border-radius: 10px;" />
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
            <button id="dict-create-btn" class="btn-primary">Create</button>
            <button id="dict-cancel-btn" class="btn-secondary">Cancel</button>
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const input = document.getElementById('dict-name-input');
    setTimeout(() => input.focus(), 50);

    const createBtn = document.getElementById('dict-create-btn');
    const cancelBtn = document.getElementById('dict-cancel-btn');

    createBtn.addEventListener('click', () => {
        const dictName = input.value.trim();
        if (dictName) {
            addDictionary(dictName, emoji);
            overlay.remove();
        }
    });

    cancelBtn.addEventListener('click', () => overlay.remove());
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') createBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });
}

function addDictionary(name, emoji) {
    const state = getAppState();
    if (!state) return;

    const newDict = {
        id: generateId(),
        name: name,
        emoji: emoji,
        description: '',
        progress: 0,
        words: [] // New dictionaries start empty
    };

    state.dictionaries.push(newDict);
    saveAppState(state);
    updateDashboard();
    renderDictionaries();
}

// ============================================
// DICTIONARY CREATION WIZARD (Multi-step)
// ============================================

const LANGUAGE_EMOJI = {
    'English': '🇬🇧',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Russian': '🇷🇺',
    'Chinese': '🇨🇳',
    'Japanese': '🇯🇵',
    'Korean': '🇰🇷',
    'Portuguese': '🇵🇹',
    'Turkish': '🇹🇷'
};

function navigateToScreen(screenId) {
    const menuItems = document.querySelectorAll('.menu-item');
    const screens = document.querySelectorAll('.screen');
    menuItems.forEach(i => i.classList.remove('active'));
    const targetMenu = Array.from(menuItems).find(i => i.dataset.screen === screenId);
    if (targetMenu) targetMenu.classList.add('active');
    screens.forEach(s => {
        s.classList.remove('active');
        if (s.id === screenId) s.classList.add('active');
    });
}

function showDictionaryWizard() {
    let modal = document.getElementById('dict-wizard-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'dict-wizard-modal';
    overlay.style.zIndex = '3000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '720px';
    content.style.width = '94%';
    content.style.maxHeight = '80vh';
    content.style.overflow = 'hidden';
    content.style.position = 'relative';

    // add close (X) button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'wiz-close-btn';
    closeBtn.style.cssText = 'position:absolute;top:12px;right:12px;background:transparent;border:none;font-size:18px;cursor:pointer;color:#1F2430;opacity:0.8;padding:6px;border-radius:8px;';
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1F2430" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.addEventListener('click', ()=> overlay.remove());
    content.appendChild(closeBtn);

    // Step state
    const state = { step: 1, from: 'English', to: 'Spanish', name: '', description: '', emoji: LANGUAGE_EMOJI['Spanish'], words: [{word:'', translation:''}] };

    function renderStep1() {
        const langs = Object.keys(LANGUAGE_EMOJI);
        let html = `<h3 style="margin:0 0 12px;font-size:18px;">Create Dictionary — Configuration</h3>`;
        html += `<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;">
            <div style="flex:1;min-width:140px;">
                <label style="font-size:12px;color:#8e8e93">From</label>
                <select id="wiz-from" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(123,63,242,.12)">`;
        langs.forEach(l => { html += `<option ${state.from===l?'selected':''}>${l}</option>`; });
        html += `</select>
            </div>
            <div style="flex:1;min-width:140px;">
                <label style="font-size:12px;color:#8e8e93">To</label>
                <select id="wiz-to" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(123,63,242,.12)">`;
        langs.forEach(l => { html += `<option ${state.to===l?'selected':''}>${l}</option>`; });
        html += `</select>
            </div>
        </div>`;

        html += `<div style="margin-top:12px;text-align:left;">
            <label style="font-size:12px;color:#8e8e93">Dictionary Name (optional)</label>
            <input id="wiz-name" placeholder="e.g., Spanish 101" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(123,63,242,.08);" />
        </div>`;

        html += `<div style="margin-top:12px;text-align:left;">
            <label style="font-size:12px;color:#8e8e93">Description (optional)</label>
            <input id="wiz-desc" placeholder="Short description" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(123,63,242,.08);" />
        </div>`;

        html += `<div style="margin-top:12px;text-align:left;display:flex;gap:12px;align-items:center;">
            <label style="font-size:12px;color:#8e8e93">Icon (Emoji)</label>
            <input id="wiz-emoji" placeholder="Emoji" style="width:80px;padding:8px;border-radius:8px;border:1px solid rgba(123,63,242,.08);text-align:center;font-size:18px;" />
            <div style="font-size:20px;margin-left:6px;color:#1F2430;">Preview: <span id="wiz-emoji-preview">${state.emoji}</span></div>
        </div>`;

        html += `<div style="display:flex;gap:12px;justify-content:flex-end;margin-top:18px;">
            <button id="wiz-cancel" class="btn-secondary">Cancel</button>
            <button id="wiz-continue" class="btn-primary" style="background:linear-gradient(135deg,var(--grad-1),var(--grad-2));">Continue</button>
        </div>`;

        content.innerHTML = html;

        // attach handlers
        document.getElementById('wiz-from').addEventListener('change', (e)=> state.from = e.target.value);
        document.getElementById('wiz-to').addEventListener('change', (e)=> { state.to = e.target.value; document.getElementById('wiz-emoji-preview').textContent = LANGUAGE_EMOJI[state.to] || ''; });
        const nameIn = document.getElementById('wiz-name');
        const descIn = document.getElementById('wiz-desc');
        const emojiIn = document.getElementById('wiz-emoji');
        nameIn.addEventListener('input', (e)=> state.name = e.target.value);
        descIn.addEventListener('input', (e)=> state.description = e.target.value);
        emojiIn.addEventListener('input', (e)=> { state.emoji = e.target.value || (LANGUAGE_EMOJI[state.to]||''); document.getElementById('wiz-emoji-preview').textContent = state.emoji; });

        document.getElementById('wiz-cancel').addEventListener('click', ()=> overlay.remove());
        document.getElementById('wiz-continue').addEventListener('click', ()=> {
            // autofill defaults
            if (!state.name) state.name = `${state.from} → ${state.to}`;
            if (!state.description) state.description = `A collection of words for ${state.to} learning.`;
            if (!state.emoji) state.emoji = LANGUAGE_EMOJI[state.to] || '';
            renderStep2();
        });
    }

    function renderStep2() {
        state.step = 2;
        let html = `<h3 style="margin:0 0 8px;font-size:18px;">Add Words — ${state.name} <span style=\"font-size:14px;color:#8e8e93;margin-left:8px;\">(${state.from} → ${state.to})</span></h3>`;
        html += `<div id="wiz-words" style="max-height:54vh;overflow-y:auto;padding-right:8px;margin-top:12px;">`;
        state.words.forEach((pair, idx) => {
            html += `<div class="wiz-row" data-idx="${idx}" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
                <input class="wiz-word" placeholder="${state.from} word" value="${pair.word||''}" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(123,63,242,.08);" />
                <input class="wiz-translation" placeholder="${state.to} translation" value="${pair.translation||''}" style="flex:1;padding:10px;border-radius:8px;border:1px solid rgba(123,63,242,.08);" />
                <button class="wiz-row-del" style="background:none;border:none;cursor:pointer;padding:6px;">${createTrashIcon('#ff3b30',18).outerHTML}</button>
            </div>`;
        });
        html += `</div>`;

        html += `<div style="display:flex;gap:12px;justify-content:flex-start;margin-top:8px;">
            <button id="wiz-add-word" class="btn-primary" style="background:linear-gradient(135deg,var(--grad-1),var(--grad-2));">+ Add Word</button>
            <div style="align-self:center;color:#8e8e93;font-size:12px;">${state.words.length}/30</div>
        </div>`;

        html += `<div style="position:sticky;bottom:0;background:transparent;padding-top:12px;margin-top:12px;display:flex;gap:12px;justify-content:flex-end;">
            <button id="wiz-back" class="btn-secondary">Back</button>
            <button id="wiz-save" class="btn-primary" style="background:linear-gradient(135deg,var(--grad-1),var(--grad-2));">Save Dictionary</button>
        </div>`;

        content.innerHTML = html;

        const wordsContainer = content.querySelector('#wiz-words');

        function refreshRowHandlers() {
            // delete handlers
            content.querySelectorAll('.wiz-row-del').forEach(btn => {
                btn.addEventListener('click', (e)=>{
                    e.stopPropagation();
                    const row = btn.closest('.wiz-row');
                    const idx = Number(row.dataset.idx);
                    state.words.splice(idx,1);
                    if (state.words.length === 0) state.words.push({word:'',translation:''});
                    renderStep2();
                });
            });
            // input sync
            content.querySelectorAll('.wiz-word').forEach((inp,i)=>{
                inp.addEventListener('input', (e)=> state.words[i].word = e.target.value);
            });
            content.querySelectorAll('.wiz-translation').forEach((inp,i)=>{
                inp.addEventListener('input', (e)=> state.words[i].translation = e.target.value);
            });
        }

        document.getElementById('wiz-add-word').addEventListener('click', ()=>{
            if (state.words.length >= 30) return;
            state.words.push({word:'',translation:''});
            renderStep2();
        });

        document.getElementById('wiz-back').addEventListener('click', ()=> renderStep1());

        document.getElementById('wiz-save').addEventListener('click', ()=>{
            // gather filled pairs
            const filled = state.words.map(w=>({word:(w.word||'').trim(), translation:(w.translation||'').trim()})).filter(p=>p.word && p.translation);
            if (filled.length === 0) { alert('Please add at least one word pair.'); return; }

            const newDict = {
                id: generateId(),
                name: state.name,
                emoji: state.emoji || LANGUAGE_EMOJI[state.to] || '',
                description: state.description || `A collection of words for ${state.to} learning.`,
                progress: 0,
                words: filled.map(p=> ({ id: generateId(), word: p.word, translation: p.translation, isFavourite: false, learned: false }))
            };

            const appState = getAppState();
            if (!appState) return;
            appState.dictionaries.push(newDict);
            saveAppState(appState);
            updateDashboard();
            renderDictionaries();
            overlay.remove();
            navigateToScreen('dictionaries');
        });

        refreshRowHandlers();
        // disable add when limit reached
        if (state.words.length >= 30) document.getElementById('wiz-add-word').disabled = true;
    }

    // initial render
    content.innerHTML = '';
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    renderStep1();

    // close on overlay click
    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) overlay.remove(); });
}


// ============================================
// ENHANCED DICTIONARY FEATURES
// ============================================

function toggleCardExpand(dictId, cardElement) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    const expanded = cardElement.querySelector('.dict-expanded');
    if (!expanded) return;

    const isExpanded = expanded.style.display === 'block';

    if (!isExpanded) {
        // Expand: populate words and show
        const wordsList = cardElement.querySelector('.dict-words-list');
        renderWordsInCard(dictId, wordsList);
        expanded.style.display = 'block';
        // Set max-height for smooth animation - include space for words list (max 250px) + add word button
        expanded.style.maxHeight = '310px';
    } else {
        // Collapse
        expanded.style.maxHeight = '0';
        setTimeout(() => {
            expanded.style.display = 'none';
        }, 300);
    }
}

function renderWordsInCard(dictId, parentElement) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    parentElement.innerHTML = '';
    
    // Set scrolling styles on parent
    parentElement.style.cssText = 'max-height: 250px; overflow-y: auto; padding-right: 4px;';
    
    // Add custom scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
        .dict-words-list::-webkit-scrollbar {
            width: 6px;
        }
        .dict-words-list::-webkit-scrollbar-track {
            background: transparent;
        }
        .dict-words-list::-webkit-scrollbar-thumb {
            background: rgba(123, 63, 242, 0.2);
            border-radius: 3px;
        }
        .dict-words-list::-webkit-scrollbar-thumb:hover {
            background: rgba(123, 63, 242, 0.4);
        }
    `;
    if (!document.querySelector('[data-scrollbar-style]')) {
        style.setAttribute('data-scrollbar-style', 'true');
        document.head.appendChild(style);
    }

    if (dict.words.length === 0) {
        parentElement.innerHTML = '<p style="font-size: 12px; color: #8e8e93; margin: 0;">No words added yet.</p>';
        return;
    }

    dict.words.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 8px; border-bottom: 1px solid rgba(123, 63, 242, 0.08); gap: 8px;';

        const wordContent = document.createElement('div');
        wordContent.style.cssText = 'flex: 1; min-width: 0;';
        wordContent.innerHTML = `
            <div style="font-size: 12px; font-weight: 600; color: #1F2430; word-break: break-word;">${word.word}</div>
            <div style="font-size: 11px; color: #8e8e93; word-break: break-word;">${word.translation}</div>
        `;

        const favBtn = document.createElement('button');
        favBtn.style.cssText = 'background: none; border: none; cursor: pointer; padding: 4px; min-width: 28px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;';
        favBtn.appendChild(createBookmarkIcon(word.isFavourite, 18));
        
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWordFavouriteUI(dictId, word.id);
            updateDashboard();
            renderWordsInCard(dictId, parentElement);
        });

        wordItem.appendChild(wordContent);
        wordItem.appendChild(favBtn);
        parentElement.appendChild(wordItem);
    });
}


function showWordManagement(dictId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    let modal = document.getElementById('word-management-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'word-management-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '500px';
    content.style.maxHeight = '70vh';
    content.style.overflow = 'auto';

    let html = `<h3 style="margin:0 0 16px;font-size:18px;">Edit Words - ${dict.name}</h3>`;
    html += `<button id="add-word-modal-btn" class="btn-primary" style="width: 100%; margin-bottom: 12px; padding: 10px;">+ Add Word</button>`;

    if (dict.words.length === 0) {
        html += '<p style="color: #8e8e93; text-align: center;">No words added yet. Click "+ Add Word" to get started.</p>';
    } else {
        html += '<div style="max-height: 400px; overflow-y: auto;">';
        dict.words.forEach(word => {
            html += `
                <div data-word-id="${word.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid rgba(123, 63, 242, 0.1); gap: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #1F2430;">${word.word}</div>
                        <div style="font-size: 12px; color: #8e8e93;">${word.translation}</div>
                    </div>
                    <button class="word-fav-btn" data-word-id="${word.id}" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;">${word.isFavourite ? '❤️' : '🤍'}</button>
                    <button class="word-del-btn" data-word-id="${word.id}" style="background: rgba(255, 59, 48, 0.1); color: #ff3b30; border: none; border-radius: 6px; cursor: pointer; padding: 6px 10px;">Delete</button>
                </div>
            `;
        });
        html += '</div>';
    }

    content.innerHTML = html;
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Add word button
    const addBtn = document.getElementById('add-word-modal-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            overlay.remove();
            showAddWordModal(dictId);
        });
    }

    // Word favorite buttons
    document.querySelectorAll('.word-fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wordId = btn.dataset.wordId;
            toggleWordFavouriteUI(dictId, wordId);
            // Refresh modal
            overlay.remove();
            showWordManagement(dictId);
        });
    });

    // Word delete buttons
    document.querySelectorAll('.word-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wordId = btn.dataset.wordId;
            removeWordFromDictionary(dictId, wordId);
            updateDashboard();
            // Refresh modal
            overlay.remove();
            showWordManagement(dictId);
        });
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function showAddWordModal(dictId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    let modal = document.getElementById('add-word-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'add-word-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '450px';

    content.innerHTML = `
        <h3 style="margin:0 0 16px;font-size:18px;">Add Word to ${dict.name}</h3>
        <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; font-weight: 600; color: #1F2430; display: block; margin-bottom: 4px;">English Word</label>
            <input id="add-word-input" type="text" placeholder="e.g., sunset" autocomplete="off" style="width: 100%; padding: 10px; border: 1px solid rgba(123, 63, 242, 0.3); border-radius: 8px; box-sizing: border-box;" />
        </div>
        <div style="margin-bottom: 16px;">
            <label style="font-size: 12px; font-weight: 600; color: #1F2430; display: block; margin-bottom: 4px;">Translation</label>
            <input id="add-translation-input" type="text" placeholder="e.g., atardecer" autocomplete="off" style="width: 100%; padding: 10px; border: 1px solid rgba(123, 63, 242, 0.3); border-radius: 8px; box-sizing: border-box;" />
        </div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
            <button id="word-save-btn" class="btn-primary">Add Word</button>
            <button id="word-cancel-btn" class="btn-secondary">Cancel</button>
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const wordInput = document.getElementById('add-word-input');
    const translationInput = document.getElementById('add-translation-input');
    const saveBtn = document.getElementById('word-save-btn');
    const cancelBtn = document.getElementById('word-cancel-btn');

    setTimeout(() => wordInput.focus(), 50);

    saveBtn.addEventListener('click', () => {
        const word = wordInput.value.trim();
        const translation = translationInput.value.trim();

        if (!word || !translation) {
            alert('Please enter both word and translation');
            return;
        }

        addWordToDictionary(dictId, word, translation);
        updateDashboard();
        renderDictionaries();
        overlay.remove();
    });

    cancelBtn.addEventListener('click', () => overlay.remove());

    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') translationInput.focus();
    });

    translationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function editDictionaryDescription(dictId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    let modal = document.getElementById('edit-desc-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'edit-desc-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '450px';

    content.innerHTML = `
        <h3 style="margin:0 0 16px;font-size:18px;">Edit Description</h3>
        <p style="font-size: 12px; color: #8e8e93; margin-bottom: 12px;">${dict.name}</p>
        <textarea id="desc-input" placeholder="Add a description for this dictionary..." autocomplete="off" style="width: 100%; padding: 10px; border: 1px solid rgba(123, 63, 242, 0.3); border-radius: 8px; box-sizing: border-box; font-family: inherit; min-height: 80px; resize: vertical;">${dict.description || ''}</textarea>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px;">
            <button id="desc-save-btn" class="btn-primary">Save</button>
            <button id="desc-cancel-btn" class="btn-secondary">Cancel</button>
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const input = document.getElementById('desc-input');
    const saveBtn = document.getElementById('desc-save-btn');
    const cancelBtn = document.getElementById('desc-cancel-btn');

    setTimeout(() => input.focus(), 50);

    saveBtn.addEventListener('click', () => {
        const description = input.value.trim();
        dict.description = description || '';
        saveAppState(state);
        updateDashboard();
        renderDictionaries();
        overlay.remove();
    });

    cancelBtn.addEventListener('click', () => overlay.remove());

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cancelBtn.click();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function editDictionaryEmoji(dictId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    let modal = document.getElementById('edit-emoji-modal');
    if (modal) modal.remove();

    const overlay = document.createElement('div');
    overlay.className = 'welcome-modal-overlay';
    overlay.id = 'edit-emoji-modal';
    overlay.style.zIndex = '2000';

    const content = document.createElement('div');
    content.className = 'welcome-modal-content';
    content.style.maxWidth = '450px';

    const emojis = ['🇪🇸', '🇫🇷', '🇩🇪', '🇮🇹', '🇵🇹', '🇳🇱', '🇵🇱', '🇯🇵', '🇰🇷', '🇨🇳', '🇷🇺', '🇧🇷', '🇲🇽', '📚', '🌍', '🗣️', '💬', '🎓', '✨', '🚀'];

    let html = `<h3 style="margin:0 0 16px;font-size:18px;">Change Icon</h3>`;
    html += `<p style="font-size: 12px; color: #8e8e93; margin-bottom: 12px;">${dict.name}</p>`;
    html += `<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px;">`;

    emojis.forEach(emoji => {
        html += `<button class="emoji-btn" data-emoji="${emoji}" style="font-size: 28px; padding: 12px; border: ${dict.emoji === emoji ? '2px solid #3a86ff' : '1px solid rgba(123, 63, 242, 0.2)'}; border-radius: 8px; cursor: pointer; background: rgba(246, 247, 251, 0.5); transition: all 0.3s;">
            ${emoji}
        </button>`;
    });

    html += `</div>`;
    html += `<div style="display:flex;gap:12px;justify-content:center;">
        <button id="emoji-save-btn" class="btn-primary">Apply</button>
        <button id="emoji-cancel-btn" class="btn-secondary">Cancel</button>
    </div>`;

    content.innerHTML = html;
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    let selectedEmoji = dict.emoji;

    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-btn').forEach(b => {
                b.style.border = '1px solid rgba(123, 63, 242, 0.2)';
            });
            btn.style.border = '2px solid #3a86ff';
            selectedEmoji = btn.dataset.emoji;
        });
    });

    document.getElementById('emoji-save-btn').addEventListener('click', () => {
        dict.emoji = selectedEmoji;
        saveAppState(state);
        updateDashboard();
        renderDictionaries();
        overlay.remove();
    });

    document.getElementById('emoji-cancel-btn').addEventListener('click', () => overlay.remove());

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function toggleWordFavouriteUI(dictId, wordId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    const word = dict.words.find(w => w.id === wordId);
    if (!word) return;

    word.isFavourite = !word.isFavourite;
    saveAppState(state);
    updateDashboard();
}

// ============================================
// WORD-LEVEL OPERATIONS
// ============================================

function toggleWordFavourite(dictId, wordId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    const word = dict.words.find(w => w.id === wordId);
    if (!word) return;

    word.isFavourite = !word.isFavourite;
    saveAppState(state);
    updateDashboard(); // Updates favourite count
}

function markWordAsLearned(dictId, wordId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    const word = dict.words.find(w => w.id === wordId);
    if (!word) return;

    // Add a "learned" flag if needed later
    word.learned = true;
    
    // Update progress count
    dict.progress = dict.words.filter(w => w.learned).length;
    
    saveAppState(state);
    updateDashboard();
    renderDictionaries();
}

function addWordToDictionary(dictId, word, translation) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    const newWord = {
        id: generateId(),
        word: word,
        translation: translation,
        isFavourite: false,
        learned: false
    };

    dict.words.push(newWord);
    saveAppState(state);
    updateDashboard();
}

function removeWordFromDictionary(dictId, wordId) {
    const state = getAppState();
    if (!state) return;

    const dict = state.dictionaries.find(d => d.id === dictId);
    if (!dict) return;

    dict.words = dict.words.filter(w => w.id !== wordId);
    
    // Update progress count
    dict.progress = dict.words.filter(w => w.learned).length;
    
    saveAppState(state);
    updateDashboard();
    renderDictionaries();
}

// ============================================
// ACTIVITY TRACKER
// ============================================

let activityTimerId = null;

function startActivityTracker() {
    // Increment every 30 seconds
    activityTimerId = setInterval(() => {
        const state = getAppState();
        if (state) {
            state.totalTimeActive += 30;
            saveAppState(state);
            updateDashboard();
        }
    }, 30000); // 30 seconds
}

function stopActivityTracker() {
    if (activityTimerId) {
        clearInterval(activityTimerId);
        activityTimerId = null;
    }
}

// ============================================
// PAGE LOADER
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const loadScreen = document.querySelector('.load-screen');

    setTimeout(() => {
        loadScreen.classList.add('hidden');
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            loadScreen.remove();
            checkUsernameAndPrompt();
            // Initialize app state and start tracking
            initializeAppState();
            updateDashboard();
            startActivityTracker();
        }, 1000);
    }, 3000);
});

// ============================================
// USERNAME MANAGEMENT
// ============================================

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

    setTimeout(() => {
        try {
            input.focus();
            input.select();
        } catch (e) {}
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
        const span = document.querySelector('.username');
        if (span) span.textContent = v;
        closeModal();
    }

    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', () => {
        const guests = [
            'Mystic Leaf', 'Happy Pebble', 'Silver Fox', 'Cloud Jumper', 'Little Fern',
            'Blue Owl', 'Calm River', 'Sunny Ray', 'Night Owl', 'Forest Friend'
        ];
        const name = guests[Math.floor(Math.random() * guests.length)];
        try {
            localStorage.setItem('pwa_username', name);
        } catch (e) {}
        const span = document.querySelector('.username');
        if (span) span.textContent = name;
        closeModal();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
    });
}

function checkUsernameAndPrompt() {
    try {
        const saved = localStorage.getItem('pwa_username');
        if (saved === null) {
            showUsernameModal();
        } else if (saved) {
            const span = document.querySelector('.username');
            if (span) span.textContent = saved;
        }
    } catch (e) {
        console.warn('localStorage not available', e);
    }
}

// Re-run check when the app's clear-data button is used
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-danger');
    if (!btn) return;
    
    // Check if this is the "Clear All Data" button from the data screen
    const dataSection = btn.closest('.data-section');
    if (!dataSection) return; // CRITICAL: Only proceed if button is in data section
    
    // Only clear appState and username if in data section
    try {
        localStorage.removeItem('appState');
    } catch (e) {}
    
    try {
        localStorage.removeItem('pwa_username');
    } catch (e) {}
    setTimeout(checkUsernameAndPrompt, 250);
    setTimeout(() => {
        initializeAppState();
        updateDashboard();
        renderDictionaries();
    }, 250);
});

// Listen for storage changes (other tabs)
window.addEventListener('storage', (e) => {
    if (e.key === 'pwa_username' && !e.newValue) checkUsernameAndPrompt();
});

// ============================================
// MENU AND SCREEN NAVIGATION
// ============================================

const burger = document.getElementById('burger');
const sideMenu = document.getElementById('sideMenu');
const menuItems = document.querySelectorAll('.menu-item');
const screens = document.querySelectorAll('.screen');

burger.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
});

menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Check if item is disabled
        if (item.classList.contains('disabled')) {
            e.preventDefault();
            return;
        }

        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const target = item.dataset.screen;

        screens.forEach(screen => {
            screen.classList.remove('active');
            if (screen.id === target) {
                screen.classList.add('active');
                // Render dictionaries when the dictionaries screen is activated
                if (target === 'dictionaries') {
                    renderDictionaries();
                }
            }
        });

        sideMenu.classList.remove('open');
    });
});

// ============================================
// ACTIVE DICTIONARY INTERACTION
// ============================================

const activeDictBlock = document.getElementById('active-dictionary-block');
if (activeDictBlock) {
    activeDictBlock.addEventListener('click', () => {
        showDictionarySelector();
    });
}

// ============================================
// FAB BUTTON HANDLERS
// ============================================

// Handle FAB button on Dictionaries screen
document.addEventListener('click', (e) => {
    const fab = e.target.closest('.fab');
    if (!fab) return;

    const dictsScreen = document.getElementById('dictionaries');
    if (dictsScreen && dictsScreen.contains(fab)) {
        showDictionaryWizard();
    }
});

// ============================================
// SCREEN NAVIGATION & RENDERING
// ============================================

// Render dictionaries when dictionaries screen becomes active
const observer = new MutationObserver(() => {
    const dictsScreen = document.getElementById('dictionaries');
    if (dictsScreen && dictsScreen.classList.contains('active')) {
        renderDictionaries();
    }
});

screens.forEach(screen => {
    observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
});

// ============================================
// FLASHCARD INTERACTION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const flashcard = document.querySelector('.flashcard');
    if (flashcard) {
        flashcard.addEventListener('click', (e) => {
            e.stopPropagation();
            flashcard.classList.toggle('flipped');
        });
    }
});

// ============================================
// ENSURE STATE SYNC ON PAGE VISIBILITY
// ============================================

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopActivityTracker();
    } else {
        startActivityTracker();
        updateDashboard();
    }
});
