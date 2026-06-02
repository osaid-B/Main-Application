from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.common.mixins import QueryParamFilterMixin, TenantScopedQuerysetMixin
from apps.common.permissions import RoleMatrixPermission

from .models import EmployeeProfile
from .serializers import EmployeeSerializer, LoginSerializer, UserContextSerializer
from .services import AuthService

class AuthViewSet(viewsets.ViewSet):
    def get_permissions(self):
        if self.action == 'login':
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['post'], url_path='login', permission_classes=[AllowAny])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, tokens = AuthService.login(request, **serializer.validated_data)
        
        return Response({
            **tokens,
            'user': UserContextSerializer(user).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='refresh', permission_classes=[AllowAny])
    def refresh(self, request):
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        from rest_framework.exceptions import AuthenticationFailed
        
        serializer = TokenRefreshSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except (InvalidToken, TokenError) as e:
            raise AuthenticationFailed(detail=getattr(e, 'detail', str(e)))
            
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='logout')
    def logout(self, request):
        AuthService.logout(request, request.data.get('refresh'))
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(UserContextSerializer(request.user).data)

class EmployeeViewSet(TenantScopedQuerysetMixin, QueryParamFilterMixin, viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'list': ['admin', 'manager'],
        'retrieve': ['admin', 'manager'],
        'create': ['admin'],
        'partial_update': ['admin', 'manager'],
        'destroy': ['admin'],
    }
    search_fields = ['full_name', 'user__username', 'user__email', 'job_title']
    filter_mappings = {
        'is_active': 'is_active',
    }

    def get_queryset(self):
        queryset = EmployeeProfile.objects.select_related('user', 'role', 'organization').all()
        queryset = self.scope_queryset(queryset)
        queryset = self.apply_query_params(queryset)
        role_filter = self.request.query_params.get('role')
        if role_filter:
            queryset = queryset.filter(role__id=role_filter) | queryset.filter(role__code=role_filter)
        return queryset.distinct()
