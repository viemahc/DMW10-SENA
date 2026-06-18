from django.core.management.base import BaseCommand
from authentication.models import User, Role, UserRole
from django.contrib.auth.hashers import make_password


class Command(BaseCommand):
    help = 'Create sample users for testing'

    def handle(self, *args, **options):
        # Create roles
        admin_role, _ = Role.objects.get_or_create(
            roleName='Administrator',
            defaults={'roleDescription': 'Administrator role with full access'}
        )
        incharge_role, _ = Role.objects.get_or_create(
            roleName='Incharge',
            defaults={'roleDescription': 'Incharge role with management access'}
        )

        # Create sample users
        sample_users = [
            {
                'firstName': 'John',
                'middleName': 'Michael',
                'lastName': 'Doe',
                'suffix': '',
                'emailAddress': 'john.doe@example.com',
                'password': 'password123',
                'role': admin_role
            },
            {
                'firstName': 'Jane',
                'middleName': 'Marie',
                'lastName': 'Smith',
                'suffix': '',
                'emailAddress': 'jane.smith@example.com',
                'password': 'password123',
                'role': incharge_role
            }
        ]

        for user_data in sample_users:
            role = user_data.pop('role')
            password = user_data.pop('password')
            
            user, created = User.objects.get_or_create(
                emailAddress=user_data['emailAddress'],
                defaults={**user_data, 'password': make_password(password)}
            )
            
            if created:
                UserRole.objects.get_or_create(user=user, role=role)
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {user.emailAddress}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User already exists: {user.emailAddress}')
                )
        
        self.stdout.write(self.style.SUCCESS('Sample users created successfully!'))
