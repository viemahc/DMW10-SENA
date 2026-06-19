from django.contrib import admin
from .models import SenaRecord, EmailClient, EmailRespondent, SenaMinutes, SenaAppointment, AgencyRecord


@admin.register(EmailClient)
class EmailClientAdmin(admin.ModelAdmin):
    list_display = ['emailClient_id', 'email_address', 'dateCreated']
    search_fields = ['email_address']
    readonly_fields = ['emailClient_id', 'dateCreated', 'dateUpdated']


@admin.register(EmailRespondent)
class EmailRespondentAdmin(admin.ModelAdmin):
    list_display = ['emailRespondent_id', 'email_address', 'dateCreated']
    search_fields = ['email_address']
    readonly_fields = ['emailRespondent_id', 'dateCreated', 'dateUpdated']


@admin.register(SenaMinutes)
class SenaMinutesAdmin(admin.ModelAdmin):
    list_display = ['minute_id', 'minuteTitle', 'dateCreated']
    search_fields = ['minuteTitle']
    readonly_fields = ['minute_id', 'dateCreated', 'dateUpdated']


@admin.register(SenaAppointment)
class SenaAppointmentAdmin(admin.ModelAdmin):
    list_display = ['appointment_id', 'dateOfAppointment', 'startTime', 'endTime', 'dateCreated']
    list_filter = ['dateOfAppointment', 'dateCreated']
    search_fields = ['dateOfAppointment']
    readonly_fields = ['appointment_id', 'dateCreated', 'dateUpdated']


@admin.register(SenaRecord)
class SenaRecordAdmin(admin.ModelAdmin):
    list_display = [
        'sena_id',
        'senaTitle',
        'clientFirstName',
        'clientLastName',
        'clientStatus',
        'respondentStatus',
        'user',
    ]
    list_filter = ['clientStatus', 'respondentStatus', 'dateCreated']
    search_fields = ['senaTitle', 'clientFirstName', 'clientLastName']
    readonly_fields = ['sena_id', 'dateCreated', 'dateUpdated']
    fieldsets = (
        ('Record Information', {
            'fields': ('senaTitle', 'user')
        }),
        ('Related Records', {
            'fields': ('emailClients', 'emailRespondents', 'minute', 'appointments')
        }),
        ('Client Information', {
            'fields': (
                'clientFirstName',
                'clientMiddleName',
                'clientLastName',
                'clientSuffix',
                'clientAge',
                'clientContactNumber',
            )
        }),
        ('Status Information', {
            'fields': ('clientStatus', 'respondentStatus')
        }),
        ('System Information', {
            'fields': ('sena_id', 'dateCreated', 'dateUpdated'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AgencyRecord)
class AgencyRecordAdmin(admin.ModelAdmin):
    list_display = ['agency_id', 'agencyName', 'sena', 'dateCreated']
    search_fields = ['agencyName']
    readonly_fields = ['agency_id', 'dateCreated', 'dateUpdated']
