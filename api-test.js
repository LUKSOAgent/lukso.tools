const { TwitterApi } = require('twitter-api-v2');

const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANp/7QEAAAAA2hgVqjc0BjeIYDSRBD8kDehWpyo=8dLApfVzuArAv0X43ASY6QorymxqN7FBHwWHYCh7QqFHp1MxA0';
const APP_KEY = 'Mfgx026ImMZHzo8EcG7mhH5fq';
const APP_SECRET = 'REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX';
const ACCESS_TOKEN = '2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx';
const ACCESS_SECRET = 'REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX';

async function diagnose() {
  console.log('=== API DIAGNOSTIC ===\n');
  
  // Test 1: Bearer token read-only access
  console.log('Test 1: Bearer token basic access...');
  const bearerClient = new TwitterApi(BEARER_TOKEN);
  try {
    const me = await bearerClient.v2.me();
    console.log('  ✓ Bearer token works for /me endpoint');
    console.log(`  User ID: ${me.data.id}`);
  } catch (e) {
    console.log(`  ✗ Bearer token /me failed: ${e.message}`);
  }
  
  // Test 2: OAuth 1.0a access
  console.log('\nTest 2: OAuth 1.0a access...');
  const oauthClient = new TwitterApi({
    appKey: APP_KEY,
    appSecret: APP_SECRET,
    accessToken: ACCESS_TOKEN,
    accessSecret: ACCESS_SECRET
  });
  
  try {
    const me = await oauthClient.v1.verifyCredentials();
    console.log('  ✓ OAuth 1.0a credentials valid');
    console.log(`  Account: @${me.screen_name}`);
    console.log(`  User ID: ${me.id_str}`);
  } catch (e) {
    console.log(`  ✗ OAuth 1.0a failed: ${e.message}`);
  }
  
  // Test 3: Try to fetch a specific user's timeline with OAuth 1.0a (v1.1 API)
  console.log('\nTest 3: Fetching tweets via v1.1 API...');
  try {
    const userTimeline = await oauthClient.v1.userTimelineByUsername('elonmusk', { count: 3 });
    console.log(`  ✓ v1.1 timeline works`);
    console.log(`  Found ${userTimeline.tweets.length} tweets`);
    if (userTimeline.tweets.length > 0) {
      console.log(`  Latest: "${userTimeline.tweets[0].text.substring(0, 60)}..."`);
    }
  } catch (e) {
    console.log(`  ✗ v1.1 timeline failed: ${e.message}`);
  }
  
  // Test 4: Try to fetch a specific user's timeline with Bearer token (v2 API)
  console.log('\nTest 4: Fetching tweets via v2 API (Bearer)...');
  try {
    const user = await bearerClient.v2.userByUsername('elonmusk');
    if (user.data) {
      const tweets = await bearerClient.v2.userTimeline(user.data.id, {
        max_results: 3,
        exclude: ['retweets', 'replies']
      });
      console.log(`  ✓ v2 timeline works`);
      console.log(`  Found ${tweets.data?.data?.length || 0} tweets`);
    }
  } catch (e) {
    console.log(`  ✗ v2 timeline failed: ${e.message}`);
    if (e.code === 403) {
      console.log(`  This is a permissions issue - app may need elevated access`);
    }
  }
  
  // Test 5: Search recent tweets (v2)
  console.log('\nTest 5: Search recent tweets...');
  try {
    const search = await bearerClient.v2.search('AI agents -is:retweet', {
      max_results: 10,
      'tweet.fields': ['public_metrics', 'author_id']
    });
    console.log(`  ✓ Search works`);
    console.log(`  Found ${search.data?.data?.length || 0} tweets`);
  } catch (e) {
    console.log(`  ✗ Search failed: ${e.message}`);
    if (e.code === 403) {
      console.log(`  Search requires Academic or Elevated access level`);
    }
  }
  
  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

diagnose().catch(console.error);