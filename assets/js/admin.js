/* =============================================================
   admin.js — Bảng điều khiển quản trị (khớp Figma Admin · JS động)
   - Nạp dữ liệu từ API nội bộ (/api/orders, /api/test-drives, /api/cars);
     nếu không có server → fallback localStorage (sr_orders, sr_bookings) + JSON.
   - Vẽ KPI, biểu đồ Chart.js (tỉ lệ phân khúc + doanh thu/ngày), chi tiết đơn mới nhất, giao dịch gần đây.
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  var API = window.MorentAPI;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }

  var IC = {
    dash: svg('<path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10"/>'),
    car: svg('<path d="M3 13l2-5a3 3 0 012.8-2h8.4A3 3 0 0119 8l2 5v5h-3v-2H6v2H3z"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/>'),
    insight: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    booking: svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 3v3M16 3v3"/>'),
    inbox: svg('<path d="M4 4h16v12H7l-3 3z"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1L14.5 2h-4l-.3 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.4L4.1 11a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1L10.5 22h4l.3-2.5a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6a7 7 0 00.1-1z"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 013.9-1.9C15 8 14 10 12 10.5V13"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/>'),
    logout: svg('<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>')
  };
  function svg(inner) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; }

  // Điền icon + nhãn cho sidebar
  function nav(id, icon, label) { var el = $('#' + id); if (el) el.innerHTML = icon + '<span class="flex-1">' + label + '</span>'; }

  document.addEventListener('DOMContentLoaded', function () {
    $('#ad-logo').innerHTML = (S.ICON && S.ICON.logo) || '';
    nav('nav-dash', IC.dash, t('ad_nav_dash', 'Tổng quan'));
    nav('nav-cars', IC.car, t('ad_nav_cars', 'Quản lý xe'));
    nav('nav-insight', IC.insight, t('ad_nav_insight', 'Thống kê'));
    nav('nav-bookings', IC.booking, t('ad_nav_bookings', 'Lịch nhận xe'));
    nav('nav-inbox', IC.inbox, t('ad_nav_inbox', 'Hộp thư liên hệ'));
    nav('nav-settings', IC.settings, t('ad_nav_settings', 'Cài đặt'));
    nav('nav-help', IC.help, t('ad_nav_help', 'Trợ giúp'));
    nav('nav-logout', IC.logout, t('ad_nav_back', 'Về trang web'));
    $('#ad-year').textContent = new Date().getFullYear();

    // Avatar theo tài khoản
    try {
      var u = JSON.parse(localStorage.getItem('sr_user') || 'null');
      if (u && u.name) $('#ad-avatar').textContent = u.name.charAt(0).toUpperCase();
    } catch (e) {}

    // Theme toggle
    var themeBtn = $('#ad-theme');
    function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
    function paintTheme() {
      $('#nav-theme-ic').innerHTML = (isDark() ? S.ICON.sun : S.ICON.moon);
      themeBtn.style.background = isDark() ? 'var(--primary)' : 'var(--line-strong)';
    }
    themeBtn.addEventListener('click', function () {
      var t = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('sr_theme', t); } catch (e) {}
      paintTheme();
    });
    paintTheme();
  });

  S.ready(function () {
    // Lấy dữ liệu: ưu tiên API, fallback localStorage
    var localOrders = safe('sr_orders'), localBookings = safe('sr_bookings');
    Promise.all([
      (API ? API.listOrders().catch(function () { return null; }) : Promise.resolve(null)),
      (API ? API.listTestDrives().catch(function () { return null; }) : Promise.resolve(null))
    ]).then(function (r) {
      var orders = (r[0] && r[0].length ? r[0] : localOrders);
      var bookings = (r[1] && r[1].length ? r[1] : localBookings);
      render(orders, bookings);
    });
  });

  function safe(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } }

  // Quy đổi số tiền của ĐƠN (lưu theo VND hoặc USD) về tiền tệ đang hiển thị — tránh lỗi 5tr₫ hiện thành $5,000,000
  var RATE = 25000; // 1 USD ~ 25.000 VND (tỉ giá demo)
  function orderCurrency(o) {
    if (o && o.currency) return o.currency;
    // Đơn cũ thiếu currency: số lớn ⇒ VND, số nhỏ ⇒ USD
    return (Number(o && o.deposit) || 0) >= 100000 ? 'VND' : 'USD';
  }
  function amtIn(o) {
    var v = Number(o && o.deposit) || 0;
    var cur = orderCurrency(o);
    if (S.isEN()) return cur === 'USD' ? v : v / RATE;
    return cur === 'USD' ? v * RATE : v;
  }

  function render(orders, bookings) {
    var cars = S.CARS;
    // ----- KPI -----
    var totalDeposit = orders.reduce(function (s, o) { return s + amtIn(o); }, 0);
    var kpis = [
      { ic: '🚗', label: t('ad_kpi_cars', 'Mẫu xe cho thuê'), val: cars.length },
      { ic: '📅', label: t('ad_kpi_bookings', 'Lịch nhận xe'), val: bookings.length },
      { ic: '🧾', label: t('ad_kpi_orders', 'Đơn thuê xe'), val: orders.length },
      { ic: '💰', label: t('ad_kpi_revenue', 'Doanh thu thuê'), val: S.fmtMoneyN(totalDeposit) }
    ];
    $('#kpi-row').innerHTML = kpis.map(function (k) {
      return '<div class="card p-5 stat-tile"><div class="stat-tile__icon" style="font-size:22px">' + k.ic + '</div>' +
        '<div><div class="text-2xl font-extrabold">' + k.val + '</div><div class="text-muted text-sm">' + k.label + '</div></div></div>';
    }).join('');

    // ----- Chi tiết đơn mới nhất -----
    renderDetail(orders[orders.length - 1], bookings[bookings.length - 1]);

    // ----- Biểu đồ Chart.js: tỉ lệ loại xe + doanh thu theo ngày -----
    renderCharts(cars, orders);

    // ----- Giao dịch gần đây -----
    renderTxn(orders, bookings, cars);
  }

  function mapSVG() {
    return '<svg viewBox="0 0 400 180" width="100%" style="border-radius:12px;background:var(--bg)" aria-hidden="true">' +
      '<rect width="400" height="180" fill="var(--bg)"/>' +
      '<path d="M0 60 H400 M0 120 H400 M120 0 V180 M260 0 V180" stroke="var(--line)" stroke-width="8"/>' +
      '<rect x="140" y="72" width="60" height="36" fill="var(--accent)" opacity=".25"/>' +
      '<rect x="20" y="20" width="70" height="28" fill="var(--accent)" opacity=".2"/>' +
      '<path d="M70 150 C120 150 150 120 200 110 S300 70 330 40" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="330" cy="40" r="9" fill="var(--primary)"/><circle cx="330" cy="40" r="3.5" fill="#fff"/>' +
      '<circle cx="70" cy="150" r="6" fill="var(--primary)"/></svg>';
  }

  function renderDetail(order, booking) {
    var box = $('#detail-panel');
    var item = order || booking;
    if (!item) {
      box.innerHTML = mapSVG() + '<div class="text-center py-8 text-muted"><p class="font-semibold">' + t('ad_none_t', 'Chưa có đơn nào') + '</p><p class="text-sm">' + t('ad_none_p', 'Đơn thuê / lịch nhận xe sẽ hiện ở đây.') + '</p></div>';
      return;
    }
    var car = S.getCar(item.carId || item.car) || {};
    var isOrder = !!order && item === order;
    box.innerHTML = mapSVG() +
      '<div class="flex items-center gap-4 mt-5">' +
        '<div class="txn-thumb" style="width:96px;height:64px">' + S.carImage(car) + '</div>' +
        '<div class="flex-1"><p class="font-extrabold text-lg">' + (car.name || item.carName || 'Xe') + '</p><p class="text-muted text-sm">' + (car.type || '') + ' · ' + (car.brand || '') + '</p></div>' +
        '<span class="badge badge-primary">#' + String(item.id).slice(-4) + '</span>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-4 mt-5">' +
        detailCol(t('ad_pickup_at', 'Chi nhánh nhận'), item.pickupBranch || item.branch || '—', item.pickupDate || item.date || '', item.pickupTime || item.time || '') +
        detailCol(t('ad_dropoff', 'Bàn giao'), item.dropBranch || item.pickupBranch || item.branch || '—', item.dropDate || item.pickupDate || item.date || '', item.dropTime || item.time || '') +
      '</div>' +
      '<div class="divider my-5"></div>' +
      '<div class="flex items-end justify-between"><div><p class="font-bold">' + (isOrder ? t('ad_rent_cost', 'Tiền thuê') : t('ad_rent_day', 'Giá thuê/ngày')) + '</p><p class="text-muted text-xs">' + (isOrder ? t('ad_incl', 'Đã bao gồm ưu đãi') : t('ad_interest', 'Khách quan tâm thuê xe')) + '</p></div>' +
      '<p class="text-2xl font-extrabold">' + S.fmtMoneyN((isOrder ? amtIn(item) : S.curPrice(car)) || 0) + '</p></div>';
  }
  function detailCol(label, loc, date, time) {
    function field(lbl, val) {
      return '<div><p class="text-muted" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em">' + lbl + '</p>' +
        '<p class="font-semibold text-sm">' + (val || '—') + '</p></div>';
    }
    return '<div>' +
      '<div class="flex items-center gap-2 mb-3"><span class="radio-dot" style="width:14px;height:14px;border-width:4px"></span><span class="font-bold text-sm">' + label + '</span></div>' +
      '<div class="grid gap-3">' +
        field(t('ad_loc', 'Địa điểm'), loc) +
        field(t('ad_date', 'Ngày'), date) +
        field(t('ad_time', 'Giờ'), time) +
      '</div>' +
    '</div>';
  }

  var chartTypes = null, chartRev = null;
  function renderCharts(cars, orders) {
    if (typeof Chart === 'undefined') return; // Chart.js chưa nạp (offline CDN) -> bỏ qua
    var COLORS = ['#1A2F7A', '#3563E9', '#54A6FF', '#8FC0FF', '#C3D4E9', '#B9C6DA'];

    /* 1) Tỉ lệ loại xe được thuê (doughnut) — ưu tiên đếm theo đơn thuê, không có thì theo đội xe */
    var TYPES = S.TYPES.slice();
    var byOrder = TYPES.map(function (ty) {
      return orders.filter(function (o) { var c = S.getCar(o.carId); return c && c.type === ty; }).length;
    });
    var rentedTotal = byOrder.reduce(function (a, b) { return a + b; }, 0);
    // Donut/legend: phân bố ĐỘI XE cho thuê theo phân khúc (luôn đầy đặn nhiều loại như Figma)
    var typeCounts = TYPES.map(function (ty) { return cars.filter(function (c) { return c.type === ty; }).length; });
    var keep = TYPES.map(function (_, i) { return typeCounts[i] > 0; });
    var tLabels = TYPES.filter(function (_, i) { return keep[i]; });
    var tData = typeCounts.filter(function (_, i) { return keep[i]; });
    var typeCtx = $('#chart-types');
    if (typeCtx) {
      if (chartTypes) chartTypes.destroy();
      chartTypes = new Chart(typeCtx, {
        type: 'doughnut',
        data: { labels: tLabels, datasets: [{ data: tData, backgroundColor: COLORS, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } }
      });
      // Tổng ở giữa vòng tròn = tổng số lượt xe ĐÃ THUÊ
      var center = $('#donut-center');
      if (center) center.innerHTML = '<div class="text-3xl font-extrabold">' + rentedTotal + '</div><div class="text-muted text-xs">' + t('ad_rented', 'lượt thuê') + '</div>';
      // Legend danh sách phân khúc kế bên (chấm màu · tên · số lượng)
      var legend = $('#donut-legend');
      if (legend) legend.innerHTML = tLabels.map(function (lbl, i) {
        return '<div class="flex items-center justify-between gap-3">' +
          '<span class="flex items-center gap-2 text-sm"><span style="width:11px;height:11px;border-radius:50%;background:' + COLORS[i % COLORS.length] + ';display:inline-block;flex:none"></span>' + lbl + '</span>' +
          '<span class="font-bold text-sm">' + tData[i] + '</span></div>';
      }).join('');
    }

    /* 2) Doanh thu theo ngày (7 ngày gần nhất) — bar */
    var days = [], labels = [], totals = [];
    for (var k = 6; k >= 0; k--) { var d = new Date(); d.setDate(d.getDate() - k); days.push(d.toISOString().slice(0, 10)); labels.push((d.getMonth() + 1) + '/' + d.getDate()); }
    totals = days.map(function (day) {
      return orders.filter(function (o) { return (o.createdAt || '').slice(0, 10) === day; })
        .reduce(function (s, o) { return s + amtIn(o); }, 0);
    });
    var revCtx = $('#chart-revenue');
    if (revCtx) {
      if (chartRev) chartRev.destroy();
      chartRev = new Chart(revCtx, {
        type: 'bar',
        data: { labels: labels, datasets: [{ label: t('ad_revenue_label', 'Doanh thu'), data: totals, backgroundColor: '#3563E9', borderRadius: 6, maxBarThickness: 40 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (ctx) { return S.fmtMoneyN(ctx.parsed.y); } } } },
          scales: { y: { beginAtZero: true, ticks: { callback: function (v) { return S.isEN() ? ('$' + v) : (v >= 1e6 ? (v / 1e6) + 'tr' : v); } } } }
        }
      });
    }
  }

  function renderTxn(orders, bookings, cars) {
    var items = [];
    orders.forEach(function (o) { items.push({ car: S.getCar(o.carId), name: o.carName, type: typeOf(o.carId), amount: amtIn(o), date: o.createdAt, tag: t('ad_tag_rent', 'Thuê xe') }); });
    bookings.forEach(function (b) { var c = S.getCar(b.car) || {}; items.push({ car: c, name: c.name || b.car, type: c.type || t('ad_tag_book', 'Đặt lịch'), amount: null, date: b.at || b.createdAt, tag: t('ad_tag_book', 'Đặt lịch') }); });
    items.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    items = items.slice(0, 5);
    if (!items.length) {
      // Không có giao dịch thật → hiển thị vài mẫu xe làm ví dụ
      items = cars.slice(0, 4).map(function (c) { return { car: c, name: c.name, type: c.type, amount: S.curPrice(c), date: null, tag: t('ad_tag_sample', 'Mẫu xe') }; });
    }
    $('#txn-list').innerHTML = items.map(function (it) {
      return '<div class="txn-row"><div class="txn-thumb">' + S.carImage(it.car) + '</div>' +
        '<div class="flex-1"><p class="font-bold">' + it.name + '</p><p class="text-muted text-xs">' + it.type + ' · ' + it.tag + '</p></div>' +
        '<div class="text-right">' + (it.amount != null ? '<p class="font-extrabold">' + S.fmtMoneyN(it.amount) + '</p>' : '') +
        '<p class="text-muted text-xs">' + (it.date ? new Date(it.date).toLocaleDateString(S.isEN() ? 'en-US' : 'vi-VN') : '—') + '</p></div></div>';
    }).join('');
  }
  function typeOf(id) { var c = S.getCar(id); return c ? c.type : ''; }
  function colorOf(id) { var c = S.getCar(id); return c ? c.color : '#3563E9'; }
})();
