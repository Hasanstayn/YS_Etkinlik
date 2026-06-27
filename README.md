# 💡 Yenilikçi Sınıf Eğitim Atölyesi

Yapay Zeka Destekli Aktif Öğrenme Planlayıcısı ve Öğrenme Senaryosu (TOÖS) Tasarımcısı.

Merhaba! Ben **Hasan YILMAZ**, Matematik Öğretmeniyim. Bu proje, öğretmenlerimizin derslerinde aktif öğrenme tekniklerini, Türkiye Yüzyılı Maarif Modeli müfredat standartlarını ve Esnek Öğrenme Alanları (FCL) pedagojilerini kolayca planlayabilmeleri için geliştirilmiş modern bir web uygulamasıdır.

Uygulama sayesinde yapay zeka desteğiyle saniyeler içinde zengin içerikli etkinlik planları ve öğrenme senaryoları üretebilir, bunları sınıfınızın 2D yerleşim planıyla birlikte görüntüleyebilir, doğrudan orijinal Word (.docx) şablonuna doldurulmuş olarak bilgisayarınıza indirebilir veya Google Drive klasörümüze kaydedebilirsiniz.

---

## 🌐 Uygulamaya Ulaşın ve Hemen Kullanın

Uygulamayı herhangi bir kurulum yapmadan doğrudan tarayıcınız üzerinden ücretsiz kullanabilirsiniz:
👉 **[Yenilikçi Sınıf Eğitim Atölyesi Planlayıcısı (Canlı Yayın)](https://hasanstayn.github.io/YS_Etkinlik)**

---

## 🚀 Başlamadan Önce Yapılması Gereken Ayarlar

Sistemi kullanabilmeniz için tarayıcınız üzerinden yapmanız gereken tek bir temel ayar bulunmaktadır:

### 1. Gemini API Anahtarı Tanımlama (Zorunlu)
Uygulamanın yapay zeka özelliklerini kullanabilmesi için bir Google Gemini API anahtarına ihtiyacı vardır. Bu anahtarı almak tamamen ücretsizdir:
1. [Google AI Studio](https://aistudio.google.com/) adresine gidin ve Google hesabınızla giriş yapın.
2. **"Create API Key"** butonuna tıklayarak ücretsiz bir API anahtarı oluşturun ve kopyalayın.
3. Uygulamanın sağ üst köşesindeki **"API Ayarları"** (vites simgeli) butonuna tıklayın.
4. Kopyaladığınız anahtarı kutucuğa yapıştırıp **"Kaydet"** butonuna basın.

> [!NOTE]
> API anahtarınız kesinlikle hiçbir sunucuya veya dış servise gönderilmez; yalnızca sizin tarayıcınızın yerel hafızasında (`localStorage`) güvenli bir şekilde saklanır.

---

## 📂 Google Drive Özellikleri
Uygulamadaki **"Drive'a Kaydet"** ve **"Drive Klasörü"** özellikleri önceden yapılandırılmıştır. 
* Hazırladığınız senaryoları doğrudan ortak Google Drive klasörümüze tek tıkla kaydedebilirsiniz.
* Güvenlik protokolü gereği, sistem sadece **kendi yüklediğiniz dosyaları silmenize** izin verir; diğer öğretmenlerin yüklediği belgelere erişim veya silme yetkiniz bulunmaz.

---

## 🛠️ Teknolojiler ve Geliştiriciler İçin Yerel Kurulum

Bu uygulama modern bir **React + Vite** projesidir. Eğer projeyi kendi bilgisayarınızda geliştirmek veya üzerinde değişiklik yapmak isterseniz:

### Kullanılan Teknolojiler
* **React** (Kullanıcı arayüzü ve durum yönetimi)
* **Vite** (Hızlı derleme ve geliştirme ortamı)
* **Tailwind CSS v4** (Modern ve dinamik arayüz tasarımları)
* **JSZip** (Tarayıcı tarafında Word belgelerini açıp düzenleme)
* **MathJax** (Matematiksel formüllerin kusursuz render edilmesi)

### Yerel Kurulum Adımları
```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173/YS_Etkinlik` adresine giderek uygulamayı yerelinizde de çalıştırabilirsiniz.
