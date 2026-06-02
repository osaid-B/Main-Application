from .selectors import dashboard_overview, dashboard_quick_metrics, dashboard_summary

class DashboardAggregationService:
    @staticmethod
    def overview(organization):
        return dashboard_overview(organization)

    @staticmethod
    def summary(organization):
        return dashboard_summary(organization)

    @staticmethod
    def quick_metrics(organization):
        return dashboard_quick_metrics(organization)
