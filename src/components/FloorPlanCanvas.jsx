// src/components/FloorPlanCanvas.jsx
import React, { useRef, useEffect, useState } from 'react';
import { RotateCw, Trash2, PlusCircle, RefreshCw, Download, Layers } from 'lucide-react';

export default function FloorPlanCanvas({ selectedZones }) {
  const canvasRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const dragRef = useRef(null);

  // Constants for Modular Desk geometry
  const SHORT_BASE = 32;
  const LONG_BASE = 64;
  const HEIGHT = 28; // ~32 * sin(60)

  // Initialize layout based on selectedZones
  const resetLayout = () => {
    const defaultItems = [];
    let idCounter = 1;
    const nextId = (prefix) => `${prefix}_${idCounter++}_${Date.now()}`;

    // Always place Teacher Desk
    defaultItems.push({
      id: nextId('teacher'),
      type: 'teacherDesk',
      x: 80,
      y: 75,
      rotation: 0,
      label: 'Öğretmen Kürsüsü'
    });

    // Always place 3D Printer
    defaultItems.push({
      id: nextId('printer'),
      type: 'printerTable',
      x: 720,
      y: 100,
      rotation: 0
    });

    // Generate zone-specific seating arrangements
    const activeZones = selectedZones.length > 0 ? selectedZones : ['Araştırma', 'İş Birliği'];

    activeZones.forEach((zone) => {
      if (zone === 'İş Birliği') {
        // Place a Hexagonal Group (6-person) in the center-left area
        const cx = 350;
        const cy = 280;
        const R = 30; // radius offset for centers
        for (let i = 0; i < 6; i++) {
          const angle = i * 60;
          const rad = (angle * Math.PI) / 180;
          defaultItems.push({
            id: nextId('desk_hex'),
            type: 'desk',
            x: cx + R * Math.cos(rad),
            y: cy + R * Math.sin(rad),
            rotation: angle + 90
          });
        }

        // Place a Triangular Group (3-person) in the bottom-left area
        const tx = 200;
        const ty = 460;
        const rT = 18;
        for (let i = 0; i < 3; i++) {
          const angle = i * 120 - 30;
          const rad = (angle * Math.PI) / 180;
          defaultItems.push({
            id: nextId('desk_tri'),
            type: 'desk',
            x: tx + rT * Math.cos(rad),
            y: ty + rT * Math.sin(rad),
            rotation: i * 120 + 30
          });
        }
      }

      if (zone === 'Araştırma') {
        // Place Wall Computer Stations on the top wall
        defaultItems.push({ id: nextId('pc'), type: 'pcDesk', x: 280, y: 70, rotation: 0 });
        defaultItems.push({ id: nextId('pc'), type: 'pcDesk', x: 360, y: 70, rotation: 0 });
        defaultItems.push({ id: nextId('pc'), type: 'pcDesk', x: 440, y: 70, rotation: 0 });
      }

      if (zone === 'Geliştirme') {
        // Place a Double Group (2-person) in the center-right area
        const cx = 580;
        const cy = 250;
        defaultItems.push({ id: nextId('desk_double'), type: 'desk', x: cx, y: cy - 14, rotation: 180 });
        defaultItems.push({ id: nextId('desk_double'), type: 'desk', x: cx, y: cy + 14, rotation: 0 });

        // Add some colorful Pufe
        defaultItems.push({ id: nextId('pouf'), type: 'pouf', x: 530, y: 220, rotation: 0, color: '#65a30d' });
        defaultItems.push({ id: nextId('pouf'), type: 'pouf', x: 630, y: 220, rotation: 0, color: '#334155' });
        defaultItems.push({ id: nextId('pouf'), type: 'pouf', x: 530, y: 280, rotation: 0, color: '#0284c7' });
        defaultItems.push({ id: nextId('pouf'), type: 'pouf', x: 630, y: 280, rotation: 0, color: '#ea580c' });
      }

      if (zone === 'Sunum' || zone === 'Etkileşim') {
        // Place modular desks in a semi-circular traditional layout at the bottom right
        const cx = 700;
        const cy = 440;
        
        // 4 desks in a square-like meeting arrangement
        defaultItems.push({ id: nextId('desk_sunum'), type: 'desk', x: cx - 32, y: cy - 15, rotation: 270 });
        defaultItems.push({ id: nextId('desk_sunum'), type: 'desk', x: cx + 32, y: cy - 15, rotation: 90 });
        defaultItems.push({ id: nextId('desk_sunum'), type: 'desk', x: cx - 32, y: cy + 15, rotation: 270 });
        defaultItems.push({ id: nextId('desk_sunum'), type: 'desk', x: cx + 32, y: cy + 15, rotation: 90 });
      }
    });

    // Make sure we have at least some basic desks if array is too empty
    if (defaultItems.filter(item => item.type === 'desk').length === 0) {
      // 2-person double desk in center
      defaultItems.push({ id: nextId('desk'), type: 'desk', x: 450, y: 300, rotation: 0 });
      defaultItems.push({ id: nextId('desk'), type: 'desk', x: 450, y: 272, rotation: 180 });
    }

    setItems(defaultItems);
    setSelectedId(null);
  };

  // Reset layout whenever selectedZones changes
  useEffect(() => {
    resetLayout();
  }, [selectedZones]);

  // Drawing Function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Helpers
    const drawRect = (ctx, x, y, width, height, bgColor, label, borderColor) => {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, 6);
      } else {
        ctx.rect(x, y, width, height);
      }
      ctx.fill();
      ctx.strokeStyle = borderColor || '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (label) {
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + width / 2, y + height / 2 + 3);
      }
    };

    const drawChair = (ctx, cx, cy, color = '#f97316', border = '#ea580c') => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
    };

    // Draw Room Elements
    // Teacher board
    drawRect(ctx, w / 2 - 120, 5, 240, 10, '#1e293b', '', '#000000');
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ETKİLEŞİMLİ TAHTA', w / 2, 13);

    // Draw Zone Overlays (subtle background circles)
    const regions = [
      { x: 200, y: 160, name: 'Araştırma', color: '#ef4444' },
      { x: 500, y: 160, name: 'Etkileşim', color: '#3b82f6' },
      { x: 750, y: 180, name: 'Sunum', color: '#a855f7' },
      { x: 200, y: 440, name: 'İş Birliği', color: '#f97316' },
      { x: 500, y: 440, name: 'Geliştirme', color: '#eab308' },
      { x: 750, y: 440, name: 'Üretim', color: '#22c55e' }
    ];

    regions.forEach((r) => {
      if (selectedZones.includes(r.name)) {
        ctx.fillStyle = r.color;
        ctx.globalAlpha = 0.06;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = r.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(r.name.toUpperCase(), r.x, r.y - 120);
      }
    });

    // Draw all items
    items.forEach((item) => {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate((item.rotation * Math.PI) / 180);

      const isSelected = item.id === selectedId;

      if (item.type === 'desk') {
        // Draw trapezoid table
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const yOffset = -HEIGHT / 2;
        ctx.moveTo(-LONG_BASE / 2, yOffset + HEIGHT);
        ctx.lineTo(LONG_BASE / 2, yOffset + HEIGHT);
        ctx.lineTo(SHORT_BASE / 2, yOffset);
        ctx.lineTo(-SHORT_BASE / 2, yOffset);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw orange chair at the long base side
        drawChair(ctx, 0, yOffset + HEIGHT + 12, '#ea580c', '#c2410c');
      } 
      else if (item.type === 'pcDesk') {
        // PC Desk
        drawRect(ctx, -30, -20, 60, 40, '#f1f5f9', '', '#94a3b8');
        // Screen
        drawRect(ctx, -20, -15, 40, 8, '#0f172a');
        // Keyboard
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-15, 0, 30, 8);
        // Chair
        drawChair(ctx, 0, 32, '#facc15', '#ca8a04');
      } 
      else if (item.type === 'pouf') {
        // Square Pouf
        const color = item.color || '#65a30d';
        ctx.fillStyle = color;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-14, -14, 28, 28, 6);
        } else {
          ctx.rect(-14, -14, 28, 28);
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(14, 0);
        ctx.stroke();
      } 
      else if (item.type === 'teacherDesk') {
        // Teacher Desk
        drawRect(ctx, -40, -20, 80, 40, '#f8fafc', 'Öğretmen', '#cbd5e1');
        drawChair(ctx, 0, 32, '#475569', '#334155');
      } 
      else if (item.type === 'printerTable') {
        // 3D Printer Table
        drawRect(ctx, -50, -30, 100, 60, '#f1f5f9', '', '#94a3b8');
        // Filament Spool
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(-30, -5, 12, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(-30, -5, 5, 0, Math.PI*2);
        ctx.fill();
        // Printer Unit
        drawRect(ctx, -10, -20, 45, 40, '#0f172a', '3B YAZICI', '#1e293b');
        // Yellow Chair
        drawChair(ctx, 0, 45, '#facc15', '#ca8a04');
      }

      // Draw Selected Highlight
      if (isSelected && isEditing) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Rotation handle dot
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, -45, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

  }, [items, selectedId, isEditing]);

  // Drag & Click Handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch events
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleStart = (e) => {
    if (!isEditing) return;
    const { x, y } = getCanvasCoords(e);

    // Find clicked item
    let foundItem = null;
    // Search in reverse order to click top items first
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const dist = Math.hypot(x - item.x, y - item.y);
      const clickRadius = item.type === 'printerTable' ? 45 : 30;
      if (dist < clickRadius) {
        foundItem = item;
        break;
      }
    }

    if (foundItem) {
      setSelectedId(foundItem.id);
      dragRef.current = {
        id: foundItem.id,
        offsetX: x - foundItem.x,
        offsetY: y - foundItem.y
      };
      // Prevent scrolling when dragging on touch devices
      if (e.cancelable) e.preventDefault();
    } else {
      setSelectedId(null);
    }
  };

  const handleMove = (e) => {
    if (!isEditing || !dragRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const { id, offsetX, offsetY } = dragRef.current;

    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          // Clamp inside canvas boundaries
          const nx = Math.max(30, Math.min(canvasRef.current.width - 30, x - offsetX));
          const ny = Math.max(30, Math.min(canvasRef.current.height - 30, y - offsetY));
          return { ...item, x: nx, y: ny };
        }
        return item;
      })
    );
  };

  const handleEnd = () => {
    dragRef.current = null;
  };

  // Add layout manipulation tools
  const handleRotate = () => {
    if (!selectedId) return;
    setItems(prev =>
      prev.map(item => {
        if (item.id === selectedId) {
          // Desks rotate by 60 degrees to snap configurations, others by 45 degrees
          const step = item.type === 'desk' ? 60 : 45;
          return { ...item, rotation: (item.rotation + step) % 360 };
        }
        return item;
      })
    );
  };

  const handleDelete = () => {
    if (!selectedId) return;
    // Don't delete teacher desk or printer table easily unless intended
    const item = items.find(i => i.id === selectedId);
    if (item && (item.type === 'teacherDesk' || item.type === 'printerTable')) {
      const confirmDelete = confirm(`${item.label || 'Sabit İstasyon'} silinsin mi?`);
      if (!confirmDelete) return;
    }
    setItems(prev => prev.filter(i => i.id !== selectedId));
    setSelectedId(null);
  };

  const handleAddItem = (type) => {
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 450;
    const cy = canvas ? canvas.height / 2 : 300;
    const id = `${type}_${Date.now()}`;
    
    let newItem = { id, type, x: cx, y: cy, rotation: 0 };
    if (type === 'teacherDesk') {
      newItem.label = 'Öğretmen';
    }

    setItems(prev => [...prev, newItem]);
    setSelectedId(id);
  };

  // Add group configurations directly
  const handleAddGroup = (groupType) => {
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 450;
    const cy = canvas ? canvas.height / 2 : 300;
    const newGroupItems = [];
    const timestamp = Date.now();

    if (groupType === 'hex') {
      // 6 modular desks in a hexagon
      const R = 30;
      for (let i = 0; i < 6; i++) {
        const angle = i * 60;
        const rad = (angle * Math.PI) / 180;
        newGroupItems.push({
          id: `desk_hex_${timestamp}_${i}`,
          type: 'desk',
          x: cx + R * Math.cos(rad),
          y: cy + R * Math.sin(rad),
          rotation: angle + 90
        });
      }
    } else if (groupType === 'tri') {
      // 3 modular desks in a triangle
      const R = 18;
      for (let i = 0; i < 3; i++) {
        const angle = i * 120 - 30;
        const rad = (angle * Math.PI) / 180;
        newGroupItems.push({
          id: `desk_tri_${timestamp}_${i}`,
          type: 'desk',
          x: cx + R * Math.cos(rad),
          y: cy + R * Math.sin(rad),
          rotation: i * 120 + 30
        });
      }
    } else if (groupType === 'double') {
      // 2 modular desks facing each other (rectangle block)
      newGroupItems.push({ id: `desk_double_${timestamp}_0`, type: 'desk', x: cx, y: cy - 14, rotation: 180 });
      newGroupItems.push({ id: `desk_double_${timestamp}_1`, type: 'desk', x: cx, y: cy + 14, rotation: 0 });
    }

    setItems(prev => [...prev, ...newGroupItems]);
    if (newGroupItems.length > 0) {
      setSelectedId(newGroupItems[0].id);
    }
  };

  // Download layout as PNG
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Temp canvas to draw layout title
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height + 60;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill background
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw Title Header
    tempCtx.fillStyle = '#1e293b';
    tempCtx.font = 'bold 20px sans-serif';
    tempCtx.fillText('YENİLİKÇİ SINIF - 2D YERLEŞİM PLANI', 40, 40);

    // Copy original canvas contents
    tempCtx.drawImage(canvas, 0, 60);

    const url = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Yenilikci_Sinif_Yerlesim_Plani.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="layoutSection" className="glass-panel rounded-3xl p-6 md:p-10 border-t-8 border-indigo-500 bg-white shadow-lg space-y-6 mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">📐 Sınıf Yerleşim Planı (2D)</h3>
          <p className="text-xs text-slate-500 mt-1">
            Masalar birleşebilir modüler yapıdadır. 2'li birleştirildiğinde dikdörtgen, 3'lüde üçgen ve 6'lıda hexagon küme oluşturur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
              isEditing 
                ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-100' 
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isEditing ? 'Düzenleme Modundan Çık' : 'Tasarımı Düzenle (Editör)'}</span>
          </button>
          
          <button
            onClick={handleDownloadPNG}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all"
            title="Şemayı Resim Olarak İndir"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Controls Bar */}
      {isEditing && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-fade-in">
          {/* Main Manipulation Tools */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seçili Eleman:</span>
              {selectedId ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleRotate}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-bold transition-all"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Döndür</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sil</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Ekranda bir elemana tıklayıp seçin.</span>
              )}
            </div>
            
            <button
              onClick={resetLayout}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300 shadow-inner"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tasarımı Sıfırla</span>
            </button>
          </div>

          {/* Add Elements Panel */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eleman Ekle:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAddItem('desk')}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Tekli Modüler Masa</span>
              </button>
              <button
                onClick={() => handleAddItem('pouf')}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-green-500" />
                <span>Puf Koltuk</span>
              </button>
              <button
                onClick={() => handleAddItem('pcDesk')}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-yellow-500" />
                <span>Bilgisayar İstasyonu</span>
              </button>
              <button
                onClick={() => handleAddItem('teacherDesk')}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Öğretmen Masası</span>
              </button>
            </div>
          </div>

          {/* Preset Group Structures */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hazır Küme Ekle (Birleştirilmiş Masalar):</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAddGroup('double')}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-semibold text-indigo-800 shadow-sm transition-all"
              >
                <span>👥 İkili Masa Kümesi</span>
              </button>
              <button
                onClick={() => handleAddGroup('tri')}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-semibold text-indigo-800 shadow-sm transition-all"
              >
                <span>🔺 Üçlü Masa Kümesi</span>
              </button>
              <button
                onClick={() => handleAddGroup('hex')}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-semibold text-indigo-800 shadow-sm transition-all"
              >
                <span>🛑 Altılı Takım Kümesi (Hexagon)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 relative select-none">
        <canvas
          ref={canvasRef}
          id="floorPlan"
          width="900"
          height="600"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className={`mx-auto block max-w-full rounded-xl shadow-md border bg-white ${
            isEditing ? 'cursor-grab border-blue-400 shadow-lg' : 'border-slate-300'
          }`}
        />
        {isEditing && (
          <div className="absolute top-6 left-6 bg-blue-600/90 text-white text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-sm pointer-events-none">
            Editör Modu: Elemanları sürükleyip bırakabilirsiniz
          </div>
        )}
      </div>
    </div>
  );
}
