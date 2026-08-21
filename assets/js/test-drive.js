/* =============================================================
   test-drive.js — Form đăng ký lái thử + validate (JS bắt buộc #3)
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function qs(n) { return new URLSearchParams(location.search).get(n); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  var TIMES = ['08:00', '09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30'];

  function todayStr(offset) { var d = new Date(); d.setDate(d.getDate() + (offset || 0)); return d.toISOString().slice(0, 10); }

  S.ready(function () {
    // Fill selects
    $('#td-car').innerHTML = '<option value="">' + t('td_sel_car', '-- Chọn xe --') + '</option>' +
      S.CARS.map(function (c) { return '<option value="' + c.id + '">' + c.name + ' (' + S.fmtMoneyN(S.curPrice(c)) + '/' + S.unitDay() + ')</option>'; }).join('');
    $('#td-branch').innerHTML = '<option value="">' + t('td_sel_branch', '-- Chọn chi nhánh --') + '</option>' +
      S.BRANCHES.map(function (b) { return '<option value="' + b + '">' + b + '</option>'; }).join('');
    $('#td-time').innerHTML = '<option value="">' + t('td_sel_time', '-- Chọn giờ --') + '</option>' +
      TIMES.map(function (x) { return '<option value="' + x + '">' + x + '</option>'; }).join('');

    var dateEl = $('#td-date');
    dateEl.min = todayStr(0);
    dateEl.value = qs('date') || todayStr(1);

    // Preselect từ query
    if (qs('car')) $('#td-car').value = qs('car');
    if (qs('branch')) $('#td-branch').value = qs('branch');
    if (qs('time')) $('#td-time').value = qs('time');

    updatePreview();
    $('#td-car').addEventListener('change', updatePreview);

    // Xóa lỗi khi người dùng sửa
    ['name', 'phone', 'email', 'car', 'branch', 'date', 'time', 'agree'].forEach(function (f) {
      var el = $('#td-' + f);
      if (el) el.addEventListener('input', function () { clearError(f); });
      if (el) el.addEventListener('change', function () { clearError(f); });
    });

    $('#td-form').addEventListener('submit', onSubmit);
    $('#td-reset').addEventListener('click', function () {
      setTimeout(function () { clearAllErrors(); dateEl.value = todayStr(1); updatePreview(); }, 0);
    });
  });

  function updatePreview() {
    var car = S.getCar($('#td-car').value);
    var box = $('#td-preview');
    if (!car) {
      box.innerHTML = '<p class="font-bold text-lg mb-2">' + t('td_prev_t', 'Xe muốn thuê') + '</p><p class="text-muted text-sm">' + t('td_prev_p', 'Chọn một mẫu xe để xem thông tin tại đây.') + '</p>' +
        '<div style="opacity:.4;max-width:200px;margin:12px auto">' + S.carSVG('#C3D4E9') + '</div>';
      return;
    }
    box.innerHTML =
      '<p class="text-muted font-semibold text-sm">' + car.type + ' · ' + car.brand + '</p>' +
      '<p class="font-bold text-lg">' + car.name + '</p>' +
      '<div style="max-width:240px;margin:10px auto">' + S.carImage(car) + '</div>' +
      '<div class="flex items-center justify-between border-t pt-3" style="border-color:var(--line)">' +
        '<span class="text-muted text-sm">' + t('td_price', 'Giá thuê') + '</span><span class="font-extrabold text-primary">' + S.fmtMoneyN(S.curPrice(car)) + '/' + S.unitDay() + '</span></div>';
  }

  /* ---------- Validate ---------- */
  function setError(field, msg) {
    var wrap = document.querySelector('[data-field="' + field + '"]');
    if (!wrap) return;
    wrap.classList.add('has-error');
    var e = wrap.querySelector('.field__error'); if (e) e.textContent = msg;
  }
  function clearError(field) {
    var wrap = document.querySelector('[data-field="' + field + '"]');
    if (wrap) wrap.classList.remove('has-error');
  }
  function clearAllErrors() { document.querySelectorAll('.field.has-error').forEach(function (w) { w.classList.remove('has-error'); }); }

  function onSubmit(e) {
    e.preventDefault();
    clearAllErrors();
    var errors = [];
    var name = $('#td-name').value.trim();
    var phone = $('#td-phone').value.trim();
    var email = $('#td-email').value.trim();
    var car = $('#td-car').value;
    var branch = $('#td-branch').value;
    var date = $('#td-date').value;
    var time = $('#td-time').value;
    var agree = $('#td-agree').checked;

    if (name.length < 2) errors.push(['name', t('td_err_name', 'Vui lòng nhập họ tên hợp lệ')]);
    var phoneClean = phone.replace(/[\s.]/g, '');
    if (!/^(0\d{9}|\+84\d{9})$/.test(phoneClean)) errors.push(['phone', t('td_err_phone', 'Số điện thoại không hợp lệ')]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(['email', t('td_err_email', 'Email không hợp lệ')]);
    if (!car) errors.push(['car', t('td_err_car', 'Vui lòng chọn mẫu xe')]);
    if (!branch) errors.push(['branch', t('td_err_branch', 'Vui lòng chọn chi nhánh')]);
    if (!date) errors.push(['date', t('td_err_date', 'Vui lòng chọn ngày hẹn')]);
    else if (date < todayStr(0)) errors.push(['date', t('td_err_date_past', 'Ngày hẹn không được ở quá khứ')]);
    if (!time) errors.push(['time', t('td_err_time', 'Vui lòng chọn giờ hẹn')]);
    if (!agree) errors.push(['agree', t('td_err_agree', 'Bạn cần đồng ý điều khoản để tiếp tục')]);

    if (errors.length) {
      errors.forEach(function (er) { setError(er[0], er[1]); });
      var first = document.querySelector('[data-field="' + errors[0][0] + '"] .input, [data-field="' + errors[0][0] + '"] .select, [data-field="' + errors[0][0] + '"] input');
      if (first) first.focus();
      S.toast(t('pay_check', 'Vui lòng kiểm tra lại thông tin'), 'err');
      return;
    }

    // Lưu lịch hẹn (localStorage — luôn có, để account/admin đọc offline)
    var booking = { name: name, phone: phone, email: email, car: car, branch: branch, date: date, time: time, note: $('#td-note').value.trim(), at: Date.now() };
    try {
      var list = JSON.parse(localStorage.getItem('sr_bookings') || '[]');
      list.push(booking); localStorage.setItem('sr_bookings', JSON.stringify(list));
    } catch (e2) {}

    // Gửi lên API nếu có server (fallback im lặng khi chạy tĩnh)
    var api = window.MorentAPI;
    if (api && api.createTestDrive) { api.createTestDrive(booking).catch(function () {}); }

    showSuccess(booking);
    S.toast(t('td_ok', 'Đặt lịch nhận xe thành công!'), 'ok');
  }

  function showSuccess(b) {
    var car = S.getCar(b.car);
    var main = document.querySelector('main');
    main.innerHTML =
      '<div class="container-x py-16"><div class="card p-8 sm:p-12 text-center" style="max-width:620px;margin:0 auto">' +
      '<div class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-6" style="font-size:40px">✓</div>' +
      '<h1 class="text-2xl font-extrabold mb-2">' + t('td_ok_t', 'Đăng ký thành công!') + '</h1>' +
      '<p class="text-muted mb-8">' + t('td_ok_1', 'Cảm ơn') + ' <strong class="text-ink">' + b.name + '</strong>' + t('td_ok_2', '. Morent sẽ liên hệ số') + ' <strong class="text-ink">' + b.phone + '</strong> ' + t('td_ok_3', 'để xác nhận lịch nhận xe.') + '</p>' +
      '<div class="card p-6 text-left grid gap-3" style="background:var(--bg)">' +
        row(t('pay_row_car', 'Mẫu xe'), car ? car.name : b.car) +
        row(t('td_branch', 'Chi nhánh'), b.branch) +
        row(t('td_row_time', 'Thời gian'), b.time + ' · ' + b.date) +
      '</div>' +
      '<div class="flex flex-wrap gap-3 justify-center mt-8">' +
        '<a class="btn btn-primary" href="cars.html">' + t('td_ok_more', 'Xem thêm xe') + '</a>' +
        '<a class="btn btn-ghost" href="index.html">' + t('td_ok_home', 'Về trang chủ') + '</a>' +
      '</div></div></div>';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function row(k, v) { return '<div class="flex justify-between gap-4"><span class="text-muted">' + k + '</span><span class="font-semibold text-right">' + v + '</span></div>'; }
})();
