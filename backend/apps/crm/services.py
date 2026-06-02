from .models import Customer

class CustomerService:
    @staticmethod
    def create_customer(organization, created_by, serializer):
        serializer.save(organization=organization, created_by=created_by)

    @staticmethod
    def update_customer(serializer):
        serializer.save()
