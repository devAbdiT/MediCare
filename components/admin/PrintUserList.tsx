// components/admin/PrintUserList.tsx
"use client";

import React from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialization?: string;
  bloodType?: string;
}

interface PrintUserListProps {
  users: User[];
  title: string;
}

export function PrintUserList({ users, title }: PrintUserListProps) {
  const printDate = new Date().toLocaleString();

  return (
    <div id="print-content" className="print-container p-8 bg-white text-black font-sans">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Bosa Kito Health Center</h1>
        <p className="text-lg font-bold text-gray-600">Patient Management System (PDMS)</p>
        <h2 className="text-xl font-black mt-4 uppercase border border-black inline-block px-6 py-2">{title}</h2>
        <p className="text-sm text-gray-500 mt-2 italic">Report Generated: {printDate}</p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-widest">Total Manifest Records: <span className="text-lg">{users.length}</span></p>
      </div>

      {/* Users Table */}
      <table className="w-full text-left border-collapse border border-black">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-3 text-[10px] font-black uppercase tracking-widest">#</th>
            <th className="border border-black p-3 text-[10px] font-black uppercase tracking-widest">Name</th>
            <th className="border border-black p-3 text-[10px] font-black uppercase tracking-widest">Email Address</th>
            <th className="border border-black p-3 text-[10px] font-black uppercase tracking-widest">Contact Phone</th>
            {title.includes("Doctors") && <th className="border border-black p-3 text-[10px] font-black uppercase tracking-widest">Specialization</th>}
            {title.includes("Patients") && <th className="border border-black p-3 text-[10px] font-black uppercase tracking-widest">Blood Type</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id}>
              <td className="border border-black p-3 text-xs font-bold">{index + 1}</td>
              <td className="border border-black p-3 text-sm font-bold">{user.name}</td>
              <td className="border border-black p-3 text-sm">{user.email}</td>
              <td className="border border-black p-3 text-sm">{user.phone || "---"}</td>
              {title.includes("Doctors") && (
                <td className="border border-black p-3 text-xs font-bold uppercase tracking-widest">{user.specialization || "N/A"}</td>
              )}
              {title.includes("Patients") && (
                <td className="border border-black p-3 text-xs font-bold">{user.bloodType?.replace("_", "+") || "---"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="text-center text-gray-400 text-[10px] mt-12 pt-6 border-t border-gray-200 italic font-medium">
        <p>This document is intended for administrative use only. Bosa Kito Health Center Clinical Record Manifest.</p>
      </div>
    </div>
  );
}
