import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI SDK (Server-Side)
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', hasApiKey: Boolean(apiKey) });
});

// Endpoint: Generate or Edit Habit Vision Badge & Art
app.post('/api/generate-badge', async (req: Request, res: Response) => {
  const { habitTitle, habitCategory, habitColor = '#6366f1', userPrompt = '', editInstructions = '' } = req.body;

  if (!habitTitle) {
    res.status(400).json({ error: 'habitTitle is required' });
    return;
  }

  // If Gemini API is available, generate badge styling and SVG with gemini-3.8-flash
  if (ai) {
    try {
      const systemInstruction = `You are an elite vector design artist and habit motivation coach.
Given a habit and a user's vision or edit request, generate a response in valid JSON with:
1. "badgeTitle": A punchy 1-3 word title for the habit badge.
2. "slogan": A memorable 4-8 word motivational affirmation.
3. "themeColor": A hex color (e.g. #f59e0b, #10b981, #6366f1, #ec4899, #06b6d4, #8b5cf6).
4. "svgContent": A clean, self-contained SVG icon illustration (viewBox="0 0 100 100", width="100", height="100") with beautiful gradients, geometric or organic vectors, and sharp aesthetics fitting the theme. Do not include markdown code ticks in the svgContent string.`;

      const promptText = `Habit: "${habitTitle}"
Category: "${habitCategory || 'Personal Growth'}"
Current Color: "${habitColor}"
User Vision Prompt: "${userPrompt}"
${editInstructions ? `Edit Instructions: "${editInstructions}"` : ''}

Generate the badge JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsed = JSON.parse(responseText);
        res.json({
          success: true,
          badgeTitle: parsed.badgeTitle || `${habitTitle} Master`,
          slogan: parsed.slogan || 'Consistency turns action into identity.',
          themeColor: parsed.themeColor || habitColor,
          svgContent: parsed.svgContent || null,
        });
        return;
      } catch (err) {
        console.error('Failed to parse Gemini response JSON:', err);
      }
    } catch (err) {
      console.error('Gemini generateContent error:', err);
    }
  }

  // Resilient fallback if API call is skipped or errors
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${habitColor}" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#4338ca" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#grad)" />
    <circle cx="50" cy="50" r="28" fill="#ffffff" fill-opacity="0.15" />
    <path d="M50 28 L56 42 L72 44 L60 54 L64 70 L50 61 L36 70 L40 54 L28 44 L44 42 Z" fill="#ffffff" />
  </svg>`;

  res.json({
    success: true,
    badgeTitle: `${habitTitle} Champion`,
    slogan: userPrompt ? `Forged by focus: ${userPrompt.slice(0, 40)}` : 'Every repetition builds the future.',
    themeColor: habitColor,
    svgContent: fallbackSvg,
    isFallback: !ai,
  });
});

// Endpoint: Generate Period Coaching Summary Insights
app.post('/api/period-coaching', async (req: Request, res: Response) => {
  const { summary } = req.body;

  if (ai && summary) {
    try {
      const prompt = `Review this habit tracker period summary for Month ${summary.month}/${summary.year}:
Total habits: ${summary.totalHabits}
Total completions: ${summary.totalCompletions} / ${summary.totalTargetGoal} (${summary.overallRate}%)
Goals achieved: ${summary.goalsAchievedCount} of ${summary.totalHabits}
Best streak: ${summary.bestStreakHabit ? `${summary.bestStreakHabit.title} (${summary.bestStreakHabit.streak} days)` : 'None'}

Provide a 2-3 sentence motivating, practical habit coach evaluation with 1 actionable tip for next month. Return plain text only.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      res.json({
        success: true,
        insight: response.text?.trim() || 'Remarkable momentum! Keep protecting your primary habit streak next month.',
      });
      return;
    } catch (err) {
      console.error('Error generating coaching insight:', err);
    }
  }

  res.json({
    success: true,
    insight: `You achieved a ${summary?.overallRate ?? 85}% overall completion rate this month. Consistent small wins compound exponentially into lasting transformation!`,
  });
});

// Mount Vite or serve static dist
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
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
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
