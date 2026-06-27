// src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, apiKey, onSave }) {
  const [keyValue, setKeyValue] = useState(apiKey);

  useEffect(() => {
    setKeyValue(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keyValue.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            ⚙️ Gemini API Ayarları
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 bg-white">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">Gemini API Anahtarı (API Key)</label>
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 font-mono text-sm"
            />
            <p className="text-xs text-slate-500 leading-normal">
              API anahtarınız <strong>sadece tarayıcınızın yerel hafızasında</strong> (localStorage) saklanır, hiçbir sunucuya veya dış servise gönderilmez. Google AI Studio üzerinden ücretsiz bir API anahtarı alabilirsiniz.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors shadow-md shadow-blue-500/20"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
