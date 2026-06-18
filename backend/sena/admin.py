from django.contrib import admin
from .models import SenaRecord


@admin.register(SenaRecord)
class SenaRecordAdmin(admin.ModelAdmin):
    list_display = [
        'sena_id',
        'senaTitle',
        'clientFirstName',
        'clientLastName',
        'clientEmail',
        'senaStatus',
        'dateOfAppointment',
        'user',
    ]
    list_filter = ['senaStatus', 'dateOfAppointment', 'dateCreated']
    search_fields = ['senaTitle', 'clientFirstName', 'clientLastName', 'clientEmail']
    readonly_fields = ['sena_id', 'dateCreated', 'dateUpdated']
    fieldsets = (
        ('Record Information', {
            'fields': ('senaTitle', 'user')
        }),
        ('Client Information', {
            'fields': (
                'clientFirstName',
                'clientMiddleName',
                'clientLastName',
                'clientSuffix',
                'clientAge',
                'clientContactNumber',
                'clientEmail',
            )
        }),
        ('Appointment Details', {
            'fields': ('dateOfAppointment', 'start_time', 'end_time', 'senaStatus')
        }),
        ('System Information', {
            'fields': ('sena_id', 'dateCreated', 'dateUpdated'),
            'classes': ('collapse',)
        }),
    )
