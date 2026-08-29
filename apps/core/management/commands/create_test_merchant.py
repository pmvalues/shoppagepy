from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.merchants.models import Merchant


class Command(BaseCommand):
    help = 'Creates (idempotently) a demo merchant account: testmerchant / TestMerchant2026 owning a claimed store'

    USERNAME = 'testmerchant'
    PASSWORD = 'TestMerchant2026'
    CANONICAL_ID = 'm_shoppage_test'

    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=self.USERNAME,
            defaults={'email': 'test@shoppage.co.za'},
        )
        user.set_password(self.PASSWORD)
        user.save()

        merchant, m_created = Merchant.objects.get_or_create(
            canonical_id=self.CANONICAL_ID,
            defaults={
                'name': 'Shoppage Test Merchant',
                'owner': user,
                'claim_state': 'claimed',
                'verification_state': 'fully_verified',
                'trust_score': 92,
                'whatsapp_number': '27710000000',
                'email': 'test@shoppage.co.za',
                'category': 'solar_energy',
                'province': 'Gauteng',
                'locality': 'Sandton',
                'address_text': 'Shop B-18, Test Mall, Sandton, Johannesburg',
                'timezone': 'Africa/Johannesburg',
            },
        )
        # Always re-link ownership, mirroring the claim flow's re-own behaviour.
        if merchant.owner_id != user.id:
            merchant.owner = user
            merchant.save(update_fields=['owner'])

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Test merchant ready: user='{self.USERNAME}' / pass='{self.PASSWORD}'"
                f" / merchant={merchant.canonical_id} (/merchant/dashboard/, {'created' if m_created else 'existing'})"
            )
        )
