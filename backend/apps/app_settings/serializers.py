from rest_framework import serializers
from .models import BusinessProfile

class BusinessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = ['id', 'legal_name', 'business_email', 'business_phone', 'address', 'tax_number', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AppSettingsPayloadSerializer(serializers.Serializer):
    settings = serializers.DictField(child=serializers.JSONField())
