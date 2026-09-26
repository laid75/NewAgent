import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  AlertTriangle, ShieldAlert, CheckCircle2, User, Clock, 
  Calendar, Sparkles, MessageSquare, RefreshCw, Send, Zap, ChevronRight, HelpCircle
} from 'lucide-react';
import { ClinicConfig, CallMessage, TriageLevel, CallIntent, ExtractedAppointment, DialectScenario } from '../types';
import { sampleDialectScenarios } from '../data/initialData';
import { 
  playPcmAudio, speakWithBrowser, stopCurrentAudio, 
  playPhoneRingTone, playCallConnectedBeep, playCallEndBeep, unlockAudioContext 
} from '../utils/audioPlayer';

interface PhoneCallSimulatorProps {
  clinicConfig: ClinicConfig;
  onNewAppointmentBooked: (apt: ExtractedAppointment) => void;
  onCallLogged: (callData: any) => void;
}

export const PhoneCallSimulator: React.FC<PhoneCallSimulatorProps> = ({
  clinicConfig,
  onNewAppointmentBooked,
  onCallLogged
}) => {
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callerName, setCallerName] = useState('كمال بلقاسم (متصل)');
  const [callerNumber, setCallerNumber] = useState('0554 22 18 90');
  const [callDuration, setCallDuration] = useState(0);
  const [messages, setMessages] = useState<CallMessage[]>([]);
  const [inputSpeechText, setInputSpeechText] = useState('');
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [currentTriage, setCurrentTriage] = useState<TriageLevel>('normal');
  const [lastExtractedApt, setLastExtractedApt] = useState<ExtractedAppointment | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<DialectScenario | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "سلام عليكم، بغيت نحكم رانديفو مع الطبيب",
    "وقتاش يفتح الكابيني؟ وشحال تسوى الفحصة؟",
    "تقبلو بطاقة الشفاء Carte Chifa؟"
  ]);

  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopRingRef = useRef<(() => void) | null>(null);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessingAI]);

  // Call duration counter
  useEffect(() => {
    if (callState === 'connected') {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ar-DZ'; // Default to Algerian Arabic / French auto

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputSpeechText(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition notice:', e.error);
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMicListening = () => {
    if (!recognitionRef.current) {
      alert('ميزة التعرف الصوتي المباشر غير مدعومة في متصفحك، يمكنك كتابة الرسالة مباشرة أو استخدام السيناريوهات الجاهزة.');
      return;
    }

    if (isListeningMic) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningMic(true);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Start Call (Simulate incoming or outgoing call)
  const handleStartCall = (presetScenario?: DialectScenario) => {
    unlockAudioContext();
    stopCurrentAudio();
    setCallDuration(0);
    setMessages([]);
    setCurrentTriage('normal');
    setLastExtractedApt(null);

    if (presetScenario) {
      setSelectedScenario(presetScenario);
      if (presetScenario.category === 'booking') {
        setCallerName('نادية سعدي');
        setCallerNumber('0661 89 44 20');
      } else if (presetScenario.category === 'emergency') {
        setCallerName('متصل مستعجل (طوارئ)');
        setCallerNumber('0770 99 88 12');
      } else if (presetScenario.category === 'french') {
        setCallerName('Mme Amel Zerrouki');
        setCallerNumber('0661 55 33 88');
      } else {
        setCallerName('حاج مسعود');
        setCallerNumber('0550 44 33 22');
      }
    }

    setCallState('ringing');
    stopRingRef.current = playPhoneRingTone();

    // Answer automatically after 2 seconds
    setTimeout(() => {
      if (stopRingRef.current) stopRingRef.current();
      playCallConnectedBeep();
      setCallState('connected');

      // Initial Receptionist greeting
      const isFrench = presetScenario?.category === 'french';
      const greetingText = isFrench
        ? `Cabinet Médical El-Amel, bonjour ! Ici Yasmine, l'assistante virtuelle de la clinique. Comment puis-je vous aider ?`
        : `سلام عليكم، عيادة الأمل الطبية التخصصية ترحب بكم. معكم ياسمين مساعدة الاستقبال، واش نقدر نعاونك خويا؟`;

      const welcomeMsg: CallMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: greetingText,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        intent: 'general_talk',
        triageLevel: 'normal'
      };

      setMessages([welcomeMsg]);
      playVoiceForText(greetingText, isFrench ? 'french' : 'darija');

      // If a scenario was clicked, automatically populate or suggest it
      if (presetScenario) {
        setInputSpeechText(presetScenario.initialAudioPrompt);
      }
    }, 1800);
  };

  const handleEndCall = () => {
    if (stopRingRef.current) stopRingRef.current();
    stopCurrentAudio();
    playCallEndBeep();
    setCallState('ended');
    setIsListeningMic(false);

    // Save call to CRM logs
    if (messages.length > 1) {
      const summaryText = lastExtractedApt?.isComplete
        ? `حجز موعد ${lastExtractedApt.specialty || ''} مع ${lastExtractedApt.doctorName || ''} للمريض ${lastExtractedApt.patientName || callerName}`
        : currentTriage === 'emergency'
        ? `حالة طوارئ استعجالية: تم التوجيه للحماية المدنية 14`
        : `مكالمة استفسار من ${callerName} حول العيادة`;

      onCallLogged({
        id: 'call-' + Date.now(),
        callerNumber,
        callerName,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        durationSeconds: callDuration,
        intent: currentTriage === 'emergency' ? 'emergency' : lastExtractedApt?.isComplete ? 'book_appointment' : 'general_talk',
        language: selectedScenario?.category === 'french' ? 'french' : 'darija',
        triageLevel: currentTriage,
        summary: summaryText,
        status: currentTriage === 'emergency' ? 'emergency_escalated' : lastExtractedApt?.isComplete ? 'booked' : 'answered',
        messages: messages,
        appointmentBooked: lastExtractedApt || undefined
      });
    }
  };

  // Play voice response
  const playVoiceForText = async (text: string, langDetected: string = 'darija') => {
    if (voiceMuted) return;
    setIsSpeakingAudio(true);

    try {
      // 1. Request Gemini TTS from server
      const response = await fetch('/api/call/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: 'Kore',
          language: langDetected === 'french' ? 'fr' : 'ar'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          await playPcmAudio(data.audioBase64, 24000);
          setIsSpeakingAudio(false);
          return;
        }
      }

      // 2. Fallback to Web Speech Synthesis
      await speakWithBrowser(text, langDetected === 'french' ? 'fr' : 'ar');
    } catch (err) {
      console.warn('TTS playback note, falling back to speech synthesis:', err);
      await speakWithBrowser(text, langDetected === 'french' ? 'fr' : 'ar');
    } finally {
      setIsSpeakingAudio(false);
    }
  };

  // Send message to Gemini Call Agent
  const handleSendMessage = async (textToSend?: string) => {
    unlockAudioContext();
    const text = (textToSend || inputSpeechText).trim();
    if (!text || isProcessingAI || callState !== 'connected') return;

    setInputSpeechText('');
    if (isListeningMic && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    }

    const userMsg: CallMessage = {
      id: 'msg-user-' + Date.now(),
      role: 'patient',
      content: text,
      timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsProcessingAI(true);

    try {
      const response = await fetch('/api/call/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          history: newHistory.map(m => ({ role: m.role, content: m.content })),
          patientName: callerName,
          patientPhone: callerNumber
        })
      });

      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        data = {
          replyText: "مرحبا بيك خويا/ختي في عيادة الأمل الطبية، راني نسمع فيك مليح، تقدر تقولي واش من موعد راك حاب تحجز ولا واش راك تحتاج وربي يحفظك.",
          intent: 'general_talk',
          triageLevel: 'normal',
          languageDetected: 'darija',
          suggestedQuickReplies: ['حجز موعد غداً', 'أوقات العمل', 'استفسار عن بطاقة الشفاء']
        };
      }

      // Check triage level
      if (data.triageLevel) {
        setCurrentTriage(data.triageLevel);
      }

      // Check if an appointment was extracted
      if (data.extractedAppointment) {
        setLastExtractedApt(data.extractedAppointment);
        if (data.extractedAppointment.isComplete) {
          onNewAppointmentBooked(data.extractedAppointment);
        }
      }

      if (data.suggestedQuickReplies && Array.isArray(data.suggestedQuickReplies)) {
        setQuickReplies(data.suggestedQuickReplies);
      }

      const assistantMsg: CallMessage = {
        id: 'msg-asst-' + Date.now(),
        role: 'assistant',
        content: data.replyText,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        intent: data.intent,
        triageLevel: data.triageLevel
      };

      setMessages(prev => [...prev, assistantMsg]);
      playVoiceForText(data.replyText, data.languageDetected || 'darija');

    } catch (err) {
      console.error(err);
      const fallbackReply = "سمحلي خويا/ختي، راه كاين انقطاع خفيف فالشبكة. عاود قولي واش راك تحتاج وربي يحفظك.";
      const errAssistantMsg: CallMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setMessages(prev => [...prev, errAssistantMsg]);
      playVoiceForText(fallbackReply, 'darija');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Realistic Algerian Smartphone Simulation */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full max-w-[380px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/60 ring-1 ring-white/10 relative overflow-hidden">
          {/* Phone Speaker & Dynamic Island / Camera Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-2 z-30">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
            <div className="w-10 h-1.5 rounded-full bg-slate-800/80"></div>
          </div>

          {/* Phone Screen */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-[36px] min-h-[620px] max-h-[660px] flex flex-col overflow-hidden text-white relative">
            {/* Top Status Bar */}
            <div className="pt-3 px-6 pb-2 flex items-center justify-between text-xs text-slate-300 border-b border-white/5">
              <span>09:41</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-emerald-400">4G Mobilis</span>
                <span>•</span>
                <span>88%</span>
              </div>
            </div>

            {/* SCREEN CONTENT BASED ON CALL STATE */}
            {callState === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-500/10 shadow-lg">
                  <PhoneCall className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold mb-1 text-white">وكيل العيادة الذكي</h3>
                <p className="text-xs text-slate-300 max-w-[240px] mb-6">
                  مساعد هاتفي صوتي يجيب بالدارجة الجزائرية، العربية والفرنسية على مدار 24/7
                </p>

                {/* Patient Profile Input */}
                <div className="w-full bg-slate-800/60 p-3 rounded-2xl border border-white/10 mb-6 text-right text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>بيانات المتصل الافتراضي</span>
                    <span className="text-[10px] text-emerald-400 font-mono">DZ +213</span>
                  </div>
                  <input 
                    type="text" 
                    value={callerName} 
                    onChange={e => setCallerName(e.target.value)}
                    placeholder="اسم المتصل"
                    className="w-full bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-white border border-white/10 text-xs focus:outline-none focus:border-emerald-500 text-right"
                  />
                  <input 
                    type="text" 
                    value={callerNumber} 
                    onChange={e => setCallerNumber(e.target.value)}
                    placeholder="رقم الهاتف الجزائري (05/06/07)"
                    className="w-full bg-slate-900/80 rounded-lg px-2.5 py-1.5 text-white font-mono border border-white/10 text-xs focus:outline-none focus:border-emerald-500 text-right"
                  />
                </div>

                <button
                  onClick={() => handleStartCall()}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95"
                >
                  <Phone className="w-5 h-5" />
                  <span>بدء المكالمة الآن (Appel)</span>
                </button>
              </div>
            )}

            {callState === 'ringing' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/30 animate-ping absolute inset-0"></div>
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center relative shadow-xl">
                    <User className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>

                <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
                  جاري الاتصال بالعيادة...
                </span>
                <h3 className="text-xl font-bold mb-2">{clinicConfig.name}</h3>
                <p className="text-xs text-slate-400 font-mono mb-8">{clinicConfig.phone}</p>

                <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 py-1.5 px-3 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>الوكيل الصوتي "ياسمين" جاهزة للرد...</span>
                </div>
              </div>
            )}

            {callState === 'connected' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Active Call Header */}
                <div className="p-4 bg-slate-800/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <h4 className="font-bold text-sm text-white">{clinicConfig.name}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <span>ياسمين (مساعد الاستقبال الذكي)</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400">{formatDuration(callDuration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setVoiceMuted(!voiceMuted)}
                      className={`p-2 rounded-full transition ${voiceMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-slate-200'}`}
                      title={voiceMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                    >
                      {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Triage Banner Alert if Urgent or Emergency */}
                {currentTriage === 'emergency' && (
                  <div className="bg-red-950/90 border-y border-red-500/40 p-2.5 flex items-center gap-2.5 text-right text-xs text-red-200 animate-pulse">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <p className="font-bold text-white">تنبيه فرز طبي استعجالي (SAMU 14)</p>
                      <p className="text-[11px] text-red-300">يجب توجيه المتصل فوراً للحماية المدنية أو مصلحة الاستعجالات الطبية</p>
                    </div>
                  </div>
                )}

                {/* Live Audio Visualizer Bar */}
                <div className="bg-slate-950/60 px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-slate-300">
                  <span className="text-[11px] text-slate-400">
                    {isSpeakingAudio ? '🎙️ ياسمين تتحدث الآن...' : isProcessingAI ? '⚡ جاري التفكير ومعالجة الرد...' : '👂 في الاستماع لمكالمتك...'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <span 
                        key={i} 
                        className={`w-1 bg-emerald-400 rounded-full transition-all duration-200 ${
                          isSpeakingAudio 
                            ? 'h-4 animate-bounce' 
                            : isListeningMic 
                            ? 'h-3 bg-blue-400 animate-pulse' 
                            : 'h-1.5 opacity-40'
                        }`} 
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Call Messages / Live Transcript */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs text-right">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'patient' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-0.5 px-1 flex items-center gap-1.5">
                        <span>{msg.role === 'patient' ? callerName : 'ياسمين (العيادة)'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div 
                        className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          msg.role === 'patient'
                            ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                            : msg.triageLevel === 'emergency'
                            ? 'bg-red-900/80 border border-red-500/40 text-red-100 rounded-bl-none'
                            : 'bg-slate-800 text-slate-100 border border-white/10 rounded-bl-none'
                        }`}
                      >
                        <div>{msg.content}</div>
                        {msg.role === 'assistant' && (
                          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                            <button
                              onClick={() => {
                                unlockAudioContext();
                                playVoiceForText(msg.content, selectedScenario?.category === 'french' ? 'french' : 'darija');
                              }}
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                              title="إعادة تشغيل الصوت"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>استماع للصوت</span>
                            </button>
                            <span className="text-slate-500">صوت الذكاء الاصطناعي</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isProcessingAI && (
                    <div className="flex items-center gap-2 text-slate-400 p-2 text-xs">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>ياسمين تكتب وتجهز الرد...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick In-Call Action Bar & End Button */}
                <div className="p-3 bg-slate-900/90 border-t border-white/10 space-y-2">
                  {/* Quick Speech input bar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMicListening}
                      className={`p-2.5 rounded-xl border transition ${
                        isListeningMic 
                          ? 'bg-red-500 text-white border-red-400 animate-pulse' 
                          : 'bg-slate-800 text-slate-200 border-white/10 hover:bg-slate-700'
                      }`}
                      title={isListeningMic ? 'إيقاف الميكروفون' : 'تحدث بالصوت'}
                    >
                      {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        value={inputSpeechText}
                        onChange={e => setInputSpeechText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                        placeholder="تحدث أو اكتب ما تقوله هاتفياً..."
                        className="w-full bg-slate-800/90 text-white text-xs rounded-xl px-3 py-2.5 border border-white/10 focus:outline-none focus:border-emerald-500 text-right pr-3"
                      />
                    </div>

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputSpeechText.trim() || isProcessingAI}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* End Call Button */}
                  <button
                    onClick={handleEndCall}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs shadow-lg transition active:scale-95"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>إنهاء المكالمة (Raccrocher)</span>
                  </button>
                </div>
              </div>
            )}

            {callState === 'ended' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 text-slate-400 flex items-center justify-center mb-4">
                  <PhoneOff className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">تم إنهاء المكالمة</h3>
                <p className="text-xs text-slate-400 mb-4">مدة المكالمة: {formatDuration(callDuration)}</p>

                {lastExtractedApt?.isComplete && (
                  <div className="w-full bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 mb-4 text-right text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم تسجيل الموعد بنجاح في الأجندة!</span>
                    </div>
                    <p className="text-slate-200">
                      الطبيب: {lastExtractedApt.doctorName || 'طبيب مناوب'} ({lastExtractedApt.specialty})
                    </p>
                    <p className="text-slate-300 text-[11px]">
                      الموعد: {lastExtractedApt.requestedDay || 'اليوم'} - {lastExtractedApt.requestedTime || '10:00'}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleStartCall()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>بدء مكالمة تجريبية جديدة</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel, Algerian Scenarios & Extracted Telephony Intelligence */}
      <div className="lg:col-span-7 space-y-6">
        {/* Preset Real-Life Algerian Call Scenarios */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>سيناريوهات واقعية لاختبار اللهجات والفرز الطبي</span>
              </h3>
              <p className="text-xs text-slate-500">
                اضغط على أي سيناريو أدناه لبدء مكالمة فورية ومحاكاة فهم الذكاء الاصطناعي للهجة والمتطلبات الطبية
              </p>
            </div>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/60">
              {sampleDialectScenarios.length} سيناريوهات جاهزة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sampleDialectScenarios.map((scen) => (
              <div 
                key={scen.id}
                onClick={() => handleStartCall(scen)}
                className="group p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition cursor-pointer bg-slate-50/50 hover:bg-white text-right relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scen.category === 'emergency' 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : scen.category === 'french'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : scen.category === 'crosstalk'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {scen.dialectTag}
                  </span>
                  <h4 className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition">
                    {scen.title}
                  </h4>
                </div>

                <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                  "{scen.initialAudioPrompt}"
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 group-hover:text-emerald-600 font-medium">
                    <span>تجربة الاتصال</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </span>
                  <span>{scen.category === 'emergency' ? '🚨 فرز استعجالي' : '📅 حجز / استفسار'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Call Analysis & Structured Extraction */}
        {callState === 'connected' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>التحليل اللحظي للمكالمة واستخراج البيانات</span>
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">حالة الفرز:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                  currentTriage === 'emergency'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : currentTriage === 'urgent'
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}>
                  {currentTriage === 'emergency' ? '🚨 طوارئ قصوى (SAMU)' : currentTriage === 'urgent' ? '⚠️ حالة عاجلة' : '✅ فحص عادي'}
                </span>
              </div>
            </div>

            {/* Quick Suggestions to Click and Test */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">إجابات سريعة مقترحة للمتصل (بنقرة واحدة):</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qr)}
                    disabled={isProcessingAI}
                    className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition text-right"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted Details Card */}
            {lastExtractedApt && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-right space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>البيانات المستخرجة من المحادثة الهاتفية تلقائياً:</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-600">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">المريض:</span>
                    <span className="font-semibold text-slate-800">{lastExtractedApt.patientName || callerName || 'قيد التحديد'}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">الهاتف:</span>
                    <span className="font-mono font-semibold text-slate-800">{lastExtractedApt.phone || callerNumber}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">التخصص / الطبيب:</span>
                    <span className="font-semibold text-emerald-700">{lastExtractedApt.doctorName || lastExtractedApt.specialty || 'طبيب مناوب'}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px]">اليوم والوقت:</span>
                    <span className="font-semibold text-slate-800">{lastExtractedApt.requestedDay || 'قيد الاتفاق'} {lastExtractedApt.requestedTime ? `(${lastExtractedApt.requestedTime})` : ''}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80 col-span-2">
                    <span className="text-slate-400 block text-[10px]">الأعراض المذكورة:</span>
                    <span className="font-medium text-slate-700">{lastExtractedApt.symptoms || 'كشف روتيني واستشارة'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clinic Algerian Key Highlights & Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-right">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-slate-800 mb-1">دعم بطاقة الشفاء Carte Chifa</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              إرشاد المتصلين حول التعاقد مع CNAS و CASNOS والدفع من طرف الغير
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-right">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-slate-800 mb-1">إدارة أوقات الدوام والمناوبات</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              جدولة المواعيد وفق دوام كل طبيب وأيام الحضور في العيادة بدقة
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm text-right">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-slate-800 mb-1">فرز طبي احترافي (Triage)</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              اكتشاف الأعراض الحرجة والتوجيه المباشر للإسعاف 14 والمستشفيات
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
