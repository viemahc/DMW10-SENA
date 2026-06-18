# Generated migration

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sena', '0007_alter_senarecord_incharge'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='senarecord',
            name='inCharge',
        ),
    ]
