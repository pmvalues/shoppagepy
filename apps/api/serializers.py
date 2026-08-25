from rest_framework import serializers
from apps.catalog.models import MasterProduct
from apps.merchants.models import Merchant, TrustPassport
from apps.markets.models import Market
from apps.offers.models import Offer, DiscoveredOffer
from apps.media_hub.models import Show, Short
from apps.referrals.models import ReferralEvent

class MerchantSerializer(serializers.ModelSerializer):
    market_name = serializers.CharField(source='market.name', read_only=True)

    class Meta:
        model = Merchant
        fields = [
            'id', 'canonical_id', 'name', 'country', 'claim_state', 'verification_state',
            'whatsapp_number', 'telephone', 'email', 'website_url', 'market', 'market_name',
            'stall_identifier', 'category', 'address_text', 'province', 'latitude', 'longitude',
            'google_rating', 'google_reviews_count', 'google_maps_url', 'bbbee_level',
            'tax_compliance_pin', 'cidb_grade', 'trust_score', 'years_in_business',
            'median_response_minutes', 'delivery_options', 'payment_methods', 'facilities',
            'languages_spoken', 'storefront_photo_url'
        ]

class OfferSerializer(serializers.ModelSerializer):
    merchant = MerchantSerializer(read_only=True)
    product_title = serializers.CharField(source='variant.title', read_only=True)

    class Meta:
        model = Offer
        fields = [
            'id', 'canonical_id', 'variant', 'product_title', 'merchant', 'destination_type',
            'destination_url', 'stall_ref', 'price_amount', 'currency', 'availability_state',
            'sla_class', 'last_confirmed_at'
        ]

class DiscoveredOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscoveredOffer
        fields = '__all__'

class MasterProductSerializer(serializers.ModelSerializer):
    offers = OfferSerializer(many=True, read_only=True)
    discovered_offers = DiscoveredOfferSerializer(many=True, read_only=True)

    class Meta:
        model = MasterProduct
        fields = [
            'id', 'canonical_id', 'title', 'brand', 'model_number', 'category_ref',
            'gtin13', 'gtin14', 'mpn', 'status', 'attributes', 'aliases', 'compliance',
            'reviews_summary', 'guides', 'media_items', 'offers', 'discovered_offers'
        ]

class MarketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Market
        fields = [
            'id', 'name', 'canonical_slug', 'market_type', 'country', 'province', 'metro',
            'parent_market', 'verification_state', 'street_address', 'latitude', 'longitude',
            'stall_capacity', 'active_merchants_count', 'landmarks', 'safety_notices'
        ]

class ShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Show
        fields = '__all__'

class ShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Short
        fields = '__all__'

class ReferralEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralEvent
        fields = '__all__'
