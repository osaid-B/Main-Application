from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import RoleMatrixPermission

from .serializers import AppSettingsPayloadSerializer, BusinessProfileSerializer
from .services import SettingsService

class SettingsViewSet(viewsets.ViewSet):
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'business_profile': ['admin', 'manager'],
        'app_settings': ['admin', 'manager'],
    }

    @action(detail=False, methods=['get', 'patch'], url_path='business-profile')
    def business_profile(self, request):
        profile = SettingsService.get_or_create_business_profile(request.user.organization)
        if request.method.lower() == 'patch':
            serializer = BusinessProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(BusinessProfileSerializer(profile).data)

    @action(detail=False, methods=['get', 'patch'], url_path='app-settings')
    def app_settings(self, request):
        if request.method.lower() == 'patch':
            serializer = AppSettingsPayloadSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = SettingsService.update_app_settings(
                request.user.organization,
                request.user,
                serializer.validated_data['settings'],
            )
            return Response({'settings': data}, status=status.HTTP_200_OK)
        return Response({'settings': SettingsService.get_app_settings_dict(request.user.organization)})
