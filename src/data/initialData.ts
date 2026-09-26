import { ClinicConfig, Appointment, CallLog, DialectScenario } from '../types';

export const initialClinicConfig: ClinicConfig = {
  name: "عيادة الأمل الطبية التخصصية - Clinique Médicale El-Amel",
  specialties: [
    "طب عام",
    "طب الأطفال وحديثي الولادة",
    "أمراض القلب والشرايين",
    "طب وجراحة العظام والمفاصل",
    "أمراض النساء والتوليد",
    "طب العيون",
    "التحاليل والفحوصات المخبرية"
  ],
  wilaya: "الجزائر العاصمة (Wilaya d'Alger)",
  commune: "دالي إبراهيم (Dely Ibrahim)",
  address: "14، شارع 11 ديسمبر 1960، دالي إبراهيم، الجزائر العاصمة",
  phone: "023 38 12 45 / 0550 12 34 56",
  emergencyPhone: "14 (الحماية المدنية) / 021 23 55 55 (استعجالات مصطفى باشا)",
  carteChifaAccepted: true,
  carteChifaDetails: "مقبولة مع نظام التعاقد والتأمين الاجتماعي (CNAS و CASNOS) للمرضى المزمنين والمؤمّن لهم مع تفعيل نظام الدفع من طرف الغير",
  openingHours: "السبت إلى الخميس: من 08:30 إلى 17:30 (الجمعة: مداومة الحالات المستعجلة)",
  consultationFeeGeneral: "2000 دج",
  consultationFeeSpecialist: "3500 دج",
  doctors: [
    {
      id: "doc1",
      name: "د. عبد القادر مرابط",
      specialty: "طب عام",
      availableDays: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
      slots: ["09:00", "09:30", "10:30", "11:30", "14:00", "15:00", "16:00"]
    },
    {
      id: "doc2",
      name: "دة. ليلى بوجمعة",
      specialty: "طب الأطفال وحديثي الولادة",
      availableDays: ["السبت", "الإثنين", "الأربعاء", "الخميس"],
      slots: ["10:00", "11:00", "14:30", "15:30", "16:30"]
    },
    {
      id: "doc3",
      name: "د. كريم بن سالم",
      specialty: "أمراض القلب والشرايين",
      availableDays: ["الأحد", "الثلاثاء", "الخميس"],
      slots: ["09:30", "11:00", "15:00", "16:00"]
    },
    {
      id: "doc4",
      name: "دة. سهام قاسمي",
      specialty: "أمراض النساء والتوليد",
      availableDays: ["السبت", "الإثنين", "الثلاثاء", "الأربعاء"],
      slots: ["09:00", "10:30", "11:30", "14:00", "15:30"]
    }
  ]
};

export const sampleDialectScenarios: DialectScenario[] = [
  {
    id: "scen-1",
    title: "حجز موعد طبيب أطفال (دارجة عاصمية)",
    subtitle: "طفل عنده حمى وبكاء مستمر",
    category: "booking",
    dialectTag: "دارجة جزائرية (Alger)",
    expectedTriage: "normal",
    initialAudioPrompt: "سلام عليكم أختي، وليدي راه مريض بالسخانة من البارح وماحبش ياكل، كاين كاش رانديفو مع طبيبة الأطفال دكتورة بوجمعة لليوم ولا لغدوة؟ راني مقلقة عليه.",
    description: "مكالمة كلاسيكية لحجز موعد مستعجل نسبياً لطفل مع الدكتورة ليلى بوجمعة."
  },
  {
    id: "scen-2",
    title: "حالة طارئة: ألم صدري حاد وضيق تنفس",
    subtitle: "فحص الفرز الفوري وتوجيه للإسعاف 14",
    category: "emergency",
    dialectTag: "دارجة / طوارئ",
    expectedTriage: "emergency",
    initialAudioPrompt: "ألو عيادة الأمل؟ راجلي طاح فالدار يوجعو صدرو بزاف وراه يعرق ومايقدرش يتنفس كامل! واش ندير؟ نجيكم ضرك ولا كيفاش؟",
    description: "اختبار بروتوكول الطوارئ: يجب على الوكيل الذكي إيقاف الحجز والتوجيه فوراً للحماية المدنية 14 أو الاستعجالات الطبية."
  },
  {
    id: "scen-3",
    title: "استفسار عن بطاقة الشفاء وأسعار الكشف",
    subtitle: "مريض يسأل عن التعويض والتكلفة بالدينار",
    category: "chifa",
    dialectTag: "دارجة وهرانية",
    expectedTriage: "normal",
    initialAudioPrompt: "صحا خويا، بغيت نسقسيك الكابيني تاعكم يخدم بلاكارت شيفا Carte Chifa؟ وشحال تخلص الفحصة تاع القلب مع التخطيط ECG ربي يحفظك؟",
    description: "استفسار حول بطاقة الشفاء والأسعار والتغطية التامينية بنظام الدفع من طرف الغير."
  },
  {
    id: "scen-4",
    title: "Prise de rendez-vous en Français",
    subtitle: "Consultation Cardiologie Dr Ben Salem",
    category: "french",
    dialectTag: "Français médical",
    expectedTriage: "normal",
    initialAudioPrompt: "Bonjour madame, je souhaiterais prendre un rendez-vous avec le cardiologue Dr Ben Salem pour un contrôle de tension et un bilan. Quelles sont vos disponibilités cette semaine ?",
    description: "مكالمة بالفرنسية الطبية: يختبر قدرة الوكيل على التبديل الفوري للغة الفرنسية الراقية."
  },
  {
    id: "scen-5",
    title: "متابعة نتائج تحاليل ومواعيد الصيام",
    subtitle: "مريض يسأل عن تحاليل السكر والكولسترول",
    category: "pricing",
    dialectTag: "دارجة قسنطينية / شرقية",
    expectedTriage: "normal",
    initialAudioPrompt: "عسلامة، الطبيب مرابط قالي دير ليزاناليز تاع الدم والسكر. وقتاش نجي الصباح؟ ولازم نكون صايم شحال من ساعة؟",
    description: "إرشادات صيام التحاليل الطبية (12 ساعة) ومواعيد سحب العينات الصباحية في العيادة."
  },
  {
    id: "scen-6",
    title: "تداخل أصوات: شخصان يتحدثان في نفس اللحظة",
    subtitle: "المريض ومرافقه يتكلمان معاً في نفس الوقت (Crosstalk)",
    category: "crosstalk",
    dialectTag: "تداخل أصوات / عائلي",
    expectedTriage: "normal",
    initialAudioPrompt: "ألو؟ (صوت الأب: نحوس على رانديفو للقلب) / (صوت الابن: لا لا يا بابا قولي للعيادة على طبيب السكر خير!)، راكم تسمعوا فينا في زوج؟",
    description: "اختبار بروتوكول تداخل الأصوات (Multi-Speaker): يقوم الوكيل الهاتفي بتهدئة المكالمة بلطف والطلب من شخص واحد التحدث لتسجيل الموعد الصحيح بدون أخطاء."
  }
];

export const sampleInitialAppointments: Appointment[] = [
  {
    id: "apt-1",
    patientName: "كمال بلقاسم",
    phone: "0554 22 18 90",
    doctorName: "د. عبد القادر مرابط",
    specialty: "طب عام",
    date: "اليوم",
    time: "10:30",
    status: "confirmed",
    carteChifa: true,
    notes: "مراجعة الضغط الدموي وتجديد الوصفة الطبية",
    triageLevel: "normal",
    source: "ai_phone",
    createdAt: "منذ 25 دقيقة (مكالمة هاتفية)",
    whatsappReminder: {
      status: 'sent',
      sentAt: 'أمس 10:30 (قبل 24 ساعة)',
      phoneFormatted: '+213 554 22 18 90',
      messagePreview: 'تذكير بموعدكم غداً الساعة 10:30 مع د. عبد القادر مرابط في عيادة الأمل الطبية.'
    }
  },
  {
    id: "apt-2",
    patientName: "نادية سعدي (والدة الطفل أنس)",
    phone: "0661 89 44 20",
    doctorName: "دة. ليلى بوجمعة",
    specialty: "طب الأطفال وحديثي الولادة",
    date: "اليوم",
    time: "14:30",
    status: "confirmed",
    carteChifa: true,
    notes: "التهاب اللوزتين مع حمى 38.8 درجة",
    triageLevel: "urgent",
    source: "ai_phone",
    createdAt: "منذ ساعة (مكالمة هاتفية)",
    whatsappReminder: {
      status: 'sent',
      sentAt: 'أمس 14:30 (قبل 24 ساعة)',
      phoneFormatted: '+213 661 89 44 20',
      messagePreview: 'تذكير بموعدكم اليوم 14:30 مع دة. ليلى بوجمعة - عيادة الأمل.'
    }
  },
  {
    id: "apt-3",
    patientName: "حاج مسعود بوعلام",
    phone: "0770 12 45 78",
    doctorName: "د. كريم بن سالم",
    specialty: "أمراض القلب والشرايين",
    date: "غداً",
    time: "11:00",
    status: "confirmed",
    carteChifa: true,
    notes: "فحص دوري + تخطيط القلب ECG",
    triageLevel: "normal",
    source: "ai_phone",
    createdAt: "منذ 3 ساعات (مكالمة هاتفية)",
    whatsappReminder: {
      status: 'scheduled',
      scheduledTime: 'اليوم 11:00 (آلياً قبل 24 ساعة)',
      phoneFormatted: '+213 770 12 45 78',
      messagePreview: 'جدولة تذكير واتساب الآلي قبل الموعد بـ 24 ساعة.'
    }
  },
  {
    id: "apt-4",
    patientName: "فاطمة الزهراء شريفي",
    phone: "0549 77 33 11",
    doctorName: "دة. سهام قاسمي",
    specialty: "أمراض النساء والتوليد",
    date: "غداً",
    time: "10:30",
    status: "confirmed",
    carteChifa: false,
    notes: "متابعة حمل الشهر السادس وفحص الإيكوغرافي",
    triageLevel: "normal",
    source: "secretary",
    createdAt: "منذ 4 ساعات (أمانة العيادة)",
    whatsappReminder: {
      status: 'scheduled',
      scheduledTime: 'اليوم 10:30 (آلياً قبل 24 ساعة)',
      phoneFormatted: '+213 549 77 33 11',
      messagePreview: 'جدولة تذكير واتساب الآلي قبل الموعد بـ 24 ساعة.'
    }
  }
];

export const sampleInitialCallLogs: CallLog[] = [
  {
    id: "call-101",
    callerNumber: "0554 22 18 90",
    callerName: "كمال بلقاسم",
    timestamp: "10:14 صباحاً",
    durationSeconds: 112,
    intent: "book_appointment",
    language: "darija",
    triageLevel: "normal",
    summary: "حجز موعد طب عام مع د. مرابط اليوم على الساعة 10:30. المتصل استفسر عن بطاقة الشفاء وأكد إحضارها.",
    status: "booked",
    messages: [
      { id: "m1", role: "assistant", content: "سلام عليكم، عيادة الأمل الطبية التخصصية ترحب بكم. معكم ياسمين، واش نقدر نعاونك خويا؟", timestamp: "10:14:02" },
      { id: "m2", role: "patient", content: "سلام أختي، بغيت موعد مع الطبيب العام اليوم يلا كاين بلاصة باغي نجدد الدوا تاع لاطونسيون.", timestamp: "10:14:15" },
      { id: "m3", role: "assistant", content: "مرحبا بيك خويا كمال، كاين موعد متاح مع د. عبد القادر مرابط اليوم على الساعة 10:30 صباحاً. يوالفك هذا الوقت؟ وما تنساش تجيب بطاقة الشفاء معاك.", timestamp: "10:14:35" },
      { id: "m4", role: "patient", content: "إيه مليح بزاف يوالفني، يعطيك الصحة أختي.", timestamp: "10:14:48" },
      { id: "m5", role: "assistant", content: "العفو خويا، تم تأكيد موعدك اليوم على 10:30. عيادتنا في دالي إبراهيم 14 شارع 11 ديسمبر. ربي يشافيك وفي أمان الله.", timestamp: "10:15:02" }
    ]
  },
  {
    id: "call-102",
    callerNumber: "0770 99 88 12",
    callerName: "متصل مجهول (حالة طارئة)",
    timestamp: "09:30 صباحاً",
    durationSeconds: 58,
    intent: "emergency",
    language: "darija",
    triageLevel: "emergency",
    summary: "تنبيه طارئ: ألم حاد ومفاجئ في الصدر لدى الوالد مع تعرق بارد. قام الوكيل الذكي بتوجيهه فوراً للحماية المدنية (14) ومصلحة الاستعجالات.",
    status: "emergency_escalated",
    messages: [
      { id: "m1", role: "assistant", content: "عيادة الأمل الطبية، ياسمين في الاستماع، تفضل أخي.", timestamp: "09:30:05" },
      { id: "m2", role: "patient", content: "ألو عيادة الأمل؟ الوالد راه يتقيا وعندو وجع كبير فقلبو ومايقدرش يتنفس كامل راني خايف عليه!", timestamp: "09:30:18" },
      { id: "m3", role: "assistant", content: "خويا هذي حالة استعجالية قصوى وما تستناش موعد العيادة! عيط فوراً للحماية المدنية على الرقم 14 باه يجيو بالسيارة إسعاف ولا ديه فوراً لأقرب مصلحة استعجالات استشفائية (Urgences). خليه مستلقي وما تخليهش يتحرك حتى تجيه الإسعاف، ربي يحفظو!", timestamp: "09:30:35" }
    ]
  },
  {
    id: "call-103",
    callerNumber: "0661 55 33 88",
    callerName: "Mme Amel Zerrouki",
    timestamp: "أمس 15:40",
    durationSeconds: 85,
    intent: "inquiry_chifa",
    language: "french",
    triageLevel: "normal",
    summary: "استفسار بالفرنسية عن تغطية بطاقة الشفاء لفحوصات القلب والإيكوغرافيا. تم تأكيد قبول البطاقة ونظام الدفع للغير.",
    status: "answered",
    messages: [
      { id: "m1", role: "assistant", content: "Cabinet Médical El-Amel, bonjour ! Que puis-je faire pour vous ?", timestamp: "15:40:02" },
      { id: "m2", role: "patient", content: "Bonjour madame, est-ce que votre clinique applique le tiers payant avec la carte Chifa pour les consultations spécialisées ?", timestamp: "15:40:20" },
      { id: "m3", role: "assistant", content: "Oui tout à fait, madame Zerrouki. Nous acceptons la carte Chifa conventionnée CNAS et CASNOS pour les actes pris en charge. Le tarif reste très accessible.", timestamp: "15:40:45" }
    ]
  }
];
