from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.catalog.services import InventoryService
from apps.common.utils import normalize_decimal
from .models import Supplier, PurchaseOrder, PurchaseOrderItem

class PurchaseService:
    @classmethod
    @transaction.atomic
    def create_purchase_order(cls, *, organization, created_by, validated_data):
        items_data = validated_data.pop('items')
        
        # Validate supplier
        supplier_id = validated_data.pop('supplier')
        supplier = Supplier.objects.filter(organization=organization, id=supplier_id, is_active=True).first()
        if not supplier:
            raise ValidationError({'supplier': 'Supplier not found or inactive.'})

        subtotal = Decimal('0.00')
        for item in items_data:
            line_total = normalize_decimal(item['unit_price']) * item['quantity_ordered']
            item['line_total'] = normalize_decimal(line_total)
            subtotal += item['line_total']

        po = PurchaseOrder.objects.create(
            organization=organization,
            supplier=supplier,
            created_by=created_by,
            order_date=validated_data.get('order_date') or timezone.localdate(),
            expected_delivery_date=validated_data.get('expected_delivery_date'),
            subtotal_amount=normalize_decimal(subtotal),
            total_amount=normalize_decimal(subtotal),
            status=PurchaseOrder.Status.PENDING,
            notes=validated_data.get('notes', ''),
        )

        from apps.catalog.models import Product
        
        for item in items_data:
            product = Product.objects.filter(organization=organization, id=item['product']).first()
            if not product:
                raise ValidationError({'items': f"Product {item['product']} not found."})
                
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product=product,
                quantity_ordered=item['quantity_ordered'],
                unit_price=normalize_decimal(item['unit_price']),
                line_total=item['line_total'],
            )
        
        return po

    @classmethod
    @transaction.atomic
    def receive_items(cls, po, *, received_by, items_payload):
        if po.status == PurchaseOrder.Status.CANCELLED:
            raise ValidationError({'purchase_order': 'Cancelled orders cannot be received.'})
        if po.status == PurchaseOrder.Status.RECEIVED:
            raise ValidationError({'purchase_order': 'This order has already been fully received.'})

        any_received = False
        received_amount_delta = Decimal('0.00')
        for item_data in items_payload:
            item_id = item_data['item_id']
            qty_to_receive = int(item_data['quantity_received'])
            
            if qty_to_receive <= 0:
                continue
                
            po_item = po.items.filter(id=item_id).first()
            if not po_item:
                raise ValidationError({'items': f'Item {item_id} not found in this purchase order.'})
            
            remaining_to_receive = po_item.quantity_ordered - po_item.quantity_received
            if qty_to_receive > remaining_to_receive:
                raise ValidationError({'items': f'Cannot receive {qty_to_receive} for {po_item.product.name}. Only {remaining_to_receive} remaining.'})

            # Update item
            po_item.quantity_received += qty_to_receive
            po_item.save(update_fields=['quantity_received'])
            received_amount_delta += normalize_decimal(po_item.unit_price * qty_to_receive)

            # Create Inventory Movement
            InventoryService.create_purchase_movement(
                organization=po.organization,
                created_by=received_by,
                product=po_item.product,
                purchase_order=po,
                quantity=qty_to_receive,
                unit_cost=po_item.unit_price,
                movement_date=timezone.localdate(),
                notes=f'Received for {po.po_number}',
            )
            any_received = True

        if any_received:
            # Update PO status using fresh DB aggregate to avoid stale prefetched values
            from django.db.models import Sum
            totals = po.items.aggregate(
                total_ordered=Sum('quantity_ordered'),
                total_received=Sum('quantity_received')
            )
            
            total_ordered = totals['total_ordered'] or 0
            total_received = totals['total_received'] or 0
            po.received_amount = normalize_decimal(po.received_amount + received_amount_delta)
            
            if total_received >= total_ordered:
                po.status = PurchaseOrder.Status.RECEIVED
            else:
                po.status = PurchaseOrder.Status.PARTIALLY_RECEIVED
            
            po.save(update_fields=['status', 'received_amount', 'updated_at'])
            
        return po
