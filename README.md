# Halleyx Workflow Engine

A full-stack workflow automation system with dynamic rule evaluation, multi-step execution, approvals, notifications, and audit logging.

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Java 17, Spring Boot 3.2, Spring Data JPA |
| Database  | MySQL 8.x                               |
| Frontend  | React 18, Vite, Tailwind CSS            |
| Build     | Maven 3.9+, Node 18+                   |

---

## Project Structure

```
workflow-engine/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/halleyx/workflow/
│       ├── WorkflowEngineApplication.java
│       ├── config/          # CORS, Jackson, DataSeeder
│       ├── controller/      # WorkflowController, StepController, RuleController, ExecutionController
│       ├── dto/             # Request/Response DTOs, PageResponse
│       ├── engine/          # RuleEngine, WorkflowExecutionEngine
│       ├── entity/          # Workflow, Step, Rule, Execution
│       ├── enums/           # StepType, ExecutionStatus
│       ├── exception/       # GlobalExceptionHandler, custom exceptions
│       ├── repository/      # JPA repositories
│       └── service/         # Service interfaces + impl
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── audit/        # AuditLog, ExecutionLogsModal
        │   ├── common/       # Layout, Toast, Modal, Badge, Spinner
        │   └── workflow/     # WorkflowList, WorkflowEditor, StepFormModal, RuleEditor
        ├── execution/        # WorkflowExecute
        ├── services/         # api.js (Axios)
        ├── styles/           # index.css
        └── utils/            # helpers.js
```

---

## Prerequisites

- Java 17+
- Maven 3.9+
- MySQL 8.x (running on localhost:3306)
- Node.js 18+ and npm

---

## Setup & Run

### 1. Database

```bash
mysql -u root -p
CREATE DATABASE workflow_db;
EXIT;
```

> The app will auto-create tables via `spring.jpa.hibernate.ddl-auto=update`.  
> Two sample workflows are seeded automatically on first run.

### 2. Backend

```bash
cd backend

# Configure DB credentials in src/main/resources/application.properties
# spring.datasource.username=root
# spring.datasource.password=your_password

./mvnw clean spring-boot:run
```

Backend starts on **http://localhost:8080**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on **http://localhost:5173**  
API calls are proxied to `localhost:8080` via Vite proxy config.

---

## API Reference

### Workflows
```
POST   /api/workflows                     Create workflow
GET    /api/workflows?search=&isActive=&page=&size=   List (paginated)
GET    /api/workflows/:id                 Get with steps & rules
PUT    /api/workflows/:id                 Update (increments version)
DELETE /api/workflows/:id                 Delete
```

### Steps
```
POST   /api/workflows/:workflowId/steps   Add step
GET    /api/workflows/:workflowId/steps   List steps
PUT    /api/steps/:id                     Update step
DELETE /api/steps/:id                     Delete step
```

### Rules
```
POST   /api/steps/:stepId/rules           Add rule
GET    /api/steps/:stepId/rules           List rules
PUT    /api/rules/:id                     Update rule
DELETE /api/rules/:id                     Delete rule
```

### Executions
```
POST   /api/workflows/:workflowId/execute  Start execution
GET    /api/executions/:id                 Get status & logs
POST   /api/executions/:id/cancel          Cancel
POST   /api/executions/:id/retry           Retry failed step
GET    /api/executions?workflowId=&status=&page=&size=  List (audit log)
```

---

## Rule Engine

Rules are evaluated per step in **priority order** (lowest = first).

### Supported Operators

| Type       | Operators / Functions                                  |
|------------|--------------------------------------------------------|
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=`                      |
| Logical    | `&&` (AND), `\|\|` (OR)                               |
| String     | `contains(field, "val")`, `startsWith(...)`, `endsWith(...)` |
| Special    | `DEFAULT` — catches all unmatched conditions           |

### Example Rules

```
Priority 1: amount > 100 && country == 'US' && priority == 'High'  → Finance Notification
Priority 2: amount <= 100 || department == 'HR'                    → CEO Approval
Priority 3: priority == 'Low' && country != 'US'                   → Task Rejection
Priority 4: DEFAULT                                                → Task Rejection
```

- `nextStepId = null` means **end the workflow**
- Invalid rule expressions log an error and fall through to DEFAULT
- Loop detection: steps are tracked; if any step is visited more than `app.rule-engine.max-loop-iterations` (default: 10) times, execution fails

---

## Sample Workflows (Auto-Seeded)

### 1. Expense Approval

**Input Schema:** `amount` (number, required), `country` (string, required), `department` (string, optional), `priority` (High|Medium|Low, required)

**Steps:**
1. Manager Approval *(approval)*
2. Finance Notification *(notification)*
3. CEO Approval *(approval)*
4. Task Rejection *(task)*
5. Task Completion *(task)*

**Sample Execution Input:**
```json
{
  "amount": 250,
  "country": "US",
  "department": "Finance",
  "priority": "High"
}
```

**Expected path:** Manager Approval → Finance Notification → Task Completion

---

### 2. Employee Onboarding

**Input Schema:** `employee_name`, `department`, `role`, `start_date`

**Steps:**
1. HR Notification *(notification)*
2. IT Setup Task *(task)*
3. Manager Approval *(approval)* — only for Engineering dept
4. Onboarding Complete *(task)*

---

## Sample Execution Log

```json
[
  {
    "step_name": "Manager Approval",
    "step_type": "approval",
    "evaluated_rules": [
      {"rule": "amount > 100 && country == 'US' && priority == 'High'", "result": true},
      {"rule": "amount <= 100 || department == 'HR'", "result": false}
    ],
    "selected_next_step": "Finance Notification",
    "status": "completed",
    "duration_ms": 12,
    "started_at": "2026-03-16T10:00:00",
    "ended_at": "2026-03-16T10:00:00.012"
  },
  {
    "step_name": "Finance Notification",
    "step_type": "notification",
    "evaluated_rules": [
      {"rule": "amount > 500", "result": false},
      {"rule": "DEFAULT", "result": true}
    ],
    "selected_next_step": "Task Completion",
    "status": "completed",
    "duration_ms": 5
  }
]
```

---

## Configuration

Key properties in `application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/workflow_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root

# JPA - creates/updates tables automatically
spring.jpa.hibernate.ddl-auto=update

# Rule engine - max times a step can be visited (loop guard)
app.rule-engine.max-loop-iterations=10

# CORS - add your frontend origin
app.cors.allowed-origins=http://localhost:3000,http://localhost:5173
```

---

## UI Features

| Page | URL | Description |
|------|-----|-------------|
| Workflow List | `/workflows` | Search, filter, paginate; Create/Edit/Execute |
| Workflow Editor | `/workflows/:id/edit` | Steps, rules, schema, start step |
| Execute Workflow | `/workflows/:id/execute` | Input form, live status, step logs |
| Audit Log | `/audit` | All executions, stats, cancel/retry, log viewer |

---

## Evaluation Checklist

- [x] **Backend APIs** — CRUD for workflows, steps, rules + execution endpoints
- [x] **Rule Engine** — Dynamic expression evaluation, priority ordering, DEFAULT fallback, loop guard
- [x] **Workflow Execution** — Async step execution, rule evaluation logs, cancel, retry
- [x] **Frontend UI** — Workflow editor, step/rule editor with drag-reorder, live execution view, audit log
- [x] **Code Quality** — Layered architecture (Controller → Service → Repository), DTOs, exception handling
- [x] **Documentation** — This README + inline code comments
- [x] **Sample Workflows** — 2 seeded automatically on first run
- [x] **Bonus** — Loop detection, branching support, drag-and-drop rule priority, live execution polling
