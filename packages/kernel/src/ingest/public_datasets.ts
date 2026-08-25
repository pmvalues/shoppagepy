import { Merchant, TrustPassport } from '@shoppage/contracts';

/**
 * Public Merchant & Enterprise Databases Catalog for South Africa
 */
export interface PublicMerchantSource {
  id: string;
  name: string;
  sourceAuthority: string;
  licenseType: 'OPEN_GOVERNMENT_DATA' | 'ODBL_OPEN_STREET_MAP' | 'CDLA_PERMISSIVE_OVERTURE' | 'PUBLIC_RECORD';
  recordCountEstimate: string;
  dataFields: string[];
  coverage: string;
  categories: string[];
  integrationMethod: 'rest_api' | 'parquet_bulk_stream' | 'csv_dump' | 'sqlite_mirror';
  downloadUrl?: string;
  description: string;
}

export const PUBLIC_MERCHANT_SOURCES: PublicMerchantSource[] = [
  {
    id: 'src_overture_places_za',
    name: 'Overture Maps Foundation (Open Places POI Dataset)',
    sourceAuthority: 'Linux Foundation / Meta / Amazon / Microsoft / TomTom',
    licenseType: 'CDLA_PERMISSIVE_OVERTURE',
    recordCountEstimate: '1,200,000+ South African POIs (60M+ Global)',
    dataFields: ['GERS Place ID', 'Business Name', 'Exact GPS Coordinates', 'Address / Suburb / Postcode', 'Phone Number', 'Open Categories', 'Confidence Score', 'Brand Wiki ID'],
    coverage: 'Nationwide (All 9 Provinces, Malls, Suburbs, Rural Nodes)',
    categories: ['solar_energy', 'smartphones', 'building_materials', 'supermarket', 'wholesale_trade', 'automotive', 'pharmacy', 'spaza'],
    integrationMethod: 'parquet_bulk_stream',
    downloadUrl: 'https://overturemaps.org/download/',
    description: 'High-precision open places dataset created by the Linux Foundation. Free commercial use with global entity resolution IDs (GERS).',
  },
  {
    id: 'src_cipc_public_registry',
    name: 'CIPC (Companies and Intellectual Property Commission) Public Register',
    sourceAuthority: 'Department of Trade, Industry and Competition (dtic) South Africa',
    licenseType: 'PUBLIC_RECORD',
    recordCountEstimate: '2,500,000+ Registered South African Enterprises',
    dataFields: ['CIPC Enterprise Number (e.g. 2018/123456/07)', 'Registered Legal Name', 'Trading Name', 'Registration Date', 'Registered Physical Address', 'SIC Economic Activity Code', 'Director Count', 'Compliance Status'],
    coverage: 'Nationwide (Formal Companies, Close Corporations, Co-operatives)',
    categories: ['all_registered_enterprises', 'wholesale_importers', 'manufacturers', 'contractors'],
    integrationMethod: 'csv_dump',
    downloadUrl: 'https://eservices.cipc.co.za/',
    description: 'Official statutory business registry of South Africa. Provides legal entity validation and enterprise numbers.',
  },
  {
    id: 'src_national_treasury_csd',
    name: 'National Treasury Central Supplier Database (CSD)',
    sourceAuthority: 'National Treasury of South Africa',
    licenseType: 'OPEN_GOVERNMENT_DATA',
    recordCountEstimate: '850,000+ Verified Commercial Suppliers',
    dataFields: ['CSD Supplier Number (MAAA...)', 'Business Name', 'Commodity Code (UNSPSC)', 'Tax Compliance Pin', 'Municipal District / Province', 'Bank Verification State', 'B-BBEE Level', 'Direct Contacts'],
    coverage: 'Nationwide (Goods, Works and Services Suppliers across SA)',
    categories: ['building_materials', 'solar_energy', 'agricultural', 'fmcg_wholesale', 'logistics'],
    integrationMethod: 'rest_api',
    downloadUrl: 'https://secure.csd.gov.za/',
    description: 'Central government supplier register with high-integrity tax and commercial verification.',
  },
  {
    id: 'src_cidb_contractors',
    name: 'CIDB (Construction Industry Development Board) Contractor Register',
    sourceAuthority: 'CIDB South Africa',
    licenseType: 'PUBLIC_RECORD',
    recordCountEstimate: '150,000+ Registered Building & Electrical Contractors',
    dataFields: ['CIDB Reg Number', 'Contractor Name', 'Class of Works (General Building, Electrical, Civil)', 'Grade Level (1 to 9)', 'Provincial Office', 'Contact Person & Phone'],
    coverage: 'Nationwide',
    categories: ['building_materials', 'electrical_contractors', 'solar_installations', 'plumbing'],
    integrationMethod: 'sqlite_mirror',
    downloadUrl: 'https://www.cidb.org.za/contractors/registers/register-of-contractors/',
    description: 'Accredited registry of physical building and infrastructure contractors in South Africa.',
  },
  {
    id: 'src_ecasa_electrical_solar',
    name: 'ECA(SA) & DoEL Registered Electrical / Solar Contractors',
    sourceAuthority: 'Electrical Contractors Association of South Africa & Dept of Employment and Labour',
    licenseType: 'PUBLIC_RECORD',
    recordCountEstimate: '25,000+ Licensed Wiremen & CoC Solar Installers',
    dataFields: ['Wireman License Number', 'Registered Trade Name', 'DoEL Accreditation', 'Physical Workshop Address', 'Telephone / Mobile', 'SANS 10142-1 Inspection Scope'],
    coverage: 'Nationwide (All Electrical Zones)',
    categories: ['solar_energy', 'electrical_supplies', 'inverter_installations'],
    integrationMethod: 'csv_dump',
    downloadUrl: 'https://ecasa.co.za/find-an-electrical-contractor/',
    description: 'Accredited contractors authorized to issue South African Certificates of Compliance (CoC) for solar & inverters.',
  },
  {
    id: 'src_sapc_pharmacy_register',
    name: 'South African Pharmacy Council (SAPC) Community Pharmacies',
    sourceAuthority: 'South African Pharmacy Council',
    licenseType: 'PUBLIC_RECORD',
    recordCountEstimate: '4,500+ Community Pharmacies & Dispensaries',
    dataFields: ['Y-Pharmacy License Number', 'Pharmacy Trade Name', 'Responsible Pharmacist', 'Street Address', 'Postal Code', 'Contact Telephone'],
    coverage: 'Nationwide (Malls, Hospitals, High Streets, Townships)',
    categories: ['pharmacy', 'health_wellness', 'otc_supplies'],
    integrationMethod: 'rest_api',
    downloadUrl: 'https://www.pharmcouncil.co.za/Find_APharmacy',
    description: 'Licensed retail pharmacies and health suppliers in South Africa.',
  },
  {
    id: 'src_osm_planet_za',
    name: 'OpenStreetMap (OSM) Southern Africa Commercial Nodes',
    sourceAuthority: 'OpenStreetMap Foundation & Humanitarian OSM Team',
    licenseType: 'ODBL_OPEN_STREET_MAP',
    recordCountEstimate: '450,000+ Retail, Spaza & Commercial Nodes in ZA',
    dataFields: ['OSM Node ID', 'Shop Type (convenience, supermarket, hardware, electronics, spaza)', 'Name', 'Street / House Number', 'Opening Hours', 'Phone / WhatsApp Tag', 'Operator'],
    coverage: 'Hyperlocal (Including Informal Townships, Taxi Ranks, Rural Trading Posts)',
    categories: ['spaza', 'supermarket', 'hardware', 'smartphones', 'general_merchandise'],
    integrationMethod: 'rest_api',
    downloadUrl: 'https://download.geofabrik.de/africa/south-africa.html',
    description: 'Crowdsourced open map data with high-density informal spaza and street vendor mapping.',
  },
];

/**
 * Public Data Ingestion Helper
 */
export class PublicMerchantDatasetManager {
  public static listAvailableSources(): PublicMerchantSource[] {
    return PUBLIC_MERCHANT_SOURCES;
  }

  public static getSourceById(id: string): PublicMerchantSource | undefined {
    return PUBLIC_MERCHANT_SOURCES.find((s) => s.id === id);
  }

  public static getTotalEstimatedMerchantRecords(): number {
    return 5179500; // ~5.1M combined records across all public registries
  }
}
