import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Calendar, Stethoscope, Users, Activity, 
  Clock, ShieldCheck, ArrowUpRight, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Appointment, ClinicConfig } from '../types';

interface AppointmentsAnalyticsProps {
  appointments: Appointment[];
  clinicConfig: ClinicConfig;
}

export const AppointmentsAnalytics: React.FC<AppointmentsAnalyticsProps> = ({
  appointments,
  clinicConfig
}) => {
  const [analyticsMetric, setAnalyticsMetric] = useState<'specialty' | 'day' | 'doctor'>('specialty');

  // 1. Data by Medical Specialty
  const specialtyData = useMemo(() => {
    const map: { [key: string]: number } = {};
    appointments.forEach(apt => {
      const spec = apt.specialty || 'طب عام';
      map[spec] = (map[spec] || 0) + 1;
    });

    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    return Object.entries(map).map(([name, count], idx) => ({
      name,
      count,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);
  }, [appointments]);

  // 2. Data by Scheduled Day
  const dayData = useMemo(() => {
    const daysOrder = ['اليوم', 'غداً', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const map: { [key: string]: number } = {};

    daysOrder.forEach(d => { map[d] = 0; });

    appointments.forEach(apt => {
      const dateStr = (apt.date || '').trim();
      let matched = false;
      for (const d of daysOrder) {
        if (dateStr.includes(d)) {
          map[d] = (map[d] || 0) + 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        map['اليوم'] = (map['اليوم'] || 0) + 1;
      }
    });

    return daysOrder.map(day => ({
      day,
      count: map[day] || 0
    }));
  }, [appointments]);

  // 3. Data by Doctor
  const doctorData = useMemo(() => {
    const map: { [key: string]: { count: number; specialty: string } } = {};
    
    // Seed with all clinic doctors so even zero-appointment doctors appear
    clinicConfig.doctors.forEach(doc => {
      map[doc.name] = { count: 0, specialty: doc.specialty };
    });

    appointments.forEach(apt => {
      const name = apt.doctorName || 'طبيب مناوب';
      if (!map[name]) {
        map[name] = { count: 0, specialty: apt.specialty };
      }
      map[name].count += 1;
    });

    return Object.entries(map).map(([name, info]) => ({
      doctor: name.replace(/^د\.\s*/, ''),
      fullName: name,
      specialty: info.specialty,
      appointments: info.count
    })).sort((a, b) => b.appointments - a.appointments);
  }, [appointments, clinicConfig]);

  // 4. Source & Chifa Distribution
  const bookingInsights = useMemo(() => {
    const total = appointments.length || 1;
    const chifaCount = appointments.filter(a => a.carteChifa).length;
    const aiPhoneCount = appointments.filter(a => a.source === 'ai_phone').length;
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;

    return {
      totalAppointments: appointments.length,
      chifaPercentage: Math.round((chifaCount / total) * 100),
      aiPhonePercentage: Math.round((aiPhoneCount / total) * 100),
      confirmedPercentage: Math.round((confirmedCount / total) * 100)
    };
  }, [appointments]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-right space-y-6">
      {/* Analytics Header & Control Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <span>تحليلات تدفق المرضى والمواعيد</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Recharts Analytics
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              رسم بياني تفاعلي يوضح توزيع مواعيد العيادة حسب التخصصات، الأيام، وكفاءة الاستيعاب
            </p>
          </div>
        </div>

        {/* Toggle Metric View (Specialty vs Day vs Doctor) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setAnalyticsMetric('specialty')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 ${
              analyticsMetric === 'specialty'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>حسب التخصصات</span>
          </button>

          <button
            onClick={() => setAnalyticsMetric('day')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 ${
              analyticsMetric === 'day'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>حسب الأيام</span>
          </button>

          <button
            onClick={() => setAnalyticsMetric('doctor')}
            className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center gap-1.5 ${
              analyticsMetric === 'doctor'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>حسب الأطباء</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-slate-500 text-[11px] mb-1 font-medium">إجمالي المواعيد المحجوزة</div>
          <div className="text-xl font-black text-slate-800">{bookingInsights.totalAppointments} <span className="text-[11px] font-normal text-slate-400">موعد</span></div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="text-emerald-700 text-[11px] mb-1 font-medium">نسبة حاملي بطاقة الشفاء</div>
          <div className="text-xl font-black text-emerald-800">{bookingInsights.chifaPercentage}% <span className="text-[11px] font-normal text-emerald-600">CNAS/CASNOS</span></div>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80">
          <div className="text-purple-700 text-[11px] mb-1 font-medium">مواعيد حجزت عبر هاتف AI</div>
          <div className="text-xl font-black text-purple-800">{bookingInsights.aiPhonePercentage}% <span className="text-[11px] font-normal text-purple-600">مكالمات صوتية</span></div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
          <div className="text-blue-700 text-[11px] mb-1 font-medium">نسبة المواعيد المؤكدة</div>
          <div className="text-xl font-black text-blue-800">{bookingInsights.confirmedPercentage}% <span className="text-[11px] font-normal text-blue-600">تأكيد نهائي</span></div>
        </div>
      </div>

      {/* Primary Recharts Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Main Chart Area */}
        <div className="lg:col-span-8 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-700">
              {analyticsMetric === 'specialty' && 'توزيع تدفق المرضى حسب التخصص الطبي (Spécialités)'}
              {analyticsMetric === 'day' && 'معدل حجز المواعيد على مدار أيام الأسبوع'}
              {analyticsMetric === 'doctor' && 'حجم المواعيد المجدولة لكل طبيب في العيادة'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              N = {appointments.length}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {analyticsMetric === 'specialty' ? (
                <BarChart data={specialtyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#475569', fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', textAlign: 'right' }}
                    formatter={(val) => [`${val} مريض`, 'عدد المواعيد']}
                    labelFormatter={(label) => `التخصص: ${label}`}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {specialtyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : analyticsMetric === 'day' ? (
                <AreaChart data={dayData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorDayApts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', textAlign: 'right' }}
                    formatter={(val) => [`${val} مواعيد`, 'العدد']}
                    labelFormatter={(label) => `اليوم: ${label}`}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDayApts)" />
                </AreaChart>
              ) : (
                <BarChart data={doctorData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="doctor" type="category" tick={{ fill: '#475569', fontSize: 11 }} width={90} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', textAlign: 'right' }}
                    formatter={(val) => [`${val} مواعيد`, 'المواعيد']}
                    labelFormatter={(label) => `د. ${label}`}
                  />
                  <Bar dataKey="appointments" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Donut Breakdown */}
        <div className="lg:col-span-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between h-full">
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              الحصص النسبية للتخصصات
            </span>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {specialtyData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px', textAlign: 'right' }}
                    formatter={(val) => [`${val} موعد`, 'العدد']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Specialty Legend Breakdown */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            {specialtyData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
