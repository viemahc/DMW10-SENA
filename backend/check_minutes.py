#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from sena.models import SenaMinutes, SenaRecord

print('Total minutes in DB:', SenaMinutes.objects.count())
print('\nAll minutes:')
for m in SenaMinutes.objects.all():
    print(f'  - ID {m.minute_id}: {m.minuteTitle} (file: {m.minuteFile})')

print('\nRecords with minutes:')
records = SenaRecord.objects.filter(minute__isnull=False)
print(f'Count: {records.count()}')
for r in records:
    print(f'  - SEAD {r.seadNumber}: {r.minute.minuteTitle if r.minute else "None"}')
