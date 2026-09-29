(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const copy = {
    en: { title: 'The Grid', intro: 'Tools, ideas & everyday notes.', all: 'All', green: 'Work & automation', orange: 'Design & graphics', blue: 'Devices & comfort', pink: 'Media & language', violet: 'Everyday life', cards: 'cards', pages: 'pages', page: 'Page', of: 'of', search: 'Find a tool or card #', filters: 'Filter cards by category', gallery: 'Mind-map cards', language: 'Language', open: 'Open card', close: 'Close card', prev: 'Previous page', next: 'Next page', choose: 'Choose a page', link: 'Permanent link', source: 'Source map', external: 'Tool links open online in a new tab.', empty: 'No matching cards. Try a number, tool name or another category.', error: 'A local gallery file is missing. Keep content.js and the vendor folder beside index.html.', possible: 'possible match' },
    ru: { title: 'The Grid', intro: 'Инструменты, идеи и заметки.', all: 'Все', green: 'Работа и автоматизация', orange: 'Дизайн и графика', blue: 'Устройства и комфорт', pink: 'Медиа и языки', violet: 'Повседневное', cards: 'карточек', pages: 'страниц', page: 'Страница', of: 'из', search: 'Инструмент или номер #', filters: 'Фильтр карточек по категории', gallery: 'Карточки интеллект-карт', language: 'Язык', open: 'Открыть карточку', close: 'Закрыть карточку', prev: 'Предыдущая страница', next: 'Следующая страница', choose: 'Выбрать страницу', link: 'Постоянная ссылка', source: 'Исходная карта', external: 'Ссылки на инструменты открываются онлайн в новой вкладке.', empty: 'Карточки не найдены. Попробуйте номер, название или другую категорию.', error: 'Не найден локальный файл галереи. content.js и папка vendor должны быть рядом с index.html.', possible: 'возможное соответствие' }
  };
  const palettes = { green: ['#133d31', '#329f75', '#a7daa1'], orange: ['#512814', '#d98542', '#e9c88d'], blue: ['#152e52', '#3b73af', '#88c9d9'], pink: ['#4b203b', '#b74f86', '#e7a9c9'], violet: ['#2a2050', '#7853b4', '#baa0df'] };
  const data = window.GRID_CARDS || [];
  const records = new Map(data.map(card => [card.id, card]));
  const gallery = $('#gallery'), modal = $('#detail-modal');
  const filters = [...document.querySelectorAll('.filters .filter')];
  let language = 'en', category = 'all', mixer, mainSwiper, thumbsSwiper, currentId = '', activePage = 0, building = false;
  try { if (localStorage.getItem('color-stories-language') === 'ru') language = 'ru'; } catch (_) { /* Optional storage. */ }
  const text = () => copy[language];
  const editorText = () => language === 'ru'
    ? { edit: 'Редактировать', done: 'Готово', title: 'Заголовок', body: 'Текст', hint: 'Для списка начинайте строки с «- ». Правки сохраняются автоматически в этом браузере.', export: 'Скачать все правки', saved: 'Сохранено в браузере', empty: 'Правок пока нет', failed: 'Не удалось сохранить в браузере — скачайте правки перед закрытием.' }
    : { edit: 'Edit text', done: 'Done', title: 'Title', body: 'Text', hint: 'Start list items with “- ”. Changes save automatically in this browser.', export: 'Download all edits', saved: 'Saved in this browser', empty: 'No edits yet', failed: 'Browser storage failed — download edits before closing.' };
  function draftStatus() {
    const t = editorText();
    $('#export-edits').textContent = t.export;
    $('#export-edits').disabled = !GRID_DRAFTS.count();
    $('#draft-status').textContent = GRID_DRAFTS.failed() ? t.failed : GRID_DRAFTS.count() ? `${t.saved} · ${GRID_DRAFTS.count()}` : t.empty;
    $('#export-catalog-edits').textContent = t.export;
    $('#export-catalog-edits').disabled = !GRID_DRAFTS.count();
    $('#catalog-draft-status').textContent = $('#draft-status').textContent;
  }
  let catalogEditing = false;
  function renderCatalogEditor() {
    const ru = language === 'ru';
    $('#toggle-catalog-editor').textContent = catalogEditing ? (ru ? 'Вернуться к карточкам' : 'Back to cards') : (ru ? 'Редактор названий и подписей' : 'Edit titles & captions');
    $('#catalog-editor-title').textContent = ru ? 'Названия и подписи' : 'Titles & captions';
    $('#catalog-editor-hint').textContent = ru ? 'Все карточки в одном списке. Правки сохраняются автоматически в этом браузере и входят в общий файл правок.' : 'All cards in one list. Changes save automatically in this browser and are included in the edits download.';
    $('#catalog-editor-rows').innerHTML = [...data].sort((a, b) => a.number - b.number).map(card => {
      const draft = GRID_DRAFTS.getCard(card, language);
      return `<div class="catalog-editor-row ${card.category}" data-card-id="${card.id}"><span class="catalog-editor-number">${number(card)}</span><label>${ru ? 'Название' : 'Title'}<input class="catalog-title" aria-label="${ru ? 'Название карточки' : 'Card title'} ${number(card)}" value="${escape(draft.title)}"></label><label>${ru ? 'Подпись' : 'Caption'}<textarea class="catalog-summary" rows="2" aria-label="${ru ? 'Подпись карточки' : 'Card caption'} ${number(card)}">${escape(draft.text)}</textarea></label></div>`;
    }).join('');
    draftStatus();
  }
  const knownLinks = new Map(data.flatMap(card => card.pages.flatMap(page => page.links)).map(([label, href]) => [label.toLocaleLowerCase(), href]));
  const linkAliases = {
    '4k downloader': '4k download', 'приложение chatgpt': 'chatgpt',
    'аксессуары ugreen': 'ugreen', 'ugreen accessories': 'ugreen',
    'зарядное устройство ugreen': 'ugreen', 'ugreen charger': 'ugreen',
    'хаб ugreen': 'ugreen', 'ugreen dongle': 'ugreen',
    'amnezia vpn': 'amnezia', 'amneziawg': 'amnezia',
    'пакетная обработка в photoshop': 'photoshop', 'photoshop batch edits': 'photoshop',
    'пакетная обработка в illustrator': 'illustrator', 'illustrator batch edits': 'illustrator',
    'media encoder gif': 'adobe media encoder', 'gnomon workshop': 'gnomon workshop'
  };
  function listLink(item, card, entry) {
    // Explicit links typed into the editor are preserved; only web URLs are allowed.
    const explicit = item.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    let label = explicit ? explicit[1] : item, href = explicit?.[2];
    const name = item.split(' — ')[0].replace(/[“”«»]/g, '').trim().toLocaleLowerCase();
    if (!href) href = knownLinks.get(linkAliases[name] || name);
    const search = !href;
    if (search) {
      const context = card.number === 19 ? (language === 'ru' ? 'Санкт-Петербург ' : 'Saint Petersburg ') + (entry.title.en.includes('Tan Zhen') ? 'Тан Жен ' : '')
        : card.number === 5 ? (language === 'ru' ? 'компьютер ' : 'computer ')
        : card.number === 20 ? 'Wear OS ' : '';
      href = `https://www.google.com/search?q=${encodeURIComponent(context + item)}`;
    }
    return `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer" data-link-kind="${search ? 'search' : 'direct'}">${escape(label)}<span class="list-link-kind">${search ? (language === 'ru' ? ' · поиск' : ' · search') : ' ↗'}</span></a>`;
  }
  function renderText(value, card, entry) {
    const blocks = []; let paragraph = [], items = [];
    const flushParagraph = () => { if (paragraph.length) blocks.push(`<p>${escape(paragraph.join('\n'))}</p>`); paragraph = []; };
    const flushList = () => { if (items.length) blocks.push(`<ul class="page-list">${items.map(item => `<li>${listLink(item, card, entry)}</li>`).join('')}</ul>`); items = []; };
    for (const line of value.split(/\r?\n/)) {
      const match = line.match(/^\s*[-•]\s+(.*)$/);
      if (match) { flushParagraph(); items.push(match[1]); }
      else if (!line.trim()) { flushParagraph(); flushList(); }
      else { flushList(); paragraph.push(line); }
    }
    flushParagraph(); flushList(); return blocks.join('');
  }
  const local = value => value[language];
  const number = card => String(card.number).padStart(2, '0');
  const art = (card, index = 0) => `--gradient:linear-gradient(${120 + ((card.number * 13 + index * 29) % 100)}deg,${palettes[card.category].join(',')});--orb-x:${34 + ((card.number * 7 + index * 13) % 40)}%;--orb-y:${-20 + index * 6}%`;
  const orderedCards = [...data].sort((a, b) => a.number - b.number);
  const icon = card => `<img class="topic-icon" src="${card.icon}" alt="">`;
  gallery.innerHTML = orderedCards.map(card => `<button class="card mix ${card.category}" type="button" id="${card.id}" data-id="${card.id}" aria-haspopup="dialog"><span class="art" aria-hidden="true" style="${art(card)}">${icon(card)}</span><span class="card-copy"><span class="card-title"></span><span class="subtitle"></span></span></button>`).join('');

  function updateCount(count = mixer?.getState().totalShow ?? data.length) {
    $('#empty-state').hidden = count !== 0;
  }
  let filtering = false, appliedCategory = 'all';
  async function filterCards() {
    if (!mixer || filtering) return;
    filtering = true;
    gallery.dataset.filtering = 'true';
    gallery.setAttribute('aria-busy', 'true');
    try {
      // Finish the current transition, then apply only the latest requested state.
      // No stale element collections or long queue of intermediate clicks.
      while (appliedCategory !== category) {
        const next = category;
        await mixer.filter(next === 'all' ? 'all' : `.${next}`);
        appliedCategory = next;
      }
    } finally {
      filtering = false;
      delete gallery.dataset.filtering;
      gallery.setAttribute('aria-busy', 'false');
    }
  }
  function route() {
    let hash;
    try { hash = decodeURIComponent(location.hash.slice(1)); } catch (_) { return null; }
    const match = hash.match(/^(card-\d{2})(?:\/page-(\d+))?$/);
    if (!match || !records.has(match[1])) return null;
    return { id: match[1], page: Math.max(0, Math.min((Number(match[2]) || 1) - 1, records.get(match[1]).pages.length - 1)) };
  }
  function pageHash() { return `#${currentId}${activePage ? `/page-${activePage + 1}` : ''}`; }
  function updatePage(index, writeHash = true) {
    activePage = index;
    const card = records.get(currentId);
    if (!card) return;
    $('#modal-permalink').href = pageHash();
    $('#modal-permalink').textContent = pageHash();
    document.querySelectorAll('.modal-thumb').forEach((thumb, i) => thumb.setAttribute('aria-current', i === index ? 'true' : 'false'));
    if (writeHash && !building) history.replaceState(history.state, '', pageHash());
  }
  function destroySwipers() {
    mainSwiper?.destroy(true, true); thumbsSwiper?.destroy(true, true);
    mainSwiper = null; thumbsSwiper = null;
  }
  function renderModal(id, page = 0) {
    const card = records.get(id);
    if (!card) return;
    building = true;
    destroySwipers();
    currentId = id; activePage = page;
    modal.className = `detail-modal ${card.category}`;
    const cardDraft = GRID_DRAFTS.getCard(card, language);
    $('#modal-title').textContent = cardDraft.title;
    modal.dataset.cardId = id;
    $('#modal-description').textContent = cardDraft.text;
    draftStatus();
    $('#modal-slides').innerHTML = card.pages.map((entry, index) => {
      const draft = GRID_DRAFTS.get(id, index, language, entry), t = editorText();
      const links = entry.links.map(([label, href]) => `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(label.replace('possible match', text().possible))}<span aria-hidden="true"> ↗</span></a>`).join('');
      return `<article class="swiper-slide reading-page" data-page="${index}"><div class="modal-art art" aria-hidden="true" style="${art(card, index)}">${icon(card)}</div><div class="page-copy"><button class="edit-page swiper-no-swiping" type="button" aria-expanded="false">${t.edit}</button><div class="page-preview"><h3>${escape(draft.title)}</h3>${renderText(draft.text, card, entry)}</div><div class="page-editor swiper-no-swiping" hidden><label>${t.title}<input class="edit-title" value="${escape(draft.title)}"></label><label>${t.body}<textarea class="edit-body" rows="9">${escape(draft.text)}</textarea></label><p class="edit-hint">${t.hint}</p></div>${links ? `<div class="tool-links">${links}</div>` : ''}</div></article>`;
    }).join('');
    $('#modal-thumbs').innerHTML = card.pages.map((entry, index) => {
      const title = GRID_DRAFTS.get(id, index, language, entry).title;
      return `<button type="button" class="swiper-slide modal-thumb" data-page="${index}" aria-label="${text().page} ${index + 1}: ${escape(title)}"><span class="modal-thumb-art art" aria-hidden="true" style="${art(card, index)}"></span><span class="modal-thumb-label">${index + 1}. ${escape(title)}</span></button>`;
    }).join('');
    if (!modal.open) modal.showModal();
    thumbsSwiper = new Swiper('#modal-thumbs-swiper', { slidesPerView: 'auto', spaceBetween: 14, grabCursor: true, watchSlidesProgress: true, a11y: { enabled: false } });
    mainSwiper = new Swiper('#modal-swiper', {
      autoHeight: true, initialSlide: page, rewind: true, spaceBetween: 24, grabCursor: true, speed: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 560,
      navigation: { nextEl: '#modal-next', prevEl: '#modal-prev' }, thumbs: { swiper: thumbsSwiper }, a11y: { enabled: false },
      on: { init(swiper) { updatePage(swiper.activeIndex, false); }, slideChange(swiper) { updatePage(swiper.activeIndex); } }
    });
    building = false;
    mainSwiper.updateAutoHeight(0);
    // Inactive pages stay out of the keyboard tab order and accessibility tree.
    const markPages = () => mainSwiper?.slides.forEach((slide, index) => { slide.inert = index !== mainSwiper.activeIndex; });
    mainSwiper.on('slideChange', markPages); markPages();
  }
  function syncRoute() {
    const next = route();
    if (next) { if (!modal.open || next.id !== currentId || next.page !== activePage) renderModal(next.id, next.page); }
    else if (modal.open) { modal.close(); destroySwipers(); }
  }
  function closeModal() {
    if (history.state?.gridModal) history.back();
    else { history.replaceState(null, '', location.pathname + location.search); modal.close(); destroySwipers(); }
  }
  function applyLanguage(next, persist = true) {
    language = next;
    const t = text();
    document.documentElement.lang = language;
    document.title = `${t.title} · ${data.length} ${t.cards}`;
    $('.filters').setAttribute('aria-label', t.filters); gallery.setAttribute('aria-label', t.gallery);
    $('#language-switch').setAttribute('aria-label', t.language);
    $('#modal-close').setAttribute('aria-label', t.close); $('#modal-prev').setAttribute('aria-label', t.prev); $('#modal-next').setAttribute('aria-label', t.next);
    $('#modal-thumbs-swiper').setAttribute('aria-label', t.choose);
    $('#empty-state').textContent = t.empty;
    filters.forEach(button => { button.querySelector('.filter-label').textContent = t[button.dataset.category]; });
    document.querySelectorAll('.language-option').forEach(button => { const active = button.dataset.language === language; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
    [...gallery.children].forEach(element => {
      const card = records.get(element.dataset.id);
      const draft = GRID_DRAFTS.getCard(card, language);
      element.querySelector('.card-title').textContent = draft.title;
      element.querySelector('.subtitle').textContent = draft.text;
      element.setAttribute('aria-label', `${t.open} ${number(card)}: ${draft.title}`);
    });
    if (modal.open) renderModal(currentId, activePage);
    renderCatalogEditor();
    updateCount();
    if (persist) try { localStorage.setItem('color-stories-language', language); } catch (_) { /* Optional. */ }
  }

  applyLanguage(language, false);
  if (!data.length || typeof mixitup !== 'function' || typeof Swiper !== 'function') { $('#empty-state').textContent = text().error; $('#empty-state').hidden = false; return; }
  mixer = mixitup(gallery, { selectors: { target: '.card' }, controls: { enable: false }, animation: { duration: 680, easing: 'ease-in-out', effects: 'fade', nudge: false, queue: false, animateResizeContainer: false, animateResizeTargets: false, enable: !matchMedia('(prefers-reduced-motion: reduce)').matches }, callbacks: { onMixEnd: state => updateCount(state.totalShow) } });
  filters.forEach(button => button.addEventListener('click', () => {
    category = category === button.dataset.category ? 'all' : button.dataset.category;
    filters.forEach(item => { const active = item.dataset.category === category; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
    filterCards();
  }));
  document.querySelectorAll('.language-option').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language)));
  gallery.addEventListener('click', event => { const card = event.target.closest('.card'); if (!card) return; history.pushState({ gridModal: true }, '', `#${card.dataset.id}`); syncRoute(); });
  $('#modal-thumbs').addEventListener('click', event => { const button = event.target.closest('[data-page]'); if (button) mainSwiper?.slideTo(Number(button.dataset.page)); });
  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
  modal.addEventListener('click', event => { if (event.target === modal) { const box = modal.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeModal(); } });
  modal.addEventListener('keydown', event => { if (event.target.closest('input, textarea')) return; if (event.key === 'ArrowLeft') { event.preventDefault(); mainSwiper?.slidePrev(); } if (event.key === 'ArrowRight') { event.preventDefault(); mainSwiper?.slideNext(); } });
  $('#export-edits').addEventListener('click', () => GRID_DRAFTS.export());
  $('#export-catalog-edits').addEventListener('click', () => GRID_DRAFTS.export());
  $('#toggle-catalog-editor').addEventListener('click', () => {
    catalogEditing = !catalogEditing;
    $('#catalog-editor').hidden = !catalogEditing;
    gallery.hidden = catalogEditing;
    $('.filters').hidden = catalogEditing;
    $('#toggle-catalog-editor').setAttribute('aria-expanded', String(catalogEditing));
    renderCatalogEditor();
    if (!catalogEditing) mixer?.forceRefresh();
  });
  $('#catalog-editor-rows').addEventListener('input', event => {
    const row = event.target.closest('[data-card-id]'); if (!row) return;
    const title = row.querySelector('.catalog-title').value, summary = row.querySelector('.catalog-summary').value;
    const card = records.get(row.dataset.cardId), element = document.getElementById(card.id);
    GRID_DRAFTS.saveCard(card.id, language, title, summary);
    element.querySelector('.card-title').textContent = title;
    element.querySelector('.subtitle').textContent = summary;
    element.setAttribute('aria-label', `${text().open} ${number(card)}: ${title}`);
    draftStatus();
  });
  $('#modal-slides').addEventListener('click', event => {
    const button = event.target.closest('.edit-page'); if (!button) return;
    const slide = button.closest('.reading-page'), panel = slide.querySelector('.page-editor');
    panel.hidden = !panel.hidden;
    slide.querySelector('.page-preview').hidden = !panel.hidden;
    button.textContent = panel.hidden ? editorText().edit : editorText().done;
    button.setAttribute('aria-expanded', String(!panel.hidden));
    mainSwiper?.updateAutoHeight(0);
    if (!panel.hidden) panel.querySelector('textarea').focus({ preventScroll: true });
  });
  $('#modal-slides').addEventListener('input', event => {
    if (!event.target.matches('.edit-title, .edit-body')) return;
    const slide = event.target.closest('.reading-page'), index = Number(slide.dataset.page);
    const title = slide.querySelector('.edit-title').value, body = slide.querySelector('.edit-body').value;
    GRID_DRAFTS.save(currentId, index, language, title, body);
    const card = records.get(currentId);
    slide.querySelector('.page-preview').innerHTML = `<h3>${escape(title)}</h3>${renderText(body, card, card.pages[index])}`;
    const thumb = $(`#modal-thumbs [data-page="${index}"]`);
    thumb.querySelector('.modal-thumb-label').textContent = `${index + 1}. ${title}`;
    thumb.setAttribute('aria-label', `${text().page} ${index + 1}: ${title}`);
    draftStatus(); mainSwiper?.updateAutoHeight(0);
  });
  window.addEventListener('hashchange', syncRoute);
  window.addEventListener('popstate', syncRoute);
  syncRoute();
})();
