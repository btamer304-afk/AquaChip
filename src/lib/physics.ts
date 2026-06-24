/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Simplified FAO-56 Penman-Monteith reference evapotranspiration (ET0) calculation
 * for a daily step, based on standard parameters.
 * 
 * Formula:
 * ET0 = (0.408 * Delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * (es - ea)) / (Delta + gamma * (1 + 0.34 * u2))
 * 
 * Where:
 * - Rn: Net radiation at the crop surface [MJ/m^2/day]
 * - G: Soil heat flux density [MJ/m^2/day] (usually close to 0 for daily intervals)
 * - T: Mean daily air temperature at 2 m height [°C]
 * - u2: Wind speed at 2 m height [m/s]
 * - es: Saturation vapor pressure [kPa]
 * - ea: Actual vapor pressure [kPa]
 * - es - ea: Vapor pressure deficit [kPa]
 * - Delta: Slope of vapor pressure curve [kPa/°C]
 * - gamma: Psychrometric constant [kPa/°C]
 */
export function calculatePenmanMonteith({
  temp,
  humidity,
  windSpeed = 2.0, // m/s default
  solarRadiation = 15.0, // MJ/m^2/day standard clear day
}: {
  temp: number;
  humidity: number;
  windSpeed?: number;
  solarRadiation?: number;
}): {
  et0: number; // mm/day
  slope: number;
  vpd: number;
} {
  // 1. Slope of vapor pressure curve (Delta)
  const slope = (4098 * (0.6108 * Math.exp((17.27 * temp) / (temp + 237.3)))) / Math.pow(temp + 237.3, 2);

  // 2. Psychrometric constant (gamma) at sea level (approx 0.067 kPa/°C)
  const gamma = 0.0673;

  // 3. Saturation vapor pressure (es)
  const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));

  // 4. Actual vapor pressure (ea)
  const ea = es * (humidity / 100);

  // 5. Vapor pressure deficit (VPD)
  const vpd = Math.max(0, es - ea);

  // G is soil heat flux density, taken as 0 for daily steps
  const G = 0;

  // 6. Penman-Monteith equation
  const numerator = 0.408 * slope * (solarRadiation - G) + gamma * (900 / (temp + 273)) * windSpeed * vpd;
  const denominator = slope + gamma * (1 + 0.34 * windSpeed);

  const et0 = Math.max(0.1, numerator / denominator);

  return {
    et0: parseFloat(et0.toFixed(2)),
    slope: parseFloat(slope.toFixed(4)),
    vpd: parseFloat(vpd.toFixed(3)),
  };
}

/**
 * Estimates soil moisture depletion rate and suggests next watering timestamp.
 * Returns estimated soil moisture drop per day in percentage points.
 */
export function estimateSoilDepletionRate(et0: number, cropFactorKc: number = 1.0): number {
  // standard crop water usage: mm/day of water loss
  const dailyWaterLossMm = et0 * cropFactorKc;
  
  // Convert mm/day of evapotranspiration to soil moisture percent drop.
  // Assuming a standard soil root zone with 100mm water capacity, 
  // 1 mm of evapotranspiration drops soil moisture by approx 1 percentage point.
  const soilMoisturePercentDrop = dailyWaterLossMm * 1.25; 
  return parseFloat(soilMoisturePercentDrop.toFixed(2));
}
