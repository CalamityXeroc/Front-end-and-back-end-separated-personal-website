# ========================================
# Personal Website Deploy Script
# ========================================

$ErrorActionPreference = "Stop"

# ========================================
# Configuration - MODIFY THESE VALUES
# ========================================

$SERVER_USER = "xtb4uviu"
$SERVER_IP = "43.143.143.247"
$SERVER_PORT = "22"

$REMOTE_BACKEND_PATH = "/www/server/my-backend"
$REMOTE_FRONTEND_PATH = "/www/wwwroot/qqq.BST-note.top"

$DB_NAME = "123456"
$DB_USER = "postgres"
$DB_PASSWORD = "123456"

$NODE_VERSION = "24"
$BACKEND_PORT = "5000"

# ========================================
# Functions
# ========================================

function Print-Step {
    param([string]$message)
    Write-Host "[STEP] $message" -ForegroundColor Green
}

function Print-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Check-Command {
    param([string]$command)
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        Print-Error "$command not found, please install it first"
        exit 1
    }
}

# ========================================
# Main Process
# ========================================

Print-Step "Starting deployment..."

# 1. Check local environment
Print-Step "1. Checking local environment..."
Check-Command "npm"
Check-Command "ssh"
Check-Command "scp"

Print-Info "Tip: Use Git Bash or WSL for better SSH support"

# 2. Build frontend
Print-Step "2. Building frontend..."
Print-Info "Running npm run build..."
npm run build

if (-not (Test-Path "dist")) {
    Print-Error "Frontend build failed, dist directory not found"
    exit 1
}

Print-Info "Frontend build completed!"

# 3. Package backend
Print-Step "3. Packaging backend..."
Set-Location backend

Print-Info "Creating backend archive..."

$tempDir = New-Item -ItemType Directory -Path "../temp_backend" -Force

Get-ChildItem -Path . -Exclude @("node_modules", ".env", "uploads", ".git", "*.log") | 
    Copy-Item -Destination $tempDir -Recurse -Force

Set-Location ..
Compress-Archive -Path "temp_backend\*" -DestinationPath "backend.zip" -Force

Remove-Item -Path "temp_backend" -Recurse -Force

Print-Info "Backend package created!"

# 4. Upload frontend files
Print-Step "4. Uploading frontend files..."
Print-Info "Target: $REMOTE_FRONTEND_PATH"

ssh -p $SERVER_PORT "${SERVER_USER}@${SERVER_IP}" "mkdir -p $REMOTE_FRONTEND_PATH"

ssh -p $SERVER_PORT "${SERVER_USER}@${SERVER_IP}" "cd $REMOTE_FRONTEND_PATH && find . -maxdepth 1 ! -name '.' ! -name '..' ! -name '.user.ini' ! -name '.htaccess' -exec rm -rf {} +"

scp -P $SERVER_PORT -r dist/* "${SERVER_USER}@${SERVER_IP}:${REMOTE_FRONTEND_PATH}/"

Print-Info "Frontend files uploaded!"

# 5. Upload backend files
Print-Step "5. Uploading backend files..."
Print-Info "Target: $REMOTE_BACKEND_PATH"

scp -P $SERVER_PORT backend.zip "${SERVER_USER}@${SERVER_IP}:/tmp/"

$envContent = @"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

PORT=$BACKEND_PORT
NODE_ENV=production

UPLOAD_PATH=./uploads
"@

$sshCommands = @"
set -e
mkdir -p $REMOTE_BACKEND_PATH
cd $REMOTE_BACKEND_PATH
unzip -o /tmp/backend.zip
rm /tmp/backend.zip
echo '$envContent' > .env
mkdir -p uploads
echo 'Backend files deployed'
"@

ssh -p $SERVER_PORT "${SERVER_USER}@${SERVER_IP}" $sshCommands

Print-Info "Backend files uploaded!"

# 6. Install backend dependencies
Print-Step "6. Installing backend dependencies..."

$installCommands = @"
set -e
cd $REMOTE_BACKEND_PATH

if ! command -v npm &> /dev/null; then
    echo 'Configuring Node.js environment...'
    NODE_PATH=`$(find /www/server/nodejs -name 'v${NODE_VERSION}*' -type d 2>/dev/null | head -n 1)
    
    if [ -z "`$NODE_PATH" ]; then
        echo 'Error: Node.js $NODE_VERSION not found'
        exit 1
    fi
    
    ln -sf `${NODE_PATH}/bin/node /usr/bin/node
    ln -sf `${NODE_PATH}/bin/npm /usr/bin/npm
fi

echo "Node.js version: `$(node -v)"
echo "npm version: `$(npm -v)"

echo 'Installing dependencies...'
npm install --production

echo 'Dependencies installed'
"@

ssh -p $SERVER_PORT "${SERVER_USER}@${SERVER_IP}" $installCommands

Print-Info "Backend dependencies installed!"

# 7. Initialize database
Print-Step "7. Initializing database..."

$dbCommands = @"
set -e
cd $REMOTE_BACKEND_PATH
echo 'Initializing database...'
node src/config/initDatabase.js
echo 'Database initialized'
"@

ssh -p $SERVER_PORT "${SERVER_USER}@${SERVER_IP}" $dbCommands

Print-Info "Database initialized!"

# 8. Restart backend service
Print-Step "8. Restarting backend service..."

$restartCommands = @"
set -e

if command -v pm2 &> /dev/null; then
    cd $REMOTE_BACKEND_PATH
    pm2 delete my-backend 2>/dev/null || true
    pm2 start src/server.js --name my-backend
    pm2 save
    echo 'Backend started with PM2'
else
    echo 'Warning: PM2 not installed'
    echo 'Please start manually in BT panel or install PM2'
fi
"@

ssh -p $SERVER_PORT "${SERVER_USER}@${SERVER_IP}" $restartCommands

Print-Info "Backend service restarted!"

# 9. Cleanup
Print-Step "9. Cleaning up..."
Remove-Item -Path "backend.zip" -Force
Print-Info "Cleanup completed!"

# 10. Done
Print-Step "========================================="
Print-Step "Deployment completed successfully!"
Print-Step "========================================="
Write-Host ""
Print-Info "Frontend URL: http://${SERVER_IP}"
Print-Info "Backend URL: http://${SERVER_IP}:${BACKEND_PORT}"
Write-Host ""
Print-Info "Next steps:"
Write-Host "1. Configure Nginx reverse proxy in BT panel"
Write-Host "2. Check backend service status in Node.js manager"
Write-Host "3. Visit website and test functionality"
Write-Host ""
Print-Info "View logs: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs my-backend'"
Print-Info "Restart: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 restart my-backend'"
