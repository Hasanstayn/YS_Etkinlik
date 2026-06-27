# 💡 Yenilikçi Sınıf Eğitim Atölyesi

Yapay Zeka Destekli Aktif Öğrenme Planlayıcısı ve Öğrenme Senaryosu (TOÖS) Tasarımcısı.

Merhaba! Ben **Hasan YILMAZ**, Matematik Öğretmeniyim. Bu proje, öğretmenlerimizin derslerinde aktif öğrenme tekniklerini, Türkiye Yüzyılı Maarif Modeli müfredat standartlarını ve Esnek Öğrenme Alanları (FCL) pedagojilerini kolayca planlayabilmeleri için geliştirilmiş modern bir web uygulamasıdır.

Uygulama sayesinde yapay zeka desteğiyle saniyeler içinde zengin içerikli etkinlik planları ve öğrenme senaryoları üretebilir, bunları sınıfınızın 2D yerleşim planıyla birlikte görüntüleyebilir, doğrudan orijinal Word (.docx) şablonuna doldurulmuş olarak bilgisayarınıza indirebilir veya Google Drive klasörünüze kaydedebilirsiniz.

---

## 🚀 Başlamadan Önce Yapılması Gereken Ayarlar

Sistemi kullanabilmeniz için tarayıcınız üzerinden yapmanız gereken iki temel ayar bulunmaktadır:

### 1. Gemini API Anahtarı Tanımlama (Zorunlu)
Uygulamanın yapay zeka özelliklerini kullanabilmesi için bir Google Gemini API anahtarına ihtiyacı vardır. Bu anahtarı almak tamamen ücretsizdir:
1. [Google AI Studio](https://aistudio.google.com/) adresine gidin ve Google hesabınızla giriş yapın.
2. **"Create API Key"** butonuna tıklayarak ücretsiz bir API anahtarı oluşturun ve kopyalayın.
3. Uygulamanın sağ üst köşesindeki **"API Ayarları"** (vites simgeli) butonuna tıklayın.
4. Kopyaladığınız anahtarı kutucuğa yapıştırıp **"Kaydet"** butonuna basın.

> [!NOTE]
> API anahtarınız kesinlikle hiçbir sunucuya veya dış servise gönderilmez; yalnızca sizin tarayıcınızın yerel hafızasında (`localStorage`) güvenli bir şekilde saklanır.

---

### 2. Google Drive Entegrasyonu (İsteğe Bağlı)
Eğer hazırladığınız senaryoları doğrudan ortak veya kişisel bir Google Drive klasörüne kaydetmek ve öğretmenlerin sadece kendi yükledikleri dosyaları silebilmesini (başkalarının dosyalarına müdahale edememesini) istiyorsanız aşağıdaki kurulumu yapabilirsiniz:

#### A. Google Drive Klasör Yetkilendirmesi
Öğretmenlerin başkalarının yüklediği planları yanlışlıkla silmesini engellemek için, paylaşmak istediğiniz Google Drive klasörünün erişim yetkisini öğretmenler için **yalnızca "Görüntüleyen" (Viewer)** olarak ayarlayın.

#### B. Google Apps Script Kurulumu
1. [Google Apps Script](https://script.google.com/) (`script.google.com`) adresine gidin.
2. Yeni bir proje oluşturun ve aşağıdaki kodu editöre yapıştırın:
   ```javascript
   function doPost(e) {
     try {
       var data = JSON.parse(e.postData.contents);
       
       // YÜKLEME YAPILACAK GOOGLE DRIVE KLASÖRÜNÜZÜN ID'Sİ
       var folderId = "BURAYA_DRIVE_KLASOR_ID_YAZIN"; 
       
       if (data.action === "upload") {
         var decoded = Utilities.base64Decode(data.base64Data);
         var blob = Utilities.newBlob(decoded, data.mimeType, data.filename);
         var folder = DriveApp.getFolderById(folderId);
         var file = folder.createFile(blob);
         
         // Benzersiz silme tokeni (güvenlik için)
         var deleteToken = Utilities.getUuid();
         file.setDescription(deleteToken);
         
         return ContentService.createTextOutput(JSON.stringify({ 
           status: "success", 
           url: file.getUrl(),
           fileId: file.getId(),
           deleteToken: deleteToken
         })).setMimeType(ContentService.MimeType.JSON);
         
       } else if (data.action === "delete") {
         var fileId = data.fileId;
         var deleteToken = data.deleteToken;
         var file = DriveApp.getFileById(fileId);
         
         // Şifre kontrolü
         if (file.getDescription() === deleteToken) {
           file.setTrashed(true); // Çöp kutusuna taşı
           return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
         } else {
           return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Yetkisiz silme denemesi!" })).setMimeType(ContentService.MimeType.JSON);
         }
       }
       
     } catch(error) {
       return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```
3. Üst menüden **"Dağıt" -> "Yeni Dağıtım" (Deploy -> New Deployment)** seçeneğine tıklayın.
4. Dağıtım türünü **"Web Uygulaması" (Web App)** olarak seçin.
5. Yapılandırma ayarlarında:
   * **Uygulamayı yürüten kişi (Execute as):** "Ben" (Hesabınızın sahibi)
   * **Erişimi olanlar (Who has access):** "Herkes" (Anyone) olarak ayarlayın ve **Dağıt** butonuna basın.
6. Dağıtım sonrasında size verilen **Web Uygulaması URL'sini** kopyalayın ve projenin `src/utils/driveIntegration.js` dosyasındaki `appsScriptUrl` sabitinin değerine yapıştırın.

---

## 🛠️ Teknolojiler ve Yerel Kurulum

Bu uygulama modern bir **React + Vite** projesidir.

### Kullanılan Teknolojiler
* **React** (Kullanıcı arayüzü ve durum yönetimi)
* **Vite** (Hızlı derleme ve geliştirme ortamı)
* **Tailwind CSS v4** (Modern ve dinamik arayüz tasarımları)
* **JSZip** (Tarayıcı tarafında Word belgelerini açıp düzenleme)
* **MathJax** (Matematiksel formüllerin kusursuz render edilmesi)

### Kendi Bilgisayarınızda Çalıştırma
Projeyi klonladıktan sonra yerelinizde çalıştırmak için aşağıdaki komutları kullanabilirsiniz:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173/YS_Etkinlik` adresine giderek uygulamayı canlı olarak kullanmaya başlayabilirsiniz.
