## Brief overview
Guidelines for CONSTRUSMART ERP development: incremental refactoring of a React/Zustand/Supabase construction management app, emphasizing global project context, offline-first architecture, and comprehensive documentation before implementation.

## Communication style
- Default language: Spanish
- Concise, technical responses without filler
- No conversational closing questions or offers for further assistance
- Present final results directly, not as questions

## Architecture principles
- Projects module is the central hub; all project-related screens inherit `currentProjectId` from global store
- Offline-first: mutation queue + localStorage + forceSync to Supabase
- State management: Zustand store + React Context (ErpProvider)
- Validation: Zod schemas for all forms and storage
- Lazy loading for all screens/components

## Migration pattern
- Introduce global context first (`currentProjectId`, `currentProject`)
- Migrate one module at a time as proof-of-concept (Hitos → Riesgos → Seguimiento)
- Each migrated module replaces local `selectedProyectoId` with `currentProjectId`
- Update Header to show active project, Sidebar to clear context when returning to hub

## Documentation requirements
- Create analysis docs before code changes: `docs/ANALISIS_ARQUITECTONICO_INTEGRAL.md`
- Maintain tracking: `docs/IMPLEMENTATION_TRACKING.md` with real progress
- Document refactor plans: `docs/PROYECTOS_MODULE_REFACTOR_PLAN.md`

## Validation gate
After each change run: `npm run typecheck && npm run lint && npm test -- --run && npm run build`
- Zero TypeScript errors
- Zero lint errors (warnings acceptable if unavoidable)
- All tests pass
- Build succeeds

## CI/CD standards
- GitHub Actions workflow must be non-blocking
- Vercel deploy conditional on secrets/project existence
- Never fail pipeline due to missing external service configuration

## Code style
- No comments in production code (`//` or `/* */`)
- No dead code; remove unused files immediately
- Props strictly typed with TypeScript interfaces
- Use `ui.ts` constants for repeated Tailwind classes
- Arabic numerals, no locale-specific formatting in code