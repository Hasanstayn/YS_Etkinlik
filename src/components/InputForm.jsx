// src/components/InputForm.jsx
import React from 'react';

const FCL_ZONES = [
  { name: 'Araştırma', color: '#EF4444', emoji: '🔍' },
  { name: 'İş Birliği', color: '#F97316', emoji: '🤝' },
  { name: 'Geliştirme', color: '#EAB308', emoji: '💡' },
  { name: 'Üretim', color: '#22C55E', emoji: '🛠️' },
  { name: 'Etkileşim', color: '#3B82F6', emoji: '💬' },
  { name: 'Sunum', color: '#A855F7', emoji: '📢' }
];

const SKILLS_4C = [
  { name: 'İletişim', color: 'bg-indigo-500', emoji: '🗣️' },
  { name: 'İş Birliği', color: 'bg-teal-500', emoji: '🤝' },
  { name: 'Eleştirel Düşünme', color: 'bg-rose-500', emoji: '🤔' },
  { name: 'Yaratıcılık', color: 'bg-amber-500', emoji: '✨' }
];

export default function InputForm({
  belgeTuru, setBelgeTuru,
  ders, setDers,
  sinif, setSinif,
  teknik, setTeknik,
  sure, setSure,
  yapayZekaAraclari, setYapayZekaAraclari,
  kazanim, setKazanim,
  selectedZones, setSelectedZones,
  selectedSkills, setSelectedSkills,
  onSubmit, isLoading
}) {

  const toggleZone = (zoneName) => {
    if (selectedZones.includes(zoneName)) {
      setSelectedZones(selectedZones.filter(z => z !== zoneName));
    } else {
      setSelectedZones([...selectedZones, zoneName]);
    }
  };

  const toggleSkill = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 mb-8 bg-white shadow-xl border border-slate-100">
      {/* 1. Bölüm: Format Seçimi */}
      <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4">1. Belge Türünü Seçin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setBelgeTuru("etkinlikPlani")}
            className={`cursor-pointer rounded-xl border-2 transition-all ${belgeTuru === "etkinlikPlani" ? "border-blue-500 bg-blue-50/30" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="p-4 relative h-full">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800 text-sm md:text-base">Teknoloji Destekli Aktif Öğrenme Etkinlik Planı</span>
                {belgeTuru === "etkinlikPlani" && <span className="text-blue-500">✅</span>}
              </div>
              <p className="text-xs text-slate-500 leading-snug">Özel 'Etkinlik Planı Şablonuna' göre birebir doldurulmuş plan.</p>
            </div>
          </div>

          <div 
            onClick={() => setBelgeTuru("ogrenmeSenaryosu")}
            className={`cursor-pointer rounded-xl border-2 transition-all ${belgeTuru === "ogrenmeSenaryosu" ? "border-blue-500 bg-blue-50/30" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="p-4 relative h-full">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800 text-sm md:text-base">Teknoloji Odaklı Öğrenme Senaryosu (TOÖS)</span>
                {belgeTuru === "ogrenmeSenaryosu" && <span className="text-blue-500">✅</span>}
              </div>
              <p className="text-xs text-slate-500 leading-snug">MEB 'TOÖS Şablonuna' göre 4C becerilerini merkeze alan senaryo.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bölüm: Genel Bilgiler */}
      <div className="mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-800">2. Ders ve Pedagojik Çerçeve</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Ders Adı</label>
            <input 
              type="text" 
              value={ders}
              onChange={(e) => setDers(e.target.value)}
              placeholder="Örn: Sosyal Bilgiler, Fen Bilimleri" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Sınıf Seviyesi</label>
            <select 
              value={sinif}
              onChange={(e) => setSinif(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 text-sm"
            >
              {[5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <option key={n} value={n.toString()}>{n}. Sınıf</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Aktif Öğrenme Tekniği (MEB Kılavuzu)</label>
            <select 
              value={teknik}
              onChange={(e) => setTeknik(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 text-sm"
            >
              <option value="auto" className="font-bold text-blue-600">✨ Yapay Zeka Önersin (Kılavuza Uygun)</option>
              <option value="İş Birlikli Öğrenme">İş Birlikli Öğrenme</option>
              <option value="Probleme Dayalı Öğrenme">Probleme Dayalı Öğrenme</option>
              <option value="Sorgulamaya Dayalı Öğrenme">Sorgulamaya Dayalı Öğrenme</option>
              <option value="Yapılandırmacı Öğrenme">Yapılandırmacı Öğrenme</option>
              <option value="Tasarıma Dayalı Öğrenme">Tasarıma Dayalı Öğrenme</option>
              <option value="Oyun Temelli Öğrenme">Oyun Temelli Öğrenme</option>
              <option value="Proje Tabanlı Öğrenme">Proje Tabanlı Öğrenme</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Etkinlik Süresi (En fazla 80 Dk)</label>
            <input 
              type="number" 
              value={sure}
              onChange={(e) => setSure(e.target.value)}
              placeholder="Örn: 40" 
              min="1" 
              max="80" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 font-bold text-indigo-700 text-sm"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700 ml-1">YZ / Web 2.0 Araçları (İsteğe Bağlı)</label>
            <input 
              type="text" 
              value={yapayZekaAraclari}
              onChange={(e) => setYapayZekaAraclari(e.target.value)}
              placeholder="Örn: ChatGPT, Canva (Boşsa YZ önerir)" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Öğrenme Kazanımı / Konu</label>
          <textarea 
            value={kazanim}
            onChange={(e) => setKazanim(e.target.value)}
            rows={2} 
            placeholder="Örn: MAT.5.2.1. Eşitliğin korunumuna ve işlem özelliklerine yönelik çıkarım yapabilme..." 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none bg-slate-50 text-sm"
          />
        </div>
      </div>

      {/* 3. Bölüm: Öğrenme Alanları ve Beceriler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Öğrenme Alanları */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            📍 Esnek Öğrenme Alanları 
          </h2>
          <p class="text-xs text-slate-500 mb-4">Planınızda kullanmak istediğiniz öğrenme alanlarını seçin.</p>
          
          <div className="grid grid-cols-3 gap-3">
            {FCL_ZONES.map((zone) => {
              const isActive = selectedZones.includes(zone.name);
              return (
                <button
                  key={zone.name}
                  type="button"
                  onClick={() => toggleZone(zone.name)}
                  style={{ backgroundColor: zone.color }}
                  className={`p-2 rounded-2xl text-white font-bold text-[11px] md:text-xs flex flex-col items-center justify-center gap-1 h-20 transition-all ${
                    isActive ? 'opacity-100 scale-[1.03] ring-4 ring-white ring-inset shadow-lg' : 'opacity-40 hover:opacity-60'
                  }`}
                >
                  <span className="text-lg">{zone.emoji}</span>
                  <span>{zone.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4C Becerileri */}
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
          <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            🎯 4C Becerileri 
          </h2>
          <p className="text-xs text-slate-500 mb-4">Senaryoya/Plana entegre edilecek temel becerileri seçin.</p>
          
          <div className="grid grid-cols-2 gap-3">
            {SKILLS_4C.map((skill) => {
              const isActive = selectedSkills.includes(skill.name);
              return (
                <button
                  key={skill.name}
                  type="button"
                  onClick={() => toggleSkill(skill.name)}
                  className={`p-2 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 h-16 transition-all ${
                    isActive 
                      ? `${skill.color} text-white opacity-100 scale-[1.03] shadow-md` 
                      : 'bg-slate-200 text-slate-500 opacity-60 hover:opacity-75'
                  }`}
                >
                  <span className="text-lg">{skill.emoji}</span>
                  <span className="text-xs md:text-sm leading-tight text-center">
                    {skill.name.includes(' ') ? <>{skill.name.split(' ')[0]}<br/>{skill.name.split(' ')[1]}</> : skill.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button 
        onClick={onSubmit} 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-80 disabled:cursor-not-allowed"
      >
        <span>{isLoading ? "Senaryo Planı Üretiliyor..." : "Senaryo / Plan Metnini Oluştur"}</span>
        {isLoading && (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
