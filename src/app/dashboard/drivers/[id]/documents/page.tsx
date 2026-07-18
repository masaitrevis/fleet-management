'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, X, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface Document {
  id: string;
  documentType: string;
  title: string;
  fileUrl: string;
  expiryDate?: string;
  issueDate?: string;
  isVerified: boolean;
}

const docTypes = [
  'REGISTRATION', 'INSURANCE', 'INSPECTION', 'LICENSE', 'CERTIFICATION',
  'MEDICAL', 'TRAINING', 'PERMIT', 'PHOTO', 'CONTRACT', 'OTHER',
  'LOGBOOK', 'ROAD_LICENSE', 'INSPECTION_CERTIFICATE', 'EMISSIONS_CERTIFICATE',
  'IMPORT_DOCUMENTS', 'WARRANTY',
];

export default function DriverDocumentsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [driver, setDriver] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    documentType: 'LICENSE',
    title: '',
    fileUrl: '',
    fileName: '',
    mimeType: '',
    expiryDate: '',
    issueDate: '',
    notes: '',
  });

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [dRes, docRes] = await Promise.all([
        fetch(`/api/drivers/${id}`),
        fetch(`/api/drivers/${id}/documents`),
      ]);
      const dData = await dRes.json();
      const docData = await docRes.json();
      if (dData.success) setDriver(dData.data);
      if (docData.success) setDocuments(docData.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (!payload.fileName) payload.fileName = payload.title;
      const res = await fetch(`/api/drivers/${id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          documentType: 'LICENSE', title: '', fileUrl: '', fileName: '',
          mimeType: '', expiryDate: '', issueDate: '', notes: '',
        });
        fetchData();
      }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try { const res = await fetch(`/api/drivers/${id}/documents/${docId}`, { method: 'DELETE' }); if (res.ok) fetchData(); }
    catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const primaryLicense = driver?.licenses?.[0];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/dashboard/drivers/${id}`} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Driver Documents</h1>
          <p className="text-gray-600">{driver?.firstName} {driver?.lastName} · {primaryLicense?.licenseNumber || 'No license'}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />Add Document
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {documents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => {
              const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
              return (
                <div key={doc.id} className="p-4 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.title}</p>
                      <p className="text-sm text-gray-500">{doc.documentType.replace(/_/g, ' ')} {doc.isVerified && <span className="text-green-600 font-medium">· Verified</span>}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {doc.expiryDate && (
                          <span className={`flex items-center gap-1 ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                            {isExpired && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded"><AlertCircle className="w-3 h-3" />Expired</span>}
                          </span>
                        )}
                        {doc.issueDate && (
                          <span className="text-gray-500">Issued: {new Date(doc.issueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">View</a>
                    <button onClick={() => handleDelete(doc.id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No documents uploaded yet</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Add Document</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select value={formData.documentType} onChange={(e) => setFormData({ ...formData, documentType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {docTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label><input type="url" required value={formData.fileUrl} onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="https://..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">File Name (optional)</label><input type="text" value={formData.fileName} onChange={(e) => setFormData({ ...formData, fileName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label><input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label><input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
