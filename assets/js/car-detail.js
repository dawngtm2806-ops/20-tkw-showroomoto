/* =============================================================
   car-detail.js — Chi tiết xe: slider ảnh + thông số dạng tab (JS bắt buộc #2)
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  // Ảnh phụ trong gallery (nội thất) — ảnh thật của bạn.
  var INTERIORS = [
    { src: 'assets/img/gallery/interior-1.jpg' },
    { src: 'assets/img/gallery/interior-2.jpg' }
  ];

  function specLabel(k) { return t('spc_' + k, k); }

  // Đánh giá mẫu (tên riêng giữ nguyên; nội dung dịch theo ngôn ngữ)
  var REVIEWS = [
    { name: 'Nguyễn Minh Anh', role: 'Trưởng phòng kinh doanh', when: '21/07/2026', rating: 5, key: 'rv_ex1' },
    { name: 'Trần Quốc Bảo', role: 'Kỹ sư phần mềm', when: '20/07/2026', rating: 4, key: 'rv_ex2' },
    { name: 'Lê Thu Hà', role: 'Giáo viên', when: '18/07/2026', rating: 5, key: 'rv_ex3' },
    { name: 'Phạm Gia Huy', role: 'Nhiếp ảnh gia', when: '15/07/2026', rating: 5, key: 'rv_ex4' },
    { name: 'Đỗ Khánh Linh', role: 'Nhân viên marketing', when: '12/07/2026', rating: 4, key: 'rv_ex5' },
    { name: 'Vũ Đức Thắng', role: 'Chủ doanh nghiệp', when: '09/07/2026', rating: 5, key: 'rv_ex6' },
    { name: 'Hoàng Thảo My', role: 'Hướng dẫn viên du lịch', when: '05/07/2026', rating: 4, key: 'rv_ex7' }
  ].map(function (r) { return { name: r.name, role: r.role, when: r.when, rating: r.rating, text: t(r.key, '') }; });

  var slides = [], idx = 0, car = null;
  var rvPage = 1, RV_PER = 3; // phân trang đánh giá: 3 mục/trang

  S.ready(function () {
    var id = qs('id');
    car = S.getCar(id) || S.CARS[0];
    if (!car) { $('#detail-root').innerHTML = '<p class="text-center py-20 text-muted">' + t('notfound', 'Không tìm thấy xe.') + '</p>'; return; }

    document.title = car.name + ' | Morent';
    $('#crumb').textContent = car.name;

    /* ----- Gallery: slide 0 = ẢNH XE, 2 slide sau = ảnh nội thất (thay bằng ảnh thật ở assets/img/gallery/) ----- */
    slides = [{ main: true }].concat(INTERIORS.map(function (it) { return { src: it.src }; }));
    idx = 0;
    renderSlide();
    $('#detail-thumbs').innerHTML = slides.map(function (s, i) {
      return '<button class="thumb ' + (i === 0 ? 'active' : '') + '" data-i="' + i + '" aria-label="' + (i + 1) + '" style="width:84px;height:60px">' + slideInner(s, 'thumb') + '</button>';
    }).join('');
    $('#detail-thumbs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return;
      idx = +b.getAttribute('data-i'); renderSlide();
    });
    $('#slide-prev').addEventListener('click', function () { idx = (idx - 1 + slides.length) % slides.length; renderSlide(); });
    $('#slide-next').addEventListener('click', function () { idx = (idx + 1) % slides.length; renderSlide(); });

    /* ----- Badges + fav ----- */
    var badges = [];
    if (car.tags.indexOf('popular') !== -1) badges.push('<span class="badge badge-red">' + t('badge_hot', 'Bán chạy') + '</span>');
    if (car.tags.indexOf('recommend') !== -1) badges.push('<span class="badge badge-primary">' + t('badge_rec', 'Đề xuất') + '</span>');
    badges.push('<span class="badge badge-primary">' + S.fuelLabel(car) + '</span>');
    $('#detail-badges').innerHTML = badges.join('');

    var favBtn = $('#detail-fav');
    favBtn.innerHTML = S.ICON.heart;
    if (S.fav.is(car.id)) favBtn.classList.add('is-active');
    favBtn.classList.add('fav-btn');
    favBtn.addEventListener('click', function () {
      var added = S.fav.toggle(car.id);
      favBtn.classList.toggle('is-active', added);
      S.toast(added ? t('fav_add', 'Đã thêm vào yêu thích') : t('fav_rem', 'Đã bỏ khỏi yêu thích'), added ? 'ok' : '');
    });

    /* ----- Thông tin ----- */
    renderInfo();

    /* ----- Tabs ----- */
    renderTabs();
    renderFinance();
    $('#detail-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]'); if (!b) return;
      var key = b.getAttribute('data-tab');
      $('#detail-tabs').querySelectorAll('.tab-btn').forEach(function (t) { t.classList.toggle('active', t === b); });
      document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = (p.getAttribute('data-panel') !== key); });
    });

    /* ----- Xe tương tự ----- */
    var similar = S.CARS.filter(function (c) { return c.id !== car.id && (c.type === car.type || c.brand === car.brand); }).slice(0, 4);
    if (similar.length < 4) similar = S.CARS.filter(function (c) { return c.id !== car.id; }).slice(0, 4);
    var simEl = $('#similar-cars');
    simEl.innerHTML = similar.map(S.carCardHTML).join('');
    S.wireCards(simEl);
    S.initReveal();
  });

  function slideInner(s, mode) {
    if (s.main) return S.carImage(car, mode === 'thumb' ? 'car-photo' : 'gallery-car');
    return '<img src="' + s.src + '" alt="" class="gallery-photo" />';
  }

  function renderSlide() {
    var s = slides[idx] || {};
    $('#detail-main').innerHTML = slideInner(s, 'main');
    document.querySelectorAll('#detail-thumbs .thumb').forEach(function (t, i) { t.classList.toggle('active', i === idx); });
  }

  // Bám Figma: mỗi thông số một dòng, nhãn mờ bên trái, giá trị đậm bên phải
  function specItem(label, val) {
    return '<div class="detail-spec"><span class="text-muted">' + label + '</span><span class="font-bold">' + val + '</span></div>';
  }

  function renderInfo() {
    var old = S.curOld(car) ? S.fmtMoneyN(S.curOld(car)) : '';
    var tankVal = car.tank ? S.specVal(car.tank) : S.fuelLabel(car);
    $('#detail-info').innerHTML =
      '<h1 class="text-3xl sm:text-4xl font-extrabold" style="line-height:1.15">' + car.name + '</h1>' +
      '<div class="flex items-center gap-2 mt-2 mb-5">' + S.starHTML(car.rating) +
        '<span class="text-muted text-sm">' + REVIEWS.length + '+ ' + t('lbl_reviews_n', 'đánh giá') + '</span></div>' +
      '<p class="text-muted mb-7" style="line-height:1.75">' + S.descOf(car) + '</p>' +
      // Thông số hai cột nhãn–giá trị đúng như Figma
      '<div class="grid gap-x-10 gap-y-4 sm:grid-cols-2 mb-8">' +
        specItem(t('f_type', 'Kiểu dáng'), car.type) +
        specItem(t('d_seats', 'Số chỗ'), S.seatsLabel(car)) +
        specItem(t('d_gear', 'Hộp số'), S.transLabel(car)) +
        specItem(t('d_fuel', 'Bình nhiên liệu'), tankVal) +
      '</div>' +
      // Giá nằm sát dưới thông số; giá cũ gạch ngang ở DƯỚI giá hiện tại
      '<div class="flex flex-wrap items-center justify-between gap-4">' +
        '<div>' +
          '<div class="text-3xl font-extrabold">' + S.fmtMoneyN(S.curPrice(car)) + '<span class="text-muted text-base font-semibold">/' + S.unitDay() + '</span></div>' +
          (old ? '<div class="price-old text-base" style="margin-top:4px">' + old + '</div>' : '') +
        '</div>' +
        '<div class="flex flex-wrap gap-3">' +
          '<a class="btn btn-outline" href="test-drive.html?car=' + car.id + '">' + t('btn_book', 'Đặt lịch nhận xe') + '</a>' +
          '<a class="btn btn-primary" href="payment.html?id=' + car.id + '">' + t('btn_rent_now', 'Thuê xe ngay') + '</a>' +
        '</div>' +
      '</div>';
  }

  function renderTabs() {
    // Tổng quan
    $('[data-panel="overview"]').innerHTML =
      '<p class="text-muted" style="line-height:1.8;max-width:70ch">' + S.descOf(car) + ' ' + t('ov_a', 'Mẫu') + ' ' + car.name +
      ' ' + t('ov_b', 'là lựa chọn đáng cân nhắc trong phân khúc') + ' ' + car.type + ' ' + t('ov_c', ', cân bằng giữa thiết kế, vận hành và chi phí sử dụng.') + '</p>';

    // Thông số kỹ thuật
    var base = [
      [t('sp_brand', 'Hãng'), car.brand], [t('sp_type', 'Kiểu dáng'), car.type], [t('sp_year', 'Năm'), car.year],
      [t('d_fuel', 'Nhiên liệu'), S.fuelLabel(car)], [t('d_gear', 'Hộp số'), S.transLabel(car)], [t('d_seats', 'Số chỗ'), S.seatsLabel(car)]
    ];
    var extra = Object.keys(car.specs).map(function (k) { return [specLabel(k), S.specVal(car.specs[k])]; });
    var rows = base.concat(extra).map(function (r, i) {
      return '<div class="flex justify-between gap-4 py-3 px-4" style="background:' + (i % 2 ? 'transparent' : 'var(--bg)') + ';border-radius:8px">' +
        '<span class="text-muted">' + r[0] + '</span><span class="font-semibold text-right">' + r[1] + '</span></div>';
    }).join('');
    $('[data-panel="specs"]').innerHTML = '<div class="card p-4" style="max-width:640px">' + rows + '</div>';

    // Đánh giá (tương tác — có form + lưu localStorage)
    renderReviews();
  }

  /* ---------- Đánh giá & bình luận xe (tính năng động) ---------- */
  function reviewKey() { return 'sr_reviews_' + car.id; }
  function getUserReviews() { try { return JSON.parse(localStorage.getItem(reviewKey()) || '[]'); } catch (e) { return []; } }
  function allReviews() { return getUserReviews().concat(REVIEWS); }
  function avgRating() {
    var list = allReviews(); if (!list.length) return car.rating;
    return (list.reduce(function (s, r) { return s + r.rating; }, 0) / list.length);
  }

  function paintReviews(list) {
    var pages = Math.max(1, Math.ceil(list.length / RV_PER));
    if (rvPage > pages) rvPage = pages;
    var start = (rvPage - 1) * RV_PER;
    var slice = list.slice(start, start + RV_PER);
    var lst = $('#rv-list'); if (lst) lst.innerHTML = slice.map(reviewCard).join('');
    var pager = $('#rv-pager'); if (!pager) return;
    if (pages <= 1) { pager.innerHTML = ''; return; }
    var html = '<button type="button" class="rv-pg" data-pg="' + (rvPage - 1) + '"' + (rvPage === 1 ? ' disabled' : '') + '>‹</button>';
    for (var p = 1; p <= pages; p++) html += '<button type="button" class="rv-pg' + (p === rvPage ? ' is-active' : '') + '" data-pg="' + p + '">' + p + '</button>';
    html += '<button type="button" class="rv-pg" data-pg="' + (rvPage + 1) + '"' + (rvPage === pages ? ' disabled' : '') + '>›</button>';
    pager.innerHTML = html;
  }

  function renderReviews() {
    rvPage = 1;
    var list = allReviews();
    var avg = avgRating();
    var starPicker = '';
    for (var i = 1; i <= 5; i++) starPicker += '<button type="button" class="rv-star" data-star="' + i + '" aria-label="' + i + '">' + S.ICON.star + '</button>';
    var host = $('#reviews-section'); if (!host) return;
    host.innerHTML =
      '<h2 class="section-title mb-6">' + t('lbl_reviews', 'Đánh giá & bình luận') + ' <span class="text-muted" style="font-weight:600;font-size:18px">(' + list.length + ')</span></h2>' +
      '<div class="flex items-center gap-4 mb-6"><div class="text-5xl font-extrabold">' + avg.toFixed(1) + '</div><div>' + S.starHTML(avg) + '<p class="text-muted text-sm mt-1">' + t('lbl_based', 'Dựa trên') + ' ' + list.length + ' ' + t('lbl_reviews_n', 'đánh giá') + '</p></div></div>' +
      // Form thêm đánh giá
      '<form id="rv-form" class="card p-5 mb-6" style="max-width:720px" novalidate>' +
        '<p class="font-bold mb-3">' + t('rv_write', 'Viết đánh giá của bạn') + '</p>' +
        '<div class="grid gap-4 sm:grid-cols-2">' +
          '<div class="field" data-field="rv-name"><label for="rv-name">' + t('rv_name', 'Họ tên') + '</label><input class="input" id="rv-name" placeholder="' + t('rv_name_ph', 'Tên của bạn') + '" /><span class="field__error"></span></div>' +
          '<div class="field" data-field="rv-rating"><label>' + t('rv_rate', 'Chấm điểm') + '</label><div class="rv-stars" id="rv-stars">' + starPicker + '</div><span class="field__error"></span></div>' +
        '</div>' +
        '<div class="field mt-4" data-field="rv-text"><label for="rv-text">' + t('rv_comment', 'Nhận xét') + '</label><textarea class="textarea" id="rv-text" rows="3" placeholder="' + t('rv_ph', 'Cảm nhận của bạn về mẫu xe này (tối thiểu 10 ký tự)') + '"></textarea><span class="field__error"></span></div>' +
        '<button class="btn btn-primary mt-4" type="submit">' + t('rv_submit', 'Gửi đánh giá') + '</button>' +
      '</form>' +
      // Figma gom mọi nhận xét vào chung một thẻ trắng, không viền từng cái
      '<div class="card grid" id="rv-list" style="max-width:820px;padding:8px 24px"></div>' +
      '<div id="rv-pager" class="flex items-center justify-center gap-2 mt-5"></div>';

    paintReviews(list);
    $('#rv-pager').addEventListener('click', function (e) {
      var b = e.target.closest('[data-pg]'); if (!b || b.disabled) return;
      rvPage = +b.getAttribute('data-pg');
      paintReviews(allReviews());
      $('#reviews-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Chọn sao
    var picked = 0;
    var starsWrap = $('#rv-stars');
    starsWrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-star]'); if (!b) return;
      picked = +b.getAttribute('data-star');
      starsWrap.querySelectorAll('.rv-star').forEach(function (s, i) { s.classList.toggle('on', i < picked); });
      var w = document.querySelector('[data-field="rv-rating"]'); if (w) w.classList.remove('has-error');
    });

    // Xoá lỗi khi gõ
    ['rv-name', 'rv-text'].forEach(function (id) {
      var el = $('#' + id); if (el) el.addEventListener('input', function () { var w = el.closest('.field'); if (w) w.classList.remove('has-error'); });
    });

    $('#rv-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#rv-name').value.trim();
      var text = $('#rv-text').value.trim();
      var ok = true;
      if (name.length < 2) { setFieldErr('rv-name', t('rv_err_name', 'Vui lòng nhập họ tên')); ok = false; }
      if (!picked) { setFieldErr('rv-rating', t('rv_err_rate', 'Vui lòng chọn số sao')); ok = false; }
      if (text.length < 10) { setFieldErr('rv-text', t('rv_err_text', 'Nhận xét tối thiểu 10 ký tự')); ok = false; }
      if (!ok) return;
      var reviews = getUserReviews();
      reviews.unshift({ name: name, rating: picked, text: text, at: Date.now() });
      try { localStorage.setItem(reviewKey(), JSON.stringify(reviews)); } catch (e2) {}
      renderReviews(); // vẽ lại: cập nhật trung bình + danh sách
      S.toast(t('rv_thanks', 'Cảm ơn đánh giá của bạn!'), 'ok');
    });
  }

  // Bố cục bám Figma: avatar · tên + chức danh bên trái, ngày + sao bên phải,
  // nội dung nhận xét trải hết bề ngang phía dưới.
  function reviewCard(rv) {
    var when = rv.when || (rv.at ? new Date(rv.at).toLocaleDateString(S.isEN() ? 'en-US' : 'vi-VN') : '');
    var ini = (rv.name || 'K').trim().charAt(0).toUpperCase();
    return '<div class="rv-item">' +
      '<div class="flex items-start gap-4">' +
        '<span class="rv-avatar">' + ini + '</span>' +
        '<div class="flex-1" style="min-width:0">' +
          '<div class="flex items-start justify-between gap-3">' +
            '<div>' +
              '<p class="font-bold">' + rv.name + '</p>' +
              (rv.role ? '<p class="text-muted text-sm" style="margin-top:2px">' + rv.role + '</p>' : '') +
            '</div>' +
            '<div style="flex:none;text-align:right">' +
              (when ? '<p class="text-muted text-sm">' + when + '</p>' : '') +
              '<div class="flex justify-end" style="margin-top:6px">' + S.starHTML(rv.rating) + '</div>' +
            '</div>' +
          '</div>' +
          '<p class="text-muted" style="line-height:1.7;margin-top:12px">' + rv.text + '</p>' +
        '</div>' +
      '</div></div>';
  }
  function setFieldErr(f, msg) { var w = document.querySelector('[data-field="' + f + '"]'); if (!w) return; w.classList.add('has-error'); var e = w.querySelector('.field__error'); if (e) e.textContent = msg; }

  /* ---------- Tính chi phí thuê (tiện ích động, theo tiền tệ) ---------- */
  function renderFinance() {
    var host = $('#finance-calc'); if (!host) return;
    var EN = S.isEN();
    var price = S.curPrice(car);
    var DRIVER = EN ? 20 : 500000, INSURANCE = EN ? 8 : 150000, DELIVERY = EN ? 12 : 300000;
    var D = S.unitDay();
    host.innerHTML =
      '<h2 class="section-title mb-2">' + t('fin_title', 'Tính chi phí thuê') + '</h2>' +
      '<p class="text-muted mb-6">' + t('fin_pre', 'Ước tính tổng chi phí thuê mẫu') + ' <strong class="text-ink">' + car.name + '</strong> ' + t('fin_post', 'theo số ngày. Số liệu chỉ mang tính tham khảo.') + '</p>' +
      '<div class="grid gap-6 lg:grid-cols-[1fr_360px] items-start" style="max-width:900px">' +
        '<div class="card p-6 grid gap-5">' +
          '<div class="field"><label>' + t('fin_days', 'Số ngày thuê') + ': <span id="fn-days-label" class="text-primary font-bold"></span></label><input type="range" id="fn-days" min="1" max="30" step="1" value="3" style="width:100%;accent-color:var(--primary)" /></div>' +
          '<label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="fn-driver" style="width:18px;height:18px;accent-color:var(--primary)" /> <span>' + t('fin_driver', 'Thuê kèm tài xế') + ' <span class="text-muted text-sm">(+' + S.fmtMoneyN(DRIVER) + '/' + D + ')</span></span></label>' +
          '<label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="fn-ins" checked style="width:18px;height:18px;accent-color:var(--primary)" /> <span>' + t('fin_ins', 'Bảo hiểm thuê xe') + ' <span class="text-muted text-sm">(+' + S.fmtMoneyN(INSURANCE) + '/' + D + ')</span></span></label>' +
          '<label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="fn-deliver" style="width:18px;height:18px;accent-color:var(--primary)" /> <span>' + t('fin_deliver', 'Giao xe tận nơi') + ' <span class="text-muted text-sm">(+' + S.fmtMoneyN(DELIVERY) + ')</span></span></label>' +
        '</div>' +
        '<div class="card p-6" style="background:var(--bg)">' +
          '<p class="text-muted text-sm">' + t('fin_total', 'Tổng chi phí thuê') + '</p>' +
          '<p class="text-3xl font-extrabold text-primary mb-4" id="fn-total">—</p>' +
          '<div class="grid gap-2 text-sm">' +
            '<div class="flex justify-between"><span class="text-muted">' + t('fin_unit', 'Đơn giá thuê') + '</span><span class="font-semibold">' + S.fmtMoneyN(price) + '/' + D + '</span></div>' +
            '<div class="flex justify-between"><span class="text-muted">' + t('fin_carcost_n', 'Tiền xe') + ' (<span id="fn-days-x">3</span> ' + D + ')</span><span class="font-semibold" id="fn-base">—</span></div>' +
            '<div class="flex justify-between"><span class="text-muted">' + t('fin_extra', 'Phụ phí') + '</span><span class="font-semibold" id="fn-extra">—</span></div>' +
            '<div class="divider my-1"></div>' +
            '<div class="flex justify-between"><span class="font-bold">' + t('fin_sum', 'Tổng cộng') + '</span><span class="font-extrabold" id="fn-sum">—</span></div>' +
          '</div>' +
          '<a class="btn btn-primary btn-block mt-5" href="payment.html?id=' + car.id + '">' + t('btn_rent_now', 'Thuê xe ngay') + '</a>' +
        '</div>' +
      '</div>';

    function calc() {
      var days = +$('#fn-days').value;
      $('#fn-days-label').textContent = days + ' ' + D;
      $('#fn-days-x').textContent = days;
      var base = price * days;
      var extra = 0;
      if ($('#fn-driver').checked) extra += DRIVER * days;
      if ($('#fn-ins').checked) extra += INSURANCE * days;
      if ($('#fn-deliver').checked) extra += DELIVERY;
      var total = base + extra;
      $('#fn-base').textContent = S.fmtMoneyN(base);
      $('#fn-extra').textContent = S.fmtMoneyN(extra);
      $('#fn-sum').textContent = S.fmtMoneyN(total);
      $('#fn-total').innerHTML = S.fmtMoneyN(total) + '<span style="font-size:14px;font-weight:600" class="text-muted"> / ' + days + ' ' + D + '</span>';
    }
    ['#fn-days', '#fn-driver', '#fn-ins', '#fn-deliver'].forEach(function (sel) {
      var el = $(sel); el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', calc);
    });
    calc();
  }
})();
