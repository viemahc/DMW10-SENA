# Generated migration for SENA Records

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SenaRecord',
            fields=[
                ('sena_id', models.AutoField(primary_key=True, serialize=False)),
                ('senaTitle', models.CharField(max_length=255)),
                ('clientFirstName', models.CharField(max_length=255)),
                ('clientMiddleName', models.CharField(blank=True, max_length=255, null=True)),
                ('clientLastName', models.CharField(max_length=255)),
                ('clientSuffix', models.CharField(blank=True, max_length=255, null=True)),
                ('clientAge', models.IntegerField()),
                ('clientContactNumber', models.CharField(max_length=255)),
                ('clientEmail', models.EmailField(max_length=254)),
                ('dateOfAppointment', models.DateTimeField()),
                ('senaStatus', models.CharField(choices=[('scheduled', 'Scheduled'), ('dismissed', 'Dismissed'), ('lack_of_interest', 'Lack of Interest'), ('nlrc', 'NLRC'), ('ongoing', 'On Going'), ('settled', 'Settled'), ('withdrawn', 'Withdrawn')], default='scheduled', max_length=20)),
                ('dateCreated', models.DateTimeField(auto_now_add=True)),
                ('dateUpdated', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sena_records', to='authentication.user')),
            ],
            options={
                'db_table': 'tbl_senaRecords',
            },
        ),
    ]
