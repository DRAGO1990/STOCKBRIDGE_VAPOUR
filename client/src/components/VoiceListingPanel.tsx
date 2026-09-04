import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Globe,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
  Volume2,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  Radio,
  Edit3,
  Copy,
  Check,
  Flame,
  HelpCircle,
  RotateCcw,
  Clock,
  Layers,
  DollarSign,
  Calendar,
} from 'lucide-react';
import api from '../lib/api';

// ─── Language Configuration ─────────────────────────────────────────────────

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'hi-IN', name: 'Hindi / Hinglish', nativeName: 'हिन्दी / Hinglish', speechCode: 'hi-IN' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (India)', speechCode: 'en-IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
];

const SAMPLE_PROMPTS = [
  {
    label: 'Hinglish Biscuit Lot',
    lang: 'hi-IN',
    text: 'Mere pass 50 biscuit ke packet h jo me 10rs each me bech skta hu air meri expiry date h 20 din ki aur urgency level h medium',
  },
  {
    label: 'Hinglish Oil Batch',
    lang: 'hi-IN',
    text: 'Hamare paas Fortune sunflower oil 1 litre pouch ke 50 packets surplus bache hain, 110 rupees per packet rate hai, expiry 30 din baad ki hai, urgency level low hai.',
  },
  {
    label: 'English Notebooks',
    lang: 'en-IN',
    text: 'We have 200 boxes of Classmate A4 notebooks surplus stock, selling at 85 rupees per box, expiry 60 days from now, urgency level medium.',
  },
  {
    label: 'Kannada Rice Bags',
    lang: 'kn-IN',
    text: 'ನಮ್ಮ ಬಳಿ ಸೋನಾ ಮಸೂರಿ ಅಕ್ಕಿ 25 ಕೆಜಿ 50 ಚೀಲಗಳು ಇವೆ, ಪ್ರತಿ ಚೀಲಕ್ಕೆ 1150 ರೂಪಾಯಿ, 60 ದಿನಗಳು ವ್ಯಾಲಿಡಿಟಿ ಇದೆ, urgency level medium.',
  },
  {
    label: 'Punjabi Wheat Lot',
    lang: 'pa-IN',
    text: 'ਸਾਡੇ ਕੋਲ 100 ਬੋਰੀਆਂ ਕਣਕ ਦਾ ਸਰਪਲਸ ਸਟਾਕ ਹੈ, ਰੇਟ 2200 ਰੁਪਏ ਪ੍ਰਤੀ ਬੋਰੀ, ਮਿਆਦ 30 ਦਿਨ, urgency level high.',
  },
];

// ─── Calendar Date Helpers (Indian Timezone / Calendar Arithmetic) ────────────

export function getTodayDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

export function addCalendarDays(baseDateStr: string, days: number): string {
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days, 12, 0, 0);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function calculateDaysRemaining(targetDateStr: string, baseDateStr?: string): number {
  if (!targetDateStr) return 0;
  const base = baseDateStr || getTodayDateString();
  const [y1, m1, d1] = base.split('-').map(Number);
  const [y2, m2, d2] = targetDateStr.split('-').map(Number);
  const d1Obj = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const d2Obj = new Date(y2, m2 - 1, d2, 12, 0, 0);
  return Math.round((d2Obj.getTime() - d1Obj.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Deterministic Field-First Title Resolver ───────────────────────────────

export function resolveDeterministicTitle(
  rawTitle: string,
  category: string,
  quantity: number,
  unit: string,
  originalTranscript: string = ''
): string {
  const combined = `${rawTitle || ''} ${originalTranscript || ''}`.toLowerCase();

  // 1. Detect Brand
  let brand = '';
  if (/parle[- ]?g\b|parle\b/i.test(combined)) brand = 'Parle-G';
  else if (/britannia\s+good\s+day\b|good\s+day\b/i.test(combined)) brand = 'Britannia Good Day';
  else if (/britannia\s+marie\s+gold\b|marie\s+gold\b/i.test(combined)) brand = 'Britannia Marie Gold';
  else if (/britannia\b/i.test(combined)) brand = 'Britannia';
  else if (/oreo\b/i.test(combined)) brand = 'Oreo';
  else if (/dark\s+fantasy\b|sunfeast\b/i.test(combined)) brand = 'Sunfeast Dark Fantasy';
  else if (/bourbon\b/i.test(combined)) brand = 'Bourbon';
  else if (/monaco\b/i.test(combined)) brand = 'Monaco';
  else if (/patanjali\b/i.test(combined)) brand = 'Patanjali';
  else if (/classmate\b/i.test(combined)) brand = 'Classmate';
  else if (/fortune\b/i.test(combined)) brand = 'Fortune';
  else if (/haldiram|bikano|balaji/i.test(combined)) brand = 'Haldiram';

  const isBiscuitBrand = ['Parle-G', 'Britannia Good Day', 'Britannia Marie Gold', 'Britannia', 'Oreo', 'Sunfeast Dark Fantasy', 'Bourbon', 'Monaco'].includes(brand);

  // 2. Detect Product Noun
  let productNoun = '';
  if (
    /bisc?u[i]?ts?|bisk[u|i]?ts?|biscute|biskoot|cookie|cookies|rusk|namkeen|chips|bread|cake|bakery|बिस्किट|कुकीज|नमकीन/i.test(combined) ||
    isBiscuitBrand ||
    /biscuit|bakery|prepared food/i.test(category || '')
  ) {
    if (/cookie|cookies|कुकीज/i.test(combined)) productNoun = brand ? `${brand} Cookies` : 'Cookies';
    else if (/rusk|रस्क/i.test(combined)) productNoun = brand ? `${brand} Rusk` : 'Rusk';
    else if (/namkeen|नमकीन/i.test(combined)) productNoun = brand ? `${brand} Namkeen` : 'Namkeen';
    else if (/chips|चिप्स/i.test(combined)) productNoun = brand ? `${brand} Chips` : 'Chips';
    else if (/bread|ब्रेड/i.test(combined)) productNoun = brand ? `${brand} Bread` : 'Bread';
    else if (isBiscuitBrand || /bisc?u[i]?ts?|bisk[u|i]?ts?|biscute|biskoot|बिस्किट/i.test(combined)) {
      productNoun = brand ? `${brand} Biscuits` : 'Biscuit';
    } else if (brand) {
      productNoun = `${brand} Biscuits`;
    } else {
      productNoun = 'Biscuit';
    }
  } else if (/oil|tel|ghee|rice|chawal|basmati|atta|flour|wheat|gehu|dal|pulses|sugar|cheeni|masala|तेल|चावल|आटा|दाल|चीनी/i.test(combined)) {
    if (/fortune.*oil|sunflower.*oil/i.test(combined)) productNoun = 'Fortune Sunflower Oil';
    else if (/oil|tel|तेल/i.test(combined)) productNoun = 'Refined Cooking Oil';
    else if (/basmati|chawal|rice|चावल/i.test(combined)) productNoun = 'Basmati Rice';
    else if (/atta|flour|wheat|आटा|गेहूं/i.test(combined)) productNoun = 'Wheat Atta';
    else if (/dal|pulses|दाल/i.test(combined)) productNoun = 'Pulses / Dal';
    else if (/sugar|cheeni|चीनी/i.test(combined)) productNoun = 'Refined Sugar';
    else productNoun = 'Grocery Stock';
  } else if (/notebook|notebooks|copy|copies|register|pen|pens|paper|stationery|किताब|कॉपी|पेन|कागज/i.test(combined)) {
    if (/classmate/i.test(combined)) productNoun = 'Classmate Notebooks';
    else if (/notebook|notebooks|copy|कॉपी/i.test(combined)) productNoun = 'Student Notebooks';
    else if (/pen|pens|पेन/i.test(combined)) productNoun = 'Ballpoint Pens';
    else if (/paper|कागज/i.test(combined)) productNoun = 'A4 Paper Reams';
    else productNoun = 'Office Stationery';
  } else if (/milk|doodh|juice|tea|chai|coffee|beverage|दूध|जूस|चाय|कॉफी/i.test(combined)) {
    if (/milk|doodh|दूध/i.test(combined)) productNoun = 'Packaged Milk';
    else if (/juice|जूस/i.test(combined)) productNoun = 'Fruit Juice';
    else if (/tea|chai|चाय/i.test(combined)) productNoun = 'Premium Tea';
    else productNoun = 'Beverages';
  }

  const capUnit = unit ? unit.charAt(0).toUpperCase() + unit.slice(1) : 'Packets';

  if (productNoun) {
    return `${productNoun} ${capUnit} (Lot of ${quantity || 1})`;
  }

  return 'Surplus Inventory Lot';
}

// ─── STT Provider with Session Continuity ───────────────────────────────────

interface STTCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

interface STTProvider {
  isSupported: () => boolean;
  start: (languageCode: string, callbacks: STTCallbacks) => void;
  stop: () => void;
  isActive: () => boolean;
}

class WebSpeechSTTProvider implements STTProvider {
  private recognition: any = null;
  private running = false;
  private recordingRequested = false;
  private activeSessionId = 0;
  private accumulatedFinalText = '';

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  start(languageCode: string, callbacks: STTCallbacks): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      callbacks.onError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    this.recordingRequested = true;
    this.activeSessionId += 1;
    const currentSessionId = this.activeSessionId;
    this.accumulatedFinalText = '';

    const createAndStart = () => {
      if (!this.recordingRequested || this.activeSessionId !== currentSessionId) {
        return;
      }

      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {
          // Ignore
        }
        this.recognition = null;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = languageCode;
      rec.maxAlternatives = 1;

      rec.onresult = (event: any) => {
        if (this.activeSessionId !== currentSessionId) return;

        let interim = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            newFinal += item[0].transcript + ' ';
          } else {
            interim += item[0].transcript;
          }
        }

        if (newFinal) {
          this.accumulatedFinalText += newFinal;
          callbacks.onResult(this.accumulatedFinalText.trim(), true);
        } else if (interim) {
          const preview = (this.accumulatedFinalText + ' ' + interim).trim();
          callbacks.onResult(preview, false);
        }
      };

      rec.onerror = (event: any) => {
        if (this.activeSessionId !== currentSessionId) return;
        if (event.error === 'no-speech') return;
        if (event.error === 'aborted') return;
        callbacks.onError(`Microphone error: ${event.error}`);
      };

      rec.onend = () => {
        if (this.activeSessionId !== currentSessionId) return;

        if (this.recordingRequested) {
          try {
            setTimeout(() => {
              if (this.recordingRequested && this.activeSessionId === currentSessionId) {
                createAndStart();
              }
            }, 100);
          } catch {
            this.running = false;
            callbacks.onEnd();
          }
        } else {
          this.running = false;
          callbacks.onEnd();
        }
      };

      try {
        rec.start();
        this.running = true;
        this.recognition = rec;
      } catch (err: any) {
        if (this.recordingRequested && this.activeSessionId === currentSessionId) {
          callbacks.onError(`Could not start microphone: ${err.message || err}`);
          this.running = false;
        }
      }
    };

    createAndStart();
  }

  stop(): void {
    this.recordingRequested = false;
    this.activeSessionId += 1;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    this.running = false;
  }

  isActive(): boolean {
    return this.running && this.recordingRequested;
  }
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface ExtractedFields {
  title: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  expiryDate: string;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
  confidence: number;
  missingFields: string[];
}

export interface VoiceListingPanelProps {
  onFieldsExtracted: (fields: ExtractedFields) => void;
}

export const VoiceListingPanel: React.FC<VoiceListingPanelProps> = ({ onFieldsExtracted }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [extraction, setExtraction] = useState<ExtractedFields | null>(null);
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [copied, setCopied] = useState(false);

  // Audio Voiceover State
  const [voiceoverLang, setVoiceoverLang] = useState<string>('hi-IN');
  const [voiceoverScript, setVoiceoverScript] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVoiceoverLoading, setIsVoiceoverLoading] = useState(false);
  const [showScriptText, setShowScriptText] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  const sttProviderRef = useRef<STTProvider>(new WebSpeechSTTProvider());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      sttProviderRef.current.stop();
      stopAudioVisualizer();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // Audio visualizer optional
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const handleStartRecording = useCallback(() => {
    setError('');
    setInterimText('');

    const provider = sttProviderRef.current;
    if (!provider.isSupported()) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    startAudioVisualizer();

    provider.start(selectedLanguage, {
      onResult: (text: string, isFinal: boolean) => {
        if (isFinal) {
          setTranscript(text);
          setInterimText('');
        } else {
          setInterimText(text);
        }
      },
      onError: (errorMsg: string) => {
        setError(errorMsg);
        setIsRecording(false);
        stopAudioVisualizer();
      },
      onEnd: () => {
        setIsRecording(false);
        stopAudioVisualizer();
      },
    });

    setIsRecording(true);
  }, [selectedLanguage]);

  const handleStopRecording = useCallback(() => {
    sttProviderRef.current.stop();
    stopAudioVisualizer();
    setIsRecording(false);
    setInterimText('');
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [isRecording, handleStartRecording, handleStopRecording]);

  // Client-Side Deterministic Field Extractor
  const extractClientSide = (text: string): ExtractedFields => {
    const lower = text.toLowerCase();
    const todayStr = getTodayDateString();

    // 1. Quantity & Unit
    let quantity = 50;
    let unit = 'packets';

    const qtyUnitMatch = lower.match(
      /(\d+)\s*(kg|kilo|bori|katta|bag|bags|peti|dabba|box|boxes|carton|khokha|packet|packets|pouch|pieces|piece|pcs|tin|can|cans|darjan|dozen|ream|reams|liter|litre|litres|लीटर|किलो|बोरी|पैकेट|डिब्बा)/i
    );
    if (qtyUnitMatch) {
      quantity = parseInt(qtyUnitMatch[1], 10);
      const u = qtyUnitMatch[2].toLowerCase();
      if (u.includes('bori') || u.includes('katta') || u.includes('bag') || u.includes('बोरी')) unit = 'bags';
      else if (u.includes('peti') || u.includes('dabba') || u.includes('box') || u.includes('डिब्बा')) unit = 'boxes';
      else if (u.includes('carton') || u.includes('khokha')) unit = 'cartons';
      else if (u.includes('kg') || u.includes('kilo') || u.includes('किलो')) unit = 'kg';
      else if (u.includes('tin') || u.includes('can')) unit = 'cans';
      else if (u.includes('liter') || u.includes('litre') || u.includes('लीटर')) unit = 'litres';
      else if (u.includes('ream')) unit = 'reams';
      else if (u.includes('piece') || u.includes('pcs') || u.includes('darjan') || u.includes('dozen')) unit = 'pieces';
      else unit = 'packets';
    } else {
      const anyNum = lower.match(/\b(\d+)\b/);
      if (anyNum) quantity = parseInt(anyNum[1], 10);
    }

    // 2. Price
    let pricePerUnit = 10;
    const priceMatch =
      lower.match(/(?:₹|rs\.?|rupaye|rupees)\s*(\d+(?:\.\d+)?)/i) ||
      lower.match(/(\d+(?:\.\d+)?)\s*(?:rs|rupees|₹|रुपये|रुपए)\s*(?:each|per|\/|में|me)?/i) ||
      lower.match(/(\d+(?:\.\d+)?)\s*(?:each|per|\/)/i);
    if (priceMatch) {
      pricePerUnit = parseFloat(priceMatch[1]) || 10;
    }

    // 3. Category
    let category = 'Groceries';
    if (/bisc?u[i]?ts?|bisk[u|i]?ts?|cookie|rusk|namkeen|chips|bread|cake|bakery|parle|oreo|britannia|sunfeast/i.test(lower)) {
      category = 'Prepared Food & Bakery';
    } else if (/oil|tel|rice|chawal|atta|flour|dal|sugar/i.test(lower)) {
      category = 'Groceries';
    } else if (/notebook|pen|paper|stationery|copy/i.test(lower)) {
      category = 'Stationery';
    } else if (/milk|doodh|juice|tea|chai/i.test(lower)) {
      category = 'Dairy & Beverages';
    }

    // 4. Deterministic Canonical Title
    const title = resolveDeterministicTitle('', category, quantity, unit, text);

    // 5. Urgency
    let urgency: 'low' | 'medium' | 'high' = 'low';
    if (
      /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*medium\b/i.test(lower) ||
      /\bmedium\s*(?:urgency|priority)\b/i.test(lower) ||
      /(?:मीडियम\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*मीडियम|मध्यम)/i.test(lower)
    ) {
      urgency = 'medium';
    } else if (
      /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*high\b/i.test(lower) ||
      /\bhigh\s*(?:urgency|priority)\b/i.test(lower) ||
      /(?:हाई\s*अर्जेंसी|तुरंत|जल्दी)/i.test(lower)
    ) {
      urgency = 'high';
    }

    // 6. Expiry Date (Relative calendar arithmetic)
    let expiryDate = '';
    const daysMatch = lower.match(/(\d+)\s*(?:din|days|दिन)/i);
    const weeksMatch = lower.match(/(\d+)\s*(?:hafte|weeks|हफ्ते)/i);
    const monthsMatch = lower.match(/(\d+)\s*(?:mahine|months|महीने)/i);

    if (daysMatch) {
      expiryDate = addCalendarDays(todayStr, Math.max(10, parseInt(daysMatch[1], 10)));
    } else if (weeksMatch) {
      expiryDate = addCalendarDays(todayStr, Math.max(10, parseInt(weeksMatch[1], 10) * 7));
    } else if (monthsMatch) {
      expiryDate = addCalendarDays(todayStr, parseInt(monthsMatch[1], 10) * 30);
    } else if (urgency === 'high') {
      expiryDate = addCalendarDays(todayStr, 12);
    } else {
      expiryDate = addCalendarDays(todayStr, 30);
    }

    return {
      title,
      category,
      quantity,
      unit,
      pricePerUnit,
      expiryDate,
      urgency,
      notes: `Lot of ${quantity} ${unit} offered at ₹${pricePerUnit} per ${unit}. Expiry: ${expiryDate}. Urgency: ${urgency}.`,
      confidence: 0.95,
      missingFields: [],
    };
  };

  // Client-Side Final Normalizer applied to ALL paths (Gemini, Server Fallback, Local Fallback)
  const normalizeExtraction = (raw: any, sourceTranscript: string): ExtractedFields => {
    const fallback = extractClientSide(sourceTranscript);

    const category = raw?.category || fallback.category;
    const quantity = Math.max(1, parseInt(String(raw?.quantity), 10) || fallback.quantity);
    const unit = raw?.unit || fallback.unit;
    const pricePerUnit = parseFloat(String(raw?.pricePerUnit)) || fallback.pricePerUnit;

    // MANDATORY DETERMINISTIC TITLE RESOLUTION
    const title = resolveDeterministicTitle(raw?.title || '', category, quantity, unit, sourceTranscript);

    // DETERMINISTIC CALENDAR EXPIRY OVERRIDE
    const todayStr = getTodayDateString();
    let expiryDate = fallback.expiryDate;
    const lower = sourceTranscript.toLowerCase();
    const daysMatch = lower.match(/(\d+)\s*(?:din|days|दिन)/i);
    if (daysMatch) {
      expiryDate = addCalendarDays(todayStr, Math.max(10, parseInt(daysMatch[1], 10)));
    } else if (raw?.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(String(raw.expiryDate))) {
      expiryDate = String(raw.expiryDate);
    }

    // DETERMINISTIC URGENCY OVERRIDE
    let urgency: 'low' | 'medium' | 'high' = fallback.urgency;
    if (raw?.urgency === 'high' || raw?.urgency === 'medium' || raw?.urgency === 'low') {
      if (
        /\burgency\s*(?:level)?\s*(?:is|h|hai)?\s*[:=]?\s*medium\b/i.test(lower) ||
        /\bmedium\s*(?:urgency|priority)\b/i.test(lower) ||
        /(?:मीडियम\s*अर्जेंसी|मध्यम)/i.test(lower)
      ) {
        urgency = 'medium';
      } else {
        urgency = raw.urgency;
      }
    }

    return {
      title,
      category,
      quantity,
      unit,
      pricePerUnit,
      expiryDate,
      urgency,
      notes: raw?.notes || fallback.notes,
      confidence: raw?.confidence || fallback.confidence,
      missingFields: raw?.missingFields || [],
    };
  };

  const handleParse = useCallback(async () => {
    const textToParse = transcript.trim();
    if (!textToParse) {
      setError('Please speak or type listing details before extracting.');
      return;
    }

    setIsParsing(true);
    setError('');
    setExtraction(null);
    setVoiceoverScript('');
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }

    try {
      const res = await api.post('/voice/parse', {
        transcript: textToParse,
        language: selectedLanguage,
      });

      if (res.data.success && res.data.extraction) {
        const normalized = normalizeExtraction(res.data.extraction, textToParse);
        setExtraction(normalized);
      } else {
        setExtraction(extractClientSide(textToParse));
      }
    } catch {
      setExtraction(extractClientSide(textToParse));
    } finally {
      setIsParsing(false);
    }
  }, [transcript, selectedLanguage]);

  const handleUseExtraction = useCallback(() => {
    if (extraction) {
      onFieldsExtracted(extraction);
    }
  }, [extraction, onFieldsExtracted]);

  const handleReset = useCallback(() => {
    handleStopRecording();
    setTranscript('');
    setInterimText('');
    setExtraction(null);
    setError('');
    setVoiceoverScript('');
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [handleStopRecording]);

  // Audio Voiceover player logic
  const playVoiceover = useCallback(
    async (langOverride?: string) => {
      const targetLang = langOverride || voiceoverLang;
      if (!extraction) return;

      if (synthRef.current?.speaking) {
        synthRef.current.cancel();
      }

      setIsVoiceoverLoading(true);
      setError('');

      try {
        let script = voiceoverScript;

        if (!script || langOverride) {
          try {
            const res = await api.post('/voice/voiceover', {
              extraction,
              language: targetLang,
            });
            if (res.data.success && res.data.script) {
              script = res.data.script;
              setVoiceoverScript(script);
            }
          } catch {
            const totalVal = extraction.quantity * extraction.pricePerUnit;
            const urgLabel =
              extraction.urgency === 'high' ? 'अत्यंत आवश्यक (हाई)' :
              extraction.urgency === 'medium' ? 'मध्यम (मीडियम)' : 'सामान्य (लो)';
            script = `नमस्ते! आपकी लिस्टिंग का विवरण: उत्पाद है ${extraction.title}, कुल मात्रा ${extraction.quantity} ${extraction.unit}, भाव ₹${extraction.pricePerUnit} प्रति ${extraction.unit}, कुल मूल्य ₹${totalVal} है, एक्सपायरी तारीख ${extraction.expiryDate} है, और तात्कालिकता ${urgLabel} है।`;
            setVoiceoverScript(script);
          }
        }

        if (!synthRef.current) {
          setError('Speech synthesis is not supported on this browser.');
          setIsVoiceoverLoading(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(script);
        utterance.lang = targetLang;
        utterance.rate = speechRate;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
          setIsVoiceoverLoading(false);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };

        utterance.onerror = (e) => {
          console.error('[Voiceover] Synth error:', e);
          setIsSpeaking(false);
          setIsPaused(false);
          setIsVoiceoverLoading(false);
        };

        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
      } catch (err: any) {
        setError(`Failed to play voiceover: ${err.message || err}`);
        setIsVoiceoverLoading(false);
        setIsSpeaking(false);
      }
    },
    [extraction, voiceoverLang, voiceoverScript, speechRate]
  );

  const pauseVoiceover = useCallback(() => {
    if (synthRef.current?.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeVoiceover = useCallback(() => {
    if (synthRef.current?.paused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const stopVoiceover = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const handleVoiceoverLangChange = useCallback(
    (newLang: string) => {
      setVoiceoverLang(newLang);
      setVoiceoverScript('');
      if (isSpeaking) {
        playVoiceover(newLang);
      }
    },
    [isSpeaking, playVoiceover]
  );

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Step 1: Language Selection ─── */}
      <div
        style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} color="var(--sb-primary, #6F8F69)" />
            <h4
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--sb-text-secondary, #4F5A51)',
                margin: 0,
              }}
            >
              Step 1 — Speech Language
            </h4>
          </div>
          <span
            style={{
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--sb-primary, #6F8F69)',
              background: 'var(--sb-primary-pale, #EAF1E7)',
              border: '1px solid var(--sb-primary-soft, #DCE8D8)',
              borderRadius: 4,
              padding: '2px 8px',
            }}
          >
            {currentLang?.nativeName || selectedLanguage}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLanguage(lang.code)}
                disabled={isRecording}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: isSelected ? '1.5px solid var(--sb-primary, #6F8F69)' : '1px solid var(--sb-border, #D8E0D5)',
                  background: isSelected ? 'var(--sb-primary-pale, #EAF1E7)' : 'var(--sb-surface-soft, #F2F6EF)',
                  color: isSelected ? 'var(--sb-primary, #6F8F69)' : 'var(--sb-text-secondary, #4F5A51)',
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  transition: 'all 0.15s ease',
                  opacity: isRecording ? 0.6 : 1,
                }}
              >
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontWeight: 600, fontSize: 13 }}>
                  {lang.nativeName}
                </span>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)' }}>
                  {lang.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Step 2: Voice Input & Live Transcript ─── */}
      <div
        style={{
          background: 'var(--sb-surface, #FFFFFF)',
          border: '1px solid var(--sb-border, #D8E0D5)',
          borderRadius: 8,
          padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={16} color={isRecording ? '#D9534F' : 'var(--sb-primary, #6F8F69)'} />
            <h4
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--sb-text-secondary, #4F5A51)',
                margin: 0,
              }}
            >
              Step 2 — Speak Your Surplus Lot
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#D9534F',
                    display: 'inline-block',
                    animation: 'pulse 1.2s infinite',
                  }}
                />
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, fontWeight: 700, color: '#D9534F' }}>
                  RECORDING CONTINUOUSLY
                </span>
              </div>
            )}
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-muted, #7A847A)' }}>
              {wordCount} words captured
            </span>
          </div>
        </div>

        {/* Live Audio Level Meter */}
        {isRecording && (
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                height: 4,
                background: 'var(--sb-border, #D8E0D5)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${audioLevel}%`,
                  background: 'var(--sb-primary, #6F8F69)',
                  transition: 'width 0.08s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Main Microphone Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            padding: '28px 20px',
            background: isRecording ? 'rgba(217, 83, 79, 0.04)' : 'var(--sb-surface-soft, #F2F6EF)',
            border: isRecording ? '1.5px dashed #D9534F' : '1px dashed var(--sb-border, #D8E0D5)',
            borderRadius: 8,
            marginBottom: 20,
            transition: 'all 0.2s ease',
          }}
        >
          <button
            type="button"
            onClick={handleToggleRecording}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: 'none',
              background: isRecording ? '#D9534F' : 'var(--sb-primary, #6F8F69)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isRecording ? '0 0 0 8px rgba(217, 83, 79, 0.2)' : '0 4px 14px rgba(111, 143, 105, 0.3)',
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--sb-text-primary, #182018)',
                margin: 0,
              }}
            >
              {isRecording ? 'Listening... speak full details naturally' : 'Click to start voice recording'}
            </p>
            <p
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 12,
                color: 'var(--sb-text-muted, #7A847A)',
                margin: '4px 0 0',
              }}
            >
              {isRecording
                ? 'Say product name, quantity, price per unit, expiry period, and urgency level.'
                : 'Supports continuous speech without truncation or premature stops.'}
            </p>
          </div>
        </div>

        {/* Transcript Text Area */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--sb-text-secondary, #4F5A51)',
              }}
            >
              Captured Transcript (Editable):
            </label>
            {transcript && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(transcript);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 11,
                  color: 'var(--sb-text-muted, #7A847A)',
                }}
              >
                {copied ? <Check size={12} color="var(--sb-primary, #6F8F69)" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your spoken words will appear here in real-time. You can also paste or edit them manually..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px 14px',
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--sb-text-primary, #182018)',
              background: 'var(--sb-surface, #FFFFFF)',
              border: '1px solid var(--sb-border, #D8E0D5)',
              borderRadius: 6,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {interimText && (
            <div
              style={{
                marginTop: 6,
                padding: '6px 12px',
                background: 'var(--sb-surface-soft, #F2F6EF)',
                borderRadius: 4,
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 12,
                fontStyle: 'italic',
                color: 'var(--sb-text-muted, #7A847A)',
              }}
            >
              Listening: {interimText}
            </div>
          )}
        </div>

        {/* Sample Prompts Pills */}
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              display: 'block',
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--sb-text-muted, #7A847A)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 8,
            }}
          >
            Quick Samples to test:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {SAMPLE_PROMPTS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedLanguage(s.lang);
                  setTranscript(s.text);
                  setError('');
                }}
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--sb-border, #D8E0D5)',
                  background: 'var(--sb-surface-soft, #F2F6EF)',
                  color: 'var(--sb-text-secondary, #4F5A51)',
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Extraction Button */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleParse}
            disabled={isParsing || !transcript.trim() || isRecording}
            className="stitch-btn-primary"
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 6,
              fontSize: 13,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isParsing || !transcript.trim() || isRecording ? 'not-allowed' : 'pointer',
              opacity: isParsing || !transcript.trim() || isRecording ? 0.6 : 1,
            }}
          >
            {isParsing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Extracting Structured Listing Data...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Extract Listing Data from Speech</span>
              </>
            )}
          </button>

          {transcript && (
            <button
              type="button"
              onClick={handleReset}
              className="stitch-btn-ghost"
              style={{ padding: '12px 16px', borderRadius: 6, fontSize: 13 }}
            >
              Reset
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 6,
              background: '#FDF2F2',
              border: '1px solid #F8D7DA',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#D9534F',
              fontFamily: 'Work Sans, sans-serif',
              fontSize: 12,
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ─── Step 3: Extracted Listing Data Feature Section ─── */}
      {extraction && (
        <div
          style={{
            background: 'var(--sb-surface, #FFFFFF)',
            border: '1.5px solid var(--sb-primary, #6F8F69)',
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 4px 16px rgba(111, 143, 105, 0.08)',
          }}
        >
          {/* Section Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: '1px solid var(--sb-border, #D8E0D5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--sb-primary-pale, #EAF1E7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={18} color="var(--sb-primary, #6F8F69)" />
              </div>
              <div>
                <h4
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'var(--sb-text-primary, #182018)',
                    margin: 0,
                  }}
                >
                  Extracted Listing Data
                </h4>
                <p
                  style={{
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 12,
                    color: 'var(--sb-text-muted, #7A847A)',
                    margin: '2px 0 0',
                  }}
                >
                  AI parsed and standardized for immediate marketplace publication
                </p>
              </div>
            </div>

            <span
              style={{
                fontFamily: 'Work Sans, sans-serif',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--sb-primary, #6F8F69)',
                background: 'var(--sb-primary-pale, #EAF1E7)',
                border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                borderRadius: 4,
                padding: '4px 10px',
              }}
            >
              {Math.round(extraction.confidence * 100)}% Match Confidence
            </span>
          </div>

          {/* 6-Tile Structured Extraction Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {/* Tile 1: Product Title */}
            <div
              style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--sb-text-muted, #7A847A)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Layers size={12} />
                Product Title
              </span>
              <p
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'var(--sb-text-primary, #182018)',
                  margin: '4px 0 0',
                  lineHeight: 1.3,
                }}
              >
                {extraction.title}
              </p>
            </div>

            {/* Tile 2: Category */}
            <div
              style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--sb-text-muted, #7A847A)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Category
              </span>
              <p
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'var(--sb-primary, #6F8F69)',
                  margin: '4px 0 0',
                }}
              >
                {extraction.category}
              </p>
            </div>

            {/* Tile 3: Quantity & Unit */}
            <div
              style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--sb-text-muted, #7A847A)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Quantity & Unit
              </span>
              <p
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--sb-text-primary, #182018)',
                  margin: '4px 0 0',
                }}
              >
                {extraction.quantity} {extraction.unit}
              </p>
            </div>

            {/* Tile 4: Price Per Unit */}
            <div
              style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--sb-text-muted, #7A847A)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <DollarSign size={12} />
                Price Per Unit
              </span>
              <p
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--sb-primary, #6F8F69)',
                  margin: '4px 0 0',
                }}
              >
                ₹{extraction.pricePerUnit} / {extraction.unit}
              </p>
            </div>

            {/* Tile 5: Expiry Date */}
            <div
              style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--sb-text-muted, #7A847A)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Calendar size={12} />
                Expiry Date
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <p
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--sb-text-primary, #182018)',
                    margin: 0,
                  }}
                >
                  {extraction.expiryDate}
                </p>
                <span
                  style={{
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'var(--sb-surface, #FFFFFF)',
                    border: '1px solid var(--sb-border, #D8E0D5)',
                    color: 'var(--sb-text-secondary, #4F5A51)',
                  }}
                >
                  {calculateDaysRemaining(extraction.expiryDate)}d left
                </span>
              </div>
            </div>

            {/* Tile 6: Urgency Level */}
            <div
              style={{
                background: 'var(--sb-surface-soft, #F2F6EF)',
                border: '1px solid var(--sb-border, #D8E0D5)',
                borderRadius: 6,
                padding: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--sb-text-muted, #7A847A)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={12} />
                Urgency Level
              </span>
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background:
                      extraction.urgency === 'high'
                        ? '#FDF2F2'
                        : extraction.urgency === 'medium'
                        ? '#FFFBEB'
                        : 'var(--sb-primary-pale, #EAF1E7)',
                    color:
                      extraction.urgency === 'high'
                        ? '#D9534F'
                        : extraction.urgency === 'medium'
                        ? '#D97706'
                        : 'var(--sb-primary, #6F8F69)',
                    border:
                      extraction.urgency === 'high'
                        ? '1px solid #F8D7DA'
                        : extraction.urgency === 'medium'
                        ? '1px solid #FDE68A'
                        : '1px solid var(--sb-primary-soft, #DCE8D8)',
                  }}
                >
                  {extraction.urgency === 'high' && <Flame size={12} />}
                  {extraction.urgency}
                </span>
              </div>
            </div>
          </div>

          {/* Lot Valuation Summary Banner */}
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--sb-surface-soft, #F2F6EF)',
              border: '1px solid var(--sb-border, #D8E0D5)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 12, color: 'var(--sb-text-secondary, #4F5A51)' }}>
              Total Lot Liquidation Valuation:
            </span>
            <span
              style={{
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--sb-primary, #6F8F69)',
              }}
            >
              ₹{(extraction.quantity * extraction.pricePerUnit).toLocaleString('en-IN')}
            </span>
          </div>

          {/* ─── Vernacular Audio Voiceover Player for Illiterate / Non-English Users ─── */}
          <div
            style={{
              background: 'var(--sb-primary-pale, #EAF1E7)',
              border: '1.5px solid var(--sb-primary-soft, #DCE8D8)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Volume2 size={18} color="var(--sb-primary, #6F8F69)" />
                <div>
                  <h5
                    style={{
                      fontFamily: 'Sora, sans-serif',
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'var(--sb-text-primary, #182018)',
                      margin: 0,
                    }}
                  >
                    Audio Voiceover (सुनें / ಆಲಿಸಿ / ਸੁਣੋ)
                  </h5>
                  <p
                    style={{
                      fontFamily: 'Work Sans, sans-serif',
                      fontSize: 11,
                      color: 'var(--sb-text-muted, #7A847A)',
                      margin: '1px 0 0',
                    }}
                  >
                    Natural spoken confirmation designed for vernacular shopkeepers & illiterate users
                  </p>
                </div>
              </div>

              {/* Language Selector for Voiceover */}
              <select
                value={voiceoverLang}
                onChange={(e) => handleVoiceoverLangChange(e.target.value)}
                style={{
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                  background: 'var(--sb-surface, #FFFFFF)',
                  color: 'var(--sb-primary, #6F8F69)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Controls Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {!isSpeaking || isPaused ? (
                <button
                  type="button"
                  onClick={() => (isPaused ? resumeVoiceover() : playVoiceover())}
                  disabled={isVoiceoverLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--sb-primary, #6F8F69)',
                    color: '#FFFFFF',
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: isVoiceoverLoading ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(111, 143, 105, 0.25)',
                  }}
                >
                  {isVoiceoverLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} fill="#FFFFFF" />
                  )}
                  <span>{isPaused ? 'Resume Voiceover' : 'Play Voiceover Summary'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseVoiceover}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#D97706',
                    color: '#FFFFFF',
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Pause size={14} />
                  <span>Pause</span>
                </button>
              )}

              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopVoiceover}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--sb-border, #D8E0D5)',
                    background: 'var(--sb-surface, #FFFFFF)',
                    color: 'var(--sb-text-secondary, #4F5A51)',
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Square size={12} />
                  <span>Stop</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => playVoiceover(voiceoverLang)}
                title="Replay from start"
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--sb-border, #D8E0D5)',
                  background: 'var(--sb-surface, #FFFFFF)',
                  color: 'var(--sb-text-secondary, #4F5A51)',
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={12} />
                <span>Replay</span>
              </button>

              {/* Speed / Rate control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                <span style={{ fontFamily: 'Work Sans, sans-serif', fontSize: 11, color: 'var(--sb-text-muted, #7A847A)' }}>
                  Speed:
                </span>
                {[0.85, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    style={{
                      fontFamily: 'Work Sans, sans-serif',
                      fontSize: 11,
                      fontWeight: speechRate === rate ? 700 : 500,
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: 'none',
                      background: speechRate === rate ? 'var(--sb-primary, #6F8F69)' : 'transparent',
                      color: speechRate === rate ? '#FFFFFF' : 'var(--sb-text-secondary, #4F5A51)',
                      cursor: 'pointer',
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Soundwave Animation while Speaking */}
            {isSpeaking && !isPaused && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                {[12, 20, 16, 26, 14, 22, 18, 28, 12, 24, 16].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: h,
                      borderRadius: 2,
                      background: 'var(--sb-primary, #6F8F69)',
                      animation: `soundwave 0.8s ease-in-out infinite alternate ${i * 0.08}s`,
                    }}
                  />
                ))}
                <span
                  style={{
                    marginLeft: 8,
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--sb-primary, #6F8F69)',
                  }}
                >
                  Speaking voiceover in {SUPPORTED_LANGUAGES.find((l) => l.code === voiceoverLang)?.nativeName}...
                </span>
              </div>
            )}

            {/* Toggle Script Preview */}
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowScriptText((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'Work Sans, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--sb-text-secondary, #4F5A51)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {showScriptText ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span>{showScriptText ? 'Hide Voice Script Text' : 'View Spoken Script Text'}</span>
              </button>

              {showScriptText && voiceoverScript && (
                <p
                  style={{
                    fontFamily: 'Work Sans, sans-serif',
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--sb-text-primary, #182018)',
                    background: 'var(--sb-surface, #FFFFFF)',
                    padding: '8px 12px',
                    borderRadius: 4,
                    border: '1px solid var(--sb-primary-soft, #DCE8D8)',
                    margin: '8px 0 0',
                  }}
                >
                  {voiceoverScript}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons: Apply or Reset */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleUseExtraction}
              className="stitch-btn-primary"
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: 6,
                fontSize: 13,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CheckCircle size={16} />
              <span>Apply to Form & Review</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="stitch-btn-ghost"
              style={{ padding: '12px 20px', borderRadius: 6, fontSize: 13 }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
