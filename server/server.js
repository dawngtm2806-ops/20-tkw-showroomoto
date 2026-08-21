/* =============================================================
   server.js — API tự dựng cho Cho thuê xe ô tô Morent (ĐỀ07)
   Chạy trên máy có Node.js:  cd server → npm install → npm start
   Mặc định: http://localhost:3000  (phục vụ CẢ web tĩnh + API /api/*)

   Công nghệ: Express + cors (thư viện), còn lại dùng module built-in của
   Node (fs, path, crypto) — KHÔNG cần biên dịch native, cài rất nhẹ.

   Dữ liệu:
   - Xe & tin tức: đọc từ ../assets/data/cars.json, ../assets/data/news.json
     (dùng CHUNG file với frontend → không trùng lặp dữ liệu).
   - Lịch lái thử / liên hệ / tài khoản: lưu vào server/db.json (tự tạo).
   ============================================================= */
'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, '..');                 // thư mục website
const DATA_DIR = path.join(ROOT, 'assets', 'data');
const DB_FILE = path.join(__dirname, 'db.json');
const SECRET = process.env.JWT_SECRET || 'morent-demo-secret-hay-doi-chuoi-nay';

/* ---------- Tiện ích đọc/ghi JSON ---------- */
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return fallback; }
}
function loadDB() {
  var d = readJSON(DB_FILE, {});
  return { bookings: d.bookings || [], contacts: d.contacts || [], users: d.users || [], orders: d.orders || [] };
}
function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

let cars = readJSON(path.join(DATA_DIR, 'cars.json'), []);
let news = readJSON(path.join(DATA_DIR, 'news.json'), []);
let db = loadDB();

/* ---------- Xác thực đơn giản (không cần thư viện JWT) ---------- */
function hashPassword(pw, salt) { return crypto.scryptSync(pw, salt, 64).toString('hex'); }
function makeToken(userId) {
  const body = userId + '.' + Date.now();
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  return Buffer.from(body + '.' + sig).toString('base64');
}
function verifyToken(token) {
  try {
    const parts = Buffer.from(token, 'base64').toString('utf8').split('.'); // [userId, ts, sig]
    if (parts.length !== 3) return null;
    const body = parts[0] + '.' + parts[1];
    const expected = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected)) ? parts[0] : null;
  } catch (e) { return null; }
}
function auth(req, res, next) {
  const uid = verifyToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!uid) return res.status(401).json({ error: 'Bạn chưa đăng nhập' });
  req.userId = uid; next();
}

/* ---------- Validate (dùng lại ở nhiều endpoint) ---------- */
const isPhone = v => /^(0\d{9}|\+84\d{9})$/.test(String(v || '').replace(/[\s.]/g, ''));
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));

/* =====================  ROUTES  ===================== */

// --- Xe ---
app.get('/api/cars', (req, res) => {
  let list = cars.slice();
  const { brand, fuel, type, q, maxPrice, sort } = req.query;
  if (brand) list = list.filter(c => c.brand === brand);
  if (fuel) list = list.filter(c => c.fuel === fuel);
  if (type) list = list.filter(c => c.type === type);
  if (q) list = list.filter(c => c.name.toLowerCase().includes(String(q).toLowerCase()));
  if (maxPrice) list = list.filter(c => c.price <= Number(maxPrice));
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  res.json(list);
});

app.get('/api/cars/:id', (req, res) => {
  const car = cars.find(c => c.id === req.params.id);
  if (!car) return res.status(404).json({ error: 'Không tìm thấy xe' });
  res.json(car);
});

// --- Tin tức ---
app.get('/api/news', (req, res) => res.json(news));

// --- Đăng ký lái thử ---
app.post('/api/test-drives', (req, res) => {
  const b = req.body || {};
  const fields = [];
  if (!b.name || b.name.trim().length < 2) fields.push('name');
  if (!isPhone(b.phone)) fields.push('phone');
  if (!isEmail(b.email)) fields.push('email');
  if (!b.car) fields.push('car');
  if (!b.branch) fields.push('branch');
  if (!b.date) fields.push('date');
  if (!b.time) fields.push('time');
  if (fields.length) return res.status(400).json({ error: 'Dữ liệu không hợp lệ', fields });

  const rec = {
    id: Date.now().toString(),
    name: b.name.trim(), phone: b.phone.trim(), email: b.email.trim(),
    car: b.car, branch: b.branch, date: b.date, time: b.time, note: (b.note || '').trim(),
    createdAt: new Date().toISOString()
  };
  db.bookings.push(rec); saveDB(db);
  res.status(201).json({ ok: true, booking: rec });
});
app.get('/api/test-drives', (req, res) => res.json(db.bookings));

// --- Liên hệ ---
app.post('/api/contacts', (req, res) => {
  const b = req.body || {};
  const fields = [];
  if (!b.name || b.name.trim().length < 2) fields.push('name');
  if (!isPhone(b.phone)) fields.push('phone');
  if (!isEmail(b.email)) fields.push('email');
  if (!b.message || b.message.trim().length < 10) fields.push('message');
  if (fields.length) return res.status(400).json({ error: 'Dữ liệu không hợp lệ', fields });

  const rec = { id: Date.now().toString(), ...b, createdAt: new Date().toISOString() };
  db.contacts.push(rec); saveDB(db);
  res.status(201).json({ ok: true });
});

// --- Đơn đặt cọc giữ xe (KHÔNG bao giờ nhận/lưu số thẻ hay CVC) ---
app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  const fields = [];
  if (!b.name || b.name.trim().length < 2) fields.push('name');
  if (!isPhone(b.phone)) fields.push('phone');
  if (!b.carId) fields.push('carId');
  if (!b.pickupBranch) fields.push('pickupBranch');
  if (fields.length) return res.status(400).json({ error: 'Dữ liệu không hợp lệ', fields });

  const car = cars.find(c => c.id === b.carId);
  const rec = {
    id: b.id || ('DH' + Date.now()),
    carId: b.carId, carName: (car && car.name) || b.carName || b.carId,
    carType: car && car.type, carColor: car && car.color,
    name: b.name.trim(), phone: b.phone.trim(), address: b.address || '', city: b.city || '',
    pickupBranch: b.pickupBranch, pickupDate: b.pickupDate, pickupTime: b.pickupTime,
    dropBranch: b.dropBranch, dropDate: b.dropDate, dropTime: b.dropTime,
    method: b.method || 'card', deposit: Number(b.deposit) || 0, discount: Number(b.discount) || 0,
    createdAt: new Date().toISOString()
  };
  db.orders.push(rec); saveDB(db);
  res.status(201).json({ ok: true, order: rec });
});
app.get('/api/orders', (req, res) => res.json(db.orders));

// --- Tài khoản ---
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !isEmail(email) || !password || password.length < 6)
    return res.status(400).json({ error: 'Thiếu thông tin hoặc mật khẩu < 6 ký tự' });
  if (db.users.find(u => u.email === email))
    return res.status(409).json({ error: 'Email đã được đăng ký' });

  const salt = crypto.randomBytes(16).toString('hex');
  const user = { id: Date.now().toString(), name, email, salt, hash: hashPassword(password, salt) };
  db.users.push(user); saveDB(db);
  res.status(201).json({ token: makeToken(user.id), user: { id: user.id, name, email } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find(u => u.email === email);
  if (!user || user.hash !== hashPassword(password || '', user.salt))
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
  res.json({ token: makeToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/me', auth, (req, res) => {
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
  res.json({ id: user.id, name: user.name, email: user.email });
});

/* ---------- Phục vụ website tĩnh (đặt SAU các route /api) ---------- */
app.use(express.static(ROOT));

app.listen(PORT, () => {
  console.log('✅ Morent API + Web chạy tại: http://localhost:' + PORT);
  console.log('   - Web:  http://localhost:' + PORT + '/index.html');
  console.log('   - API:  http://localhost:' + PORT + '/api/cars');
});
