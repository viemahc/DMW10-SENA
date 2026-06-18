from django.contrib import admin
from .models import User, Role, UserRole

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['role_id', 'roleName', 'roleDescription', 'dateCreated']
    search_fields = ['roleName']
    readonly_fields = ['dateCreated']

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'firstName', 'lastName', 'emailAddress', 'dateCreated']
    search_fields = ['firstName', 'lastName', 'emailAddress']
    readonly_fields = ['dateCreated', 'dateUpdated']
    fieldsets = (
        ('Personal Information', {
            'fields': ('firstName', 'middleName', 'lastName', 'suffix')
        }),
        ('Account', {
            'fields': ('emailAddress', 'password')
        }),
        ('Dates', {
            'fields': ('dateCreated', 'dateUpdated'),
            'classes': ('collapse',)
        }),
    )

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['userRole_id', 'user', 'role', 'dateCreated']
    search_fields = ['user__emailAddress', 'role__roleName']
    readonly_fields = ['dateCreated']
    list_filter = ['role', 'dateCreated']

