/* =============================================================
   news.js — Tin tức: render + lọc chuyên mục + đăng ký nhận tin
   ============================================================= */
(function () {
  'use strict';
  var S = window.SHOWROOM;
  function t(k, f) { return S.t ? S.t(k, f) : f; }
  function $(s, r) { return (r || document).querySelector(s); }
  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function nTitle(n) { return S.isEN() && n.titleEn ? n.titleEn : n.title; }
  function nExcerpt(n) { return S.isEN() && n.excerptEn ? n.excerptEn : n.excerpt; }
  function catLabel(c) { return c === ALL ? t('news_all', 'Tất cả') : t('cat_' + c, c); }

  var ALL = 'Tất cả';
  var activeCat = ALL;

  function banner(n, big) {
    var h = big ? '300' : '200';
    // Ảnh phong cảnh (tận dụng ảnh dealer) -> phủ kín banner
    if (n.banner) {
      return '<div style="min-height:' + h + 'px;height:' + h + 'px;position:relative;overflow:hidden;background:#e9eef6">' +
        '<img src="' + n.banner + '" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" />' +
        '</div>';
    }
    // Fallback cũ: gradient + ảnh xe PNG
    var color = n.color || '#3563E9';
    var art = n.img
      ? '<img src="' + n.img + '" alt="" loading="lazy" style="position:absolute;right:14px;bottom:10px;height:' + (big ? '62%' : '66%') + ';width:auto;max-width:70%;object-fit:contain;filter:drop-shadow(0 10px 10px rgba(0,0,0,.28))" />'
      : '';
    return '<div style="background:linear-gradient(135deg,' + color + ',rgba(0,0,0,.4));min-height:' + (big ? '260' : '160') + 'px;position:relative;display:flex;align-items:flex-end;overflow:hidden">' + art + '</div>';
  }

  function newsCard(n) {
    return '<article class="card overflow-hidden reveal hover-lift">' +
      banner(n, false) +
      '<div class="p-5">' +
        '<div class="flex items-center gap-2 mb-2"><span class="badge badge-primary">' + catLabel(n.cat) + '</span><span class="text-muted text-xs">' + n.date + '</span></div>' +
        '<h3 class="font-bold text-lg mb-2" style="line-height:1.35">' + nTitle(n) + '</h3>' +
        '<p class="text-muted text-sm mb-3" style="line-height:1.6">' + nExcerpt(n) + '</p>' +
        '<a href="#" class="text-primary font-semibold text-sm inline-flex items-center gap-1">' + t('news_readmore', 'Đọc tiếp') + ' ' + S.ICON.arrow + '</a>' +
      '</div></article>';
  }

  S.ready(function () {
    // Bài nổi bật
    var f = S.NEWS[0];
    $('#featured').innerHTML =
      banner(f, true) +
      '<div class="p-8 flex flex-col justify-center">' +
        '<div class="flex items-center gap-2 mb-3"><span class="badge badge-red">' + t('news_featured', 'Nổi bật') + '</span><span class="badge badge-primary">' + catLabel(f.cat) + '</span><span class="text-muted text-xs">' + f.date + '</span></div>' +
        '<h2 class="text-2xl font-extrabold mb-3" style="line-height:1.3">' + nTitle(f) + '</h2>' +
        '<p class="text-muted mb-5" style="line-height:1.7">' + nExcerpt(f) + '</p>' +
        '<a href="#" class="btn btn-primary self-start">' + t('news_readfull', 'Đọc bài viết') + '</a>' +
      '</div>';

    // Chuyên mục
    var cats = [ALL];
    S.NEWS.forEach(function (n) { if (cats.indexOf(n.cat) === -1) cats.push(n.cat); });
    $('#news-cats').innerHTML = cats.map(function (c, i) {
      return '<button type="button" class="chip ' + (i === 0 ? 'is-active' : '') + '" data-cat="' + c + '">' + catLabel(c) + '</button>';
    }).join('');
    $('#news-cats').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      activeCat = b.getAttribute('data-cat');
      $('#news-cats').querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('is-active', c === b); });
      renderGrid();
    });

    renderGrid();

    // Đăng ký nhận tin
    $('#news-sub').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#sub-email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { S.toast(t('news_email_err', 'Email không hợp lệ'), 'err'); return; }
      $('#sub-email').value = '';
      S.toast(t('news_sub_ok', 'Đăng ký nhận tin thành công!'), 'ok');
    });
  });

  function renderGrid() {
    var list = S.NEWS.filter(function (n) { return activeCat === ALL || n.cat === activeCat; });
    $('#news-grid').innerHTML = list.map(newsCard).join('');
    S.initReveal();
  }
})();
