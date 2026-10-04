import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { EventItem, InvitationCode } from '../../types/database';
import { eventService } from '../../lib/services/eventService';
import { X, Copy, Check, Plus, Trash2, Key, Search, Sparkles } from 'lucide-react';

interface InvitationCodeModalProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
}

export const InvitationCodeModal: React.FC<InvitationCodeModalProps> = ({
  isOpen,
  event,
  onClose,
}) => {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generateCount, setGenerateCount] = useState<number>(10);
  const [usageLimit, setUsageLimit] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all');

  const loadCodes = async () => {
    if (!event) return;
    setIsLoading(true);
    const data = await eventService.getInvitationCodes(event.id);
    setCodes(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && event) {
      loadCodes();
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleGenerate = async () => {
    if (generateCount < 1 || generateCount > 1000) return;
    setIsGenerating(true);
    await eventService.generateInvitationCodes(event.id, generateCount, usageLimit);
    await loadCodes();
    setIsGenerating(false);
  };

  const handleDelete = async (codeId: string) => {
    if (confirm('Yakin ingin menghapus kode undangan ini?')) {
      await eventService.deleteInvitationCode(codeId, event.id);
      await loadCodes();
    }
  };

  const handleCopyAll = () => {
    const codeList = codes.map((c) => c.kode).join('\n');
    navigator.clipboard.writeText(codeList);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingle = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const filteredCodes = codes.filter((c) => {
    const matchesSearch = c.kode.toLowerCase().includes(searchQuery.toLowerCase());
    const isUsed = c.jumlah_terpakai >= c.batas_pemakaian;
    if (statusFilter === 'available') return matchesSearch && !isUsed;
    if (statusFilter === 'used') return matchesSearch && isUsed;
    return matchesSearch;
  });

  const availableCount = codes.filter((c) => c.jumlah_terpakai < c.batas_pemakaian).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8 bg-white dark:bg-[#201813] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-lg text-stone-900 dark:text-stone-100">
                Panel Kode Undangan
              </h3>
              <p className="text-xs text-stone-500 font-baloo truncate max-w-sm">
                Event: {event.nama}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Generator Form */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 font-fredoka flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Generate Kode Otomatis (Tanpa 0, O, 1, I)
              </span>
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                8 Karakter Unik
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 font-baloo mb-1">
                  Jumlah Kode (maks 1000)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(parseInt(e.target.value, 10) || 1)}
                  className="text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 font-baloo mb-1">
                  Batas Pakai per Kode
                </label>
                <Input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(parseInt(e.target.value, 10) || 1)}
                  className="text-center font-bold"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleGenerate}
                  variant="festival"
                  className="w-full text-xs py-2.5"
                  isLoading={isGenerating}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Generate Sekarang
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Bar & Copy All */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Total: {codes.length}</Badge>
              <Badge variant="success">Tersedia: {availableCount}</Badge>
              <Badge variant="danger">Habis: {codes.length - availableCount}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopyAll}
                variant="outline"
                size="sm"
                disabled={codes.length === 0}
                className="text-xs"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copiedAll ? 'Tersalin Semua!' : 'Salin Semua Kode'}
              </Button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <Input
                placeholder="Cari kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  statusFilter === 'all' ? 'bg-amber-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  statusFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                Tersedia
              </button>
              <button
                onClick={() => setStatusFilter('used')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  statusFilter === 'used' ? 'bg-rose-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                Habis
              </button>
            </div>
          </div>

          {/* Code Table */}
          <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
            <table className="w-full text-left text-xs font-baloo">
              <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="px-4 py-3">Kode Undangan</th>
                  <th className="px-4 py-3">Pemakaian</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                {filteredCodes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-stone-400">
                      {isLoading ? 'Memuat kode...' : 'Belum ada kode undangan yang dibuat.'}
                    </td>
                  </tr>
                ) : (
                  filteredCodes.map((item) => {
                    const isExhausted = item.jumlah_terpakai >= item.batas_pemakaian;
                    return (
                      <tr key={item.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-850/50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-sm tracking-wider text-amber-600 dark:text-amber-400">
                            {item.kode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-700 dark:text-stone-300 font-mono">
                          {item.jumlah_terpakai} / {item.batas_pemakaian}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={isExhausted ? 'danger' : 'success'} className="text-[10px]">
                            {isExhausted ? 'Habis' : 'Tersedia'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopySingle(item.kode)}
                              title="Salin Kode"
                              className="p-1 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Hapus Kode"
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50/50 dark:bg-stone-900/30">
          <Button onClick={onClose} variant="ghost" size="sm">
            Tutup Panel
          </Button>
        </div>
      </div>
    </div>
  );
};
