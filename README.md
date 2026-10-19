# A Little Gift — 20/10 (Dành Tặng Hội Bạn Thân)

Website quà tặng 20/10 phong cách điện ảnh dành cho 4 người bạn thân:
1. **Hồ Thị Diệu Ánh** (`dieu-anh`): Lời chúc dịu dàng, ấm áp và tình cảm.
2. **Nguyễn Trang Nhung** (`trang-nhung`): Phong cách siêu lầy lội, cợt nhả, hài hước đỉnh cao.
3. **Nguyễn Khánh Ngọc** (`khanh-ngoc`): Phong cách bạn bè thân thiết, tươi tắn, đáng yêu.
4. **Hoàng Thái Việt** (`thai-viet`): Phong cách bạn thân chiến hữu, hài hước, phong độ.
5. **Hội Bạn Thân** (`hoi-ban-than`): Dành cho cả nhóm cùng xem.

---

## 🚀 Trải nghiệm & Đường Link Gửi Riêng Từng Bạn

Website hỗ trợ đường link trực tiếp (URL Parameter `?to=...`) để bạn có thể copy gửi riêng cho từng người qua Messenger/Zalo:

- **Hồ Thị Diệu Ánh**:  
  `https://bruhckao.github.io/20-10-hairless/?to=dieu-anh`
- **Nguyễn Trang Nhung**:  
  `https://bruhckao.github.io/20-10-hairless/?to=trang-nhung`
- **Nguyễn Khánh Ngọc**:  
  `https://bruhckao.github.io/20-10-hairless/?to=khanh-ngoc`
- **Hoàng Thái Việt**:  
  `https://bruhckao.github.io/20-10-hairless/?to=thai-viet`
- **Cả nhóm**:  
  `https://bruhckao.github.io/20-10-hairless/?to=hoi-ban-than`

*(Ngay trên đầu website cũng có thanh chọn bạn thân và nút **🔗 Sao chép link gửi cho...** cực kỳ tiện lợi!)*

---

## 🛠 Hướng Dẫn Thay Ảnh & Chỉnh Sửa Lời Chúc

### 1. Thay ảnh của từng bạn
- Lưu ảnh vào thư mục `assets/photos/` hoặc các thư mục con:
  - `assets/photos/dieu-anh/`
  - `assets/photos/trang-nhung/`
  - `assets/photos/khanh-ngoc/`
  - `assets/photos/thai-viet/`
- Mở file [script.js](file:///c:/Users/bungt/OneDrive/hairless20-10/script.js), tìm đến đối tượng `FRIENDS_DATA` ở cuối file.
- Trong phần `photos` của mỗi bạn, chỉ cần cập nhật đường dẫn `src` và chú thích `caption` tương ứng.
- Ngoài ra có thể thay ảnh đại diện Hero tại thuộc tính `heroImage` của từng bạn.

### 2. Chỉnh sửa lời chúc & lá thư
Trong file [script.js](file:///c:/Users/bungt/OneDrive/hairless20-10/script.js), tìm `FRIENDS_DATA`:
- `headline`: Tiêu đề lớn mở đầu.
- `heroText`: Lời dẫn giới thiệu.
- `letterTitle`: Tiêu đề bức thư cảm ơn.
- `letterParagraphs`: Các đoạn văn trong bức thư riêng cho bạn đó.
- `finalWish`: Lời chúc xuất hiện khi bông hoa nở bung.
- `cinemaWishes`: Danh sách các câu chúc rơi cùng cánh hoa trong hiệu ứng điện ảnh.

### 3. Thay nhạc nền
- Đặt file nhạc vào `assets/audio/music.webm` (hoặc định dạng `.mp3`).
- Muốn chỉnh thời gian bắt đầu hay cắt bớt đuôi bài nhạc, sửa `MUSIC_START_TIME` và `MUSIC_END_TRIM` ở đầu file `script.js`.

---

## 🌐 Xuất Bản Lên GitHub Pages (Public Website)

1. Truy cập repo của bạn: [https://github.com/bruhckao/20-10-hairless](https://github.com/bruhckao/20-10-hairless)
2. Vào tab **Settings** (Cài đặt) -> Chọn mục **Pages** ở menu bên trái.
3. Ở phần **Build and deployment**:
   - **Source**: Chọn `Deploy from a branch`
   - **Branch**: Chọn nhánh `main`, thư mục `/ (root)`
   - Nhấn **Save**.
4. Chờ 1–2 phút, GitHub sẽ cấp cho bạn đường link website public:
   👉 **`https://bruhckao.github.io/20-10-hairless/`**

---

## 💻 Chạy Thử Trên Máy (Local)
1. Mở file [index.html](file:///c:/Users/bungt/OneDrive/hairless20-10/index.html) trực tiếp bằng trình duyệt (Chrome, Edge, Firefox...), hoặc mở bằng tiện ích Live Server trong VS Code.
2. Nhấn nút ♫ góc dưới màn hình để bật nhạc nền.
3. Chạm vào bông hồng ở phần Khung hình để thưởng thức màn trình chiếu cánh hoa và ảnh điện ảnh.
