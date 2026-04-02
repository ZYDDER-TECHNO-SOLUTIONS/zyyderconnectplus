#!/bin/bash
set -e

echo "=== Sparklex Connect+ Kubernetes Deployment ==="

# Build Docker images
echo "Building Docker images..."
cd "$(dirname "$0")/.."

docker build -t sparklex-auth-service:latest ./backend/auth-service/
docker build -t sparklex-job-service:latest ./backend/job-service/
docker build -t sparklex-resume-service:latest ./backend/resume-service/
docker build -t sparklex-notification-service:latest ./backend/notification-service/
docker build -t sparklex-frontend:latest ./frontend/

echo "All images built successfully!"

# Apply K8s manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-init-configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/mongodb.yaml

echo "Waiting for infrastructure to be ready..."
kubectl -n sparklex wait --for=condition=ready pod -l app=postgres --timeout=120s
kubectl -n sparklex wait --for=condition=ready pod -l app=redis --timeout=60s
kubectl -n sparklex wait --for=condition=ready pod -l app=mongodb --timeout=60s

echo "Deploying backend services..."
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/job-service.yaml
kubectl apply -f k8s/resume-service.yaml
kubectl apply -f k8s/notification-service.yaml

echo "Deploying frontend..."
kubectl apply -f k8s/frontend.yaml

echo "Exposing services..."
kubectl apply -f k8s/nodeport-services.yaml

echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://connect.qhrmpro.com:30001"
echo "Auth API: http://connect.qhrmpro.com:30081"
echo "Job API:  http://connect.qhrmpro.com:30082"
echo "Resume API: http://connect.qhrmpro.com:30083"
echo "Notification API: http://connect.qhrmpro.com:30084"
echo ""
echo "Check status: kubectl -n sparklex get pods"
