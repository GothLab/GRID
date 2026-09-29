const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await context.route(/^https?:/, route => { requests.push(route.request().url()); return route.abort(); });
    const url = pathToFileURL(path.resolve('index.html')).href;
    await page.goto(url);
    const catalog = await page.evaluate(() => GRID_CARDS.map(c => ({ id: c.id, number: c.number, pages: c.pages.length, category: c.category })));
    assert.equal(catalog.length, 29);
    assert.equal(new Set(catalog.map(c => c.id)).size, 29);
    assert.equal(await page.locator('.card').count(), 29);
    assert.equal(await page.locator('#card-search, #results, #site-title, #page-counter, #modal-source').count(), 0);
    assert.ok(await page.locator('.card .topic-icon').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
    assert.ok(await page.locator('.card .subtitle').evaluateAll(items => items.every(item => item.textContent.length < 90)));
    assert.equal(await page.locator('.card-pages').count(), 0);
    const firstOrder = await page.locator('.card').evaluateAll(cards => cards.map(c => c.id).join(','));
    await page.reload();
    assert.equal(firstOrder, catalog.slice().sort((a, b) => a.number - b.number).map(c => c.id).join(','));
    assert.equal(await page.locator('.card').evaluateAll(cards => cards.map(c => c.id).join(',')), firstOrder);
    await page.screenshot({ path: 'tmp/pdfs/gallery-desktop.png', fullPage: true });
    assert.equal(await page.locator('.filter[data-category="all"]').count(), 0);
    await page.evaluate(() => {
      window.overflowFrames = [];
      const sample = () => {
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) window.overflowFrames.push(document.documentElement.scrollWidth);
        requestAnimationFrame(sample);
      };
      sample();
    });
    for (const category of ['green', 'orange', 'blue', 'pink', 'violet', 'green']) {
      await page.locator(`.filter[data-category="${category}"]`).click();
      const count = catalog.filter(c => category === 'all' || c.category === category).length;
      console.log('Filter', category, 'expected', count);
      await page.waitForFunction(({ n, category }) => {
        const shown = [...document.querySelectorAll('.card')].filter(c => getComputedStyle(c).display !== 'none');
        return shown.length === n && shown.every(c => category === 'all' || c.classList.contains(category));
      }, { n: count, category });
      assert.equal(await page.locator('.card:visible').count(), count);
      await page.waitForFunction(() => document.querySelector('#gallery').getAttribute('aria-busy') === 'false');
      await page.locator(`.filter[data-category="${category}"]`).click();
      await page.waitForFunction(() => document.querySelector('#gallery').getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator('.card:visible').count(), 29);
      assert.equal(await page.locator('.filter[aria-pressed="true"]').count(), 0);
    }
    // Click repeatedly while animation is still running; only the last choice wins.
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 950 });
      await page.evaluate(() => {
        for (const name of ['orange', 'orange', 'blue', 'pink', 'pink', 'violet', 'green']) document.querySelector(`.filter[data-category="${name}"]`).click();
      });
      await page.waitForFunction(() => document.querySelector('#gallery').getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator('.card:visible').count(), 6);
      assert.equal(await page.locator('.filter[aria-pressed="true"]').getAttribute('data-category'), 'green');
      await page.locator('.filter[data-category="green"]').click();
      await page.waitForFunction(() => document.querySelector('#gallery').getAttribute('aria-busy') === 'false');
      assert.equal(await page.locator('.card:visible').count(), 29);
    }
    assert.deepEqual(await page.evaluate(() => window.overflowFrames), []);
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.locator('#card-01').click();
    assert.equal(await page.locator('#detail-modal').evaluate(d => d.open), true);
    await page.locator('#modal-next').click();
    await page.waitForFunction(() => location.hash === '#card-01/page-2');
    assert.equal(await page.locator('.reading-page.swiper-slide-active h3').textContent(), 'Bulk Rename Utility');
    assert.equal(await page.locator('.reading-page.swiper-slide-active a').getAttribute('href'), 'https://www.bulkrenameutility.co.uk/');
    await page.locator('#modal-close').click();
    await page.waitForFunction(() => !document.querySelector('dialog').open && !location.hash);
    await page.goForward();
    await page.waitForFunction(() => document.querySelector('dialog').open);
    assert.equal(await page.locator('.reading-page.swiper-slide-active h3').textContent(), 'Bulk Rename Utility');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog').open);
    let totalPages = 0;
    // Open every source map and every page in both languages, with network blocked.
    for (const lang of ['en', 'ru']) {
      await page.goto(url);
      await page.locator(`[data-language="${lang}"]`).click();
      for (const card of catalog) {
        await page.evaluate(id => { location.hash = '#' + id; }, card.id);
        await page.waitForFunction(id => document.querySelector('#detail-modal').dataset.cardId === id, card.id);
        for (let i = 0; i < card.pages; i++) {
          await page.evaluate(index => document.querySelector('#modal-swiper').swiper.slideTo(index, 0), i);
          const info = await page.evaluate(() => {
            const swiper = document.querySelector('#modal-swiper').swiper;
            const slide = swiper.slides[swiper.activeIndex];
            return { body: slide.querySelector('.page-copy').textContent, title: slide.querySelector('h3').textContent, autoHeight: swiper.params.autoHeight, wrapper: swiper.wrapperEl.getBoundingClientRect().height, height: slide.getBoundingClientRect().height, inactive: [...swiper.slides].every((s, n) => s.inert === (n !== swiper.activeIndex)) };
          });
          assert.ok(info.body.length > 50 && info.title.length > 0);
          assert.ok(info.autoHeight && info.inactive);
          assert.ok(await page.locator('.reading-page.swiper-slide-active .page-list li').evaluateAll(items => items.every(item => {
            const link = item.querySelector('a');
            return link && /^https?:/.test(link.href) && link.target === '_blank';
          })));
          assert.ok(Math.abs(info.wrapper - info.height) < 2, JSON.stringify(info));
          if (lang === 'en') totalPages++;
        }
      }
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal(await page.locator('#detail-modal').evaluate(d => d.open), true);
    }
    await page.goto(url + '#card-28/page-5');
    assert.ok(!(await page.locator('#modal-title').textContent()).includes('#'));
    assert.equal(await page.locator('.modal-thumb-label').first().evaluate(el => getComputedStyle(el).textAlign), 'left');
    assert.equal(await page.locator('#modal-swiper').evaluate(el => el.swiper.params.grabCursor), true);
    assert.equal(await page.locator('#modal-swiper').evaluate(el => el.swiper.params.spaceBetween), 24);
    assert.equal(await page.locator('#modal-permalink').evaluate(el => getComputedStyle(el).color), 'rgb(98, 106, 119)');
    for (const button of ['#modal-close', '#modal-prev', '#modal-next']) {
      assert.ok(await page.locator(button).evaluate(el => {
        const outer = el.getBoundingClientRect(), inner = el.querySelector('svg').getBoundingClientRect();
        return Math.abs((outer.left + outer.right - inner.left - inner.right) / 2) < 1 && Math.abs((outer.top + outer.bottom - inner.top - inner.bottom) / 2) < 1;
      }), `Uncentered icon: ${button}`);
    }
    assert.equal(await page.locator('.reading-page.swiper-slide-active .page-list li').count(), 4);
    assert.equal(catalog.find(c => c.id === 'card-29').pages, 4);
    assert.match(await page.locator('.reading-page.swiper-slide-active h3').textContent(), /Пакетная/);
    await page.screenshot({ path: 'tmp/pdfs/gallery-modal-ru.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'tmp/pdfs/gallery-mobile.png', fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await page.locator('dialog').evaluate(d => d.scrollWidth <= d.clientWidth + 1));
    await page.goto(url + '#card-unknown');
    assert.equal(await page.locator('#detail-modal').evaluate(d => d.open), false);
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    console.log(JSON.stringify({ cards: catalog.length, pages: totalPages, languages: ['en', 'ru'], filtering: 'passed', icons: '29 local icons loaded', compactUI: 'passed', deepLinks: 'passed including page links and history', offline: 'zero network requests', consoleErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
