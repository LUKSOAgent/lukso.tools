const API_KEY = '***REDACTED-MOLTBOOK***';

async function checkMoltbookStatus() {
  console.log('Checking Moltbook account status...\n');
  
  try {
    // Try to get account info
    const response = await fetch('https://www.moltbook.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Account is active!');
    } else {
      console.log('\n❌ Account issue:', data.error || 'Unknown');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkMoltbookStatus().catch(console.error);
