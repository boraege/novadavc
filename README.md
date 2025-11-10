# ✦ NOVADA

Modern, gece mavisi temalı sesli sohbet ve ekran paylaşım platformu.

## ✨ Özellikler

- 🎤 Kristal kalitede sesli sohbet (WebRTC)
- 📹 HD video görüşme
- 🖥️ Ekran paylaşımı
- 👥 Çoklu kullanıcı desteği
- 🔒 Oda tabanlı güvenli sistem
- 🌙 Modern gece mavisi tema
- 📱 Responsive tasarım

## 🚀 Kurulum

### Yerel Bilgisayarda

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Sunucuyu başlatın:
```bash
npm start
```

3. Tarayıcıda açın: `http://localhost:3000`

### Render.com'da Deploy (Ücretsiz)

1. GitHub'a yükleyin
2. [Render.com](https://render.com)'a gidin
3. "New +" → "Web Service" seçin
4. GitHub repo'nuzu bağlayın
5. Ayarlar:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. "Create Web Service" tıklayın

### Vercel'de Deploy (Alternatif)

Not: Vercel serverless fonksiyonlar kullanır, bu yüzden Socket.io için Render veya Heroku önerilir.

## 📖 Kullanım

1. Uygulamayı açın
2. Adınızı girin
3. Bir oda ID'si belirleyin (örn: "oda123")
4. "Odaya Katıl" butonuna tıklayın
5. Arkadaşlarınız aynı oda ID'sini kullanarak katılabilir

### Kontroller

- 🎤 **Mikrofon:** Sesinizi açıp kapatın
- 📹 **Kamera:** Video'yu açıp kapatın
- 🖥️ **Ekran Paylaş:** Ekranınızı paylaşın
- 📞 **Ayrıl:** Odadan çıkın

## 🔧 Gereksinimler

- Node.js 14+
- Modern tarayıcı (Chrome, Firefox, Safari, Edge)
- HTTPS bağlantısı (production için)

## ⚠️ Önemli Notlar

- **HTTPS Gerekli:** WebRTC özellikleri (mikrofon, kamera, ekran paylaşımı) production'da HTTPS gerektirir
- **Tarayıcı İzinleri:** Kullanıcılar mikrofon/kamera erişimine izin vermelidir
- **STUN Sunucuları:** Google'ın ücretsiz STUN sunucuları kullanılıyor
- **Ölçeklenebilirlik:** Büyük gruplar için TURN sunucusu gerekebilir

## 🌐 Tarayıcı Desteği

- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Opera 67+

## 📝 Lisans

MIT

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir. Büyük değişiklikler için önce bir issue açın.
