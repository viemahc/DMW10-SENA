# SENA Records Feature

## Overview
The SENA Records feature manages client records and appointment information for SENA (Skills, Employment, and Needs Assessment) programs.

## Database Model

### tbl_senaRecords Table
- **sena_id** (PK, INT): Unique identifier for each SENA record
- **user_id** (FK, INT): Reference to the user who created/manages the record
- **senaTitle** (VARCHAR): Title/name of the SENA program
- **clientFirstName** (VARCHAR): Client's first name
- **clientMiddleName** (VARCHAR, nullable): Client's middle name
- **clientLastName** (VARCHAR): Client's last name
- **clientSuffix** (VARCHAR, nullable): Client's suffix (Jr., Sr., III, etc.)
- **clientAge** (INT): Client's age
- **clientContactNumber** (VARCHAR): Client's phone number
- **clientEmail** (VARCHAR): Client's email address
- **dateOfAppointment** (DATE): Scheduled appointment date
- **senaStatus** (ENUM): Record status (pending, approved, completed, rejected, on_hold)
- **dateCreated** (DATETIME): Record creation timestamp
- **dateUpdated** (DATETIME): Last update timestamp

## Setup Instructions

### Backend Setup

1. **Create database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Create sample SENA records (optional):**
   ```bash
   python manage.py create_sample_sena_records --count 10
   ```

### Frontend Routes

- **View all records**: `/sena-records`
- **Create new record**: `/sena-records/new`
- **Edit record**: `/sena-records/edit/:id`

## API Endpoints

### Base URL: `/api/sena/`

#### List Records
- **GET** `/records/`
- Returns paginated list of SENA records
- Filters by user if not an administrator

#### Get Single Record
- **GET** `/records/{sena_id}/`
- Returns a specific SENA record

#### Create Record
- **POST** `/records/`
- Required fields: senaTitle, clientFirstName, clientLastName, clientAge, clientContactNumber, clientEmail, dateOfAppointment
- Optional fields: clientMiddleName, clientSuffix

#### Update Record
- **PUT** `/records/{sena_id}/`
- Update any field of the record

#### Delete Record
- **DELETE** `/records/{sena_id}/`
- Removes the record from database

#### Get My Records
- **GET** `/records/my_records/`
- Returns records belonging to the current user

#### Filter by Status
- **GET** `/records/by_status/?status=pending`
- Returns records filtered by status
- Valid statuses: pending, approved, completed, rejected, on_hold

## Frontend Features

### SENA Records Page
- View all SENA records in a table format
- Filter records by status
- Edit existing records
- Delete records
- Create new records

### Create/Edit Form
- Comprehensive form with validation
- Sections for:
  - Program information (title, status)
  - Client information (name, age, contact)
  - Appointment details (date)
- Real-time validation and error handling

## Sidebar Integration
The SENA Records menu item has been added to the main navigation:
- Icon: 📋
- Link: `/sena-records`
- Accessible to all authenticated users

## Django Admin Integration
The SENA Records model is registered in Django admin with:
- List display showing key fields
- Filters for status and appointment date
- Search functionality for title, name, and email
- Organized fieldsets for data entry

## Management Commands

### create_sample_sena_records
Creates sample SENA records for testing purposes.

**Usage:**
```bash
python manage.py create_sample_sena_records --count 5
```

**Arguments:**
- `--count`: Number of sample records to create (default: 5)

## Testing
Unit tests are included in `sena/tests.py`:
- Test model creation
- Test string representation
- Test field validation

Run tests with:
```bash
python manage.py test sena
```

## Permissions
- All authenticated users can view their own records
- Administrators can view all records
- All authenticated users can create and edit records
- Records are associated with the user who created them
