from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, PurchaseOrderViewSet

router = DefaultRouter()
router.register('suppliers', SupplierViewSet, basename='suppliers')
router.register('purchases', PurchaseOrderViewSet, basename='purchases')

urlpatterns = [
    path('', include(router.urls)),
]
