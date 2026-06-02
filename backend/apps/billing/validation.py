from rest_framework.exceptions import ValidationError

from apps.catalog.services import InventoryService
from apps.crm.models import Customer
from apps.catalog.models import Product

class InvoiceValidationLogic:
    @staticmethod
    def validate_customer(organization, customer):
        if isinstance(customer, Customer):
            customer_obj = customer
        else:
            customer_obj = Customer.objects.filter(
                organization=organization,
                id=customer,
                status=Customer.Status.ACTIVE,
            ).first()
        if not customer_obj:
            raise ValidationError({'customer': 'Customer not found or inactive.'})
        return customer_obj

    @staticmethod
    def validate_items(organization, items):
        if not items:
            raise ValidationError({'items': 'At least one invoice item is required.'})

        normalized_items = []
        errors = []
        for index, item in enumerate(items):
            product = Product.objects.filter(
                organization=organization,
                id=item.get('product'),
                is_active=True,
            ).select_related('category').first()
            if not product:
                errors.append({index: 'Product not found or inactive.'})
                continue
            quantity = int(item.get('quantity', 0))
            if quantity <= 0:
                errors.append({index: 'Quantity must be greater than zero.'})
                continue
            available_stock = InventoryService.get_available_stock(product)
            if quantity > available_stock:
                errors.append({index: f'Requested quantity exceeds available stock for {product.name}.'})
                continue
            unit_price = item.get('unit_price') or product.sell_price
            normalized_items.append({
                'product': product,
                'quantity': quantity,
                'unit_price': unit_price,
            })
        if errors:
            raise ValidationError({'items': errors})
        return normalized_items

class PaymentValidationLogic:
    @staticmethod
    def validate_invoice(organization, invoice, *, customer=None):
        from .models import Invoice
        if isinstance(invoice, Invoice):
            invoice_obj = invoice
        else:
            invoice_obj = Invoice.objects.filter(organization=organization, id=invoice).select_related('customer').first()
        if not invoice_obj:
            raise ValidationError({'invoice': 'Invoice not found.'})
        if invoice_obj.status == Invoice.Status.CANCELLED:
            raise ValidationError({'invoice': 'Cancelled invoices cannot receive payments.'})
        if customer and invoice_obj.customer_id != customer.id:
            raise ValidationError({'customer': 'Payment customer does not match invoice customer.'})
        return invoice_obj

    @staticmethod
    def validate_amount(invoice, amount):
        amount = float(amount)
        if amount <= 0:
            raise ValidationError({'amount': 'Payment amount must be greater than zero.'})
        if amount > float(invoice.remaining_amount):
            raise ValidationError({'amount': 'Payment amount exceeds invoice remaining balance.'})
        return amount
