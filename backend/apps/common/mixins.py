from django.db.models import Q

class ActionSerializerMixin:
    serializer_action_classes = {}

    def get_serializer_class(self):
        return self.serializer_action_classes.get(getattr(self, 'action', None), super().get_serializer_class())

class TenantScopedQuerysetMixin:
    def scope_queryset(self, queryset):
        user = self.request.user
        if getattr(user, 'is_superuser', False):
            return queryset
        if hasattr(queryset, 'for_user'):
            return queryset.for_user(user)
        model = queryset.model
        if any(field.name == 'organization' for field in model._meta.fields):
            return queryset.filter(organization=getattr(user, 'organization', None))
        return queryset

class QueryParamFilterMixin:
    search_fields = []
    filter_mappings = {}

    def apply_query_params(self, queryset):
        params = self.request.query_params
        search = params.get('search')
        if search and self.search_fields:
            query = Q()
            for field in self.search_fields:
                query |= Q(**{f'{field}__icontains': search})
            queryset = queryset.filter(query)

        for param, lookup in self.filter_mappings.items():
            value = params.get(param)
            if value not in (None, ''):
                queryset = queryset.filter(**{lookup: value})
        return queryset
