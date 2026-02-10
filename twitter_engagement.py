import tweepy
import os

# Twitter API credentials
CONSUMER_KEY = "Mfgx026ImMZHzo8EcG7mhH5fq"
CONSUMER_SECRET = "REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX"
ACCESS_TOKEN = "2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx"
ACCESS_TOKEN_SECRET = "REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX"

# Target tweet info
tweet_id = "2019509658592124928"
tweet_url = "https://x.com/JeanCavallera/status/2019509658592124928"

# Authenticate with Twitter
client = tweepy.Client(
    consumer_key=CONSUMER_KEY,
    consumer_secret=CONSUMER_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET
)

results = {}

# 1. Like the tweet
try:
    client.like(tweet_id)
    results['like'] = "✅ Success"
except Exception as e:
    results['like'] = f"❌ Error: {str(e)}"

# 2. Retweet
try:
    client.retweet(tweet_id)
    results['retweet'] = "✅ Success"
except Exception as e:
    results['retweet'] = f"❌ Error: {str(e)}"

# 3. Quote Tweet
quote_text = """🥔🔥 This is HUGE for the $LYX ecosystem!

Auto-tipping new followers with Potato tokens via Universal Profiles is exactly the kind of programmable utility we need.

The relayer fix unlocking this is a major milestone - "infinite vegetable garden" is now a reality 🌱

Builders building real value. Excited to see adoption! 

#LUKSO $LYX #UniversalProfiles"""

try:
    quote_response = client.create_tweet(
        text=quote_text,
        quote_tweet_id=tweet_id
    )
    results['quote_tweet'] = f"✅ Success - ID: {quote_response.data['id']}"
except Exception as e:
    results['quote_tweet'] = f"❌ Error: {str(e)}"

# 4. Reply
reply_text = """This is brilliant! 🎯

A few questions:
• What's the best way for UPs to start using this?
• Any planned integrations with other dApps?
• Happy to help spread the word - this deserves more eyes!

The programmable $LYX ecosystem is leveling up 💪 #LUKSO $LYX #UniversalProfiles"""

try:
    reply_response = client.create_tweet(
        text=reply_text,
        in_reply_to_tweet_id=tweet_id
    )
    results['reply'] = f"✅ Success - ID: {reply_response.data['id']}"
except Exception as e:
    results['reply'] = f"❌ Error: {str(e)}"

# Print results
print("\n" + "="*60)
print("TWITTER ENGAGEMENT RESULTS")
print("="*60)
for action, result in results.items():
    print(f"\n{action.upper()}:")
    print(f"  {result}")
print("\n" + "="*60)
