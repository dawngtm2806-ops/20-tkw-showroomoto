/* =============================================================
   auth.js — Đăng nhập / Đăng ký (JS động — dùng cho web động + API)
   - Ưu tiên gọi API thật (server Express): MorentAPI.login/register.
   - Nếu KHÔNG có server (mở tĩnh / GitHub Pages) → tự fallback lưu bằng
     localStorage để demo vẫn chạy. Người dùng không thấy khác biệt.
   - Lưu user hiện tại vào localStorage 'sr_user' để header/account đọc.
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  var API = window.MorentAPI;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  var isEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '')); };

  /* ---------- Lỗi field (dùng lại pattern .field/.field__error) ---------- */
  function setError(field, msg) {
    var wrap = document.querySelector('[data-field="' + field + '"]');
    if (!wrap) return;
    wrap.classList.add('has-error');
    var e = wrap.querySelector('.field__error'); if (e) e.textContent = msg;
  }
  function clearErrors(form) {
    form.querySelectorAll('.field.has-error').forEach(function (w) { w.classList.remove('has-error'); });
  }

  /* ---------- Fallback localStorage khi không có server ---------- */
  function lsUsers() { try { return JSON.parse(localStorage.getItem('sr_users') || '[]'); } catch (e) { return []; } }
  function lsSaveUsers(u) { try { localStorage.setItem('sr_users', JSON.stringify(u)); } catch (e) {} }
  function mockRegister(name, email, password) {
    var users = lsUsers();
    if (users.some(function (u) { return u.email === email; })) {
      return Promise.reject(Object.assign(new Error(t('au_email_taken', 'Email đã được đăng ký')), { status: 409, offline: true }));
    }
    var user = { id: 'u' + Date.now(), name: name, email: email, password: password };
    users.push(user); lsSaveUsers(users);
    return Promise.resolve({ token: 'local.' + user.id, user: { id: user.id, name: name, email: email } });
  }
  function mockLogin(email, password) {
    var user = lsUsers().filter(function (u) { return u.email === email && u.password === password; })[0];
    if (!user) return Promise.reject(Object.assign(new Error(t('au_wrong', 'Sai email hoặc mật khẩu')), { status: 401, offline: true }));
    return Promise.resolve({ token: 'local.' + user.id, user: { id: user.id, name: user.name, email: user.email } });
  }
  // Lỗi mạng (không có server) → dùng fallback. Lỗi có status (API trả về) → báo lỗi thật.
  function isNetworkError(err) { return !err || err.status == null; }

  function afterAuth(res) {
    try {
      if (res.token) localStorage.setItem('sr_token', res.token);
      if (res.user) localStorage.setItem('sr_user', JSON.stringify(res.user));
    } catch (e) {}
    S.toast(t('au_hello', 'Xin chào') + ' ' + (res.user ? res.user.name : '') + '!', 'ok');
    var back = new URLSearchParams(location.search).get('redirect');
    setTimeout(function () { location.href = back || 'account.html'; }, 500);
  }

  ready(function () {
    // Nếu đã đăng nhập → sang account
    try { if (localStorage.getItem('sr_user')) { location.replace('account.html'); return; } } catch (e) {}

    var tabLogin = $('#tab-login'), tabReg = $('#tab-register');
    var fLogin = $('#login-form'), fReg = $('#register-form');
    var crumb = $('#crumb-current');

    function show(which) {
      var login = which === 'login';
      tabLogin.classList.toggle('active', login);
      tabReg.classList.toggle('active', !login);
      fLogin.classList.toggle('hidden', !login);
      fReg.classList.toggle('hidden', login);
      if (crumb) crumb.textContent = login ? t('nav_login', 'Đăng nhập') : t('au_register', 'Đăng ký');
    }
    tabLogin.addEventListener('click', function () { show('login'); });
    tabReg.addEventListener('click', function () { show('register'); });
    $('#link-to-register').addEventListener('click', function () { show('register'); });
    $('#link-to-login').addEventListener('click', function () { show('login'); });
    if ((new URLSearchParams(location.search).get('mode')) === 'register') show('register');

    // Xoá lỗi khi gõ
    document.querySelectorAll('.input').forEach(function (el) {
      el.addEventListener('input', function () { var w = el.closest('.field'); if (w) w.classList.remove('has-error'); });
    });

    /* ---------- Đăng nhập ---------- */
    fLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(fLogin);
      var email = $('#l-email').value.trim(), pw = $('#l-password').value;
      var ok = true;
      if (!isEmail(email)) { setError('l-email', t('au_err_email', 'Email không hợp lệ')); ok = false; }
      if (!pw) { setError('l-password', t('au_err_pw', 'Vui lòng nhập mật khẩu')); ok = false; }
      if (!ok) return;

      var btn = fLogin.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = t('au_signing', 'Đang đăng nhập…');
      var call = API ? API.login(email, pw) : Promise.reject({});
      call.then(afterAuth).catch(function (err) {
        if (isNetworkError(err)) { return mockLogin(email, pw).then(afterAuth).catch(showLoginErr); }
        showLoginErr(err);
      }).finally(function () { btn.disabled = false; btn.textContent = t('nav_login', 'Đăng nhập'); });

      function showLoginErr(err) {
        setError('l-password', (err && err.message) || t('au_wrong', 'Sai email hoặc mật khẩu'));
        S.toast((err && err.message) || t('au_login_fail', 'Đăng nhập thất bại'), 'err');
      }
    });

    /* ---------- Đăng ký ---------- */
    fReg.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(fReg);
      var name = $('#r-name').value.trim(), email = $('#r-email').value.trim();
      var pw = $('#r-password').value, cf = $('#r-confirm').value, agree = $('#r-agree').checked;
      var ok = true;
      if (name.length < 2) { setError('r-name', t('au_err_name', 'Vui lòng nhập họ tên')); ok = false; }
      if (!isEmail(email)) { setError('r-email', t('au_err_email', 'Email không hợp lệ')); ok = false; }
      if (pw.length < 6) { setError('r-password', t('au_err_pw6', 'Mật khẩu tối thiểu 6 ký tự')); ok = false; }
      if (cf !== pw) { setError('r-confirm', t('au_err_confirm', 'Mật khẩu nhập lại không khớp')); ok = false; }
      if (!agree) { setError('r-agree', t('au_err_agree', 'Bạn cần đồng ý điều khoản')); ok = false; }
      if (!ok) return;

      var btn = fReg.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = t('au_creating', 'Đang tạo…');
      var call = API ? API.register(name, email, pw) : Promise.reject({});
      call.then(afterAuth).catch(function (err) {
        if (isNetworkError(err)) { return mockRegister(name, email, pw).then(afterAuth).catch(showRegErr); }
        showRegErr(err);
      }).finally(function () { btn.disabled = false; btn.textContent = t('au_create', 'Tạo tài khoản'); });

      function showRegErr(err) {
        var msg = (err && err.message) || t('au_reg_fail', 'Đăng ký thất bại');
        if (err && err.status === 409) setError('r-email', msg); else setError('r-password', msg);
        S.toast(msg, 'err');
      }
    });
  });
})();
