# Generated migration

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
        ('sena', '0005_alter_senarecord_dateofappointment'),
    ]

    operations = [
        migrations.AddField(
            model_name='senarecord',
            name='inCharge',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, to='authentication.user', related_name='sena_incharge_records'),
        ),
    ]
