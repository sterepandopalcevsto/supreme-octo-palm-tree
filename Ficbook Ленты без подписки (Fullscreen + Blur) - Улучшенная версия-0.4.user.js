// ==UserScript==
// @name         Ficbook Ленты без подписки (Fullscreen + Blur) - Оптимизированная версия
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Создавайте свои ленты (до 20 шт.) на ficbook.net без подписки. Полноэкранная панель с затемнением фона и дизайном в стиле сайта.
// @author       You
// @match        *://ficbook.net/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(async function() {
    'use strict';

    // Добавляем стили через одну операцию
    GM_addStyle(`
        /* Общие стили для кнопок */
        #ficFeedsToggle, #saveAsLentaBtn {
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
        #ficFeedsToggle:hover, #saveAsLentaBtn:hover {
            background: #7a3d00;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        #ficFeedsToggle:active, #saveAsLentaBtn:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        #ficFeedsToggle { margin-right: 5px; }

        /* Контейнер для кнопок */
        #ficFeedsButtonsContainer {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Полноэкранный оверлей */
        #ficFeedsOverlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0);
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
            z-index: 10000;
            display: none;
            transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
            pointer-events: none;
        }
        #ficFeedsOverlay.visible {
            background-color: rgba(0,0,0,0.7);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            pointer-events: auto;
        }

        /* Основная панель */
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
        body.dark-theme #ficFeedsPanel { background: #2b2b2b; color: #e6e6e6; }
        body.dark-theme #ficFeedsPanel h2 { color: #e6e6e6; }
        body.dark-theme .feedItem { background: #3a3a3a; }
        body.dark-theme .feedItem:hover { background: #444444; }
        body.dark-theme .feedName { color: #e6e6e6; }
        body.dark-theme .feedDesc { color: #b0b0b0; }
        body.dark-theme #ficFeedsForm input { background: #3a3a3a; color: #e6e6e6; border-color: #555; }
        body.dark-theme #closeFeedsBtn { color: #e6e6e6; }
        body.dark-theme #closeFeedsBtn:hover { color: #fff; }
        body.dark-theme .filterTag { background: #444; color: #ddd; }

        /* Заголовок панели */
        #ficFeedsPanel h2 {
            margin: 0 0 16px 0;
            font-size: 20px;
            font-weight: 600;
            color: #542a00;
            text-align: center;
        }

        /* Кнопка "Закрыть" */
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
        #closeFeedsBtn:hover { color: #7a3d00; }

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

        /* Фильтры */
        .feedFilters {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        .filterTag {
            background: #e0e0e0;
            color: #333;
            font-size: 11px;
            padding: 3px 6px;
            border-radius: 4px;
            display: inline-block;
        }

        /* Кнопка удаления */
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
        body.dark-theme #ficFeedsForm { border-top-color: #444; }
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
        #saveFeedBtn:hover { background-color: #7a3d00; }
        #cancelFeedBtn {
            background-color: #6c757d;
            color: #fff;
        }
        #cancelFeedBtn:hover { background-color: #5a6268; }

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
        #ficFeedsNotification.show { bottom: 20px; }
    `);

    // Создаем UI элементы
    const createElements = () => {
        // Контейнер для кнопок
        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'ficFeedsButtonsContainer';

        // Кнопки
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'ficFeedsToggle';
        toggleBtn.textContent = 'Мои ленты';
        toggleBtn.title = 'Открыть панель лент (Alt+L)';

        const saveAsLentaBtn = document.createElement('button');
        saveAsLentaBtn.id = 'saveAsLentaBtn';
        saveAsLentaBtn.textContent = 'Сохранить как ленту';
        saveAsLentaBtn.title = 'Сохранить текущую страницу как ленту (Alt+S)';

        buttonsContainer.append(toggleBtn, saveAsLentaBtn);

        // Оверлей
        const overlay = document.createElement('div');
        overlay.id = 'ficFeedsOverlay';

        // Панель и форма
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
                    <input type="hidden" id="feedFilters">
                    <button id="saveFeedBtn">Сохранить</button>
                    <button id="cancelFeedBtn">Отмена</button>
                </div>
            </div>
        `;

        // Уведомление
        const notification = document.createElement('div');
        notification.id = 'ficFeedsNotification';

        document.body.append(overlay, notification);

        return { buttonsContainer, toggleBtn, saveAsLentaBtn };
    };

    // Вставляем кнопки в интерфейс
    const insertButtons = async () => {
        const { buttonsContainer, toggleBtn, saveAsLentaBtn } = createElements();

        // Пытаемся найти место для вставки кнопок
        const tryInsert = () => {
            const profileArea = document.querySelector('.profile-holder');
            if (profileArea) {
                profileArea.parentNode.insertBefore(buttonsContainer, profileArea);
                return true;
            }
            return false;
        };

        // Если не удалось сразу, пробуем через промис с таймаутом
        if (!tryInsert()) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (tryInsert()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 300);

                // Прекращаем попытки через 5 секунд
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        }

        return { toggleBtn, saveAsLentaBtn };
    };

    // Получаем элементы DOM
    const { toggleBtn, saveAsLentaBtn } = await insertButtons();
    const overlay = document.getElementById('ficFeedsOverlay');
    const panel = document.getElementById('ficFeedsPanel');
    const feedsList = document.getElementById('feedsList');
    const addFeedBtn = document.getElementById('addFeedBtn');
    const ficFeedsForm = document.getElementById('ficFeedsForm');
    const feedNameInput = document.getElementById('feedName');
    const feedDescInput = document.getElementById('feedDesc');
    const feedURLInput = document.getElementById('feedURL');
    const feedFiltersInput = document.getElementById('feedFilters');
    const saveFeedBtn = document.getElementById('saveFeedBtn');
    const cancelFeedBtn = document.getElementById('cancelFeedBtn');
    const closeFeedsBtn = document.getElementById('closeFeedsBtn');
    const notification = document.getElementById('ficFeedsNotification');

    // Загружаем ленты из хранилища
    let feeds = (() => {
        const stored = GM_getValue('ficFeeds', []);
        if (typeof stored === 'string') {
            try {
                return JSON.parse(stored);
            } catch(e) {
                return [];
            }
        }
        return stored;
    })();

    // Утилиты
    const utils = {
        // Анимированное открытие панели
        showPanel: () => {
            overlay.style.display = 'block';
            setTimeout(() => {
                overlay.classList.add('visible');
                panel.classList.add('visible');
            }, 10);
        },

        // Анимированное закрытие панели
        hidePanel: () => {
            overlay.classList.remove('visible');
            panel.classList.remove('visible');
            setTimeout(() => overlay.style.display = 'none', 500);
        },

        // Показ уведомления
        notify: (message) => {
            notification.textContent = message;
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 3000);
        },

        // Парсинг фильтров из URL
        parseFilters: (url) => {
            const filters = [];
            try {
                const urlObj = new URL(url);
                const params = new URLSearchParams(urlObj.search);

                // Карта соответствий для фильтров
                const filterMaps = {
                    workTypes: {
                        param: 'work_types[]',
                        values: {
                            'fandom': 'Фэндом',
                            'originals': 'Ориджиналы',
                            'mixed': 'Смешанное'
                        }
                    },
                    directions: {
                        param: 'directions[]',
                        values: {
                            '1': 'Гет',
                            '2': 'Слэш',
                            '3': 'Фемслэш',
                            '4': 'Джен',
                            '5': 'Смешанное',
                            '6': 'Другое'
                        }
                    },
                    ratings: {
                        param: 'ratings[]',
                        values: {
                            '1': 'G',
                            '2': 'PG-13',
                            '3': 'R',
                            '4': 'NC-17'
                        }
                    },
                    status: {
                        param: 'status',
                        values: {
                            'in-progress': 'В процессе',
                            'finished': 'Завершён',
                            'freezed': 'Заморожен'
                        }
                    },
                    sort: {
                        param: 'sort',
                        values: {
                            '1': 'По дате обновления',
                            '2': 'По дате создания',
                            '3': 'По размеру',
                            '4': 'По просмотрам',
                            '5': 'По лайкам',
                            '6': 'По комментариям',
                            '7': 'По наградам'
                        }
                    }
                };

                // Обработка фильтров по карте соответствий
                Object.values(filterMaps).forEach(map => {
                    if (params.has(map.param)) {
                        const values = params.getAll(map.param);
                        values.forEach(val => {
                            if (map.values[val]) filters.push(map.values[val]);
                        });
                    }
                });

                // Обработка фэндомов
                if (params.has('fandom_ids[]')) {
                    const fandomCount = params.getAll('fandom_ids[]').length;
                    filters.push(`Фэндомов: ${fandomCount}`);
                }

                // Обработка тегов
                if (params.has('tags_include[]')) {
                    const tagsCount = params.getAll('tags_include[]').length;
                    filters.push(`Теги: ${tagsCount}`);
                }

                // Обработка исключенных тегов
                if (params.has('tags_exclude[]')) {
                    const excludedTagsCount = params.getAll('tags_exclude[]').length;
                    filters.push(`Исключено тегов: ${excludedTagsCount}`);
                }
            } catch (e) {
                console.error('Error parsing filters:', e);
            }

            return filters;
        },

        // Получение информации о текущей странице
        getPageInfo: () => {
            const url = window.location.href;
            let title = '';
            let description = '';

            // Определение заголовка
            if (document.querySelector('.fanfic-main-info h1')) {
                title = document.querySelector('.fanfic-main-info h1').textContent.trim();
            } else if (document.querySelector('h1.title')) {
                title = document.querySelector('h1.title').textContent.trim();
            } else if (document.querySelector('.find-page-header')) {
                title = 'Поиск: ' + document.querySelector('.find-page-header').textContent.trim();
            } else {
                title = document.title.replace(' — Книга Фанфиков', '').trim();
            }

            // Определение типа страницы
            if (url.includes('/readfic/')) {
                description = 'Фанфик';
            } else if (url.includes('/find-fanfics')) {
                description = 'Поиск фанфиков';
            } else if (url.includes('/authors/')) {
                description = 'Автор';
            } else if (url.includes('/fanfiction/')) {
                description = 'Фэндом';
            } else {
                description = 'Страница на Ficbook';
            }

            return { url, title, description };
        }
    };

    // Функции для работы с лентами
    const feedsManager = {
        // Сохранение лент
        save: () => {
            GM_setValue('ficFeeds', JSON.stringify(feeds));
            feedsManager.render();
        },

        // Отрисовка списка лент
        render: () => {
            feedsList.innerHTML = '';

            feeds.forEach((feed, index) => {
                const li = document.createElement('li');
                li.classList.add('feedItem');
                li.setAttribute('data-index', index);
                li.setAttribute('data-url', feed.url);

                // Создаем элементы ленты
                const nameDiv = document.createElement('div');
                nameDiv.classList.add('feedName');
                nameDiv.textContent = feed.name;

                const descDiv = document.createElement('div');
                descDiv.classList.add('feedDesc');
                descDiv.textContent = feed.description || '';

                // Контейнер для фильтров
                const filtersDiv = document.createElement('div');
                filtersDiv.classList.add('feedFilters');

                // Добавляем фильтры
                const filters = feed.filters || utils.parseFilters(feed.url);
                if (!feed.filters && filters.length) {
                    feed.filters = filters;
                    feedsManager.save();
                }

                filters.forEach(filter => {
                    const tag = document.createElement('span');
                    tag.classList.add('filterTag');
                    tag.textContent = filter;
                    filtersDiv.appendChild(tag);
                });

                // Кнопка удаления
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('deleteFeedBtn');
                deleteBtn.setAttribute('data-index', index);
                deleteBtn.textContent = 'Удалить';

                // Собираем элементы
                li.append(nameDiv, descDiv, filtersDiv, deleteBtn);
                feedsList.appendChild(li);
            });
        },

        // Добавление новой ленты
        add: (name, description, url, filters) => {
            if (!name || !url) {
                alert('Пожалуйста, заполните название и URL ленты');
                return false;
            }

            if (feeds.length >= 20) {
                alert('Вы достигли максимального количества лент (20). Удалите неиспользуемые ленты, чтобы добавить новые.');
                return false;
            }

            feeds.push({ name, description, url, filters });
            feedsManager.save();
            utils.notify('Лента успешно добавлена');
            return true;
        },

        // Удаление ленты
        remove: (index) => {
            feeds.splice(index, 1);
            feedsManager.save();
            utils.notify('Лента удалена');
        }
    };

    // Обработчики событий
    const setupEventListeners = () => {
        // Открытие панели
        toggleBtn.addEventListener('click', utils.showPanel);

        // Закрытие панели
        closeFeedsBtn.addEventListener('click', utils.hidePanel);

        // Предотвращаем закрытие по клику на оверлей
        overlay.addEventListener('click', e => {
            if (e.target === overlay) e.stopPropagation();
        });

        // Клик по списку лент (открытие или удаление)
        feedsList.addEventListener('click', e => {
            // Удаление
            if (e.target.matches('.deleteFeedBtn')) {
                const index = e.target.getAttribute('data-index');
                feedsManager.remove(index);
                return;
            }

            // Открытие
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
            feedFiltersInput.value = '';
            feedNameInput.focus();
        });

        // Сохранение ленты
        saveFeedBtn.addEventListener('click', () => {
            const name = feedNameInput.value.trim();
            const description = feedDescInput.value.trim();
            const url = feedURLInput.value.trim();

            // Получаем фильтры
            let filters;
            try {
                filters = feedFiltersInput.value ? JSON.parse(feedFiltersInput.value) : utils.parseFilters(url);
            } catch (e) {
                filters = utils.parseFilters(url);
            }

            if (feedsManager.add(name, description, url, filters)) {
                ficFeedsForm.style.display = 'none';
            }
        });

        // Отмена добавления
        cancelFeedBtn.addEventListener('click', () => {
            ficFeedsForm.style.display = 'none';
        });

        // Сохранение текущей страницы
        saveAsLentaBtn.addEventListener('click', () => {
            const { url, title, description } = utils.getPageInfo();
            const filters = utils.parseFilters(url);

            utils.showPanel();
            ficFeedsForm.style.display = 'block';

            feedNameInput.value = title;
            feedDescInput.value = description;
            feedURLInput.value = url;
            feedFiltersInput.value = JSON.stringify(filters);

            feedNameInput.focus();
        });

        // Горячие клавиши
        document.addEventListener('keydown', e => {
            if (e.altKey && e.key === 'l') {
                e.preventDefault();
                utils.showPanel();
            }

            if (e.altKey && e.key === 's') {
                e.preventDefault();
                saveAsLentaBtn.click();
            }
        });
    };

    // Адаптация к темной теме
    const setupThemeObserver = () => {
        const updateTheme = () => {
            const isDarkTheme = document.body.classList.contains('dark-theme');
            const btnColor = isDarkTheme ? '#7a3d00' : '#542a00';
            toggleBtn.style.background = btnColor;
            saveAsLentaBtn.style.background = btnColor;
        };

        updateTheme();

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'class') updateTheme();
            });
        });

        observer.observe(document.body, { attributes: true });
    };

    // Инициализация
    feedsManager.render();
    setupEventListeners();
    setupThemeObserver();
})();
