
# ARCHITECTURAL STRUCTURE & CODING GUIDELINES

**Target Framework:** NestJS (v10+) with TypeScript

**Design Pattern:** API Gateway / Aggregator Pattern (Self-Contained Mocking)

## 1. Directory Tree & File Mapping

```
src/
├── app.module.ts                      # Root application module
├── main.ts                            # App entrypoint (Swagger setup, Global Pipes, Pino Logger)
│
├── common/                            # REUSABLE INFRASTRUCTURE LAYER
│   ├── common.module.ts
│   ├── cache/
│   │   ├── custom-cache.service.ts    # Redis wrapper (Dynamic getOrSet with custom TTLs)
│   │   └── custom-cache.service.spec.ts
│   ├── resilience/
│   │   ├── circuit-breaker.service.ts # Opossum wrapper for safe downstream execution
│   │   └── circuit-breaker.service.spec.ts
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
└── mock-external/                     # EMBEDDED DOWNSTREAM MOCKS (Self-contained Testing)
    ├── mock-external.module.ts
    ├── sales-mock.controller.ts       # Endpoint: GET /mock-api/sales/:vin
    └── service-mock.controller.ts     # Endpoint: GET /mock-api/service/:vin

```

## 2. Core Implementation Requirements & Rationale (For AI Generation)

Dear AI, when implementing files from the structure above, you **MUST** strictly adhere to the following architectural constraints and rationales:

### 💡 Requirement 1: Explicit Caching Service (No Decorators)

* **File:** `src/common/cache/custom-cache.service.ts`
* **How to code:** Implement `CustomCacheService` as an injectable class wrapping `ioredis`. Provide a generic method `getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number): Promise<T>`.
* **Rationale:** We are dealing with two separate downstream sources requiring different cache lifetimes (**Sales Cache: 24 Hours TTL**, **Service Cache: 30 Minutes TTL**). Do not use global method decorators; call this service explicitly in the orchestrator layer to ensure fine-grained concurrency control and transparent debugging.

### 💡 Requirement 2: Resilient Client Isolations via Circuit Breaker

* **Files:** `src/core/vehicle-document/clients/*-api.client.ts`
* **How to code:** Wrap all Axios HTTP calls inside `src/common/resilience/circuit-breaker.service.ts` (using the `opossum` library). Configure defensive `timeouts` (default 3000ms) and error thresholds via the `ConfigService`.
* **Rationale:** External network dependencies are untrusted. Isolating them into dedicated clients protected by independent Circuit Breakers prevents a failure in one system (e.g., Service API 500 Error or Timeout) from cascading and blocking the entire gateway thread pool.

### 💡 Requirement 3: Graceful Degradation over Hard Failures

* **File:** `src/core/vehicle-document/services/vehicle-document.service.ts`
* **How to code:** When fetching data parallelly via `Promise.all`, wrap each client call or cache-lookup in an individual `try-catch` block. If one client fails or trips its circuit breaker, catch the error, log it as a **Warning**, and proceed with an empty array `[]` for that specific source while safely merging data from the healthy source.
* **Rationale:** High Availability (HA) mindset. Showing partial data (e.g., displaying only vehicle sales details because the maintenance workshop system is down) delivers a vastly superior user experience compared to serving a generic `500 Internal Server Error`.

### 💡 Requirement 4: Stateless In-Memory Sorting & Slicing

* **File:** `src/common/utils/pagination.util.ts`
* **How to code:** Write pure, deterministic, side-effect-free functions that accept raw unified document arrays alongside pagination DTOs, returning the sorted and sliced subsets.
* **Rationale:** Since the mock downstream sources are independent databases without a shared central index, pagination and chronological sorting (latest-to-oldest `timestamp`) must occur at the **Application Layer**. Keeping these functions pure isolates core manipulation algorithms from I/O operations, ensuring optimal CPU execution speed and making them highly unit-testable.

### 💡 Requirement 5: Independent Self-Contained Mocks

* **Files:** `src/mock-external/*-mock.controller.ts`
* **How to code:** Build functional standalone REST endpoints simulating the external systems. Decorate them fully with `@nestjs/swagger` tags so they automatically display in the documentation.
* **Rationale:** The system must run flawlessly out-of-the-box. Embedding mocks directly inside a separated module enables the application to be completely self-sufficient (`npm run start` works instantly without setting up standalone mock servers like WireMock).

## 3. Mandatory Testing Matrix

When generating test suites (`*.spec.ts`), you must achieve 100% logic coverage by ensuring the following edge cases are strictly validated:

1. **Happy Path:** Cache Misses → Parallel API requests succeed → Data merged, sorted, sliced correctly → Redis keys populated with appropriate dynamic TTLs.
2. **Cache Efficiency:** Cache Hits → Data pulled instantly from Redis → HTTP clients are never executed.
3. **Partial Outage Handling:** Sales API Client fails → System successfully responds with a `200 OK` status containing only Service API records accompanied by a warning log.
4. **Complete Outage Handling:** Both downstream clients fail simultaneously → System gracefully responds with an empty array `[]` rather than throwing an unhandled exception.

