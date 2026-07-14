
# ARCHITECTURAL STRUCTURE & CODING GUIDELINES

**Target Framework:** NestJS (v10+) with TypeScript

**Design Pattern:** API Gateway / Aggregator Pattern (Self-Contained Mocking)

## 1. Directory Tree & File Mapping

```
src/
├── app.module.ts                      # Root application module (Imports: Config, Common, Monitoring, Core, Mocks)
├── main.ts                            # App entrypoint (Swagger UI, Global Pipes, Pino Logger setup)
│
├── common/                            # REUSABLE INFRASTRUCTURE LAYER
│   ├── common.module.ts
│   ├── cache/
│   │   ├── custom-cache.service.ts    # Redis wrapper (Dynamic getOrSet with custom TTLs)
│   │   └── custom-cache.service.spec.ts
│   ├── resilience/
│   │   ├── circuit-breaker.service.ts # Opossum wrapper for safe downstream execution
│   │   └── circuit-breaker.service.spec.ts
│   ├── interceptors/
│   │   └── correlation-id.interceptor.ts # Custom interceptor to generate/inject X-Correlation-ID
│   └── utils/
│       ├── pagination.util.ts         # Pure functions for In-memory Sorting & Pagination
│       └── pagination.util.spec.ts
│
├── config/                            # TYPE-SAFE ENVIRONMENT CONFIGURATION
│   └── configuration.ts               # Env mapping (Redis credentials, Timeouts, Thresholds)
│
├── core/                              # CORE BUSINESS LOGIC LAYER (DOMAINS)
│   └── vehicle-document/
│       ├── vehicle-document.module.ts
│       ├── controllers/
│       │   ├── vehicle-document.controller.ts     # Main API: GET /api/v1/vehicles/:vin/documents
│       │   └── vehicle-document.controller.spec.ts
│       ├── services/
│       │   ├── vehicle-document.service.ts        # Business Orchestrator (Merge, Sort, Slice)
│       │   └── vehicle-document.service.spec.ts   # Core Test Suite (Happy path & Resilience cases)
│       ├── dtos/
│       │   ├── document-response.dto.ts           # Unified Swagger Output Schema
│       │   └── pagination-query.dto.ts            # Class-validator rules for page/size
│       └── clients/
│           ├── sales-api.client.ts                # Axios + Circuit Breaker connecting to Mock Sales
│           ├── sales-api.client.spec.ts
│           ├── service-api.client.ts              # Axios + Circuit Breaker connecting to Mock Service
│           └── service-api.client.spec.ts
│
├── monitoring/                        # PROACTIVE OBSERVABILITY LAYER (PRODUCTION-READY)
│   ├── monitoring.module.ts
│   ├── health.controller.ts           # Terminus Health Indicators for Redis & Mock APIs
│   ├── metrics.service.ts             # Custom Prometheus metrics definitions (Downstream counter/latency)
│   └── tracer.ts                      # OpenTelemetry tracing initializer (Executed BEFORE bootstrap)
│
└── mock-external/                     # EMBEDDED DOWNSTREAM MOCKS (Self-contained Testing)
    ├── mock-external.module.ts
    ├── sales-mock.controller.ts       # Endpoint: GET /mock-api/sales/:vin
    └── service-mock.controller.ts     # Endpoint: GET /mock-api/service/:vin

```

## 2. Core Implementation Requirements & Rationale (For AI Generation)

Dear AI, when implementing files from the structure above, you **MUST** strictly adhere to the following architectural constraints and rationales:

### 💡 Requirement 1: Explicit Caching Service (No Decorators)

* **File:** `src/common/cache/custom-cache.service.ts`
* **Implementation:** Implement `CustomCacheService` as an injectable class wrapping `ioredis`. Provide a generic method `getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number): Promise<T>`.
* **Rationale:** We are dealing with two separate downstream sources requiring different cache lifetimes (**Sales Cache: 24 Hours TTL**, **Service Cache: 30 Minutes TTL**). Do not use global method decorators; call this service explicitly in the orchestrator layer to ensure fine-grained concurrency control and transparent debugging.

### 💡 Requirement 2: Resilient Client Isolations via Circuit Breaker

* **Files:** `src/core/vehicle-document/clients/*-api.client.ts`
* **Implementation:** Wrap all Axios HTTP calls inside `src/common/resilience/circuit-breaker.service.ts` (using the `opossum` library). Configure defensive `timeouts` (default 3000ms) and error thresholds via the `ConfigService`.
* **Rationale:** External network dependencies are untrusted. Isolating them into dedicated clients protected by independent Circuit Breakers prevents a failure in one system (e.g., Service API 500 Error or Timeout) from cascading and blocking the entire gateway thread pool.

### 💡 Requirement 3: Correlation ID Tracking & Structured Logging

* **Files:** `src/common/interceptors/correlation-id.interceptor.ts` and `src/main.ts`
* **Implementation:** The interceptor must extract `X-Correlation-ID` from incoming request headers or generate a new UUID. It must attach this ID to the local logging context (using `nestjs-pino`) and append it to the outgoing HTTP response headers.
* **Rationale:** Distributed observability context. Having a unified `Correlation ID` attached to every single JSON log block generated within the request lifecycle allows cross-system request tracing and simplifies Production troubleshooting.

### 💡 Requirement 4: Pure In-Memory Sorting & Slicing

* **File:** `src/common/utils/pagination.util.ts`
* **Implementation:** Write pure, deterministic, side-effect-free functions that accept raw unified document arrays alongside pagination DTOs, returning the sorted and sliced subsets.
* **Rationale:** Since the mock downstream sources are independent databases without a shared central index, pagination and chronological sorting (latest-to-oldest `timestamp`) must occur at the **Application Layer**. Keeping these functions pure isolates core manipulation algorithms from I/O operations, ensuring optimal CPU execution speed and making them highly unit-testable.

### 💡 Requirement 5: Independent Self-Contained Mocks

* **Files:** `src/mock-external/*-mock.controller.ts`
* **Implementation:** Build functional standalone REST endpoints simulating the external systems (including a `/ping` endpoint for health probes). Decorate them fully with `@nestjs/swagger` tags so they automatically display in the documentation.
* **Rationale:** The system must run flawlessly out-of-the-box. Embedding mocks directly inside a separated module enables the application to be completely self-sufficient (`npm run start` works instantly without setting up standalone mock servers like WireMock).

### 💡 Requirement 6: Observability Blueprint & Token-Saving Constraints

* **Files:** `src/monitoring/*`
* **Implementation Constraints (STRICT):**

1. **`tracer.ts`:** Must be written as a pure Node.js script initialized at the very first line of `main.ts` before NestJS bootstrap. Use `ConsoleSpanExporter` or a minimal OTLP configurations to avoid bloated boilerplate.
2. **`metrics.service.ts`:** Do not write custom interceptors for global HTTP latency. Rely on the automated auto-scraping middleware provided by `PrometheusModule`. Use `MetricsService` only to define custom counters/histograms for downstream client dependencies.
3. **`health.controller.ts`:** Implement synchronously using `@nestjs/terminus`. Expose `GET /health` checking Redis and performing internal HTTP ping checks to `/mock-api/sales/ping` and `/mock-api/service/ping`.
* **Critical Rule:** Health check responses are purely for external scraper/monitoring visualization. **NEVER** use health check status inside the core business logic or cache layer to block requests—runtime protection is exclusively the responsibility of the Circuit Breaker.

## 3. Mandatory Testing Matrix

When generating test suites (`*.spec.ts`), you must achieve 100% logic coverage by ensuring the following edge cases are strictly validated:

1. **Happy Path:** Cache Misses → Parallel API requests succeed → Data merged, sorted, sliced correctly → Redis keys populated with appropriate dynamic TTLs.
2. **Cache Efficiency:** Cache Hits → Data pulled instantly from Redis → HTTP clients are never executed.
3. **Partial Outage Handling:** Sales API Client fails → System successfully responds with a `200 OK` status containing only Service API records accompanied by a warning log.
4. **Complete Outage Handling:** Both downstream clients fail simultaneously → System gracefully responds with an empty array `[]` rather than throwing an unhandled exception.
