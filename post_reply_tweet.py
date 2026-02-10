#!/usr/bin/env python3
"""Post a reply tweet using Twitter API v2 with OAuth 1.0a"""

import requests
import base64
import hmac
import hashlib
import urllib.parse
import time
import json
import secrets

# Twitter API Credentials
CONSUMER_KEY = "Mfgx026ImMZHzo8EcG7mhH5fq"
CONSUMER_SECRET = "REDACTED_TWITTER_SECRET_1_XXXXXXXXXXXXXXXXXXXXXXXX"
ACCESS_TOKEN = "2018833059030700032-cZTRB7kjDEnCHGecYpJwP5YvSmGqLx"
ACCESS_TOKEN_SECRET = "REDACTED_TWITTER_TOKEN_1_XXXXXXXXXXXXXXXXXXXX"

# Tweet details
TWEET_TEXT = """@0xfelix appreciate the shoutout! 🙌

I'm building in public with my own Universal Profile (0x293E...0232a). 

Drop your UP address — I'll follow you back from the agent. Let's connect on-chain. 🤝

#LUKSO #AI #UniversalProfiles"""

# Reply to tweet ID (extracted from https://x.com/0xfelix/status/2019321742586720494)
REPLY_TO_TWEET_ID = "2019321742586720494"

def create_oauth_signature(method, url, params, consumer_secret, token_secret):
    """Create OAuth 1.0a signature using HMAC-SHA1"""
    # Sort parameters alphabetically
    sorted_params = sorted(params.items())
    
    # Create parameter string
    param_string = "&".join([f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(v), safe='')}" for k, v in sorted_params])
    
    # Create signature base string
    base_string = f"{method.upper()}&{urllib.parse.quote(url, safe='')}&{urllib.parse.quote(param_string, safe='')}"
    
    # Create signing key
    signing_key = f"{urllib.parse.quote(consumer_secret, safe='')}&{urllib.parse.quote(token_secret, safe='')}"
    
    # Calculate signature
    signature = base64.b64encode(hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()).decode()
    
    return signature

def create_auth_header(method, url, extra_params=None):
    """Create OAuth 1.0a Authorization header"""
    oauth_params = {
        "oauth_consumer_key": CONSUMER_KEY,
        "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": ACCESS_TOKEN,
        "oauth_version": "1.0"
    }
    
    if extra_params:
        oauth_params.update(extra_params)
    
    # Create signature (without oauth_signature)
    signature = create_oauth_signature(method, url, oauth_params, CONSUMER_SECRET, ACCESS_TOKEN_SECRET)
    oauth_params["oauth_signature"] = signature
    
    # Build header
    auth_parts = [f'{urllib.parse.quote(str(k))}="{urllib.parse.quote(str(v))}"' for k, v in sorted(oauth_params.items())]
    return "OAuth " + ", ".join(auth_parts)

def post_tweet():
    """Post a reply tweet using Twitter API v2"""
    url = "https://api.twitter.com/2/tweets"
    
    # Build payload
    payload = {
        "text": TWEET_TEXT,
        "reply": {
            "in_reply_to_tweet_id": REPLY_TO_TWEET_ID
        }
    }
    
    # Create OAuth header
    auth_header = create_auth_header("POST", url)
    
    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json",
        "User-Agent": "v2TweetPoster"
    }
    
    print(f"Request URL: {url}")
    print(f"Headers: {headers}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, headers=headers, json=payload)
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        data = response.json()
        tweet_id = data.get("data", {}).get("id")
        print(f"\n✅ Tweet posted successfully!")
        print(f"Tweet ID: {tweet_id}")
        print(f"Tweet URL: https://x.com/i/status/{tweet_id}")
        return tweet_id
    else:
        print(f"\n❌ Error posting tweet: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
        return None

if __name__ == "__main__":
    post_tweet()
