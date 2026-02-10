const https = require('https');

const TOKEN = '***REDACTED-GH-TOKEN***';
const FORK_REPO = 'LUKSOAgent/docs';
const BASE_REPO = 'lukso-network/docs';
const PR_NUMBER = '1317';

// Get file content from PR branch  
function getFile(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${BASE_REPO}/contents/${path}?ref=refs/pull/${PR_NUMBER}/head`,
      method: 'GET',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'LUKSOAgent',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Update file in fork
function updateFile(path, message, content, sha) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: message,
      content: Buffer.from(content).toString('base64'),
      sha: sha,
      branch: 'main'
    });
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${FORK_REPO}/contents/${path}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'User-Agent': 'LUKSOAgent',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fixFiles() {
  console.log('🔧 FIXING PR #1317 FILES');
  console.log('=========================\n');
  
  // 1. Fix setting-your-grid.md - remove <img> tag
  console.log('1. Fixing setting-your-grid.md...');
  const gridFile = await getFile('docs/learn/mini-apps/setting-your-grid.md');
  
  if (!gridFile.content) {
    console.error('❌ Could not get grid file');
    console.log(gridFile);
    return;
  }
  
  let gridContent = Buffer.from(gridFile.content, 'base64').toString('utf8');
  
  // Remove the <img> tag and empty line after it
  gridContent = gridContent.replace(/<img[^>]*>\n\n/, '');
  
  console.log('   Removed image tag');
  
  // Commit to fork
  const gridResult = await updateFile(
    'docs/learn/mini-apps/setting-your-grid.md',
    'Remove logo image from LSP28 guide',
    gridContent,
    gridFile.sha
  );
  
  if (gridResult.content) {
    console.log('   ✅ Grid file updated in fork');
  } else {
    console.error('   ❌ Grid update failed:', gridResult.message || gridResult);
  }
  
  // 2. Fix sidebars.js - remove duplicate entry
  console.log('\n2. Fixing sidebars.js...');
  const sidebarFile = await getFile('sidebars.js');
  
  if (!sidebarFile.content) {
    console.error('❌ Could not get sidebar file');
    return;
  }
  
  let sidebarContent = Buffer.from(sidebarFile.content, 'base64').toString('utf8');
  
  // Remove the line: 'learn/mini-apps/setting-your-grid',
  sidebarContent = sidebarContent.replace(/        'learn\/mini-apps\/setting-your-grid',\n/, '');
  
  console.log('   Removed duplicate menu entry');
  
  // Commit to fork
  const sidebarResult = await updateFile(
    'sidebars.js',
    'Fix duplicate menu item in sidebars',
    sidebarContent,
    sidebarFile.sha
  );
  
  if (sidebarResult.content) {
    console.log('   ✅ Sidebar file updated in fork');
  } else {
    console.error('   ❌ Sidebar update failed:', sidebarResult.message || sidebarResult);
  }
  
  console.log('\n✅ All fixes applied to fork!');
}

fixFiles().catch(console.error);
