# FUNCTIONAL REQUIREMENTS DETAILED ANALYSIS

## 3. FUNCTIONAL REQUIREMENTS DOCUMENTATION

### FR-1: User Authentication & Authorization
**Status:** ✅ **IMPLEMENTED**  
**Priority:** P0 (Critical)  
**Complexity:** Medium

#### Description
System provides secure email/password authentication with role-based access control for four user types: Admin, Doctor, Receptionist, and Patient.

#### User Stories
- **US-1.1:** As a user, I can log in with email and password
- **US-1.2:** As a user, I can only access features permitted for my role
- **US-1.3:** As a user, my session expires after 7 days of inactivity
- **US-1.4:** As an unauthenticated user, I am redirected to login page

#### Implementation Details
| Component | File | Lines |
|-----------|------|-------|
| Auth Server Config | `lib/auth.ts` | 1-31 |
| Auth Client Hooks | `lib/auth-client.ts` | 1-9 |
| Auth API Handler | `app/api/auth/[...all]/route.ts` | 1-5 |
| Login Page | `app/login/page.tsx` | 1-200+ |

#### Technical Specifications
```typescript
// Authentication Flow
1. User submits email + password
2. Better Auth validates credentials
3. bcrypt.compare(password, hashedPassword)
4. If valid: Create session with 7-day expiry
5. Store session in database
6. Return session token to client
7. Client stores token in cookie
8. Subsequent requests include token
9. Server validates token on each request
```

#### Validation Rules
- ✅ Email must be unique (database constraint)
- ✅ Password hashed with bcrypt (10 rounds)
- ✅ Session token stored in database
- ❌ **MISSING:** Password complexity requirements
- ❌ **MISSING:** Account lockout after failed attempts
- ❌ **MISSING:** Email verification

#### Authorization Matrix
| Feature | Admin | Doctor | Receptionist | Patient |
|---------|-------|--------|--------------|---------|
| View All Users | ✅ | ❌ | ❌ | ❌ |
| Create Users | ✅ | ❌ | ❌ | ❌ |
| Delete Users | ✅ | ❌ | ❌ | ❌ |
| View All Appointments | ✅ | ❌ | ✅ | ❌ |
| View Own Appointments | ✅ | ✅ | ✅ | ✅ |
| Book Appointments | ✅ | ❌ | ✅ | ✅ |
| Cancel Own Appointments | ✅ | ❌ | ✅ | ✅ |
| Cancel Others' Appointments | ✅ | ❌ | ✅ | ❌ |
| Create Medical Records | ❌ | ✅ | ❌ | ❌ |
| View Medical Records | ✅ | ✅ | ❌ | ✅ (own) |
| Register Patients | ✅ | ❌ | ✅ | ❌ |
| Export Audit Logs | ✅ | ❌ | ❌ | ❌ |

#### Security Considerations
- ✅ Passwords never stored in plain text
- ✅ Sessions expire automatically
- ✅ Role checked on every API request
- ❌ **MISSING:** CSRF protection
- ❌ **MISSING:** Rate limiting on login
- ❌ **MISSING:** Multi-factor authentication

#### Test Cases
```
TC-1.1: Valid Login
  Input: email="admin@hospital.com", password="password123"
  Expected: 200 OK, session created, redirect to /dashboard
  
TC-1.2: Invalid Password
  Input: email="admin@hospital.com", password="wrong"
  Expected: 401 Unauthorized, error message
  
TC-1.3: Non-existent User
  Input: email="fake@example.com", password="anything"
  Expected: 401 Unauthorized
  
TC-1.4: Role-based Access
  Input: Patient user tries to access /dashboard/admin
  Expected: 403 Forbidden or redirect to /dashboard/patient
  
TC-1.5: Session Expiry
  Input: Session older than 7 days
  Expected: 401 Unauthorized, redirect to login
```

#### Known Issues
1. **No password reset functionality** - Users cannot recover forgotten passwords
2. **No email verification** - Email addresses not verified
3. **Session fixation vulnerability** - Session ID not regenerated after login

---

### FR-2: Patient Registration
**Status:** ✅ **IMPLEMENTED**  
**Priority:** P0 (Critical)  
**Complexity:** Medium

#### Description
Admin and Receptionist users can register new patients with medical information. System auto-generates unique patient card numbers.

#### User Stories
- **US-2.1:** As a receptionist, I can register a new patient with personal and medical details
- **US-2.2:** As an admin, I can create patient accounts
- **US-2.3:** As the system, I auto-generate unique patient card numbers in format BK-P-YYYY-NNNN

#### Implementation Details
| Component | File | Key Functions |
|-----------|------|---------------|
| Patient API | `app/api/patients/route.ts` | POST handler |
| Admin User API | `app/api/admin/users/route.ts` | POST handler |
| Registration Form | `app/dashboard/receptionist/register/page.tsx` | Form UI |

#### Data Flow
```
1. Receptionist fills registration form
2. Frontend validates inputs (Zod schema)
3. POST /api/patients with patient data
4. Backend checks email uniqueness
5. Hash password with bcrypt
6. Start database transaction:
   a. Create User record (role=PATIENT)
   b. Create Patient record (medical info)
   c. Create Account record (for Better Auth)
7. Commit transaction
8. Return success response
9. Frontend shows success toast
10. Redirect to receptionist dashboard
```

#### Input Fields
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | String | ✅ | Min 2 chars |
| email | String | ✅ | Valid email format, unique |
| phone | String | ✅ | Phone format |
| dateOfBirth | Date | ✅ | Past date |
| bloodType | Enum | ✅ | A+, A-, B+, B-, AB+, AB-, O+, O- |
| password | String | ✅ | Min 8 chars (not enforced) |

#### Business Rules
1. **Email Uniqueness:** Each email can only be registered once
2. **Card Number Generation:** Sequential format `BK-P-{YEAR}-{SEQUENCE}`
   - Example: BK-P-2026-0001, BK-P-2026-0002
   - Sequence resets yearly (not implemented)
3. **Default Password:** If not provided, defaults to "patient123"
4. **Automatic Account Creation:** Better Auth account created automatically

#### API Specification
```typescript
POST /api/patients
Authorization: Required (Admin or Receptionist)
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+251911223344",
  "dateOfBirth": "1990-01-15",
  "bloodType": "O+",
  "password": "securePassword123"
}

Response 200 OK:
{
  "id": "clx123abc",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "PATIENT",
  "patient": {
    "id": "clx456def",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "bloodType": "O+",
    "cardNumber": "BK-P-2026-0007"
  }
}

Response 400 Bad Request:
{
  "message": "User with this email already exists"
}

Response 401 Unauthorized:
{
  "message": "Unauthorized"
}
```

#### Database Transaction
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create User
  const user = await tx.user.create({
    data: {
      name, email, phone, password: hashedPassword, role: "PATIENT"
    }
  });
  
  // 2. Create Patient
  await tx.patient.create({
    data: {
      userId: user.id,
      dateOfBirth: new Date(dateOfBirth),
      bloodType
    }
  });
  
  // 3. Create Account (Better Auth)
  await tx.account.create({
    data: {
      userId: user.id,
      accountId: email,
      providerId: "credential",
      password: hashedPassword
    }
  });
  
  return user;
});
```

#### Known Issues
1. **Card number sequence not truly sequential** - Uses patient count, not atomic counter
2. **No duplicate phone number check** - Multiple patients can have same phone
3. **No address field** - Missing important patient information
4. **No emergency contact** - Critical for healthcare system
5. **Blood type stored as string** - Should be enum for data integrity

---

### FR-3: Appointment Scheduling
**Status:** ✅ **IMPLEMENTED**  
**Priority:** P0 (Critical)  
**Complexity:** High

#### Description
Patients, Receptionists, and Admins can book appointments with doctors. System prevents double-booking through real-time availability checking.

#### User Stories
- **US-3.1:** As a patient, I can book an appointment with an available doctor
- **US-3.2:** As a receptionist, I can book appointments on behalf of patients
- **US-3.3:** As the system, I prevent double-booking of doctors
- **US-3.4:** As a user, I can check doctor availability before booking
- **US-3.5:** As a user, I can view my appointments filtered by role

#### Implementation Details
| Component | File | Purpose |
|-----------|------|---------|
| Appointment Booking | `app/api/appointments/route.ts` | Create appointments |
| Availability Check | `app/api/appointments/check-availability/route.ts` | Real-time slot checking |
| Appointment List | `app/api/appointments/route.ts` (GET) | Role-filtered listing |
| Appointment Search | `app/api/appointments/search/route.ts` | Search by patient/doctor name |
| Patient Booking UI | `app/dashboard/patient/book/page.tsx` | Patient booking form |

#### Appointment Booking Flow
```
┌─────────────┐
│   Patient   │
│  selects    │
│   doctor    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Selects    │
│ date & time │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ Click "Check Availability"│
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ GET /api/appointments/         │
│ check-availability?            │
│ doctorId=X&dateTime=Y          │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Query existing appointments    │
│ for doctor in that hour        │
└──────┬─────────────────────────┘
       │
       ├─── Available ───┐
       │                 ▼
       │         ┌───────────────┐
       │         │ Show "Available"│
       │         │ Enable "Book"  │
       │         └───────┬────────┘
       │                 │
       │                 ▼
       │         ┌───────────────┐
       │         │ Click "Book"  │
       │         └───────┬────────┘
       │                 │
       │                 ▼
       │         ┌───────────────────┐
       │         │ POST /api/        │
       │         │ appointments      │
       │         └───────┬───────────┘
       │                 │
       │                 ▼
       │         ┌───────────────────┐
       │         │ Server-side       │
       │         │ availability check│
       │         └───────┬───────────┘
       │                 │
       │                 ├─── Still Available ───┐
       │                 │                        ▼
       │                 │                ┌──────────────┐
       │                 │                │ Create       │
       │                 │                │ Appointment  │
       │                 │                └──────┬───────┘
       │                 │                       │
       │                 │                       ▼
       │                 │                ┌──────────────┐
       │                 │                │ Success!     │
       │                 │                └──────────────┘
       │                 │
       │                 └─── Booked by someone else ───┐
       │                                                  ▼
       │                                          ┌──────────────┐
       │                                          │ Error: Slot  │
       │                                          │ no longer    │
       │                                          │ available    │
       │                                          └──────────────┘
       │
       └─── Not Available ───┐
                              ▼
                      ┌───────────────┐
                      │ Show "Booked" │
                      │ Disable "Book"│
                      └───────────────┘
```

#### Conflict Detection Algorithm
```typescript
// 1. Parse requested time
const requestedTime = new Date(dateTime);

// 2. Calculate hour boundaries
const startTime = startOfHour(requestedTime);  // e.g., 14:00:00
const endTime = endOfHour(requestedTime);      // e.g., 14:59:59

// 3. Query existing appointments
const existing = await prisma.appointment.findFirst({
  where: {
    doctorId: doctorId,
    dateTime: {
      gte: startTime,  // Greater than or equal to hour start
      lte: endTime     // Less than or equal to hour end
    },
    status: {
      not: "CANCELLED"  // Ignore cancelled appointments
    }
  }
});

// 4. Determine availability
if (existing) {
  return { available: false };
} else {
  return { available: true };
}
```

#### Role-Based Appointment Filtering
```typescript
// Admin & Receptionist: See ALL appointments
if (role === "ADMIN" || role === "RECEPTIONIST") {
  query = { include: { patient, doctor } };
}

// Doctor: See only THEIR appointments
if (role === "DOCTOR") {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  query = { 
    where: { doctorId: doctor.id },
    include: { patient, doctor }
  };
}

// Patient: See only THEIR appointments
if (role === "PATIENT") {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  query = { 
    where: { patientId: patient.id },
    include: { patient, doctor }
  };
}
```

#### API Specifications

**1. Check Availability**
```typescript
GET /api/appointments/check-availability?doctorId={id}&dateTime={iso8601}
Authorization: Required

Response 200 OK:
{
  "available": true
}

Response 400 Bad Request:
{
  "message": "Missing parameters"
}
```

**2. Book Appointment**
```typescript
POST /api/appointments
Authorization: Required
Content-Type: application/json

Request Body:
{
  "patientId": "clx123",      // Optional for patients (auto-resolved)
  "doctorId": "clx456",       // Required
  "dateTime": "2026-05-15T14:00:00Z",  // Required
  "reason": "General checkup" // Optional
}

Response 200 OK:
{
  "id": "clx789",
  "patientId": "clx123",
  "doctorId": "clx456",
  "dateTime": "2026-05-15T14:00:00.000Z",
  "status": "SCHEDULED",
  "reason": "General checkup",
  "createdAt": "2026-05-10T10:30:00.000Z"
}

Response 400 Bad Request:
{
  "message": "Doctor is already booked for this time slot"
}
```

**3. List Appointments**
```typescript
GET /api/appointments
Authorization: Required

Response 200 OK:
[
  {
    "id": "clx789",
    "dateTime": "2026-05-15T14:00:00.000Z",
    "status": "SCHEDULED",
    "patient": {
      "id": "clx123",
      "user": { "name": "John Doe" }
    },
    "doctor": {
      "id": "clx456",
      "user": { "name": "Dr. Smith" },
      "specialization": "Cardiology"
    }
  }
]
```

**4. Search Appointments**
```typescript
GET /api/appointments/search?q={query}&status={status}
Authorization: Required

Example: /api/appointments/search?q=John&status=SCHEDULED

Response 200 OK:
[
  // Filtered appointments matching query
]
```

#### Business Rules
1. **Appointment Duration:** Fixed 1-hour slots
2. **Working Hours:** 9 AM - 5 PM (hardcoded in availability endpoint)
3. **Double-Booking Prevention:** One doctor, one patient per hour slot
4. **Cancellation Policy:** Cancelled appointments free up the slot
5. **Receptionist Tracking:** If booked by receptionist, `receptionistId` is recorded

#### Known Issues & Limitations
1. **Race Condition Risk:** Between availability check and booking, slot could be taken
   - **Impact:** Two users could book same slot simultaneously
   - **Mitigation:** Server-side check in POST handler
   - **Better Solution:** Use database-level locking or unique constraint

2. **Fixed 1-Hour Slots:** Cannot book 30-minute or 2-hour appointments
   - **Impact:** Inflexible scheduling
   - **Recommendation:** Add `duration` field

3. **No Past Date Validation:** Can book appointments in the past
   - **Impact:** Data integrity issues
   - **Recommendation:** Add validation `dateTime > now()`

4. **Hardcoded Working Hours:** 9 AM - 5 PM for all doctors
   - **Impact:** Cannot handle different schedules
   - **Recommendation:** Add doctor-specific availability table

5. **No Appointment Reminders:** Patients not notified before appointments
   - **Impact:** Higher no-show rates
   - **Recommendation:** Add notification system

6. **No Waitlist:** If slot full, no option to join waitlist
   - **Impact:** Lost opportunities
   - **Recommendation:** Add waitlist feature

---

### FR-4: Appointment Management (Cancel/Reschedule)
**Status:** ✅ **IMPLEMENTED** (with restrictions)  
**Priority:** P1 (High)  
**Complexity:** Medium

#### Description
Users can cancel or reschedule appointments based on their role permissions. Patients can only cancel their own appointments, while Admins and Receptionists have full control.

#### User Stories
- **US-4.1:** As a patient, I can cancel my own appointments
- **US-4.2:** As a receptionist, I can cancel or reschedule any appointment
- **US-4.3:** As an admin, I can cancel or reschedule any appointment
- **US-4.4:** As a patient, I cannot reschedule appointments (must cancel and rebook)
- **US-4.5:** As a doctor, I cannot cancel appointments (must contact admin/receptionist)

#### Implementation
| Component | File | Method |
|-----------|------|--------|
| Update Appointment | `app/api/appointments/[id]/route.ts` | PATCH |
| Delete Appointment | `app/api/appointments/[id]/route.ts` | DELETE |
| Patient Cancel UI | `app/dashboard/patient/CancelAppointment.tsx` | Client component |

#### Authorization Logic
```typescript
// 1. Fetch appointment with patient info
const appointment = await prisma.appointment.findUnique({
  where: { id: params.id },
  include: { patient: true }
});

// 2. Check if user is the patient
if (session.user.role === "PATIENT") {
  // 2a. Verify ownership
  if (appointment.patient.userId !== session.user.id) {
    return 403 Forbidden;
  }
  
  // 2b. Only allow cancellation
  if (status !== "CANCELLED") {
    return 403 Forbidden ("Patients can only cancel appointments");
  }
}

// 3. Admin and Receptionist can do anything
if (session.user.role === "ADMIN" || session.user.role === "RECEPTIONIST") {
  // Allow all operations
}
```

#### API Specification

**Update Appointment**
```typescript
PATCH /api/appointments/{id}
Authorization: Required
Content-Type: application/json

Request Body (Cancel):
{
  "status": "CANCELLED"
}

Request Body (Reschedule - Admin/Receptionist only):
{
  "dateTime": "2026-05-20T15:00:00Z",
  "status": "RESCHEDULED"
}

Response 200 OK:
{
  "id": "clx789",
  "status": "CANCELLED",
  "dateTime": "2026-05-15T14:00:00.000Z",
  "updatedAt": "2026-05-10T11:00:00.000Z"
}

Response 403 Forbidden:
{
  "message": "Patients can only cancel appointments"
}

Response 404 Not Found:
{
  "message": "Appointment not found"
}
```

**Delete Appointment**
```typescript
DELETE /api/appointments/{id}
Authorization: Required (Admin or Receptionist only)

Response 204 No Content

Response 401 Unauthorized:
{
  "message": "Unauthorized"
}
```

#### Business Rules
1. **Patient Restrictions:**
   - Can only cancel OWN appointments
   - Cannot reschedule (must cancel and rebook)
   - Cannot delete appointments

2. **Doctor Restrictions:**
   - Cannot cancel or reschedule appointments
   - Must contact admin/receptionist

3. **Admin/Receptionist Permissions:**
   - Can cancel ANY appointment
   - Can reschedule ANY appointment
   - Can delete appointments (hard delete)

4. **Status Transitions:**
   - SCHEDULED → CANCELLED ✅
   - SCHEDULED → RESCHEDULED ✅
   - CANCELLED → SCHEDULED ❌ (not implemented)
   - COMPLETED → * ❌ (should be immutable)

#### Known Issues
1. **No Cancellation Reason:** Cannot track why appointment was cancelled
2. **No Cancellation Policy:** Can cancel anytime, even 5 minutes before
3. **No Notification:** Doctor not notified when appointment cancelled
4. **Hard Delete Available:** Admins can permanently delete appointments (audit trail lost)
5. **No Undo:** Once cancelled, cannot be restored

---

### FR-5: Medical Record Management
**Status:** ⚠️ **PARTIALLY IMPLEMENTED**  
**Priority:** P0 (Critical)  
**Complexity:** High

#### Description
Doctors can create medical records after completing appointments. Records include diagnosis, prescription, and notes.

#### User Stories
- **US-5.1:** As a doctor, I can create a medical record after seeing a patient
- **US-5.2:** As a doctor, I can view a patient's medical history
- **US-5.3:** As a patient, I can view my own medical records ❌ **NOT IMPLEMENTED**
- **US-5.4:** As the system, I automatically mark appointments as COMPLETED when record is created

#### Implementation
| Component | File | Status |
|-----------|------|--------|
| Create Record API | `app/api/medical-records/route.ts` | ✅ Implemented |
| View History | `app/dashboard/doctor/appointments/[id]/page.tsx` | ✅ Implemented |
| Patient View | N/A | ❌ Missing |
| Record Form | `app/dashboard/doctor/appointments/[id]/RecordForm.tsx` | ✅ Implemented |

#### Medical Record Creation Flow
```
1. Doctor opens appointment detail page
2. System displays patient history (previous records)
3. Doctor fills form:
   - Diagnosis (required)
   - Prescription (required)
   - Notes (optional)
4. Doctor clicks "Save Record"
5. POST /api/medical-records
6. Backend starts transaction:
   a. Create MedicalRecord
   b. Update Appointment status to COMPLETED
7. Commit transaction
8. Return success
9. Frontend shows success toast
10. Redirect to doctor dashboard
```

#### API Specification
```typescript
POST /api/medical-records
Authorization: Required (Doctor only)
Content-Type: application/json

Request Body:
{
  "appointmentId": "clx789",
  "patientId": "clx123",
  "doctorId": "clx456",
  "diagnosis": "Hypertension",
  "prescription": "Lisinopril 10mg once daily",
  "notes": "Patient advised to reduce salt intake and exercise regularly"
}

Response 200 OK:
{
  "id": "clx999",
  "patientId": "clx123",
  "doctorId": "clx456",
  "diagnosis": "Hypertension",
  "prescription": "Lisinopril 10mg once daily",
  "notes": "Patient advised to reduce salt intake...",
  "date": "2026-05-10T14:30:00.000Z"
}

Response 401 Unauthorized:
{
  "message": "Unauthorized"
}
```

#### Database Transaction
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create medical record
  const record = await tx.medicalRecord.create({
    data: {
      patientId,
      doctorId,
      diagnosis,
      prescription,
      notes
    }
  });
  
  // 2. Mark appointment as completed
  await tx.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" }
  });
  
  return record;
});
```

#### Missing Features (CRITICAL GAPS)
1. ❌ **No API to list medical records**
   - Cannot fetch all records for a patient
   - Recommendation: `GET /api/medical-records?patientId={id}`

2. ❌ **Patients cannot view their records**
   - UI exists (`/dashboard/patient/records`) but no API
   - Recommendation: Implement patient-accessible endpoint

3. ❌ **No record editing**
   - Typos cannot be corrected
   - Recommendation: Add PATCH endpoint with audit trail

4. ❌ **No record deletion**
   - Incorrect records cannot be removed
   - Recommendation: Soft delete with reason

5. ❌ **No file attachments**
   - Cannot attach lab results, X-rays, etc.
   - Recommendation: Add file upload capability

6. ❌ **No structured data**
   - Diagnosis is free text (should use ICD codes)
   - Prescription is free text (should be structured)
   - Recommendation: Add structured fields

7. ❌ **No vital signs**
   - Blood pressure, temperature, weight not recorded
   - Recommendation: Add vitals table

8. ❌ **No audit trail**
   - Cannot track who viewed/edited records
   - Recommendation: Add audit logging

#### Recommended Enhancements
```prisma
model MedicalRecord {
  id           String   @id @default(cuid())
  patientId    String
  doctorId     String
  appointmentId String? @unique
  
  // Structured diagnosis
  diagnosisCode String?  // ICD-10 code
  diagnosisText String
  
  // Structured prescription
  prescriptions Prescription[]
  
  // Vital signs
  bloodPressureSystolic  Int?
  bloodPressureDiastolic Int?
  heartRate              Int?
  temperature            Decimal?
  weight                 Decimal?
  height                 Decimal?
  
  // Additional data
  symptoms     String?
  examination  String?
  labResults   String?
  notes        String?
  attachments  Attachment[]
  
  // Audit
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?
  
  @@index([patientId, date])
}

model Prescription {
  id              String @id @default(cuid())
  medicalRecordId String
  medicationName  String
  dosage          String
  frequency       String
  duration        String
  instructions    String?
  
  medicalRecord MedicalRecord @relation(...)
}

model Attachment {
  id              String @id @default(cuid())
  medicalRecordId String
  fileName        String
  fileType        String
  fileSize        Int
  fileUrl         String
  uploadedAt      DateTime @default(now())
  
  medicalRecord MedicalRecord @relation(...)
}
```

