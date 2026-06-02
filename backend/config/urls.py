from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.accounts.views import AuthViewSet, EmployeeViewSet
from apps.organizations.views import OrganizationViewSet
from apps.app_settings.views import SettingsViewSet
from apps.billing.views import InvoiceViewSet, PaymentViewSet
from apps.catalog.views import ProductCategoryViewSet, ProductViewSet
from apps.purchases.views import SupplierViewSet, PurchaseOrderViewSet
from apps.common.views import HealthCheckView
from apps.crm.views import CustomerViewSet
from apps.dashboard.views import DashboardViewSet

router = DefaultRouter()
router.register('organizations', OrganizationViewSet, basename='organizations')
router.register('auth', AuthViewSet, basename='auth')
router.register('employees', EmployeeViewSet, basename='employees')
router.register('customers', CustomerViewSet, basename='customers')
router.register('product-categories', ProductCategoryViewSet, basename='product-categories')
router.register('products', ProductViewSet, basename='products')
router.register('suppliers', SupplierViewSet, basename='suppliers')
router.register('purchases', PurchaseOrderViewSet, basename='purchases')
router.register('invoices', InvoiceViewSet, basename='invoices')
router.register('payments', PaymentViewSet, basename='payments')
router.register('dashboard', DashboardViewSet, basename='dashboard')
router.register('settings', SettingsViewSet, basename='settings')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', HealthCheckView.as_view(), name='health'),
    path('api/v1/', include(router.urls)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
