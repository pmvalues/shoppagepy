from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates a default superuser for Wagtail & Django Admin if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@shoppage.co.za', 'admin')
            self.stdout.write(self.style.SUCCESS("[OK] Created default Django superuser: username='admin', password='admin'"))
        else:
            self.stdout.write(self.style.NOTICE("[INFO] Superuser 'admin' already exists"))
