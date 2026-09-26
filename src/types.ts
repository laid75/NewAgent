export type LanguageCode = 'auto' | 'darija' | 'arabic' | 'french';

export type TriageLevel = 'normal' | 'urgent' | 'emergency';

export type CallIntent = 
  | 'book_appointment'
  | 'emergency'
  | 'inquiry_chifa'
  | 'inquiry_price'
  | 'inquiry_hours'
  | 'inquiry_location'
  | 'cancel_appointment'
  | 'multi_speaker_crosstalk'
  | 'lab_results'
  | 'general_talk';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  availableDays: string[];
  slots: string[];
}

export interface ClinicConfig {
  name: string;
  specialties: string[];
  wilaya: string;
  commune: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  carteChifaAccepted: boolean;
  carteChifaDetails: string;
  openingHours: string;
  consultationFeeGeneral: string;
  consultationFeeSpecialist: string;
  doctors: Doctor[];
}

export interface ExtractedAppointment {
  isComplete: boolean;
  patientName?: string;
  phone?: string;
  specialty?: string;
  doctorName?: string;
  requestedDay?: string;
  requestedTime?: string;
  symptoms?: string;
}

export interface CallMessage {
  id: string;
  role: 'patient' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audioBase64?: string;
  intent?: CallIntent;
  triageLevel?: TriageLevel;
}

export interface WhatsappReminderStatus {
  status: 'sent' | 'scheduled' | 'failed' | 'not_scheduled';
  scheduledTime?: string;
  sentAt?: string;
  phoneFormatted?: string;
  messagePreview?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  carteChifa: boolean;
  notes?: string;
  triageLevel: TriageLevel;
  source: 'ai_phone' | 'secretary' | 'web';
  createdAt: string;
  whatsappReminder?: WhatsappReminderStatus;
}

export interface CallLog {
  id: string;
  callerNumber: string;
  callerName: string;
  timestamp: string;
  durationSeconds: number;
  intent: CallIntent;
  language: 'darija' | 'french' | 'arabic';
  triageLevel: TriageLevel;
  summary: string;
  status: 'answered' | 'missed' | 'emergency_escalated' | 'booked';
  messages: CallMessage[];
  appointmentBooked?: ExtractedAppointment;
}

export interface DialectScenario {
  id: string;
  title: string;
  subtitle: string;
  category: 'booking' | 'emergency' | 'chifa' | 'pricing' | 'french' | 'crosstalk';
  initialAudioPrompt: string;
  expectedTriage: TriageLevel;
  dialectTag: string;
  description: string;
}
