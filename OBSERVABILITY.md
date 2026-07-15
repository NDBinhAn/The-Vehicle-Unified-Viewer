# Observability and Dashboard Guide

## 1. Available Monitoring Endpoints

After starting the application and Docker Compose stack, use the following endpoints to verify service health and metrics:

- **Health endpoint:** `http://localhost:3000/api/health`
- **Prometheus metrics endpoint:** `http://localhost:3000/api/metrics`

These endpoints are publicly exposed by the backend application. The metrics endpoint is automatically scraped by Grafana's Prometheus data source in the Docker Compose setup.

## 2. Grafana Dashboard

Grafana is available at:

- `http://localhost:3001`

Default login:

- Username: `admin`
- Password: `admin`

### 3. Provisioning Files and Their Purpose

This project includes four observability configuration files under `prometheus/` and `grafana/`.

- `prometheus/prometheus.yml`
  - Prometheus scrape configuration.
  - It tells Prometheus to fetch metrics from the backend at `http://host.docker.internal:3000/api/metrics`.
  - Kept to avoid manual setup in the Prometheus container.

- `grafana/provisioning/datasources/datasource.yml`
  - Grafana datasource provisioning file.
  - It automatically creates the Prometheus datasource when Grafana starts.
  - The datasource points to `http://prometheus:9090` inside Docker Compose.

- `grafana/provisioning/dashboards/dashboard.yml`
  - Grafana dashboard provisioning file.
  - It instructs Grafana to load dashboards from the mounted dashboards folder.
  - This prevents the need to import dashboards manually.

- `grafana/dashboards/vehicle-unified-viewer.json`
  - The actual Grafana dashboard definition.
  - It defines panels for request latency, downstream latency, cache hits/misses, and hit ratio.
  - Keep it as the single source of truth for the default dashboard layout.

### 4. Viewing the Dashboard

1. Open Grafana at `http://localhost:3001`.
2. Log in with the credentials above.
3. If prompted, change the default password or skip the prompt.
4. Navigate to **Dashboards** > **Browse**.
5. Choose the dashboard named **Vehicle Unified Viewer Metrics**.

## 4. Metrics Included in the Dashboard

The Grafana dashboard includes the following panels:

- `http_request_duration_seconds`: API gateway request latency
- `external_dependency_duration_seconds`: downstream Sales/Service API latency
- `redis_cache_hits_total`: cache hit counter
- `redis_cache_misses_total`: cache miss counter
- `redis_cache_hit_ratio`: cache hit ratio
- `vehicle_sales_requests_total`: Sales downstream request status
- `vehicle_service_requests_total`: Service downstream request status

## 5. Quick Validation

From a terminal, verify the backend and metrics endpoints:

```bash
curl -i http://localhost:3000/api/health
curl http://localhost:3000/api/metrics | head -n 20
```

Open Grafana and confirm the **Prometheus** data source is connected.
