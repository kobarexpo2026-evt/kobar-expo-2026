import React, { useState } from 'react';
import { EventItem } from '../../types/database';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { eventService } from '../../lib/services/eventService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Lock, Key, AlertCircle, ArrowRight } from 'lucide-react';

interface InvitationModalProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
  onCodeValidated: (validCode: string) => void;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  event,
  onClose,
  onCodeValidated,
}) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Harap masukkan kode undangan Anda.');
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('invitation_codes')
          .select('*')
          .eq('event_id', event.id)
          .eq('kode', cleanCode)
          .single();

        if (error || !data) {
          setErrorMsg('Kode undangan tidak valid atau tidak berlaku untuk event ini.');
          setIsValidating(false);
          return;
        }

        if (data.jumlah_terpakai >= data.batas_pemakaian) {
          setErrorMsg('Maaf, kuota pemakaian kode undangan ini sudah habis.');
          setIsValidating(false);
          return;
        }

        // Success
        setIsValidating(false);
        onCodeValidated(cleanCode);
        onClose();
        return;
      } catch (err: any) {
        setErrorMsg('Terjadi kendala saat memverifikasi kode.');
        setIsValidating(false);
        return;
      }
    }

    // Local / Offline validation fallback
    const localCodes = await eventService.getInvitationCodes(event.id);
    const match = localCodes.find((c) => c.kode.toUpperCase() === cleanCode);

    setTimeout(() => {
      setIsValidating(false);
      if (!match) {
        setErrorMsg('Kode undangan tidak ditemukan. Coba gunakan contoh kode: KOBARVIP atau SPONSOR1');
        return;
      }

      if (match.jumlah_terpakai >= match.batas_pemakaian) {
        setErrorMsg('Kode undangan ini sudah mencapai batas pemakaian.');
        return;
      }

      onCodeValidated(cleanCode);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#201813] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-sm text-stone-900 dark:text-stone-100">
                Akses Terbatas (Mode Undangan)
              </h3>
              <p className="text-[11px] text-stone-500 font-baloo truncate max-w-[200px]">
                {event.nama}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-400 font-baloo">
          Event ini khusus bagi pihak atau peserta yang telah menerima <strong>Kode Undangan Resmi</strong> dari panitia KOBAR EXPO 2026.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-baloo flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 font-baloo mb-1">
              Masukkan 8 Karakter Kode Undangan:
            </label>
            <Input
              placeholder="Contoh: KOBARVIP"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-center uppercase tracking-widest text-base font-bold"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" onClick={onClose} variant="ghost" size="sm">
              Batal
            </Button>
            <Button type="submit" variant="festival" size="sm" isLoading={isValidating}>
              <span>Verifikasi & Masuk Form</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
