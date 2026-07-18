const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

const modules = ['compliance-rule', 'inspection-template', 'incident', 'corrective-action', 'approval-workflow'];

for (const mod of modules) {
  const repoFile = `${BASE}/${mod}/repositories/${mod}.repository.ts`;
  if (!fs.existsSync(repoFile)) continue;
  
  let content = fs.readFileSync(repoFile, 'utf8');
  
  // Find and replace the skip/take pattern
  content = content.replace(
    /skip: \(search\.page - 1\) \* search\.limit, take: search\.limit,/g,
    'skip: (Number(search.page) - 1) * Number(search.limit), take: Number(search.limit),'
  );
  
  fs.writeFileSync(repoFile, content);
  console.log(`Fixed ${repoFile}`);
}

// Also fix approval-workflow repository (approvalRequest part)
const approvalRepoFile = `${BASE}/approval-workflow/repositories/approval-workflow.repository.ts`;
if (fs.existsSync(approvalRepoFile)) {
  let content = fs.readFileSync(approvalRepoFile, 'utf8');
  content = content.replace(
    /skip: \(search\.page - 1\) \* search\.limit, take: search\.limit,/g,
    'skip: (Number(search.page) - 1) * Number(search.limit), take: Number(search.limit),'
  );
  fs.writeFileSync(approvalRepoFile, content);
  console.log(`Fixed approval-workflow repository`);
}

console.log('All repositories fixed with explicit Number() conversions');
