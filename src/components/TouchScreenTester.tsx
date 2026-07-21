import React, { useEffect, useRef, useState } from 'react';
import { LogOut, RotateCcw } from 'lucide-react';

export default function TouchScreenTester({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to match the container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        fillBackground();
      }
    };

    const ctx = canvas.getContext('2d');
    const fillBackground = () => {
      if (!ctx) return;
      // We will fill it with a grid pattern for better visualization of touch spots
      ctx.fillStyle = '#0f172a'; // slate-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawLine = (x: number, y: number, isDown: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isDown) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#38bdf8'; // sky-400 (bright blue for visibility)
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Draw a solid circle at the current point to make dots when tapping without moving
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawLine(x, y, false);
      drawLine(x, y, true); // ensure a dot is drawn even if they don't move
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drawLine(x, y, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden flex flex-col z-50 touch-none">
      <div className="absolute top-4 right-4 flex gap-3 z-10">
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-colors border border-slate-700"
        >
          <RotateCcw className="w-5 h-5" />
          Làm mới
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Thoát Test
        </button>
      </div>

      <div className="absolute top-4 left-4 pointer-events-none z-10">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 text-white p-4 rounded-xl shadow-lg">
          <h2 className="font-bold text-lg text-sky-400">Kiểm tra Màn hình Cảm ứng</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-sm">
            Vuốt ngón tay hoặc chuột khắp màn hình để vẽ. Những vùng không vẽ được nét đứt có thể là điểm chết cảm ứng.
          </p>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          className="block w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerOut={handlePointerUp}
        />
      </div>
    </div>
  );
}
