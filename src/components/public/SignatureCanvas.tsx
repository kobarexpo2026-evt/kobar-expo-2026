import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface SignatureCanvasProps {
  statement?: string | null;
  onSignatureChange: (dataUrl: string | null) => void;
  required?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  statement,
  onSignatureChange,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e293b';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2">
      {/* Statement Box */}
      {statement && (
        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-baloo text-stone-700 dark:text-stone-300 italic">
          "{statement}"
        </div>
      )}

      {/* Signature Canvas Box */}
      <div className="relative rounded-2xl border-2 border-dashed border-teal-400 dark:border-teal-700/80 bg-white dark:bg-stone-900 overflow-hidden shadow-2xs">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-32 touch-none cursor-crosshair"
        />

        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-stone-400 text-xs font-baloo gap-1 select-none">
            <PenTool className="w-4 h-4 text-teal-600 dark:text-teal-400 opacity-60" />
            <span>Tanda tangani di sini (sentuh layar atau seret kursor mouse)</span>
          </div>
        )}

        {hasSignature && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/90 dark:bg-stone-850/90 backdrop-blur-xs px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] text-teal-700 dark:text-teal-400 font-semibold font-baloo">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tanda Tangan Terekam</span>
          </div>
        )}
      </div>

      {/* Clear Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasSignature}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed font-baloo transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Hapus & Ulangi TTD</span>
        </button>
      </div>
    </div>
  );
};
