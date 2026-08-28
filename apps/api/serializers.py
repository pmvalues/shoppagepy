from apps.catalog.models import MasterProduct, ProductImage
from apps.markets.models import Market
from apps.media_hub.models import Short, Show
from apps.merchants.models import Merchant
from apps.offers.models import DiscoveredOffer, Offer
from apps.referrals.models import ReferralEvent
from rest_framework import serializers


class ProductImageSerializer(serializers.ModelSerializer):
    alt = serializers.CharField(source='effective_alt', read_only=True)

    class Meta:
        model = ProductImage
        fields = ['url', 'alt', 'width', 'height', 'source']


class MerchantSerializer(serializers.ModelSerializer):
    market_name = serializers.CharField(source='market.name', read_only=True)
    primary_category = serializers.CharField(read_only=True)
    resolved_timezone = serializers.CharField(read_only=True)
    hours_label = serializers.CharField(read_only=True)
    is_claimed = serializers.BooleanField(read_only=True)
    open_now = serializers.SerializerMethodField()

    class Meta:
        model = Merchant
        fields = [
            'id', 'canonical_id', 'name', 'country', 'claim_state', 'verification_state',
            'whatsapp_number', 'telephone', 'email', 'website_url', 'market', 'market_name',
            'stall_identifier', 'category', 'primary_category', 'profile_categories',
            'address_text', 'province', 'locality', 'postal_code', 'latitude', 'longitude',
            'google_rating', 'google_reviews_count', 'google_reviews_url', 'google_maps_url',
            'operating_hours', 'opening_hours', 'timezone', 'resolved_timezone', 'hours_label',
            'open_now', 'appointment_url', 'bbbee_level', 'cipc_enterprise_number',
            'tax_compliance_pin', 'cidb_grade', 'trust_score', 'years_in_business',
            'median_response_minutes', 'delivery_options', 'payment_methods', 'facilities',
            'languages_spoken', 'storefront_photo_url', 'is_claimed', 'updated_at',
        ]

    def get_open_now(self, obj):
        return obj.open_now


class OfferSerializer(serializers.ModelSerializer):
    merchant = MerchantSerializer(read_only=True)
    product_title = serializers.CharField(source='variant.title', read_only=True)
    product_canonical_id = serializers.CharField(source='variant.canonical_id', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    schema_availability = serializers.CharField(read_only=True)
    confirmed_age_hours = serializers.FloatField(read_only=True)

    class Meta:
        model = Offer
        fields = [
            'id', 'canonical_id', 'variant', 'product_title', 'product_canonical_id',
            'merchant', 'destination_type', 'destination_url', 'stall_ref', 'price_amount',
            'currency', 'availability_state', 'schema_availability', 'sla_class',
            'last_confirmed_at', 'confirmed_age_hours', 'expires_at', 'is_expired',
        ]


class DiscoveredOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscoveredOffer
        fields = [
            'id', 'canonical_id', 'master_product', 'merchant', 'merchant_name',
            'source_website', 'source_url', 'discovered_price_amount', 'raw_price_text',
            'currency', 'availability_text', 'discovery_source', 'confidence_score',
            'location_hint', 'sku', 'observed_at', 'is_stale',
        ]


class MasterProductSerializer(serializers.ModelSerializer):
    offers = OfferSerializer(many=True, read_only=True)
    discovered_offers = DiscoveredOfferSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    identifiers = serializers.SerializerMethodField()
    lowest_price = serializers.SerializerMethodField()
    offer_count = serializers.SerializerMethodField()

    class Meta:
        model = MasterProduct
        fields = [
            'id', 'canonical_id', 'seo_handle', 'title', 'brand', 'model_number',
            'category_ref', 'description', 'status', 'condition_type',
            'gtin8', 'gtin12', 'gtin13', 'gtin14', 'mpn', 'asin', 'identifiers',
            'handle', 'tags', 'bullet_points', 'attributes', 'aliases', 'compliance',
            'reviews_summary', 'guides', 'media_items', 'images', 'family_ref',
            'unit_weight_grams', 'unit_dimensions_mm', 'country_of_origin',
            'offers', 'discovered_offers', 'lowest_price', 'offer_count',
            'meta_title', 'meta_description', 'created_at', 'updated_at',
        ]

    def get_identifiers(self, obj):
        data = dict(obj.gtin_pairs)
        if obj.mpn:
            data['mpn'] = obj.mpn
        if obj.asin:
            data['asin'] = obj.asin
        data['sku'] = obj.canonical_id
        return data

    def get_lowest_price(self, obj):
        priced = [o for o in obj.offers.all() if o.price_amount and o.availability_state != 'hidden']
        if not priced:
            return None
        best = min(priced, key=lambda o: o.price_amount)
        return {'amount': str(best.price_amount), 'currency': best.currency, 'offer': best.canonical_id}

    def get_offer_count(self, obj):
        return len([o for o in obj.offers.all() if o.availability_state != 'hidden'])


class MarketSerializer(serializers.ModelSerializer):
    primary_image = serializers.CharField(source='public_image_url', read_only=True)
    hours_label = serializers.CharField(read_only=True)
    resolved_timezone = serializers.CharField(read_only=True)
    open_now = serializers.SerializerMethodField()

    class Meta:
        model = Market
        fields = [
            'id', 'name', 'canonical_slug', 'market_type', 'country', 'province', 'metro',
            'locality', 'postal_code', 'parent_market', 'verification_state', 'street_address',
            'latitude', 'longitude', 'google_maps_url', 'google_place_id', 'operating_hours',
            'opening_hours', 'timezone', 'resolved_timezone', 'hours_label', 'open_now',
            'image_url', 'primary_image', 'stall_capacity', 'active_merchants_count',
            'landmarks', 'safety_notices', 'meta_title', 'meta_description', 'updated_at',
        ]

    def get_open_now(self, obj):
        return obj.open_now


class ShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Show
        fields = '__all__'


class ShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Short
        fields = '__all__'


class ReferralEventSerializer(serializers.ModelSerializer):
    """Read-only: attribution events are written by the platform, not by callers."""

    class Meta:
        model = ReferralEvent
        fields = '__all__'
        read_only_fields = [field.name for field in ReferralEvent._meta.get_fields() if hasattr(field, 'name')]
