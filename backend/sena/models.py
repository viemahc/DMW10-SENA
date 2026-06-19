from django.db import models, transaction
from authentication.models import User
from datetime import datetime


class EmailClient(models.Model):
    emailClient_id = models.AutoField(primary_key=True)
    email_address = models.EmailField(max_length=255, unique=True)
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_emailClient'

    def __str__(self):
        return self.email_address


class EmailRespondent(models.Model):
    emailRespondent_id = models.AutoField(primary_key=True)
    email_address = models.EmailField(max_length=255, unique=True)
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_emailRespondent'

    def __str__(self):
        return self.email_address


class SenaMinutes(models.Model):
    minute_id = models.AutoField(primary_key=True)
    minuteTitle = models.CharField(max_length=255)
    minuteFile = models.FileField(upload_to='minutes/', null=True, blank=True)
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_senaMinutes'

    def __str__(self):
        return self.minuteTitle


class SenaAppointment(models.Model):
    appointment_id = models.AutoField(primary_key=True)
    dateOfAppointment = models.DateField()
    startTime = models.TimeField(null=True, blank=True)
    endTime = models.TimeField(null=True, blank=True)
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_senaAppointment'

    def __str__(self):
        return f"{self.dateOfAppointment} {self.startTime or ''}-{self.endTime or ''}".strip()


class SenaRecord(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'SCHEDULED'),
        ('drop_due_to_absences', 'DROP DUE TO ABSENCES'),
        ('drop_due_to_lack_of_interest', 'DROP DUE TO LACK OF INTEREST'),
        ('endorse_to_adjudicator', 'ENDORSE TO ADJUDICATOR'),
        ('nlrc', 'NLRC'),
        ('ongoing', 'ONGOING'),
        ('settled', 'SETTLED'),
        ('withdrawn', 'WITHDRAWN'),
    ]

    SENA_PURPOSE_CHOICES = [
        ('recruitment_violation', 'Recruitment Violation'),
        ('money_claims', 'Money Claims'),
        ('daw', 'DAW'),
        ('dae', 'DAE'),
        ('rv_mc', 'RV/MC'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    BASE_CHOICES = [
        ('landbased', 'Landbased'),
        ('seabased', 'Seabased'),
    ]

    DEPLOYED_CHOICES = [
        ('deployed', 'Deployed'),
        ('non_deployed', 'Non-Deployed'),
    ]

    sena_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sena_records')
    emailClients = models.ManyToManyField(EmailClient, related_name='sena_records_clients', blank=True)
    emailRespondents = models.ManyToManyField(EmailRespondent, related_name='sena_records_respondents', blank=True)
    minute = models.ForeignKey(SenaMinutes, on_delete=models.SET_NULL, null=True, blank=True, related_name='sena_records')
    appointments = models.ManyToManyField(SenaAppointment, related_name='sena_records', blank=True)
    senaTitle = models.CharField(max_length=255)
    seadNumber = models.CharField(max_length=255, unique=True, blank=True, null=True)
    senaPurpose = models.CharField(max_length=30, choices=SENA_PURPOSE_CHOICES, blank=True, null=True)
    clientFirstName = models.CharField(max_length=255)
    clientMiddleName = models.CharField(max_length=255, blank=True, null=True)
    clientLastName = models.CharField(max_length=255)
    clientSuffix = models.CharField(max_length=255, blank=True, null=True)
    clientAge = models.IntegerField()
    clientContactNumber = models.CharField(max_length=255)
    clientGender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    clientBase = models.CharField(max_length=20, choices=BASE_CHOICES, blank=True, null=True)
    clientDeployed = models.CharField(max_length=20, choices=DEPLOYED_CHOICES, blank=True, null=True)
    clientIndigency = models.BooleanField(default=False)
    clientParent = models.BooleanField(default=False)
    clientPWD = models.BooleanField(default=False)
    clientStatus = models.CharField(
        max_length=35,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    respondentStatus = models.CharField(
        max_length=35,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    settledDate = models.DateField(blank=True, null=True)
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_senaRecords'

    def __str__(self):
        return f"{self.senaTitle} - {self.clientFirstName} {self.clientLastName}"

    def save(self, *args, **kwargs):
        # Auto-generate seadNumber if not provided
        if not self.seadNumber:
            with transaction.atomic():
                today = datetime.now()
                year = today.year
                month = today.month
                date_prefix = f'SEAD-{year}-{month:02d}'
                
                # Get the latest number for this month-year combination with row locking
                latest = SenaRecord.objects.select_for_update().filter(
                    seadNumber__startswith=date_prefix
                ).order_by('-seadNumber').first()
                
                if latest:
                    # Extract the last 4 digits and increment
                    last_number = int(latest.seadNumber.split('-')[-1])
                    next_number = last_number + 1
                else:
                    next_number = 1
                
                self.seadNumber = f'{date_prefix}-{next_number:04d}'
        
        # Auto-set settledDate when status changes to 'settled'
        if self.clientStatus == 'settled' and not self.settledDate:
            self.settledDate = datetime.now().date()
        
        super().save(*args, **kwargs)


class AgencyRecord(models.Model):
    agency_id = models.AutoField(primary_key=True)
    sena = models.ForeignKey(SenaRecord, on_delete=models.CASCADE, related_name='agency_records')
    agencyName = models.CharField(max_length=255)
    agencyDescription = models.TextField(blank=True, null=True)
    contact_number = models.CharField(max_length=255, blank=True, null=True)
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_agencyRecord'

    def __str__(self):
        return self.agencyName
