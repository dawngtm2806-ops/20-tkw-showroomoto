/* =============================================================
   main.js — Trang chủ (index.html)
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function $(s, r) { return (r || document).querySelector(s); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  var TIMES = ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'];

  function fillSelect(el, items, placeholder) {
    if (!el) return;
    el.innerHTML = (placeholder ? '<option value="">' + placeholder + '</option>' : '') +
      items.map(function (x) { return '<option value="' + x + '">' + x + '</option>'; }).join('');
  }

  function todayPlus(days) {
    var d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  S.ready(function () {
    /* ----- Booking bar ----- */
    fillSelect($('#bk-branch-a'), S.BRANCHES);
    fillSelect($('#bk-branch-b'), S.BRANCHES);
    fillSelect($('#bk-time-a'), TIMES);
    fillSelect($('#bk-time-b'), TIMES);
    var da = $('#bk-date-a'), db = $('#bk-date-b');
    if (da) { da.value = todayPlus(1); da.min = todayPlus(0); }
    if (db) { db.value = todayPlus(3); db.min = todayPlus(1); }
    var bb = $('#bk-branch-b'); if (bb) bb.selectedIndex = 1;

    /* ----- Chặn ngày quá khứ + chặn trả trước nhận + tính số ngày → giá tạm tính ----- */
    function t(k, f) { return S.t ? S.t(k, f) : f; }
    var fromRate = Math.min.apply(null, S.CARS.map(function (c) { return S.curPrice(c); }));
    function daysBetween() {
      if (!da || !db || !da.value || !db.value) return 1;
      return Math.max(1, Math.round((new Date(db.value) - new Date(da.value)) / 86400000));
    }
    function syncDates() {
      // trả không được trước nhận: min của ngày trả = ngày nhận
      if (da && db) {
        db.min = da.value || todayPlus(0);
        if (db.value && da.value && db.value < da.value) db.value = da.value;
      }
      updateEstimate();
    }
    function updateEstimate() {
      var est = $('#bk-estimate'); if (!est) return;
      var d = daysBetween();
      est.innerHTML = t('bk_days', 'Số ngày thuê') + ': <strong class="text-ink">' + d + ' ' + S.unitDay() +
        '</strong> · ' + t('bk_est_from', 'Tạm tính từ') + ' <strong class="text-primary">' + S.fmtMoneyN(fromRate * d) + '</strong>';
    }
    if (da) da.addEventListener('change', syncDates);
    if (db) db.addEventListener('change', syncDates);
    syncDates();

    var swap = $('#bk-swap');
    if (swap) swap.addEventListener('click', function () {
      var a = $('#bk-branch-a'), b = $('#bk-branch-b');
      var tmp = a.value; a.value = b.value; b.value = tmp;
      S.toast(S.t ? S.t('bk_swapped', 'Đã đổi chi nhánh nhận/trả xe') : 'Đã đổi chi nhánh nhận/trả xe');
    });

    var submit = $('#bk-submit');
    if (submit) submit.addEventListener('click', function () {
      var branch = $('#bk-branch-a').value;
      var date = $('#bk-date-a').value;
      var time = $('#bk-time-a').value;
      var q = 'branch=' + encodeURIComponent(branch) + '&date=' + encodeURIComponent(date) + '&time=' + encodeURIComponent(time);
      location.href = 'test-drive.html?' + q;
    });

    /* ----- Danh sách xe ----- */
    var popular = S.CARS.filter(function (c) { return c.tags.indexOf('popular') !== -1; }).slice(0, 4);
    var recommend = S.CARS.slice(0, 8);

    var popEl = $('#popular-cars');
    if (popEl) popEl.innerHTML = popular.map(S.carCardHTML).join('');
    var recEl = $('#recommend-cars');
    if (recEl) recEl.innerHTML = recommend.map(S.carCardHTML).join('');

    var totalEl = $('#total-count'); if (totalEl) totalEl.textContent = '(' + S.CARS.length + ')';

    /* ----- Logo đối tác thương hiệu (ảnh thật, khung tròn, có chuyển động) ----- */
    var PARTNERS = [
      { name: 'Mercedes-Benz', logo: 'assets/img/brands/mercedes.png' },
      { name: 'BMW', logo: 'assets/img/brands/bmw.png' },
      { name: 'Audi', logo: 'assets/img/brands/audi.png' },
      { name: 'Volkswagen', logo: 'assets/img/brands/vw.png' },
      { name: 'Peugeot', logo: 'assets/img/brands/peugeot.png' },
      { name: 'Ford', logo: 'assets/img/brands/ford.png' }
    ];
    var strip = $('#brand-strip');
    if (strip) strip.innerHTML = PARTNERS.map(function (p, i) {
      return '<div class="brand-logo" title="' + p.name + '">' +
        '<img src="' + p.logo + '" alt="' + p.name + '" class="brand-logo__img" style="animation-delay:' + (i * 0.22).toFixed(2) + 's" />' +
      '</div>';
    }).join('');

    /* ----- Kích hoạt tương tác ----- */
    S.wireCards(document);
    S.initReveal();
  });
})();
