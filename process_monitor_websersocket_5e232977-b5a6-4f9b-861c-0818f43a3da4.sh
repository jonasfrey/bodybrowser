pid_websersocket=$(pgrep -f "websersocket_5e232977-b5a6-4f9b-861c-0818f43a3da4.js")
watch -n 1 ps -p $pid_websersocket -o pid,etime,%cpu,%mem,cmd