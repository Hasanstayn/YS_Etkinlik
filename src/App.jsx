// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Settings, FolderOpen, RefreshCw, X, CheckCircle, AlertTriangle } from 'lucide-react';
import InputForm from './components/InputForm';
import ResultPanel from './components/ResultPanel';
import FloorPlanCanvas from './components/FloorPlanCanvas';
import SettingsModal from './components/SettingsModal';
import SavedScenariosModal from './components/SavedScenariosModal';

import { callGeminiText } from './utils/geminiApi';
import { formatMarkdown, parseGeneratedMarkdown } from './utils/markdownParser';
import { downloadDocx, generateDocxBlob } from './utils/docxGenerator';
import { uploadToGoogleDrive, deleteFromGoogleDrive } from './utils/driveIntegration';

const LOCAL_STORAGE_KEY = 'fcl_saved_scenarios_v1';
const API_KEY_STORAGE_KEY = 'fcl_gemini_api_key_v1';
const UPLOADS_STORAGE_KEY = 'fcl_my_uploads_v1';

export default function App() {
  // Settings & Storage States
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState([]);
  
  // Form States
  const [belgeTuru, setBelgeTuru] = useState('etkinlikPlani');
  const [ders, setDers] = useState('');
  const [sinif, setSinif] = useState('5');
  const [teknik, setTeknik] = useState('auto');
  const [sure, setSure] = useState('40');
  const [yapayZekaAraclari, setYapayZekaAraclari] = useState('');
  const [kazanim, setKazanim] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState(['İletişim', 'İş Birliği', 'Eleştirel Düşünme', 'Yaratıcılık']);
  
  // Output & Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponseText, setLastResponseText] = useState('');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [showLayout, setShowLayout] = useState(false);
  const [driveStatus, setDriveStatus] = useState('idle'); // 'idle', 'uploading', 'uploaded', 'deleting'
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Load configuration from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    setApiKey(storedKey);

    const storedScenarios = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    setSavedScenarios(storedScenarios);
  }, []);

  // Trigger MathJax typesetting when renderedHtml changes
  useEffect(() => {
    if (renderedHtml && window.MathJax) {
      setTimeout(() => {
        const resCont = document.getElementById('resultContent');
        if (resCont) {
          window.MathJax.typesetPromise([resCont]).catch((err) => console.log("MathJax error:", err.message));
        }
      }, 300);
    }
  }, [renderedHtml]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Save API key
  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, newKey);
    showToast("Ayarlar başarıyla kaydedildi.", "success");
  };

  // Toggle layout plan view
  const handleDrawLayout = () => {
    setShowLayout(true);
    setTimeout(() => {
      const layoutSec = document.getElementById('layoutSection');
      if (layoutSec) {
        layoutSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Re-evaluate save to drive button state based on current output content
  const getCurrentScenarioKey = (scText) => {
    const markdown = scText || lastResponseText || "";
    const data = parseGeneratedMarkdown(markdown);
    
    const dName = data.dersAdi || ders || "BilinmeyenDers";
    const sLevel = data.sinifSeviyesi || sinif || "BilinmeyenSinif";
    const bType = belgeTuru || "etkinlikPlani";
    const kName = data.kazanimlar || kazanim || "";
    
    return `${dName}_${sLevel}_${bType}_${kName.substring(0, 30)}`.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g, '_');
  };

  const getDriveStatusForCurrent = () => {
    const key = getCurrentScenarioKey();
    const uploads = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY) || '{}');
    return uploads[key] ? 'uploaded' : 'idle';
  };

  useEffect(() => {
    if (renderedHtml) {
      setDriveStatus(getDriveStatusForCurrent());
    }
  }, [renderedHtml, lastResponseText]);

  // Form Submit (AI Content Generation)
  const handleSubmit = async () => {
    if (!apiKey) {
      showToast("Lütfen sağ üstteki API Ayarları menüsünden geçerli bir Gemini API Anahtarı girin.", "error");
      setIsSettingsOpen(true);
      return;
    }

    if (!ders || !kazanim || !sure) {
      showToast("Lütfen ders adı, etkinlik süresi ve kazanım alanlarını doldurun.", "error");
      return;
    }

    const sureNum = parseInt(sure);
    if (isNaN(sureNum) || sureNum > 80 || sureNum <= 0) {
      showToast("Etkinlik süresi en fazla 80 dakika ve sıfardan büyük olmalıdır!", "error");
      return;
    }

    if (selectedZones.length === 0) {
      showToast("Lütfen en az bir öğrenme alanı seçin.", "error");
      return;
    }

    if (selectedSkills.length === 0) {
      showToast("Lütfen en az bir 4C Becerisi seçin.", "error");
      return;
    }

    setIsLoading(true);
    setShowLayout(false);
    setRenderedHtml('');
    setLastResponseText('');

    // Smooth scroll to loading card
    setTimeout(() => {
      const loadCard = document.getElementById('loadingSection');
      if (loadCard) {
        loadCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    const sinifNum = parseInt(sinif);
    const kademeText = (sinifNum >= 5 && sinifNum <= 8) ? "Temel Eğitim" : "Ortaöğretim";
    const sinifEkipmanlari = "Etkileşimli Tahta, 8 Adet Tümleşik Bilgisayar, 12 Adet Dizüstü Bilgisayar, 10 Adet MEB-KİT, 3 Adet Mobil Robot Platform Kiti, Simülasyon Platformu, 3B Yazıcı, Zekâ Oyunları Seti";
    const sinifMobilyalari = "Tekerlekli Öğrenci Masaları, Öğrenci Sandalyeleri, Öğrenci Tabureleri, Tekerlekli Puf, Öğretmen Kürsüsü, Robotik Kodlama Masası, Laptop Şarj İstasyonu, Sabit Bilgisayar Masaları, 2 Adet Duvara Sabit Katlanır Masa, 3 Boyutlu Yazıcı Masası ve Dolabı, Magnet Panosu";

    let teknikPromptText = teknik === 'auto' 
      ? "Aktif Öğrenme Tekniği: (Yapay Zeka tarafından kılavuzda yer alan İş Birlikli, Probleme Dayalı, Sorgulamaya Dayalı, Yapılandırmacı, Tasarıma Dayalı, Oyun Temelli, Proje Tabanlı pedagojilerden en uygunu seçilmelidir)" 
      : `Aktif Öğrenme Tekniği (Pedagojik Yaklaşım): ${teknik}`;

    let teknikFormatText = teknik === 'auto' ? "Seçilen Öğrenme Yaklaşımı" : teknik;
        
    let mobilyaPromptText = `Fiziksel Ortam, Mobilya ve Teknoloji: Yapay Zeka, SADECE şu donanımları seçip yerleştirmelidir:\nMobilyalar: ${sinifMobilyalari}\nTeknolojiler: ${sinifEkipmanlari}\nÖNEMLİ: Sınıftaki 2 katlanır masa duvara sabittir. Grup, istasyon çalışmalarında esneklik için mutlaka 'Tekerlekli Öğrenci Masalarını' birleştirerek kullandır.`;

    let yzAracInstruction = yapayZekaAraclari
      ? `KULLANILACAK ARAÇLAR: Öğretmen bu senaryoda SADECE şu yapay zeka veya Web 2.0 araçlarını kullanmak istiyor: "${yapayZekaAraclari}". Lütfen senaryonun tüm adımlarını (özellikle Çevrim İçi Araçlar bölümünü) YALNIZCA bu araçlar üzerine kurgula, kesinlikle farklı bir dijital araç ekleme.`
      : `KULLANILACAK ARAÇLAR: MEB kılavuzlarına ve pedagojik yaklaşıma uygun, güncel ve etkili yapay zeka (AI) ve Web 2.0 araçlarını (örneğin ChatGPT, Canva, Padlet vb. arasından en uygunlarını) sen seçip senaryoya mantıklı bir şekilde entegre et.`;

    let kaynakcaInstruction = `
ÖNEMLİ - KAYNAKÇA YAZIM KURALLARI:
Eklenen Kaynakça bölümü "Yenilikçi Sınıf Kaynakça Yazım Rehberi"ne uygun OLMALIDIR:
- Madde işareti (bullet), tire (-), numaralandırma veya girinti KESİNLİKLE KULLANMA. Düz metin olarak yaz.
- Kaynakları alfabetik sırayla yaz, kategorilere (Kitaplar, Siteler vb.) AYIRMA.
- Her kaynağın sonuna <br><br> ekleyerek aralarında bir satır boşluk bırak.
- Kitaplar için: Yazar Soyadı, A. (Yıl). Kitap adı. Yayınevi.
- MEB Platformları (EBA, MEBİ vb.): Milli Eğitim Bakanlığı. (Yıl). İçeriğin başlığı. Platform Adı. URL
- Çevrim İçi Araçlar (Hazır içerik): Platform Adı. (t.y.). İçeriğin adı. Erişim tarihi 10 Mayıs 2026 URL
- Çevrim İçi Araçlar (Kendi ürettiği içerik): Milli Eğitim Bakanlığı. (Yıl, Gün Ay). YS-İçeriğin adı. Platform Adı. Erişim tarihi 10 Mayıs 2026 URL
- Öğretim Programları: Milli Eğitim Bakanlığı. (2024). [Ders Adı] dersi öğretim programı. Talim ve Terbiye Kurulu Başkanlığı. Erişim tarihi 10 Mayıs 2026 URL
DİKKAT: Kaynakça tablosunun içine sadece düz metin kaynakları yaz. Çevrim İçi Araçlar bölümünde belirttiğiniz araçları kaynakçaya eklemeyi UNUTMAYIN!
`;

    const mufredatKurali = `
ÖNEMLİ MÜFREDAT KURALI (TÜRKİYE YÜZYILI MAARİF MODELİ 2024/2026):
"Ünite/Tema/Öğrenme Alanı" ve "Konu/İçerik Çerçevesi" bölümlerini kesinlikle uydurmayın veya genel geçer şekilde doldurmayın. Öğretmenin girdiği "Ders" (Örn: Matematik, Temel Matematik, Matematik Uygulamaları, Fen Bilimleri, Fizik, Kimya, Biyoloji, Türkçe, Türk Dili ve Edebiyatı, Sosyal Bilgiler, Tarih, T.C. İnkılap Tarihi ve Atatürkçülük, Coğrafya, Felsefe vb.), "Sınıf Seviyesi" ve "Kazanım" bilgilerini analiz edin. 
Bu bilgileri MEB'in güncel Türkiye Yüzyılı Maarif Modeli öğretim programları ile eşleştirerek, tam ve doğru "Öğrenme Alanı/Tema/Ünite" adını ve "Konu/İçerik Çerçevesi"ni tespit edip tablodaki ilgili alanlara yazın.
`;

    const pedagojikKurallar = `
PEDAGOJİK VE METODOLOJİK KURALLAR:
1. Rol Tanımları: Öğrenciler aktif araştırmacı, öğretmen ise rehberdir. Geleneksel düz anlatımı tamamen ortadan kaldırın.
2. 4C Entegrasyonu: Her adımda öğrencilerin İletişim, İş Birliği, Eleştirel Düşünme ve Yaratıcılık becerilerini nasıl sergilediğini açıklayın.
3. Teknolojinin Rolü: Teknolojiyi sadece sunum veya tüketim için değil, esnek öğrenme alanlarına uygun olarak aktif üretim ve analiz (MEB-KİT kodlama, 3B modelleme vb.) için konumlandırın.
`;

    const webAraclariKategorileri = `
KATEGORİLERE GÖRE TAVSİYE EDİLEN YAPAY ZEKA VE WEB 2.0 ARAÇLARI:
- Bilgi Toplama/Araştırma: Perplexity, Google Akademik, EBA
- İş Birliği/Geri Bildirim: Padlet, Mentimeter, Miro
- İçerik Geliştirme/Kodlama: MEB-KİT Simülatörü, Tinkercad, Scratch
- Üretim/Medya Tasarımı: Canva, CapCut, Adobe Express
- Sunum/Etkileşim: Genially, Prezi, Kahoot
`;

    const ekYonergeKurali = `
ÖNEMLİ YÖNERGE KURALI (MEB-KİT, 3B Yazıcı ve Kategori Dışı Araçlar İçin):
Eğer senaryoda "MEB-KİT", "3B Yazıcı" veya yukarıdaki listelerde bulunmayan farklı bir çevrim içi araç kullanılıyorsa, EKLER bölümüne KESİNLİKLE detaylı bir "Uygulama Yönergesi" tablosu ekleyin. Devre bağlantıları, pin yapılandırmaları veya 3D baskı (slicing) ayarlarını adım adım belirtin.
`;

    const selected4CText = selectedSkills.join(', ');

    let roleInstruction = "";
    let formatInstruction = "";

    if (belgeTuru === "etkinlikPlani") {
      roleInstruction = `Sen, Yenilikçi Sınıf Eğitim Atölyesi için MEB müfredat standartlarına tam uyumlu çalışan pedagoji uzmanı bir yapay zeka asistanısın. Görevin, öğretmenin verdiği bilgiler doğrultusunda "Teknoloji Destekli Aktif Öğrenme Etkinlik Planı" hazırlamaktır.`;
      
      formatInstruction = `
Format Kuralı: Çıktını KESİNLİKLE sadece aşağıdaki markdown tablosu formatında ver. Tablonun üstüne veya altına hiçbir açıklama metni, giriş veya çıkış ekleme. Sadece tabloyu yaz.

| Genel Bilgiler | Açıklamalar |
|---|---|
| **Etkinlik ID** | (ETK-01 vb. bir ID ata) |
| **Etkinlik Başlığı** | (Yaratıcı İsim - TAMAMI BÜYÜK HARFLERLE) |
| **Genel Bakış** | (Etkinliğin genel amacı ve özeti) |
| **Etkinlik Süresi** | ${sure} Dakika |
| **Kademe** | ${kademeText} |
| **Sınıf Seviyesi** | ${sinif}. Sınıf |
| **Ders Adı** | ${ders} |
| **Ünite/Tema/Öğrenme Alanı** | (Güncel müfredattan tespit et) |
| **Konu/İçerik Çerçevesi** | (Kazanımla eşleşen tam konu çerçevesi) |
| **Öğrenme Çıktıları ve Süreç Bileşenleri /Kazanımlar** | ${kazanim} |
| **Donanım** | ${sinifEkipmanlari} |
| **Çevrim İçi Araçlar ve İçerikler** | (Öğrenci cihazı yok! Sadece öğretmenin tahtadan veya bilgisayardan açacağı araçlar/simülasyonlar) |
| **Öğretim Materyalleri** | (sınıfta her zaman bulunan standart materyalleri yazma. Sadece bu etkinliğe özel çalışma kâğıdı, makas, yapıştırıcı vb sarf malzemeleri yaz) |
| **Etkinlik Alanı** | (Pedagojik yaklaşıma göre sınıfı nasıl esnettiğinizi belirtin. Hangi öğrenme alanlarını bir arada kullandığınızı ve tekerlekli masaların durumunu belirtin.) |
| **Öğrencilerin Konumu** | Bireysel / Küçük Gruplar / Tüm Sınıf (Hangileri geçerliyse adlarını yaz) |
| **Öğretmenin Rolü** | Lider / Rehber / Gözlemci (Hangileri geçerliyse adlarını yaz) |
| **Hazırlık** | (Etkinlik başlamadan önce öğretmenin ve öğrencilerin yapması gereken ön hazırlıklar) |
| **Uygulama (Süre: ... dk.)** | (Seçilen öğrenme alanlarına - ${selectedZones.join(', ')} - ve aktif öğrenme pedagojisine göre adımlar. Süre toplamı ${sure} dakikaya uymalıdır.) |
| **Etkinlik Sonu (Süre: ... dk.)** | (Etkinliğin tamamlanması, geri bildirimlerin alınması ve sınıf genel incelemesi) |
| **Ölçme ve Değerlendirme** | (Kazanımın alt maddelerini ölçen, rehberden seçilmiş yöntemler) |
| **Kaynakça** | (Rehbere tam uygun kaynakça) |
| **Ekler** | Formlar ve yönergeler en altta sunulmuştur. |

<br>

### EKLER
(Biçimlendirici veya özetleyici formların/yönergelerin TAM İÇERİĞİNİ bu tablonun dışında, KESİNLİKLE ayrı markdown tabloları halinde buraya ekle.)
`;
    } else {
      roleInstruction = `Sen, Yenilikçi Sınıf Eğitim Atölyesi için MEB standartlarına tam uyumlu çalışan pedagoji uzmanı bir yapay zeka asistanısın. Görevin, öğretmenin verdiği bilgiler doğrultusunda "Teknoloji Odaklı Öğrenme Senaryosu (TOÖS)" hazırlamaktır.`;
      
      formatInstruction = `
Format Kuralı: Çıktını KESİNLİKLE sadece aşağıdaki markdown tablosu formatında ver. Tablonun üstüne veya altına hiçbir açıklama metni, giriş veya çıkış ekleme. Sadece tabloyu yaz.

| Genel Bilgiler | Açıklamalar |
|---|---|
| **Senaryo ID** | (Sen belirle) |
| **Senaryo Adı** | (Yaratıcı İsim - TAMAMI BÜYÜK HARFLERLE) |
| **Ders/Kademe/Süre** | ${ders} / ${kademeText} / ${sure} Dakika |

| Planlama | Açıklamalar |
|---|---|
| **Genel Bakış** | (Senaryonun genel açıklaması) |
| **Öğrenme Hedefleri/ Amaçları** | (Maddeler halinde) |
| **İlgili Kazanımlar** | ${kazanim} |
| **Beceriler** | (Hedeflenen 4C becerilerini vurgula: ${selected4CText}) |

| Hazırlık | Açıklamalar |
|---|---|
| **Öğrenme Yaklaşımı** | ${teknikFormatText} |
| **Görevler** | Öğretmen: ... <br><br> Öğrenci: ... |
| **Araçlar/Teknolojiler** | (Öğrenci cihazı yok!) |
| **Öğretim Materyalleri** | (Sınıfta standart bulunanları YAZMA. Sadece etkinliğe özel sarf malzemeleri: Çalışma kâğıdı, makas vb.) |

| Uygulama | Açıklamalar |
|---|---|
| **Öğrenme Etkinlikleri** | (Seçilen öğrenme alanlarına - ${selectedZones.join(', ')} - göre adımlar. Her adıma ayrılan süreyi "dk." cinsinden belirtin ve toplamın ${sure} dakikaya uymasını sağlayın. Her adımın sonuna (İlgili Beceriler: ${selected4CText}) ekle.) |

| Değerlendirme | Açıklamalar |
|---|---|
| **Değerlendirme Yöntemleri / Araçları** | (Rehberden seçilen çeşitli araçlarla değerlendirme tasarla.) |

| Referans | Açıklamalar |
|---|---|
| **İlgili Bağlantılar** | (Web siteleri) |
| **Kaynakça** | (Rehbere tam uygun kaynakça) |
| **Ekler** | Form, Rubrik ve Yönergeler belgenin en alt kısmında sunulmuştur. |

<br>

### EKLER
(Biçimlendirici, özetleyici formların veya yönergelerin TAM İÇERİĞİNİ ana tablonun içine DEĞİL, BURAYA AYRI VE OKUNAKLI NORMAL MARKDOWN TABLOLARI halinde KESİNLİKLE çizin/yazın.)
`;
    }

    const systemPrompt = `${roleInstruction}\nDili akademik, profesyonel, anlaşılır and Türkçe olarak kullan. Anlatımı markdown kullanarak biçimlendir.`;
    const userPrompt = `Ders: ${ders}\nSeçilen Sınıf Seviyesi: ${sinif}. Sınıf\nÖğrenme Kazanımı: ${kazanim}\n\nÖNEMLİ KURAL: Eğer 'Öğrenme Kazanımı' metninin başında sınıf seviyesi rakamı kodlanmışsa ve seçilen sınıf seviyesi (${sinif}) ile çelişiyorsa, KESİNLİKLE kazanım kodunda yazan sınıf seviyesini esas al.\n\n${teknikPromptText}\n${mobilyaPromptText}\n${yzAracInstruction}\n${kaynakcaInstruction}\n${mufredatKurali}\n${pedagojikKurallar}\n${webAraclariKategorileri}\n${ekYonergeKurali}\nSeçilen Öğrenme Alanları: ${selectedZones.join(', ')}\nSeçilen 4C Becerileri: ${selected4CText}\nEtkinlik Süresi: ${sure} dakika\n\nLütfen yukarıdaki yönergelere uyarak planı/senaryoyu yazınız:\n${formatInstruction}`;

    try {
      const response = await callGeminiText(systemPrompt, userPrompt, apiKey);
      setLastResponseText(response);
      
      const altBaslik = belgeTuru === "etkinlikPlani" ? "TEKNOLOJİ DESTEKLİ AKTİF ÖĞRENME ETKİNLİK PLANI" : "TEKNOLOJİ ODAKLI ÖĞRENME SENARYOSU";
      const logoHtml = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
          <div style="line-height: 1; margin-bottom: 10px;">
              <span style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 32pt; font-weight: 800; color: #00b0f0; letter-spacing: -1px;">YENİLİKÇİ</span>
              <span style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 32pt; font-weight: 300; color: #e36c0a; letter-spacing: 1px;"> SINIF</span>
          </div>
          <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 14pt; font-weight: bold; color: #475569;">
              ${altBaslik}
          </div>
      </div>`;

      let formattedText = formatMarkdown(response);
      
      // Inject standard classes into compiled markdown tables using full-depth query selector
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedText;
      
      let isAppendix = false;
      const elements = tempDiv.querySelectorAll('*');
      elements.forEach(el => {
        if (el.tagName === 'H3' && el.innerText.toUpperCase().includes('EKLER')) {
          isAppendix = true;
        }
        if (el.tagName === 'TABLE') {
          if (isAppendix) {
            el.className = "standard-table w-full border border-collapse border-slate-200 my-4 text-sm";
          } else {
            el.className = "template-table w-full border border-collapse border-slate-200 my-4 text-sm";
          }
        }
      });

      setRenderedHtml(logoHtml + tempDiv.innerHTML);
      showToast("Senaryo başarıyla oluşturuldu!", "success");

      // Auto scroll to result panel
      setTimeout(() => {
        const resSec = document.getElementById('resultSection');
        if (resSec) {
          resSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (error) {
      showToast("İçerik oluşturulurken bir hata oluştu: " + error.message, "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Current Scenario to Browser Memory
  const handleSaveToBrowser = () => {
    if (!renderedHtml) return;
    
    const dName = ders || "Bilinmeyen Ders";
    const typeText = belgeTuru === "etkinlikPlani" ? "Etkinlik Planı" : "Öğrenme Senaryosu";
    const shortKazanim = kazanim.length > 30 ? kazanim.substring(0, 30) + "..." : kazanim;
    const title = `${dName} - ${typeText} (${shortKazanim})`;
    const id = Date.now().toString();

    try {
      const updated = [...savedScenarios, { id, title, content: renderedHtml, timestamp: Date.now(), rawMarkdown: lastResponseText }];
      setSavedScenarios(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      showToast("Senaryo tarayıcı hafızasına başarıyla kaydedildi!", "success");
    } catch (e) {
      console.error(e);
      showToast("Kaydetme işlemi başarısız oldu.", "error");
    }
  };

  // Load Saved Scenario
  const handleLoadScenario = (scenario) => {
    setRenderedHtml(scenario.content);
    setLastResponseText(scenario.rawMarkdown || "");
    showToast("Kayıtlı senaryo yüklendi.", "success");
    
    // Auto scroll to results when loaded
    setTimeout(() => {
      const resSec = document.getElementById('resultSection');
      if (resSec) {
        resSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

  // Delete Saved Scenario from list
  const handleDeleteScenario = (id) => {
    const confirmDelete = confirm("Bu kaydı tarayıcınızdan silmek istediğinize emin misiniz?");
    if (!confirmDelete) return;

    try {
      const filtered = savedScenarios.filter(s => s.id !== id);
      setSavedScenarios(filtered);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      showToast("Senaryo silindi.", "success");
    } catch(e) {
      console.error(e);
      showToast("Silme işlemi başarısız.", "error");
    }
  };

  // Word (.docx) File Download
  const handleDownloadWord = async () => {
    if (!renderedHtml) return;
    
    const data = parseGeneratedMarkdown(lastResponseText || "");
    const dName = data.baslik ? data.baslik.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g, '_') : "Etkinlik_Plani";
    const filename = `${dName}.docx`;

    try {
      showToast("Word belgesi hazırlanıyor...", "success");
      await downloadDocx(lastResponseText, renderedHtml, filename);
    } catch (e) {
      console.error(e);
      showToast(e.message, "error");
    }
  };

  // Plain Text Copy (answers only)
  const handleCopyOnlyText = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderedHtml;
    let plainText = "";
    
    const trs = tempDiv.querySelectorAll('tr');
    trs.forEach(tr => {
      const tds = tr.querySelectorAll('td');
      if (tds.length === 2) {
        const text = tds[1].innerText.trim();
        if (text) plainText += text + "\n\n";
      } else if (tds.length === 1) {
        const text = tds[0].innerText.trim();
        if (text) plainText += text + "\n\n";
      }
    });
    
    if (!plainText.trim()) plainText = tempDiv.innerText;

    navigator.clipboard.writeText(plainText.trim()).then(() => {
      showToast("Sadece yazılar (başlıksız) kopyalandı!", "success");
    }).catch(err => {
      console.error(err);
      showToast("Kopyalama başarısız oldu.", "error");
    });
  };

  // Format Copy for pasting to Word
  const handleCopyForWord = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = renderedHtml;
    
    // Apply word styling
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
      table.setAttribute('border', '1');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      table.style.marginBottom = '24px';
      table.style.border = '1px solid #cbd5e1';
      table.style.fontFamily = 'Calibri, Arial, sans-serif';
    });

    const ths = tempDiv.querySelectorAll('th');
    ths.forEach(th => {
      th.style.backgroundColor = '#3b82f6'; 
      th.style.color = 'white';
      th.style.fontWeight = 'bold';
      th.style.padding = '10px 12px';
      th.style.textAlign = 'left';
      th.style.border = '1px solid #2563eb';
      th.style.fontSize = '12pt';
    });

    const trs = tempDiv.querySelectorAll('tr');
    trs.forEach(tr => {
      const parentTable = tr.closest('table');
      const isTemplate = parentTable && parentTable.classList.contains('template-table');

      const tds = tr.querySelectorAll('td');
      tds.forEach((td, index) => {
        td.style.padding = '10px 12px';
        td.style.border = '1px solid #cbd5e1';
        td.style.verticalAlign = 'top';
        td.style.color = '#000000';
        td.style.fontSize = '11pt';
        
        if (isTemplate && index === 0 && tds.length > 1) { 
          td.style.backgroundColor = '#f8fafc';
          td.style.fontWeight = 'bold';
          td.style.width = '25%';
        }
      });
    });

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.appendChild(tempDiv);
    document.body.appendChild(tempContainer);

    const range = document.createRange();
    range.selectNodeContents(tempContainer);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
      document.execCommand('copy');
      showToast("Word formatında kopyalandı! Boş bir Word belgesine (Ctrl+V) yapıştırabilirsiniz.", "success");
    } catch (err) {
      console.error(err);
      showToast("Kopyalama başarısız oldu.", "error");
    }

    selection.removeAllRanges();
    document.body.removeChild(tempContainer);
  };

  // Google Drive: Yükleme
  const handleSaveToDrive = async () => {
    if (!renderedHtml) return;

    setDriveStatus('uploading');
    showToast("Dosya Google Drive'a yükleniyor...", "success");

    try {
      const blob = await generateDocxBlob(lastResponseText, renderedHtml);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        
        const data = parseGeneratedMarkdown(lastResponseText || "");
        const dName = data.baslik ? data.baslik.replace(/[^a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+/g, '_') : "Etkinlik_Plani";
        const filename = `${dName}.docx`;

        try {
          const res = await uploadToGoogleDrive(base64String, filename);
          
          // Save credentials for delete
          const key = getCurrentScenarioKey();
          const uploads = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY) || '{}');
          uploads[key] = {
            fileId: res.fileId,
            deleteToken: res.deleteToken
          };
          localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(uploads));
          
          setDriveStatus('uploaded');
          showToast("Dosya başarıyla Google Drive'a kaydedildi!", "success");
          
          if (res.url) {
            const openConfirm = confirm("Dosya kaydedildi. Google Drive üzerinde görüntülemek ister misiniz?");
            if (openConfirm) window.open(res.url, "_blank");
          }
        } catch (uploadErr) {
          console.error(uploadErr);
          setDriveStatus('idle');
          showToast("Drive yükleme hatası: " + uploadErr.message, "error");
        }
      };
    } catch (e) {
      console.error(e);
      setDriveStatus('idle');
      showToast("Hata: " + e.message, "error");
    }
  };

  // Google Drive: Silme
  const handleDeleteFromDrive = async () => {
    const key = getCurrentScenarioKey();
    const uploads = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY) || '{}');
    const fileData = uploads[key];
    
    if (!fileData || !fileData.fileId || !fileData.deleteToken) {
      showToast("Bu dosyaya ait silme bilgisi bulunamadı.", "error");
      return;
    }

    const confirmDelete = confirm("Bu senaryoyu Google Drive klasöründen silmek istediğinize emin misiniz? (Yalnızca kendi yüklediğiniz dosyaları silebilirsiniz)");
    if (!confirmDelete) return;

    setDriveStatus('deleting');
    showToast("Dosya siliniyor...", "success");

    try {
      await deleteFromGoogleDrive(fileData.fileId, fileData.deleteToken);
      
      // Clear from local storage
      delete uploads[key];
      localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(uploads));
      
      setDriveStatus('idle');
      showToast("Dosya Google Drive'dan silindi (Çöp kutusuna taşındı).", "success");
    } catch (err) {
      console.error(err);
      setDriveStatus('uploaded'); // Revert to uploaded state if delete failed
      showToast("Dosya silinirken hata oluştu: " + err.message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/30 p-4 md:p-8 font-sans">
      {/* Top Header Row spanning full width */}
      <header className="max-w-4xl mx-auto glass-panel rounded-3xl p-6 mb-8 bg-white shadow-md border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            💡 Yenilikçi Sınıf Eğitim Atölyesi
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base mt-1">
            Yapay Zeka Destekli Aktif Öğrenme Planlayıcısı
          </p>
          <div className="mt-2 inline-block bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border border-indigo-200">
            👨‍🏫 Hasan YILMAZ - Matematik Öğretmeni - Ordu Yeğitek Proje Koordinatörü
          </div>
        </div>

        {/* Buttons (Saved Scenarios & API settings) */}
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => setIsSavedOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <FolderOpen className="w-4 h-4 text-indigo-500" />
            <span>Kayıtlı Senaryolar</span>
            {savedScenarios.length > 0 && (
              <span className="bg-indigo-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                {savedScenarios.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
          >
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>API Ayarları</span>
          </button>
        </div>
      </header>

      {/* Unified Vertical Stack Layout */}
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 1. Welcome Panel (Only visible initially) */}
        {!renderedHtml && !isLoading && (
          <section className="glass-panel rounded-3xl p-8 md:p-12 text-center bg-white shadow-xl border border-slate-100 space-y-8">
            <div className="flex justify-center">
              <div className="bg-indigo-50 p-4 rounded-full text-4xl shadow-inner animate-pulse">
                🔮
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                Eğitim Atölyesine Hoş Geldiniz!
              </h3>
              <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
                Aşağıdaki form aracılığıyla ders bilgilerini, kazanımları ve öğrenme alanlarını girerek yapay zeka destekli, Maarif Model uyumlu etkinlik planınızı veya öğrenme senaryonuzu anında tasarlayabilirsiniz.
              </p>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto pt-6 border-t border-slate-100">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="text-xs font-extrabold text-indigo-600 mb-1">ADIM 1</div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2">API Ayarını Yapın</h4>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  Sağ üstteki "API Ayarları" menüsünden ücretsiz aldığınız Gemini API anahtarınızı tanımlayın.
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="text-xs font-extrabold text-indigo-600 mb-1">ADIM 2</div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2">Bilgileri Doldurun</h4>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  Ders adı, süre, sınıf seviyesi, kazanım bilgileri ile öğrenme alanlarını ve hedeflenen 4C becerilerini seçin.
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="text-xs font-extrabold text-indigo-600 mb-1">ADIM 3</div>
                <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2">Senaryo Üretin</h4>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  En alttaki "Senaryo/Plan Metnini Oluştur" butonuna basarak yapay zekanın pedagojik planı çizmesini izleyin!
                </p>
              </div>
            </div>

            {/* Features badges */}
            <div className="pt-4 flex flex-wrap justify-center gap-3 text-xs md:text-sm font-bold text-slate-600">
              <span className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">📐 2D Sınıf Çizimi</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">💾 Yerel Arşivleme</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">▲ Drive Entegrasyonu</span>
              <span className="bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">📄 Word Şablon Doldurucu</span>
            </div>
          </section>
        )}

        {/* 2. Input Form (Always visible) */}
        <section>
          <InputForm
            belgeTuru={belgeTuru}
            setBelgeTuru={setBelgeTuru}
            ders={ders}
            setDers={setDers}
            sinif={sinif}
            setSinif={setSinif}
            teknik={teknik}
            setTeknik={setTeknik}
            sure={sure}
            setSure={setSure}
            yapayZekaAraclari={yapayZekaAraclari}
            setYapayZekaAraclari={setYapayZekaAraclari}
            kazanim={kazanim}
            setKazanim={setKazanim}
            selectedZones={selectedZones}
            setSelectedZones={setSelectedZones}
            selectedSkills={selectedSkills}
            setSelectedSkills={setSelectedSkills}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>

        {/* 3. Loading Card (Appears under form during generation) */}
        {isLoading && (
          <section id="loadingSection" className="glass-panel rounded-3xl p-16 text-center space-y-6 bg-white shadow-xl border border-slate-100 flex flex-col items-center justify-center">
            <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin" />
            <div>
              <h3 className="text-xl font-bold text-slate-800">Senaryo Planı Hazırlanıyor...</h3>
              <p className="text-sm text-slate-500 mt-2">
                Yapay zeka pedagojik rehberlere ve Türkiye Yüzyılı Maarif Modeli müfredatına uygun planı tasarlıyor. Bu işlem 1 dakikaya kadar sürebilir.
              </p>
            </div>
          </section>
        )}

        {/* 4. Generated Output (ResultPanel + FloorPlanCanvas, below the form) */}
        {renderedHtml && !isLoading && (
          <div className="space-y-8">
            <section id="resultSection">
              <ResultPanel
                renderedHtml={renderedHtml}
                onSaveToBrowser={handleSaveToBrowser}
                onCopyOnlyText={handleCopyOnlyText}
                onDownloadWord={handleDownloadWord}
                onCopyForWord={handleCopyForWord}
                onSaveToDrive={handleSaveToDrive}
                onDeleteFromDrive={handleDeleteFromDrive}
                driveStatus={driveStatus}
                onDrawLayout={handleDrawLayout}
              />
            </section>
            {showLayout && <FloorPlanCanvas selectedZones={selectedZones} />}
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSave={handleSaveApiKey}
      />

      <SavedScenariosModal
        isOpen={isSavedOpen}
        onClose={() => setIsSavedOpen(false)}
        scenarios={savedScenarios}
        onLoad={handleLoadScenario}
        onDelete={handleDeleteScenario}
      />

      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl text-white font-bold shadow-2xl z-50 transition-all duration-300 transform flex items-center gap-3 animate-bounce bg-opacity-95 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
