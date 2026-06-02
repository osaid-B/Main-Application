from rest_framework import serializers
from apps.catalog.serializers import ProductSerializer
from .models import Supplier, PurchaseOrder, PurchaseOrderItem
from .services import PurchaseService

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            'id', 'supplier_code', 'name', 'contact_person', 'phone', 'email',
            'address', 'payment_terms', 'currency', 'tax_number', 'status',
            'notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['supplier_code', 'created_at', 'updated_at']

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'product', 'product_name', 'product_code', 'quantity_ordered',
            'quantity_received', 'unit_price', 'line_total'
        ]

class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name', 'order_date',
            'expected_delivery_date', 'status', 'payment_status',
            'subtotal_amount', 'total_amount', 'received_amount', 'notes',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'po_number', 'status', 'payment_status',
            'subtotal_amount', 'total_amount', 'received_amount',
            'created_at', 'updated_at',
        ]

class PurchaseOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = ['order_date', 'expected_delivery_date', 'notes']

class PurchaseOrderItemWriteSerializer(serializers.Serializer):
    product = serializers.UUIDField()
    quantity_ordered = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)

class PurchaseOrderCreateSerializer(serializers.Serializer):
    supplier = serializers.UUIDField()
    order_date = serializers.DateField(required=False)
    expected_delivery_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = PurchaseOrderItemWriteSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def create(self, validated_data):
        request = self.context['request']
        return PurchaseService.create_purchase_order(
            organization=request.user.organization,
            created_by=request.user,
            validated_data=validated_data
        )

class PurchaseReceiveItemSerializer(serializers.Serializer):
    item_id = serializers.UUIDField()
    quantity_received = serializers.IntegerField(min_value=1)

class PurchaseReceiveSerializer(serializers.Serializer):
    items = PurchaseReceiveItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item must be received.")
        return value
