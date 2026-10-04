import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatRupiah, formatDateIndo } from '../lib/utils';
import { EventItem, Registration } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { eventService } from '../lib/services/eventService';
import { registrationService } from '../lib/services/registrationService';
import { 
  CalendarDays, 
  Users, 
  Wallet, 
  TrendingUp, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

export const AdminDashboardPage: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { isSuperAdmin, accessibleEventIds, hasAccessToAll } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Filter events based on admin permission
  const filteredEvents = events.filter((evt) => {
    if (isSuperAdmin || hasAccessToAll) return true;
    return accessibleEventIds.includes(evt.id);
  });

  // Calculate totals
  const totalEvents = filteredEvents.length;
  const totalRegistrations = filteredEvents.reduce((acc, curr) => acc + (curr.total_pendaftar || 0), 0);
  
  // Rule: Pendapatan per event = harga * jumlah pendaftar Lunas
  // Total Pendapatan = sum of all event revenues
  const totalRevenue = filteredEvents.reduce((acc, curr) => {
    const lunasCount = curr.total_lunas || 0;
    return acc + curr.harga * lunasCount;
  }, 0);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const [eventsList, regList] = await Promise.all([
        eventService.getEvents(),
        registrationService.getRegistrations(),
      ]);
      setEvents(eventsList);
      setRecentRegistrations(regList.slice(0, 6));
    } catch (err) {
      console.error('Error fetching dashboard live data:', err);
    }
    setLastRefreshed(new Date());
    setIsRefreshing(false);
  };

  // Auto-refresh every 15 seconds & on initial mount
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#201813] p-4 rounded-2xl border border-stone-200/80 dark:border-stone-850/80 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold font-fredoka text-stone-900 dark:text-stone-100">
            Dasbor Utama EOMS KOBAR EXPO
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-baloo">
            Terakhir diperbarui: {lastRefreshed.toLocaleTimeString('id-ID')} &bull; Auto-refresh 15 detik aktif
          </p>
        </div>

        <Button
          onClick={loadDashboardData}
          variant="outline"
          size="sm"
          isLoading={isRefreshing}
          className="self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Event */}
        <Card className="border-l-4 border-l-amber-500 bg-white dark:bg-[#201813]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-fredoka">
                Total Event Terkelola
              </p>
              <p className="text-3xl font-extrabold font-fredoka text-stone-900 dark:text-stone-100 mt-1">
                {totalEvents}
              </p>
              <p className="text-[11px] text-stone-500 mt-1 font-baloo">
                {isSuperAdmin ? 'Seluruh event agenda Kobar' : 'Event yang diberi izin akses'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Card 2: Total Pendaftar */}
        <Card className="border-l-4 border-l-teal-600 bg-white dark:bg-[#201813]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-fredoka">
                Total Pendaftar Masuk
              </p>
              <p className="text-3xl font-extrabold font-fredoka text-stone-900 dark:text-stone-100 mt-1">
                {totalRegistrations}
              </p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-baloo font-medium">
                Partisipan & Peserta Terdaftar
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Card 3: Total Pendapatan */}
        <Card className="border-l-4 border-l-emerald-600 bg-white dark:bg-[#201813]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-fredoka">
                Total Pendapatan Terkumpul
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold font-fredoka text-emerald-700 dark:text-emerald-400 mt-1">
                {formatRupiah(totalRevenue)}
              </p>
              <p className="text-[11px] text-stone-500 mt-1 font-baloo">
                Akumulasi dari peserta berstatus <span className="font-semibold text-emerald-600">Lunas</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Event Summary Table + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Event Performance Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Rincian Event & Pendapatan</span>
            </h3>
            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-baloo"
            >
              <span>Kelola Event</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200/90 dark:border-stone-850/90 bg-white dark:bg-[#201813] shadow-xs">
            <table className="w-full text-left text-xs font-baloo">
              <thead className="bg-stone-50 dark:bg-stone-900/50 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="px-4 py-3">Nama Event</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Pendaftar</th>
                  <th className="px-4 py-3">Lunas</th>
                  <th className="px-4 py-3 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-stone-400 font-baloo">
                      Belum ada kegiatan yang dibuat di database. Silakan klik "Kelola Event" untuk membuat kegiatan pertama Anda.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => {
                    const lunas = evt.total_lunas || 0;
                    const revenue = evt.harga * lunas;

                    return (
                      <tr key={evt.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-850/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-stone-900 dark:text-stone-100 max-w-xs truncate">
                          {evt.nama}
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-300">
                          {formatRupiah(evt.harga)}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-700 dark:text-stone-300">
                          {evt.total_pendaftar || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {lunas}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-stone-900 dark:text-stone-100">
                          {formatRupiah(revenue)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: 6 Aktivitas Pendaftaran Terbaru */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>6 Pendaftar Terbaru</span>
            </h3>
            <button
              onClick={() => onNavigateTab('registrations')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-baloo"
            >
              <span>Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Card className="bg-white dark:bg-[#201813] divide-y divide-stone-100 dark:divide-stone-850 p-0 overflow-hidden">
            {recentRegistrations.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs font-baloo">
                Belum ada data pendaftar baru yang tercatat.
              </div>
            ) : (
              recentRegistrations.slice(0, 6).map((reg) => (
                <div key={reg.id} className="p-3.5 hover:bg-stone-50/80 dark:hover:bg-stone-850/60 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {reg.reg_id}
                    </span>
                    <Badge
                      variant={
                        reg.status_bayar === 'Lunas'
                          ? 'success'
                          : reg.status_bayar === 'Verifikasi Proses'
                          ? 'warning'
                          : 'danger'
                      }
                      className="text-[10px] py-0"
                    >
                      {reg.status_bayar}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate font-baloo">
                    {reg.nama}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-baloo">
                    <span className="truncate max-w-[170px]">{reg.event_nama}</span>
                    <span className="shrink-0">{formatDateIndo(reg.created_at).split(',')[0]}</span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
