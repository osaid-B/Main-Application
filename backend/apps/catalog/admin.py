from django.contrib import admin
from .models import ProductCategory, Product, InventoryMovement

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'is_active')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_code', 'name', 'category', 'sell_price', 'available_stock')
    list_filter = ('organization', 'category')
    search_fields = ('name', 'product_code')

@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity_in', 'quantity_out', 'movement_date')
    list_filter = ('movement_type',)
