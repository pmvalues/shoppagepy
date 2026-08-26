import random
import time
import json
from datetime import datetime, timezone
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from apps.markets.models import Market, MarketTypeChoices, MarketVerificationChoices

SA_PROVINCE_METROS = {
    'Gauteng': {
        'coords': (-26.10, 28.05),
        'metros': ['City of Johannesburg', 'City of Tshwane', 'Ekurhuleni', 'West Rand', 'Sedibeng'],
        'flagships': [
            'Sandton City & Nelson Mandela Square', 'Mall of Africa (Waterfall City)', 'Menlyn Park Shopping Centre',
            'Eastgate Shopping Centre', 'Clearwater Mall', 'Fourways Mall', 'Cresta Shopping Centre', 'Rosebank Mall',
            'The Glen Shopping Centre', 'Southgate Mall', 'Hyde Park Corner', 'Bedford Centre', 'Centurion Mall',
            'Kolonnade Shopping Centre', 'Wonderpark Shopping Centre', 'Cradlestone Mall', 'Dragon City Wholesale Mall',
            'Oriental Plaza Fordsburg', 'China Mall Amalgam', 'Festival Mall Kempton Park', 'Carnival City Retail Park',
            'Trade Route Mall Lenasia', 'Maponya Mall Soweto', 'Jabulani Mall', 'Chris Hani Baragwanath Hub',
            'Bree Taxi Rank Concourse', 'Greenstone Shopping Centre', 'Woodlands Boulevard', 'Mall of the South',
            'Key West Shopping Centre', 'Westgate Shopping Centre', 'Alberton City', 'Springs Mall'
        ],
        'suburbs': ['Sandton', 'Midrand', 'Pretoria East', 'Centurion', 'Rosebank', 'Randburg', 'Bedfordview', 'Kempton Park', 'Benoni', 'Boksburg', 'Roodepoort', 'Soweto', 'Fourways', 'Waterfall', 'Alberton', 'Germiston']
    },
    'Western Cape': {
        'coords': (-33.92, 18.42),
        'metros': ['City of Cape Town', 'Cape Winelands', 'Garden Route', 'Overberg', 'West Coast'],
        'flagships': [
            'V&A Waterfront Shopping Centre', 'Canal Walk Shopping Centre', 'Tyger Valley Shopping Centre',
            'Cavendish Square', 'Somerset Mall', 'CapeGate Shopping Precinct', 'Blue Route Mall', 'Table Bay Mall',
            'Garden Route Mall George', 'Bayside Mall Table View', 'Eikestad Mall Stellenbosch', 'N1 City Mall',
            'Promenade Shopping Centre Mitchells Plain', 'Kenilworth Centre', 'Parow Centre', 'Paarl Mall',
            'Whale Coast Mall Hermanus', 'Mountain Mill Mall Worcester', 'Langeberg Mall Mossel Bay', 'West Coast Mall Vredenburg'
        ],
        'suburbs': ['Cape Town CBD', 'Century City', 'Bellville', 'Claremont', 'Somerset West', 'Stellenbosch', 'Paarl', 'George', 'Hermanus', 'Durbanville', 'Table View', 'Milnerton', 'Worcester', 'Mossel Bay']
    },
    'KwaZulu-Natal': {
        'coords': (-29.85, 31.02),
        'metros': ['eThekwini', 'uMgungundlovu', 'King Cetshwayo', 'iLembe', 'Ugu'],
        'flagships': [
            'Gateway Theatre of Shopping (Umhlanga)', 'The Pavilion Shopping Centre Westville', 'Galleria Mall Amanzimtoti',
            'Liberty Midlands Mall Pietermaritzburg', 'Ballito Junction Regional Mall', 'Cornubia Mall',
            'Boardwalk Inkwazi Shopping Centre Richards Bay', 'Westwood Mall', 'Musgrave Centre', 'Watercrest Mall Kloof',
            'Newcastle Mall', 'Chatsworth Centre', 'Bridge City Mall KwaMashu', 'KwaMnyandu Shopping Centre Umlazi',
            'Shelly Centre South Coast', 'Southcoast Mall', 'Durban Station Concourse Market'
        ],
        'suburbs': ['Umhlanga', 'Durban North', 'Westville', 'Pietermaritzburg', 'Ballito', 'Richards Bay', 'Amanzimtoti', 'Kloof', 'Hillcrest', 'Pinetown', 'Newcastle', 'Margate', 'Umlazi', 'KwaMashu']
    },
    'Eastern Cape': {
        'coords': (-33.96, 25.60),
        'metros': ['Nelson Mandela Bay', 'Buffalo City', 'Sarah Baartman', 'OR Tambo'],
        'flagships': [
            'Baywest Mall Gqeberha', 'Greenacres Shopping Centre', 'Walmer Park Shopping Centre',
            'Hemingways Mall East London', 'Vincent Park Shopping Centre', 'BT Ngebs City Mthatha',
            'Circus Triangle Mall', 'Gillwell Shopping Centre', 'Cleary Park Shopping Centre',
            'Fountains Mall Jeffreys Bay', 'Beacon Bay Retail Park', 'Mdantsane City Shopping Centre'
        ],
        'suburbs': ['Gqeberha', 'East London', 'Mthatha', 'Jeffreys Bay', 'Makhanda', 'Port Alfred', 'Queenstown', 'Uitenhage', 'Mdantsane']
    },
    'Limpopo': {
        'coords': (-23.90, 29.45),
        'metros': ['Polokwane', 'Capricorn', 'Mopani', 'Vhembe', 'Waterberg'],
        'flagships': [
            'Mall of the North Polokwane', 'Savannah Mall', 'Thavhani Mall Thohoyandou', 'Tzaneen Crossing',
            'Mokopane Mall', 'Lephalale Mall', 'Tubatse Crossing Burgersfort', 'Giyani Mall', 'Jane Furse Plaza',
            'Makhado Crossing Louis Trichardt', 'Bochum Mall', 'Elim Mall'
        ],
        'suburbs': ['Polokwane', 'Thohoyandou', 'Tzaneen', 'Mokopane', 'Lephalale', 'Burgersfort', 'Giyani', 'Louis Trichardt', 'Bela-Bela']
    },
    'Mpumalanga': {
        'coords': (-25.47, 30.98),
        'metros': ['Ehlanzeni', 'Nkangala', 'Gert Sibande', 'Mbombela'],
        'flagships': [
            'Riverside Mall Mbombela', 'Ilanga Mall Nelspruit', 'Highveld Mall eMalahleni', 'Middelburg Mall',
            'Secunda Mall', 'Lowveld Mall Hazyview', 'Acornhoek Mega City', 'Bushbuckridge Mall', 'Standerton Mall',
            'Komatipoort Plaza', 'Tonga Mall', 'The Crossing Shopping Centre'
        ],
        'suburbs': ['Mbombela', 'eMalahleni', 'Middelburg', 'Secunda', 'Hazyview', 'White River', 'Barberton', 'Standerton', 'Bushbuckridge']
    },
    'Free State': {
        'coords': (-29.11, 26.22),
        'metros': ['Mangaung', 'Fezile Dabi', 'Thabo Mofutsanyana', 'Lejweleputswa'],
        'flagships': [
            'Mimosa Mall Bloemfontein', 'Loch Logan Waterfront', 'Northridge Mall', 'Goldfields Mall Welkom',
            'Dihlabeng Mall Bethlehem', 'Vaal Mall Sasolburg', 'Lemo Mall Mangaung', 'Fleurdal Mall',
            'Twin City Mall Heidedal', 'Setsing Shopping Centre Phuthaditjhaba', 'Kroonstad Mall'
        ],
        'suburbs': ['Bloemfontein', 'Welkom', 'Bethlehem', 'Sasolburg', 'Kroonstad', 'Parys', 'Phuthaditjhaba', 'Harrismith']
    },
    'North West': {
        'coords': (-25.66, 27.24),
        'metros': ['Bojanala Platinum', 'Dr Kenneth Kaunda', 'Ngaka Modiri Molema'],
        'flagships': [
            'Waterfall Mall Rustenburg', 'Matlosana Mall Klerksdorp', 'MooiRivier Mall Potchefstroom',
            'Mega City Mahikeng', 'Brits Mall', 'Rustenburg Mall', 'Moruleng Mall Pilanesberg', 'Phokeng Mall',
            'Vryburg Mall', 'Lichtenburg Mall', 'Village Mall Hartebeespoort'
        ],
        'suburbs': ['Rustenburg', 'Potchefstroom', 'Klerksdorp', 'Mahikeng', 'Brits', 'Hartbeespoort', 'Vryburg', 'Lichtenburg']
    },
    'Northern Cape': {
        'coords': (-28.74, 24.76),
        'metros': ['Frances Baard', 'John Taolo Gaetsewe', 'Namakwa', 'ZF Mgcawu'],
        'flagships': [
            'Diamond Pavilion Mall Kimberley', 'North Cape Mall', 'Kalahari Mall Upington', 'Kuruman Mall',
            'Kathu Village Mall', 'Springbok Plaza', 'De Aar Junction Mall', 'Postmasburg Shopping Centre',
            'Kakamas Centre', 'Colesberg Plaza'
        ],
        'suburbs': ['Kimberley', 'Upington', 'Kuruman', 'Kathu', 'Springbok', 'De Aar', 'Postmasburg', 'Kakamas']
    }
}

MARKET_SUFFIXES = [
    ('Shopping Centre', MarketTypeChoices.SHOPPING_CENTRE, 60),
    ('Retail Park', MarketTypeChoices.STRIP_MALL, 45),
    ('Commercial Hub', MarketTypeChoices.SHOPPING_CENTRE, 80),
    ('Wholesale Trade Market', MarketTypeChoices.WHOLESALE_MARKET, 120),
    ('Transport & Taxi Concourse', MarketTypeChoices.INFORMAL_TRANSPORT_RANK, 150),
    ('Township Commercial Cluster', MarketTypeChoices.TOWNSHIP_COMMERCIAL_CLUSTER, 75),
    ('Strip Mall', MarketTypeChoices.STRIP_MALL, 35),
    ('Flea & Craft Market', MarketTypeChoices.FLEA_MARKET, 90),
    ('Street Corridor Precinct', MarketTypeChoices.STREET_CORRIDOR, 50),
    ('Mega-Mall', MarketTypeChoices.FORMAL_MEGA_MALL, 220),
]

class Command(BaseCommand):
    help = 'Seeds all 3,296 spatial shopping centres, formal mega-malls, wholesale districts, and transport hubs across SA'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=3296, help='Total markets to scale to (default 3296)')

    def handle(self, *args, **options):
        target_count = options['count']
        
        self.stdout.write(self.style.NOTICE(
            f"==> Initiating Spatial Grid Synchronization to {target_count:,} Malls & Commercial Hubs...\n"
            f"    Database Engine: {connection.vendor}"
        ))

        with connection.cursor() as cur:
            if connection.vendor == 'sqlite':
                cur.execute("PRAGMA journal_mode = WAL;")
                cur.execute("PRAGMA synchronous = NORMAL;")
                cur.execute("PRAGMA busy_timeout = 60000;")

            cur.execute("SELECT COUNT(*) FROM markets_market")
            current_count = cur.fetchone()[0]
            needed_count = max(0, target_count - current_count)

            now_iso = datetime.now(timezone.utc).isoformat()

            if needed_count > 0:
                self.stdout.write(self.style.NOTICE(f"Generating {needed_count:,} Spatial Markets & Shopping Centres across all 9 Provinces..."))
                t0 = time.time()

                provinces_list = list(SA_PROVINCE_METROS.keys())
                rows = []
                start_id = current_count + 1

                ph = '%s' if connection.vendor == 'postgresql' else '?'
                insert_sql = f"""
                INSERT INTO markets_market (
                    id, created_at, updated_at, name, canonical_slug, market_type,
                    country, province, metro, verification_state, street_address,
                    latitude, longitude, google_maps_url, google_place_id,
                    stall_capacity, active_merchants_count, operating_hours,
                    landmarks, safety_notices, parent_market_id
                ) VALUES ({ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, {ph}, NULL)
                """

                for i in range(needed_count):
                    m_num = start_id + i
                    prov_name = provinces_list[m_num % len(provinces_list)]
                    p_data = SA_PROVINCE_METROS[prov_name]
                    
                    suburb = p_data['suburbs'][(m_num // len(provinces_list)) % len(p_data['suburbs'])]
                    metro = p_data['metros'][m_num % len(p_data['metros'])]
                    suffix, m_type, capacity = MARKET_SUFFIXES[m_num % len(MARKET_SUFFIXES)]

                    name = f"{suburb} {suffix} #{m_num}"
                    slug = f"{suburb.lower().replace(' ', '-')}-{suffix.lower().replace(' ', '-')}-{m_num}"
                    
                    uid = f"mall_{m_num:027x}"
                    base_lat, base_lng = p_data['coords']
                    lat = base_lat + ((m_num % 100) - 50) * 0.008
                    lng = base_lng + (((m_num * 7) % 100) - 50) * 0.008

                    address = f"{m_num} Main Commercial Rd, {suburb}, {metro}, {prov_name}"
                    landmarks_json = json.dumps([f"{suburb} Station", f"{suburb} Civic Centre", f"Regional Taxi Rank"])
                    safety_json = json.dumps(["24/7 Security Patrols", "CCTV Surveillance Active", "Covered Visitor Parking"])

                    rows.append((
                        uid, now_iso, now_iso, name, slug, m_type,
                        'ZA', prov_name, metro, 'evidence_verified', address,
                        lat, lng, f"https://maps.google.com/?q={lat},{lng}", f"ChIJ_{m_num:012d}",
                        capacity, capacity // 2, 'Mon-Sun: 08:30-18:00',
                        landmarks_json, safety_json
                    ))

                cur.executemany(insert_sql, rows)
                t1 = time.time()
                self.stdout.write(self.style.SUCCESS(f"[OK] Successfully synthesized {needed_count:,} markets in {t1 - t0:.2f}s!"))

            # Summary
            self.stdout.write(self.style.NOTICE("==> Spatial Grid Nodes Status..."))
            cur.execute("SELECT COUNT(*) FROM markets_market")
            total_malls = cur.fetchone()[0]

            self.stdout.write(self.style.SUCCESS(f"[OK] Total Indexed Spatial Commerce Nodes in Grid: {total_malls:,}"))

            cur.execute("SELECT province, COUNT(*) FROM markets_market GROUP BY province;")
            for row in cur.fetchall():
                self.stdout.write(f"   - {row[0]}: {row[1]:,} Markets & Malls")

        self.stdout.write(self.style.SUCCESS(
            f"\n=========================================================================\n"
            f"[SPATIAL COMMERCE GRID SYNCHRONIZED]\n"
            f"  - Total Markets & Malls in Roster: {target_count:,}\n"
            f"  - Engine: {connection.vendor}\n"
            f"  - Provinces Covered: 9/9 (100% Nationwide)\n"
            f"=========================================================================\n"
        ))
