# Morent API (server tự dựng)

REST API cho website Cho thuê xe ô tô — **Node.js + Express**. Phần này chạy trên **máy có Node** (máy chính).

## ▶️ Cách chạy

```bash
cd server
npm install        # cài express + cors (nhẹ, không cần biên dịch native)
npm start          # chạy tại http://localhost:3000
```

Server phục vụ **cả website tĩnh lẫn API** trên cùng cổng 3000:
- Web: <http://localhost:3000/index.html>
- API: <http://localhost:3000/api/cars>

> Cài Node.js LTS tại <https://nodejs.org> nếu máy chưa có (`node -v` để kiểm tra).

## 📡 Danh sách endpoint

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/cars` | Danh sách xe. Query: `?brand=&fuel=&type=&q=&maxPrice=&sort=price-asc\|price-desc\|rating` |
| GET | `/api/cars/:id` | Chi tiết 1 xe |
| GET | `/api/news` | Danh sách tin tức |
| POST | `/api/test-drives` | Đăng ký lái thử (validate + lưu `db.json`) |
| GET | `/api/test-drives` | Danh sách lịch lái thử đã đăng ký |
| POST | `/api/contacts` | Gửi liên hệ |
| POST | `/api/auth/register` | Đăng ký tài khoản → trả `token` |
| POST | `/api/auth/login` | Đăng nhập → trả `token` |
| GET | `/api/me` | Thông tin tài khoản (cần header `Authorization: Bearer <token>`) |

Thử nhanh bằng trình duyệt/`curl`:
```bash
curl http://localhost:3000/api/cars?brand=Toyota
curl -X POST http://localhost:3000/api/test-drives -H "Content-Type: application/json" \
  -d '{"name":"Nguyen Van A","phone":"0901234567","email":"a@email.com","car":"toyota-camry","branch":"Morent Quận 1 (TP.HCM)","date":"2026-08-01","time":"09:00"}'
```

## 💾 Lưu trữ

- Xe & tin tức: đọc từ `../assets/data/cars.json`, `../assets/data/news.json` (dùng chung với frontend).
- Lịch lái thử / liên hệ / tài khoản: ghi vào `server/db.json` (tự tạo, đã cho vào `.gitignore`).
- Mật khẩu được băm bằng `crypto.scrypt` + salt; token ký bằng HMAC-SHA256 (không lưu plaintext).

## 🔌 Nối frontend vào API (PHA 3)

Đã có sẵn helper **`assets/js/api.js`** (window.`MorentAPI`). Cách chuyển frontend sang dùng API thật:

1. Truy cập web qua chính server này: <http://localhost:3000/index.html> (để cùng origin, khỏi lo CORS).
2. Trong `assets/js/data.js`, đổi 2 dòng `loadJSON('assets/data/cars.json')` / `news.json`
   thành gọi API: `fetch('/api/cars')` / `fetch('/api/news')` (hoặc `MorentAPI.getCars()`).
3. Ở `test-drive.js` / `contact.js`: sau khi validate, gọi `MorentAPI.createTestDrive(data)` /
   `MorentAPI.createContact(data)` thay cho việc lưu `localStorage`.
4. (Tùy) làm trang **Đăng nhập/Đăng ký** dùng `MorentAPI.register/login/me`.

## 🚀 Deploy backend (tùy chọn, cộng điểm)

Render / Railway / Vercel (Serverless). Nhớ đặt biến môi trường `JWT_SECRET` khi deploy thật.
