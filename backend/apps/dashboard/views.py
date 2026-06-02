from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import RoleMatrixPermission

from .serializers import DashboardOverviewSerializer, DashboardQuickMetricsSerializer, DashboardSummarySerializer
from .services import DashboardAggregationService

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [RoleMatrixPermission]
    role_permissions = {
        'overview': ['admin', 'manager', 'staff'],
        'summary': ['admin', 'manager', 'staff'],
        'quick_metrics': ['admin', 'manager'],
    }

    @action(detail=False, methods=['get'], url_path='overview')
    def overview(self, request):
        data = DashboardAggregationService.overview(request.user.organization)
        return Response(DashboardOverviewSerializer(data).data)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        data = DashboardAggregationService.summary(request.user.organization)
        return Response(DashboardSummarySerializer(data).data)

    @action(detail=False, methods=['get'], url_path='quick-metrics')
    def quick_metrics(self, request):
        data = DashboardAggregationService.quick_metrics(request.user.organization)
        return Response(DashboardQuickMetricsSerializer(data).data)
