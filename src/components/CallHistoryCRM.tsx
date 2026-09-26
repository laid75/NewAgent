import React, { useState } from 'react';
import { 
  Phone, Clock, User, Calendar, ShieldAlert, CheckCircle, 
  MessageSquare, Volume2, Search, Filter, Play, Pause, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { CallLog, TriageLevel } from '../types';
import { speakWithBrowser, stopCurrentAudio } from '../utils/audioPlayer';

interface CallHistoryCRMProps {
  calls: CallLog[];
}

export const CallHistoryCRM: React.FC<CallHistoryCRMProps> = ({ calls }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTriage, setFilterTriage] = useState('ALL');
  const [expandedCallId, setExpandedCallId] = useState<string | null>(calls[0]?.id || null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const filteredCalls = calls.filter(call => {
    const matchesSearch = 
      call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callerNumber.includes(searchTerm) ||
      call.summary.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTriage = filterTriage === 'ALL' || call.triageLevel === filterTriage;

    return matchesSearch && matchesTriage;
  });

  const togglePlayAudio = (msgId: string, text: string, lang: string) => {
    if (playingMessageId === msgId) {
      stopCurrentAudio();
      setPlayingMessageId(null);
    } else {
      stopCurrentAudio();
      setPlayingMessageId(msgId);
      speakWithBrowser(text, lang === 'french' ? 'fr' : 'ar').finally(() => {
        setPlayingMessageId(null);
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}د ${secs}ث`;
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header and Filter */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            <span>سجل المكالمات الهاتفية المستلمة (CRM العيادة)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل كامل لجميع المكالمات والفرز الطبي وتفريغ المحادثة الصوتية وتحليلات الذكاء الاصطناعي
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Triage filter */}
          <select
            value={filterTriage}
            onChange={e => setFilterTriage(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="ALL">جميع المكالمات</option>
            <option value="emergency">طوارئ (SAMU 14)</option>
            <option value="urgent">حالات عاجلة</option>
            <option value="normal">حجوزات واستفسارات عادية</option>
          </select>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث بالرقم، الاسم، الملخص..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pl-8 text-xs text-right focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="space-y-3">
        {filteredCalls.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            لا توجد مكالمات مسجلة مطابقة للبحث
          </div>
        ) : (
          filteredCalls.map(call => {
            const isExpanded = expandedCallId === call.id;

            return (
              <div 
                key={call.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition"
              >
                {/* Call Summary Row */}
                <div 
                  onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                  className="p-4 hover:bg-slate-50/60 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      call.triageLevel === 'emergency'
                        ? 'bg-red-50 text-red-600'
                        : call.status === 'booked'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {call.triageLevel === 'emergency' ? (
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Phone className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{call.callerName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">{call.callerNumber}</span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5 max-w-xl line-clamp-1">{call.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-slate-400">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDuration(call.durationSeconds)}</span>
                      <span>•</span>
                      <span>{call.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        call.triageLevel === 'emergency'
                          ? 'bg-red-100 text-red-700'
                          : call.status === 'booked'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {call.triageLevel === 'emergency' 
                          ? '🚨 طوارئ 14' 
                          : call.status === 'booked' 
                          ? '✅ تم الحجز' 
                          : 'مكالمة مكتملة'}
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details & Transcript */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/70 border-t border-slate-100 text-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>التفريغ النصي والصوتي الكامل للمكالمة:</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        اللغة المكتشفة: {call.language === 'french' ? 'Français' : call.language === 'darija' ? 'الدارجة الجزائرية' : 'العربية'}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {call.messages.map((m) => (
                        <div 
                          key={m.id}
                          className={`p-3 rounded-2xl border text-xs leading-relaxed flex items-start justify-between gap-3 ${
                            m.role === 'patient'
                              ? 'bg-white border-slate-200 text-slate-800'
                              : 'bg-emerald-50/60 border-emerald-200/60 text-slate-800'
                          }`}
                        >
                          <div className="flex-1">
                            <span className="block font-bold text-[10px] text-slate-400 mb-1">
                              {m.role === 'patient' ? `المتصل (${call.callerName})` : 'الوكيل الذكي (ياسمين)'} • {m.timestamp}
                            </span>
                            <p>{m.content}</p>
                          </div>

                          <button
                            onClick={() => togglePlayAudio(m.id, m.content, call.language)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition shrink-0"
                            title="الاستماع الصوتي"
                          >
                            {playingMessageId === m.id ? (
                              <Pause className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Booked Appointment Confirmation Badge if exists */}
                    {call.appointmentBooked && (
                      <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="font-bold text-xs">
                            تم استخراج وحجز موعد تلقائياً: {call.appointmentBooked.doctorName || 'طبيب مناوب'} ({call.appointmentBooked.specialty})
                          </span>
                        </div>
                        <span className="font-semibold text-xs">
                          {call.appointmentBooked.requestedDay || 'اليوم'} {call.appointmentBooked.requestedTime ? `الساعة ${call.appointmentBooked.requestedTime}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
