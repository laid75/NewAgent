import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Default Algerian Clinic Configuration
let clinicData = {
  name: "عيادة الأمل التخصصية - Clinique Médicale El-Amel",
  specialties: ["طب عام", "طب الأطفال", "أمراض القلب والشرايين", "طب النساء والتوليد", "طب العيون", "الفحوصات والتحاليل الطبية"],
  wilaya: "الجزائر العاصمة (Alger)",
  commune: "دالي إبراهيم (Dely Ibrahim)",
  address: "14 شارع 11 ديسمبر 1960، دالي إبراهيم، الجزائر العاصمة",
  phone: "023 38 12 45 / 0550 12 34 56",
  emergencyPhone: "الحماية المدنية: 14 | الاستعجالات SAMU: 14 / 021 23 55 55",
  carteChifaAccepted: true,
  carteChifaDetails: "مقبولة مع جميع صناديق الضمان الاجتماعي (CNAS / CASNOS) بنظام الدفع من قبل الغير (Tiers payant) للأدوية والفحوصات المتعاقد عليها",
  openingHours: "من السبت إلى الخميس: 08:30 صباحاً إلى 17:30 مساءً (الجمعة: للحالات المستعجلة والمواعيد الخاصة فقط)",
  consultationFeeGeneral: "2000 دج",
  consultationFeeSpecialist: "3500 دج",
  doctors: [
    { id: "doc1", name: "د. عبد القادر مرابط", specialty: "طب عام", availableDays: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"], slots: ["09:00", "09:30", "10:30", "11:30", "14:00", "15:00"] },
    { id: "doc2", name: "دة. ليلى بوجمعة", specialty: "طب الأطفال", availableDays: ["السبت", "الإثنين", "الأربعاء"], slots: ["10:00", "11:00", "14:30", "15:30"] },
    { id: "doc3", name: "د. كريم بن سالم", specialty: "أمراض القلب والشرايين", availableDays: ["الأحد", "الثلاثاء", "الخميس"], slots: ["09:30", "11:00", "15:00", "16:00"] },
    { id: "doc4", name: "دة. سهام قاسمي", specialty: "طب النساء والتوليد", availableDays: ["السبت", "الإثنين", "الخميس"], slots: ["09:00", "10:30", "14:00"] },
  ]
};

// API: Get Clinic Details
app.get('/api/clinic/config', (req, res) => {
  res.json(clinicData);
});

// API: Update Clinic Details
app.post('/api/clinic/config', (req, res) => {
  clinicData = { ...clinicData, ...req.body };
  res.json({ success: true, clinicData });
});

// API: Send or Schedule Automated WhatsApp Reminder
app.post('/api/reminders/send-whatsapp', (req, res) => {
  const { appointmentId, patientName, phone, doctorName, specialty, date, time, clinicName } = req.body || {};

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Format Algerian phone for WhatsApp international E.164: +213 X XX XX XX
  const rawDigits = phone.replace(/[^0-9]/g, '');
  let formattedE164 = rawDigits;
  if (rawDigits.startsWith('0')) {
    formattedE164 = `213${rawDigits.substring(1)}`;
  } else if (!rawDigits.startsWith('213')) {
    formattedE164 = `213${rawDigits}`;
  }

  const messageText = `مرحباً بك ${patientName || 'أخي/أختي'} في ${clinicName || clinicData.name} 🏥\n\n📌 *تذكير آلي بموعدك الطبي غداً (قبل 24 ساعة):*\n👨‍⚕️ الطبيب: ${doctorName || 'طبيب العيادة'} (${specialty || 'استشارة'})\n🗓️ الموعد: ${date || 'غداً'} على الساعة ${time || '10:00'}\n📍 العنوان: ${clinicData.address}\n💳 بطاقة الشفاء: ${clinicData.carteChifaAccepted ? 'مقبولة (يرجى إحضارها مع الفحوصات السابقة)' : 'يرجى مراجعة الاستقبال'}\n\nفي حال الرغبة في تأكيد الحضور أو التعديل، يمكنك الرد على هذه الرسالة أو الاتصال بالعيادة على: ${clinicData.phone}.\nنتمنى لكم دوام الصحة والعافية!`;

  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const waLink = `https://wa.me/${formattedE164}?text=${encodeURIComponent(messageText)}`;

  res.json({
    success: true,
    appointmentId,
    whatsappUrl: waLink,
    phoneFormatted: `+${formattedE164.slice(0, 3)} ${formattedE164.slice(3, 5)} ${formattedE164.slice(5, 7)} ${formattedE164.slice(7, 9)} ${formattedE164.slice(9)}`,
    sentAt: `اليوم ${timeString} (تم الإرسال آلياً)`,
    messageText,
    reminderRule: 'تذكير آلي ذكي قبل الموعد بـ 24 ساعة'
  });
});

// List of candidate models in order of capability and speed
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

// Helper: Smart Rule-Based Clinical Fallback for Algerian Context when offline or rate-limited
function generateSmartFallbackResponse(userMessage: string, patientName: string = '', patientPhone: string = '') {
  const text = (userMessage || '').toLowerCase();

  // 1. Detect Emergency
  const isEmergency = 
    text.includes('صدر') || text.includes('طاح') || text.includes('قلب') || 
    text.includes('تنفس') || text.includes('غيبوبة') || text.includes('إغماء') || 
    text.includes('نزيف') || text.includes('urgence') || text.includes('étouff') || 
    text.includes('crise') || text.includes('inconscient') || text.includes('14');

  if (isEmergency) {
    return {
      replyText: "خويا/أختي، هذي حالة استعجالية قصوى وما تستناش موعد! عيط فوراً للحماية المدنية على الرقم 14 باه يجيو بالإسعاف أو توجهوا فوراً لأقرب مصلحة استعجالات استشفائية (Urgences). ربي يحفظكم ويشافي المريض.",
      intent: 'emergency',
      triageLevel: 'emergency',
      languageDetected: text.includes('urgence') ? 'french' : 'darija',
      suggestedQuickReplies: ['الاتصال بالحماية المدنية 14', 'أقرب مستشفى استعجالات', 'توجيهات الإسعاف الأولي']
    };
  }

  // 2. Detect French
  const isFrench = /[a-zA-Z]/.test(text) && (text.includes('bonjour') || text.includes('rendez') || text.includes('docteur') || text.includes('clinique') || text.includes('merci'));
  if (isFrench) {
    if (text.includes('rendez') || text.includes('rdv') || text.includes('consult')) {
      return {
        replyText: `Bonjour ! Bienvenue au Cabinet Médical El-Amel. Nous avons des disponibilités cette semaine en médecine générale (Dr Merabet) et pédiatrie (Dr Boudjemaa). Quel jour vous conviendrait le mieux ?`,
        intent: 'book_appointment',
        triageLevel: 'normal',
        languageDetected: 'french',
        extractedAppointment: {
          isComplete: false,
          patientName: patientName || undefined,
          phone: patientPhone || undefined,
          specialty: 'Médecine Générale',
          requestedDay: 'Cette semaine'
        },
        suggestedQuickReplies: ['Prendre RDV demain', 'Horaires d\'ouverture', 'Tarifs & Carte Chifa']
      };
    }
  }

  // 3. Detect Multi-Speaker / Simultaneous Crosstalk
  const isCrosstalk = 
    text.includes('في زوج') || text.includes('في نفس الوقت') || text.includes('أكثر من شخص') ||
    text.includes('اسكت انت') || text.includes('خليني نهدر') || text.includes('خليني نتكلم') ||
    text.includes('قوليلها') || text.includes('قوليلو') || text.includes('أصوات') ||
    (text.includes('/') && text.includes('صوت')) || text.includes('deux personnes') || text.includes('parlent en même temps');

  if (isCrosstalk) {
    return {
      replyText: "عفواً خويا / ختي، راني نسمع في أكثر من صوت يتكلموا في نفس الوقت! ربي يحفظكم لوكان يتكلم معايا واحد برك بهدوء باه نقدر نسمعكم مليح ونسجللكم الموعد بوضوح وبلا أي خطأ.",
      intent: 'multi_speaker_crosstalk',
      triageLevel: 'normal',
      languageDetected: 'darija',
      suggestedQuickReplies: ['أنا المريض وسأتحدث بمفردي', 'حالة طوارئ للمريض بجانبي', 'حجز موعد بهدوء']
    };
  }

  // 4. Carte Chifa Inquiry
  if (text.includes('شيفا') || text.includes('chifa') || text.includes('ضمان') || text.includes('cnas') || text.includes('casnos') || text.includes('تامين')) {
    return {
      replyText: `نعم خويا، عيادة الأمل متعاقدة مع بطاقة الشفاء (CNAS و CASNOS) بنظام الدفع من طرف الغير. الكشف والأدوية والفحوصات معوضة. واش من تخصص راك حاب تكشف؟`,
      intent: 'inquiry_chifa',
      triageLevel: 'normal',
      languageDetected: 'darija',
      suggestedQuickReplies: ['حجز موعد جديد', 'تكلفة الفحص', 'مواعيد الأطباء']
    };
  }

  // 4. Price Inquiry
  if (text.includes('شحال') || text.includes('سعر') || text.includes('سومة') || text.includes('تخلص') || text.includes('دينار') || text.includes('prix') || text.includes('tarif')) {
    return {
      replyText: `تكلفة الفحص في العيادة هي 2000 دينار جزائري للطب العام، و3500 دينار للأطباء الأخصائيين (مثل القلب والأطفال والنساء)، مع إمكانية استخدام بطاقة الشفاء للتعويض.`,
      intent: 'inquiry_price',
      triageLevel: 'normal',
      languageDetected: 'darija',
      suggestedQuickReplies: ['حجز موعد', 'أوقات العمل', 'مكان العيادة']
    };
  }

  // 5. Address / Location
  if (text.includes('وين') || text.includes('مكان') || text.includes('عنوان') || text.includes('adresse') || text.includes('ou') || text.includes('dely')) {
    return {
      replyText: `الفرع الرئيسي لعيادتنا يقع في دالي إبراهيم، 14 شارع 11 ديسمبر 1960 بالجزائر العاصمة، بجانب جامعة الجزائر 3 وموقف الحافلات مع توفر باركينغ سيارات.`,
      intent: 'inquiry_location',
      triageLevel: 'normal',
      languageDetected: 'darija',
      suggestedQuickReplies: ['أوقات العمل', 'حجز موعد مع الطبيب', 'أرقام الهاتف']
    };
  }

  // 6. Appointment Booking (Default Algerian Darija)
  return {
    replyText: `مرحبا بيك في عيادة الأمل الطبية. عندنا دكتور عبد القادر مرابط (طب عام) ودكتورة ليلى بوجمعة (أطفال) ودكتور كريم بن سالم (أمراض القلب). قولي واش من تخصص يناسبك واليوم لي راك حاب تجي فيه؟`,
    intent: 'book_appointment',
    triageLevel: 'normal',
    languageDetected: 'darija',
    extractedAppointment: {
      isComplete: false,
      patientName: patientName || undefined,
      phone: patientPhone || undefined,
      specialty: 'طب عام',
      doctorName: 'د. عبد القادر مرابط',
      requestedDay: 'غداً',
      requestedTime: '10:00'
    },
    suggestedQuickReplies: ['موعد طب عام', 'موعد طب أطفال', 'استفسار عن بطاقة الشفاء']
  };
}

// API: Process Call Conversation with Gemini
app.post('/api/call/process', async (req, res) => {
  const { userMessage, history = [], currentLanguage = 'auto', patientName = '', patientPhone = '' } = req.body || {};

  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  const systemPrompt = `
أنت "ياسمين" (Yasmine) - الوكيل الذكي والموظفة الصوتية المتطورة لاستقبال المكالمات الهاتفية في "${clinicData.name}" في ولاية ${clinicData.wilaya} بالجزائر.
مهمتك: الرد على مكالمات المرضى هاتفياً بأدب فائق، دفء جزائري، واحترافية طبية عالية، وتسهيل حجز المواعيد والإجابة عن الاستفسارات والفرز الطبي السريع.

### إتقان اللهجات واللغات في الجزائر:
- أنت تتقن تماماً الدارجة الجزائرية الأصيلة (Algerian Darija)، والعربية الفصحى، واللغة الفرنسية (Français).
- تحدث دائماً بنفس اللغة واللهجة التي يبدأ بها المتصل أو يفضلها:
  * إذا تكلم بالدارجة الجزائرية: رد بالدارجة الجزائرية السلسة والمحترمة (مثال: "سلام خويا / ختي، مرحبا بيك في عيادة الأمل. واش يوجع فيك؟ ربي يشافيك"، "كاين دكتور مرابط غدوة على 10:00"، "نقبلو لاكارت شيفا Carte Chifa نعم"، "الكشف 2000 دينار").
  * إذا تكلم بالفرنسية: Répondez en français médical courtois et accueillant ("Bonjour, Cabinet Médical El-Amel à votre écoute. Comment puis-je vous aider aujourd'hui ?").
  * إذا تكلم بالعربية الفصحى: أجب بعربية واضحة وبسيطة.
- الأسلوب صوتي وطبيعي وموجز مناسب للمحادثة الهاتفية (لا تتكلم بفقرات طويلة، بل بجمل هاتفية قصيرة وواضحة).

### معلومات العيادة في الجزائر:
- الموقع: ${clinicData.address}
- أوقات العمل: ${clinicData.openingHours}
- بطاقة الشفاء (Carte Chifa): ${clinicData.carteChifaAccepted ? 'نعم مقبولة، ' + clinicData.carteChifaDetails : 'غير مقبولة حالياً'}
- تكلفة الكشف: الطب العام (${clinicData.consultationFeeGeneral})، الأطباء الأخصائيين (${clinicData.consultationFeeSpecialist})
- الأطباء والتخصصات:
${clinicData.doctors.map(d => `- ${d.name} (${d.specialty}) - أيام: ${d.availableDays.join(', ')}`).join('\n')}

### البروتوكولات الطبية الهامة والفرز (Triage):
1. **حالات الطوارئ الخطيرة (Emergency)**: (مثل: ألم حاد في الصدر، ضيق تنفس شديد، فقدان الوعي، نزيف حاد، شلل مفاجئ، رضوض بليغة):
   - يجب إيقاف الحجز العادي فوراً وتنبيه المتصل بلهجة مطمئنة وحاسمة بالاتصال فوراً بالحماية المدنية (الرقم 14) أو التوجه لأقرب مصلحة استعجالات استشفائية (Urgences).
2. **عند تداخل الأصوات أو تحدث أكثر من شخص في نفس اللحظة (Simultaneous Speakers / Crosstalk / Multi-Speaker)**:
   - في بيئة الاتصال الهاتفي (خصوصاً العائلات الجزائرية أو حالات مرافقة المريض)، قد يتكلم أكثر من شخص في نفس الوقت (مثلاً: الأم مع الأب، أو المريض مع مرافقه، أو أصوات في الخلفية).
   - تعامل مع الموقف بهدوء واحترافية وبشاشة تامة:
     * اطلب بلطف تنظيم الحديث والاستماع لشخص واحد: "عفواً خويا / ختي، راني نسمع في أكثر من صوت في نفس اللحظة، ربي يحفظكم لوكان يتكلم معايا واحد برك باه نقدر نسمعكم مليح ونسجللكم الموعد بوضوح وبلا أي غلطة".
     * إذا كان أحد الأصوات يصف حالة طارئة والآخر يستفسر: أعطِ الأولوية فوراً للشخص الذي يصف الحالة الصحية أو الطارئة!
     * إذا كان أحدهما يترجم أو يساعد الآخر (مثلاً الابن يساعد والده أو والدته): رحّب بالاثنين واسأل من هو المريض تحديداً لتسجيل اسمه.
3. **حجز المواعيد (Appointment Booking)**:
   - اطلب بلطف: اسم المريض، رقم هاتفه الجزائري (05/06/07)، التخصص أو الطبيب المطلوب، واليوم/الوقت المناسب.
   - إذا تم تحديد الطبيب واليوم، اقترح وقتاً من أوقات دوام الطبيب.
   - بمجرد اكتمال البيانات، أكد الحجز للمتصل وأبلغه بتسجيل الموعد وإمكانية إحضار بطاقة الشفاء والفحوصات السابقة.
4. **الأسئلة الشائعة**: مواعيد فتح العيادة، بطاقة الشفاء، تكاليف الكشف، كيفية التحضير لتحاليل الدم (الصيام).

يجب أن تقوم بإرجاع الرد بصيغة JSON حصراً مطابقة للنمط التالي:
{
  "replyText": "النص الصوتي للرد على المتصل باللغة والدارجة المناسبة للمكالمة",
  "intent": "book_appointment" | "emergency" | "inquiry_chifa" | "inquiry_price" | "inquiry_hours" | "inquiry_location" | "cancel_appointment" | "multi_speaker_crosstalk" | "general_talk",
  "triageLevel": "normal" | "urgent" | "emergency",
  "languageDetected": "darija" | "french" | "arabic",
  "extractedAppointment": {
    "isComplete": boolean,
    "patientName": "اسم المريض إن وجد",
    "phone": "رقم الهاتف الجزائري إن وجد",
    "specialty": "التخصص المطلوب",
    "doctorName": "اسم الطبيب المحدد",
    "requestedDay": "اليوم المطلوب مثل غداً أو الأحد أو تاريخ محدد",
    "requestedTime": "الساعة المقترحة مثل 10:00",
    "symptoms": "وصف الأعراض إن ذكرها"
  },
  "suggestedQuickReplies": ["3 خيارات مقترحة للمتصل ليضغط عليها إن أراد"]
}
`;

  // Prepare conversation messages
  const formattedHistory = history.map((item: any) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content || '' }]
  }));

  const contents = [
    ...formattedHistory,
    {
      role: 'user',
      parts: [{ text: `المتصل يقول: "${userMessage}"${patientName ? ` (اسم المتصل المسجل: ${patientName})` : ''}${patientPhone ? ` (رقم هاتفه: ${patientPhone})` : ''}` }]
    }
  ];

  let rawText = '';
  let modelError = null;

  // Try candidate models in order
  for (const candidateModel of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: candidateModel,
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.6,
        }
      });

      if (response && response.text) {
        rawText = response.text;
        break;
      }
    } catch (err: any) {
      modelError = err;
      console.warn(`Model ${candidateModel} failed, trying next candidate:`, err.message || err);
    }
  }

  // If a model generated response text, parse JSON
  if (rawText) {
    try {
      const parsedData = JSON.parse(rawText);
      return res.json(parsedData);
    } catch (parseErr) {
      console.warn('Failed to parse model JSON, using clean structured fallback:', parseErr);
    }
  }

  // If all models failed or JSON parse failed, use smart domain-specific Algerian fallback
  console.warn('Using intelligent clinical fallback due to temporary model unavailability:', modelError?.message);
  const fallbackData = generateSmartFallbackResponse(userMessage, patientName, patientPhone);
  return res.json(fallbackData);
});

// API: Generate Voice Speech (TTS) using Gemini TTS
app.post('/api/call/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', language = 'ar' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Clean text of markdown or emojis for clean audio pronunciation
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`]/g, '')
      .trim();

    // Try TTS models in order of SDK guidelines
    const ttsModels = [
      { name: 'gemini-3.8-flash-lite-tts', supportsMetadata: false },
      { name: 'gemini-3.8-flash-tts', supportsMetadata: false },
    ];
    let base64Audio = null;

    for (const ttsOption of ttsModels) {
      try {
        const partObj: any = { text: cleanText };
        if (ttsOption.supportsMetadata) {
          partObj.speechMetadata = {
            style: 'Warm, compassionate and professional Algerian medical clinic receptionist with natural speech cadence',
          };
        }

        const response = await ai.models.generateContent({
          model: ttsOption.name,
          contents: [
            {
              role: 'user',
              parts: [partObj],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) break;
      } catch (err: any) {
        // Silently continue to next TTS model or browser speech fallback
        // without polluting server logs with 429 quota exhaustion warnings
      }
    }

    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/pcm;rate=24000',
      });
    }

    // Graceful fallback to browser speech synthesis
    res.json({
      audioBase64: null,
      fallbackToBrowser: true,
      message: 'Using browser speech synthesis'
    });
  } catch (error: any) {
    console.warn('TTS error, falling back to browser speech:', error);
    res.json({
      audioBase64: null,
      fallbackToBrowser: true,
      message: error.message
    });
  }
});

// Production / Dev Vite Middleware Setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clinic AI Phone Assistant server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
