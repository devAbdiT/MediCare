// components/admin/PrintSingleUser.tsx
"use client";

import React from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  dateOfBirth?: string;
  bloodType?: string;
  specialization?: string;
  createdAt: string;
}

interface AppointmentData {
  id: string;
  dateTime: string;
  doctorName: string;
  status: string;
}

interface PrintSingleUserProps {
  user: UserData;
  appointments?: AppointmentData[];
}

export function PrintSingleUser({ user, appointments }: PrintSingleUserProps) {
  const printDate = new Date().toLocaleString();

  return (
    <div id="print-content" className="print-container p-8 max-w-4xl mx-auto bg-white text-black font-sans">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Bosa Kito Health Center</h1>
        <p className="text-lg font-bold text-gray-600">Clinical Management System (PDMS)</p>
        <p className="text-sm text-gray-500 mt-2">Document Generated: {printDate}</p>
      </div>

      {/* User Details Section */}
      <div className="mb-10">
        <h2 className="text-xl font-black uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">Manifest Identity Details</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          <p><strong>Full Name:</strong> {user.name}</p>
          <p><strong>System Role:</strong> {user.role}</p>
          <p><strong>Network Email:</strong> {user.email}</p>
          <p><strong>Contact Phone:</strong> {user.phone || "Not specified"}</p>
          <p><strong>Registry Date:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          <p><strong>Global ID:</strong> {user.id}</p>
          
          {user.role === "PATIENT" && (
            <>
              <p><strong>Date of Birth:</strong> {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"}</p>
              <p><strong>Blood Group:</strong> {user.bloodType?.replace("_", "+") || "Not provided"}</p>
            </>
          )}
          
          {user.role === "DOCTOR" && (
            <p><strong>Specialization:</strong> {user.specialization || "General Medicine"}</p>
          )}
        </div>
      </div>

      {/* Appointment History (for patients) */}
      {user.role === "PATIENT" && appointments && appointments.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-black uppercase tracking-widest border-b border-gray-300 pb-2 mb-6">Clinical Encounter History</h2>
          <table className="w-full text-left border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-xs font-black uppercase tracking-widest">Date & Time</th>
                <th className="border border-gray-300 p-3 text-xs font-black uppercase tracking-widest">Attending Physician</th>
                <th className="border border-gray-300 p-3 text-xs font-black uppercase tracking-widest">Encounter Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td className="border border-gray-300 p-3 text-sm">{new Date(apt.dateTime).toLocaleString()}</td>
                  <td className="border border-gray-300 p-3 text-sm">Dr. {apt.doctorName}</td>
                  <td className="border border-gray-300 p-3 text-xs font-bold uppercase">{apt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-sm text-gray-500 mt-4">
            <strong>Total Encounters:</strong> {appointments.length}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-gray-400 text-xs mt-12 pt-6 border-t border-gray-200 italic">
        <p>This is a certified electronic clinical record manifest. City Hospital PDMS v1.0</p>
        <p>Jimma, Oromia, Ethiopia - Bosa Kito Health Center</p>
      </div>
    </div>
  );
}
