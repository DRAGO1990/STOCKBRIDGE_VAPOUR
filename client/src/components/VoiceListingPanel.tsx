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
  VolumeX,
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
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
];

// Sample test transcripts to let users test instantly
const SAMPLE_PROMPTS = [
  {
    label: 'Hinglish Oil Batch',
    lang: 'hi-IN',
    text: 'Hamare paas Fortune sunflower oil 1 litre pouch ke 50 packets surplus bache hain, 110 rupees per packet rate hai, expiry 3 months baad ki hai, packaging fresh aur sealed hai.',
  },
  {
    label: 'Hindi Rice Bags',
    lang: 'hi-IN',
    text: 'हमारे पास दावत बासमती चावल 25 किलो वाले 30 कट्टे बचे हैं, 1200 रुपये प्रति कट्टा देंगे, एक्सपायरी अगले साल मार्च की है, तुरंत क्लीयरेंस करना है।',
  },
  {
    label: 'English Notebooks',
    lang: 'en-IN',
    text: 'We have 200 boxes of Classmate A4 long notebooks surplus stock, selling at 85 rupees per box, clean condition ready for bulk pickup.',
  },
  {
    label: 'Hinglish Atta Lot',
    lang: 'hi-IN',
    text: 'Aashirvaad Shudh Chakki Atta 10kg wale 60 bori hain, rate 360 rupaye per bori, 4 mahine expiry bachi hai, emergency clearance hai.',
  },
];

// ─── STT Provider Interface ─────────────────────────────────────────────────

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

// ─── Robust Web Speech API Provider ─────────────────────────────────────────

function createWebSpeechProvider(): STTProvider {
  let recognition: any = null;
  let shouldBeActive = false;
  let currentLang = 'hi-IN';
  let savedCallbacks: STTCallbacks | null = null;

  const initRecognition = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = currentLang;

    rec.onresult = (event: any) => {
      let finalChunk = '';
      let interimChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalChunk += item[0].transcript + ' ';
        } else {
          interimChunk += item[0].transcript;
        }
      }

      if (finalChunk.trim()) {
        savedCallbacks?.onResult(finalChunk.trim(), true);
      }
      if (interimChunk.trim()) {
        savedCallbacks?.onResult(interimChunk.trim(), false);
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Soft timeout on silence, auto-restart if user still wants to record
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      if (event.error === 'not-allowed') {
        shouldBeActive = false;
        savedCallbacks?.onError(
          'Microphone permission denied. Please allow microphone access in your browser.'
        );
        return;
      }
      console.warn('[STT] Speech recognition notice:', event.error);
    };

    rec.onend = () => {
      // If recognition stopped unexpectedly but user is still recording, auto-restart seamlessly
      if (shouldBeActive && recognition) {
        try {
          recognition.start();
        } catch {
          shouldBeActive = false;
          savedCallbacks?.onEnd();
        }
      } else {
        shouldBeActive = false;
        savedCallbacks?.onEnd();
      }
    };

    return rec;
  };

  return {
    isSupported: () => {
      return (
        typeof window !== 'undefined' &&
        ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
      );
    },

    start: (languageCode: string, callbacks: STTCallbacks) => {
      currentLang = languageCode;
      savedCallbacks = callbacks;
      shouldBeActive = true;

      try {
        if (recognition) {
          try {
            recognition.stop();
          } catch {
            // Ignore
          }
        }

        recognition = initRecognition();
        if (!recognition) {
          callbacks.onError(
            'Speech recognition is not supported in this browser. Please use Chrome or Edge.'
          );
          return;
        }

        recognition.start();
      } catch (err: any) {
        shouldBeActive = false;
        callbacks.onError(`Failed to access microphone: ${err.message}`);
      }
    },

    stop: () => {
      shouldBeActive = false;
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          // Already stopped
        }
        recognition = null;
      }
    },

    isActive: () => shouldBeActive,
  };
}

// ─── Extracted Fields Interface ─────────────────────────────────────────────

export interface ExtractedFields {
  title: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  expiryDate: string | null;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
  confidence: number;
  missingFields: string[];
}

const CLIENT_CATEGORIES = [
  'Groceries',
  'Stationery',
  'Electronics',
  'Packaging',
  'Textiles',
  'Hardware',
  'Dairy & Beverages',
  'Prepared Food & Bakery',
];

const CLIENT_UNITS = ['kg', 'pieces', 'packets', 'bags', 'cans', 'litres', 'boxes', 'reams', 'cartons'];

function extractClientSideFallback(transcript: string): ExtractedFields {
  const lower = transcript.toLowerCase();
  const missingFields: string[] = [];

  // Quantity
  let quantity = 0;
  const qtyMatch = lower.match(/(\d+)\s*(?:kg|kilo|bag|bori|katta|packet|pauchi|pouch|piece|pcs|box|peti|can|litre|ltr|ream|पैकेट|कट्टे|बोरी|पेटी|डिब्बा|पीस|यूनिट|लीटर|किलो)?/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10) || 0;
  }
  if (!quantity) {
    if (lower.includes('pachaas') || lower.includes('fifty') || lower.includes('पचास')) quantity = 50;
    else if (lower.includes('sau') || lower.includes('hundred') || lower.includes('सौ')) quantity = 100;
    else if (lower.includes('bees') || lower.includes('twenty') || lower.includes('बीस')) quantity = 20;
    else if (lower.includes('das') || lower.includes('ten') || lower.includes('दस')) quantity = 10;
    else if (lower.includes('pachees') || lower.includes('twenty five') || lower.includes('पच्चीस')) quantity = 25;
    else missingFields.push('quantity');
  }

  // Unit
  let unit = 'packets';
  if (lower.includes('kg') || lower.includes('kilo') || lower.includes('किलो')) unit = 'kg';
  else if (lower.includes('bori') || lower.includes('katta') || lower.includes('bag') || lower.includes('बोरी') || lower.includes('कट्टा') || lower.includes('कट्टे')) unit = 'bags';
  else if (lower.includes('peti') || lower.includes('dabba') || lower.includes('box') || lower.includes('पेटी') || lower.includes('डिब्बा') || lower.includes('बॉक्स')) unit = 'boxes';
  else if (lower.includes('carton') || lower.includes('khokha') || lower.includes('कार्टन') || lower.includes('खोखा')) unit = 'cartons';
  else if (lower.includes('packet') || lower.includes('pauchi') || lower.includes('pouch') || lower.includes('पैकेट') || lower.includes('पाउच') || lower.includes('पुड़िया')) unit = 'packets';
  else if (lower.includes('piece') || lower.includes('pcs') || lower.includes('darjan') || lower.includes('nag') || lower.includes('unit') || lower.includes('पीस') || lower.includes('यूनिट') || lower.includes('दर्जन') || lower.includes('नग')) unit = 'pieces';
  else if (lower.includes('litre') || lower.includes('ltr') || lower.includes('लीटर')) unit = 'litres';
  else if (lower.includes('can') || lower.includes('tin') || lower.includes('कैन') || lower.includes('टिन')) unit = 'cans';
  else if (lower.includes('ream') || lower.includes('gatta') || lower.includes('rim') || lower.includes('रीम')) unit = 'reams';

  // Price
  let pricePerUnit = 0;
  const priceMatch = lower.match(/(?:₹|rs\.?|rupaye|rupees|price|rate|bhav|रुपये|रुपए|प्रति|दर)\s*(\d+(?:\.\d+)?)/i) ||
    lower.match(/(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|rupaye|rupees|रुपये|रुपए|per|\/|में|me)/i);
  if (priceMatch) {
    pricePerUnit = parseFloat(priceMatch[1]) || 0;
  } else {
    missingFields.push('pricePerUnit');
  }

  // Category
  let category = 'Groceries';
  if (lower.includes('oil') || lower.includes('rice') || lower.includes('chawal') || lower.includes('atta') || lower.includes('dal') || lower.includes('sugar') || lower.includes('masala') || lower.includes('तेल') || lower.includes('चावल') || lower.includes('आटा') || lower.includes('दाल') || lower.includes('चीनी') || lower.includes('मसाला')) {
    category = 'Groceries';
  } else if (lower.includes('milk') || lower.includes('doodh') || lower.includes('juice') || lower.includes('tea') || lower.includes('coffee') || lower.includes('beverage') || lower.includes('दूध') || lower.includes('जूस') || lower.includes('चाय') || lower.includes('कॉफी')) {
    category = 'Dairy & Beverages';
  } else if (lower.includes('biscuit') || lower.includes('chips') || lower.includes('namkeen') || lower.includes('bread') || lower.includes('cake') || lower.includes('bakery') || lower.includes('बिस्किट') || lower.includes('चिप्स') || lower.includes('नमकीन') || lower.includes('ब्रेड') || lower.includes('केक') || lower.includes('बेकरी')) {
    category = 'Prepared Food & Bakery';
  } else if (lower.includes('book') || lower.includes('notebook') || lower.includes('pen') || lower.includes('paper') || lower.includes('stationery') || lower.includes('किताब') || lower.includes('कॉपी') || lower.includes('पेन') || lower.includes('कागज')) {
    category = 'Stationery';
  } else if (lower.includes('cable') || lower.includes('bulb') || lower.includes('battery') || lower.includes('charger') || lower.includes('electronics') || lower.includes('केबल') || lower.includes('बल्ब') || lower.includes('बैटरी') || lower.includes('चार्जर')) {
    category = 'Electronics';
  } else if (lower.includes('box') || lower.includes('tape') || lower.includes('pouch') || lower.includes('packing') || lower.includes('packaging') || lower.includes('टेप') || lower.includes('पैकिंग')) {
    category = 'Packaging';
  } else if (lower.includes('cloth') || lower.includes('shirt') || lower.includes('fabric') || lower.includes('textile') || lower.includes('कपड़ा') || lower.includes('शर्ट') || lower.includes('साड़ी')) {
    category = 'Textiles';
  } else if (lower.includes('pipe') || lower.includes('tool') || lower.includes('screw') || lower.includes('hardware') || lower.includes('पाइप') || lower.includes('हथौड़ा') || lower.includes('स्क्रू')) {
    category = 'Hardware';
  }

  // Detect Urgency
  let urgency: 'low' | 'medium' | 'high' = 'low';

  const hasExplicitLow =
    /\burgency\s*(?:level|is)?\s*[:=]?\s*low\b/i.test(transcript) ||
    /\blow\s*(?:urgency|priority)\b/i.test(transcript) ||
    /(?:लो\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*लो|कम\s*प्राथमिकता|कोई\s*जल्दी\s*नहीं|जल्दी\s*नहीं\s*है|आराम\s*से|काफी\s*समय|समय\s*है|धैर्य|हळूहळू|काही\s*घाई\s*नाही|அவசரமில்லை|అత్యవసరం\s*లేదు)/i.test(transcript) ||
    /\b(koi jaldi nahi|jaldi nahi|jaldi nahi hai|aram se|no hurry|no rush|low urgency|low priority|plenty of time|fresh stock|regular lot)\b/i.test(lower);

  const hasExplicitHigh =
    /\burgency\s*(?:level|is)?\s*[:=]?\s*high\b/i.test(transcript) ||
    /\bhigh\s*(?:urgency|priority)\b/i.test(transcript) ||
    /(?:हाई\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*हाई|अत्यंत\s*आवश्यक|तुरंत|जल्दी\s*से\s*जल्दी|जल्दी\s*बेचना|शीघ्र|इमरजेंसी|अर्जेंट|आपातकालीन|तातडीने|तातकाळ|त्वरित|உடனடியாக|அவசரம்|తక్షణమే|అత్యవసరం|জরুরি|তাড়াতাড়ি|તરત|ઝડપથી|ತುರ್ತು|ഉടൻ|ਤੁਰੰਤ)/i.test(transcript) ||
    /\b(urgent|urgently|emergency|immediate|immediately|turant|aaj hi|kal tak|fast clearance|distress sale|short expiry|khali karna|band ho rahi|fast sale)\b/i.test(lower) ||
    (/\bjaldi\b/i.test(lower) && !/\b(koi jaldi nahi|jaldi nahi|jaldi nahi hai)\b/i.test(lower));

  const hasExplicitMed =
    /\burgency\s*(?:level|is)?\s*[:=]?\s*medium\b/i.test(transcript) ||
    /\bmedium\s*(?:urgency|priority)\b/i.test(transcript) ||
    /(?:मीडियम\s*अर्जेंसी|अर्जेंसी\s*(?:लेवल)?\s*मीडियम|मध्यम|साधारण|நடுத்தர|మధ్యస్థ|মাঝারি|મધ્યમ)/i.test(transcript) ||
    /\b(medium|moderate|normal clearance|agle hafte|next week|15 din|20 din|2 hafte|2 weeks|month end|mahine ke aakhir)\b/i.test(lower);

  if (hasExplicitLow) {
    urgency = 'low';
  } else if (hasExplicitHigh) {
    urgency = 'high';
  } else if (hasExplicitMed) {
    urgency = 'medium';
  }

  // Parse Expiry Date from transcript
  let expiryDate = '';
  let hasExplicitExpiry = false;

  const isoMatch = lower.match(/\b(202[5-9][-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/);
  if (isoMatch) {
    expiryDate = isoMatch[1].replace(/[/.]/g, '-');
    hasExplicitExpiry = true;
  }

  if (!expiryDate) {
    const daysMatch = lower.match(/(\d+)\s*(?:din|days|दिन|दिवस)/i);
    const monthsMatch = lower.match(/(\d+)\s*(?:mahine|months|महीने|माह)/i);
    const weeksMatch = lower.match(/(\d+)\s*(?:hafte|weeks|हफ्ते|सप्ताह)/i);

    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      const target = new Date(Date.now() + Math.max(10, days) * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    } else if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1], 10);
      const target = new Date(Date.now() + Math.max(10, weeks * 7) * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    } else if (monthsMatch) {
      const months = parseInt(monthsMatch[1], 10);
      const target = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    } else if (lower.includes('agle mahine') || lower.includes('next month') || lower.includes('अगले महीने')) {
      const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      expiryDate = target.toISOString().split('T')[0];
      hasExplicitExpiry = true;
    }
  }

  if (!expiryDate) {
    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expiryDate = defaultDate.toISOString().split('T')[0];
    missingFields.push('expiryDate');
  }

  // Title formatting
  let title = transcript
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (!title) {
    title = 'Surplus Lot';
    missingFields.push('title');
  } else {
    title = `${title} (${quantity || 1} ${unit})`;
  }

  // Distance / delivery mentions
  let notes = 'Parsed from voice input. Please verify lot specifications before publishing.';
  const distMatch = lower.match(/(\d+\s*(?:km|kilometer|किलोमीटर))/i);
  if (distMatch) {
    notes += ` Delivery / pickup radius mentioned: ${distMatch[1]}.`;
  }

  // Dynamic confidence score calculation
  let confidence = 0.50;
  if (title && title !== 'Surplus Lot') confidence += 0.12;
  if (quantity > 0) confidence += 0.12;
  if (unit) confidence += 0.08;
  if (pricePerUnit > 0) confidence += 0.12;
  if (hasExplicitExpiry) confidence += 0.08;
  if (urgency !== 'low') confidence += 0.06;
  confidence = Math.min(0.96, Math.max(0.45, Math.round(confidence * 100) / 100));

  return {
    title,
    category,
    quantity: quantity || 10,
    unit,
    pricePerUnit: pricePerUnit || 100,
    expiryDate,
    urgency,
    notes,
    confidence,
    missingFields,
  };
}

interface VoiceListingPanelProps {
  onFieldsExtracted: (fields: ExtractedFields) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const VoiceListingPanel: React.FC<VoiceListingPanelProps> = ({ onFieldsExtracted }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi-IN');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [extraction, setExtraction] = useState<ExtractedFields | null>(null);
  const [sttSupported, setSttSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // ─── AI Voiceover State & Handlers ──────────────────────────────────────────
  const [voiceoverLang, setVoiceoverLang] = useState<string>(selectedLanguage);
  const [isVoiceoverLoading, setIsVoiceoverLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [voiceoverScript, setVoiceoverScript] = useState<string>('');
  const [showScriptText, setShowScriptText] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const sttProviderRef = useRef<STTProvider>(createWebSpeechProvider());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopVoiceover = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // Listen to browser voice changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          const v = window.speechSynthesis.getVoices();
          if (v && v.length > 0) {
            setAvailableVoices(v);
          }
        } catch {
          // Ignore
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Whenever selectedLanguage changes (from Step 1 buttons or sample clicks), immediately sync voiceover language
  useEffect(() => {
    setVoiceoverLang(selectedLanguage);
    setVoiceoverScript('');
    stopVoiceover();
  }, [selectedLanguage, stopVoiceover]);

  useEffect(() => {
    setSttSupported(sttProviderRef.current.isSupported());

    return () => {
      // Cleanup STT, Audio Stream, and Speech Synthesis on unmount
      sttProviderRef.current.stop();
      stopAudioVisualizer();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const fetchVoiceoverScript = async (targetLang: string, currentExtraction: ExtractedFields): Promise<string> => {
    try {
      const res = await api.post('/voice/voiceover', {
        extraction: currentExtraction,
        language: targetLang,
      });
      if (res.data.success && res.data.script) {
        return res.data.script;
      }
    } catch (err) {
      console.warn('Voiceover API error, using local fallback template:', err);
    }

    // Client-side fallback script strictly in genuine native script for TTS accuracy (without notes)
    const totalVal = (currentExtraction.quantity || 0) * (currentExtraction.pricePerUnit || 0);
    switch (targetLang) {
      case 'hi-IN':
        return `नमस्ते! आपकी लिस्टिंग का विवरण: उत्पाद है ${currentExtraction.title}, कुल मात्रा ${currentExtraction.quantity} ${currentExtraction.unit}, भाव ₹${currentExtraction.pricePerUnit} प्रति ${currentExtraction.unit}, कुल मूल्य ₹${totalVal} है, एक्सपायरी तारीख ${currentExtraction.expiryDate || 'मानक अवधि'} है, और तात्कालिकता ${currentExtraction.urgency === 'high' ? 'अत्यंत आवश्यक' : currentExtraction.urgency === 'medium' ? 'मध्यम' : 'सामान्य'} है।`;
      case 'bn-IN':
        return `নমস্কার! আপনার লিস্টিং বিবরণ: পণ্য ${currentExtraction.title}, পরিমাণ ${currentExtraction.quantity} ${currentExtraction.unit}, দর ₹${currentExtraction.pricePerUnit} প্রতি ${currentExtraction.unit}, মোট মূল্য ₹${totalVal}, মেয়াদ ${currentExtraction.expiryDate || 'সাধারণ'} এবং অগ্রাধিকার ${currentExtraction.urgency === 'high' ? 'জরুরি' : 'সাধারণ'}।`;
      case 'mr-IN':
        return `नमस्कार! आपल्या लिस्टिंगचा तपशील: उत्पादन ${currentExtraction.title}, प्रमाण ${currentExtraction.quantity} ${currentExtraction.unit}, दर ₹${currentExtraction.pricePerUnit} प्रति ${currentExtraction.unit}, एकूण मूल्य ₹${totalVal}, समाप्ती तारीख ${currentExtraction.expiryDate || 'मानक'} आणि निकड ${currentExtraction.urgency === 'high' ? 'तातडीची' : 'सामान्य'} आहे।`;
      case 'ta-IN':
        return `வணக்கம்! உங்கள் பட்டியல் விவரங்கள்: தயாரிப்பு ${currentExtraction.title}, அளவு ${currentExtraction.quantity} ${currentExtraction.unit}, விலை ₹${currentExtraction.pricePerUnit} ஒரு ${currentExtraction.unit}க்கு, மொத்த மதிப்பு ₹${totalVal}, காலாவதி தேதி ${currentExtraction.expiryDate || 'வழக்கமான'}, மற்றும் அவசரம் ${currentExtraction.urgency === 'high' ? 'உடனடி' : 'சாதாரண'}।`;
      case 'te-IN':
        return `నమస్కారం! మీ లిస్టింగ్ వివరాలు: ఉత్పత్తి ${currentExtraction.title}, పరిమాణం ${currentExtraction.quantity} ${currentExtraction.unit}, ధర ₹${currentExtraction.pricePerUnit} ప్రతి ${currentExtraction.unit}కి, మొత్తం విలువ ₹${totalVal}, గడువు తేదీ ${currentExtraction.expiryDate || 'సాధారణం'}, మరియు అత్యవసరత ${currentExtraction.urgency === 'high' ? 'అత్యవసరం' : 'సాధారణం'}।`;
      case 'gu-IN':
        return `નમસ્તે! તમારી લિસ્ટિંગ વિગતો: ઉત્પાદન ${currentExtraction.title}, જથ્થો ${currentExtraction.quantity} ${currentExtraction.unit}, કિંમત ₹${currentExtraction.pricePerUnit} પ્રતિ ${currentExtraction.unit}, કુલ મૂલ્ય ₹${totalVal}, એક્સપાયરી તારીખ ${currentExtraction.expiryDate || 'સામાન્ય'}, અને તાકીદ ${currentExtraction.urgency === 'high' ? 'ખૂબ જરૂરી' : 'સામાન્ય'} છે।`;
      case 'kn-IN':
        return `ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ ವಿವರಗಳು: ಉತ್ಪನ್ನ ${currentExtraction.title}, ಪ್ರಮಾಣ ${currentExtraction.quantity} ${currentExtraction.unit}, ಬೆಲೆ ₹${currentExtraction.pricePerUnit} ಪ್ರತಿ ${currentExtraction.unit}ಗೆ, ಒಟ್ಟು ಮೌಲ್ಯ ₹${totalVal}, ಮುಕ್ತಾಯ ದಿನಾಂಕ ${currentExtraction.expiryDate || 'ಸಾಮಾನ್ಯ'}, ಮತ್ತು ತುರ್ತುಸ್ಥಿತಿ ${currentExtraction.urgency === 'high' ? 'ತುರ್ತು' : 'ಸಾಮಾನ್ಯ'}।`;
      case 'ml-IN':
        return `നമസ്കാരം! നിങ്ങളുടെ ലിസ്റ്റിംഗ് വിവരങ്ങൾ: ഉൽപ്പന്നം ${currentExtraction.title}, അളവ് ${currentExtraction.quantity} ${currentExtraction.unit}, വില ₹${currentExtraction.pricePerUnit} പ്രതി ${currentExtraction.unit}ന്, ആകെ മൂല്യം ₹${totalVal}, കാലാവധി ${currentExtraction.expiryDate || 'സാധാരണ'}, അടിയന്തിരാവസ്ഥ ${currentExtraction.urgency === 'high' ? 'അടിയന്തിരം' : 'സാധാരണ'}।`;
      case 'pa-IN':
        return `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡੀ ਲਿਸਟਿੰਗ ਦੇ ਵੇਰਵੇ: ਉਤਪਾਦ ${currentExtraction.title}, ਮਾਤਰਾ ${currentExtraction.quantity} ${currentExtraction.unit}, ਕੀਮਤ ₹${currentExtraction.pricePerUnit} ਪ੍ਰਤੀ ${currentExtraction.unit}, ਕੁੱਲ ਮੁੱਲ ₹${totalVal}, ਮਿਆਦ ਪੁੱਗਣ ਦੀ ਮਿਤੀ ${currentExtraction.expiryDate || 'ਆਮ'}, ਅਤੇ ਜ਼ਰੂਰੀਤਾ ${currentExtraction.urgency === 'high' ? 'ਜ਼ਰੂਰੀ' : 'ਆਮ'} ਹੈ।`;
      default:
        return `Hello! Here is your listing summary: Product is ${currentExtraction.title}, category is ${currentExtraction.category}, available quantity is ${currentExtraction.quantity} ${currentExtraction.unit} at ₹${currentExtraction.pricePerUnit} per ${currentExtraction.unit}. Total lot valuation is ₹${totalVal}. Expiry date is ${currentExtraction.expiryDate || 'Standard Liquidation'} with ${currentExtraction.urgency} urgency level.`;
    }
  };

  const playVoiceover = async (targetLang?: string) => {
    if (!extraction) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setError('Speech synthesis audio is not supported in this browser.');
      return;
    }

    const langToUse = targetLang || voiceoverLang || selectedLanguage;

    // If currently speaking and paused, resume
    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    // If currently speaking and active, pause
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    // Start fresh playback
    stopVoiceover();
    setIsVoiceoverLoading(true);

    try {
      let script = voiceoverScript;
      if (!script || voiceoverLang !== langToUse) {
        script = await fetchVoiceoverScript(langToUse, extraction);
        setVoiceoverScript(script);
        setVoiceoverLang(langToUse);
      }

      if (!script) {
        setIsVoiceoverLoading(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      // Select matching native voice if available
      const allVoices =
        availableVoices.length > 0
          ? availableVoices
          : typeof window !== 'undefined' && 'speechSynthesis' in window
          ? window.speechSynthesis.getVoices()
          : [];
      const langPrefix = langToUse.split('-')[0].toLowerCase();

      const matchingVoice =
        allVoices.find((v) => v.lang.toLowerCase() === langToUse.toLowerCase()) ||
        allVoices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)) ||
        allVoices.find((v) => {
          const name = v.name.toLowerCase();
          if (langPrefix === 'hi') return name.includes('hindi') || name.includes('kalpana') || name.includes('hemant') || name.includes('heera');
          if (langPrefix === 'ta') return name.includes('tamil') || name.includes('valluvar');
          if (langPrefix === 'te') return name.includes('telugu') || name.includes('chitra') || name.includes('mohan');
          if (langPrefix === 'mr') return name.includes('marathi') || name.includes('aarohi') || name.includes('manohar');
          if (langPrefix === 'bn') return name.includes('bengali') || name.includes('bangla') || name.includes('tapan') || name.includes('bashkar');
          if (langPrefix === 'gu') return name.includes('gujarati') || name.includes('dhwani') || name.includes('niranjan');
          if (langPrefix === 'kn') return name.includes('kannada') || name.includes('gagan') || name.includes('sapna');
          if (langPrefix === 'ml') return name.includes('malayalam') || name.includes('midhun') || name.includes('sobhana');
          if (langPrefix === 'pa') return name.includes('punjabi') || name.includes('gurmukhi') || name.includes('raajan');
          return false;
        });

      if (matchingVoice) {
        utterance.voice = matchingVoice;
        utterance.lang = matchingVoice.lang;
      } else {
        utterance.lang = langToUse;
      }

      utterance.onstart = () => {
        setIsVoiceoverLoading(false);
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsSpeaking(false);
        setIsPaused(false);
        setIsVoiceoverLoading(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      console.error('Failed to play voiceover:', err);
      setIsVoiceoverLoading(false);
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handleVoiceoverLangChange = async (newLang: string) => {
    stopVoiceover();
    setVoiceoverLang(newLang);
    setVoiceoverScript('');
    if (extraction) {
      setIsVoiceoverLoading(true);
      const newScript = await fetchVoiceoverScript(newLang, extraction);
      setVoiceoverScript(newScript);
      setIsVoiceoverLoading(false);
    }
  };

  // ─── Audio Waveform Visualizer ────────────────────────────────────────────

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

        // Calculate average volume level (0 to 100)
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
      // Visualizer failed or permissions blocked; STT still handles its own errors
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

  // ─── Start / Stop Recording Handlers ──────────────────────────────────────

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
          setTranscript((prev) => {
            const cleanPrev = prev.trim();
            const cleanText = text.trim();
            if (!cleanPrev) return cleanText;
            if (cleanPrev.endsWith(cleanText)) return cleanPrev;
            return `${cleanPrev} ${cleanText}`;
          });
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

  // ─── Auto Language Detection from Script ─────────────────────────────────
  const detectScriptLanguage = (text: string): string | null => {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN'; // Telugu
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN'; // Bengali
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN'; // Gujarati
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN'; // Kannada
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN'; // Malayalam
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN'; // Punjabi
    if (/[\u0900-\u097F]/.test(text)) {
      if (/\b(आहे|आहेत|रुपये|नग|पोती|पेटी|पिशवी|किलो|गाव|पाहिजे|भावात)\b/i.test(text)) {
        return 'mr-IN';
      }
      return 'hi-IN';
    }
    return null;
  };

  // ─── Parse / Extract Handlers ─────────────────────────────────────────────

  const handleParse = useCallback(async () => {
    const textToParse = transcript.trim();
    if (!textToParse) {
      setError('Please speak or type listing details before extracting.');
      return;
    }

    // Auto-detect language from native script if present
    const detectedLang = detectScriptLanguage(textToParse);
    const targetLanguage = detectedLang || selectedLanguage;
    if (detectedLang && detectedLang !== selectedLanguage) {
      setSelectedLanguage(detectedLang);
    }
    setVoiceoverLang(targetLanguage);
    setVoiceoverScript('');
    stopVoiceover();

    setIsParsing(true);
    setError('');
    setExtraction(null);

    try {
      const res = await api.post('/voice/parse', {
        transcript: textToParse,
        language: targetLanguage,
      });

      if (res.data.success && res.data.extraction) {
        setExtraction(res.data.extraction);
      } else {
        const fallback = extractClientSideFallback(textToParse);
        setExtraction(fallback);
      }
    } catch (err: any) {
      console.warn('Voice API parse network issue, using robust local extraction:', err);
      const fallback = extractClientSideFallback(textToParse);
      setExtraction(fallback);
    } finally {
      setIsParsing(false);
    }
  }, [transcript, selectedLanguage, stopVoiceover]);

  const handleUseExtraction = useCallback(() => {
    if (extraction) {
      onFieldsExtracted(extraction);
    }
  }, [extraction, onFieldsExtracted]);

  const handleReset = useCallback(() => {
    handleStopRecording();
    stopVoiceover();
    setTranscript('');
    setInterimText('');
    setExtraction(null);
    setVoiceoverScript('');
    setError('');
  }, [handleStopRecording, stopVoiceover]);

  const handleSampleClick = (sampleText: string, sampleLang: string) => {
    setSelectedLanguage(sampleLang);
    setVoiceoverLang(sampleLang);
    setVoiceoverScript('');
    stopVoiceover();
    setTranscript(sampleText);
    setInterimText('');
    setError('');
  };

  const handleCopyTranscript = () => {
    if (transcript) {
      navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* ─── Step 1: Language Selection ──────────────────────────────────── */}
      <div className="bg-[#0f1329]/70 rounded-2xl p-4 sm:p-5 border border-[#3f4b81]/50 shadow-inner">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-teal-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Step 1 — Select Speech Language
            </h4>
          </div>
          <span className="text-[11px] text-teal-400 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
            {currentLang?.nativeName}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setSelectedLanguage(lang.code);
                setError('');
              }}
              disabled={isRecording}
              className={`px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                selectedLanguage === lang.code
                  ? 'bg-teal-500/25 text-teal-300 border-2 border-teal-500/70 shadow-md shadow-teal-500/15'
                  : 'bg-[#1b2151] text-slate-300 border border-[#3f4b81]/60 hover:bg-[#293264] hover:text-white'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="block text-xs font-bold truncate">{lang.nativeName}</span>
              <span className="block text-[9px] text-slate-400 truncate">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Step 2: Live Mic Recording & Audio Visualizer ───────────────── */}
      <div className="bg-[#0f1329]/70 rounded-2xl p-5 border border-[#3f4b81]/50 shadow-inner">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-teal-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Step 2 — Speak or Type Details
            </h4>
          </div>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              LIVE AUDIO
            </span>
          )}
        </div>

        {!sttSupported && (
          <div className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-xl border border-amber-800/60 mb-4 flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" />
            Speech recognition is unavailable in this browser. You can type directly in the box below or use Google Chrome.
          </div>
        )}

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Speak naturally in <strong className="text-teal-300">{currentLang?.nativeName}</strong>.
          Mention product name, quantity, units (*katte, packets, boxes*), price (₹), and expiry.
        </p>

        {/* Big Interactive Mic Button with Animated Waveform */}
        <div className="flex flex-col items-center justify-center py-2 gap-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring when recording */}
            {isRecording && (
              <div
                className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping"
                style={{ transform: `scale(${1 + audioLevel / 100})` }}
              />
            )}

            <button
              type="button"
              onClick={handleToggleRecording}
              disabled={!sttSupported}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/40 scale-105 animate-pulse-glow-red'
                  : 'bg-gradient-to-br from-teal-500 to-cyan-600 text-navy-950 shadow-lg shadow-teal-500/20 hover:scale-105 hover:shadow-teal-500/35'
              } ${!sttSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>

          {/* Dynamic Audio Visualizer Bars */}
          {isRecording ? (
            <div className="flex items-center gap-1.5 h-6">
              {[40, 70, 90, 60, 100, 75, 45, 85, 95, 50, 30].map((baseHeight, idx) => {
                const dynamicHeight = Math.max(
                  6,
                  Math.round((baseHeight * (audioLevel + 20)) / 120)
                );
                return (
                  <div
                    key={idx}
                    className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                    style={{ height: `${dynamicHeight}px` }}
                  />
                );
              })}
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              Tap microphone to begin speaking
            </span>
          )}
        </div>

        {/* ─── Editable Transcript Area ──────────────────────────────────── */}
        <div className="mt-5 bg-[#1b2151] rounded-2xl p-4 border border-[#3f4b81]/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Edit3 size={13} className="text-teal-400" />
              <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider">
                Transcript (Editable)
              </span>
              {wordCount > 0 && (
                <span className="text-[10px] text-slate-400 bg-[#0f1329] px-2 py-0.5 rounded-md">
                  {wordCount} words
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {transcript && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="text-[11px] text-slate-400 hover:text-teal-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setInterimText('');
            }}
            placeholder={
              isRecording
                ? 'Listening to your speech in real-time...'
                : 'Your spoken words will appear here. You can also edit or type manually.'
            }
            className="w-full bg-[#0f1329] border border-[#3f4b81]/60 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors resize-none leading-relaxed"
          />

          {interimText && (
            <div className="mt-1 text-xs text-teal-300/80 italic flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              Hearing: {interimText}...
            </div>
          )}

          {/* Quick-Try Sample Buttons */}
          <div className="mt-3 pt-3 border-t border-[#3f4b81]/40">
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mb-2">
              <Sparkles size={11} className="text-amber-400" />
              Try realistic sample voice prompts:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSampleClick(sample.text, sample.lang)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#0f1329] hover:bg-[#293264] text-slate-300 hover:text-teal-300 border border-[#3f4b81]/60 transition-all cursor-pointer"
                >
                  ⚡ {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Step 3: AI Extract Fields Action ────────────────────────────── */}
      {transcript.trim() && !extraction && (
        <div className="bg-[#0f1329]/70 rounded-2xl p-5 border border-[#3f4b81]/50 shadow-inner animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-violet-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Step 3 — Extract & Format with AI
            </h4>
          </div>

          <button
            type="button"
            onClick={handleParse}
            disabled={isParsing || !transcript.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            {isParsing ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                AI is extracting & formatting listing...
              </>
            ) : (
              <>
                <Sparkles size={18} className="text-amber-300" />
                AI Extract Listing Details
              </>
            )}
          </button>
        </div>
      )}

      {/* ─── Error Alert ─────────────────────────────────────────────────── */}
      {error && (
        <div className="text-xs text-rose-300 bg-rose-950/50 p-3.5 rounded-xl border border-rose-800/70 flex items-center gap-2.5 animate-fade-in">
          <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* ─── Extraction Results Review Card ──────────────────────────────── */}
      {extraction && (
        <div className="bg-[#0f1329]/80 rounded-2xl p-5 border-2 border-teal-500/40 shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#3f4b81]/60">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">AI Extracted Listing</h4>
                <span className="text-[11px] text-slate-400">
                  Ready to auto-fill your listing form
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  extraction.confidence >= 0.8
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : extraction.confidence >= 0.5
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {Math.round(extraction.confidence * 100)}% Match
              </span>
            </div>
          </div>

          {/* ─── AI Native Voiceover Audio Readout Section ──────────────────── */}
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-violet-950/70 via-[#1b2151] to-indigo-950/70 border border-violet-500/40 shadow-xl space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#3f4b81]/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-violet-300 shadow-md shadow-violet-600/20">
                  <Volume2 size={18} className={isSpeaking && !isPaused ? 'animate-pulse text-amber-300' : ''} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-white">
                      AI Voiceover Summary
                    </h5>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-500/30 text-violet-300 border border-violet-500/40 flex items-center gap-1">
                      <Sparkles size={10} className="text-amber-300" />
                      10 Native Languages
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Listen to a full audio readout in your regional language before publishing
                  </span>
                </div>
              </div>

              {/* Spoken Language Dropdown & Speed */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <select
                  value={voiceoverLang}
                  onChange={(e) => handleVoiceoverLangChange(e.target.value)}
                  className="bg-[#0f1329] border border-violet-500/40 rounded-xl px-2.5 py-1.5 text-xs text-violet-200 font-semibold focus:outline-none focus:border-teal-400 transition-colors cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#1b2151]">
                      {lang.nativeName} ({lang.name.split(' ')[0]})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setSpeechRate((prev) => (prev === 1.0 ? 1.25 : 1.0))}
                  title="Toggle Speech Speed"
                  className="text-[11px] font-bold px-2 py-1.5 rounded-xl bg-[#0f1329] hover:bg-[#293264] border border-[#3f4b81] text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {speechRate}x
                </button>
              </div>
            </div>

            {/* Audio Controls & Visualizer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playVoiceover()}
                  disabled={isVoiceoverLoading}
                  className={`py-2 px-4 rounded-xl font-bold text-xs shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2 ${
                    isSpeaking && !isPaused
                      ? 'bg-amber-500 hover:bg-amber-400 text-navy-950 shadow-amber-500/20 ring-2 ring-amber-400/50'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-600/30'
                  }`}
                >
                  {isVoiceoverLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Generating Audio...
                    </>
                  ) : isSpeaking && !isPaused ? (
                    <>
                      <Pause size={15} />
                      Pause Voiceover
                    </>
                  ) : isSpeaking && isPaused ? (
                    <>
                      <Play size={15} />
                      Resume Voiceover
                    </>
                  ) : (
                    <>
                      <Play size={15} className="text-amber-300" />
                      Play AI Voiceover
                    </>
                  )}
                </button>

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopVoiceover}
                    className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/60 text-rose-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Square size={13} />
                    Stop
                  </button>
                )}
              </div>

              {/* Animated Equalizer Wave Bars */}
              {isSpeaking && !isPaused && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f1329]/80 border border-violet-500/40 animate-fade-in">
                  <Radio size={14} className="text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-300">Speaking aloud...</span>
                  <div className="flex items-end gap-0.5 h-4 ml-1">
                    <span className="w-1 bg-teal-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 bg-violet-400 rounded-full animate-bounce h-2" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 bg-amber-400 rounded-full animate-bounce h-4" style={{ animationDelay: '75ms' }} />
                  </div>
                </div>
              )}

              {/* Toggle Script Preview Button */}
              {voiceoverScript && (
                <button
                  type="button"
                  onClick={() => setShowScriptText((prev) => !prev)}
                  className="text-[11px] text-violet-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                >
                  {showScriptText ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showScriptText ? 'Hide Spoken Script' : 'View Spoken Script'}
                </button>
              )}
            </div>

            {/* Expandable Script Text Preview */}
            {showScriptText && voiceoverScript && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#0f1329] border border-violet-500/30 text-xs text-slate-300 leading-relaxed animate-fade-in">
                <div className="flex items-center justify-between text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">
                  <span>Spoken Script ({SUPPORTED_LANGUAGES.find((l) => l.code === voiceoverLang)?.name}):</span>
                  <span>{voiceoverLang}</span>
                </div>
                <p className="italic text-slate-200">{voiceoverScript}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#1b2151] p-3 rounded-xl border border-[#3f4b81]/50 sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                Formatted Product Title
              </span>
              <span className="text-white font-bold text-sm leading-snug">
                {extraction.title || '—'}
              </span>
            </div>

            <div className="bg-[#1b2151] p-3 rounded-xl border border-[#3f4b81]/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                Category
              </span>
              <span className="text-teal-300 font-semibold">{extraction.category}</span>
            </div>

            <div className="bg-[#1b2151] p-3 rounded-xl border border-[#3f4b81]/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                Quantity & Unit
              </span>
              <span className="text-white font-bold">
                {extraction.quantity} {extraction.unit}
              </span>
            </div>

            <div className="bg-[#1b2151] p-3 rounded-xl border border-[#3f4b81]/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                Price Per Unit
              </span>
              <span className="text-emerald-400 font-extrabold text-sm">
                ₹{extraction.pricePerUnit} / {extraction.unit}
              </span>
            </div>

            <div className="bg-[#1b2151] p-3 rounded-xl border border-[#3f4b81]/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                Expiry Date
              </span>
              <span className="text-white font-semibold">
                {extraction.expiryDate || 'Default liquidation window'}
              </span>
            </div>

            <div className="bg-[#1b2151] p-3 rounded-xl border border-[#3f4b81]/50">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                Urgency Level
              </span>
              <span
                className={`font-bold inline-flex items-center gap-1 ${
                  extraction.urgency === 'high'
                    ? 'text-rose-400'
                    : extraction.urgency === 'medium'
                    ? 'text-amber-400'
                    : 'text-teal-300'
                }`}
              >
                {extraction.urgency === 'high' && <Flame size={12} />}
                {extraction.urgency.toUpperCase()}
              </span>
            </div>

            {extraction.notes && (
              <div className="bg-[#1b2151] p-3 rounded-xl border border-[#3f4b81]/50 sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  AI Extracted Notes
                </span>
                <span className="text-slate-200 leading-relaxed">{extraction.notes}</span>
              </div>
            )}
          </div>

          {extraction.missingFields.length > 0 && (
            <div className="mt-3 text-[11px] text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/50 flex items-start gap-1.5">
              <HelpCircle size={14} className="flex-shrink-0 mt-0.5 text-amber-400" />
              <span>
                These fields were estimated from voice context: <strong>{extraction.missingFields.join(', ')}</strong>. You can fine-tune them in the form.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
            <button
              type="button"
              onClick={handleUseExtraction}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-navy-950 font-extrabold text-sm rounded-xl shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Apply Fields to Listing Form →
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-3 px-5 bg-[#1b2151] border border-[#3f4b81] text-slate-300 hover:text-white hover:bg-[#293264] font-semibold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
