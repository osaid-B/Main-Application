from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.mixins import ActionSerializerMixin, QueryParamFilterMixin, TenantScopedQuerysetMixin
from apps.common.permissions import RoleMatrixPermission

from .models import Supplier, PurchaseOrder
from .serializers import (
    SupplierSerializer,
    PurchaseOrderSerializer,
    PurchaseOrderCreateSerializer,
    PurchaseOrderUpdateSerializer,
    PurchaseReceiveSerializer
)
from .services import PurchaseService

class SupplierViewSet(TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing Suppliers.
    Supports organization scoping, role-based permissions, and filtering.
    """
    serializer_class = SupplierSerializer
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager', 'staff'],
        'retrieve': ['admin', 'manager', 'staff'],
        'create': ['admin', 'manager'],
        'partial_update': ['admin', 'manager'],
        'destroy': ['admin'],
    }
    search_fields = ['name', 'supplier_code', 'contact_person', 'email']
    filter_mappings = {'status': 'status', 'is_active': 'is_active'}

    def get_queryset(self):
        queryset = Supplier.objects.all().order_by('name')
        queryset = self.scope_queryset(queryset)
        return self.apply_query_params(queryset)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class PurchaseOrderViewSet(ActionSerializerMixin, TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing Purchase Orders.
    Includes a custom 'receive' action for stock-in processing.
    """
    serializer_class = PurchaseOrderSerializer
    serializer_action_classes = {
        'partial_update': PurchaseOrderUpdateSerializer,
    }
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager', 'staff'],
        'retrieve': ['admin', 'manager', 'staff'],
        'create': ['admin', 'manager'],
        'partial_update': ['admin', 'manager'],
        'receive': ['admin', 'manager'],
        'destroy': ['admin'],
    }
    search_fields = ['po_number', 'supplier__name', 'notes']
    filter_mappings = {
        'supplier': 'supplier_id',
        'status': 'status',
        'payment_status': 'payment_status'
    }

    def get_queryset(self):
        queryset = PurchaseOrder.objects.select_related('supplier').prefetch_related('items__product').all()
        queryset = self.scope_queryset(queryset)
        return self.apply_query_params(queryset)

    def create(self, request, *args, **kwargs):
        serializer = PurchaseOrderCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        po = serializer.save()
        output = PurchaseOrderSerializer(po)
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        """
        Receives items from a Purchase Order and updates inventory.
        """
        po = self.get_object()
        serializer = PurchaseReceiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        PurchaseService.receive_items(
            po,
            received_by=request.user,
            items_payload=serializer.validated_data['items']
        )
        
        # Re-fetch with related fields to ensure fresh data in response
        po = PurchaseOrder.objects.select_related('supplier').prefetch_related('items__product').get(pk=po.pk)
        
        return Response(PurchaseOrderSerializer(po).data, status=status.HTTP_200_OK)
