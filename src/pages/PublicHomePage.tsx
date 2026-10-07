import React, { useState, useEffect } from 'react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicHero } from '../components/public/PublicHero';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatRupiah } from '../lib/utils';
import { EventItem, Registration } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { eventService } from '../lib/services/eventService';
import { registrationService } from '../lib/services/registrationService';
import { RegistrationFormModal } from '../components/public/RegistrationFormModal';
import { InvitationModal } from '../components/public/InvitationModal';
import { RegistrationSuccessModal, RegistrationSuccessData } from '../components/public/RegistrationSuccessModal';
import { SubsequentPaymentModal } from '../components/public/SubsequentPaymentModal';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Lock, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
  CreditCard,
  Sparkles
} from 'lucide-react';

interface PublicHomePageProps {
  onNavigateAdmin: () => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({ onNavigateAdmin }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Status Check State
  const [searchRegId, setSearchRegId] = useState('');
  const [statusResult, setStatusResult] = useState<Registration | null>(null);
  const [statusSearching, setStatusSearching] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Modal States
  const [selectedEventForRegister, setSelectedEventForRegister] = useState<EventItem | null>(null);
  const [invitationCodeForRegister, setInvitationCodeForRegister] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [selectedEventForInvitation, setSelectedEventForInvitation] = useState<EventItem | null>(null);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);

  const [successData, setSuccessData] = useState<RegistrationSuccessData | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [selectedRegForPayment, setSelectedRegForPayment] = useState<Registration | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Load events from database (Supabase or local event service)
  const fetchEvents = async () => {
    setLoading(true);
    const data = await eventService.getEvents();
    // Only show published events (Buka / Tutup, hide Draft for public)
    const publicEvents = data.filter((e) => e.status !== 'Draft');
    setEvents(publicEvents);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearchStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRegId.trim()) return;

    setStatusSearching(true);
    setStatusError(null);
    setStatusResult(null);

    const cleanId = searchRegId.trim().toUpperCase();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select('*, events(nama, harga, bayar_lanjut, tanggal, lokasi)')
          .eq('reg_id', cleanId)
          .single();

        if (error || !data) {
          setStatusError('Nomor registrasi tidak ditemukan. Pastikan format sesuai (contoh: EVT-2026-00001).');
        } else {
          setStatusResult({
            ...data,
            event_nama: data.events?.nama,
            event_harga: data.events?.harga,
            event_bayar_lanjut: data.events?.bayar_lanjut,
          });
        }
      } catch (err) {
        setStatusError('Terjadi kendala jaringan saat memeriksa status registrasi.');
      }
    } else {
      // Query local storage actual registrations if offline
      const allRegs = await registrationService.getRegistrations();
      const match = allRegs.find((r: Registration) => r.reg_id.toUpperCase() === cleanId);
      if (match) {
        setStatusResult(match);
      } else {
        setStatusError('Nomor registrasi tidak ditemukan. Pastikan nomor pendaftaran Anda sesuai.');
      }
    }

    setStatusSearching(false);
  };

  const handleEventActionClick = (event: EventItem) => {
    if (event.status === 'Tutup') return;

    if (event.mode_akses === 'Undangan') {
      setSelectedEventForInvitation(event);
      setIsInvitationModalOpen(true);
    } else {
      setSelectedEventForRegister(event);
      setInvitationCodeForRegister(null);
      setIsRegisterModalOpen(true);
    }
  };

  const handleInvitationCodeValidated = (validCode: string) => {
    if (selectedEventForInvitation) {
      setSelectedEventForRegister(selectedEventForInvitation);
      setInvitationCodeForRegister(validCode);
      setIsRegisterModalOpen(true);
    }
  };

  const handleRegistrationSuccess = (data: RegistrationSuccessData) => {
    setSuccessData(data);
    setIsSuccessModalOpen(true);
    // Auto-fill status check with newly registered ID
    setSearchRegId(data.reg_id);
    fetchEvents();
  };

  const scrollToEvents = () => {
    document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToStatus = () => {
    document.getElementById('status-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-festival-pattern flex flex-col transition-colors">
      {/* Public Navbar */}
      <PublicNavbar
        onNavigateAdmin={onNavigateAdmin}
        onScrollToEvents={scrollToEvents}
        onScrollToStatus={scrollToStatus}
      />

      {/* Hero Section */}
      <PublicHero
        onExploreClick={scrollToEvents}
        onCheckStatusClick={scrollToStatus}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex-1 w-full space-y-16">
        
        {/* SECTION 1: Cek Status Pendaftaran */}
        <section id="status-section" className="scroll-mt-24">
          <Card className="max-w-3xl mx-auto border-2 border-amber-300/80 dark:border-amber-800/80 shadow-md bg-white/95 dark:bg-[#201813]/95 backdrop-blur-md">
            <CardHeader className="text-center pb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto mb-2">
                <Search className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl">Cek Status Pendaftaran Peserta</CardTitle>
              <CardDescription>
                Masukkan nomor registrasi unik Anda untuk memeriksa verifikasi berkas dan status pembayaran
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <form onSubmit={handleSearchStatus} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                <Input
                  placeholder="Contoh: EVT-2026-00001"
                  value={searchRegId}
                  onChange={(e) => setSearchRegId(e.target.value)}
                  className="font-mono text-center sm:text-left uppercase font-bold tracking-wider text-sm"
                />
                <Button
                  type="submit"
                  variant="festival"
                  isLoading={statusSearching}
                  className="shrink-0"
                >
                  <Search className="w-4 h-4 mr-1.5" />
                  Cek Status
                </Button>
              </form>

              {statusError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 max-w-lg mx-auto font-baloo">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}

              {/* Status Result Display */}
              {statusResult && (
                <div className="mt-4 p-5 rounded-2xl bg-stone-50 dark:bg-[#18120E] border-2 border-stone-200 dark:border-stone-800 space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 gap-2">
                    <div>
                      <p className="text-xs text-stone-500 font-mono">Nomor Registrasi Resmi</p>
                      <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                        {statusResult.reg_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Payment Status: Lunas=Hijau, Verifikasi=Kuning, Lainnya=Merah */}
                      <Badge
                        variant={
                          statusResult.status_bayar === 'Lunas'
                            ? 'success'
                            : statusResult.status_bayar === 'Verifikasi Proses'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {statusResult.status_bayar === 'Lunas' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {statusResult.status_bayar === 'Verifikasi Proses' && <Clock className="w-3.5 h-3.5" />}
                        <span>Bayar: {statusResult.status_bayar}</span>
                      </Badge>

                      {/* Graduation Status: Belum Lulus=Abu, Lainnya=Biru */}
                      <Badge
                        variant={statusResult.status_lulus === 'Belum Lulus' ? 'neutral' : 'info'}
                      >
                        <span>Kelulusan: {statusResult.status_lulus}</span>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-baloo">
                    <div>
                      <p className="text-xs text-stone-500">Nama Peserta / Perwakilan</p>
                      <p className="font-bold text-stone-800 dark:text-stone-200">{statusResult.nama}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Kegiatan / Event</p>
                      <p className="font-bold text-stone-800 dark:text-stone-200">{statusResult.event_nama || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Kontak WhatsApp</p>
                      <p className="font-mono text-stone-700 dark:text-stone-300">{statusResult.wa}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Biaya Pendaftaran / Sewa</p>
                      <p className="font-bold text-teal-600 dark:text-teal-400">
                        {formatRupiah(statusResult.event_harga || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Button Condition (Rules section 4):
                      Tombol "Bayar" hanya muncul jika status_lulus = 'Lulus' DAN status_bayar BUKAN 'Lunas' / 'Verifikasi Proses' */}
                  {statusResult.status_lulus === 'Lulus' &&
                    statusResult.status_bayar !== 'Lunas' &&
                    statusResult.status_bayar !== 'Verifikasi Proses' && (
                      <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-baloo">
                          <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                          <span>Selamat! Anda dinyatakan <strong>Lulus</strong> kurasi. Silakan selesaikan pembayaran lanjutan sewa booth Anda.</span>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedRegForPayment(statusResult);
                            setIsPaymentModalOpen(true);
                          }}
                          variant="festival"
                          size="sm"
                          className="shrink-0 text-xs shadow-md font-bold"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          Lanjutkan Pembayaran
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* SECTION 2: Grid Event Terbuka */}
        <section id="events-section" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="festival-ribbon text-xs bg-teal-500 text-white px-2.5 py-0.5 rounded-full font-bold">
                  Agenda Resmi
                </span>
                <span className="text-xs font-mono text-stone-500">Terbuka untuk Pendaftaran</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-fredoka text-stone-900 dark:text-stone-100 mt-1">
                Daftar Kegiatan KOBAR EXPO 2026
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-baloo max-w-sm">
              Pilih event di bawah untuk mendaftar secara online tanpa perlu membuat akun.
            </p>
          </div>

          {/* Skeleton Loader while loading */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((sk) => (
                <div
                  key={sk}
                  className="rounded-3xl border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-[#221914] overflow-hidden animate-pulse flex flex-col"
                >
                  <div className="aspect-video w-full bg-stone-200 dark:bg-stone-800" />
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded-lg w-3/4" />
                      <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-lg w-1/2" />
                      <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-lg w-2/3" />
                    </div>
                    <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded-xl w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 space-y-3 font-baloo">
              <Calendar className="w-10 h-10 text-stone-400 mx-auto opacity-50" />
              <h3 className="font-fredoka font-bold text-base text-stone-800 dark:text-stone-200">
                Belum Ada Kegiatan yang Dibuka
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Belum ada kegiatan yang dipublikasikan di database. Masuk ke Portal Admin untuk membuat agenda kegiatan pertama Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const isClosed = event.status === 'Tutup';
                const isInvitation = event.mode_akses === 'Undangan';
                const isFull = event.kuota !== null && (event.total_pendaftar || 0) >= event.kuota;

                return (
                  <div
                    key={event.id}
                    className={`group rounded-3xl border-2 transition-all duration-200 overflow-hidden flex flex-col ${
                      isClosed
                        ? 'border-stone-300 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/60 opacity-75'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#221914] hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-600'
                    }`}
                  >
                    {/* Banner Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-stone-200 dark:bg-stone-800">
                      <img
                        src={event.banner_url || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80'}
                        alt={event.nama}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isClosed ? 'grayscale' : 'group-hover:scale-105'
                        }`}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isInvitation && (
                            <Badge variant="warning" className="shadow-sm">
                              <Lock className="w-3 h-3" />
                              <span>Undangan</span>
                            </Badge>
                          )}
                          {event.bayar_lanjut && (
                            <Badge variant="info" className="shadow-sm">
                              <span>Bayar Lanjutan</span>
                            </Badge>
                          )}
                        </div>

                        <Badge
                          variant={isClosed ? 'danger' : 'success'}
                          className="shadow-sm font-fredoka uppercase text-[10px]"
                        >
                          {event.status}
                        </Badge>
                      </div>

                      {/* Price tag on banner bottom right */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-stone-900/85 backdrop-blur-xs text-white font-fredoka font-bold text-sm shadow-sm">
                        {formatRupiah(event.harga)}
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-fredoka font-bold text-lg text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                          {event.nama}
                        </h3>

                        <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400 font-baloo">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{event.tanggal}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{event.lokasi}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>
                              Kuota: {event.total_pendaftar || 0} / {event.kuota ? `${event.kuota} Peserta` : 'Tanpa Batas'}
                              {isFull && <span className="text-rose-500 font-bold ml-1">(Penuh)</span>}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                        <Button
                          disabled={isClosed || isFull}
                          variant={isClosed ? 'outline' : 'festival'}
                          className="w-full text-xs py-2.5 font-bold"
                          onClick={() => handleEventActionClick(event)}
                        >
                          {isClosed ? (
                            'Pendaftaran Ditutup'
                          ) : isFull ? (
                            'Kuota Penuh'
                          ) : isInvitation ? (
                            <>
                              <Lock className="w-3.5 h-3.5 mr-1.5" />
                              Daftar dengan Kode Undangan
                            </>
                          ) : (
                            <>
                              Daftar Sekarang
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Public Footer */}
      <footer className="mt-16 border-t-2 border-amber-200/50 dark:border-stone-800 bg-white/60 dark:bg-[#18120E]/60 py-8 px-4 text-center">
        <p className="font-fredoka font-bold text-sm text-stone-800 dark:text-stone-200">
          KOBAR EXPO 2026 &bull; EVENT ORGANIZER MANAGEMENT SYSTEM
        </p>
      </footer>

      {/* MODAL 1: Kode Undangan (jika mode_akses === 'Undangan') */}
      <InvitationModal
        isOpen={isInvitationModalOpen}
        event={selectedEventForInvitation}
        onClose={() => setIsInvitationModalOpen(false)}
        onCodeValidated={handleInvitationCodeValidated}
      />

      {/* MODAL 2: Form Pendaftaran Dinamis */}
      <RegistrationFormModal
        isOpen={isRegisterModalOpen}
        event={selectedEventForRegister}
        invitationCode={invitationCodeForRegister}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* MODAL 3: Layar Sukses & Simpan Tiket PNG */}
      <RegistrationSuccessModal
        isOpen={isSuccessModalOpen}
        data={successData}
        onClose={() => setIsSuccessModalOpen(false)}
      />

      {/* MODAL 4: Form Pembayaran Lanjutan (setelah lulus) */}
      <SubsequentPaymentModal
        isOpen={isPaymentModalOpen}
        registration={selectedRegForPayment}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          if (statusResult) {
            setStatusResult({
              ...statusResult,
              status_bayar: 'Verifikasi Proses',
            });
          }
        }}
      />
    </div>
  );
};
