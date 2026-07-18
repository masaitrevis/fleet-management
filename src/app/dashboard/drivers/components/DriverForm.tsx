'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Shield, MapPin, Phone, FileText, ClipboardList, Plus, Trash2 } from 'lucide-react';

const tabs = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'license', label: 'License', icon: Shield },
  { id: 'work', label: 'Work Details', icon: MapPin },
  { id: 'emergency', label: 'Emergency', icon: Phone },
  { id: 'notes', label: 'Notes', icon: FileText },
];

const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_LEAVE', 'TERMINATED', 'PENDING'];
const GENDERS = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY', 'OTHER'];
const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER'];
const LICENSE_CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'OTHER'];
const LICENSE_TYPES = ['COMMERCIAL', 'NON_COMMERCIAL', 'LEARNER', 'PROVISIONAL', 'INTERNATIONAL'];

interface LicenseFormData {
  licenseNumber: string;
  licenseClass: string;
  licenseType: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  country: string;
  state: string;
  documentUrl: string;
}

export default function DriverFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = Boolean(params?.id && params?.id !== 'new');
  const driverId = isEdit ? (params?.id as string) : null;

  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [formData, setFormData] = useState<Record<string, any>>({ status: 'PENDING' });
  const [licenses, setLicenses] = useState<LicenseFormData[]>([]);

  useEffect(() => {
    if (isEdit && driverId) fetchDriver();
  }, [driverId]);

  const fetchDriver = async () => {
    try {
      const res = await fetch(`/api/drivers/${driverId}`);
      const data = await res.json();
      if (data.success) {
        setFormData(data.data);
        if (data.data.licenses && data.data.licenses.length > 0) {
          setLicenses(data.data.licenses.map((l: any) => ({
            licenseNumber: l.licenseNumber || '',
            licenseClass: l.licenseClass || '',
            licenseType: l.licenseType || '',
            issueDate: l.issueDate ? new Date(l.issueDate).toISOString().split('T')[0] : '',
            expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString().split('T')[0] : '',
            issuingAuthority: l.issuingAuthority || '',
            country: l.country || '',
            state: l.state || '',
            documentUrl: l.documentUrl || '',
          })));
        }
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLicense = () => {
    setLicenses([...licenses, {
      licenseNumber: '', licenseClass: '', licenseType: 'COMMERCIAL',
      issueDate: '', expiryDate: '', issuingAuthority: '', country: '', state: '', documentUrl: '',
    }]);
  };

  const removeLicense = (idx: number) => {
    setLicenses(licenses.filter((_, i) => i !== idx));
  };

  const updateLicense = (idx: number, field: keyof LicenseFormData, value: string) => {
    const updated = [...licenses];
    updated[idx] = { ...updated[idx], [field]: value };
    setLicenses(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      // Convert date strings to ISO format if needed
      const dateFields = ['dateOfBirth', 'hireDate', 'terminationDate'];
      for (const f of dateFields) {
        if (payload[f] && !payload[f].endsWith('Z') && payload[f].includes('T')) {
          // Already ISO, keep it
        } else if (payload[f]) {
          payload[f] = new Date(payload[f]).toISOString();
        }
      }
      // Add licenses
      const formattedLicenses = licenses
        .filter(l => l.licenseNumber.trim())
        .map(l => ({
          ...l,
          issueDate: l.issueDate ? new Date(l.issueDate).toISOString() : undefined,
          expiryDate: l.expiryDate ? new Date(l.expiryDate).toISOString() : undefined,
        }));
      if (formattedLicenses.length > 0) {
        payload.licenses = formattedLicenses;
      } else {
        delete payload.licenses;
      }
      // Remove relation fields that shouldn't be sent
      delete payload.currentVehicles;
      delete payload.driverDocuments;
      delete payload.assignments;
      delete payload.driverCertifications;
      delete payload.driverMedicalRecords;
      delete payload._count;
      delete payload.company;
      delete payload.user;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.id;

      const url = isEdit ? `/api/drivers/${driverId}` : '/api/drivers';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) router.push(`/dashboard/drivers/${data.data.id || driverId}`);
      else alert(data.error?.message || 'Failed to save');
    } catch (error) { console.error(error); alert('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const field = (label: string, name: string, type = 'text', options?: string[], required = false) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {options ? (
        <select value={formData[name] || ''} onChange={(e) => handleChange(name, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option value="">Select {label}</option>
          {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
        </select>
      ) : type === 'date' ? (
        <input type="date" value={formData[name] ? (typeof formData[name] === 'string' && formData[name].includes('T') ? formData[name].split('T')[0] : formData[name]) : ''} onChange={(e) => handleChange(name, e.target.value ? new Date(e.target.value).toISOString() : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
      ) : (
        <input type={type} value={formData[name] || ''} onChange={(e) => handleChange(name, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/drivers${driverId ? `/${driverId}` : ''}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Driver' : 'Add Driver'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {field('First Name', 'firstName', 'text', undefined, true)}
              {field('Last Name', 'lastName', 'text', undefined, true)}
              {field('Email', 'email', 'email')}
              {field('Phone', 'phone', 'tel')}
              {field('Phone 2', 'phone2', 'tel')}
              {field('Employee ID', 'employeeId')}
              {field('National ID', 'idNumber')}
              {field('Gender', 'gender', 'select', GENDERS)}
              {field('Marital Status', 'maritalStatus', 'select', MARITAL_STATUSES)}
              {field('Nationality', 'nationality')}
              {field('Date of Birth', 'dateOfBirth', 'date')}
              {field('Hire Date', 'hireDate', 'date')}
              {field('Termination Date', 'terminationDate', 'date')}
              {field('Status', 'status', 'select', STATUSES)}
            </div>
          )}

          {activeTab === 'license' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Driver Licenses</h3>
                <button type="button" onClick={addLicense} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                  <Plus className="w-4 h-4" />Add License
                </button>
              </div>
              {licenses.length === 0 && <p className="text-gray-500">No licenses added yet. Click "Add License" to add one.</p>}
              {licenses.map((lic, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">License #{idx + 1}</p>
                    <button type="button" onClick={() => removeLicense(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                      <input type="text" required value={lic.licenseNumber} onChange={(e) => updateLicense(idx, 'licenseNumber', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Class</label>
                      <select value={lic.licenseClass} onChange={(e) => updateLicense(idx, 'licenseClass', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select class</option>
                        {LICENSE_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                      <select value={lic.licenseType} onChange={(e) => updateLicense(idx, 'licenseType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Authority</label>
                      <input type="text" value={lic.issuingAuthority} onChange={(e) => updateLicense(idx, 'issuingAuthority', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                      <input type="date" value={lic.issueDate} onChange={(e) => updateLicense(idx, 'issueDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input type="date" value={lic.expiryDate} onChange={(e) => updateLicense(idx, 'expiryDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input type="text" value={lic.country} onChange={(e) => updateLicense(idx, 'country', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input type="text" value={lic.state} onChange={(e) => updateLicense(idx, 'state', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="mb-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
                      <input type="url" value={lic.documentUrl} onChange={(e) => updateLicense(idx, 'documentUrl', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'work' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {field('Address', 'address')}
              {field('City', 'city')}
              {field('State', 'state')}
              {field('Country', 'country')}
              {field('Postal Code', 'postalCode')}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {field('Emergency Contact Name', 'emergencyContact')}
              {field('Emergency Phone', 'emergencyPhone', 'tel')}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this driver..."
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Link href={`/dashboard/drivers${driverId ? `/${driverId}` : ''}`} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Driver'}
          </button>
        </div>
      </form>
    </div>
  );
}
