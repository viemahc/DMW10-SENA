# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sena', '0006_senarecord_incharge'),
    ]

    operations = [
        migrations.AlterField(
            model_name='senarecord',
            name='inCharge',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
