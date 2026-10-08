/* Яндекс.Метрика: инициализация счётчиков + общий помощник для целей/событий.
   Список счётчиков — ALTER_YM_IDS ниже, единственное место, где их менять (при добавлении
   счётчика — сюда добавить ID и перезапустить install-metrika.py, чтобы обновить noscript-
   пиксели на всех страницах).
   Подключается тегом <script src="./analytics.js"></script> в <head> (после support.js) —
   расставляет install-metrika.py.
   window.alterGoal(name, params) — шлёт JS-событие 'name' сразу во все счётчики.

   Счётчик общий с B2C-отделом — ВСЕ цели этого сайта именуются с префиксом b2b_, чтобы не
   путаться со целями B2C в том же счётчике. Не убирать префикс, даже когда появится
   отдельный B2B-счётчик (список ALTER_YM_IDS ниже). */
(function () {
  var ALTER_YM_IDS = [47534068, 111173360];
  window.ALTER_YM_IDS = ALTER_YM_IDS;

  // Инициализация счётчиков (официальный загрузчик tag.js + ym(id,'init')) вынесена ИНЛАЙНОМ
  // в <head> каждой страницы — её ставит install-metrika.py, максимально близко к началу
  // страницы (как требует инструкция Яндекс.Метрики). Здесь остаётся только слой целей/событий:
  // window.alterGoal ниже шлёт reachGoal во все ALTER_YM_IDS через уже созданный инлайном ym.
  // ВАЖНО: ALTER_YM_IDS здесь держать в синхроне со списком init-ов в install-metrika.py.

  // Текст кнопки в шапке — разный по страницам ([data-header-cta] уже стоит на 65 страницах).
  // Известные варианты на 25.07.2026; новый текст ловится через b2b_cta_header_other_click.
  var HEADER_CTA_SLUGS = {
    'заказать демо': 'demo',
    'получить стоимость': 'trening',
    'скачать гайд': 'lead-magnit'
  };

  var formTouched = false;
  var formSubmitted = false;

  /* --- Маячок визитов (проект «Alter сигналы», идея №89) -----------------------------
     ClientID Метрики уезжает в сделку amoCRM при отправке любой формы, поэтому после
     первой заявки браузер человека опознан. Маячок сообщает воркеру, что этот браузер
     снова на сайте и на какой странице; сопоставление с карточкой и правила живут на
     стороне «Alter сигналы», здесь только факт.

     Почему здесь, а не в crm-submit.js: тот подключается отложенно и только по
     взаимодействию, и стоит на 58 страницах против 68 у этого файла (в частности, его
     нет на roi.html — самой горячей для сигналов странице). Пассивный заход оттуда
     не поймался бы вовсе.

     Почему не Logs API Метрики: он отдаёт визиты с задержкой в сутки, а смысл сигнала
     в том, чтобы менеджер вышел на человека, пока тот ещё думает.

     sendBeacon отправляем с типом text/plain: при application/json запрос становится
     непростым, браузер требует предзапрос, а sendBeacon его не умеет и молча ничего не
     шлёт. Воркер разбирает тело как JSON независимо от заголовка. */
  var VISIT_URL = (window.ALTER_CRM_ENDPOINT || 'https://alter.ru/crm-api/')
    .replace(/\/+$/, '') + '/api/visit';
  var visitSent = {};

  function clientId() {
    // Кука первопартийная и живёт на всём домене, поэтому её достаточно. getClientID
    // спрашиваем только чтобы поднять счётчик, если куки ещё нет (первый заход в жизни).
    try {
      var m = document.cookie.match(/(?:^|;\s*)_ym_uid=([^;]*)/);
      if (m) return decodeURIComponent(m[1]);
    } catch (e) { /* приватный режим */ }
    return '';
  }

  window.alterVisit = function (event) {
    var name = event || 'pageview';
    if (visitSent[name]) return;          // одно событие каждого вида за загрузку страницы
    var cid = clientId();
    if (!cid) return;                     // без куки Метрики связать визит не с чем
    visitSent[name] = true;
    var body = JSON.stringify({ clientId: cid, path: location.pathname, event: name });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(VISIT_URL, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
        return;
      }
    } catch (e) { /* падать из-за маячка нельзя: он вторичен по отношению к сайту */ }
    try {
      fetch(VISIT_URL, {
        method: 'POST', body: body, keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
      });
    } catch (e) { /* тем более нельзя */ }
  };

  /* Сам заход. Куку `_ym_uid` ставит счётчик, а он инициализируется инлайном в <head>,
     но не мгновенно: на первом в жизни заходе куки в момент выполнения этого файла ещё
     нет. Поэтому пробуем несколько раз в течение первых секунд и прекращаем, как только
     маячок ушёл. Дальше сигнал по этому браузеру всё равно появится при следующем заходе. */
  (function () {
    var tries = 0;
    (function attempt() {
      window.alterVisit('pageview');
      if (visitSent.pageview || ++tries > 6) return;
      setTimeout(attempt, 1000);
    })();
  })();

  window.alterGoal = function (name, params) {
    if (/^b2b_lead_|^b2b_roi_calculated$/.test(name)) formSubmitted = true;
    // Те же события уходят маячком визитов («Alter сигналы»): для сигнала менеджеру важно
    // не только что человек зашёл, но и что он посчитал ROI или бросил форму. Функцию
    // объявляет crm-submit.js, порядок подключения скриптов на страницах разный — отсюда
    // проверка. Ошибка маячка не должна помешать отправке цели в Метрику, поэтому до неё.
    try { window.alterVisit(name); } catch (e) { }
    if (typeof ym !== 'function') return;
    ALTER_YM_IDS.forEach(function (id) {
      try { ym(id, 'reachGoal', name, params); } catch (e) { /* счётчик мог не успеть загрузиться — не критично */ }
    });
  };

  /* Микро-цель «глубина скролла» — сразу на всех страницах, без правок на каждой.
     Срабатывает один раз за визит на каждый порог (50%/90% высоты страницы). Не считаем
     прыжок по якорной ссылке (клик «Заказать демо» в шапке → страницу мгновенно проматывает
     к #demo) — это не чтение контента, а переход к форме; lastAnchorJumpAt выставляется в
     обработчике кликов ниже. */
  var scrollFired = {};
  var lastAnchorJumpAt = 0;
  function checkScrollDepth() {
    if (Date.now() - lastAnchorJumpAt < 900) return;
    var doc = document.documentElement;
    var full = doc.scrollHeight - window.innerHeight;
    if (full <= 0) return;
    var pct = (window.scrollY || doc.scrollTop) / full;
    [0.5, 0.9].forEach(function (threshold) {
      var goal = 'b2b_scroll_' + Math.round(threshold * 100);
      if (pct >= threshold && !scrollFired[goal]) {
        scrollFired[goal] = true;
        window.alterGoal(goal);
      }
    });
  }
  var scrollTimer = null;
  window.addEventListener('scroll', function () {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () { scrollTimer = null; checkScrollDepth(); }, 400);
  }, { passive: true });

  /* Микро-цель «начал заполнять форму» — первое взаимодействие с любым полем внутри любой
     <form> на странице, один раз за форму. Детальный per-поле разбор (на каком поле
     отваливаются) даёт нативная «Аналитика форм» Метрики (работает автоматически благодаря
     webvisor:true выше, отдельный отчёт в интерфейсе) — этот goal нужен только для быстрого
     верхнеуровневого сравнения «начали / дошли до отправки» прямо в общем списке целей. */
  var formsStarted = typeof WeakSet === 'function' ? new WeakSet() : null;
  document.addEventListener('focusin', function (e) {
    var field = e.target;
    if (!field || !/^(INPUT|SELECT|TEXTAREA)$/.test(field.tagName)) return;
    var form = field.closest('form');
    if (!form || (formsStarted && formsStarted.has(form))) return;
    if (formsStarted) formsStarted.add(form);
    formTouched = true;
    window.alterGoal('b2b_form_started');
    // Калькулятор ROI (roi.html, единственная форма с [data-calc-form]) — отдельная цель
    // поверх общей: это не заявка, а инструмент, и его воронку (начал считать → шаг 1 →
    // расчёт → заявка) смотрим отдельно от форм заявок на остальных страницах.
    if (form.matches && form.matches('[data-calc-form]')) window.alterGoal('b2b_roi_form_started');
  });

  /* Микро-цель «бросил форму» — начал заполнять (b2b_form_started), но ушёл со страницы, не
     дойдя до успешной отправки/расчёта. pagehide — основной сигнал ухода, visibilitychange —
     подстраховка для мобильных (сворачивание вкладки не всегда даёт pagehide). */
  var abandonFired = false;
  function checkFormAbandoned() {
    if (abandonFired || formSubmitted || !formTouched) return;
    abandonFired = true;
    window.alterGoal('b2b_form_abandoned');
  }
  window.addEventListener('pagehide', checkFormAbandoned);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') checkFormAbandoned();
  });

  /* Клики по ссылкам-контактам и CTA — без правок вёрстки, по атрибутам/тексту/href. */
  document.addEventListener('click', function (e) {
    var el = e.target;

    // Якорный переход (клик по любой ссылке на #раздел, включая кнопку в шапке) двигает
    // scrollY программно — не в счёт b2b_scroll_50/90, иначе клик «Заказать демо» и мгновенный
    // прыжок к форме засчитается как «дочитал страницу».
    var anchorLink = el.closest && el.closest('a[href^="#"]');
    if (anchorLink) lastAnchorJumpAt = Date.now();

    /* Клики в мега-меню шапки. Метки data-menyu-* расставляет menyu-sobrat.py — без них
       клик по «Калькулятору ROI» из меню неотличим от кнопки ROI на самой странице: адрес
       один и тот же. Та же причина, по которой ниже телеграм-ссылки делятся на шапку и
       футер.

       Целей две, и они срабатывают вместе: общая по панели (сколько вообще ходят через
       меню) и отдельная по виду пункта (карточка с обложкой, строка вебинара, ссылка
       «Смотреть каталог»). Ради этого разделения меню и переделывали: по одной общей цели
       не понять, работают ли карточки. Конкретный пункт уходит параметром — заводить
       отдельную цель на каждую ссылку значит сжечь полсотни целей из лимита счётчика. */
    var menyu = el.closest && el.closest('[data-menyu]');
    if (menyu) {
      var panel = menyu.getAttribute('data-menyu');
      var vid = menyu.getAttribute('data-menyu-vid');
      var punkt = menyu.getAttribute('data-menyu-punkt');
      window.alterGoal('b2b_menu_' + panel + '_click', { vid: vid, punkt: punkt });
      if (vid !== 'link') window.alterGoal('b2b_menu_' + vid + '_click', { panel: panel, punkt: punkt });
      // Без return: ссылка на Telegram-канал лежит и в этом меню, и в футере, и у неё своя
      // цель ниже (b2b_telegram_channel_header_click). Ранний выход её бы отключил.
    }

    // Обе Telegram-ссылки стоят и в шапке (дропдаун «Полезное для HR» / моб. меню), и в
    // футере на каждой странице — делим цель по фактическому месту клика (closest('footer')),
    // а не только по href, иначе шапка и футер неразличимы в отчётах.
    var teContact = el.closest && el.closest('a[href="https://t.me/alter_business"]');
    if (teContact) {
      window.alterGoal('b2b_telegram_contact_' + (teContact.closest('footer') ? 'footer' : 'header') + '_click');
      return;
    }

    var teChannel = el.closest && el.closest('a[href="https://t.me/+9X1R0Y-8X64xYTVi"]');
    if (teChannel) {
      window.alterGoal('b2b_telegram_channel_' + (teChannel.closest('footer') ? 'footer' : 'header') + '_click');
      return;
    }

    // Кнопка в шапке разная в зависимости от страницы (демо/расчёт стоимости/гайд) — делим
    // по её тексту, а не считаем одной целью. Новый текст, которого нет в карте, уходит в
    // b2b_cta_header_other_click с самим текстом в параметре — не теряется, но и не плодит
    // цели молча.
    var headerCta = el.closest && el.closest('[data-header-cta]');
    if (headerCta) {
      var headerLabel = (headerCta.textContent || '').trim().toLowerCase();
      var headerSlug = HEADER_CTA_SLUGS[headerLabel];
      if (headerSlug) window.alterGoal('b2b_cta_header_' + headerSlug + '_click');
      else window.alterGoal('b2b_cta_header_other_click', { label: (headerCta.textContent || '').trim() });
      // Кнопка в шапке — тоже открытие формы (демо/тренинг → #demo, гайд → #zayavka),
      // просто с уже более точной, специфичной целью выше. Дублируем в общий b2b_cta_open,
      // чтобы по нему было видно полную воронку «увидел CTA → открыл» независимо от места клика.
      var headerHref = headerCta.getAttribute && headerCta.getAttribute('href');
      if (headerHref === '#demo') window.alterGoal('b2b_cta_open', { kind: 'demo' });
      else if (headerHref === '#zayavka') window.alterGoal('b2b_cta_open', { kind: 'zayavka' });
      return;
    }

    // Закрывающая кнопка главной «Получить расчёт ROI для своей команды» — с 15.08.2026 ведёт
    // в калькулятор (roi.html), а не в форму заявки #demo. Ловим по data-cta и выходим, чтобы
    // она не попадала в b2b_cta_price_page_click ниже: там CTA, открывающие форму «рассчитать
    // стоимость», и смешивать переход в инструмент с заявкой на расчёт тарифа нельзя.
    var roiCta = el.closest && el.closest('[data-cta="closing-roi"]');
    if (roiCta) {
      window.alterGoal('b2b_roi_calc_open_click');
      return;
    }

    var link = el.closest && el.closest('a, button');
    if (!link) return;
    var label = (link.textContent || '').trim().toLowerCase();
    var href = link.tagName === 'A' ? (link.getAttribute('href') || '') : '';

    // Открытие формы лида — везде, где ссылка ведёт на #demo (секция всегда есть в DOM на
    // страницах тренингов/вебинаров/главной, «открытие» это просто скролл к ней) или на
    // #zayavka (та же схема на одностраничных SEO-лендингах — диагностика/расчёт/материал,
    // конкретный тип формы там один на страницу и виден по URL визита в самой Метрике).
    // Кнопка в шапке уже поймана выше и вернулась — сюда не доходит, поэтому дублируем
    // b2b_cta_open и для неё отдельно там же.
    // «Демо спикера» (карточки тренеров на страницах trening-/vebinar-) — тот же href="#demo",
    // но это не «открыл форму», а «интересует конкретный спикер» — отдельная цель с именем
    // из ближайшего <h3> в той же карточке.
    if (link.tagName === 'A' && (href === '#demo' || href === '#zayavka')) {
      if (href === '#demo' && label === 'демо спикера') {
        var speakerCard = link.parentElement;
        var speakerH3 = speakerCard && speakerCard.querySelector('h3');
        window.alterGoal('b2b_speaker_demo_click', { speaker: speakerH3 ? speakerH3.textContent.trim() : '' });
      } else {
        window.alterGoal('b2b_cta_open', { kind: href === '#demo' ? 'demo' : 'zayavka' });
      }
      return;
    }

    // Блок «Случайный материал»: кнопка-shuffle и ссылка «Открыть →» лежат в одном контейнере
    // (ссылка — единственная <a> с соседней <button> в том же родителе) — разделяем именно так,
    // а не по тексту, чтобы не зависеть от точной формулировки.
    if (link.tagName === 'BUTTON' && label.indexOf('показать другой') !== -1) {
      window.alterGoal('b2b_random_material_shuffle_click');
      return;
    }
    if (link.tagName === 'A' && link.parentElement) {
      var shuffleSibling = link.parentElement.querySelector('button');
      if (shuffleSibling && shuffleSibling.textContent.toLowerCase().indexOf('показать другой') !== -1) {
        window.alterGoal('b2b_random_material_open_click', { href: href });
        return;
      }
    }

    // Блок «Что ещё почитать» — карточки-ссылки внутри <section> с этим заголовком, на 16+
    // страницах. Материал определяем по href (сама формулировка карточки может отличаться от
    // страницы к странице) — разбивку по конкретному материалу смотреть через href-параметр
    // в логе визитов/Конструкторе отчётов Метрики, отдельных целей на каждый материал нет.
    if (link.tagName === 'A') {
      var readMoreSection = link.closest('section');
      var readMoreH2 = readMoreSection && readMoreSection.querySelector('h2');
      if (readMoreH2 && readMoreH2.textContent.trim() === 'Что ещё почитать') {
        window.alterGoal('b2b_read_more_click', { href: href });
        return;
      }
    }

    if (label.indexOf('подробнее о результатах') === 0) { window.alterGoal('b2b_details_results_click'); return; }
    if (label.indexOf('подробнее про подход alter') === 0) { window.alterGoal('b2b_details_science_click'); return; }

    // Страница «Мероприятия Alter» (вебинары для HR): «Подробнее →» в карточках блока
    // «Ближайшие мероприятия», «Смотреть сейчас →» в блоке «Мероприятия в записи». Со стрелкой
    // — чтобы не путать с одинаковым текстом «Подробнее» (без стрелки) в блоке «Почему Alter
    // эффективнее…» на других страницах.
    if (/мероприяти/i.test(decodeURIComponent(location.pathname))) {
      if (label === 'подробнее →') { window.alterGoal('b2b_events_upcoming_details_click'); return; }
      if (label.indexOf('смотреть сейчас') === 0) { window.alterGoal('b2b_events_ondemand_watch_click'); return; }
    }

    if (label) {
      // Первый экран (hero) vs остальная страница — по абсолютной позиции кнопки в
      // документе, без правок вёрстки. Порог — высота одного экрана: кнопки, стоящие выше
      // условной границы первого экрана, считаем hero, ниже — page.
      var rect = link.getBoundingClientRect();
      var docTop = rect.top + (window.scrollY || document.documentElement.scrollTop);
      var zone = docTop < window.innerHeight * 0.9 ? 'hero' : 'page';
      if (label.indexOf('расчёт') !== -1 || label.indexOf('стоимост') !== -1) {
        window.alterGoal('b2b_cta_price_' + zone + '_click');
      } else if (label.indexOf('скачать') === 0) {
        window.alterGoal('b2b_cta_guide_' + zone + '_click');
      }
    }

    if (/^mailto:/i.test(href)) { window.alterGoal('b2b_mailto_tel_click', { type: 'mail' }); return; }
    if (/^tel:/i.test(href)) { window.alterGoal('b2b_mailto_tel_click', { type: 'tel' }); return; }
    if (/\.(pdf|docx?|pptx?|xlsx)$/i.test(href)) { window.alterGoal('b2b_doc_download', { href: href }); return; }
    if (href && !/^(#|javascript:)/i.test(href)) {
      try {
        var url = new URL(href, location.href);
        if (url.hostname && url.hostname !== location.hostname && !/(^|\.)t\.me$/i.test(url.hostname)) {
          window.alterGoal('b2b_outbound_click', { host: url.hostname });
        }
      } catch (err) { /* битый href — не критично */ }
    }
  });

  /* Микро-цель «вернулся на сайт» — не первый визит (флаг в localStorage), фиксируется один
     раз за новую сессию (sessionStorage). При типичном цикле сделки в несколько недель ЛПР
     почти никогда не конвертится с первого захода — раньше не было способа отличить холодный
     трафик от уже прогревающегося посетителя. */
  (function trackReturnVisit() {
    var EVER_KEY = 'alter_ever_visited_v1';
    var SESSION_KEY = 'alter_return_fired_v1';
    var everVisited = false;
    try { everVisited = !!localStorage.getItem(EVER_KEY); } catch (e) { /* приватный режим — не критично */ }
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, '1');
        if (everVisited) window.alterGoal('b2b_return_visit');
      }
    } catch (e) { /* приватный режим — не критично */ }
    try { localStorage.setItem(EVER_KEY, '1'); } catch (e) { /* приватный режим — не критично */ }
  })();

  /* Микро-цель «сравнивает кейсы клиентов» — открыл 2+ разные страницы кейсов (keys-*) за
     визит, тот же паттерн, что и b2b_training_multi_view. */
  (function trackCaseMultiView() {
    if (!/keys-/i.test(location.pathname)) return;
    var KEY = 'alter_case_views_v1';
    var seen;
    try { seen = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { seen = []; }
    if (seen.indexOf(location.pathname) === -1) seen.push(location.pathname);
    try { sessionStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) { /* приватный режим — не критично */ }
    if (seen.length === 2) window.alterGoal('b2b_case_multi_view');
  })();

  /* Микро-цель «полистал карусель» — сдвинул один из трёх [data-carousel] контейнеров
     (дот-навигация и драг одинаково двигают scrollLeft): "reviews" (отзывы — index/roi/
     result/keysy и все trening-/vebinar-, с разделением главная/кейсы vs тренинги),
     "platform" ("Сотрудникам легко начать и продолжать поддержку"), "effect" ("Бизнес видит
     эффект, HR не тратит лишнее время") — оба только на index.html, по одной цели каждая.
     'scroll' на элементе не всплывает — ловим через capture-фазу на document, а не через
     querySelector в момент загрузки скрипта (в <head>, до парсинга <body> — контейнера
     карусели тогда ещё не существует в DOM). */
  var carouselScrollFired = {};
  document.addEventListener('scroll', function (e) {
    var vp = e.target;
    if (!vp || !vp.matches || vp.scrollLeft <= 20) return;
    if (vp.matches('[data-carousel="reviews"]') && !carouselScrollFired.reviews) {
      carouselScrollFired.reviews = true;
      window.alterGoal(/trening-|vebinar-/i.test(location.pathname) ? 'b2b_reviews_scrolled_training' : 'b2b_reviews_scrolled_main');
    } else if (vp.matches('[data-carousel="platform"]') && !carouselScrollFired.platform) {
      carouselScrollFired.platform = true;
      window.alterGoal('b2b_platform_scrolled');
    } else if (vp.matches('[data-carousel="effect"]') && !carouselScrollFired.effect) {
      carouselScrollFired.effect = true;
      window.alterGoal('b2b_effect_scrolled');
    }
  }, { passive: true, capture: true });

  /* Микро-цель «сравнивает несколько программ» — открыл 3+ разных страниц тренингов/
     вебинаров за визит (сигнал корпоративного закупщика, выбирающего между программами).
     ВНИМАНИЕ: паттерн 'trening-'/'vebinar-' завязан на текущие тестовые URL — сверить при
     переезде на боевые адреса (alter.ru/business). */
  (function trackTrainingCompare() {
    if (!/trening-|vebinar-/i.test(location.pathname)) return;
    var KEY = 'alter_training_views_v1';
    var seen;
    try { seen = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { seen = []; }
    if (seen.indexOf(location.pathname) === -1) seen.push(location.pathname);
    try { sessionStorage.setItem(KEY, JSON.stringify(seen)); } catch (e) { /* приватный режим — не критично */ }
    if (seen.length === 3) window.alterGoal('b2b_training_multi_view');
  })();
  /* --- Онлайн-чат amoCRM (виджет crm_plugin, кнопка 450283) ---------------------------
     Подключён 15.09.2026. Код кнопки взят из amoCRM как есть (id + hash + locale + inline),
     здесь он только обёрнут в отложенный запуск и обвешан целями.

     Почему отсюда, а не тегом на страницах: analytics.js уже стоит на всех 85 страницах
     раздела, и его подключение восстанавливает install-metrika.py после каждого зип-экспорта
     дизайн-инструмента (тот стирает точечные патчи в HTML, см. AGENTS.md). Тег, вставленный
     в страницы отдельно, пришлось бы восстанавливать вторым скриптом.

     Почему через __alterDefer: gso.amocrm.ru тянет ~130 КБ скрипта и два iframe. В <head>
     без отсрочки это уехало бы в замер PageSpeed (по нему принимаются решения о скорости,
     см. PROJECT.md). Очередь __alterDefer флешится по простою браузера (requestIdleCallback,
     страховка таймером), то есть чат появляется через 1-2 секунды после загрузки и на LCP
     не влияет. Запасной путь — для семи страниц, где загрузчика отсрочки нет.

     ЧТО ВИДНО ИЗ СТРАНИЦЫ, А ЧТО НЕТ (разобрано по исходнику button.js 15.09.2026):
     наружу виджет отдаёт onChatReady, onChatShow, onChatHide, onButtonClick,
     onChatRenderDone и onConversationsChange. Событие «посетитель отправил сообщение»
     родительской странице НЕ приходит вовсе: переписка живёт в iframe с чужим доменом,
     а шина между iframe и страницей сообщений о письмах не содержит. onChatMessage в коде
     виджета можно подписать, но он никогда не вызывается, а onConversationsChange приходит
     с `false`, пока в аккаунте выключены мультидиалоги. Поэтому целей на «написал в чат»
     и «оператор ответил» здесь нет и быть не может — факт диалога и сделку из чата брать
     из amoCRM, а не из Метрики. Всё, что честно видно снаружи: открыл чат, сколько держал
     открытым, ушёл ли в мессенджер. */
  // ВЫКЛЮЧАТЕЛЬ. false — виджет не грузится вообще, ни на одной странице; цели при этом
  // остаются заведёнными в Метрике и просто не срабатывают.
  // 15.09.2026 выключен (бот в amoCRM не доработан), 16.09.2026 включён обратно: владелец
  // проверяет спрос — будут ли вообще писать, приветствие сознательно не настраивается.
  var CHAT_ON = true;
  var CHAT_ID = '450283';
  var CHAT_HASH = '779a104561fe31272a06dee93f1a13a089e20ad08897c437546fe0fe52eb7d7a';
  // Режим кнопки. amoCRM отдаёт два варианта одного и того же кода: inline:true — источники
  // всегда раскрыты рядком (в их интерфейсе «Раскрытые»), inline:false — один кружок,
  // который раскрывается по клику («В кнопке»). 16.09.2026 владелец выбрал второй.
  var CHAT_INLINE = false;
  // Страницы, где чат отдела продаж неуместен: опрос для сотрудников компании-клиента
  // (обещана анонимность, продавать там некому), личный кабинет лида и реферальная
  // программа для психологов — туда приходят не покупатели B2B.
  var CHAT_SKIP = /(?:^|\/)(psy-referral|diagnostika|kabinet)(?:\.dc)?(?:\.html)?$/i;
  // Открытым дольше этого чат держит тот, кто пишет или читает ответ, а не тот, кто
  // открыл и сразу закрыл. Единственный доступный признак вовлечённости — время.
  // Префикс целей — b2b_amochat_, а не b2b_chat_: имена b2b_chat_* уже заняты своим
  // консультантом (проект «Alter консультант», konsultant.js). Виджеты разные, смешивать
  // их в одной цели нельзя.
  var CHAT_ENGAGED_MS = 20000;
  var CHAT_TICK_MS = 5000;

  (function amoChat() {
    if (!CHAT_ON) return;
    if (CHAT_SKIP.test(location.pathname)) return;
    if (window.amo_social_button) return;   // уже подключён тегом на самой странице

    function start() {
      window.amo_social_button = {
        id: CHAT_ID, hash: CHAT_HASH, locale: 'ru', inline: CHAT_INLINE,
        setMeta: function (p) { this.params = (this.params || []).concat([p]); }
      };
      window.amoSocialButton = window.amoSocialButton || function () {
        (window.amoSocialButton.q = window.amoSocialButton.q || []).push(arguments);
      };
      var s = document.createElement('script');
      s.async = true;
      s.id = 'amo_social_button_script';
      s.src = 'https://gso.amocrm.ru/js/button.js';
      (document.head || document.documentElement).appendChild(s);
      bindGoals();
    }

    function bindGoals() {
      var clickedAt = 0;        // когда посетитель сам ткнул в кнопку чата
      var openFired = false;
      var engagedFired = false;
      var openMs = 0;           // сколько времени окно чата реально провисело открытым
      var ticks = 0;
      var poll = 0;

      // onButtonClick приходит и на сам чат (service === 'livechat'), и на кнопки
      // мессенджеров. Состав кнопки задаётся в настройках amoCRM и приезжает с их сервера
      // по hash, в коде сайта его нет: 15.09.2026 в кнопке был только чат, к вечеру того же
      // дня добавились Telegram и WhatsApp — страница подхватила их сама. Клик по
      // мессенджеру уводит человека из браузера, и после него сайт про него не знает
      // ничего, поэтому у него своя цель.
      window.amoSocialButton('onButtonClick', function (service) {
        if (service === 'livechat') { clickedAt = Date.now(); return; }
        window.alterGoal('b2b_amochat_messenger_click', { service: service || 'other' });
      });

      // onChatShow срабатывает и на клик посетителя, и на программное открытие (виджет
      // сам разворачивает окно, когда приходит новое сообщение). Без разделения цель
      // «открыл чат» распухла бы автопоказами, поэтому источник уходит параметром.
      window.amoSocialButton('onChatShow', function () {
        if (!openFired) {
          openFired = true;
          window.alterGoal('b2b_amochat_open', {
            kak: (Date.now() - clickedAt < 3000) ? 'klik' : 'avto',
            page: location.pathname
          });
        }
        watchEngagement();
      });

      /* Вовлечённость считаем не парой событий show/hide, а фактическим состоянием окна.
         Причина: события и картинка расходятся. Проверено 15.09.2026 — runChatHide шлёт
         onChatHide, хотя окно остаётся на экране, а закрытие крестиком в другой раз
         onChatHide не прислало вовсе. На одноразовом таймере это давало цель при закрытом
         чате и молчание при открытом. Класс amo-livechat_hidden на окне виджета — то,
         что видит посетитель, поэтому копим только видимые секунды.
         Если виджет переименует класс, элемент перестанет считаться скрытым и цель начнёт
         срабатывать чуть щедрее — это заметно в отчёте, в отличие от молчания. */
      function chatVisible() {
        var box = document.querySelector('.amo-livechat');
        return !(box && /amo-livechat_hidden/.test(box.className));
      }

      function watchEngagement() {
        if (poll || engagedFired) return;
        var last = Date.now();
        poll = setInterval(function () {
          // Считаем по часам, а не по номиналу тика: в фоновой вкладке браузер режет
          // интервалы до одного раза в минуту. Шаг сверху ограничен двумя тиками —
          // иначе вкладка, пролежавшая в фоне полчаса с открытым чатом, засчиталась бы
          // как вовлечённость, хотя на неё никто не смотрел.
          var now = Date.now();
          var dt = Math.min(now - last, CHAT_TICK_MS * 2);
          last = now;
          if (chatVisible()) openMs += dt;
          if (openMs >= CHAT_ENGAGED_MS) {
            clearInterval(poll); poll = 0;
            engagedFired = true;
            window.alterGoal('b2b_amochat_engaged');
          } else if (++ticks > 120) {          // 10 минут — дальше сторожить незачем
            clearInterval(poll); poll = 0;
          }
        }, CHAT_TICK_MS);
      }
    }

    if (window.__alterDefer) window.__alterDefer(start);
    else if (document.readyState === 'complete') setTimeout(start, 1200);
    else window.addEventListener('load', function () { setTimeout(start, 1200); }, { once: true });
  })();
})();
