import React, { useState, useEffect } from 'react';
import { EventItem } from '../../types/database';
import { eventService } from '../../lib/services/eventService';
import { formFieldService } from '../../lib/services/formFieldService';
import { 
  emailInvoiceService, 
  EmailTemplateItem, 
  InvoiceTemplateItem 
} from '../../lib/services/emailInvoiceService';
import { EmailTemplateEditor } from '../../components/admin/templates/EmailTemplateEditor';
import { InvoiceTemplateEditor } from '../../components/admin/templates/InvoiceTemplateEditor';
import { GoogleWorkspaceConnectCard } from '../../components/admin/templates/GoogleWorkspaceConnectCard';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  FileText, 
  Calendar, 
  Sparkles,
  Settings
} from 'lucide-react';

export const AdminTemplatesPage: React.FC = () => {
  const { isSuperAdmin, accessibleEventIds, hasAccessToAll } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'email' | 'invoice'>('email');

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplateItem[]>([]);
  const [invoiceTemplate, setInvoiceTemplate] = useState<InvoiceTemplateItem | null>(null);
  const [dynamicFieldLabels, setDynamicFieldLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      const data = await eventService.getEvents();
      const filtered = data.filter((e) => isSuperAdmin || hasAccessToAll || accessibleEventIds.includes(e.id));
      setEvents(filtered);
      if (filtered.length > 0 && !selectedEventId) {
        setSelectedEventId(filtered[0].id);
      }
    };
    loadEvents();
  }, [isSuperAdmin, hasAccessToAll, accessibleEventIds]);

  // Load templates & dynamic fields for selected event
  useEffect(() => {
    if (!selectedEventId) return;

    const loadAll = async () => {
      setLoading(true);

      const [eTemplates, invTemplate, fields] = await Promise.all([
        emailInvoiceService.getEmailTemplates(selectedEventId),
        emailInvoiceService.getInvoiceTemplate(selectedEventId),
        formFieldService.getFormFields(selectedEventId, 'Pendaftaran'),
      ]);

      setEmailTemplates(eTemplates);
      setInvoiceTemplate(invTemplate);
      setDynamicFieldLabels(
        fields
          .filter((f) => !['Judul', 'Link', 'Gambar'].includes(f.tipe) && f.label)
          .map((f) => f.label)
      );

      setLoading(false);
    };

    loadAll();
  }, [selectedEventId]);

  const handleSaveEmailTemplate = async (template: EmailTemplateItem): Promise<boolean> => {
    const res = await emailInvoiceService.saveEmailTemplate(template);
    return res.success;
  };

  const handleSaveInvoiceTemplate = async (template: InvoiceTemplateItem): Promise<boolean> => {
    const res = await emailInvoiceService.saveInvoiceTemplate(template);
    return res.success;
  };

  return (
    <div className="space-y-6 font-baloo">
      {/* Top Banner & Event Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#201813] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-850/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold font-fredoka text-stone-900 dark:text-stone-100">
              Template Email & Invoice PDF
            </h1>
            <Badge variant="festival" className="text-[10px]">
              Tahap 6
            </Badge>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Konfigurasi otomatisasi pengiriman email via Resend, tiket visual HTML, dan layout invoice resmi.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full lg:w-80 px-3 py-2 text-xs font-semibold rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-baloo focus:outline-none focus:border-amber-500 truncate"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tabs: Email Otomatis vs Template Invoice PDF */}
      <div className="flex gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-fredoka transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'email'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white dark:bg-[#201813] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Tab 1: Email Otomatis (Google Workspace & Resend)</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-fredoka transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'invoice'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#201813] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tab 2: Template Invoice PDF</span>
        </button>
      </div>

      {/* Google Workspace Connection Card if in email tab */}
      {activeTab === 'email' && (
        <GoogleWorkspaceConnectCard />
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="py-12 text-center text-stone-400 text-xs">
          Memuat template dan placeholder dinamis...
        </div>
      ) : activeTab === 'email' ? (
        <EmailTemplateEditor
          templates={emailTemplates}
          dynamicFieldLabels={dynamicFieldLabels}
          onSaveTemplate={handleSaveEmailTemplate}
        />
      ) : invoiceTemplate ? (
        <InvoiceTemplateEditor
          template={invoiceTemplate}
          dynamicFieldLabels={dynamicFieldLabels}
          onSaveTemplate={handleSaveInvoiceTemplate}
        />
      ) : null}
    </div>
  );
};
