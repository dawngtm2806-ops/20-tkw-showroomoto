/* =============================================================
   api.js — Helper gọi API backend (dùng cho PHA 3: nối frontend ↔ server)
   CHƯA được nhúng vào trang nào (frontend hiện đọc JSON tĩnh).
   Khi chạy web qua server Express (http://localhost:3000), thêm thẻ
   <script src="assets/js/api.js"></script> vào trang cần và gọi window.MorentAPI.
   ============================================================= */
(function (global) {
  'use strict';

  // Cùng origin nếu web được phục vụ bởi server Express (cổng 3000),
  // ngược lại trỏ thẳng tới localhost:3000 (vd khi mở bằng Live Server).
  var API_BASE = (location.port === '3000' || location.port === '')
    ? '/api'
    : 'http://localhost:3000/api';

  function token() { try { return localStorage.getItem('sr_token') || ''; } catch (e) { return ''; } }

  function req(pathname, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    if (options.auth && token()) headers['Authorization'] = 'Bearer ' + token();
    return fetch(API_BASE + pathname, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw Object.assign(new Error(data.error || ('HTTP ' + r.status)), { status: r.status, data: data });
        return data;
      });
    });
  }

  function qstr(params) {
    if (!params) return '';
    var q = Object.keys(params).filter(function (k) { return params[k] != null && params[k] !== ''; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return q ? ('?' + q) : '';
  }

  global.MorentAPI = {
    base: API_BASE,
    getCars: function (params) { return req('/cars' + qstr(params)); },
    getCar: function (id) { return req('/cars/' + encodeURIComponent(id)); },
    getNews: function () { return req('/news'); },
    createTestDrive: function (data) { return req('/test-drives', { method: 'POST', body: data }); },
    listTestDrives: function () { return req('/test-drives'); },
    createContact: function (data) { return req('/contacts', { method: 'POST', body: data }); },
    createOrder: function (data) { return req('/orders', { method: 'POST', body: data }); },
    listOrders: function () { return req('/orders'); },
    register: function (name, email, password) {
      return req('/auth/register', { method: 'POST', body: { name: name, email: email, password: password } })
        .then(saveAuth);
    },
    login: function (email, password) {
      return req('/auth/login', { method: 'POST', body: { email: email, password: password } })
        .then(saveAuth);
    },
    me: function () { return req('/me', { auth: true }); },
    logout: function () { try { localStorage.removeItem('sr_token'); } catch (e) {} }
  };

  function saveAuth(res) {
    try { if (res && res.token) localStorage.setItem('sr_token', res.token); } catch (e) {}
    return res;
  }
})(window);
