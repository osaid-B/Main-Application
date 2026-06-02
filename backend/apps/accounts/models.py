from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TenantScopedModel, UUIDTimeStampedModel
from apps.organizations.models import Organization

class UserManager(BaseUserManager):
    use_in_migrations = True


    #enterly
    def _create_user(self, username, email, password, **extra_fields):
        if not username:
            raise ValueError('The username must be set')
        if not email:
            raise ValueError('The email must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


    def create_user(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self._create_user(username, email, password, **extra_fields)

class User(UUIDTimeStampedModel, AbstractBaseUser, PermissionsMixin):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
    )
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    class Meta:
        ordering = ['username']

    def __str__(self):
        return self.username

class Role(TenantScopedModel):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['organization', 'code'], name='uniq_role_code_per_org'),
        ]

    def __str__(self):
        return f'{self.organization}:{self.name}'

class EmployeeProfile(TenantScopedModel):
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='employee_profile',
    )
    role = models.ForeignKey(
        'accounts.Role',
        on_delete=models.PROTECT,
        related_name='employees',
    )
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True)
    job_title = models.CharField(max_length=120, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['full_name']
        verbose_name = _('Employee profile')
        verbose_name_plural = _('Employee profiles')

    def __str__(self):
        return self.full_name
