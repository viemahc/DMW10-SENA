from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from .models import SenaRecord
from .serializers import SenaRecordSerializer
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
                    # Non-admins can only view their own records
                    if int(requested_user_id) == current_user.user_id:
                        return SenaRecord.objects.filter(user_id=requested_user_id)
                    else:
                        return SenaRecord.objects.none()
            else:
                # No user_id specified, use default behavior
                if is_admin:
                    return SenaRecord.objects.all()
                else:
                    return SenaRecord.objects.filter(user=current_user)
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
        """Filter SENA records by status"""
        try:
            self.check_authentication()
            status_filter = request.query_params.get('status', None)
            if status_filter:
                records = self.get_queryset().filter(senaStatus=status_filter)
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
