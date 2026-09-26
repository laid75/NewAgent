import React, { useState } from 'react';
import { 
  PhoneCall, Server, ShieldCheck, Code, Copy, 
  Check, XCircle, Globe, Terminal, ArrowRight
} from 'lucide-react';

interface IntegrationGuideModalProps {
  onClose: () => void;
}

export const IntegrationGuideModal: React.FC<IntegrationGuideModalProps> = ({ onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const sampleAsteriskConfig = `; /etc/asterisk/extensions.conf
; ربط خط العيادة الجزائري (Algérie Télécom / Ooredoo / Djezzy / Mobilis SIP Trunk) بالوكيل الذكي

[clinic-incoming-algeria]
exten => 023381245,1,NoOp(Appel entrant Clinique El-Amel)
 same => n,Answer()
 same => n,Wait(1)
 ; إرسال تدفق الصوت المباشر إلى Webhook الوكيل الذكي عبر WebSocket أو FastAGI
 same => n,AGI(agi://localhost:4573/clinic-voice-agent)
 same => n,Hangup()`;

  const sampleWebhookNode = `// server-sip-webhook.js
import express from 'express';
const app = express();

app.post('/api/telephony/incoming-call', async (req, res) => {
  const callerNumber = req.body.From; // e.g. +213550123456
  
  // الرد بملف صوتي ترحيبي أو ربط الجلسة بـ Gemini Live API
  res.type('text/xml');
  res.send(\`
    <Response>
      <Say language="ar-DZ">سلام عليكم، عيادة الأمل الطبية ترحب بكم، تفضل أخي.</Say>
      <Gather input="speech" action="/api/call/process-speech" language="ar-DZ" />
    </Response>
  \`);
});`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Server className="w-5 h-5 text-emerald-600" />
            <span>دليل ربط الوكيل الذكي بالخطوط الهاتفية في الجزائر (VoIP / SIP)</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700">الخطوة 1: الحصول على خط SIP Trunk جزائري</span>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">1</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              يمكن لعيادتكم الحصول على خط رقم ثابت أو محمول مخصص من المتعاملين في الجزائر:
              <strong className="block text-slate-800 mt-1">
                • اتصالات الجزائر (Algérie Télécom - خطوط سيب ترانك للشركات والعيادات)
                <br />
                • أوريدو بزنس (Ooredoo Business - Cloud PBX)
                <br />
                • موبيليس / جيزي (Mobilis / Djezzy Corporate VoIP)
              </strong>
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700">الخطوة 2: ربط الموزع الهاتفي (PBX / Asterisk)</span>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">2</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              عند ورود أي مكالمة من مريض، يقوم السيرفر بتحويل الصوت تلقائياً إلى خادم Node.js / Gemini API:
            </p>

            <div className="relative bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-left">
              <pre>{sampleAsteriskConfig}</pre>
              <button
                onClick={() => handleCopy(sampleAsteriskConfig)}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
                title="نسخ الكود"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700">الخطوة 3: التوافق مع القانون الجزائري والسر الطبي</span>
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">3</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              وفقاً للقانون الجزائري رقم 18-07 المتعلق بحماية المعطيات ذات الطابع الشخصي وأخلاقيات مهنة الطب، تم تصميم النظام ليقوم بـ:
              <br />
              • تشفير بيانات المرضى وأرقام الهواتف.
              <br />
              • احترام السر المهني الطبي وعدم تسجيل أي معطيات تشخيصية حساسة دون موافقة.
              <br />
              • توجيه فوري ومباشر إلى مصالح الحماية المدنية (14) والاستعجالات الطبية عند الكشف عن حالات الخطر.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
          >
            فهمت، إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
