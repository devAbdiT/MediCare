# 🩺 MediCare Elite Clinical OS - System Documentation

Welcome to the official feature guide for the **MediCare Elite Clinical OS**. This document outlines every functionality implemented within the platform, categorized by user role and system architecture.

---

## 🔐 1. Core Security & Authentication
The system is built on a "Security-First" architecture using **Better-Auth** and **Prisma ORM**.

*   **Role-Based Access Control (RBAC)**: Distinct permissions and interfaces for `ADMIN`, `DOCTOR`, `RECEPTIONIST`, and `PATIENT`.
*   **Encrypted Authentication**: All passwords and sessions are managed with industry-standard encryption.
*   **Protected API Routes**: Server-side authorization checks on every data request to prevent unauthorized access.
*   **Persistent Sessions**: Secure session handling that maintains user state across page refreshes.

---

## 🏢 2. Administrator (Command Center)
Designed for hospital management to oversee global operations.

*   **System Console**: A high-level overview of infrastructure health and performance.
*   **User Directory**: Searchable list of all registered staff and patients.
*   **Global Appointments**: Access to the clinic-wide master schedule.
*   **Activity Logs**: Real-time trail of system events (registrations, database syncs).
*   **Infrastructure Metrics**: Stats for server uptime, daily quotas, and user growth.
*   **Visual Analytics**: Dynamic charts for tracking appointment velocity and patient registration trends over time.

---

## 🛎️ 3. Receptionist (Front Desk Operations)
The operational heart of the clinic, managing patient flow and registration.

*   **Live Patient Manifest**: Real-time tracking of today's arrivals and check-in statuses.
*   **Rapid Patient Registration**: Onboarding form for core patient data (DOB, Blood Type, Contact).
*   **Concierge Booking**:
    *   **Patient Lookup**: Integrated search by name, email, or phone.
    *   **Availability Engine**: Real-time checks against doctor schedules to prevent double-booking.
*   **Appointment Management**: Full control to cancel or reschedule visits.

---

## 🩺 4. Doctor (Clinical Workspace)
A focused environment for medical professionals to manage consultations and records.

*   **Daily Agenda**: A prioritized timeline of today's queued patients.
*   **Shift Telemetry**: Progress tracking showing completed vs. pending consultations.
*   **Clinical Encounter Suite**:
    *   **Diagnosis Interface**: Focused area for documenting findings.
    *   **Treatment Planner**: Dedicated prescription and medication engine.
    *   **Internal Notes**: Private section for non-patient-facing observations.
*   **Medical History Access**: One-click retrieval of all past records during a visit.
*   **Direct Contact**: Instant access to patient contact information for urgent follow-ups.

---

## 👤 5. Patient (Personal Health Vault)
Empowering patients to manage their own care journey.

*   **Health Dashboard**: Real-time status of current health metrics and upcoming visits.
*   **Self-Service Booking**: Browse specialist availability and schedule visits 24/7.
*   **Medical Record Access**: Full history of past diagnoses and prescriptions.
*   **Profile Management**: Self-update tool for phone numbers and security passkeys.
*   **Visit Control**: Integrated tool to cancel upcoming appointments.
*   **Clinical ID**: Digital identification with a unique Patient ID for front-desk verification.

---

## 🎨 6. Design & Experience (UI/UX)
State-of-the-art interface design optimized for healthcare environments.

*   **Deep Blue Theme**: A curated color palette designed for high legibility and "clinical focus."
*   **Adaptive Dark/Light Mode**: Full system-wide theme switching.
*   **Floating Panel OS**: Modern layout with large rounded corners (`2.5rem`) and inset paneling.
*   **Micro-Animations**: Animated pulse indicators and telemetry icons for a "living" UI feel.
*   **Responsive Framework**: Optimized for desktop workstations, tablets, and mobile devices.

---

## 🛠️ Technical Stack
*   **Framework**: Next.js 15+ (Unified Full-Stack Architecture)
*   **Data Layer**: Prisma ORM (Server-side integration)
*   **Database**: PostgreSQL / SQLite
*   **Auth**: Better-Auth (Integrated Middleware & Route Handlers)
*   **Styling**: Tailwind CSS & Vanilla CSS
*   **Icons**: Lucide React
