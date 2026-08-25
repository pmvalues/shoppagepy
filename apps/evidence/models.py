import uuid
from django.db import models
from apps.core.models import TimeStampedModel

class SourceTypeChoices(models.TextChoices):
    OFFICIAL_REGISTRY = 'official_registry', 'Official Public Registry (CIPC/SARS/CIDB)'
    DIRECT_MERCHANT = 'direct_merchant', 'Direct Merchant Confirmation (OTP/Auth)'
    FIELD_CADASTRE = 'field_cadastre', 'Field Auditor Physical Visit (GPS/Photo)'
    MANUFACTURER_DOC = 'manufacturer_doc', 'Manufacturer Datasheet / Engineering Spec'
    RETAILER_WEB_FEED = 'retailer_web_feed', 'Authorized Retailer Feed'
    PUBLIC_WEB_SWEEP = 'public_web_sweep', 'Public Web Sweep (Open Data)'

class ClaimTypeChoices(models.TextChoices):
    PRICE = 'price', 'Price Observation'
    STOCK_AVAILABILITY = 'stock_availability', 'Stock Availability'
    TECHNICAL_SPEC = 'technical_spec', 'Technical Specification'
    WARRANTY_TERMS = 'warranty_terms', 'Warranty Terms'
    COMPATIBILITY = 'compatibility', 'Device / Battery Compatibility'
    SPATIAL_LOCATION = 'spatial_location', 'Stall / Mall Physical Location'
    MERCHANT_IDENTITY = 'merchant_identity', 'Merchant Statutory Identity'
    STANDARDS_COMPLIANCE = 'standards_compliance', 'SABS / NRS 097 Compliance'

class ClaimStateChoices(models.TextChoices):
    CANDIDATE = 'candidate', 'Candidate (AI Generated / Pending Evidence)'
    VERIFIED = 'verified', 'Verified (Evidence Backed)'
    DISPUTED = 'disputed', 'Disputed'
    EXPIRED = 'expired', 'Expired / Stale'
    REJECTED = 'rejected', 'Rejected (False / Prohibited)'

class EvidenceArtifact(TimeStampedModel):
    """
    Captured, immutable source artifact supporting commercial claims.
    """
    artifact_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    source_type = models.CharField(max_length=40, choices=SourceTypeChoices.choices, default=SourceTypeChoices.PUBLIC_WEB_SWEEP, db_index=True)
    source_identifier = models.CharField(max_length=255, help_text="URL, document reference, or CIPC enterprise number")
    artifact_hash = models.CharField(max_length=64, db_index=True, help_text="SHA-256 payload checksum")
    raw_payload = models.JSONField(default=dict, blank=True)
    rights_source = models.ForeignKey('rights.RightsSource', on_delete=models.SET_NULL, null=True, blank=True, related_name='artifacts')
    captured_at = models.DateTimeField(auto_now_add=True, db_index=True)
    source_timestamp = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-captured_at']
        verbose_name = 'Evidence Artifact'
        verbose_name_plural = 'Evidence Artifacts'

    def __str__(self):
        return f"Artifact {self.artifact_hash[:8]} ({self.get_source_type_display()})"


class EvidenceClaim(TimeStampedModel):
    """
    Individual factual claim (price, stock, warranty, compatibility, location)
    tethered to supporting evidence artifacts.
    """
    claim_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    claim_type = models.CharField(max_length=40, choices=ClaimTypeChoices.choices, db_index=True)
    subject_entity_type = models.CharField(max_length=50, help_text="e.g. MasterProduct, Offer, Merchant, Market")
    subject_entity_id = models.CharField(max_length=120, db_index=True)
    
    claim_key = models.CharField(max_length=100, help_text="e.g. priceZar, nrs097Certified, stallNumber")
    claim_value = models.JSONField(default=dict)
    
    state = models.CharField(max_length=30, choices=ClaimStateChoices.choices, default=ClaimStateChoices.CANDIDATE, db_index=True)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4, default=0.8500)
    
    primary_artifact = models.ForeignKey(EvidenceArtifact, on_delete=models.SET_NULL, null=True, blank=True, related_name='claims')
    verified_by = models.CharField(max_length=150, blank=True, null=True, help_text="Field Auditor, System Rule, or Merchant ID")
    verified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-confidence_score', '-created_at']
        verbose_name = 'Evidence Claim'
        verbose_name_plural = 'Evidence Claims'

    def __str__(self):
        return f"Claim: {self.subject_entity_type}:{self.subject_entity_id} [{self.claim_key}] - {self.get_state_display()}"


class EvidenceObservation(TimeStampedModel):
    """
    Specific time-bounded observation event connecting an artifact to a claim.
    """
    observation_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    claim = models.ForeignKey(EvidenceClaim, on_delete=models.CASCADE, related_name='observations')
    artifact = models.ForeignKey(EvidenceArtifact, on_delete=models.CASCADE, related_name='observations')
    observed_value = models.JSONField(default=dict)
    observer_identity = models.CharField(max_length=150, default='system_ingestion_pipeline')
    observed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-observed_at']
        verbose_name = 'Evidence Observation'
        verbose_name_plural = 'Evidence Observations'

    def __str__(self):
        return f"Obs {self.observation_id}: Claim {self.claim_id} at {self.observed_at}"
