from django.contrib import admin
from .models import Supplier, PurchaseOrder, PurchaseOrderItem

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('supplier_code', 'name', 'contact_person', 'email', 'status', 'is_active')
    search_fields = ('name', 'supplier_code', 'email')
    list_filter = ('status', 'is_active', 'organization')

class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'supplier', 'order_date', 'status', 'payment_status', 'total_amount')
    search_fields = ('po_number', 'supplier__name')
    list_filter = ('status', 'payment_status', 'organization')
    inlines = [PurchaseOrderItemInline]
