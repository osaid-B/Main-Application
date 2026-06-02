from decimal import Decimal
from typing import Any

from django.utils import timezone

def generate_scoped_sequence(model_class, organization, field_name: str, prefix: str) -> str:
    today = timezone.localdate().strftime('%Y%m%d')
    current_count = model_class.objects.filter(
        organization=organization,
        **{f'{field_name}__startswith': f'{prefix}-{today}-'}
    ).count()
    return f'{prefix}-{today}-{current_count + 1:04d}'

def normalize_decimal(value: Any) -> Decimal:
    if value is None:
        return Decimal('0.00')
    return Decimal(str(value)).quantize(Decimal('0.01'))

def parse_setting_value(raw_value: str, value_type: str):
    if value_type == 'boolean':
        return raw_value.lower() in {'1', 'true', 'yes', 'on'}
    if value_type == 'integer':
        return int(raw_value)
    if value_type == 'decimal':
        return str(normalize_decimal(raw_value))
    if value_type == 'json':
        import json
        return json.loads(raw_value)
    return raw_value

def serialize_setting_value(value):
    import json
    if isinstance(value, bool):
        return 'boolean', 'true' if value else 'false'
    if isinstance(value, int):
        return 'integer', str(value)
    if isinstance(value, float):
        return 'decimal', str(value)
    if isinstance(value, (dict, list)):
        return 'json', json.dumps(value)
    return 'string', str(value)
