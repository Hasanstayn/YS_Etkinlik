// src/utils/markdownParser.js

export function formatMarkdown(text) {
    if (!text) return "";
    
    let html = text + "\n"; 
    
    // Parse tables
    html = html.replace(/(\|.*\|)\n(\|[-:| ]+\|)\n((\|.*\|(\n|$))+)/g, function(match, headerLine, separatorLine, bodyLines) {
        const headers = headerLine.split('|').filter(c => c.trim() !== '').map(c => `<th>${c.trim()}</th>`).join('');
        const rows = bodyLines.trim().split('\n').map(row => {
            const cells = row.split('|').filter((c, i, arr) => !(i===0 && c.trim()==='') && !(i===arr.length-1 && c.trim()==='')).map(c => `<td>${c.trim()}</td>`).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
        return `<div class="overflow-x-auto my-4"><table class="w-full text-sm border-collapse"><thead><tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
    });
    
    // Format bold, italics, lists, links, paragraphs, and line breaks
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>')
               .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
               .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
               .replace(/<\/ul>\n<ul>/g, '\n')
               .replace(/\n\n/g, '<p class="my-3 text-slate-700 leading-relaxed"></p>')
               .replace(/\n/g, '<br>');
               
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 font-medium transition-colors underline">$1</a>');
    html = html.replace(/(<br>)*<ul>/g, '<ul class="list-disc pl-5 my-2 space-y-1">').replace(/<\/ul>(<br>)*/g, '</ul>');
    
    return html;
}

export function parseGeneratedMarkdown(markdown) {
    const data = {
        etkinlikId: "",
        baslik: "",
        genelBakis: "",
        sure: "",
        kademe: "",
        sinifSeviyesi: "",
        dersAdi: "",
        unite: "",
        konu: "",
        kazanimlar: "",
        donanim: "",
        cevrimIci: "",
        ogretimMateryalleri: "",
        etkinlikAlani: "",
        ogrencilerinKonumu: "",
        ogretmeninRolü: "",
        hazirlik: "",
        uygulama: "",
        etkinlikSonu: "",
        degerlendirme: "",
        kaynakca: "",
        ekler: ""
    };
    
    const eklerMatch = markdown.match(/###\s*EKLER[\s\S]+/i);
    if (eklerMatch) {
        data.ekler = eklerMatch[0].replace(/###\s*EKLER/i, "").trim();
    }
    
    const lines = markdown.split('\n');
    let currentTableKey = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('|')) continue;
        if (line.includes('|---|') || line.includes('| :---') || line.includes('|:---|')) continue;
        
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length === 2) {
            const key = cells[0].replace(/\*\*/g, '').trim();
            const val = cells[1];
            
            if (key.includes("Etkinlik ID") || key.includes("Senaryo ID")) {
                data.etkinlikId = val;
            } else if (key.includes("Etkinlik Başlığı") || key.includes("Senaryo Adı")) {
                data.baslik = val;
            } else if (key.includes("Genel Bakış")) {
                data.genelBakis = val;
            } else if (key.includes("Etkinlik Süresi")) {
                data.sure = val;
            } else if (key.includes("Ders/Kademe/Süre")) {
                const parts = val.split('/').map(p => p.trim());
                if (parts.length >= 3) {
                    data.dersAdi = parts[0];
                    data.kademe = parts[1];
                    data.sure = parts[2];
                }
            } else if (key.includes("Kademe")) {
                data.kademe = val;
            } else if (key.includes("Sınıf Seviyesi")) {
                data.sinifSeviyesi = val;
            } else if (key.includes("Ders Adı")) {
                data.dersAdi = val;
            } else if (key.includes("Ünite/Tema/Öğrenme Alanı")) {
                data.unite = val;
            } else if (key.includes("Konu/İçerik Çerçevesi")) {
                data.konu = val;
            } else if (key.includes("Öğrenme Çıktıları ve Süreç Bileşenleri /Kazanımlar") || key.includes("İlgili Kazanımlar") || key.includes("Kazanımlar")) {
                data.kazanimlar = val;
            } else if (key.includes("Öğrenme Hedefleri/ Amaçları") || key.includes("Öğrenme Hedefleri")) {
                data.kazanimlar = (val + "\n\n" + data.kazanimlar).trim();
            } else if (key.includes("Donanım")) {
                data.donanim = val;
            } else if (key.includes("Çevrim İçi Araçlar ve İçerikler") || key.includes("Araçlar/Teknolojiler")) {
                data.cevrimIci = val;
            } else if (key.includes("Öğretim Materyalleri")) {
                data.ogretimMateryalleri = val;
            } else if (key.includes("Etkinlik Alanı") || key.includes("Öğrenme Yaklaşımı")) {
                data.etkinlikAlani = val;
            } else if (key.includes("Öğrencilerin Konumu")) {
                data.ogrencilerinKonumu = val;
            } else if (key.includes("Öğretmenin Rolü")) {
                data.ogretmeninRolü = val;
            } else if (key.includes("Hazırlık")) {
                data.hazirlik = val;
            } else if (key.includes("Görevler")) {
                data.hazirlik = (data.hazirlik ? data.hazirlik + "\n\n" : "") + val;
            } else if (key.startsWith("Uygulama") || key.startsWith("Öğrenme Etkinlikleri")) {
                data.uygulama = val;
            } else if (key.startsWith("Etkinlik Sonu")) {
                data.etkinlikSonu = val;
            } else if (key.includes("Beceriler")) {
                data.kazanimlar += "\n\nHedeflenen Beceriler: " + val;
            }
        } else if (cells.length === 1) {
            const val = cells[0];
            if (val.includes("Ölçme ve Değerlendirme") || val.includes("Değerlendirme")) {
                currentTableKey = "degerlendirme";
            } else if (val.includes("Kaynakça") || val.includes("Referans")) {
                currentTableKey = "kaynakca";
            } else if (val.includes("Ekler")) {
                currentTableKey = "ekler_header";
            } else {
                if (currentTableKey === "degerlendirme") {
                    data.degerlendirme += (data.degerlendirme ? "\n" : "") + val;
                } else if (currentTableKey === "kaynakca") {
                    data.kaynakca += (data.kaynakca ? "\n" : "") + val;
                }
            }
        }
    }
    
    return data;
}
