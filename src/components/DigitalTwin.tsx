/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Droplets, Thermometer, Wind, Radio, AlertTriangle, Cpu } from "lucide-react";
import { Zone, TelemetryReading, Device } from "../types";

interface DigitalTwinProps {
  zones: Zone[];
  devices: Device[];
  telemetry: Record<string, TelemetryReading>;
  activeZoneId: string;
  onZoneSelect: (zoneId: string) => void;
  onPumpToggle: (zoneId: string) => void;
  pumpStates: Record<string, boolean>;
}

export default function DigitalTwin({
  zones,
  devices,
  telemetry,
  activeZoneId,
  onZoneSelect,
  onPumpToggle,
  pumpStates,
}: DigitalTwinProps) {
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Helper to calculate moisture color interpolation
  const getMoistureColorClass = (moisture: number, zone: Zone) => {
    if (moisture < zone.targetMoistureMin) {
      return "fill-amber-500/25 stroke-amber-500 hover:fill-amber-500/45"; // Parched/Dry
    }
    if (moisture > zone.targetMoistureMax) {
      return "fill-cyan-600/30 stroke-cyan-500 hover:fill-cyan-600/50"; // Saturated
    }
    return "fill-emerald-500/25 stroke-emerald-500 hover:fill-emerald-500/45"; // Optimal
  };

  const getMoistureBadgeColor = (moisture: number, zone: Zone) => {
    if (moisture < zone.targetMoistureMin) return "bg-amber-100 text-amber-800 border-amber-200";
    if (moisture > zone.targetMoistureMax) return "bg-cyan-100 text-cyan-800 border-cyan-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  // Static coordinate outlines for the farm zones (SVG grid 600x400)
  // Designed to look like topographic polygons on a modern satellite grid map
  const zonePolygons: Record<string, string> = {
    "zone-1": "M 50,50 L 250,50 L 220,180 L 40,150 Z",       // North Orchard
    "zone-2": "M 270,50 L 550,50 L 530,190 L 240,180 Z",     // South Field
    "zone-3": "M 40,170 L 220,195 L 180,350 L 30,320 Z",     // East Vineyard
    "zone-4": "M 240,200 L 525,205 L 500,350 L 200,340 Z",   // Greenhouse
  };

  // Conduit pipes feeding water from the Central Tank (located at 280, 250) to the zones
  const conduitPaths: Record<string, string> = {
    "zone-1": "M 280,250 Q 150,220 120,120",
    "zone-2": "M 290,250 Q 400,210 420,130",
    "zone-3": "M 280,260 Q 180,280 120,260",
    "zone-4": "M 290,260 Q 380,290 370,270",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Topographic Vector Interactive Digital Twin Map */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col h-[520px]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-emerald-600" />
              Live Geospatial Twin Layer
            </h3>
            <p className="text-xs text-gray-500">
              Interactive 2D vector field overlay of sensors, tank nodes, and telemetry pipelines
            </p>
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/30 border border-amber-500"></span>
              Under-watered
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/30 border border-emerald-500"></span>
              Optimal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500/30 border border-cyan-500"></span>
              Saturated
            </span>
          </div>
        </div>

        {/* Map SVG Wrapper */}
        <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
          {/* Topographic Grid Pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <svg
            viewBox="0 0 600 400"
            className="w-full h-full select-none"
            id="farm-svg"
          >
            {/* 1. Draw pipelines/conduits first (so they sit below zones & nodes) */}
            {zones.map((zone) => {
              const isActive = pumpStates[zone.id];
              const reading = telemetry[zone.id] || { flowRate: 0 };
              const flowRate = reading.flowRate;
              
              return (
                <g key={`conduit-${zone.id}`}>
                  {/* Static background conduit line */}
                  <path
                    d={conduitPaths[zone.id]}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Dynamic active water flow animation */}
                  {isActive && flowRate > 0 && (
                    <path
                      d={conduitPaths[zone.id]}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray="6, 8"
                      className="animate-[dash_2s_linear_infinite]"
                      style={{
                        animationDuration: flowRate > 15 ? "0.8s" : "1.8s",
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* 2. Farm Zones Polygons */}
            {zones.map((zone) => {
              const reading = telemetry[zone.id] || { soilMoisture: 40 };
              const isSelected = zone.id === activeZoneId;
              const isHovered = zone.id === hoveredZoneId;
              
              return (
                <path
                  key={zone.id}
                  d={zonePolygons[zone.id]}
                  className={`transition-all duration-300 cursor-pointer ${getMoistureColorClass(reading.soilMoisture, zone)}`}
                  strokeWidth={isSelected ? "3.5" : "1.5"}
                  strokeDasharray={isSelected ? "none" : "3,3"}
                  style={{
                    stroke: isSelected ? "#10b981" : isHovered ? "#cbd5e1" : "#475569",
                  }}
                  onClick={() => onZoneSelect(zone.id)}
                  onMouseEnter={() => setHoveredZoneId(zone.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                />
              );
            })}

            {/* 3. Text Labels for Zones inside Polygons */}
            <g className="pointer-events-none font-sans font-semibold text-[11px] fill-slate-300">
              <text x="120" y="90" textAnchor="middle">North Orchard</text>
              <text x="120" y="110" className="text-[9px] fill-slate-400" textAnchor="middle">
                {telemetry["zone-1"]?.soilMoisture}% moisture
              </text>

              <text x="390" y="100" textAnchor="middle">South Field</text>
              <text x="390" y="120" className="text-[9px] fill-slate-400" textAnchor="middle">
                {telemetry["zone-2"]?.soilMoisture}% moisture
              </text>

              <text x="110" y="250" textAnchor="middle">East Vineyard</text>
              <text x="110" y="270" className="text-[9px] fill-slate-400" textAnchor="middle">
                {telemetry["zone-3"]?.soilMoisture}% moisture
              </text>

              <text x="360" y="260" textAnchor="middle">Greenhouse Zone</text>
              <text x="360" y="280" className="text-[9px] fill-slate-400" textAnchor="middle">
                {telemetry["zone-4"]?.soilMoisture}% moisture
              </text>
            </g>

            {/* 4. central Water Reservoir Tower (at 285, 235) */}
            <g transform="translate(265, 210)" className="cursor-pointer">
              {/* Ground shadow */}
              <ellipse cx="20" cy="45" rx="15" ry="4" fill="#0f172a" opacity="0.6" />
              {/* Tank legs */}
              <line x1="8" y1="20" x2="5" y2="45" stroke="#475569" strokeWidth="2.5" />
              <line x1="32" y1="20" x2="35" y2="45" stroke="#475569" strokeWidth="2.5" />
              <line x1="20" y1="10" x2="20" y2="45" stroke="#475569" strokeWidth="1.5" />
              {/* Tank Cylindrical Vessel */}
              <rect x="5" y="0" width="30" height="25" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
              <rect x="5" y="5" width="30" height="15" fill="#334155" />
              {/* Water Inside Tower (Dynamic) */}
              {(() => {
                const height = 15 * (telemetry["zone-1"]?.tankLevel / 100 || 0.75);
                return (
                  <rect
                    x="6"
                    y={20 - height}
                    width="28"
                    height={height}
                    fill="#0ea5e9"
                    opacity="0.8"
                  />
                );
              })()}
              <text x="20" y="-5" textAnchor="middle" className="fill-slate-200 text-[9px] font-bold">
                TANK ({telemetry["zone-1"]?.tankLevel || 75}%)
              </text>
            </g>

            {/* 5. Draw IoT Device Gateway Nodes */}
            {zones.map((zone, i) => {
              const coords = [
                { x: 100, y: 120 }, // zone 1
                { x: 420, y: 130 }, // zone 2
                { x: 140, y: 290 }, // zone 3
                { x: 420, y: 310 }, // zone 4
              ][i];

              const isOnline = devices.find(d => d.zoneId === zone.id)?.status === "ONLINE";

              return (
                <g key={`node-${zone.id}`} transform={`translate(${coords.x}, ${coords.y})`}>
                  {/* Ping Waves */}
                  {isOnline && (
                    <circle
                      cx="0"
                      cy="0"
                      r="12"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1"
                      className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
                      opacity="0.4"
                    />
                  )}
                  {/* Node Circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="5"
                    fill={isOnline ? "#10b981" : "#ef4444"}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text x="8" y="3" className="fill-slate-400 text-[8px] font-mono">ESP32-S3</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Side Control and Physical Telemetry Deck */}
      <div className="flex flex-col gap-4 h-[520px]">
        {/* Selected Zone Info Card */}
        {(() => {
          const focusedZone = zones.find((z) => z.id === activeZoneId) || zones[0];
          const tr = telemetry[focusedZone.id] || {
            soilMoisture: 0,
            ambientTemp: 0,
            humidity: 0,
            flowRate: 0,
            tankLevel: 0,
            gasPpm: 0,
          };
          const isWatering = pumpStates[focusedZone.id];

          return (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {focusedZone.cropType}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900 mt-1">{focusedZone.name}</h4>
                  </div>
                  <span className={`text-[11px] font-mono border px-2 py-0.5 rounded-sm ${getMoistureBadgeColor(tr.soilMoisture, focusedZone)}`}>
                    Moisture: {tr.soilMoisture}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <span className="text-[10px] text-gray-500 block uppercase font-mono">Soil Structure</span>
                    <span className="text-xs font-semibold text-gray-700">{focusedZone.soilType}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <span className="text-[10px] text-gray-500 block uppercase font-mono">Area Matrix</span>
                    <span className="text-xs font-semibold text-gray-700">{focusedZone.areaAcres} Acres</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <span className="text-[10px] text-gray-500 block uppercase font-mono">Min Humidity Cap</span>
                    <span className="text-xs font-semibold text-gray-700">{focusedZone.targetMoistureMin}% moisture</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <span className="text-[10px] text-gray-500 block uppercase font-mono">Gas PPM (Safety)</span>
                    <span className={`text-xs font-semibold ${tr.gasPpm > 100 ? "text-red-600 font-bold" : "text-gray-700"}`}>
                      {tr.gasPpm} ppm {tr.gasPpm > 100 && "⚠️"}
                    </span>
                  </div>
                </div>

                {/* Actuator Trigger Mechanism */}
                <div className="border-t border-gray-100 pt-4">
                  <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Droplets className="h-3.5 w-3.5 text-cyan-500" />
                    Irrigation Pump Actuator
                  </h5>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Main Zone Valve Solenoid
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Hardware Ref: {devices.find(d => d.zoneId === focusedZone.id && d.deviceType === "PumpController")?.hardwareUid || "ESP32-PUMP-X"}
                      </span>
                    </div>
                    <button
                      id={`toggle-pump-${focusedZone.id}`}
                      onClick={() => onPumpToggle(focusedZone.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        isWatering ? "bg-cyan-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isWatering ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Edge Safety Interlock Panel */}
              <div className="mt-4 bg-slate-900 text-slate-200 rounded-xl p-3.5 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-semibold uppercase font-mono tracking-wider">Edge-Safety Protocols</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>
                    • <strong>Dry-Run Interlock:</strong> Auto-shuts pump if water flow rate holds at 0 L/min for &gt; 15s.
                  </p>
                  <p>
                    • <strong>Offline Reversion:</strong> ESP32 falls back to offline schedules (EEPROM) if MQTT link drops.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
