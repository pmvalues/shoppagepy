"""
Daily sweep for active price-drop alerts.

Marks every alert triggered when the best merchant-confirmed price for the
watched product has fallen below the subscriber's threshold. Output goes to
stdout (and is visible in Django admin via triggered_at/active).

Run daily via cron/scheduler:
    python manage.py check_price_alerts
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db.models import Min
from django.utils import timezone

from apps.offers.models import AvailabilityStateChoices, Offer, PriceAlert

ACTIVE_STATES = (
    AvailabilityStateChoices.FRESH,
    AvailabilityStateChoices.CONFIRM_REQUIRED,
    AvailabilityStateChoices.QUOTE_REQUIRED,
)


class Command(BaseCommand):
    help = 'Check active price-drop alerts and mark the ones that have triggered.'

    def handle(self, *args, **options):
        alerts = PriceAlert.objects.filter(active=True, triggered_at__isnull=True).select_related('product')
        now = timezone.now()
        triggered = []
        for alert in alerts:
            best = (
                Offer.objects.filter(
                    variant=alert.product,
                    availability_state__in=ACTIVE_STATES,
                    price_amount__isnull=False,
                ).aggregate(m=Min('price_amount'))['m']
            )
            if best is not None and Decimal(best) < alert.threshold_price:
                alert.triggered_at = now
                alert.active = False
                alert.save(update_fields=['triggered_at', 'active', 'updated_at'])
                triggered.append((alert, best))

        for alert, best in triggered:
            self.stdout.write(
                f'TRIGGERED {alert.get_channel_display()}:{alert.contact} '
                f'for "{alert.product.title[:60]}" — best R {best} < threshold R {alert.threshold_price}'
            )
        self.stdout.write(self.style.SUCCESS(f'{len(triggered)} alert(s) triggered.'))