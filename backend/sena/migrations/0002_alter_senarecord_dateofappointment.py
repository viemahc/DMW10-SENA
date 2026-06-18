# Generated migration to change dateOfAppointment from DateField to DateTimeField

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sena', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='senarecord',
            name='dateOfAppointment',
            field=models.DateTimeField(),
        ),
    ]
