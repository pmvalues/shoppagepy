from django.core.management.base import BaseCommand
from apps.markets.models import Market, MarketTypeChoices, MarketVerificationChoices
from apps.merchants.models import Merchant, TrustPassport, ClaimStateChoices, VerificationStateChoices, Draft, AgentRun, DraftTypeChoices, ReviewStateChoices
from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.offers.models import Offer, DiscoveredOffer, DestinationTypeChoices, AvailabilityStateChoices, SlaClassChoices
from apps.rights.models import RightsSource, RightsClassChoices, RightsStatusChoices
from apps.evidence.models import EvidenceArtifact, EvidenceClaim, SourceTypeChoices as EvidenceSourceTypeChoices, ClaimTypeChoices as EvidenceClaimTypeChoices, ClaimStateChoices as EvidenceClaimStateChoices
from apps.media_hub.models import Show, Short, ShowCategoryChoices, ShowStatusChoices, ModerationStateChoices

SAMPLE_VIDEOS = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/'

class Command(BaseCommand):
    help = 'Seeds all flagship South African markets, canonical products, verified merchants, live offers, and Wagtail CMS pages'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("==> Seeding South Africa Flagship Commerce Grid..."))

        # 1. Flagship Markets (All 9 Provinces)
        markets_data = [
            {
                'canonical_slug': 'sandton-city-johannesburg',
                'name': 'Sandton City & Nelson Mandela Square',
                'market_type': MarketTypeChoices.FORMAL_MEGA_MALL,
                'province': 'Gauteng',
                'metro': 'City of Johannesburg',
                'street_address': '83 Rivonia Rd, Sandhurst, Sandton, 2196',
                'latitude': -26.1076,
                'longitude': 28.0567,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'landmarks': ['Gautrain Sandton Station', 'Nelson Mandela Square', 'Sandton Convention Centre'],
                'safety_notices': ['Secure covered parking', '24/7 security control room'],
                'stall_capacity': 300,
            },
            {
                'canonical_slug': 'mall-of-africa-midrand',
                'name': 'Mall of Africa (Waterfall City)',
                'market_type': MarketTypeChoices.FORMAL_MEGA_MALL,
                'province': 'Gauteng',
                'metro': 'City of Johannesburg',
                'street_address': 'Lone Creek Cres, Waterfall City, Midrand, 1686',
                'latitude': -26.0152,
                'longitude': 28.1068,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'landmarks': ['Waterfall City Park', 'Allandale Interchange'],
                'stall_capacity': 320,
            },
            {
                'canonical_slug': 'dragon-city-crown-mines',
                'name': 'Dragon City Wholesale Mall',
                'market_type': MarketTypeChoices.WHOLESALE_MARKET,
                'province': 'Gauteng',
                'metro': 'City of Johannesburg',
                'street_address': 'Crown Mines Commercial Precinct, Main Reef Rd, Johannesburg',
                'latitude': -26.2155,
                'longitude': 28.0125,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'landmarks': ['Crown Mines Importer Precinct', 'Building 2 Solar Alleys'],
                'stall_capacity': 450,
            },
            {
                'canonical_slug': 'oriental-plaza-fordsburg',
                'name': 'Oriental Plaza Fordsburg',
                'market_type': MarketTypeChoices.WHOLESALE_MARKET,
                'province': 'Gauteng',
                'metro': 'City of Johannesburg',
                'street_address': 'Bree St & Lilian Ngoyi St, Fordsburg, Johannesburg',
                'latitude': -26.2045,
                'longitude': 28.0289,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'landmarks': ['Grand Bazaar', 'Bree Street West'],
                'stall_capacity': 360,
            },
            {
                'canonical_slug': 'bara-taxi-rank-soweto',
                'name': 'Chris Hani Baragwanath Transport & Commercial Hub',
                'market_type': MarketTypeChoices.INFORMAL_TRANSPORT_RANK,
                'province': 'Gauteng',
                'metro': 'City of Johannesburg',
                'street_address': 'Old Potch Rd, Diepkloof Zone 6, Soweto',
                'latitude': -26.2604,
                'longitude': 27.9428,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'landmarks': ['Bara Hospital', 'Taxi Deck Concourse'],
                'stall_capacity': 280,
            },
            {
                'canonical_slug': 'gateway-theatre-of-shopping-durban',
                'name': 'Gateway Theatre of Shopping (Umhlanga)',
                'market_type': MarketTypeChoices.FORMAL_MEGA_MALL,
                'province': 'KwaZulu-Natal',
                'metro': 'eThekwini',
                'street_address': '1 Palm Blvd, Umhlanga Ridge, Umhlanga, 4319',
                'latitude': -29.7258,
                'longitude': 31.0664,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'landmarks': ['Palm Boulevard', 'Wavehouse Umhlanga'],
                'stall_capacity': 390,
            },
            {
                'canonical_slug': 'va-waterfront-cape-town',
                'name': 'V&A Waterfront',
                'market_type': MarketTypeChoices.FORMAL_MEGA_MALL,
                'province': 'Western Cape',
                'metro': 'City of Cape Town',
                'street_address': '19 Dock Rd, Cape Town, 8001',
                'latitude': -33.9036,
                'longitude': 18.4205,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'landmarks': ['Cape Town Harbour', 'Zeitz MOCAA'],
                'stall_capacity': 450,
            },
            {
                'canonical_slug': 'canal-walk-cape-town',
                'name': 'Canal Walk Shopping Centre',
                'market_type': MarketTypeChoices.FORMAL_MEGA_MALL,
                'province': 'Western Cape',
                'metro': 'City of Cape Town',
                'street_address': 'Century Blvd, Century City, Cape Town',
                'latitude': -33.8927,
                'longitude': 18.5126,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 400,
            },
            {
                'canonical_slug': 'menlyn-park-pretoria',
                'name': 'Menlyn Park Shopping Centre',
                'market_type': MarketTypeChoices.FORMAL_MEGA_MALL,
                'province': 'Gauteng',
                'metro': 'City of Tshwane',
                'street_address': 'Atterbury Rd & Lois Ave, Menlyn, Pretoria',
                'latitude': -25.7828,
                'longitude': 28.2754,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 500,
            },
            {
                'canonical_slug': 'walmer-park-gqeberha',
                'name': 'Walmer Park Shopping Centre',
                'market_type': MarketTypeChoices.SHOPPING_CENTRE,
                'province': 'Eastern Cape',
                'metro': 'Nelson Mandela Bay',
                'street_address': 'Main Rd, Walmer, Gqeberha, 6070',
                'latitude': -33.9812,
                'longitude': 25.5789,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 150,
            },
            {
                'canonical_slug': 'ilanga-mall-mbombela',
                'name': 'Ilanga Mall Nelspruit',
                'market_type': MarketTypeChoices.SHOPPING_CENTRE,
                'province': 'Mpumalanga',
                'metro': 'City of Mbombela',
                'street_address': 'Bitterbessie St, West Acres, Mbombela',
                'latitude': -25.4744,
                'longitude': 30.9572,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 160,
            },
            {
                'canonical_slug': 'mall-of-the-north-polokwane',
                'name': 'Mall of the North Polokwane',
                'market_type': MarketTypeChoices.FORMAL_MEGA_MALL,
                'province': 'Limpopo',
                'metro': 'Polokwane',
                'street_address': 'R81 & N1 Interchange, Polokwane',
                'latitude': -23.8821,
                'longitude': 29.5083,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 180,
            },
            {
                'canonical_slug': 'mimosa-mall-bloemfontein',
                'name': 'Mimosa Mall Bloemfontein',
                'market_type': MarketTypeChoices.SHOPPING_CENTRE,
                'province': 'Free State',
                'metro': 'Mangaung',
                'street_address': 'Kellner St, Brandwag, Bloemfontein',
                'latitude': -29.1102,
                'longitude': 26.2014,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 120,
            },
            {
                'canonical_slug': 'matlosana-mall-klerksdorp',
                'name': 'Matlosana Mall Klerksdorp',
                'market_type': MarketTypeChoices.SHOPPING_CENTRE,
                'province': 'North West',
                'metro': 'City of Matlosana',
                'street_address': 'N12 & Joe Slovo Rd, Klerksdorp',
                'latitude': -26.8523,
                'longitude': 26.6891,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 140,
            },
            {
                'canonical_slug': 'diamond-pavilion-kimberley',
                'name': 'Diamond Pavilion Mall Kimberley',
                'market_type': MarketTypeChoices.SHOPPING_CENTRE,
                'province': 'Northern Cape',
                'metro': 'Sol Plaatje',
                'street_address': 'Oliver Rd & Mac Dougall St, Kimberley',
                'latitude': -28.7612,
                'longitude': 24.7734,
                'verification_state': MarketVerificationChoices.EVIDENCE_VERIFIED,
                'stall_capacity': 110,
            },
        ]

        market_objs = {}
        for mdata in markets_data:
            slug = mdata.pop('canonical_slug')
            m_obj, _ = Market.objects.update_or_create(
                canonical_slug=slug,
                defaults=mdata
            )
            market_objs[slug] = m_obj
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(market_objs)} Flagship Malls & Markets"))

        # 2. Flagship Verified Merchants
        merchants_data = [
            {
                'canonical_id': 'm_solar_bros',
                'name': 'SolarBros Sandton & Crown Mines',
                'country': 'ZA',
                'claim_state': ClaimStateChoices.CLAIMED,
                'verification_state': VerificationStateChoices.FULLY_VERIFIED,
                'whatsapp_number': '27712345678',
                'telephone': '+27 11 883 4567',
                'email': 'quotes@solarbros.co.za',
                'website_url': 'https://solarbros.co.za',
                'market': market_objs.get('sandton-city-johannesburg'),
                'stall_identifier': 'Nelson Mandela Square Upper Concourse B-12',
                'category': 'solar_energy',
                'address_text': 'Sandton City & Nelson Mandela Square, 83 Rivonia Rd, Sandton',
                'province': 'Gauteng',
                'google_rating': 4.9,
                'google_reviews_count': 148,
                'cipc_enterprise_number': 'K2020/489123/07',
                'bbbee_level': 'Level 1 Contributor (135% Procurement Recognition)',
                'tax_compliance_pin': 'SARS-9821-4412',
                'cidb_grade': 'Grade 5EP / 5GB',
                'trust_score': 96,
                'years_in_business': 8,
                'median_response_minutes': 4,
            },
            {
                'canonical_id': 'm_sunpower_crown',
                'name': 'SunPower Solutions Crown Mines',
                'country': 'ZA',
                'claim_state': ClaimStateChoices.CLAIMED,
                'verification_state': VerificationStateChoices.FULLY_VERIFIED,
                'whatsapp_number': '27829876543',
                'telephone': '+27 11 830 9988',
                'email': 'sales@sunpowerza.com',
                'market': market_objs.get('dragon-city-crown-mines'),
                'stall_identifier': 'Building 2, Wholesale Aisle Shop 18',
                'category': 'solar_energy',
                'address_text': 'Dragon City Wholesale Mall, Main Reef Rd, Crown Mines, JHB',
                'province': 'Gauteng',
                'google_rating': 4.8,
                'google_reviews_count': 92,
                'cipc_enterprise_number': 'K2018/112233/07',
                'bbbee_level': 'Level 2 Contributor (125% Procurement Recognition)',
                'tax_compliance_pin': 'SARS-3321-8890',
                'trust_score': 92,
                'years_in_business': 7,
                'median_response_minutes': 6,
            },
            {
                'canonical_id': 'm_techhub_plaza',
                'name': 'TechHub Oriental Plaza',
                'country': 'ZA',
                'claim_state': ClaimStateChoices.CLAIMED,
                'verification_state': VerificationStateChoices.FULLY_VERIFIED,
                'whatsapp_number': '27831234567',
                'telephone': '+27 11 838 5544',
                'email': 'oriental@techhub.co.za',
                'market': market_objs.get('oriental-plaza-fordsburg'),
                'stall_identifier': 'Grand Bazaar Shop C-44',
                'category': 'smartphones',
                'address_text': 'Oriental Plaza Grand Bazaar, Fordsburg, Johannesburg',
                'province': 'Gauteng',
                'google_rating': 4.7,
                'google_reviews_count': 210,
                'trust_score': 90,
                'years_in_business': 12,
                'median_response_minutes': 5,
            },
            {
                'canonical_id': 'm_buildmart_centurion',
                'name': 'BuildMart Hardware Centurion',
                'country': 'ZA',
                'claim_state': ClaimStateChoices.CLAIMED,
                'verification_state': VerificationStateChoices.FULLY_VERIFIED,
                'whatsapp_number': '27128451234',
                'telephone': '+27 12 845 1234',
                'email': 'orders@buildmart.co.za',
                'market': market_objs.get('menlyn-park-pretoria'),
                'stall_identifier': 'Trade Yard 4',
                'category': 'hardware',
                'address_text': 'Centurion Commercial Trade Park, Gauteng',
                'province': 'Gauteng',
                'google_rating': 4.6,
                'google_reviews_count': 74,
                'trust_score': 88,
                'years_in_business': 15,
                'median_response_minutes': 8,
            },
            {
                'canonical_id': 'm_cape_solar',
                'name': 'Cape Solar & Clean Energy Direct',
                'country': 'ZA',
                'claim_state': ClaimStateChoices.CLAIMED,
                'verification_state': VerificationStateChoices.FULLY_VERIFIED,
                'whatsapp_number': '27845556677',
                'telephone': '+27 21 418 2233',
                'email': 'info@capesolar.co.za',
                'market': market_objs.get('va-waterfront-cape-town'),
                'stall_identifier': 'Clock Tower Suite 201',
                'category': 'solar_energy',
                'address_text': 'V&A Waterfront Clock Tower Precinct, Cape Town',
                'province': 'Western Cape',
                'google_rating': 4.9,
                'google_reviews_count': 118,
                'trust_score': 95,
                'years_in_business': 9,
                'median_response_minutes': 5,
            },
        ]

        merchant_objs = {}
        for mdata in merchants_data:
            c_id = mdata.pop('canonical_id')
            m_obj, _ = Merchant.objects.update_or_create(
                canonical_id=c_id,
                defaults=mdata
            )
            merchant_objs[c_id] = m_obj
            # Create trust passport
            TrustPassport.objects.update_or_create(
                merchant=m_obj,
                defaults={
                    'score': m_obj.trust_score,
                    'fresh_offers_today_count': 4,
                    'median_response_minutes': m_obj.median_response_minutes,
                    'state': 'VERIFIED_ACTIVE',
                }
            )
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(merchant_objs)} Verified Merchants & Trust Passports"))

        # 3. Canonical Master Products
        products_data = [
            {
                'canonical_id': 'var_deye_5kw_hybrid',
                'family_ref': 'fam_deye_inverters',
                'category_ref': 'solar_energy',
                'title': 'Deye 5kW 48V Single Phase Hybrid Inverter (SUN-5K-SG03LP1-EU)',
                'brand': 'Deye',
                'model_number': 'SUN-5K-SG03LP1-EU',
                'gtin13': '6971234567895',
                'mpn': 'SUN-5K-SG03LP1-EU',
                'status': ProductStatusChoices.ACTIVE,
                'attributes': {
                    'ratedPowerKw': 5.0,
                    'dcBusVoltage': 48,
                    'maxPvInputVoltage': 500,
                    'maxPvPowerKw': 6.5,
                    'mpptCount': 2,
                    'mpptVoltageRange': '125V - 425V',
                    'upsSwitchTimeMs': 4,
                    'warrantyYears': 5,
                    'parallelCapability': 'Up to 16 units',
                    'estimatedPriceZar': 15999,
                },
                'compliance': {
                    'sabsApproved': True,
                    'nrs097Certified': True,
                    'warrantyYears': 5,
                    'certificationNumber': 'NRS 097-2-1:2017 Ed 2.1',
                },
                'aliases': [
                    {'phrase': 'deye 5kw', 'locale': 'en', 'confidence': 1.0},
                    {'phrase': 'idayi 5kw inverter', 'locale': 'zu', 'confidence': 0.95},
                    {'phrase': 'deye sonkrag 5kw', 'locale': 'af', 'confidence': 0.95},
                    {'phrase': 'load shedding inverter 5kva', 'locale': 'en', 'confidence': 0.9},
                ],
                'reviews_summary': {
                    'averageRating': 4.9,
                    'totalReviewsCount': 42,
                    'pros': ['4ms UPS switchover is seamless with desktop PCs', 'Smart load / aux port runs geyser on excess solar', 'Excellent Dyness & Pylontech BMS integration'],
                    'cons': ['Fan noise noticeable under >4000W load', 'Requires qualified CoC wireman for NRS compliance'],
                    'reviews': [
                        {
                            'id': 'rev_01',
                            'authorName': 'Sipho Mkhize',
                            'authorLocation': 'Bryanston, Johannesburg',
                            'rating': 5,
                            'title': 'Powers our 4-bedroom house during Stage 6 with zero flicker',
                            'comment': 'Paired with 2x Dyness 5.12kWh batteries. Ran through 4.5 hours of Stage 6 running 2 fridges, 55" TV, and home office. The 4ms switchover is truly unnoticeable.',
                            'verifiedBuyer': True,
                            'date': '2026-06-14',
                            'usageContext': '4-Bedroom Home + 5kW Solar'
                        }
                    ]
                }
            },
            {
                'canonical_id': 'var_dyness_5kwh_battery',
                'family_ref': 'fam_dyness_batteries',
                'category_ref': 'solar_energy',
                'title': 'Dyness BX51100 5.12kWh 51.2V 100Ah LiFePO4 Lithium Battery',
                'brand': 'Dyness',
                'model_number': 'BX51100',
                'gtin13': '6979876543210',
                'mpn': 'BX51100',
                'status': ProductStatusChoices.ACTIVE,
                'attributes': {
                    'nominalCapacityKwh': 5.12,
                    'nominalVoltageV': 51.2,
                    'ratedAh': 100,
                    'cellChemistry': 'LiFePO4',
                    'cycleLife': '6,000 Cycles @ 80% DoD',
                    'maxContinuousChargeA': 50,
                    'maxContinuousDischargeA': 75,
                    'weightKg': 44,
                    'estimatedPriceZar': 17499,
                },
                'compliance': {
                    'sabsApproved': True,
                    'nrs097Certified': True,
                    'warrantyYears': 10,
                },
                'aliases': [
                    {'phrase': 'dyness 5.12kwh', 'locale': 'en', 'confidence': 1.0},
                    {'phrase': 'dyness ibhethri 5kwh', 'locale': 'zu', 'confidence': 0.95},
                    {'phrase': 'dyness litium battery', 'locale': 'af', 'confidence': 0.95},
                ]
            },
            {
                'canonical_id': 'var_sunsynk_8kw_hybrid',
                'family_ref': 'fam_sunsynk_inverters',
                'category_ref': 'solar_energy',
                'title': 'Sunsynk 8kW Single Phase Hybrid Inverter (SUN-8K-SG01LP1)',
                'brand': 'Sunsynk',
                'model_number': 'SUN-8K-SG01LP1',
                'gtin13': '6972233445566',
                'mpn': 'SUN-8K-SG01LP1',
                'status': ProductStatusChoices.ACTIVE,
                'attributes': {
                    'ratedPowerKw': 8.0,
                    'dcBusVoltage': 48,
                    'maxPvPowerKw': 10.4,
                    'mpptCount': 2,
                    'warrantyYears': 5,
                    'estimatedPriceZar': 29999,
                },
                'compliance': {
                    'sabsApproved': True,
                    'nrs097Certified': True,
                    'warrantyYears': 5,
                }
            },
            {
                'canonical_id': 'var_samsung_a16_128gb',
                'family_ref': 'fam_samsung_a_series',
                'category_ref': 'smartphones',
                'title': 'Samsung Galaxy A16 128GB LTE Dual SIM (Light Blue)',
                'brand': 'Samsung',
                'model_number': 'SM-A165F',
                'gtin13': '8806091234567',
                'mpn': 'SM-A165FZBDXFA',
                'status': ProductStatusChoices.ACTIVE,
                'attributes': {
                    'screenSizeInches': 6.7,
                    'storageGb': 128,
                    'ramGb': 4,
                    'batteryMah': 5000,
                    'cameraMp': '50MP + 5MP + 2MP',
                    'estimatedPriceZar': 2999,
                },
                'compliance': {
                    'icasaApproved': True,
                    'warrantyYears': 2,
                }
            },
            {
                'canonical_id': 'var_surebuild_cement_50kg',
                'family_ref': 'fam_ppc_cement',
                'category_ref': 'hardware',
                'title': 'PPC Surebuild 42.5N General Purpose Cement 50kg Bag',
                'brand': 'PPC',
                'model_number': 'SUREBUILD-42.5N',
                'gtin13': '6001234000012',
                'mpn': 'PPC-SURE-50',
                'status': ProductStatusChoices.ACTIVE,
                'attributes': {
                    'strengthClass': '42.5N High Early Strength',
                    'packWeightKg': 50,
                    'standardsCompliance': 'SANS 50197-1 / SABS Approved',
                    'estimatedPriceZar': 115,
                },
                'compliance': {
                    'sabsApproved': True,
                    'warrantyYears': 1,
                }
            },
        ]

        product_objs = {}
        for pdata in products_data:
            c_id = pdata.pop('canonical_id')
            p_obj, _ = MasterProduct.objects.update_or_create(
                canonical_id=c_id,
                defaults=pdata
            )
            product_objs[c_id] = p_obj
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(product_objs)} Canonical Master Products"))

        # 4. Confirmed Live Offers & Discovered Web Offers
        confirmed_offers_data = [
            {
                'canonical_id': 'ofr_solar_bros_deye_5kw',
                'variant': product_objs.get('var_deye_5kw_hybrid'),
                'merchant': merchant_objs.get('m_solar_bros'),
                'price_amount': 15499.00,
                'currency': 'ZAR',
                'stall_ref': 'Nelson Mandela Square Upper Concourse B-12',
                'destination_type': DestinationTypeChoices.MERCHANT_WHATSAPP,
                'availability_state': AvailabilityStateChoices.FRESH,
                'sla_class': SlaClassChoices.FAST_MOVING_24H,
            },
            {
                'canonical_id': 'ofr_sunpower_deye_5kw',
                'variant': product_objs.get('var_deye_5kw_hybrid'),
                'merchant': merchant_objs.get('m_sunpower_crown'),
                'price_amount': 14999.00,
                'currency': 'ZAR',
                'stall_ref': 'Building 2, Wholesale Aisle Shop 18',
                'destination_type': DestinationTypeChoices.MERCHANT_WHATSAPP,
                'availability_state': AvailabilityStateChoices.FRESH,
                'sla_class': SlaClassChoices.FAST_MOVING_24H,
            },
            {
                'canonical_id': 'ofr_solar_bros_dyness_5kwh',
                'variant': product_objs.get('var_dyness_5kwh_battery'),
                'merchant': merchant_objs.get('m_solar_bros'),
                'price_amount': 16999.00,
                'currency': 'ZAR',
                'stall_ref': 'Nelson Mandela Square Upper Concourse B-12',
                'destination_type': DestinationTypeChoices.MERCHANT_WHATSAPP,
                'availability_state': AvailabilityStateChoices.FRESH,
                'sla_class': SlaClassChoices.RETAIL_72H,
            },
            {
                'canonical_id': 'ofr_techhub_a16',
                'variant': product_objs.get('var_samsung_a16_128gb'),
                'merchant': merchant_objs.get('m_techhub_plaza'),
                'price_amount': 2850.00,
                'currency': 'ZAR',
                'stall_ref': 'Grand Bazaar Shop C-44',
                'destination_type': DestinationTypeChoices.MERCHANT_WHATSAPP,
                'availability_state': AvailabilityStateChoices.FRESH,
                'sla_class': SlaClassChoices.FAST_MOVING_24H,
            },
            {
                'canonical_id': 'ofr_buildmart_cement',
                'variant': product_objs.get('var_surebuild_cement_50kg'),
                'merchant': merchant_objs.get('m_buildmart_centurion'),
                'price_amount': 109.00,
                'currency': 'ZAR',
                'stall_ref': 'Trade Yard Counter 4',
                'destination_type': DestinationTypeChoices.MERCHANT_WHATSAPP,
                'availability_state': AvailabilityStateChoices.FRESH,
                'sla_class': SlaClassChoices.RETAIL_72H,
            },
        ]

        for odata in confirmed_offers_data:
            if odata.get('variant') and odata.get('merchant'):
                c_id = odata.pop('canonical_id')
                Offer.objects.update_or_create(
                    canonical_id=c_id,
                    defaults=odata
                )

        # Discovered Web Offers
        discovered_offers_data = [
            {
                'canonical_id': 'disc_takealot_deye_5kw',
                'master_product': product_objs.get('var_deye_5kw_hybrid'),
                'merchant_name': 'Takealot Commercial Marketplace',
                'source_website': 'takealot.com',
                'source_url': 'https://www.takealot.com/deye-5kw-hybrid-inverter',
                'discovered_price_amount': 16999.00,
                'confidence_score': 0.95,
                'location_hint': 'Johannesburg & Cape Town Distribution Centres',
                'sku': 'TAK-DEYE-5KW-ZA',
            },
            {
                'canonical_id': 'disc_leroy_cement',
                'master_product': product_objs.get('var_surebuild_cement_50kg'),
                'merchant_name': 'Leroy Merlin South Africa',
                'source_website': 'leroymerlin.co.za',
                'source_url': 'https://leroymerlin.co.za/ppc-surebuild-cement-50kg',
                'discovered_price_amount': 119.00,
                'confidence_score': 0.98,
                'location_hint': 'Greenstone, Fourways & Boksburg Branches',
                'sku': 'LM-81423450',
            },
        ]

        for ddata in discovered_offers_data:
            if ddata.get('master_product'):
                c_id = ddata.pop('canonical_id')
                DiscoveredOffer.objects.update_or_create(
                    canonical_id=c_id,
                    defaults=ddata
                )
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Confirmed Live Offers & Discovered Web Offers"))

        # 5. Shows and Shorts (Video Media)
        shows_data = [
            {
                'canonical_id': 'ep_01',
                'title': 'Dragon City Wholesale Walk: Exploring Building 2 Solar & Inverter Importers',
                'slug': 'dragon-city-wholesale-walk',
                'series_name': 'Market Walk South Africa',
                'category': ShowCategoryChoices.MARKET_WALK,
                'duration': '14:20',
                'market_name': 'Dragon City Wholesale Mall, Crown Mines',
                'market': market_objs.get('dragon-city-crown-mines'),
                'views': 48200,
                'featured_products_count': 12,
                'thumbnail_url': 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?w=800&h=450&fit=crop',
                'video_url': SAMPLE_VIDEOS + 'WeAreGoingOnBullrun.mp4',
                'description': 'We walk through Dragon City Wholesale with local traders, comparing bulk prices for 5kW Deye and Sunsynk inverters directly from verified importers.',
                'status': ShowStatusChoices.ACTIVE,
            },
            {
                'canonical_id': 'ep_02',
                'title': 'Sandton City Diamond Walk & Level 2 Tech: Premium Solar Showcases',
                'slug': 'sandton-city-diamond-walk',
                'series_name': 'Market Walk South Africa',
                'category': ShowCategoryChoices.MARKET_WALK,
                'duration': '18:45',
                'market_name': 'Sandton City, Johannesburg',
                'market': market_objs.get('sandton-city-johannesburg'),
                'views': 62100,
                'featured_products_count': 8,
                'thumbnail_url': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=450&fit=crop',
                'video_url': SAMPLE_VIDEOS + 'VolkswagenGTIReview.mp4',
                'description': 'Visiting authorized distributors and specialist clean-energy retail studios in Sandton City Nelson Mandela Square concourses.',
                'status': ShowStatusChoices.ACTIVE,
            },
            {
                'canonical_id': 'ep_03',
                'title': 'Deye 8kW vs Sunsynk 8kW: Lab Load Benchmarks & Auxiliary Generator Switching',
                'slug': 'deye-8kw-vs-sunsynk-8kw-teardown',
                'series_name': 'Product Battles: Solar & Tech',
                'category': ShowCategoryChoices.PRODUCT_BATTLES,
                'duration': '22:10',
                'market_name': 'Shoppage Engineering Lab',
                'views': 94500,
                'featured_products_count': 4,
                'thumbnail_url': 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&h=450&fit=crop',
                'video_url': SAMPLE_VIDEOS + 'TearsOfSteel.mp4',
                'description': 'Comprehensive side-by-side electrical test: MPPT efficiency, fan noise under 8000W load, and smart BMS communication with Dyness lithium batteries.',
                'status': ShowStatusChoices.ACTIVE,
            },
        ]

        for sdata in shows_data:
            c_id = sdata.pop('canonical_id')
            Show.objects.update_or_create(canonical_id=c_id, defaults=sdata)

        shorts_data = [
            {
                'canonical_id': 'sh_01',
                'title': '🔥 Deye 5kW Hybrid Inverter Full Teardown & Real Load Test under Stage 6',
                'product_title': 'Deye 5kW 48V Hybrid Inverter',
                'master_product': product_objs.get('var_deye_5kw_hybrid'),
                'merchant': merchant_objs.get('m_solar_bros'),
                'merchant_name': 'SolarBros Sandton',
                'merchant_whatsapp': '27712345678',
                'views': 42500,
                'likes': 1840,
                'shares': 420,
                'duration': '0:58',
                'thumbnail_url': 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=480&h=854&fit=crop',
                'video_url': SAMPLE_VIDEOS + 'ForBiggerBlazes.mp4',
                'summary': 'Testing dual MPPT strings and 4ms UPS switchover with 5000W load.',
                'moderation_state': ModerationStateChoices.APPROVED,
            },
            {
                'canonical_id': 'sh_02',
                'title': '🔋 6,000 Cycles! Dyness BX51100 5.12kWh Lithium Battery Inside Look',
                'product_title': 'Dyness BX51100 5.12kWh Lithium Battery',
                'master_product': product_objs.get('var_dyness_5kwh_battery'),
                'merchant': merchant_objs.get('m_sunpower_crown'),
                'merchant_name': 'SunPower Solutions Crown Mines',
                'merchant_whatsapp': '27829876543',
                'views': 28900,
                'likes': 1220,
                'shares': 290,
                'duration': '0:48',
                'thumbnail_url': 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=480&h=854&fit=crop',
                'video_url': SAMPLE_VIDEOS + 'ForBiggerEscapes.mp4',
                'summary': 'Checking smart BMS communication and 11.4h backup runtime on home essentials.',
                'moderation_state': ModerationStateChoices.APPROVED,
            },
            {
                'canonical_id': 'sh_03',
                'title': '📱 Samsung Galaxy A16 Unboxing & Real-World Battery Test',
                'product_title': 'Samsung Galaxy A16 128GB',
                'master_product': product_objs.get('var_samsung_a16_128gb'),
                'merchant': merchant_objs.get('m_techhub_plaza'),
                'merchant_name': 'TechHub Oriental Plaza',
                'merchant_whatsapp': '27831234567',
                'views': 51200,
                'likes': 2300,
                'shares': 510,
                'duration': '1:04',
                'thumbnail_url': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=480&h=854&fit=crop',
                'video_url': SAMPLE_VIDEOS + 'ForBiggerMeltdowns.mp4',
                'summary': 'Exynos chipset thermals, 5000mAh endurance and camera samples in low light.',
                'moderation_state': ModerationStateChoices.APPROVED,
            },
        ]

        for shdata in shorts_data:
            c_id = shdata.pop('canonical_id')
            Short.objects.update_or_create(canonical_id=c_id, defaults=shdata)
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Shows & Proof Shorts"))

        # 6. Rights Register
        cipc_rights, _ = RightsSource.objects.update_or_create(
            name='CIPC Official Company Registry',
            defaults={
                'rights_class': RightsClassChoices.PUBLIC_RECORD,
                'status': RightsStatusChoices.CLEARED,
                'ai_use_permitted': True,
                'suppression_sla_hours': 24,
                'permitted_fields': ['enterprise_name', 'registration_number', 'status'],
            }
        )
        merchant_rights, _ = RightsSource.objects.update_or_create(
            name='Direct Verified Merchant Feeds',
            defaults={
                'rights_class': RightsClassChoices.DIRECT_MERCHANT_AUTHORISED,
                'status': RightsStatusChoices.CLEARED,
                'ai_use_permitted': True,
                'suppression_sla_hours': 12,
                'permitted_fields': ['title', 'price', 'stock_state', 'whatsapp_number'],
            }
        )

        # 7. Evidence Graph & Trust Moat (v8.1 Part IX)
        art, _ = EvidenceArtifact.objects.update_or_create(
            source_identifier='https://cipc.co.za/enterprises/K2021-123456-07',
            defaults={
                'source_type': EvidenceSourceTypeChoices.OFFICIAL_REGISTRY,
                'artifact_hash': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                'raw_payload': {'entity_name': 'Solar Brothers (Pty) Ltd', 'status': 'In Business', 'tax_status': 'Compliant'},
                'rights_source': cipc_rights,
            }
        )
        EvidenceClaim.objects.update_or_create(
            subject_entity_type='Merchant',
            subject_entity_id='m_solar_bros',
            claim_key='cipcRegistrationValid',
            defaults={
                'claim_type': EvidenceClaimTypeChoices.MERCHANT_IDENTITY,
                'claim_value': {'registration_number': 'K2021/123456/07', 'sars_pin_verified': True},
                'state': EvidenceClaimStateChoices.VERIFIED,
                'confidence_score': 1.0000,
                'primary_artifact': art,
                'verified_by': 'CIPC Automated Verification Pipeline',
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Evidence Graph Artifacts & Claims"))

        # 8. Merchant OS Drafts & Autopilot Agent Runs (v8.1 Part XI & XII)
        m_solar = Merchant.objects.filter(canonical_id='m_solar_bros').first()
        p_deye = MasterProduct.objects.filter(canonical_id='var_deye_5kw_hybrid').first()

        if m_solar and p_deye:
            Draft.objects.update_or_create(
                draft_id='dft_deye_alias_01',
                defaults={
                    'draft_type': DraftTypeChoices.ALIAS_EXPANSION,
                    'merchant': m_solar,
                    'product': p_deye,
                    'payload': {'suggested_alias': 'Deye 5kVa hybrid geyser inverter', 'locale': 'en-ZA'},
                    'confidence': 0.94,
                    'review_state': ReviewStateChoices.APPROVED,
                }
            )
            AgentRun.objects.update_or_create(
                run_id='run_feed_autopilot_01',
                defaults={
                    'agent_name': 'Feed Autopilot',
                    'merchant': m_solar,
                    'status': 'completed',
                    'tokens_consumed': 1420,
                    'tool_calls_count': 3,
                    'summary': 'Normalized 5 solar inverters with SABS & NRS 097 grid certifications.',
                }
            )
            self.stdout.write(self.style.SUCCESS("[OK] Seeded Merchant OS Autopilot Runs & Drafts"))

        self.stdout.write(self.style.SUCCESS("================================================================="))
        self.stdout.write(self.style.SUCCESS("[SUCCESS] Full Shoppage v8.1 Flagship Dataset Seeded Into Django!"))
        self.stdout.write(self.style.SUCCESS("================================================================="))
