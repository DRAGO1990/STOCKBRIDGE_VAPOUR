import { Router, Request, Response } from 'express';
import { voiceParseSchema, SUPPORTED_VOICE_LANGUAGES } from '../validators';
import { extractListingFromSpeech, generateVoiceoverScript } from '../services/voiceService';
import { config } from '../config';

const router = Router();

// POST /api/voice/parse — Extract listing fields from speech transcript
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const data = voiceParseSchema.parse(req.body);

    const extraction = await extractListingFromSpeech(data.transcript, data.language);

    res.json({
      success: true,
      extraction,
      transcript: data.transcript,
      language: data.language,
      aiPowered: Boolean(config.gemini.apiKey),
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        error: 'Invalid request: transcript must be provided.',
        details: err.errors,
      });
      return;
    }

    console.error('[VoiceRoute] Parse error:', err.message);

    res.status(500).json({
      error: 'Voice processing failed. Please try again or edit the transcript.',
      details: err.message,
    });
  }
});

// POST /api/voice/voiceover — Generate natural spoken script in chosen native language
router.post('/voiceover', async (req: Request, res: Response) => {
  try {
    const { extraction, language } = req.body;
    if (!extraction) {
      res.status(400).json({ error: 'Extraction data required' });
      return;
    }

    const voiceover = await generateVoiceoverScript(extraction, language || 'hi-IN');
    res.json({
      success: true,
      script: voiceover.script,
      language: voiceover.language,
      languageName: voiceover.languageName,
    });
  } catch (err: any) {
    console.error('[VoiceRoute] Voiceover error:', err.message);
    res.status(500).json({
      error: 'Failed to generate voiceover script',
      details: err.message,
    });
  }
});

// GET /api/voice/languages — Return supported languages (for client dropdown)
router.get('/languages', (_req: Request, res: Response) => {
  res.json({
    languages: SUPPORTED_VOICE_LANGUAGES,
  });
});

export default router;
