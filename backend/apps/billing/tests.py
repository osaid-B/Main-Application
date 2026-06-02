from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.billing.models import Invoice, Payment
from apps.billing.services import PaymentService
from apps.crm.models import Customer
from apps.organizations.models import Organization


class PaymentServiceVoidPaymentTests(TestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Test Org", slug="test-org")
        self.user = User.objects.create_user(
            username="tester",
            email="tester@example.com",
            password="secret123",
            organization=self.organization,
        )
        self.customer = Customer.objects.create(
            organization=self.organization,
            created_by=self.user,
            customer_code="CUS-TEST-001",
            name="Test Customer",
        )

    def test_void_payment_keeps_invoice_paid_when_remaining_posted_payments_cover_total(self):
        invoice = Invoice.objects.create(
            organization=self.organization,
            customer=self.customer,
            created_by=self.user,
            invoice_date="2026-05-11",
            subtotal_amount=Decimal("100.00"),
            total_amount=Decimal("100.00"),
            paid_amount=Decimal("150.00"),
            remaining_amount=Decimal("0.00"),
            status=Invoice.Status.PAID,
        )
        kept_payment = Payment.objects.create(
            organization=self.organization,
            customer=self.customer,
            invoice=invoice,
            created_by=self.user,
            payment_date="2026-05-11",
            amount=Decimal("100.00"),
            payment_method="cash",
            status=Payment.Status.POSTED,
        )
        voided_payment = Payment.objects.create(
            organization=self.organization,
            customer=self.customer,
            invoice=invoice,
            created_by=self.user,
            payment_date="2026-05-11",
            amount=Decimal("50.00"),
            payment_method="cash",
            status=Payment.Status.POSTED,
        )

        PaymentService.void_payment(voided_payment, user=self.user)

        invoice.refresh_from_db()
        kept_payment.refresh_from_db()
        voided_payment.refresh_from_db()

        self.assertEqual(invoice.paid_amount, Decimal("100.00"))
        self.assertEqual(invoice.remaining_amount, Decimal("0.00"))
        self.assertEqual(invoice.status, Invoice.Status.PAID)
        self.assertEqual(voided_payment.status, Payment.Status.VOID)
        self.assertEqual(kept_payment.status, Payment.Status.POSTED)

    def test_void_payment_sets_invoice_debt_when_no_posted_payments_remain(self):
        invoice = Invoice.objects.create(
            organization=self.organization,
            customer=self.customer,
            created_by=self.user,
            invoice_date="2026-05-11",
            subtotal_amount=Decimal("100.00"),
            total_amount=Decimal("100.00"),
            paid_amount=Decimal("100.00"),
            remaining_amount=Decimal("0.00"),
            status=Invoice.Status.PAID,
        )
        payment = Payment.objects.create(
            organization=self.organization,
            customer=self.customer,
            invoice=invoice,
            created_by=self.user,
            payment_date="2026-05-11",
            amount=Decimal("100.00"),
            payment_method="cash",
            status=Payment.Status.POSTED,
        )

        PaymentService.void_payment(payment, user=self.user)

        invoice.refresh_from_db()
        payment.refresh_from_db()

        self.assertEqual(invoice.paid_amount, Decimal("0.00"))
        self.assertEqual(invoice.remaining_amount, Decimal("100.00"))
        self.assertEqual(invoice.status, Invoice.Status.DEBT)
        self.assertEqual(payment.status, Payment.Status.VOID)

    def test_void_payment_sets_invoice_partial_when_remaining_posted_payments_are_insufficient(self):
        invoice = Invoice.objects.create(
            organization=self.organization,
            customer=self.customer,
            created_by=self.user,
            invoice_date="2026-05-11",
            subtotal_amount=Decimal("100.00"),
            total_amount=Decimal("100.00"),
            paid_amount=Decimal("100.00"),
            remaining_amount=Decimal("0.00"),
            status=Invoice.Status.PAID,
        )
        kept_payment = Payment.objects.create(
            organization=self.organization,
            customer=self.customer,
            invoice=invoice,
            created_by=self.user,
            payment_date="2026-05-11",
            amount=Decimal("40.00"),
            payment_method="cash",
            status=Payment.Status.POSTED,
        )
        voided_payment = Payment.objects.create(
            organization=self.organization,
            customer=self.customer,
            invoice=invoice,
            created_by=self.user,
            payment_date="2026-05-11",
            amount=Decimal("60.00"),
            payment_method="cash",
            status=Payment.Status.POSTED,
        )

        PaymentService.void_payment(voided_payment, user=self.user)

        invoice.refresh_from_db()
        kept_payment.refresh_from_db()
        voided_payment.refresh_from_db()

        self.assertEqual(invoice.paid_amount, Decimal("40.00"))
        self.assertEqual(invoice.remaining_amount, Decimal("60.00"))
        self.assertEqual(invoice.status, Invoice.Status.PARTIAL)
        self.assertEqual(voided_payment.status, Payment.Status.VOID)
        self.assertEqual(kept_payment.status, Payment.Status.POSTED)
