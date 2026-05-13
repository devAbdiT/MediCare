# 🌱 Seed Quick Reference

## One Command to Seed
```bash
npx prisma db seed
```

---

## 🔑 All Login Credentials
**Password for ALL users:** `password123`

| Role | Email | Specialization/Department |
|------|-------|---------------------------|
| **Admin** | admin@hospital.com | Full system access |
| **Receptionist** | receptionist1@hospital.com | Appointment management |
| **Receptionist** | receptionist2@hospital.com | Appointment management |
| **Doctor** | doctor1@hospital.com | Cardiologist |
| **Doctor** | doctor2@hospital.com | Pediatrician |
| **Doctor** | doctor3@hospital.com | Orthopedic Surgeon |
| **Doctor** | doctor4@hospital.com | Neurologist |
| **Doctor** | doctor5@hospital.com | Dermatologist |
| **Doctor** | doctor6@hospital.com | General Practitioner |
| **Patient** | patient1@example.com | John Smith (O+) |
| **Patient** | patient2@example.com | Emma Brown (A+) |
| **Patient** | patient3@example.com | David Wilson (B+) |
| **Patient** | patient4@example.com | Sophia Garcia (AB+) |
| **Patient** | patient5@example.com | Oliver Martinez (O-) |

---

## 📊 What Gets Created

- ✅ 6 Departments (Cardiology, Pediatrics, Orthopedics, Neurology, Dermatology, General Medicine)
- ✅ 1 Admin
- ✅ 2 Receptionists
- ✅ 6 Doctors (one per department)
- ✅ 5 Patients (with card numbers)
- ✅ 5 Appointments (3 scheduled, 2 completed)
- ✅ 2 Medical Records

---

## 🚀 Complete Setup (First Time)

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Run migrations
npx prisma migrate dev --name add_departments

# 3. Seed database
npx prisma db seed

# 4. Start server
npm run dev
```

---

## 🔄 Reset & Re-seed

```bash
# ⚠️ WARNING: Deletes ALL data
npx prisma migrate reset
```

---

## 🧪 Quick Test

1. Go to `http://localhost:3000/login`
2. Login as admin: `admin@hospital.com` / `password123`
3. Navigate to `/dashboard/admin/departments`
4. You should see 6 departments with assigned doctors

---

## 📁 Seed File Location
```
prisma/seed.ts
```

---

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| "Cannot find module 'tsx'" | Run `npm install` |
| "Unique constraint failed" | Run `npx prisma migrate reset` |
| "Database connection failed" | Check `.env` file |

---

**For detailed guide, see:** `SEEDING_GUIDE.md`
