from django.contrib import admin
from .models import Invoice, InvoiceItem, Payment

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'customer', 'total_amount', 'status', 'invoice_date')
    list_filter = ('organization', 'status')
    inlines = [InvoiceItemInline]

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_number', 'invoice', 'amount', 'status', 'payment_date')
    list_filter = ('organization', 'status')
