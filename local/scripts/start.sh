#!/bin/bash

# JourneyIQ Local Development Startup Script
# This script starts the entire JourneyIQ platform locally

set -e

# Check for root/sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "\033[0;31mPlease run as root (use sudo)\033[0m"
  exit 1
fi

echo "========================================="
echo "JourneyIQ Local Development Environment"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ensure we are in the 'local' directory (parent of scripts/)
cd "$(dirname "$0")/.."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}IMPORTANT: We have created a .env file for you.${NC}"
    # Removed interactive pause for automation purposes
fi

# Check if env/common.env exists (for internal docker networking)
# Check if env/common.env exists (Legacy check removed)
# Check if env/common.env exists (Legacy check removed)
# Common env is now consolidated into .env


# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p ./vectorstore
mkdir -p ./observability/grafana/dashboards
mkdir -p ./observability/grafana/datasources

# Create Grafana datasource
cat > ./observability/grafana/datasources/prometheus.yml <<EOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

echo -e "${GREEN}Starting infrastructure services...${NC}"
docker-compose up -d postgres pubsub-emulator

echo "Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e "${GREEN}PostgreSQL is ready${NC}"

echo "Waiting for Pub/Sub emulator to be ready..."
sleep 5
echo -e "${GREEN}Pub/Sub emulator is ready${NC}"

echo ""
echo -e "${GREEN}Starting all microservices...${NC}"
docker-compose up -d

echo ""
echo  "Waiting for services to be healthy..."
sleep 30

echo ""
echo -e "${GREEN}Checking service health...${NC}"

services=("api-gateway" "auth" "users" "search" "pricing" "inventory" "bookings" "payments" "ticketing" "notifications" "reviews" "analytics" "iot" "admin" "agent" "consumer-web" "admin-web")

healthy_count=0
for service in "${services[@]}"; do
    # Gateway itself is at root /health, others are at /<service>/health
    if [ "$service" == "api-gateway" ]; then
        url="http://localhost:8000/health"
    elif [ "$service" == "consumer-web" ]; then
        url="http://localhost:3001"
    elif [ "$service" == "admin-web" ]; then
        url="http://localhost:3002"
    else
        url="http://localhost:8000/$service/health"
    fi

    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service"
        healthy_count=$((healthy_count + 1))
    else
        echo -e "${RED}✗${NC} $service (may still be starting)"
    fi
done

echo ""
echo -e "${GREEN}Starting observability stack...${NC}"
docker-compose up -d prometheus grafana

echo ""
echo "========================================="
echo -e "${GREEN}JourneyIQ Platform Started!${NC}"
echo "========================================="
echo ""
echo "Services ready: $healthy_count/17"
echo ""
echo "📊 Service Endpoints:"
echo "  All services accessible via Gateway: http://localhost:8000"
echo "  Example: http://localhost:8000/auth/health"
echo "  Example: http://localhost:8000/agent/chat
  Consumer Web: http://localhost:3001
  Admin Web:    http://localhost:3002"
echo ""
echo "📈 Observability:"
echo "  Prometheus:         http://localhost:9090"
echo "  Grafana:            http://localhost:3000 (admin/admin)"
echo "  Postfix SMTP:       localhost:2525 (No UI)"
echo ""
echo "📝 API Documentation:"
echo "  Each service has Swagger UI at /docs endpoint"
echo "  Example: http://localhost:8000/auth/docs"
echo ""
echo "To view logs: docker-compose logs -f [service-name]"
echo "To stop all:  docker-compose down"
echo ""
echo -e "${YELLOW}Note: Some services may take up to 1 minute to fully initialize${NC}"
echo ""
