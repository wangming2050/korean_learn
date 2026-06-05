# Mobile Textbook Audio And Annotation Technical Plan

## Current State

- Web uses Python `http.server`, `/api/config`, and R2-hosted textbook assets.
- Web textbook reading is image-based. The manifest points to `/static/textbooks/yonsei1/page-images/page_{page}.webp`, and Web rewrites `/static/` paths to the configured R2 `assetBaseUrl`.
- Mobile currently reads `index.json` and `manifest.json`, resolves page images through R2, and displays the page image.
- Mobile annotation currently stores local state only and supports simple underline/note marks.
- Manifest includes `pageAudio`, `transcripts`, and `notes`.
- `pageAudio[21]` can reference audio with no transcript and a note that the original text is on the current page.
- `pageAudio[24]` can include both audio URL and transcript text.
- Official Expo DocumentPicker is Expo Go compatible and copies files to cache when `copyToCacheDirectory` is true.
- React Native Skia supports canvas rendering and snapshots, but adding it is a larger dependency and should be a second phase.
- Apple's PencilKit and PaperKit provide richer native markup foundations, but they require native iOS integration rather than Expo Go.

## Proposed Approach

Implement a two-phase reader upgrade.

Phase 1, Expo Go compatible:

- Extend mobile textbook data mapping to include page audio and transcript records.
- Resolve audio URLs with the same R2 rules as page images.
- Add a page study panel under or beside the page image:
  - Audio track list.
  - Transcript/original text.
  - Transcript note when original text is printed on the page.
- Improve annotation with a structured mark model:
  - `highlight`, `underline`, `note`.
  - Page number.
  - Normalized page coordinates.
  - Color and text.
  - Undo latest mark.
  - Clear current page.
- Keep persistence in memory for this pass to avoid introducing a storage model before login/sync decisions.

Phase 2, native-build capable:

- Add a proper drawing canvas using React Native Skia or native PencilKit/PaperKit.
- Store vector paths, pressure, stroke width, eraser actions, and note anchors.
- Add local persistence, then sync after login exists.

## Interfaces And Data Flow

### Manifest To Mobile Data

`fetchWebLearningData()` should return textbook page records with:

- `pageAudioByPage`: page-number keyed audio entries.
- `transcriptsByPage`: page-number keyed transcript entries.
- Resolved page image template.
- Resolved audio URLs.

Recommended mobile shape:

```ts
type TextbookAudio = {
  id: string;
  title: string;
  audioTitle: string;
  url: string;
  audios: Array<{ id: string; title: string; url: string }>;
  transcript: string;
  transcriptNote?: string;
};

type TextbookPage = {
  id: string;
  title: string;
  page: number;
  endPage: number;
  pageCount: number;
  pageImageUrlTemplate: string;
  audioByPage: Record<string, TextbookAudio[]>;
};
```

### Audio Playback

- Use `expo-av` `Audio.Sound.createAsync({ uri })`.
- Stop and unload the current textbook audio before starting another track.
- Show active track state.
- Keep page image readable while audio controls are visible.

### Annotation Model

Recommended first-pass shape:

```ts
type TextbookMark = {
  id: string;
  page: number;
  type: "highlight" | "underline" | "note";
  x: number;
  y: number;
  width: number;
  height?: number;
  color: string;
  text?: string;
};
```

Coordinates should be normalized to the displayed page canvas:

- `x`, `y`, `width`, `height` in 0-1 range.
- Rendering multiplies normalized values by current page canvas size.
- This keeps marks stable across iPhone/iPad screen sizes.

## Implementation Notes

- Keep the page image as the primary reader surface.
- Put the audio/transcript panel below the page on iPhone and beside or below the page on iPad depending on available width.
- Do not show "Web", "接口", or implementation copy in the user-facing UI.
- Reuse existing `SectionCard`, `Chip`, `IconButton`, and theme tokens.
- Avoid adding a heavy drawing library in Phase 1. Use overlay React Native views for highlights, underlines, and notes.

## Failure Modes

- Page has no audio: hide the audio section or show "本页暂无听力".
- Page audio has no transcript but has `transcriptNote`: show the note.
- Audio URL fails: show a small alert and keep the page usable.
- R2 asset unavailable: keep existing page container and show an image loading failure state later.
- Uploaded PDF cannot be previewed: keep it in the library and explain that in-app PDF rendering requires conversion or native support.

## Rollout Notes

- No database migration for Phase 1.
- No server change required if the mobile mapper can consume existing `manifest.json`.
- Future persistence should be revisited with login/sync planning.

## References

- Expo DocumentPicker supports system document selection and recommends `copyToCacheDirectory: true` when other Expo APIs need immediate file access: https://docs.expo.dev/versions/v52.0.0/sdk/document-picker/
- React Native Skia provides a Canvas root and snapshot APIs suitable for richer drawing layers in a later phase: https://shopify.github.io/react-native-skia/docs/canvas/overview/
- Apple PencilKit supports Apple Pencil/finger drawing with tool, eraser, selection, and saved `PKDrawing` output in native iPadOS apps: https://developer.apple.com/documentation/pencilkit
- Apple PaperKit is positioned for rich markup experiences in native document viewers: https://developer.apple.com/documentation/paperkit/getting-started-with-paperkit

