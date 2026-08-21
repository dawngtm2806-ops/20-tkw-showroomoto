/* =============================================================
   data.js — Tải dữ liệu ĐỘNG bằng fetch() + helper dùng chung
   - Nạp ĐẦU TIÊN trên mọi trang.
   - Dữ liệu xe/tin tức nằm ở assets/data/*.json (tách khỏi code → "web động").
   - Trang JS gọi SHOWROOM.ready(fn) để chạy SAU khi DOM + dữ liệu sẵn sàng.
   - PHẢI chạy qua web server (python -m http.server / Live Server) vì fetch không
     hoạt động khi mở bằng file:// (CORS).
   ============================================================= */
(function (global) {
  'use strict';

  /* ---------- Helper: vẽ ô tô bằng SVG (portable, không cần tải ảnh) ---------- */
  function carSVG(color, glass) {
    color = color || '#3563E9';
    glass = glass || '#d6e4f7';
    return (
      '<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg" class="car-illustration" aria-hidden="true" focusable="false">' +
      '<ellipse cx="200" cy="168" rx="150" ry="12" fill="rgba(30,41,59,.10)"/>' +
      '<path d="M110 96 L152 56 C158 50 166 46 176 46 L236 46 C250 46 262 52 272 62 L304 96 Z" fill="' + color + '"/>' +
      '<path d="M122 92 L156 60 C160 56 166 54 172 54 L196 54 L196 92 Z" fill="' + glass + '"/>' +
      '<path d="M204 54 L234 54 C244 54 252 58 260 66 L284 92 L204 92 Z" fill="' + glass + '"/>' +
      '<rect x="42" y="92" width="316" height="54" rx="20" fill="' + color + '"/>' +
      '<rect x="42" y="122" width="316" height="24" rx="12" fill="rgba(0,0,0,.10)"/>' +
      '<line x1="200" y1="92" x2="200" y2="146" stroke="rgba(0,0,0,.10)" stroke-width="2"/>' +
      '<rect x="343" y="104" width="15" height="12" rx="3" fill="#ffe4a3"/>' +
      '<rect x="42" y="106" width="12" height="10" rx="3" fill="#ff6b6b" opacity=".9"/>' +
      '<circle cx="122" cy="146" r="30" fill="#1b2430"/>' +
      '<circle cx="122" cy="146" r="13" fill="#cfd9e6"/><circle cx="122" cy="146" r="5" fill="#7c8aa0"/>' +
      '<circle cx="278" cy="146" r="30" fill="#1b2430"/>' +
      '<circle cx="278" cy="146" r="13" fill="#cfd9e6"/><circle cx="278" cy="146" r="5" fill="#7c8aa0"/>' +
      '</svg>'
    );
  }

  /* ---------- Helper: ảnh xe (ảnh thật nếu có, fallback SVG vẽ code) ---------- */
  function carImage(car, cls) {
    cls = cls || 'car-photo';
    if (car && car.img) {
      return '<img src="' + car.img + '" alt="' + (car.name || 'Xe') + '" class="' + cls + '" loading="lazy" ' +
        'onerror="this.outerHTML=window.SHOWROOM.carSVG(\'' + (car.color || '#3563E9') + '\')" />';
    }
    return carSVG(car ? car.color : '#3563E9');
  }

  /* ---------- Helper: định dạng giá tiền VND ---------- */
  function formatVND(n) { return new Intl.NumberFormat('vi-VN').format(n) + ' ₫'; }
  function formatPriceShort(n) {
    if (n >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ';
    if (n >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu';
    return formatVND(n);
  }
  /* ---------- Tiền tệ theo NGÔN NGỮ: EN -> USD ($) như Figma, VI -> VND ---------- */
  function curLang() { try { return (window.SHOWROOM && window.SHOWROOM.lang) ? window.SHOWROOM.lang() : (localStorage.getItem('sr_lang') || 'vi'); } catch (e) { return 'vi'; } }
  function isEN() { return curLang() === 'en'; }
  function unitDay() { return isEN() ? 'day' : 'ngày'; }
  function moneyUSD(n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  // Định dạng 1 số theo tiền tệ hiện tại (VND hoặc USD)
  function fmtMoneyN(n) { return isEN() ? moneyUSD(n) : formatVND(n); }
  // Giá thuê / ngày hiện tại của xe (số) + định dạng
  function curPrice(car) { return isEN() ? (car.priceUsd || 0) : car.price; }
  function curOld(car) { return isEN() ? (car.oldUsd || 0) : (car.oldPrice || 0); }
  function rentPrice(car) { return fmtMoneyN(curPrice(car)) + '<small style="font-weight:600;color:var(--muted)">/' + unitDay() + '</small>'; }
  function rentOld(car) { var o = curOld(car); return o ? '<div class="price-old">' + fmtMoneyN(o) + '/' + unitDay() + '</div>' : ''; }
  // Giữ tương thích cũ
  function formatRent(n) { return fmtMoneyN(n) + '<small style="font-weight:600;color:var(--muted)">/' + unitDay() + '</small>'; }

  /* ---------- Dịch DỮ LIỆU xe sang EN (nhiên liệu/hộp số/mô tả/thông số) ---------- */
  var FUEL_EN = { 'Xăng': 'Petrol', 'Dầu': 'Diesel', 'Điện': 'Electric', 'Hybrid': 'Hybrid' };
  var TRANS_EN = { 'Số tự động': 'Automatic', 'Số sàn': 'Manual' };
  function fuelText(f) { return isEN() ? (FUEL_EN[f] || f) : f; }
  function fuelLabel(car) { return fuelText(car.fuel); }
  function transLabel(car) { return isEN() ? (TRANS_EN[car.transmission] || car.transmission) : car.transmission; }
  function transShort(car) { var en = isEN(); var auto = car.transmission === 'Số tự động'; return en ? (auto ? 'AT' : 'MT') : (auto ? 'AT' : 'MT'); }
  function seatsLabel(car) { return car.seats + ' ' + (isEN() ? 'seats' : 'chỗ'); }
  function descOf(car) { return (isEN() && car.descEn) ? car.descEn : car.desc; }
  function specVal(v) {
    if (!isEN()) return v;
    return String(v)
      .replace(/mã lực/g, 'hp')
      .replace('Cầu trước (FWD)', 'Front-wheel drive (FWD)')
      .replace('Cầu sau (RWD)', 'Rear-wheel drive (RWD)')
      .replace('2 cầu (AWD)', 'All-wheel drive (AWD)')
      .replace('4 bánh (4WD)', 'Four-wheel drive (4WD)')
      .replace('Mô-tơ điện kép', 'Dual electric motor')
      .replace('Mô-tơ điện', 'Electric motor')
      .replace('km/lần sạc', 'km/charge').replace('lần sạc', 'charge')
      .replace('Pin', 'Battery');
  }

  /* ---------- Cấu hình/enum (cố định — không cần fetch) ---------- */
  var BRANDS = ['Koenigsegg', 'Nissan', 'Rolls-Royce', 'Toyota', 'Honda', 'Daihatsu', 'MG'];
  var TYPES = ['Sport', 'SUV', 'MPV', 'Sedan', 'Coupe', 'Hatchback'];
  var FUELS = ['Xăng', 'Dầu', 'Điện', 'Hybrid'];
  var BRANCHES = ['Morent Quận 1 (TP.HCM)', 'Morent Quận 7 (TP.HCM)', 'Morent Cầu Giấy (Hà Nội)', 'Morent Hải Châu (Đà Nẵng)'];

  /* ---------- Đối tượng toàn cục ---------- */
  var S = {
    carSVG: carSVG, carImage: carImage, formatVND: formatVND, formatPriceShort: formatPriceShort, formatRent: formatRent,
    fmtMoneyN: fmtMoneyN, curPrice: curPrice, curOld: curOld, rentPrice: rentPrice, rentOld: rentOld, isEN: isEN, unitDay: unitDay,
    fuelLabel: fuelLabel, fuelText: fuelText, transLabel: transLabel, transShort: transShort, seatsLabel: seatsLabel, descOf: descOf, specVal: specVal,
    BRANDS: BRANDS, TYPES: TYPES, FUELS: FUELS, BRANCHES: BRANCHES,
    CARS: [], NEWS: [],
    getCar: function (id) { return S.CARS.filter(function (c) { return c.id === id; })[0]; }
  };

  /* ---------- Dữ liệu NHÚNG dự phòng (để web chạy cả khi mở file:// không fetch được) ---------- */
  var EMBED_CARS = [{"id": "koenigsegg", "name": "Koenigsegg", "brand": "Koenigsegg", "type": "Sport", "fuel": "Xăng", "tank": "90L", "transmission": "Số sàn", "seats": 2, "year": 2022, "price": 2500000, "oldPrice": 0, "rating": 4.9, "tags": ["popular", "recommend"], "color": "#F2F4F7", "colors": ["#F2F4F7", "#1A202C", "#ED3F3F"], "img": "assets/img/cars/sport.png", "specs": {"engine": "5.0L V8 Twin-Turbo", "power": "1.280 mã lực", "torque": "1.106 Nm", "consumption": "16 L/100km", "accel": "2.8s (0-100)", "length": "4.293 mm", "tank": "90 L", "drivetrain": "Cầu sau (RWD)"}, "desc": "Siêu xe thể thao hiệu năng đỉnh cao, thiết kế khí động học và khả năng tăng tốc ấn tượng — trải nghiệm thuê xe khó quên.", "priceUsd": 99, "oldUsd": 0, "descEn": "A top-tier performance supercar with aerodynamic design and stunning acceleration — an unforgettable rental experience.", "scale": 0.85}, {"id": "nissan-gtr", "name": "Nissan GT-R", "brand": "Nissan", "type": "Sport", "fuel": "Xăng", "tank": "80L", "transmission": "Số tự động", "seats": 2, "year": 2022, "price": 2000000, "oldPrice": 2500000, "rating": 4.8, "tags": ["popular", "recommend"], "color": "#C3D4E9", "colors": ["#C3D4E9", "#1A202C", "#3563E9"], "img": "assets/img/cars/sedan.png", "specs": {"engine": "3.8L V6 Twin-Turbo", "power": "565 mã lực", "torque": "633 Nm", "consumption": "11 L/100km", "accel": "2.9s (0-100)", "length": "4.710 mm", "tank": "74 L", "drivetrain": "2 cầu (AWD)"}, "desc": "Sports car with the best design and acceleration — biểu tượng xe thể thao Nhật với hệ dẫn động 4 bánh, mạnh mẽ và bám đường.", "priceUsd": 80, "oldUsd": 100, "descEn": "Sports car with the best design and acceleration — an iconic Japanese sports car with smart all-wheel drive, powerful and grippy."}, {"id": "rolls-royce", "name": "Rolls-Royce", "brand": "Rolls-Royce", "type": "Sedan", "fuel": "Xăng", "tank": "70L", "transmission": "Số tự động", "seats": 4, "year": 2022, "price": 2400000, "oldPrice": 0, "rating": 4.9, "tags": ["recommend"], "color": "#3563E9", "colors": ["#3563E9", "#1A202C", "#F2F4F7"], "img": "assets/img/cars/lux.png", "specs": {"engine": "6.75L V12", "power": "563 mã lực", "torque": "900 Nm", "consumption": "15 L/100km", "accel": "4.9s (0-100)", "length": "5.762 mm", "tank": "82 L", "drivetrain": "Cầu sau (RWD)"}, "desc": "Đỉnh cao sang trọng và tinh tế, khoang lái êm ái tuyệt đối — lựa chọn thuê xe hoàn hảo cho những dịp đặc biệt.", "priceUsd": 96, "oldUsd": 0, "descEn": "The pinnacle of luxury and refinement with an ultra-smooth cabin — the perfect rental choice for special occasions.", "tf": "scale(.82)"}, {"id": "all-new-rush", "name": "All New Rush", "brand": "Toyota", "type": "SUV", "fuel": "Xăng", "tank": "70L", "transmission": "Số tự động", "seats": 6, "year": 2022, "price": 1200000, "oldPrice": 1400000, "rating": 4.6, "tags": ["popular"], "color": "#8895A7", "colors": ["#8895A7", "#1A202C", "#F2F4F7"], "img": "assets/img/cars/suv-blue.png", "specs": {"engine": "1.5L Dual VVT-i", "power": "104 mã lực", "torque": "136 Nm", "consumption": "7.0 L/100km", "accel": "12.0s (0-100)", "length": "4.435 mm", "tank": "47 L", "drivetrain": "Cầu sau (RWD)"}, "desc": "SUV 7 chỗ gầm cao đa dụng, rộng rãi và tiết kiệm — phù hợp thuê cho những chuyến đi gia đình và nhóm bạn.", "priceUsd": 72, "oldUsd": 80, "descEn": "A versatile 7-seat SUV with high ground clearance, spacious and economical — ideal to rent for family and group trips."}, {"id": "honda-crv", "name": "CR-V", "brand": "Honda", "type": "SUV", "fuel": "Xăng", "tank": "80L", "transmission": "Số tự động", "seats": 6, "year": 2022, "price": 1400000, "oldPrice": 0, "rating": 4.7, "tags": ["popular", "recommend"], "color": "#5A3B26", "colors": ["#5A3B26", "#1A202C", "#F2F4F7"], "img": "assets/img/cars/suv-brown.png", "specs": {"engine": "1.5L VTEC Turbo", "power": "188 mã lực", "torque": "240 Nm", "consumption": "7.5 L/100km", "accel": "9.5s (0-100)", "length": "4.621 mm", "tank": "57 L", "drivetrain": "Cầu trước (FWD)"}, "desc": "SUV đô thị rộng rãi, động cơ tăng áp mạnh mẽ và nhiều công nghệ an toàn — thoải mái cho mọi hành trình thuê xe.", "priceUsd": 80, "oldUsd": 0, "descEn": "A spacious urban SUV with a powerful turbo engine and plenty of safety tech — comfortable for every rental journey.", "scale": 0.72, "tf": "scale(.9,1.1)"}, {"id": "all-new-terios", "name": "All New Terios", "brand": "Daihatsu", "type": "SUV", "fuel": "Xăng", "tank": "90L", "transmission": "Số tự động", "seats": 6, "year": 2022, "price": 1100000, "oldPrice": 0, "rating": 4.5, "tags": ["recommend"], "color": "#1A202C", "colors": ["#1A202C", "#C3D4E9", "#ED3F3F"], "img": "assets/img/cars/terios.png", "specs": {"engine": "1.5L Dual VVT-i", "power": "103 mã lực", "torque": "134 Nm", "consumption": "7.2 L/100km", "accel": "12.5s (0-100)", "length": "4.455 mm", "tank": "45 L", "drivetrain": "Cầu sau (RWD)"}, "desc": "SUV nhỏ gọn, linh hoạt trong phố và bền bỉ — lựa chọn thuê xe kinh tế cho các chuyến đi hằng ngày.", "priceUsd": 74, "oldUsd": 0, "descEn": "A compact, agile and durable city SUV — an economical rental choice for everyday trips.", "scale": 0.68}, {"id": "mg-zx-exclusive", "name": "MG ZX Exclusive", "brand": "MG", "type": "Hatchback", "fuel": "Xăng", "tank": "70L", "transmission": "Số tự động", "seats": 4, "year": 2022, "price": 1000000, "oldPrice": 1200000, "rating": 4.4, "tags": ["popular"], "color": "#F2F4F7", "colors": ["#F2F4F7", "#1A202C", "#3563E9"], "img": "assets/img/cars/mg-blue.png", "specs": {"engine": "1.5L DOHC", "power": "114 mã lực", "torque": "150 Nm", "consumption": "6.0 L/100km", "accel": "11.0s (0-100)", "length": "4.314 mm", "tank": "48 L", "drivetrain": "Cầu trước (FWD)"}, "desc": "Hatchback trẻ trung, tiết kiệm nhiên liệu, nhiều tiện nghi — phù hợp thuê để di chuyển linh hoạt trong đô thị.", "priceUsd": 76, "oldUsd": 80, "descEn": "A youthful, fuel-efficient hatchback with many amenities — great to rent for flexible city driving.", "scale": 0.66}, {"id": "new-mg-zs", "name": "New MG ZS", "brand": "MG", "type": "SUV", "fuel": "Xăng", "tank": "80L", "transmission": "Số tự động", "seats": 6, "year": 2022, "price": 1300000, "oldPrice": 0, "rating": 4.5, "tags": ["recommend"], "color": "#C3D4E9", "colors": ["#C3D4E9", "#1A202C", "#ED3F3F"], "img": "assets/img/cars/suv-white.png", "specs": {"engine": "1.5L DOHC", "power": "114 mã lực", "torque": "150 Nm", "consumption": "6.7 L/100km", "accel": "12.4s (0-100)", "length": "4.323 mm", "tank": "48 L", "drivetrain": "Cầu trước (FWD)"}, "desc": "SUV đô thị cỡ nhỏ hiện đại, khoang cabin rộng và trang bị công nghệ phong phú với chi phí thuê hợp lý.", "priceUsd": 80, "oldUsd": 0, "descEn": "A modern compact urban SUV with a roomy cabin and rich technology at an affordable rental price.", "scale": 0.68}, {"id": "mg-zx-excite", "name": "MG ZX Excite", "brand": "MG", "type": "Hatchback", "fuel": "Điện", "tank": "90L", "transmission": "Số tự động", "seats": 4, "year": 2022, "price": 1050000, "oldPrice": 0, "rating": 4.4, "tags": ["popular"], "color": "#54A6FF", "colors": ["#54A6FF", "#1A202C", "#F2F4F7"], "img": "assets/img/cars/mg-blue.png", "specs": {"engine": "Mô-tơ điện", "power": "177 mã lực", "torque": "280 Nm", "consumption": "~320 km/lần sạc", "accel": "8.2s (0-100)", "length": "4.314 mm", "tank": "Pin 51 kWh", "drivetrain": "Cầu trước (FWD)"}, "desc": "Hatchback điện năng động, vận hành êm và tiết kiệm — lựa chọn thuê xe xanh cho người yêu công nghệ.", "priceUsd": 74, "oldUsd": 0, "descEn": "A dynamic electric hatchback, smooth and economical — a green choice for tech lovers.", "scale": 0.66}];
  var EMBED_NEWS = [{"id": "n1", "title": "Khai trương chi nhánh cho thuê xe Morent Quận 7", "titleEn": "Morent opens a new car-rental branch in District 7", "cat": "Sự kiện", "date": "05/07/2026", "color": "#3563E9", "excerpt": "Điểm nhận và trả xe hiện đại với hơn 40 mẫu xe cho thuê, khu vực kiểm tra xe và quầy hỗ trợ khách hàng.", "excerptEn": "A modern pick-up and drop-off point with 40+ rental cars, a vehicle check area and a customer support desk.", "img": "assets/img/cars/sedan.png", "banner": "assets/img/dealer/car3.jpg"}, {"id": "n2", "title": "Ưu đãi mùa hè: giảm đến 20% khi thuê xe dài ngày", "titleEn": "Summer deal: up to 20% off on long-term rentals", "cat": "Khuyến mãi", "date": "02/07/2026", "color": "#ED3F3F", "excerpt": "Áp dụng cho nhiều dòng SUV và sedan, kèm miễn phí giao xe tận nơi cho đơn thuê từ 5 ngày.", "excerptEn": "Applies to many SUV and sedan models, with free doorstep delivery on rentals of 5 days or more.", "img": "assets/img/cars/suv-brown.png", "banner": "assets/img/dealer/car2.jpg"}, {"id": "n3", "title": "Trên ghế lái mẫu SUV điện: có đáng để thuê?", "titleEn": "Behind the wheel of an electric SUV: is it worth renting?", "cat": "Đánh giá xe", "date": "28/06/2026", "color": "#54A6FF", "excerpt": "Cảm nhận vận hành, quãng đường thực tế mỗi lần sạc và các tính năng thông minh trên một mẫu SUV điện.", "excerptEn": "Driving impressions, real-world range per charge and the smart features on an electric SUV.", "img": "assets/img/cars/suv-white.png", "banner": "assets/img/dealer/car5.jpg"}, {"id": "n4", "title": "Kinh nghiệm chọn xe 7 chỗ cho chuyến đi gia đình", "titleEn": "How to pick a 7-seater for a family trip", "cat": "Cẩm nang", "date": "20/06/2026", "color": "#1A202C", "excerpt": "So sánh các lựa chọn MPV và SUV 7 chỗ đáng chú ý về không gian, chi phí thuê và sự thoải mái.", "excerptEn": "Comparing notable 7-seat MPV and SUV options on space, rental cost and comfort.", "img": "assets/img/cars/suv-blue.png", "banner": "assets/img/dealer/car8.jpg"}, {"id": "n5", "title": "Lái xe mùa mưa: 6 điều cần lưu ý trước mỗi chuyến", "titleEn": "Rainy-season driving: 6 things to check before every trip", "cat": "Cẩm nang", "date": "15/06/2026", "color": "#3563E9", "excerpt": "Từ lốp, phanh đến gạt mưa và điều hòa — danh sách kiểm tra giúp bạn lái an toàn suốt mùa mưa.", "excerptEn": "From tyres and brakes to wipers and A/C — a checklist to help you drive safely through the rainy season.", "img": "assets/img/cars/lux.png", "banner": "assets/img/dealer/car1.jpg"}, {"id": "n6", "title": "Xu hướng thuê xe điện ngày càng phổ biến", "titleEn": "Renting electric cars is becoming more popular", "cat": "Thị trường", "date": "10/06/2026", "color": "#54A6FF", "excerpt": "Hạ tầng trạm sạc mở rộng và nhiều mẫu xe mới khiến việc thuê xe điện ngày càng thuận tiện.", "excerptEn": "Expanding charging infrastructure and many new models make renting an electric car more convenient.", "img": "assets/img/cars/mg-blue.png", "banner": "assets/img/dealer/car6.jpg"}];

  /* ---------- Tải dữ liệu động bằng fetch() ---------- */
  function loadJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' khi tải ' + url);
      return r.json();
    });
  }

  S.dataReady = Promise.all([
    loadJSON('assets/data/cars.json'),
    loadJSON('assets/data/news.json')
  ]).then(function (res) {
    S.CARS = res[0];
    S.NEWS = res[1];
    return S;
  }).catch(function (err) {
    // fetch thất bại (thường do mở bằng file://) -> dùng dữ liệu nhúng để web vẫn hiển thị xe
    console.warn('[Morent] Không fetch được JSON, dùng dữ liệu nhúng dự phòng.', err);
    S.CARS = EMBED_CARS;
    S.NEWS = EMBED_NEWS;
    return S;
  });

  /* ---------- Chờ DOM + dữ liệu rồi mới chạy ---------- */
  S.ready = function (fn) {
    var domReady = new Promise(function (resolve) {
      if (document.readyState !== 'loading') resolve();
      else document.addEventListener('DOMContentLoaded', resolve);
    });
    return Promise.all([domReady, S.dataReady]).then(function () { fn(); });
  };

  global.SHOWROOM = S;
})(window);
