from django.db import models

class TenantQuerySet(models.QuerySet):
    def for_organization(self, organization):
        if organization is None:
            return self.none()
        return self.filter(organization=organization)

    def for_user(self, user):
        if user is None or not getattr(user, 'is_authenticated', False):
            return self.none()
        if getattr(user, 'is_superuser', False):
            return self
        organization = getattr(user, 'organization', None)
        return self.for_organization(organization)

class TenantManager(models.Manager.from_queryset(TenantQuerySet)):
    pass
