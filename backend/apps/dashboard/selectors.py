from django.db.models import Count, Sum
from django.utils import timezone

from apps.billing.models import Invoice, Payment
from apps.catalog.models import Product
from apps.crm.models import Customer

def dashboard_overview(organization):
    return {
        'customer_count': Customer.objects.filter(organization=organization).count(),
        'product_count': Product.objects.filter(organization=organization).count(),
        'invoice_count': Invoice.objects.filter(organization=organization).count(),
        'payment_count': Payment.objects.filter(organization=organization).count(),
        'low_stock_count': sum(1 for product in Product.objects.filter(organization=organization) if product.available_stock <= product.reorder_level),
    }

def dashboard_summary(organization):
    invoice_qs = Invoice.objects.filter(organization=organization).exclude(status=Invoice.Status.CANCELLED)
    payment_qs = Payment.objects.filter(organization=organization, status=Payment.Status.POSTED)
    return {
        'total_sales': str(invoice_qs.aggregate(total=Sum('total_amount')).get('total') or 0),
        'total_collected': str(payment_qs.aggregate(total=Sum('amount')).get('total') or 0),
        'total_receivables': str(invoice_qs.aggregate(total=Sum('remaining_amount')).get('total') or 0),
        'active_customers': Customer.objects.filter(organization=organization, status=Customer.Status.ACTIVE).count(),
    }

def dashboard_quick_metrics(organization):
    today = timezone.localdate()
    month_start = today.replace(day=1)
    monthly_invoices = Invoice.objects.filter(
        organization=organization,
        invoice_date__gte=month_start,
    ).exclude(status=Invoice.Status.CANCELLED)
    monthly_payments = Payment.objects.filter(
        organization=organization,
        payment_date__gte=month_start,
        status=Payment.Status.POSTED,
    )
    return {
        'month_invoice_total': str(monthly_invoices.aggregate(total=Sum('total_amount')).get('total') or 0),
        'month_payment_total': str(monthly_payments.aggregate(total=Sum('amount')).get('total') or 0),
        'month_invoice_count': monthly_invoices.count(),
        'month_payment_count': monthly_payments.count(),
        'top_customers': list(
            monthly_invoices.values('customer__name').annotate(total=Sum('total_amount')).order_by('-total')[:5]
        ),
    }
