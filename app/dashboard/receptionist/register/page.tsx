// app/dashboard/receptionist/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  Printer,
  RotateCcw,
  CreditCard,
  User,
  Mail,
  Phone,
  Calendar,
  Droplets,
  Hash,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInYears } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientSchema } from "@/lib/validations";
import { formatPhoneNumber } from "@/lib/phone-format";
import * as z from "zod";

type RegisterFormValues = z.input<typeof patientSchema>;

interface RegisteredPatient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cardNumber: string;
  dateOfBirth?: string;
  age?: number;
  bloodType?: string;
  registeredDate: string;
}

// ─── Print Card Function ────────────────────────────────────────────────────
function handlePrintCard(patient: RegisteredPatient) {
  const displayAge =
    patient.age !== undefined
      ? patient.age
      : patient.dateOfBirth
      ? differenceInYears(new Date(), new Date(patient.dateOfBirth))
      : null;

  const displayDOB = patient.dateOfBirth
    ? format(new Date(patient.dateOfBirth), "MMMM dd, yyyy")
    : "N/A";

  const printWin = window.open("", "_blank", "width=600,height=700");
  if (!printWin) return;

  printWin.document.open();
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Patient Card – ${patient.name}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Arial', sans-serif;
            background: #f0f4f8;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 24px;
          }
          .card {
            width: 400px;
            background: white;
            border: 2.5px solid #1e4a8a;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(30,74,138,0.15);
          }
          .header {
            background: #1e4a8a;
            color: white;
            text-align: center;
            padding: 20px 16px;
          }
          .hospital-name {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 3px;
            text-transform: uppercase;
          }
          .card-type {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 4px;
            text-transform: uppercase;
            opacity: 0.75;
            margin-top: 4px;
          }
          .card-no-badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px;
            padding: 4px 14px;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 1px;
            margin-top: 12px;
          }
          .body {
            padding: 20px 24px;
          }
          .name-block {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
          }
          .patient-name {
            font-size: 20px;
            font-weight: 900;
            color: #1a2a4a;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .patient-label {
            font-size: 10px;
            font-weight: 700;
            color: #5a6e8a;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 2px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .field {
            background: #f8fafc;
            border-radius: 10px;
            padding: 10px 12px;
          }
          .field-label {
            font-size: 9px;
            font-weight: 800;
            color: #5a6e8a;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 3px;
          }
          .field-value {
            font-size: 13px;
            font-weight: 700;
            color: #1a2a4a;
            word-break: break-word;
          }
          .field-value.blood { color: #dc2626; }
          .full-width { grid-column: 1 / -1; }
          .footer {
            background: #f0f4f8;
            border-top: 1px solid #d0dce8;
            text-align: center;
            padding: 12px;
            margin-top: 20px;
          }
          .footer-text {
            font-size: 10px;
            font-weight: 700;
            color: #5a6e8a;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          @media print {
            body { background: white; padding: 0; }
            .card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="hospital-name">MediCare</div>
            <div class="card-type">Patient ID Card</div>
            <div class="card-no-badge">${patient.cardNumber}</div>
          </div>
          <div class="body">
            <div class="name-block">
              <div class="patient-name">${patient.name}</div>
              <div class="patient-label">Registered Patient</div>
            </div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Date of Birth</div>
                <div class="field-value">${displayDOB}</div>
              </div>
              <div class="field">
                <div class="field-label">Age</div>
                <div class="field-value">${displayAge !== null ? displayAge + " years" : "N/A"}</div>
              </div>
              <div class="field">
                <div class="field-label">Blood Type</div>
                <div class="field-value blood">${patient.bloodType || "N/A"}</div>
              </div>
              <div class="field">
                <div class="field-label">Registered</div>
                <div class="field-value">${patient.registeredDate}</div>
              </div>
              <div class="field full-width">
                <div class="field-label">Phone</div>
                <div class="field-value">${patient.phone || "N/A"}</div>
              </div>
              <div class="field full-width">
                <div class="field-label">Email</div>
                <div class="field-value">${patient.email}</div>
              </div>
            </div>
          </div>
          <div class="footer">
            <div class="footer-text">Keep this card for all hospital visits</div>
          </div>
        </div>
        <script>
          window.addEventListener('load', function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          });
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function RegisterPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<RegisteredPatient | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      dateOfBirth: "",
      age: undefined,
      bloodType: "",
      gender: "MALE"
    }
  });

  const dobValue = watch("dateOfBirth");
  const ageValue = watch("age");

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("dateOfBirth", value, { shouldValidate: true });
    if (value) {
      const computed = differenceInYears(new Date(), new Date(value));
      setValue("age", computed, { shouldValidate: true });
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("age", value ? Number(value) : undefined, { shouldValidate: true });
    if (value) setValue("dateOfBirth", "", { shouldValidate: true }); // clear DOB when age typed manually
  };

  const onSubmit = async (data: RegisterFormValues) => {
    if (!data.dateOfBirth && data.age === undefined) {
      toast.error("Please provide either a Date of Birth or an Age");
      return;
    }

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(data.phone);

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: formattedPhone,
          password: data.password,
          dateOfBirth: data.dateOfBirth || undefined,
          age: data.age,
          bloodType: data.bloodType || undefined,
          gender: data.gender
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const patient = await res.json();
      setRegisteredPatient(patient);
      toast.success("Patient registered successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNew = () => {
    setRegisteredPatient(null);
    reset();
  };

  // ── Success Screen ──────────────────────────────────────────────────────
  if (registeredPatient) {
    return (
      <DashboardLayout role="receptionist">
        <div className="max-w-2xl mx-auto space-y-8 pb-10">
          {/* Success Card */}
          <div className="bg-white dark:bg-[#111C3A] rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-2xl overflow-hidden transition-colors duration-500">
            {/* Green Banner */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-10 text-white text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={44} className="text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Patient Registered!</h1>
              <p className="text-emerald-100 font-medium mt-1">New patient profile created successfully.</p>
            </div>

            {/* Patient Card Preview */}
            <div className="p-10 space-y-8">
              {/* Card number badge */}
              <div className="flex justify-center">
                <div className="flex items-center gap-3 px-6 py-3 bg-[#1E4A8A]/10 dark:bg-[#4A8AC8]/10 rounded-2xl border border-[#1E4A8A]/20 dark:border-[#4A8AC8]/20">
                  <CreditCard className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={20} />
                  <span className="font-black text-[#1E4A8A] dark:text-[#4A8AC8] text-lg tracking-widest">
                    {registeredPatient.cardNumber}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoTile icon={<User size={16} />} label="Full Name" value={registeredPatient.name} />
                <InfoTile icon={<Mail size={16} />} label="Email" value={registeredPatient.email} />
                <InfoTile icon={<Phone size={16} />} label="Phone" value={registeredPatient.phone || "—"} />
                <InfoTile
                  icon={<Calendar size={16} />}
                  label="Date of Birth"
                  value={
                    registeredPatient.dateOfBirth
                      ? format(new Date(registeredPatient.dateOfBirth), "MMM dd, yyyy")
                      : "—"
                  }
                />
                {registeredPatient.age !== undefined && (
                  <InfoTile icon={<Hash size={16} />} label="Age" value={`${registeredPatient.age} years`} />
                )}
                {registeredPatient.bloodType && (
                  <InfoTile
                    icon={<Droplets size={16} />}
                    label="Blood Type"
                    value={registeredPatient.bloodType}
                    highlight="red"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#F0F4F8] dark:border-[#0A122A]">
                <button
                  onClick={() => handlePrintCard(registeredPatient)}
                  className="flex-1 flex items-center justify-center gap-3 py-5 bg-[#1E4A8A] hover:bg-[#0F3A6A] dark:bg-[#4A8AC8] dark:hover:bg-[#1E4A8A] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#1E4A8A]/20 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <Printer size={20} />
                  Print Patient Card
                </button>
                <button
                  onClick={handleRegisterNew}
                  className="flex-1 flex items-center justify-center gap-3 py-5 bg-[#F0F4F8] dark:bg-[#0A122A] hover:bg-[#D0DCE8] dark:hover:bg-[#1A2A4A] text-[#1A2A4A] dark:text-[#E8EEF8] rounded-2xl font-black text-sm uppercase tracking-widest border border-[#D0DCE8] dark:border-[#1A2A4A] transition-all"
                >
                  <RotateCcw size={18} />
                  Register New Patient
                </button>
              </div>

              <button
                onClick={() => router.push("/dashboard/receptionist")}
                className="w-full text-center text-[#5A6E8A] dark:text-[#8A9CBA] font-bold text-sm hover:text-[#1E4A8A] dark:hover:text-[#4A8AC8] underline underline-offset-4 transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Registration Form ───────────────────────────────────────────────────
  const fieldClass =
    "rounded-2xl h-14 bg-[#F0F4F8] dark:bg-[#0A122A] border-[#D0DCE8] dark:border-[#1A2A4A] focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500";
  const labelClass =
    "font-black text-xs uppercase tracking-widest text-[#1A2A4A] dark:text-[#E8EEF8]";
  const selectClass =
    "w-full rounded-2xl h-14 border border-[#D0DCE8] dark:border-[#1A2A4A] bg-[#F0F4F8] dark:bg-[#0A122A] px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1E4A8A] text-[#1A2A4A] dark:text-[#E8EEF8] transition-colors duration-500";

  return (
    <DashboardLayout role="receptionist">
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-4xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight flex items-center gap-4">
            <UserPlus className="text-[#1E4A8A] dark:text-[#4A8AC8]" size={40} />
            Patient Registration
          </h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 text-lg">
            Enter the details below to create a new patient profile.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="rounded-[3rem] border-[#D0DCE8] dark:border-[#1A2A4A] shadow-xl shadow-blue-500/5 overflow-hidden bg-white dark:bg-[#111C3A] transition-colors duration-500">
            <CardHeader className="bg-[#F0F4F8] dark:bg-[#0A122A] border-b border-[#D0DCE8] dark:border-[#1A2A4A] p-10 transition-colors duration-500">
              <CardTitle className="text-xl font-black text-[#1A2A4A] dark:text-[#E8EEF8]">
                Personal Information
              </CardTitle>
              <CardDescription className="text-[#5A6E8A] dark:text-[#8A9CBA] font-medium">
                Blood type is optional. Provide either Date of Birth or Age.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Full Name */}
                <div className="space-y-3">
                  <Label className={labelClass}>Full Name</Label>
                  <Input {...register("name")} placeholder="John Doe" className={fieldClass} />
                  {errors.name && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <Label className={labelClass}>Email Address</Label>
                  <Input {...register("email")} type="email" placeholder="john@example.com" className={fieldClass} />
                  {errors.email && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <Label className={labelClass}>Phone Number</Label>
                  <Input {...register("phone")} placeholder="+251..." className={fieldClass} />
                  {errors.phone && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.phone.message}</p>}
                </div>

                {/* Gender */}
                <div className="space-y-3">
                  <Label className={labelClass}>Gender</Label>
                  <select {...register("gender")} className={selectClass}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.gender.message}</p>}
                </div>

                {/* Date of Birth — auto-fills Age */}
                <div className="space-y-3">
                  <Label className={labelClass}>
                    Date of Birth
                    <span className="ml-1 font-medium normal-case tracking-normal text-[#5A6E8A]/70 dark:text-[#8A9CBA]/70 lowercase text-[10px]">
                      (auto-fills age)
                    </span>
                  </Label>
                  <Input
                    type="date"
                    {...register("dateOfBirth")}
                    onChange={handleDobChange}
                    max={new Date().toISOString().split("T")[0]}
                    className={fieldClass}
                  />
                  {errors.dateOfBirth && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.dateOfBirth.message}</p>}
                </div>

                {/* Age */}
                <div className="space-y-3">
                  <Label className={labelClass}>
                    Age (years)
                    <span className="ml-1 font-medium normal-case tracking-normal text-[#5A6E8A]/70 dark:text-[#8A9CBA]/70 lowercase text-[10px]">
                      (or enter manually)
                    </span>
                  </Label>
                  <Input
                    type="number"
                    {...register("age")}
                    onChange={handleAgeChange}
                    placeholder="e.g. 34"
                    min={0}
                    max={120}
                    className={fieldClass}
                  />
                  {errors.age && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.age.message}</p>}
                </div>

                {/* Blood Type — OPTIONAL */}
                <div className="space-y-3">
                  <Label className={labelClass}>
                    Blood Type
                    <span className="ml-1 font-medium normal-case tracking-normal text-[#5A6E8A]/70 dark:text-[#8A9CBA]/70 lowercase text-[10px]">
                      (optional)
                    </span>
                  </Label>
                  <select {...register("bloodType")} className={selectClass}>
                    <option value="">— Unknown / Skip —</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                  {errors.bloodType && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.bloodType.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <Label className={labelClass}>Initial Password</Label>
                  <Input
                    type="password"
                    {...register("password")}
                    placeholder="Min. 8 characters"
                    className={fieldClass}
                  />
                  {errors.password && <p className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {errors.password.message}</p>}
                </div>
              </div>

              <div className="pt-8 border-t border-[#F0F4F8] dark:border-[#0A122A] flex justify-end gap-4 transition-colors duration-500">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-2xl h-14 px-10 font-black uppercase tracking-widest border border-[#D0DCE8] dark:border-[#1A2A4A] text-[#5A6E8A] dark:text-[#8A9CBA] hover:bg-[#F0F4F8] dark:hover:bg-[#0A122A] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl h-14 px-12 font-black bg-[#1E4A8A] dark:bg-[#4A8AC8] hover:bg-[#0F3A6A] dark:hover:bg-[#1E4A8A] text-white shadow-xl shadow-[#1E4A8A]/20 transition-all flex items-center gap-2 uppercase tracking-widest"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Register Patient
                </button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}

// ─── Helper Component ────────────────────────────────────────────────────────
function InfoTile({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: "red";
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-[#F8FAFC] dark:bg-[#0A122A] rounded-2xl border border-[#E2E8F0] dark:border-[#1A2A4A]">
      <span className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#5A6E8A] dark:text-[#8A9CBA]">{label}</p>
        <p
          className={`font-bold text-sm truncate ${
            highlight === "red"
              ? "text-red-600 dark:text-red-400"
              : "text-[#1A2A4A] dark:text-[#E8EEF8]"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
