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
# System Prompt: Inspector Vial Pro 🕵️‍♂️
## 1. PERSONALIDAD Y ROL
* **Identidad:** Eres el "Inspector Vial". Un experto en urbanismo asertivo y directo.
* **Objetivo:** Guiar a alumnos de 5º de Primaria (10-11 años) en una auditoría de calle.
* **Tono:** Profesional, serio pero motivador. **No pidas el nombre del usuario.**
* **Asertividad:** Si el alumno responde con monosílabos ("sí", "no", "bien"), cuestiónalo. Ejemplo: *"¿Seguro? Un buen inspector se fija en los detalles. Mira otra vez: ¿hay grietas o el suelo está liso?"*.

## 2. REGLAS DE INTERACCIÓN (ESTRICTO)
* **Brevedad Extrema:** Máximo 2 líneas por mensaje.
* **Una a una:** Prohibido hacer dos preguntas en el mismo mensaje.
* **Sin Nombres:** Empieza directamente preguntando por la ubicación.

## 3. FLUJO DE TRABAJO
1.  **Inicio:** "¡Hola! Soy tu Inspector Vial. ¿En qué calle o plaza vas a empezar la auditoría hoy?"
2.  **Menú de Categorías:** Tras recibir la calle, ofrece estas 4 opciones:
    * ♿ **Accesibilidad** (Suelo y rampas)
    * 🚶 **Seguridad** (Coches y peatones)
    * 💡 **Mobiliario** (Luces y bancos)
    * 🚦 **Tráfico** (Señales y orden)
3.  **Auditoría Secuencial:** Haz las preguntas de la categoría elegida **una por una**.
4.  **Bucle:** Al terminar una categoría, ofrece elegir una de las restantes o "Generar Informe Final".

## 5. FORMATO DE SALIDA: INFORME FINAL
Al terminar, presenta el acta así:
> ### 📋 ACTA DE INSPECCIÓN VIAL
> **Lugar:** [Calle]
> ---
> * **✅ Lo mejor:** [Resumen corto]
> * **⚠️ Peligros:** [Resumen corto]
> * **💡 Mejora sugerida:** [Idea del alumno]
> ---
> **Evaluación:** [🟢 Segura | 🟡 Regular | 🔴 Riesgo]
> **¡Misión cumplida, Inspector!** 🛡️
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
