from django.conf import settings
from django.db import models

from apps.common.models import TenantScopedModel

class BusinessProfile(TenantScopedModel):
    legal_name = models.CharField(max_length=255)
    business_email = models.EmailField(blank=True)
    business_phone = models.CharField(max_length=50, blank=True)
    address = models.CharField(max_length=255, blank=True)
    tax_number = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['legal_name']

    def __str__(self):
        return self.legal_name

class AppSetting(TenantScopedModel):
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='app_settings_updated',
    )
    setting_key = models.CharField(max_length=120)
    setting_value = models.TextField()
    value_type = models.CharField(max_length=20, default='string')

    class Meta:
        ordering = ['setting_key']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'setting_key'], name='uniq_setting_key_per_org'),
        ]

    def __str__(self):
        return self.setting_key
