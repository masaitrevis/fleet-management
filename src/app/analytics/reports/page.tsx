"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Trash2, Calendar, Filter } from "lucide-react";
import { DateRangeFilter } from "@/components/analytics/DateRangeFilter";

interface ReportItem {
  id: string;
  name: string;
  type: string;
  category: string;
  format: string;
  status: string;
  createdAt: string;
  summary: any;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      params.append("page", "1");
      params.append("limit", "50");
      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      if (json.success) setReports(json.data.reports);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [typeFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try {
      await fetch(`/api/reports/${id}`, { method: "DELETE" });
      fetchReports();
    } catch (e) { console.error(e); }
  };

  const formatLabels: Record<string, string> = {
    CSV: "CSV", EXCEL: "Excel", PDF: "PDF", JSON: "JSON", HTML: "HTML",
  };

  const typeLabels: Record<string, string> = {
    FLEET: "Fleet", DRIVER: "Driver", TRIP: "Trip", GPS: "GPS", FUEL: "Fuel",
    MAINTENANCE: "Maintenance", INVENTORY: "Inventory", COMPLIANCE: "Compliance", FINANCIAL: "Financial",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">{reports.length} reports generated</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onApply={fetchReports}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        {["", "FLEET", "DRIVER", "FUEL", "MAINTENANCE", "COMPLIANCE", "FINANCIAL"].map((t) => (
          <button
            key={t || "all"}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${typeFilter === t ? "bg-blue-50 text-blue-700 border-blue-200" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {t ? typeLabels[t] : "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reports yet. Generate one from the dashboard.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">{typeLabels[report.type] || report.type}</span>
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded">{formatLabels[report.format] || report.format}</span>
                        <span className={`px-1.5 py-0.5 rounded ${report.status === "COMPLETED" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                          {report.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Download">
                      <Download className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(report.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
