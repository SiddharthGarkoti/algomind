import django_filters
from .models import Problem


class ProblemFilter(django_filters.FilterSet):
    tag = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact', label='Tag name')

    class Meta:
        model  = Problem
        fields = ['difficulty', 'tag']
