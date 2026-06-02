from django.contrib import admin
from .models import User, Role, EmployeeProfile

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'organization', 'is_staff', 'is_active')
    list_filter = ('organization', 'is_staff', 'is_active')
    search_fields = ('username', 'email')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'organization', 'is_active')
    list_filter = ('organization',)

@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'job_title', 'organization', 'is_active')
    list_filter = ('organization',)
