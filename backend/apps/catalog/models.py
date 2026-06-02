from django.conf import settings
from django.db import models
from django.db.models import Sum

from apps.common.models import TenantScopedModel
from apps.common.utils import generate_scoped_sequence

class ProductCategory(TenantScopedModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'name'], name='uniq_product_category_per_org'),
        ]

    def __str__(self):
        return self.name

class Product(TenantScopedModel):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products_created',
    )
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,
        related_name='products',
    )
    product_code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=64, blank=True)
    sell_price = models.DecimalField(max_digits=12, decimal_places=2)
    opening_stock = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'product_code'], name='uniq_product_code_per_org'),
        ]

    def save(self, *args, **kwargs):
        if not self.product_code:
            self.product_code = generate_scoped_sequence(Product, self.organization, 'product_code', 'PRD')
        super().save(*args, **kwargs)

    @property
    def available_stock(self):
        aggregates = self.inventory_movements.aggregate(
            stock_in=Sum('quantity_in'),
            stock_out=Sum('quantity_out'),
        )
        stock_in = aggregates.get('stock_in') or 0
        stock_out = aggregates.get('stock_out') or 0
        return self.opening_stock + stock_in - stock_out

    @property
    def stock_status(self):
        if self.available_stock <= 0:
            return 'out_of_stock'
        if self.available_stock <= self.reorder_level:
            return 'low_stock'
        return 'in_stock'

    def __str__(self):
        return self.name

class InventoryMovement(TenantScopedModel):
    class MovementType(models.TextChoices):
        OPENING = 'opening', 'Opening'
        SALE = 'invoice_sale', 'Invoice sale'
        PURCHASE = 'purchase_receive', 'Purchase receive'
        REVERSAL = 'invoice_reversal', 'Invoice reversal'
        ADJUSTMENT = 'adjustment', 'Adjustment'

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='inventory_movements',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_movements_created',
    )
    movement_type = models.CharField(max_length=40, choices=MovementType.choices)
    reference_type = models.CharField(max_length=40, blank=True)
    reference_id = models.UUIDField(null=True, blank=True)
    quantity_in = models.PositiveIntegerField(default=0)
    quantity_out = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    movement_date = models.DateField()
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-movement_date', '-created_at']

    def __str__(self):
        return f'{self.product} - {self.movement_type}'
