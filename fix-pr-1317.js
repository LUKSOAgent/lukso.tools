const https = require('https');

const TOKEN = '***REDACTED-GH-TOKEN***';
const PR_NUMBER = '1317';
const REPO = 'lukso-network/docs';

// 1. First, get the current file content
function getFileContent(path, ref) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/${path}?ref=${ref}`,
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

// 2. Update the file
function updateFile(path, message, content, sha) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      message: message,
      content: Buffer.from(content).toString('base64'),
      sha: sha
    });
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/contents/${path}`,
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

async function fixPR() {
  console.log('🔧 FIXING PR #1317');
  console.log('==================\n');
  
  // Get current grid file
  console.log('1. Getting current grid file...');
  const gridFile = await getFileContent('docs/learn/mini-apps/setting-your-grid.md', `refs/pull/${PR_NUMBER}/head`);
  
  if (!gridFile.content) {
    console.error('❌ Could not get file content');
    return;
  }
  
  // Decode content
  const currentContent = Buffer.from(gridFile.content, 'base64').toString('utf8');
  
  // Remove the image line (line with <img> tag)
  const fixedContent = currentContent.replace(/<img[^>]*>\n\n/, '');
  
  // Update the file
  console.log('2. Updating grid file (removing logo)...');
  const updateResult = await updateFile(
    'docs/learn/mini-apps/setting-your-grid.md',
    'Remove logo image from LSP28 guide',
    fixedContent,
    gridFile.sha
  );
  
  if (updateResult.content) {
    console.log('✅ Grid file updated!');
  } else {
    console.error('❌ Failed to update:', updateResult.message || updateResult);
  }
  
  // Get sidebars.js
  console.log('\n3. Getting sidebars.js...');
  const sidebarFile = await getFileContent('sidebars.js', `refs/pull/${PR_NUMBER}/head`);
  
  if (!sidebarFile.content) {
    console.error('❌ Could not get sidebars.js');
    return;
  }
  
  const currentSidebar = Buffer.from(sidebarFile.content, 'base64').toString('utf8');
  
  // Check for duplicate
  console.log('Sidebar content preview:');
  console.log(currentSidebar.substring(0, 500));
}

fixPR().catch(console.error);
