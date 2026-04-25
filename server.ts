import express from 'express';
import {createServer as createViteServer} from 'vite';
import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_GENAI_API_KEY!});

app.post('/api/chat', async (req, res) => {
  try {
    const {messages} = req.body;
    
    // System Prompt Injection
    const systemPrompt = `
## 1. ROL
- Inspector Vial. Experto en seguridad para niños de 8 años.
- Regla: Sé súper breve. Respuestas de máximo 20 palabras.
- FORMATO: NO uses asteriscos (**). Usa solo <b> para destacar.

## 2. FLUJO
1. INICIO: "¿En qué calle o plaza estás?"
2. SELECCIÓN: Tras la calle, lista estos 4:
   1. Accesibilidad
   2. Seguridad
   3. Mobiliario
   4. Tráfico
   *Responde con el número.*
3. AUDITORÍA: Haz UNA pregunta breve sobre lo elegido.
4. CIERRE: Si piden informe, escribe esto:
"En la calle: <b>[Lo bueno]</b>. Riesgos: <b>[Lo malo]</b>. Mi propuesta: <b>[Idea]</b>. Puntuación: <b>[Segura/Regular/Riesgo]</b>."
`;

    // Modify the first message to include the system prompt invisibly
    const modifiedMessages = [...messages];
    if (modifiedMessages.length === 1) {
      modifiedMessages[0].content = `${systemPrompt}\n\n${modifiedMessages[0].content}`;
    }

    const result = await ai.models.generateContent({
      model: 'gemma-4-26b-a4b-it',
      contents: modifiedMessages.map(m => ({role: m.role, parts: [{text: m.content}]})),
    });

    res.json({reply: result.text});
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Interferencias en la red temporalmente...',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({server: {middlewareMode: true}, appType: 'spa'});
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(process.cwd(), 'dist')));
  app.get('*', (req, res) => res.sendFile(path.resolve(process.cwd(), 'dist/index.html')));
}

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
