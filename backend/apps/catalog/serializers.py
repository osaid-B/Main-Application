from rest_framework import serializers

from .models import InventoryMovement, Product, ProductCategory

class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    available_stock = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'product_code', 'name', 'sku', 'category', 'category_name', 'sell_price',
            'opening_stock', 'reorder_level', 'is_active', 'available_stock', 'stock_status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['product_code', 'available_stock', 'stock_status', 'created_at', 'updated_at']

    def get_available_stock(self, obj):
        return obj.available_stock

    def get_stock_status(self, obj):
        return obj.stock_status

class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = InventoryMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'reference_type', 'reference_id',
            'quantity_in', 'quantity_out', 'unit_cost', 'movement_date', 'notes',
            'created_by_username', 'created_at', 'updated_at',
        ]
