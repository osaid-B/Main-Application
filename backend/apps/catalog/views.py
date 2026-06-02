from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets

from apps.common.mixins import QueryParamFilterMixin, TenantScopedQuerysetMixin
from apps.common.permissions import RoleMatrixPermission

from .models import Product, ProductCategory
from .serializers import InventoryMovementSerializer, ProductCategorySerializer, ProductSerializer
from .services import InventoryService, ProductService

class ProductCategoryViewSet(TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    serializer_class = ProductCategorySerializer
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager', 'staff'],
        'retrieve': ['admin', 'manager', 'staff'],
        'create': ['admin', 'manager'],
        'partial_update': ['admin', 'manager'],
        'destroy': ['admin'],
    }
    search_fields = ['name', 'description']
    filter_mappings = {'is_active': 'is_active'}

    def get_queryset(self):
        queryset = ProductCategory.objects.all().order_by('name')
        queryset = self.scope_queryset(queryset)
        return self.apply_query_params(queryset)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class ProductViewSet(TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager', 'staff'],
        'retrieve': ['admin', 'manager', 'staff'],
        'stock_history': ['admin', 'manager', 'staff'],
        'create': ['admin', 'manager'],
        'partial_update': ['admin', 'manager'],
        'destroy': ['admin'],
    }
    search_fields = ['product_code', 'name', 'sku', 'category__name']
    filter_mappings = {
        'category': 'category_id',
        'is_active': 'is_active',
    }

    def get_queryset(self):
        queryset = Product.objects.select_related('category', 'organization').all().order_by('name')
        queryset = self.scope_queryset(queryset)
        queryset = self.apply_query_params(queryset)
        stock_status = self.request.query_params.get('stock_status')
        if stock_status:
            queryset = [product for product in queryset if product.stock_status == stock_status]
        return queryset

    def perform_create(self, serializer):
        ProductService.create_product(serializer, self.request.user.organization, self.request.user)

    @action(detail=True, methods=['get'], url_path='stock-history')
    def stock_history(self, request, pk=None):
        product = self.get_object()
        history = InventoryService.stock_history(product)
        serializer = InventoryMovementSerializer(history, many=True)
        return Response(serializer.data)
