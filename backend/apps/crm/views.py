from rest_framework import viewsets

from apps.common.mixins import QueryParamFilterMixin, TenantScopedQuerysetMixin
from apps.common.permissions import RoleMatrixPermission

from .models import Customer
from .serializers import CustomerSerializer
from .services import CustomerService

class CustomerViewSet(TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager', 'staff'],
        'retrieve': ['admin', 'manager', 'staff'],
        'create': ['admin', 'manager', 'staff'],
        'partial_update': ['admin', 'manager', 'staff'],
        'destroy': ['admin', 'manager'],
    }
    search_fields = ['customer_code', 'name', 'email', 'phone', 'location']
    filter_mappings = {'status': 'status'}

    def get_queryset(self):
        queryset = Customer.objects.all().order_by('name')
        queryset = self.scope_queryset(queryset)
        return self.apply_query_params(queryset)

    def perform_create(self, serializer):
        CustomerService.create_customer(self.request.user.organization, self.request.user, serializer)

    def perform_update(self, serializer):
        CustomerService.update_customer(serializer)
