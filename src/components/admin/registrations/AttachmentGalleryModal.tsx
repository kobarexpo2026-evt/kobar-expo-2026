import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Registration } from '../../../types/database';
import { registrationService, RegistrationFileItem } from '../../../lib/services/registrationService';
import { Button } from '../../ui/Button';
import { 
  X, 
  Paperclip, 
  FileText, 
  ExternalLink, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  CheckCircle2,
  Image as ImageIcon,
  FolderDown,
  Info
} from 'lucide-react';

interface AttachmentGalleryModalProps {
  isOpen: boolean;
  registration: Registration | null;
  initialIndex?: number;
  onClose: () => void;
}

export const AttachmentGalleryModal: React.FC<AttachmentGalleryModalProps> = ({
  isOpen,
  registration,
  initialIndex = 0,
  onClose,
}) => {
  const [files, setFiles] = useState<RegistrationFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Zoom, Pan & Rotation states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset transform when changing file
  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Load files when registration changes
  useEffect(() => {
    if (!isOpen || !registration) return;

    const loadFiles = async () => {
      setLoading(true);
      resetTransform();
      const items = await registrationService.getRegistrationFiles(registration);
      setFiles(items);
      const safeIndex = initialIndex >= 0 && initialIndex < items.length ? initialIndex : 0;
      setCurrentIndex(safeIndex);
      setLoading(false);
    };

    loadFiles();
  }, [isOpen, registration, initialIndex, resetTransform]);

  const currentFile = files[currentIndex] || null;

  // Next & Previous Handlers
  const handlePrev = useCallback(() => {
    if (files.length <= 1) return;
    resetTransform();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : files.length - 1));
  }, [files.length, resetTransform]);

  const handleNext = useCallback(() => {
    if (files.length <= 1) return;
    resetTransform();
    setCurrentIndex((prev) => (prev < files.length - 1 ? prev + 1 : 0));
  }, [files.length, resetTransform]);

  // Zoom Handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.3, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.3, 0.5);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        resetTransform();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotateRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, handlePrev, handleNext, resetTransform, onClose]);

  // Pan / Drag handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!currentFile?.is_image) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Automated Direct Download Helper via Blob (forces immediate download to device)
  const downloadSingleFile = async (file: RegistrationFileItem) => {
    if (!file.signed_url || !registration) return;

    try {
      setIsDownloading(true);
      const res = await fetch(file.signed_url);
      const blob = await res.blob();
      
      // Determine file extension
      let ext = 'jpg';
      if (file.signed_url.includes('.png') || file.storage_path.endsWith('.png')) ext = 'png';
      else if (file.signed_url.includes('.webp') || file.storage_path.endsWith('.webp')) ext = 'webp';
      else if (file.signed_url.includes('.pdf') || file.storage_path.endsWith('.pdf')) ext = 'pdf';
      else if (blob.type.includes('png')) ext = 'png';
      else if (blob.type.includes('pdf')) ext = 'pdf';
      else if (blob.type.includes('jpeg') || blob.type.includes('jpg')) ext = 'jpg';

      const cleanRegId = registration.reg_id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanName = registration.nama.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanLabel = file.field_label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `Lampiran_${cleanName}_${cleanLabel}_${cleanRegId}.${ext}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(file.id);
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err) {
      console.warn('Direct Blob download failed, falling back to window download:', err);
      const link = document.createElement('a');
      link.href = file.signed_url;
      link.download = `${file.field_label}_${registration.reg_id}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download All files in sequence
  const downloadAllFiles = async () => {
    if (!files.length || !registration) return;
    setIsDownloading(true);
    for (const f of files) {
      await downloadSingleFile(f);
      // Small pause to allow browser download queue
      await new Promise((r) => setTimeout(r, 400));
    }
    setIsDownloading(false);
  };

  if (!isOpen || !registration) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 rounded-none border-none z-50 h-screen max-w-none' 
            : 'max-w-4xl h-[90vh] max-h-[800px]'
        }`}
      >
        {/* Top Header & Info Bar */}
        <div className="px-4 py-3 bg-stone-950/80 border-b border-stone-800/80 flex items-center justify-between gap-3 shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
              <Paperclip className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm text-stone-100 truncate">
                  {registration.nama}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  {registration.reg_id}
                </span>
                {files.length > 0 && (
                  <span className="text-[11px] text-stone-400 px-2 py-0.5 rounded-full bg-stone-800">
                    Berkas {currentIndex + 1} dari {files.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                {currentFile ? currentFile.field_label : 'Lampiran Berkas'} &bull; {registration.event_nama || 'Event Kobar'}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {files.length > 1 && (
              <Button
                type="button"
                onClick={downloadAllFiles}
                variant="outline"
                size="sm"
                isLoading={isDownloading}
                className="text-xs h-8 px-2.5 text-stone-300 border-stone-700 hover:bg-stone-800 hover:text-white hidden sm:inline-flex"
                title="Unduh seluruh lampiran peserta ini"
              >
                <FolderDown className="w-3.5 h-3.5 mr-1 text-teal-400" />
                Unduh Semua ({files.length})
              </Button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Keluar Layar Penuh (Esc)' : 'Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="Tutup Galeri (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Lightbox Viewport */}
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative flex-1 bg-[#120F0D] flex items-center justify-center overflow-hidden select-none ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-stone-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs">Memuat berkas resolusi tinggi...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center p-8 space-y-2 text-stone-500">
              <Paperclip className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-sm font-semibold text-stone-300">Tidak ada lampiran terdeteksi</p>
              <p className="text-xs max-w-sm">Peserta ini belum mengunggah file bukti pembayaran, identitas, atau tanda tangan digital.</p>
            </div>
          ) : currentFile?.is_image ? (
            /* Live Image Canvas with Zoom, Rotation & Pan */
            <div 
              className="w-full h-full flex items-center justify-center p-4 transition-transform duration-75"
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={currentFile.signed_url}
                alt={currentFile.field_label}
                draggable={false}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all select-none pointer-events-none"
              />
            </div>
          ) : (
            /* PDF or Generic Document Card */
            <div className="p-8 max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-bold">
                  Dokumen PDF
                </span>
                <h4 className="font-bold text-base text-stone-100">
                  {currentFile?.field_label}
                </h4>
                <p className="text-xs text-stone-400 font-mono truncate">
                  {currentFile?.storage_path}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                {currentFile && (
                  <Button
                    type="button"
                    onClick={() => downloadSingleFile(currentFile)}
                    variant="festival"
                    size="sm"
                    className="text-xs"
                    isLoading={isDownloading}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Unduh Dokumen PDF
                  </Button>
                )}

                {currentFile?.signed_url && (
                  <a
                    href={currentFile.signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-700 bg-stone-800 text-xs font-semibold text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
                  >
                    <span>Buka Tab Baru</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Navigation Prev Button */}
          {files.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-amber-500 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-all transform hover:scale-110 cursor-pointer z-20 group"
              title="Gambar Sebelumnya (←)"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Navigation Next Button */}
          {files.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-amber-500 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-all transform hover:scale-110 cursor-pointer z-20 group"
              title="Gambar Berikutnya (→)"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Floating Floating Toolbars for Image Zoom & Controls */}
          {currentFile?.is_image && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-950/85 backdrop-blur-md border border-stone-800 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xl z-20 text-stone-300">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Zoom Indicator */}
              <span className="text-[11px] font-mono font-bold w-12 text-center select-none text-amber-400">
                {Math.round(zoom * 100)}%
              </span>

              {/* Zoom In */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-stone-800 mx-1" />

              {/* Reset Zoom */}
              <button
                type="button"
                onClick={resetTransform}
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Reset Tampilan (0)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Fit</span>
              </button>

              <div className="w-px h-4 bg-stone-800 mx-1" />

              {/* Rotate Left */}
              <button
                type="button"
                onClick={handleRotateLeft}
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                title="Putar Kiri 90°"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Rotate Right */}
              <button
                type="button"
                onClick={handleRotateRight}
                className="p-1.5 rounded-lg hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
                title="Putar Kanan 90° (R)"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-stone-800 mx-1" />

              {/* Instant Direct Download Button */}
              <button
                type="button"
                onClick={() => downloadSingleFile(currentFile)}
                disabled={isDownloading}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  downloadSuccess === currentFile.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                }`}
                title="Unduh otomatis gambar ini ke perangkat"
              >
                {downloadSuccess === currentFile.id ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Gambar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Thumbnail Strip */}
        {files.length > 1 && (
          <div className="px-4 py-2.5 bg-stone-950/90 border-t border-stone-800/80 flex items-center gap-2 overflow-x-auto shrink-0 select-none">
            {files.map((file, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => {
                    resetTransform();
                    setCurrentIndex(idx);
                  }}
                  className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 text-left ${
                    isActive
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  {file.is_image ? (
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-stone-800 shrink-0 border border-stone-700">
                      <img
                        src={file.signed_url}
                        alt={file.field_label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0 pr-1">
                    <p className="text-[11px] font-bold truncate max-w-[120px]">
                      {file.field_label}
                    </p>
                    <span className="text-[9px] uppercase tracking-wider block opacity-70">
                      {file.kind === 'pembayaran'
                        ? 'Bukti Bayar'
                        : file.kind === 'ttd'
                        ? 'TTD Digital'
                        : 'Lampiran'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
