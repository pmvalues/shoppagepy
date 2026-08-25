import { describe, it, expect } from 'vitest';
import { checkSolarCompatibility } from '../src/graph/compatibility.js';

describe('Typed Compatibility Engine', () => {
  it('validates a safely configured solar PV and inverter setup', () => {
    const res = checkSolarCompatibility({
      inverterMaxPvVoltage: 500,
      inverterMinPvVoltage: 120,
      inverterBatteryVoltage: 48,
      batteryNominalVoltage: 48,
      panelVoc: 49.5,
      panelCountInSeries: 8, // 8 * 49.5V = 396V (with 1.1x = 435.6V <= 500V)
    });

    expect(res.isCompatible).toBe(true);
    expect(res.safetyWarning).toBeUndefined();
  });

  it('fails with safety warning when PV string over-voltages the inverter', () => {
    const res = checkSolarCompatibility({
      inverterMaxPvVoltage: 500,
      inverterMinPvVoltage: 120,
      inverterBatteryVoltage: 48,
      batteryNominalVoltage: 48,
      panelVoc: 49.5,
      panelCountInSeries: 12, // 12 * 49.5V = 594V (> 500V)
    });

    expect(res.isCompatible).toBe(false);
    expect(res.safetyWarning).toContain('critical electrical incompatibilities');
  });

  it('fails when battery nominal voltage does not match inverter DC bus', () => {
    const res = checkSolarCompatibility({
      inverterMaxPvVoltage: 500,
      inverterMinPvVoltage: 120,
      inverterBatteryVoltage: 48,
      batteryNominalVoltage: 24, // Mismatch
      panelVoc: 49.5,
      panelCountInSeries: 6,
    });

    expect(res.isCompatible).toBe(false);
    expect(res.checks.some((c) => !c.passed && c.rule === 'Battery DC Bus Voltage Match')).toBe(true);
  });
});
