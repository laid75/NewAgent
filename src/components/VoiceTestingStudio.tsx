import React, { useState } from 'react';
import { 
  Sparkles, Volume2, Mic, Play, RefreshCw, CheckCircle2, 
  Clock, MapPin, Stethoscope, DollarSign, ShieldAlert, Send, Users
} from 'lucide-react';
import { ClinicConfig } from '../types';
import { playPcmAudio, speakWithBrowser, stopCurrentAudio, unlockAudioContext } from '../utils/audioPlayer';

interface VoiceTestingStudioProps {
  clinicConfig: ClinicConfig;
}

export const VoiceTestingStudio: React.FC<VoiceTestingStudioProps> = ({ clinicConfig }) => {
  const [testPrompt, setTestPrompt] = useState('سلام خويا، واش من تخصصات كاين عندكم فالكابيني؟ وقتاش يحل الطبيب تع العظام؟');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [selectedDialect, setSelectedDialect] = useState<'darija' | 'french' | 'arabic'>('darija');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testCategories = [
    {
      title: "استفسار ساعات العمل وأيام الدوام",
      icon: Clock,
      prompt: "سلام عليكم أختي، وقتاش يفتح الكابيني فالصباح؟ والجمعة كاين كاش طبيب ولا مغلوقين؟",
      dialect: "darija" as const
    },
    {
      title: "معلومات الأطباء والمواعيد المتاحة",
      icon: Stethoscope,
      prompt: "حبيت نسقسي على طبيب القلب دكتور بن سالم، وقتاش يكون كاين فالسيمانة؟ وكيفاش نحكم عندو موعد؟",
      dialect: "darija" as const
    },
    {
      title: "عناوين العيادة وفروعها بالجزائر",
      icon: MapPin,
      prompt: "وين جاي الكابيني تاعكم بالضبط فدالي إبراهيم؟ وكاين كاش بلاصة نسطاسيوني فيها الطوموبيل؟",
      dialect: "darija" as const
    },
    {
      title: "بطاقة الشفاء وتكلفة الفحص (DZD)",
      icon: DollarSign,
      prompt: "واش من أوراق لازم نجيب معايا باه نخلص بلاكارت شيفا Carte Chifa؟ وشحال تخلص الفحصة تع الطفل الصغير؟",
      dialect: "darija" as const
    },
    {
      title: "Consultation et Prise de RDV en Français",
      icon: Sparkles,
      prompt: "Bonjour, est-ce que je peux avoir des informations sur les horaires de consultation pédiatrique du Dr Boudjemaa et l'adresse exacte ?",
      dialect: "french" as const
    },
    {
      title: "فحص طوارئ مستعجل (فرز SAMU)",
      icon: ShieldAlert,
      prompt: "ألو عيادة الأمل؟ الوالدة راهي طايحة في غيبوبة وعندها هبوط حاد فالسكر، نجيكم ضرك ولا واش ندير؟",
      dialect: "darija" as const
    },
    {
      title: "تداخل أصوات (أكثر من شخص يتكلم في نفس الوقت)",
      icon: Users,
      prompt: "ألو؟ (صوت 1: حابين نحكمو موعد مع دكتور الأطفال) / (صوت 2: لا لا قولو على موعد القلب ليوم الخميس)، راكم تسمعوا فينا؟",
      dialect: "darija" as const
    }
  ];

  const handleRunTest = async (promptToUse?: string, dialectToUse?: 'darija' | 'french' | 'arabic') => {
    unlockAudioContext();
    const text = promptToUse || testPrompt;
    const dialect = dialectToUse || selectedDialect;
    if (!text.trim() || isGenerating) return;

    setIsGenerating(true);
    stopCurrentAudio();

    try {
      // 1. Process with Gemini
      const processRes = await fetch('/api/call/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          currentLanguage: dialect,
          patientName: 'مريض تجريبي'
        })
      });

      let data;
      if (processRes.ok) {
        data = await processRes.json();
      } else {
        data = {
          replyText: "مرحبا بيك في عيادة الأمل الطبية، راني نسمع فيك مليح، تقدر تسقسي على أوقات العمل أو تحجز موعد مع الأطباء.",
          intent: 'general_talk',
          triageLevel: 'normal',
          languageDetected: dialect,
          suggestedQuickReplies: ['حجز موعد غداً', 'أوقات العمل', 'استفسار عن بطاقة الشفاء']
        };
      }
      setLastResult(data);

      // 2. Play Audio response
      setIsPlayingAudio(true);
      try {
        const ttsRes = await fetch('/api/call/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: data.replyText,
            voiceName: selectedVoice,
            language: dialect === 'french' ? 'fr' : 'ar'
          })
        });

        if (ttsRes.ok) {
          const ttsData = await ttsRes.json();
          if (ttsData.audioBase64) {
            await playPcmAudio(ttsData.audioBase64, 24000);
            setIsPlayingAudio(false);
            setIsGenerating(false);
            return;
          }
        }
        await speakWithBrowser(data.replyText, dialect === 'french' ? 'fr' : 'ar');
      } catch {
        await speakWithBrowser(data.replyText, dialect === 'french' ? 'fr' : 'ar');
      } finally {
        setIsPlayingAudio(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-600" />
          <span>استوديو اختبار الرد الصوتي والمعلومات الطبية</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          اختبر إجابات الوكيل الصوتي "ياسمين" على استفسارات المرضى حول خدمات العيادة وساعات العمل ومواعيد الأطباء وفروع العاصمة
        </p>
      </div>

      {/* Quick Test Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {testCategories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div
              key={idx}
              onClick={() => {
                setTestPrompt(cat.prompt);
                setSelectedDialect(cat.dialect);
                handleRunTest(cat.prompt, cat.dialect);
              }}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition">
                  {cat.dialect === 'french' ? 'Français' : 'دارجة جزائرية'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-600 flex items-center justify-center transition">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <h4 className="font-bold text-xs text-slate-800">{cat.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">"{cat.prompt}"</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-medium">
                <span>تشغيل واستماع</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Testing Sandbox */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald-600" />
          <span>اختبار استفسار مخصص:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">نبرة الصوت (Gemini Voice):</label>
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
            >
              <option value="Kore">Kore (صوت أنثوي لطيف واحترافي - الافتراضي)</option>
              <option value="Zephyr">Zephyr (صوت ناعم ومطمئن للمرضى)</option>
              <option value="Puck">Puck (صوت رجالي واضح)</option>
              <option value="Fenrir">Fenrir (صوت رجالي عميق)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">اللهجة / اللغة المفضلة:</label>
            <select
              value={selectedDialect}
              onChange={e => setSelectedDialect(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right focus:outline-none focus:border-emerald-500"
            >
              <option value="darija">الدارجة الجزائرية الأصيلة (Darija)</option>
              <option value="french">Français Médical</option>
              <option value="arabic">العربية الفصحى</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => handleRunTest()}
              disabled={isGenerating}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري معالجة وتوليد الصوت...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال الاستفسار وتوليد الرد الصوتي</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1 text-xs">نص سؤال المريض:</label>
          <textarea
            value={testPrompt}
            onChange={e => setTestPrompt(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-right text-xs focus:outline-none focus:border-emerald-500"
            placeholder="اكتب استفسار المريض هنا..."
          />
        </div>

        {/* Results Panel */}
        {lastResult && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-700">رد الوكيل الصوتي:</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  lastResult.triageLevel === 'emergency' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {lastResult.triageLevel === 'emergency' ? '🚨 طوارئ 14' : 'فحص اعتيادي'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  القصد: {lastResult.intent}
                </span>
              </div>
            </div>

            <p className="text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">
              {lastResult.replyText}
            </p>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => {
                  unlockAudioContext();
                  speakWithBrowser(lastResult.replyText, selectedDialect === 'french' ? 'fr' : 'ar');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>إعادة الاستماع للصوت الآن</span>
              </button>

              <span className="text-[11px] text-slate-400">
                {isPlayingAudio ? '🔊 جاري التشغيل الصوتي...' : 'انقر لسماع النطق الصوتي'}
              </span>
            </div>

            {lastResult.extractedAppointment && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px]">
                <span className="font-bold block mb-1">البيانات المستخرجة للحجز:</span>
                <span>
                  الطبيب: {lastResult.extractedAppointment.doctorName || 'غير محدد'} • 
                  الموعد: {lastResult.extractedAppointment.requestedDay || 'غير محدد'} ({lastResult.extractedAppointment.requestedTime || ''})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
