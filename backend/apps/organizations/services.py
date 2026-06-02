from .models import Organization
from apps.common.services import BaseService

class OrganizationService(BaseService):
    @staticmethod
    def create_organization(name, **kwargs):
        return Organization.objects.create(name=name, **kwargs)
