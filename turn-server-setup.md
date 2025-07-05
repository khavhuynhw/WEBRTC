# Hướng dẫn Setup TURN Server

## 🎯 Giải pháp tốt nhất: Tự host TURN server

### Bước 1: Deploy TURN server lên VPS
```bash
# Sử dụng coturn (TURN server)
sudo apt update
sudo apt install coturn

# Cấu hình coturn
sudo nano /etc/turnserver.conf
```

### Bước 2: Cấu hình coturn
```
# /etc/turnserver.conf
listening-port=3478
tls-listening-port=5349
listening-ip=YOUR_SERVER_IP
external-ip=YOUR_SERVER_IP
realm=your-domain.com
server-name=your-domain.com
user-quota=12
total-quota=1200
authentication-method=long-term
user=username:password
cert=/path/to/cert.pem
pkey=/path/to/privkey.pem
```

### Bước 3: Cập nhật ICE servers
```javascript
// Trong scripts.js
iceServers: [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302'
    ]
  },
  {
    urls: 'turn:your-domain.com:3478',
    username: 'username',
    credential: 'password'
  }
]
```

## 🚀 Giải pháp thay thế:

### 1. Sử dụng Twilio TURN (trả phí)
- Đăng ký tài khoản Twilio
- Lấy TURN credentials
- Cập nhật trong code

### 2. Sử dụng XirSys (miễn phí có giới hạn)
- Đăng ký tại https://xirsys.com
- Lấy TURN credentials
- Cập nhật trong code

### 3. Sử dụng ngrok để test
```bash
# Expose local TURN server
ngrok tcp 3478
```

## 📊 So sánh các giải pháp:

| Giải pháp | Chi phí | Ổn định | Khó khăn |
|-----------|---------|----------|----------|
| **Tự host** | Thấp | Cao | Trung bình |
| **Twilio** | Cao | Cao | Thấp |
| **XirSys** | Miễn phí | Trung bình | Thấp |
| **Free TURN** | Miễn phí | Thấp | Thấp |

## 🎯 Khuyến nghị:

1. **Cho production**: Tự host TURN server
2. **Cho development**: Sử dụng Twilio hoặc XirSys
3. **Cho test**: Sử dụng free TURN servers 