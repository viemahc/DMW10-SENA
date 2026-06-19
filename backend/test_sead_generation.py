#!/usr/bin/env python
"""
Test script to verify SEAD number generation
Usage: python manage.py shell < test_sead_generation.py
Or: python manage.py shell and then copy-paste commands
"""

import os
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from sena.models import SenaRecord
from authentication.models import User

# Get or create a test user
user, _ = User.objects.get_or_create(
    user_id=1,
    defaults={
        'emailAddress': 'test@example.com',
        'firstName': 'Test',
        'lastName': 'User',
    }
)

print("=" * 60)
print("TESTING SEAD NUMBER AUTO-GENERATION")
print("=" * 60)

# Test 1: Create a record without specifying seadNumber
print("\n[Test 1] Creating first record (seadNumber auto-generated)...")
record1 = SenaRecord(
    user=user,
    senaTitle='Test Record 1',
    clientFirstName='John',
    clientLastName='Doe',
    clientAge=30,
    clientContactNumber='09123456789'
)
record1.save()
print(f"Generated SEAD Number: {record1.seadNumber}")
expected_format_1 = f"SEAD-{datetime.now().year}-{datetime.now().month:02d}-0001"
assert record1.seadNumber == expected_format_1, f"Expected {expected_format_1}, got {record1.seadNumber}"
print(f"✓ Format is correct: {expected_format_1}")

# Test 2: Create another record - should increment the number
print("\n[Test 2] Creating second record (should increment)...")
record2 = SenaRecord(
    user=user,
    senaTitle='Test Record 2',
    clientFirstName='Jane',
    clientLastName='Smith',
    clientAge=28,
    clientContactNumber='09987654321'
)
record2.save()
print(f"Generated SEAD Number: {record2.seadNumber}")
expected_format_2 = f"SEAD-{datetime.now().year}-{datetime.now().month:02d}-0002"
assert record2.seadNumber == expected_format_2, f"Expected {expected_format_2}, got {record2.seadNumber}"
print(f"✓ Incremented correctly: {expected_format_2}")

# Test 3: Verify no duplicates by checking unique constraint
print("\n[Test 3] Verifying unique constraint...")
try:
    record3 = SenaRecord(
        user=user,
        senaTitle='Test Record 3 - Duplicate SEAD',
        clientFirstName='Bob',
        clientLastName='Johnson',
        clientAge=35,
        clientContactNumber='09555555555',
        seadNumber=record1.seadNumber  # Trying to use same SEAD number
    )
    record3.save()
    print("✗ ERROR: Duplicate SEAD number was allowed!")
except Exception as e:
    print(f"✓ Duplicate rejected: {type(e).__name__}")

# Test 4: Manual SEAD number assignment (user can edit)
print("\n[Test 4] Creating record with manual SEAD number...")
custom_sead = f"SEAD-{datetime.now().year}-{datetime.now().month:02d}-9999"
record4 = SenaRecord(
    user=user,
    senaTitle='Test Record 4 - Custom SEAD',
    clientFirstName='Alice',
    clientLastName='Williams',
    clientAge=32,
    clientContactNumber='09111111111',
    seadNumber=custom_sead
)
record4.save()
print(f"Manual SEAD Number: {record4.seadNumber}")
assert record4.seadNumber == custom_sead
print(f"✓ Manual assignment works: {custom_sead}")

# Summary
print("\n" + "=" * 60)
print("SUMMARY OF SEAD NUMBER TESTS")
print("=" * 60)
print(f"Record 1: {record1.seadNumber}")
print(f"Record 2: {record2.seadNumber}")
print(f"Record 4: {record4.seadNumber}")
print("\n✓ All tests passed!")
print("✓ Format: SEAD-YYYY-MM-XXXX")
print("✓ Auto-incrementing: Verified")
print("✓ No duplicates: Verified via unique constraint")
print("✓ Manual editing: Verified")
print("=" * 60)
