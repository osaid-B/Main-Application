from rest_framework import serializers

from apps.crm.serializers import CustomerSerializer

from .models import Invoice, InvoiceItem, Payment
from .services import InvoiceService, PaymentService

class InvoiceItemWriteSerializer(serializers.Serializer):
    product = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ['id', 'product', 'product_name', 'product_code', 'quantity', 'unit_price', 'line_total']

class InvoiceSerializer(serializers.ModelSerializer):
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_detail', 'invoice_date',
            'subtotal_amount', 'total_amount', 'paid_amount', 'remaining_amount',
            'status', 'notes', 'items', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'invoice_number', 'subtotal_amount', 'total_amount', 'paid_amount',
            'remaining_amount', 'created_at', 'updated_at',
        ]

class InvoiceCreateSerializer(serializers.Serializer):
    customer = serializers.UUIDField()
    invoice_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = InvoiceItemWriteSerializer(many=True)

    def create(self, validated_data):
        request = self.context['request']
        return InvoiceService.create_invoice(
            organization=request.user.organization,
            created_by=request.user,
            validated_data=validated_data,
        )

class InvoiceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['invoice_date', 'notes']

class PaymentSerializer(serializers.ModelSerializer):
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'invoice', 'invoice_number', 'customer', 'customer_detail',
            'payment_date', 'amount', 'payment_method', 'status', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['payment_number', 'created_at', 'updated_at']

class PaymentCreateSerializer(serializers.Serializer):
    invoice = serializers.UUIDField()
    customer = serializers.UUIDField()
    payment_date = serializers.DateField(required=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.CharField(max_length=50)
    notes = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        request = self.context['request']
        return PaymentService.create_payment(
            organization=request.user.organization,
            created_by=request.user,
            validated_data=validated_data,
        )

class PaymentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['payment_date', 'payment_method', 'notes']
