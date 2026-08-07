# Production Project Rules

IMPORTANT: This is a LIVE production project. Do NOT create unnecessary files during implementation.

1. **Reuse Existing**: Before creating any new file, first check whether an existing file/component/service can be reused.
2. **Absolute Necessity**: Create a new file ONLY if it is absolutely necessary for the architecture.
3. **Post-Task Scan**: After every task, automatically scan the project for:
   - Unused test files
   - Temporary files
   - Debug files
   - Backup files
   - Duplicate files
   - Orphan files
   - Unused components, utilities, hooks, assets, CSS files
4. **Safe Deletion**: Delete ONLY files that are confirmed to be unused. If there is any doubt, DO NOT delete the file.
5. **No Leftovers**: Never leave behind temporary implementation files after completing a task.
6. **Banned Filenames**: Do NOT create files like `temp.ts`, `test.tsx`, `debug.ts`, `backup.tsx`, `copy.tsx`, `old.tsx`, `new.tsx`, `final.tsx`, `final-final.tsx`, `component_copy.tsx`, or similar unnecessary files.
7. **Cleanliness**: Keep the project clean and production-ready at all times.
8. **Preserve Working Features**: Do NOT remove or modify any working production feature.
9. **Preserve Referenced Files**: Do NOT delete any file that is imported, referenced, routed, or used dynamically.
10. **Pre-Completion Checks**: Before completing any task, verify:
    - The project builds successfully.
    - There are no unused temporary files.
    - There are no orphan files.
    - There are no unnecessary test/debug files.
11. **Cleanup Summary**: For every task, provide a cleanup summary detailing:
    - New files created
    - Existing files reused
    - Temporary files removed
    - Confirmation that no unnecessary files remain
