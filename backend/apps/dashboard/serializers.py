from rest_framework import serializers

class DashboardOverviewSerializer(serializers.Serializer):
    customer_count = serializers.IntegerField()
    product_count = serializers.IntegerField()
    invoice_count = serializers.IntegerField()
    payment_count = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()

class DashboardSummarySerializer(serializers.Serializer):
    total_sales = serializers.CharField()
    total_collected = serializers.CharField()
    total_receivables = serializers.CharField()
    active_customers = serializers.IntegerField()

class DashboardQuickMetricsSerializer(serializers.Serializer):
    month_invoice_total = serializers.CharField()
    month_payment_total = serializers.CharField()
    month_invoice_count = serializers.IntegerField()
    month_payment_count = serializers.IntegerField()
    top_customers = serializers.ListField()
