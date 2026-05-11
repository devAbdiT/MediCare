# SECURITY ASSESSMENT & RISK ANALYSIS

## 4. COMPREHENSIVE SECURITY ANALYSIS

### Overall Security Posture
**Risk Level:** 🔴 **CRITICAL**  
**Compliance Status:** ❌ **NON-COMPLIANT** (HIPAA, GDPR)  
**Recommended Action:** **IMMEDIATE REMEDIATION REQUIRED**

---

## 4.1 CRITICAL SECURITY VULNERABILITIES

### 🔴 CRITICAL-1: Hardcoded Secrets in Version Control
**Severity:** CRITICAL  
**CVSS Score:** 9.8 (Critical)  
**CWE:** CWE-798 (Use of Hard-coded Credentials)

#### Description
The `.env` file contains hardcoded secrets and is tracked in version control:

```env
# .env file (EXPOSED IN REPOSITORY)
DATABASE_URL="postgresql://postgres:1234@localhost:5432/medicare_db?schema=public"
BETTER_AUTH_SECRET="lDXtItK4wF8nrpQIknaB5Yy+819gHLdKKyv+4K/yU9s="
BETTER_AUTH_URL="http://localhost:3000"
```

#### Impact
- ✅ Anyone with repository access can:
  - Access the production database
  - Forge authentication tokens
  - Impersonate any user
  - Read/modify all patient data
- ✅ If repository is public or leaked, complete system compromise

#### Evidence
- File: `.env` (line 2-5)
- `.gitignore` includes `.env*` but file already committed

#### Exploitation Scenario
```bash
# Attacker clones repository
git clone https://github.com/org/patient-management-system.git

# Reads .env file
cat .env

# Connects to database directly
psql "postgresql://postgres:1234@localhost:5432/medicare_db"

# Extracts all patient data
SELECT * FROM patients JOIN users ON patients.userId = users.id;

# Exports to CSV
\copy (SELECT * FROM medical_records) TO 'stolen_records.csv' CSV HEADER;
```

#### Remediation (IMMEDIATE)
1. **Remove `.env` from git history:**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

2. **Rotate all secrets:**
   - Generate new `BETTER_AUTH_SECRET`
   - Change database password
   - Update production environment variables

3. **Use environment-specific secrets:**
   - Development: `.env.local` (gitignored)
   - Production: Environment variables (Vercel, AWS, etc.)
   - Never commit secrets to repository

4. **Implement secret scanning:**
```yaml
# .github/workflows/secret-scan.yml
name: Secret Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: trufflesecurity/trufflehog@main
```

---

### 🔴 CRITICAL-2: No CSRF Protection
**Severity:** CRITICAL  
**CVSS Score:** 8.8 (High)  
**CWE:** CWE-352 (Cross-Site Request Forgery)

#### Description
All state-changing operations (POST, PATCH, DELETE) lack CSRF token validation. Attackers can trick authenticated users into performing unwanted actions.

#### Vulnerable Endpoints
- `POST /api/appointments` - Book appointments
- `POST /api/patients` - Register patients
- `POST /api/medical-records` - Create medical records
- `PATCH /api/appointments/[id]` - Cancel appointments
- `DELETE /api/admin/users/[id]` - Delete users
- `PATCH /api/user/profile` - Change password

#### Impact
- Attacker can perform actions as authenticated user
- Book fake appointments
- Cancel legitimate appointments
- Create fraudulent medical records
- Delete user accounts
- Change user passwords

#### Exploitation Scenario
```html
<!-- Attacker's malicious website -->
<html>
<body>
  <h1>Win a Free iPhone!</h1>
  <img src="https://hospital.com/api/admin/users/victim-id" 
       style="display:none" />
  
  <form id="evil" action="https://hospital.com/api/appointments" method="POST">
    <input type="hidden" name="doctorId" value="attacker-doctor-id" />
    <input type="hidden" name="dateTime" value="2026-12-31T23:59:00Z" />
    <input type="hidden" name="patientId" value="victim-patient-id" />
  </form>
  
  <script>
    // Auto-submit when admin visits page
    document.getElementById('evil').submit();
  </script>
</body>
</html>
```

If an authenticated admin visits this page, they unknowingly:
1. Delete a user account
2. Book a fake appointment

#### Remediation (IMMEDIATE)
1. **Implement CSRF tokens with Better Auth:**
```typescript
// lib/auth.ts
export const auth = betterAuth({
  // ... existing config
  advanced: {
    csrf: {
      enabled: true,
      cookieName: "csrf-token",
      headerName: "X-CSRF-Token"
    }
  }
});
```

2. **Validate CSRF token in API routes:**
```typescript
// middleware/csrf.ts
export async function validateCSRF(req: Request) {
  const token = req.headers.get('X-CSRF-Token');
  const cookie = req.cookies.get('csrf-token');
  
  if (!token || token !== cookie) {
    throw new Error('Invalid CSRF token');
  }
}

// app/api/appointments/route.ts
export async function POST(req: Request) {
  await validateCSRF(req); // Add this line
  // ... rest of handler
}
```

3. **Include token in frontend requests:**
```typescript
// lib/api-client.ts
async function apiPost(url: string, data: any) {
  const csrfToken = getCookie('csrf-token');
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
  });
}
```

---

### 🔴 CRITICAL-3: No Rate Limiting
**Severity:** CRITICAL  
**CVSS Score:** 7.5 (High)  
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

#### Description
No rate limiting on any endpoint, especially authentication. Attackers can:
- Brute force passwords
- Enumerate user accounts
- Perform denial-of-service attacks
- Scrape patient data

#### Vulnerable Endpoints
- `POST /api/auth/sign-in` - Unlimited login attempts
- `GET /api/patients/search` - Unlimited searches
- `GET /api/appointments` - Unlimited data extraction
- All API endpoints - No throttling

#### Impact
- **Credential Stuffing:** Test millions of username/password combinations
- **Account Enumeration:** Discover valid email addresses
- **DoS:** Overwhelm server with requests
- **Data Scraping:** Extract entire patient database

#### Exploitation Scenario
```python
# Brute force attack script
import requests

passwords = open('common-passwords.txt').readlines()
target = 'https://hospital.com/api/auth/sign-in'

for password in passwords:
    response = requests.post(target, json={
        'email': 'admin@hospital.com',
        'password': password.strip()
    })
    
    if response.status_code == 200:
        print(f'[+] Password found: {password}')
        break
    
    # No rate limiting, can try 1000s per second
```

#### Remediation (IMMEDIATE)
1. **Install rate limiting library:**
```bash
npm install express-rate-limit
```

2. **Implement rate limiting middleware:**
```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please slow down',
});
```

3. **Apply to routes:**
```typescript
// app/api/auth/[...all]/route.ts
import { authLimiter } from '@/middleware/rate-limit';

export async function POST(req: Request) {
  await authLimiter(req); // Add rate limiting
  return toNextJsHandler(auth)(req);
}
```

4. **Implement account lockout:**
```typescript
// After 5 failed attempts, lock account for 30 minutes
const failedAttempts = await redis.get(`failed:${email}`);

if (failedAttempts >= 5) {
  return new Response('Account locked due to too many failed attempts', {
    status: 429
  });
}
```

---

### 🔴 CRITICAL-4: Missing Input Validation on Backend
**Severity:** HIGH  
**CVSS Score:** 7.3 (High)  
**CWE:** CWE-20 (Improper Input Validation)

#### Description
Backend trusts all client input without validation. Only frontend has Zod validation, which can be bypassed.

#### Vulnerable Code Examples
```typescript
// app/api/patients/route.ts (NO VALIDATION)
export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, phone, dateOfBirth, bloodType, password } = body;
  
  // Directly uses user input without validation
  const newUser = await prisma.user.create({
    data: { name, email, phone, password: hashedPassword, role: "PATIENT" }
  });
}
```

#### Attack Vectors
1. **SQL Injection (Mitigated by Prisma):** Prisma uses parameterized queries
2. **NoSQL Injection:** Not applicable (using PostgreSQL)
3. **XSS:** React auto-escapes, but API could return malicious data
4. **Data Type Confusion:** Can send wrong types
5. **Business Logic Bypass:** Can send invalid data

#### Exploitation Scenario
```bash
# Bypass frontend validation
curl -X POST https://hospital.com/api/patients \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "name": "<script>alert(1)</script>",
    "email": "not-an-email",
    "phone": "123",
    "dateOfBirth": "invalid-date",
    "bloodType": "INVALID_TYPE",
    "password": "a"
  }'
```

Without backend validation:
- XSS payload stored in database
- Invalid email format accepted
- Invalid blood type stored
- Weak password accepted

#### Remediation (HIGH PRIORITY)
1. **Install Zod for backend validation:**
```typescript
// lib/validators.ts
import { z } from 'zod';

export const patientSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+\d{10,15}$/),
  dateOfBirth: z.string().datetime().refine(date => {
    return new Date(date) < new Date(); // Must be in past
  }),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  password: z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
});
```

2. **Validate in API routes:**
```typescript
// app/api/patients/route.ts
import { patientSchema } from '@/lib/validators';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Validate input
  const validation = patientSchema.safeParse(body);
  if (!validation.success) {
    return new Response(JSON.stringify({
      message: 'Validation failed',
      errors: validation.error.errors
    }), { status: 400 });
  }
  
  const data = validation.data;
  // Now safe to use validated data
}
```

3. **Sanitize HTML input:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedName = DOMPurify.sanitize(name);
```

---

### 🔴 CRITICAL-5: No HTTPS Enforcement
**Severity:** HIGH  
**CVSS Score:** 7.4 (High)  
**CWE:** CWE-319 (Cleartext Transmission of Sensitive Information)

#### Description
Application runs on HTTP in development, and no HTTPS enforcement configured for production.

#### Impact
- **Man-in-the-Middle Attacks:** Attacker can intercept traffic
- **Credential Theft:** Passwords sent in plain text
- **Session Hijacking:** Session tokens intercepted
- **Data Breach:** Medical records transmitted unencrypted

#### Evidence
```typescript
// .env
BETTER_AUTH_URL="http://localhost:3000"  // HTTP, not HTTPS

// lib/auth.ts
advanced: {
  cookies: {
    secure: process.env.NODE_ENV === "production"  // Only secure in prod
  }
}
```

#### Exploitation Scenario
```
User connects to hospital WiFi
Attacker on same network runs Wireshark
User logs in to patient portal
Attacker captures HTTP traffic:

POST /api/auth/sign-in HTTP/1.1
Host: hospital.com
Content-Type: application/json

{"email":"patient@example.com","password":"MyPassword123"}

Attacker now has credentials
```

#### Remediation (IMMEDIATE)
1. **Enforce HTTPS in production:**
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && 
      req.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${req.headers.get('host')}${req.nextUrl.pathname}`,
      301
    );
  }
}
```

2. **Set security headers:**
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

3. **Use HTTPS in development:**
```bash
# Install mkcert
brew install mkcert  # macOS
# or
choco install mkcert  # Windows

# Generate local certificates
mkcert -install
mkcert localhost

# Update package.json
"dev": "next dev --experimental-https"
```

---

## 4.2 HIGH SEVERITY VULNERABILITIES

### 🟡 HIGH-1: Weak Password Policy
**Severity:** HIGH  
**CVSS Score:** 6.5 (Medium)  
**CWE:** CWE-521 (Weak Password Requirements)

#### Description
No password complexity requirements enforced. Users can set weak passwords like "password" or "123456".

#### Current Implementation
```typescript
// No validation at all
const hashedPassword = await hash(password || "patient123", 10);
```

#### Impact
- Weak passwords easily cracked
- Brute force attacks succeed faster
- Credential stuffing more effective

#### Remediation
```typescript
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain special character');
```

---

### 🟡 HIGH-2: No Account Lockout
**Severity:** HIGH  
**CVSS Score:** 6.5 (Medium)  
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

#### Description
Unlimited login attempts allowed. No account lockout after failed attempts.

#### Remediation
```typescript
// Track failed attempts in Redis
const attempts = await redis.incr(`login:attempts:${email}`);
await redis.expire(`login:attempts:${email}`, 900); // 15 minutes

if (attempts > 5) {
  await prisma.user.update({
    where: { email },
    data: { lockedUntil: new Date(Date.now() + 30 * 60 * 1000) }
  });
  
  return new Response('Account locked for 30 minutes', { status: 429 });
}
```

---

### 🟡 HIGH-3: Session Fixation Vulnerability
**Severity:** HIGH  
**CVSS Score:** 6.8 (Medium)  
**CWE:** CWE-384 (Session Fixation)

#### Description
Session ID not regenerated after login. Attacker can fixate session.

#### Exploitation
```
1. Attacker gets session ID: abc123
2. Attacker tricks victim to use session: abc123
3. Victim logs in with session: abc123
4. Attacker now authenticated as victim
```

#### Remediation
```typescript
// After successful login
await auth.api.invalidateSession({ sessionId: oldSessionId });
const newSession = await auth.api.createSession({ userId });
```

---

### 🟡 HIGH-4: No Content Security Policy
**Severity:** MEDIUM  
**CVSS Score:** 5.3 (Medium)  
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)

#### Description
Missing CSP headers allow XSS attacks via injected scripts.

#### Remediation
```typescript
// next.config.ts
headers: [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
  }
]
```

---

## 4.3 MEDIUM SEVERITY VULNERABILITIES

### 🟢 MEDIUM-1: Insufficient Audit Logging
**Severity:** MEDIUM  
**CVSS Score:** 4.3 (Medium)  
**CWE:** CWE-778 (Insufficient Logging)

#### Missing Audit Events
- ❌ Login/logout events
- ❌ Password changes
- ❌ User deletions
- ❌ Medical record access
- ❌ Failed login attempts
- ❌ Permission denied events
- ❌ Data exports

#### Remediation
```typescript
// lib/audit.ts
export async function logAuditEvent(event: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      ...event,
      timestamp: new Date()
    }
  });
}

// Usage
await logAuditEvent({
  userId: session.user.id,
  action: 'LOGIN',
  entity: 'User',
  entityId: session.user.id,
  ipAddress: req.headers.get('x-forwarded-for'),
  userAgent: req.headers.get('user-agent')
});
```

---

### 🟢 MEDIUM-2: Sensitive Data in Logs
**Severity:** MEDIUM  
**CVSS Score:** 4.0 (Medium)  
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

#### Description
Console.log statements may log sensitive data.

#### Evidence
```typescript
// app/api/appointments/route.ts
console.error("Booking Error:", error);  // May log patient data
```

#### Remediation
```typescript
// Use structured logging
import pino from 'pino';

const logger = pino({
  redact: ['password', 'token', 'ssn', 'creditCard']
});

logger.error({ err: error, appointmentId }, 'Booking failed');
```

---

## 4.4 SECURITY RECOMMENDATIONS SUMMARY

### Immediate Actions (Week 1)
1. ✅ Remove `.env` from git history
2. ✅ Rotate all secrets
3. ✅ Implement CSRF protection
4. ✅ Add rate limiting to auth endpoints
5. ✅ Enforce HTTPS in production

### Short-term Actions (Month 1)
6. ✅ Implement server-side input validation
7. ✅ Add comprehensive audit logging
8. ✅ Implement account lockout
9. ✅ Add password complexity requirements
10. ✅ Set up error monitoring (Sentry)

### Medium-term Actions (Quarter 1)
11. ✅ Implement database encryption at rest
12. ✅ Add Content Security Policy
13. ✅ Implement session regeneration
14. ✅ Add security headers
15. ✅ Conduct penetration testing

### Security Checklist
- [ ] Secrets removed from version control
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] HTTPS enforced
- [ ] Input validation on backend
- [ ] Strong password policy
- [ ] Account lockout mechanism
- [ ] Comprehensive audit logging
- [ ] Error monitoring setup
- [ ] Security headers configured
- [ ] Database encryption enabled
- [ ] Regular security audits scheduled

