from rest_framework import serializers

from .models import EmployeeProfile, Role, User
from .services import EmployeeService

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'code', 'description', 'is_active']

class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'is_staff', 'is_superuser']

class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    role = serializers.SerializerMethodField()
    role_id = serializers.UUIDField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'username', 'email', 'password', 'full_name', 'phone', 'job_title',
            'hire_date', 'is_active', 'role', 'role_id', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'role']

    def get_role(self, obj):
        return RoleSerializer(obj.role).data if obj.role_id else None

    def create(self, validated_data):
        user_payload = validated_data.pop('user', {})
        payload = {
            **validated_data,
            **user_payload,
            'role': validated_data.pop('role_id', None),
        }
        request = self.context['request']
        return EmployeeService.create_employee(request.user.organization, payload)

    def update(self, instance, validated_data):
        user_payload = validated_data.pop('user', {})
        payload = {
            **validated_data,
            **user_payload,
        }
        if 'role_id' in self.initial_data:
            payload['role'] = self.initial_data.get('role_id')
        return EmployeeService.update_employee(instance, payload)

class UserContextSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role']

    def get_full_name(self, obj):
        profile = getattr(obj, 'employee_profile', None)
        return profile.full_name if profile else obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        profile = getattr(obj, 'employee_profile', None)
        if profile and profile.role:
            return profile.role.code
        return None

class MeSerializer(serializers.Serializer):
    user = UserSummarySerializer()
    employee = EmployeeSerializer(allow_null=True)
    organization = serializers.SerializerMethodField()

    def get_organization(self, obj):
        user = obj['user']
        if user.organization is None:
            return None
        return {
            'id': str(user.organization.id),
            'name': user.organization.name,
            'slug': user.organization.slug,
            'currency': user.organization.currency,
            'timezone': user.organization.timezone,
        }
