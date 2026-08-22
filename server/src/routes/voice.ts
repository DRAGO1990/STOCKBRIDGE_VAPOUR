import { Router, Request, Response } from 'express';
import { voiceParseSchema, SUPPORTED_VOICE_LANGUAGES } from '../validators';
import { extractListingFromSpeech } from '../services/voiceService';
import { config } from '../config';

const router = Router();

// POST /api/voice/parse — Extract listing fields from speech transcript
router.post('/parse', async (req: Request, res: Response) => {
  try {
    // Validate Gemini API key is configured (never reveal the key itself)
    if (!config.gemini.apiKey) {
      res.status(503).json({
        error: 'Voice AI service is not configured. Please set GEMINI_API_KEY in the server environment.',
      });
      return;
    }

    const data = voiceParseSchema.parse(req.body);

    const extraction = await extractListingFromSpeech(data.transcript, data.language);

    res.json({
      success: true,
      extraction,
      transcript: data.transcript,
      language: data.language,
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        error: 'Invalid request',
        details: err.errors,
      });
      return;
    }

    console.error('Voice parse error:', err.message);

    // Distinguish Gemini API errors from other errors
    if (err.message?.includes('AI extraction failed')) {
      res.status(422).json({
        error: 'Could not extract listing details from the speech. Please try speaking more clearly or provide more details.',
      });
      return;
    }

    res.status(500).json({
      error: 'Voice processing failed. Please try again.',
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
