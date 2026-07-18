const fs = require('fs');

const SCHEMA = '/root/.openclaw/workspace/fleet-management-saas/prisma/schema.prisma';
let content = fs.readFileSync(SCHEMA, 'utf8');

// Add relation fields to Company model
content = content.replace(
  /(vehicleDocuments\s+VehicleDocument\[\]\s+)(\r?\n)/,
  `$1\n  driverDocuments          DriverDocument[]\n  documentVersions         DocumentVersion[]\n  complianceRules          ComplianceRule[]\n  complianceExceptions     ComplianceException[]\n  incidents                Incident[]\n  correctiveActions        CorrectiveAction[]\n  inspectionTemplates      InspectionTemplate[]\n  approvalWorkflows        ApprovalWorkflow[]\n  complianceDocuments      ComplianceDocument[]\n$2`
);

// Wait, the Company model already has vehicleDocuments and driverDocuments, let me check
// Actually, let me just add before the closing brace of Company model
const companyAdditions = `  documentVersions         DocumentVersion[]\n  complianceRules          ComplianceRule[]\n  complianceExceptions     ComplianceException[]\n  incidents                Incident[]\n  correctiveActions        CorrectiveAction[]\n  inspectionTemplates      InspectionTemplate[]\n  approvalWorkflows        ApprovalWorkflow[]\n  complianceDocuments      ComplianceDocument[]\n`;

// Find the Company model and add fields before its closing brace
content = content.replace(
  /(model Company \{[\s\S]*?)(  @@index\(\[deletedAt\]\)\s+@@map\("companies"\)\s*\})/,
  (match, before, after) => {
    return before + companyAdditions + after;
  }
);

// Add to Vehicle model
content = content.replace(
  /(model Vehicle \{[\s\S]*?)(  @@index\(\[companyId, deletedAt\]\)\s+@@map\("vehicles"\)\s*\})/,
  (match, before, after) => {
    return before + `  incidents                Incident[]\n  correctiveActions        CorrectiveAction[]\n  complianceChecks         ComplianceCheck[]\n  complianceExceptions     ComplianceException[]\n` + after;
  }
);

// Add to Driver model
content = content.replace(
  /(model Driver \{[\s\S]*?)(  @@index\(\[companyId, deletedAt\]\)\s+@@map\("drivers"\)\s*\})/,
  (match, before, after) => {
    return before + `  incidents                Incident[]\n  correctiveActions        CorrectiveAction[]\n  complianceChecks         ComplianceCheck[]\n  complianceExceptions     ComplianceException[]\n` + after;
  }
);

// Add to User model - need to be careful with existing fields
content = content.replace(
  /(model User \{[\s\S]*?)(  receivedTransfers\s+WarehouseTransfer\[\]\s+@relation\(name: "TransferReceiver"\)\s*\n)/,
  (match, before, transfer) => {
    return before + transfer + `  investigatedIncidents    Incident[]               @relation(name: "InvestigatedIncidents")\n  resolvedIncidents        Incident[]               @relation(name: "ResolvedIncidents")\n  assignedCorrectiveActions CorrectiveAction[]      @relation(name: "AssignedCorrectiveActions")\n  completedCorrectiveActions CorrectiveAction[]     @relation(name: "CompletedCorrectiveActions")\n  requestedApprovals       ApprovalRequest[]        @relation(name: "RequestedApprovals")\n  decidedApprovals         ApprovalRequest[]        @relation(name: "DecidedApprovals")\n`;
  }
);

// Update Incident model relation names
content = content.replace(
  /investigator\s+User\?\s+@relation\(fields: \[investigatedBy\], references: \[id\], name: "investigatedIncidents"\)/,
  `investigator    User?           @relation(fields: [investigatedBy], references: [id], name: "InvestigatedIncidents")`
);
content = content.replace(
  /resolver\s+User\?\s+@relation\(fields: \[resolvedBy\], references: \[id\], name: "resolvedIncidents"\)/,
  `resolver        User?           @relation(fields: [resolvedBy], references: [id], name: "ResolvedIncidents")`
);

// Update CorrectiveAction model relation names
content = content.replace(
  /assignee\s+User\?\s+@relation\(fields: \[assignedTo\], references: \[id\], name: "assignedCorrectiveActions"\)/,
  `assignee        User?                 @relation(fields: [assignedTo], references: [id], name: "AssignedCorrectiveActions")`
);
content = content.replace(
  /completer\s+User\?\s+@relation\(fields: \[completedBy\], references: \[id\], name: "completedCorrectiveActions"\)/,
  `completer       User?                 @relation(fields: [completedBy], references: [id], name: "CompletedCorrectiveActions")`
);

// Update ApprovalRequest model relation names
content = content.replace(
  /requester\s+User\s+@relation\(fields: \[requesterId\], references: \[id\], name: "requestedApprovals"\)/,
  `requester   User            @relation(fields: [requesterId], references: [id], name: "RequestedApprovals")`
);
content = content.replace(
  /decider\s+User\?\s+@relation\(fields: \[decidedBy\], references: \[id\], name: "decidedApprovals"\)/,
  `decider     User?           @relation(fields: [decidedBy], references: [id], name: "DecidedApprovals")`
);

// Add to Trip model
content = content.replace(
  /(model Trip \{[\s\S]*?)(  @@index\(\[companyId, deletedAt\]\)\s+@@map\("trips"\)\s*\})/,
  (match, before, after) => {
    return before + `  incidents                Incident[]\n` + after;
  }
);

// Add to VehicleDocument model
content = content.replace(
  /(model VehicleDocument \{[\s\S]*?)(  @@index\(\[companyId, expiryDate\]\)\s*\n\s*@@map\("vehicle_documents"\)\s*\})/,
  (match, before, after) => {
    return before + `  documentVersions         DocumentVersion[]\n  complianceChecks         ComplianceCheck[]\n` + after;
  }
);

// Add to DriverDocument model
content = content.replace(
  /(model DriverDocument \{[\s\S]*?)(  @@index\(\[expiryDate\]\)\s*\n\s*@@map\("driver_documents"\)\s*\})/,
  (match, before, after) => {
    return before + `  documentVersions         DocumentVersion[]\n` + after;
  }
);

// Add to Inspection model - need templateId and template relation
content = content.replace(
  /(model Inspection \{[\s\S]*?)(  company Company @relation\(fields: \[companyId\], references: \[id\], onDelete: Cascade\)\s*\n)(  vehicle Vehicle @relation\(fields: \[vehicleId\], references: \[id\], onDelete: Cascade\)\s*\n)/,
  (match, before, company, vehicle) => {
    return before + `  templateId     String?\n  template       InspectionTemplate? @relation(fields: [templateId], references: [id])\n` + company + vehicle + `  inspectionChecklists    InspectionChecklist[]\n  complianceChecks        ComplianceCheck[]\n`;
  }
);

fs.writeFileSync(SCHEMA, content);
console.log('Back-relation fields added');
