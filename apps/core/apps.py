from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

    def ready(self):
        from .signals import install

        install([
            'catalog.MasterProduct',
            'catalog.ProductImage',
            'offers.Offer',
            'offers.DiscoveredOffer',
            'merchants.Merchant',
            'markets.Market',
            'media_hub.Short',
            'media_hub.Show',
        ])
