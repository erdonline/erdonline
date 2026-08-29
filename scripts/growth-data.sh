#!/bin/bash
# scripts/growth-data.sh
# 每周一运行，拉取过去 7 天数据
# 用法：./scripts/growth-data.sh

set -e

TOKEN_FILE="$HOME/.cloudflare_token"
ZONE_NAME="erdonline.com"
OUTPUT_DIR="docs/growth-data"
DATE=$(date +%Y-%m-%d)

# 检查 Token 文件
if [ ! -f "$TOKEN_FILE" ]; then
  echo "Error: Token file not found at $TOKEN_FILE"
  echo "Please create it with: echo 'YOUR_TOKEN' > $TOKEN_FILE && chmod 600 $TOKEN_FILE"
  exit 1
fi

TOKEN=$(cat "$TOKEN_FILE")

# 获取 Zone ID
echo "Fetching Zone ID for $ZONE_NAME..."
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.result[0].id')

if [ -z "$ZONE_ID" ] || [ "$ZONE_ID" == "null" ]; then
  echo "Error: Failed to fetch Zone ID"
  exit 1
fi

echo "Zone ID: $ZONE_ID"

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 拉取过去 7 天数据
echo "Fetching data for the past 7 days..."
echo "# Growth Data - $DATE" > "$OUTPUT_DIR/$DATE.md"
echo "" >> "$OUTPUT_DIR/$DATE.md"
echo "## Cloudflare Traffic (Past 7 Days)" >> "$OUTPUT_DIR/$DATE.md"
echo "" >> "$OUTPUT_DIR/$DATE.md"
echo "| Date | Total Requests |" >> "$OUTPUT_DIR/$DATE.md"
echo "|------|----------------|" >> "$OUTPUT_DIR/$DATE.md"

for i in {0..6}; do
  DAY=$(date -v-${i}d +%Y-%m-%d 2>/dev/null || date -d "$i days ago" +%Y-%m-%d)
  START="${DAY}T00:00:00Z"
  END="${DAY}T23:59:59Z"
  
  # 总请求数
  TOTAL=$(curl -s "https://api.cloudflare.com/client/v4/graphql" \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"query { viewer { zones(filter: {zoneTag: \\\"$ZONE_ID\\\"}) { httpRequestsAdaptiveGroups(limit: 1, filter: {datetime_geq: \\\"$START\\\", datetime_leq: \\\"$END\\\"}) { count } } } }\"}" | jq -r '.data.viewer.zones[0].httpRequestsAdaptiveGroups[0].count // 0')
  
  echo "| $DAY | $TOTAL |" >> "$OUTPUT_DIR/$DATE.md"
  echo "  $DAY: $TOTAL requests"
done

# GitHub 数据
echo "" >> "$OUTPUT_DIR/$DATE.md"
echo "## GitHub Stats" >> "$OUTPUT_DIR/$DATE.md"
echo "" >> "$OUTPUT_DIR/$DATE.md"

if command -v gh &> /dev/null; then
  GH_DATA=$(gh api repos/erdonline/erdonline --jq '{stars: .stargazers_count, forks: .forks_count, issues: .open_issues_count, watchers: .watchers_count}' 2>/dev/null || echo '{}')
  
  STARS=$(echo "$GH_DATA" | jq -r '.stars // 0')
  FORKS=$(echo "$GH_DATA" | jq -r '.forks // 0')
  ISSUES=$(echo "$GH_DATA" | jq -r '.issues // 0')
  WATCHERS=$(echo "$GH_DATA" | jq -r '.watchers // 0')
  
  echo "- Stars: $STARS" >> "$OUTPUT_DIR/$DATE.md"
  echo "- Forks: $FORKS" >> "$OUTPUT_DIR/$DATE.md"
  echo "- Open Issues: $ISSUES" >> "$OUTPUT_DIR/$DATE.md"
  echo "- Watchers: $WATCHERS" >> "$OUTPUT_DIR/$DATE.md"
  
  echo "  GitHub: $STARS stars, $FORKS forks, $ISSUES issues"
else
  echo "- GitHub CLI not installed, skipping GitHub stats" >> "$OUTPUT_DIR/$DATE.md"
  echo "  GitHub CLI not installed, skipping"
fi

# 总结
echo "" >> "$OUTPUT_DIR/$DATE.md"
echo "## Summary" >> "$OUTPUT_DIR/$DATE.md"
echo "" >> "$OUTPUT_DIR/$DATE.md"
echo "- Data collected on: $DATE" >> "$OUTPUT_DIR/$DATE.md"
echo "- Zone: $ZONE_NAME ($ZONE_ID)" >> "$OUTPUT_DIR/$DATE.md"
echo "" >> "$OUTPUT_DIR/$DATE.md"
echo "Next steps:" >> "$OUTPUT_DIR/$DATE.md"
echo "1. Review this data" >> "$OUTPUT_DIR/$DATE.md"
echo "2. Compare with last week" >> "$OUTPUT_DIR/$DATE.md"
echo "3. Identify trends (traffic up/down? stars up/down?)" >> "$OUTPUT_DIR/$DATE.md"
echo "4. Decide this week's focus (fix bugs / write content / promote)" >> "$OUTPUT_DIR/$DATE.md"

echo ""
echo "✅ Data saved to $OUTPUT_DIR/$DATE.md"
echo ""
echo "Next steps:"
echo "1. Review the data: cat $OUTPUT_DIR/$DATE.md"
echo "2. Compare with last week: ls -t $OUTPUT_DIR/*.md | head -2 | xargs diff"
echo "3. Decide this week's focus based on trends"
