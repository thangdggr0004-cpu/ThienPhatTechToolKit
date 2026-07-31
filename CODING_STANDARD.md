# Coding Standard

| Attribute | Value |
| :--- | :--- |
| **Document Name** | Coding Standard |
| **Version** | 1.0 |
| **Status** | ACTIVE |
| **Owner** | Project Architecture Authority |
| **Last Updated** | 2026-07-26 |

---

## 1. Overview

This document defines the coding standards for the Enterprise Windows Diagnostic Platform. Adherence to these standards is mandatory to ensure code quality, consistency, and maintainability.

## 2. Formatting

- **Tool:** Prettier is the source of truth for all formatting.
- **Configuration:** The configuration is defined in `.prettierrc` (or `package.json`).
- **Workflow:** All code must be formatted with Prettier before committing. Automated checks will enforce this.

## 3. Naming Conventions

- **Variables & Functions:** `camelCase`.
- **Classes & Components:** `PascalCase`.
- **Constants:** `UPPER_SNAKE_CASE`.
- **Interfaces & Types:** `PascalCase`, prefixed with `I` (e.g., `IActivationResult`).
- **Files:** `camelCase` or `PascalCase` depending on the content (e.g., `myComponent.tsx`, `MyClass.ts`).

## 4. JavaScript & TypeScript Best Practices

- **ESModules:** Use `import` and `export` statements. For CommonJS modules (`.cjs`), use `require` and `module.exports`.
- **`const` over `let`:** Use `const` by default. Only use `let` if a variable's value needs to be reassigned.
- **Arrow Functions:** Prefer arrow functions for their concise syntax and lexical `this` binding.
- **Strict Equality:** Use `===` and `!==` instead of `==` and `!=`.
- **Typing:** All new code should be strongly typed using TypeScript. Avoid `any` whenever possible. Use specific types.
- **Null & Undefined:** Use strict null checks (`--strictNullChecks`).

## 5. React Best Practices

- **Functional Components:** Use functional components with Hooks instead of class components.
- **Hooks:** Follow the Rules of Hooks.
- **Component Naming:** Component file names should be `PascalCase.tsx`.
- **Props:** Use TypeScript interfaces for prop types.

## 6. Asynchronous Code

- **`async/await`:** Prefer `async/await` over Promises for cleaner, more readable asynchronous code.
- **Error Handling:** Use `try...catch` blocks for error handling in `async` functions.

## 7. Comments

- **When to Comment:** Comment on the *why*, not the *what*. Code should be self-documenting.
- **JSDoc:** Use JSDoc for all public functions and classes to describe their purpose, parameters, and return values.

## 8. Linting

- **Tool:** ESLint is used for static analysis.
- **Configuration:** The rules are defined in `.eslintrc.json`.
- **Workflow:** All code must pass ESLint checks without any errors.

---
## Related Documents
- `PROJECT_CONSTITUTION.md`
- `QUALITY_GATE.md`
