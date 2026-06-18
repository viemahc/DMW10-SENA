# Migration to fix dateOfAppointment column type from DATE to DATETIME

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('sena', '0003_senarecord_end_time_senarecord_start_time'),
    ]

    operations = [
        migrations.RunSQL(
            "ALTER TABLE `tbl_senaRecords` MODIFY COLUMN `dateOfAppointment` DATETIME NOT NULL;",
            reverse_sql="ALTER TABLE `tbl_senaRecords` MODIFY COLUMN `dateOfAppointment` DATE NOT NULL;",
        ),
    ]
