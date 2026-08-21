/* =============================================================
   contact.js — Trang liên hệ: thông tin + chi nhánh + validate form
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  var ADDR = {
    'Morent Quận 1 (TP.HCM)': '123 Nguyễn Huệ, Q.1, TP.HCM',
    'Morent Quận 7 (TP.HCM)': '456 Nguyễn Thị Thập, Q.7, TP.HCM',
    'Morent Cầu Giấy (Hà Nội)': '789 Cầu Giấy, Q.Cầu Giấy, Hà Nội',
    'Morent Hải Châu (Đà Nẵng)': '101 Nguyễn Văn Linh, Q.Hải Châu, Đà Nẵng'
  };

  function infoCard(icon, title, value, href) {
    var v = href ? '<a href="' + href + '" class="font-bold text-ink">' + value + '</a>' : '<span class="font-bold">' + value + '</span>';
    return '<div class="card p-5 flex items-start gap-4"><span class="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">' + icon + '</span>' +
      '<div><p class="text-muted text-sm">' + title + '</p>' + v + '</div></div>';
  }

  ready(function () {
    $('#contact-info').innerHTML =
      infoCard(S.ICON.phone, t('ct_hotline', 'Hotline (8:00 - 21:00)'), '1900 1234', 'tel:19001234') +
      infoCard(S.ICON.mail, t('lbl_email', 'Email'), 'hello@morent.vn', 'mailto:hello@morent.vn') +
      infoCard(S.ICON.pin, t('ct_hq', 'Trụ sở chính'), '123 Nguyễn Huệ, Q.1, TP.HCM') +
      infoCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>', t('ct_hours', 'Giờ làm việc'), t('ct_hours_v', 'T2 - CN: 8:00 - 21:00'));

    $('#branches').innerHTML = S.BRANCHES.map(function (b) {
      return '<div class="card p-5 reveal hover-lift"><span class="text-primary">' + S.ICON.pin + '</span>' +
        '<h3 class="font-bold mt-2 mb-1">' + b + '</h3>' +
        '<p class="text-muted text-sm mb-3">' + (ADDR[b] || '') + '</p>' +
        '<a class="text-primary font-semibold text-sm" href="tel:19001234">' + t('ct_call', 'Gọi') + ': 1900 1234</a></div>';
    }).join('');
    S.initReveal();

    ['name', 'phone', 'email', 'message'].forEach(function (f) {
      var el = $('#ct-' + f);
      if (el) el.addEventListener('input', function () { clearError(f); });
    });

    $('#ct-form').addEventListener('submit', onSubmit);
  });

  function setError(f, msg) {
    var w = document.querySelector('[data-field="' + f + '"]');
    if (!w) return; w.classList.add('has-error');
    var e = w.querySelector('.field__error'); if (e) e.textContent = msg;
  }
  function clearError(f) { var w = document.querySelector('[data-field="' + f + '"]'); if (w) w.classList.remove('has-error'); }

  function onSubmit(e) {
    e.preventDefault();
    document.querySelectorAll('.field.has-error').forEach(function (w) { w.classList.remove('has-error'); });
    var errs = [];
    var name = $('#ct-name').value.trim();
    var phone = $('#ct-phone').value.trim().replace(/[\s.]/g, '');
    var email = $('#ct-email').value.trim();
    var msg = $('#ct-message').value.trim();

    if (name.length < 2) errs.push(['name', t('ct_err_name', 'Vui lòng nhập họ tên')]);
    if (!/^(0\d{9}|\+84\d{9})$/.test(phone)) errs.push(['phone', t('ct_err_phone', 'Số điện thoại không hợp lệ')]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push(['email', t('ct_err_email', 'Email không hợp lệ')]);
    if (msg.length < 10) errs.push(['message', t('ct_err_message', 'Nội dung tối thiểu 10 ký tự')]);

    if (errs.length) {
      errs.forEach(function (er) { setError(er[0], er[1]); });
      var first = document.querySelector('[data-field="' + errs[0][0] + '"] .input, [data-field="' + errs[0][0] + '"] .textarea');
      if (first) first.focus();
      S.toast(t('pay_check', 'Vui lòng kiểm tra lại thông tin'), 'err');
      return;
    }
    var payload = { name: name, phone: $('#ct-phone').value.trim(), email: email, message: msg };
    // Gửi lên API nếu có server; fallback lưu localStorage khi chạy tĩnh.
    var api = window.MorentAPI;
    var done = function () {
      $('#ct-form').reset();
      S.toast(t('ct_ok', 'Đã gửi yêu cầu! Morent sẽ liên hệ bạn sớm.'), 'ok');
    };
    if (api && api.createContact) {
      api.createContact(payload).then(done).catch(function () { saveLocal(payload); done(); });
    } else { saveLocal(payload); done(); }
  }

  function saveLocal(p) {
    try { var l = JSON.parse(localStorage.getItem('sr_contacts') || '[]'); l.push(Object.assign({ at: Date.now() }, p)); localStorage.setItem('sr_contacts', JSON.stringify(l)); } catch (e) {}
  }
})();
