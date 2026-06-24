/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Cpu, ShieldCheck, RefreshCw, KeyRound, Radio, Users } from "lucide-react";
import { Device, UserRole, Organization } from "../types";

interface SettingsPanelProps {
  devices: Device[];
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  organization: Organization;
  onTierChange: (tier: "Standard" | "Premium" | "Enterprise") => void;
  safetyInterlocks: {
    dryRunProtection: boolean;
    offlineMode: boolean;
  };
  onToggleSafety: (type: "dryRunProtection" | "offlineMode") => void;
}

export default function SettingsPanel({
  devices,
  userRole,
  onRoleChange,
  organization,
  onTierChange,
  safetyInterlocks,
  onToggleSafety,
}: SettingsPanelProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const simulateOtaUpdate = (deviceId: string) => {
    setUpdatingId(deviceId);
    setTimeout(() => {
      setUpdatingId(null);
      alert(`Firmware OTA Update pushed successfully to device ${deviceId}. ESP32 reboot complete.`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization & Multi-Tenant RBAC Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
              Tenant & RBAC Matrix
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Configure active subscription tier and switch user permission roles dynamically
            </p>

            <div className="space-y-4">
              {/* Org Select */}
              <div>
                <label className="text-[10px] uppercase font-mono text-gray-500 block mb-1.5 font-semibold">
                  Organization Subscription Profile
                </label>
                <div className="flex gap-2">
                  {(["Standard", "Premium", "Enterprise"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => onTierChange(t)}
                      className={`flex-1 text-xs py-2 rounded-xl font-medium border transition ${
                        organization.tier === t
                          ? "bg-slate-950 border-slate-950 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* RBAC Select */}
              <div>
                <label className="text-[10px] uppercase font-mono text-gray-500 block mb-1.5 font-semibold">
                  Active Operator Role
                </label>
                <div className="flex gap-2">
                  {(["Operator", "Agronomist", "SuperAdmin"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => onRoleChange(r)}
                      className={`flex-1 text-xs py-2 rounded-xl font-medium border transition ${
                        userRole === r
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic font-mono leading-relaxed">
                  *Note: Operators have read-only views. Only Agronomists and SuperAdmins can manual override pump relays.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-4 flex justify-between items-center text-[10px] font-mono text-gray-400">
            <span>Org ID: {organization.id}</span>
            <span>API Status: Secure Handshake Active</span>
          </div>
        </div>

        {/* Edge Safety Controls */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
              Edge Safety Interlocks
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Manage automatic physical cut-off scripts deployed locally on ESP32 microcontrollers
            </p>

            <div className="space-y-4">
              {/* Toggle 1: Dry-Run */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">Dry-Run Protection</span>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                    Trigger pump emergency auto-shutdown if flow registers at 0 L/min during a water cycle.
                  </p>
                </div>
                <button
                  onClick={() => onToggleSafety("dryRunProtection")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    safetyInterlocks.dryRunProtection ? "bg-emerald-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      safetyInterlocks.dryRunProtection ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Offline */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div>
                  <span className="text-xs font-bold text-gray-900 block leading-tight">EEPROM Offline Schedule</span>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                    Allow controllers to revert to hardcoded offline schedules if AWS IoT MQTT handshake drops.
                  </p>
                </div>
                <button
                  onClick={() => onToggleSafety("offlineMode")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    safetyInterlocks.offlineMode ? "bg-emerald-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      safetyInterlocks.offlineMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>Edge Engine: v2.14-FreeRTOS</span>
            <span className="text-emerald-600 font-bold">SHA-256 Verified</span>
          </div>
        </div>
      </div>

      {/* IoT Asset Registry table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-emerald-600" />
              Active IoT Asset Registry
            </h3>
            <p className="text-xs text-gray-500">
              Listing all hardware nodes synced with AWS IoT Core and Supabase Edge Tables
            </p>
          </div>
        </div>

        <div className="overflow-x-auto text-xs border border-gray-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 font-mono uppercase tracking-wider">
                <th className="p-3.5">Device ID</th>
                <th className="p-3.5">Hardware UID</th>
                <th className="p-3.5">Zone Assignment</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Health Status</th>
                <th className="p-3.5">Firmware</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-semibold text-gray-900">{device.id}</td>
                  <td className="p-3.5 font-mono">{device.hardwareUid}</td>
                  <td className="p-3.5 uppercase text-gray-600 font-medium">
                    {device.zoneId.replace("-", " ")}
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-xs font-semibold uppercase">
                      {device.deviceType}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        device.status === "ONLINE"
                          ? "bg-emerald-50 text-emerald-700"
                          : device.status === "MAINTENANCE"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${device.status === "ONLINE" ? "bg-emerald-500" : device.status === "MAINTENANCE" ? "bg-amber-400" : "bg-red-500"}`} />
                      {device.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono">{device.firmwareVersion}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => simulateOtaUpdate(device.id)}
                      disabled={updatingId === device.id}
                      className="inline-flex items-center gap-1 border border-gray-200 hover:border-gray-900 hover:bg-slate-900 hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-gray-700 font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition"
                    >
                      <RefreshCw className={`h-3 w-3 ${updatingId === device.id && "animate-spin"}`} />
                      OTA Flash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
