from django.contrib import admin
from .models import AppSetting, BusinessProfile

@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ('legal_name', 'organization', 'business_email', 'business_phone')
    search_fields = ('legal_name', 'business_email', 'business_phone')

@admin.register(AppSetting)
class AppSettingAdmin(admin.ModelAdmin):
    list_display = ('setting_key', 'organization', 'value_type', 'updated_by')
    search_fields = ('setting_key', 'setting_value')
    list_filter = ('organization', 'value_type')
