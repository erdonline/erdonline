#!/bin/sh
# 后端快速重启（~12s）：绕过 Maven 运行时，直接用已编译 classes 启动。
#
# 为什么不用 spring-boot-devtools：历史 Redis opaque token + RestartClassLoader
# 曾导致 ClassCastException；现已切 JWT，仍用本脚本保证 classpath 干净、启动可预期。
#
# 用法：修改 Java/yml/mapper 后执行 ./dev-restart.sh
# 依赖变更（pom.xml）后需先 mvn dependency:build-classpath 刷新 target/cp.txt。
set -e
cd "$(dirname "$0")"

# Boot 3 需要 JDK 17+
JAVA_HOME=$(/usr/libexec/java_home -v 17)
export JAVA_HOME

if [ ! -f target/cp.txt ]; then
  echo "首次运行：导出依赖 classpath（后续复用）"
  mvn -o -q dependency:build-classpath -Dmdep.outputFile=target/cp.txt
fi

echo "增量编译..."
mvn -o -q compile

pkill -f "ErdOnlineApplication" 2>/dev/null || true
sleep 1
lsof -ti:9092 | xargs kill -9 2>/dev/null || true

# 前台 exec：由调用方（IDE 后台任务/tmux）托管进程生命周期，nohup 后台化会被会话清理误杀
echo "启动中（~8s 就绪，健康检查 curl localhost:9502/actuator/health）..."
exec "$JAVA_HOME/bin/java" -cp "target/classes:$(cat target/cp.txt)" \
  -Dspring.profiles.active=dev com.erdonline.ErdOnlineApplication
