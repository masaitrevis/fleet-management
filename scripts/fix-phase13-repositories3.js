const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

const modules = ['compliance-rule', 'inspection-template', 'incident', 'corrective-action', 'approval-workflow'];

for (const mod of modules) {
  const repoFile = `${BASE}/${mod}/repositories/${mod}.repository.ts`;
  if (!fs.existsSync(repoFile)) continue;
  
  let content = fs.readFileSync(repoFile, 'utf8');
  
  // Replace all instances with explicit type cast
  content = content.replace(
    /skip: \(pageNum - 1\) \* limitNum, take: limitNum,/g,
    'skip: (pageNum - 1) * limitNum as number, take: limitNum as number,'
  );
  
  fs.writeFileSync(repoFile, content);
  console.log(`Fixed ${repoFile}`);
}

// Also fix approval-workflow repository
const approvalRepoFile = `${BASE}/approval-workflow/repositories/approval-workflow.repository.ts`;
if (fs.existsSync(approvalRepoFile)) {
  let content = fs.readFileSync(approvalRepoFile, 'utf8');
  content = content.replace(
    /skip: \(pageNum - 1\) \* limitNum, take: limitNum,/g,
    'skip: (pageNum - 1) * limitNum as number, take: limitNum as number,'
  );
  fs.writeFileSync(approvalRepoFile, content);
  console.log(`Fixed approval-workflow repository`);
}

console.log('All repositories fixed with explicit type casts');
