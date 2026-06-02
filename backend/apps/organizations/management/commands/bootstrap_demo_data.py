from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.accounts.models import EmployeeProfile, Role, User
from apps.app_settings.models import AppSetting, BusinessProfile
from apps.organizations.models import Organization

class Command(BaseCommand):
    help = 'Bootstrap one demo organization, default roles, and an admin user.'

    def add_arguments(self, parser):
        parser.add_argument('--organization', default='Acme Demo')
        parser.add_argument('--admin-username', default='admin')
        parser.add_argument('--admin-email', default='admin@example.com')
        parser.add_argument('--admin-password', default='admin12345')
        parser.add_argument('--currency', default='USD')
        parser.add_argument('--timezone', default='UTC')

    def handle(self, *args, **options):
        org_name = options['organization']
        organization, _ = Organization.objects.get_or_create(
            slug=slugify(org_name),
            defaults={
                'name': org_name,
                'currency': options['currency'],
                'timezone': options['timezone'],
            },
        )

        roles = {}
        for name, code, description in [
            ('Admin', 'admin', 'Full access'),
            ('Manager', 'manager', 'Department-level access'),
            ('Staff', 'staff', 'Operational access'),
        ]:
            role, _ = Role.objects.get_or_create(
                organization=organization,
                code=code,
                defaults={'name': name, 'description': description},
            )
            roles[code] = role

        admin_user, created = User.objects.get_or_create(
            username=options['admin_username'],
            defaults={
                'organization': organization,
                'email': options['admin_email'],
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin_user.set_password(options['admin_password'])
            admin_user.save()
        else:
            changed = False
            if admin_user.organization_id != organization.id:
                admin_user.organization = organization
                changed = True
            if admin_user.email != options['admin_email']:
                admin_user.email = options['admin_email']
                changed = True
            if changed:
                admin_user.save()

        EmployeeProfile.objects.get_or_create(
            organization=organization,
            user=admin_user,
            defaults={
                'role': roles['admin'],
                'full_name': 'System Administrator',
                'job_title': 'Administrator',
            },
        )

        BusinessProfile.objects.get_or_create(
            organization=organization,
            defaults={
                'legal_name': org_name,
                'business_email': options['admin_email'],
            },
        )

        defaults = {
            'invoice_prefix': 'INV',
            'payment_prefix': 'PAY',
            'default_currency': organization.currency,
        }
        for key, value in defaults.items():
            AppSetting.objects.get_or_create(
                organization=organization,
                setting_key=key,
                defaults={'setting_value': value, 'value_type': 'string', 'updated_by': admin_user},
            )

        self.stdout.write(self.style.SUCCESS(
            f'Bootstrapped organization={organization.slug} admin={admin_user.username}'
        ))
