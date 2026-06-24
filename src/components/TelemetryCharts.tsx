/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Thermometer, Droplets, Activity, Calculator, RefreshCw } from "lucide-react";
import { Zone, TelemetryDataPoint } from "../types";
import { calculatePenmanMonteith, estimateSoilDepletionRate } from "../lib/physics";

interface TelemetryChartsProps {
  activeZone: Zone;
  historicalData: TelemetryDataPoint[];
}

export default function TelemetryCharts({ activeZone, historicalData }: TelemetryChartsProps) {
  const [activeTab, setActiveTab] = useState<"moisture" | "temp_humidity" | "flow">("moisture");

  // Penman-Monteith Interactive Sliders state
  const [pmTemp, setPmTemp] = useState<number>(26);
  const [pmHumidity, setPmHumidity] = useState<number>(45);
  const [pmWindSpeed, setPmWindSpeed] = useState<number>(2.4);
  const [pmSolarRad, setPmSolarRad] = useState<number>(18.0);

  // Recalculate Evapotranspiration physically
  const { et0, slope, vpd } = calculatePenmanMonteith({
    temp: pmTemp,
    humidity: pmHumidity,
    windSpeed: pmWindSpeed,
    solarRadiation: pmSolarRad,
  });

  const dailyDepletionPercent = estimateSoilDepletionRate(et0, activeZone.id === "zone-4" ? 1.15 : 0.95);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Dynamic Time-series Telemetry Charts */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col h-[460px]">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-emerald-600" />
              Telemetry Trend Analysis ({activeZone.name})
            </h3>
            <p className="text-xs text-gray-500">
              Live change-detection records from zone node sensors
            </p>
          </div>

          {/* Interactive Chart Tabs */}
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 self-start sm:self-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab("moisture")}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === "moisture" ? "bg-white text-emerald-800 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Soil Moisture
            </button>
            <button
              onClick={() => setActiveTab("temp_humidity")}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === "temp_humidity" ? "bg-white text-emerald-800 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Temp & Humidity
            </button>
            <button
              onClick={() => setActiveTab("flow")}
              className={`px-3 py-1.5 rounded-md transition ${
                activeTab === "flow" ? "bg-white text-emerald-800 shadow-xs" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Flow Rate
            </button>
          </div>
        </div>

        {/* Charts Container */}
        <div className="flex-1 w-full text-xs min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "moisture" ? (
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Area
                  name="Soil Moisture %"
                  type="monotone"
                  dataKey="moisture"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMoisture)"
                />
              </AreaChart>
            ) : activeTab === "temp_humidity" ? (
              <LineChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line
                  name="Ambient Temp (°C)"
                  type="monotone"
                  dataKey="temp"
                  stroke="#f97316"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="Air Humidity (%)"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            ) : (
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Area
                  name="Water Flow Rate (L/min)"
                  type="monotone"
                  dataKey="flow"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFlow)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Evapotranspiration FAO-56 Calculator Desk */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between h-[460px]">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-emerald-600" />
                ET0 Evapotranspiration Calculator
              </h4>
              <p className="text-[11px] text-gray-500">
                Evaluating crop water loss via the Penman-Monteith physical equation
              </p>
            </div>
          </div>

          <div className="space-y-3.5 my-4">
            {/* Slide Temp */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                <span>Ambient Air Temp</span>
                <span className="font-mono font-bold text-gray-800">{pmTemp}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="1"
                value={pmTemp}
                onChange={(e) => setPmTemp(Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Slide Humidity */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                <span>Relative Air Humidity</span>
                <span className="font-mono font-bold text-gray-800">{pmHumidity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={pmHumidity}
                onChange={(e) => setPmHumidity(Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Slide Wind */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                <span>Wind Velocity (at 2m)</span>
                <span className="font-mono font-bold text-gray-800">{pmWindSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={pmWindSpeed}
                onChange={(e) => setPmWindSpeed(Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Slide Solar Radiation */}
            <div>
              <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                <span>Solar Irradiance (Rn)</span>
                <span className="font-mono font-bold text-gray-800">{pmSolarRad} MJ/m²/d</span>
              </div>
              <input
                type="range"
                min="5"
                max="32"
                step="1"
                value={pmSolarRad}
                onChange={(e) => setPmSolarRad(Number(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Calculated Results Block */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-mono block">Reference ET0</span>
              <span className="text-xl font-extrabold text-slate-800">{et0} mm/day</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-mono block">Predicted Depletion</span>
              <span className="text-xl font-extrabold text-amber-600">-{dailyDepletionPercent}% /day</span>
            </div>
            <div className="border-t border-gray-100 pt-2 col-span-2">
              <span className="text-[9px] text-gray-400 font-mono block">
                Slope: {slope} kPa/°C | VPD: {vpd} kPa
              </span>
              <span className="text-[9px] text-emerald-700 block mt-1 leading-relaxed">
                *Adjusting sliders triggers Penman-Monteith physical calculations instantly.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
