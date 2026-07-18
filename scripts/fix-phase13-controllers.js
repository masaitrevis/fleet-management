const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

const modules = ['compliance-rule', 'inspection-template', 'incident', 'corrective-action', 'approval-workflow', 'compliance-analytics'];

for (const mod of modules) {
  const ctrlFile = `${BASE}/${mod}/controllers/${mod}.controller.ts`;
  if (!fs.existsSync(ctrlFile)) continue;
  
  let content = fs.readFileSync(ctrlFile, 'utf8');
  content = content.replace(/Response\.json/g, 'NextResponse.json');
  content = content.replace(/function successResponse\(data: unknown, status = 200\) \{ return Response\.json/g, 'function successResponse(data: unknown, status = 200) { return NextResponse.json');
  content = content.replace(/return Response\.json/g, 'return NextResponse.json');
  
  if (!content.includes('import { NextResponse }')) {
    content = content.replace(/import \{ NextRequest \} from 'next\/server';/, "import { NextRequest, NextResponse } from 'next/server';");
  }
  
  fs.writeFileSync(ctrlFile, content);
  console.log(`Fixed ${ctrlFile}`);
}

console.log('All Phase 13 controllers fixed to use NextResponse');
