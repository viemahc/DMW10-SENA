from rest_framework import serializers
from .models import SenaRecord, EmailClient, EmailRespondent, SenaMinutes, SenaAppointment, AgencyRecord


class EmailClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailClient
        fields = ['emailClient_id', 'email_address', 'dateCreated', 'dateUpdated']
        read_only_fields = ['emailClient_id', 'dateCreated', 'dateUpdated']


class EmailRespondentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailRespondent
        fields = ['emailRespondent_id', 'email_address', 'dateCreated', 'dateUpdated']
        read_only_fields = ['emailRespondent_id', 'dateCreated', 'dateUpdated']


class SenaMinutesSerializer(serializers.ModelSerializer):
    class Meta:
        model = SenaMinutes
        fields = ['minute_id', 'minuteTitle', 'minuteFile', 'dateCreated', 'dateUpdated']
        read_only_fields = ['minute_id', 'dateCreated', 'dateUpdated']


class SenaAppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SenaAppointment
        fields = ['appointment_id', 'dateOfAppointment', 'startTime', 'endTime', 'dateCreated', 'dateUpdated']
        read_only_fields = ['appointment_id', 'dateCreated', 'dateUpdated']


class AgencyRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyRecord
        fields = ['agency_id', 'sena', 'agencyName', 'agencyDescription', 'contact_number', 'dateCreated', 'dateUpdated']
        read_only_fields = ['agency_id', 'dateCreated', 'dateUpdated']


class SenaRecordSerializer(serializers.ModelSerializer):
    userName = serializers.CharField(source='user.emailAddress', read_only=True)
    userFullName = serializers.SerializerMethodField()
    clientEmails = serializers.SerializerMethodField()
    respondentEmails = serializers.SerializerMethodField()
    minute = SenaMinutesSerializer(read_only=True)
    minuteTitle = serializers.CharField(source='minute.minuteTitle', read_only=True, allow_null=True)
    appointments = SenaAppointmentSerializer(many=True, read_only=True)
    agency_records = AgencyRecordSerializer(many=True, read_only=True)
    agencyName = serializers.CharField(write_only=True, required=False, allow_blank=True)
    agencyDescription = serializers.CharField(write_only=True, required=False, allow_blank=True)
    agencyContactNumber = serializers.CharField(write_only=True, required=False, allow_blank=True)
    clientEmailsInput = serializers.ListField(child=serializers.EmailField(), write_only=True, required=False)
    respondentEmailsInput = serializers.ListField(child=serializers.EmailField(), write_only=True, required=False)
    appointmentsInput = serializers.ListField(
        child=SenaAppointmentSerializer(),
        write_only=True,
        required=False
    )
    minute_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = SenaRecord
        fields = [
            'sena_id',
            'user',
            'userName',
            'userFullName',
            'clientEmails',
            'respondentEmails',
            'clientEmailsInput',
            'respondentEmailsInput',
            'minute',
            'minute_id',
            'minuteTitle',
            'appointments',
            'appointmentsInput',
            'senaTitle',
            'seadNumber',
            'senaPurpose',
            'clientFirstName',
            'clientMiddleName',
            'clientLastName',
            'clientSuffix',
            'clientAge',
            'clientContactNumber',
            'clientGender',
            'clientBase',
            'clientDeployed',
            'clientIndigency',
            'clientParent',
            'clientPWD',
            'clientStatus',
            'respondentStatus',
            'settledDate',
            'agency_records',
            'agencyName',
            'agencyDescription',
            'agencyContactNumber',
            'dateCreated',
            'dateUpdated',
        ]
        read_only_fields = ['sena_id', 'dateCreated', 'dateUpdated', 'agency_records', 'clientEmails', 'respondentEmails', 'appointments']

    def get_userFullName(self, obj):
        return f"{obj.user.firstName} {obj.user.lastName}"

    def get_clientEmails(self, obj):
        return [ec.email_address for ec in obj.emailClients.all()]

    def get_respondentEmails(self, obj):
        return [er.email_address for er in obj.emailRespondents.all()]

    def to_internal_value(self, data):
        # Convert empty strings to None for optional choice fields
        if 'senaPurpose' in data and data['senaPurpose'] == '':
            data['senaPurpose'] = None
        if 'clientGender' in data and data['clientGender'] == '':
            data['clientGender'] = None
        if 'clientBase' in data and data['clientBase'] == '':
            data['clientBase'] = None
        if 'clientDeployed' in data and data['clientDeployed'] == '':
            data['clientDeployed'] = None
        if 'seadNumber' in data and data['seadNumber'] == '':
            data['seadNumber'] = None
        if 'settledDate' in data and data['settledDate'] == '':
            data['settledDate'] = None
        
        # Handle minute field - convert to minute_id for backend processing
        if 'minute' in data:
            data['minute_id'] = data.pop('minute')
        
        return super().to_internal_value(data)

    def create(self, validated_data):
        appointmentsInput = validated_data.pop('appointmentsInput', [])
        agencyName = validated_data.pop('agencyName', None)
        agencyDescription = validated_data.pop('agencyDescription', None)
        agencyContactNumber = validated_data.pop('agencyContactNumber', None)
        clientEmailsInput = validated_data.pop('clientEmailsInput', [])
        respondentEmailsInput = validated_data.pop('respondentEmailsInput', [])
        minute_id = validated_data.pop('minute_id', None)
        
        sena_record = super().create(validated_data)
        
        # Link minute if provided
        if minute_id:
            try:
                minute = SenaMinutes.objects.get(minute_id=minute_id)
                sena_record.minute = minute
                sena_record.save()
            except SenaMinutes.DoesNotExist:
                raise serializers.ValidationError({'minute_id': 'Minute not found'})
        
        # Add appointments
        for appt_data in appointmentsInput:
            appointment, _ = SenaAppointment.objects.get_or_create(**appt_data)
            sena_record.appointments.add(appointment)
        
        # Add client emails
        for email in clientEmailsInput:
            email_obj, _ = EmailClient.objects.get_or_create(email_address=email)
            sena_record.emailClients.add(email_obj)
        
        # Add respondent emails
        for email in respondentEmailsInput:
            email_obj, _ = EmailRespondent.objects.get_or_create(email_address=email)
            sena_record.emailRespondents.add(email_obj)
        
        # Create AgencyRecord for this SENA if agency data provided
        if agencyName or agencyDescription or agencyContactNumber:
            AgencyRecord.objects.create(
                sena=sena_record,
                agencyName=agencyName or '',
                agencyDescription=agencyDescription or '',
                contact_number=agencyContactNumber or None
            )
        
        return sena_record

    def update(self, instance, validated_data):
        appointmentsInput = validated_data.pop('appointmentsInput', None)
        agencyName = validated_data.pop('agencyName', None)
        agencyDescription = validated_data.pop('agencyDescription', None)
        agencyContactNumber = validated_data.pop('agencyContactNumber', None)
        clientEmailsInput = validated_data.pop('clientEmailsInput', None)
        respondentEmailsInput = validated_data.pop('respondentEmailsInput', None)
        minute_id = validated_data.pop('minute_id', None)
        
        # Update minute if provided (check both minute and minute_id for flexibility)
        if minute_id is not None:
            if minute_id:
                try:
                    minute = SenaMinutes.objects.get(minute_id=minute_id)
                    instance.minute = minute
                except SenaMinutes.DoesNotExist:
                    raise serializers.ValidationError({'minute_id': 'Minute not found'})
            else:
                instance.minute = None
        
        # Update appointments if provided
        if appointmentsInput is not None:
            instance.appointments.clear()
            for appt_data in appointmentsInput:
                appointment, _ = SenaAppointment.objects.get_or_create(**appt_data)
                instance.appointments.add(appointment)
        
        # Update client emails if provided
        if clientEmailsInput is not None:
            instance.emailClients.clear()
            for email in clientEmailsInput:
                email_obj, _ = EmailClient.objects.get_or_create(email_address=email)
                instance.emailClients.add(email_obj)
        
        # Update respondent emails if provided
        if respondentEmailsInput is not None:
            instance.emailRespondents.clear()
            for email in respondentEmailsInput:
                email_obj, _ = EmailRespondent.objects.get_or_create(email_address=email)
                instance.emailRespondents.add(email_obj)
        
        # Update or create AgencyRecord for THIS SENA only
        if agencyName is not None or agencyDescription is not None or agencyContactNumber is not None:
            # Always work with this SENA's agency record
            agency_record = instance.agency_records.first()
            if agency_record:
                # Update existing agency record for this SENA
                if agencyName is not None:
                    agency_record.agencyName = agencyName
                if agencyDescription is not None:
                    agency_record.agencyDescription = agencyDescription
                if agencyContactNumber is not None:
                    agency_record.contact_number = agencyContactNumber
                agency_record.save()
            else:
                # Create new agency record for this SENA
                AgencyRecord.objects.create(
                    sena=instance,
                    agencyName=agencyName or '',
                    agencyDescription=agencyDescription or '',
                    contact_number=agencyContactNumber or None
                )
        
        # Save the instance if minute was updated
        instance.save()
        
        return super().update(instance, validated_data)

    def validate(self, data):
        """Validate sena record data"""
        appointment = data.get('appointment')
        user = data.get('user')
        
        if not appointment or not user:
            return data
        
        appointment_date = appointment.get('dateOfAppointment')
        if not appointment_date:
            appointment.save()
        
        # Update or create AgencyRecord
        if agencyName is not None or agencyDescription is not None:
            agency_record = instance.agency_records.first()
            if agency_record:
                if agencyName is not None:
                    agency_record.agencyName = agencyName
                if agencyDescription is not None:
                    agency_record.agencyDescription = agencyDescription
                agency_record.save()
            else:
                AgencyRecord.objects.create(
                    sena=instance,
                    agencyName=agencyName or '',
                    agencyDescription=agencyDescription or ''
                )
        
        return super().update(instance, validated_data)

    def validate(self, data):
        """Validate sena record data"""
        appointment = data.get('appointment')
        user = data.get('user')
        
        if not appointment or not user:
            return data
        
        appointment_date = appointment.get('dateOfAppointment')
        if not appointment_date:
            return data
        
        # Get existing records for the same user on the same date with scheduled status
        conflicting_records = SenaRecord.objects.filter(
            user=user,
            appointment__dateOfAppointment=appointment_date,
            clientStatus='scheduled'
        )
        
        # If this is an update, exclude the current record
        if self.instance:
            conflicting_records = conflicting_records.exclude(sena_id=self.instance.sena_id)
        
        if conflicting_records.exists():
            raise serializers.ValidationError(
                f"A scheduled appointment already exists for this user on {appointment_date}. "
                f"Please select a different date."
            )
        
        return data
