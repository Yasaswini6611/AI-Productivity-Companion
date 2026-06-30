import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is required. Please set it under Secrets in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint to break down a high-level task into subtasks
app.post("/api/generate-plan", async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    if (!title) {
      res.status(400).json({ error: "Task title is required" });
      return;
    }

    const ai = getGeminiAI();
    const prompt = `You are a world-class proactive productivity assistant. 
Decompose the following high-level task into a step-by-step actionable plan with subtasks.
Task: "${title}"
Description: "${description || "None provided"}"
Due Date: ${dueDate || "Not specified"}

Decompose it into a list of 3-5 concrete, bite-sized, sequential subtasks. Provide time estimates, difficulty levels, and practical tips for each. Also provide a motivating, jargon-free summary statement to help the user start right away.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              description: "List of actionable step-by-step subtasks",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Bite-sized subtask name" },
                  duration: { type: Type.STRING, description: "Time estimate (e.g., '20 mins')" },
                  difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
                  proTips: { type: Type.STRING, description: "One practical tip to execute this step" }
                },
                required: ["title", "duration", "difficulty", "proTips"]
              }
            },
            motivation: { type: Type.STRING, description: "A quick, warm, highly encouraging call-to-action statement." }
          },
          required: ["subtasks", "motivation"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in /api/generate-plan:", error);
    res.status(500).json({ error: error.message || "Failed to generate plan." });
  }
});

// API endpoint to prioritize a list of tasks (Eisenhower Matrix ranking)
app.post("/api/prioritize-tasks", async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({ error: "A non-empty list of tasks is required" });
      return;
    }

    const ai = getGeminiAI();
    const tasksData = JSON.stringify(tasks.map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status
    })));

    const prompt = `You are an expert productivity coach. Analyze the following list of tasks and prioritize them according to the Eisenhower Matrix.
Tasks:
${tasksData}

Assign each task to one of the 4 quadrants:
1. "urgent_important" (Do first - critical deadlines or high importance)
2. "not_urgent_important" (Schedule/Plan - key goals, habits, learning, long-term)
3. "urgent_not_important" (Delegate/Automate - interruptions, minor details)
4. "not_urgent_not_important" (Eliminate/Postpone - low value)

For each task, return its ID, the assigned quadrant, a human-friendly quadrant label, and a short explanation (1-2 sentences) of why it was placed there. Also supply 1-3 immediate actionable advice items.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prioritized: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "The original task ID" },
                  quadrant: { type: Type.STRING, description: "urgent_important, not_urgent_important, urgent_not_important, or not_urgent_not_important" },
                  label: { type: Type.STRING, description: "A warm, easy-to-understand label (e.g. 'Do First', 'Schedule/Plan', 'Delegate/Limit', 'Postpone')" },
                  explanation: { type: Type.STRING, description: "Why it is categorized there" }
                },
                required: ["id", "quadrant", "label", "explanation"]
              }
            },
            generalAdvice: {
              type: Type.ARRAY,
              description: "Top 2 overall actionable recommendations for their day",
              items: { type: Type.STRING }
            }
          },
          required: ["prioritized", "generalAdvice"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in /api/prioritize-tasks:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tasks." });
  }
});

// API endpoint to generate personalized recommendations based on habits, goals, and tasks
app.post("/api/get-recommendations", async (req, res) => {
  try {
    const { tasks, habits, goals } = req.body;
    const ai = getGeminiAI();

    const dataContext = JSON.stringify({
      tasks: (tasks || []).map((t: any) => ({ title: t.title, dueDate: t.dueDate, priority: t.priority, status: t.status })),
      habits: (habits || []).map((h: any) => ({ title: h.title, frequency: h.frequency, streak: h.streak })),
      goals: (goals || []).map((g: any) => ({ title: g.title, targetDate: g.targetDate, progress: g.progress }))
    });

    const prompt = `You are a personalized productivity companion. Based on the user's current tasks, habits, and goals, formulate 3 hyper-personalized, proactive, and actionable recommendations.
Context Data:
${dataContext}

If the user has no tasks/habits, provide a set of warm onboarding recommendations on how they can build solid routines.
Otherwise, analyze deadlines and streaks, identify bottlenecks (e.g. high-priority tasks with near deadlines, habits that are falling behind, or stagnant goals), and deliver specific scheduling alerts. Ensure the copy is supportive, friendly, and completely jargon-free.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Short title of the recommendation" },
                  description: { type: Type.STRING, description: "Actionable, simple advice description" },
                  urgency: { type: Type.STRING, description: "high, medium, or low" },
                  suggestedAction: { type: Type.STRING, description: "Obvious button label or step they should take" }
                },
                required: ["title", "description", "urgency", "suggestedAction"]
              }
            },
            productivityScore: { type: Type.INTEGER, description: "A simulated index from 0 to 100 on their balance" },
            scoreReason: { type: Type.STRING, description: "One simple sentence explaining their productivity health" }
          },
          required: ["recommendations", "productivityScore", "scoreReason"]
        }
      }
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in /api/get-recommendations:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommendations." });
  }
});

// Setup Vite or static files middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
