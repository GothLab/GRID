// Local edits stay separate from the published content until approved.
(() => {
  const key = 'grid-text-drafts-v1';
  let edits = {}, storageError = false;
  const serialize = () => JSON.stringify({ ...edits, __card02PageOrder: 2 });
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    for (const [id, value] of Object.entries(saved)) {
      if (/^card-\d{2}\/(?:page-\d+|card)\/(en|ru)$/.test(id) && typeof value?.title === 'string' && typeof value?.text === 'string') {
        const oldPage = saved.__card02PageOrder !== 2 && id.match(/^card-02\/page-([123])\/(en|ru)$/);
        if (oldPage) {
          const page = { 1: 2, 2: 4, 3: 1 }[oldPage[1]];
          edits[`card-02/page-${page}/${oldPage[2]}`] = { ...value, page };
        } else edits[id] = value;
      }
    }
    if (saved.__card02PageOrder !== 2 && Object.keys(edits).length) localStorage.setItem(key, serialize());
  } catch (_) { storageError = true; }
  const idFor = (card, page, language) => `${card}/page-${page + 1}/${language}`;
  window.GRID_DRAFTS = {
    getCard(card, language) {
      return edits[`${card.id}/card/${language}`] || { title: card.title[language], text: card.summary[language] };
    },
    saveCard(cardId, language, title, text) {
      edits[`${cardId}/card/${language}`] = { type: 'card', cardId, language, title, text, updatedAt: new Date().toISOString() };
      try { localStorage.setItem(key, serialize()); storageError = false; } catch (_) { storageError = true; }
    },
    get(card, page, language, original) {
      return edits[idFor(card, page, language)] || {
        title: original.title[language],
        text: [original.body[language], original.bullets?.[language]?.map(item => `- ${item}`).join('\n'), original.afterList?.[language]].filter(Boolean).join('\n\n')
      };
    },
    save(card, page, language, title, text) {
      edits[idFor(card, page, language)] = { cardId: card, page: page + 1, language, title, text, updatedAt: new Date().toISOString() };
      try { localStorage.setItem(key, serialize()); storageError = false; } catch (_) { storageError = true; }
    },
    count: () => Object.keys(edits).length,
    failed: () => storageError,
    export() {
      const result = { format: 'grid-text-drafts', version: 1, exportedAt: new Date().toISOString(), edits: Object.values(edits) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = `grid-edits-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };
})();
