from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_code', 'name', 'email', 'phone', 'location',
            'status', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['customer_code', 'created_at', 'updated_at']
