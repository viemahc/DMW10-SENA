from django.db import models
from authentication.models import User


class SenaRecord(models.Model):
    SENA_STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('dismissed', 'Dismissed'),
        ('lack_of_interest', 'Lack of Interest'),
        ('nlrc', 'NLRC'),
        ('ongoing', 'On Going'),
        ('settled', 'Settled'),
        ('withdrawn', 'Withdrawn'),
    ]

    sena_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sena_records')
    senaTitle = models.CharField(max_length=255)
    clientFirstName = models.CharField(max_length=255)
    clientMiddleName = models.CharField(max_length=255, blank=True, null=True)
    clientLastName = models.CharField(max_length=255)
    clientSuffix = models.CharField(max_length=255, blank=True, null=True)
    clientAge = models.IntegerField()
    clientContactNumber = models.CharField(max_length=255)
    clientEmail = models.EmailField()
    dateOfAppointment = models.DateTimeField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    senaStatus = models.CharField(
        max_length=20,
        choices=SENA_STATUS_CHOICES,
        default='scheduled'
    )
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_senaRecords'

    def __str__(self):
        return f"{self.senaTitle} - {self.clientFirstName} {self.clientLastName}"
