import { describe, it, expect } from 'vitest';
import {
  formatSouthAfricanPhone,
  mapGooglePlaceTypeToCategory,
  googlePlaceToMerchant,
  GoogleMapsMerchantSweeper,
} from '../src/index';

describe('Google Maps Merchant Sweeper & Ingestion Engine', () => {
  it('formats South African phone numbers to E.164 WhatsApp international format', () => {
    expect(formatSouthAfricanPhone('082 123 4567').e164).toBe('+27821234567');
    expect(formatSouthAfricanPhone('+27 11 830 1234').e164).toBe('+27118301234');
    expect(formatSouthAfricanPhone('071-234-5678').local).toBe('071 234 5678');
  });

  it('maps Google Place types to Shoppage commercial categories', () => {
    expect(mapGooglePlaceTypeToCategory(['solar_energy_equipment_supplier', 'store'])).toBe('solar_energy');
    expect(mapGooglePlaceTypeToCategory(['cell_phone_store', 'electronics_store'])).toBe('smartphones');
    expect(mapGooglePlaceTypeToCategory(['hardware_store'])).toBe('building_materials');
  });

  it('transforms raw Google Place responses into verified Merchant and TrustPassport records', () => {
    const rawPlace = {
      place_id: 'ChIJ_sandton_tech_hub_99',
      name: 'Sandton Solar Pros',
      formatted_address: '83 Rivonia Rd, Sandton, Johannesburg, 2196',
      geometry: {
        location: {
          lat: -26.1076,
          lng: 28.0567,
        },
      },
      international_phone_number: '+27 82 999 8888',
      website: 'https://sandtonsolar.co.za',
      rating: 4.8,
      user_ratings_total: 154,
      types: ['solar_energy_equipment_supplier', 'point_of_interest'],
    };

    const { merchant, passport } = googlePlaceToMerchant(rawPlace, 'mkt_sandton_city');

    expect(merchant.name).toBe('Sandton Solar Pros');
    expect(merchant.marketId).toBe('mkt_sandton_city');
    expect(merchant.category).toBe('solar_energy');
    expect(merchant.contacts.whatsapp).toBe('+27829998888');
    expect(merchant.coordinates?.lat).toBe(-26.1076);
    expect(merchant.googleRating).toBe(4.8);
    expect(passport.score).toBeGreaterThanOrEqual(85);
  });

  it('sweeps physical stores associated with flagship markets', () => {
    const dragonCityStores = GoogleMapsMerchantSweeper.sweepMarketBusinesses('mkt_dragon_city');
    expect(dragonCityStores.length).toBeGreaterThanOrEqual(1);
    expect(dragonCityStores[0].addressText).toContain('Crown Mines');

    const solarStores = GoogleMapsMerchantSweeper.searchMerchants({ category: 'solar_energy' });
    expect(solarStores.length).toBeGreaterThanOrEqual(3);
  });
});
