/* =============================================================
   catalog.js — Danh mục xe: lọc / tìm kiếm / sắp xếp (JS bắt buộc #1)
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  var MIN_P, MAX_P; // tính sau khi fetch dữ liệu xong (trong S.ready)
  var CAPS = [2, 4, 6, 8]; // 8 = "8 chỗ trở lên"

  var state = {
    search: '', brands: [], types: [], fuels: [], caps: [],
    maxPrice: Infinity, favOnly: false, sort: 'popular'
  };

  /* ----- Đếm động từ dữ liệu (số trong ngoặc mỗi mục lọc) ----- */
  function count(pred) { return S.CARS.filter(pred).length; }
  function capMatch(n, seats) { return n === 8 ? seats >= 8 : seats === n; }
  function capLabel(n) { return (n === 8 ? '8+ ' : n + ' ') + t('unit_seat', 'chỗ'); }

  S.ready(function () {
    /* ----- Tính khoảng giá từ dữ liệu đã tải ----- */
    var prices = S.CARS.map(function (c) { return c.price; });
    MIN_P = Math.min.apply(null, prices);
    MAX_P = Math.max.apply(null, prices);
    state.maxPrice = MAX_P;

    /* ----- Dựng các control lọc ----- */
    var cnt = function (n) { return ' <span class="text-muted">(' + n + ')</span>'; };

    var brandBox = $('#f-brands');
    brandBox.innerHTML = S.BRANDS.map(function (b) {
      return '<label class="flex items-center gap-2 cursor-pointer select-none text-sm">' +
        '<input type="checkbox" class="w-4 h-4 accent-[#3563E9]" value="' + b + '" data-brand> <span>' + b + cnt(count(function (c) { return c.brand === b; })) + '</span></label>';
    }).join('');

    $('#f-types').innerHTML = S.TYPES.map(function (ty) {
      return '<button type="button" class="chip" data-type="' + ty + '">' + ty + cnt(count(function (c) { return c.type === ty; })) + '</button>';
    }).join('');

    $('#f-fuels').innerHTML = S.FUELS.map(function (f) {
      return '<button type="button" class="chip" data-fuel="' + f + '">' + S.fuelText(f) + cnt(count(function (c) { return c.fuel === f; })) + '</button>';
    }).join('');

    $('#f-caps').innerHTML = CAPS.map(function (n) {
      return '<button type="button" class="chip" data-cap="' + n + '">' + capLabel(n) + cnt(count(function (c) { return capMatch(n, c.seats); })) + '</button>';
    }).join('');

    var price = $('#f-price');
    // Bước nhảy theo khoảng giá (đừng để step > cả khoảng khiến không kéo được)
    var step = Math.max(1, Math.round((MAX_P - MIN_P) / 40));
    price.min = MIN_P; price.max = MAX_P; price.step = step; price.value = MAX_P;
    $('#price-label').textContent = S.formatPriceShort(MAX_P);

    /* ----- Nếu vào từ #favorites thì bật lọc yêu thích ----- */
    if (location.hash === '#favorites') { state.favOnly = true; $('#f-fav').checked = true; }

    /* ----- Nhận từ khoá tìm kiếm từ thanh search trên header (?q=) ----- */
    var q = new URLSearchParams(location.search).get('q');
    if (q) { state.search = q.trim().toLowerCase(); if ($('#f-search')) $('#f-search').value = q.trim(); }

    /* ----- Sự kiện ----- */
    var searchTimer;
    $('#f-search').addEventListener('input', function (e) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { state.search = e.target.value.trim().toLowerCase(); render(); }, 180);
    });

    $('#f-sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });

    brandBox.addEventListener('change', function () {
      state.brands = Array.prototype.slice.call(brandBox.querySelectorAll('[data-brand]:checked')).map(function (i) { return i.value; });
      render();
    });

    $('#f-types').addEventListener('click', function (e) {
      var b = e.target.closest('[data-type]'); if (!b) return;
      b.classList.toggle('is-active');
      state.types = toggleIn(state.types, b.getAttribute('data-type'));
      render();
    });

    $('#f-fuels').addEventListener('click', function (e) {
      var b = e.target.closest('[data-fuel]'); if (!b) return;
      b.classList.toggle('is-active');
      state.fuels = toggleIn(state.fuels, b.getAttribute('data-fuel'));
      render();
    });

    $('#f-caps').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cap]'); if (!b) return;
      b.classList.toggle('is-active');
      state.caps = toggleIn(state.caps, +b.getAttribute('data-cap'));
      render();
    });

    price.addEventListener('input', function (e) {
      state.maxPrice = +e.target.value;
      $('#price-label').textContent = S.formatPriceShort(state.maxPrice);
      render();
    });

    $('#f-fav').addEventListener('change', function (e) { state.favOnly = e.target.checked; render(); });

    $('#filter-reset').addEventListener('click', resetFilters);
    $('#empty-reset').addEventListener('click', resetFilters);

    // Toggle bộ lọc trên mobile
    var ft = $('#filter-toggle');
    if (ft) ft.addEventListener('click', function () {
      var p = $('#filter-panel');
      p.classList.toggle('hidden');
    });

    render();
  });

  function toggleIn(arr, val) {
    var i = arr.indexOf(val);
    if (i === -1) arr.push(val); else arr.splice(i, 1);
    return arr;
  }

  function resetFilters() {
    state = { search: '', brands: [], types: [], fuels: [], caps: [], maxPrice: MAX_P, favOnly: false, sort: 'popular' };
    $('#f-search').value = '';
    $('#f-sort').value = 'popular';
    $('#f-price').value = MAX_P;
    $('#price-label').textContent = S.formatPriceShort(MAX_P);
    $('#f-fav').checked = false;
    document.querySelectorAll('[data-brand]:checked').forEach(function (i) { i.checked = false; });
    document.querySelectorAll('.chip.is-active').forEach(function (c) { c.classList.remove('is-active'); });
    render();
  }

  function applyFilters() {
    var favs = S.fav.get();
    var list = S.CARS.filter(function (c) {
      if (state.search && c.name.toLowerCase().indexOf(state.search) === -1) return false;
      if (state.brands.length && state.brands.indexOf(c.brand) === -1) return false;
      if (state.types.length && state.types.indexOf(c.type) === -1) return false;
      if (state.fuels.length && state.fuels.indexOf(c.fuel) === -1) return false;
      if (state.caps.length && !state.caps.some(function (n) { return capMatch(n, c.seats); })) return false;
      if (c.price > state.maxPrice) return false;
      if (state.favOnly && favs.indexOf(c.id) === -1) return false;
      return true;
    });

    switch (state.sort) {
      case 'price-asc': list.sort(function (a, b) { return a.price - b.price; }); break;
      case 'price-desc': list.sort(function (a, b) { return b.price - a.price; }); break;
      case 'name': list.sort(function (a, b) { return a.name.localeCompare(b.name, 'vi'); }); break;
      case 'rating': list.sort(function (a, b) { return b.rating - a.rating; }); break;
      default: list.sort(function (a, b) { return b.tags.length - a.tags.length; }); // popular
    }
    return list;
  }

  function render() {
    var list = applyFilters();
    var grid = $('#cars-grid');
    var empty = $('#empty-state');
    $('#result-count').textContent = list.length;

    if (!list.length) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    grid.innerHTML = list.map(S.carCardHTML).join('');
    S.wireCards(grid);
    S.initReveal();
  }
})();
