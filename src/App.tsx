import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, Calendar, Phone, Stethoscope, Sparkles, 
  Building2, Server, Clock, MapPin, ShieldCheck, HeartPulse, 
  HelpCircle, CheckCircle2, ChevronRight, Activity
} from 'lucide-react';
import { initialClinicConfig, sampleInitialAppointments, sampleInitialCallLogs } from './data/initialData';
import { ClinicConfig, Appointment, CallLog, ExtractedAppointment } from './types';
import { PhoneCallSimulator } from './components/PhoneCallSimulator';
import { AppointmentsManager } from './components/AppointmentsManager';
import { CallHistoryCRM } from './components/CallHistoryCRM';
import { ClinicSettings } from './components/ClinicSettings';
import { VoiceTestingStudio } from './components/VoiceTestingStudio';
import { BookingConfirmationModal } from './components/BookingConfirmationModal';
import { IntegrationGuideModal } from './components/IntegrationGuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'phone' | 'appointments' | 'crm' | 'settings' | 'voice_test'>('phone');
  const [clinicConfig, setClinicConfig] = useState<ClinicConfig>(initialClinicConfig);
  const [appointments, setAppointments] = useState<Appointment[]>(sampleInitialAppointments);
  const [callLogs, setCallLogs] = useState<CallLog[]>(sampleInitialCallLogs);
  
  // Modals
  const [showIntegrationGuide, setShowIntegrationGuide] = useState(false);
  const [latestBookedAppointment, setLatestBookedAppointment] = useState<Appointment | null>(null);

  // Sync clinic config from server on mount
  useEffect(() => {
    fetch('/api/clinic/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setClinicConfig(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.warn('Using local clinic config:', err));
  }, []);

  // When AI Call extracts and finalizes a booking
  const handleNewAppointmentFromAI = (extracted: ExtractedAppointment) => {
    const matchingDoctor = clinicConfig.doctors.find(d => 
      d.name === extracted.doctorName || d.specialty === extracted.specialty
    ) || clinicConfig.doctors[0];

    const cleanPhone = extracted.phone || '0550 00 00 00';
    const formattedPhone = cleanPhone.startsWith('+213') ? cleanPhone : `+213 ${cleanPhone.replace(/^0/, '')}`;

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      patientName: extracted.patientName || 'مريض هاتف',
      phone: cleanPhone,
      doctorName: matchingDoctor.name,
      specialty: matchingDoctor.specialty,
      date: extracted.requestedDay || 'اليوم',
      time: extracted.requestedTime || '10:00',
      status: 'confirmed',
      carteChifa: true,
      notes: extracted.symptoms || 'حجز آلي عبر مكالمة هاتفية مع الوكيل الصوتي',
      triageLevel: 'normal',
      source: 'ai_phone',
      createdAt: 'الآن (مكالمة هاتفية)',
      whatsappReminder: {
        status: 'scheduled',
        scheduledTime: 'قبل 24 ساعة من الموعد',
        phoneFormatted: formattedPhone,
        messagePreview: `تذكير بموعدكم (${extracted.requestedDay || 'اليوم'} في ${extracted.requestedTime || '10:00'}) مع ${matchingDoctor.name} في ${clinicConfig.name}.`
      }
    };

    setAppointments(prev => [newApt, ...prev]);
    setLatestBookedAppointment(newApt);
  };

  const handleUpdateAppointment = (updatedApt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updatedApt.id ? updatedApt : a));
  };

  const handleAddNewManualAppointment = (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
    setLatestBookedAppointment(apt);
  };

  const handleUpdateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleDeleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const handleCallLogged = (newCall: CallLog) => {
    setCallLogs(prev => [newCall, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-['Cairo',sans-serif]">
      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Right: Clinic Title and Algerian Flag Accent */}
            <div className="flex items-center gap-3.5 text-right">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 ring-4 ring-emerald-50">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg text-slate-800 leading-tight">
                    {clinicConfig.name}
                  </h1>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    الجزائر 🇩🇿
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{clinicConfig.commune} - {clinicConfig.wilaya}</span>
                  </span>
                  <span>•</span>
                  <span className="hidden sm:inline-flex items-center gap-1 font-mono text-slate-600">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{clinicConfig.phone.split('/')[0]}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Left: AI Status & Telecom Guide Button */}
            <div className="flex items-center gap-2">
              <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-700 font-semibold">وكيل الهاتف الذكي:</span>
                <span className="text-emerald-700 font-bold">ياسمين في الخدمة 24/7</span>
              </div>

              <button
                onClick={() => setShowIntegrationGuide(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 transition shadow-sm active:scale-95"
              >
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">ربط الخطوط الهاتفية</span>
                <span className="sm:hidden">الربط</span>
              </button>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-t border-slate-100 py-2.5 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab('phone')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
                activeTab === 'phone'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              <span>محاكي المكالمات الهاتفية المباشر</span>
            </button>

            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
                activeTab === 'appointments'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>أجندة مواعيد المرضى ({appointments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
                activeTab === 'crm'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>سجل المكالمات والفرز الطبي ({callLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>معلومات العيادة، الأطباء والعناوين</span>
            </button>

            <button
              onClick={() => setActiveTab('voice_test')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0 ${
                activeTab === 'voice_test'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>استوديو اختبار الرد الصوتي والمعلومات</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'phone' && (
          <PhoneCallSimulator
            clinicConfig={clinicConfig}
            onNewAppointmentBooked={handleNewAppointmentFromAI}
            onCallLogged={handleCallLogged}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsManager
            appointments={appointments}
            clinicConfig={clinicConfig}
            onUpdateStatus={handleUpdateStatus}
            onAddNewAppointment={handleAddNewManualAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateAppointment={handleUpdateAppointment}
          />
        )}

        {activeTab === 'crm' && (
          <CallHistoryCRM calls={callLogs} />
        )}

        {activeTab === 'settings' && (
          <ClinicSettings
            config={clinicConfig}
            onSaveConfig={(newConfig) => setClinicConfig(newConfig)}
          />
        )}

        {activeTab === 'voice_test' && (
          <VoiceTestingStudio clinicConfig={clinicConfig} />
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200/80 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-2">
          <span>نظام الاستقبال والمكالمات الذكي للعيادات والمراكز الطبية في الجزائر</span>
          <span>•</span>
          <span className="font-semibold text-emerald-700">مدعوم بالذكاء الاصطناعي والصوت الفوري Gemini</span>
          <span>•</span>
          <span>دعم الدارجة الجزائرية، الفرنسية والعربية</span>
        </p>
      </footer>

      {/* Modals */}
      {showIntegrationGuide && (
        <IntegrationGuideModal onClose={() => setShowIntegrationGuide(false)} />
      )}

      {latestBookedAppointment && (
        <BookingConfirmationModal
          appointment={latestBookedAppointment}
          clinicConfig={clinicConfig}
          onClose={() => setLatestBookedAppointment(null)}
        />
      )}
    </div>
  );
}
