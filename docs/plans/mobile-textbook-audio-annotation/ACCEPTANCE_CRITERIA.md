# Mobile Textbook Audio And Annotation Acceptance Criteria

## Functional Criteria

- [ ] Opening the textbook tab shows the textbook library, not a reader by default.
- [ ] Opening an existing textbook displays the R2 page image.
- [ ] Pages with `pageAudio` show a visible audio section.
- [ ] Audio entries show title and playable track buttons.
- [ ] Tapping a track plays audio through `expo-av`.
- [ ] Starting a new track stops the previous track.
- [ ] Pages with transcript text show the transcript/original text.
- [ ] Pages whose transcript is printed on the page show the manifest note instead of an empty transcript.
- [ ] Annotation tools include highlight, underline, note, undo, and clear current page.
- [ ] Marks appear on the current page only.
- [ ] Switching pages hides marks from other pages and restores marks for the current page.

## Data And Persistence Criteria

- [ ] Mobile uses the existing manifest fields and does not duplicate textbook metadata.
- [ ] Page images and audio URLs are resolved through `/api/config` `assetBaseUrl`.
- [ ] Page image numbers are padded to three digits.
- [ ] Phase 1 marks are in-memory only and do not imply sync or permanent storage.

## Compatibility Criteria

- [ ] Existing audio, scene, vocabulary, and letter tabs still render.
- [ ] Existing R2 textbook page loading still works.
- [ ] The implementation works in Expo Go.
- [ ] Uploaded PDF selection still works, even if in-app rendering is deferred.

## Manual Test Scenarios

1. Open textbook page 21.
   - Expected: page image loads; audio section shows MP3 01/02; transcript note says the original text is on the page.
2. Open textbook page 24.
   - Expected: audio section shows MP3 03; transcript text is visible.
3. Play an audio track, then play another.
   - Expected: first audio stops; second starts.
4. Add highlight, underline, and note on page 24.
   - Expected: all marks show on page 24.
5. Navigate to page 25 and back to 24.
   - Expected: page 25 does not show page 24 marks; returning to page 24 restores them.
6. Tap undo.
   - Expected: latest mark on the current page is removed.
7. Tap clear current page.
   - Expected: all marks on that page are removed.

## Automated Test Targets

- `npm run typecheck`
- Manual iPad simulator smoke test with Web backend running.

