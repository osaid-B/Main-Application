from django.db import transaction
from django.core.exceptions import ValidationError

class BaseService:
    @staticmethod
    @transaction.atomic
    def execute(*args, **kwargs):
        """
        The main entry point for the service.
        All business logic should be executed here.
        """
        raise NotImplementedError("Service must implement execute method.")

    @staticmethod
    def validate(*args, **kwargs):
        """
        Optional validation logic.
        """
        pass
