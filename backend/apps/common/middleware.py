from apps.organizations.models import Organization

class CurrentOrganizationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.organization = None
        user = getattr(request, 'user', None)
        if user is not None and getattr(user, 'is_authenticated', False):
            request.organization = getattr(user, 'organization', None)
        else:
            org_slug = request.headers.get('X-Organization-Slug')
            org_id = request.headers.get('X-Organization-Id')
            if org_id:
                request.organization = Organization.objects.filter(id=org_id, is_active=True).first()
            elif org_slug:
                request.organization = Organization.objects.filter(slug=org_slug, is_active=True).first()
        return self.get_response(request)
