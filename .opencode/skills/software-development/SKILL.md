---
name: software-development
description: Software engineering best practices covering clean code (SOLID, DRY, KISS, YAGNI), system architecture (Clean Architecture, Hexagonal, DDD, microservices), CI/CD, testing strategies, security (DevSecOps), and modern development workflows.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  domain: software-engineering
---

## What I do

### Clean Code Principles
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY** (Don't Repeat Yourself): every piece of knowledge has a single authoritative representation
- **KISS** (Keep It Simple, Stupid): avoid over-engineering, solve today's problem not tomorrow's maybe
- **YAGNI** (You Ain't Gonna Need It): don't add functionality until it's needed
- Write code for **humans first** — clarity over cleverness, meaningful names, consistent style
- Functions should do **one thing** and be small enough to reason about
- Self-documenting code: good naming > comments; use comments only for "why", not "what"

### System Architecture
- **Separation of Concerns**: each module/component has a clear, limited responsibility
- **Encapsulation via stable contracts**: expose interfaces, hide implementation details
- **Dependency Inversion**: core business logic should not depend on frameworks, databases, or external services
- **Loose Coupling, High Cohesion**: components should be independently changeable, internally focused
- **Clean Architecture** / **Hexagonal Architecture**: dependencies point inward (Domain → Application → Infrastructure)
- **DDD (Domain-Driven Design)**: model complex business domains with Entities, Value Objects, Aggregates, Repositories
- Prefer **composable modular monoliths** over premature microservices — split only when team/scale demands it
- Use **Feature-Sliced Design** for organizing codebases: group by feature, not by file type

### Testing Strategy
- **Testing Pyramid**: heavy investment in unit tests (fast, cheap), fewer integration tests, minimal E2E tests
- Unit tests: one behavior per test, cover success + failure paths, aim for high coverage
- Integration tests: verify boundaries between modules, database, external APIs
- E2E tests: critical user journeys only — slow and expensive, use sparingly
- Use **TDD** for complex logic: Red → Green → Refactor
- Run tests in CI on every commit, block merges on test failures

### CI/CD & DevOps
- **Continuous Integration**: every commit triggers automated build + tests + static analysis
- **Continuous Delivery**: software always in a releasable state
- **Continuous Deployment**: passing builds auto-deploy to production (if appropriate for risk profile)
- Infrastructure as Code (IaC): Terraform, Pulumi, or CloudFormation for reproducible environments
- Maintain staging and production environments with parity
- Pre-commit hooks for linting, formatting, and basic checks

### Version Control & Collaboration
- Meaningful commit messages: conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`)
- Feature branches with short-lived branches, rebase before merge
- **Code reviews**: every PR reviewed by at least one other developer
- Document architecture decisions with **ADR** (Architecture Decision Records)

### Security (DevSecOps)
- Shift security left — integrate SAST/DAST/SCA into CI/CD pipeline
- OWASP Top 10 awareness: broken access control, injection, XSS, insecure deserialization, etc.
- Zero-trust model: validate every input, authenticate every request, least privilege for all services
- Generate and review **SBOM** (Software Bill of Materials) for supply chain security
- No hardcoded secrets — use vaults or environment variables
- Validate user inputs, prefer parameterized queries, use secure authentication (OAuth 2.0, Passkeys)

### Error Handling & Observability
- Fail gracefully: never expose stack traces to users, use structured error responses
- **Observability** is architecture: logging (structured), metrics (latency, error rate, throughput), tracing (distributed)
- Design for failure: retries with backoff, circuit breakers, graceful degradation, bulkheads
- Use health check endpoints (`/health`, `/ready`) for orchestration

### Refactoring & Technical Debt
- **Boy Scout Rule**: leave code cleaner than you found it
- Refactor regularly as part of normal development, not as a separate project
- When touching old code, improve it incrementally
- Pay down technical debt consciously — track it, prioritize it, allocate time each sprint (10-20%)
