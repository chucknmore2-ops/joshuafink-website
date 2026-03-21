#!/usr/bin/env bash
# Fetches og:image URLs for each Compass listing and prints as JSON map

declare -A urls=(
  ["9209 Duncaster Court"]="https://www.compass.com/homedetails/9209-Duncaster-Ct-Brentwood-TN-37027/TLPVE_pid/"
  ["9560 Dresden Square"]="https://www.compass.com/homedetails/9560-Dresden-Square-Brentwood-TN-37027/T863Z_pid/"
  ["159 North Berwick Lane"]="https://www.compass.com/homedetails/159-N-Berwick-Ln-Franklin-TN-37069/SXI63_pid/"
  ["2420 Pafford Drive"]="https://www.compass.com/homedetails/2420-Pafford-Dr-Nashville-TN-37206/TEZMZ_pid/"
  ["1113 Linn Cv Court"]="https://www.compass.com/homedetails/1113-Linn-Cv-Ct-Gallatin-TN-37066/SPCI8_pid/"
  ["107 Garwood Drive"]="https://www.compass.com/homedetails/107-Garwood-Dr-Nashville-TN-37210/TBGK6_pid/"
  ["511 Wanda Drive"]="https://www.compass.com/homedetails/511-Wanda-Dr-Nashville-TN-37210/SDYP1_pid/"
  ["223 Hampton Road"]="https://www.compass.com/homedetails/223-Hampton-Rd-Columbia-TN-38401/SWL6H_pid/"
  ["634 North 5th Street"]="https://www.compass.com/homedetails/634-N-5th-St-Nashville-TN-37207/OG1G5_pid/"
  ["709 Neelys Bend Road"]="https://www.compass.com/homedetails/709-Neelys-Bend-Rd-Madison-TN-37115/T5YRV_pid/"
  ["131 Lakeside Drive"]="https://www.compass.com/homedetails/131-Lakeside-Dr-Columbia-TN-38401/S3G9D_pid/"
  ["1202 Valarie Lane"]="https://www.compass.com/homedetails/1202-Valarie-Ln-Columbia-TN-38401/SOSRR_pid/"
  ["9293 Fordham Drive"]="https://www.compass.com/homedetails/9293-Fordham-Dr-Brentwood-TN-37027/1141460039452708273_lid/"
)

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

echo "{"
first=1
for name in "${!urls[@]}"; do
  url="${urls[$name]}"
  img=$(curl -s -A "$UA" "$url" | grep -o 'og:image" content="[^"]*"' | head -1 | sed 's/og:image" content="//;s/"//')
  if [ -n "$img" ]; then
    [ $first -eq 0 ] && echo ","
    printf '  "%s": "%s"' "$name" "$img"
    first=0
  fi
  sleep 0.5
done
echo ""
echo "}"
