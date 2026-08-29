/* =============================================================
   payment.js — Trang thanh toán thuê xe (khớp Figma Payment · JS động)
   - Wizard 4 bước: Thông tin thanh toán · Lịch nhận/bàn giao · Phương thức · Xác nhận (validate từng bước).
   - Tính tổng tiền thuê (số ngày × đơn giá + thuế − ưu đãi) + mã ưu đãi, validate đầy đủ.
   - Lưu đơn vào localStorage + POST /api/orders (nếu có server) — fallback im lặng.
   - ⚠️ Bản mô phỏng cho đồ án: KHÔNG thu phí thật, không gửi dữ liệu thẻ ra ngoài.
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  var API = window.MorentAPI;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function qs(n) { return new URLSearchParams(location.search).get(n); }
  var TIMES = ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'];
  var PROMOS = { vi: { 'MORENT10': 200000, 'THUE5': 100000 }, en: { 'MORENT10': 10, 'THUE5': 5 } };

  var car, discount = 0;

  function todayStr(o) { var d = new Date(); d.setDate(d.getDate() + (o || 0)); return d.toISOString().slice(0, 10); }

  S.ready(function () {
    car = S.getCar(qs('id')) || S.CARS[0];
    if (!car) { S.toast(t('pay_notfound', 'Không tìm thấy xe'), 'err'); return; }

    // ----- Tóm tắt đơn -----
    $('#sum-car-img').innerHTML = S.carImage(car);
    $('#sum-car-name').textContent = car.name;
    $('#sum-car-rating').innerHTML = S.starHTML(car.rating) + '<span class="text-muted text-xs">' + car.rating + ' · ' + t('reviews_440', '440+ đánh giá') + '</span>';
    $('#sum-price').textContent = S.fmtMoneyN(S.curPrice(car)) + '/' + S.unitDay();
    // Gợi ý mã ưu đãi (theo tiền tệ hiện tại)
    var hintEl = $('#promo-hint');
    if (hintEl) hintEl.innerHTML = t('pay_promo_hint_a', 'Thử mã') + ' <strong>MORENT10</strong> ' + t('pay_promo_hint_b', 'để giảm') + ' ' + S.fmtMoneyN(PROMOS[S.isEN() ? 'en' : 'vi']['MORENT10']) + '.';
    renderTotals();
    $('#pickup-date').addEventListener('change', renderTotals);
    $('#drop-date').addEventListener('change', renderTotals);

    // ----- Selects chi nhánh / giờ -----
    var branchOpts = '<option value="">' + t('pay_sel_branch', '-- Chọn chi nhánh --') + '</option>' + S.BRANCHES.map(function (b) { return '<option>' + b + '</option>'; }).join('');
    var timeOpts = '<option value="">' + t('pay_sel_time', '-- Chọn giờ --') + '</option>' + TIMES.map(function (x) { return '<option>' + x + '</option>'; }).join('');
    $('#pickup-branch').innerHTML = branchOpts; $('#drop-branch').innerHTML = branchOpts;
    $('#pickup-time').innerHTML = timeOpts; $('#drop-time').innerHTML = timeOpts;
    $('#pickup-date').min = todayStr(0); $('#pickup-date').value = todayStr(1);
    $('#drop-date').min = todayStr(0); $('#drop-date').value = todayStr(3);

    // Ngày bàn giao không được trước ngày nhận: khoá vùng chọn và tự kéo theo
    // khi người dùng dời ngày nhận lên sau. Giống quy tắc ở biểu mẫu trang chủ.
    function dongBoNgay() {
      var p = $('#pickup-date'), d = $('#drop-date');
      if (!p || !d) return;
      d.min = p.value || todayStr(0);
      if (p.value && d.value && d.value < p.value) d.value = p.value;
      renderTotals();
    }
    $('#pickup-date').addEventListener('change', dongBoNgay);
    $('#drop-date').addEventListener('change', dongBoNgay);
    dongBoNgay();

    renderTotals(); // tính lại sau khi đã có ngày nhận/trả

    // ----- Prefill từ tài khoản -----
    var user = null, profile = {};
    try { user = JSON.parse(localStorage.getItem('sr_user') || 'null'); profile = JSON.parse(localStorage.getItem('sr_profile') || '{}'); } catch (e) {}
    if (user) { $('#bill-name').value = user.name || ''; }
    if (profile.phone) $('#bill-phone').value = profile.phone;
    if (profile.city) $('#bill-city').value = profile.city;

    // ----- Phương thức thanh toán -----
    document.querySelectorAll('input[name="method"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.querySelectorAll('.pay-method').forEach(function (m) {
          m.classList.toggle('pay-method--active', m.getAttribute('data-method') === r.value);
        });
        $('#card-fields').style.display = r.value === 'card' ? '' : 'none';
      });
    });

    // ----- Format thẻ -----
    $('#card-number').addEventListener('input', function () {
      var v = this.value.replace(/\D/g, '').slice(0, 16);
      this.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
    $('#card-exp').addEventListener('input', function () {
      var v = this.value.replace(/\D/g, '').slice(0, 6);
      this.value = v.replace(/(.{2})(?=.)/g, '$1 / ');
    });
    $('#card-cvc').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });

    // ----- Mã ưu đãi -----
    $('#promo-apply').addEventListener('click', function () {
      var code = $('#promo-code').value.trim().toUpperCase();
      if (!code) return;
      var table = PROMOS[S.isEN() ? 'en' : 'vi'];
      if (table[code]) { discount = table[code]; S.toast(t('pay_promo_ok', 'Áp dụng mã ưu đãi thành công!'), 'ok'); }
      else { discount = 0; S.toast(t('pay_promo_bad', 'Mã ưu đãi không hợp lệ'), 'err'); }
      renderTotals();
    });

    // ----- Xoá lỗi khi gõ -----
    document.querySelectorAll('.input, .select').forEach(function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () { var w = el.closest('.field'); if (w) w.classList.remove('has-error'); });
    });

    $('#pay-form').addEventListener('submit', onSubmit);

    // Bật chế độ wizard nhiều bước (validate từng bước trước khi sang bước kế)
    setupWizard();
  });

  function calcDays() {
    var p = $('#pickup-date').value, d = $('#drop-date').value;
    if (!p || !d) return 1;
    var ms = new Date(d) - new Date(p);
    return Math.max(1, Math.round(ms / 86400000));
  }
  var TAX_RATE = 0.10; // VAT 10%
  function renderTotals() {
    var days = calcDays();
    var subtotal = S.curPrice(car) * days;
    var taxable = Math.max(0, subtotal - discount);
    var tax = Math.round(taxable * TAX_RATE);
    var total = taxable + tax;
    var daysEl = $('#sum-days'); if (daysEl) daysEl.textContent = days + ' ' + S.unitDay();
    var subEl = $('#sum-subtotal'); if (subEl) subEl.textContent = S.fmtMoneyN(subtotal);
    $('#sum-discount').textContent = discount ? '- ' + S.fmtMoneyN(discount) : S.fmtMoneyN(0);
    var taxEl = $('#sum-tax'); if (taxEl) taxEl.textContent = S.fmtMoneyN(tax);
    $('#sum-total').textContent = S.fmtMoneyN(total);
  }
  // Tổng cuối (gồm thuế) — dùng cho đơn hàng
  function grandTotal() {
    var taxable = Math.max(0, S.curPrice(car) * calcDays() - discount);
    return taxable + Math.round(taxable * TAX_RATE);
  }

  function setError(f, msg) { var w = document.querySelector('[data-field="' + f + '"]'); if (!w) return; w.classList.add('has-error'); var e = w.querySelector('.field__error'); if (e) e.textContent = msg; }

  /* ---------- Wizard: hiện 1 bước mỗi lần, validate trước khi sang bước kế ---------- */
  var steps = [], current = 0;
  function goStep(i) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, idx) { s.hidden = idx !== current; });
    var back = $('#pay-back'), next = $('#pay-next'), submit = $('#pay-submit');
    if (back) back.style.visibility = current === 0 ? 'hidden' : 'visible';
    var last = current === steps.length - 1;
    if (next) next.style.display = last ? 'none' : '';
    if (submit) submit.style.display = last ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function setupWizard() {
    steps = Array.prototype.slice.call($('#pay-form').querySelectorAll(':scope > section'));
    if (steps.length < 2) return; // an toàn
    // Thanh điều hướng Back / Next
    var nav = document.createElement('div');
    nav.className = 'flex items-center justify-between gap-3';
    nav.innerHTML =
      '<button type="button" class="btn btn-ghost" id="pay-back">' + t('pay_back', 'Quay lại') + '</button>' +
      '<button type="button" class="btn btn-primary" id="pay-next">' + t('pay_next', 'Tiếp tục') + '</button>';
    $('#pay-form').appendChild(nav);
    $('#pay-next').addEventListener('click', function () {
      document.querySelectorAll('.field.has-error').forEach(function (w) { w.classList.remove('has-error'); });
      var errs = stepErrors(current);
      if (errs.length) { showErrs(errs); return; }
      goStep(current + 1);
    });
    $('#pay-back').addEventListener('click', function () { goStep(current - 1); });
    goStep(0);
  }

  /* ---------- Validate THEO TỪNG BƯỚC (wizard) ---------- */
  function stepErrors(i) {
    var errs = [];
    if (i === 0) { // Thông tin thanh toán
      var name = $('#bill-name').value.trim(), phone = $('#bill-phone').value.trim();
      if (name.length < 2) errs.push(['bill-name', t('pay_err_name', 'Vui lòng nhập họ tên')]);
      if (!/^(0\d{9}|\+84\d{9})$/.test(phone.replace(/[\s.]/g, ''))) errs.push(['bill-phone', t('pay_err_phone', 'Số điện thoại không hợp lệ')]);
      if (!$('#bill-address').value.trim()) errs.push(['bill-address', t('pay_err_addr', 'Vui lòng nhập địa chỉ')]);
    } else if (i === 1) { // Lịch nhận/bàn giao
      if (!$('#pickup-branch').value) errs.push(['pickup-branch', t('pay_err_branch', 'Chọn chi nhánh nhận xe')]);
      if (!$('#pickup-date').value) errs.push(['pickup-date', t('pay_err_date', 'Chọn ngày')]);
      if (!$('#pickup-time').value) errs.push(['pickup-time', t('pay_err_time', 'Chọn giờ')]);
    } else if (i === 2) { // Phương thức thanh toán
      var method = (document.querySelector('input[name="method"]:checked') || {}).value;
      if (method === 'card') {
        var cnum = $('#card-number').value.replace(/\s/g, '');
        if (cnum.length < 13) errs.push(['card-number', t('pay_err_card', 'Số thẻ không hợp lệ')]);
        if (!/^\d{2}\s?\/\s?\d{2}(\s?\/\s?\d{2})?$/.test($('#card-exp').value.trim())) errs.push(['card-exp', t('pay_err_exp', 'Ngày hết hạn không hợp lệ')]);
        if (!$('#card-holder').value.trim()) errs.push(['card-holder', t('pay_err_holder', 'Nhập tên chủ thẻ')]);
        if ($('#card-cvc').value.trim().length < 3) errs.push(['card-cvc', t('pay_err_cvc', 'CVC không hợp lệ')]);
      }
    } else if (i === 3) { // Xác nhận
      if (!$('#agree-terms').checked) errs.push(['agree-terms', t('pay_err_terms', 'Bạn cần đồng ý điều khoản để tiếp tục')]);
    }
    return errs;
  }
  function showErrs(errs) {
    errs.forEach(function (x) { setError(x[0], x[1]); });
    var first = document.querySelector('[data-field="' + errs[0][0] + '"]');
    if (first) { var inp = first.querySelector('input,select'); if (inp) inp.focus(); }
    S.toast(t('pay_check', 'Vui lòng kiểm tra lại thông tin'), 'err');
  }

  function onSubmit(e) {
    e.preventDefault();
    document.querySelectorAll('.field.has-error').forEach(function (w) { w.classList.remove('has-error'); });
    // Kiểm tra lại toàn bộ các bước (an toàn); nếu bước nào lỗi thì nhảy về bước đó
    for (var i = 0; i < 4; i++) {
      var errs = stepErrors(i);
      if (errs.length) { goStep(i); showErrs(errs); return; }
    }
    var method = (document.querySelector('input[name="method"]:checked') || {}).value;
    var order = {
      id: 'DH' + Date.now(),
      carId: car.id, carName: car.name,
      name: $('#bill-name').value.trim(), phone: $('#bill-phone').value.trim(), address: $('#bill-address').value.trim(), city: $('#bill-city').value.trim(),
      pickupBranch: $('#pickup-branch').value, pickupDate: $('#pickup-date').value, pickupTime: $('#pickup-time').value,
      dropBranch: $('#drop-branch').value, dropDate: $('#drop-date').value, dropTime: $('#drop-time').value,
      method: method, days: calcDays(), deposit: grandTotal(), discount: discount, currency: (S.isEN() ? 'USD' : 'VND'),
      createdAt: new Date().toISOString()
    };
    // KHÔNG lưu số thẻ/CVC — bảo mật (bản demo).
    try {
      var list = JSON.parse(localStorage.getItem('sr_orders') || '[]');
      list.push(order); localStorage.setItem('sr_orders', JSON.stringify(list));
    } catch (e2) {}
    // Gửi lên API nếu có (fallback im lặng nếu không có server)
    if (API && API.createOrder) { API.createOrder(order).catch(function () {}); }

    showSuccess(order);
  }

  function showSuccess(o) {
    var main = document.querySelector('main');
    main.innerHTML =
      '<div class="container-x py-16"><div class="card p-8 sm:p-12 text-center" style="max-width:640px;margin:0 auto">' +
      '<div class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6" style="font-size:40px">✓</div>' +
      '<h1 class="text-2xl font-extrabold mb-2">' + t('pay_ok_t', 'Đặt thuê thành công!') + '</h1>' +
      '<p class="text-muted mb-8">' + t('pay_ok_1', 'Cảm ơn') + ' <strong class="text-ink">' + o.name + '</strong>' + t('pay_ok_2', '. Morent đã giữ xe') + ' <strong class="text-ink">' + o.carName + '</strong> ' + t('pay_ok_3', 'cho bạn. Nhân viên sẽ liên hệ số') + ' <strong class="text-ink">' + o.phone + '</strong> ' + t('pay_ok_4', 'để xác nhận và bàn giao xe.') + '</p>' +
      '<div class="card p-6 text-left grid gap-3" style="background:var(--bg)">' +
        row(t('pay_row_order', 'Mã đơn thuê'), o.id) +
        row(t('pay_row_car', 'Mẫu xe'), o.carName) +
        row(t('pay_row_place', 'Nơi nhận xe'), o.pickupBranch) +
        row(t('pay_row_pickup', 'Nhận xe'), o.pickupTime + ' · ' + o.pickupDate) +
        row(t('pay_row_days', 'Số ngày thuê'), o.days + ' ' + S.unitDay()) +
        row(t('pay_row_total', 'Tổng tiền thuê'), S.fmtMoneyN(o.deposit)) +
      '</div>' +
      '<div class="flex flex-wrap gap-3 justify-center mt-8">' +
        '<a class="btn btn-primary" href="account.html">' + t('pay_ok_account', 'Xem tài khoản') + '</a>' +
        '<a class="btn btn-ghost" href="cars.html">' + t('pay_ok_more', 'Tiếp tục thuê xe') + '</a>' +
      '</div></div></div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    S.toast(t('pay_done', 'Đặt thuê xe thành công!'), 'ok');
  }
  function row(k, v) { return '<div class="flex justify-between gap-4"><span class="text-muted">' + k + '</span><span class="font-semibold text-right">' + v + '</span></div>'; }
})();
