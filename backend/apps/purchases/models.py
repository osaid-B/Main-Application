from django.conf import settings
from django.db import models

from apps.common.models import TenantScopedModel, UUIDTimeStampedModel
from apps.common.utils import generate_scoped_sequence

class Supplier(TenantScopedModel):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'

    supplier_code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    payment_terms = models.CharField(max_length=120, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    tax_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'supplier_code'], name='uniq_supplier_code_per_org'),
        ]

    def save(self, *args, **kwargs):
        if not self.supplier_code:
            self.supplier_code = generate_scoped_sequence(Supplier, self.organization, 'supplier_code', 'SUP')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class PurchaseOrder(TenantScopedModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING = 'pending', 'Pending'
        PARTIALLY_RECEIVED = 'partially_received', 'Partially Received'
        RECEIVED = 'received', 'Received'
        CANCELLED = 'cancelled', 'Cancelled'

    class PaymentStatus(models.TextChoices):
        UNPAID = 'unpaid', 'Unpaid'
        PARTIAL = 'partial', 'Partial'
        PAID = 'paid', 'Paid'

    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='purchase_orders',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchase_orders_created',
    )
    po_number = models.CharField(max_length=50)
    order_date = models.DateField()
    expected_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    subtotal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    received_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-order_date', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'po_number'], name='uniq_po_number_per_org'),
        ]

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = generate_scoped_sequence(PurchaseOrder, self.organization, 'po_number', 'PO')
        super().save(*args, **kwargs)

    def __str__(self):
        return self.po_number

class PurchaseOrderItem(UUIDTimeStampedModel):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'catalog.Product',
        on_delete=models.PROTECT,
        related_name='purchase_items',
    )
    quantity_ordered = models.PositiveIntegerField()
    quantity_received = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.purchase_order.po_number} - {self.product.name}'
