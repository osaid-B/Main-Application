from django.core.management.base import BaseCommand
from apps.organizations.models import Organization
from apps.accounts.models import User, Role, EmployeeProfile
from apps.crm.models import Customer
from apps.catalog.models import ProductCategory, Product
from apps.billing.models import Invoice
from apps.billing.services import InvoiceService
from decimal import Decimal
import uuid

class Command(BaseCommand):
    help = 'Seed database with demo data'

    def handle(self, *args, **options):
        org, _ = Organization.objects.get_or_create(name='Demo Corp', slug='demo-corp')
        
        user, created = User.objects.get_or_create(
            username='demo_user',
            defaults={'email': 'demo@example.com', 'organization': org}
        )
        if created:
            user.set_password('demo1234')
            user.save()

        role, _ = Role.objects.get_or_create(organization=org, code='admin', defaults={'name': 'Administrator'})
        EmployeeProfile.objects.get_or_create(user=user, defaults={'role': role, 'full_name': 'Demo Administrator', 'organization': org})

        cat, _ = ProductCategory.objects.get_or_create(organization=org, name='Electronics')
        p1, _ = Product.objects.get_or_create(organization=org, category=cat, name='Laptop Pro', defaults={'sell_price': 1200, 'opening_stock': 10})
        p2, _ = Product.objects.get_or_create(organization=org, category=cat, name='Wireless Mouse', defaults={'sell_price': 25, 'opening_stock': 50})

        cus, _ = Customer.objects.get_or_create(organization=org, name='Acme Inc', defaults={'customer_code': 'CUS-001'})

        # Create a demo invoice via service
        if not Invoice.objects.filter(organization=org).exists():
            InvoiceService.create_invoice(
                organization=org,
                created_by=user,
                validated_data={
                    'customer': cus.id,
                    'notes': 'Demo Invoice',
                    'items': [
                        {'product': p1.id, 'quantity': 1, 'unit_price': 1200},
                        {'product': p2.id, 'quantity': 2, 'unit_price': 25},
                    ]
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo data'))
