# Mobile Textbook Audio And Annotation Requirements

## Summary

Upgrade the iOS/iPad textbook reader from a page-image viewer into a usable study surface: pages with audio should show playable tracks and available original text, and annotation should move beyond one-tap marks toward a modern, page-anchored markup model suitable for iPad study.

## Users And Jobs

- Chinese-speaking Korean beginners using iPhone or iPad to study textbook pages.
- iPad learners who want to read a textbook page, play its listening material, compare the printed page with transcript text, and mark important areas while studying.

## Goals

- Show audio tracks on textbook pages that have audio in `manifest.json`.
- Show transcript/original text when the manifest provides it.
- Keep the page image as the primary surface, matching the Web reader's asset model.
- Improve annotation from fixed one-tap marks into a structured model that can support highlight, underline, note, undo, and page-specific storage.
- Keep the first optimized version compatible with Expo Go.

## Non-Goals

- Do not build a full native PDF engine in this pass.
- Do not replace the existing R2 page-image reader with PDF.js or native PDF rendering.
- Do not add login or cloud sync yet.
- Do not implement full Apple Pencil/PencilKit or PaperKit in Expo Go. These are future native-build options.
- Do not modify the Web reader unless needed to keep shared manifest interpretation consistent.

## User Experience

- Opening the textbook tab first shows the textbook library.
- Opening a textbook shows the current page image and a compact study panel.
- If a page has audio, the page shows a track list with play controls.
- If the page has transcript text, the transcript appears near the audio controls.
- If transcript is not separately available because the original text is printed on the page, the UI says so briefly instead of showing an empty panel.
- Annotation tools should feel like study tools, not demo widgets:
  - Select tool: `划线`, `高亮`, `批注`, `擦除`.
  - Add marks on the page with page-relative coordinates.
  - Keep marks tied to the page number.
  - Allow clearing page marks and undoing the most recent mark.

## Content And Data Requirements

- Source of truth remains `static/textbooks/yonsei1/manifest.json`.
- Existing manifest fields in use:
  - `pageImageUrlTemplate`
  - `pageThumbUrlTemplate`
  - `pageCount`
  - `units`
  - `pageAudio`
  - `transcripts`
  - `notes`
- Mobile must apply the same R2 asset resolution as Web:
  - Request `/api/config`.
  - Use `assetBaseUrl`.
  - Rewrite `/static/...` assets to R2 keys.
  - Pad page numbers to three digits for page images.
- Audio track URLs also need asset resolution.
- Transcript data is page-oriented through `pageAudio[page]` and can also exist as top-level transcript entries with `page`.

## Constraints

- Current mobile app is Expo SDK 52 and uses Expo Go for local preview.
- `expo-av` is already available for audio playback.
- `expo-document-picker` is available for selecting local PDFs, but picked PDFs are not currently rendered inside the app.
- Advanced PencilKit/PaperKit requires native iOS integration and therefore a development build, not plain Expo Go.
- R2 assets must be reachable from the simulator/device.

