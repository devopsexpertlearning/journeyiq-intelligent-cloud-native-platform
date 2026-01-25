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

services=("api-gateway:8000" "auth-service:8001" "user-service:8002" "search-service:8003" "pricing-service:8004" "inventory-service:8005" "booking-service:8006" "payment-service:8007" "ticketing-service:8008" "notification-service:8009" "review-service:8010" "analytics-service:8011" "ai-agent-service:8012" "rag-ingestion-service:8013" "vector-store-service:8014")

healthy_count=0
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
        healthy_count=$((healthy_count + 1))
    else
        echo -e "${RED}✗${NC} $name (may still be starting)"
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
echo "Services ready: $healthy_count/15"
echo ""
echo "📊 Service Endpoints:"
echo "  API Gateway:        http://localhost:8000"
echo "  Auth Service:       http://localhost:8001"
echo "  User Service:       http://localhost:8002"
echo "  Search Service:     http://localhost:8003"
echo "  Pricing Service:    http://localhost:8004"
echo "  Inventory Service:  http://localhost:8005"
echo "  Booking Service:    http://localhost:8006"
echo "  Payment Service:    http://localhost:8007"
echo "  Ticketing Service:  http://localhost:8008"
echo "  Notification Service: http://localhost:8009"
echo "  Review Service:     http://localhost:8010"
echo "  Analytics Service:  http://localhost:8011"
echo "  AI Agent Service:   http://localhost:8012"
echo "  RAG Ingestion:      http://localhost:8013"
echo "  Vector Store:       http://localhost:8014"
echo ""
echo "📈 Observability:"
echo "  Prometheus:         http://localhost:9090"
echo "  Grafana:            http://localhost:3000 (admin/admin)"
echo "  Postfix SMTP:       localhost:2525 (No UI)"
echo ""
echo "📝 API Documentation:"
echo "  Each service has Swagger UI at /docs endpoint"
echo "  Example: http://localhost:8001/docs"
echo ""
echo "To view logs: docker-compose logs -f [service-name]"
echo "To stop all:  docker-compose down"
echo ""
echo -e "${YELLOW}Note: Some services may take up to 1 minute to fully initialize${NC}"
echo ""
