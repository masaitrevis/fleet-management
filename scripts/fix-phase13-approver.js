const fs = require('fs');
const path = require('path');

const BASE = '/root/.openclaw/workspace/fleet-management-saas/src/modules';

const modules = ['compliance-rule', 'inspection-template', 'incident', 'corrective-action', 'approval-workflow', 'compliance-analytics'];

for (const mod of modules) {
  const repoFile = `${BASE}/${mod}/repositories/${mod}.repository.ts`;
  if (!fs.existsSync(repoFile)) continue;
  
  let content = fs.readFileSync(repoFile, 'utf8');
  
  // Fix AppError calls: new AppError('CODE', 'message', 404) -> new AppError('message', 404, 'CODE')
  content = content.replace(
    /new AppError\('([^']+)', '([^']+)', (\d+)\)/g,
    "new AppError('$2', $3, '$1')"
  );
  
  fs.writeFileSync(repoFile, content);
  console.log(`Fixed AppError calls in ${repoFile}`);
}

console.log('All AppError calls fixed');
