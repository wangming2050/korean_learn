# Hanbu Product Requirements Document

Updated: 2026-06-23  
Document version: v2, business-rule PRD  
Scope: current Web product, mobile prototype, future iPad direction, and future multilingual version

## 1. Document Positioning

This document is not a product introduction or a vision document. It describes the real business functions, page rules, user actions, system responses, data sources, exception states, and acceptance criteria of the current Hanbu product.

Future design, development, testing, refactoring, and Codex implementation tasks should use this document as the primary reference when judging how a function should behave.

### 1.1 Status Labels

This document uses the following status labels:

- `Implemented`: Already exists in the current code and can be verified on Web or mobile.
- `Prototype`: The interface or part of the logic exists, but data, state, or interaction is incomplete.
- `Needs completion`: Required by the product but not yet sufficiently implemented.
- `Future plan`: Not included in the current version, but is a clear future direction.

## 2. Product Background

Hanbu is a Korean learning tool for global beginners. The current version first serves Chinese native speakers to validate the product direction, learning process, content organization, and core training loop. After the Chinese version becomes stable, the product will expand into a multilingual version.

The current product does not aim to provide a large number of courses. Instead, it builds training loops around small units in Korean learning:

- Pronunciation: see the letter, know how to pronounce it, listen, and repeat.
- Vocabulary: see Korean words, understand the Chinese meaning, and gradually enter review.
- Example sentences: understand sentences in context, listen, and read.
- Textbooks: read, ask questions, and understand the current PDF page.
- AI: help explain the current page without replacing the textbook or the learner’s judgment.

## 3. Current Version Goals

### 3.1 What the Current Version Should Achieve

- The Web version should stably support pronunciation, vocabulary, example sentences, PDF textbooks, and AI assistant.
- The pronunciation page should change from “material display” to a pronunciation training entrance.
- The textbook page should support local PDF upload and current-page AI Q&A.
- The mobile version should first align with the core content of the Web version and should not prioritize complex personalization.
- iPhone and iPad should use the same mobile project and adapt layouts based on screen size.

### 3.2 What the Current Version Does Not Do

- No course sales.
- No class, teacher, homework, or institution backend.
- No community content feed.
- No real learning plan without login support.
- No unauthorized built-in textbook resources by default.
- TTS is not treated as the final standard pronunciation material.
- The product does not attempt to finish all global languages in the current stage.

## 4. User Roles

### 4.1 Learning User

Status: `Implemented`

Current learning users can use the Web learning functions without logging in.

They can:

- View the learning path.
- Learn pronunciation.
- View vocabulary.
- View example sentences.
- Upload local PDF textbooks.
- Ask questions about the current PDF page.
- Switch light/dark theme.

Limitations:

- No cross-device learning records.
- No real personal vocabulary mastery status.
- Local PDFs are stored only in the current browser.
- The current interface and learning explanations are mainly in Chinese and do not yet support multilingual switching.

### 4.2 Administrator

Status: `Implemented`

Administrators log in through `/admin/login`.

They can:

- Enter scene management.
- Enter sentence management.
- Add, edit, and delete scenes.
- Add, edit, and delete sentences.

Limitations:

- No vocabulary backend yet.
- No pronunciation content backend yet.
- The old textbook material backend is not exposed as the main entrance.

### 4.3 Logged-in User

Status: `Future plan`

Future logged-in users will support:

- Cross-device synchronization.
- Learning progress.
- Vocabulary mastery status.
- Textbook library.
- Notes.
- Annotations.
- Favorites.
- AI history.

This role does not exist in the current version.

## 5. Information Architecture

### 5.1 Web User Side

Status: `Implemented`

The Web top navigation contains:

- Learning path.
- Pronunciation.
- Vocabulary.
- Example sentences.
- Textbooks.
- Light/dark theme button.

Page containers:

- `#guide`
- `#letters`
- `#vocabulary`
- `#scenes`
- `#materials`

### 5.2 Web Admin Side

Status: `Implemented`

Admin entrances:

- `/admin/login`
- `/admin`
- `/admin/scene`
- `/admin/sentence`

Historical entrance:

- `/admin/material` currently redirects to scene management or the login page and is not used as the textbook management entrance.

### 5.3 Mobile

Status: `Prototype`

The mobile project is under `mobile/` and is built with Expo + React Native.

Current positioning:

- iPhone and iPad share the same codebase.
- Learning data is loaded through Web APIs.
- Local fallback data is used when Web APIs are unavailable.
- Mobile is being aligned with Web pronunciation, vocabulary, and textbook content.

## 6. Global Business Rules

### 6.1 Login and Permission

Status: `Implemented`

Rules:

- Normal learning pages do not require login.
- Admin backend pages require administrator login.
- POST, PUT, and DELETE write APIs require admin login by default.
- Public POST API exceptions:
  - `/api/admin/login`
  - `/api/admin/logout`
  - `/api/pdf-assistant/chat`
  - `/api/pdf-assistant/extract-toc`
  - `/api/tts/synthesize`

Acceptance criteria:

- Unlogged users visiting `/admin/scene` or `/admin/sentence` should be redirected to the login page.
- Unlogged calls to protected write APIs should return an unauthenticated message.
- User-side GET learning data should not be blocked by admin login state.

### 6.2 Theme Switching

Status: `Implemented`

Rules:

- Users switch theme by clicking the top theme button.
- Theme state is saved locally in the browser.
- Refreshing the page keeps the previous theme.
- The button uses an icon, not text.

Acceptance criteria:

- Theme switching does not change the current page.
- After switching theme, pronunciation, vocabulary, textbook and other major pages remain readable.

### 6.3 General Audio Playback Rules

Status: `Implemented / Needs completion`

General rules:

- Only one main learning audio should play at a time.
- When a user triggers new audio, the old playback queue should stop or be interrupted.
- Static audio has priority over TTS.
- TTS has priority over browser speech.
- Browser speech is only a fallback and is not standard learning audio.

Recommended priority:

```text
Static MP3
  -> Server-side TTS
  -> Browser SpeechSynthesis
  -> Show unavailable prompt
```

Acceptance criteria:

- When the user clicks a new pronunciation item or example word, old audio should not continue playing over it.
- If TTS is not configured, the page should not go blank.
- If browser speech is unavailable, the user should see an understandable prompt.

### 6.4 Data Source Rules

Status: `Implemented / Prototype`

Current data sources:

- MySQL: scenes, sentences, vocabulary, and old textbook material table.
- JavaScript constants: pronunciation details, pronunciation explanations, and pronunciation groups.
- Static files: pronunciation audio, vocabulary audio, frontend resources.
- IndexedDB: user local PDFs, page images, text, and AI history.
- localStorage: theme and some UI state.
- Mobile local fallback: default data when Web APIs are unavailable.

Business requirements:

- User-visible data should come from unified sources whenever possible.
- Web and mobile should not maintain two inconsistent sets of pronunciation details for a long time.
- Before account support exists, user personal data is only local or temporary.

## 7. Detailed Functional Requirements

## 7.1 Learning Path

Status: `Implemented`

### Goal

Provide new users with a learning entrance and direction. It does not generate a forced learning plan.

### User Entrance

Users enter this page after opening the home page or clicking “Learning Path” in the top navigation.

### Page Content

The learning path page should provide:

- Hangul beginner entrance.
- Vocabulary entrance.
- Example sentence entrance.
- Textbook entrance.
- Website usage idea or learning method tips.

### User Actions and System Responses

1. User clicks a learning path card.
   - The system switches to the corresponding module page.
   - It does not create a learning plan.
   - It does not save personal progress.

2. User switches to another top navigation item.
   - The system displays the corresponding page.
   - Since there is no login state, it does not show personal progress recovery.

### Data Sources

- Static page content.
- Top navigation state.

### Current Limits

- The learning path is only guidance, not a real personalized learning plan.
- There is no user progress or completion status.

### Acceptance Criteria

- First-time visitors can see learning entrances.
- Clicking an entrance opens the corresponding module.
- The page should not show unrealistic text such as “the system has created your plan”.

## 7.2 Pronunciation Module

Status: `Implemented / Continuous optimization`

### Goal

Help users learn Hangul and final consonant rules, focusing on listening, reading, and distinguishing sounds rather than only displaying a letter table.

### User Entrance

Users click “Pronunciation” in the top navigation.

### Content Structure

Pronunciation content is organized by learning structure:

- Consonants.
  - Plain consonants.
  - Tense consonants.
  - Aspirated consonants.
- Vowels.
  - Simple vowels.
  - Compound vowels.
- Final consonants.
  - Basic final consonants.
  - Double final consonants.

### Default State

Web:

- Pronunciation groups are displayed by default.
- Detail area is hidden by default.
- “Pronunciation” is checked by default.
- “Example word” is unchecked by default.
- Repeat count defaults to 1.
- No autoplay until the user clicks a pronunciation item.

Mobile target rules:

- Play one pronunciation item by default.
- Do not automatically read example words by default.
- Example words should be played only when users enter details and tap them.

### Page Elements

Web pronunciation page includes:

- Playback option: pronunciation.
- Playback option: example word.
- Repeat count input.
- Pronunciation group list.
- Pronunciation cards.
- Pronunciation detail area.

The detail area should contain:

- Current pronunciation item.
- Romanization or sound name.
- Pronunciation tips.
- Position explanation.
- Example words.
- Comparison words.
- Rule explanation.
- Clickable example words for playback.

### User Actions and System Responses

#### Action 1: Click a pronunciation card

System response:

- Set the current pronunciation item as selected.
- Expand its detail area.
- Stop any previous playback queue.
- Generate a new playback queue according to current options.
- Start playback immediately.

Special rules:

- If the user clicks the currently selected item, close the detail area.
- If the user switches to another item, old audio stops and the new item becomes selected.

#### Action 2: Select “Pronunciation”

System response:

- Later clicks include the pronunciation item itself in the queue.
- Playback text first uses `playbackText`, then the pronunciation item or sound name.

#### Action 3: Select “Example word”

System response:

- Later clicks include example words from the current detail page.
- Example words should come from the detail page, not only from a single card word.

#### Action 4: Select both “Pronunciation” and “Example word”

System response:

- Playback order: pronunciation first, then example words.
- Each item repeats according to repeat count.
- There is a short pause between items to give users time to repeat.

Example:

```text
Repeat count = 2
Selected: pronunciation + example word

Play ㄱ twice
Pause
Play 가방 twice
Pause
Play 고기 twice
...
```

#### Action 5: Change repeat count

System response:

- Repeat count must be at least 1.
- Invalid input resets to 1.
- New playback queues use the new repeat count.

#### Action 6: Click an example word on the detail page

System response:

- Stop the current pronunciation playback queue.
- Play only the clicked example word.
- Use the global repeat count.
- Do not automatically continue to other example words.

### Playback Priority

Pronunciation item:

```text
letter_audio_url
  -> /api/tts/synthesize
  -> browser Korean speech
```

Example word:

```text
word-audio-map.js mapped audio or example.audioUrl
  -> /api/tts/synthesize
  -> browser Korean speech
```

### Data Sources

Backend:

- `/api/letters`
- `KOREAN_LETTERS` in `handler/sentence.py`

Frontend:

- `LETTER_DETAILS` in `static/js/app.js`
- `PHONETIC_SECTIONS` in `static/js/app.js`
- `static/js/word-audio-map.js`

Mobile:

- `mobile/src/api/webData.ts`
- Web API `/api/letters`
- Local mobile `LETTER_DETAILS` and `PHONETIC_SECTIONS`

### Empty State

If `/api/letters` returns empty:

- The page should show a pronunciation data unavailable message.
- It should not render a blank area.

Current status:

- Clear empty-state UI still needs completion.

### Exception States

- Missing audio file: fall back to TTS.
- TTS not configured: fall back to browser speech.
- Browser speech failed: show a “cannot play” prompt.
- User selects neither pronunciation nor example word: prompt the user to select at least one playback option.

### Current Risks

- Web and mobile duplicate pronunciation details and may become inconsistent.
- TTS pronunciation quality cannot guarantee teaching accuracy.
- Example words, comparison words, and final consonant explanations require manual review.

### Acceptance Criteria

- Clicking any pronunciation item shows its details.
- Switching pronunciation items updates selection and detail content.
- Pronunciation playback prefers static audio.
- Example words can be played individually.
- Repeat count 2 plays each item twice.
- If no playback option is selected, the system shows a clear prompt.
- Mobile should not automatically play pronunciation and vocabulary twice by default.

## 7.3 Vocabulary Module

Status: `Implemented / Prototype`

### Goal

Help users browse and review basic Korean vocabulary for later textbook learning and sentence understanding.

### User Entrance

Users click “Vocabulary” in the top navigation.

### Current Page Capabilities

Web:

- Vocabulary page is rendered through React components.
- Vocabulary is loaded from `/api/vocabulary`.
- Vocabulary includes Korean, Chinese, and category or source fields.

Mobile:

- `fetchWebLearningData()` loads `/api/vocabulary`.
- If the Web API is unavailable, the mobile vocabulary list may be empty or use fallback data.

### User Actions and System Responses

#### Action 1: Enter vocabulary page

System response:

- Request vocabulary data.
- Render vocabulary list or learning interface.
- If request fails, show unavailable data or fallback content.

#### Action 2: Search or filter vocabulary

Current API supports:

- `/api/vocabulary?q=keyword`

System response:

- Return matching vocabulary based on the keyword.

Current limitation:

- Learning states are not real personal states.
- Without account support, “unlearned”, “to review”, and “mastered” cannot be saved across devices.

### Data Sources

- `/api/vocabulary`
- `handler/sentence.py`
- `handler/seed_content.py`
- `vocabulary` table and seed data in `sql/schema.sql`

### Empty State

Should show:

- No vocabulary found.
- Data loading failed.
- No vocabulary data.

### Exception States

- Database unavailable: use fallback or show error.
- No search results: do not show blank screen.

### Current Risks

- Seed vocabulary may contain wrong or duplicate words.
- Learning states are not connected to real user data.

### Acceptance Criteria

- Users can see vocabulary when entering the page.
- Search with no results shows a clear message.
- Vocabulary states should not be described as truly synced personal records.

## 7.4 Example Sentence Module

Status: `Implemented / Prototype`

### Goal

Let users learn basic Korean sentences in real-life scenarios and support understanding, listening, and future shadowing expansion.

### User Entrance

Users click “Example Sentences” in the top navigation.

### Content Structure

Current sentences are organized by scenario:

- School.
- Hospital.
- Transportation.
- Restaurant.
- Shopping.
- Accommodation.

Each sentence contains:

- Korean.
- Chinese.
- Situation.
- Audio URL.
- Audio start time.
- Audio end time.
- Scene ID.

### User Actions and System Responses

#### Action 1: Enter sentence page

System response:

- Request `/api/scenes`.
- Request `/api/sentences`.
- Organize sentences by scene.
- Render scenes and sentence lists.

#### Action 2: Select a scene

System response:

- Display sentences under the selected scene.
- Do not change the database.

#### Action 3: Play a sentence

System response:

- If the sentence has an audio URL, prefer the audio file.
- If start and end time are configured, play the specified segment.
- If no audio exists, use browser speech fallback.

### Data Sources

- `/api/scenes`
- `/api/sentences`
- `scene` table
- `sentence` table
- `static/js/sentence-app.jsx`
- `mobile/src/api/webData.ts`

### Exception States

- No scenes: show no scene data.
- No sentences: show no sentence data.
- Audio failed: fall back to browser speech.

### Current Limits

- Sentence audio is incomplete.
- There is no real user sentence practice record.
- Sentence shadowing and recording are not fully implemented.

### Acceptance Criteria

- Users can view scene categories.
- Users can view sentences under a scene.
- Sentence audio plays if available.
- Page does not go blank when data is empty or audio is missing.

## 7.5 Textbook PDF Module

Status: `Implemented / Needs optimization`

### Goal

Support users uploading local PDF textbooks and reading them in the Web page. The system should make textbooks usable without forcing users to upload files to the server.

### User Entrance

Users click “Textbooks” in the top navigation.

### Core Principles

- The current textbook flow is user local PDF upload.
- PDF files are processed in the browser.
- PDF data is stored in IndexedDB.
- The server does not store user PDFs by default.

### Default State

- If no PDF exists locally, show upload entrance and empty state.
- If a PDF exists locally, show the textbook list or current textbook.
- Reading state should be restored as much as possible within the current browser.

### Upload Rules

- Users can select a local PDF file.
- The system parses the PDF using PDF.js.
- The system generates page images and extracts text.
- The system stores page data in IndexedDB.
- Large PDFs should show loading progress or understandable waiting state.

### Reader Rules

The reader should support:

- Previous page.
- Next page.
- Page number jump.
- Table of contents if available.
- Current page display.
- Current page text for AI Q&A.

Rules:

- Page turning should not reload the whole application.
- Current page data should be synchronized with AI assistant context.
- The system should not claim to read pages that have not been parsed or sent as context.

### Table of Contents Rules

- If PDF TOC exists, use PDF TOC.
- If PDF TOC does not exist, the system may try extracting TOC.
- If no TOC is available, show normal page navigation.

### Deletion Rules

- Users can delete locally cached PDF data.
- Deletion should remove related IndexedDB data.
- Deleting one local textbook should not affect unrelated learning data.

### Empty State

Should show:

- No textbook uploaded.
- Upload PDF prompt.
- Explain that PDF is stored locally in the browser.

### Exception States

- PDF parsing failed: show parse failure message.
- File too large: show performance warning.
- IndexedDB unavailable: show local storage unavailable message.
- AI unavailable: textbook reading should remain available.

### Current Limits

- Large PDF performance depends on browser and device.
- PDF does not sync across devices.
- Mobile PDF capability is not yet complete.

### Acceptance Criteria

- Users can upload a PDF and read it.
- Users can turn pages and jump by page number.
- Current page can be used by AI assistant.
- User PDF is not uploaded to the server by default.
- Deleting a PDF removes local cache.

## 7.6 Textbook AI Assistant

Status: `Implemented / Needs optimization`

### Goal

Help users understand the current textbook page. AI should assist learning but not replace the textbook or user judgment.

### User Entrance

Users open the textbook page and use the AI assistant panel.

### Page Elements

- Question input box.
- Send button.
- Quick question buttons.
- AI answer area.
- Current page context.
- History area.
- Loading state.
- Error state.

### User Actions and System Responses

#### Action 1: User enters a question and sends it

System response:

- Read the current page text.
- Add page metadata.
- Include screenshot if necessary.
- Send the request to `/api/pdf-assistant/chat`.
- Render the returned AI answer.
- Save the local history in the browser.

#### Action 2: User clicks a quick question

System response:

- Fill or send the quick question.
- Ask AI based on the current page.
- Return an explanation related to the page.

#### Action 3: User views history

System response:

- Show local AI Q&A history.
- History is not synced across devices in the current version.

### AI Context Rules

- AI should answer based mainly on the current page.
- If using adjacent pages, it should be explicit.
- AI must not claim it has read the whole PDF unless full context is actually provided.
- AI should explain vocabulary, grammar, sentence meaning, and pronunciation rules based on current context.

### Provider Rules

- Gemini is suitable for page screenshots and multimodal understanding.
- OpenAI can be used if configured.
- DeepSeek provider is not implemented in the current code.
- If no provider is configured, the page should show a clear message and not affect reading.

### Exception States

- AI key missing.
- AI provider timeout.
- Current page text unavailable.
- Network error.
- AI returns invalid format.

### Privacy Rules

- The user should understand that page text or screenshot may be sent to the AI service when asking questions.
- User-uploaded PDFs are not uploaded to the server by default.
- Future versions need clearer privacy prompts before sending screenshots or text to AI.

### Acceptance Criteria

- Users can ask about the current PDF page.
- AI answers should relate to the current page.
- AI unavailable should not break textbook reading.
- AI history is stored locally.

## 7.7 TTS and Audio Module

Status: `Implemented / Needs completion`

### Goal

Provide Korean audio playback for pronunciation, vocabulary, example sentences, and user-generated content.

### TTS Rules

Recommended audio priority:

```text
Static audio
  -> Server-side TTS
  -> Browser speech synthesis
  -> Unavailable prompt
```

Rules:

- Static human audio should be preferred when available.
- TTS is a fallback, not the final teaching standard.
- Browser speech is the last fallback.
- Generated TTS audio can be cached.

### Speech Speed Rules

- Default speed should be beginner-friendly.
- Future versions should support multiple speech speeds.
- The speed should not be so fast that beginners cannot imitate.

### Exception States

- Static audio missing.
- TTS key missing.
- TTS service failed.
- Browser speech unavailable.

### Product Rules

- Do not present TTS as standard native pronunciation.
- For pronunciation teaching, standard human audio should be added later.

### Acceptance Criteria

- Audio playback works where audio exists.
- Missing audio falls back properly.
- Audio errors show understandable messages.

## 7.8 Mobile App

Status: `Prototype`

### Goal

Provide a mobile learning experience consistent with the Web core content and prepare for future iPhone and iPad learning scenarios.

### Data Rules

- Mobile should fetch data through Web APIs when possible.
- Mobile can use local fallback data when APIs are unavailable.
- Web and mobile should gradually share the same content source.
- Mobile should not maintain long-term inconsistent learning content.

### Current Pages

Current or planned mobile pages include:

- Pronunciation home.
- Pronunciation detail.
- Vocabulary home.
- Vocabulary library.
- Vocabulary detail.
- Textbook home.
- Textbook detail.

### Mobile Pronunciation Rules

- Default playback should be one pronunciation item.
- Do not automatically read example words by default.
- Example words should be played only after user action.
- Mobile pronunciation content should align with Web.

### iPad Rules

- iPad uses the same mobile project.
- Layout should adapt to large screens.
- Future iPad should support textbook workspace, notes, and annotation.

### Current Limits

- Mobile is still a prototype.
- Login and synchronization are not implemented.
- PDF capability is not yet equal to Web.

### Acceptance Criteria

- Mobile can show core learning content.
- iPhone and iPad display naturally.
- Mobile does not show developer-facing text.

## 7.9 Admin Backend

Status: `Implemented`

### Goal

Support basic content maintenance for scenes and sentences.

### Login Rules

- Admin users log in through `/admin/login`.
- Admin pages require login.
- Write APIs require admin permission by default.

### Scene Management

Admins can:

- View scene list.
- Add a scene.
- Edit a scene.
- Delete a scene.

Scene fields:

- Name.
- English name or code.

### Sentence Management

Admins can:

- View sentence list.
- Add a sentence.
- Edit a sentence.
- Delete a sentence.

Sentence fields:

- Korean.
- Chinese.
- Situation.
- Audio URL.
- Audio start time.
- Audio end time.
- Scene ID.

### Current Limits

- No vocabulary management.
- No pronunciation content management.
- No official textbook content management for the current user PDF flow.

### Acceptance Criteria

- Admin can log in.
- Admin can maintain scenes and sentences.
- Unlogged users cannot access admin write functions.

## 7.10 Multilingual and Internationalization

Status: `Future plan`

### Goal

After the Chinese version is validated, expand Hanbu into a multilingual product for Korean beginners from different native-language backgrounds.

### Current Positioning

- Current version first serves Chinese native speakers.
- Chinese is used to validate the learning flow and content structure.
- Multilingual support is not complete yet.

### User Entrance

Future users should be able to:

- Select interface language.
- Change learning explanation language.
- Ask AI questions in their own language.

### Language Scope

Future language support may include:

- Chinese.
- English.
- Korean interface elements where necessary.
- Other languages based on target market priority.

### Multilingual Coverage

Multilingual content should cover:

- UI text.
- Pronunciation explanations.
- Vocabulary meanings.
- Sentence translations.
- Textbook AI answer language.
- Learning tips.

### System Response Rules

- AI answers should follow the learner’s native language by default.
- If a translation is missing, the system may fall back to Chinese or English.
- Do not mix multiple languages unnecessarily in one UI area.

### Data Requirements

Future multilingual data should include:

- Language code.
- Translation fields.
- Fallback rules.
- Review status.

### Acceptance Criteria

- Users can switch language.
- Main UI text changes according to selected language.
- AI answer language follows user language setting.
- Missing translations have a reasonable fallback.

## 8. Non-Functional Requirements

### 8.1 Performance

- Basic pages should load quickly.
- PDF upload and parsing should show progress or loading state.
- Large PDFs should not freeze the page without feedback.
- Audio playback should respond quickly after user interaction.
- AI requests should show loading state.

### 8.2 Compatibility

- Web should support modern browsers.
- PDF functions depend on browser support for PDF.js and IndexedDB.
- Mobile should support iPhone and iPad layout adaptation.
- If a feature is unavailable on a platform, show a clear prompt.

### 8.3 Privacy

- User PDFs are local by default.
- AI requests may send page text or screenshots to external providers.
- Future versions should provide clearer privacy notices.
- User voice recordings need privacy rules before being saved.

### 8.4 Maintainability

- Web and mobile content should gradually share a single source.
- Pronunciation data should be reviewed and structured.
- TTS should not be mixed with standard audio without clear rules.
- Frontend logic should be modularized as the product grows.

## 9. Data and Content Rules

### 9.1 Current Database Tables

Current tables:

- `scene`
- `sentence`
- `vocabulary`
- `material`

### 9.2 Current Local Data

Current local data includes:

- PDF page images.
- PDF extracted text.
- PDF table of contents.
- AI local history.
- Theme state.
- Some UI state.

### 9.3 Content Quality Rules

- Pronunciation explanations must be manually reviewed.
- Example words and comparison words must be checked.
- Vocabulary duplicates and wrong entries should be removed.
- Sentence translations should be natural and accurate.
- Audio source should be clear.

## 10. Version Scope

### 10.1 Current Version Scope

Current version includes:

- Web learning pages.
- Pronunciation learning.
- Vocabulary browsing.
- Example sentence learning.
- Local PDF textbook reading.
- Current-page AI Q&A.
- TTS fallback.
- Admin scene and sentence management.
- Mobile prototype.

### 10.2 Next Stage Scope

Next stage should include:

- User login.
- User data ownership.
- Mobile and Web content alignment.
- Pronunciation and vocabulary data cleanup.
- More stable PDF and AI flows.

### 10.3 Later Version Scope

Later versions may include:

- Cross-device synchronization.
- User vocabulary and sentence libraries.
- Textbook text-to-speech.
- AI voice conversation training.
- Pronunciation scoring.
- iPad textbook workspace.
- Multilingual support.

## 11. Overall Acceptance Checklist

### 11.1 Web Learning Side

- Learning path is visible.
- Pronunciation items display and play correctly.
- Vocabulary page displays data and handles empty states.
- Example sentences display by scene.
- PDF textbook upload and reading work.
- AI current-page Q&A works when configured.
- Theme switching works.

### 11.2 Admin Backend

- Admin login works.
- Scene management works.
- Sentence management works.
- Protected write APIs reject unlogged requests.

### 11.3 Mobile

- Mobile can display core learning content.
- Web API data and fallback data work.
- iPhone and iPad layouts are acceptable.
- Mobile does not show developer-facing text.

### 11.4 Exception Scenarios

- Missing data shows empty state.
- Missing audio falls back or shows prompt.
- AI unavailable does not break reading.
- PDF parsing errors are understandable.

### 11.5 Multilingual Acceptance

Future acceptance:

- Language switching works.
- Main UI is translated.
- AI answer language follows user setting.
- Fallback language is available.

## 12. Multilingual Open Questions

Questions to confirm before multilingual development:

1. Which languages should be supported first after Chinese?
2. Should priority be based on user scale, target market, learning demand, or implementation cost?
3. Should multilingual content be maintained manually, generated by AI with manual review, or translated in real time by AI?
4. Should pronunciation explanations be rewritten for different native-language users?
5. Should the textbook AI assistant answer in the learner’s native language by default?
6. Should Web, iPhone, and iPad support multilingual content at the same time, or should Web come first?
7. Should Chinese remain the default fallback language?
