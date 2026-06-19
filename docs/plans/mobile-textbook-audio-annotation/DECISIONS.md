# Mobile Textbook Audio And Annotation Decisions

## Decisions

| Date | Decision | Reason | Alternatives Considered |
|---|---|---|---|
| 2026-05-30 | Keep the textbook reader image-based for this pass. | Web already uses R2 page images; this avoids PDF rendering complexity and keeps parity. | Native PDF rendering, PDF.js, custom PDF canvas. |
| 2026-05-30 | Use `manifest.json` as the source of truth for audio and transcript. | The manifest already has `pageAudio`, `transcripts`, and R2 asset paths. | Add new API or database tables immediately. |
| 2026-05-30 | Implement Phase 1 annotation with React Native overlay views. | Works in Expo Go and can support highlight/underline/note without native build setup. | React Native Skia now, native PencilKit/PaperKit now. |
| 2026-05-30 | Defer PencilKit/PaperKit to a native-build phase. | They are stronger for iPad markup but require native integration and Apple build flow. | Try to force advanced native markup into Expo Go. |
| 2026-05-30 | Keep annotation persistence in memory for the first optimization. | There is no login/sync model yet, and the immediate goal is reader usability. | Local storage immediately, database schema immediately. |

## Assumptions

- The first optimization should remain runnable in Expo Go.
- Uploaded PDFs are useful for selection/library flow, but in-app rendering should eventually use the same page-image pipeline.
- User-facing text should not mention "Web", "API", "mock", or implementation details.

## Open Questions

- Should annotations persist locally before login exists?
- Should uploaded PDFs be converted on device, by backend script, or by an admin/preprocessing workflow?
- Should audio transcripts be editable in the future, or only read from generated manifest data?

