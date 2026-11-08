//seed data

//dynamic date helper functions
export const getTodayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDaysToIso = (isoStr, days) => {
  if (!isoStr) return getTodayIso();
  const parts = isoStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);
  const resY = date.getFullYear();
  const resM = String(date.getMonth() + 1).padStart(2, '0');
  const resD = String(date.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
};
export const initialInstitutions = [
  {
    id: 'inst_sunrise',
    name: 'Sunrise Institute of Technology',
    aisheCode: 'C-41208',
    region: 'Western Regional Office',
    state: 'Maharashtra',
    district: 'Pune',
    type: 'Engineering & Technology',
    establishedYear: 2008,
    complianceScore: 94,
    riskFlag: 'LOW',
    status: 'ACTIVE',
    intakeCapacity: 720
  },
  {
    id: 'inst_delhi_poly',
    name: 'Delhi Institute of Polytechnic & Technology',
    aisheCode: 'C-10921',
    region: 'Northern Regional Office',
    state: 'Delhi',
    district: 'New Delhi',
    type: 'Applied Arts & Crafts',
    establishedYear: 2014,
    complianceScore: 82,
    riskFlag: 'MEDIUM',
    status: 'ACTIVE',
    intakeCapacity: 480
  },
  {
    id: 'inst_bengaluru_mgmt',
    name: 'Silicon Valley School of Management',
    aisheCode: 'C-33890',
    region: 'South-Western Regional Office',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    type: 'Management',
    establishedYear: 2011,
    complianceScore: 78,
    riskFlag: 'HIGH',
    status: 'UNDER_REVIEW',
    intakeCapacity: 300
  },
  {
    id: 'inst_hyderabad_tech',
    name: 'Deccan Institute of Engineering & Research',
    aisheCode: 'C-22104',
    region: 'South-Central Regional Office',
    state: 'Telangana',
    district: 'Hyderabad',
    type: 'Engineering & Technology',
    establishedYear: 2004,
    complianceScore: 96,
    riskFlag: 'LOW',
    status: 'ACTIVE',
    intakeCapacity: 960
  },
  {
    id: 'inst_kolkata_pharm',
    name: 'Bengal College of Pharmacy & Allied Sciences',
    aisheCode: 'C-19402',
    region: 'Eastern Regional Office',
    state: 'West Bengal',
    district: 'Kolkata',
    type: 'Pharmacy',
    establishedYear: 2016,
    complianceScore: 71,
    riskFlag: 'HIGH',
    status: 'UNDER_REVIEW',
    intakeCapacity: 240
  },
  {
    id: 'inst_chennai_auto',
    name: 'Madras Academy of Automobile Engineering',
    aisheCode: 'C-50123',
    region: 'Southern Regional Office',
    state: 'Tamil Nadu',
    district: 'Chennai',
    type: 'Engineering & Technology',
    establishedYear: 2006,
    complianceScore: 91,
    riskFlag: 'LOW',
    status: 'ACTIVE',
    intakeCapacity: 600
  },
  {
    id: 'inst_bhopal_tech',
    name: 'Central India Institute of Science & Technology',
    aisheCode: 'C-38411',
    region: 'Central Regional Office',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    type: 'Engineering & Technology',
    establishedYear: 2012,
    complianceScore: 88,
    riskFlag: 'LOW',
    status: 'ACTIVE',
    intakeCapacity: 540
  },
  {
    id: 'inst_chandigarh_arch',
    name: 'North-Western School of Architecture & Planning',
    aisheCode: 'C-12903',
    region: 'North-Western Regional Office',
    state: 'Punjab',
    district: 'Mohali',
    type: 'Architecture & Planning',
    establishedYear: 2015,
    complianceScore: 84,
    riskFlag: 'MEDIUM',
    status: 'ACTIVE',
    intakeCapacity: 180
  },
  {
    id: 'inst_guwahati_tech',
    name: 'Brahmaputra Engineering College',
    aisheCode: 'C-61099',
    region: 'Eastern Regional Office',
    state: 'Assam',
    district: 'Guwahati',
    type: 'Engineering & Technology',
    establishedYear: 2018,
    complianceScore: 89,
    riskFlag: 'LOW',
    status: 'ACTIVE',
    intakeCapacity: 360
  },
  {
    id: 'inst_mumbai_mgmt',
    name: 'Gateway Institute of Management Studies',
    aisheCode: 'C-44120',
    region: 'Western Regional Office',
    state: 'Maharashtra',
    district: 'Mumbai',
    type: 'Management',
    establishedYear: 2001,
    complianceScore: 98,
    riskFlag: 'LOW',
    status: 'ACTIVE',
    intakeCapacity: 420
  },
  {
    id: 'inst_lucknow_poly',
    name: 'Awadh Polytechnic Institute',
    aisheCode: 'C-15201',
    region: 'Northern Regional Office',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    type: 'Polytechnic',
    establishedYear: 2013,
    complianceScore: 66,
    riskFlag: 'HIGH',
    status: 'SUSPENDED',
    intakeCapacity: 300
  },
  {
    id: 'inst_kochi_maritime',
    name: 'Malabar Maritime Engineering College',
    aisheCode: 'C-55891',
    region: 'South-Western Regional Office',
    state: 'Kerala',
    district: 'Ernakulam',
    type: 'Engineering & Technology',
    establishedYear: 2009,
    complianceScore: 92,
    riskFlag: 'LOW',
    status: 'ACTIVE',
    intakeCapacity: 360
  }
];

export const createInitialApplications = (baseDate = getTodayIso()) => [
  {
    id: 'app_101',
    refNo: 'APH-2026-1041',
    institutionId: 'inst_sunrise',
    institutionName: 'Sunrise Institute of Technology',
    region: 'Western Regional Office',
    state: 'Maharashtra',
    district: 'Pune',
    institutionType: 'Engineering & Technology',
    appType: 'NEW_COURSE_OR_INTAKE',
    route: 'SCRUTINY_EVC',
    currentStage: 'SCRUTINY',
    status: 'IN_PROGRESS',
    assignedOfficer: 'RO-WEST-041',
    createdAt: addDaysToIso(baseDate, -10),
    stageEnteredAt: addDaysToIso(baseDate, -10),
    daysInStage: 10,
    isBreached: false,
    resubmissionCount: 0,
    decision: null,
    courseDetails: 'Addition of B.Tech in Artificial Intelligence & Machine Learning (60 Seats)'
  },
  {
    id: 'app_102',
    refNo: 'APH-2026-1042',
    institutionId: 'inst_delhi_poly',
    institutionName: 'Delhi Institute of Polytechnic & Technology',
    region: 'Northern Regional Office',
    state: 'Delhi',
    district: 'New Delhi',
    institutionType: 'Polytechnic',
    appType: 'EXTENSION_OF_APPROVAL',
    route: 'ONLY_SCRUTINY',
    currentStage: 'REVERTED',
    status: 'REVERTED',
    assignedOfficer: 'RO-NORTH-018',
    createdAt: addDaysToIso(baseDate, -26),
    stageEnteredAt: addDaysToIso(baseDate, -14),
    daysInStage: 14,
    isBreached: false,
    resubmissionCount: 1,
    deficiencyReason: 'Land Lease Deed / Building Safety NOC Discrepancy',
    deficiencyNote: 'Building safety certificate expired. Certified renewal by Competent PWD Authority required.',
    decision: null,
    courseDetails: 'Extension of Approval (EoA) for Academic Year 2026–27'
  },
  {
    id: 'app_103',
    refNo: 'APH-2026-1043',
    institutionId: 'inst_bengaluru_mgmt',
    institutionName: 'Silicon Valley School of Management',
    region: 'South-Western Regional Office',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    institutionType: 'Management',
    appType: 'NEW_INSTITUTION',
    route: 'SCRUTINY_EVC_SAC',
    currentStage: 'EVC_QUEUE',
    status: 'IN_PROGRESS',
    assignedOfficer: 'RO-SW-088',
    createdAt: addDaysToIso(baseDate, -46),
    stageEnteredAt: addDaysToIso(baseDate, -23),
    daysInStage: 23,
    isBreached: true,
    resubmissionCount: 0,
    decision: null,
    courseDetails: 'New Standalone PGDM Institute with 180 Intake Capacity'
  },
  {
    id: 'app_104',
    refNo: 'APH-2026-1044',
    institutionId: 'inst_hyderabad_tech',
    institutionName: 'Deccan Institute of Engineering & Research',
    region: 'South-Central Regional Office',
    state: 'Telangana',
    district: 'Hyderabad',
    institutionType: 'Engineering & Technology',
    appType: 'NEW_COURSE_OR_INTAKE',
    route: 'SCRUTINY_EVC',
    currentStage: 'EVC_SCHEDULED',
    status: 'IN_PROGRESS',
    assignedOfficer: 'RO-SC-012',
    createdAt: addDaysToIso(baseDate, -38),
    stageEnteredAt: addDaysToIso(baseDate, -12),
    daysInStage: 12,
    isBreached: false,
    resubmissionCount: 0,
    decision: null,
    courseDetails: 'Establishment of Industry Center of Excellence in Semiconductor Packaging'
  },
  {
    id: 'app_105',
    refNo: 'APH-2026-1045',
    institutionId: 'inst_kolkata_pharm',
    institutionName: 'Bengal College of Pharmacy & Allied Sciences',
    region: 'Eastern Regional Office',
    state: 'West Bengal',
    district: 'Kolkata',
    institutionType: 'Pharmacy',
    appType: 'NEW_INSTITUTION',
    route: 'SCRUTINY_EVC_SAC',
    currentStage: 'SCRUTINY',
    status: 'IN_PROGRESS',
    assignedOfficer: 'RO-EAST-004',
    createdAt: addDaysToIso(baseDate, -52),
    stageEnteredAt: addDaysToIso(baseDate, -33),
    daysInStage: 33,
    isBreached: true,
    resubmissionCount: 0,
    decision: null,
    courseDetails: 'New Degree & Diploma Pharmacy College'
  },
  {
    id: 'app_106',
    refNo: 'APH-2026-1046',
    institutionId: 'inst_chennai_auto',
    institutionName: 'Madras Academy of Automobile Engineering',
    region: 'Southern Regional Office',
    state: 'Tamil Nadu',
    district: 'Chennai',
    institutionType: 'Engineering & Technology',
    appType: 'CLOSURE_OR_MERGER',
    route: 'EVC_SAC',
    currentStage: 'SAC_REVIEW',
    status: 'IN_PROGRESS',
    assignedOfficer: 'HQ-DIR-APPR-01',
    createdAt: addDaysToIso(baseDate, -20),
    stageEnteredAt: addDaysToIso(baseDate, -18),
    daysInStage: 18,
    isBreached: false,
    resubmissionCount: 0,
    decision: null,
    courseDetails: 'Progressive Closure of Diploma in Mechanical Engineering'
  },
  {
    id: 'app_107',
    refNo: 'APH-2026-1047',
    institutionId: 'inst_bhopal_tech',
    institutionName: 'Central India Institute of Science & Technology',
    region: 'Central Regional Office',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    institutionType: 'Engineering & Technology',
    appType: 'EXTENSION_OF_APPROVAL',
    route: 'ONLY_SCRUTINY',
    currentStage: 'CLOSED',
    status: 'APPROVED',
    assignedOfficer: 'RO-CENTRAL-09',
    createdAt: addDaysToIso(baseDate, -74),
    stageEnteredAt: addDaysToIso(baseDate, -60),
    daysInStage: 0,
    isBreached: false,
    resubmissionCount: 0,
    closedAt: addDaysToIso(baseDate, -57),
    decision: 'APPROVED',
    courseDetails: 'Annual EoA for all 6 Undergraduate Engineering Branches'
  },
  {
    id: 'app_108',
    refNo: 'APH-2026-1048',
    institutionId: 'inst_chandigarh_arch',
    institutionName: 'North-Western School of Architecture & Planning',
    region: 'North-Western Regional Office',
    state: 'Punjab',
    district: 'Mohali',
    institutionType: 'Architecture & Planning',
    appType: 'NEW_COURSE_OR_INTAKE',
    route: 'SCRUTINY_EVC',
    currentStage: 'CLOSED',
    status: 'CONDITIONAL',
    assignedOfficer: 'RO-NW-022',
    createdAt: addDaysToIso(baseDate, -100),
    stageEnteredAt: addDaysToIso(baseDate, -75),
    daysInStage: 0,
    isBreached: false,
    resubmissionCount: 0,
    closedAt: addDaysToIso(baseDate, -70),
    decision: 'CONDITIONAL',
    courseDetails: 'B.Arch 120 Seats Approved subject to 90-day CAD Lab Undertaking'
  }
];

export const initialApplications = createInitialApplications();


export const createInitialEvcVisits = (baseDate = getTodayIso()) => [
  {
    id: 'EVC-8801',
    applicationId: 'app_104',
    refNo: 'APH-2026-1044',
    institutionName: 'Deccan Institute of Engineering & Research',
    region: 'South-Central Regional Office',
    status: 'SCHEDULED',
    urgencyWindowDays: 30,
    daysWaiting: 12,
    deadline: addDaysToIso(baseDate, 18),
    convener: 'Prof. K. Ramanathan (IIT Hyderabad)',
    members: ['Dr. Meera Swaminathan (NIT Warangal)', 'Shri V. Rao (RO-SC Representative)'],
    scheduledDate: addDaysToIso(baseDate, 7),
    mode: 'PHYSICAL',
    observations: null,
    reportUrl: null
  },
  {
    id: 'EVC-8802',
    applicationId: 'app_103',
    refNo: 'APH-2026-1043',
    institutionName: 'Silicon Valley School of Management',
    region: 'South-Western Regional Office',
    status: 'QUEUED',
    urgencyWindowDays: 21,
    daysWaiting: 23,
    deadline: addDaysToIso(baseDate, -2),
    convener: null,
    members: [],
    scheduledDate: null,
    mode: 'PHYSICAL',
    observations: null,
    reportUrl: null
  },
  {
    id: 'EVC-8803',
    applicationId: 'app_106',
    refNo: 'APH-2026-1046',
    institutionName: 'Madras Academy of Automobile Engineering',
    region: 'Southern Regional Office',
    status: 'COMPLETED',
    urgencyWindowDays: 30,
    daysWaiting: 0,
    deadline: addDaysToIso(baseDate, -18),
    convener: 'Dr. S. Sundaram (Anna University)',
    members: ['Prof. L. Natarajan', 'Shri R. Krishnan (RO-S Representative)'],
    scheduledDate: addDaysToIso(baseDate, -20),
    mode: 'HYBRID',
    observations: 'Physical infrastructure audit verified progressive reduction in student strength. Equipment disposal plan conforms to AICTE guidelines. No pending student liabilities.',
    reportUrl: '/reports/EVC_Final_Report_APH1046.pdf',
    completedAt: addDaysToIso(baseDate, -19)
  }
];

export const initialEvcVisits = createInitialEvcVisits();


export const createInitialUndertakings = (baseDate = getTodayIso()) => [
  {
    id: 'UT-2026-085',
    applicationId: 'app_101',
    refNo: 'APH-2026-1041',
    institutionId: 'inst_sunrise',
    institutionName: 'Sunrise Institute of Technology',
    region: 'Western Regional Office',
    conditionTitle: 'Ph.D. Faculty & GPU AI Lab Setup',
    conditionText: 'Recruitment of 3 Ph.D. Faculty Members in AI & Data Science and setup of GPU AI Computing Lab (30 Workstations) within 90 days.',
    evidenceRequired: 'Faculty appointment letters, joining reports, and hardware tax invoices with geo-tagged lab photos.',
    imposedAt: addDaysToIso(baseDate, -10),
    dueDate: addDaysToIso(baseDate, 51),
    daysRemaining: 51,
    status: 'OPEN',
    escalationLevel: 1,
    evidenceUrl: null,
    evidenceNote: null,
    evidenceUploadedAt: null,
    evidenceUploadedBy: null,
    verifiedAt: null,
    verifiedBy: null,
    verificationResult: 'Awaiting Proof Upload from College'
  },
  {
    id: 'UT-2026-081',
    applicationId: 'app_108',
    refNo: 'APH-2026-1048',
    institutionName: 'North-Western School of Architecture & Planning',
    region: 'North-Western Regional Office',
    conditionTitle: 'Faculty Cadre & Licensed BIM Lab',
    conditionText: 'Recruitment of 2 Qualified Associate Professors (Ph.D.) and procurement of 40 Licensed BIM/CAD Workstations within 90 days.',
    evidenceRequired: 'Board of Governors Appointment Letters, P.F. Registration proof, and Equipment Invoices with Geo-Tagged Lab Photos.',
    imposedAt: addDaysToIso(baseDate, -57),
    dueDate: addDaysToIso(baseDate, 33),
    daysRemaining: 33,
    status: 'OPEN',
    escalationLevel: 1,
    evidenceUrl: null,
    evidenceNote: null,
    evidenceUploadedAt: null,
    evidenceUploadedBy: null,
    verifiedAt: null,
    verifiedBy: null,
    verificationResult: 'Awaiting Proof Upload from College'
  },
  {
    id: 'UT-2026-079',
    applicationId: 'app_105',
    refNo: 'APH-2026-1045',
    institutionName: 'Bengal College of Pharmacy & Allied Sciences',
    region: 'Eastern Regional Office',
    conditionTitle: 'CPCSEA Animal House & Fire NOC',
    conditionText: 'Rectification of Central Animal House air-handling unit (AHU) as per CPCSEA norms and submission of Fire NOC renewal.',
    evidenceRequired: 'HVAC Calibration Certificate and Divisional Fire Officer Clearance Certificate.',
    imposedAt: addDaysToIso(baseDate, -103),
    dueDate: addDaysToIso(baseDate, -13),
    daysRemaining: -13,
    status: 'ESCALATED',
    escalationLevel: 3,
    evidenceUrl: null,
    evidenceNote: null,
    evidenceUploadedAt: null,
    evidenceUploadedBy: null,
    verifiedAt: null,
    verifiedBy: null,
    verificationResult: 'Overdue Breach (Escalated to Bureau Officer)'
  },
  {
    id: 'UT-2026-072',
    applicationId: 'app_107',
    refNo: 'APH-2026-1047',
    institutionName: 'Central India Institute of Science & Technology',
    region: 'Central Regional Office',
    conditionTitle: 'STP Plant 50 KLD & MPPCB Clearance',
    conditionText: 'Installation of Sewage Treatment Plant (STP) of 50 KLD capacity with State Pollution Control Board clearance.',
    evidenceRequired: 'Consent to Operate (CTO) from MPPCB and commissioning report with geo-tagged images.',
    imposedAt: addDaysToIso(baseDate, -140),
    dueDate: addDaysToIso(baseDate, -48),
    daysRemaining: 0,
    status: 'VERIFIED',
    escalationLevel: 1,
    evidenceUrl: '/evidence/MPPCB_CTO_Certificate_STP.pdf',
    evidenceNote: 'Uploaded copy of valid MPPCB consent order valid till 2031 along with engineer commissioning certificate.',
    evidenceUploadedAt: addDaysToIso(baseDate, -53),
    evidenceUploadedBy: 'Registrar, Central India Institute',
    verifiedAt: addDaysToIso(baseDate, -50),
    verifiedBy: 'RO-CENTRAL-09 (Regional Officer)',
    verificationResult: 'VERIFIED & FULFILLED'
  }
];

export const initialUndertakings = createInitialUndertakings();


export const createInitialDocuments = (baseDate = getTodayIso()) => [
  {
    id: 'DOC-901',
    institutionId: 'inst_sunrise',
    institutionName: 'Sunrise Institute of Technology',
    docType: 'Land Lease Deed (30-Year Registered)',
    issuingAuthority: 'Sub-Registrar Haveli, Pune',
    issuedOn: addDaysToIso(baseDate, -6770),
    expiryDate: addDaysToIso(baseDate, 4180),
    renewalLeadDays: 90,
    daysToExpiry: 4180,
    status: 'ACTIVE',
    fileUrl: '/docs/Sunrise_Tech_Lease_Deed_Registered.pdf'
  },
  {
    id: 'DOC-902',
    institutionId: 'inst_delhi_poly',
    institutionName: 'Delhi Institute of Polytechnic & Technology',
    docType: 'Building Safety Certificate',
    issuingAuthority: 'PWD Executive Engineer, Division III Delhi',
    issuedOn: addDaysToIso(baseDate, -1128),
    expiryDate: addDaysToIso(baseDate, -28),
    renewalLeadDays: 60,
    daysToExpiry: -28,
    status: 'EXPIRED',
    renewalRequestedAt: addDaysToIso(baseDate, -8),
    renewalRequestedBy: 'RO-North (UP/Delhi)',
    fileUrl: '/docs/Delhi_Poly_Building_Safety_2023.pdf'
  },
  {
    id: 'DOC-903',
    institutionId: 'inst_kolkata_pharm',
    institutionName: 'Bengal College of Pharmacy & Allied Sciences',
    docType: 'Fire Safety NOC',
    issuingAuthority: 'West Bengal Fire & Emergency Services',
    issuedOn: addDaysToIso(baseDate, -345),
    expiryDate: addDaysToIso(baseDate, 20),
    renewalLeadDays: 30,
    daysToExpiry: 20,
    status: 'EXPIRING_SOON',
    fileUrl: '/docs/WB_Fire_NOC_Bengal_Pharmacy.pdf'
  },
  {
    id: 'DOC-904',
    institutionId: 'inst_bengaluru_mgmt',
    institutionName: 'Silicon Valley School of Management',
    docType: 'Registered Educational Trust Deed',
    issuingAuthority: 'Registrar of Societies & Trusts, Karnataka',
    issuedOn: addDaysToIso(baseDate, -6100),
    expiryDate: addDaysToIso(baseDate, 1200),
    renewalLeadDays: 90,
    daysToExpiry: 1200,
    status: 'ACTIVE',
    fileUrl: '/docs/SV_Trust_Registration_Deed.pdf'
  },
  {
    id: 'DOC-905',
    institutionId: 'inst_lucknow_poly',
    institutionName: 'Awadh Polytechnic Institute',
    docType: 'Land Title & Ownership Certificate',
    issuingAuthority: 'District Magistrate Lucknow',
    issuedOn: addDaysToIso(baseDate, -5280),
    expiryDate: addDaysToIso(baseDate, -18),
    renewalLeadDays: 60,
    daysToExpiry: -18,
    status: 'EXPIRED',
    fileUrl: '/docs/Awadh_Land_Title_Certificate.pdf'
  },
  {
    id: 'DOC-906',
    institutionId: 'inst_sunrise',
    institutionName: 'Sunrise Institute of Technology',
    docType: 'Building Safety Certificate & Fire NOC',
    issuingAuthority: 'Chief Fire Officer & PWD Pune Division',
    issuedOn: addDaysToIso(baseDate, -348),
    expiryDate: addDaysToIso(baseDate, 17),
    renewalLeadDays: 45,
    daysToExpiry: 17,
    status: 'EXPIRING_SOON',
    fileUrl: '/docs/Sunrise_Tech_Fire_NOC_2023.pdf'
  }
];

export const initialDocuments = createInitialDocuments();


export const initialConfig = {
  rule_version: 'APH-2024-2027-v1.0',
  provenance: {
    data_status: 'synthetic_demo_data',
    source: 'prototype_seed_data',
    human_review_required: true,
  },
  protected: true,
  simulated_day_offset: 0,
  stage_sla_days: {
    SCRUTINY: 15,
    RE_SCRUTINY: 10,
    EVC_QUEUE_STANDARD: 30,
    EVC_QUEUE_NEW_INSTITUTION: 21,
    EVC_SCHEDULED: 14,
    EVC_DONE: 7,
    SAC_REVIEW: 30,
    DECISION: 7,
    SUBMITTED: 3,
    scrutiny: 15,
    re_scrutiny: 10,
    evc_queue: 30,
    evc_new_institution: 21,
    evc_scheduled: 14,
    evc_done: 7,
    sac_review: 30,
    decision: 7,
    submitted: 3
  },
  routes: {
    ONLY_SCRUTINY: ['SUBMITTED', 'SCRUTINY', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
    SCRUTINY_EVC: ['SUBMITTED', 'SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
    EVC_SAC: ['SUBMITTED', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'SAC_REVIEW', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
    ONLY_EVC: ['SUBMITTED', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
    SCRUTINY_EVC_SAC: ['SUBMITTED', 'SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'SAC_REVIEW', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED']
  },
  doc_expiry_alerts_days: [90, 60, 30, 7],
  undertaking_due_days: 90,
  escalation_ladder: [
    { days_from_due: -7, days: -7, level: 1, target_role: 'INSTITUTION', target: 'INSTITUTION', severity: 'info', action: 'ADVANCE_REMINDER' },
    { days_from_due: 0, days: 0, level: 2, target_role: 'REGIONAL_OFFICER', target: 'REGIONAL_OFFICER', severity: 'warning', action: 'SLA_DUE_ALERT' },
    { days_from_due: 7, days: 7, level: 3, target_role: 'BUREAU_OFFICER', target: 'BUREAU_OFFICER', severity: 'critical', action: 'BUREAU_ESCALATION' },
    { days_from_due: 15, days: 15, level: 4, target_role: 'MEMBER_SECRETARY', target: 'MEMBER_SECRETARY', severity: 'critical', action: 'DG_SHOW_CAUSE_FLAG' }
  ]
};

export const createInitialAuditLog = (baseDate = getTodayIso()) => [
  {
    id: 'EVT-900812',
    timestamp: `${baseDate}T10:15:00+05:30`,
    simulatedDate: baseDate,
    actorRole: 'BUREAU_OFFICER',
    actorName: 'Director, AICTE Approval Bureau',
    action: 'ESCALATION_L3_REVIEWED',
    refId: 'UT-2026-079',
    refType: 'UNDERTAKING',
    note: 'Reviewed 13-day overdue animal house CPCSEA undertaking for Bengal College of Pharmacy. Docket marked for Standing Appellate Committee.'
  },
  {
    id: 'EVT-900811',
    timestamp: `${baseDate}T09:30:00+05:30`,
    simulatedDate: baseDate,
    actorRole: 'REGIONAL_OFFICER',
    actorName: 'RO–West, Western Regional Office',
    action: 'SCRUTINY_CHECKLIST_VERIFIED',
    refId: 'APH-2026-1041',
    refType: 'APPLICATION',
    fromStage: 'SCRUTINY',
    toStage: 'SCRUTINY',
    note: 'Verified faculty cadre ratio (1:15) and AI/ML lab floor plan for Sunrise Institute of Technology. All parameters compliant.'
  },
  {
    id: 'EVT-900810',
    timestamp: `${addDaysToIso(baseDate, -1)}T16:45:00+05:30`,
    simulatedDate: addDaysToIso(baseDate, -1),
    actorRole: 'COMMITTEE',
    actorName: 'Prof. K. Ramanathan, EVC Convener',
    action: 'EVC_DATE_CONFIRMED',
    refId: 'APH-2026-1044',
    refType: 'EVC_VISIT',
    fromStage: 'EVC_QUEUE',
    toStage: 'EVC_SCHEDULED',
    note: 'Inspection committee visit confirmed for Deccan Institute of Engineering. Modality: Physical.'
  },
  {
    id: 'EVT-900809',
    timestamp: `${addDaysToIso(baseDate, -14)}T11:20:00+05:30`,
    simulatedDate: addDaysToIso(baseDate, -14),
    actorRole: 'REGIONAL_OFFICER',
    actorName: 'RO-North, Northern Regional Office',
    action: 'REVERTED_FOR_DEFICIENCY',
    refId: 'APH-2026-1042',
    refType: 'APPLICATION',
    fromStage: 'SCRUTINY',
    toStage: 'REVERTED',
    reason: 'Building Safety Certificate Expired',
    note: 'Returned for deficiency: PWD structural stability certificate expired. Awaiting resubmission.'
  }
];

export const initialAuditLog = createInitialAuditLog();


export const createInitialNotifications = (baseDate = getTodayIso()) => [
  {
    id: 'NOTIF-101',
    type: 'ESCALATION',
    severity: 'critical',
    audienceRole: 'BUREAU_OFFICER',
    refType: 'UNDERTAKING',
    refId: 'UT-2026-079',
    message: 'L3 Bureau Escalation: Bengal College of Pharmacy has exceeded the 90-day undertaking deadline by 13 days without submitting CPCSEA clearance.',
    createdAt: baseDate,
    acknowledged: false
  },
  {
    id: 'NOTIF-102',
    type: 'SCRUTINY_QUEUE',
    severity: 'info',
    audienceRole: 'REGIONAL_OFFICER',
    region: 'Western Regional Office',
    refType: 'APPLICATION',
    refId: 'APH-2026-1041',
    message: 'Western RO Review Queue: Sunrise Institute of Technology (APH-2026-1041) completed scrutiny; ready for EVC inspection recommendation.',
    createdAt: baseDate,
    acknowledged: false
  },
  {
    id: 'NOTIF-103',
    type: 'DOC_EXPIRY',
    severity: 'warning',
    audienceRole: 'REGIONAL_OFFICER',
    region: 'Western Regional Office',
    refType: 'DOCUMENT',
    refId: 'DOC-906',
    message: 'Western RO Alert: Building Safety & Fire NOC for Sunrise Institute of Technology expires in 17 days. Renewal notice recommended.',
    createdAt: baseDate,
    acknowledged: false
  },
  {
    id: 'NOTIF-104',
    type: 'EVC_DUE',
    severity: 'critical',
    audienceRole: 'COMMITTEE',
    refType: 'EVC_VISIT',
    refId: 'EVC-8802',
    message: 'Urgent Scheduling Required: New Institution application APH-2026-1043 is pending EVC scheduling for 23 days (exceeding 21-day statutory window).',
    createdAt: addDaysToIso(baseDate, -1),
    acknowledged: false
  },
  {
    id: 'NOTIF-105',
    type: 'DOC_EXPIRY',
    severity: 'warning',
    audienceRole: 'INSTITUTION',
    institutionId: 'inst_sunrise',
    refType: 'DOCUMENT',
    refId: 'DOC-906',
    message: 'Statutory Renewal Notice: Your Building Safety Certificate & Fire NOC expires soon (17 days remaining). Please upload certified copy.',
    createdAt: baseDate,
    acknowledged: false
  },
  {
    id: 'NOTIF-106',
    type: 'UNDERTAKING_REMINDER',
    severity: 'info',
    audienceRole: 'INSTITUTION',
    institutionId: 'inst_sunrise',
    refType: 'UNDERTAKING',
    refId: 'UT-2026-085',
    message: 'Undertaking Compliance: 51 days remaining to submit appointment letters for 3 Ph.D. Faculty & GPU AI lab purchase invoices.',
    createdAt: baseDate,
    acknowledged: false
  }
];

export const initialNotifications = createInitialNotifications();

