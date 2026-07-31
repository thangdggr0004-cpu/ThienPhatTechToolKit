# AGENT STANDARD OPERATING PROCEDURE (SOP)
## ThienPhatTechToolKit - Enterprise Windows Diagnostic Platform

| Attribute | Value |
| :--- | :--- |
| **Document Name** | Agent Standard Operating Procedure |
| **Version** | 1.1 |
| **Status** | ACTIVE |
| **Last Updated** | 2026-07-26 |

---

### Mission

Your mission is to continue the development of the **Enterprise Windows Diagnostic Platform** by adhering strictly to its established architecture, workflows, and quality standards. You will function as an expert enterprise developer, ensuring every change is precise, tested, compliant, and contributes to the project's living documentation.

---

### 1. Project Context Recovery

**Objective:** Achieve full project context before any action. This is the first step in every session.

1.  **Read Project State:** Read `PROJECT_STATE.md` to get the immediate, high-level status of the project.
2.  **Read Core Documentation:** Read the following documents in their entirety to understand the project's foundational principles:
    *   `PROJECT_CONSTITUTION.md`: The highest authority on rules and principles.
    *   `ARCHITECTURE.md`: The blueprint for the system's structure and data flow.
    *   `ROADMAP.md`: The development stages.
    *   `PHASE_STATUS.md`: The lock status of completed phases.
    *   `CODING_STANDARD.md`: Rules for code style and structure.
    *   `QUALITY_GATE.md`: Criteria for code acceptance.
3.  **Review Package Manifest:** Read `package.json` to understand project scripts, dependencies, and build configuration.

---

### 2. Current Phase Recovery

**Objective:** Identify the project's current development state from the source of truth.

1.  **Analyze `ROADMAP.md` & `PHASE_STATUS.md`:** Cross-reference these documents to determine which phases are `LOCKED` (feature-frozen) and which is the `NEXT` active phase.
2.  **Verify with `PROJECT_STATE.md`:** Ensure the phase identified matches the `Current Phase` in `PROJECT_STATE.md`. If there is a conflict, the detailed documents (`ROADMAP.md`, `PHASE_STATUS.md`) are the source of truth.

---

### 3. Architecture Recovery

**Objective:** Internalize the system's immutable architectural design.

1.  **Core Principles:** The architecture is a **3-Layer system** (Frontend, Backend, Core Logic) based on **Clean Architecture** and **SOLID** principles. The dependency flow is always inwards.
2.  **Data Pipeline:** All diagnostics follow a strict, non-negotiable data pipeline: `Collector` → `Evidence Matrix` → `Evidence Correlation` → `Decision` → `Confidence` → `Assessment` → `Recommendation`.
3.  **Immutability:**
    *   **Locked Modules:** Modules corresponding to `LOCKED` phases are feature-frozen. Only rigorously reviewed bug fixes are permitted.
    *   **Public Contract:** The API exposed via `preload.js` is immutable.

---

### 4. Development Rules

- **Primacy of the Constitution:** All actions must comply with `PROJECT_CONSTITUTION.md`.
- **Minimal Change:** Prefer the smallest possible change to fulfill a request. Do not refactor code for stylistic preference.
- **No Architectural Deviation:** Do not introduce changes that violate the established data pipeline or dependency rules.
- **Data-Driven Logic:** Business logic must be driven by external configuration files.

---

### 5. Implementation Loop

1.  **Analyze Request:** Understand the user's goal within the context of the current project phase.
2.  **Formulate Plan:** Propose a specific, minimal-impact plan.
3.  **Await Approval:** Do not proceed until the plan is approved.
4.  **Execute Change:** Implement the change, adhering to `CODING_STANDARD.md`.
5.  **Add Tests:** All new logic requires corresponding unit tests.
6.  **Complete Task & Synchronize State:** After successful validation, proceed to **Protocol: Living Documentation & State Synchronization**.

---

### 6. Build Loop

**Objective:** Ensure code health and integration integrity after every change.

Execute in sequence. If any step fails, **stop, read the log, fix the error, and restart the loop.**

1.  **Install Dependencies:** `npm install`
2.  **Lint & Type Check:** `npm run lint`
3.  **Build Application:** `npm run electron:build`
4.  **Run Tests:** Report as `NOT AVAILABLE` if no specific tests are requested.

---

### 7. Protocol: Living Documentation & State Synchronization

**Objective:** Ensure all project documentation is a precise, up-to-date reflection of the project's state. This protocol is mandatory after every successfully completed and validated task.

1.  **Update `PROJECT_STATE.md`:** This is the first and most critical step. Update all fields to reflect the outcome of the completed task.
    *   `Current Version`
    *   `Current Phase`
    *   `Current Objective`
    *   `Last Completed Task`
    *   `Current Working Task` (set to the next objective)
    *   `Next Planned Task`
    *   `Current Certification Status`
    *   `Last Update Time`
2.  **Update Core Documents (if necessary):** Based on the changes made, update the following:
    *   **`PHASE_STATUS.md`**: If a new phase is completed and locked.
    *   **`ROADMAP.md`**: If the project's long-term plan is altered.
    *   **`PROJECT_CONSTITUTION.md`**: If a new, permanent architectural decision is made.
    *   **`ARCHITECTURE.md`**: If the system's structure or data flow is formally changed.
    *   **`AGENT_START.md`**: If this workflow itself is improved or changed.
3.  **Ensure Consistency:** Verify that all updated documents are consistent and do not contradict each other.

---

### 8. Final Report & Certification

1.  **Reporting:** When reporting completion, provide a concise summary based on the final, updated `PROJECT_STATE.md`.
2.  **Certification:** Declare the work **`PROJECT CERTIFIED`** only if **ALL** of the following are true:
    *   The entire Build Loop passes.
    *   Runtime Validation passes.
    *   Architecture Audit passes.
    *   No rules from `PROJECT_CONSTITUTION.md` were violated.
    *   **All documentation has been successfully synchronized.**

---

### Agent Behaviour Rules

- **Always start with `PROJECT_STATE.md`.**
- **Always follow the full documented workflow.**
- **Never break the established architecture.**
- **Always build, validate, and test after a change.**
- **Always read logs to self-correct errors.**
- **ALWAYS SYNCHRONIZE DOCUMENTATION after every task.**
