#!/usr/bin/env python3
"""Post a quote tweet to X/Twitter"""

import tweepy

# Twitter API credentials
CONSUMER_KEY = "Mfgx026ImMZHzo8EcG7mhH5fq"
CONSUMER_SECRET = "REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX"
ACCESS_TOKEN = "2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx"
ACCESS_TOKEN_SECRET = "REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX"

# Target tweet to quote
TARGET_TWEET_ID = "2019509658592124928"
TARGET_TWEET_URL = "https://x.com/JeanCavallera/status/2019509658592124928"

# Quote tweet content
QUOTE_TEXT = """🥔🚀 Huge congrats @JeanCavallera on the successful Potato Tipper deployment! 

The relayer bug fix is a major win — Universal Profiles can now auto-tip new followers with Potato tokens. The "infinite vegetable garden" is officially open! 🌱

This is exactly the kind of innovation that strengthens the $LYX ecosystem. Programmable UPs are the future.

#LUKSO #UniversalProfiles"""

def main():
    # Authenticate
    client = tweepy.Client(
        consumer_key=CONSUMER_KEY,
        consumer_secret=CONSUMER_SECRET,
        access_token=ACCESS_TOKEN,
        access_token_secret=ACCESS_TOKEN_SECRET
    )
    
    # Post quote tweet
    try:
        response = client.create_tweet(
            text=QUOTE_TEXT,
            quote_tweet_id=TARGET_TWEET_ID
        )
        print(f"✅ Quote tweet posted successfully!")
        print(f"Tweet ID: {response.data['id']}")
        print(f"URL: https://x.com/user/status/{response.data['id']}")
    except Exception as e:
        print(f"❌ Error posting tweet: {e}")
        raise

if __name__ == "__main__":
    main()
