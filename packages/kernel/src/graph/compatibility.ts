/**
 * Typed Compatibility Graph & Constraint Evaluator
 * Powers Solar / Backup Energy, Electronics, and Hardware Compatibility Validation
 */

export interface SolarSystemSpec {
  inverterMaxPvVoltage: number;    // e.g., 500V DC
  inverterMinPvVoltage: number;    // e.g., 120V DC
  inverterBatteryVoltage: 24 | 48 | 51.2 | 'high_voltage';
  batteryNominalVoltage: 24 | 48 | 51.2 | 'high_voltage';
  panelVoc: number;                // Open-circuit voltage per panel (e.g., 49.5V)
  panelCountInSeries: number;
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  category: 'solar_energy' | 'hardware' | 'electronics' | 'general';
  checks: Array<{ rule: string; passed: boolean; message: string }>;
  safetyWarning?: string;
}

/**
 * Validates electrical compatibility between Solar PV String, Inverter, and Battery
 */
export function checkSolarCompatibility(spec: SolarSystemSpec): CompatibilityCheckResult {
  const stringVoc = spec.panelVoc * spec.panelCountInSeries;
  const checks: Array<{ rule: string; passed: boolean; message: string }> = [];

  // Rule 1: PV String Max Voltage Check (with 10% cold-weather safety margin)
  const maxTempAdjustedVoc = stringVoc * 1.1;
  const pvMaxCheck = maxTempAdjustedVoc <= spec.inverterMaxPvVoltage;
  checks.push({
    rule: 'PV String Max Voltage',
    passed: pvMaxCheck,
    message: pvMaxCheck
      ? `PV String Voc (${maxTempAdjustedVoc.toFixed(1)}V) is safely below inverter max (${spec.inverterMaxPvVoltage}V)`
      : `DANGER: PV String Voc (${maxTempAdjustedVoc.toFixed(1)}V) exceeds inverter max (${spec.inverterMaxPvVoltage}V). High risk of inverter failure.`,
  });

  // Rule 2: Inverter Startup / MPPT Min Voltage Check
  const pvMinCheck = stringVoc >= spec.inverterMinPvVoltage;
  checks.push({
    rule: 'PV String Min Operating Voltage',
    passed: pvMinCheck,
    message: pvMinCheck
      ? `PV String Voc (${stringVoc.toFixed(1)}V) meets min operating threshold (${spec.inverterMinPvVoltage}V)`
      : `PV String Voc (${stringVoc.toFixed(1)}V) is below inverter startup voltage (${spec.inverterMinPvVoltage}V)`,
  });

  // Rule 3: Battery Bus Voltage Matching
  const batteryMatch = spec.inverterBatteryVoltage === spec.batteryNominalVoltage;
  checks.push({
    rule: 'Battery DC Bus Voltage Match',
    passed: batteryMatch,
    message: batteryMatch
      ? `Battery nominal voltage (${spec.batteryNominalVoltage}V) matches inverter DC bus (${spec.inverterBatteryVoltage}V)`
      : `MISMATCH: Inverter requires ${spec.inverterBatteryVoltage}V battery, but connected battery is ${spec.batteryNominalVoltage}V`,
  });

  const allPassed = checks.every((c) => c.passed);

  return {
    isCompatible: allPassed,
    category: 'solar_energy',
    checks,
    safetyWarning: allPassed
      ? undefined
      : 'System configuration has critical electrical incompatibilities. Review DC voltage ratings before installation.',
  };
}
