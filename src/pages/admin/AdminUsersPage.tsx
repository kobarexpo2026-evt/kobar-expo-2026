import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EventItem } from '../../types/database';
import { AdminWithAccess, adminService } from '../../lib/services/adminService';
import { eventService } from '../../lib/services/eventService';
import { AdminUserModal } from '../../components/admin/AdminUserModal';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndo } from '../../lib/utils';
import { 
  ShieldCheck, 
  UserPlus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  Lock, 
  ShieldAlert,
  Search,
  Sparkles
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminWithAccess[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminWithAccess | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const [adminList, eventList] = await Promise.all([
      adminService.getAdmins(isSuperAdmin),
      eventService.getEvents(),
    ]);
    setAdmins(adminList);
    setEvents(eventList);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  // If not Super Admin, block access immediately
  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-fredoka text-stone-900 dark:text-stone-100">
          Akses Ditolak (Khusus Super Admin)
        </h2>
        <p className="text-sm text-stone-500 font-baloo">
          Halaman manajemen akun dan penugasan hak akses event hanya dapat dibuka oleh akun dengan peran <strong>Super Administrator</strong>.
        </p>
      </div>
    );
  }

  const handleCreate = () => {
    setSelectedAdminForEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (adm: AdminWithAccess) => {
    setSelectedAdminForEdit(adm);
    setIsModalOpen(true);
  };

  const handleDelete = async (adminId: string, adminEmail: string) => {
    if (adminId === user?.id || adminEmail === user?.email) {
      alert('Pelanggaran Aturan: Super Admin tidak dapat menghapus akunnya sendiri!');
      return;
    }

    if (confirm(`Yakin ingin menghapus akun panitia "${adminEmail}"?`)) {
      const res = await adminService.deleteAdmin(adminId, user?.id || '', isSuperAdmin);
      if (res.error) {
        alert(res.error);
      } else {
        await loadData();
      }
    }
  };

  const filteredAdmins = admins.filter((a) =>
    a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#201813] p-4 rounded-2xl border border-stone-200/80 dark:border-stone-850/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold font-fredoka text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Kelola Akun Panitia & Hak Akses</span>
            <Badge variant="festival" className="text-[10px]">
              SUPER ADMIN
            </Badge>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-baloo">
            Kelola kredensial panitia pelaksana dan batasan event yang dapat mereka akses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>

          <Button
            onClick={handleCreate}
            variant="festival"
            size="sm"
            className="text-xs shadow-md"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Tambah Panitia Baru
          </Button>
        </div>
      </div>

      {/* Search & Info */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama atau email panitia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-[#201813] border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="text-xs text-stone-500 font-baloo">
          Total Akun: <span className="font-bold text-stone-800 dark:text-stone-200">{admins.length} Pengguna</span>
        </div>
      </div>

      {/* Admins Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200/90 dark:border-stone-850/90 bg-white dark:bg-[#201813] shadow-xs">
        <table className="w-full text-left text-xs font-baloo">
          <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
            <tr>
              <th className="px-4 py-3">Nama & Email</th>
              <th className="px-4 py-3">Peran (Role)</th>
              <th className="px-4 py-3">Izin Akses Event</th>
              <th className="px-4 py-3">Dibuat Pada</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                  {isLoading ? 'Memuat data akun admin...' : 'Tidak ada akun panitia yang ditemukan.'}
                </td>
              </tr>
            ) : (
              filteredAdmins.map((adm) => {
                const isSelf = adm.id === user?.id || adm.email === user?.email;
                const isSuper = adm.role === 'super_admin';
                const hasAllAccess = isSuper || !adm.assigned_event_ids || adm.assigned_event_ids.length === 0;

                return (
                  <tr key={adm.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-850/50 transition-colors">
                    {/* Nama & Email */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span>{adm.nama}</span>
                        {isSelf && (
                          <span className="text-[10px] font-fredoka px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                            Anda
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-stone-500 text-[11px]">
                        {adm.email}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <Badge variant={isSuper ? 'festival' : 'info'} className="text-[10px]">
                        {isSuper ? 'SUPER ADMIN' : 'PANITIA / ADMIN'}
                      </Badge>
                    </td>

                    {/* Event Access */}
                    <td className="px-4 py-3.5 max-w-xs">
                      {hasAllAccess ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          Semua Event Kobar Expo
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                            {adm.assigned_event_ids.length} Event Terpilih:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {adm.assigned_event_ids.map((evtId) => {
                              const evt = events.find((e) => e.id === evtId);
                              return (
                                <span
                                  key={evtId}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 truncate max-w-[150px]"
                                >
                                  {evt?.nama || evtId}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Tanggal */}
                    <td className="px-4 py-3.5 text-stone-500 text-xs">
                      {formatDateIndo(adm.created_at).split(',')[0]}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          onClick={() => handleEdit(adm)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 text-stone-600 hover:text-amber-600"
                          title="Edit Akun"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        <Button
                          onClick={() => handleDelete(adm.id, adm.email)}
                          variant="ghost"
                          size="sm"
                          disabled={isSelf} // Self delete forbidden!
                          className={`p-1.5 ${
                            isSelf
                              ? 'opacity-30 cursor-not-allowed text-stone-300'
                              : 'text-stone-400 hover:text-rose-600'
                          }`}
                          title={isSelf ? 'Anda tidak dapat menghapus akun Anda sendiri' : 'Hapus Akun'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add/Edit Admin */}
      <AdminUserModal
        isOpen={isModalOpen}
        admin={selectedAdminForEdit}
        events={events}
        currentUserId={user?.id || ''}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
};
