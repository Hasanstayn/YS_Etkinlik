// src/components/FloorPlanCanvas.jsx
import React, { useRef, useEffect } from 'react';

export default function FloorPlanCanvas({ selectedZones }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Helpers
    const drawRect = (ctx, x, y, width, height, bgColor, label, borderColor) => {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, 4);
      } else {
        ctx.rect(x, y, width, height);
      }
      ctx.fill();
      ctx.strokeStyle = borderColor || '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (label) {
        ctx.fillStyle = '#334155';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + width / 2, y + height / 2 + 3);
      }
    };

    const drawYellowChair = (ctx, x, y) => {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 11, Math.PI * 0.8, Math.PI * 2.2);
      ctx.stroke();
    };

    const drawSquarePouf = (ctx, x, y, isGreen) => {
      const color = isGreen ? '#65a30d' : '#334155';
      ctx.fillStyle = color;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x - 14, y - 14, 28, 28, 4);
      } else {
        ctx.rect(x - 14, y - 14, 28, 28);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.stroke();
    };

    const drawWhiteTable = (ctx, x, y, width, height, label) => {
      drawRect(ctx, x, y, width, height, '#f8fafc', label, '#475569');
    };

    const drawWallPC = (ctx, x, y, isTopWall) => {
      if (isTopWall) {
        drawRect(ctx, x, y - 20, 60, 15, '#e2e8f0', '', '#cbd5e1');
        ctx.fillStyle = '#facc15';
        ctx.fillRect(x + 5, y - 18, 20, 11);
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 30, y - 18, 20, 11);
      }
      drawRect(ctx, x, y, 60, 40, '#f1f5f9', '', '#94a3b8');
      drawRect(ctx, x + 10, isTopWall ? y + 5 : y + 25, 40, 10, '#0f172a');
      drawYellowChair(ctx, x + 30, isTopWall ? y + 60 : y - 20);
    };

    const drawPrinterTable = (ctx, x, y) => {
      drawRect(ctx, x, y, 100, 60, '#f1f5f9', '', '#94a3b8');
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 10, y + 45, 80, 10);
      drawRect(ctx, x + 15, y + 5, 40, 35, '#0f172a');
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 20, y + 10, 30, 25);
      drawYellowChair(ctx, x + 50, y + 80);
    };

    const getZoneColor = (zoneName) => {
      const colors = {
        'Araştırma': '#ef4444',
        'İş Birliği': '#f97316',
        'Geliştirme': '#eab308',
        'Üretim': '#22c55e',
        'Etkileşim': '#3b82f6',
        'Sunum': '#a855f7',
      };
      return colors[zoneName] || '#94a3b8';
    };

    // Draw Room Base
    drawRect(ctx, 40, 40, 80, 40, '#f8fafc', 'Öğretmen Kürsüsü', '#cbd5e1');
    drawRect(ctx, w / 2 - 100, 5, 200, 10, '#1e293b', '', '#000000');

    // Draw Zone Overlays
    const regions = [
      { x: 150, y: 150 },
      { x: 450, y: 150 },
      { x: 750, y: 150 },
      { x: 150, y: 450 },
      { x: 450, y: 450 },
      { x: 750, y: 450 }
    ];
    
    selectedZones.forEach((zone, index) => {
      if (index < regions.length) {
        const pos = regions[index];
        ctx.fillStyle = getZoneColor(zone);
        ctx.globalAlpha = 0.08;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = getZoneColor(zone);
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.toUpperCase(), pos.x, pos.y - 125);
      }
    });

    // Draw Furniture Layout
    drawWallPC(ctx, 100, 70, true);
    drawWallPC(ctx, 180, 70, true);
    drawWallPC(ctx, 750, 250, false);
    drawPrinterTable(ctx, 650, 100);
    drawWhiteTable(ctx, 380, 250, 120, 70, 'Tekerlekli M.');
    drawSquarePouf(ctx, 400, 230, false);
    drawSquarePouf(ctx, 480, 230, true);
    drawSquarePouf(ctx, 400, 340, true);
    drawSquarePouf(ctx, 480, 340, false);
    drawRect(ctx, 50, 400, 10, 100, '#1e293b');
    drawSquarePouf(ctx, 120, 420, true);
    drawSquarePouf(ctx, 120, 480, false);
    drawSquarePouf(ctx, 160, 450, false);
    drawWhiteTable(ctx, 650, 420, 40, 30);
    drawWhiteTable(ctx, 690, 420, 40, 30);
    drawWhiteTable(ctx, 650, 450, 40, 30);
    drawWhiteTable(ctx, 690, 450, 40, 30);
    drawYellowChair(ctx, 670, 405);
    drawYellowChair(ctx, 710, 405);
    drawYellowChair(ctx, 670, 495);
    drawYellowChair(ctx, 710, 495);

  }, [selectedZones]);

  return (
    <div id="layoutSection" className="glass-panel rounded-3xl p-6 md:p-10 border-t-8 border-indigo-500 bg-white shadow-lg space-y-6 mt-8">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <h3 className="text-xl font-bold text-slate-800">📐 Sınıf Yerleşim Planı (2D)</h3>
        <span id="layoutTitleLabel" className="px-4 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold border border-indigo-200">
          Karma FCL Düzeni
        </span>
      </div>
      
      <p className="text-sm text-slate-500">
        💡 FCL alanlarınızın sınıftaki dağılımı (renkli bölgeler) ve Yenilikçi Sınıf mobilyalarının yerleşimi 2D şema üzerinde gösterilmiştir.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <canvas
          ref={canvasRef}
          id="floorPlan"
          width="900"
          height="600"
          className="mx-auto block max-w-full rounded-xl shadow-md border border-slate-300 bg-white"
        />
      </div>
    </div>
  );
}
