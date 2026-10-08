/* Отправка заявок с сайта (демо / диагностика / пилот / расчёт тарифа / тренинг-вебинар /
   материал) в amoCRM через Cloudflare Worker-прокси + захват UTM-меток.
   Секретный токен amoCRM живёт только в воркере (Cloudflare secret), в клиент не попадает.
   Экспортирует window.alterSubmitLead(formEl, formType, extra) -> Promise.
   formType: 'demo' (по умолчанию) | 'diagnostic' | 'pilot' | 'price' | 'training' | 'material'
   — определяет воронку/этап/«тип продукта» в amoCRM (см. worker.js). extra — необязательный
   объект с полями, которых нет в самой форме (например materialTitle для гейта материалов). */
(function () {
  // URL развёрнутого Cloudflare Worker. После деплоя воркера подставить сюда его адрес.
  // Можно переопределить до загрузки страницы через window.ALTER_CRM_ENDPOINT.
  var ENDPOINT = window.ALTER_CRM_ENDPOINT || 'https://alter.ru/crm-api/';

  // Адрес самого этого файла. Нужен, чтобы построить ссылку на страницу «спасибо»: файл
  // всегда лежит в корне сайта, а подключают его и страницы корня («crm-submit.js»), и
  // страницы кейсов («../crm-submit.js»). Путь относительно текущей страницы дал бы для
  // keysy/* несуществующий keysy/spasibo.
  var SELF_SRC = (document.currentScript && document.currentScript.src) || '';

  function val(el) { return el && el.value ? String(el.value).trim() : ''; }

  /* Страница «спасибо»: на боевом она лежит под чистым ключом `spasibo`, локально — файлом
     `spasibo.html`. Определяем по хосту, а НЕ по адресу текущей страницы. Раньше было по
     адресу — и это давало 404 при отправке с `/index.html`: главная единственная сохраняет
     расширение (она в PAGE_KEEP как корень сайта), поэтому правило «путь с .html → ведём на
     spasibo.html» промахивалось мимо несуществующего ключа. Тот же приём, что в
     cabinet-client.js. */
  function thankYouUrl(formType) {
    var host = location.hostname;
    var local = host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:';
    var name = local ? 'spasibo.html' : 'spasibo';
    try {
      return new URL(name + '?t=' + encodeURIComponent(formType), SELF_SRC || location.href).href;
    } catch (e) {
      return name + '?t=' + encodeURIComponent(formType);
    }
  }

  // --- UTM: считываем из URL при каждой загрузке страницы. Если в URL есть метки — это
  // «последнее касание с меткой» и перезаписывает сохранённое (типичная схема для сайтов
  // без сквозной аналитики). Если меток в URL нет — держим то, что сохранено раньше (TTL
  // 30 дней), чтобы атрибуция не терялась при переходах между страницами без UTM.
  // Referrer сохраняем только при первом заходе (иначе после перехода по сайту он станет
  // «сам с себя»).
  //
  // ПЕРВОЕ КАСАНИЕ — отдельным ключом и БЕЗ срока жизни (alter_utm_first_v1). Пишется один
  // раз, при самом первом заходе, и больше не меняется. Без него видно только последнее
  // касание, а при цикле сделки в недели-месяцы человек почти никогда не оставляет заявку
  // с того же захода, что познакомился: «был на вебинаре в марте, вернулся из поиска в
  // августе» превращается в «пришёл из поиска». Систематически занижает вебинары и рассылки
  // и завышает то, что стоит последним в цепочке.
  var UTM_KEY = 'alter_utm_v1';
  var UTM_FIRST_KEY = 'alter_utm_first_v1';
  var UTM_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  function param(params, name) { return (params && params.get(name)) || ''; }

  /* --- Откуда пришёл, когда меток в адресе нет. Разбираем реферер.
     Органика, переход из нашего блога и ссылка с чужого сайта раньше доезжали в CRM одной
     сырой строкой в поле utm_referrer, а источник у сделки оставался пустым: в отчётах такой
     лид ничей. Найдено на живых заявках 10.08.2026 — «тренинги ростов-на-дону по
     стрессоустойчивости для сотрудников» из Яндекса и переход из статьи блога.
     Поисковую фразу Яндекс в реферере ОТДАЁТ (`?text=`), Google обычно нет: браузер по
     умолчанию срезает у чужого домена путь и запрос, и полный адрес доезжает не всегда.
     Поэтому фраза — приятный бонус, а не то, на что можно опираться; источник определяется
     в любом случае, он виден по одному домену. */
  var SEARCH_ENGINES = [
    { re: /(^|\.)yandex\./i, name: 'yandex', keys: ['text'] },
    { re: /(^|\.)google\./i, name: 'google', keys: ['q'] },
    { re: /(^|\.)bing\./i, name: 'bing', keys: ['q'] },
    { re: /(^|\.)duckduckgo\./i, name: 'duckduckgo', keys: ['q'] },
    { re: /(^|\.)rambler\./i, name: 'rambler', keys: ['query'] },
    { re: /(^|\.)mail\.ru$/i, name: 'mail', keys: ['q', 'text'] },
  ];
  // Блог живёт на alter.ru/business-blog/ — это отдельный путь, не часть /business/, и лежит
  // он в коде B2C. Для нас это полноценный источник лида, а не «переход по сайту».
  var BLOG_PATH = '/business-blog';
  var OWN_HOSTS = /(^|\.)alter\.ru$|(^|\.)alter-business\.ru$|(^|\.)github\.io$|(^|\.)psyalter\.(ru|com)$|^localhost$|^127\.0\.0\.1$/i;

  function parseReferrer(ref) {
    if (!ref) return null;
    var u;
    try { u = new URL(ref); } catch (e) { return null; }

    for (var i = 0; i < SEARCH_ENGINES.length; i++) {
      var se = SEARCH_ENGINES[i];
      if (!se.re.test(u.hostname)) continue;
      var phrase = '';
      for (var k = 0; k < se.keys.length && !phrase; k++) {
        try { phrase = u.searchParams.get(se.keys[k]) || ''; } catch (e) { phrase = ''; }
      }
      return { source: se.name, medium: 'organic', term: phrase };
    }

    if (OWN_HOSTS.test(u.hostname)) {
      if (u.pathname.indexOf(BLOG_PATH) === 0) return { source: 'alter-blog', medium: 'blog', term: '' };
      // Переход с B2C-части alter.ru (не из /business) — тоже источник: человек знал Alter как
      // сервис для себя. До 08.10.2026 такой заход и прямой заход приезжали в сделку пустым
      // источником и попадали в отчётах в «Без меток» вместе с потерянными метками.
      if (/(^|\.)alter\.ru$/i.test(u.hostname) && u.pathname.indexOf('/business') !== 0) {
        return { source: 'alter.ru', medium: 'internal', term: '' };
      }
      return null; // обычный переход внутри раздела — это не источник
    }

    return { source: u.hostname.replace(/^www\./i, ''), medium: 'referral', term: '' };
  }

  function captureUtm() {
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem(UTM_KEY) || 'null'); } catch (e) { stored = null; }
    if (stored && (Date.now() - (stored.ts || 0)) > UTM_TTL_MS) stored = null;

    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
    // yclid/gclid считаем такой же «меткой», как utm_source: клик из Директа или Google Ads
    // часто приходит вообще без utm (метки проставляют не во всех кампаниях), и без этой
    // строки платный визит записался бы прямым заходом.
    var urlHasUtm = !!(param(params, 'utm_source') || param(params, 'utm_medium')
      || param(params, 'utm_campaign') || param(params, 'yclid') || param(params, 'gclid'));

    if (urlHasUtm || !stored) {
      // Реферер разбираем только когда меток в адресе нет: метка всегда точнее и главнее.
      // И только в этой ветке, то есть при заходе БЕЗ сохранённого касания — иначе органика
      // затирала бы рассылку или рекламу, по которой человек пришёл в прошлый раз.
      var fromRef = urlHasUtm ? null : parseReferrer(document.referrer);
      // Пустой реферер при первом заходе — это прямой заход (набрали адрес, закладка, ссылка из
      // мессенджера или письма без меток). Записываем его явно, иначе в CRM «прямой» не отличить
      // от «источник потерян» (разобрано 08.10.2026: 13 из 65 заявок с форм без источника).
      if (!urlHasUtm && !fromRef && !stored && !document.referrer) {
        fromRef = { source: '(direct)', medium: '(none)', term: '' };
      }
      stored = {
        source: param(params, 'utm_source') || (fromRef ? fromRef.source : ''),
        medium: param(params, 'utm_medium') || (fromRef ? fromRef.medium : ''),
        campaign: param(params, 'utm_campaign'),
        content: param(params, 'utm_content'),
        term: param(params, 'utm_term') || (fromRef ? fromRef.term : ''),
        yclid: param(params, 'yclid'),
        gclid: param(params, 'gclid'),
        referrer: (stored && stored.referrer) || document.referrer || '',
        ts: Date.now(),
      };
      try { localStorage.setItem(UTM_KEY, JSON.stringify(stored)); } catch (e) { /* приватный режим и т.п. — не критично */ }
    }

    var first = null;
    try { first = JSON.parse(localStorage.getItem(UTM_FIRST_KEY) || 'null'); } catch (e) { first = null; }
    if (!first) {
      // Пишем и когда меток нет вовсе: «первое касание — органика с такой-то страницы» это
      // тоже ответ. Посадочная и реферер первого захода часто говорят больше самих меток.
      // У посетителей, заставших сайт до этой правки, отдельного ключа нет — за первое
      // касание берём самое раннее, что о них известно (сохранённое последнее, с его же
      // временем). Приблизительно, но лучше пустого поля; через 30 дней такие записи
      // вымоются и останутся только честные.
      first = {
        source: stored.source || '',
        medium: stored.medium || '',
        campaign: stored.campaign || '',
        content: stored.content || '',
        term: stored.term || '',
        yclid: stored.yclid || '',
        gclid: stored.gclid || '',
        referrer: document.referrer || stored.referrer || '',
        landing: location.href.split('#')[0],
        ts: stored.ts || Date.now(),
      };
      try { localStorage.setItem(UTM_FIRST_KEY, JSON.stringify(first)); } catch (e) { /* приватный режим и т.п. — не критично */ }
    }

    return { last: stored, first: first };
  }

  // Захватываем метки сразу при загрузке скрипта (он подключён на каждой странице), а не
  // только в момент отправки формы — иначе метка терялась бы, если посетитель перешёл по
  // рекламной ссылке и открыл форму уже на другой странице, куда UTM не докатились.
  captureUtm();

  // Адрес страницы заявки собираем не из голого location.href, а с оглядкой на строку
  // запроса, снятую при загрузке. У части посетителей метки вырезает блокировщик в самом
  // браузере (ClearURLs, AdGuard, встроенная защита от слежки): он переписывает адресную
  // строку уже после загрузки и пересобирает её как «путь + ? + остаток», поэтому когда
  // вырезано всё, остаётся висячий вопросительный знак. Метки в сделке при этом целы —
  // captureUtm() снял их выше, — а вот в поле «Страница заявки» и в карточку Пачки
  // приезжало `https://latypovruslan5.github.io/alter-business.ru/?`, и менеджер не видел, откуда человек пришёл
  // (разобрано 17.09.2026 на трёх заявках кампании budget2027_202609, всего таких случаев
  // 4 из 1609 заявок с 01.06). Подменяем только когда к отправке строка запроса пуста:
  // если посетитель сам ушёл на другой адрес сайта, его текущая строка главнее.
  var SEARCH_AT_LOAD = location.search;

  function pageUrl() {
    var search = location.search;
    if (!search || search === '?') search = SEARCH_AT_LOAD;
    if (search === '?') search = '';  // чистить было нечего — не тащим висячий знак в карточку
    return location.origin + location.pathname + search + location.hash;
  }

  // --- ClientID Яндекс.Метрики. Без него сделку в amoCRM и визит в Метрике сопоставить
  // нечем: спор «Метрика видит одно число заявок, CRM другое» физически неразрешим, а
  // офлайн-конверсия (вернуть в Метрику и Директ факт победы, чтобы реклама оптимизировалась
  // на деньги, а не на отправленные формы) недоступна.
  // ClientID лежит в первопартийной куке `_ym_uid` — читаем её синхронно, а параллельно
  // спрашиваем сами счётчики: getClientID отвечает колбэком, когда счётчик загрузился.
  // Значение у счётчиков одного домена одинаковое, но записываем, какой именно ответил.
  var ymClientIds = {};

  function cookieValue(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) { return ''; }
  }

  function askCounters() {
    if (typeof ym !== 'function') return;
    (window.ALTER_YM_IDS || []).forEach(function (id) {
      try {
        ym(id, 'getClientID', function (cid) { if (cid) ymClientIds[id] = String(cid); });
      } catch (e) { /* счётчик мог не подняться — останется кука */ }
    });
  }
  // Порядок подключения скриптов на страницах разный, и на части из них crm-submit.js
  // грузится раньше блока Метрики — тогда ym ещё не объявлен. Поэтому вторая попытка на load.
  askCounters();
  window.addEventListener('load', askCounters);

  /* Основной счётчик раздела. Его номер уезжает в поле сделки рядом с ClientID и говорит,
     в отчётах какого счётчика этот визит потом искать.
     С 11.08.2026 это 111173360 — счётчик B2B, поднят из кода сайта после снятия `ssr:true`
     (проверено: видит страницы по всему разделу, цели срабатывают). До этого он не собирал
     данные, и здесь стоял общий с B2C 47534068.
     Значение ClientID от выбора счётчика не зависит: кука `_ym_uid` общая на домен, у обоих
     счётчиков она одна и та же. Меняется только номер, который мы записываем рядом. */
  var YM_PRIMARY_COUNTER = 111173360;

  function pickClientId() {
    var ids = window.ALTER_YM_IDS || [];
    // Спрашиваем сначала основной: живы оба, и без явного порядка в поле оседал бы тот,
    // кто просто раньше стоит в списке.
    var order = [YM_PRIMARY_COUNTER].concat(ids.filter(function (id) { return id !== YM_PRIMARY_COUNTER; }));
    for (var i = 0; i < order.length; i++) {
      if (ymClientIds[order[i]]) return { id: ymClientIds[order[i]], counter: String(order[i]) };
    }
    // Никто не ответил: библиотеку Метрики срезал блокировщик, либо она ещё не поднялась.
    // Кука остаётся от прошлых заходов — этого достаточно, чтобы связать визит со сделкой.
    var fromCookie = cookieValue('_ym_uid');
    return { id: fromCookie, counter: fromCookie ? String(YM_PRIMARY_COUNTER) : '' };
  }

  /* Трекинг-часть заявки одной функцией: её же берёт cabinet-client.js (регистрация в
     кабинете создаёт сделку своим маршрутом /api/register, и без этого лид-магнитные лиды
     уходили в CRM вообще без источника). */
  window.alterTracking = function () {
    var utm = captureUtm();
    var cid = pickClientId();
    return {
      utmSource: utm.last.source || '',
      utmMedium: utm.last.medium || '',
      utmCampaign: utm.last.campaign || '',
      utmContent: utm.last.content || '',
      utmTerm: utm.last.term || '',
      utmReferrer: utm.last.referrer || '',
      yclid: utm.last.yclid || '',
      gclid: utm.last.gclid || '',
      firstUtmSource: utm.first.source || '',
      firstUtmMedium: utm.first.medium || '',
      firstUtmCampaign: utm.first.campaign || '',
      // Объявление и фраза первого захода: в CRM у них своя ячейка, наравне с последним
      // касанием. Раньше эти два значения хранились, но до сделки не доезжали.
      firstUtmContent: utm.first.content || '',
      firstUtmTerm: utm.first.term || '',
      firstUtmReferrer: utm.first.referrer || '',
      firstUtmLanding: utm.first.landing || '',
      firstYclid: utm.first.yclid || '',
      firstGclid: utm.first.gclid || '',
      firstTouchAt: utm.first.ts ? new Date(utm.first.ts).toISOString() : '',
      // То же время секундами — поле «Дата первого касания» в amoCRM имеет тип date и строку
      // ISO не примет. Держим оба: строка идёт в примечание, число — в поле.
      firstTouchTs: utm.first.ts ? Math.floor(utm.first.ts / 1000) : 0,
      ymClientId: cid.id,
      ymCounter: cid.counter,
    };
  };

  /* Маячок визитов живёт в analytics.js, а не здесь. Причина: этот файл подключается
     отложенно и ТОЛЬКО по взаимодействию (`__alterDefer(fn, true)`), да и стоит он на 58
     страницах против 68 у analytics.js — в частности, его нет на roi.html, самой горячей
     для сигналов странице. Пассивный заход маячок отсюда просто не поймал бы. */

  // --- Чтение полей формы: ПО СМЫСЛУ поля, а не по позиции в DOM. Раньше поля читались по
  // индексу (0-й элемент — имя, 1-й — компания и т.д.), но выяснилось, что порядок и набор
  // полей отличается от страницы к странице (например, на страницах отдельных тренингов
  // «Размер компании» стоит 3-м полем, а не 6-м, плюс там есть поле «пакет», а на страницах-
  // каталогах тренингов — ещё и текстовое поле «комментарий»). Индексный парсинг эти различия
  // не учитывал и был готов молча перепутать поля местами. Классификация по типу/placeholder/
  // тексту опций работает одинаково независимо от порядка полей на странице.
  /* ---------- Заслон от автозаполнения форм (24.09.2026) ----------

     Форма «Индивидуальное предложение» собирала поддельные заявки пачками (17.09 — три за
     53 секунды, 24.09 — две за 9 секунд). Отсюда уходят три признака, решение по ним
     принимает воркер:

     - `hp` — скрытое поле-ловушка. Человек его не видит и заполнить не может, автомат
       обычно заполняет все поля подряд. Вставляем его в формы отсюда, а не в разметку
       страниц: страниц шестьдесят, и половина собирается dc-рантаймом заново.
     - `pageMs` — сколько прошло от загрузки страницы до отправки, `fillMs` — от первого
       прикосновения к форме. Клик по самой кнопке началом заполнения не считаем: у
       вернувшегося посетителя форма уже подставлена, и он жмёт кнопку сразу.
     - `acted` — было ли на странице хоть одно настоящее нажатие или набор с клавиатуры.

     Время считается в момент отправки формы, а не отправки запроса: заявка со страницей
     «спасибо» лежит в sessionStorage и уходит уже оттуда, через секунду после перехода. */

  var PAGE_T0 = Date.now();
  var userActed = 0;
  var HP_MARK = 'hp';

  function honeypotInput() {
    var el = document.createElement('input');
    el.type = 'text';
    el.name = 'subject';
    el.value = '';
    el.setAttribute('data-role', HP_MARK);
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('tabindex', '-1');
    el.setAttribute('aria-hidden', 'true');
    // Не display:none — скрытые таким образом поля часть автоматов пропускает. И не
    // обычный элемент потока: формы на сайте это grid, лишний элемент занял бы ячейку.
    el.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;'
      + 'border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);opacity:0;pointer-events:none';
    return el;
  }

  function ensureHoneypots() {
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
      if (!forms[i].querySelector('[data-role="' + HP_MARK + '"]')) {
        forms[i].appendChild(honeypotInput());
      }
    }
  }

  /* dc-рантайм перерисовывает страницу при первом действии посетителя и сносит вставленное.
     Поэтому не одна вставка на загрузке, а наблюдение за деревом. Повторный проход ничего
     не добавляет (поле уже на месте), так что наблюдатель сам себя не разгоняет. */
  function watchForms() {
    ensureHoneypots();
    if (!window.MutationObserver) return;
    var pending = 0;
    new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () { pending = 0; ensureHoneypots(); }, 300);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  function isSubmitControl(el) {
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'button') return true;
    return tag === 'input' && /^(submit|button|image)$/i.test(el.type || '');
  }

  function onFirstTouch(e) {
    if (!e.isTrusted) return;        // синтетическое событие живым действием не считаем
    userActed = 1;
    var el = e.target;
    if (!el || !el.closest) return;
    var form = el.closest('form');
    if (!form || form.getAttribute('data-alter-t0') || isSubmitControl(el)) return;
    form.setAttribute('data-alter-t0', String(Date.now()));
  }

  try {
    document.addEventListener('pointerdown', onFirstTouch, true);
    document.addEventListener('keydown', onFirstTouch, true);
    document.addEventListener('focusin', onFirstTouch, true);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', watchForms);
    } else {
      watchForms();
    }
  } catch (e) { /* без заслона форма всё равно должна работать */ }

  function spamFields(formEl) {
    var hpEl = formEl.querySelector('[data-role="' + HP_MARK + '"]');
    var t0 = parseInt(formEl.getAttribute('data-alter-t0'), 10);
    return {
      hp: hpEl ? val(hpEl) : '',
      fillMs: t0 ? (Date.now() - t0) : -1,
      pageMs: Date.now() - PAGE_T0,
      acted: userActed
    };
  }

  function classifyField(el) {
    // Поле-ловушка из заслона выше: обычный text-инпут, а такой ниже уезжает в «Имя».
    if (el.getAttribute('data-role') === HP_MARK) return null;
    var tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return 'comment';
    if (tag === 'input') {
      if (el.type === 'hidden') return null; // ИНН читается отдельно, см. ниже
      if (el.name === 'company') return 'company'; // CompanyAutocomplete всегда рендерит name="company"
      if (el.type === 'tel') return 'phone';
      if (el.type === 'email') return 'email';
      if (el.type === 'text') return 'name'; // единственный оставшийся обычный текстовый инпут — «Имя»
      return null;
    }
    if (tag === 'select') {
      var optText = '';
      try {
        optText = Array.prototype.map.call(el.querySelectorAll('option'), function (o) { return o.textContent; }).join(' | ');
      } catch (e) { optText = ''; }
      if (/пакет/i.test(optText)) return 'package';
      if (/пилотной группы/i.test(optText)) return 'pilotSize';
      if (/интересующий тариф/i.test(optText)) return 'priceTariff';
      if (/размер компании/i.test(optText)) return 'companySize';
      // Должность. Раньше этот селект не читался вообще: в amoCRM под него нет поля.
      // Понадобился для регистраций на вебинар — там база живёт в таблице, и
      // должность в ней отдельной колонкой (как в прежних выгрузках регистраций).
      if (/должность/i.test(optText)) return 'position';
      if (/связаться/i.test(optText)) return 'contactMethod';
      if (/«?да»?\s*или\s*«?нет»?/i.test(optText)) return 'wantsDiagnostic'; // «Хотите бесплатную диагностику команды?» да/нет-вопрос на лид-магнитных страницах
      return null;
    }
    return null;
  }

  function readForm(formEl, formType) {
    var out = { formType: formType, page: pageUrl() };
    var elements = formEl.querySelectorAll('input, select, textarea');
    Array.prototype.forEach.call(elements, function (el) {
      var key = classifyField(el);
      if (!key) return;
      // У поля с международной маской (phone-intl.js) в самом инпуте лежит только локальная
      // часть — код страны живёт в селекторе рядом. Полный номер скрипт кладёт в
      // data-phone-full; если он пуст (скрипт не отработал) — берём как есть.
      if (key === 'phone') { out.phone = el.getAttribute('data-phone-full') || val(el); return; }
      out[key] = val(el);
    });

    var innEl = formEl.querySelector('[data-role="company-inn"]');
    out.inn = innEl ? val(innEl) : '';
    var addressEl = formEl.querySelector('[data-role="company-address"]');
    out.companyAddress = addressEl ? val(addressEl) : '';
    // Код ОКВЭД и регион из ЕГРЮЛ. Отрасль по коду воркер определяет сам — справочник
    // держим на бэкенде, чтобы менять свёртку в одном месте, а не на 60 страницах.
    var okvedEl = formEl.querySelector('[data-role="company-okved"]');
    out.companyOkved = okvedEl ? val(okvedEl) : '';
    var regionEl = formEl.querySelector('[data-role="company-region"]');
    out.companyRegion = regionEl ? val(regionEl) : '';

    // Название тренинга/вебинара — со страницы (h1), не из самой формы: у каждой из ~36
    // страниц тренингов/вебинаров он на своей странице свой, а вручную дублировать его в
    // каждую форму избыточно и хрупко (легко разойдётся с заголовком при правке контента).
    if (formType === 'training') {
      var h1 = document.querySelector('h1');
      out.trainingName = h1 ? h1.textContent.trim() : '';
    }

    var tracking = window.alterTracking();
    for (var t in tracking) {
      if (Object.prototype.hasOwnProperty.call(tracking, t)) out[t] = tracking[t];
    }

    var spam = spamFields(formEl);
    for (var sp in spam) {
      if (Object.prototype.hasOwnProperty.call(spam, sp)) out[sp] = spam[sp];
    }
    return out;
  }

  /* ---------- своя память: подставляем то, что человек уже вводил ----------

     Заявку на материал в 39% случаев оставляет посетитель, которого браузер уже
     видел на сайте (замер Метрики 03–16.08.2026, 41 из 105 достижений
     b2b_lead_material), а полей в форме от 4 до 6. Браузерное автозаполнение
     закрывает только тех, у кого в профиле уже сохранён адрес, и на наших формах
     почти ничего не запоминает само: отправка идёт через fetch с preventDefault,
     обычной отправки страницы браузер не видит. Поэтому помним сами.

     Храним в localStorage самого посетителя, на сервер ничего не отсылаем, срок
     жизни 30 дней (как у меток первого касания выше). Приватный режим и
     блокировщики: любая ошибка хранилища гасится, форма остаётся пустой.

     Обязательная часть механики — видимая строка «Не вы? Очистить». За одним
     браузером работают двое, и без такой строки в CRM поедет заявка от имени
     коллеги с чужим телефоном (у HubSpot это отдельная статья базы знаний про
     поля, заполненные данными другого человека). Нажатие чистит и поля, и
     хранилище. */
  var PREFILL_KEY = 'alter_lead_prefill_v1';
  var PREFILL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
  var PREFILL_FIELDS = ['name', 'email', 'phone', 'company', 'inn',
    'companyAddress', 'companyOkved', 'companyRegion', 'companySize', 'contactMethod'];
  var NAME_PLACEHOLDERS = { 'Имя': 1, 'Имя и фамилия': 1 };
  /* Числа калькулятора ROI. В заявку они уезжают уже посчитанными и отформатированными
     (roiSalary это «1,2 млн»), поэтому помним не payload, а то, что человек набрал в
     полях: иначе при возврате в калькулятор пришлось бы вводить их заново. */
  var ROI_INPUTS = ['employees', 'turnover', 'salary'];

  /* Намеренно НЕ помним: тариф, пакет и размер пилотной группы (выбор под конкретную
     задачу, подставленный прошлый ответ искажает интерес в CRM), комментарий (старый
     текст про другую ситуацию поедет мусором в новую сделку) и ответ на вопрос про
     бесплатную диагностику (это согласие, а не данные о человеке). */

  function prefillRead() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(PREFILL_KEY) || 'null'); } catch (e) { return null; }
    if (!d || !d.ts || (Date.now() - d.ts) > PREFILL_TTL_MS) return null;
    return d;
  }

  function prefillSave(payload, formEl) {
    var d = { ts: Date.now() }, est = false;
    for (var i = 0; i < PREFILL_FIELDS.length; i++) {
      var k = PREFILL_FIELDS[i];
      if (payload[k]) { d[k] = payload[k]; est = true; }
    }
    if (formEl) {
      for (var r = 0; r < ROI_INPUTS.length; r++) {
        var chislo = formEl.querySelector('input[name="' + ROI_INPUTS[r] + '"]');
        if (chislo && chislo.value) { d[ROI_INPUTS[r]] = chislo.value; est = true; }
      }
    }
    if (!est) return;
    try { localStorage.setItem(PREFILL_KEY, JSON.stringify(d)); } catch (e) { /* приватный режим — не критично */ }
  }

  /* Поле имени ищем по подписи, а не через classifyField: там «любой текстовый инпут
     это имя», и в подстановку попал бы, например, поиск по материалам. */
  function nameInput(formEl) {
    var list = formEl.querySelectorAll('input[type="text"]');
    for (var i = 0; i < list.length; i++) {
      if (NAME_PLACEHOLDERS[list[i].getAttribute('placeholder') || '']) return list[i];
    }
    return null;
  }

  // Списки различаем по тексту опций, как classifyField: подписи у них нет, а порядок
  // полей на страницах разный.
  function selectByOptions(formEl, re) {
    var list = formEl.querySelectorAll('select');
    for (var i = 0; i < list.length; i++) {
      var txt = '';
      try {
        txt = Array.prototype.map.call(list[i].querySelectorAll('option'),
          function (o) { return o.textContent; }).join(' | ');
      } catch (e) { txt = ''; }
      if (re.test(txt)) return list[i];
    }
    return null;
  }

  function putSelect(sel, znachenie, zapolneno) {
    if (!sel || sel.value || !znachenie) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].text.trim() === String(znachenie).trim()) {
        sel.selectedIndex = i;
        zapolneno.push(sel);
        return;
      }
    }
  }

  /* Строка-пометка встаёт над первым заполненным полем, а не в начало формы. Причина
     найдена на калькуляторе ROI 17.08.2026: форма там из двух шагов в одном <form>,
     контакты лежат на втором, и пометка в начале висела над пустыми числами первого
     шага. Выглядело так, будто ничего не подставилось. */
  function prefillNote(formEl, pervyy, ochistit) {
    if (formEl.querySelector('[data-role="prefill-note"]')) return;
    var uzel = pervyy;
    while (uzel.parentNode && uzel.parentNode !== formEl) uzel = uzel.parentNode;
    if (uzel.parentNode !== formEl) uzel = formEl.firstChild;
    var kontejner = uzel.parentNode || formEl;

    var note = document.createElement('div');
    note.setAttribute('data-role', 'prefill-note');
    var css = 'font-size:13.5px; line-height:1.45; color:#6A7088;';
    // Двухколоночные формы (например «Получить расчёт по тарифу»): без растяжки строка
    // заняла бы соседнюю ячейку и сдвинула поля вбок.
    try {
      if (window.getComputedStyle(kontejner).display === 'grid') css += ' grid-column:1 / -1;';
    } catch (e) { /* старые браузеры */ }
    note.setAttribute('style', css);
    /* «Они хранятся в вашем браузере» — обязательная часть фразы: без этих слов
       «Очистить» читается как «удалить меня из базы Alter», а заявка в amoCRM остаётся и
       менеджер позвонит. Это заблуждение о способе реализации прав (ст. 14 и ст. 9 ч. 2
       152-ФЗ), снимается одной фразой. */
    note.innerHTML = 'Подставили данные из прошлой заявки, они хранятся в вашем браузере. '
      + '<button type="button" data-role="prefill-clear" style="background:none; border:none; padding:0;'
      + ' font:inherit; color:#29B981; text-decoration:underline; cursor:pointer;">Не вы? Очистить</button>';
    note.querySelector('[data-role="prefill-clear"]').addEventListener('click', function () {
      ochistit();
    });
    kontejner.insertBefore(note, uzel);
  }

  /* Значение в контролируемое React-поле (компания на dc-страницах) нельзя просто
     положить в DOM: перерисовка его затрёт. Чистить его тоже надо через его состояние,
     поэтому пишем через нативный сеттер и шлём input, а компонент сам обнуляет и текст,
     и скрытые реквизиты. Пустой запрос подсказки не открывает (нужно минимум 2 знака). */
  function setReact(el, znachenie) {
    var setter = null;
    try {
      setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    } catch (e) { setter = null; }
    if (setter) setter.call(el, znachenie); else el.value = znachenie;
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* старые браузеры */ }
  }

  /* Человек начал заполнять форму сам: дальше в неё не лезем. Проверка по isTrusted, иначе
     событие от нашей же подстановки телефона сошло бы за ввод посетителя. */
  function watchUser(formEl) {
    if (formEl.getAttribute('data-prefill-watch') === '1') return;
    formEl.setAttribute('data-prefill-watch', '1');
    formEl.addEventListener('input', function (e) {
      if (e && e.isTrusted) formEl.setAttribute('data-prefill-user', '1');
    }, true);
  }

  function prefillForm(formEl, d) {
    // Признак формы заявки: в ней есть поле почты. Так подстановка не лезет в поиск по
    // витрине материалов, опрос на «спасибо» и прочие формы без контактных полей.
    if (!formEl.querySelector('input[type="email"]')) return;
    // Одноразового прохода тут быть не может: dc-рантайм досоздаёт часть полей позже
    // (компания на dc-страницах приезжает отдельным компонентом), и форма, помеченная
    // «уже заполнена», оставалась бы с пустым полем навсегда. Поэтому заходим повторно,
    // но только в пустые поля и только пока посетитель не начал заполнять сам.
    if (formEl.getAttribute('data-prefill-user') === '1') return;
    watchUser(formEl);

    var zapolneno = [];
    function put(el, v) {
      if (!el || !v || el.value) return;
      el.value = v;
      zapolneno.push(el);
    }

    put(nameInput(formEl), d.name);
    put(formEl.querySelector('input[type="email"]'), d.email);

    /* Компания. На промо-страницах поле обычное, туда пишем как в остальные. На
       dc-страницах это компонент CompanyAutocomplete с контролируемым value, и он
       подставляет название сам из той же записи (иначе перерисовка затирает). Здесь
       такое поле только учитываем: над ним может встать пометка, и «Очистить» должно
       его сбрасывать. */
    var comp = formEl.querySelector('input[name="company"]');
    if (comp) {
      if (!comp.value) put(comp, d.company);
      else if (comp.value === d.company && zapolneno.indexOf(comp) === -1) zapolneno.push(comp);
    }

    /* Телефон: пишем полный номер и помечаем поле. phone-intl приводит его к своей
       маске сам (готовое значение в поле он прогоняет через onInput при апгрейде), а
       метка нужна, чтобы он не посчитал нашу подстановку браузерным автозаполнением
       и не испортил цель b2b_phone_autofill. */
    var tel = formEl.querySelector('input[type="tel"]');
    if (tel && !tel.value && d.phone) {
      tel.setAttribute('data-alter-prefill', '1');
      put(tel, d.phone);
      if (tel.getAttribute('data-apm-init') === '1') {
        try { tel.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* старые браузеры */ }
      }
    }

    // Реквизиты из ЕГРЮЛ ставим только вместе с названием компании: иначе к вписанной
    // руками другой компании прицепился бы ИНН прошлой. Если человек правит название,
    // скрытые поля чистит сам виджет подсказок.
    if (d.company && d.inn) {
      var pary = [['company-inn', d.inn], ['company-address', d.companyAddress],
        ['company-okved', d.companyOkved], ['company-region', d.companyRegion]];
      for (var i = 0; i < pary.length; i++) {
        var el = formEl.querySelector('[data-role="' + pary[i][0] + '"]');
        if (el && !el.value && pary[i][1]) el.value = pary[i][1];
      }
    }

    putSelect(selectByOptions(formEl, /размер компании/i), d.companySize, zapolneno);
    putSelect(selectByOptions(formEl, /связаться/i), d.contactMethod, zapolneno);

    // Числа калькулятора ROI: с ними человек, вернувшийся за расчётом, сразу видит первый
    // шаг заполненным и жмёт «Продолжить», а не набирает те же три числа заново.
    for (var n = 0; n < ROI_INPUTS.length; n++) {
      put(formEl.querySelector('input[name="' + ROI_INPUTS[n] + '"]'), d[ROI_INPUTS[n]]);
    }

    if (!zapolneno.length) return;

    // Первое заполненное поле по порядку в разметке, а не по порядку подстановки: над ним
    // встанет строка-пометка.
    var pervyy = zapolneno[0];
    for (var p = 1; p < zapolneno.length; p++) {
      var pos = pervyy.compareDocumentPosition(zapolneno[p]);
      if (pos & 2 /* DOCUMENT_POSITION_PRECEDING */) pervyy = zapolneno[p];
    }

    prefillNote(formEl, pervyy, function () {
      try { localStorage.removeItem(PREFILL_KEY); } catch (e) { /* не критично */ }
      for (var i = 0; i < zapolneno.length; i++) {
        var el = zapolneno[i];
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else if (el.getAttribute('name') === 'company') setReact(el, '');
        else el.value = '';
        el.removeAttribute('data-alter-prefill');
      }
      var skrytye = formEl.querySelectorAll('[data-role^="company-"]');
      for (var k = 0; k < skrytye.length; k++) skrytye[k].value = '';
      var note = formEl.querySelector('[data-role="prefill-note"]');
      if (note && note.parentNode) note.parentNode.removeChild(note);
      // Дальше форма живёт как чистая: повторных проходов не будет, потому что запись из
      // хранилища удалена и следующий проход её просто не найдёт.
      var pervoe = nameInput(formEl) || formEl.querySelector('input[type="email"]');
      if (pervoe) try { pervoe.focus(); } catch (e) { /* не критично */ }
      if (window.alterGoal) window.alterGoal('b2b_prefill_cleared');
    });

    if (!prefillForm.tselOtpravlena) {
      prefillForm.tselOtpravlena = true;
      if (window.alterGoal) window.alterGoal('b2b_prefill_shown');
    }
  }

  /* Проход по формам делаем не один раз: dc-рантайм перерисовывает страницу после
     гидрации и сносит поставленные значения. Тот же приём, что в phone-intl.js:
     каждая мутация отодвигает проход на 60 мс, страховочный дедлайн 8 секунд. */
  function prefillStart() {
    if (!prefillRead()) return;
    var timer = null, deadline = null;

    function pass() {
      clearTimeout(timer); timer = null;
      clearTimeout(deadline); deadline = null;
      // Запись перечитываем на каждом проходе: после «Очистить» её уже нет, и проходы
      // сами собой прекращаются, ничего не восстанавливая.
      var d = prefillRead();
      if (!d) return;
      var formy = document.querySelectorAll('form');
      for (var i = 0; i < formy.length; i++) {
        try { prefillForm(formy[i], d); } catch (e) { /* одна форма не должна ломать остальные */ }
      }
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(pass, 60);
      if (!deadline) deadline = setTimeout(pass, 8000);
    }

    /* Первый проход сразу, а не через дебаунс: замер на боевой странице 17.08.2026 показал,
       что при холодной загрузке DOM не затихает секунды, и поля вставали к восьмой (по
       страховочному дедлайну). Поля, которые уже есть, заполняем немедленно, а наблюдатель
       остаётся для тех, что рантайм досоздаёт позже, и для перерисовок. */
    pass();
    if (window.MutationObserver) {
      new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    }
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prefillStart, { once: true });
  } else {
    prefillStart();
  }

  var MATERIAL_GOALS = {
    'psihologicheskaya-aptechka': 'b2b_lead_material_aptechka',
    'komanda-v-krizise': 'b2b_lead_material_krizis'
  };

  // Цели Метрики 1:1 с воронками amoCRM (LEAD_PIPELINE_MAP в worker.js), с префиксом b2b_ —
  // счётчик общий с B2C-отделом. 'roi' сюда намеренно не входит: это фоновая тихая заявка
  // калькулятора, для неё своя микро-цель b2b_roi_calculated в roi.html, не лид-цель.
  var LEAD_GOAL_TYPES = { demo: 1, diagnostic: 1, pilot: 1, price: 1, training: 1, material: 1 };
  // Основной продукт (демо/расчёт/пилот) — общая цель для подсчёта суммарного уникального
  // охвата по трём формам разом, без ручного сложения в отчётах.
  var CORE_PRODUCT_TYPES = { demo: 1, price: 1, pilot: 1 };

  // Типы заявок, после которых уводим на страницу «спасибо» (spasibo.html): опрос «откуда
  // узнали» + подборка материалов.
  // 'material' сюда включён 02.08: сам файл на странице не появляется — форма показывает
  // «Отправили на почту!», а письмо шлёт сейлсбот amoCRM по полю FORMNAME (97% доходят за
  // час, медиана 6 секунд). Значит увести со страницы нечего терять, а выиграть есть что:
  // это единственный гарантированный экран для сегмента, который писем не открывает.
  // 'roi' не входит — это фоновая тихая заявка калькулятора, у неё нет экрана «отправлено».
  // Отключить редирект на отдельной странице: window.ALTER_THANKYOU = false до отправки.
  var THANKYOU_TYPES = { demo: 1, diagnostic: 1, pilot: 1, price: 1, training: 1, material: 1 };

  /* ---------- индикатор ожидания на кнопке отправки ----------
     Между нажатием и переходом на «спасибо» проходит время: браузер ждёт ответа воркера,
     а тот — создания сделки в amoCRM. Без обратной связи кнопка выглядит нажатой впустую,
     и человек жмёт её повторно. Поэтому кнопку блокируем, а текст меняем на «Отправляем…»
     с точками-многоточием (CSS-анимация, без картинок и внешних файлов).
     Живёт здесь, а не в разметке страниц: так индикатор появляется сразу на всех формах. */
  var SPIN_CSS_ID = 'alter-submit-spin';

  function ensureSpinCss() {
    if (document.getElementById(SPIN_CSS_ID)) return;
    var st = document.createElement('style');
    st.id = SPIN_CSS_ID;
    st.textContent = '@keyframes alterSpin{to{transform:rotate(360deg)}}'
      + '.alter-sending{position:relative;opacity:.85;cursor:progress!important}'
      + '.alter-sending>.alter-spin{display:inline-block;width:1em;height:1em;margin-right:.55em;'
      + 'vertical-align:-0.15em;border:2px solid currentColor;border-right-color:transparent;'
      + 'border-radius:50%;animation:alterSpin .7s linear infinite}'
      + '@media (prefers-reduced-motion: reduce){.alter-sending>.alter-spin{animation-duration:2.4s}}';
    (document.head || document.documentElement).appendChild(st);
  }

  function findSubmitButton(formEl) {
    if (!formEl || !formEl.querySelector) return null;
    return formEl.querySelector('button[type="submit"]') || formEl.querySelector('button');
  }

  function startSending(formEl) {
    var btn = findSubmitButton(formEl);
    if (!btn || btn.dataset.alterSending === '1') return null;
    ensureSpinCss();
    btn.dataset.alterSending = '1';
    btn.dataset.alterLabel = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('alter-sending');
    btn.innerHTML = '<span class="alter-spin" aria-hidden="true"></span>Отправляем…';
    return btn;
  }

  // Возврат в исходное состояние нужен только при ошибке: при успехе страница уходит на
  // «спасибо», и трогать кнопку уже незачем — иначе она мигнёт прежним текстом перед уходом.
  function stopSending(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    btn.classList.remove('alter-sending');
    if (btn.dataset.alterLabel != null) btn.innerHTML = btn.dataset.alterLabel;
    delete btn.dataset.alterSending;
    delete btn.dataset.alterLabel;
  }

  var PENDING_KEY = 'alter_pending_lead_v1';

  /* Отправка с ожиданием ответа — прежнее поведение. Осталось для заявок без страницы
     «спасибо» (тихая заявка калькулятора) и как запасной путь, когда sessionStorage
     недоступен и передать заявку странице «спасибо» не через что. */
  function submitNow(payload, sendingBtn) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('CRM submit failed: HTTP ' + res.status);
      return res.json().catch(function () { return { ok: true }; });
    }).then(function (data) {
      if (LEAD_GOAL_TYPES[payload.formType] && window.alterGoal) {
        window.alterGoal('b2b_lead_' + payload.formType);
        if (payload.packageName) window.alterGoal('b2b_lead_package');
        if (CORE_PRODUCT_TYPES[payload.formType]) window.alterGoal('b2b_lead_sum');
        // Отдельная цель на конкретный материал — ПОВЕРХ общей b2b_lead_material, а не
        // вместо неё: так материал виден в отчётах сам по себе, а сравнение материалов
        // между собой и общий поток заявок не ломаются.
        //
        // Та же карта живёт в spasibo.html, и это не дубль. Заявки на материал обычно
        // уходят туда редиректом (THANKYOU_TYPES ниже), и цели шлёт «спасибо». Сюда
        // управление попадает только запасным путём: приватный режим браузера, где
        // sessionStorage недоступен и заявка отправляется отсюда, с ожиданием ответа.
        // Цель уходит один раз, в том месте, которое реально отправило заявку.
        // Держать обе карты в согласии.
        //
        // Цель Метрики — это конкретный идентификатор события, а не префикс, поэтому
        // каждый новый материал добавляется сюда и в setup-metrika-goals.py руками.
        var mg = MATERIAL_GOALS[payload.materialSlug];
        if (mg) window.alterGoal(mg);
      }
      return data;
    }).catch(function (err) {
      if (window.alterGoal) window.alterGoal('b2b_lead_error', { formType: payload.formType });
      stopSending(sendingBtn);
      throw err;
    });
  }

  /* ---------- регистрация мимо amoCRM: строка в Google-таблицу ----------

     Совместные вебинары с партнёром: базу участников ведём в таблице и делим с
     партнёром после эфира, сделок в CRM по ним не заводим. Поля читаются тем же
     readForm и той же alterTracking, что и заявки, — чтобы метки и данные компании
     из ЕГРЮЛ собирались один раз и одинаково. Запись делает воркер
     (/api/sheet-lead), ключ сервисного аккаунта Google в браузер не попадает.

     Ответ ждём: строка в таблице пишется за десятые доли секунды (в отличие от
     сделки в amoCRM, которая идёт 2–22 с), и держать человека на странице ради
     этого не жалко — зато он видит настоящую ошибку, если запись не прошла. */
  var SHEET_ENDPOINT = ENDPOINT.replace(/\/+$/, '') + '/api/sheet-lead';

  window.alterSubmitSheet = function (formEl, extra) {
    var payload;
    try {
      payload = readForm(formEl, 'training');
      if (extra) {
        for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) payload[k] = extra[k]; }
      }
    } catch (err) {
      if (window.alterGoal) window.alterGoal('b2b_lead_error', { formType: 'vebinar' });
      return Promise.reject(err);
    }
    var sendingBtn = startSending(formEl);
    prefillSave(payload, formEl);

    return fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('Sheet submit failed: HTTP ' + res.status);
      return res.json().catch(function () { return { ok: true }; });
    }).then(function (data) {
      if (data && data.ok === false) throw new Error(data.error || 'Sheet submit failed');
      // Отдельная цель, не общая b2b_lead_training: эти регистрации до amoCRM не
      // доезжают, и подмешивать их к заявкам на тренинги значит разойтись с CRM.
      if (window.alterGoal) window.alterGoal('b2b_lead_vebinar', { vebinar: payload.formId || '' });
      return data;
    }).catch(function (err) {
      if (window.alterGoal) window.alterGoal('b2b_lead_error', { formType: 'vebinar' });
      stopSending(sendingBtn);
      throw err;
    });
  };

  window.alterSubmitLead = function (formEl, formType, extra) {
    var payload;
    try {
      payload = readForm(formEl, formType || 'demo');
      if (extra) {
        for (var k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) payload[k] = extra[k]; }
      }
    } catch (err) {
      if (window.alterGoal) window.alterGoal('b2b_lead_error', { formType: formType || 'demo' });
      return Promise.reject(err);
    }
    var sendingBtn = startSending(formEl);
    /* Запоминаем введённое в момент отправки, а не после ответа воркера: форма уже
       прошла проверку, а ответа мы в половине случаев не ждём вовсе (уход на «спасибо»). */
    prefillSave(payload, formEl);

    /* Формы, у которых есть страница «спасибо», отправляются НЕ отсюда. Замер 03.08.2026:
       круг «нажал → ответ воркера» занимает 1,8–2,6 с, и почти всё это — создание сделки в
       amoCRM. Заставлять человека смотреть на кнопку всё это время незачем: заявка уже
       собрана и проверена, а результат отправки ему не показывают в любом случае.
       Поэтому кладём заявку в sessionStorage и уходим на «спасибо» сразу, а сама отправка
       происходит уже там, пока человек читает страницу.

       Цели Метрики переехали туда же: их шлёт страница «спасибо» в момент показа, рядом с
       b2b_thankyou_view. Раньше она ждала ответа воркера, чтобы не считать конверсией
       недоехавшие заявки, но ответ идёт 2–22 секунды, и ушедшие раньше терялись целиком
       (за 11–14.08 79 заявок в amoCRM против 46 целей). Неудачные отправки по-прежнему
       видны отдельной целью b2b_lead_error. */
    if (THANKYOU_TYPES[payload.formType] && window.ALTER_THANKYOU !== false) {
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({ payload: payload, ts: Date.now() }));
      } catch (e) {
        // Приватный режим: положить заявку некуда — отправляем по-старому, с ожиданием.
        return submitNow(payload, sendingBtn);
      }
      location.href = thankYouUrl(payload.formType);
      // Цепочку обрываем: обработчик страницы не должен показать свою старую плашку
      // «Заявка отправлена!» поверх перехода.
      return new Promise(function () { });
    }

    return submitNow(payload, sendingBtn);
  };
})();
