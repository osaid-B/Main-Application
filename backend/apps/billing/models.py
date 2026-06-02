from django.conf import settings
from django.db import models

from apps.common.models import TenantScopedModel, UUIDTimeStampedModel
from apps.common.utils import generate_scoped_sequence

class Invoice(TenantScopedModel):
    class Status(models.TextChoices):
        DEBT = 'debt', 'Debt'
        PARTIAL = 'partial', 'Partial'
        PAID = 'paid', 'Paid'
        CANCELLED = 'cancelled', 'Cancelled'

    customer = models.ForeignKey(
        'crm.Customer',
        on_delete=models.PROTECT,
        related_name='invoices',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices_created',
    )
    invoice_number = models.CharField(max_length=50)
    invoice_date = models.DateField()
    subtotal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DEBT)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'invoice_number'], name='uniq_invoice_number_per_org'),
        ]

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_scoped_sequence(Invoice, self.organization, 'invoice_number', 'INV')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_number

class InvoiceItem(UUIDTimeStampedModel):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='invoice_items',
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.invoice.invoice_number} - {self.product.name}'

class Payment(TenantScopedModel):
    class Status(models.TextChoices):
        POSTED = 'posted', 'Posted'
        PENDING = 'pending', 'Pending'
        VOID = 'void', 'Void'

    customer = models.ForeignKey(
        'crm.Customer',
        on_delete=models.PROTECT,
        related_name='payments',
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='payments',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments_created',
    )
    payment_number = models.CharField(max_length=50)
    payment_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.POSTED)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'payment_number'], name='uniq_payment_number_per_org'),
        ]

    def save(self, *args, **kwargs):
        if not self.payment_number:
            self.payment_number = generate_scoped_sequence(Payment, self.organization, 'payment_number', 'PAY')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.payment_number
