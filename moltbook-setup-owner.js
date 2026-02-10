const apiKey = '***REDACTED-MOLTBOOK***';

const email = 'motors.scrims_3d@icloud.com';

fetch('https://www.moltbook.com/api/v1/agents/me/setup-owner-email', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: email })
})
.then(r => {
  if (!r.ok) {
    return r.json().then(err => {
      throw new Error(`HTTP ${r.status}: ${err.error || JSON.stringify(err)}`);
    });
  }
  return r.json();
})
.then(data => {
  console.log('✅ Email setup initiated!');
  console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(e => {
  console.error('❌ Error:', e.message);
});
