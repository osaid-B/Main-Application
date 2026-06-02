from rest_framework.permissions import BasePermission

class RoleMatrixPermission(BasePermission):
    message = 'You do not have permission to perform this action.'

    def _role_code(self, user):
        if getattr(user, 'is_superuser', False):
            return 'superuser'
        profile = getattr(user, 'employee_profile', None)
        if profile and profile.role_id:
            return profile.role.code
        return None

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_superuser', False):
            return True

        matrix = getattr(view, 'role_permissions', None)
        if not matrix:
            return True

        action = getattr(view, 'action', None) or request.method.lower()
        allowed = matrix.get(action, matrix.get('*', []))
        return self._role_code(user) in allowed

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)
