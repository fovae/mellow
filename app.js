document.addEventListener('DOMContentLoaded', () => {
    const loadScreen = document.querySelector('.load-screen');

    setTimeout(() => {
        loadScreen.classList.add('hidden');
        document.body.style.overflow = 'auto';

        setTimeout(() => loadScreen.remove(), 1000);
    }, 3000);
});


const burger = document.getElementById('burger');
const sideMenu = document.getElementById('sideMenu');
const menuItems = document.querySelectorAll('.menu-item');
const screens = document.querySelectorAll('.screen');

// открытие/закрытие меню
burger.addEventListener('click', () => {
    sideMenu.classList.toggle('open');
});

// переключение экранов
menuItems.forEach(item => {
    item.addEventListener('click', () => {

        // активный пункт меню
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const target = item.dataset.screen;

        // активный экран
        screens.forEach(screen => {
            screen.classList.remove('active');
            if (screen.id === target) {
                screen.classList.add('active');
            }
        });

        // закрыть меню после выбора
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
