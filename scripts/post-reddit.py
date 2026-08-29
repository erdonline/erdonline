#!/usr/bin/env python3
"""Post a self-text submission to a subreddit via Reddit OAuth2 API.

No external dependencies — uses only Python standard library.

Required environment variables:
  REDDIT_CLIENT_ID
  REDDIT_CLIENT_SECRET
  REDDIT_USERNAME
  REDDIT_PASSWORD

Usage:
  python3 scripts/post-reddit.py \
    --subreddit cursor \
    --title "My title" \
    --body-file docs/growth-content/2026-08-29-reddit.md \
    --kind self

The body file can contain YAML/Markdown front matter; the first `# ` heading
is treated as the post body, with the title line stripped if present.
"""

import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlencode

REDDIT_OAUTH_BASE = "https://oauth.reddit.com"
REDDIT_AUTH_BASE = "https://www.reddit.com"


def http_json(method, url, headers=None, data=None, timeout=30):
    """Make an HTTP request and return parsed JSON."""
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data:
        if isinstance(data, dict):
            data = urlencode(data).encode("utf-8")
        elif isinstance(data, str):
            data = data.encode("utf-8")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with urllib.request.urlopen(req, data=data, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.getcode()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            err = json.loads(body)
        except json.JSONDecodeError:
            err = body
        return {"error": err, "status": e.code}, e.code


def get_access_token(client_id, client_secret, username, password):
    """Obtain a user-context OAuth2 token via password grant."""
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    headers = {
        "Authorization": f"Basic {credentials}",
        "User-Agent": f"python:erdonline-growth:v1.0 (by u/{username})",
    }
    data = {
        "grant_type": "password",
        "username": username,
        "password": password,
        "scope": "submit identity",
    }
    url = f"{REDDIT_AUTH_BASE}/api/v1/access_token"
    result, status = http_json("POST", url, headers=headers, data=data)
    if status != 200 or "access_token" not in result:
        print(f"Failed to get access token: {result}", file=sys.stderr)
        sys.exit(1)
    return result["access_token"]


def submit_post(token, username, subreddit, title, text, kind="self"):
    """Submit a post to a subreddit."""
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": f"python:erdonline-growth:v1.0 (by u/{username})",
    }
    data = {
        "sr": subreddit,
        "title": title,
        "kind": kind,
        "text": text,
        "api_type": "json",
        "return_rtjson": "1",
    }
    url = f"{REDDIT_OAUTH_BASE}/api/submit"
    result, status = http_json("POST", url, headers=headers, data=data)
    return result, status


def load_body(path):
    """Load and clean the post body from a file."""
    if not path:
        return ""
    text = Path(path).read_text(encoding="utf-8")
    # Remove YAML front matter if present
    if text.startswith("---"):
        _, _, remainder = text.partition("---\n")
        if "---\n" in remainder:
            _, text = remainder.split("---\n", 1)
    # Strip the first '# Title' heading if it appears
    text = re.sub(r"^# .+\n+", "", text, count=1, flags=re.MULTILINE)
    return text.strip()


def main():
    parser = argparse.ArgumentParser(description="Submit a post to Reddit")
    parser.add_argument("--subreddit", required=True, help="Target subreddit (without r/)")
    parser.add_argument("--title", required=True, help="Post title")
    parser.add_argument("--body", default="", help="Post body text")
    parser.add_argument("--body-file", help="File containing post body")
    parser.add_argument("--kind", default="self", choices=["self", "link"], help="Post type")
    parser.add_argument("--url", help="URL for link posts")
    args = parser.parse_args()

    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    username = os.environ.get("REDDIT_USERNAME")
    password = os.environ.get("REDDIT_PASSWORD")

    if not all([client_id, client_secret, username, password]):
        print(
            "Missing Reddit credentials. Set REDDIT_CLIENT_ID, "
            "REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD.",
            file=sys.stderr,
        )
        sys.exit(1)

    body = args.body
    if args.body_file:
        body = load_body(args.body_file)
    if not body and args.kind == "self":
        print("Self posts require --body or --body-file", file=sys.stderr)
        sys.exit(1)
    if args.kind == "link" and not args.url:
        print("Link posts require --url", file=sys.stderr)
        sys.exit(1)

    token = get_access_token(client_id, client_secret, username, password)
    result, status = submit_post(token, username, args.subreddit, args.title, body, args.kind)

    if status != 200:
        print(f"Submit failed with status {status}: {json.dumps(result, indent=2)}", file=sys.stderr)
        sys.exit(1)

    # Reddit wraps the result under json: { errors: [], data: { ... } }
    payload = result.get("json", result)
    errors = payload.get("errors", [])
    if errors:
        print(f"Reddit returned errors: {errors}", file=sys.stderr)
        sys.exit(1)

    data = payload.get("data", {})
    post_url = data.get("url")
    post_id = data.get("id")
    print(f"Posted successfully: {post_id or ''}")
    if post_url:
        print(f"URL: {post_url}")


if __name__ == "__main__":
    main()
