from authentication.models import User, Role, UserRole

# Create roles
admin_role, _ = Role.objects.get_or_create(
    roleName='Administrator',
    defaults={'roleDescription': 'Administrator role with full access'}
)
incharge_role, _ = Role.objects.get_or_create(
    roleName='Incharge',
    defaults={'roleDescription': 'Incharge role with management access'}
)

# Get users and assign roles
john = User.objects.get(emailAddress='john.doe@example.com')
jane = User.objects.get(emailAddress='jane.smith@example.com')

UserRole.objects.get_or_create(user=john, role=admin_role)
UserRole.objects.get_or_create(user=jane, role=incharge_role)

print('✓ Administrator role assigned to john.doe@example.com')
print('✓ Incharge role assigned to jane.smith@example.com')
