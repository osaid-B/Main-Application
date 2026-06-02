from rest_framework import status, viewsets
from rest_framework.response import Response

from apps.common.mixins import ActionSerializerMixin, QueryParamFilterMixin, TenantScopedQuerysetMixin
from apps.common.permissions import RoleMatrixPermission

from .models import Invoice, Payment
from .serializers import (
    InvoiceCreateSerializer,
    InvoiceSerializer,
    InvoiceUpdateSerializer,
    PaymentCreateSerializer,
    PaymentSerializer,
    PaymentUpdateSerializer,
)
from .services import InvoiceService, PaymentService

class InvoiceViewSet(ActionSerializerMixin, TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    serializer_action_classes = {
        'create': InvoiceCreateSerializer,
        'partial_update': InvoiceUpdateSerializer,
    }
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager', 'staff'],
        'retrieve': ['admin', 'manager', 'staff'],
        'create': ['admin', 'manager', 'staff'],
        'partial_update': ['admin', 'manager'],
        'destroy': ['admin', 'manager'],
    }
    search_fields = ['invoice_number', 'customer__name', 'notes']
    filter_mappings = {
        'customer': 'customer_id',
        'status': 'status',
        'date_from': 'invoice_date__gte',
        'date_to': 'invoice_date__lte',
    }

    def get_queryset(self):
        queryset = Invoice.objects.select_related('customer', 'organization').prefetch_related('items__product', 'payments').all()
        queryset = self.scope_queryset(queryset)
        return self.apply_query_params(queryset)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()
        output = InvoiceSerializer(invoice, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(InvoiceSerializer(instance, context=self.get_serializer_context()).data)

    def destroy(self, request, *args, **kwargs):
        invoice = self.get_object()
        InvoiceService.cancel_invoice(invoice, cancelled_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

class PaymentViewSet(ActionSerializerMixin, TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    serializer_action_classes = {
        'create': PaymentCreateSerializer,
        'partial_update': PaymentUpdateSerializer,
    }
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager', 'staff'],
        'retrieve': ['admin', 'manager', 'staff'],
        'create': ['admin', 'manager', 'staff'],
        'partial_update': ['admin', 'manager'],
        'destroy': ['admin', 'manager'],
    }
    search_fields = ['payment_number', 'invoice__invoice_number', 'customer__name', 'notes']
    filter_mappings = {
        'invoice': 'invoice_id',
        'status': 'status',
        'method': 'payment_method',
        'date_from': 'payment_date__gte',
        'date_to': 'payment_date__lte',
    }

    def get_queryset(self):
        queryset = Payment.objects.select_related('invoice', 'customer', 'organization').all()
        queryset = self.scope_queryset(queryset)
        return self.apply_query_params(queryset)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        output = PaymentSerializer(payment, context=self.get_serializer_context())
        return Response(output.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PaymentSerializer(instance, context=self.get_serializer_context()).data)

    def destroy(self, request, *args, **kwargs):
        payment = self.get_object()
        PaymentService.void_payment(payment, user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
