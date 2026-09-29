// Compact gallery copy, independent from the full reading pages.
(() => {
  const entries = [
    ['folder-search', 'File management', 'Работа с файлами', 'Find, rename and organize files.', 'Поиск, переименование и порядок в файлах.'],
    ['pen-tool', 'Vector graphics', 'Векторная графика', 'Tools for creating and editing vectors.', 'Инструменты для работы с вектором.'],
    ['flame', 'Experimental art', 'Экспериментальная графика', 'Unusual brushes, textures and visual effects.', 'Необычные кисти, текстуры и визуальные эффекты.'],
    ['eye', 'Screen comfort', 'Комфорт экрана', 'Screen colors, lighting and reading setups.', 'Цвет экрана, освещение и удобное чтение.'],
    ['mouse', 'Mouse & controls', 'Мышь и управление', 'Button settings and comfortable input.', 'Настройка кнопок и удобное управление.'],
    ['palette', 'Visual tools', 'Подготовка графики', 'Palettes, masks and image preparation.', 'Палитры, маски и подготовка изображений.'],
    ['briefcase', 'Freelance', 'Фриланс', 'Work routines and a portable toolkit.', 'Рабочий режим и набор для работы вне дома.'],
    ['type', 'Typography', 'Типографика', 'Tools and ideas for working with letters.', 'Инструменты и идеи для работы со шрифтами.'],
    ['pin', 'Window management', 'Управление окнами', 'Keep useful windows always in view.', 'Нужные окна всегда перед глазами.'],
    ['clapperboard', 'Video plugins', 'Видеоплагины', 'Plugins for animation and compositing.', 'Плагины для анимации и композитинга.'],
    ['pencil-ruler', 'Drawing apps', 'Приложения для рисования', 'Sketching, modeling and image editing.', 'Наброски, моделирование и обработка изображений.'],
    ['monitor', 'Desktop setup', 'Рабочее место', 'Displays, charging and desk accessories.', 'Экраны, зарядки и аксессуары для стола.'],
    ['camera', 'Screen capture', 'Снимки и запись экрана', 'Capture and annotate what is on screen.', 'Скриншоты, пояснения и запись происходящего.'],
    ['circle-play', 'YouTube tools', 'Инструменты YouTube', 'Video zoom, playback and saved media.', 'Увеличение видео, просмотр и сохранение материалов.'],
    ['armchair', 'Holders & supports', 'Держатели и опоры', 'Place your screen and keyboard comfortably.', 'Удобное расположение экрана и клавиатуры.'],
    ['send', 'Telegram bots', 'Боты Telegram', 'Bots for files, media and everyday tasks.', 'Боты для файлов, медиа и повседневных задач.'],
    ['languages', 'Search & translation', 'Поиск и перевод', 'Find images, recognize text and translate.', 'Поиск картинок, распознавание текста и перевод.'],
    ['tablet', 'Portable devices', 'Мобильные устройства', 'Tablets and accessories for work anywhere.', 'Планшеты и аксессуары для работы в дороге.'],
    ['utensils', 'Asian food', 'Азиатская еда', 'Places and dishes saved in Saint Petersburg.', 'Места и блюда в Санкт-Петербурге.'],
    ['watch', 'Wear OS', 'Wear OS', 'Audio, files and small tasks on your wrist.', 'Аудио, файлы и небольшие задачи на часах.'],
    ['network', 'Remote access', 'Удалённый доступ', 'Remote computers, VPN and file sync.', 'Удалённые компьютеры, VPN и синхронизация.'],
    ['code', 'Website development', 'Разработка сайтов', 'Tools for building sites and working with code.', 'Инструменты для создания сайтов и работы с кодом.'],
    ['sparkles', 'ChatGPT', 'ChatGPT', 'Image tasks, animation and AI experiments.', 'Работа с изображениями, анимацией и ИИ.'],
    ['workflow', 'Automation', 'Автоматизация', 'Connect apps and automate repeated tasks.', 'Связь приложений и автоматизация рутины.'],
    ['snowflake', 'Winter kit', 'Зимний набор', 'Clothing, footwear and home comfort.', 'Одежда, обувь и домашний комфорт зимой.'],
    ['shopping-bag', 'Shopping', 'Покупки', 'Shopping services, translation and payment notes.', 'Сервисы покупок, перевод и заметки об оплате.'],
    ['audio-lines', 'Speech & text', 'Речь и текст', 'Transcription, OCR and voice generation.', 'Расшифровка аудио, распознавание текста и озвучка.'],
    ['image-down', 'Image optimization', 'Оптимизация изображений', 'Compress, enlarge and batch-edit images.', 'Сжатие, увеличение и пакетная обработка.'],
    ['sandwich', 'Shawarma', 'Шаверма', 'Saved shawarma spots in Saint Petersburg.', 'Заметки о шаверме в Санкт-Петербурге.']
  ];
  window.GRID_CARDS.forEach(card => {
    const [icon, en, ru, description, descriptionRu] = entries[card.number - 1];
    card.icon = `vendor/icons/${icon}.svg`;
    // Keep published/user-edited metadata from content.js when present.
    card.title = card.title || { en, ru };
    card.summary = card.summary || { en: description, ru: descriptionRu };
  });
})();
