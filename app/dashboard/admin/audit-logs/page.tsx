"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, Download, ChevronDown, ChevronUp, Activity, Filter } from "lucide-react";

type AuditLog = {
  id: string;
  createdAt: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  oldValues: any;
  newValues: any;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filters
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (entity) params.append("entity", entity);
      if (action) params.append("action", action);
      if (userId) params.append("userId", userId);
      if (from) params.append("from", from);
      if (to) params.append("to", to);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error("Error fetching audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entity, action, userId, from, to]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["Timestamp", "User ID", "User Name", "Role", "Action", "Entity", "Entity ID", "IP Address", "Changes"];
    const csvContent = logs.map(log => {
      const changes = JSON.stringify({ old: log.oldValues, new: log.newValues }).replace(/"/g, '""');
      return `"${log.createdAt}","${log.userId}","${log.userName}","${log.userRole}","${log.action}","${log.entity}","${log.entityId || ""}","${log.ipAddress || ""}","${changes}"`;
    });
    
    const csv = [headers.join(","), ...csvContent].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getActionBadge = (act: string) => {
    switch (act.toUpperCase()) {
      case "CREATE": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "UPDATE": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "DELETE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#1E3A5F] dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="text-blue-500" size={32} />
            System Audit Logs
          </h1>
          <p className="text-[#5A6E8A] dark:text-[#8A9CBA] mt-2 text-sm">
            Track and monitor all critical actions across the platform.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-[#1E3A5F] text-white rounded-xl font-bold hover:bg-[#0F2A4A] transition-all shadow-lg"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-[#0B1121] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Action</label>
          <select 
            value={action} 
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Entity</label>
          <select 
            value={entity} 
            onChange={(e) => { setEntity(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Entities</option>
            <option value="Patient">Patient</option>
            <option value="Appointment">Appointment</option>
            <option value="MedicalRecord">MedicalRecord</option>
            <option value="Payment">Payment</option>
            <option value="DrugDispensing">DrugDispensing</option>
            <option value="LabResult">LabResult</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">User ID</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by User ID" 
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setPage(1); }}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">From</label>
          <input 
            type="date" 
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">To</label>
          <input 
            type="date" 
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B1121] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Role</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Entity</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Entity ID</th>
                <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 font-medium">Loading audit logs...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Filter className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="font-medium">No logs found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {log.userName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold tracking-wider">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 border rounded-lg text-xs font-bold tracking-wider ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {log.entity}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {log.entityId || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {(log.oldValues || log.newValues) && (
                          <button
                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-blue-500"
                          >
                            {expandedRow === log.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr className="bg-gray-50/50 dark:bg-gray-900/20">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            {log.oldValues && (
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Previous Values</h4>
                                <pre className="bg-white dark:bg-[#0B1121] p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-red-600 dark:text-red-400 overflow-x-auto shadow-inner">
                                  {JSON.stringify(log.oldValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Values</h4>
                                <pre className="bg-white dark:bg-[#0B1121] p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-green-600 dark:text-green-400 overflow-x-auto shadow-inner">
                                  {JSON.stringify(log.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
