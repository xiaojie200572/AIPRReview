export const reviewPrompt = `
## Task: Deep Code Review (Review Mode)

Perform a deep, file-by-file analysis of the following diff, focusing on:

### Mandatory Checklist
1. **Null pointer / null reference risk**: calling without null check
2. **Concurrency safety**: shared state, thread safety issues
3. **SQL injection / XSS**: unsanitized user input concatenated directly
4. **API compatibility**: parameter/return type changes in public interfaces
5. **Resource leaks**: unclosed files, connections, streams
6. **Logic errors**: boundary conditions, off-by-one, incorrect conditionals
7. **Dependency change risk**: compatibility issues from version upgrades

### Review Example
**src/main/java/com/example/UserService.java**
- 🔴 High L42 - User input directly concatenated into SQL query, injection risk
  → Use parameterized queries or PreparedStatement
- 🟡 Medium L78 - Frequent database calls in a loop, potential performance impact
  → Consider batch query

**src/main/java/com/example/OrderService.java**
- 🟢 Suggestion L15 - \`if (list.size() > 0)\` can be simplified to \`if (!list.isEmpty())\`

### Output Format
For each file with issues:

**filename**
- [Risk level] line number - Issue description
  → Suggestion (provide specific fix)

### Summary at End
**Overall Assessment**
- Merge recommendation: ✅ Approve / ⚠️ Changes requested / ❌ Do not merge
- Top 1-2 issues that need the most attention

Analyze each file of this PR one by one, think step by step before outputting.`
