from django.db import models
from apps.core.models import TimeStampedModel

class RightsClassChoices(models.TextChoices):
    PUBLIC_RECORD = 'PUBLIC_RECORD', 'Public Official Record'
    DIRECT_MERCHANT_AUTHORISED = 'DIRECT_MERCHANT_AUTHORISED', 'Direct Merchant Authorized'
    PARTNER_CONTRACTUAL_FEED = 'PARTNER_CONTRACTUAL_FEED', 'Partner Contractual API Feed'
    OPEN_DATA_COMMERCIAL = 'OPEN_DATA_COMMERCIAL', 'Open Data Commercial License'
    BLOCKED = 'BLOCKED', 'Blocked / Unverified'

class RightsStatusChoices(models.TextChoices):
    BLOCKED = 'BLOCKED', 'BLOCKED (Default)'
    CLEARED = 'CLEARED', 'CLEARED for Publication'
    SUSPENDED = 'SUSPENDED', 'SUSPENDED'
    TERMINATED = 'TERMINATED', 'TERMINATED'

class RightsSource(TimeStampedModel):
    """
    Source Rights Register with default-BLOCKED permissions enforcement.
    Guarantees compliance and auditability for crawled and partner feeds.
    """
    name = models.CharField(max_length=255, unique=True)
    rights_class = models.CharField(
        max_length=40,
        choices=RightsClassChoices.choices,
        default=RightsClassChoices.BLOCKED,
        db_index=True
    )
    status = models.CharField(
        max_length=30,
        choices=RightsStatusChoices.choices,
        default=RightsStatusChoices.BLOCKED,
        db_index=True
    )
    permitted_fields = models.JSONField(default=list, blank=True)
    ai_use_permitted = models.BooleanField(
        default=False,
        help_text="Explicit consent for AI model inference and training processing"
    )
    suppression_sla_hours = models.IntegerField(default=24)

    class Meta:
        ordering = ['name']
        verbose_name = 'Rights Source'
        verbose_name_plural = 'Rights Sources'

    def __str__(self):
        return f"{self.name} [{self.get_rights_class_display()}] - {self.get_status_display()}"
