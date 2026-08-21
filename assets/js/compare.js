/* =============================================================
   compare.js — So sánh 2 xe cạnh nhau (JS bắt buộc #4)
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function qs(n) { return new URLSearchParams(location.search).get(n); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function firstNum(v) { var m = String(v).replace(/[.,](?=\d{3})/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }

  S.ready(function () {
    var opts = S.CARS.map(function (c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
    var selA = $('#sel-a'), selB = $('#sel-b');
    selA.innerHTML = opts; selB.innerHTML = opts;

    var a = qs('a') || S.CARS[0].id;
    var b = qs('b') || S.CARS[1].id;
    if (a === b) b = S.CARS[1].id !== a ? S.CARS[1].id : S.CARS[2].id;
    selA.value = a; selB.value = b;

    selA.addEventListener('change', render);
    selB.addEventListener('change', render);
    render();
  });

  function preview(car) {
    return '<a href="car-detail.html?id=' + car.id + '" class="block">' +
      '<div style="max-width:240px;margin:0 auto;aspect-ratio:16/10;display:flex;align-items:center">' + S.carImage(car) + '</div>' +
      '<p class="text-center font-bold mt-2">' + car.name + '</p>' +
      '<p class="text-center text-primary font-extrabold">' + S.fmtMoneyN(S.curPrice(car)) + '<span class="text-muted text-sm font-semibold">/' + S.unitDay() + '</span></p></a>';
  }

  function render() {
    var ca = S.getCar($('#sel-a').value);
    var cb = S.getCar($('#sel-b').value);
    $('#preview-a').innerHTML = preview(ca);
    $('#preview-b').innerHTML = preview(cb);

    // [label, valA, valB, direction] — direction: 'low'/'high'/null
    var rows = [
      [t('cmp_price', 'Giá thuê') + '/' + S.unitDay(), S.fmtMoneyN(S.curPrice(ca)), S.fmtMoneyN(S.curPrice(cb)), 'low', ca.price, cb.price],
      [t('d_rating', 'Đánh giá'), ca.rating + '/5', cb.rating + '/5', 'high', ca.rating, cb.rating],
      [t('sp_brand', 'Hãng'), ca.brand, cb.brand, null],
      [t('sp_type', 'Kiểu dáng'), ca.type, cb.type, null],
      [t('sp_year', 'Năm'), ca.year, cb.year, 'high', ca.year, cb.year],
      [t('d_fuel', 'Nhiên liệu'), S.fuelLabel(ca), S.fuelLabel(cb), null],
      [t('d_gear', 'Hộp số'), S.transLabel(ca), S.transLabel(cb), null],
      [t('d_seats', 'Số chỗ'), S.seatsLabel(ca), S.seatsLabel(cb), 'high', ca.seats, cb.seats],
      [t('spc_engine', 'Động cơ'), S.specVal(ca.specs.engine), S.specVal(cb.specs.engine), null],
      [t('spc_power', 'Công suất'), S.specVal(ca.specs.power), S.specVal(cb.specs.power), 'high', firstNum(ca.specs.power), firstNum(cb.specs.power)],
      [t('spc_torque', 'Mô-men xoắn'), S.specVal(ca.specs.torque), S.specVal(cb.specs.torque), 'high', firstNum(ca.specs.torque), firstNum(cb.specs.torque)],
      [t('cmp_accel', 'Tăng tốc 0-100'), S.specVal(ca.specs.accel), S.specVal(cb.specs.accel), 'low', firstNum(ca.specs.accel), firstNum(cb.specs.accel)],
      [t('spc_drivetrain', 'Dẫn động'), S.specVal(ca.specs.drivetrain), S.specVal(cb.specs.drivetrain), null],
      [t('spc_length', 'Chiều dài'), S.specVal(ca.specs.length), S.specVal(cb.specs.length), 'high', firstNum(ca.specs.length), firstNum(cb.specs.length)]
    ];

    var tdBase = 'padding:14px 18px;border-top:1px solid var(--line);vertical-align:middle';
    var better = 'background:rgba(22,121,76,.12);color:#0f7a4c;font-weight:700;border-radius:6px';

    var head = '<thead><tr>' +
      '<th style="padding:16px 18px;text-align:left;color:var(--muted);font-weight:600">' + t('cmp_spec', 'Thông số') + '</th>' +
      '<th style="padding:16px 18px;text-align:left">' + ca.name + '</th>' +
      '<th style="padding:16px 18px;text-align:left">' + cb.name + '</th></tr></thead>';

    var body = rows.map(function (r) {
      var hlA = '', hlB = '';
      if (r[3] && r[4] != null && r[5] != null && r[4] !== r[5]) {
        var aWins = r[3] === 'low' ? r[4] < r[5] : r[4] > r[5];
        if (aWins) hlA = better; else hlB = better;
      }
      return '<tr>' +
        '<td style="' + tdBase + ';color:var(--muted)">' + r[0] + '</td>' +
        '<td style="' + tdBase + '"><span style="' + hlA + ';padding:' + (hlA ? '4px 8px' : '0') + ';display:inline-block">' + r[1] + '</span></td>' +
        '<td style="' + tdBase + '"><span style="' + hlB + ';padding:' + (hlB ? '4px 8px' : '0') + ';display:inline-block">' + r[2] + '</span></td>' +
        '</tr>';
    }).join('');

    var cta = '<tr>' +
      '<td style="' + tdBase + '"></td>' +
      '<td style="' + tdBase + '"><a class="btn btn-primary btn-sm" href="payment.html?id=' + ca.id + '">' + t('cmp_rent', 'Thuê') + ' ' + ca.brand + '</a></td>' +
      '<td style="' + tdBase + '"><a class="btn btn-primary btn-sm" href="payment.html?id=' + cb.id + '">' + t('cmp_rent', 'Thuê') + ' ' + cb.brand + '</a></td>' +
      '</tr>';

    $('#compare-table').innerHTML = head + '<tbody>' + body + cta + '</tbody>';
  }
})();
