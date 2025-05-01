echo "Pulling latest code"
cd /root/my_schedule/
git pull origin main
cd /

echo "Copying server.js..."
cp /root/my_schedule/src/server.js /var/www/schedule-editor/server.js

echo "Copying public folder..."
rm -rf /var/www/schedule-editor/public
cp -r /root/my_schedule/public /var/www/schedule-editor/

echo "Copying data folder..."
rm -rf /var/www/schedule-editor/data
cp -r /root/my_schedule/data /var/www/schedule-editor/

echo "Restarting server..."
pm2 restart schedule-editor

echo "Deployment compelte!"