// =============================================================================
// DATA BARREL
// Single import surface for mock data across the app: `import { STUDENTS } from "@/data"`.
// When a real backend replaces this, only this barrel (and the generators
// behind it) need to change — consuming components/hooks stay identical.
// =============================================================================

export * from "./mockCore";
export * from "./mockAuth";
export * from "./mockengagement";
export * from "./seedHelpers";
export * from "./mockLMS";
export * from "./mockQuizzes";
export * from "./Mockassignments";
export * from "./mockExams";
export * from "./mockdashboard";
