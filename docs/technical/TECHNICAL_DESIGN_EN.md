# Hanbu Technical Design Document

Updated: 2026-06-22

## 1. Document Purpose

This document explains the current technical architecture, core module implementation, data flow, deployment method, and future technical evolution direction of Hanbu.

## 2. Current Technology Stack

### 2.1 Web Backend

The current Web backend is not based on Flask, FastAPI, or Django. It is a lightweight service implemented with Python standard library `http.server`.

Core files:

- `server.py`: HTTP service entry, request handling, static files, login checking, and basic routing.
- `router.py`: API dispatching.
- `db.py`: MySQL connection and SQL execution wrapper.
- `handler/scene.py`: Scene APIs.
- `handler/sentence.py`: Sentence, pronunciation, and vocabulary APIs.
- `handler/pdf_assistant.py`: Textbook PDF AI assistant APIs.
- `handler/tts.py`: Server-side Korean TTS APIs.
- `handler/material.py`: Legacy textbook material CRUD, not exposed as the main route currently.

### 2.2 Web Frontend

The Web frontend is a mixed structure of native HTML/CSS/JavaScript and some React/Babel components.

Core files:

- `templates/index.html`: Main user-facing page.
- `templates/admin.html`: Admin backend page.
- `static/js/app.js`: Main business logic, including pronunciation, PDF textbooks, AI assistant, audio, and theme.
- `static/js/vocab-app.jsx`: React component for the vocabulary page.
- `static/js/sentence-app.jsx`: React component for the sentence page.
- `static/css/*.css`: Page styles.

### 2.3 Database

The current database is MySQL. Python connects to it through `pymysql`.

Core files:

- `sql/schema.sql`: Local database initialization script.
- `sql/schema-cloud.sql`: Cloud database initialization script.
- `db.py`: Reads environment variables and creates database connections.

Main tables:

- `scene`: Learning scenes.
- `sentence`: Example sentences.
- `vocabulary`: Vocabulary.
- `material`: Legacy textbook material table.

### 2.4 Mobile

The mobile app is built with Expo + React Native.

Core directories and files:

- `mobile/App.tsx`: Mobile application entry.
- `mobile/src/api/webData.ts`: Loads data from Web APIs and provides local fallback data.
- `mobile/src/data/learning.ts`: Mobile learning data types.
- `mobile/src/theme/tokens.ts`: Mobile theme tokens.

Key dependencies:

- `expo`
- `react-native`
- `expo-audio`
- `expo-speech`
- `expo-document-picker`
- `@expo/vector-icons`

The iPhone and iPad versions are not separate projects. They use the same Expo/React Native app and adapt to screen width.

### 2.5 PDF, AI, and TTS

PDF:

- The Web version uses PDF.js.
- User-uploaded PDFs are parsed in the browser.
- Page images and text are cached in IndexedDB.

AI:

- The textbook AI assistant is provided by `handler/pdf_assistant.py`.
- Gemini and OpenAI are supported.
- The default Gemini model is `gemini-2.5-flash`.
- DeepSeek provider is not implemented in the current code.

TTS:

- `handler/tts.py` proxies Google Cloud TTS.
- The default Korean voice is `ko-KR-Neural2-A`.
- Generated audio is cached in `static/generated-audio/`.
- When the TTS key is not configured, the frontend can fall back to browser speech synthesis.

### 2.6 Deployment

The current online deployment is mainly on Railway.

Related files:

- `Procfile`
- `railway.json`
- `railway-start.sh`
- `nixpacks.toml`
- `DEPLOY.md`

The database uses Railway MySQL. `server.py` reads the `PORT` environment variable and usually listens on `0.0.0.0` in production.

## 3. Overall Architecture

### 3.1 Web Request Flow

When a user visits the Web page, the request flow is approximately:

```text
Browser
  -> server.py
  -> static pages / static resources / APIs
  -> router.py
  -> handler/*
  -> db.py / static files / AI service / TTS service
  -> return JSON, HTML, CSS, JavaScript, images, or audio
```

Details:

- `/` returns `templates/index.html`.
- `/static/...` is served by `server.py`.
- `/api/...` is dispatched by `router.py`.
- POST, PUT, and DELETE APIs normally require admin login, except for a small set of public APIs.

Public API exceptions:

- `/api/admin/login`
- `/api/admin/logout`
- `/api/pdf-assistant/chat`
- `/api/pdf-assistant/extract-toc`
- `/api/tts/synthesize`

### 3.2 API Dispatch Structure

Current dispatch rules in `router.py`:

```text
/api/scenes
  -> handler/scene.py

/api/sentences
/api/letters
/api/vocabulary
  -> handler/sentence.py

/api/pdf-assistant
  -> handler/pdf_assistant.py

/api/tts
  -> handler/tts.py
```

Notes:

- `handler/material.py` exists, but `/api/materials` is not currently connected in `router.py`.
- The user-facing textbook flow has moved to local PDF upload and does not depend on the old `material` table.

### 3.3 Three-Platform Relationship

Current relationship:

```text
Web
  Main product. Provides full learning pages, PDF textbooks, AI assistant, and admin management.

iPhone App
  Expo/React Native prototype. Reads data through Web APIs.

iPad App
  Uses the same mobile codebase as iPhone. It will later expand into a large-screen textbook workspace.
```

There is no account system yet, so the three platforms cannot synchronize personal learning progress. Current mobile “sync” mainly means reading the same Web API data source, not user-level progress synchronization.

## 4. Data Architecture

### 4.1 MySQL Data

Current MySQL table structure:

```text
scene
  id
  name
  en

sentence
  id
  korean
  chinese
  situation
  audio_url
  audio_start
  audio_end
  scene_id

vocabulary
  id
  korean
  chinese
  pos

material
  id
  title
  chapter
  audio_url
  content
```

Characteristics:

- `scene` and `sentence` support admin maintenance.
- `vocabulary` mainly comes from seed data and query logic.
- `material` is a legacy table and is not the main user-uploaded PDF flow.
- Vocabulary, sentence, and audio data still require cleaning and standardization.

### 4.2 Static Data and Static Resources

Static resources include:

- Frontend JavaScript and CSS.
- Pronunciation MP3 files.
- Vocabulary audio map.
- Historical textbook indexes or test resources.
- PDF.js vendor files.

Static audio is mainly played directly by the frontend, usually under `/static/audio/...`.

### 4.3 Browser Local Data

The Web textbook PDF feature uses browser-side storage:

- IndexedDB: caches uploaded PDF page images, text, and table of contents.
- localStorage: saves theme, AI assistant view state, and lightweight UI state.

Currently, user-uploaded PDF files are not uploaded to the server and are not saved in Railway, Git, or R2.

### 4.4 TTS Cache

Google TTS generated audio is stored in:

```text
static/generated-audio/
```

This directory is ignored by Git.

Risks:

- If the deployment platform filesystem is not persistent, cache may be lost after restart.
- Frequent regeneration may increase TTS cost.
- This is not suitable as a long-term standard audio asset library.

### 4.5 Future Data Tables

For real Web/iPhone/iPad synchronization, the following tables are needed:

- `user`
- `user_session`
- `user_textbook`
- `textbook_page`
- `reading_progress`
- `vocabulary_progress`
- `letter_practice_record`
- `sentence_practice_record`
- `note`
- `annotation`
- `favorite`
- `ai_chat_history`

These tables are not implemented yet.

## 5. Module Implementation

### 5.1 Pronunciation Module

#### Current Implementation

Backend:

- `/api/letters` is provided by `handler/sentence.py`.
- It returns the `KOREAN_LETTERS` constant.
- Each item contains pronunciation, sample word, Chinese meaning, pronunciation audio URL, and sample word audio URL.

Frontend:

- Main logic is in `static/js/app.js`.
- `LETTER_DETAILS` stores pronunciation details, tips, example words, and comparisons.
- `PHONETIC_SECTIONS` organizes pronunciation items into consonants, vowels, final consonants, and double final consonants.
- `templates/index.html` provides playback controls: pronunciation, example words, and repeat count.

Mobile:

- `mobile/src/api/webData.ts` also contains `LETTER_DETAILS` and `PHONETIC_SECTIONS`.
- Mobile requests `/api/letters` and merges it with local detail configuration.
- If the Web API is unavailable, mobile uses local fallback data.

#### Playback Logic

Web pronunciation playback flow:

```text
User taps a pronunciation card
  -> generate playback queue according to settings
  -> prefer letter_audio_url static MP3
  -> prefer mapped audio for example words
  -> if no audio, call /api/tts/synthesize
  -> if TTS fails, fall back to browser SpeechSynthesis
```

Mobile notes:

- Mobile does not yet have the complete Web playback settings.
- Mobile should not automatically read “pronunciation + vocabulary” multiple times.
- Mobile should default to playing the pronunciation once. Vocabulary should only be played when the user enters details and taps it.

#### Future Evolution

- Unify Web and mobile pronunciation detail data source.
- Move pronunciation content from JS constants to structured JSON or database.
- Use real human standard audio as the core source.
- Use TTS only as fallback.

### 5.2 Vocabulary Module

#### Current Implementation

Backend:

- `/api/vocabulary` is provided by `handler/sentence.py`.
- It supports vocabulary query.
- Data comes from seed vocabulary and query logic.

Web frontend:

- `templates/index.html` contains the vocabulary container.
- `static/js/vocab-app.jsx` renders the vocabulary page.

Mobile:

- `mobile/src/api/webData.ts` requests `/api/vocabulary`.
- `mobile/App.tsx` displays vocabulary pages.

#### Current Limits

- Without user login, states such as “unlearned”, “to review”, and “mastered” are not real personal learning records.
- Vocabulary data needs further review, including duplicates, wrong words, textbook source, and part of speech.

#### Future Evolution

- Add vocabulary learning status table.
- Connect vocabulary with textbook pages, sentences, and favorites.
- Support cross-device vocabulary state synchronization.
- Establish a vocabulary data cleaning process.

### 5.3 Example Sentence Module

#### Current Implementation

Backend:

- `/api/scenes` is provided by `handler/scene.py`.
- `/api/sentences` is provided by `handler/sentence.py`.
- The `sentence` table supports audio URL, start time, end time, and scene relation.

Web frontend:

- `static/js/sentence-app.jsx` renders scenes and sentences.
- If a sentence has audio, it uses the global audio playback capability.
- If no audio is available, it can fall back to browser Korean speech.

Mobile:

- `mobile/src/api/webData.ts` requests scenes and sentences.
- `mobile/App.tsx` contains scene and sentence practice pages.

#### Future Evolution

- Complete sentence audio assets.
- Support sentence-by-sentence shadowing.
- Support recording and playback.
- Support pronunciation feedback carefully, without discouraging beginners.

### 5.4 Textbook Module

#### Current Implementation

The Web textbook page uses the “user-uploaded PDF” approach.

Main flow:

```text
User uploads PDF
  -> frontend PDF.js parsing
  -> generate low/high resolution page images
  -> extract text layer
  -> save to IndexedDB
  -> display page image
  -> support table of contents, page jump, previous page, next page
```

Core locations:

- `templates/index.html`: textbook page structure.
- `static/js/app.js`: PDF upload, parsing, caching, TOC, reader, and AI assistant logic.

#### Current Limits

- PDF parsing performance depends on browser, device, and PDF quality.
- Large PDFs may load slowly and create storage pressure.
- User PDFs only exist in the current browser and do not sync across devices.
- Mobile PDF upload and annotation are not yet at Web main-flow level.

#### Future Evolution

- Design cloud synchronization for user textbooks after account system is complete.
- Add PDF reading, highlighting, handwriting, annotation, and notes on iPad.
- Connect textbook pages with vocabulary, sentences, audio, and AI history.
- Optimize large PDFs through chapter splitting or incremental rendering.

### 5.5 AI Assistant Module

#### Current Implementation

The AI assistant is mainly used for textbook page Q&A.

Core functions:

- Read current page text.
- Optionally include current page screenshot.
- Send user question and context to AI provider.
- Return answer and render it in the textbook page.

Supported providers:

- Gemini.
- OpenAI.

Default direction:

- Gemini 2.5 Flash is preferred for multimodal page understanding.

#### Current Page Q&A Data Flow

```text
User asks a question
  -> collect current page text and page metadata
  -> include screenshot if needed
  -> call /api/pdf-assistant/chat
  -> handler/pdf_assistant.py chooses provider
  -> provider returns answer
  -> frontend renders answer and saves local history
```

#### Current Limits

- AI reliability depends on provider quality and prompt design.
- AI may still answer beyond the current page if not constrained carefully.
- Markdown formatting sometimes needs cleanup.
- AI history is local and not synced across devices.

#### Future Evolution

- Improve page-based prompt design.
- Add stricter context boundaries.
- Improve answer formatting.
- Add AI history synchronization after login.
- Support textbook-based real-time AI voice conversation training.

### 5.6 Audio and TTS Module

#### Current Implementation

Audio priority:

```text
Static MP3
  -> Server-side TTS
  -> Browser SpeechSynthesis
  -> Error prompt
```

Server-side TTS:

- Provided by `handler/tts.py`.
- Uses Google Cloud TTS.
- Generated audio is cached in `static/generated-audio/`.

#### Current Limits

- TTS is not a substitute for real human standard pronunciation.
- Generated audio cache may not be persistent on some deployment platforms.
- Speech quality and speed still need better control.

#### Future Evolution

- Build a high-quality human audio asset library.
- Use TTS only for user-generated or temporary content.
- Support different voices and speeds.
- Support real-time AI voice conversation.

### 5.7 Mobile Module

#### Current Implementation

Mobile is an Expo/React Native project.

It currently:

- Reads learning data through Web APIs.
- Uses local fallback data when APIs fail.
- Shares one codebase for iPhone and iPad.
- Contains pages for pronunciation, vocabulary, and textbooks.

#### Current Positioning

- iPhone: short practice and review.
- iPad: future immersive textbook workspace.

#### Future Evolution

- Align mobile content with Web.
- Implement login and synchronization.
- Improve iPad layout.
- Add textbook annotation and voice practice.

### 5.8 Admin Backend

#### Current Implementation

Admin pages support:

- Admin login.
- Scene management.
- Sentence management.
- Create, edit, and delete scenes.
- Create, edit, and delete sentences.

#### Current Limits

- No vocabulary admin page.
- No pronunciation content admin page.
- Legacy material admin is not used as the main textbook entrance.

#### Future Evolution

- Add vocabulary management.
- Add pronunciation content management.
- Add audio asset management.
- Add content quality review workflow.

## 6. Deployment and Environment Variables

### 6.1 Local Startup

General local startup flow:

```text
Install Python dependencies
Initialize MySQL database
Configure environment variables
Start server.py
Open browser
```

### 6.2 Database Environment Variables

Database variables should include:

- Host.
- Port.
- User.
- Password.
- Database name.

### 6.3 AI Environment Variables

AI-related variables should include:

- Gemini API key.
- OpenAI API key.
- Default provider.
- Model name.

### 6.4 TTS Environment Variables

TTS variables should include:

- Google Cloud credentials.
- Voice name.
- Audio output path.

### 6.5 Railway Deployment

Railway deployment uses:

- `Procfile`.
- `railway.json`.
- `railway-start.sh`.
- `nixpacks.toml`.

Production service reads `PORT` and listens on `0.0.0.0`.

## 7. Security and Privacy

### 7.1 PDF Privacy

Current PDF files are processed locally in the browser.

Important rules:

- User PDFs should not be uploaded to the server by default.
- If screenshots or text are sent to AI, users should be informed.
- Future cloud textbook sync must include privacy rules.

### 7.2 API Key Management

- API keys must be stored in environment variables.
- API keys must not be committed to Git.
- Frontend should not directly expose secret keys.

### 7.3 Admin Backend Permissions

- Admin write operations require login.
- User-facing GET learning data should not be blocked by admin login state.
- Public POST APIs should be limited and explicit.

### 7.4 Future Account Privacy

When user accounts are implemented, privacy rules should cover:

- User textbooks.
- Notes.
- Favorites.
- Learning history.
- AI conversation history.
- Voice recordings.

## 8. Technical Debt and Risks

### 8.1 Backend Framework Limitations

The current `http.server` backend is lightweight and easy to understand but has limits in routing, middleware, validation, and long-term maintainability.

Future direction:

- Consider migrating to FastAPI or another structured backend framework when the system grows.

### 8.2 Mixed Frontend Structure

The current frontend mixes native JavaScript and React components.

Risk:

- State management may become hard as interactions grow.
- Shared logic may be duplicated.

Future direction:

- Gradually modularize frontend logic.
- Consider a clearer frontend architecture when needed.

### 8.3 Duplicate Pronunciation Data

Web and mobile currently maintain some pronunciation details separately.

Risk:

- Content may become inconsistent.

Future direction:

- Move pronunciation detail data into a shared JSON or API source.

### 8.4 PDF Performance

PDF parsing and rendering may be slow for large files.

Future direction:

- Incremental rendering.
- Page-level cache optimization.
- Large-file guidance.

### 8.5 AI Reliability

AI answers may be inaccurate or too broad.

Future direction:

- Improve prompt constraints.
- Make current-page context explicit.
- Provide fallback messages when AI is unavailable.

### 8.6 Missing Data Synchronization

Without login, personal data cannot sync.

Future direction:

- Build account system and user data model first.

## 9. Future Technical Evolution

### 9.1 Phase 1: Stabilize Current Web

- Stabilize PDF reading and AI Q&A.
- Improve audio fallback.
- Clean content data.
- Improve UI consistency.

### 9.2 Phase 2: Align Mobile and Web Content

- Use shared APIs and shared content definitions.
- Reduce local duplication.
- Improve iPhone and iPad layouts.

### 9.3 Phase 3: Account and Synchronization

- Add user accounts.
- Add user data tables.
- Sync textbooks, vocabulary, sentences, notes, and AI history.

### 9.4 Phase 4: iPad Textbook Workspace

- Large-screen PDF reading.
- Notes and annotation.
- Sentence audio.
- AI Q&A.
- Vocabulary extraction.

### 9.5 Phase 5: High-Quality Audio and Shadowing

- Build human pronunciation assets.
- Add recording and playback.
- Add pronunciation feedback carefully.
- Support shadowing and voice practice.

### 9.6 Phase 6: Internationalization and Multilingual Architecture

- Add language resource files.
- Support multiple UI languages.
- Support multilingual learning explanations.
- Make AI answer language follow the learner’s native language.

## 10. Current Recommended Conclusion

The current technical architecture is suitable for early validation: it is lightweight, easy to change, and already supports the main Web learning flow, local PDF reading, AI Q&A, and mobile prototype.

However, before adding complex innovation features, the project should first stabilize the current Web flow, align mobile content, and build the account and user data foundation. After that, Hanbu can gradually expand into cross-device synchronization, iPad textbook workspace, high-quality audio training, AI voice conversation, and multilingual learning.
