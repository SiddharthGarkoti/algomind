from django.contrib import admin
from .models import Tag, Problem, Submission

admin.site.register(Tag)

@admin.register(Problem)
class ProblemAdmin(admin.ModelAdmin):
    list_display       = ['title', 'difficulty', 'is_active', 'created_at']
    list_filter        = ['difficulty', 'is_active', 'tags']
    search_fields      = ['title']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal  = ['tags']

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display  = ['user', 'problem', 'language', 'status', 'created_at']
    list_filter   = ['status', 'language']
    search_fields = ['user__username', 'problem__title']
