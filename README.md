
# Unified Vehicle Document Viewer Backend (NestJS)

A production-ready NestJS (TypeScript) aggregator service designed based on the **API Gateway / Aggregator Pattern**. It provides a unified RESTful API to fetch, merge, sort, and paginate vehicle-related documents from two disconnected mock downstream systems (Sales System and Service System) via asynchronous parallel requests.

## 🚀 Key Architectural Features
- **Parallel Requests Execution:** Minimizes API latency by fetching data from downstream services concurrently.
- **Per-Source Caching Strategy:** Redis integration with granular TTLs (24h for static Sales data, 30m for dynamic Service data).
- **Resilience & Fault Tolerance:** Graceful degradation logic combined with an automated Circuit Breaker pattern using `opossum`.
- **Proactive Observability:** Structured JSON logging (via Pino), custom metrics (Prometheus), and distributed tracing ready (OpenTelemetry).
- **Self-Contained Mocking:** Integrated built-in mock endpoints with complete Swagger documentation for easy standalone evaluation.

---

## 🛠️ Prerequisites
Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher) & **npm**
- **Docker** & **Docker Compose** (for running Redis smoothly)

---

## 🏃 Getting Started

### 1. Clone & Install Dependencies
```bash
$ git clone https://github.com/NDBinhAn/The-Vehicle-Unified-Viewer

$ cd The-Vehicle-Unified-Viewer

$ npm install

```

### 2. Environment Configuration

Copy the sample environment file and adjust values if necessary:

```
$ cp .env.example .env

```

### 3. Spin Up Infrastructure (Redis)

Use Docker Compose to launch a lightweight Redis instance in the background:

```
$ docker compose up -d

```

### 4. Running the Application

```
# Development mode
$ npm run start:dev

# Production mode
$npm run build$ npm run start:prod

```

The application will start on `http://localhost:3000`.

* **Interactive API Documentation (Swagger UI):** Available at `http://localhost:3000/api/docs`

### API Quick Test with curl

```bash
# Get unified documents for a valid VIN
curl -X GET "http://localhost:3000/api/v1/vehicles/1HGCM82633A004352/documents?page=1&size=5"

# Example with invalid VIN to verify validation
curl -i -X GET "http://localhost:3000/api/v1/vehicles/invalid/documents"
```

## 🧪 Testing

The repository contains a robust suite of unit and integration tests that comprehensively validate the core business logic, including happy paths, cache hits, and graceful degradation scenarios.

```
# Run all unit tests
$ npm run test

# Run tests with coverage report
$ npm run test:cov

```

## 🤖 AI Collaboration Narrative

### 1. High-Level Strategy

Our collaboration was strictly guided by an architectural-first mindset, intentionally prioritizing systems design, component boundaries, and domain logic before generating a single line of production code. The workflow was divided into clear iterative stages:

1. **Scenario Brainstorming:** Breaking down requirements under the lens of backend engineering (Gateway patterns, concurrent I/O, data transformation).
2. **Edge-Case & Resilience Hardening:** Mapping out how to handle network timeouts and distributed failures gracefully without hurting client-side UX.
3. **Modular Refinement:** Challenging typical architectural over-engineering (e.g., rejecting an unnecessary persistent database and choosing explicit, clean class methods over convoluted decorators for specialized caching needs).

### 2. Verification and Refinement Process

To guarantee code correctness and reliability, every AI suggestion was systematically vetted through NestJS ecosystem standards (AOP paradigms, Type-Safe ConfigModule, and `@nestjs/terminus` guidelines). Output verification was performed by:

* Structuring strict API Contracts through DTOs using `class-validator` and Swagger decorators.
* Defining precise test assertions (such as verifying that a single downstream failure behaves as a `Warning` rather than a `500 Server Error`).

### 3. Quality Assurance

Final quality assurance was secured by constructing code that is completely self-contained. By embedding the Mock Controller directly into the framework, the codebase can be thoroughly evaluated out-of-the-box without depending on unstable external dependencies, while the automated Test Suite guarantees structural safety against regression.