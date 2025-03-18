// ==UserScript==
// @name         Ficbook Ленты без подписки (Fullscreen + Blur) - Улучшенная версия
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Создавайте свои ленты (до 20 шт.) на ficbook.net без подписки. Полноэкранная панель с затемнением фона и дизайном в стиле сайта.
// @author       @Sterepando
// @match        *://ficbook.net/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // Добавляем стили, адаптированные под дизайн Ficbook
    GM_addStyle(`
        /* Кнопка "Ленты" в правом верхнем углу */
        #ficFeedsToggle {
            background: #542a00;
            color: #fff;
            border: none;
            padding: 8px 14px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin-right: 5px;
            transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        #ficFeedsToggle:hover {
            background: #7a3d00;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        #ficFeedsToggle:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Кнопка "Сохранить как ленту" */
        #saveAsLentaBtn {
            background: #542a00;
            color: #fff;
            border: none;
            padding: 8px 14px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        #saveAsLentaBtn:hover {
            background: #7a3d00;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        #saveAsLentaBtn:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Контейнер для кнопок */
        #ficFeedsButtonsContainer {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Полноэкранный оверлей (затемнение + размытие) */
        #ficFeedsOverlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0);
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            z-index: 10000;
            display: none;
            transition: background-color 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),
                        backdrop-filter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
            pointer-events: none;
        }
        #ficFeedsOverlay.visible {
            background-color: rgba(0,0,0,0.7);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            pointer-events: auto;
        }

        /* Основная панель по центру */
        #ficFeedsPanel {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            pointer-events: auto;
        }
        #ficFeedsPanel.visible {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }

        /* Темная тема */
        body.dark-theme #ficFeedsPanel {
            background: #2b2b2b;
            color: #e6e6e6;
        }

        body.dark-theme #ficFeedsPanel h2 {
            color: #e6e6e6;
        }

        body.dark-theme .feedItem {
            background: #3a3a3a;
        }

        body.dark-theme .feedItem:hover {
            background: #444444;
        }

        body.dark-theme .feedName {
            color: #e6e6e6;
        }

        body.dark-theme .feedDesc {
            color: #b0b0b0;
        }

        body.dark-theme #ficFeedsForm input {
            background: #3a3a3a;
            color: #e6e6e6;
            border-color: #555;
        }

        #ficFeedsPanel h2 {
            margin: 0 0 16px 0;
            font-size: 20px;
            font-weight: 600;
            color: #542a00;
            text-align: center;
        }

        /* Кнопка "Закрыть" в углу панели */
        #closeFeedsBtn {
            position: absolute;
            top: 10px;
            right: 14px;
            background: transparent;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #542a00;
        }
        #closeFeedsBtn:hover {
            color: #7a3d00;
        }

        body.dark-theme #closeFeedsBtn {
            color: #e6e6e6;
        }

        body.dark-theme #closeFeedsBtn:hover {
            color: #fff;
        }

        /* Список лент */
        #feedsList {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .feedItem {
            background: #f5f5f5;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            cursor: pointer;
            position: relative;
            transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .feedItem:hover {
            background: #ebebeb;
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .feedName {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 6px;
        }
        .feedDesc {
            font-size: 14px;
            color: #666;
        }
        .deleteFeedBtn {
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            color: #d9534f;
            font-weight: 600;
            cursor: pointer;
            font-size: 13px;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        }
        .deleteFeedBtn:hover {
            opacity: 1;
            text-decoration: underline;
        }

        /* Кнопка "Добавить ленту" */
        #addFeedBtn {
            display: block;
            width: 100%;
            background: #542a00;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 12px 14px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 12px;
            transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        #addFeedBtn:hover {
            background: #7a3d00;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        #addFeedBtn:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Форма добавления ленты */
        #ficFeedsForm {
            display: none;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #eee;
        }

        body.dark-theme #ficFeedsForm {
            border-top-color: #444;
        }

        #ficFeedsForm input {
            width: 100%;
            margin-bottom: 10px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
        }
        #ficFeedsForm button {
            margin-right: 8px;
            padding: 10px 14px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s ease;
        }
        #saveFeedBtn {
            background-color: #542a00;
            color: #fff;
        }
        #saveFeedBtn:hover {
            background-color: #7a3d00;
        }
        #cancelFeedBtn {
            background-color: #6c757d;
            color: #fff;
        }
        #cancelFeedBtn:hover {
            background-color: #5a6268;
        }

        /* Уведомление */
        #ficFeedsNotification {
            position: fixed;
            bottom: -60px;
            right: 20px;
            background: rgba(40, 167, 69, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 10002;
            font-size: 14px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        #ficFeedsNotification.show {
            bottom: 20px;
        }
    `);

    // Создаем контейнер для кнопок
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'ficFeedsButtonsContainer';

    // Кнопка "Мои ленты"
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'ficFeedsToggle';
    toggleBtn.textContent = 'Мои ленты';
    buttonsContainer.appendChild(toggleBtn);

    // Кнопка "Сохранить как ленту"
    const saveAsLentaBtn = document.createElement('button');
    saveAsLentaBtn.id = 'saveAsLentaBtn';
    saveAsLentaBtn.textContent = 'Сохранить как ленту';
    buttonsContainer.appendChild(saveAsLentaBtn);

    // Добавляем кнопки в верхний правый угол рядом с профилем
    // Ищем подходящее место для вставки кнопок
    function insertButtons() {
        // Ищем элемент профиля в правом верхнем углу
        const profileArea = document.querySelector('.profile-holder');

        if (profileArea) {
            // Вставляем наши кнопки перед профилем
            profileArea.parentNode.insertBefore(buttonsContainer, profileArea);
            return true;
        }

        return false;
    }

    // Пытаемся вставить кнопки сразу
    if (!insertButtons()) {
        // Если не удалось, пробуем через небольшую задержку
        setTimeout(insertButtons, 1000);
    }

    // Оверлей (затемнение + blur)
    const overlay = document.createElement('div');
    overlay.id = 'ficFeedsOverlay';
    document.body.appendChild(overlay);

    // Контейнер панели внутри оверлея
    overlay.innerHTML = `
        <div id="ficFeedsPanel">
            <button id="closeFeedsBtn">✕</button>
            <h2>Мои Ленты</h2>
            <ul id="feedsList"></ul>
            <button id="addFeedBtn">Добавить ленту</button>
            <div id="ficFeedsForm">
                <input type="text" id="feedName" placeholder="Название ленты">
                <input type="text" id="feedDesc" placeholder="Краткое описание">
                <input type="text" id="feedURL" placeholder="URL поиска/фильтра">
                <button id="saveFeedBtn">Сохранить</button>
                <button id="cancelFeedBtn">Отмена</button>
            </div>
        </div>
    `;

    // Уведомление
    const notification = document.createElement('div');
    notification.id = 'ficFeedsNotification';
    document.body.appendChild(notification);

    // Ссылки на элементы внутри оверлея
    const feedsList = overlay.querySelector('#feedsList');
    const addFeedBtn = overlay.querySelector('#addFeedBtn');
    const ficFeedsForm = overlay.querySelector('#ficFeedsForm');
    const feedNameInput = overlay.querySelector('#feedName');
    const feedDescInput = overlay.querySelector('#feedDesc');
    const feedURLInput = overlay.querySelector('#feedURL');
    const saveFeedBtn = overlay.querySelector('#saveFeedBtn');
    const cancelFeedBtn = overlay.querySelector('#cancelFeedBtn');
    const closeFeedsBtn = overlay.querySelector('#closeFeedsBtn');

    // Загружаем ленты из хранилища
    let feeds = GM_getValue('ficFeeds', []);
    if (typeof feeds === 'string') {
        try {
            feeds = JSON.parse(feeds);
        } catch(e) {
            feeds = [];
        }
    }

    // Функция сохранения лент
    function saveFeeds() {
        GM_setValue('ficFeeds', JSON.stringify(feeds));
        renderFeeds();
    }

    // Отрисовка списка лент
    function renderFeeds() {
        feedsList.innerHTML = '';
        feeds.forEach((feed, index) => {
            const li = document.createElement('li');
            li.classList.add('feedItem');
            li.setAttribute('data-index', index);
            li.setAttribute('data-url', feed.url);

            // Карточка ленты
            li.innerHTML = `
                <div class="feedName">${feed.name}</div>
                <div class="feedDesc">${feed.description || ''}</div>
                <button class="deleteFeedBtn" data-index="${index}">Удалить</button>
            `;
            feedsList.appendChild(li);
        });
    }
    renderFeeds();

    // Переключение оверлея по кнопке "Ленты"
    toggleBtn.addEventListener('click', () => {
        overlay.style.display = 'block';
        // Добавляем небольшую задержку для анимации
        setTimeout(() => {
            overlay.classList.add('visible');
            overlay.querySelector('#ficFeedsPanel').classList.add('visible');
        }, 10);
    });

    // Кнопка "Закрыть" внутри панели - единственный способ закрыть панель
    closeFeedsBtn.addEventListener('click', () => {
        const panel = overlay.querySelector('#ficFeedsPanel');
        overlay.classList.remove('visible');
        panel.classList.remove('visible');

        // Ждем окончания анимации перед скрытием оверлея
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 500);
    });

    // Предотвращаем закрытие по клику на оверлей (вне панели)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            // Не закрываем панель, чтобы выход был только через крестик
            e.stopPropagation();
        }
    });

    // Клик по списку лент (открытие или удаление)
    feedsList.addEventListener('click', (e) => {
        // Удаление
        if (e.target && e.target.matches('button.deleteFeedBtn')) {
            const index = e.target.getAttribute('data-index');
            feeds.splice(index, 1);
            saveFeeds();
            showNotification('Лента удалена');
            return;
        }
        // Открытие при клике на саму плашку (кроме кнопки "Удалить")
        const item = e.target.closest('.feedItem');
        if (item && !e.target.matches('.deleteFeedBtn')) {
            const url = item.getAttribute('data-url');
            window.open(url, '_blank');
        }
    });

    // Кнопка "Добавить ленту"
    addFeedBtn.addEventListener('click', () => {
        ficFeedsForm.style.display = 'block';
        feedNameInput.value = '';
        feedDescInput.value = '';
        feedURLInput.value = '';
        feedNameInput.focus();
    });

    // Кнопка "Сохранить" в форме
    saveFeedBtn.addEventListener('click', () => {
        const name = feedNameInput.value.trim();
        const description = feedDescInput.value.trim();
        const url = feedURLInput.value.trim();

        if (!name || !url) {
            alert('Пожалуйста, заполните название и URL ленты');
            return;
        }

        // Ограничение на 20 лент
        if (feeds.length >= 20) {
            alert('Вы достигли максимального количества лент (20). Удалите неиспользуемые ленты, чтобы добавить новые.');
            return;
        }

        feeds.push({
            name: name,
            description: description,
            url: url
        });

        saveFeeds();
        ficFeedsForm.style.display = 'none';
        showNotification('Лента успешно добавлена');
    });

    // Кнопка "Отмена" в форме
    cancelFeedBtn.addEventListener('click', () => {
        ficFeedsForm.style.display = 'none';
    });

    // Функция для отображения уведомлений
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Функция для сохранения текущей страницы как ленты
    function saveCurrentPageAsLenta() {
        // Получаем текущий URL
        const currentUrl = window.location.href;

        // Получаем заголовок страницы
        let pageTitle = '';

        // Пытаемся определить тип страницы и получить подходящее название
        if (document.querySelector('.fanfic-main-info h1')) {
            // Страница фанфика
            pageTitle = document.querySelector('.fanfic-main-info h1').textContent.trim();
        } else if (document.querySelector('h1.title')) {
            // Страница с заголовком
            pageTitle = document.querySelector('h1.title').textContent.trim();
        } else if (document.querySelector('.find-page-header')) {
            // Страница поиска
            pageTitle = 'Поиск: ' + document.querySelector('.find-page-header').textContent.trim();
        } else {
            // Используем заголовок документа как запасной вариант
            pageTitle = document.title.replace(' — Книга Фанфиков', '').trim();
        }

        // Определяем тип страницы для описания
        let pageDescription = '';

        if (currentUrl.includes('/readfic/')) {
            pageDescription = 'Фанфик';
        } else if (currentUrl.includes('/find-fanfics')) {
            pageDescription = 'Поиск фанфиков';
        } else if (currentUrl.includes('/authors/')) {
            pageDescription = 'Автор';
        } else if (currentUrl.includes('/fanfiction/')) {
            pageDescription = 'Фэндом';
        } else {
            pageDescription = 'Страница на Ficbook';
        }

        // Открываем форму добавления ленты
        overlay.style.display = 'block';

        // Добавляем класс visible для активации анимации и взаимодействия
        setTimeout(() => {
            overlay.classList.add('visible');
            overlay.querySelector('#ficFeedsPanel').classList.add('visible');
        }, 10);

        ficFeedsForm.style.display = 'block';

        // Заполняем поля формы
        feedNameInput.value = pageTitle;
        feedDescInput.value = pageDescription;
        feedURLInput.value = currentUrl;

        // Фокус на название для возможности редактирования
        feedNameInput.focus();
    }

    // Обработчик для кнопки "Сохранить как ленту"
    saveAsLentaBtn.addEventListener('click', saveCurrentPageAsLenta);

    // Добавляем обработчик клавиатурных сокращений
    document.addEventListener('keydown', function(e) {
        // Alt+L для открытия панели лент
        if (e.altKey && e.key === 'l') {
            e.preventDefault();
            overlay.style.display = 'block';
            setTimeout(() => {
                overlay.classList.add('visible');
                overlay.querySelector('#ficFeedsPanel').classList.add('visible');
            }, 10);
        }

        // Alt+S для сохранения текущей страницы как ленты
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            saveCurrentPageAsLenta();
        }
    });

    // Адаптация к темной теме
    function updateThemeStyles() {
        const isDarkTheme = document.body.classList.contains('dark-theme');

        if (isDarkTheme) {
            toggleBtn.style.background = '#7a3d00';
            saveAsLentaBtn.style.background = '#7a3d00';
        } else {
            toggleBtn.style.background = '#542a00';
            saveAsLentaBtn.style.background = '#542a00';
        }
    }

    // Проверяем тему при загрузке
    updateThemeStyles();

    // Отслеживаем изменение темы
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                updateThemeStyles();
            }
        });
    });

    observer.observe(document.body, { attributes: true });

    // Добавляем подсказки о горячих клавишах
    toggleBtn.title = 'Открыть панель лент (Alt+L)';
    saveAsLentaBtn.title = 'Сохранить текущую страницу как ленту (Alt+S)';
})();
