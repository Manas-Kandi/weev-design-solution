---
trigger: model_decision
description: These guidelines are triggered whenever a TypeScript error, runtime issue, or linter warning arises in the AgentFlow project. They ensure fixes align with the project's strict type safety, modular architecture, and maintainability goals, as outlined
---

Comprehensive Guide: Common Errors and Best Practices for AgentFlow Development

---

#### **1. TypeScript Union Type Errors**
**Common Issue:**  
Accessing properties on `CanvasNode.data` without ensuring the property exists on all union members. For example, trying to access `node.data.title` when not all node types have a `title` property.

**Why It Happens:**  
The `CanvasNode.data` field is a union of multiple node data types (e.g., `AgentNodeData`, `KnowledgeBaseNodeData`, etc.), and not all types share the same properties.

**How to Resolve:**  
- Use **type guards** to check if the property exists before accessing it.
- Create helper functions like `getNodeTitle(node: CanvasNode): string` to centralize and safely access properties.

**Example Fix:**
```typescript
function getNodeTitle(node: CanvasNode): string {
  if (
    typeof node.data === "object" &&
    node.data !== null &&
    "title" in node.data &&
    typeof (node.data as { title?: unknown }).title === "string"
  ) {
    return (node.data as { title: string }).title;
  }
  return node.id; // Fallback to node ID
}
```

**Best Practice:**  
- Always use type guards or helper functions when accessing properties on union types.
- Avoid direct property access unless you are certain the property exists.

---

#### **2. State Updates and Partial Data**
**Common Issue:**  
Updating node data in property panels without ensuring all required fields are preserved. For example, overwriting `node.data` with partial updates, causing missing fields.

**Why It Happens:**  
State updates like `onChange({ ...node, data: { ...node.data, [field]: value } })` can unintentionally remove fields if not all fields are included in the update.

**How to Resolve:**  
- Always spread the existing `node.data` and include all required fields in the update.
- Use type-safe interfaces and helper functions to ensure updates are complete.

**Example Fix:**
```typescript
const handleFieldChange = (field: keyof AgentNodeData, value: unknown) => {
  const updatedData: AgentNodeData = {
    ...node.data,
    [field]: value,
    // Ensure all required fields are preserved
    name: node.data.name || "",
    role: node.data.role || "",
  };
  onChange({ ...node, data: updatedData });
};
```

**Best Practice:**  
- Always spread the existing `node.data` when updating state.
- Use type-safe interfaces to ensure all required fields are included.

---

#### **3. Implicit `any` and Incorrect Event Handler Types**
**Common Issue:**  
Using implicit `any` for event handlers or failing to type event parameters correctly.

**Why It Happens:**  
React event handlers like `onChange` or `onClick` require specific types, but developers often omit them, leading to implicit `any`.

**How to Resolve:**  
- Explicitly type event handler parameters using React's built-in types (e.g., `React.ChangeEvent<HTMLInputElement>`).

**Example Fix:**
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

**Best Practice:**  
- Always type event handler parameters explicitly.
- Use `React.ChangeEvent` or `React.MouseEvent` as appropriate.

---

#### **4. Unused Imports and Variables**
**Common Issue:**  
Leaving unused imports or variables in the code, leading to clutter and potential confusion.

**Why It Happens:**  
During development, imports and variables are added but not removed when no longer needed.

**How to Resolve:**  
- Use a linter (e.g., ESLint) to automatically detect and remove unused imports and variables.
- Regularly review and clean up the codebase.

**Example Fix:**
```typescript
// Remove unused imports
import { UnusedComponent } from "@/components/UnusedComponent"; // Remove this line
```

**Best Practice:**  
- Enable ESLint rules for detecting unused imports and variables.
- Regularly review and clean up the codebase.

---

#### **5. Incorrect or Missing Imports**
**Common Issue:**  
Importing components or utilities from incorrect paths or forgetting to import required modules.

**Why It Happens:**  
Refactoring or moving files can break import paths, and missing imports can occur when adding new functionality.

**How to Resolve:**  
- Use absolute imports or aliases (e.g., `@/components/...`) to avoid path issues.
- Use TypeScript's auto-import feature in your IDE to ensure correct imports.

**Example Fix:**
```typescript
// Correct import
import { Input } from "@/components/ui/input"; // Use absolute path
```

**Best Practice:**  
- Use absolute imports or aliases for consistency.
- Regularly test and verify imports after refactoring.

---

#### **6. Missing Type Guards for Conditional Logic**
**Common Issue:**  
Failing to use type guards for conditional logic, leading to runtime errors when accessing properties on incompatible types.

**Why It Happens:**  
Developers assume certain properties exist without verifying the type.

**How to Resolve:**  
- Use type guards to verify the type before accessing properties.
- Create reusable type guard functions for common checks.

**Example Fix:**
```typescript
function isAgentNodeData(data: unknown): data is AgentNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    "name" in data &&
    "role" in data
  );
}
```

**Best Practice:**  
- Always use type guards for conditional logic.
- Create reusable type guard functions for common checks.

---

#### **7. Overwriting State Instead of Updating**
**Common Issue:**  
Overwriting state arrays or objects instead of updating them immutably.

**Why It Happens:**  
Developers may directly modify state or overwrite it without preserving existing values.

**How to Resolve:**  
- Use immutable updates with the spread operator or utility functions like `map` or `filter`.

**Example Fix:**
```typescript
const handleAddState = () => {
  setStates((prev) => [...prev, "newState"]);
};
```

**Best Practice:**  
- Always update state immutably.
- Use utility functions like `map`, `filter`, or `reduce` for complex updates.

---

#### **8. Missing Unit Tests**
**Common Issue:**  
Failing to add unit tests for new components or functionality, leading to regressions.

**Why It Happens:**  
Developers may prioritize feature development over testing.

**How to Resolve:**  
- Add unit tests for all new components and functionality.
- Use testing libraries like Jest and React Testing Library.

**Example Fix:**
```typescript
test("renders AgentPropertiesPanel with default values", () => {
  const { getByPlaceholderText } = render(
    <AgentPropertiesPanel node={mockNode} onChange={jest.fn()} />
  );
  expect(getByPlaceholderText("Agent Name")).toBeInTheDocument();
});
```

**Best Practice:**  
- Write unit tests for all new components and functionality.
- Use Jest and React Testing Library for testing React components.

---

#### **9. Hardcoding Values Instead of Using Constants**
**Common Issue:**  
Hardcoding values like colors, labels, or IDs instead of using constants or enums.

**Why It Happens:**  
Developers may hardcode values for simplicity during development.

**How to Resolve:**  
- Use constants or enums for reusable values.
- Store constants in a dedicated file (e.g., `constants.ts`).

**Example Fix:**
```typescript
// constants.ts
export const DEFAULT_COLOR = "#0066cc";

// Usage
const color = DEFAULT_COLOR;
```

**Best Practice:**  
- Use constants or enums for reusable values.
- Store constants in a dedicated file for easy maintenance.

---

#### **10. Lack of Documentation and Comments**
**Common Issue:**  
Failing to document complex logic or provide comments for non-obvious code.

**Why It Happens:**  
Developers may assume the code is self-explanatory or forget to add comments.

**How to Resolve:**  
- Add comments for complex logic or non-obvious code.
- Use JSDoc for documenting functions and components.

**Example Fix:**
```typescript
/**
 * Retrieves the title of a node.
 * Falls back to the node ID if no title is available.
 */
function getNodeTitle(node: CanvasNode): string {
  // ...
}
```

**Best Practice:**  
- Add comments for complex logic or non-obvious code.
- Use JSDoc for documenting functions and components.

---

### Summary of Best Practices

1. **Use Type Guards:** Always verify types before accessing properties.
2. **Preserve State:** Ensure all required fields are included in state updates.
3. **Type Event Handlers:** Explicitly type all event handler parameters.
4. **Clean Up Code:** Remove unused imports and variables regularly.
5. **Verify Imports:** Use absolute imports or aliases to avoid path issues.
6. **Write Unit Tests:** Add tests for all new components and functionality.
7. **Use Constants:** Avoid hardcoding values; use constants or enums.
8. **Document Code:** Add comments and JSDoc for complex logic and functions.

By following these best practices, you can ensure a maintainable, error-free codebase that aligns with the AgentFlow project specifications. Let me know if you'd like me to help implement any of these practices further!