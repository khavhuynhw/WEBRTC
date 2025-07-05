# WebRTC Video Call App

Ứng dụng gọi video WebRTC có thể deploy lên Vercel và cho phép nhiều người gọi video với nhau.

## 🚀 Cách Deploy

### 1. Deploy Signaling Server

Signaling server cần được deploy lên một platform hỗ trợ WebSocket (không phải Vercel). Bạn có thể sử dụng:

#### Option A: Deploy lên Railway
```bash
cd api
npm install
# Tạo tài khoản Railway và deploy
railway login
railway init
railway up
```

#### Option B: Deploy lên Render
```bash
cd api
npm install
# Tạo tài khoản Render và deploy
# Sử dụng file render.yaml có sẵn
```

#### Option C: Deploy lên Heroku
```bash
cd api
npm install
# Tạo tài khoản Heroku và deploy
heroku create your-signaling-server
git push heroku main
```

### 2. Cập nhật Signaling Server URL

Sau khi deploy signaling server, cập nhật URL trong file `scripts.js`:

```javascript
const SIGNALING_SERVER_URL = 'https://your-signaling-server.railway.app'; // Thay đổi URL này
```

### 3. Deploy Frontend lên Vercel

```bash
# Cài đặt Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 📁 Cấu trúc Project

```
webrtc-starter/
├── index.html          # Frontend chính
├── scripts.js          # WebRTC logic
├── socketListeners.js  # Socket.IO listeners
├── styles.css          # CSS styles
├── package.json        # Frontend dependencies
├── vercel.json         # Vercel config
├── api/                # Signaling server
│   ├── signaling-server.js
│   └── package.json
└── README.md
```

## 🔧 Cấu hình

### ICE Servers
Ứng dụng sử dụng các STUN/TURN servers miễn phí:
- Google STUN servers
- OpenRelay TURN servers

### Authentication
Hiện tại sử dụng password đơn giản "x". Trong production nên sử dụng JWT.

## 🎯 Cách sử dụng

1. **Chia sẻ ID**: Mỗi người dùng sẽ có một ID duy nhất
2. **Bắt đầu cuộc gọi**: Click "Start Call" để tạo cuộc gọi
3. **Trả lời cuộc gọi**: Người khác sẽ thấy button "Answer" để tham gia
4. **Cho phép camera/microphone**: Khi được yêu cầu

## 🔒 Bảo mật

- Sử dụng HTTPS cho tất cả kết nối
- CORS được cấu hình cho production
- ICE candidates được trao đổi an toàn qua signaling server

## 🐛 Troubleshooting

### Lỗi kết nối
- Kiểm tra URL signaling server trong `scripts.js`
- Đảm bảo signaling server đang chạy
- Kiểm tra console để xem lỗi chi tiết

### Lỗi camera/microphone
- Đảm bảo đã cho phép quyền truy cập
- Kiểm tra xem có ứng dụng nào khác đang sử dụng camera không

### Lỗi WebRTC
- Kiểm tra firewall settings
- Thử refresh trang
- Kiểm tra kết nối internet

## 📱 Tính năng

- ✅ Video call 1-1
- ✅ Audio support
- ✅ Responsive design
- ✅ Real-time connection status
- ✅ Error handling
- ✅ Modern UI/UX

## 🚧 Limitations

- Chỉ hỗ trợ cuộc gọi 1-1 (không phải group call)
- Cần signaling server riêng biệt
- Phụ thuộc vào STUN/TURN servers bên ngoài

## 🔄 Development

### Local Development
```bash
# Terminal 1: Start signaling server
cd api
npm install
npm start

# Terminal 2: Start frontend (optional)
# Chỉ cần mở index.html trong browser
```

### Testing
1. Mở 2 tab browser khác nhau
2. Mỗi tab sẽ có ID khác nhau
3. Tab 1 click "Start Call"
4. Tab 2 sẽ thấy button "Answer"
5. Click "Answer" để bắt đầu cuộc gọi

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:
1. Console browser (F12)
2. Network tab để xem kết nối WebSocket
3. Signaling server logs 