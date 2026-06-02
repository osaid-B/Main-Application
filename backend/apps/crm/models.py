from django.conf import settings
from django.db import models

from apps.common.models import TenantScopedModel
from apps.common.utils import generate_scoped_sequence

class Customer(TenantScopedModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        BLOCKED = 'blocked', 'Blocked'

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers_created',
    )
    customer_code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'customer_code'], name='uniq_customer_code_per_org'),
        ]

    def save(self, *args, **kwargs):
        if not self.customer_code:
            self.customer_code = generate_scoped_sequence(Customer, self.organization, 'customer_code', 'CUS')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
