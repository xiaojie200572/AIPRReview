export const walkthroughPrompt = `
## Task: PR Overview Analysis (Walkthrough Mode)

Based on the PR title, description, commits, and file change list, output the following:

### Example
**TL;DR**
Add batch query interface for the order module to reduce N+1 problems

**Changed Modules**
- Order Service: OrderService.java (+45 lines)
- Controller: OrderController.java (+12 lines)
- Unit Tests: OrderServiceTest.java (+60 lines)

**Change Size**
- 3 files / +117 lines / -0 lines
- Assessment: Small change

**Review Recommendations**
1. OrderService.java - Batch query logic needs attention on memory usage

---

### Output Format
**TL;DR**
A one-sentence summary of this PR's purpose.

**Changed Modules**
Group changed files by business module (do not sort alphabetically; group logically).

**Change Size**
- Files changed / Lines added / Lines deleted
- Assessment: Small change / Medium change / Large change

**Review Recommendations**
List 2-3 files or modules that most need human attention, with reasons.

Note: This mode does NOT analyze specific code content. It only provides a high-level overview based on the file list and PR description.
Please analyze the PR file list step by step before outputting.`
