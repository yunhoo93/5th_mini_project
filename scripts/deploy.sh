#!/bin/bash
echo "Deploy started"

# Apache 권한 문제 방지
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# index.html 없으면 하나 생성
if [ ! -f /var/www/html/index.html ]; then
  echo "<h1>CodeDeploy 배포 성공</h1>" > /var/www/html/index.html
fi

echo "Deploy finished"
