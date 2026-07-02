# Hanbu Future Iteration Roadmap

Updated: 2026-06-23  
Document version: v2, reorganized by account foundation, required capabilities, innovation points, and long-term planning

## 1. Roadmap Principles

Future iterations should follow this priority order:

1. Complete user login and user data ownership first.
2. Complete the required basic capabilities of the current Web and mobile versions.
3. Then develop innovation points, including textbook AI, voice conversation, text-to-speech, pronunciation scoring, and pronunciation-vocabulary linkage.
4. After the Chinese version is validated, develop internationalization and multilingual versions for learners with different native languages.
5. Finally, develop long-term content ecosystem, complex personalization, and commercialization capabilities.

Core judgment:

Without login, it is not suitable to build real learning plans, user-imported content, cross-device synchronization, vocabulary status, textbook sentence storage, or personalized review.

Therefore, the account system and user data model must come first.

## 2. Current Version Baseline

The current project can be viewed as:

- A Web main product.
- A mobile prototype.
- An iPad direction under planning.

Current Web capabilities:

- Learning path.
- Pronunciation learning.
- Vocabulary browsing.
- Example sentence learning.
- Local PDF textbook reading.
- Basic textbook page AI Q&A.
- Google TTS fallback capability.
- Admin backend for scene and sentence management.

Current mobile capabilities or work in progress:

- Expo/React Native universal app.
- Learning data loaded through Web APIs.
- One codebase for iPhone and iPad.
- UI and data alignment for pronunciation, vocabulary, and textbook pages.

Current gaps:

- No user login.
- No user data ownership.
- No cross-device synchronization.
- Weak linkage among pronunciation, vocabulary, example sentences, and textbooks.
- No unified data model for user-imported content.
- Speech scoring, AI voice conversation, and textbook text-to-speech are not yet implemented.
- Multilingual and internationalization capability is not yet implemented; the current version still validates the learning loop with Chinese users.

## 3. Phase 1: User Login and Data Foundation

Priority: P0  
Goal: Give user data ownership and build the foundation for later innovation points.

### 3.1 Why This Must Come First

The following capabilities depend on user identity:

- User-added related vocabulary.
- User-imported vocabulary.
- User-imported example sentences.
- Adding textbook sentences to the sentence library.
- User textbook library.
- Reading progress.
- Vocabulary status.
- Pronunciation practice records.
- Speech scoring history.
- AI voice conversation records.
- Synchronization across Web, iPhone, and iPad.

Without login, these features can only be temporary local states and cannot become real product capabilities.

### 3.2 Suggested Capabilities

Account:

- User registration.
- User login.
- Logout.
- Persistent login state.
- Basic user profile.

Data ownership:

- All user-imported content must be bound to a user.
- All learning records must be bound to a user.
- All textbooks, notes, favorites, and histories must be bound to a user.

Basic synchronization:

- Web and mobile should use the same user identity.
- After login, the user should read their own data.
- Unlogged users can still browse basic content but cannot save cross-device data.

### 3.3 Suggested New Data Models

- User table.
- User session table.
- User textbook table.
- User vocabulary table.
- User sentence table.
- User pronunciation practice record table.
- User vocabulary learning status table.
- User sentence practice record table.
- User AI history table.
- User favorite table.

### 3.4 Acceptance Criteria

- Users can register, log in, and log out.
- Login state remains after refresh.
- Unlogged users can still browse basic content.
- Saved data belongs to the current user.
- Mobile can read user data using the same account system.

## 4. Phase 2: Required Basic Capability Improvements

Priority: P0  
Goal: Make the current main flows reliable before adding innovation features.

### 4.1 Pronunciation Foundation

Must complete:

- Review all pronunciation tips.
- Review example words.
- Review initial, medial, final consonant, and comparison explanations.
- Add clear explanation when there is no comparison or no final-position sound.
- Define the priority among static audio, TTS, and browser speech.
- Keep mobile pronunciation content consistent with Web.
- Change mobile default playback to one pronunciation item only, without automatically reading vocabulary.

Acceptance criteria:

- The same pronunciation item has consistent explanation on Web and mobile.
- Tapping a pronunciation item plays audio correctly.
- Tapping an example word plays only that word.
- Mobile no longer plays pronunciation plus vocabulary multiple times by default.

### 4.2 Vocabulary and Example Sentence Data Cleaning

Must complete:

- Remove duplicate words.
- Fix suspected wrong words.
- Add vocabulary source information.
- Distinguish platform vocabulary from user-imported vocabulary.
- Clean sentence translations.
- Define sentence audio fields and playback rules.

Acceptance criteria:

- Platform vocabulary and user vocabulary can be distinguished.
- Platform sentences and user sentences can be distinguished.
- Wrong or duplicate words do not continue to expand.

### 4.3 Stable PDF Textbook and AI “Ask This Page”

Must complete:

- Stabilize PDF upload, conversion, page turning, and deletion.
- Improve AI answer formatting and avoid raw Markdown artifacts such as `###` and `**` on the page.
- Define AI context range: current page, nearby pages, and screenshots when necessary.
- AI unavailability should not affect textbook reading.

Acceptance criteria:

- Users can upload and read PDF files reliably.
- AI “Ask this page” answers based on the current page.
- AI does not claim to have read the whole PDF.
- The page remains readable even without an AI key.

### 4.4 Mobile Content Alignment

Must complete:

- Restore the pronunciation home UI according to the design draft.
- Implement the pronunciation detail page according to the design draft.
- Keep vocabulary content basically consistent with Web.
- Keep the correct textbook library and textbook detail structure.
- Remove all developer-facing explanatory text.

Acceptance criteria:

- Core pages display naturally on both iPhone and iPad.
- Mobile content is not obviously behind Web content.
- Mobile does not show developer notes such as “keep consistent with Web”.

## 5. Phase 3: Innovation Point 1 — Pronunciation and Vocabulary Linkage

Priority: P1  
Goal: Make pronunciation learning connected to real vocabulary training.

### 5.1 Pronunciation-Related Vocabulary

Core capability:

- Each pronunciation item links to a set of vocabulary.
- Vocabulary shows the sound in different positions.
- The pronunciation detail page displays related words.
- Users can tap related words to play audio.

Data sources:

1. Platform content.
2. User-added related vocabulary.

Dependencies:

- User login.
- User vocabulary table.
- Pronunciation-vocabulary relation table.
- Audio playback and TTS fallback.

Acceptance criteria:

- Platform can configure sample words for each pronunciation item.
- Logged-in users can add their own words to a pronunciation item.
- User-added words belong only to that user.
- The pronunciation detail page can distinguish platform words from user words.

### 5.2 Associative Memory between Pronunciation and Vocabulary

Core capability:

- Pronunciation symbols on word cards become interactive.
- Users can see which key pronunciation points appear in a word.
- Weak pronunciation points can reappear during vocabulary learning.

Value:

- Users review pronunciation while learning vocabulary.
- Pronunciation training no longer only happens on the pronunciation page.

Acceptance criteria:

- Vocabulary details can show related pronunciation items.
- Tapping a pronunciation symbol can return to the corresponding explanation.
- The system can recommend words containing weak pronunciation points based on practice records.

## 6. Phase 4: Innovation Point 2 — Vocabulary and Example Sentence Linkage

Priority: P1  
Goal: Let vocabulary enter sentences, speech, and review.

### 6.1 Vocabulary-Related Example Sentences

Core capability:

- Each vocabulary item can link to platform example sentences.
- Users can add their own example sentences to a word.
- Users can add sentences from textbooks to the sentence library and link them to words.

Vocabulary sources:

1. Platform content.
2. User-imported content.

Sentence sources:

1. Platform content.
2. User-imported content.
3. Sentences added from textbook pages.

Dependencies:

- User login.
- User vocabulary table.
- User sentence table.
- Vocabulary-sentence relation table.
- Textbook sentence extraction capability.

Acceptance criteria:

- Vocabulary details show related example sentences.
- Users can add example sentences for a word.
- Users can select a sentence on the textbook page and add it to the sentence library.
- Platform sentences and user sentences can be distinguished.

### 6.2 Example Sentence Voice Generation

Core capability:

- After importing an example sentence, the system can generate Korean audio for it.
- Generated audio can be saved to the user sentence library.
- Users can use the audio for listening, reading, and shadowing.

Dependencies:

- TTS service.
- Audio storage strategy.
- User sentence table.
- User audio resource table.

Acceptance criteria:

- Users can generate audio after adding a sentence.
- Generated audio plays in sentence details.
- Audio belongs to the current user.

## 7. Phase 5: Innovation Point 3 — Enhanced Textbook AI Scenarios

Priority: P1  
Goal: Turn textbooks from static PDF files into learning spaces that can be asked, heard, practiced, and saved.

### 7.1 AI “Ask This Page”

Current status:

- Basic Web capability exists.

Needed improvements:

- Improve AI panel UI.
- Improve answer formatting.
- Support grammar, new words, phonological rules, targeted exercises, and topic extension based on the current page.
- Support screenshot context when necessary.
- Avoid unsupported claims about reading the whole PDF.

Acceptance criteria:

- Users can ask about the current page.
- AI answers are based on the page.
- AI can explain vocabulary, grammar, sentence meaning, and pronunciation rules.
- AI can provide exercises related to the current page.

### 7.2 Textbook AI Voice Conversation Training Entrance

Core capability:

- Users can enter AI voice conversation practice from the textbook page.
- The practice topic can be based on the current lesson or user-defined.
- The system should support multiple voices and possibly different speech speeds.
- AI should provide one-on-one real-time listening and speaking training.

Value:

- Textbook learning no longer stops at reading.
- Learners can immediately use textbook vocabulary and grammar in listening and speaking practice.
- It helps close the gap between understanding content and speaking.

Dependencies:

- Speech recognition.
- TTS or real-time voice model.
- Conversation management.
- User practice history.
- User login.

Acceptance criteria:

- Users can start voice conversation from the textbook page.
- AI can generate a practice topic based on the current lesson.
- Users can speak and receive AI responses.
- Conversation history can be saved after user login is implemented.

### 7.3 Textbook Text-to-Speech and Adding to Sentence Library

Core capability:

- Users can select text in the textbook and generate audio.
- Generated audio can be played immediately.
- Selected text and audio can be added to the sentence library.
- Sentences added from textbooks can be linked to vocabulary and notes.

Dependencies:

- Text selection capability.
- TTS service.
- Audio storage.
- User sentence table.
- User audio table.

Acceptance criteria:

- Users can select a textbook sentence and generate speech.
- Generated speech can be played.
- The sentence and audio can be saved to the user sentence library.

## 8. Phase 6: Innovation Point 4 — Speech Scoring and Pronunciation Feedback

Priority: P1/P2

### 8.1 Vocabulary Speech Scoring with Pronunciation-Level Recognition

Core capability:

- Users can record a word.
- The system scores pronunciation.
- The system identifies weak pronunciation points.

Value:

- Feedback should point to the actual pronunciation problem, not just give a score.

### 8.2 Example Sentence Speech Scoring

Core capability:

- Users can record a sentence.
- The system evaluates pronunciation, rhythm, and fluency.
- Feedback should be understandable and not discourage beginners.

### 8.3 Pronunciation Anchor Correction

Core capability:

- When a learner performs poorly, the system maps the issue to a pronunciation anchor.
- The learner can return to the corresponding pronunciation explanation and related vocabulary.

## 9. Phase 7: Cross-Device Sync and iPad Textbook Workspace

### 9.1 Cross-Device Synchronization

Core capability:

- Web, iPhone, and iPad use one account.
- Textbooks, notes, vocabulary, sentences, favorites, progress, and AI history sync across devices.

### 9.2 iPad Textbook Workspace

Core capability:

- Large-screen textbook reading.
- Notes and annotations.
- Sentence audio playback.
- AI Q&A.
- Vocabulary and sentence extraction.
- Possible Apple Pencil support.

## 10. Phase 8: Internationalization and Global Capability Enhancement

### 10.1 Global Multilingual Version

Core capability:

- Support interface localization.
- Support native-language explanations for pronunciation, vocabulary, sentences, and AI answers.
- Support language switching.
- Keep Chinese as a fallback language if needed.

Implementation direction:

- Build a multilingual resource model.
- Use manual translation for core UI.
- Use AI-assisted translation plus manual review for learning content.
- Let AI assistant answer in the learner’s native language.

### 10.2 Multiple Voices and Multiple Speech Speeds

Core capability:

- Provide different voices for listening training.
- Provide different speeds for beginners and advanced learners.
- Avoid making users dependent on only one voice.

## 11. Phase 9: Other Long-Term Plans

Possible long-term directions:

- Learning statistics.
- Personalized review.
- More textbook formats.
- Better content authoring tools.
- Teacher or classroom use if needed.
- Commercial functions after the learning loop is validated.

## 12. Overall Priority Summary

### P0: Must Be Completed First

- User login and user data ownership.
- Basic Web stability.
- Pronunciation content review.
- Vocabulary and sentence data cleaning.
- Stable textbook PDF and AI ask-page capability.
- Mobile content alignment.

### P1: Core Innovation Points

- Pronunciation-vocabulary linkage.
- Vocabulary-sentence linkage.
- Textbook AI enhancement.
- Textbook AI voice conversation.
- Textbook text-to-speech.
- Example sentence audio generation.

### P2: Cross-Device and Immersive Learning

- Web/iPhone/iPad synchronization.
- iPad textbook workspace.
- Speech scoring and pronunciation anchors.

### P3: Long-Term Expansion

- Global multilingual version.
- Multi-voice and multi-speed training.
- Content ecosystem.
- Commercialization after product validation.
