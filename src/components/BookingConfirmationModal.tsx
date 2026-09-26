import React, { useState } from 'react';
import { 
  CheckCircle2, Phone, Calendar, Clock, MapPin, 
  ShieldCheck, Share2, Copy, Printer, Check, XCircle, Send
} from 'lucide-react';
import { Appointment, ClinicConfig } from '../types';

interface BookingConfirmationModalProps {
  appointment: Appointment;
  clinicConfig: ClinicConfig;
  onClose: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  appointment,
  clinicConfig,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [smsSent, setSmsSent] = useState(true);

  const confirmationMessage = `عيادة الأمل الطبية (${clinicConfig.wilaya}):
مرحباً ${appointment.patientName}، تم تأكيد حجز موعدكم بنجاح:
👨‍⚕️ الطبيب: ${appointment.doctorName} (${appointment.specialty})
📅 الموعد: ${appointment.date} - ${appointment.time}
📍 العنوان: ${clinicConfig.address}
ℹ️ ملاحظة: يرجى إحضار بطاقة الشفاء والفحوصات السابقة إن وجدت.
للاستفسار: ${clinicConfig.phone}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(confirmationMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span>تم تأكيد الحجز وإرسال الإشعار للمريض</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Realistic Algerian SMS Preview Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 mb-4 relative overflow-hidden text-xs">
          <div className="flex items-center justify-between text-slate-400 pb-2 mb-2 border-b border-white/10 text-[11px]">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <Send className="w-3.5 h-3.5" />
              <span>رسالة تأكيد SMS مرسلة عبر شبكة الهاتف الجزائري</span>
            </span>
            <span className="font-mono text-slate-300">{appointment.phone}</span>
          </div>

          <div className="space-y-1.5 leading-relaxed font-sans text-slate-100 whitespace-pre-line text-xs">
            {confirmationMessage}
          </div>

          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>الحالة: تم التسليم (Délivré) ✓✓</span>
            <span>المرسل: CLINIQUE-DZ</span>
          </div>
        </div>

        {/* Appointment Card Details */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400 block text-[10px]">اسم المريض:</span>
              <span className="font-bold text-slate-800">{appointment.patientName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">رقم الهاتف:</span>
              <span className="font-mono font-bold text-slate-800">{appointment.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">الطبيب:</span>
              <span className="font-semibold text-emerald-700">{appointment.doctorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">التوقيت:</span>
              <span className="font-semibold text-slate-800">{appointment.date} - {appointment.time}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>تغطية بطاقة الشفاء: {appointment.carteChifa ? 'نعم (مشمول بالتعويض)' : 'فحص حر'}</span>
            </span>
            <span className="font-mono font-bold text-emerald-700">
              {appointment.specialty.includes('عام') ? clinicConfig.consultationFeeGeneral : clinicConfig.consultationFeeSpecialist}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ الرسالة' : 'نسخ نص التأكيد'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التذكرة (Ticket)</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
