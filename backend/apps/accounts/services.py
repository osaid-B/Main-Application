from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmployeeProfile, Role, User

class AuthService:
    @staticmethod
    def login(request, username: str, password: str):
        user = authenticate(request=request, username=username, password=password)
        if not user:
            raise AuthenticationFailed('Invalid username or password.')
        if not user.is_active:
            raise AuthenticationFailed('User account is inactive.')
        # No django_login() — this is a JWT API; sessions would cause DRF's
        # SessionAuthentication to enforce CSRF on subsequent requests.
        refresh = RefreshToken.for_user(user)
        return user, {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    @staticmethod
    def logout(request, refresh_token: str | None = None):
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

class EmployeeService:
    @staticmethod
    def _get_role(organization, role):
        if isinstance(role, Role):
            selected_role = role
        else:
            selected_role = Role.objects.filter(organization=organization, id=role, is_active=True).first()
            if selected_role is None:
                selected_role = Role.objects.filter(organization=organization, code=str(role), is_active=True).first()
        if not selected_role:
            raise ValidationError({'role': 'A valid role for this organization is required.'})
        return selected_role

    @classmethod
    @transaction.atomic
    def create_employee(cls, organization, payload):
        role = cls._get_role(organization, payload.get('role'))
        username = payload['username']
        email = payload['email']
        password = payload.get('password') or 'ChangeMe123!'

        if User.objects.filter(username=username).exists():
            raise ValidationError({'username': 'Username already exists.'})
        if User.objects.filter(email=email).exists():
            raise ValidationError({'email': 'Email already exists.'})

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            organization=organization,
            is_active=payload.get('is_active', True),
        )
        employee = EmployeeProfile.objects.create(
            organization=organization,
            user=user,
            role=role,
            full_name=payload['full_name'],
            phone=payload.get('phone', ''),
            job_title=payload.get('job_title', ''),
            hire_date=payload.get('hire_date'),
            is_active=payload.get('is_active', True),
        )
        return employee

    @classmethod
    @transaction.atomic
    def update_employee(cls, instance, payload):
        role_value = payload.get('role')
        if role_value:
            instance.role = cls._get_role(instance.organization, role_value)

        for field in ['full_name', 'phone', 'job_title', 'hire_date']:
            if field in payload:
                setattr(instance, field, payload[field])

        if 'is_active' in payload:
            instance.is_active = payload['is_active']
            instance.user.is_active = payload['is_active']

        if 'username' in payload and payload['username'] != instance.user.username:
            if User.objects.exclude(pk=instance.user.pk).filter(username=payload['username']).exists():
                raise ValidationError({'username': 'Username already exists.'})
            instance.user.username = payload['username']

        if 'email' in payload and payload['email'] != instance.user.email:
            if User.objects.exclude(pk=instance.user.pk).filter(email=payload['email']).exists():
                raise ValidationError({'email': 'Email already exists.'})
            instance.user.email = payload['email']

        if payload.get('password'):
            instance.user.set_password(payload['password'])

        instance.user.save()
        instance.save()
        return instance

class RoleAccessService:
    @staticmethod
    def get_role_code(user):
        if getattr(user, 'is_superuser', False):
            return 'superuser'
        profile = getattr(user, 'employee_profile', None)
        return getattr(getattr(profile, 'role', None), 'code', None)
