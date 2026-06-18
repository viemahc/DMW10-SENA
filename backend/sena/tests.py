from django.test import TestCase
from django.utils import timezone
from authentication.models import User
from .models import SenaRecord


class SenaRecordModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            firstName='Test',
            lastName='User',
            emailAddress='test@example.com',
            password='testpass123'
        )

    def test_create_sena_record(self):
        appointment_datetime = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        record = SenaRecord.objects.create(
            user=self.user,
            senaTitle='Test Program',
            clientFirstName='John',
            clientLastName='Doe',
            clientAge=30,
            clientContactNumber='+63-9123456789',
            clientEmail='john@example.com',
            dateOfAppointment=appointment_datetime,
            senaStatus='scheduled'
        )
        self.assertTrue(record.pk)
        self.assertEqual(record.user, self.user)
        self.assertEqual(record.senaTitle, 'Test Program')

    def test_sena_record_str(self):
        appointment_datetime = timezone.now().replace(hour=10, minute=0, second=0, microsecond=0)
        record = SenaRecord.objects.create(
            user=self.user,
            senaTitle='Test Program',
            clientFirstName='John',
            clientLastName='Doe',
            clientAge=30,
            clientContactNumber='+63-9123456789',
            clientEmail='john@example.com',
            dateOfAppointment=appointment_datetime,
        )
        self.assertEqual(str(record), 'Test Program - John Doe')
