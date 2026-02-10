// Memory helper for consistent retrieval
const fs = require('fs');
const path = require('path');

const MEMORY_DIR = '/root/.openclaw/workspace/memory';

function listRecentMemories(days = 7) {
  const files = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
    .sort()
    .reverse()
    .slice(0, days);
  
  console.log('Recent memories:');
  files.forEach(f => console.log(`  - ${f}`));
  return files;
}

function getProjects() {
  const projectsPath = path.join(MEMORY_DIR, 'projects.md');
  if (fs.existsSync(projectsPath)) {
    return fs.readFileSync(projectsPath, 'utf8');
  }
  return null;
}

function updateProjectStatus(projectName, status, notes = '') {
  const projectsPath = path.join(MEMORY_DIR, 'projects.md');
  let content = fs.existsSync(projectsPath) ? fs.readFileSync(projectsPath, 'utf8') : '';
  
  // Simple regex to update status line
  const regex = new RegExp(`(### .*${projectName}.*\n.*Status:).*?(\\s+\\n)`, 'i');
  content = content.replace(regex, `$1 ${status}$2`);
  
  if (notes) {
    const noteRegex = new RegExp(`(### .*${projectName}.*)(\n\n---|\n## )`, 'i');
    content = content.replace(noteRegex, `$1\n**Notes:** ${notes}$2`);
  }
  
  fs.writeFileSync(projectsPath, content);
  console.log(`Updated ${projectName} status to: ${status}`);
}

module.exports = { listRecentMemories, getProjects, updateProjectStatus };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === 'list') {
    listRecentMemories(parseInt(args[1]) || 7);
  } else if (args[0] === 'projects') {
    const p = getProjects();
    console.log(p || 'No projects file found');
  } else {
    console.log('Usage: node memory-helper.js [list|projects]');
  }
}