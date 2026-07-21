import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LogOut, RotateCcw } from 'lucide-react';

const CELL_SIZE = 40;

export default function TouchScreenTester({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchedCellsRef = useRef<Set<string>>(new Set());
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);

  useEffect(() => {
    // Prevent scrolling or zooming while testing
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('contextmenu', preventDefault);
    
    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
    };
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, touched: Set<string>) => {
    const c = Math.ceil(width / CELL_SIZE);
    const r = Math.ceil(height / CELL_SIZE);
    
    // Background - untouched color (Light Blue)
    ctx.fillStyle = '#60a5fa'; // blue-400
    ctx.fillRect(0, 0, width, height);

    // Draw touched cells (Orange)
    ctx.fillStyle = '#f97316'; // orange-500
    touched.forEach(key => {
      const [cx, cy] = key.split(',').map(Number);
      ctx.fillRect(cx * CELL_SIZE, cy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Draw grid lines
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let x = 0; x <= width; x += CELL_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += CELL_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to match the container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        setCols(Math.ceil(canvas.width / CELL_SIZE));
        setRows(Math.ceil(canvas.height / CELL_SIZE));
        
        const ctx = canvas.getContext('2d');
        if (ctx) drawGrid(ctx, canvas.width, canvas.height, touchedCellsRef.current);
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawGrid]);

  const clearCanvas = () => {
    touchedCellsRef.current.clear();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) drawGrid(ctx, canvas.width, canvas.height, touchedCellsRef.current);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle both touch and mouse events
    let clientX, clientY;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // For mouse, we only care if button is pressed (optional, but good for testing)
      if (e.buttons !== 1) return;
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    
    // Boundary check
    if (col < 0 || col >= cols || row < 0 || row >= rows) return;
    
    const key = `${col},${row}`;
    
    // If not touched yet, add and render just this cell
    if (!touchedCellsRef.current.has(key)) {
      touchedCellsRef.current.add(key);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw just the newly touched cell (for performance)
        ctx.fillStyle = '#f97316';
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Redraw grid lines around it so they stay on top
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.globalAlpha = 1.0;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
      {/* Top Controls */}
      <div className="absolute top-4 w-full px-6 flex justify-between items-center z-10 pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg backdrop-blur-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-bold">Thoát</span>
        </button>
        
        <div className="pointer-events-auto bg-slate-800/80 text-white text-sm font-bold px-6 py-2 rounded-full backdrop-blur-sm shadow-lg border border-slate-700">
          Vuốt ngón tay khắp màn hình để tô màu. Phát hiện điểm liệt cảm ứng.
        </div>
        
        <button 
          onClick={clearCanvas}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg backdrop-blur-sm transition-all border border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="font-bold">Làm lại</span>
        </button>
      </div>

      <div className="w-full h-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none block"
          onMouseMove={handlePointerMove}
          onMouseDown={handlePointerMove}
          onTouchMove={handlePointerMove}
          onTouchStart={handlePointerMove}
        />
      </div>
    </div>
  );
}
