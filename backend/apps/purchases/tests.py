from decimal import Decimal

from django.test import SimpleTestCase, TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.accounts.models import EmployeeProfile, Role, User
from apps.organizations.models import Organization

from .models import PurchaseOrder, Supplier
from .serializers import PurchaseOrderSerializer, PurchaseOrderUpdateSerializer
from .views import PurchaseOrderViewSet


class PurchaseOrderViewSetSerializerTests(SimpleTestCase):
    def test_partial_update_uses_update_serializer(self):
        factory = APIRequestFactory()
        request = factory.patch("/api/v1/purchases/test-id/", {"notes": "Updated"}, format="json")
        view = PurchaseOrderViewSet()
        view.request = request
        view.action = "partial_update"

        serializer_class = view.get_serializer_class()

        self.assertIs(serializer_class, PurchaseOrderUpdateSerializer)
        self.assertIsNot(serializer_class, PurchaseOrderSerializer)


class PurchaseOrderPartialUpdateTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.organization = Organization.objects.create(name="Test Org", slug="test-org")
        self.user = User.objects.create_user(
            username="manager",
            email="manager@example.com",
            password="secret123",
            organization=self.organization,
        )
        self.role = Role.objects.create(
            organization=self.organization,
            name="Manager",
            code="manager",
        )
        EmployeeProfile.objects.create(
            organization=self.organization,
            user=self.user,
            role=self.role,
            full_name="Manager User",
        )
        self.supplier = Supplier.objects.create(
            organization=self.organization,
            supplier_code="SUP-TEST-001",
            name="Supplier One",
        )
        self.purchase_order = PurchaseOrder.objects.create(
            organization=self.organization,
            supplier=self.supplier,
            created_by=self.user,
            order_date="2026-05-11",
            expected_delivery_date="2026-05-20",
            status=PurchaseOrder.Status.PENDING,
            payment_status=PurchaseOrder.PaymentStatus.UNPAID,
            subtotal_amount=Decimal("125.00"),
            total_amount=Decimal("125.00"),
            received_amount=Decimal("0.00"),
            notes="Original note",
        )

    def test_partial_update_allows_serializer_fields_and_ignores_business_controlled_fields(self):
        view = PurchaseOrderViewSet.as_view({"patch": "partial_update"})
        request = self.factory.patch(
            f"/api/v1/purchases/{self.purchase_order.pk}/",
            {
                "notes": "Updated note",
                "status": PurchaseOrder.Status.RECEIVED,
                "payment_status": PurchaseOrder.PaymentStatus.PAID,
                "subtotal_amount": "999.99",
                "received_amount": "50.00",
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        response = view(request, pk=str(self.purchase_order.pk))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.purchase_order.refresh_from_db()

        self.assertEqual(self.purchase_order.notes, "Updated note")
        self.assertEqual(self.purchase_order.status, PurchaseOrder.Status.PENDING)
        self.assertEqual(self.purchase_order.payment_status, PurchaseOrder.PaymentStatus.UNPAID)
        self.assertEqual(self.purchase_order.subtotal_amount, Decimal("125.00"))
        self.assertEqual(self.purchase_order.received_amount, Decimal("0.00"))
