const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

const modules = ['compliance-rule', 'inspection-template', 'incident', 'corrective-action', 'approval-workflow'];

for (const mod of modules) {
  const repoFile = `${BASE}/${mod}/repositories/${mod}.repository.ts`;
  if (!fs.existsSync(repoFile)) continue;
  
  let content = fs.readFileSync(repoFile, 'utf8');
  
  // Replace the skip/take pattern with explicit local variables
  content = content.replace(
    /const \[data, total\] = await Promise\.all\(\[\s*prisma\.(\w+)\.findMany\(\{\s*where, skip: \(Number\(search\.page\) - 1\) \* Number\(search\.limit\), take: Number\(search\.limit\),/g,
    (match, model) => `const pageNum = Number(search.page) || 1;\n    const limitNum = Number(search.limit) || 20;\n    const [data, total] = await Promise.all([\n      prisma.${model}.findMany({\n        where, skip: (pageNum - 1) * limitNum, take: limitNum,`
  );
  
  fs.writeFileSync(repoFile, content);
  console.log(`Fixed ${repoFile}`);
}

// Also fix approval-workflow repository (both findAll methods)
const approvalRepoFile = `${BASE}/approval-workflow/repositories/approval-workflow.repository.ts`;
if (fs.existsSync(approvalRepoFile)) {
  let content = fs.readFileSync(approvalRepoFile, 'utf8');
  
  // Fix first findAll (ApprovalWorkflow)
  content = content.replace(
    /const \[data, total\] = await Promise\.all\(\[\s*prisma\.approvalWorkflow\.findMany\(\{\s*where, skip: \(Number\(search\.page\) - 1\) \* Number\(search\.limit\), take: Number\(search\.limit\),/g,
    `const pageNum = Number(search.page) || 1;\n    const limitNum = Number(search.limit) || 20;\n    const [data, total] = await Promise.all([\n      prisma.approvalWorkflow.findMany({\n        where, skip: (pageNum - 1) * limitNum, take: limitNum,`
  );
  
  // Fix second findAll (ApprovalRequest)
  content = content.replace(
    /const \[data, total\] = await Promise\.all\(\[\s*prisma\.approvalRequest\.findMany\(\{\s*where, skip: \(Number\(search\.page\) - 1\) \* Number\(search\.limit\), take: Number\(search\.limit\),/g,
    `const pageNum = Number(search.page) || 1;\n    const limitNum = Number(search.limit) || 20;\n    const [data, total] = await Promise.all([\n      prisma.approvalRequest.findMany({\n        where, skip: (pageNum - 1) * limitNum, take: limitNum,`
  );
  
  fs.writeFileSync(approvalRepoFile, content);
  console.log(`Fixed approval-workflow repository`);
}

console.log('All repositories fixed with explicit local variables');
