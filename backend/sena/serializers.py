from rest_framework import serializers
from django.utils import timezone
from datetime import datetime
from .models import SenaRecord


class SenaRecordSerializer(serializers.ModelSerializer):
    userName = serializers.CharField(source='user.emailAddress', read_only=True)
    userFullName = serializers.SerializerMethodField()

    class Meta:
        model = SenaRecord
        fields = [
            'sena_id',
            'user',
            'userName',
            'userFullName',
            'senaTitle',
            'clientFirstName',
            'clientMiddleName',
            'clientLastName',
            'clientSuffix',
            'clientAge',
            'clientContactNumber',
            'clientEmail',
            'dateOfAppointment',
            'start_time',
            'end_time',
            'senaStatus',
            'dateCreated',
            'dateUpdated',
        ]
        read_only_fields = ['sena_id', 'dateCreated', 'dateUpdated']

    def get_userFullName(self, obj):
        return f"{obj.user.firstName} {obj.user.lastName}"

    def validate(self, data):
        """Validate that there are no overlapping appointments for the same user on the same date"""
        if not data.get('start_time') or not data.get('end_time'):
            return data
        
        # Get the date from dateOfAppointment
        appointment_date = data.get('dateOfAppointment')
        if isinstance(appointment_date, datetime):
            appointment_date = appointment_date.date()
        
        user = data.get('user')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        # Get existing records for the same user on the same date
        conflicting_records = SenaRecord.objects.filter(
            user=user,
            dateOfAppointment__date=appointment_date,
            senaStatus='scheduled'  # Only check against scheduled appointments
        )
        
        # If this is an update, exclude the current record
        if self.instance:
            conflicting_records = conflicting_records.exclude(sena_id=self.instance.sena_id)
        
        # Check for time overlaps
        # Two appointments overlap if: NOT (new_end <= existing_start OR new_start >= existing_end)
        # In other words, they DON'T overlap only if one ends before or at the same time the other starts
        for record in conflicting_records:
            existing_start = record.start_time
            existing_end = record.end_time
            
            # If times are defined, check for overlap
            if existing_start and existing_end:
                # Appointments only conflict if they actually overlap, not just touch at boundaries
                # Allow touching: 14:00-14:30 and 14:30-15:00 should be allowed
                if not (end_time <= existing_start or start_time >= existing_end):
                    raise serializers.ValidationError(
                        f"Time slot conflict: A scheduled appointment already exists for this user on {appointment_date} "
                        f"from {existing_start.strftime('%I:%M %p')} to {existing_end.strftime('%I:%M %p')}. "
                        f"Please select a different time slot."
                    )
        
        return data
