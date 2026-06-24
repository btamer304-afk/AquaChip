/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Cpu,
  TrendingUp,
  Sparkles,
  Settings,
  Droplets,
  AlertOctagon,
  ShieldAlert,
  UserCheck,
  Building,
  CheckCircle,
  TrendingDown,
} from "lucide-react";
import { Zone, Device, TelemetryReading, ActuatorLog, TelemetryDataPoint, UserRole, Organization } from "./types";
import DashboardOverview from "./components/DashboardOverview";
import DigitalTwin from "./components/DigitalTwin";
import TelemetryCharts from "./components/TelemetryCharts";
import AICopilot from "./components/AICopilot";
import SettingsPanel from "./components/SettingsPanel";

export default function App() {
  // 1. Navigation state
  const [activeTab, setActiveTab] = useState<"dashboard" | "twin" | "charts" | "copilot" | "settings">("dashboard");

  // 2. Active Tenant (Organization & RBAC) State
  const [organization, setOrganization] = useState<Organization>({
    id: "org-77291",
    name: "Al-Rehab Agronomic Ltd.",
    tier: "Enterprise",
  });
  const [userRole, setUserRole] = useState<UserRole>("Agronomist");

  // Banner warnings for RBAC / safety
  const [rbacWarning, setRbacWarning] = useState<string | null>(null);
  const [gasLeakSimulation, setGasLeakSimulation] = useState(false);
  const [airLockSimulation, setAirLockSimulation] = useState(false);

  // 3. Farm Topography Setup
  const [zones, setZones] = useState<Zone[]>([
    {
      id: "zone-1",
      name: "North Orchard",
      cropType: "Apple Trees",
      soilType: "Clay Loam",
      targetMoistureMin: 45,
      targetMoistureMax: 65,
      areaAcres: 25,
    },
    {
      id: "zone-2",
      name: "South Field",
      cropType: "Spring Wheat",
      soilType: "Sandy Loam",
      targetMoistureMin: 30,
      targetMoistureMax: 50,
      areaAcres: 50,
    },
    {
      id: "zone-3",
      name: "East Vineyard",
      cropType: "Wine Grapes",
      soilType: "Sandy",
      targetMoistureMin: 25,
      targetMoistureMax: 45,
      areaAcres: 35,
    },
    {
      id: "zone-4",
      name: "Greenhouse",
      cropType: "Heirloom Tomatoes",
      soilType: "Organic Mix",
      targetMoistureMin: 50,
      targetMoistureMax: 70,
      areaAcres: 5,
    },
  ]);

  const [activeZoneId, setActiveZoneId] = useState<string>("zone-1");

  // 4. Actuator Relays state (ON/OFF per zone)
  const [pumpStates, setPumpStates] = useState<Record<string, boolean>>({
    "zone-1": false,
    "zone-2": false,
    "zone-3": false,
    "zone-4": false,
  });

  // Keep track of how long a pump has been on with 0 flow rate (for dry run simulation)
  const [dryTicks, setDryTicks] = useState<Record<string, number>>({
    "zone-1": 0,
    "zone-2": 0,
    "zone-3": 0,
    "zone-4": 0,
  });

  // 5. Edge Safety Interlocks Configuration
  const [safetyInterlocks, setSafetyInterlocks] = useState({
    dryRunProtection: true,
    offlineMode: false,
  });

  // 6. Devices State (Hardware Sync Registry)
  const [devices, setDevices] = useState<Device[]>([
    { id: "GW-10", hardwareUid: "ESP32-GW-99AF01", zoneId: "zone-1", deviceType: "Gateway", status: "ONLINE", firmwareVersion: "v1.4.2", lastSeen: "Just now" },
    { id: "PUMP-1", hardwareUid: "ESP32-PM-88BC12", zoneId: "zone-1", deviceType: "PumpController", status: "ONLINE", firmwareVersion: "v2.0.1", lastSeen: "Just now" },
    { id: "NODE-1", hardwareUid: "ESP32-ND-11CD45", zoneId: "zone-1", deviceType: "Node", status: "ONLINE", firmwareVersion: "v2.1.0", lastSeen: "Just now" },
    { id: "PUMP-2", hardwareUid: "ESP32-PM-88BC22", zoneId: "zone-2", deviceType: "PumpController", status: "ONLINE", firmwareVersion: "v2.0.1", lastSeen: "Just now" },
    { id: "NODE-2", hardwareUid: "ESP32-ND-11CD66", zoneId: "zone-2", deviceType: "Node", status: "ONLINE", firmwareVersion: "v2.1.0", lastSeen: "Just now" },
    { id: "PUMP-3", hardwareUid: "ESP32-PM-88BC33", zoneId: "zone-3", deviceType: "PumpController", status: "ONLINE", firmwareVersion: "v2.0.1", lastSeen: "Just now" },
    { id: "NODE-3", hardwareUid: "ESP32-ND-11CD77", zoneId: "zone-3", deviceType: "Node", status: "ONLINE", firmwareVersion: "v2.1.0", lastSeen: "Just now" },
    { id: "PUMP-4", hardwareUid: "ESP32-PM-88BC44", zoneId: "zone-4", deviceType: "PumpController", status: "ONLINE", firmwareVersion: "v2.0.1", lastSeen: "Just now" },
    { id: "NODE-4", hardwareUid: "ESP32-ND-11CD88", zoneId: "zone-4", deviceType: "Node", status: "ONLINE", firmwareVersion: "v2.1.0", lastSeen: "Just now" },
  ]);

  // 7. Telemetry State (Current sensor readings per zone)
  const [telemetry, setTelemetry] = useState<Record<string, TelemetryReading>>({
    "zone-1": { timestamp: "Just now", soilMoisture: 48, ambientTemp: 24.2, humidity: 48, flowRate: 0, tankLevel: 75, gasPpm: 12 },
    "zone-2": { timestamp: "Just now", soilMoisture: 32, ambientTemp: 25.8, humidity: 42, flowRate: 0, tankLevel: 75, gasPpm: 14 },
    "zone-3": { timestamp: "Just now", soilMoisture: 26, ambientTemp: 26.5, humidity: 39, flowRate: 0, tankLevel: 75, gasPpm: 11 },
    "zone-4": { timestamp: "Just now", soilMoisture: 55, ambientTemp: 28.0, humidity: 62, flowRate: 0, tankLevel: 75, gasPpm: 15 },
  });

  // 8. Historical Telemetry for graphing (pre-populated)
  const [historicalData, setHistoricalData] = useState<Record<string, TelemetryDataPoint[]>>({
    "zone-1": [
      { time: "08:00", moisture: 54, temp: 21.0, humidity: 55, flow: 0, gas: 12 },
      { time: "10:00", moisture: 52, temp: 22.5, humidity: 52, flow: 0, gas: 12 },
      { time: "12:00", moisture: 50, temp: 23.8, humidity: 49, flow: 15.2, gas: 11 },
      { time: "14:00", moisture: 53, temp: 24.5, humidity: 47, flow: 15.0, gas: 12 },
      { time: "16:00", moisture: 51, temp: 24.2, humidity: 48, flow: 0, gas: 12 },
      { time: "18:00", moisture: 49, temp: 23.0, humidity: 50, flow: 0, gas: 13 },
    ],
    "zone-2": [
      { time: "08:00", moisture: 36, temp: 22.0, humidity: 48, flow: 0, gas: 13 },
      { time: "10:00", moisture: 35, temp: 23.5, humidity: 46, flow: 0, gas: 14 },
      { time: "12:00", moisture: 34, temp: 25.0, humidity: 44, flow: 0, gas: 14 },
      { time: "14:00", moisture: 33, temp: 25.8, humidity: 42, flow: 0, gas: 14 },
      { time: "16:00", moisture: 32, temp: 25.5, humidity: 42, flow: 0, gas: 14 },
      { time: "18:00", moisture: 31, temp: 24.5, humidity: 45, flow: 0, gas: 15 },
    ],
    "zone-3": [
      { time: "08:00", moisture: 29, temp: 23.0, humidity: 44, flow: 0, gas: 11 },
      { time: "10:00", moisture: 28, temp: 24.8, humidity: 41, flow: 0, gas: 11 },
      { time: "12:00", moisture: 27, temp: 26.2, humidity: 39, flow: 0, gas: 10 },
      { time: "14:00", moisture: 26, temp: 26.5, humidity: 39, flow: 0, gas: 11 },
      { time: "16:00", moisture: 25, temp: 26.0, humidity: 40, flow: 0, gas: 12 },
      { time: "18:00", moisture: 24, temp: 25.0, humidity: 42, flow: 0, gas: 11 },
    ],
    "zone-4": [
      { time: "08:00", moisture: 60, temp: 25.0, humidity: 68, flow: 0, gas: 14 },
      { time: "10:00", moisture: 59, temp: 26.8, humidity: 65, flow: 12.4, gas: 15 },
      { time: "12:00", moisture: 62, temp: 27.5, humidity: 63, flow: 12.0, gas: 14 },
      { time: "14:00", moisture: 58, temp: 28.2, humidity: 61, flow: 0, gas: 15 },
      { time: "16:00", moisture: 56, temp: 28.0, humidity: 62, flow: 0, gas: 15 },
      { time: "18:00", moisture: 55, temp: 27.2, humidity: 64, flow: 0, gas: 16 },
    ],
  });

  // 9. Change Data Capture Actuator Log list
  const [eventLogs, setEventLogs] = useState<ActuatorLog[]>([
    {
      id: "log-1",
      timestamp: "18:00:05",
      deviceId: "PUMP-1",
      zoneName: "North Orchard",
      state: "OFF",
      triggerSource: "Rule",
    },
    {
      id: "log-2",
      timestamp: "12:00:00",
      deviceId: "PUMP-1",
      zoneName: "North Orchard",
      state: "ON",
      triggerSource: "Manual",
      operatorName: "Jane Miller",
    },
    {
      id: "log-3",
      timestamp: "10:15:22",
      deviceId: "PUMP-4",
      zoneName: "Greenhouse",
      state: "ON",
      triggerSource: "AI",
    },
  ]);

  // Main background physical simulation ticker
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Simulate natural weather conditions and soil moisture drying
      setTelemetry((prev) => {
        const next = { ...prev };
        let generalTankLevel = prev["zone-1"]?.tankLevel || 75;

        // Calculate total demand to drop tank level
        let isWateringAny = false;
        Object.keys(pumpStates).forEach((zoneId) => {
          if (pumpStates[zoneId]) isWateringAny = true;
        });

        if (isWateringAny && generalTankLevel > 0) {
          generalTankLevel = Math.max(0, parseFloat((generalTankLevel - 0.4).toFixed(2)));
        } else if (!isWateringAny && generalTankLevel < 100) {
          // Slow refill of the tank from dynamic main feed supply
          generalTankLevel = Math.min(100, parseFloat((generalTankLevel + 0.1).toFixed(2)));
        }

        zones.forEach((zone) => {
          const t = prev[zone.id];
          if (!t) return;

          // Soil moisture depletion (Sandy soils dry much faster!)
          const dryRate = zone.soilType.includes("Sandy") ? 0.08 : 0.04;
          let newMoisture = t.soilMoisture;
          let newFlow = 0;

          // If pump is active, replenish soil moisture
          if (pumpStates[zone.id] && generalTankLevel > 0) {
            newMoisture = Math.min(95, parseFloat((newMoisture + 0.55).toFixed(1)));
            // flow rate goes up
            newFlow = airLockSimulation ? 0 : parseFloat((18.5 + (Math.random() - 0.5) * 2).toFixed(1));
          } else {
            newMoisture = Math.max(10, parseFloat((newMoisture - dryRate).toFixed(1)));
            newFlow = 0;
          }

          // Safety Gas Leak fluctuation
          let gas = gasLeakSimulation ? Math.round(180 + Math.random() * 20) : Math.round(12 + Math.random() * 4);

          // Build new telemetry
          next[zone.id] = {
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            soilMoisture: parseFloat(newMoisture.toFixed(1)),
            ambientTemp: parseFloat((t.ambientTemp + (Math.random() - 0.5) * 0.1).toFixed(1)),
            humidity: Math.max(20, Math.min(95, Math.round(t.humidity + (Math.random() - 0.5) * 2))),
            flowRate: newFlow,
            tankLevel: generalTankLevel,
            gasPpm: gas,
          };
        });

        return next;
      });

      // 2. Evaluate ESP32 Edge Safety Interlocks (Dry-Run Protection)
      if (safetyInterlocks.dryRunProtection) {
        Object.keys(pumpStates).forEach((zoneId) => {
          if (pumpStates[zoneId]) {
            const currentReading = telemetry[zoneId];
            // If pump is ON but flow is 0 (due to air-lock blockage, or tank running empty!)
            if (currentReading && currentReading.flowRate === 0) {
              setDryTicks((prevTicks) => {
                const nextTicks = { ...prevTicks };
                nextTicks[zoneId] = (nextTicks[zoneId] || 0) + 1;

                // Trigger emergency shutdown if flow rate stays 0 for 3 consecutive ticks (~4.5s simulation)
                if (nextTicks[zoneId] >= 3) {
                  // Terminate Pump State
                  setPumpStates((prevPumps) => ({ ...prevPumps, [zoneId]: false }));
                  nextTicks[zoneId] = 0;

                  // Add emergency shutdown to CDC telemetry logs
                  const zoneName = zones.find((z) => z.id === zoneId)?.name || "Zone";
                  const emergencyLog: ActuatorLog = {
                    id: `emerg-${Date.now()}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                    deviceId: `PUMP-${zoneId.slice(-1)}`,
                    zoneName,
                    state: "OFF",
                    triggerSource: "Rule",
                    operatorName: "ESP32 INTERLOCK",
                  };
                  setEventLogs((prevLogs) => [emergencyLog, ...prevLogs]);

                  alert(`🚨 [SAFETY CUT-OFF] ESP32 Dry-Run Interlock triggered on PUMP-${zoneId.slice(-1)} (${zoneName}). Flow rate collapsed to 0 L/min while active. Relay automatically tripped to prevent pump motor cavitation damage.`);
                }
                return nextTicks;
              });
            } else {
              setDryTicks((prevTicks) => ({ ...prevTicks, [zoneId]: 0 }));
            }
          }
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [pumpStates, safetyInterlocks, telemetry, airLockSimulation, gasLeakSimulation]);

  // Periodic Historical Chart Data Aggregator
  useEffect(() => {
    const histInterval = setInterval(() => {
      setHistoricalData((prev) => {
        const next = { ...prev };
        const currentTimeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        zones.forEach((zone) => {
          const currentReading = telemetry[zone.id];
          if (!currentReading) return;

          const slice = next[zone.id] ? [...next[zone.id]] : [];
          slice.push({
            time: currentTimeString,
            moisture: currentReading.soilMoisture,
            temp: currentReading.ambientTemp,
            humidity: currentReading.humidity,
            flow: currentReading.flowRate,
            gas: currentReading.gasPpm,
          });

          // Cap historical elements to avoid bloat
          if (slice.length > 10) slice.shift();
          next[zone.id] = slice;
        });

        return next;
      });
    }, 12000); // Record point every 12s

    return () => clearInterval(histInterval);
  }, [telemetry]);

  // Actuator Trigger handler with RBAC Access Validation
  const handleTogglePump = (zoneId: string) => {
    // RBAC validation: Only Agronomists and SuperAdmins can manual override pump relays
    if (userRole === "Operator") {
      setRbacWarning(
        `Access Denied: Operator role has READ-ONLY clearance. Manual pump override relays require Agronomist or SuperAdmin permissions.`
      );
      setTimeout(() => setRbacWarning(null), 5000);
      return;
    }

    setPumpStates((prev) => {
      const nextState = !prev[zoneId];
      const zoneName = zones.find((z) => z.id === zoneId)?.name || "Zone";

      // Register Actuator change in CDC logs
      const changeLog: ActuatorLog = {
        id: `user-log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        deviceId: `PUMP-${zoneId.slice(-1)}`,
        zoneName,
        state: nextState ? "ON" : "OFF",
        triggerSource: "Manual",
        operatorName: userRole === "SuperAdmin" ? "SuperAdmin Node Override" : "Agronomist Portal Control",
      };

      setEventLogs((prevLogs) => [changeLog, ...prevLogs]);
      return { ...prev, [zoneId]: nextState };
    });
  };

  const handleTriggerIrrigationFromAI = (zoneId: string, durationMinutes: number) => {
    setPumpStates((prev) => {
      const zoneName = zones.find((z) => z.id === zoneId)?.name || "Zone";

      const changeLog: ActuatorLog = {
        id: `ai-log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        deviceId: `PUMP-${zoneId.slice(-1)}`,
        zoneName,
        state: "ON",
        triggerSource: "AI",
        operatorName: "AI Co-Pilot Approved Schedule",
      };

      setEventLogs((prevLogs) => [changeLog, ...prevLogs]);
      return { ...prev, [zoneId]: true };
    });
  };

  const handleToggleSafety = (type: "dryRunProtection" | "offlineMode") => {
    setSafetyInterlocks((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleTierChange = (tier: "Standard" | "Premium" | "Enterprise") => {
    setOrganization((prev) => ({ ...prev, tier }));
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 flex flex-col md:flex-row">
      
      {/* Dynamic Left Sidebar Menu */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-slate-900">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-wider uppercase">AquaMind AI</h1>
              <span className="text-[10px] text-emerald-400 font-bold font-mono">FARM OPERATING SYSTEM</span>
            </div>
          </div>

          {/* Org Selector Visual Frame */}
          <div className="mx-4 my-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
            <Building className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block">Organization</span>
              <span className="text-xs font-bold text-slate-200 block truncate">{organization.name}</span>
              <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.2 rounded-xs mt-1 inline-block">
                {organization.tier} Tier
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                activeTab === "dashboard" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Executive Fleet View
            </button>
            <button
              onClick={() => setActiveTab("twin")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                activeTab === "twin" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Cpu className="h-4 w-4" />
              Digital Twin Map
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                activeTab === "charts" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Analytics & Evapotranspiration
            </button>
            <button
              onClick={() => setActiveTab("copilot")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition relative ${
                activeTab === "copilot" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI Agronomist Co-Pilot
              <span className="absolute right-3 top-3.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                activeTab === "settings" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Settings className="h-4 w-4" />
              Device & Org Settings
            </button>
          </nav>
        </div>

        {/* User Identity Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-slate-950 font-extrabold text-sm font-mono shrink-0">
            {userRole[0]}
          </div>
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block">Operator ID</span>
            <span className="text-xs font-bold text-slate-200 block truncate">Tamer, B.</span>
            <span className="text-[9px] text-emerald-400 font-semibold block flex items-center gap-1">
              <UserCheck className="h-2.5 w-2.5" />
              Role: {userRole}
            </span>
          </div>
        </div>
      </aside>

      {/* Primary Page Canvas */}
      <main className="flex-1 flex flex-col overflow-x-hidden">
        {/* Dynamic Warning Banners */}
        {rbacWarning && (
          <div className="bg-red-50 border-b border-red-100 px-5 py-3.5 text-xs text-red-800 font-medium flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-600 animate-bounce" />
            <span>{rbacWarning}</span>
          </div>
        )}

        {/* Top Operational Bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">
              {activeTab === "dashboard" && "Executive Fleet View"}
              {activeTab === "twin" && "Geospatial Digital Twin Layer"}
              {activeTab === "charts" && "Agronomic Physical Models"}
              {activeTab === "copilot" && "AI RAG Orchestration Client"}
              {activeTab === "settings" && "Hardware Registry & Security Profiles"}
            </h2>
            <p className="text-xs text-gray-500">
              Active Zone Selection: <strong className="text-emerald-700">{zones.find(z => z.id === activeZoneId)?.name}</strong>
            </p>
          </div>

          {/* Real-time Hardware Simulator Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-gray-400 mr-2">IoT Simulation Injectors:</span>
            
            {/* Injector 1: Simulate Air Lock / Blockage */}
            <button
              onClick={() => setAirLockSimulation((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${
                airLockSimulation
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <AlertOctagon className={`h-3 w-3 ${airLockSimulation && "animate-pulse"}`} />
              {airLockSimulation ? "Conduit Blocked!" : "Inject Pump Lock"}
            </button>

            {/* Injector 2: Simulate Gas Leak */}
            <button
              onClick={() => setGasLeakSimulation((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center gap-1.5 ${
                gasLeakSimulation
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ShieldAlert className={`h-3 w-3 ${gasLeakSimulation && "animate-bounce"}`} />
              {gasLeakSimulation ? "Gas Leak Active!" : "Inject Gas Leak (MQ5)"}
            </button>
          </div>
        </header>

        {/* Content Box */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "dashboard" && (
            <DashboardOverview
              zones={zones}
              telemetry={telemetry}
              activeZoneId={activeZoneId}
              onZoneSelect={setActiveZoneId}
              eventLogs={eventLogs}
              userRole={userRole}
            />
          )}

          {activeTab === "twin" && (
            <DigitalTwin
              zones={zones}
              devices={devices}
              telemetry={telemetry}
              activeZoneId={activeZoneId}
              onZoneSelect={setActiveZoneId}
              onPumpToggle={handleTogglePump}
              pumpStates={pumpStates}
            />
          )}

          {activeTab === "charts" && (
            <TelemetryCharts
              activeZone={zones.find((z) => z.id === activeZoneId) || zones[0]}
              historicalData={historicalData[activeZoneId] || []}
            />
          )}

          {activeTab === "copilot" && (
            <AICopilot
              zones={zones}
              telemetry={telemetry}
              activeZoneId={activeZoneId}
              onTriggerIrrigation={handleTriggerIrrigationFromAI}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPanel
              devices={devices}
              userRole={userRole}
              onRoleChange={handleRoleChange}
              organization={organization}
              onTierChange={handleTierChange}
              safetyInterlocks={safetyInterlocks}
              onToggleSafety={handleToggleSafety}
            />
          )}
        </div>
      </main>
    </div>
  );
}
