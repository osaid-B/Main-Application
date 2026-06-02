from django.contrib import admin
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('customer_code', 'name', 'organization', 'status')
    list_filter = ('organization', 'status')
    search_fields = ('name', 'customer_code', 'email')
