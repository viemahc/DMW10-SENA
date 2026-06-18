from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator

class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    roleName = models.CharField(max_length=255, unique=True)
    roleDescription = models.CharField(max_length=255)
    dateCreated = models.DateTimeField(auto_now_add=True)
    dateUpdated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tbl_roles'

    def __str__(self):
        return self.roleName


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    firstName = models.CharField(max_length=255)
    middleName = models.CharField(max_length=255, blank=True, null=True)
    lastName = models.CharField(max_length=255)
    suffix = models.CharField(max_length=255, blank=True, null=True)
    emailAddress = models.EmailField(unique=True, validators=[EmailValidator()])
    password = models.CharField(max_length=255)
    dateCreated = models.DateField(auto_now_add=True)
    dateUpdated = models.DateField(auto_now=True)

    class Meta:
        db_table = 'tbl_users'

    def __str__(self):
        return f"{self.firstName} {self.lastName}"


class UserRole(models.Model):
    userRole_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='users')
    dateCreated = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_userRoles'
        unique_together = ['user', 'role']

    def __str__(self):
        return f"{self.user.emailAddress} - {self.role.roleName}"
