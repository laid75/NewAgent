import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, User, Phone, CheckCircle, XCircle, 
  AlertCircle, Search, Plus, Filter, Download, Trash2, Edit3, ShieldCheck,
  TrendingUp, Users, Activity, BarChart3, PieChart as PieChartIcon,
  MessageSquare, Send, Check, AlertTriangle, ExternalLink, RefreshCw,
  ChevronLeft, ChevronRight, LayoutList, CalendarDays, Eye, FileSpreadsheet, FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar
} from 'recharts';
import { Appointment, ClinicConfig } from '../types';
import { AppointmentsAnalytics } from './AppointmentsAnalytics';

interface AppointmentsManagerProps {
  appointments: Appointment[];
  clinicConfig: ClinicConfig;
  onUpdateStatus: (id: string, newStatus: Appointment['status']) => void;
  onAddNewAppointment: (apt: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdateAppointment?: (updatedApt: Appointment) => void;
}

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({
  appointments,
  clinicConfig,
  onUpdateStatus,
  onAddNewAppointment,
  onDeleteAppointment,
  onUpdateAppointment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // View Mode: 'list' (Table) or 'calendar' (Monthly Calendar) or 'analytics' (Flow & Charts)
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'analytics'>('analytics');

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(() => new Date().getDate());

  // WhatsApp Reminder Modal state
  const [selectedAptForWhatsApp, setSelectedAptForWhatsApp] = useState<Appointment | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccessMessage, setWhatsAppSuccessMessage] = useState<string | null>(null);

  // New appointment form state
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('05');
  const [newDoctorId, setNewDoctorId] = useState(clinicConfig.doctors[0]?.id || '');
  const [newDate, setNewDate] = useState('اليوم');
  const [newTime, setNewTime] = useState('10:00');
  const [newChifa, setNewChifa] = useState(true);
  const [newNotes, setNewNotes] = useState('');

  const selectedDoctorObj = clinicConfig.doctors.find(d => d.id === newDoctorId);

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.phone.includes(searchTerm) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.specialty.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDoctor = filterDoctor === 'ALL' || apt.doctorName === filterDoctor;
    const matchesStatus = filterStatus === 'ALL' || apt.status === filterStatus;

    return matchesSearch && matchesDoctor && matchesStatus;
  });

  // WhatsApp Dispatch Handler
  const handleTriggerWhatsApp = async (apt: Appointment) => {
    setIsSendingWhatsApp(true);
    try {
      const res = await fetch('/api/reminders/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: apt.id,
          patientName: apt.patientName,
          phone: apt.phone,
          doctorName: apt.doctorName,
          specialty: apt.specialty,
          date: apt.date,
          time: apt.time,
          clinicName: clinicConfig.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedApt: Appointment = {
          ...apt,
          whatsappReminder: {
            status: 'sent',
            sentAt: data.sentAt,
            phoneFormatted: data.phoneFormatted,
            messagePreview: data.messageText
          }
        };

        if (onUpdateAppointment) {
          onUpdateAppointment(updatedApt);
        }

        setSelectedAptForWhatsApp(updatedApt);
        setWhatsAppSuccessMessage('تم إرسال تذكير الموعد (قبل 24 ساعة) بنجاح عبر خدمة واتساب للمريض!');
        setTimeout(() => setWhatsAppSuccessMessage(null), 6000);
      }
    } catch (e) {
      console.error('Failed to trigger WhatsApp reminder:', e);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Export to CSV Function (UTF-8 with BOM for Arabic support in Excel)
  const handleExportCSV = () => {
    const listToExport = filteredAppointments.length > 0 ? filteredAppointments : appointments;
    if (listToExport.length === 0) return;

    const headers = [
      'اسم المريض',
      'رقم الهاتف',
      'الطبيب المعالج',
      'التخصص الطبي',
      'تاريخ الموعد',
      'توقيت الموعد',
      'بطاقة الشفاء (CNAS/CASNOS)',
      'مصدر الحجز',
      'حالة الموعد',
      'حالة تذكير واتساب',
      'ملاحظات الزيارة'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const text = String(str).replace(/"/g, '""');
      return `"${text}"`;
    };

    const rows = listToExport.map(a => [
      escapeCsv(a.patientName),
      escapeCsv(a.phone),
      escapeCsv(a.doctorName),
      escapeCsv(a.specialty),
      escapeCsv(a.date),
      escapeCsv(a.time),
      escapeCsv(a.carteChifa ? 'نعم (مقبولة)' : 'بدون بطاقة'),
      escapeCsv(a.source === 'ai_phone' ? 'مكالمة هاتفية AI' : 'أمانة العيادة'),
      escapeCsv(a.status === 'confirmed' ? 'مؤكد' : a.status === 'completed' ? 'مكتمل' : 'ملغى'),
      escapeCsv(a.whatsappReminder?.status === 'sent' ? `تم الإرسال (${a.whatsappReminder.sentAt || ''})` : 'مجدول آلياً قبل 24h'),
      escapeCsv(a.notes || '')
    ]);

    // Prepend UTF-8 BOM (\uFEFF) so Excel properly renders Arabic characters
    const csvContent = '\uFEFF' + [
      headers.map(h => escapeCsv(h)).join(','),
      ...rows.map(row => row.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `قائمة_مواعيد_عيادة_الأمل_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Excel HTML format (.xls) readable directly by Microsoft Excel
  const handleExportExcel = () => {
    const listToExport = filteredAppointments.length > 0 ? filteredAppointments : appointments;
    if (listToExport.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>مواعيد العيادة</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; }
          table { border-collapse: collapse; width: 100%; direction: rtl; }
          th { background-color: #059669; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #047857; text-align: center; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 12px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .title { font-size: 18px; font-weight: bold; color: #065f46; text-align: center; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="title">${clinicConfig.name} - سجل المواعيد الطبية المجدولة (${todayStr})</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المريض</th>
              <th>رقم الهاتف</th>
              <th>الطبيب المعالج</th>
              <th>التخصص</th>
              <th>تاريخ الموعد</th>
              <th>التوقيت</th>
              <th>بطاقة الشفاء</th>
              <th>المصدر</th>
              <th>الحالة</th>
              <th>تذكير واتساب</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${listToExport.map((a, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${a.patientName}</strong></td>
                <td style="mso-number-format:'\\@'; direction: ltr; text-align: center;">${a.phone}</td>
                <td>${a.doctorName}</td>
                <td>${a.specialty}</td>
                <td style="text-align: center;">${a.date}</td>
                <td style="text-align: center;">${a.time}</td>
                <td style="text-align: center;">${a.carteChifa ? 'نعم (CNAS)' : 'بدون'}</td>
                <td style="text-align: center;">${a.source === 'ai_phone' ? 'ذكاء اصطناعي' : 'الأمانة'}</td>
                <td style="text-align: center;">${a.status === 'confirmed' ? 'مؤكد' : a.status === 'completed' ? 'مكتمل' : 'ملغى'}</td>
                <td style="text-align: center;">${a.whatsappReminder?.status === 'sent' ? 'تم الإرسال' : 'مجدول (قبل 24h)'}</td>
                <td>${a.notes || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `سجل_مواعيد_عيادة_الأمل_${todayStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim()) return;

    const formattedPhone = newPatientPhone.startsWith('+213') 
      ? newPatientPhone 
      : `+213 ${newPatientPhone.replace(/^0/, '')}`;

    const newApt: Appointment = {
      id: 'apt-' + Date.now(),
      patientName: newPatientName,
      phone: newPatientPhone,
      doctorName: selectedDoctorObj?.name || 'د. عبد القادر مرابط',
      specialty: selectedDoctorObj?.specialty || 'طب عام',
      date: newDate,
      time: newTime,
      status: 'confirmed',
      carteChifa: newChifa,
      notes: newNotes || 'حجز مباشر من أمانة العيادة',
      triageLevel: 'normal',
      source: 'secretary',
      createdAt: 'الآن (أمانة العيادة)',
      whatsappReminder: {
        status: 'scheduled',
        scheduledTime: 'آلياً قبل 24 ساعة من الموعد',
        phoneFormatted: formattedPhone,
        messagePreview: `تذكير بموعدكم (${newDate} في ${newTime}) مع ${selectedDoctorObj?.name} في ${clinicConfig.name}.`
      }
    };

    onAddNewAppointment(newApt);
    setShowAddModal(false);
    setNewPatientName('');
    setNewNotes('');
  };

  // Recharts Metrics Calculation
  const stats = useMemo(() => {
    // 1. Today's appointments
    const todayApts = appointments.filter(a => a.date.includes('اليوم'));
    const todayCount = todayApts.length;

    // 2. New patients (e.g. AI phone callers or first-time registrations)
    const newPatientsCount = appointments.filter(a => 
      a.source === 'ai_phone' || a.notes?.includes('جديد') || a.createdAt.includes('الآن') || a.createdAt.includes('دقيقة')
    ).length;

    // 3. Occupancy Rate Calculation
    // Total available daily slots across all active doctors in clinic
    const totalDailyCapacity = clinicConfig.doctors.reduce((sum, doc) => sum + (doc.slots?.length || 6), 0);
    const occupancyRate = Math.min(Math.round((todayCount / (totalDailyCapacity || 18)) * 100), 100);

    // Hourly distribution data for today's chart
    const hourlyData = [
      { hour: '09:00', count: appointments.filter(a => a.time.startsWith('09')).length },
      { hour: '10:00', count: appointments.filter(a => a.time.startsWith('10')).length },
      { hour: '11:00', count: appointments.filter(a => a.time.startsWith('11')).length },
      { hour: '14:00', count: appointments.filter(a => a.time.startsWith('14')).length },
      { hour: '15:00', count: appointments.filter(a => a.time.startsWith('15')).length },
      { hour: '16:00', count: appointments.filter(a => a.time.startsWith('16')).length },
    ];

    // Radial Gauge Data for Occupancy
    const radialData = [
      { name: 'الإشغال', value: occupancyRate, fill: occupancyRate > 80 ? '#f59e0b' : '#10b981' }
    ];

    // Patient source distribution data for Pie Chart
    const patientDistribution = [
      { name: 'مرضى جدد (الهاتف والذكاء الاصطناعي)', value: newPatientsCount, color: '#10b981' },
      { name: 'متابعات سابقة (أمانة العيادة)', value: Math.max(appointments.length - newPatientsCount, 1), color: '#3b82f6' }
    ];

    return {
      todayCount,
      newPatientsCount,
      occupancyRate,
      totalDailyCapacity,
      hourlyData,
      radialData,
      patientDistribution
    };
  }, [appointments, clinicConfig]);

  // Calendar calculations
  const calendarData = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth(); // 0-indexed

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
    // In Algeria / Arab world, week starts on Saturday (السبت) or Sunday (الأحد)
    // Let's align week starting on Saturday: Saturday = 0, Sunday = 1, ..., Friday = 6
    const adjustedStartDay = (firstDayIndex + 1) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Map month names in Arabic and French
    const monthNamesAr = [
      'جانفي (Janvier)', 'فيفري (Février)', 'مارس (Mars)', 'أفريل (Avril)',
      'ماي (Mai)', 'جوان (Juin)', 'جويلية (Juillet)', 'أوت (Août)',
      'سبتمبر (Septembre)', 'أكتوبر (Octobre)', 'نوفمبر (Novembre)', 'ديسمبر (Décembre)'
    ];

    const currentMonthLabel = `${monthNamesAr[month]} ${year}`;

    // Helper to check if an appointment belongs to a particular calendar day
    const getAppointmentsForDay = (dayNumber: number) => {
      const today = new Date();
      const isCurrentMonthAndYear = today.getFullYear() === year && today.getMonth() === month;
      const isToday = isCurrentMonthAndYear && today.getDate() === dayNumber;
      const isTomorrow = isCurrentMonthAndYear && today.getDate() + 1 === dayNumber;

      return filteredAppointments.filter(apt => {
        const d = (apt.date || '').trim();
        if (isToday && (d.includes('اليوم') || d.includes("Aujourd'hui"))) return true;
        if (isTomorrow && (d.includes('غداً') || d.includes('غدا') || d.includes('Demain'))) return true;
        
        // Match day number if string contains digits like "25" or "26"
        const numMatch = d.match(/\b\d{1,2}\b/);
        if (numMatch && parseInt(numMatch[0], 10) === dayNumber) return true;

        // Specific day name matching for this week
        const dayNamesMap: { [key: number]: string[] } = {
          0: ['السبت', 'Samedi'],
          1: ['الأحد', 'Dimanche'],
          2: ['الإثنين', 'Lundi'],
          3: ['الثلاثاء', 'Mardi'],
          4: ['الأربعاء', 'Mercredi'],
          5: ['الخميس', 'Jeudi'],
          6: ['الجمعة', 'Vendredi']
        };
        const dayOfWeek = (adjustedStartDay + dayNumber - 1) % 7;
        const matchingNames = dayNamesMap[dayOfWeek] || [];
        if (matchingNames.some(name => d.includes(name))) {
          // If within current week
          return true;
        }

        return false;
      });
    };

    return {
      year,
      month,
      currentMonthLabel,
      daysInMonth,
      adjustedStartDay,
      daysInPrevMonth,
      getAppointmentsForDay
    };
  }, [calendarDate, filteredAppointments]);

  const changeMonth = (offset: number) => {
    setCalendarDate(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      return next;
    });
    setSelectedCalendarDay(null);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Statistical Recharts Dashboard Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Today's Appointments with Hourly Area Chart */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between text-right relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              جدول اليوم
            </span>
            <div className="flex items-center gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-500">مواعيد اليوم</h4>
                <div className="text-2xl font-black text-slate-800">{stats.todayCount} <span className="text-xs font-semibold text-slate-400">مريض</span></div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>ذروة الفترات الصباحية والمسائية</span>
              <span className="font-semibold text-blue-600">توزيع الساعات</span>
            </div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.hourlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAptToday" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', textAlign: 'right' }}
                    formatter={(val) => [`${val} مواعيد`, 'العدد']}
                    labelFormatter={(label) => `الساعة ${label}`}
                  />
                  <XAxis dataKey="hour" hide />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAptToday)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>معدل تدفق مستقر</span>
            </span>
            <span>طاقة استيعاب الأطباء: {stats.totalDailyCapacity} موعد</span>
          </div>
        </div>

        {/* Card 2: New Patients with Distribution Pie Visualization */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between text-right relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              وافدون جدد
            </span>
            <div className="flex items-center gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-500">المرضى الجدد</h4>
                <div className="text-2xl font-black text-emerald-700">{stats.newPatientsCount} <span className="text-xs font-semibold text-slate-400">مرضى</span></div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="py-2 flex items-center justify-between">
            <div className="h-24 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.patientDistribution}
                    innerRadius={22}
                    outerRadius={38}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.patientDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', textAlign: 'right' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 flex-1 pr-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>عبر وكيل الهاتف الذكي</span>
                </div>
                <span className="font-bold text-slate-800">{stats.newPatientsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>حجوزات أمانة العيادة</span>
                </div>
                <span className="font-bold text-slate-800">{Math.max(appointments.length - stats.newPatientsCount, 0)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-emerald-600 font-semibold">
              +{Math.round((stats.newPatientsCount / (appointments.length || 1)) * 100)}% من إجمالي الزوار
            </span>
            <span>تسجيل فوري عبر الذكاء الاصطناعي</span>
          </div>
        </div>

        {/* Card 3: Clinic Occupancy Rate with Radial Gauge */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between text-right relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              stats.occupancyRate > 75 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {stats.occupancyRate > 75 ? 'إقبال مرتفع' : 'إشغال مثالي'}
            </span>
            <div className="flex items-center gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-500">نسبة إشغال العيادة</h4>
                <div className="text-2xl font-black text-slate-800">{stats.occupancyRate}%</div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="py-2 flex items-center justify-between">
            <div className="h-24 w-28 shrink-0 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="70%" 
                  outerRadius="100%" 
                  data={stats.radialData} 
                  startAngle={90} 
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: '#f1f5f9' }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-slate-700 font-mono">
                {stats.occupancyRate}%
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-600 flex-1 pr-2">
              <div className="flex justify-between">
                <span>المواعيد المحجوزة:</span>
                <span className="font-bold text-slate-800">{stats.todayCount}</span>
              </div>
              <div className="flex justify-between">
                <span>المواعيد المتاحة:</span>
                <span className="font-bold text-emerald-600">{Math.max(stats.totalDailyCapacity - stats.todayCount, 0)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${stats.occupancyRate > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>معدل انتظار قاعة العيادة: ~15 دقيقة</span>
            <span className="font-semibold text-slate-700">{clinicConfig.doctors.length} أطباء مداومين</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موعد يدوي جديد</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-slate-200/80 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                title="تصدير إلى جدول إكسل (Microsoft Excel)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
                title="تصدير بصيغة CSV للسجلات والبرامج الطبية"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>تصدير CSV</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، الهاتف، الطبيب، التخصص..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pl-9 text-xs text-right focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-right">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>تصفية حسب:</span>
            </div>

            {/* Doctor filter */}
            <select
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value="ALL">جميع الأطباء ({clinicConfig.doctors.length})</option>
              {clinicConfig.doctors.map(d => (
                <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="confirmed">مؤكد (Confirmé)</option>
              <option value="completed">مكتمل (Terminé)</option>
              <option value="cancelled">ملغى (Annulé)</option>
            </select>
          </div>

          {/* View Mode Toggle: Analytics vs Monthly Calendar vs List */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                viewMode === 'analytics'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>تحليلات المواعيد (Analytics)</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                viewMode === 'calendar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>التقويم الشهري التفاعلي</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                viewMode === 'list'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>جدول المواعيد ({filteredAppointments.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Success Notification Banner */}
      {whatsAppSuccessMessage && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{whatsAppSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setWhatsAppSuccessMessage(null)}
            className="text-white/80 hover:text-white px-2 py-0.5 rounded-lg text-xs"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* VIEW 0: APPOINTMENTS ANALYTICS (FLOW & CHARTS) */}
      {viewMode === 'analytics' && (
        <AppointmentsAnalytics 
          appointments={filteredAppointments.length > 0 ? filteredAppointments : appointments}
          clinicConfig={clinicConfig}
        />
      )}

      {/* VIEW 1: MONTHLY CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-right">
            {/* Calendar Month Navigation Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    أجندة التقويم الشهري للمواعيد
                  </h3>
                  <p className="text-xs text-slate-500">
                    انقر على أي يوم لتصفح مواعيد المرضى المحجوزة وحالات تذكير الواتساب
                  </p>
                </div>
              </div>

              {/* Month Switcher Controls */}
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition shadow-2xs"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="px-3 font-bold text-sm text-slate-800 min-w-44 text-center">
                  {calendarData.currentMonthLabel}
                </div>

                <button
                  onClick={() => changeMonth(1)}
                  className="p-2 hover:bg-white rounded-xl text-slate-600 hover:text-slate-900 transition shadow-2xs"
                  title="الشهر القادم"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCalendarDate(new Date());
                    setSelectedCalendarDay(new Date().getDate());
                  }}
                  className="mr-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  اليوم
                </button>
              </div>
            </div>

            {/* Weekdays Header (Saturday to Friday) */}
            <div className="grid grid-cols-7 gap-2 pt-4 pb-2 text-center text-xs font-bold text-slate-500">
              {['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((dayName, idx) => (
                <div 
                  key={dayName} 
                  className={`py-2 rounded-xl ${idx === 6 ? 'text-red-500 bg-red-50/50' : 'bg-slate-50/80 text-slate-600'}`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Monthly Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Previous Month Padding Days */}
              {Array.from({ length: calendarData.adjustedStartDay }).map((_, i) => {
                const prevDayNum = calendarData.daysInPrevMonth - calendarData.adjustedStartDay + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    className="min-h-24 p-2 rounded-2xl bg-slate-50/40 border border-slate-100/80 text-slate-300 opacity-60 text-right"
                  >
                    <span className="font-mono text-xs font-semibold">{prevDayNum}</span>
                  </div>
                );
              })}

              {/* Current Month Active Days */}
              {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const dayApts = calendarData.getAppointmentsForDay(dayNumber);
                const hasApts = dayApts.length > 0;
                const isSelected = selectedCalendarDay === dayNumber;

                const todayObj = new Date();
                const isToday = 
                  todayObj.getFullYear() === calendarData.year &&
                  todayObj.getMonth() === calendarData.month &&
                  todayObj.getDate() === dayNumber;

                return (
                  <div
                    key={`day-${dayNumber}`}
                    onClick={() => setSelectedCalendarDay(dayNumber)}
                    className={`min-h-24 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-right relative group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                        : isToday
                        ? 'border-blue-400 bg-blue-50/20'
                        : hasApts
                        ? 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                        : 'border-slate-100 bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {isToday && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white">
                          اليوم
                        </span>
                      )}
                      {hasApts && !isToday && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {dayApts.length} موعد
                        </span>
                      )}
                      {!hasApts && !isToday && <span></span>}

                      <span className={`font-mono text-xs font-bold ${
                        isSelected ? 'text-emerald-700' : isToday ? 'text-blue-700' : 'text-slate-700'
                      }`}>
                        {dayNumber}
                      </span>
                    </div>

                    {/* Compact appointment chips inside calendar day box */}
                    <div className="mt-1 space-y-1 overflow-hidden">
                      {dayApts.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          className="px-1.5 py-0.5 rounded-md text-[10px] truncate font-medium flex items-center justify-between bg-slate-100/90 text-slate-700 border border-slate-200/60"
                          title={`${apt.time} - ${apt.patientName} (${apt.doctorName})`}
                        >
                          <span className="truncate">{apt.patientName.split(' ')[0]}</span>
                          <span className="font-mono text-[9px] text-slate-500">{apt.time}</span>
                        </div>
                      ))}
                      {dayApts.length > 2 && (
                        <div className="text-[9px] text-emerald-700 font-bold text-center">
                          +{dayApts.length - 2} مواعيد أخرى
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Drawer for Selected Calendar Day */}
          {selectedCalendarDay !== null && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-right animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-mono font-bold text-sm">
                    {selectedCalendarDay}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      مواعيد يوم {selectedCalendarDay} {calendarData.currentMonthLabel}
                    </h4>
                    <p className="text-xs text-slate-500">
                      إجمالي المواعيد المجدولة: {calendarData.getAppointmentsForDay(selectedCalendarDay).length} مريض
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>حجز موعد جديد في هذا اليوم</span>
                </button>
              </div>

              {/* Day's appointments cards list */}
              {calendarData.getAppointmentsForDay(selectedCalendarDay).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs">لا توجد مواعيد محجوزة في هذا اليوم حتى الآن</p>
                  <p className="text-[11px] text-slate-400 mt-1">العيادة جاهزة لاستقبال المرضى أو حجز مواعيد جديدة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {calendarData.getAppointmentsForDay(selectedCalendarDay).map(apt => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-xs transition space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>الساعة {apt.time}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {apt.status === 'confirmed' ? 'مؤكد' : apt.status === 'completed' ? 'مكتمل' : 'ملغى'}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-sm">{apt.patientName}</div>
                        <div className="text-slate-500 font-mono text-xs flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{apt.phone}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs">
                        <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                        <div className="text-[11px] text-emerald-600 font-medium">{apt.specialty}</div>
                      </div>

                      {/* WhatsApp Reminder Status Pill */}
                      <div className="pt-1 flex items-center justify-between text-xs">
                        {apt.whatsappReminder?.status === 'sent' ? (
                          <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>تذكير واتساب: تم الإرسال</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>تذكير واتساب: مجدول قبل 24h</span>
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedAptForWhatsApp(apt)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] flex items-center gap-1 transition"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>واتساب</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: APPOINTMENTS TABLE VIEW */}
      {viewMode === 'list' && (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">المريض ورقم الهاتف</th>
                <th className="py-3 px-4">الطبيب والتخصص</th>
                <th className="py-3 px-4">تاريخ وتوقيت الموعد</th>
                <th className="py-3 px-4">تذكير واتساب (قبل 24 ساعة)</th>
                <th className="py-3 px-4">بطاقة الشفاء</th>
                <th className="py-3 px-4">مصدر الحجز</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد مواعيد مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(apt => {
                  const reminder = apt.whatsappReminder;
                  const isSent = reminder?.status === 'sent';
                  const isScheduled = reminder?.status === 'scheduled' || !reminder;

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition">
                      {/* Patient & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-sm">{apt.patientName}</div>
                        <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{apt.phone}</span>
                        </div>
                      </td>

                      {/* Doctor & Specialty */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{apt.doctorName}</div>
                        <div className="text-[11px] text-emerald-600 font-medium">{apt.specialty}</div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{apt.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{apt.time}</span>
                        </div>
                      </td>

                      {/* WhatsApp 24h Reminder Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              <span>تم الإرسال (واتساب)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>مجدول آلياً (قبل 24h)</span>
                            </span>
                          )}

                          <div className="flex items-center gap-2 mt-0.5">
                            <button
                              onClick={() => setSelectedAptForWhatsApp(apt)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>معاينة الرسالة</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              onClick={() => handleTriggerWhatsApp(apt)}
                              disabled={isSendingWhatsApp}
                              className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                              title="إرسال تذكير فوري الآن"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>إرسال الآن</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Chifa Card */}
                      <td className="py-3.5 px-4">
                        {apt.carteChifa ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            <span>نعم (Carte Chifa)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            بدون بطاقة
                          </span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          apt.source === 'ai_phone' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {apt.source === 'ai_phone' ? '📞 مكالمة ذكاء اصطناعي' : '✍️ أمانة العيادة'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{apt.createdAt}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={apt.status}
                          onChange={e => onUpdateStatus(apt.id, e.target.value as any)}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none ${
                            apt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : apt.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="confirmed">مؤكد</option>
                          <option value="completed">مكتمل</option>
                          <option value="cancelled">ملغى</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedAptForWhatsApp(apt)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="تذكير واتساب"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="حذف الموعد"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-800">حجز موعد مريض جديد في العيادة</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم ولقب المريض:</label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  placeholder="مثال: سليم بوزيد"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف (الجزائر):</label>
                <input
                  type="text"
                  required
                  value={newPatientPhone}
                  onChange={e => setNewPatientPhone(e.target.value)}
                  placeholder="05 / 06 / 07 ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الطبيب والتخصص:</label>
                <select
                  value={newDoctorId}
                  onChange={e => setNewDoctorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                >
                  {clinicConfig.doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اليوم:</label>
                  <select
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                  >
                    <option value="اليوم">اليوم</option>
                    <option value="غداً">غداً</option>
                    <option value="الأحد القادم">الأحد القادم</option>
                    <option value="الثلاثاء القادم">الثلاثاء القادم</option>
                    <option value="الخميس القادم">الخميس القادم</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الساعة:</label>
                  <select
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                  >
                    {selectedDoctorObj?.slots.map(s => (
                      <option key={s} value={s}>{s}</option>
                    )) || <option value="10:00">10:00</option>}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chifaCheck"
                  checked={newChifa}
                  onChange={e => setNewChifa(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chifaCheck" className="text-slate-700 font-medium">
                  حامل لبطاقة الشفاء (Carte Chifa CNAS / CASNOS)
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات أو سبب الزيارة:</label>
                <textarea
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="أعراض، تجديد وصفة، فحص دوري..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-sm"
                >
                  تأكيد الحجز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WhatsApp Reminder Detail & Trigger Modal */}
      {selectedAptForWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-800">تذكير واتساب الآلي للمريض</h3>
                  <p className="text-[11px] text-slate-500">نظام الإرسال التلقائي الذكي قبل الموعد بـ 24 ساعة</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAptForWhatsApp(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Patient & Appointment Quick Info */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">المريض:</span>
                <span className="font-bold text-slate-800">{selectedAptForWhatsApp.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-mono font-bold text-emerald-700 dir-ltr">{selectedAptForWhatsApp.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">الطبيب والتخصص:</span>
                <span className="font-medium text-slate-700">{selectedAptForWhatsApp.doctorName} ({selectedAptForWhatsApp.specialty})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">تاريخ وتوقيت الموعد:</span>
                <span className="font-bold text-slate-800">{selectedAptForWhatsApp.date} على الساعة {selectedAptForWhatsApp.time}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">حالة التذكير:</span>
                {selectedAptForWhatsApp.whatsappReminder?.status === 'sent' ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>تم الإرسال ({selectedAptForWhatsApp.whatsappReminder.sentAt})</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>مجدول آلياً (قبل 24 ساعة من الحضور)</span>
                  </span>
                )}
              </div>
            </div>

            {/* WhatsApp Message Preview Bubble */}
            <div className="space-y-1.5 mb-4">
              <span className="text-xs font-bold text-slate-600">معاينة رسالة الواتساب المعتمدة:</span>
              <div className="p-4 rounded-2xl bg-[#E7F8E8] border border-[#C6ECC7] text-slate-800 text-xs leading-relaxed font-sans relative shadow-inner">
                <div className="absolute top-2 left-3 text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  WhatsApp Bot • 24h Prior
                </div>
                <p className="font-semibold text-emerald-900 mb-1">
                  مرحباً بك {selectedAptForWhatsApp.patientName} في {clinicConfig.name} 🏥
                </p>
                <p className="mt-2 text-slate-700">
                  📌 <strong>تذكير آلي بموعدك الطبي غداً (قبل 24 ساعة):</strong><br />
                  👨‍⚕️ الطبيب: {selectedAptForWhatsApp.doctorName} ({selectedAptForWhatsApp.specialty})<br />
                  🗓️ الموعد: {selectedAptForWhatsApp.date} على الساعة {selectedAptForWhatsApp.time}<br />
                  📍 العنوان: {clinicConfig.address}<br />
                  💳 بطاقة الشفاء: {selectedAptForWhatsApp.carteChifa ? 'مقبولة (يرجى إحضارها مع الفحوصات السابقة)' : 'يرجى مراجعة الاستقبال'}
                </p>
                <p className="mt-2 text-slate-600 text-[11px]">
                  في حال الرغبة في تأكيد الحضور أو التعديل، يرجى الرد على هذه الرسالة أو الاتصال على: {clinicConfig.phone}.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAptForWhatsApp(null)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => handleTriggerWhatsApp(selectedAptForWhatsApp)}
                disabled={isSendingWhatsApp}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isSendingWhatsApp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري إرسال التذكير...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{selectedAptForWhatsApp.whatsappReminder?.status === 'sent' ? 'إعادة إرسال التذكير عبر واتساب' : 'إرسال تذكير الـ 24 ساعة الآن'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
