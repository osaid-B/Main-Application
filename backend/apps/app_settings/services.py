from .models import AppSetting, BusinessProfile
from apps.common.utils import parse_setting_value, serialize_setting_value

class SettingsService:
    @staticmethod
    def get_or_create_business_profile(organization):
        profile, _ = BusinessProfile.objects.get_or_create(
            organization=organization,
            defaults={'legal_name': organization.name},
        )
        return profile

    @staticmethod
    def get_app_settings_dict(organization):
        settings_qs = AppSetting.objects.filter(organization=organization).order_by('setting_key')
        return {
            setting.setting_key: parse_setting_value(setting.setting_value, setting.value_type)
            for setting in settings_qs
        }

    @staticmethod
    def update_app_settings(organization, user, payload):
        for key, value in payload.items():
            value_type, stored_value = serialize_setting_value(value)
            AppSetting.objects.update_or_create(
                organization=organization,
                setting_key=key,
                defaults={
                    'setting_value': stored_value,
                    'value_type': value_type,
                    'updated_by': user,
                },
            )
        return SettingsService.get_app_settings_dict(organization)
