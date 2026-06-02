from django.db.models import Sum

from .models import InventoryMovement, Product

class InventoryService:
    @staticmethod
    def get_available_stock(product: Product) -> int:
        aggregates = product.inventory_movements.aggregate(
            stock_in=Sum('quantity_in'),
            stock_out=Sum('quantity_out'),
        )
        return product.opening_stock + (aggregates.get('stock_in') or 0) - (aggregates.get('stock_out') or 0)

    @staticmethod
    def create_sale_movement(*, organization, created_by, product, invoice, quantity, unit_cost, movement_date, notes=''):
        return InventoryMovement.objects.create(
            organization=organization,
            created_by=created_by,
            product=product,
            movement_type=InventoryMovement.MovementType.SALE,
            reference_type='invoice',
            reference_id=invoice.id,
            quantity_out=quantity,
            quantity_in=0,
            unit_cost=unit_cost,
            movement_date=movement_date,
            notes=notes,
        )

    @staticmethod
    def create_reversal_movement(*, organization, created_by, product, invoice, quantity, unit_cost, movement_date, notes=''):
        return InventoryMovement.objects.create(
            organization=organization,
            created_by=created_by,
            product=product,
            movement_type=InventoryMovement.MovementType.REVERSAL,
            reference_type='invoice',
            reference_id=invoice.id,
            quantity_out=0,
            quantity_in=quantity,
            unit_cost=unit_cost,
            movement_date=movement_date,
            notes=notes,
        )

    @staticmethod
    def create_purchase_movement(*, organization, created_by, product, purchase_order, quantity, unit_cost, movement_date, notes=''):
        return InventoryMovement.objects.create(
            organization=organization,
            created_by=created_by,
            product=product,
            movement_type=InventoryMovement.MovementType.PURCHASE,
            reference_type='purchase_order',
            reference_id=purchase_order.id,
            quantity_in=quantity,
            quantity_out=0,
            unit_cost=unit_cost,
            movement_date=movement_date,
            notes=notes,
        )

    @staticmethod
    def stock_history(product: Product):
        return product.inventory_movements.select_related('created_by').order_by('-movement_date', '-created_at')

class ProductService:
    @staticmethod
    def create_product(serializer, organization, created_by):
        serializer.save(organization=organization, created_by=created_by)
