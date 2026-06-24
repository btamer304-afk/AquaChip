/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "SuperAdmin" | "Agronomist" | "Operator";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  tier: "Standard" | "Premium" | "Enterprise";
}

export interface Zone {
  id: string;
  name: string;
  cropType: string;
  soilType: string;
  targetMoistureMin: number; // e.g. 35%
  targetMoistureMax: number; // e.g. 60%
  areaAcres: number;
}

export interface Device {
  id: string;
  hardwareUid: string;
  zoneId: string;
  deviceType: "Gateway" | "Node" | "PumpController";
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE";
  firmwareVersion: string;
  lastSeen: string;
}

export interface TelemetryReading {
  timestamp: string;
  soilMoisture: number; // %
  ambientTemp: number; // °C
  humidity: number; // %
  flowRate: number; // L/min
  tankLevel: number; // %
  gasPpm: number; // ppm (Methane/gas detection)
}

export interface ActuatorLog {
  id: string;
  timestamp: string;
  deviceId: string;
  zoneName: string;
  state: "ON" | "OFF";
  triggerSource: "Manual" | "AI" | "Rule";
  operatorName?: string;
}

export interface TelemetryDataPoint {
  time: string;
  moisture: number;
  temp: number;
  humidity: number;
  flow: number;
  gas: number;
}

export interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  action?: {
    type: "irrigate";
    zoneId: string;
    zoneName: string;
    durationMinutes: number;
    approved: boolean;
  };
}
