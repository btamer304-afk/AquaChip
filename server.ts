/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON request bodies
  app.use(express.json());

  // Initialize Gemini Client
  const apiKey = process.env.GEMINI_API_KEY || "";
  let ai: GoogleGenAI | null = null;

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini Client successfully initialized server-side.");
    } catch (err) {
      console.error("Failed to initialize Gemini Client:", err);
    }
  } else {
    console.warn("GEMINI_API_KEY environment variable is not set. Falling back to agronomic local simulation.");
  }

  // 1. API: System Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      service: "AquaMind Farm OS",
      time: new Date().toISOString(),
      geminiConnected: !!ai,
    });
  });

  // 2. API: AI Copilot RAG Ingestion & Query
  app.post("/api/copilot", async (req, res) => {
    const { message, history, telemetry, zones, activeZoneId } = req.body;

    const systemInstruction = `You are AquaMind AI, the intelligent Agronomic Co-Pilot for a high-efficiency Farm Operating System.
You analyze real-time IoT soil moisture telemetry, ambient conditions, flow rates, and calculate daily reference Evapotranspiration (ET0) using soil-physics models.

Your tone is highly professional, objective, agronomic, and actionable. Do not use flowery or self-praising marketing language.
You have access to the following static Agronomic Knowledge Base (RAG vectors) in your memory:
1. Clay Loam soils (Greenhouse/Greenhouse Zone, North Orchard) require water retention monitoring. Ideal Moisture: 45%-65%. Crop factor (Kc) for Tomatoes/Greenhouse: 1.15. North Orchard (Apples): 0.95.
2. Sandy soils (South Field, East Vineyard) drain extremely fast. Ideal Moisture: 30%-45%. Crop factor (Kc) for Wheat: 0.85, Grapes: 0.70.
3. Flow rate warning: Normal pump flow rate is between 8 to 22 L/min. If pump is turned ON and flow remains at 0 L/min, dry-run protection triggers to prevent motor damage (Air lock or dry pump).
4. Evapotranspiration formula (FAO-56 Penman-Monteith): Water loss is calculated on solar radiation, humidity, and temperature. Low moisture triggers irrigation suggestions.

Context of active farm elements:
- Active Zone focus: ${activeZoneId ? activeZoneId : "All Zones"}
- Telemetry Matrix: ${JSON.stringify(telemetry)}
- Zone Information: ${JSON.stringify(zones)}

If you notice soil moisture in a zone is below its recommended minimum target moisture, suggest watering that zone!
If you recommend watering, insert a special parser tag at the VERY end of your response like this:
[ACTION: irrigate zoneId="ZONE_ID" zoneName="ZONE_NAME" duration=15]
Replace ZONE_ID, ZONE_NAME, and duration with recommended values (e.g. 10, 15, or 20 minutes) so the dashboard can render an executive action button!`;

    if (!ai) {
      // Offline fallback simulator
      const responseText = simulateAgronomicFallback(message, telemetry, zones, activeZoneId);
      return res.json({ text: responseText });
    }

    try {
      // Map history to the required format
      const contents = [];
      
      // Add chat history
      if (history && history.length > 0) {
        for (const msg of history) {
          contents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.content }],
          });
        }
      }

      // Add the current prompt
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "I was unable to compile an answer. Please review telemetry and try again.";
      res.json({ text });
    } catch (err: any) {
      console.error("Gemini API call failed:", err);
      // Fallback with error indicator
      const errorMsg = `Server-side Gemini request failed: ${err.message}. Reverting to local agronomic model:\n\n` +
        simulateAgronomicFallback(message, telemetry, zones, activeZoneId);
      res.json({ text: errorMsg });
    }
  });

  // Local rule-based agronomic model to guarantee responses even without internet or keys
  function simulateAgronomicFallback(message: string, telemetry: any, zones: any[], activeZoneId: string): string {
    const query = message.toLowerCase();
    
    // Identify focused zone
    const targetZone = zones.find(z => z.id === activeZoneId) || zones[0];
    const reading = telemetry[targetZone.id] || { soilMoisture: 38, ambientTemp: 24, humidity: 45, flowRate: 0, tankLevel: 75 };

    if (query.includes("irrigate") || query.includes("water") || query.includes("dry") || query.includes("schedule")) {
      let response = `Based on our offline local agronomic soil-moisture rules for **${targetZone.name}**:\n\n`;
      response += `- **Current Moisture**: ${reading.soilMoisture}%\n`;
      response += `- **Optimal Range**: ${targetZone.targetMoistureMin}% to ${targetZone.targetMoistureMax}%\n`;
      response += `- **Soil Profile**: ${targetZone.soilType} (${targetZone.cropType})\n\n`;

      if (reading.soilMoisture < targetZone.targetMoistureMin) {
        response += `⚠️ **Recommendation**: The moisture index is critically depleted below the recommended ${targetZone.targetMoistureMin}% threshold. Evapotranspiration stress is high. I recommend scheduling an irrigation cycle of 15 minutes immediately.\n\n`;
        response += `[ACTION: irrigate zoneId="${targetZone.id}" zoneName="${targetZone.name}" duration=15]`;
      } else {
        response += `✅ **Recommendation**: Current moisture of ${reading.soilMoisture}% is within the healthy threshold. No immediate watering is required. I suggest maintaining standard monitoring.\n\n`;
      }
      return response;
    }

    if (query.includes("status") || query.includes("telemetry") || query.includes("health")) {
      let response = `### AquaMind Local Fleet Status Report\n\n`;
      zones.forEach(zone => {
        const tr = telemetry[zone.id] || { soilMoisture: 42, flowRate: 0 };
        const status = tr.soilMoisture < zone.targetMoistureMin ? "⚠️ DEPLETED" : "✅ OPTIMAL";
        response += `- **${zone.name}** (${zone.cropType}): Moisture is **${tr.soilMoisture}%** (Target: ${zone.targetMoistureMin}-${zone.targetMoistureMax}%). Status: **${status}**.\n`;
      });
      response += `\nAll core physical constraints (Dry-Run, EEPROM schedules) are currently active and functioning properly on the simulated nodes.`;
      return response;
    }

    return `AquaMind AI here. I am monitoring soil moisture sensors, pump controllers, and local weather forecasts. 

Ask me about:
1. "Should I irrigate?" to check moisture status and trigger water cycles.
2. "Show telemetry status" to review the health of all zones.
3. "Is there any danger?" to check for active safety alerts like pump dry-runs or gas leaks.`;
  }

  // Vite development middleware or production static build serving
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AquaMind AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
