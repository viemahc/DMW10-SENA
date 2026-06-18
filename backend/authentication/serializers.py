from rest_framework import serializers
from django.contrib.auth.hashers import make_password, check_password
from .models import User, Role, UserRole


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['role_id', 'roleName', 'roleDescription']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'firstName', 'middleName', 'lastName', 'suffix', 'emailAddress', 'dateCreated']


class UserDetailSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['user_id', 'firstName', 'middleName', 'lastName', 'suffix', 'emailAddress', 'roles']

    def get_roles(self, obj):
        user_roles = UserRole.objects.filter(user=obj)
        return [{'role_id': ur.role.role_id, 'roleName': ur.role.roleName} for ur in user_roles]


class LoginSerializer(serializers.Serializer):
    emailAddress = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('emailAddress')
        password = data.get('password')

        try:
            user = User.objects.get(emailAddress=email)
            if not check_password(password, user.password):
                raise serializers.ValidationError("Invalid email or password")
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password")

        data['user'] = user
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['firstName', 'middleName', 'lastName', 'suffix', 'emailAddress', 'password', 'password_confirm']

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.password = make_password(password)
        user.save()
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['firstName', 'middleName', 'lastName', 'suffix', 'password', 'password_confirm']

    def validate_password(self, value):
        """Validate password field"""
        if value:
            value = value.strip()
        return value

    def validate(self, data):
        password = data.get('password', '')
        password_confirm = data.get('password_confirm', '')
        
        # Strip whitespace
        if password:
            password = password.strip()
        if password_confirm:
            password_confirm = password_confirm.strip()
        
        # If either password field has content, both must match
        if password or password_confirm:
            if not password or not password_confirm:
                raise serializers.ValidationError("Both password fields are required when changing password")
            if password != password_confirm:
                raise serializers.ValidationError("Passwords do not match")
        
        return data

    def update(self, instance, validated_data):
        # Update personal info
        instance.firstName = validated_data.get('firstName', instance.firstName)
        instance.middleName = validated_data.get('middleName', instance.middleName)
        instance.lastName = validated_data.get('lastName', instance.lastName)
        instance.suffix = validated_data.get('suffix', instance.suffix)
        
        # Update password if provided
        password = validated_data.get('password', '').strip() if validated_data.get('password') else ''
        if password:
            instance.password = make_password(password)
        
        instance.save()
        return instance


class UserManagementSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['user_id', 'firstName', 'middleName', 'lastName', 'suffix', 'emailAddress', 'full_name', 'roles', 'dateCreated', 'dateUpdated']

    def get_roles(self, obj):
        user_roles = UserRole.objects.filter(user=obj)
        return [{'role_id': ur.role.role_id, 'roleName': ur.role.roleName} for ur in user_roles]

    def get_full_name(self, obj):
        return f"{obj.firstName} {obj.lastName}".strip()


class RoleAssignmentSerializer(serializers.Serializer):
    role_id = serializers.IntegerField()

    def validate_role_id(self, value):
        try:
            Role.objects.get(role_id=value)
        except Role.DoesNotExist:
            raise serializers.ValidationError("Role not found")
        return value
