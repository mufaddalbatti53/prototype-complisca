import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialInstitutions, initialApplications, initialEvcVisits, initialUndertakings, initialDocuments, initialConfig, initialAuditLog, initialNotifications } from './aicteSeedData';

const AicteContext = createContext(null);

export function AicteProvider({ children }) {
  // 1. Simulated System Date (Time-Machine Engine)
  const [simulatedDate, setSimulatedDate] = useState(() => {
    return localStorage.getItem('compliscan_sim_date') || '2026-10-28';
  });

  // 2. Core Entities State (Persisted in localStorage with seed defaults)
  const [institutions, setInstitutions] = useState(() => {
    const saved = localStorage.getItem('compliscan_institutions');
    return saved ? JSON.parse(saved) : initialInstitutions;
  });

  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('compliscan_applications');
    return saved ? JSON.parse(saved) : initialApplications;
  });

  const [evcVisits, setEvcVisits] = useState(() => {
    const saved = localStorage.getItem('compliscan_evc_visits');
    return saved ? JSON.parse(saved) : initialEvcVisits;
  });

  const [undertakings, setUndertakings] = useState(() => {
    const saved = localStorage.getItem('compliscan_undertakings');
    return saved ? JSON.parse(saved) : initialUndertakings;
  });

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('compliscan_documents');
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('compliscan_config');
    return saved ? JSON.parse(saved) : initialConfig;
  });

  const [auditLog, setAuditLog] = useState(() => {
    const saved = localStorage.getItem('compliscan_audit_log');
    return saved ? JSON.parse(saved) : initialAuditLog;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('compliscan_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Active toast / banner notification
  const [activeToast, setActiveToast] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('compliscan_sim_date', simulatedDate);
  }, [simulatedDate]);

  useEffect(() => {
    localStorage.setItem('compliscan_institutions', JSON.stringify(institutions));
  }, [institutions]);

  useEffect(() => {
    localStorage.setItem('compliscan_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('compliscan_evc_visits', JSON.stringify(evcVisits));
  }, [evcVisits]);

  useEffect(() => {
    localStorage.setItem('compliscan_undertakings', JSON.stringify(undertakings));
  }, [undertakings]);

  useEffect(() => {
    localStorage.setItem('compliscan_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('compliscan_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('compliscan_audit_log', JSON.stringify(auditLog));
  }, [auditLog]);

  useEffect(() => {
    localStorage.setItem('compliscan_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Toast trigger
  const showToast = (message, type = 'success') => {
    setActiveToast({ id: Date.now(), message, type });
    setTimeout(() => setActiveToast(null), 4500);
  };

  // Add an audit log entry
  const logAuditEvent = ({ actorRole, actorName, action, refId, refType, fromStage, toStage, note, reason }) => {
    const newEntry = {
      id: `EVT-${Date.now().toString().slice(-6)}`,
      timestamp: `${simulatedDate}T11:30:00+05:30`,
      simulatedDate,
      actorRole: actorRole || 'SYSTEM',
      actorName: actorName || 'Automated Workflow Engine',
      action,
      refId,
      refType: refType || 'APPLICATION',
      fromStage: fromStage || null,
      toStage: toStage || null,
      note: note || '',
      reason: reason || ''
    };
    setAuditLog((prev) => [newEntry, ...prev]);
  };

  // Add notification
  const addNotification = ({ type, severity, audienceRole, refType, refId, message }) => {
    const newNotice = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      type, // 'REMINDER', 'DUE_TODAY', 'OVERDUE', 'ESCALATION', 'DOC_EXPIRY', 'EVC_DUE'
      severity, // 'info', 'warning', 'critical'
      audienceRole, // 'INSTITUTION', 'REGIONAL_OFFICER', 'BUREAU_OFFICER', 'MEMBER_SECRETARY'
      refType,
      refId,
      message,
      createdAt: simulatedDate,
      acknowledged: false
    };
    setNotifications((prev) => [newNotice, ...prev]);
  };

  // =========================================================================
  // SIMULATED CLOCK ACTIONS (The Core Evaluator Feature)
  // =========================================================================
  const advanceDays = (days) => {
    const cur = new Date(simulatedDate);
    cur.setDate(cur.getDate() + days);
    const newDateStr = cur.toISOString().split('T')[0];
    setSimulatedDate(newDateStr);

    // Evaluate Deadlines & Escalations under new date
    evaluateDeadlinesOnClockTick(newDateStr, days);

    showToast(`Clock advanced +${days} days to ${newDateStr}. Evaluated SLA timers & triggered escalations!`, 'info');
  };

  const resetClock = () => {
    const today = '2026-10-28';
    setSimulatedDate(today);
    showToast('Simulated clock reset to base date (28 Oct 2026)', 'info');
  };

  // Automated evaluation loop fired on clock tick
  const evaluateDeadlinesOnClockTick = (currentSimDate, daysAdded) => {
    const now = new Date(currentSimDate);

    // 1. Advance Application days in stage & check breaches
    setApplications((prev) =>
      prev.map((app) => {
        if (app.status === 'CLOSED' || app.status === 'APPROVED' || app.status === 'REJECTED') {
          return app;
        }

        const newDaysInStage = app.daysInStage + daysAdded;
        const slaMax = config.stage_sla_days[app.currentStage.toLowerCase()] || 21;
        const isBreached = newDaysInStage > slaMax;

        if (isBreached && !app.isBreached) {
          // Trigger notification
          addNotification({
            type: 'OVERDUE',
            severity: 'critical',
            audienceRole: 'REGIONAL_OFFICER',
            refType: 'APPLICATION',
            refId: app.refNo,
            message: `SLA Breach: Application ${app.refNo} has exceeded the ${slaMax}-day limit in stage ${app.currentStage} (${newDaysInStage}d elapsed).`
          });

          logAuditEvent({
            actorRole: 'SYSTEM_MONITOR',
            actorName: 'APH Automated SLA Sweeper',
            action: 'SLA_BREACH_DETECTED',
            refId: app.refNo,
            note: `Exceeded ${slaMax} days in stage ${app.currentStage} (now ${newDaysInStage} days)`
          });
        }

        return {
          ...app,
          daysInStage: newDaysInStage,
          isBreached
        };
      })
    );

    // 2. Evaluate Undertakings and climb the escalation ladder
    setUndertakings((prev) =>
      prev.map((ut) => {
        if (ut.status === 'VERIFIED') return ut;

        const dueDate = new Date(ut.dueDate);
        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        let newStatus = ut.status;
        let newLevel = ut.escalationLevel || 1;

        if (diffDays <= 0 && diffDays > -7 && ut.status === 'OPEN') {
          newStatus = 'OVERDUE';
          newLevel = 2; // Regional Officer
          addNotification({
            type: 'OVERDUE',
            severity: 'warning',
            audienceRole: 'REGIONAL_OFFICER',
            refType: 'UNDERTAKING',
            refId: ut.id,
            message: `Undertaking Overdue: ${ut.institutionName} failed to submit evidence by ${ut.dueDate}. Level 2 notice dispatched.`
          });
        } else if (diffDays <= -7 && diffDays > -15) {
          newStatus = 'ESCALATED';
          newLevel = 3; // Bureau Officer
          addNotification({
            type: 'ESCALATION',
            severity: 'critical',
            audienceRole: 'BUREAU_OFFICER',
            refType: 'UNDERTAKING',
            refId: ut.id,
            message: `L3 Escalation: Undertaking ${ut.id} is 7+ days past deadline. Escalated to Director (Approval Bureau).`
          });
        } else if (diffDays <= -15) {
          newStatus = 'ESCALATED';
          newLevel = 4; // Member Secretary
          addNotification({
            type: 'ESCALATION',
            severity: 'critical',
            audienceRole: 'MEMBER_SECRETARY',
            refType: 'UNDERTAKING',
            refId: ut.id,
            message: `L4 Critical Escalation: Undertaking ${ut.id} is 15+ days overdue. Facing withdrawal of conditional approval!`
          });
        }

        return {
          ...ut,
          daysRemaining: diffDays,
          status: newStatus,
          escalationLevel: newLevel
        };
      })
    );

    // 3. Evaluate Document Expiries
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.status === 'RENEWED') return doc;

        const expDate = new Date(doc.expiryDate);
        const daysToExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

        let newStatus = doc.status;

        if (daysToExpiry <= 0 && doc.status !== 'RENEWAL_SUBMITTED') {
          newStatus = 'EXPIRED';
          addNotification({
            type: 'DOC_EXPIRY',
            severity: 'critical',
            audienceRole: 'REGIONAL_OFFICER',
            refType: 'DOCUMENT',
            refId: doc.id,
            message: `CRITICAL: Mandatory document ${doc.docType} for ${doc.institutionName} EXPIRED on ${doc.expiryDate} with no renewal submitted!`
          });
        } else if (daysToExpiry <= 30 && daysToExpiry > 0) {
          newStatus = 'EXPIRING_SOON';
          if (daysToExpiry === 30 || daysToExpiry === 15) {
            addNotification({
              type: 'DOC_EXPIRY',
              severity: 'warning',
              audienceRole: 'INSTITUTION',
              refType: 'DOCUMENT',
              refId: doc.id,
              message: `Urgent Renewal Alert: ${doc.docType} expires in ${daysToExpiry} days. Please upload renewal immediately.`
            });
          }
        }

        return {
          ...doc,
          daysToExpiry,
          status: newStatus
        };
      })
    );
  };

  // =========================================================================
  // APPLICATION WORKFLOW STATE MACHINE (Module A)
  // =========================================================================

  // Helper to determine the statutory route
  const determineRoute = (appType, institutionType) => {
    if (appType === 'NEW_INSTITUTION') return 'SCRUTINY_EVC_SAC';
    if (appType === 'EXTENSION_OF_APPROVAL') return 'ONLY_SCRUTINY';
    if (appType === 'NEW_COURSE_OR_INTAKE') return 'SCRUTINY_EVC';
    if (appType === 'CLOSURE_OR_MERGER') return 'EVC_SAC';
    if (appType === 'NAME_CHANGE') return 'ONLY_SCRUTINY';
    return 'SCRUTINY_EVC';
  };

  // Next stage transition sequence per route
  const getNextStage = (currentStage, route) => {
    const routes = config.routes || {
      ONLY_SCRUTINY: ['SUBMITTED', 'SCRUTINY', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
      SCRUTINY_EVC: ['SUBMITTED', 'SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
      EVC_SAC: ['SUBMITTED', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'SAC_REVIEW', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
      ONLY_EVC: ['SUBMITTED', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED'],
      SCRUTINY_EVC_SAC: ['SUBMITTED', 'SCRUTINY', 'EVC_QUEUE', 'EVC_SCHEDULED', 'EVC_DONE', 'SAC_REVIEW', 'DECISION', 'ACTIVE_MONITORING', 'CLOSED']
    };

    const seq = routes[route] || routes.SCRUTINY_EVC;
    const curIdx = seq.indexOf(currentStage);
    if (curIdx >= 0 && curIdx < seq.length - 1) {
      return seq[curIdx + 1];
    }
    return currentStage;
  };

  // Auto-Advance Application to Next Prescribed Stage
  const advanceApplication = (appId, actorRole, actorName, note = '') => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;

        const nextStage = getNextStage(app.currentStage, app.route);

        logAuditEvent({
          actorRole,
          actorName,
          action: 'STAGE_AUTO_ADVANCED',
          refId: app.refNo,
          fromStage: app.currentStage,
          toStage: nextStage,
          note: note || `Passed verification criteria; auto-routed to ${nextStage}`
        });

        // If moved into EVC queue, ensure an EVC queue entry exists
        if (nextStage === 'EVC_QUEUE') {
          const newEvcVisit = {
            id: `EVC-${Date.now().toString().slice(-5)}`,
            applicationId: app.id,
            refNo: app.refNo,
            institutionName: app.institutionName,
            region: app.region,
            status: 'QUEUED',
            urgencyWindowDays: app.appType === 'NEW_INSTITUTION' ? 21 : 30,
            daysWaiting: 0,
            deadline: `${simulatedDate} (+30d)`,
            convener: null,
            members: [],
            scheduledDate: null,
            mode: 'PHYSICAL',
            observations: null,
            reportUrl: null
          };
          setEvcVisits((v) => [newEvcVisit, ...v]);
          showToast(`Application ${app.refNo} passed Scrutiny! Auto-routed into EVC Visit Queue.`, 'success');
        } else {
          showToast(`Application ${app.refNo} advanced from ${app.currentStage} → ${nextStage}`, 'success');
        }

        return {
          ...app,
          currentStage: nextStage,
          daysInStage: 0,
          isBreached: false,
          stageEnteredAt: simulatedDate,
          status: nextStage === 'DECISION' ? 'DECIDED' : 'IN_PROGRESS'
        };
      })
    );
  };

  // Revert Application for Deficiency (Human Regulatory Safeguard)
  const revertApplication = (appId, reason, note, actorRole, actorName) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;

        logAuditEvent({
          actorRole,
          actorName,
          action: 'REVERTED_FOR_DEFICIENCY',
          refId: app.refNo,
          fromStage: app.currentStage,
          toStage: 'REVERTED',
          reason,
          note
        });

        addNotification({
          type: 'REMINDER',
          severity: 'warning',
          audienceRole: 'INSTITUTION',
          refType: 'APPLICATION',
          refId: app.refNo,
          message: `Application ${app.refNo} has been returned for deficiency: "${reason}". Please submit rectified documents.`
        });

        showToast(`Application ${app.refNo} returned for deficiency. Institution notified.`, 'warning');

        return {
          ...app,
          currentStage: 'REVERTED',
          status: 'REVERTED',
          deficiencyReason: reason,
          deficiencyNote: note,
          daysInStage: 0,
          isBreached: false
        };
      })
    );
  };

  // Institution Resubmits Application after Rectifying Deficiency
  const resubmitApplication = (appId, actorRole, actorName, note = '') => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;

        const nextStage = 'SCRUTINY';
        const resubCount = (app.resubmissionCount || 0) + 1;

        logAuditEvent({
          actorRole,
          actorName,
          action: 'DEFICIENCY_RESUBMITTED',
          refId: app.refNo,
          fromStage: 'REVERTED',
          toStage: 'SCRUTINY',
          note: note || `Rectification uploaded (Cycle #${resubCount})`
        });

        addNotification({
          type: 'REMINDER',
          severity: 'info',
          audienceRole: 'REGIONAL_OFFICER',
          refType: 'APPLICATION',
          refId: app.refNo,
          message: `Application ${app.refNo} resubmitted by institution with rectified documents. Ready for re-scrutiny.`
        });

        showToast(`Application ${app.refNo} resubmitted for Re-Scrutiny (Cycle #${resubCount})`, 'success');

        return {
          ...app,
          currentStage: nextStage,
          status: 'IN_PROGRESS',
          resubmissionCount: resubCount,
          daysInStage: 0,
          isBreached: false
        };
      })
    );
  };

  // Submit Brand New Application (Intake)
  const submitNewApplication = (appData, actorRole, actorName) => {
    const refNo = `APH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const route = determineRoute(appData.appType, appData.institutionType);

    const newApp = {
      id: `app_${Date.now()}`,
      refNo,
      institutionId: appData.institutionId || 'inst_1',
      institutionName: appData.institutionName || 'Sunrise Institute of Technology',
      region: appData.region || 'Western Regional Office',
      state: appData.state || 'Maharashtra',
      district: appData.district || 'Pune',
      institutionType: appData.institutionType || 'Engineering & Technology',
      appType: appData.appType || 'EXTENSION_OF_APPROVAL',
      route,
      currentStage: 'SCRUTINY',
      status: 'IN_PROGRESS',
      assignedOfficer: 'RO-WEST-041',
      createdAt: simulatedDate,
      stageEnteredAt: simulatedDate,
      daysInStage: 0,
      isBreached: false,
      resubmissionCount: 0,
      decision: null,
      courseDetails: appData.courseDetails || 'B.Tech in Artificial Intelligence & Data Science'
    };

    setApplications((prev) => [newApp, ...prev]);

    logAuditEvent({
      actorRole,
      actorName,
      action: 'APPLICATION_SUBMITTED',
      refId: refNo,
      toStage: 'SCRUTINY',
      note: `New application submitted for ${appData.appType}. Auto-determined statutory route: ${route}`
    });

    addNotification({
      type: 'REMINDER',
      severity: 'info',
      audienceRole: 'REGIONAL_OFFICER',
      refType: 'APPLICATION',
      refId: refNo,
      message: `New APH application ${refNo} received from ${appData.institutionName}. Assigned to Scrutiny queue.`
    });

    showToast(`Application ${refNo} submitted successfully! Auto-routed: ${route}`, 'success');
    return newApp;
  };

  // Make Decision on Application (Approved / Conditional / Rejected)
  const decideApplication = (appId, decision, undertakingsList = [], actorRole, actorName, note = '') => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;

        // If conditional, add undertakings to registry
        if (decision === 'CONDITIONAL' && undertakingsList.length > 0) {
          const newUts = undertakingsList.map((text, idx) => ({
            id: `UT-${Date.now()}-${idx}`,
            applicationId: app.id,
            refNo: app.refNo,
            institutionName: app.institutionName,
            conditionText: text,
            evidenceRequired: 'Affidavit + Documentary / Geo-tagged Photo Proof',
            imposedAt: simulatedDate,
            dueDate: new Date(new Date(simulatedDate).setDate(new Date(simulatedDate).getDate() + 90)).toISOString().split('T')[0],
            daysRemaining: 90,
            status: 'OPEN',
            escalationLevel: 1,
            evidenceUrl: null,
            evidenceNote: null,
            verifiedAt: null,
            verifiedBy: null
          }));
          setUndertakings((u) => [...newUts, ...u]);
        }

        logAuditEvent({
          actorRole,
          actorName,
          action: `DECISION_${decision}`,
          refId: app.refNo,
          fromStage: 'DECISION',
          toStage: 'CLOSED',
          note: note || `Final Competent Authority Decision: ${decision}`
        });

        showToast(`Decision recorded for ${app.refNo}: ${decision}`, decision === 'APPROVED' ? 'success' : 'warning');

        return {
          ...app,
          currentStage: 'CLOSED',
          status: decision,
          decision,
          closedAt: simulatedDate
        };
      })
    );
  };

  // =========================================================================
  // EVC MODULE ACTIONS (Module C)
  // =========================================================================
  const scheduleEvcVisit = (visitId, { scheduledDate, convener, members, mode }, actorRole, actorName) => {
    setEvcVisits((prev) =>
      prev.map((v) => {
        if (v.id !== visitId) return v;

        logAuditEvent({
          actorRole,
          actorName,
          action: 'EVC_VISIT_SCHEDULED',
          refId: v.refNo,
          note: `EVC Visit scheduled for ${scheduledDate} (${mode}). Convener: ${convener}`
        });

        addNotification({
          type: 'EVC_DUE',
          severity: 'info',
          audienceRole: 'INSTITUTION',
          refType: 'EVC_VISIT',
          refId: v.refNo,
          message: `EVC Visit Scheduled for ${v.institutionName} on ${scheduledDate}. Committee Convener: ${convener}`
        });

        showToast(`EVC Visit scheduled for ${v.refNo} on ${scheduledDate}`, 'success');

        return {
          ...v,
          status: 'SCHEDULED',
          scheduledDate,
          convener,
          members,
          mode
        };
      })
    );

    // Also update corresponding application stage to EVC_SCHEDULED
    const targetVisit = evcVisits.find((v) => v.id === visitId);
    if (targetVisit) {
      setApplications((apps) =>
        apps.map((a) => (a.id === targetVisit.applicationId ? { ...a, currentStage: 'EVC_SCHEDULED' } : a))
      );
    }
  };

  const completeEvcVisit = (visitId, { observations, reportUrl, recommendation }, actorRole, actorName) => {
    let appToAdvance = null;

    setEvcVisits((prev) =>
      prev.map((v) => {
        if (v.id !== visitId) return v;

        appToAdvance = v.applicationId;

        logAuditEvent({
          actorRole,
          actorName,
          action: 'EVC_REPORT_SUBMITTED',
          refId: v.refNo,
          note: `EVC Report uploaded: ${recommendation}. Observations: ${observations.slice(0, 80)}...`
        });

        showToast(`EVC Inspection Report submitted for ${v.refNo}! Auto-advancing application.`, 'success');

        return {
          ...v,
          status: 'COMPLETED',
          completedAt: simulatedDate,
          observations,
          reportUrl: reportUrl || '/reports/EVC_Standard_Report.pdf',
          recommendation
        };
      })
    );

    if (appToAdvance) {
      advanceApplication(appToAdvance, actorRole, actorName, `EVC Report complete (${recommendation})`);
    }
  };

  // =========================================================================
  // UNDERTAKINGS & COMPLIANCE ACTIONS (Module D)
  // =========================================================================
  const submitUndertakingEvidence = (undertakingId, fileUrl, note, actorRole, actorName) => {
    setUndertakings((prev) =>
      prev.map((ut) => {
        if (ut.id !== undertakingId) return ut;

        logAuditEvent({
          actorRole,
          actorName,
          action: 'UNDERTAKING_EVIDENCE_SUBMITTED',
          refId: ut.id,
          note: `Institution submitted evidence proof: ${note}`
        });

        addNotification({
          type: 'REMINDER',
          severity: 'info',
          audienceRole: 'REGIONAL_OFFICER',
          refType: 'UNDERTAKING',
          refId: ut.id,
          message: `Compliance evidence submitted for undertaking ${ut.id} (${ut.institutionName}). Ready for officer verification.`
        });

        showToast(`Compliance evidence submitted for ${ut.id}. Awaiting officer verification.`, 'success');

        return {
          ...ut,
          status: 'SUBMITTED',
          evidenceUrl: fileUrl || '/evidence/compliance_affidavit.pdf',
          evidenceNote: note,
          submittedAt: simulatedDate
        };
      })
    );
  };

  const verifyUndertaking = (undertakingId, verdict, verifyNote, actorRole, actorName) => {
    setUndertakings((prev) =>
      prev.map((ut) => {
        if (ut.id !== undertakingId) return ut;

        logAuditEvent({
          actorRole,
          actorName,
          action: verdict === 'VERIFIED' ? 'UNDERTAKING_VERIFIED' : 'UNDERTAKING_REJECTED',
          refId: ut.id,
          note: `Officer verdict: ${verdict}. Note: ${verifyNote}`
        });

        showToast(`Undertaking ${ut.id} marked as ${verdict}`, verdict === 'VERIFIED' ? 'success' : 'warning');

        return {
          ...ut,
          status: verdict,
          verifiedAt: simulatedDate,
          verifiedBy: actorName,
          verifyNote
        };
      })
    );
  };

  // =========================================================================
  // DOCUMENT VALIDITY ACTIONS (Module E)
  // =========================================================================
  const submitDocumentRenewal = (docId, { issuedOn, expiryDate, fileUrl, note }, actorRole, actorName) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        logAuditEvent({
          actorRole,
          actorName,
          action: 'DOCUMENT_RENEWAL_SUBMITTED',
          refId: doc.id,
          note: `Submitted renewal for ${doc.docType}. New validity: ${issuedOn} to ${expiryDate}`
        });

        addNotification({
          type: 'REMINDER',
          severity: 'info',
          audienceRole: 'REGIONAL_OFFICER',
          refType: 'DOCUMENT',
          refId: doc.id,
          message: `Renewal document submitted for ${doc.docType} (${doc.institutionName}). Awaiting verification.`
        });

        showToast(`Renewal document submitted for ${doc.docType}. Awaiting officer verification.`, 'success');

        return {
          ...doc,
          status: 'RENEWAL_SUBMITTED',
          pendingRenewal: {
            issuedOn,
            expiryDate,
            fileUrl: fileUrl || '/docs/renewal_certificate.pdf',
            note,
            submittedAt: simulatedDate
          }
        };
      })
    );
  };

  const verifyDocumentRenewal = (docId, verdict, note, actorRole, actorName) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        if (verdict === 'VERIFIED' && doc.pendingRenewal) {
          logAuditEvent({
            actorRole,
            actorName,
            action: 'DOCUMENT_RENEWAL_VERIFIED',
            refId: doc.id,
            note: `Renewal approved. Extended validity to ${doc.pendingRenewal.expiryDate}`
          });

          showToast(`Document ${doc.docType} verified and renewed!`, 'success');

          return {
            ...doc,
            status: 'RENEWED',
            issuedOn: doc.pendingRenewal.issuedOn,
            expiryDate: doc.pendingRenewal.expiryDate,
            verifiedAt: simulatedDate,
            verifiedBy: actorName,
            pendingRenewal: null
          };
        } else {
          logAuditEvent({
            actorRole,
            actorName,
            action: 'DOCUMENT_RENEWAL_REJECTED',
            refId: doc.id,
            note: `Renewal rejected: ${note}`
          });

          showToast(`Document renewal rejected for ${doc.docType}`, 'warning');

          return {
            ...doc,
            status: 'EXPIRED',
            pendingRenewal: null
          };
        }
      })
    );
  };

  // =========================================================================
  // APH TIMELINES CONFIGURATOR (Module F)
  // =========================================================================
  const updateConfigJson = (newConfigJson, actorRole, actorName) => {
    try {
      const parsed = typeof newConfigJson === 'string' ? JSON.parse(newConfigJson) : newConfigJson;
      setConfig(parsed);

      logAuditEvent({
        actorRole,
        actorName,
        action: 'APH_RULES_CONFIG_UPDATED',
        refId: 'CONFIG-MASTER',
        note: 'Approval Process Handbook (APH) SLA timelines and escalation ladder updated.'
      });

      showToast('APH Timeline & Rules Configuration successfully saved!', 'success');
      return true;
    } catch (err) {
      showToast(`Invalid JSON configuration: ${err.message}`, 'error');
      return false;
    }
  };

  const resetConfigDefaults = (actorRole, actorName) => {
    setConfig(initialConfig);
    logAuditEvent({
      actorRole,
      actorName,
      action: 'APH_RULES_RESET_DEFAULTS',
      refId: 'CONFIG-MASTER',
      note: 'Restored statutory Approval Process Handbook (APH) default thresholds.'
    });
    showToast('Restored statutory APH default timelines and escalation ladder.', 'info');
  };

  // =========================================================================
  // ONE-CLICK DEMO RUNNER (Evaluator Favorite)
  // =========================================================================
  const runOneClickDemo = () => {
    const demoRef = `DEMO-APH-${Date.now().toString().slice(-4)}`;

    // Create a demo app that automatically advances to show the full lifecycle
    const demoApp = {
      id: `app_demo_${Date.now()}`,
      refNo: demoRef,
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
      createdAt: simulatedDate,
      stageEnteredAt: simulatedDate,
      daysInStage: 2,
      isBreached: false,
      resubmissionCount: 0,
      decision: null,
      courseDetails: 'New Program: M.Tech in Cyber Physical Systems (60 Seats)'
    };

    setApplications((prev) => [demoApp, ...prev]);

    logAuditEvent({
      actorRole: 'DEMO_RUNNER',
      actorName: 'One-Click Demo Suite',
      action: 'DEMO_APPLICATION_INITIALIZED',
      refId: demoRef,
      toStage: 'SCRUTINY',
      note: 'Evaluator live demonstration initiated. Route determined: SCRUTINY_EVC'
    });

    showToast(`1-Click Demo Started: Application ${demoRef} created in Scrutiny!`, 'success');
    return demoApp;
  };

  // Dismiss notification
  const acknowledgeNotification = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, acknowledged: true } : n))
    );
  };

  return (
    <AicteContext.Provider
      value={{
        simulatedDate,
        advanceDays,
        resetClock,
        institutions,
        applications,
        evcVisits,
        undertakings,
        documents,
        config,
        auditLog,
        notifications,
        activeToast,
        showToast,
        logAuditEvent,
        addNotification,
        acknowledgeNotification,
        // Workflow functions
        determineRoute,
        getNextStage,
        advanceApplication,
        revertApplication,
        resubmitApplication,
        submitNewApplication,
        decideApplication,
        scheduleEvcVisit,
        completeEvcVisit,
        submitUndertakingEvidence,
        verifyUndertaking,
        submitDocumentRenewal,
        verifyDocumentRenewal,
        updateConfigJson,
        resetConfigDefaults,
        runOneClickDemo
      }}
    >
      {children}
    </AicteContext.Provider>
  );
}

export function useAicte() {
  const context = useContext(AicteContext);
  if (!context) {
    throw new Error('useAicte must be used within an AicteProvider');
  }
  return context;
}
