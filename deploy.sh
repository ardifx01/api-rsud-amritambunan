#!/bin/bash

# Deployment script for Fans Cosa API
echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create project directory
PROJECT_DIR="/var/www/fanscosa-amri-tambunan-api"
print_status "Creating project directory: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
fi

cd $PROJECT_DIR

# Clone or pull the repository
if [ -d ".git" ]; then
    print_status "Pulling latest changes from repository..."
    git pull origin main
else
    print_status "Cloning repository..."
    git clone https://github.com/Rinaldi91/api-rsud-amritambunan.git .
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please create it before continuing."
    print_status "You can use the .env template provided."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs uploads mysql/init

# Set proper permissions
sudo chown -R $USER:$USER .
chmod +x deploy.sh

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Remove old images (optional - uncomment if you want to remove old images)
# print_status "Removing old images..."
# docker image prune -f

# Build and start containers
print_status "Building and starting containers..."
docker-compose up --build -d

# Wait for containers to be ready
print_status "Waiting for containers to be ready..."
sleep 30

# Check container status
print_status "Checking container status..."
docker-compose ps

# Check logs
print_status "Checking application logs..."
docker-compose logs fans-cosa-api --tail=20

# Test API endpoint
print_status "Testing API endpoint..."
sleep 15
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    print_status "✅ API is responding successfully!"
    print_status "Testing root endpoint..."
    curl -s http://localhost:5001/ | head -3
else
    print_warning "⚠️  API health check failed. Check the logs for more details."
    docker-compose logs fans-cosa-api --tail=50
fi

print_status "🎉 Deployment completed!"
print_status "Your API should be available at: https://api-rsud-amritambunan.fanscosa.co.id"
print_status "Local access: http://localhost:5001"

echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f fans-cosa-api"
echo "  Restart: docker-compose restart fans-cosa-api"
echo "  Stop: docker-compose down"
echo "  Update: ./deploy.sh"
