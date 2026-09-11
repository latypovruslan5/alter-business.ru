/* Международная маска телефона для форм сайта — аналог тильдовской, но без внешних запросов.

   Что делает: рядом с полем `tel` рисует селектор страны (флаг + код), подставляет формат
   номера этой страны и раскладывает ввод по маске. Полный номер (`код + пробел + локальная
   часть`) кладётся в атрибут `data-phone-full` того же поля — оттуда его берёт crm-submit.js.

   Как определяется страна. У Тильды это запрос к geo.tildaapi.com — геолокация по IP. В России
   VPN массовый, а VPN подменяет именно IP: с включённым VPN тильдовская форма подставляет
   Нидерланды вместо +7. Часовой пояс системы VPN не меняет, поэтому здесь страна берётся из
   `Intl.DateTimeFormat().resolvedOptions().timeZone` (таблица IANA zone.tab), запасной сигнал —
   регион из `navigator.language`, дальше — ru. Ручной выбор посетителя запоминается в
   localStorage и имеет приоритет. Сетевых запросов ноль.

   Список стран, форматы масок и спрайт флагов — из тильдовского tilda-phone-mask-1.1.js,
   спрайт лежит у нас (assets/flags.png), внешних зависимостей нет.

   Подключается ко всем `input[type=tel]` на странице, где стоит `<script src="phone-intl.js">`.
   Отдельное поле можно оставить без селектора страны атрибутом `data-phone-plain`. Пока скрипт
   на странице есть, простая маска +7 из phone-mask.js для телефонов отключается (там остаётся
   только проверка почты). Апгрейд идемпотентный и переживает ре-рендер dc-runtime за счёт
   MutationObserver. */
(function () {
  'use strict';

  /* Флаг для phone-mask.js: на этой странице телефоны ведёт международная маска.
     Ставится сразу при загрузке, до апгрейда полей, — иначе старая маска успела бы
     вмешаться в первые секунды. */
  window.__alterPhoneIntl = true;

  /* ---------- данные ---------- */

  /* iso -> [название, код, полная маска]. Маска: 0 — место под цифру, остальное — литералы. */
  var COUNTRIES = {
    "af": ["Afghanistan (افغانستان)", "+93", "+93-00-000-0000"],
    "al": ["Albania (Shqipëri)", "+355", "+355(000) 000-000"],
    "dz": ["Algeria (الجزائر)", "+213", "+213-00-000-0000"],
    "ad": ["Andorra", "+376", "+376-000-000"],
    "ao": ["Angola", "+244", "+244(000) 000-000"],
    "am": ["Armenia (Հայաստան)", "+374", "+374-00-000-000"],
    "ag": ["Antigua and Barbuda", "+1 (268)", "+1 (268)000-0000"],
    "ar": ["Argentina", "+54", "+54(000) 0000-0000"],
    "au": ["Australia", "+61", "+61-00-0000-0000"],
    "at": ["Austria (Österreich)", "+43", "+43(000) 000-00000"],
    "az": ["Azerbaijan (Azərbaycan)", "+994", "+994-00-000-00-00"],
    "bs": ["Bahamas", "+1 (242)", "+1 (242)000-0000"],
    "bh": ["Bahrain (البحرين)", "+973", "+973-0000-0000"],
    "bd": ["Bangladesh (বাংলাদেশ)", "+880", "+880-0000-000000"],
    "bb": ["Barbados", "+1 (246)", "+1 (246)000-0000"],
    "by": ["Belarus (Беларусь)", "+375", "+375(00) 000-00-00"],
    "be": ["Belgium (België)", "+32", "+32(000) 000-000"],
    "bz": ["Belize", "+501", "+501-000-0000"],
    "bj": ["Benin (Bénin)", "+229", "+229-00-00-0000"],
    "bt": ["Bhutan (འབྲུག)", "+975", "+975-0-000-0000"],
    "bo": ["Bolivia", "+591", "+591-0-000-0000"],
    "ba": ["Bosnia and Herzegovina", "+387", "+387-00-000-0000"],
    "bw": ["Botswana", "+267", "+267-00-000-000"],
    "br": ["Brazil (Brasil)", "+55", "+55(00) 00000-0000"],
    "bn": ["Brunei", "+673", "+673-000-0000"],
    "bg": ["Bulgaria (България)", "+359", "+359(000) 000-000"],
    "bf": ["Burkina Faso", "+226", "+226-00-00-0000"],
    "bi": ["Burundi (Uburundi)", "+257", "+257-00-00-0000"],
    "kh": ["Cambodia (កម្ពុជា)", "+855", "+855-00-000-000"],
    "cm": ["Cameroon (Cameroun)", "+237", "+237-0-00-00-00-00"],
    "ca": ["Canada", "+1", "+1(000) 000-0000"],
    "cv": ["Cape Verde (Kabu Verdi)", "+238", "+238(000) 00-00"],
    "bq": ["Caribbean Netherlands", "+599", "+599-0-000-0000"],
    "ky": ["Cayman Islands", "+1", "+1(000) 000-0000"],
    "cf": ["Central African Republic (République centrafricaine)", "+236", "+236-00-00-0000"],
    "td": ["Chad (Tchad)", "+235", "+235-00-00-00-00"],
    "cl": ["Chile", "+56", "+56-0-0000-0000"],
    "cn": ["China (中国)", "+86", "+86(000) 0000-0000"],
    "co": ["Colombia", "+57", "+57(000) 000-0000"],
    "km": ["Comoros (جزر القمر)", "+269", "+269-00-00000"],
    "cd": ["Congo (DRC) (Jamhuri ya Kidemokrasia ya Kongo)", "+243", "+243(000) 000-000"],
    "cg": ["Congo (Republic) (Congo-Brazzaville)", "+242", "+242-00-000-0000"],
    "ck": ["Cook Islands", "+682", "+682-00-000"],
    "cr": ["Costa Rica", "+506", "+506-0000-0000"],
    "ci": ["Cote d’Ivoire", "+225", "+225-00-00-00-0000"],
    "hr": ["Croatia (Hrvatska)", "+385", "+385-00-000-0000"],
    "cu": ["Cuba", "+53", "+53-0-000-0000"],
    "cy": ["Cyprus (Κύπρος)", "+357", "+357-00-000-000"],
    "cz": ["Czech Republic (Česká republika)", "+420", "+420(000) 000-000"],
    "dk": ["Denmark (Danmark)", "+45", "+45-00-00-00-00"],
    "dj": ["Djibouti", "+253", "+253-00-00-00-00"],
    "dm": ["Dominica", "+1 (767)", "+1 (767)000-0000"],
    "do": ["Dominican Republic (República Dominicana)", "+1", "+1(000) 000-0000"],
    "ec": ["Ecuador", "+593", "+593-00-000-0000"],
    "eg": ["Egypt (مصر)", "+20", "+20(000) 000-0000"],
    "sv": ["El Salvador", "+503", "+503-00-00-0000"],
    "gq": ["Equatorial Guinea (Guinea Ecuatorial)", "+240", "+240-00-000-0000"],
    "er": ["Eritrea", "+291", "+291-0-000-000"],
    "ee": ["Estonia (Eesti)", "+372", "+372-0000-0000"],
    "et": ["Ethiopia", "+251", "+251-00-000-0000"],
    "fj": ["Fiji", "+679", "+679-000-0000"],
    "fi": ["Finland (Suomi)", "+358", "+358-000-0000000"],
    "fr": ["France", "+33", "+33(000) 00-00-00"],
    "ga": ["Gabon", "+241", "+241-0-00-00-00"],
    "gm": ["Gambia", "+220", "+220(000) 00-00"],
    "ge": ["Georgia (საქართველო)", "+995", "+995(000) 000-000"],
    "de": ["Germany (Deutschland)", "+49", "+49(000) 000-000000"],
    "gh": ["Ghana (Gaana)", "+233", "+233(000) 000-000"],
    "gr": ["Greece (Ελλάδα)", "+30", "+30(000) 000-0000"],
    "gd": ["Grenada", "+1 (473)", "+1 (473)000-0000"],
    "gt": ["Guatemala", "+502", "+502-0-000-0000"],
    "gn": ["Guinea (Guinée)", "+224", "+224-000-00-00-00"],
    "gw": ["Guinea-Bissau (Guiné Bissau)", "+245", "+245-0-000000"],
    "gy": ["Guyana", "+592", "+592-000-0000"],
    "ht": ["Haiti", "+509", "+509-00-00-0000"],
    "hn": ["Honduras", "+504", "+504-0000-0000"],
    "hk": ["Hong Kong (香港)", "+852", "+852-0000-0000"],
    "hu": ["Hungary (Magyarország)", "+36", "+36(000) 000-000"],
    "is": ["Iceland (Ísland)", "+354", "+354-000-0000"],
    "in": ["India (भारत)", "+91", "+91(0000) 000-000"],
    "id": ["Indonesia", "+62", "+62(000) 000-00-0000"],
    "ir": ["Iran (ایران)", "+98", "+98(000) 000-0000"],
    "iq": ["Iraq (العراق)", "+964", "+964(000) 000-0000"],
    "ie": ["Ireland", "+353", "+353(000) 000-000"],
    "il": ["Israel (ישראל)", "+972", "+972-000-000-0000"],
    "it": ["Italy (Italia)", "+39", "+39(000) 0000-000"],
    "jm": ["Jamaica", "+1", "+1(000) 000-0000"],
    "jp": ["Japan (日本)", "+81", "+81-00-0000-0000"],
    "jo": ["Jordan (الأردن)", "+962", "+962-0-0000-0000"],
    "kz": ["Kazakhstan (Казахстан)", "+7", "+7(000) 000-00-00"],
    "ke": ["Kenya", "+254", "+254-000-000000"],
    "ki": ["Kiribati", "+686", "+686-0000-0000"],
    "xk": ["Kosovo (Republic)", "+383", "+383-00-000-000"],
    "kw": ["Kuwait (الكويت)", "+965", "+965-0000-0000"],
    "kg": ["Kyrgyzstan (Кыргызстан)", "+996", "+996(000) 000-000"],
    "la": ["Laos (ລາວ)", "+856", "+856-00-000-000"],
    "lv": ["Latvia (Latvija)", "+371", "+371-00-000-000"],
    "lb": ["Lebanon (لبنان)", "+961", "+961-00-000-000"],
    "ls": ["Lesotho", "+266", "+266-0-000-0000"],
    "lr": ["Liberia", "+231", "+231-00-000-0000"],
    "ly": ["Libya (ليبيا)", "+218", "+218-00-000-000"],
    "li": ["Liechtenstein", "+423", "+423-000-00-00"],
    "lt": ["Lithuania (Lietuva)", "+370", "+370(000) 00-000"],
    "lu": ["Luxembourg", "+352", "+352(000) 000-000"],
    "mo": ["Macao", "+853", "+853-0000-0000"],
    "mk": ["Macedonia (FYROM) (Македонија)", "+389", "+389-00-000-000"],
    "mg": ["Madagascar (Madagasikara)", "+261", "+261-00-00-00000"],
    "mw": ["Malawi", "+265", "+265-0-0000-0000"],
    "my": ["Malaysia", "+60", "+60-00-0000-0000"],
    "mv": ["Maldives", "+960", "+960-000-0000"],
    "ml": ["Mali", "+223", "+223-00-00-0000"],
    "mt": ["Malta", "+356", "+356-0000-0000"],
    "mh": ["Marshall Islands", "+692", "+692-000-0000"],
    "mr": ["Mauritania (موريتانيا)", "+222", "+222-00-00-0000"],
    "mu": ["Mauritius (Moris)", "+230", "+230-000-00000"],
    "mx": ["Mexico (México)", "+52", "+52(000) 000-0000"],
    "mb": ["Mexico (México)", "+521", "+521(000) 000-0000"],
    "fm": ["Micronesia", "+691", "+691-000-0000"],
    "md": ["Moldova (Republica Moldova)", "+373", "+373-0000-0000"],
    "mc": ["Monaco", "+377", "+377-00-000-000"],
    "mn": ["Mongolia (Монгол)", "+976", "+976-00-00-0000"],
    "me": ["Montenegro (Crna Gora)", "+382", "+382-00-000-000"],
    "ma": ["Morocco (المغرب)", "+212", "+212-00-0000-000"],
    "mz": ["Mozambique (Moçambique)", "+258", "+258-000-000-000"],
    "mm": ["Myanmar (Burma) (မြန်မာ)", "+95", "+95-00-000-000"],
    "na": ["Namibia (Namibië)", "+264", "+264-00-000-0000"],
    "nr": ["Nauru", "+674", "+674-000-0000"],
    "np": ["Nepal (नेपाल)", "+977", "+977-000-000-0000"],
    "nl": ["Netherlands (Nederland)", "+31", "+31-00-000-0000"],
    "nc": ["New Caledonia", "+687", "+687 00-00-00"],
    "nz": ["New Zealand", "+64", "+64(000)000-0000"],
    "ni": ["Nicaragua", "+505", "+505-0000-0000"],
    "ne": ["Niger (Nijar)", "+227", "+227-00-00-0000"],
    "ng": ["Nigeria", "+234", "+234-000-000-0000"],
    "nu": ["Niue", "+683", "+683-0000"],
    "kp": ["North Korea (조선 민주주의 인민 공화국)", "+850", "+850-00-000-000"],
    "no": ["Norway (Norge)", "+47", "+47(000) 00-000"],
    "om": ["Oman (عُمان)", "+968", "+968-00-000-000"],
    "pa": ["Panama", "+507", "+507-0000-0000"],
    "pk": ["Pakistan (پاکستان)", "+92", "+92(000) 000-0000"],
    "pw": ["Palau", "+680", "+680-000-0000"],
    "ps": ["Palestinian Territory", "+970", "+970-00 000 0000"],
    "pg": ["Papua New Guinea", "+675", "+675(000) 00-000"],
    "py": ["Paraguay", "+595", "+595(000) 000-000"],
    "pe": ["Peru (Perú)", "+51", "+51(000) 000-000"],
    "ph": ["Philippines", "+63", "+63(000) 000-0000"],
    "pl": ["Poland (Polska)", "+48", "+48(000) 000-000"],
    "pt": ["Portugal", "+351", "+351-00-000-0000"],
    "qa": ["Qatar (قطر)", "+974", "+974-0000-0000"],
    "ro": ["Romania (România)", "+40", "+40-00-000-0000"],
    "ru": ["Russian Federation (Российская Федерация)", "+7", "+7(000) 000-00-00"],
    "rw": ["Rwanda", "+250", "+250(000) 000-000"],
    "kn": ["Saint Kitts and Nevis", "+1 (869)", "+1 (869)000-0000"],
    "lc": ["Saint Lucia", "+1 (758)", "+1 (758)000-0000"],
    "vc": ["Saint Vincent and the Grenadines", "+1 (784)", "+1 (784)000-0000"],
    "ws": ["Samoa", "+685", "+685-00-0000"],
    "sm": ["San Marino", "+378", "+378-0000-000000"],
    "st": ["Sao Tome and Principe (São Tomé e Príncipe)", "+239", "+239-00-00000"],
    "sa": ["Saudi Arabia (المملكة العربية السعودية)", "+966", "+966-0-0000-0000"],
    "sn": ["Senegal (Sénégal)", "+221", "+221-00-000-0000"],
    "rs": ["Serbia (Србија)", "+381", "+381-00-000-0000"],
    "sc": ["Seychelles", "+248", "+248-0-000-000"],
    "sl": ["Sierra Leone", "+232", "+232-00-000000"],
    "sg": ["Singapore", "+65", "+65-0000-0000"],
    "sk": ["Slovakia (Slovensko)", "+421", "+421(000) 000-000"],
    "si": ["Slovenia (Slovenija)", "+386", "+386-00-000-000"],
    "sb": ["Solomon Islands", "+677", "+677-000-0000"],
    "so": ["Somalia (Soomaaliya)", "+252", "+252-000-000-000"],
    "za": ["South Africa", "+27", "+27-00-000-0000"],
    "kr": ["South Korea (대한민국)", "+82", "+82-00-0000-0000"],
    "ss": ["South Sudan (جنوب السودان)", "+211", "+211-00-000-0000"],
    "es": ["Spain (España)", "+34", "+34(000) 000-000"],
    "lk": ["Sri Lanka (ශ්‍රී ලංකාව)", "+94", "+94-00-000-0000"],
    "sd": ["Sudan (السودان)", "+249", "+249-00-000-0000"],
    "sr": ["Suriname", "+597", "+597-000-0000"],
    "sz": ["Swaziland", "+268", "+268-00-00-0000"],
    "se": ["Sweden (Sverige)", "+46", "+46-00-000-0000"],
    "ch": ["Switzerland (Schweiz)", "+41", "+41-00-000-0000"],
    "sy": ["Syria (سوريا)", "+963", "+963-00-0000-000"],
    "tw": ["Taiwan (台灣)", "+886", "+886-0000-0000"],
    "tj": ["Tajikistan", "+992", "+992-00-000-0000"],
    "tz": ["Tanzania", "+255", "+255-00-000-0000"],
    "th": ["Thailand (ไทย)", "+66", "+66-00-000-0000"],
    "tg": ["Togo", "+228", "+228-00-000-000"],
    "to": ["Tonga", "+676", "+676-00000"],
    "tt": ["Trinidad and Tobago", "+1 (868)", "+1 (868)000-0000"],
    "tn": ["Tunisia (تونس)", "+216", "+216-00-000-000"],
    "tr": ["Turkey (Türkiye)", "+90", "+90(000) 000-0000"],
    "tm": ["Turkmenistan", "+993", "+993-0-000-0000"],
    "tv": ["Tuvalu", "+688", "+688-000000"],
    "ug": ["Uganda", "+256", "+256(000) 000-000"],
    "ua": ["Ukraine (Україна)", "+380", "+380(00) 000-00-00"],
    "ae": ["United Arab Emirates (الإمارات العربية المتحدة)", "+971", "+971-00-000-00000"],
    "gb": ["United Kingdom", "+44", "+44-00-0000-00000"],
    "us": ["USA", "+1", "+1(000) 000-0000"],
    "uy": ["Uruguay", "+598", "+598-0-000-00-00"],
    "uz": ["Uzbekistan (Oʻzbekiston)", "+998", "+998-00-000-0000"],
    "vu": ["Vanuatu", "+678", "+678-00-00000"],
    "va": ["Vatican City (Città del Vaticano)", "+39", "+39-0-000-00000"],
    "ve": ["Venezuela", "+58", "+58(000) 000-0000"],
    "vn": ["Vietnam (Việt Nam)", "+84", "+84-00-0000-000"],
    "ye": ["Yemen (اليمن)", "+967", "+967-0-000-000"],
    "zm": ["Zambia", "+260", "+260-00-000-0000"],
    "zw": ["Zimbabwe", "+263", "+263-0-00-0000000"],
    "gp": ["Guadeloupe", "+590", "+590-000-00-00-00"]
  };

  /* iso -> смещение во флаговом спрайте, "x,y" в пикселях */
  var FLAGS = parsePairs("ad:5,5 ae:33,5 af:61,5 ag:89,5 al:117,5 am:145,5 ao:173,5 ar:201,5 at:229,5 au:257,5 az:285,5 ba:313,5 bb:5,28 bd:33,28 be:61,28 bf:89,28 bg:117,28 bh:145,28 bi:173,28 bj:201,28 bm:229,28 bn:257,28 bo:285,28 bq:89,258 br:313,28 bs:5,51 bt:33,51 bw:61,51 by:89,51 bz:117,51 ca:145,51 ky:367,28 cd:173,51 cf:201,51 cg:229,51 ch:257,51 ci:285,51 ck:313,51 cl:5,74 cm:33,74 cn:61,74 co:89,74 cr:117,74 cu:145,74 cv:173,74 cz:229,74 cy:201,74 de:257,74 dj:285,74 dk:313,74 dm:5,97 do:33,97 dz:61,97 ec:89,97 ee:117,97 eg:145,97 eh:173,97 er:201,97 es:229,97 et:257,97 fi:285,97 fj:313,97 fm:5,120 fr:33,120 ga:61,120 gb:89,120 gd:117,120 ge:145,120 gh:173,120 gm:201,120 gn:229,120 gq:257,120 gr:285,120 gt:313,120 gw:5,143 gy:33,143 hk:61,143 hn:89,143 hr:117,143 ht:145,143 hu:173,143 id:201,143 ie:229,143 il:257,143 in:285,143 iq:313,143 ir:5,166 is:33,166 it:61,166 jm:89,166 jo:117,166 jp:145,166 ke:173,166 kg:201,166 kh:229,166 ki:257,166 km:285,166 kn:313,166 kp:5,189 kr:33,189 ks:61,189 kw:89,189 kz:117,189 la:145,189 lb:173,189 lc:201,189 li:229,189 lk:257,189 lr:285,189 ls:313,189 lt:5,212 lu:33,212 lv:61,212 ly:89,212 ma:117,212 mc:145,212 md:173,212 me:201,212 mg:229,212 mh:257,212 mk:285,212 ml:313,212 mm:5,235 mn:33,235 mo:61,235 mr:89,235 mt:117,235 mu:145,235 mv:173,235 mw:201,235 mb:229,235 mx:229,235 my:257,235 mz:285,235 na:313,235 ne:5,258 ng:33,258 ni:61,258 nl:89,258 no:117,258 np:341,5 nr:145,258 nu:173,258 nc:229,350 nz:201,258 om:229,258 pa:257,258 pe:285,258 pg:313,258 ph:5,281 pk:33,281 pl:61,281 ps:89,281 pt:117,281 pw:145,281 py:173,281 qa:201,281 ro:229,281 rs:257,281 ru:285,281 rw:313,281 sa:5,304 sb:33,304 sc:61,304 sd:89,304 se:117,304 sg:145,304 si:173,304 sk:201,304 sl:229,304 sm:257,304 sn:285,304 so:313,304 sr:5,327 ss:33,327 st:61,327 sv:89,327 sy:117,327 sz:145,327 td:173,327 tg:201,327 th:229,327 tj:257,327 tl:285,327 tm:313,327 tn:367,5 to:341,28 tr:341,51 tt:341,74 tv:341,97 tw:341,120 tz:341,143 ua:341,166 ug:341,189 us:341,212 uy:341,235 uz:341,258 va:341,281 vc:341,304 ve:341,327 vn:5,350 vu:33,350 ws:61,350 xk:89,350 ye:117,350 za:145,350 zm:173,350 zw:201,350 gp:367,51");

  /* Часовые пояса IANA: "iso>ЗОНА ЗОНА;iso>…", у зоны первый символ — индекс в REGIONS */
  var REGIONS = ['Africa', 'America', 'Antarctica', 'Arctic', 'Asia', 'Atlantic', 'Australia', 'Europe', 'Indian', 'Pacific'];
  var TZ_PACKED = "ad>7Andorra;ae>4Dubai;af>4Kabul;ag>1Antigua;ai>1Anguilla;al>7Tirane;am>4Yerevan;ao>0Luanda;aq>2McMurdo 2Casey 2Davis 2DumontDUrville 2Mawson 2Palmer 2Rothera 2Syowa 2Troll 2Vostok;ar>1Argentina/Buenos_Aires 1Argentina/Cordoba 1Argentina/Salta 1Argentina/Jujuy 1Argentina/Tucuman 1Argentina/Catamarca 1Argentina/La_Rioja 1Argentina/San_Juan 1Argentina/Mendoza 1Argentina/San_Luis 1Argentina/Rio_Gallegos 1Argentina/Ushuaia 1Buenos_Aires 1Catamarca 1Cordoba 1Jujuy 1Mendoza 1Argentina/ComodRivadavia 1Rosario;as>9Pago_Pago 9Samoa;at>7Vienna;au>6Lord_Howe 2Macquarie 6Hobart 6Melbourne 6Sydney 6Broken_Hill 6Brisbane 6Lindeman 6Adelaide 6Darwin 6Perth 6Eucla 6ACT 6LHI 6NSW 6North 6Queensland 6South 6Tasmania 6Victoria 6West 6Yancowinna 6Canberra 6Currie;aw>1Aruba;ax>7Mariehamn;az>4Baku;ba>7Sarajevo;bb>1Barbados;bd>4Dhaka 4Dacca;be>7Brussels;bf>0Ouagadougou;bg>7Sofia;bh>4Bahrain;bi>0Bujumbura;bj>0Porto-Novo;bl>1St_Barthelemy;bm>5Bermuda;bn>4Brunei;bo>1La_Paz;bq>1Kralendijk;br>1Noronha 1Belem 1Fortaleza 1Recife 1Araguaina 1Maceio 1Bahia 1Sao_Paulo 1Campo_Grande 1Cuiaba 1Santarem 1Porto_Velho 1Boa_Vista 1Manaus 1Eirunepe 1Rio_Branco 1Porto_Acre;bs>1Nassau;bt>4Thimphu 4Thimbu;bw>0Gaborone;by>7Minsk;bz>1Belize;ca>1St_Johns 1Halifax 1Glace_Bay 1Moncton 1Goose_Bay 1Blanc-Sablon 1Toronto 1Iqaluit 1Atikokan 1Winnipeg 1Resolute 1Rankin_Inlet 1Regina 1Swift_Current 1Edmonton 1Cambridge_Bay 1Inuvik 1Vancouver 1Creston 1Dawson_Creek 1Fort_Nelson 1Whitehorse 1Dawson 1Montreal 1Nipigon 1Pangnirtung 1Rainy_River 1Thunder_Bay 1Yellowknife;cc>8Cocos;cd>0Kinshasa 0Lubumbashi;cf>0Bangui;cg>0Brazzaville;ch>7Zurich;ci>0Abidjan 0Timbuktu;ck>9Rarotonga;cl>1Santiago 1Coyhaique 1Punta_Arenas 9Easter;cm>0Douala;cn>4Shanghai 4Urumqi 4Chongqing 4Harbin 4Kashgar 4Chungking;co>1Bogota;cr>1Costa_Rica;cu>1Havana;cv>5Cape_Verde;cw>1Curacao;cx>8Christmas;cy>4Nicosia 4Famagusta 7Nicosia;cz>7Prague;de>7Berlin 7Busingen 5Jan_Mayen;dj>0Djibouti;dk>7Copenhagen;dm>1Dominica;do>1Santo_Domingo;dz>0Algiers;ec>1Guayaquil 9Galapagos;ee>7Tallinn;eg>0Cairo;eh>0El_Aaiun;er>0Asmara;es>7Madrid 0Ceuta 5Canary;et>0Addis_Ababa;fi>7Helsinki;fj>9Fiji;fk>5Stanley;fm>9Chuuk 9Pohnpei 9Kosrae;fo>5Faroe 5Faeroe;fr>7Paris;ga>0Libreville;gb>7London 7Belfast;gd>1Grenada;ge>4Tbilisi;gf>1Cayenne;gg>7Guernsey;gh>0Accra;gi>7Gibraltar;gl>1Nuuk 1Danmarkshavn 1Scoresbysund 1Thule 1Godthab;gm>0Banjul;gn>0Conakry;gp>1Guadeloupe;gq>0Malabo;gr>7Athens;gs>5South_Georgia;gt>1Guatemala;gu>9Guam;gw>0Bissau;gy>1Guyana;hk>4Hong_Kong;hn>1Tegucigalpa;hr>7Zagreb;ht>1Port-au-Prince;hu>7Budapest;id>4Jakarta 4Pontianak 4Makassar 4Jayapura 4Ujung_Pandang;ie>7Dublin;il>4Jerusalem 4Tel_Aviv;im>7Isle_of_Man;in>4Kolkata 4Calcutta;io>8Chagos;iq>4Baghdad;ir>4Tehran;is>5Reykjavik;it>7Rome;je>7Jersey;jm>1Jamaica;jo>4Amman;jp>4Tokyo;ke>0Nairobi 0Asmera;kg>4Bishkek;kh>4Phnom_Penh;ki>9Tarawa 9Kanton 9Kiritimati 9Enderbury;km>8Comoro;kn>1St_Kitts;kp>4Pyongyang;kr>4Seoul;kw>4Kuwait;ky>1Cayman;kz>4Almaty 4Qyzylorda 4Qostanay 4Aqtobe 4Aqtau 4Atyrau 4Oral;la>4Vientiane;lb>4Beirut;lc>1St_Lucia;li>7Vaduz;lk>4Colombo;lr>0Monrovia;ls>0Maseru;lt>7Vilnius;lu>7Luxembourg;lv>7Riga;ly>0Tripoli;ma>0Casablanca;mc>7Monaco;md>7Chisinau 7Tiraspol;me>7Podgorica;mf>1Marigot;mg>8Antananarivo;mh>9Majuro 9Kwajalein;mk>7Skopje;ml>0Bamako;mm>4Yangon 4Rangoon;mn>4Ulaanbaatar 4Hovd 4Choibalsan 4Ulan_Bator;mo>4Macau 4Macao;mp>9Saipan;mq>1Martinique;mr>0Nouakchott;ms>1Montserrat;mt>7Malta;mu>8Mauritius;mv>8Maldives;mw>0Blantyre;mx>1Mexico_City 1Cancun 1Merida 1Monterrey 1Matamoros 1Chihuahua 1Ciudad_Juarez 1Ojinaga 1Mazatlan 1Bahia_Banderas 1Hermosillo 1Tijuana 1Ensenada 1Santa_Isabel;my>4Kuala_Lumpur 4Kuching;mz>0Maputo;na>0Windhoek;nc>9Noumea;ne>0Niamey;nf>9Norfolk;ng>0Lagos;ni>1Managua;nl>7Amsterdam;no>7Oslo;np>4Kathmandu 4Katmandu;nr>9Nauru;nu>9Niue;nz>9Auckland 9Chatham 2South_Pole;om>4Muscat;pa>1Panama 1Coral_Harbour;pe>1Lima;pf>9Tahiti 9Marquesas 9Gambier;pg>9Port_Moresby 9Bougainville 9Yap 9Truk;ph>4Manila;pk>4Karachi;pl>7Warsaw;pm>1Miquelon;pn>9Pitcairn;pr>1Puerto_Rico 1Virgin;ps>4Gaza 4Hebron;pt>7Lisbon 5Madeira 5Azores;pw>9Palau;py>1Asuncion;qa>4Qatar;re>8Reunion;ro>7Bucharest;rs>7Belgrade;ru>7Kaliningrad 7Moscow 7Kirov 7Volgograd 7Astrakhan 7Saratov 7Ulyanovsk 7Samara 4Yekaterinburg 4Omsk 4Novosibirsk 4Barnaul 4Tomsk 4Novokuznetsk 4Krasnoyarsk 4Irkutsk 4Chita 4Yakutsk 4Khandyga 4Vladivostok 4Ust-Nera 4Magadan 4Sakhalin 4Srednekolymsk 4Kamchatka 4Anadyr;rw>0Kigali;sa>4Riyadh;sb>9Guadalcanal 9Ponape;sc>8Mahe;sd>0Khartoum;se>7Stockholm;sg>4Singapore;sh>5St_Helena;si>7Ljubljana;sj>3Longyearbyen;sk>7Bratislava;sl>0Freetown;sm>7San_Marino;sn>0Dakar;so>0Mogadishu;sr>1Paramaribo;ss>0Juba;st>0Sao_Tome;sv>1El_Salvador;sx>1Lower_Princes;sy>4Damascus;sz>0Mbabane;tc>1Grand_Turk;td>0Ndjamena;tf>8Kerguelen;tg>0Lome;th>4Bangkok;tj>4Dushanbe;tk>9Fakaofo;tl>4Dili;tm>4Ashgabat 4Ashkhabad;tn>0Tunis;to>9Tongatapu;tr>7Istanbul 4Istanbul;tt>1Port_of_Spain;tv>9Funafuti;tw>4Taipei;tz>0Dar_es_Salaam;ua>7Simferopol 7Kyiv 7Uzhgorod 7Zaporozhye 7Kiev;ug>0Kampala;um>9Midway 9Wake;us>1New_York 1Detroit 1Kentucky/Louisville 1Kentucky/Monticello 1Indiana/Indianapolis 1Indiana/Vincennes 1Indiana/Winamac 1Indiana/Marengo 1Indiana/Petersburg 1Indiana/Vevay 1Chicago 1Indiana/Tell_City 1Indiana/Knox 1Menominee 1North_Dakota/Center 1North_Dakota/New_Salem 1North_Dakota/Beulah 1Denver 1Boise 1Phoenix 1Los_Angeles 1Anchorage 1Juneau 1Sitka 1Metlakatla 1Yakutat 1Nome 1Adak 9Honolulu 1Indianapolis 1Knox_IN 1Louisville 1Atka 1Fort_Wayne 1Shiprock 9Johnston;uy>1Montevideo;uz>4Samarkand 4Tashkent;va>7Vatican;vc>1St_Vincent;ve>1Caracas;vg>1Tortola;vi>1St_Thomas;vn>4Ho_Chi_Minh 4Saigon;vu>9Efate;wf>9Wallis;ws>9Apia;ye>4Aden;yt>8Mayotte;za>0Johannesburg;zm>0Lusaka;zw>0Harare";

  /* Насколько номер может быть короче маски (в цифрах) — у части стран длина плавающая.
     Порт таблицы из тильдовского скрипта. */
  var SHORTER_OK = {
    '+49': 2, '+372': 1, '+355': 1, '+213': 1, '+975': 1, '+267': 1, '+359': 1, '+53': 1,
    '+36': 1, '+961': 1, '+54': 1, '+82': 1, '+880': 1, '+970': 1, '+385': 1, '+43': 1,
    '+357': 1, '+61': 1, '+507': 1, '+55': 1, '+593': 1, '+383': 1, '+39': 1, '+86': 1,
    '+977': 1, '+230': 1, '+63': 1, '+258': 1, '+381': 1, '+252': 1, '+971': 1, '+387': 1,
    '+972': 2, '+234': 2, '+60': 2, '+64': 2, '+62': 3, '+44': 4, '+358': 4, '+263': 3
  };

  /* Страны, где ноль в начале — внутренний междугородний префикс, а не часть номера */
  var TRUNK_ZERO = ['+33', '+380', '+373', '+44', '+49', '+31', '+32', '+41', '+43', '+90', '+40', '+48', '+971'];

  /* Один код на несколько стран — какую считать основной при распознавании вставленного номера */
  var CODE_OWNER = { '+7': 'ru', '+1': 'us', '+44': 'gb', '+39': 'it', '+47': 'no', '+61': 'au', '+212': 'ma', '+262': 're', '+590': 'gp', '+599': 'cw' };

  /* Наверх списка — страны, откуда к нам приходят чаще всего */
  var PINNED = ['ru', 'kz', 'by', 'uz', 'am', 'ge', 'az', 'kg', 'tj', 'md', 'ua'];

  var STORE_KEY = 'alter_phone_iso';
  var DEFAULT_ISO = 'ru';

  function parsePairs(s) {
    var out = {}, parts = s.split(' ');
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split(':');
      out[kv[0]] = kv[1];
    }
    return out;
  }

  var TZ = null;
  function tzMap() {
    if (TZ) return TZ;
    TZ = {};
    var groups = TZ_PACKED.split(';');
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i].split('>'), iso = g[0], zones = g[1].split(' ');
      for (var j = 0; j < zones.length; j++) {
        TZ[REGIONS[+zones[j].charAt(0)] + '/' + zones[j].slice(1)] = iso;
      }
    }
    return TZ;
  }

  /* Код -> iso, для распознавания вставленного международного номера */
  var CODE_TO_ISO = null;
  function codeToIso() {
    if (CODE_TO_ISO) return CODE_TO_ISO;
    CODE_TO_ISO = {};
    for (var iso in COUNTRIES) {
      if (!Object.prototype.hasOwnProperty.call(COUNTRIES, iso)) continue;
      var code = COUNTRIES[iso][1];
      if (!CODE_TO_ISO[code]) CODE_TO_ISO[code] = iso;
    }
    for (var c in CODE_OWNER) {
      if (Object.prototype.hasOwnProperty.call(CODE_OWNER, c)) CODE_TO_ISO[c] = CODE_OWNER[c];
    }
    return CODE_TO_ISO;
  }

  /* ---------- определение страны ---------- */

  function isoFromTimezone() {
    var tz;
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; }
    if (!tz) return '';
    var iso = tzMap()[tz];
    return (iso && COUNTRIES[iso]) ? iso : '';
  }

  function isoFromLanguage() {
    var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var m = String(langs[i]).match(/[-_]([A-Za-z]{2})$/);
      if (m) {
        var iso = m[1].toLowerCase();
        if (COUNTRIES[iso]) return iso;
      }
    }
    return '';
  }

  function initialIso() {
    var saved = '';
    try { saved = localStorage.getItem(STORE_KEY) || ''; } catch (e) { saved = ''; }
    if (saved && COUNTRIES[saved]) return saved;
    return isoFromTimezone() || isoFromLanguage() || DEFAULT_ISO;
  }

  function rememberIso(iso) {
    try { localStorage.setItem(STORE_KEY, iso); } catch (e) { /* приватный режим — не критично */ }
  }

  /* ---------- маска ---------- */

  /* Локальная часть маски: полная маска минус код страны, без ведущих разделителей.
     "+7(000) 000-00-00" -> "(000) 000-00-00"; "+998-00-000-0000" -> "00-000-0000" */
  function localTemplate(iso) {
    var c = COUNTRIES[iso];
    return c[2].substr(c[1].length).replace(/^[\s\-]+/, '');
  }

  function capacity(tpl) { return (tpl.match(/0/g) || []).length; }

  /* Раскладка цифр по шаблону: группы нулей заменяются цифрами, литералы подставляются как
     есть, «повисшие» разделители в конце срезаются (порт t_form_phonemask__addNumberMask). */
  function applyTemplate(tpl, digits) {
    var tokens = tpl.match(/(\+|\d+|[\s()\-]|0+)/g);
    if (!tokens) return digits;
    var rest = digits.split(''), out = '';
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.charAt(0) === '0') {
        if (!rest.length) break;
        out += rest.splice(0, t.length).join('');
      } else {
        out += t;
      }
    }
    return out.replace(/[\s()\-]+$/, '').replace(/^[\s\-]+/, '');
  }

  /* Ноль в начале национальной части — внутренний междугородний префикс
     (Германия, Британия, Украина…), в международной записи он не пишется. */
  function stripTrunkZero(code, digits) {
    return (digits.charAt(0) === '0' && TRUNK_ZERO.indexOf(code) !== -1) ? digits.slice(1) : digits;
  }

  /* Приведение цифр к «локальному» виду для выбранной страны. Вызывается только
     когда код страны в самом номере не указан (иначе национальная часть уже
     отделена по коду и трогать её нельзя: у 8(812)… ведущая 8 — часть кода города). */
  function stripTrunk(code, digits) {
    if (code === '+7') {
      /* Ведущая 8 — междугородний префикс. Сам по себе национальный номер с 8
         начинается только у сервисных 800/804/809, поэтому 8 снимаем сразу, как
         только видна следующая цифра, и не снимаем перед нулём: «8800…» это
         префикс плюс 800, а «800…» — уже сам номер. Так «8 495 …» превращается
         в «(495) …» по ходу набора, а не после одиннадцатой цифры.
         Ведущая 7 (код страны, набранный без плюса) — по переполнению маски:
         в Казахстане национальные номера сами начинаются с 7. */
      if (digits.charAt(0) === '8' && digits.length > 1 && digits.charAt(1) !== '0') return digits.slice(1);
      if (/^[78]/.test(digits) && digits.length > 10) return digits.slice(1);
      return digits;
    }
    return stripTrunkZero(code, digits);
  }

  /* Распознать страну по началу международного номера (самый длинный подходящий код) */
  function isoFromDigits(digits) {
    if (!digits || digits.charAt(0) === '0') return null;
    var map = codeToIso();
    for (var len = 4; len >= 1; len--) {
      var code = '+' + digits.slice(0, len);
      if (map[code]) return { iso: map[code], code: code };
    }
    return null;
  }

  /* ---------- разметка ---------- */

  var SPRITE_URL = (function () {
    var s = document.querySelector('script[src*="phone-intl.js"]');
    var base = s ? s.getAttribute('src').replace(/phone-intl\.js.*$/, '') : './';
    return base + 'assets/flags.png';
  })();

  var CSS = [
    '.apm{position:relative;display:flex;align-items:center;box-sizing:border-box}',
    '.apm__btn{display:flex;align-items:center;gap:6px;flex-shrink:0;margin:0 9px 0 0;padding:0;border:0;background:none;font:inherit;line-height:1;color:inherit;cursor:pointer}',
    '.apm__flag{display:inline-block;width:18px;min-width:18px;height:13px;border-radius:2px;background-color:#E4E9E6;background-repeat:no-repeat;background-image:url(' + SPRITE_URL + ');box-shadow:0 0 0 1px rgba(40,44,62,.12)}',
    '.apm__tri{width:0;height:0;border-style:solid;border-width:4px 3.5px 0;border-color:#9AA0B5 transparent transparent;transition:transform .16s}',
    '.apm__btn[aria-expanded="true"] .apm__tri{transform:rotate(180deg)}',
    '.apm__code{white-space:nowrap}',
    '.apm__input{flex:1 1 auto;min-width:0}',
    '.apm.is-focus{border-color:#29B981 !important;box-shadow:0 0 0 4px rgba(41,185,129,.13) !important}',
    '.apm-drop{position:fixed;z-index:2147483000;display:none;box-sizing:border-box;width:340px;max-width:calc(100vw - 24px);background:#fff;border:1px solid #DCE5DF;border-radius:14px;box-shadow:0 16px 38px rgba(40,44,62,.16);font-family:\'Futura PT\',-apple-system,system-ui,sans-serif;font-size:15px;color:#282C3E;overflow:hidden}',
    '.apm-drop.is-open{display:block}',
    '.apm-drop__search{display:block;box-sizing:border-box;width:calc(100% - 20px);margin:10px;padding:10px 12px;border:1px solid #DCE5DF;border-radius:10px;outline:none;font:inherit;color:inherit;background:#fff}',
    '.apm-drop__search:focus{border-color:#29B981;box-shadow:0 0 0 3px rgba(41,185,129,.13)}',
    '.apm-drop__list{max-height:248px;overflow-y:auto;padding-bottom:6px;overscroll-behavior:contain}',
    '.apm-drop__item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 16px;cursor:pointer}',
    '.apm-drop__item.is-active,.apm-drop__item:hover{background:#F1F7F3}',
    '.apm-drop__item[aria-selected="true"]{background:#E7F6EF}',
    '.apm-drop__item_pinlast{border-bottom:1px solid #EDF2EF;padding-bottom:12px;margin-bottom:5px}',
    '.apm-drop__name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:1.3}',
    '.apm-drop__right{display:flex;align-items:center;gap:8px;flex-shrink:0;color:#6A7088;font-size:14px}',
    '.apm-drop__empty{padding:14px 16px;color:#8A90A6;font-size:14px}',
    '.apm-drop__list::-webkit-scrollbar{width:8px}',
    '.apm-drop__list::-webkit-scrollbar-thumb{border-radius:7px;background:#D3DBD6}'
  ].join('');

  function injectCss() {
    if (document.getElementById('apm-style')) return;
    var st = document.createElement('style');
    st.id = 'apm-style';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function flagStyle(iso) {
    var p = FLAGS[iso];
    return p ? 'background-position:-' + p.split(',')[0] + 'px -' + p.split(',')[1] + 'px' : '';
  }

  /* ---------- выпадающий список (один на страницу) ---------- */

  var drop = null, dropList = null, dropSearch = null, activeWrap = null, activeIdx = -1;

  /* Названия стран по-русски берём у браузера (Intl.DisplayNames) — своя таблица переводов
     не нужна. В тильдовском списке названия английские с нативным в скобках; оставляем их
     запасным вариантом для старых браузеров и для кодов, которых Intl не знает. */
  var DISPLAY_NAMES = null;
  try {
    if (typeof Intl !== 'undefined' && Intl.DisplayNames) DISPLAY_NAMES = new Intl.DisplayNames(['ru'], { type: 'region' });
  } catch (e) { DISPLAY_NAMES = null; }

  function countryName(iso) {
    if (DISPLAY_NAMES) {
      try {
        var n = DISPLAY_NAMES.of(iso.toUpperCase());
        if (n && n.toLowerCase() !== iso.toLowerCase()) return n;
      } catch (e) { /* код не из ISO 3166 — падаем на тильдовское название */ }
    }
    return COUNTRIES[iso][0];
  }

  function sortedIsos() {
    var rest = [];
    for (var iso in COUNTRIES) {
      if (Object.prototype.hasOwnProperty.call(COUNTRIES, iso) && PINNED.indexOf(iso) === -1) rest.push(iso);
    }
    rest.sort(function (a, b) { return countryName(a).localeCompare(countryName(b), 'ru'); });
    return PINNED.filter(function (i) { return !!COUNTRIES[i]; }).concat(rest);
  }

  function buildDrop() {
    if (drop) return;
    drop = document.createElement('div');
    drop.className = 'apm-drop';
    drop.setAttribute('role', 'dialog');
    drop.innerHTML = '<input class="apm-drop__search" type="text" placeholder="Поиск страны" autocomplete="off" spellcheck="false" aria-label="Поиск страны">'
      + '<div class="apm-drop__list" role="listbox"></div>';
    dropSearch = drop.querySelector('.apm-drop__search');
    dropList = drop.querySelector('.apm-drop__list');

    var isos = sortedIsos(), html = '', pinCount = PINNED.filter(function (i) { return !!COUNTRIES[i]; }).length;
    for (var i = 0; i < isos.length; i++) {
      var iso = isos[i], c = COUNTRIES[iso], name = countryName(iso);
      /* строка для поиска: русское название + оригинальное (там же нативное) + код + iso */
      var hay = (name + ' ' + c[0] + ' ' + c[1] + ' ' + iso).toLowerCase();
      html += '<div class="apm-drop__item' + (i === pinCount - 1 ? ' apm-drop__item_pinlast' : '') + '" role="option" data-iso="' + iso + '" data-hay="' + escapeHtml(hay) + '">'
        + '<span class="apm-drop__name">' + escapeHtml(name) + '</span>'
        + '<span class="apm-drop__right"><span>' + c[1] + '</span>'
        + '<span class="apm__flag" style="' + flagStyle(iso) + '"></span></span></div>';
    }
    dropList.innerHTML = html;

    dropList.addEventListener('mousedown', function (e) { e.preventDefault(); });
    dropList.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.apm-drop__item') : null;
      if (item && activeWrap) {
        setCountry(activeWrap, item.getAttribute('data-iso'), true);
        rememberIso(item.getAttribute('data-iso'));
        closeDrop();
        activeWrap.querySelector('.apm__input').focus();
      }
    });
    dropSearch.addEventListener('input', function () { filterDrop(dropSearch.value); });
    dropSearch.addEventListener('keydown', onDropKey);
    document.addEventListener('mousedown', function (e) {
      if (!drop.classList.contains('is-open')) return;
      if (drop.contains(e.target) || (activeWrap && activeWrap.contains(e.target))) return;
      closeDrop();
    }, true);
    window.addEventListener('resize', positionDrop);
    window.addEventListener('scroll', positionDrop, true);
    document.body.appendChild(drop);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function allItems() { return dropList.querySelectorAll('.apm-drop__item'); }

  function visibleItems() {
    return Array.prototype.filter.call(allItems(), function (el) { return el.style.display !== 'none'; });
  }

  function filterDrop(q) {
    q = (q || '').trim().toLowerCase();
    var items = allItems(), shown = 0;
    for (var i = 0; i < items.length; i++) {
      var hit = !q || items[i].getAttribute('data-hay').indexOf(q) !== -1;
      items[i].style.display = hit ? '' : 'none';
      if (hit) shown++;
    }
    var empty = drop.querySelector('.apm-drop__empty');
    if (!shown && !empty) {
      empty = document.createElement('div');
      empty.className = 'apm-drop__empty';
      empty.textContent = 'Страна не найдена';
      drop.appendChild(empty);
    } else if (empty) {
      empty.style.display = shown ? 'none' : '';
    }
    setActive(0);
  }

  function setActive(idx) {
    var items = visibleItems();
    Array.prototype.forEach.call(allItems(), function (el) { el.classList.remove('is-active'); });
    if (!items.length) { activeIdx = -1; return; }
    activeIdx = Math.max(0, Math.min(idx, items.length - 1));
    items[activeIdx].classList.add('is-active');
    var it = items[activeIdx], top = it.offsetTop, bottom = top + it.offsetHeight;
    if (top < dropList.scrollTop) dropList.scrollTop = top;
    else if (bottom > dropList.scrollTop + dropList.clientHeight) dropList.scrollTop = bottom - dropList.clientHeight;
  }

  function onDropKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      var items = visibleItems();
      if (items[activeIdx] && activeWrap) {
        var iso = items[activeIdx].getAttribute('data-iso');
        setCountry(activeWrap, iso, true);
        rememberIso(iso);
        closeDrop();
        activeWrap.querySelector('.apm__input').focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      var w = activeWrap;
      closeDrop();
      if (w) w.querySelector('.apm__input').focus();
    }
  }

  function positionDrop() {
    if (!drop || !drop.classList.contains('is-open') || !activeWrap) return;
    var r = activeWrap.getBoundingClientRect();
    var w = drop.offsetWidth, h = drop.offsetHeight;
    var left = Math.min(Math.max(8, r.left), document.documentElement.clientWidth - w - 8);
    var below = r.bottom + 6;
    var top = (below + h > window.innerHeight - 8 && r.top - h - 6 > 8) ? r.top - h - 6 : below;
    drop.style.left = left + 'px';
    drop.style.top = top + 'px';
  }

  function openDrop(wrap) {
    buildDrop();
    activeWrap = wrap;
    var iso = wrap.getAttribute('data-apm-iso');
    Array.prototype.forEach.call(allItems(), function (el) {
      el.setAttribute('aria-selected', el.getAttribute('data-iso') === iso ? 'true' : 'false');
    });
    dropSearch.value = '';
    filterDrop('');
    drop.classList.add('is-open');
    wrap.querySelector('.apm__btn').setAttribute('aria-expanded', 'true');
    positionDrop();
    var chosen = dropList.querySelector('[aria-selected="true"]');
    if (chosen) dropList.scrollTop = Math.max(0, chosen.offsetTop - 60);
    dropSearch.focus();
  }

  function closeDrop() {
    if (!drop) return;
    drop.classList.remove('is-open');
    if (activeWrap) activeWrap.querySelector('.apm__btn').setAttribute('aria-expanded', 'false');
    activeWrap = null;
  }

  /* ---------- поле ---------- */

  /* Запас к длине маски. Ровно по маске нельзя: браузер обрезает по maxlength и
     то, что подставляет автозаполнение, и то, что набирают руками, — а российский
     номер приходит на четыре символа длиннее («+7 » или «8» перед кодом города).
     Обрезанный хвост потом не восстановить, поэтому лишние символы принимаем и
     снимаем сами, в onInput. */
  function setMaxLength(input, tpl) {
    input.setAttribute('maxlength', String(tpl.length + 5));
  }

  function setCountry(wrap, iso, keepDigits) {
    if (!COUNTRIES[iso]) iso = DEFAULT_ISO;
    var input = wrap.querySelector('.apm__input');
    var digits = keepDigits ? input.value.replace(/\D/g, '') : '';
    var c = COUNTRIES[iso], tpl = localTemplate(iso);

    wrap.setAttribute('data-apm-iso', iso);
    wrap.querySelector('.apm__flag').setAttribute('style', flagStyle(iso));
    wrap.querySelector('.apm__code').textContent = c[1];
    setMaxLength(input, tpl);
    input.setAttribute('placeholder', tpl);
    input.value = applyTemplate(tpl, digits.slice(0, capacity(tpl)));
    sync(wrap);
  }

  /* ---------- отсев заведомо ненастоящих номеров ---------- */

  /* Первые цифры национальной части, с которых номер вообще может начинаться.
     Только страны, откуда к нам реально идут заявки: для остальных проверяем
     лишь «мусорность» цифр — ошибочно отклонить живой лид дороже, чем пропустить
     фейковый. Списки намеренно широкие, отсекают только невозможные диапазоны. */
  var NATIONAL_START = {
    ru: '34589',   // мобильные 9xx, городские 3xx/4xx/5xx/8xx
    kz: '67',      // мобильные 7xx, городские 6xx/7xx
    by: '1234',    // мобильные 25/29/33/44, городские 15-23
    ua: '345679',
    uz: '36789',
    ge: '35',
    am: '13579',
    az: '0125',    // в Азербайджане национальная часть начинается и с 0 (0xx-коды)
    kg: '35679',
    tj: '349',
    md: '2678'
  };

  /* Строка целиком идёт по возрастанию или убыванию: 1234567890, 9876543210 */
  function isRun(d) {
    if (d.length < 5) return false;
    var up = true, down = true;
    for (var i = 1; i < d.length; i++) {
      var step = (+d[i] - +d[i - 1] + 10) % 10;
      if (step !== 1) up = false;
      if (step !== 9) down = false;
    }
    return up || down;
  }

  function fakeReason(iso, digits) {
    if (digits.length < 5) return '';
    var distinct = {}, n = 0;
    for (var i = 0; i < digits.length; i++) {
      if (!distinct[digits[i]]) { distinct[digits[i]] = 1; n++; }
    }
    /* 9999999999, 1212121212, 9090909090 — у живого номера так не бывает */
    if (n <= 2) return 'Проверьте номер телефона';
    if (isRun(digits)) return 'Проверьте номер телефона';
    var allowed = NATIONAL_START[iso];
    if (allowed && allowed.indexOf(digits.charAt(0)) === -1) return 'Проверьте номер телефона';
    return '';
  }

  /* Полный номер в data-phone-full + проверка длины и правдоподобности */
  function sync(wrap) {
    var input = wrap.querySelector('.apm__input');
    var iso = wrap.getAttribute('data-apm-iso'), c = COUNTRIES[iso], tpl = localTemplate(iso);
    var digits = input.value.replace(/\D/g, '');
    var full = digits ? c[1] + ' ' + input.value : '';
    input.setAttribute('data-phone-full', full);

    var need = capacity(tpl) - (SHORTER_OK[c[1]] || 0);
    var msg = '';
    if (digits.length > 0 && digits.length < need) msg = 'Введите номер полностью';
    else if (digits.length > 0) msg = fakeReason(iso, digits);
    try { input.setCustomValidity(msg); } catch (e) { /* старые браузеры */ }
  }

  /* Ввод (он же вставка и автозаполнение) -> национальная часть номера.

     Порядок важен. Сначала пробуем понять номер как номер выбранной страны, сняв
     междугородний префикс, и только если он всё равно не помещается в маску (или
     посетитель явно написал плюс) — ищем чужой код страны. Наоборот нельзя:
     «8 (495) 123-45-67» — обычная российская запись, но её первые цифры совпадают
     с кодом Вьетнама (+84), а «8 800 …» — с кодом Бангладеш (+880), и поле молча
     уезжало в другую страну.

     Если код страны в номере указан явно, остаток после него — уже национальная
     часть, префикс из неё не срезаем: у «+7 (812) 123-45-67» ведущая 8 это код
     Петербурга, а не «восьмёрка». */
  function onInput(wrap) {
    var input = wrap.querySelector('.apm__input');
    var raw = input.value;
    var digits = raw.replace(/\D/g, '');
    var iso = wrap.getAttribute('data-apm-iso'), code = COUNTRIES[iso][1], tpl = localTemplate(iso);
    var cap = capacity(tpl);
    var local = stripTrunk(code, digits);

    if (raw.indexOf('+') !== -1 || local.length > cap) {
      var hit = isoFromDigits(digits);
      if (hit) {
        local = stripTrunkZero(COUNTRIES[hit.iso][1], digits.slice(hit.code.length - 1));
        if (hit.iso !== iso) {
          iso = hit.iso;
          code = COUNTRIES[iso][1];
          tpl = localTemplate(iso);
          cap = capacity(tpl);
          wrap.setAttribute('data-apm-iso', iso);
          wrap.querySelector('.apm__flag').setAttribute('style', flagStyle(iso));
          wrap.querySelector('.apm__code').textContent = code;
          setMaxLength(input, tpl);
          input.setAttribute('placeholder', tpl);
        }
      }
    }

    input.value = applyTemplate(tpl, local.slice(0, cap));
    try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) { /* не поддерживается */ }
    sync(wrap);
  }

  /* ---------- цель «телефон подставил браузер» ----------

     Сколько людей вообще пользуются автозаполнением в поле телефона — до правки
     15.08.2026 у всех у них номер уезжал на цифру, и по одним заявкам масштаб не
     виден. Считаем один раз за загрузку страницы, дальше в Метрике этот сегмент
     сравнивается с заявками.

     Автозаполнение отличаем от набора по скачку: браузер подставляет номер целиком,
     человек добавляет по цифре. Вставку руками отсекаем по inputType — у неё
     'insertFromPaste'. Параметр `where` разделяет два случая: `preset` — номер уже
     лежал в поле, когда скрипт до него добрался (обычный порядок на телефоне),
     `input` — подставился в уже готовое поле. */
  var autofillSent = false;

  /* Поле с меткой data-alter-prefill заполнили не браузер и не человек, а наша
     собственная подстановка из прошлой заявки (crm-submit.js). По скачку цифр она
     выглядит ровно как автозаполнение, и без этой проверки цель считала бы её
     браузерной, завышая долю тех, у кого номер лежит в профиле браузера. */
  function trackAutofill(where, input) {
    if (autofillSent) return;
    if (input && input.getAttribute('data-alter-prefill') === '1') return;
    autofillSent = true;
    try {
      if (typeof window.alterGoal === 'function') window.alterGoal('b2b_phone_autofill', { where: where });
    } catch (e) { /* аналитика не должна ронять форму */ }
  }

  /* ---------- апгрейд поля ---------- */

  function upgrade(input) {
    if (input.getAttribute('data-apm-init') === '1') return;
    if (!input.parentNode) return;
    input.setAttribute('data-apm-init', '1');
    injectCss();

    var wrap = document.createElement('div');
    /* Рамка, скругление, отступы и позиция в сетке переезжают с поля на обёртку —
       поле внутри становится прозрачным. Так виджет наследует оформление любой формы. */
    wrap.setAttribute('style', input.getAttribute('style') || '');
    wrap.className = 'apm';
    wrap.innerHTML = '<button type="button" class="apm__btn" aria-haspopup="listbox" aria-expanded="false" aria-label="Код страны" tabindex="-1">'
      + '<span class="apm__flag"></span><span class="apm__tri"></span><span class="apm__code"></span></button>';

    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.className = (input.className ? input.className + ' ' : '') + 'apm__input';
    input.setAttribute('style', 'flex:1 1 auto;min-width:0;width:100%;margin:0;padding:0;border:0;background:transparent;outline:none;box-shadow:none;font:inherit;color:inherit;');
    input.setAttribute('autocomplete', 'tel');
    input.setAttribute('inputmode', 'tel');

    wrap.querySelector('.apm__btn').addEventListener('click', function (e) {
      e.preventDefault();
      if (drop && drop.classList.contains('is-open') && activeWrap === wrap) closeDrop();
      else openDrop(wrap);
    });
    /* Сколько цифр было в поле до события — по скачку узнаём автозаполнение.
       Считаем после onInput: он мог снять восьмёрку или код страны. */
    var hadDigits = 0;
    function handleInput(e) {
      var now = input.value.replace(/\D/g, '').length;
      if (now - hadDigits >= 4 && (!e || e.inputType !== 'insertFromPaste')) trackAutofill('input', input);
      onInput(wrap);
      hadDigits = input.value.replace(/\D/g, '').length;
    }
    input.addEventListener('input', handleInput);
    input.addEventListener('change', handleInput);
    input.addEventListener('focus', function () { wrap.classList.add('is-focus'); });
    input.addEventListener('blur', function () { wrap.classList.remove('is-focus'); });

    /* В поле уже может лежать номер: браузер автозаполняет форму раньше, чем
       скрипт доберётся до апгрейда (на телефоне это обычный порядок). Такой номер
       прогоняем через onInput — он снимет код страны или восьмёрку и при
       необходимости переключит страну. Без этого «+7 999 123-45-67» ложилось в
       маску как есть и превращалось в «+7 (799) 912-34-56». */
    var preset = input.value;
    setCountry(wrap, initialIso(), false);
    if (preset.replace(/\D/g, '')) {
      input.value = preset;
      onInput(wrap);
      hadDigits = input.value.replace(/\D/g, '').length;
      /* Пять цифр — чтобы не считать за автозаполнение номер, проставленный в
         разметке страницы, и обрывки вроде «+7». */
      if (hadDigits >= 5) trackAutofill('preset', input);
    }
  }

  function upgradeAll() {
    var list = document.querySelectorAll('input[type="tel"]:not([data-apm-init]):not([data-phone-plain])');
    for (var i = 0; i < list.length; i++) upgrade(list[i]);
  }

  /* dc-runtime гидрирует страницу React'ом на DOMContentLoaded и позже перерисовывает её
     ещё раз (support.js дозагружает шаблон фоновым fetch). Трогать DOM в разгар гидрации
     нельзя — React снесёт нашу обёртку как несовпадение разметки. Поэтому апгрейд идёт не
     по таймеру и не по requestAnimationFrame (в фоновой вкладке кадры не идут вовсе), а
     когда DOM перестал меняться: каждая мутация отодвигает проход на 60 мс, но не дольше
     чем на 900 мс от старта. Дальше тот же наблюдатель ловит последующие ре-рендеры. */
  function start() {
    var timer = null, deadline = null;
    function pass() {
      clearTimeout(timer); timer = null;
      clearTimeout(deadline); deadline = null;
      upgradeAll();
    }
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(pass, 60);
      // Дедлайн — страховка на случай, если DOM никогда не затихнет, а НЕ рабочий путь.
      // Был 900 мс, и под троттлингом PageSpeed (процессор в 4 раза медленнее) гидрация
      // React в него не укладывалась: дедлайн срабатывал посреди неё, обёртка попадала в
      // недогидрированное дерево и вызывала лавину ошибок #418. Разбор — в PROJECT.md.
      if (!deadline) deadline = setTimeout(pass, 8000);
    }
    if (window.MutationObserver) {
      new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    }
    schedule();
    window.addEventListener('load', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
