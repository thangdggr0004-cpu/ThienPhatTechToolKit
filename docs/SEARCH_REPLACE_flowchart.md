# SEARCH/REPLACE Block Workflow

```mermaid
flowchart TD
    A[Start] --> B{Need to edit file?}
    B -->|Yes| C{File in chat?}
    C -->|No| D[Ask user to add file]
    C -->|Yes| E[Create SEARCH/REPLACE block]
    E --> F{Multiple changes?}
    F -->|Yes| G[Make multiple blocks]
    F -->|No| H[Single block]
    H --> I[Verify exact match]
    I --> J[Include minimal context]
    J --> K[Keep blocks concise]
    K --> L[Test with real file content]
    L --> M{Match found?}
    M -->|No| N[Adjust SEARCH lines]
    M -->|Yes| O[Apply changes]
    B -->|No| P[Suggest commands if needed]
    D --> Q[Wait for file]
    Q --> E
    O --> R[End]
```
## Key Rules
1. Always verify exact line matches including whitespace
2. One block per logical change
3. Never include unchanged lines in blocks
4. Use shell commands for file operations
5. New files get empty SEARCH section
