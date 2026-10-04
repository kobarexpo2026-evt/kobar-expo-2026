import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { UserRole, EventItem } from '../../types/database';
import { AdminWithAccess, adminService } from '../../lib/services/adminService';
import { X, ShieldCheck, AlertCircle, Key, CheckSquare, Square } from 'lucide-react';

interface AdminUserModalProps {
  isOpen: boolean;
  admin: AdminWithAccess | null;
  events: EventItem[];
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
  isSuperAdmin: boolean;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  admin,
  events,
  currentUserId,
  onClose,
  onSaved,
  isSuperAdmin,
}) => {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isAllEvents, setIsAllEvents] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (admin) {
      setNama(admin.nama);
      setEmail(admin.email);
      setPassword(''); // Blank by default on edit
      setRole(admin.role);
      if (admin.role === 'super_admin' || !admin.assigned_event_ids || admin.assigned_event_ids.length === 0) {
        setIsAllEvents(true);
        setSelectedEventIds([]);
      } else {
        setIsAllEvents(false);
        setSelectedEventIds(admin.assigned_event_ids);
      }
    } else {
      setNama('');
      setEmail('');
      setPassword('');
      setRole('admin');
      setIsAllEvents(true);
      setSelectedEventIds([]);
    }
    setErrorMsg(null);
  }, [admin, isOpen]);

  if (!isOpen) return null;

  const toggleEvent = (eventId: string) => {
    setIsAllEvents(false);
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setIsAllEvents(checked);
    if (checked) {
      setSelectedEventIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama.trim() || !email.trim()) {
      setErrorMsg('Nama dan email wajib diisi.');
      return;
    }

    if (!admin && (!password || password.length < 6)) {
      setErrorMsg('Kata sandi untuk akun baru minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const res = await adminService.saveAdmin(
      {
        id: admin?.id,
        nama: nama.trim(),
        email: email.trim(),
        password: password.trim() || undefined,
        role,
        assigned_event_ids: isAllEvents ? [] : selectedEventIds,
      },
      currentUserId,
      isSuperAdmin
    );

    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full my-8 bg-white dark:bg-[#201813] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-lg text-stone-900 dark:text-stone-100">
                {admin ? 'Edit Akun Panitia' : 'Tambah Panitia / Admin Baru'}
              </h3>
              <p className="text-xs text-stone-500 font-baloo">
                Pengaturan hak akses dan event per akun
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label="Nama Lengkap Panitia"
            placeholder="Contoh: Budi Santoso"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
          />

          <Input
            label="Alamat Email (Unik)"
            type="email"
            placeholder="budi@kobarexpo.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={Boolean(admin)} // Email disabled on edit to preserve auth identity
          />

          <Input
            label={admin ? 'Kata Sandi Baru (Kosongkan jika tetap)' : 'Kata Sandi Akun'}
            type="password"
            placeholder={admin ? '•••••••• (tidak diubah)' : 'Minimal 6 karakter'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={admin ? 'Biarkan kosong untuk mempertahankan kata sandi lama.' : undefined}
          />

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 font-baloo mb-1.5">
              Peran Akun (Role)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('super_admin')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  role === 'super_admin'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600'
                }`}
              >
                <div className="font-fredoka font-bold text-xs">Super Admin</div>
                <div className="text-[10px] text-stone-500 mt-0.5 font-baloo">
                  Akses penuh ke seluruh event, template invoice, dan kelola admin.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  role === 'admin'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200'
                    : 'border-stone-200 dark:border-stone-800 text-stone-600'
                }`}
              >
                <div className="font-fredoka font-bold text-xs">Admin / Panitia</div>
                <div className="text-[10px] text-stone-500 mt-0.5 font-baloo">
                  Terbatas pada data pendaftar & event yang diizinkan.
                </div>
              </button>
            </div>
          </div>

          {/* Event Access Checklist (for role 'admin') */}
          {role === 'admin' && (
            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-fredoka">
                  Hak Akses Event
                </label>
                <button
                  type="button"
                  onClick={() => handleSelectAll(!isAllEvents)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-baloo hover:underline"
                >
                  {isAllEvents ? 'Pilih Event Tertentu' : 'Beri Akses Semua Event'}
                </button>
              </div>

              {isAllEvents ? (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-400 font-baloo">
                  ✨ <strong>Akses Semua Event Aktif:</strong> Akun ini dapat melihat data dan pendaftar di seluruh event tanpa batasan (aturan bawaan sistem).
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                  {events.map((evt) => {
                    const isChecked = selectedEventIds.includes(evt.id);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => toggleEvent(evt.id)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg text-xs font-baloo cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-amber-100/70 dark:bg-amber-950/40 text-stone-900 dark:text-stone-100 font-semibold'
                            : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400 shrink-0" />
                        )}
                        <span className="truncate">{evt.nama}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" variant="festival" isLoading={isSubmitting}>
              {admin ? 'Simpan Akun' : 'Daftarkan Admin'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
