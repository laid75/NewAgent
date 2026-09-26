import React, { useState } from 'react';
import { 
  Building2, MapPin, Clock, DollarSign, Stethoscope, 
  Plus, Trash2, Save, CheckCircle, Shield, AlertCircle, Phone, Globe
} from 'lucide-react';
import { ClinicConfig, Doctor } from '../types';

interface ClinicBranch {
  id: string;
  name: string;
  wilaya: string;
  address: string;
  phone: string;
  hours: string;
  landmarks: string;
}

interface ClinicSettingsProps {
  config: ClinicConfig;
  onSaveConfig: (newConfig: ClinicConfig) => void;
}

export const ClinicSettings: React.FC<ClinicSettingsProps> = ({
  config,
  onSaveConfig
}) => {
  const [formData, setFormData] = useState<ClinicConfig>({ ...config });
  const [branches, setBranches] = useState<ClinicBranch[]>([
    {
      id: "br-1",
      name: "الفرع الرئيسي (دالي إبراهيم - العاصمة)",
      wilaya: "الجزائر العاصمة (Alger)",
      address: "14، شارع 11 ديسمبر 1960، دالي إبراهيم، الجزائر العاصمة",
      phone: "023 38 12 45 / 0550 12 34 56",
      hours: "السبت إلى الخميس: 08:30 إلى 17:30",
      landmarks: "بجوار جامعة الجزائر 3 ومحطة الحافلات، يتوفر موقف سيارات مجاني للمرضى"
    },
    {
      id: "br-2",
      name: "فرع باب الزوار (شرق العاصمة)",
      wilaya: "الجزائر العاصمة (Alger)",
      address: "حي إسماعيل يفصح، عمارة B4، باب الزوار، الجزائر",
      phone: "023 83 45 10 / 0661 70 80 90",
      hours: "السبت إلى الخميس: 09:00 إلى 18:00",
      landmarks: "قريب من محطة الترامواي باب الزوار ومركز التسوق، سهولة الوصول لذوي الاحتياجات الخاصة"
    }
  ]);

  const [newServiceName, setNewServiceName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'branches' | 'doctors' | 'services'>('info');

  // New Doctor Modal/Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('طب عام');
  const [newDocDays, setNewDocDays] = useState('السبت, الأحد, الثلاثاء, الخميس');

  // Handle Save
  const handleSave = () => {
    onSaveConfig(formData);
    // Push update to server as well
    fetch('/api/clinic/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).catch(err => console.error(err));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Add Service
  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, newServiceName.trim()]
    }));
    setNewServiceName('');
  };

  // Remove Service
  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  // Add Doctor
  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const daysArray = newDocDays.split(',').map(d => d.trim()).filter(Boolean);
    const newDoc: Doctor = {
      id: 'doc-' + Date.now(),
      name: newDocName.trim(),
      specialty: newDocSpecialty,
      availableDays: daysArray.length > 0 ? daysArray : ["السبت", "الإثنين", "الأربعاء"],
      slots: ["09:00", "10:30", "11:30", "14:00", "15:30"]
    };

    setFormData(prev => ({
      ...prev,
      doctors: [...prev.doctors, newDoc]
    }));

    setNewDocName('');
  };

  // Remove Doctor
  const handleRemoveDoctor = (docId: string) => {
    setFormData(prev => ({
      ...prev,
      doctors: prev.doctors.filter(d => d.id !== docId)
    }));
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>قاعدة بيانات العيادة ومعلومات الوكيل الذكي</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            جميع المعلومات المدخلة هنا يتم تزويد وكيل الذكاء الاصطناعي بها تلقائياً للإجابة على مكالمات المرضى
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتحديث الوكيل الصوتي</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">تم حفظ وتحديث قاعدة البيانات بنجاح!</span>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              وكيل المكالمات "ياسمين" مزود الآن بأحدث بيانات العيادة والأطباء وساعات العمل والعناوين.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'info' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>العيادة وساعات العمل والأسعار</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'branches' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>عناوين الفروع ومواقعها ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'doctors' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>الأطباء ومواعيد الحضور ({formData.doctors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'services' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>الخدمات والفحوصات الطبية ({formData.specialties.length})</span>
        </button>
      </div>

      {/* TAB 1: General Info & Hours & Chifa */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Info */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>معلومات وهوية العيادة في الجزائر</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">اسم العيادة (عربي وفرنسي):</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">أرقام هواتف الاستقبال:</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">أرقام الطوارئ والإسعاف المعتمدة:</label>
              <input
                type="text"
                value={formData.emergencyPhone}
                onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ساعات العمل والدوام:</label>
              <textarea
                value={formData.openingHours}
                onChange={e => setFormData({ ...formData, openingHours: e.target.value })}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Pricing & Chifa Policy */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>التسعيرات وبطاقة الشفاء (Carte Chifa)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">فحص الطب العام:</label>
                <input
                  type="text"
                  value={formData.consultationFeeGeneral}
                  onChange={e => setFormData({ ...formData, consultationFeeGeneral: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right font-semibold text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">فحص الأطباء الأخصائيين:</label>
                <input
                  type="text"
                  value={formData.consultationFeeSpecialist}
                  onChange={e => setFormData({ ...formData, consultationFeeSpecialist: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right font-semibold text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chifaToggle"
                  checked={formData.carteChifaAccepted}
                  onChange={e => setFormData({ ...formData, carteChifaAccepted: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chifaToggle" className="font-bold text-slate-800">
                  العيادة متعاقدة مع بطاقة الشفاء (CNAS / CASNOS)
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1 text-[11px]">
                  تفاصيل التغطية ونظام الدفع للغير ليشرحها الوكيل للمرضى:
                </label>
                <textarea
                  value={formData.carteChifaDetails}
                  onChange={e => setFormData({ ...formData, carteChifaDetails: e.target.value })}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-right text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Clinic Branches and Locations */}
      {activeTab === 'branches' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>عناوين العيادات وفروعها وإرشادات الوصول</span>
              </h3>
              <p className="text-xs text-slate-500">
                يقوم الوكيل بالرد على المتصلين بأقرب فرع ووسائل النقل والمواقف المتاحة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {b.wilaya}
                  </span>
                  <h4 className="font-bold text-sm text-slate-800">{b.name}</h4>
                </div>

                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{b.hours}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-[11px] text-slate-700">
                    <span className="font-semibold text-emerald-700 block mb-0.5">معالم الوصول والموقف:</span>
                    {b.landmarks}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Doctors Management */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          {/* Add Doctor Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-xs">
            <h3 className="font-bold text-sm text-slate-800 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>إضافة طبيب جديد إلى طاقم العيادة</span>
            </h3>

            <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم الطبيب:</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  placeholder="د. أحمد بوحفص"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">التخصص الطبي:</label>
                <select
                  value={newDocSpecialty}
                  onChange={e => setNewDocSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                >
                  {formData.specialties.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">أيام الحضور (مفصولة بفاصلة):</label>
                <input
                  type="text"
                  value={newDocDays}
                  onChange={e => setNewDocDays(e.target.value)}
                  placeholder="السبت, الإثنين, الخميس"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-sm"
              >
                إضافة الطبيب للجدول
              </button>
            </form>
          </div>

          {/* Current Doctors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.doctors.map((doc) => (
              <div key={doc.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleRemoveDoctor(doc.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition"
                    title="حذف الطبيب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {doc.name.charAt(3) || 'ط'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{doc.name}</h4>
                      <span className="text-emerald-700 font-semibold">{doc.specialty}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400 font-medium">أيام الفحص:</span>
                    <div className="flex flex-wrap gap-1">
                      {doc.availableDays.map((day, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px]">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400 font-medium">المواعيد اليومية:</span>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                      {doc.slots.map((s, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Services and Medical Specialties */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>قائمة الخدمات والفحوصات الطبية المعتمدة</span>
              </h3>
              <p className="text-xs text-slate-500">
                يستخدمها الوكيل الصوتي لتوجيه المريض للتخصص المناسب حسب شكواه الطبية
              </p>
            </div>
          </div>

          {/* Add Service Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddService}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shrink-0"
            >
              إضافة خدمة
            </button>
            <input
              type="text"
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
              placeholder="مثال: فحص الحساسية والمناعة، تنظير المعدة، تصوير الأشعة..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {formData.specialties.map((serv, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => handleRemoveService(idx)}
                  className="text-slate-400 hover:text-red-500 p-1 transition"
                  title="حذف الخدمة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">{serv}</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
