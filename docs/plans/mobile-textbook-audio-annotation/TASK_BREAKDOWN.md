# Mobile Textbook Audio And Annotation Task Breakdown

## Preparation

- [ ] Confirm manifest `pageAudio` and `transcripts` structure.
- [ ] Confirm R2 asset URL rewriting for audio and page images.
- [ ] Confirm Expo Go compatible dependencies only.

## Implementation

- [ ] Extend `TextbookPage` types with page audio metadata.
- [ ] Map `manifest.pageAudio` into mobile textbook records.
- [ ] Resolve nested audio URLs through the same R2 helper as page images.
- [ ] Add audio playback state and stop/unload behavior in `App.tsx`.
- [ ] Add page audio panel to `TextbookScreen`.
- [ ] Add transcript/original text panel to `TextbookScreen`.
- [ ] Replace annotation tools with `高亮`, `划线`, `批注`, `撤销`, `清除本页`.
- [ ] Store marks as page-specific normalized coordinates.
- [ ] Render highlight, underline, and note marks as overlays.
- [ ] Clean user-facing copy so it sounds like a study app, not implementation notes.

## Verification

- [ ] Run `npm run typecheck`.
- [ ] Start Web backend on port 8000.
- [ ] Start mobile with `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run ios -- --clear`.
- [ ] Check page 21, page 24, audio playback, transcript rendering, and annotation actions.

## Follow-Ups

- [ ] Persist annotations locally.
- [ ] Sync annotations after login/account state exists.
- [ ] Add Apple Pencil native support through PencilKit or PaperKit in a development build.
- [ ] Consider React Native Skia for freehand drawing and snapshot export.
- [ ] Convert uploaded PDFs into page images so uploaded books use the same reader surface.

