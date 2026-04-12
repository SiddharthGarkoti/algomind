from django.contrib import admin
from .models import Party, PartyMember, PartyQuestion, QuestionCompletion

@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display    = ['code', 'name', 'host', 'status', 'created_at']
    list_filter     = ['status']
    readonly_fields = ['code']

admin.site.register(PartyMember)
admin.site.register(PartyQuestion)
admin.site.register(QuestionCompletion)
