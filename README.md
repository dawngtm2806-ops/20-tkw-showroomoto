# Morent — Website Cho thuê xe ô tô

Đồ án môn **Thiết kế Web (INTE03010)** — Đề tài **ĐỀ07: Website thuê xe ô tô** (nhóm sản phẩm *Đặt chỗ & biểu mẫu*).
Nền tảng thuê xe theo ngày: trang chủ có biểu mẫu chọn địa điểm – ngày – giờ nhận/trả, danh mục xe kèm bộ lọc nhiều tiêu chí,
chi tiết xe có đánh giá người dùng, thanh toán nhiều bước và bảng điều khiển quản trị theo dõi đơn thuê.

- **Giao diện mẫu (Figma):** *Car Rent Website Design — Pickolab Studio (Morent)* — thương hiệu **Morent**.
  <https://www.figma.com/community/file/1138316365849534403/car-rent-website-design-pickolab-studio>
- **Sản phẩm đã deploy:** <https://dawngtm2806-ops.github.io/20-tkw-showroomoto/>
- **Trạng thái:** hoàn thiện phần web (VI/EN, responsive, API tự dựng) và đã deploy.
  Còn lại: báo cáo · video demo.

---

## 1. Đề bài & tiêu chí chấm (rubric)

| Tiêu chí | Trọng số | Ghi chú |
|---|---|---|
| **Bám sát Figma & UI/UX** | **20%** | ⚠️ GATE — không đạt là không chấm tiếp |
| HTML semantic & SEO | 15% | thẻ ngữ nghĩa, meta/OpenGraph, alt ảnh, heading hợp lệ |
| CSS/Tailwind & Responsive | 20% | Tailwind hợp lý, mượt ở 3 breakpoint |
| **Tính năng JavaScript** | **25%** | DOM, fetch/API, localStorage, validate |
| Tối ưu (Lighthouse/a11y) & Triển khai | 10% | Lighthouse ≥ 85, có link live |
| Báo cáo, Git & liêm chính | 10% | commit hợp lý, trích dẫn nguồn |

Phạm vi 5 màn bám Figma: **Trang chủ · Danh mục · Chi tiết · Thanh toán · Quản trị** (kèm bản mobile 375px),
nhóm dựng thêm: So sánh · Đặt lịch nhận xe · Tin tức · Liên hệ · Đăng nhập · Tài khoản.

---

## 2. Tính năng chính

- **11 trang** có điều hướng: Trang chủ · Danh mục xe · Chi tiết xe · So sánh xe · Đặt lịch nhận xe · Tin tức · Liên hệ ·
  **Thanh toán thuê xe** · **Đăng nhập/Đăng ký** · **Tài khoản của tôi** · **Bảng điều khiển quản trị**.
- **Biểu mẫu thuê ở trang chủ:** chọn địa điểm/ngày/giờ Pick-Up & Drop-Off, chặn ngày quá khứ, **chặn ngày trả trước ngày nhận**, tính số ngày → **giá tạm tính**, nút **swap** đổi điểm nhận/trả.
- **Lọc & tìm kiếm:** theo hãng, kiểu dáng, nhiên liệu, **số chỗ (2·4·6·8+)**, thanh trượt giá — **số đếm động** trong ngoặc từ dữ liệu; **gợi ý tức thì (autocomplete)** ở ô tìm kiếm; sắp xếp; lọc yêu thích.
- **Chi tiết xe:** gallery ảnh (ảnh xe + ảnh nội thất) · thông số dạng tab · **đánh giá có phân trang** · **tính chi phí thuê** theo số ngày.
- **So sánh 2 xe** cạnh nhau, tự tô đậm chỉ số tốt hơn.
- **Thanh toán nhiều bước (wizard 4 bước):** Thông tin → Lịch nhận/trả → Phương thức → Xác nhận; **validate từng bước**; tính Tạm tính · **Thuế (VAT 10%)** · Tổng · mã ưu đãi.
- **Tài khoản:** đăng ký / đăng nhập (hash mật khẩu + token ở server), hồ sơ, lịch nhận xe, xe yêu thích, đăng xuất.
- **Quản trị:** thẻ KPI · **biểu đồ Chart.js** (tỉ lệ phân khúc + doanh thu theo ngày) · chi tiết đơn mới nhất · giao dịch gần đây (đọc dữ liệu từ API).
- **Đa ngôn ngữ VI/EN** (ghi nhớ lựa chọn; giá USD/VND theo ngôn ngữ), **Dark mode** (theo `prefers-color-scheme` lần đầu), **menu mobile**, yêu thích (`localStorage`), toast, scroll-reveal.
- **Responsive** 3 breakpoint (điện thoại / máy tính bảng / máy tính).

## 3. Công nghệ

- **HTML5 semantic** + **Tailwind CSS v3** (build ra CSS tĩnh, không dùng CDN) + CSS component/theme tự viết (gộp trong `src/input.css`).
- **JavaScript ES6+** thuần (không framework). Dữ liệu **động qua `fetch()`** từ `assets/data/*.json`.
- **Backend API tự dựng:** Node.js + **Express** (`server/`) — REST cho xe/tin tức/lịch nhận xe/đơn thuê/liên hệ/tài khoản. Frontend có **fallback `localStorage`** khi chạy tĩnh không có server.
- **Chart.js** (biểu đồ quản trị) · Font **Plus Jakarta Sans** (Google Fonts, tải non-blocking) · bản đồ nhúng OpenStreetMap.

---

## 4. Cách chạy

```bash
# Cài & build CSS (Tailwind: src/input.css -> dist/output.css)
npm run build          # build 1 lần, có nén (chạy trước khi nộp)
npm run dev            # vừa sửa vừa xem — tự build lại khi lưu (để nguyên terminal)
```

**Chạy web + API (khuyến nghị, cần Node.js):**

```bash
cd server && npm install && npm start
# Web: http://localhost:3000/index.html   ·   API: http://localhost:3000/api/cars
```

**Chỉ web tĩnh (không cần server):** mở `index.html` bằng **Live Server** (VS Code) hoặc `python -m http.server`.
Form & tài khoản tự chạy chế độ **fallback localStorage**.

> Cần Internet để tải Google Fonts. `dist/output.css` đã build sẵn nên mở tĩnh vẫn có đủ style.

---

## 5. Cấu trúc thư mục

```
Morent/
├─ index.html · cars.html · car-detail.html · compare.html · test-drive.html
│  news.html · contact.html · payment.html · auth.html · account.html · admin.html
├─ src/
│  └─ input.css          ← NGUỒN CSS (Tailwind + component/theme) — sửa ở đây
├─ dist/
│  └─ output.css         ← CSS đã build (npm run build) — trang HTML nạp file này
├─ assets/
│  ├─ js/                ← mã JS (mỗi trang 1 file + dùng chung)
│  │  data.js · api.js · layout.js · i18n.js · main.js · catalog.js · car-detail.js
│  │  compare.js · news.js · test-drive.js · contact.js · payment.js · auth.js · account.js · admin.js
│  ├─ data/              ← dữ liệu động: cars.json · news.json (fetch)
│  └─ img/               ← ảnh xe · nội thất · logo hãng · ảnh dealer
├─ server/               ← API Express: server.js · db.json · package.json · README.md
├─ tailwind.config.js    ← cấu hình Tailwind (màu, font, quét class)
├─ package.json          ← script  dev / build  CSS
└─ README.md
```

> **Nguồn (source code)** nằm ở: `src/input.css` (CSS nguồn) + `assets/js/*.js` (JS nguồn) + `assets/data/*.json` (dữ liệu).
> `dist/output.css` là **file build tự sinh** — đừng sửa tay, hãy sửa `src/input.css` rồi chạy `npm run build`.

## 6. Design tokens (bám Figma Morent)

```
Màu chính (primary):  #3563E9      Màu nhấn (accent):  #54A6FF
Chữ (ink):            #1A202C      Chữ phụ (muted):    #90A3BF
Nền (bg):             #F6F7F9      Viền (line):        #E8EDF6
Font:  Plus Jakarta Sans (400–800), fallback Inter / system-ui
Bo góc thẻ: 12px · nút: 10px · Breakpoint: sm 640 · md 768 · lg 1024 · xl 1280
```
Đầy đủ biến `--primary / --accent / --ink / --muted / --bg / --line …` khai báo ở đầu `src/input.css` (kèm bộ biến cho **dark mode**).

## 7. API (server Express tự dựng)

| Method | Endpoint | Chức năng |
|---|---|---|
| GET | `/api/cars` · `/api/cars/:id` | Danh sách / chi tiết xe |
| GET | `/api/news` | Tin tức |
| GET/POST | `/api/test-drives` | Lịch nhận xe (đọc / tạo) |
| GET/POST | `/api/orders` | Đơn thuê (đọc / tạo) |
| POST | `/api/contacts` | Gửi liên hệ |
| POST | `/api/auth/register` · `/api/auth/login` | Đăng ký / đăng nhập |
| GET | `/api/me` | Thông tin tài khoản (token) |

## 8. Tính năng JavaScript bắt buộc (đối chiếu đề)

1. ✅ Biểu mẫu thuê ở trang chủ (địa điểm/ngày/giờ · chặn ngày · giá tạm tính) — `main.js`
2. ✅ Lọc danh mục (TYPE · CAPACITY · PRICE · số đếm động) + tìm kiếm + sắp xếp — `catalog.js`
3. ✅ Slider/gallery ảnh + thông số dạng tab ở chi tiết — `car-detail.js`
4. ✅ Thanh toán nhiều bước + validate từng bước + tính tiền theo ngày — `payment.js`
5. ✅ Tìm kiếm gợi ý + yêu thích (localStorage, đồng bộ) — `layout.js`
6. ✅ Quản trị (đơn + Dark mode) + **Chart.js** (điểm cộng) — `admin.js`
   · Đăng nhập/đăng ký · So sánh · Đánh giá phân trang · Đa ngôn ngữ (vượt yêu cầu)

---

## 9. Tiến độ nhóm (✅ xong · 🟡 đang làm · ⬜ chưa)

- ✅ Dựng đủ 11 trang, bám Figma 5 màn (Home/Category/Detail/Payment/Admin) + mobile 375px
- ✅ Web động (fetch JSON) + API Express tự dựng (đã test chạy thật) + fallback localStorage
- ✅ Đủ tính năng JS bắt buộc + nhiều tính năng vượt (auth, so sánh, review, i18n VI/EN, dark mode)
- ✅ Responsive 3 breakpoint · 0 lỗi console
- ✅ Trang chi tiết xe chỉnh bám Figma: khối thuê xe gom vào một thẻ, thông số xếp hai
  cột nhãn–giá trị, ảnh nội thất phủ kín khung, nhận xét đưa lên ngay dưới Tổng quan
- ✅ Deploy bằng GitHub Pages, tự cập nhật mỗi lần push:
  <https://dawngtm2806-ops.github.io/20-tkw-showroomoto/>
- ✅ Bản đồ trang Liên hệ chuyển sang Google Maps do OpenStreetMap chặn nhúng
- 🟡 Lighthouse đo ở máy: **Perf 91 · A11y 95 · BP 100 · SEO 100** — cần đo lại trên bản deploy
- ⬜ Báo cáo (20 trang) · Video demo (5 phút) · Ảnh đối chiếu Figma ↔ web
- ⬜ Chèn ảnh 3 breakpoint vào README

## 10. Checklist đối chiếu Figma (đảm bảo GATE 20%)

Mở Figma (Dev Mode) và đối chiếu:
- [x] Màu primary `#3563E9`, chữ phụ `#90A3BF`, nền `#F6F7F9`
- [x] Font Plus Jakarta Sans, cỡ heading/paragraph khớp
- [x] Bo góc, khoảng cách (padding/gap) card khớp
- [x] Hero 2 banner promo + thanh Pick-Up/Drop-Off có nút swap
- [x] Card xe: tim ❤ · tên · loại · ảnh · 3 thông số · giá · nút — đúng vị trí
- [x] Thẻ thuê xe ở trang chi tiết: tên · sao · mô tả · thông số 2 cột · giá cũ gạch dưới
      giá mới · nút thuê
- [x] Footer Morent: logo + tagline + cột link + dòng bản quyền
- [ ] Chụp vài ảnh **so sánh Figma ↔ web** cho báo cáo

## 11. Thành viên nhóm & phân công

| Thành viên | Phụ trách chính |
|---|---|
| Trần Minh Đăng | *Trang chủ · Danh mục xe · Chi tiết xe* (bám Figma); JS bắt buộc: *lọc / tìm kiếm / sắp xếp*, *gallery ảnh + tab thông số*; HTML semantic + CSS/Tailwind responsive các trang này |
| Phùng Duy Mạnh | *Thanh toán · Quản trị · So sánh · Đặt lịch · Tin tức · Liên hệ · Đăng nhập · Tài khoản*; JS bắt buộc: *validate biểu mẫu*, *so sánh 2 xe*; tính năng: đánh giá có phân trang, *đa ngôn ngữ VI/EN*, dark mode, *Chart.js* |
| Nguyễn Thanh Bình | *Web động (fetch JSON, tách dữ liệu khỏi code)* + *API Express tự dựng* (xe / đơn thuê / đăng nhập, fallback localStorage); JS bắt buộc: *biểu mẫu thuê ở trang chủ* (chọn ngày/giờ + chặn ngày trả trước ngày nhận + giá tạm tính); *build Tailwind tĩnh + tối ưu Lighthouse + deploy* |
---

## 12. Ghi chú

- Dữ liệu xe/giá/hình ảnh mang tính **minh hoạ cho mục đích học tập**.
- Trang "thanh toán" chỉ **mô phỏng giao diện** — không thu phí thật, không gửi dữ liệu thẻ đi đâu.
- Giao diện tham khảo template Figma Community (Morent) đã dẫn nguồn ở đầu file; nội dung điều chỉnh cho ngữ cảnh thuê xe.



---

