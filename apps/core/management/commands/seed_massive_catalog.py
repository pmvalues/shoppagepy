import random

from apps.catalog.models import MasterProduct, ProductStatusChoices
from apps.merchants.models import Merchant
from apps.offers.models import (
    AvailabilityStateChoices,
    DestinationTypeChoices,
    DiscoveredOffer,
    Offer,
    SlaClassChoices,
)
from django.core.management.base import BaseCommand
from django.db import transaction

CATEGORIES_DATA = {
    'solar_energy': {
        'brands': ['Deye', 'Sunsynk', 'Growatt', 'Victron Energy', 'Must', 'Luxpower', 'Dyness', 'Pylontech', 'Hubble Lithium', 'Freedom Won', 'JA Solar', 'Canadian Solar', 'Longi'],
        'types': [
            ('Hybrid Inverter', 'Inverters', 12000, 55000, {'dcBusVoltage': 48, 'sabsApproved': True, 'nrs097Certified': True}),
            ('LiFePO4 Lithium Battery', 'Batteries', 14000, 48000, {'nominalCapacityKwh': 5.12, 'warrantyYears': 10, 'cellChemistry': 'LiFePO4'}),
            ('Tier-1 Monocrystalline Solar Panel', 'Panels', 1400, 3200, {'ratedPowerW': 550, 'efficiencyPct': 21.5, 'warrantyYears': 25}),
            ('Off-Grid Pure Sine Wave Inverter', 'Inverters', 4500, 18000, {'ratedPowerKw': 3.5, 'sabsApproved': True}),
            ('High-Voltage Lithium Stack Module', 'Batteries', 32000, 95000, {'nominalCapacityKwh': 10.24, 'nominalVoltageV': 204.8}),
            ('Solar Geyser Retrofit Controller & Element', 'Accessories', 2200, 6500, {'elementKw': 2.0, 'acDcDual': True}),
        ]
    },
    'hardware_tools': {
        'brands': ['Bosch Professional', 'Makita', 'DeWalt', 'Ingco', 'Stanley', 'Ryobi', 'Total Tools', 'Milwaukee'],
        'types': [
            ('Cordless Brushless Impact Drill Kit 18V', 'Power Tools', 1600, 4800, {'batteryVoltage': '18V Li-Ion', 'torqueNm': 65}),
            ('Heavy Duty Angle Grinder 230mm 2200W', 'Power Tools', 1200, 3500, {'discDiameterMm': 230, 'powerInputW': 2200}),
            ('Rotary Hammer SDS-Plus Drill 800W', 'Power Tools', 1400, 4200, {'impactJoules': 2.7, 'chuck': 'SDS-Plus'}),
            ('Inverter Welding Machine 200A MMA/TIG', 'Welding', 1800, 5600, {'currentAmps': 200, 'dutyCycle': '60%'}),
            ('Industrial 50L Air Compressor 2.0HP', 'Pneumatics', 2800, 7500, {'tankCapacityL': 50, 'maxPressureBar': 8}),
            ('150-Piece Mechanics Tool Set & Steel Chest', 'Hand Tools', 1900, 6200, {'pieceCount': 150, 'steelGrade': 'Chrome Vanadium'}),
        ]
    },
    'building_materials': {
        'brands': ['PPC', 'AfriSam', 'Lafarge', 'Duram', 'Dulux', 'Plascon', 'Gyproc', 'Isover'],
        'types': [
            ('Surebuild 42.5N Cement 50kg Pallet (40 Bags)', 'Cement & Aggregates', 3800, 4600, {'strengthClass': '42.5N', 'bagWeightKg': 50, 'sabsApproved': True}),
            ('Wall & Ceiling Matt Acrylic Paint 20L', 'Paint', 850, 1850, {'volumeLitres': 20, 'coverageM2': 180}),
            ('Waterproofing Rubber Flex Membrane 20L', 'Waterproofing', 950, 2100, {'volumeLitres': 20, 'warrantyYears': 10}),
            ('RhinoBoard Plasterboard 12.7mm x 1.2m x 3.0m', 'Drywall', 180, 320, {'thicknessMm': 12.7, 'fireRated': True}),
            ('Think Pink Thermal Roof Insulation 135mm Roll', 'Insulation', 620, 1150, {'thicknessMm': 135, 'rValue': 3.38}),
        ]
    },
    'smartphones_electronics': {
        'brands': ['Samsung', 'Apple', 'Xiaomi', 'Huawei', 'Honor', 'Tecno', 'Hisense', 'Sony'],
        'types': [
            ('5G Dual SIM Smartphone 256GB / 8GB RAM', 'Smartphones', 4500, 19500, {'display': '120Hz AMOLED', 'storageGb': 256, 'ramGb': 8, 'batteryMah': 5000}),
            ('Rugged IP68 Outdoor Smartphone 128GB', 'Rugged Phones', 3200, 7800, {'waterproof': 'IP68/IP69K', 'batteryMah': 10000}),
            ('15.6" Core i7 Business Laptop 16GB / 512GB SSD', 'Laptops', 11000, 28000, {'cpu': 'Intel Core i7', 'ramGb': 16, 'ssdGb': 512}),
            ('4K UHD Smart Google TV 65-Inch Direct LED', 'Televisions', 7500, 18500, {'screenSizeInches': 65, 'resolution': '4K UHD', 'hdr': 'HDR10+'}),
            ('Active Noise Cancelling Wireless Headphones', 'Audio', 1200, 6500, {'batteryHours': 40, 'anc': True}),
        ]
    },
    'appliances_home': {
        'brands': ['Defy', 'KIC', 'Hisense', 'Samsung', 'LG', 'Bosch', 'Smeg', 'Whirlpool'],
        'types': [
            ('Frost-Free Double Door Fridge Freezer 340L', 'Refrigeration', 5500, 12500, {'capacityLitres': 340, 'energyRating': 'A+'}),
            ('Front Loader Washing Machine 8kg Inverter', 'Laundry', 4800, 10500, {'capacityKg': 8, 'spinSpeedRpm': 1400}),
            ('5-Burner Gas Electric Freestanding Stove 90cm', 'Cooking', 7200, 21000, {'burnerCount': 5, 'ovenType': 'Electric Multifunction'}),
            ('Chest Freezer with Solar Direct Drive 210L', 'Refrigeration', 3900, 7800, {'capacityLitres': 210, 'solarDirectDrive': True}),
        ]
    },
    'automotive_tyres': {
        'brands': ['Goodyear', 'Dunlop', 'Continental', 'Bridgestone', 'Pirelli', 'Michelin', 'Hankook', 'Castrol'],
        'types': [
            ('All-Terrain 4x4 Bakkie Tyre 265/65 R17', 'Tyres', 1850, 3900, {'size': '265/65 R17', 'terrain': 'All-Terrain A/T'}),
            ('Passenger Eco Performance Tyre 205/55 R16', 'Tyres', 850, 1850, {'size': '205/55 R16', 'speedRating': 'V (240 km/h)'}),
            ('High-Performance Full Synthetic Engine Oil 5W-30 5L', 'Lubricants', 450, 950, {'viscosity': '5W-30', 'volumeLitres': 5}),
            ('Heavy Duty Maintenance-Free Bakkie Battery 12V 70Ah', 'Batteries', 1350, 2600, {'voltage': 12, 'ah': 70, 'warrantyMonths': 24}),
        ]
    },
}

class Command(BaseCommand):
    help = 'Seeds a massive, realistic canonical master product catalog and competitive offers across South Africa'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=1000, help='Number of master products to generate (default 1000)')

    def handle(self, *args, **options):
        target_count = options['count']
        self.stdout.write(self.style.NOTICE(f"==> Generating {target_count:,} High-Density Master Products & Offers..."))

        merchants = list(Merchant.objects.all())
        if not merchants:
            self.stdout.write(self.style.ERROR("No merchants found. Run `seed_shoppage_flagships` first."))
            return

        existing_gtins = set(MasterProduct.objects.values_list('gtin13', flat=True))
        products_to_create = []

        sku_counter = MasterProduct.objects.count() + 1

        for _i in range(target_count):
            cat_key = random.choice(list(CATEGORIES_DATA.keys()))
            cat_info = CATEGORIES_DATA[cat_key]
            brand = random.choice(cat_info['brands'])
            item_type, subfam, min_price, max_price, base_specs = random.choice(cat_info['types'])

            model_num = f"{brand[:3].upper()}-{random.randint(100, 999)}-{random.choice(['X', 'PRO', 'MAX', 'PLUS', 'ECO', 'ZA'])}"
            title = f"{brand} {model_num} {item_type}"
            canonical_id = f"var_{cat_key[:4]}_{brand.lower().replace(' ', '_')[:6]}_{sku_counter}"

            # Generate unique GS1 GTIN-13 barcode
            gtin13 = f"600{random.randint(1000000000, 9999999999)}"
            while gtin13 in existing_gtins:
                gtin13 = f"600{random.randint(1000000000, 9999999999)}"
            existing_gtins.add(gtin13)

            base_price = round(random.uniform(min_price, max_price), -1)

            specs = dict(base_specs)
            specs['estimatedPriceZar'] = base_price

            compliance = {
                'sabsApproved': random.choice([True, True, True, False]),
                'nrs097Certified': cat_key == 'solar_energy',
                'warrantyYears': specs.get('warrantyYears', random.choice([1, 2, 3, 5])),
            }

            aliases = [
                {'phrase': title.lower(), 'locale': 'en', 'confidence': 1.0},
                {'phrase': f"{brand.lower()} {item_type.lower()}", 'locale': 'en', 'confidence': 0.95},
                {'phrase': f"{brand.lower()} theko", 'locale': 'zu', 'confidence': 0.9},
                {'phrase': f"{brand.lower()} prys", 'locale': 'af', 'confidence': 0.9},
            ]

            p = MasterProduct(
                canonical_id=canonical_id,
                family_ref=f"fam_{cat_key}_{subfam.lower()}",
                category_ref=cat_key,
                title=title,
                brand=brand,
                model_number=model_num,
                gtin13=gtin13,
                mpn=model_num,
                status=ProductStatusChoices.ACTIVE,
                attributes=specs,
                compliance=compliance,
                aliases=aliases,
                reviews_summary={
                    'averageRating': round(random.uniform(4.2, 5.0), 1),
                    'totalReviewsCount': random.randint(5, 120),
                }
            )
            products_to_create.append(p)
            sku_counter += 1

        # Bulk create products in batches
        with transaction.atomic():
            MasterProduct.objects.bulk_create(products_to_create, batch_size=500, ignore_conflicts=True)

        self.stdout.write(self.style.SUCCESS(f"[OK] Successfully bulk-created {len(products_to_create):,} Master Products!"))

        # Fetch created products to attach offers
        self.stdout.write(self.style.NOTICE("==> Generating Confirmed & Discovered Merchant Offers..."))
        all_created_products = list(MasterProduct.objects.filter(canonical_id__startswith="var_").order_by('-id')[:len(products_to_create)])

        offers_to_create = []
        discovered_to_create = []

        for prod in all_created_products:
            base_p = prod.attributes.get('estimatedPriceZar', 2500)

            # Create 1 to 3 live merchant offers per product
            assigned_merchants = random.sample(merchants, k=min(len(merchants), random.randint(1, 3)))
            for idx, merch in enumerate(assigned_merchants):
                price_variance = random.uniform(0.88, 1.12)
                offer_price = round(base_p * price_variance, 2)

                offers_to_create.append(Offer(
                    canonical_id=f"ofr_{merch.canonical_id[:8]}_{prod.canonical_id[:12]}_{idx}",
                    variant=prod,
                    merchant=merch,
                    destination_type=DestinationTypeChoices.MERCHANT_WHATSAPP,
                    price_amount=offer_price,
                    currency="ZAR",
                    stall_ref=merch.stall_identifier or "Direct Showroom",
                    availability_state=random.choice([AvailabilityStateChoices.FRESH, AvailabilityStateChoices.FRESH, AvailabilityStateChoices.CONFIRM_REQUIRED]),
                    sla_class=random.choice([SlaClassChoices.FAST_MOVING_24H, SlaClassChoices.RETAIL_72H, SlaClassChoices.CATALOGUE_7D]),
                ))

            # Create 1 to 2 discovered web market offers
            discovered_to_create.append(DiscoveredOffer(
                canonical_id=f"disc_{prod.canonical_id[:14]}_{random.randint(1000, 9999)}",
                master_product=prod,
                merchant_name=random.choice(['Takealot Marketplace', 'Leroy Merlin SA', 'Builders Warehouse', 'Makro Online', 'Chinatown Wholesalers']),
                source_website=random.choice(['https://takealot.com', 'https://leroymerlin.co.za', 'https://builders.co.za', 'https://makro.co.za']),
                source_url=f"https://web-crawl.shoppage.co.za/offers/{prod.gtin13}",
                discovered_price_amount=round(base_p * random.uniform(0.95, 1.25), 2),
                currency="ZAR",
                confidence_score=round(random.uniform(0.85, 0.99), 2),
                location_hint=random.choice(['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Nationwide Delivery']),
            ))

        with transaction.atomic():
            Offer.objects.bulk_create(offers_to_create, batch_size=500, ignore_conflicts=True)
            DiscoveredOffer.objects.bulk_create(discovered_to_create, batch_size=500, ignore_conflicts=True)

        total_prods = MasterProduct.objects.count()
        total_offers = Offer.objects.count()
        total_discovered = DiscoveredOffer.objects.count()

        self.stdout.write(self.style.SUCCESS(
            f"[SUCCESS] Grid Expansion Complete!\n"
            f"   - Total Master Products in Catalog: {total_prods:,}\n"
            f"   - Total Confirmed Live Offers:      {total_offers:,}\n"
            f"   - Total Discovered Web Offers:      {total_discovered:,}\n"
        ))
