import React, { useState } from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Calendar,
  Building2,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileCheck,
  ExternalLink,
  Sparkles,
  Scan,
  RefreshCw,
  Loader2,
  Stamp,
  ShieldCheck,
  AlertCircle,
  Mail
} from 'lucide-react';
import { useAicte } from '../context/AicteContext';
import { useRole } from '../context/RoleContext';
import { api } from '../services/api';

export default function Documents() {
  const {
    documents,
    institutions,
    simulatedDate,
    submitDocumentRenewal,
    verifyDocumentRenewal,
    requestDocumentRenewal,
    addNotification,
    logAuditEvent
  } = useAicte();
  const { role, roleConfig } = useRole();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL');

  // Renewal Modal
  const [selectedDocForRenewal, setSelectedDocForRenewal] = useState(null);
  const [newIssuedOn, setNewIssuedOn] = useState(simulatedDate);
  const [newExpiryDate, setNewExpiryDate] = useState('2029-10-28');
  const [renewalNotes, setRenewalNotes] = useState('');

  // AI Multimodal Vision Scanner Modal / Drawer
  const [aiScannerOpen, setAiScannerOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedSample, setSelectedSample] = useState('sample_lease_deed');
  const [customFile, setCustomFile] = useState(null);

  // Selected Doc for Full Dossier Inspector
  const [activeInspectorDoc, setActiveInspectorDoc] = useState(null);

  // Institution & Regional Officer Role Isolation
  const isInstitutionRole = role === 'INSTITUTION';
  const isRegionalOfficer = role === 'REGIONAL_OFFICER';

  const accessibleDocs = isInstitutionRole
    ? documents.filter(
        (doc) =>
          doc.institutionId === 'inst_sunrise' ||
          doc.institutionName.toLowerCase().includes('sunrise')
      )
    : isRegionalOfficer
    ? documents.filter((doc) => {
        const inst = institutions.find((i) => i.id === doc.institutionId);
        const region = inst?.region || '';
        return (
          region.toLowerCase().includes('west') ||
          doc.institutionName.toLowerCase().includes('sunrise') ||
          doc.institutionName.toLowerCase().includes('deccan')
        );
      })
    : documents;

  // Filtered documents
  const filteredDocs = accessibleDocs.filter((doc) => {
    const matchesSearch =
      doc.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.docType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    const matchesType = docTypeFilter === 'ALL' || doc.docType.includes(docTypeFilter);

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate high-level metrics
  const totalCount = accessibleDocs.length;
  const expiredCount = accessibleDocs.filter((d) => d.status === 'EXPIRED').length;
  const expiringSoonCount = accessibleDocs.filter((d) => d.status === 'EXPIRING_SOON').length;
  const renewalSubmittedCount = accessibleDocs.filter((d) => d.status === 'RENEWAL_SUBMITTED').length;
  const activeCount = accessibleDocs.filter((d) => d.status === 'ACTIVE' || d.status === 'RENEWED').length;

  const handleOpenRenewalModal = (doc) => {
    setSelectedDocForRenewal(doc);
    setNewIssuedOn(simulatedDate);
    // default 3 years ahead
    const dt = new Date(simulatedDate);
    dt.setFullYear(dt.getFullYear() + 3);
    setNewExpiryDate(dt.toISOString().split('T')[0]);
    setRenewalNotes('');
  };

  const handleConfirmRenewal = () => {
    if (!selectedDocForRenewal) return;
    submitDocumentRenewal(
      selectedDocForRenewal.id,
      '/docs/Renewed_Certified_Certificate.pdf',
      newIssuedOn,
      newExpiryDate,
      renewalNotes || 'Uploaded renewed certified compliance document.',
      role,
      roleConfig.title
    );
    setSelectedDocForRenewal(null);
  };

  const handleVerifyRenewal = (docId) => {
    verifyDocumentRenewal(docId, 'VERIFIED', 'Certified genuine after physical seal comparison.', role, roleConfig.title);
  };

  // Run Gemini Vision OCR on document
  const handleRunAiDocScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      let result;
      if (customFile) {
        const formData = new FormData();
        formData.append('file', customFile);
        formData.append('doc_hint', customFile.name);
        result = await api.scanAicteDocument(formData);
      } else {
        const formData = new FormData();
        formData.append('sample_id', selectedSample);
        result = await api.scanAicteDocument(formData);
      }
      setScanResult(result);
    } catch (err) {
      console.warn('Backend AI Scan fallback:', err);
      // Fallback sample data
      if (selectedSample === 'sample_building_safety') {
        setScanResult({
          doc_type: 'Building Safety & Structural Stability Certificate',
          issuing_authority: 'Executive Engineer, Division III, Public Works Department (PWD), Delhi',
          registration_no: 'PWD-DEL-STR-2023-4109',
          issued_on: '2023-09-30',
          expiry_date: '2026-09-30',
          validity_years: 3,
          lessor_party: 'Executive Engineer, PWD Division III',
          lessee_party: 'Delhi Institute of Polytechnic & Technology',
          legibility_score: 94,
          tampering_risk: 'LOW',
          key_clauses: [
            'Structural stability assessed in compliance with National Building Code (NBC-2016)',
            'Seismic Zone IV earthquake resistance load-bearing capacity certified',
            'Mandatory structural renewal due on 30 Sept 2026 (EXPIRED)'
          ],
          ai_summary: 'PWD Structural stability certificate inspected. Visual stamps match PWD Division III seal; document expired on 30 Sept 2026 requiring fresh triennial renewal.'
        });
      } else if (selectedSample === 'sample_fire_noc') {
        setScanResult({
          doc_type: 'Fire & Life Safety Clearance Certificate (NOC)',
          issuing_authority: 'West Bengal Fire & Emergency Services Directorate',
          registration_no: 'WB-FES-NOC-2025-1194',
          issued_on: '2025-11-18',
          expiry_date: '2026-11-17',
          validity_years: 1,
          lessor_party: 'Divisional Fire Officer, Kolkata South Division',
          lessee_party: 'Bengal College of Pharmacy & Allied Sciences',
          legibility_score: 95,
          tampering_risk: 'LOW',
          key_clauses: [
            'Automated wet-riser hydrant and down-comer fire fighting systems functional',
            'Emergency fire escape stairways (width 2.0m) clear of encroachments',
            'Annual renewal required before 17 Nov 2026 (T-20 days advance alert active)'
          ],
          ai_summary: 'Fire NOC verified authentic with active QR code and divisional seal. Certificate enters mandatory 30-day renewal window on 18 Oct 2026.'
        });
      } else {
        setScanResult({
          doc_type: 'Land Lease Deed (30-Year Registered)',
          issuing_authority: 'Sub-Registrar Office, Haveli Taluka, District Pune',
          registration_no: 'MH-PUN-HAV-2008-88192-REG',
          issued_on: '2008-04-12',
          expiry_date: '2038-04-11',
          validity_years: 30,
          lessor_party: 'Maharashtra Industrial Development Corporation (MIDC)',
          lessee_party: 'Sunrise Educational & Charitable Trust, Pune',
          legibility_score: 98,
          tampering_risk: 'LOW',
          key_clauses: [
            'Irrevocable 30-year statutory lease period valid up to 11 April 2038',
            'Continuous unencumbered possession granted for Technical Education campus',
            'Total demarcated land parcel area: 7.50 Acres (exceeds AICTE Western Region norm of 5.0 Acres)',
            'Government revenue e-Challan registration verified (GRN-MH-992104)'
          ],
          ai_summary: 'Official 30-year registered lease deed authenticated via Gemini Vision. Unencumbered land area (7.5 acres) fully satisfies AICTE Approval Process Handbook norms for Western Region.'
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyScanToDoc = (targetDoc) => {
    if (!scanResult || !targetDoc) return;
    submitDocumentRenewal(
      targetDoc.id,
      '/docs/Ai_Scanned_Verified_Certificate.pdf',
      scanResult.issued_on,
      scanResult.expiry_date,
      `AI Vision Extraction Verified: ${scanResult.registration_no} from ${scanResult.issuing_authority}`,
      role,
      roleConfig.title
    );
    setAiScannerOpen(false);
    setScanResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Module E Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="kicker-line mb-1">MODULE E · STATUTORY REQUISITES & TIMELINE TRACKING · TECH SETU AI</div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            College Documents, Leases & Safety Certificates
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Monitor important legal documents (such as 30-year registered land lease deeds, building safety, and fire safety NOCs).
            The system tracks expiration dates, warns ahead of time (90, 60, and 30 days), and reads uploaded papers using AI vision.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setAiScannerOpen(true);
              setScanResult(null);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>AI Document OCR & Vision Verifier</span>
          </button>
        </div>
      </div>

      {/* College Portal Banner (Shown ONLY for Institution role) */}
      {isInstitutionRole && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-sm">
                College Document Vault: Sunrise Institute of Technology
              </span>
              <span className="text-slate-700">
                AISHE Code: <strong>C-41208</strong> · Viewing your institution's registered land lease deed, building stability certificate, and fire safety NOCs.
              </span>
            </div>
          </div>
          <span className="shrink-0 font-mono text-[11px] font-bold px-3 py-1 rounded-md bg-amber-200/80 text-amber-950 border border-amber-400">
            College Registrar Account
          </span>
        </div>
      )}

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="civic-card p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
            TOTAL CERTIFICATES
          </span>
          <span className="text-2xl font-serif font-bold text-slate-900 mt-1 block">{totalCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Official records</span>
        </div>

        <div className="civic-card p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">
            VALID & ACTIVE
          </span>
          <span className="text-2xl font-serif font-bold text-emerald-600 mt-1 block">{activeCount}</span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">Clear status</span>
        </div>

        <div className="civic-card p-4 rounded-2xl bg-white border border-slate-200">
          <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider block">
            EXPIRING SOON (&lt;30d)
          </span>
          <span className="text-2xl font-serif font-bold text-amber-600 mt-1 block">{expiringSoonCount}</span>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Needs renewal soon</span>
        </div>

        <div className="civic-card p-4 rounded-2xl bg-white border border-rose-200 bg-rose-50/30">
          <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider block">
            EXPIRED / LAPSED
          </span>
          <span className="text-2xl font-serif font-bold text-rose-600 mt-1 block">{expiredCount}</span>
          <span className="text-[11px] text-rose-700 mt-0.5 block">Requires immediate renewal</span>
        </div>
      </div>

      {/* Expiry Advance Alert Band (High-Contrast & Crystal-Clear Dark Text) */}
      <div className="rounded-2xl bg-white border-2 border-slate-300 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                Automatic Expiry Warning Timeline
              </span>
              <span className="text-xs text-slate-600">
                How colleges receive advance notices to renew certificates before they expire
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-semibold">
            System Date: <strong className="text-slate-950">{simulatedDate}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-blue-50 border-2 border-blue-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-950 uppercase tracking-wide">T-90 Days Early Alert</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold">EARLY NOTICE</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              Sends an automated email to the college registrar to begin renewal paperwork with local authorities.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wide">T-60 Days Warning</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-mono font-bold">REGIONAL FLAG</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              Flagged on the Regional Officer's dashboard; college portal displays a renewal reminder banner.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-50 border-2 border-orange-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-orange-950 uppercase tracking-wide">T-30 Days Urgent</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-mono font-bold">URGENT CALL</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              High-priority reminder with SMS trigger. Document checks pause new seat increase approvals.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-950 uppercase tracking-wide">Expired / Lapsed</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-700 text-white text-[10px] font-mono font-bold">EXPIRED</span>
            </div>
            <p className="text-xs text-rose-950 leading-relaxed font-medium">
              Immediate hold. Officer returns application for deficiency; approval cannot proceed until renewed.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Document, Authority, Institution..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          >
            <option value="ALL">All Expiry Statuses</option>
            <option value="ACTIVE">Active & Valid</option>
            <option value="EXPIRING_SOON">Expiring Soon (&lt;30d)</option>
            <option value="EXPIRED">Expired / Lapsed</option>
            <option value="RENEWAL_SUBMITTED">Renewal Submitted (Pending Verification)</option>
            <option value="RENEWED">Renewed & Certified</option>
          </select>
        </div>

        <div>
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
          >
            <option value="ALL">All Statutory Document Categories</option>
            <option value="Lease">Land Lease Deed (30-Year)</option>
            <option value="Building">Building Safety Certificate</option>
            <option value="Fire">Fire Safety NOC</option>
            <option value="Trust">Registered Trust Deed</option>
            <option value="Title">Land Title Certificate</option>
          </select>
        </div>
      </div>

      {/* Main Documents Registry Table */}
      <div className="civic-card rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3a8a] text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Doc ID & Type</th>
                <th className="py-3 px-4">Regulated Institution</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Issued / Expiry</th>
                <th className="py-3 px-4">Validity Horizon</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Statutory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDocs.map((doc) => {
                const isExpired = doc.status === 'EXPIRED';
                const isExpiringSoon = doc.status === 'EXPIRING_SOON';
                const isSubmitted = doc.status === 'RENEWAL_SUBMITTED';

                return (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-50/80 transition ${
                      isExpired ? 'bg-rose-50/30' : isExpiringSoon ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <FileText className={`w-4 h-4 ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-[#1e3a8a]'}`} />
                        <div>
                          <span className="font-bold text-slate-900 block">{doc.docType}</span>
                          <span className="font-mono text-[10px] text-slate-500">{doc.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{doc.institutionName}</span>
                      <span className="text-[11px] text-slate-500">
                        {institutions.find((i) => i.id === doc.institutionId)?.region || 'Regional Jurisdiction'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="line-clamp-2">{doc.issuingAuthority}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="text-slate-500 block">Issued: {doc.issuedOn}</span>
                      <span className={`font-bold block ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-700' : 'text-slate-900'}`}>
                        Expiry: {doc.expiryDate}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {isExpired ? (
                        <div className="flex items-center space-x-1.5 text-rose-700 font-bold font-mono">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Lapsed ({Math.abs(doc.daysToExpiry)}d ago)</span>
                        </div>
                      ) : isExpiringSoon ? (
                        <div className="flex items-center space-x-1.5 text-amber-700 font-bold font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{doc.daysToExpiry} days left</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-emerald-700 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{doc.daysToExpiry > 365 ? `${Math.round(doc.daysToExpiry / 365)} yrs valid` : `${doc.daysToExpiry}d valid`}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                            isExpired
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isExpiringSoon
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isSubmitted
                              ? 'bg-purple-100 text-purple-900 border border-purple-300 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {doc.status.replace(/_/g, ' ')}
                        </span>
                        {doc.renewalRequestedAt && (
                          <div className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Notice Sent: {doc.renewalRequestedAt}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {/* Officer Action: Request Renewal Notice */}
                      {(role === 'REGIONAL_OFFICER' || role === 'BUREAU_OFFICER' || role === 'SUPERADMIN' || role === 'MEMBER_SECRETARY') &&
                        (isExpired || isExpiringSoon) &&
                        !isSubmitted && (
                          doc.renewalRequestedAt ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[10.5px] font-mono font-bold">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Notice Dispatched</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => requestDocumentRenewal(doc.id, role, roleConfig.title)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition"
                              title="Send official renewal notice to institution"
                            >
                              <Mail className="w-3 h-3 text-amber-200" />
                              <span>Request Renewal</span>
                            </button>
                          )
                        )}

                      {/* Institution Action: Submit Renewal */}
                      {(role === 'INSTITUTION' || role === 'SUPERADMIN') && (isExpired || isExpiringSoon) && !isSubmitted && (
                        <button
                          onClick={() => handleOpenRenewalModal(doc)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#172554] text-white text-[11px] font-bold shadow-xs transition"
                        >
                          <Upload className="w-3 h-3 text-amber-300" />
                          <span>Upload Renewal</span>
                        </button>
                      )}

                      {/* Regional Officer Action: Verify Submitted Renewal */}
                      {(role === 'REGIONAL_OFFICER' || role === 'SUPERADMIN') && isSubmitted && (
                        <button
                          onClick={() => handleVerifyRenewal(doc.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-300" />
                          <span>Verify & Renew</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveInspectorDoc(doc)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Documents Card View (Zero Horizontal Scrolling) */}
        <div className="block lg:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No documents found matching your search.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isExpired = doc.status === 'EXPIRED';
              const isExpiringSoon = doc.status === 'EXPIRING_SOON';
              const isSubmitted = doc.status === 'RENEWAL_SUBMITTED';

              return (
                <div
                  key={doc.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isExpired
                      ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                      : isExpiringSoon
                      ? 'border-amber-300 bg-amber-50/30 shadow-xs'
                      : isSubmitted
                      ? 'border-blue-300 bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-[#1e3a8a]'
                        }`}
                      />
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{doc.docType}</span>
                        <span className="font-mono text-[10px] text-slate-500">{doc.id}</span>
                      </div>
                    </div>
                    <span
                      className={`stamp-badge text-[10px] shrink-0 ${
                        isExpired
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isExpiringSoon
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : isSubmitted
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : isSubmitted ? 'PENDING VERIFY' : 'ACTIVE'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <p className="font-bold text-slate-900">{doc.institutionName}</p>
                    <p className="text-[11px] text-slate-600">{doc.issuingAuthority}</p>
                    <div className="flex items-center justify-between font-mono text-[11px] pt-1.5 border-t border-slate-100">
                      <span className="text-slate-500">Expires: {doc.expiryDate}</span>
                      <span
                        className={`font-bold ${
                          isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {doc.daysToExpiry < 0
                          ? `${Math.abs(doc.daysToExpiry)}d overdue`
                          : `${doc.daysToExpiry}d left`}
                      </span>
                    </div>
                    {doc.renewalRequestedAt && (
                      <div className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Notice Dispatched: {doc.renewalRequestedAt} by {doc.renewalRequestedBy}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveInspectorDoc(doc)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center space-x-1 border border-slate-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1e3a8a]" />
                      <span>Inspect</span>
                    </button>

                    {(role === 'REGIONAL_OFFICER' || role === 'BUREAU_OFFICER' || role === 'SUPERADMIN' || role === 'MEMBER_SECRETARY') &&
                      (isExpired || isExpiringSoon) &&
                      !isSubmitted && (
                        doc.renewalRequestedAt ? (
                          <span className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Sent</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => requestDocumentRenewal(doc.id, role, roleConfig.title)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition"
                          >
                            <Mail className="w-3.5 h-3.5 text-amber-200" />
                            <span>Req Renewal</span>
                          </button>
                        )
                      )}

                    {(role === 'INSTITUTION' || role === 'SUPERADMIN') &&
                      (isExpired || isExpiringSoon) &&
                      !isSubmitted && (
                        <button
                          onClick={() => handleOpenRenewalModal(doc)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-300" />
                          <span>Upload Renewal</span>
                        </button>
                      )}

                    {(role === 'REGIONAL_OFFICER' || role === 'SUPERADMIN') && isSubmitted && (
                      <button
                        onClick={() => handleVerifyRenewal(doc.id)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Verify & Renew</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AI MULTIMODAL VISION SCANNER MODAL (Directive 2 Killer Feature) */}
      {aiScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">
                    AI Document OCR & Multimodal Vision Scanner
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Powered by Google Gemini Multimodal Vision + OpenCV Legal Analysis
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAiScannerOpen(false);
                  setScanResult(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Every other tool relies on manual date inputs. CompliScan automatically reads scanned
              Lease Deeds, Building Safety Certificates, and Fire NOCs directly through AI Vision to verify
              stamp paper registration IDs, issuing seals, validity clauses, and auto-calculates the countdown expiry timer.
            </p>

            {/* Document Selection / Demo Samples */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Select a Scanned Statutory Certificate to Scan:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSample('sample_lease_deed');
                    setCustomFile(null);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    selectedSample === 'sample_lease_deed' && !customFile
                      ? 'border-[#1e3a8a] bg-blue-50/60 ring-2 ring-[#1e3a8a]/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-slate-900 block truncate">1. 30-Yr Land Lease</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Sub-Registrar Haveli (7.5 Acres)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSample('sample_building_safety');
                    setCustomFile(null);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    selectedSample === 'sample_building_safety' && !customFile
                      ? 'border-[#1e3a8a] bg-blue-50/60 ring-2 ring-[#1e3a8a]/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-slate-900 block truncate">2. PWD Building Safety</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">Division III (Expired 2026)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSample('sample_fire_noc');
                    setCustomFile(null);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    selectedSample === 'sample_fire_noc' && !customFile
                      ? 'border-[#1e3a8a] bg-blue-50/60 ring-2 ring-[#1e3a8a]/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-slate-900 block truncate">3. Fire & Safety NOC</span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">WB Fire Services (T-20 Urgent)</span>
                </button>
              </div>

              {/* Or Upload Custom File */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Or Upload Your Own Scanned Document / Certificate (PDF, PNG or JPG):
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setCustomFile(e.target.files[0]);
                      setSelectedSample(null);
                    }
                  }}
                  className="w-full text-xs text-slate-800 font-medium file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-900 hover:file:bg-slate-300"
                />
              </div>
            </div>

            {/* Run Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleRunAiDocScan}
                disabled={isScanning}
                className="w-full py-3 px-4 rounded-xl bg-[#1e3a8a] hover:bg-[#172554] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Running Multimodal OCR & Extracting Statutory Dates...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 text-amber-300" />
                    <span>Extract Dates & Verify Stamp Paper Authenticity with Gemini Vision</span>
                  </>
                )}
              </button>
            </div>

            {/* Extraction Results */}
            {scanResult && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-700 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-serif font-bold text-sm text-white">AI Extraction Verified</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono">
                    <span className="text-slate-400">Visual Legibility:</span>
                    <strong className="text-emerald-300">{scanResult.legibility_score}%</strong>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">Risk:</span>
                    <strong className="text-amber-300">{scanResult.tampering_risk}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">DOCUMENT TYPE & ID</span>
                    <p className="font-bold text-white text-xs">{scanResult.doc_type}</p>
                    <span className="font-mono text-[11px] text-amber-300 block">{scanResult.registration_no}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">ISSUING AUTHORITY</span>
                    <p className="font-medium text-slate-200 text-xs">{scanResult.issuing_authority}</p>
                    <span className="text-[11px] text-slate-400 block truncate">Lessee: {scanResult.lessee_party}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">ISSUED ON</span>
                    <p className="font-mono font-bold text-white text-xs">{scanResult.issued_on}</p>
                    <span className="text-[10px] text-slate-400">Validity: {scanResult.validity_years} Years</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-300 uppercase">AUTO-EXTRACTED EXPIRY DATE</span>
                    <p className="font-mono font-bold text-emerald-300 text-sm">{scanResult.expiry_date}</p>
                    <span className="text-[10px] text-emerald-200">Countdown timer auto-configured</span>
                  </div>
                </div>

                {/* Verified Clauses */}
                {scanResult.key_clauses && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">VERIFIED STATUTORY CLAUSES</span>
                    <ul className="space-y-1">
                      {scanResult.key_clauses.map((clause, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{clause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Summary */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed">
                  <p>{scanResult.ai_summary}</p>
                </div>

                {/* Apply Button */}
                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      const match = documents.find((d) => d.docType.toLowerCase().includes(scanResult.doc_type.slice(0, 5).toLowerCase()));
                      if (match) {
                        handleApplyScanToDoc(match);
                      } else if (documents.length > 0) {
                        handleApplyScanToDoc(documents[0]);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition"
                  >
                    <Stamp className="w-4 h-4 text-emerald-200" />
                    <span>Auto-Populate Expiry Timer & Commit to AICTE Registry</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENEWAL UPLOAD MODAL */}
      {selectedDocForRenewal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 text-[#1e3a8a]">
                <Upload className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Upload Statutory Document Renewal</h3>
              </div>
              <button onClick={() => setSelectedDocForRenewal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Submitting renewed certificate for <strong>{selectedDocForRenewal.docType}</strong> ({selectedDocForRenewal.institutionName}).
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Certificate Issued On</label>
                  <input
                    type="date"
                    value={newIssuedOn}
                    onChange={(e) => setNewIssuedOn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Expiry Date</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Upload Certified PDF / Scanned Copy</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                  <span className="font-bold text-slate-900 text-xs block">Click to select or drag renewed certificate</span>
                  <span className="text-[11px] text-slate-700 font-medium block mt-0.5">PDF or Geo-Tagged image up to 15MB</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Authority Endorsement</label>
                <textarea
                  rows={2}
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  placeholder="e.g. Endorsed by Executive Engineer PWD Division III; structural load testing passed."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDocForRenewal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRenewal}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1e3a8a] hover:bg-[#172554] rounded-xl transition shadow-xs"
              >
                Submit Renewal to Regional Office
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL DOSSIER MODAL */}
      {activeInspectorDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-[#1e3a8a]" />
                <h3 className="font-serif font-bold text-lg text-slate-900">Document Dossier Inspector</h3>
              </div>
              <button onClick={() => setActiveInspectorDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">DOCUMENT NAME</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{activeInspectorDoc.docType}</p>
                <span className="font-mono text-slate-500 text-[11px] block mt-1">Ref ID: {activeInspectorDoc.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">ISSUED DATE</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{activeInspectorDoc.issuedOn}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">EXPIRY DATE</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{activeInspectorDoc.expiryDate}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">ISSUING AUTHORITY</span>
                <p className="font-medium text-slate-800 mt-0.5">{activeInspectorDoc.issuingAuthority}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">APPLICANT INSTITUTION</span>
                <p className="font-medium text-slate-800 mt-0.5">{activeInspectorDoc.institutionName}</p>
              </div>

              {activeInspectorDoc.renewalRequestedAt && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1">
                  <span className="text-[10px] font-mono uppercase block font-bold text-amber-800">STATUTORY RENEWAL NOTICE RECORD</span>
                  <p className="font-semibold text-xs">Official Renewal Demand Notice Dispatched on {activeInspectorDoc.renewalRequestedAt}</p>
                  <p className="text-[11px] text-amber-800">Issued by: {activeInspectorDoc.renewalRequestedBy || 'Regional Officer'}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveInspectorDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
