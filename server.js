import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Allowed origins (Production Netlify frontend + local development)
const allowedOrigins = [
  "https://fod.glinfico.com",
  "https://ai-poweredfundingplatform.netlify.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root landing route
app.get("/", (req, res) => {
  res.status(200).json({
    platform: "GLINFICO BaaS",
    status: "online",
    documentation: "/api/health"
  });
});

// Primary health route matching incoming Netlify proxy requests
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    platform: "GLINFICO",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Secondary health route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    platform: "GLINFICO",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Sample Deal/Lead Ingestion Route
app.post("/api/deals/process", async (req, res) => {
  try {
    const { businessName, amountRequested, creditScore } = req.body;
    res.status(200).json({
      success: true,
      message: "Lead payload received and queued for automation processing.",
      dealId: `DEAL-${Date.now()}`,
      data: { businessName, amountRequested, creditScore }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Legacy demo login is disabled; this server must not mint fake authentication tokens.
app.post("/api/auth/login", (_req, res) => {
  res.status(410).json({
    success: false,
    error: "This legacy sign-in endpoint is disabled. Use Supabase Auth."
  });
});

// Fallback 404 handler (Must stay at the bottom before app.listen)
app.use((req, res) => {
  res.status(404).json({ error: "Route Not Found", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`GLINFICO BaaS Server running on port ${PORT}`);
});
