import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Mic, Monitor, Fingerprint, Battery, HardDrive, Cpu, 
  X, Maximize, AlertTriangle, Keyboard as KeyboardIcon 
} from 'lucide-react';
import { createPortal } from 'react-dom';

export default function LaptopTester() {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const handleDxDiag = async () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      await (window as any).electronAPI.runDxDiag();
    } else {
      alert("Tính năng này chỉ hoạt động trên app Desktop.");
    }
  };

  const cards = [
    { id: 'screen', name: 'Kiểm tra Màn hình', icon: <Monitor className="h-8 w-8" />, color: 'from-blue-500 to-cyan-500' },
    { id: 'keyboard', name: 'Kiểm tra Bàn phím', icon: <KeyboardIcon className="h-8 w-8" />, color: 'from-emerald-500 to-teal-500' },
    { id: 'webcam', name: 'Kiểm tra Webcam', icon: <Camera className="h-8 w-8" />, color: 'from-purple-500 to-pink-500' },
    { id: 'mic', name: 'Kiểm tra Micro', icon: <Mic className="h-8 w-8" />, color: 'from-orange-500 to-red-500' },
    { id: 'touch', name: 'Kiểm tra Cảm ứng', icon: <Fingerprint className="h-8 w-8" />, color: 'from-indigo-500 to-blue-600' },
    { id: 'battery', name: 'Thông tin Pin', icon: <Battery className="h-8 w-8" />, color: 'from-yellow-400 to-orange-500' },
    { id: 'disk', name: 'Kiểm tra Ổ cứng', icon: <HardDrive className="h-8 w-8" />, color: 'from-slate-600 to-slate-800' },
    { id: 'vga', name: 'Kiểm tra VGA', icon: <Cpu className="h-8 w-8" />, color: 'from-rose-500 to-red-600', action: handleDxDiag },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <Monitor className="h-7 w-7" />
          KIỂM TRA LAPTOP TOÀN DIỆN
        </h2>
        <p className="mt-2 text-blue-100 text-sm">
          Bộ công cụ 8 trong 1 giúp kỹ thuật viên test nhanh chóng các thành phần phần cứng máy tính mà không cần cài thêm phần mềm.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(card => (
          <div 
            key={card.id}
            onClick={() => card.action ? card.action() : setActiveTest(card.id)}
            className={`bg-gradient-to-br ${card.color} p-1 rounded-2xl cursor-pointer hover:scale-105 transition-transform shadow-md hover:shadow-xl group`}
          >
            <div className="bg-white/10 backdrop-blur-sm h-full w-full p-6 rounded-xl flex flex-col items-center justify-center gap-4 text-white border border-white/20">
              <div className="p-4 bg-white/20 rounded-full group-hover:scale-110 transition-transform shadow-inner">
                {card.icon}
              </div>
              <span className="font-bold text-center tracking-wide">{card.name}</span>
            </div>
          </div>
        ))}
      </div>

      {activeTest && createPortal(
        <TestModal test={activeTest} onClose={() => setActiveTest(null)} />,
        document.body
      )}
    </div>
  );
}

function TestModal({ test, onClose }: { test: string, onClose: () => void }) {
  // Prevent body scrolling and request fullscreen
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Request fullscreen for screen and touch tests
    if (test === 'screen' || test === 'touch') {
      try {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } catch (e) {}
    }

    return () => {
      document.body.style.overflow = 'unset';
      if (document.fullscreenElement) {
        try {
          document.exitFullscreen().catch(() => {});
        } catch (e) {}
      }
    };
  }, [test]);


  // Handle ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center select-none">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110] shadow-lg border border-white/10"
        title="Nhấn ESC để thoát"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div className="w-full h-full relative">
        {test === 'screen' && <ScreenTest />}
        {test === 'keyboard' && <KeyboardTest />}
        {test === 'webcam' && <WebcamTest />}
        {test === 'mic' && <MicTest />}
        {test === 'touch' && <TouchTest />}
        {test === 'battery' && <BatteryTest />}
        {test === 'disk' && <DiskTest />}
      </div>
    </div>
  );
}

// ========================
// 1. SCREEN TEST
// ========================
function ScreenTest() {
  const colors = ['bg-white', 'bg-black', 'bg-red-600', 'bg-green-600', 'bg-blue-600', 'bg-yellow-400'];
  const [idx, setIdx] = useState(0);

  return (
    <div 
      className={`w-full h-full cursor-pointer ${colors[idx]} transition-colors duration-150 flex flex-col items-center justify-center group`}
      onClick={() => setIdx((idx + 1) % colors.length)}
    >
      <div className={`p-4 rounded-lg bg-black/40 text-white backdrop-blur text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity`}>
        Click chuột để đổi màu. Nhấn ESC để thoát.
      </div>
    </div>
  );
}

// ========================
// 2. KEYBOARD TEST
// ========================
function KeyboardTest() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [currentKey, setCurrentKey] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const keyStr = e.code;
      setCurrentKey(e.key === ' ' ? 'Space' : e.key);
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(keyStr);
        return newSet;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const keysRow1 = ['Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal','Backspace'];
  const keysRow2 = ['Tab','KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash'];
  const keysRow3 = ['CapsLock','KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Enter'];
  const keysRow4 = ['ShiftLeft','KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','ShiftRight'];
  const keysRow5 = ['ControlLeft','MetaLeft','AltLeft','Space','AltRight','ControlRight','ArrowLeft','ArrowUp','ArrowDown','ArrowRight'];

  const renderKey = (code: string, label?: string, flex?: string) => {
    const isPressed = pressedKeys.has(code);
    return (
      <div 
        key={code}
        className={`h-12 border-2 rounded flex items-center justify-center font-bold text-xs uppercase transition-colors duration-75
          ${flex ? flex : 'w-12'}
          ${isPressed ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400'}
        `}
      >
        {label || code.replace('Key', '').replace('Digit', '')}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-black text-white mb-2">Kiểm tra Bàn phím</h3>
        <p className="text-slate-400">Hãy gõ tất cả các phím. Phím hoạt động tốt sẽ đổi màu xanh.</p>
        <div className="mt-4 text-3xl font-bold text-blue-400 h-10">{currentKey}</div>
      </div>

      <div className="flex flex-col gap-2 p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex gap-2">
          {renderKey('Backquote', '`~')}
          {renderKey('Digit1')} {renderKey('Digit2')} {renderKey('Digit3')} {renderKey('Digit4')}
          {renderKey('Digit5')} {renderKey('Digit6')} {renderKey('Digit7')} {renderKey('Digit8')}
          {renderKey('Digit9')} {renderKey('Digit0')}
          {renderKey('Minus', '-_')} {renderKey('Equal', '+=')}
          {renderKey('Backspace', 'Backspace', 'flex-1 w-24')}
        </div>
        <div className="flex gap-2">
          {renderKey('Tab', 'Tab', 'w-16')}
          {renderKey('KeyQ')} {renderKey('KeyW')} {renderKey('KeyE')} {renderKey('KeyR')}
          {renderKey('KeyT')} {renderKey('KeyY')} {renderKey('KeyU')} {renderKey('KeyI')}
          {renderKey('KeyO')} {renderKey('KeyP')}
          {renderKey('BracketLeft', '[{')} {renderKey('BracketRight', ']}')}
          {renderKey('Backslash', '\\|', 'flex-1 w-16')}
        </div>
        <div className="flex gap-2">
          {renderKey('CapsLock', 'Caps', 'w-20')}
          {renderKey('KeyA')} {renderKey('KeyS')} {renderKey('KeyD')} {renderKey('KeyF')}
          {renderKey('KeyG')} {renderKey('KeyH')} {renderKey('KeyJ')} {renderKey('KeyK')}
          {renderKey('KeyL')} {renderKey('Semicolon', ';:')} {renderKey('Quote', '\'"')}
          {renderKey('Enter', 'Enter', 'flex-1 w-24')}
        </div>
        <div className="flex gap-2">
          {renderKey('ShiftLeft', 'Shift', 'w-28')}
          {renderKey('KeyZ')} {renderKey('KeyX')} {renderKey('KeyC')} {renderKey('KeyV')}
          {renderKey('KeyB')} {renderKey('KeyN')} {renderKey('KeyM')}
          {renderKey('Comma', ',<')} {renderKey('Period', '.>')} {renderKey('Slash', '/?')}
          {renderKey('ShiftRight', 'Shift', 'flex-1 w-24')}
        </div>
        <div className="flex gap-2">
          {renderKey('ControlLeft', 'Ctrl', 'w-16')}
          {renderKey('MetaLeft', 'Win', 'w-14')}
          {renderKey('AltLeft', 'Alt', 'w-14')}
          {renderKey('Space', 'Space', 'flex-1 w-64')}
          {renderKey('AltRight', 'Alt', 'w-14')}
          {renderKey('ControlRight', 'Ctrl', 'w-16')}
          <div className="flex gap-1 ml-4">
            {renderKey('ArrowLeft', '←', 'w-12')}
            <div className="flex flex-col gap-1">
              {renderKey('ArrowUp', '↑', 'w-12 h-[22px]')}
              {renderKey('ArrowDown', '↓', 'w-12 h-[22px]')}
            </div>
            {renderKey('ArrowRight', '→', 'w-12')}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// 3. WEBCAM TEST
// ========================
function WebcamTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        setError(err.message);
      });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
      <h3 className="text-2xl font-black text-white mb-6">Kiểm tra Webcam</h3>
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-rose-500 font-bold p-8 text-center">
            <AlertTriangle className="h-10 w-10 mr-3" /> Lỗi Webcam: {error}
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror-horizontally scale-x-[-1]" />
        )}
      </div>
    </div>
  );
}

// ========================
// 4. MIC TEST
// ========================
function MicTest() {
  const [vol, setVol] = useState(0);
  const [error, setError] = useState('');
  const reqRef = useRef<number>();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const render = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setVol(avg);
          reqRef.current = requestAnimationFrame(render);
        };
        render();

        return () => {
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close();
        };
      })
      .catch(err => setError(err.message));

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
      <h3 className="text-2xl font-black text-white mb-10">Kiểm tra Micro</h3>
      {error ? (
        <div className="text-rose-500 font-bold flex items-center"><AlertTriangle className="mr-2" /> {error}</div>
      ) : (
        <div className="flex flex-col items-center gap-10">
          <div className="relative flex items-center justify-center w-64 h-64">
            <div 
              className="absolute bg-blue-500/20 rounded-full transition-all duration-75"
              style={{ width: `${100 + vol * 2}%`, height: `${100 + vol * 2}%` }}
            />
            <div 
              className="absolute bg-blue-500/40 rounded-full transition-all duration-75"
              style={{ width: `${100 + vol}%`, height: `${100 + vol}%` }}
            />
            <div className="relative z-10 p-8 bg-blue-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)]">
              <Mic className="h-16 w-16 text-white" />
            </div>
          </div>
          <p className="text-slate-400">Hãy nói gì đó, vòng sóng âm sẽ thay đổi độ lớn theo giọng của bạn.</p>
        </div>
      )}
    </div>
  );
}

// ========================
// 5. TOUCH TEST
// ========================
function TouchTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid to help visualize touch zones
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 100) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 100) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const draw = (x: number, y: number) => {
      if (!isDrawing) return;
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // glowing center
      ctx.beginPath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();

      lastX = x;
      lastY = y;
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      if (e instanceof MouseEvent) {
        lastX = e.clientX;
        lastY = e.clientY;
      } else {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (e instanceof MouseEvent) {
        draw(e.clientX, e.clientY);
      } else {
        draw(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => isDrawing = false;

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
    canvas.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, []);

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full pointer-events-none font-bold backdrop-blur">
        Vuốt ngón tay khắp màn hình để vẽ. Phát hiện điểm liệt cảm ứng.
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

// ========================
// 6. BATTERY TEST
// ========================
function BatteryTest() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      (window as any).electronAPI.getBatteryHealth().then((res: any) => {
        setData(res);
        setLoading(false);
      });
    } else {
      setData({ DesignCapacity: 50000, FullChargeCapacity: 45000, EstimatedChargeRemaining: 80 });
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="text-white text-center p-20">Đang tải thông tin pin...</div>;

  const design = parseInt(data.DesignCapacity) || 0;
  const full = parseInt(data.FullChargeCapacity) || 0;
  const health = design > 0 ? ((full / design) * 100).toFixed(1) : 'N/A';
  const wear = design > 0 ? (100 - (full / design) * 100).toFixed(1) : 'N/A';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-2xl shadow-2xl">
        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <Battery className="text-yellow-500 h-8 w-8" /> Thông tin sức khỏe Pin (Battery)
        </h3>
        {design === 0 ? (
          <div className="text-rose-400 font-bold flex items-center gap-2 p-4 bg-rose-500/10 rounded-lg">
            <AlertTriangle /> Không tìm thấy thông tin Pin. (Có thể máy tính là máy bàn hoặc lỗi driver Pin).
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-sm mb-1">Dung lượng thiết kế ban đầu</div>
                <div className="text-xl font-bold text-white">{design} mWh</div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl">
                <div className="text-slate-400 text-sm mb-1">Dung lượng sạc đầy hiện tại</div>
                <div className="text-xl font-bold text-white">{full} mWh</div>
              </div>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-sm mb-1">Độ chai pin (Wear Level)</div>
                <div className="text-3xl font-black text-rose-500">{wear}%</div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-sm mb-1">Sức khỏe còn lại (Health)</div>
                <div className="text-3xl font-black text-emerald-400">{health}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// 7. DISK TEST
// ========================
function DiskTest() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      (window as any).electronAPI.getDiskHealth().then((res: any[]) => {
        setData(res);
        setLoading(false);
      });
    } else {
      setData([{ FriendlyName: 'SAMSUNG MZVLB512HBJQ-000L2', MediaType: 'SSD', OperationalStatus: 'OK', HealthStatus: 'Healthy', Size: 512110190592 }]);
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="text-white text-center p-20">Đang tải thông tin ổ cứng...</div>;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-4xl shadow-2xl">
        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <HardDrive className="text-blue-500 h-8 w-8" /> Thông tin Sức khỏe Ổ cứng S.M.A.R.T
        </h3>
        
        {data.length === 0 ? (
          <div className="text-rose-400 font-bold p-4 bg-rose-500/10 rounded-lg">Không lấy được thông tin ổ cứng.</div>
        ) : (
          <div className="space-y-4">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-5 bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div className="p-4 bg-slate-900 rounded-lg shrink-0">
                  <HardDrive className="h-8 w-8 text-blue-400" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-bold text-lg text-white">{d.FriendlyName || d.DeviceId || 'Unknown Disk'}</div>
                  <div className="flex gap-4 text-sm font-medium">
                    <span className="text-slate-400">Loại: <span className="text-white">{d.MediaType || 'Unknown'}</span></span>
                    <span className="text-slate-400">Dung lượng: <span className="text-white">{d.Size ? (d.Size / 1073741824).toFixed(1) + ' GB' : 'N/A'}</span></span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-black uppercase ${d.HealthStatus === 'Healthy' ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {d.HealthStatus === 'Healthy' ? 'TỐT (OK)' : d.HealthStatus}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Trạng thái S.M.A.R.T</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
