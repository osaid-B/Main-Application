from django.db import models
from django.utils.text import slugify

from apps.common.models import UUIDTimeStampedModel

class Organization(UUIDTimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    currency = models.CharField(max_length=8, default='USD')
    timezone = models.CharField(max_length=64, default='UTC')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
