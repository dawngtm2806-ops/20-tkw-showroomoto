/* =============================================================
   account.js — Trang "Tài khoản của tôi"
   - Bảo vệ trang: chưa đăng nhập → chuyển sang auth.html.
   - Hiển thị hồ sơ, lịch lái thử (localStorage + API nếu có), xe yêu thích.
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }

  function getUser() { try { return JSON.parse(localStorage.getItem('sr_user') || 'null'); } catch (e) { return null; } }
  function getProfile() { try { return JSON.parse(localStorage.getItem('sr_profile') || '{}'); } catch (e) { return {}; } }
  function saveProfile(p) { try { localStorage.setItem('sr_profile', JSON.stringify(p)); } catch (e) {} }
  function getBookings() { try { return JSON.parse(localStorage.getItem('sr_bookings') || '[]'); } catch (e) { return []; } }

  S.ready(function () {
    var user = getUser();
    if (!user) { location.replace('auth.html?redirect=account.html'); return; }

    // Hồ sơ
    var initials = (user.name || 'A').trim().charAt(0).toUpperCase();
    $('#ac-avatar').textContent = initials;
    $('#ac-name').textContent = user.name || t('ac_guest', 'Khách');
    $('#ac-email').textContent = user.email || '—';

    var profile = getProfile();
    $('#p-name').value = user.name || '';
    $('#p-email').value = user.email || '';
    $('#p-phone').value = profile.phone || '';
    $('#p-city').value = profile.city || '';

    // Đăng xuất
    $('#ac-logout').addEventListener('click', function () {
      try { localStorage.removeItem('sr_user'); localStorage.removeItem('sr_token'); } catch (e) {}
      if (window.MorentAPI) window.MorentAPI.logout();
      S.toast(t('ac_logged_out', 'Đã đăng xuất'), 'ok');
      setTimeout(function () { location.href = 'index.html'; }, 400);
    });

    // Lưu hồ sơ
    $('#profile-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = $('#p-phone').value.trim();
      var w = document.querySelector('[data-field="p-phone"]');
      if (phone && !/^(0\d{9}|\+84\d{9})$/.test(phone.replace(/[\s.]/g, ''))) {
        w.classList.add('has-error'); w.querySelector('.field__error').textContent = t('ac_err_phone', 'Số điện thoại không hợp lệ'); return;
      }
      w.classList.remove('has-error');
      var name = $('#p-name').value.trim() || user.name;
      user.name = name; try { localStorage.setItem('sr_user', JSON.stringify(user)); } catch (e) {}
      saveProfile({ phone: phone, city: $('#p-city').value.trim() });
      $('#ac-name').textContent = name; $('#ac-avatar').textContent = name.charAt(0).toUpperCase();
      S.toast(t('ac_saved', 'Đã lưu thông tin'), 'ok');
    });

    // Tabs
    document.querySelectorAll('.tab-btn[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn[data-tab]').forEach(function (b) { b.classList.toggle('active', b === btn); });
        document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== tab; });
      });
    });

    // Lịch lái thử
    var bookings = getBookings().slice().reverse();
    $('#ac-stat-bookings').textContent = bookings.length;
    renderBookings(bookings);

    // Xe yêu thích
    var favIds = S.fav.get();
    var favCars = favIds.map(function (id) { return S.getCar(id); }).filter(Boolean);
    $('#ac-stat-favs').textContent = favCars.length;
    renderFavs(favCars);
  });

  function renderBookings(list) {
    var box = $('#ac-bookings');
    if (!list.length) {
      box.innerHTML = emptyState('📅', t('ac_no_bookings_t', 'Chưa có lịch nhận xe'), t('ac_no_bookings_p', 'Đặt lịch nhận xe cho chuyến đi của bạn.'), 'test-drive.html', t('ac_no_bookings_cta', 'Đặt lịch nhận xe'));
      return;
    }
    box.innerHTML = list.map(function (b) {
      var car = S.getCar(b.car);
      return '<div class="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">' +
        '<div style="width:120px;flex:none">' + S.carSVG(car ? car.color : '#C3D4E9') + '</div>' +
        '<div class="flex-1">' +
          '<div class="flex items-center gap-2 mb-1"><span class="badge badge-primary">' + (car ? car.type : 'Xe') + '</span><span class="text-muted text-xs">' + fmtDate(b.at) + '</span></div>' +
          '<p class="font-bold text-lg">' + (car ? car.name : b.car) + '</p>' +
          '<p class="text-muted text-sm">📍 ' + b.branch + ' · 🗓 ' + b.date + ' · ⏰ ' + b.time + '</p>' +
        '</div>' +
        '<span class="badge badge-ok" style="align-self:flex-start">' + t('ac_recorded', 'Đã ghi nhận') + '</span>' +
      '</div>';
    }).join('');
  }

  function renderFavs(cars) {
    var box = $('#ac-favs');
    if (!cars.length) {
      box.innerHTML = '<div class="sm:col-span-2 xl:col-span-3">' + emptyState('❤', t('ac_no_favs_t', 'Chưa có xe yêu thích'), t('ac_no_favs_p', 'Bấm biểu tượng trái tim trên mỗi xe để lưu lại.'), 'cars.html', t('ac_no_favs_cta', 'Khám phá xe')) + '</div>';
      return;
    }
    box.innerHTML = cars.map(function (c) { return S.carCardHTML(c); }).join('');
    S.wireCards(box);
    S.initReveal();
  }

  function emptyState(icon, title, desc, href, cta) {
    return '<div class="card p-10 text-center">' +
      '<div style="font-size:44px" class="mb-3">' + icon + '</div>' +
      '<p class="font-bold text-lg mb-1">' + title + '</p>' +
      '<p class="text-muted text-sm mb-5">' + desc + '</p>' +
      '<a class="btn btn-primary" href="' + href + '">' + cta + '</a></div>';
  }

  function fmtDate(ts) { try { return new Date(ts).toLocaleDateString(S.isEN() ? 'en-US' : 'vi-VN'); } catch (e) { return ''; } }
})();
