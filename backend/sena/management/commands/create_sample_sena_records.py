from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, time
from sena.models import SenaRecord
from authentication.models import User


class Command(BaseCommand):
    help = 'Create sample SENA records for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of sample records to create'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        # Get all users
        users = User.objects.all()
        if not users.exists():
            self.stdout.write(
                self.style.ERROR('No users found. Please create users first.')
            )
            return

        sena_titles = [
            'Skills Development Program',
            'Technical Training',
            'Career Counseling',
            'Job Placement Assistance',
            'Professional Development',
        ]

        status_choices = ['scheduled', 'dismissed', 'lack_of_interest', 'nlrc', 'ongoing', 'settled', 'withdrawn']

        created_count = 0
        for i in range(count):
            user = users[i % users.count()]
            
            # Create appointment date (date only, no time - midnight)
            appointment_date = timezone.now() + timedelta(days=i)
            appointment_datetime = appointment_date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Create start and end times
            start_hour = 9 + (i % 8)
            start_time_obj = time(start_hour, 0)
            end_time_obj = time(min(start_hour + 2, 17), 0)  # 2-hour sessions, max 5 PM
            
            record = SenaRecord.objects.create(
                user=user,
                senaTitle=sena_titles[i % len(sena_titles)],
                clientFirstName=f'Client{i}',
                clientMiddleName='M' if i % 2 == 0 else '',
                clientLastName=f'Surname{i}',
                clientSuffix='Jr.' if i % 3 == 0 else '',
                clientAge=25 + (i % 40),
                clientContactNumber=f'+63-9{i:09d}',
                clientEmail=f'client{i}@example.com',
                dateOfAppointment=appointment_datetime,
                start_time=start_time_obj,
                end_time=end_time_obj,
                senaStatus=status_choices[i % len(status_choices)],
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} sample SENA records'
            )
        )
