import uuid
from django.db import models
from apps.core.models import TimeStampedModel

class ReferralActionChoices(models.TextChoices):
    WHATSAPP_START = 'whatsapp_start', 'WhatsApp Chat Initiated'
    OUTBOUND_CLICK = 'outbound_click', 'Outbound Link Click'
    CALL_REVEAL = 'call_reveal', 'Phone Number Reveal'
    DIRECTIONS_OPEN = 'directions_open', 'Google Maps Directions Opened'
    QUOTE_SUBMITTED = 'quote_submitted', 'Commercial RFQ Submitted'
    RESERVE_INTENT = 'reserve_intent', 'Stock Reservation Intent'
    COMPARISON_VIEW = 'comparison_view', 'Multi-Seller Matrix View'
    SEARCH_RESULT_VIEW = 'search_result_view', 'Search Result View'
    ANSWER_VIEW = 'answer_view', 'AI Answer View'
    SHORT_VIEW = 'short_view', 'Short Video View'
    SHOW_VIEW = 'show_view', 'Show Episode View'
    MERCHANT_PROFILE_VIEW = 'merchant_profile_view', 'Merchant Profile View'
    DESTINATION_ACK = 'destination_ack', 'Destination Acknowledged'
    PURCHASE_CONFIRMED_EXTERNAL = 'purchase_confirmed_external', 'Purchase Confirmed at External Destination'

class ReferralEvent(TimeStampedModel):
    """
    Immutable action ledger tracking commercial actions, intent, and anti-fraud deduplication (v8.1 Part XIV).
    """
    event_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    occurred_at = models.DateTimeField(auto_now_add=True, db_index=True)
    country_code = models.CharField(max_length=2, default='ZA', db_index=True)
    session_fingerprint = models.CharField(max_length=255)
    source_campaign = models.CharField(max_length=150, blank=True, null=True)
    source_asset_qr_id = models.CharField(max_length=150, blank=True, null=True)
    
    offer = models.ForeignKey('offers.Offer', on_delete=models.SET_NULL, null=True, blank=True, related_name='referral_events')
    variant = models.ForeignKey('catalog.MasterProduct', on_delete=models.SET_NULL, null=True, blank=True, related_name='referral_events')
    merchant = models.ForeignKey('merchants.Merchant', on_delete=models.SET_NULL, null=True, blank=True, related_name='referral_events')
    market = models.ForeignKey('markets.Market', on_delete=models.SET_NULL, null=True, blank=True, related_name='referral_events')
    stall_ref = models.CharField(max_length=150, blank=True, null=True)
    
    action = models.CharField(max_length=50, choices=ReferralActionChoices.choices, default=ReferralActionChoices.WHATSAPP_START, db_index=True)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4, default=1.0000)
    dedupe_key = models.CharField(max_length=255, db_index=True)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-occurred_at']
        verbose_name = 'Referral Action Event'
        verbose_name_plural = 'Referral Action Events'

    def __str__(self):
        return f"Event {self.event_id}: {self.action} -> {self.merchant} at {self.occurred_at}"
