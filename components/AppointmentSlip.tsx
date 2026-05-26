"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { format } from "date-fns";
import { Stethoscope } from "lucide-react";

export interface AppointmentSlipProps {
  appointment: any;
}

export const AppointmentSlip = forwardRef(({ appointment }: AppointmentSlipProps, ref) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  useImperativeHandle(ref, () => ({
    print: () => {
      window.print();
    }
  }));

  if (!appointment) return null;

  return (
    <div className="hidden print:block w-full bg-white text-black font-sans print:m-0 print:p-0">
      <div className="max-w-3xl mx-auto border-2 border-slate-800 p-8 rounded-xl print:border-none print:shadow-none print:p-0">
        <div className="text-center mb-8 border-b-2 border-slate-200 pb-6 print:border-slate-800">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white print:border print:border-slate-900 print:bg-white print:text-slate-900">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 m-0">MediCare</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] m-0">Appointment Scheduling System</p>
            </div>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800 m-0">Appointment Slip</h2>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 print:text-slate-600">Patient Information</h3>
            <div className="space-y-2 text-sm text-slate-800">
              <p><span className="font-bold">Name:</span> {appointment.patient?.user?.name || "N/A"}</p>
              <p><span className="font-bold">Card Number:</span> {appointment.patient?.cardNumber || "N/A"}</p>
              <p><span className="font-bold">Phone:</span> {appointment.patient?.user?.phone || "N/A"}</p>
              {appointment.patient?.user?.email && <p><span className="font-bold">Email:</span> {appointment.patient?.user?.email}</p>}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 print:text-slate-600">Appointment Information</h3>
            <div className="space-y-2 text-sm text-slate-800">
              <p><span className="font-bold">Doctor:</span> Dr. {appointment.doctor?.user?.name || "N/A"}</p>
              {appointment.doctor?.specialization && <p><span className="font-bold">Department:</span> {appointment.doctor?.specialization}</p>}
              <p><span className="font-bold">Date:</span> {appointment.dateTime ? format(new Date(appointment.dateTime), "MMMM dd, yyyy") : "N/A"}</p>
              <p><span className="font-bold">Time:</span> {appointment.dateTime ? format(new Date(appointment.dateTime), "h:mm a") : "N/A"}</p>
              {appointment.queueNumber && <p><span className="font-bold">Queue Number:</span> #{appointment.queueNumber}</p>}
            </div>
          </div>
        </div>

        <div className="mb-8 border-t-2 border-slate-100 pt-6 print:border-slate-800">
          <div className="grid grid-cols-3 gap-4 text-sm mb-4 text-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 print:text-slate-600">Type</p>
              <p className="font-bold">{(appointment.appointmentType || "NEW_VISIT").replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 print:text-slate-600">Priority</p>
              <p className="font-bold">{appointment.priority || "NORMAL"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 print:text-slate-600">Status</p>
              <p className="font-bold">{(appointment.status || "SCHEDULED").replace("_", " ")}</p>
            </div>
          </div>

          {appointment.reason && (
            <div className="mt-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 print:text-slate-600">Reason / Notes</p>
              <p className="text-sm text-slate-800">{appointment.reason}</p>
            </div>
          )}
        </div>

        <div className="text-center border-t-2 border-slate-200 pt-6 mt-8 print:border-slate-800">
          <p className="text-sm font-bold text-slate-800 mb-1">Please arrive on time and bring your patient card.</p>
          <p className="text-xs text-slate-500 print:text-slate-600">This is a system-generated appointment slip.</p>
          <p className="text-[10px] text-slate-400 mt-4 print:text-slate-500">Printed on: {format(new Date(), "PPpp")}</p>
        </div>
      </div>
    </div>
  );
});

AppointmentSlip.displayName = "AppointmentSlip";
