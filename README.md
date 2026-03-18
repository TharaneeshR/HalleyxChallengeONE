

# 🚀 Halleyx Workflow Engine

A full-stack workflow automation system with **dynamic rule evaluation, multi-step execution, approvals, notifications, and audit logging**. 

---

## 🧱 Tech Stack

| Layer      | Technology                                |
| ---------- | ----------------------------------------- |
| Backend    | Java 17, Spring Boot 3.2, Spring Data JPA |
| Database   | MySQL 8.x                                 |
| Frontend   | React 18, Vite, Tailwind CSS              |
| Build Tool | Maven 3.9+, Node 18+                      |

---

## 📁 Project Structure

```bash
workflow-engine/
│
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/halleyx/workflow/
│       ├── WorkflowEngineApplication.java
│       ├── config/          # CORS, Jackson, DataSeeder
│       ├── controller/      # APIs (Workflow, Step, Rule, Execution)
│       ├── dto/             # Request/Response DTOs
│       ├── engine/          # RuleEngine, ExecutionEngine
│       ├── entity/          # DB Entities
│       ├── enums/           # StepType, ExecutionStatus
│       ├── exception/       # Global handlers
│       ├── repository/      # JPA Repositories
│       └── service/         # Business logic
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── components/
        │   ├── audit/
        │   ├── common/
        │   └── workflow/
        ├── execution/
        ├── services/
        ├── styles/
        └── utils/
```

---

## ⚙️ Prerequisites

* Java 17+
* Maven 3.9+
* MySQL 8.x (localhost:3306)
* Node.js 18+

---

## 🛠️ Setup & Run

### 1️⃣ Database Setup

```sql
mysql -u root -p
CREATE DATABASE workflow_db;
EXIT;
```

> Tables will be auto-created using JPA (`ddl-auto=update`)
> Sample workflows are auto-seeded on first run

---

### 2️⃣ Backend Setup

```bash
cd backend

# Configure DB in application.properties
spring.datasource.username=root
spring.datasource.password=your_password

./mvnw clean spring-boot:run
```

🔗 Backend URL:
👉 [http://localhost:8080](http://localhost:8080)

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

🔗 Frontend URL:
👉 [http://localhost:5173](http://localhost:5173)

> API requests are proxied to backend via Vite

---

## 🔗 API Reference

### 📌 Workflows

```http
POST   /api/workflows
GET    /api/workflows?search=&isActive=&page=&size=
GET    /api/workflows/{id}
PUT    /api/workflows/{id}
DELETE /api/workflows/{id}
```

---

### 📌 Steps

```http
POST   /api/workflows/{workflowId}/steps
GET    /api/workflows/{workflowId}/steps
PUT    /api/steps/{id}
DELETE /api/steps/{id}
```

---

### 📌 Rules

```http
POST   /api/steps/{stepId}/rules
GET    /api/steps/{stepId}/rules
PUT    /api/rules/{id}
DELETE /api/rules/{id}
```

---

### 📌 Executions

```http
POST   /api/workflows/{workflowId}/execute
GET    /api/executions/{id}
POST   /api/executions/{id}/cancel
POST   /api/executions/{id}/retry
GET    /api/executions?workflowId=&status=&page=&size=
```

---

## 🧠 Rule Engine

* Rules are evaluated **based on priority (lowest first)**
* Supports dynamic expressions and branching

### ✅ Supported Operators

| Type       | Operators                                  |   |   |
| ---------- | ------------------------------------------ | - | - |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=`           |   |   |
| Logical    | `&&`, `                                    |   | ` |
| String     | `contains()`, `startsWith()`, `endsWith()` |   |   |
| Special    | `DEFAULT`                                  |   |   |

---

### 🧾 Example Rules

```text
1. amount > 100 && country == 'US' && priority == 'High' → Finance Notification
2. amount <= 100 || department == 'HR'                  → CEO Approval
3. priority == 'Low' && country != 'US'                 → Task Rejection
4. DEFAULT                                              → Task Rejection
```

---

### ⚠️ Rule Notes

* `nextStepId = null` → Ends workflow
* Invalid rules → fallback to DEFAULT
* Loop detection → max 10 iterations

---

## 📊 Sample Workflows

### 💰 Expense Approval

**Input:**

* amount (number)
* country (string)
* department (optional)
* priority (High/Medium/Low)

**Flow:**

```
Manager Approval → Finance Notification → Task Completion
```

---

### 👨‍💼 Employee Onboarding

**Steps:**

1. HR Notification
2. IT Setup
3. Manager Approval (Engineering only)
4. Onboarding Complete

---

## 📜 Sample Execution Log

```json
{
  "step_name": "Manager Approval",
  "status": "completed",
  "duration_ms": 12,
  "selected_next_step": "Finance Notification"
}
```

---

## ⚙️ Configuration

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/workflow_db
spring.datasource.username=yourusername
spring.datasource.password=yourpassword

spring.jpa.hibernate.ddl-auto=update

app.rule-engine.max-loop-iterations=10

app.cors.allowed-origins=http://localhost:3000,http://localhost:5173
```

---

## 🖥️ UI Features

| Page             | URL                       | Description             |
| ---------------- | ------------------------- | ----------------------- |
| Workflow List    | `/workflows`              | Search, filter, execute |
| Workflow Editor  | `/workflows/{id}/edit`    | Manage steps & rules    |
| Execute Workflow | `/workflows/{id}/execute` | Run workflow            |
| Audit Logs       | `/audit`                  | Execution history       |

---

## ✅ Output Screenshots

<img width="500" height="500" alt="Screenshot 2026-03-18 115440" src="https://github.com/user-attachments/assets/4fbf9e9d-0376-46b6-850d-71f0bb274a84" />


---

## 🎯 Summary

This project demonstrates a **production-ready workflow engine** with:

* Scalable backend architecture
* Dynamic rule evaluation
* Real-time execution tracking
* Modern React UI

---

