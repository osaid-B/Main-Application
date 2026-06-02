from decimal import Decimal

from django.db.models import Sum
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.catalog.services import InventoryService
from apps.common.utils import normalize_decimal
from apps.crm.models import Customer

from .models import Invoice, InvoiceItem, Payment
from .validation import InvoiceValidationLogic, PaymentValidationLogic

class InvoiceService:
    @classmethod
    @transaction.atomic
    def create_invoice(cls, *, organization, created_by, validated_data):
        items = validated_data.pop('items')
        customer = InvoiceValidationLogic.validate_customer(organization, validated_data['customer'])
        normalized_items = InvoiceValidationLogic.validate_items(organization, items)

        subtotal = Decimal('0.00')
        for item in normalized_items:
            line_total = normalize_decimal(item['unit_price']) * item['quantity']
            item['line_total'] = normalize_decimal(line_total)
            subtotal += item['line_total']

        invoice = Invoice.objects.create(
            organization=organization,
            customer=customer,
            created_by=created_by,
            invoice_date=validated_data.get('invoice_date') or timezone.localdate(),
            subtotal_amount=normalize_decimal(subtotal),
            total_amount=normalize_decimal(subtotal),
            paid_amount=Decimal('0.00'),
            remaining_amount=normalize_decimal(subtotal),
            status=Invoice.Status.DEBT,
            notes=validated_data.get('notes', ''),
        )

        for item in normalized_items:
            InvoiceItem.objects.create(
                invoice=invoice,
                product=item['product'],
                quantity=item['quantity'],
                unit_price=normalize_decimal(item['unit_price']),
                line_total=item['line_total'],
            )
            InventoryService.create_sale_movement(
                organization=organization,
                created_by=created_by,
                product=item['product'],
                invoice=invoice,
                quantity=item['quantity'],
                unit_cost=normalize_decimal(item['unit_price']),
                movement_date=invoice.invoice_date,
                notes=f'Sale for {invoice.invoice_number}',
            )
        return invoice

    @classmethod
    @transaction.atomic
    def cancel_invoice(cls, invoice, *, cancelled_by=None):
        if invoice.status == Invoice.Status.CANCELLED:
            return invoice
        if invoice.payments.exclude(status=Payment.Status.VOID).exists():
            raise ValidationError({'invoice': 'Invoice with posted payments cannot be cancelled.'})
        for item in invoice.items.select_related('product'):
            InventoryService.create_reversal_movement(
                organization=invoice.organization,
                created_by=cancelled_by,
                product=item.product,
                invoice=invoice,
                quantity=item.quantity,
                unit_cost=item.unit_price,
                movement_date=timezone.localdate(),
                notes=f'Reversal for cancelled invoice {invoice.invoice_number}',
            )
        invoice.status = Invoice.Status.CANCELLED
        invoice.remaining_amount = invoice.total_amount
        invoice.paid_amount = Decimal('0.00')
        invoice.save(update_fields=['status', 'remaining_amount', 'paid_amount', 'updated_at'])
        return invoice

class PaymentService:
    @classmethod
    @transaction.atomic
    def create_payment(cls, *, organization, created_by, validated_data):
        customer = Customer.objects.filter(organization=organization, id=validated_data['customer']).first()
        if not customer:
            raise ValidationError({'customer': 'Customer not found.'})

        invoice = PaymentValidationLogic.validate_invoice(organization, validated_data['invoice'], customer=customer)
        amount = normalize_decimal(validated_data['amount'])
        PaymentValidationLogic.validate_amount(invoice, amount)

        payment = Payment.objects.create(
            organization=organization,
            customer=customer,
            invoice=invoice,
            created_by=created_by,
            payment_date=validated_data.get('payment_date') or timezone.localdate(),
            amount=amount,
            payment_method=validated_data['payment_method'],
            status=Payment.Status.POSTED,
            notes=validated_data.get('notes', ''),
        )

        invoice.paid_amount = normalize_decimal(invoice.paid_amount + amount)
        invoice.remaining_amount = normalize_decimal(invoice.total_amount - invoice.paid_amount)
        if invoice.remaining_amount <= Decimal('0.00'):
            invoice.status = Invoice.Status.PAID
            invoice.remaining_amount = Decimal('0.00')
        elif invoice.paid_amount > Decimal('0.00'):
            invoice.status = Invoice.Status.PARTIAL
        else:
            invoice.status = Invoice.Status.DEBT
        invoice.save(update_fields=['paid_amount', 'remaining_amount', 'status', 'updated_at'])
        return payment

    @classmethod
    @transaction.atomic
    def void_payment(cls, payment, *, user=None):
        if payment.status == Payment.Status.VOID:
            return payment
        invoice = payment.invoice
        payment.status = Payment.Status.VOID
        if user:
            suffix = f' Voided by {user.username}.'
            payment.notes = f'{payment.notes}{suffix}'.strip()
        payment.save(update_fields=['status', 'notes', 'updated_at'])

        remaining_paid = invoice.payments.filter(status=Payment.Status.POSTED).aggregate(
            total=Sum('amount')
        ).get('total') or Decimal('0.00')
        invoice.paid_amount = normalize_decimal(remaining_paid)
        invoice.remaining_amount = normalize_decimal(invoice.total_amount - invoice.paid_amount)
        if invoice.remaining_amount <= Decimal('0.00'):
            invoice.status = Invoice.Status.PAID
            invoice.remaining_amount = Decimal('0.00')
        elif invoice.paid_amount > Decimal('0.00'):
            invoice.status = Invoice.Status.PARTIAL
        else:
            invoice.status = Invoice.Status.DEBT
        invoice.save(update_fields=['paid_amount', 'remaining_amount', 'status', 'updated_at'])
        return payment
