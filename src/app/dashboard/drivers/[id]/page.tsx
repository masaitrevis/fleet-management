'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, User, Phone, Mail, MapPin, Car, Calendar,
  CheckCircle, Ban, AlertTriangle, FileText, History, Shield, Briefcase, ClipboardList, Clock
} from 'lucide-react';

interface License {
  id: string;
  licenseNumber: string;
  licenseClass?: string;
  licenseType?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
}

interface DriverDocument {
  id: string;
  documentType: string;
  title: string;
  expiryDate?: string;
}

interface VehicleAssignment {
  id: string;
  vehicle: { id: string; registrationNumber: string; make: string; model: string };
  assignedAt: string;
  endedAt?: string;
}

interface DriverDetail {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  phone2?: string;
  employeeId?: string;
  status: string;
  dateOfBirth?: string;
  hireDate?: string;
  terminationDate?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  idNumber?: string;
  notes?: string;
  licenses: License[];
  currentVehicles: { id: string; registrationNumber: string; make: string; model: string }[];
  driverDocuments: DriverDocument[];
  assignments: VehicleAssignment[];
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ACTIVE: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Active' },
  INACTIVE: { icon: Ban, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Inactive' },
  SUSPENDED: { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', label: 'Suspended' },
  ON_LEAVE: { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', label: 'On Leave' },
  TERMINATED: { icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100', label: 'Terminated' },
  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
};

export default function DriverDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { fetchDriver(); }, [id]);

  const fetchDriver = async () => {
    try {
      const res = await fetch(`/api/drivers/${id}`);
      const data = await res.json();
      if (data.success) setDriver(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this driver?')) return;
    try { const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' }); if (res.ok) window.location.href = '/dashboard/drivers'; }
    catch (error) { console.error(error); }
  };

  if (loading || !driver) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const cfg = statusConfig[driver.status] || statusConfig.INACTIVE;
  const StatusIcon = cfg.icon;
  const primaryLicense = driver.licenses?.[0];
  const currentVehicle = driver.currentVehicles?.[0];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/drivers" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-lg">
              {driver.firstName[0]}{driver.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{driver.firstName} {driver.lastName}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                <StatusIcon className="w-3 h-3" />{cfg.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/drivers/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Pencil className="w-4 h-4" />Edit
          </Link>
          <button onClick={handleDelete} className="p-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{driver.firstName} {driver.lastName}</p></div>
                <div><p className="text-sm text-gray-500">Email</p><p className="font-medium flex items-center gap-1"><Mail className="w-3 h-3" />{driver.email || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Phone 2</p><p className="font-medium">{driver.phone2 || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Employee ID</p><p className="font-medium">{driver.employeeId || '—'}</p></div>
                <div><p className="text-sm text-gray-500">National ID</p><p className="font-medium">{driver.idNumber || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium">{driver.gender || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Marital Status</p><p className="font-medium">{driver.maritalStatus || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Nationality</p><p className="font-medium">{driver.nationality || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium">{driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-sm text-gray-500">Hire Date</p><p className="font-medium">{driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-sm text-gray-500">Termination Date</p><p className="font-medium">{driver.terminationDate ? new Date(driver.terminationDate).toLocaleDateString() : '—'}</p></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">License Information</h2>
              {driver.licenses && driver.licenses.length > 0 ? (
                <div className="space-y-4">
                  {driver.licenses.map((lic) => (
                    <div key={lic.id} className="grid grid-cols-2 md:grid-cols-3 gap-4 border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div><p className="text-sm text-gray-500">License Number</p><p className="font-medium">{lic.licenseNumber || '—'}</p></div>
                      <div><p className="text-sm text-gray-500">License Class</p><p className="font-medium">{lic.licenseClass || '—'}</p></div>
                      <div><p className="text-sm text-gray-500">License Type</p><p className="font-medium">{lic.licenseType || '—'}</p></div>
                      <div><p className="text-sm text-gray-500">Issue Date</p><p className="font-medium">{lic.issueDate ? new Date(lic.issueDate).toLocaleDateString() : '—'}</p></div>
                      <div><p className="text-sm text-gray-500">Expiry Date</p><p className="font-medium">
                        {lic.expiryDate ? new Date(lic.expiryDate).toLocaleDateString() : '—'}
                        {lic.expiryDate && new Date(lic.expiryDate) < new Date() && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Expired</span>}
                      </p></div>
                      <div><p className="text-sm text-gray-500">Issuing Authority</p><p className="font-medium">{lic.issuingAuthority || '—'}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No licenses recorded</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Address & Emergency Contact</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{driver.address || '—'}</p></div>
                <div><p className="text-sm text-gray-500">City/State</p><p className="font-medium">{[driver.city, driver.state].filter(Boolean).join(', ') || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Country</p><p className="font-medium">{driver.country || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Postal Code</p><p className="font-medium">{driver.postalCode || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Emergency Contact</p><p className="font-medium">{driver.emergencyContact || '—'}</p></div>
                <div><p className="text-sm text-gray-500">Emergency Phone</p><p className="font-medium">{driver.emergencyPhone || '—'}</p></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Work Details</h2>
              <div className="space-y-4">
                <div><p className="text-sm text-gray-500">Current Vehicle</p></div>
                {currentVehicle ? (
                  <Link href={`/dashboard/vehicles/${currentVehicle.id}`} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Car className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium">{currentVehicle.registrationNumber}</p>
                      <p className="text-sm text-gray-500">{currentVehicle.make} {currentVehicle.model}</p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-sm text-gray-400">No vehicle assigned</p>
                )}
              </div>
            </div>

            {driver.notes && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-2">Notes</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{driver.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Documents</h2>
            <Link href={`/dashboard/drivers/${id}/documents`} className="text-sm text-blue-600 hover:text-blue-700">Manage Documents →</Link>
          </div>
          {driver.driverDocuments && driver.driverDocuments.length > 0 ? (
            <div className="space-y-2">
              {driver.driverDocuments.map((doc) => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-gray-500">{doc.documentType.replace(/_/g, ' ')} {isExpired && <span className="text-red-600 font-medium">(Expired)</span>}</p>
                      </div>
                    </div>
                    {doc.expiryDate && <span className="text-sm text-gray-500">Exp: {new Date(doc.expiryDate).toLocaleDateString()}</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No documents uploaded</p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Assignment History</h2>
          {driver.assignments && driver.assignments.length > 0 ? (
            <div className="space-y-3">
              {driver.assignments.map((a, i) => (
                <div key={a.id} className="flex items-start gap-4 p-3 border border-gray-100 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">{i + 1}</div>
                  <div className="flex-1">
                    <p className="font-medium">{vehicleDisplay(a.vehicle)}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Assigned: {new Date(a.assignedAt).toLocaleDateString()}</span>
                      {a.endedAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Ended: {new Date(a.endedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No assignment history</p>
          )}
        </div>
      )}
    </div>
  );
}

function vehicleDisplay(v: { registrationNumber: string; make: string; model: string }) {
  return `${v.registrationNumber} — ${v.make} ${v.model}`;
}
