/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import {
  Droplets,
  Thermometer,
  Wind,
  Layers,
  AlertTriangle,
  Activity,
  User,
  Zap,
  CheckCircle,
} from "lucide-react";
import { Zone, TelemetryReading, ActuatorLog } from "../types";

interface DashboardOverviewProps {
  zones: Zone[];
  telemetry: Record<string, TelemetryReading>;
  activeZoneId: string;
  onZoneSelect: (zoneId: string) => void;
  eventLogs: ActuatorLog[];
  userRole: string;
}

export default function DashboardOverview({
  zones,
  telemetry,
  activeZoneId,
  onZoneSelect,
  eventLogs,
  userRole,
}: DashboardOverviewProps) {
  // Aggregate Fleet Metrics
  const zoneIds = zones.map((z) => z.id);
  const activeReadings = zoneIds.map((id) => telemetry[id]).filter(Boolean);

  const avgMoisture = activeReadings.length
    ? Math.round(activeReadings.reduce((acc, curr) => acc + curr.soilMoisture, 0) / activeReadings.length)
    : 42;

  const avgTemp = activeReadings.length
    ? parseFloat((activeReadings.reduce((acc, curr) => acc + curr.ambientTemp, 0) / activeReadings.length).toFixed(1))
    : 24.5;

  const avgHumidity = activeReadings.length
    ? Math.round(activeReadings.reduce((acc, curr) => acc + curr.humidity, 0) / activeReadings.length)
    : 48;

  const currentTankLevel = activeReadings[0]?.tankLevel || 75;

  // Find any active dry-run alert
  const hasDryRunAlert = activeReadings.some((r) => r.soilMoisture < 20);
  const totalFlow = activeReadings.reduce((acc, curr) => acc + curr.flowRate, 0);

  return (
    <div className="space-y-6">
      {/* 1. KPI Fleet Summary Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Moisture KPI */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Moisture Index</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <Droplets className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight">{avgMoisture}%</span>
            <span className="text-[10px] text-emerald-600 font-mono block mt-0.5">Average Soil</span>
          </div>
        </div>

        {/* Temperature KPI */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Ambient Temp</span>
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Thermometer className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight">{avgTemp}°C</span>
            <span className="text-[10px] text-gray-500 font-mono block mt-0.5">Daily Mean</span>
          </div>
        </div>

        {/* Air Humidity KPI */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Air Humidity</span>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Wind className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight">{avgHumidity}%</span>
            <span className="text-[10px] text-gray-500 font-mono block mt-0.5">Vapor Density</span>
          </div>
        </div>

        {/* Pump Flow Rate */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Pump Flow</span>
            <div className="p-1.5 bg-cyan-50 rounded-lg">
              <Activity className="h-4 w-4 text-cyan-600 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight">{totalFlow.toFixed(1)} L/m</span>
            <span className="text-[10px] text-cyan-600 font-mono block mt-0.5">Cumulative Flow</span>
          </div>
        </div>

        {/* Reservoir Water Level */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Reservoir Tank</span>
            <div className="p-1.5 bg-teal-50 rounded-lg">
              <Layers className="h-4 w-4 text-teal-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 leading-tight">{currentTankLevel}%</span>
            <span className="text-[10px] text-teal-600 font-mono block mt-0.5">Volumetric Cap</span>
          </div>
        </div>

        {/* Edge Safety indicator */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono font-bold text-gray-400">Edge Interlock</span>
            <div className="p-1.5 bg-red-50 rounded-lg">
              <AlertTriangle className={`h-4 w-4 ${hasDryRunAlert ? "text-red-600 animate-bounce" : "text-gray-400"}`} />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm font-bold block truncate leading-tight ${hasDryRunAlert ? "text-red-600" : "text-emerald-700"}`}>
              {hasDryRunAlert ? "DRY RUN RISK" : "SECURE"}
            </span>
            <span className="text-[10px] text-gray-400 font-mono block mt-1.5">Methane: {activeReadings[0]?.gasPpm || 12}ppm</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Zone Selector Cards */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-emerald-600" />
              Active Zone Topology
            </h3>
            <p className="text-xs text-gray-500">
              Manage individual zone boundaries, soil configurations, and target moisture limits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone) => {
              const tr = telemetry[zone.id] || { soilMoisture: 45, flowRate: 0 };
              const isDry = tr.soilMoisture < zone.targetMoistureMin;
              const isSelected = zone.id === activeZoneId;

              return (
                <div
                  key={zone.id}
                  onClick={() => onZoneSelect(zone.id)}
                  className={`border rounded-2xl p-4 cursor-pointer transition ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/10 shadow-xs"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase font-mono tracking-wider">
                        {zone.soilType}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">{zone.name}</h4>
                    </div>
                    {isDry ? (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                        <AlertTriangle className="h-2.5 w-2.5" /> Depleted
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase">
                        <CheckCircle className="h-2.5 w-2.5" /> Optimal
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] border-t border-gray-100/70 pt-3">
                    <div>
                      <span className="text-gray-400 block font-mono">Current Moisture</span>
                      <span className="font-bold text-gray-800">{tr.soilMoisture}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-mono">Water Flow</span>
                      <span className="font-bold text-gray-800">{tr.flowRate} L/min</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Actuator CDC Change Data Logs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between h-[360px] lg:h-auto">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Zap className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />
              CDC Telemetry Logs
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Real-time feed of actuator states and automated safety interlocks
            </p>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {eventLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-start gap-2.5 text-[11px]"
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      log.state === "ON"
                        ? "bg-cyan-100 text-cyan-800"
                        : "bg-gray-150 text-gray-600"
                    }`}
                  >
                    <Droplets className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-400 mb-0.5">
                      <span>{log.timestamp}</span>
                      <span className="uppercase tracking-wide font-semibold text-gray-500 bg-gray-200/50 px-1.5 py-0.2 rounded-xs">
                        {log.triggerSource}
                      </span>
                    </div>
                    <p className="text-gray-800 leading-normal">
                      <strong>{log.zoneName}</strong> water valve switched{" "}
                      <span className={`font-bold ${log.state === "ON" ? "text-cyan-600" : "text-gray-600"}`}>
                        {log.state}
                      </span>
                      .
                    </p>
                    {log.operatorName && (
                      <span className="text-[10px] text-gray-500 block mt-1 flex items-center gap-1">
                        <User className="h-2.5 w-2.5" />
                        Triggered by: {log.operatorName} ({userRole})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 text-[10px] text-gray-400 font-mono flex items-center justify-between">
            <span>Broker: AWS IoT Core</span>
            <span>QoS: 1 (At Least Once)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
