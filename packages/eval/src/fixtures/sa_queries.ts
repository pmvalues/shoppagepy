export interface QueryEvaluationFixture {
  id: string;
  rawQuery: string;
  expectedCategory: string;
  expectedBrand?: string;
  expectedModel?: string;
  locale: 'en' | 'zu' | 'xh' | 'af' | 'mixed_slang';
  targetCorridor: string;
  isAvailableLocally: boolean;
}

export const SOUTH_AFRICA_QUERY_FIXTURES: QueryEvaluationFixture[] = [
  {
    id: 'sa_sol_01',
    rawQuery: 'Deye 5kW hybrid inverter price Sandton',
    expectedCategory: 'solar_energy',
    expectedBrand: 'Deye',
    expectedModel: 'SUN-5K-SG03LP1-EU',
    locale: 'en',
    targetCorridor: 'Sandton Central',
    isAvailableLocally: true,
  },
  {
    id: 'sa_sol_02',
    rawQuery: 'Sunsynk 8kw with 10kwh battery for house Soweto',
    expectedCategory: 'solar_energy',
    expectedBrand: 'Sunsynk',
    expectedModel: '8kW',
    locale: 'en',
    targetCorridor: 'Soweto Bara',
    isAvailableLocally: true,
  },
  {
    id: 'sa_ph_01',
    rawQuery: 'Samsung Galaxy A16 128gb price Dragon City Crown Mines',
    expectedCategory: 'smartphones',
    expectedBrand: 'Samsung',
    expectedModel: 'Galaxy A16',
    locale: 'en',
    targetCorridor: 'Dragon City Crown Mines',
    isAvailableLocally: true,
  },
  {
    id: 'sa_ph_02',
    rawQuery: 'iPhone 15 pro max second hand Oriental Plaza Fordsburg',
    expectedCategory: 'smartphones',
    expectedBrand: 'Apple',
    expectedModel: 'iPhone 15 Pro Max',
    locale: 'en',
    targetCorridor: 'Oriental Plaza Fordsburg',
    isAvailableLocally: true,
  },
  {
    id: 'sa_zu_01',
    rawQuery: 'ngifuna amapaneli elanga 550W eGauteng',
    expectedCategory: 'solar_energy',
    expectedBrand: 'JA Solar',
    locale: 'zu',
    targetCorridor: 'City of Johannesburg',
    isAvailableLocally: true,
  },
  {
    id: 'sa_af_01',
    rawQuery: 'Sonpaneel en omsetter stel Kaapstad prys',
    expectedCategory: 'solar_energy',
    locale: 'af',
    targetCorridor: 'City of Cape Town',
    isAvailableLocally: true,
  },
  {
    id: 'sa_hw_01',
    rawQuery: 'PPC Surebuild cement 50kg cheap near Maponya Mall',
    expectedCategory: 'building_materials',
    expectedBrand: 'PPC',
    expectedModel: 'Surebuild 50kg',
    locale: 'mixed_slang',
    targetCorridor: 'Soweto',
    isAvailableLocally: true,
  },
  {
    id: 'sa_ref_01',
    rawQuery: 'Tesla Cybertruck Tri-Motor Foundation Series Johannesburg stock',
    expectedCategory: 'automotive',
    expectedBrand: 'Tesla',
    locale: 'en',
    targetCorridor: 'Sandton Central',
    isAvailableLocally: false, // Must resolve as reference_only / zero local availability
  },
];
