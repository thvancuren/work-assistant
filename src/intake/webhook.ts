// src/intake/webhook.ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { handleTextToTask } from "../agent";

dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "1mb" })); // JSON bodies
app.use(express.urlencoded({ extended: true })); // form-encoded fallbacks

// --- Types for request payload (optional, for clarity) ---
type IntakeBody = {
  text: string;        // required: the natural-language task description
  platform?: "asana" | "planner";  // optional: which platform to use
  source?: string;     // optional: "iOS Shortcut", "email", etc.
};

// --- Health/diagnostics ---
app.get("/", (_req, res) => {
  res.type("text").send("work-assistant webhook is running.");
});

app.get("/health", (_req, res) => {
  const hasAsana = !!process.env.ASANA_TOKEN && !!process.env.ASANA_PROJECT;
  const hasPlanner =
    !!process.env.GRAPH_TOKEN &&
    !!process.env.PLANNER_PLAN &&
    !!process.env.PLANNER_BUCKET;

  res.json({
    ok: true,
    node: process.version,
    asanaConfigured: hasAsana,
    plannerConfigured: hasPlanner,
  });
});

// --- Main intake endpoint ---
app.post("/intake", async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as IntakeBody;

    if (!body.text || typeof body.text !== "string") {
      return res.status(400).json({ ok: false, error: 'Missing required "text" in request body.' });
    }

    // Call the agent helper (Route B)
    const { text, platform, source } = body;
    const out = await handleTextToTask(text, platform);

    // Standardize success payload
    return res.json({
      ok: true,
      source: source ?? "webhook",
      backend: out.backend,
      taskUrl: out.taskUrl,
      // raw: out.raw, // Uncomment for debugging, but avoid returning big objects in prod
    });
  } catch (err: any) {
    console.error("[/intake] error:", err?.stack || err);
    // Surface a helpful message while keeping details in logs
    return res.status(500).json({
      ok: false,
      error: err?.message || "Internal error",
    });
  }
});

// --- Boot the server ---
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Webhook listening on http://localhost:${PORT}`);
  const asanaReady = !!process.env.ASANA_TOKEN && !!process.env.ASANA_PROJECT;
  const plannerReady =
    !!process.env.GRAPH_TOKEN &&
    !!process.env.PLANNER_PLAN &&
    !!process.env.PLANNER_BUCKET;
  console.log(`Asana configured: ${asanaReady} | Planner configured: ${plannerReady}`);
});

// (Optional) export app for unit/integration tests
export default app;
