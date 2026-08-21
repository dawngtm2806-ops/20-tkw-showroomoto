/* =============================================================
   layout.js — Header/Footer dùng chung + tiện ích toàn site
   Nạp SAU data.js, TRƯỚC file JS của từng trang.
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM || {};

  /* ---------- Bộ icon SVG dùng chung ---------- */
  var ICON = {
    logo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 13l2-5a3 3 0 012.8-2h8.4A3 3 0 0119 8l2 5v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-5z" fill="#fff"/><circle cx="7.5" cy="14.5" r="1.5" fill="#3563E9"/><circle cx="16.5" cy="14.5" r="1.5" fill="#3563E9"/></svg>',
    heart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.9-10-9.4C.7 9 1.6 5.6 4.6 4.7 6.7 4 8.9 4.8 12 8c3.1-3.2 5.3-4 7.4-3.3 3 .9 3.9 4.3 2.6 6.9C19.5 16.1 12 21 12 21z"/></svg>',
    moon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>',
    sun: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 21V5a2 2 0 012-2h6a2 2 0 012 2v16"/><path d="M2 21h13"/><path d="M13 8h3l3 3v6a2 2 0 11-4 0v-4"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 4h6M8 4v16M8 20h4a4 4 0 004-4V9"/><circle cx="16" cy="6" r="2"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.9"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    phone: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z"/></svg>',
    mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7 10-7"/></svg>',
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>'
  };
  S.ICON = ICON;

  /* ---------- Tài khoản đăng nhập (đọc từ localStorage) ---------- */
  function getUser() { try { return JSON.parse(localStorage.getItem('sr_user') || 'null'); } catch (e) { return null; } }
  S.auth = { user: getUser, logout: function () { try { localStorage.removeItem('sr_user'); localStorage.removeItem('sr_token'); } catch (e) {} } };

  /* ---------- Trang hiện tại (để active nav) ---------- */
  var path = location.pathname.split('/').pop() || 'index.html';
  if (path === '') path = 'index.html';

  function t(k, f) { return (S.t ? S.t(k, f) : f); }

  var NAV = [
    { href: 'index.html', key: 'nav_home', label: 'Trang chủ' },
    { href: 'cars.html', key: 'nav_cars', label: 'Danh mục xe' },
    { href: 'compare.html', key: 'nav_compare', label: 'So sánh xe' },
    { href: 'news.html', key: 'nav_news', label: 'Tin tức' },
    { href: 'contact.html', key: 'nav_contact', label: 'Liên hệ' }
  ];

  function navLinks(mobile) {
    return NAV.map(function (n) {
      var active = (n.href === path) ? ' active' : '';
      var cls = mobile ? ('block py-3 nav-link' + active) : ('nav-link' + active);
      return '<a class="' + cls + '" href="' + n.href + '">' + t(n.key, n.label) + '</a>';
    }).join('');
  }

  function langToggle() {
    var l = (S.lang ? S.lang() : 'vi');
    return '<button class="lang-btn" id="lang-toggle" type="button" aria-label="Đổi ngôn ngữ / Change language">' +
      '<span class="' + (l === 'vi' ? 'on' : '') + '">VI</span><span class="lang-sep">|</span><span class="' + (l === 'en' ? 'on' : '') + '">EN</span></button>';
  }

  /* ---------- Render Header ---------- */
  function renderHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    var user = getUser();
    var authDesktop = user
      ? '<a class="avatar-btn" href="account.html" title="' + t('nav_account', 'Tài khoản của tôi') + '" aria-label="' + t('nav_account', 'Tài khoản của tôi') + '">' + (user.name || 'A').trim().charAt(0).toUpperCase() + '</a>'
      : '<a class="nav-link hidden sm:inline-flex" href="auth.html">' + t('nav_login', 'Đăng nhập') + '</a>';
    var authMobile = user
      ? '<a class="block py-3 nav-link" href="account.html">' + t('nav_account', 'Tài khoản của tôi') + '</a>'
      : '<a class="block py-3 nav-link" href="auth.html">' + t('login_register', 'Đăng nhập / Đăng ký') + '</a>';
    var ICON_SEARCH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>';
    var ICON_SLIDERS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h11M4 17h7"/><circle cx="18" cy="7" r="2.2"/><circle cx="14" cy="17" r="2.2"/></svg>';
    var searchBar =
      '<form class="header-search" id="header-search" role="search">' +
        '<span class="header-search__ic">' + ICON_SEARCH + '</span>' +
        '<input id="hdr-q" type="search" placeholder="' + t('hdr_search', 'Tìm xe, hãng, dòng xe...') + '" aria-label="Tìm kiếm xe" />' +
        '<button type="button" class="header-search__filter" id="hdr-filter" aria-label="Bộ lọc" title="Bộ lọc">' + ICON_SLIDERS + '</button>' +
        '<div class="header-suggest" id="hdr-suggest" role="listbox" hidden></div>' +
      '</form>';
    host.innerHTML =
      '<header class="site-header">' +
      // Hàng 1: logo + thanh tìm kiếm + hành động
      '<div class="container-x flex items-center gap-4" style="height:72px">' +
        '<a class="brand" href="index.html"><span class="brand__logo">' + ICON.logo + '</span>Morent</a>' +
        searchBar +
        '<div class="flex items-center gap-2" style="margin-left:auto">' +
          '<button class="icon-btn" id="fav-link" title="' + t('fav_title', 'Xe yêu thích') + '" aria-label="' + t('fav_title', 'Xe yêu thích') + '" onclick="location.href=\'cars.html#favorites\'">' + ICON.heart + '<span class="fav-count" id="fav-count">0</span></button>' +
          langToggle() +
          '<button class="icon-btn" id="theme-toggle" title="' + t('theme_title', 'Chế độ sáng/tối') + '" aria-label="' + t('theme_title', 'Chế độ sáng/tối') + '">' + ICON.moon + '</button>' +
          authDesktop +
          '<a class="btn btn-primary hidden sm:inline-flex" href="test-drive.html">' + t('cta_testdrive', 'Đăng ký lái thử') + '</a>' +
          '<button class="icon-btn lg:hidden" id="menu-toggle" aria-label="Mở menu" aria-expanded="false">' + ICON.menu + '</button>' +
        '</div>' +
      '</div>' +
      // Hàng 2: menu điều hướng
      '<div class="header-nav-row hidden lg:block">' +
        '<div class="container-x"><nav class="flex items-center justify-center gap-8" style="height:46px" aria-label="Điều hướng chính">' + navLinks(false) + '</nav></div>' +
      '</div>' +
      '<div class="mobile-menu lg:hidden container-x pb-4" id="mobile-menu">' +
        navLinks(true) +
        authMobile +
        '<a class="btn btn-primary btn-block mt-3" href="test-drive.html">' + t('cta_testdrive', 'Đăng ký lái thử') + '</a>' +
      '</div>' +
      '</header>';

    // Thanh tìm kiếm: Enter hoặc bấm icon lọc -> sang trang Danh mục với từ khoá
    var hs = document.getElementById('header-search');
    function goSearch() { var q = (document.getElementById('hdr-q') || {}).value || ''; location.href = 'cars.html?q=' + encodeURIComponent(q.trim()); }
    if (hs) hs.addEventListener('submit', function (e) { e.preventDefault(); goSearch(); });
    var hf = document.getElementById('hdr-filter'); if (hf) hf.addEventListener('click', goSearch);

    // Gợi ý tức thì (autocomplete) khi gõ vào ô tìm kiếm
    var qEl = document.getElementById('hdr-q');
    var sug = document.getElementById('hdr-suggest');
    function renderSuggest() {
      var v = (qEl.value || '').trim().toLowerCase();
      if (!v || !S.CARS || !S.CARS.length) { sug.hidden = true; sug.innerHTML = ''; return; }
      var m = S.CARS.filter(function (c) { return (c.name + ' ' + c.brand + ' ' + c.type).toLowerCase().indexOf(v) !== -1; }).slice(0, 6);
      if (!m.length) { sug.hidden = true; sug.innerHTML = ''; return; }
      sug.innerHTML = m.map(function (c) {
        return '<a class="header-suggest__item" href="car-detail.html?id=' + c.id + '" role="option">' +
          '<span class="header-suggest__name">' + c.name + '</span>' +
          '<span class="header-suggest__meta">' + c.type + ' · ' + c.brand + '</span></a>';
      }).join('');
      sug.hidden = false;
    }
    if (qEl && sug) {
      qEl.addEventListener('input', renderSuggest);
      qEl.addEventListener('focus', renderSuggest);
      qEl.addEventListener('keydown', function (e) { if (e.key === 'Escape') { sug.hidden = true; } });
      document.addEventListener('click', function (e) { if (hs && !hs.contains(e.target)) sug.hidden = true; });
    }

    // Nút đổi ngôn ngữ
    var lt = document.getElementById('lang-toggle');
    if (lt && S.setLang) lt.addEventListener('click', function () { S.setLang((S.lang && S.lang() === 'en') ? 'vi' : 'en'); });

    // Mobile menu toggle
    var mt = document.getElementById('menu-toggle');
    var mm = document.getElementById('mobile-menu');
    if (mt && mm) {
      mt.addEventListener('click', function () {
        var open = mm.classList.toggle('open');
        mt.setAttribute('aria-expanded', open ? 'true' : 'false');
        mt.innerHTML = open ? ICON.close : ICON.menu;
      });
    }
    // Theme toggle
    var tt = document.getElementById('theme-toggle');
    if (tt) tt.addEventListener('click', toggleTheme);

    updateThemeIcon();
    updateFavCount();
  }

  /* ---------- Render Footer ---------- */
  function renderFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    var year = new Date().getFullYear();
    host.innerHTML =
      '<footer class="site-footer mt-20">' +
      '<div class="container-x py-14 grid gap-10" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">' +
        '<div style="grid-column:1/-1;max-width:320px" class="md:!col-auto">' +
          '<a class="brand" href="index.html"><span class="brand__logo">' + ICON.logo + '</span>Morent</a>' +
          '<p class="mt-4 text-muted" style="font-size:14px;line-height:1.7">' + t('foot_tagline', 'Cho thuê xe ô tô chính hãng — nơi bạn tìm thấy chiếc xe hoàn hảo. Trải nghiệm lái thử miễn phí và dịch vụ tận tâm.') + '</p>' +
        '</div>' +
        '<div><p class="footer-title">' + t('foot_explore', 'Khám phá') + '</p><ul class="grid gap-3 text-muted" style="font-size:14px">' +
          '<li><a href="cars.html">' + t('foot_l_cars', 'Danh mục xe') + '</a></li><li><a href="compare.html">' + t('foot_l_compare', 'So sánh xe') + '</a></li><li><a href="test-drive.html">' + t('foot_l_testdrive', 'Đăng ký lái thử') + '</a></li><li><a href="news.html">' + t('foot_l_news', 'Tin tức') + '</a></li></ul></div>' +
        '<div><p class="footer-title">' + t('foot_support', 'Hỗ trợ') + '</p><ul class="grid gap-3 text-muted" style="font-size:14px">' +
          '<li><a href="contact.html">' + t('foot_l_contact', 'Liên hệ') + '</a></li><li><a href="contact.html">' + t('foot_l_service', 'Trung tâm dịch vụ') + '</a></li><li><a href="#">' + t('foot_l_warranty', 'Chính sách bảo hành') + '</a></li><li><a href="#">' + t('foot_l_faq', 'Câu hỏi thường gặp') + '</a></li></ul></div>' +
        '<div><p class="footer-title">' + t('foot_contact', 'Liên hệ') + '</p><ul class="grid gap-3 text-muted" style="font-size:14px">' +
          '<li class="flex gap-2">' + ICON.pin + '<span>123 Nguyễn Huệ, Q.1, TP.HCM</span></li>' +
          '<li class="flex gap-2">' + ICON.phone + '<span>1900 1234</span></li>' +
          '<li class="flex gap-2">' + ICON.mail + '<span>hello@morent.vn</span></li></ul></div>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted" style="font-size:13px">' +
        '<span>© ' + year + ' ' + t('foot_rights', 'Morent. Đồ án môn Thiết kế Web — ĐỀ07 Cho thuê xe ô tô.') + '</span>' +
        '<span class="flex gap-5"><a href="#">' + t('foot_terms', 'Điều khoản') + '</a><a href="#">' + t('foot_privacy', 'Bảo mật') + '</a></span>' +
      '</div>' +
      '</footer>';
  }

  /* ---------- Dark mode ---------- */
  function currentTheme() { return document.documentElement.getAttribute('data-theme') || 'light'; }
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('sr_theme', t); } catch (e) {} updateThemeIcon(); }
  function toggleTheme() { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'); }
  function updateThemeIcon() { var tt = document.getElementById('theme-toggle'); if (tt) tt.innerHTML = currentTheme() === 'dark' ? ICON.sun : ICON.moon; }

  /* ---------- Favorites (localStorage) ---------- */
  function getFavs() { try { return JSON.parse(localStorage.getItem('sr_favs') || '[]'); } catch (e) { return []; } }
  function isFav(id) { return getFavs().indexOf(id) !== -1; }
  function toggleFav(id) {
    var f = getFavs(); var i = f.indexOf(id); var added;
    if (i === -1) { f.push(id); added = true; } else { f.splice(i, 1); added = false; }
    try { localStorage.setItem('sr_favs', JSON.stringify(f)); } catch (e) {}
    updateFavCount();
    return added;
  }
  function updateFavCount() {
    var el = document.getElementById('fav-count'); if (!el) return;
    var n = getFavs().length; el.textContent = n;
    el.classList.toggle('show', n > 0);
  }
  S.fav = { get: getFavs, is: isFav, toggle: toggleFav, updateCount: updateFavCount };

  /* ---------- Style chỉnh kích thước ảnh xe trên card (cân bằng cái to cái nhỏ) ---------- */
  function carImgStyle(car) {
    var v = [];
    if (car.scale) v.push('--csc:' + car.scale);
    if (car.tf) v.push('--ctf:' + car.tf);
    return v.length ? ' style="' + v.join(';') + '"' : '';
  }

  /* ---------- Render 1 card xe (bám Morent) ---------- */
  S.carCardHTML = function (car) {
    var active = isFav(car.id) ? ' is-active' : '';
    var old = S.rentOld ? S.rentOld(car) : (car.oldPrice ? '<div class="price-old">' + S.formatVND(car.oldPrice) + '/ngày</div>' : '');
    return (
      '<article class="car-card reveal" data-id="' + car.id + '">' +
        '<div class="car-card__head">' +
          '<div><div class="car-card__name">' + car.name + '</div><div class="car-card__type">' + car.type + ' · ' + car.brand + '</div></div>' +
          '<button class="fav-btn' + active + '" data-fav="' + car.id + '" aria-label="Yêu thích ' + car.name + '" aria-pressed="' + (active ? 'true' : 'false') + '">' + ICON.heart + '</button>' +
        '</div>' +
        '<a class="car-card__image" href="car-detail.html?id=' + car.id + '"' + carImgStyle(car) + ' aria-label="Xem chi tiết ' + car.name + '">' + S.carImage(car) + '</a>' +
        '<div class="spec-row">' +
          '<span>' + ICON.fuel + (car.tank ? S.specVal(car.tank) : S.fuelLabel(car)) + '</span>' +
          '<span>' + ICON.gear + S.transShort(car) + '</span>' +
          '<span>' + ICON.users + car.seats + ' ' + t('unit_seat', 'chỗ') + '</span>' +
        '</div>' +
        '<div class="price-row">' +
          '<div><div class="price-now">' + (S.rentPrice ? S.rentPrice(car) : S.formatRent(car.price)) + '</div>' + old + '</div>' +
          '<a class="btn btn-primary btn-sm" href="car-detail.html?id=' + car.id + '">' + t('card_rent', 'Thuê ngay') + '</a>' +
        '</div>' +
      '</article>'
    );
  };

  /* Gắn sự kiện cho nút yêu thích trong 1 vùng DOM */
  S.wireCards = function (root) {
    root = root || document;
    root.querySelectorAll('.fav-btn[data-fav]').forEach(function (btn) {
      if (btn.dataset.wired) return; btn.dataset.wired = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var id = btn.getAttribute('data-fav');
        var added = toggleFav(id);
        btn.classList.toggle('is-active', added);
        btn.setAttribute('aria-pressed', added ? 'true' : 'false');
        var car = S.getCar(id);
        toast(added ? (t('fav_add_car', 'Đã thêm') + ' ' + (car ? car.name : '') + ' ' + t('fav_add_car2', 'vào yêu thích')) : t('fav_rem', 'Đã bỏ khỏi yêu thích'), added ? 'ok' : '');
      });
    });
  };

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    var wrap = document.getElementById('toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.id = 'toast-wrap'; document.body.appendChild(wrap); }
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .3s, transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; setTimeout(function () { el.remove(); }, 300); }, 2600);
  }
  S.toast = toast;

  /* ---------- Star rating HTML ---------- */
  S.starHTML = function (rating) {
    var full = Math.round(rating), out = '<span class="stars" aria-label="' + rating + ' sao">';
    for (var i = 1; i <= 5; i++) out += '<span class="' + (i <= full ? '' : 'off') + '">' + ICON.star + '</span>';
    return out + '</span>';
  };

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  }
  S.initReveal = initReveal;

  /* ---------- Init ngay (theme sớm để tránh nháy) ---------- */
  (function initTheme() {
    var saved; try { saved = localStorage.getItem('sr_theme'); } catch (e) {}
    if (!saved) saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved);
  })();

  // Cho i18n gọi lại để vẽ lại header/footer khi đổi ngôn ngữ
  S.renderChrome = function () { renderHeader(); renderFooter(); };

  function onReady(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  onReady(function () {
    renderHeader();
    renderFooter();
    initReveal();
  });

  window.SHOWROOM = S;
})();
