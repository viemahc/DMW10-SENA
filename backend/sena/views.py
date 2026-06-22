from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from .models import SenaRecord, EmailClient, EmailRespondent, SenaMinutes, SenaAppointment, AgencyRecord
from .serializers import SenaRecordSerializer, EmailClientSerializer, EmailRespondentSerializer, SenaMinutesSerializer, SenaAppointmentSerializer, AgencyRecordSerializer
from authentication.models import User, UserRole, Role


class SenaRecordViewSet(viewsets.ModelViewSet):
    serializer_class = SenaRecordSerializer

    def check_authentication(self):
        """Check if user is authenticated via session"""
        user_id = self.request.session.get('user_id')
        if not user_id:
            raise PermissionError('Authentication credentials were not provided')
        try:
            user = User.objects.get(user_id=user_id)
            return user
        except User.DoesNotExist:
            raise PermissionError('User not found')

    def get_queryset(self):
        try:
            current_user = self.check_authentication()
            
            # Check if user is an administrator
            is_admin = False
            try:
                admin_role = Role.objects.get(roleName='Administrator')
                is_admin = UserRole.objects.filter(user=current_user, role=admin_role).exists()
            except Role.DoesNotExist:
                pass
            
            # Check if user_id is specified in query params
            requested_user_id = self.request.query_params.get('user_id')
            
            if requested_user_id:
                # If user_id is requested
                if is_admin:
                    # Admins can view any user's records
                    return SenaRecord.objects.filter(user_id=requested_user_id)
                else:
                    # Non-admins can only view their own records when specifically requested
                    if int(requested_user_id) == current_user.user_id:
                        return SenaRecord.objects.filter(user_id=requested_user_id)
                    else:
                        return SenaRecord.objects.none()
            else:
                # No user_id specified - return all records for authenticated users
                # This allows all users to see team statistics in the dashboard
                return SenaRecord.objects.all()
        except PermissionError:
            return SenaRecord.objects.none()

    def perform_create(self, serializer):
        """Set the user to the specified user, or default to authenticated user"""
        try:
            auth_user = self.check_authentication()
            
            # If user field is provided, use it; otherwise default to authenticated user
            if 'user' in serializer.validated_data and serializer.validated_data['user']:
                # User field is explicitly provided, save as-is
                serializer.save()
            else:
                # No user specified, default to authenticated user
                serializer.save(user=auth_user)
        except PermissionError as e:
            raise serializers.ValidationError(str(e))

    def perform_update(self, serializer):
        """Allow user field to be updated if provided"""
        try:
            user = self.check_authentication()
            
            # If user field is provided in the request, allow it to be updated
            # Otherwise, keep the existing user
            if 'user' in serializer.validated_data and serializer.validated_data['user']:
                serializer.save()
            else:
                # No user specified in update, keep existing
                serializer.save()
        except PermissionError as e:
            raise serializers.ValidationError(str(e))

    @action(detail=False, methods=['get'])
    def my_records(self, request):
        """Get SENA records for the current user"""
        try:
            user = self.check_authentication()
            records = SenaRecord.objects.filter(user=user)
            serializer = self.get_serializer(records, many=True)
            return Response(serializer.data)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Filter SENA records by client status"""
        try:
            self.check_authentication()
            status_filter = request.query_params.get('status', None)
            if status_filter:
                records = self.get_queryset().filter(clientStatus=status_filter)
                serializer = self.get_serializer(records, many=True)
                return Response(serializer.data)
            return Response(
                {'error': 'status parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=False, methods=['get'])
    def agencies(self, request):
        """Get list of unique agencies for dropdown selection"""
        try:
            self.check_authentication()
            # Get unique agencies with their most recent contact info
            agencies = AgencyRecord.objects.values('agencyName', 'agencyDescription', 'contact_number').distinct().order_by('agencyName')
            return Response(agencies)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=False, methods=['post'])
    def send_email(self, request):
        """Send appointment schedule email to client and respondent emails"""
        try:
            self.check_authentication()
            
            from django.core.mail import send_mass_mail
            
            recipient_emails = request.data.get('recipient_emails', [])
            subject = request.data.get('subject', 'SENA Schedule Notification')
            message = request.data.get('message', '')
            
            if not recipient_emails:
                return Response(
                    {'error': 'No recipient emails provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not message:
                return Response(
                    {'error': 'No message provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Remove duplicates and empty strings
            recipient_emails = list(set([email.strip() for email in recipient_emails if email.strip()]))
            
            # Prepare emails - send individual emails to each recipient
            emails = [
                (subject, message, 'chaves.jayemerald@gmail.com', [email])
                for email in recipient_emails
            ]
            
            # Send emails
            from django.core.mail import send_mass_mail
            send_mass_mail(emails, fail_silently=False)
            
            return Response({
                'success': True,
                'message': f'Email sent to {len(recipient_emails)} recipient(s)',
                'recipients_count': len(recipient_emails)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmailClientViewSet(viewsets.ModelViewSet):
    queryset = EmailClient.objects.all()
    serializer_class = EmailClientSerializer

    def check_authentication(self):
        """Check if user is authenticated via session"""
        user_id = self.request.session.get('user_id')
        if not user_id:
            raise PermissionError('Authentication credentials were not provided')
        try:
            user = User.objects.get(user_id=user_id)
            return user
        except User.DoesNotExist:
            raise PermissionError('User not found')

    def list(self, request, *args, **kwargs):
        try:
            self.check_authentication()
            return super().list(request, *args, **kwargs)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class EmailRespondentViewSet(viewsets.ModelViewSet):
    queryset = EmailRespondent.objects.all()
    serializer_class = EmailRespondentSerializer

    def check_authentication(self):
        """Check if user is authenticated via session"""
        user_id = self.request.session.get('user_id')
        if not user_id:
            raise PermissionError('Authentication credentials were not provided')
        try:
            user = User.objects.get(user_id=user_id)
            return user
        except User.DoesNotExist:
            raise PermissionError('User not found')

    def list(self, request, *args, **kwargs):
        try:
            self.check_authentication()
            return super().list(request, *args, **kwargs)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class SenaMinutesViewSet(viewsets.ModelViewSet):
    queryset = SenaMinutes.objects.all()
    serializer_class = SenaMinutesSerializer

    def check_authentication(self):
        """Check if user is authenticated via session"""
        user_id = self.request.session.get('user_id')
        if not user_id:
            raise PermissionError('Authentication credentials were not provided')
        try:
            user = User.objects.get(user_id=user_id)
            return user
        except User.DoesNotExist:
            raise PermissionError('User not found')

    def list(self, request, *args, **kwargs):
        try:
            self.check_authentication()
            return super().list(request, *args, **kwargs)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class SenaAppointmentViewSet(viewsets.ModelViewSet):
    queryset = SenaAppointment.objects.all()
    serializer_class = SenaAppointmentSerializer

    def check_authentication(self):
        """Check if user is authenticated via session"""
        user_id = self.request.session.get('user_id')
        if not user_id:
            raise PermissionError('Authentication credentials were not provided')
        try:
            user = User.objects.get(user_id=user_id)
            return user
        except User.DoesNotExist:
            raise PermissionError('User not found')

    def list(self, request, *args, **kwargs):
        try:
            self.check_authentication()
            return super().list(request, *args, **kwargs)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class AgencyRecordViewSet(viewsets.ModelViewSet):
    queryset = AgencyRecord.objects.all()
    serializer_class = AgencyRecordSerializer

    def check_authentication(self):
        """Check if user is authenticated via session"""
        user_id = self.request.session.get('user_id')
        if not user_id:
            raise PermissionError('Authentication credentials were not provided')
        try:
            user = User.objects.get(user_id=user_id)
            return user
        except User.DoesNotExist:
            raise PermissionError('User not found')

    def get_queryset(self):
        try:
            self.check_authentication()
            return AgencyRecord.objects.all()
        except PermissionError:
            return AgencyRecord.objects.none()
