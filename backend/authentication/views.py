from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from .models import User, UserRole, Role
from .serializers import (
    LoginSerializer, UserDetailSerializer, UserRegistrationSerializer, 
    ProfileUpdateSerializer, UserManagementSerializer, RoleAssignmentSerializer
)


def is_administrator(request):
    """Check if current user is administrator"""
    if 'user_id' not in request.session:
        return False
    
    try:
        user = User.objects.get(user_id=request.session['user_id'])
        admin_role = Role.objects.get(roleName='Administrator')
        return UserRole.objects.filter(user=user, role=admin_role).exists()
    except (User.DoesNotExist, Role.DoesNotExist):
        return False


@api_view(['POST'])
def login(request):
    """Login user and create session"""
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data.get('user')
        
        # Set session
        request.session['user_id'] = user.user_id
        request.session['email'] = user.emailAddress
        
        # Get user details with roles
        user_detail = UserDetailSerializer(user)
        
        return Response({
            'status': 'success',
            'message': 'Login successful',
            'user': user_detail.data
        }, status=status.HTTP_200_OK)
    
    return Response({
        'status': 'error',
        'errors': serializer.errors
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
def logout(request):
    """Logout user and destroy session"""
    if 'user_id' in request.session:
        del request.session['user_id']
    if 'email' in request.session:
        del request.session['email']
    
    return Response({
        'status': 'success',
        'message': 'Logout successful'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_user_profile(request):
    """Get current user profile"""
    if 'user_id' not in request.session:
        return Response({
            'status': 'error',
            'message': 'User not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        user = User.objects.get(user_id=request.session['user_id'])
        serializer = UserDetailSerializer(user)
        return Response({
            'status': 'success',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def register(request):
    """Register new user"""
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'status': 'success',
            'message': 'User registered successfully',
            'user': UserDetailSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'status': 'error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def check_auth(request):
    """Check if user is authenticated"""
    if 'user_id' in request.session:
        try:
            user = User.objects.get(user_id=request.session['user_id'])
            serializer = UserDetailSerializer(user)
            return Response({
                'status': 'success',
                'authenticated': True,
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'status': 'error',
                'authenticated': False
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'status': 'error',
        'authenticated': False
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['PUT', 'PATCH'])
def update_profile(request):
    """Update current user profile"""
    if 'user_id' not in request.session:
        return Response({
            'status': 'error',
            'message': 'User not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        user = User.objects.get(user_id=request.session['user_id'])
        serializer = ProfileUpdateSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            user_detail = UserDetailSerializer(user)
            return Response({
                'status': 'success',
                'message': 'Profile updated successfully',
                'user': user_detail.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_users(request):
    """Get all users (Admin only)"""
    if not is_administrator(request):
        return Response({
            'status': 'error',
            'message': 'Only administrators can access this resource'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        users = User.objects.all().order_by('dateCreated')
        serializer = UserManagementSerializer(users, many=True)
        return Response({
            'status': 'success',
            'count': users.count(),
            'users': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_user_detail_admin(request, user_id):
    """Get user details (Admin only)"""
    if not is_administrator(request):
        return Response({
            'status': 'error',
            'message': 'Only administrators can access this resource'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(user_id=user_id)
        serializer = UserManagementSerializer(user)
        return Response({
            'status': 'success',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def assign_role(request, user_id):
    """Assign role to user (Admin only)"""
    if not is_administrator(request):
        return Response({
            'status': 'error',
            'message': 'Only administrators can access this resource'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(user_id=user_id)
        serializer = RoleAssignmentSerializer(data=request.data)
        
        if serializer.is_valid():
            role_id = serializer.validated_data['role_id']
            role = Role.objects.get(role_id=role_id)
            
            # Check if role is already assigned
            if UserRole.objects.filter(user=user, role=role).exists():
                return Response({
                    'status': 'error',
                    'message': 'User already has this role'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Assign role
            UserRole.objects.create(user=user, role=role)
            
            user_detail = UserManagementSerializer(user)
            return Response({
                'status': 'success',
                'message': f'Role {role.roleName} assigned successfully',
                'user': user_detail.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def remove_role(request, user_id, role_id):
    """Remove role from user (Admin only)"""
    if not is_administrator(request):
        return Response({
            'status': 'error',
            'message': 'Only administrators can access this resource'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(user_id=user_id)
        role = Role.objects.get(role_id=role_id)
        
        user_role = UserRole.objects.filter(user=user, role=role)
        
        if not user_role.exists():
            return Response({
                'status': 'error',
                'message': 'User does not have this role'
            }, status=status.HTTP_404_NOT_FOUND)
        
        user_role.delete()
        
        user_detail = UserManagementSerializer(user)
        return Response({
            'status': 'success',
            'message': f'Role {role.roleName} removed successfully',
            'user': user_detail.data
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Role.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'Role not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
def delete_user(request, user_id):
    """Delete user (Admin only)"""
    if not is_administrator(request):
        return Response({
            'status': 'error',
            'message': 'Only administrators can access this resource'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Prevent admin from deleting themselves
    current_user_id = request.session.get('user_id')
    if current_user_id == user_id:
        return Response({
            'status': 'error',
            'message': 'Cannot delete your own account'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(user_id=user_id)
        user_name = user.full_name
        user.delete()
        
        return Response({
            'status': 'success',
            'message': f'User {user_name} deleted successfully'
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_all_roles(request):
    """Get all available roles"""
    try:
        roles = Role.objects.all()
        serializer = RoleAssignmentSerializer(roles, many=True)
        return Response({
            'status': 'success',
            'roles': [{'role_id': role.role_id, 'roleName': role.roleName, 'roleDescription': role.roleDescription} for role in roles]
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
