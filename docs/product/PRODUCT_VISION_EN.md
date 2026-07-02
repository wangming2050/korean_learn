# Hanbu Product Vision and Innovation Points

Updated: 2026-06-23

## 1. Product Vision

Hanbu is a Korean learning tool for global beginners. The current Chinese version is used to validate the product direction, learning flow, and content structure. After the core learning loop becomes stable, Hanbu will be expanded into a multilingual version so that learners from different native-language backgrounds can learn Korean pronunciation, vocabulary, example sentences, and textbook content in their own language.

Hanbu does not aim to add as many learning materials as possible. Instead, it helps learners focus on the small piece of content they are studying now and complete a practical learning loop: listen, read, ask, remember, and review.

One-sentence vision:

> Let global Korean beginners learn Korean in a quiet, clear, and sustainable learning space, understand Korean through their own language, and turn textbook content into real learning ability.

## 2. Core Judgment

The most important product judgment is:

> Displaying learning materials is not the same as learning. Reasonable training is learning.

Therefore, Hanbu should not simply list Hangul letters, vocabulary, sentences, and textbooks. Each content unit should provide clear training actions:

- Listen once.
- Repeat after the audio.
- Understand the rule.
- Compare similar or confusing items.
- Add the item into review.
- Return to the textbook context.

## 3. Three-Platform Positioning

### Web

The Web version is the current main product and content workspace.

It is suitable for:

- The main learning entrance for pronunciation, vocabulary, example sentences, and textbooks.
- The admin backend.
- PDF textbook upload and AI Q&A.
- Fast iteration of new functions.
- Debugging data and content structure.

### iPhone

The iPhone version is more suitable for fragmented review.

It is suitable for:

- Daily short practice.
- Quick Hangul listening and reading.
- Vocabulary card review.
- Sentence shadowing.
- Textbook learning progress review.
- Favorites, new words, and reminders.

### iPad

The iPad version is more suitable for immersive textbook learning.

It is suitable for:

- Textbook PDF on the left, audio, vocabulary, and notes on the right.
- Apple Pencil annotation.
- Highlighting and notes.
- Tap a sentence to play audio.
- Sentence-by-sentence textbook shadowing.
- Segmented listening materials.
- AI Q&A based on the current textbook page.
- Large-screen Hangul pronunciation tables.

## 4. Innovation Points

### 4.1 Enhanced AI Scenarios on the Textbook Page

#### 4.1.1 Ask the Current Page

Core function:

- Users can ask questions based directly on the current textbook page. AI answers using the current page text and screenshot. It can explain vocabulary, grammar, phonological changes, provide targeted exercises based on the lesson, and extend the topic beyond the textbook.

Value:

- Reduces the cost of searching for grammar, vocabulary, and listening-script explanations.
- Avoids AI giving answers detached from the textbook.
- Turns a static PDF into an interactive learning material.

Current status:

- The Web version already has basic PDF AI assistant capability.
- Gemini and OpenAI are supported by default.
- Gemini visual capability is suitable for processing page screenshots.

Design reference:

- `korean_learn/web_design/Implemented_design/05-AI助教重设计-对比.html`

#### 4.1.2 AI Voice Conversation Training Entrance

Core function:

- Users can practice listening and speaking through AI voice conversation. The practice can be based on the textbook topic or a user-defined topic. The AI voice assistant should provide multiple voices to support realistic listening practice.

Value:

- After learning textbook vocabulary and grammar, learners can immediately enter voice conversation practice.
- It completes the listening and speaking parts of language learning, extending textbook learning from reading and writing to listening, speaking, reading, and writing.
- Multiple scenarios and voices can help learners avoid the problem of understanding a sentence only when it is spoken by a single voice or at a single speed.

Current status:

- The business logic is not yet implemented.
- UI/UX design drafts have been created.

Design reference:

- `web_design/Innovation_point_design/6-交互原型v6.html`

#### 4.1.3 Textbook Text-to-Speech and Saving Sentences into the Sentence Library

Core function:

- Users can select textbook text and convert it into an audio file.
- Users can listen to the generated audio and use it for shadowing practice.
- The selected text and generated audio can be added to the sentence library as private learning material.
- Textbook content and the sentence library should be connected instead of remaining isolated data.

Value:

- Textbook text can directly become listening and speaking practice material.
- It helps compensate for the lack of listening and speaking practice in traditional textbooks.

Current status:

- The business logic is not yet implemented.
- UI/UX design drafts have been created.

Design reference:

- `web_design/Innovation_point_design/1-初版设计稿.html`

### 4.2 Structured Pronunciation Training

Hangul should not be shown as a flat table of 40 characters. It should be organized by learning cognition:

- Plain consonants, tense consonants, aspirated consonants.
- Simple vowels and compound vowels.
- Basic final consonants.
- Double final consonant rules.

Each pronunciation detail should include:

- Pronunciation tips.
- Positional variation.
- Example words.
- Comparison words.
- Clear explanation when a certain comparison does not exist.

Value:

- Pronunciation is no longer isolated letter data. It is practiced with vocabulary, making pronunciation training less boring and more directly connected to speaking.
- It provides examples of how a sound behaves in different positions.
- Comparison words make consonant learning clearer.

Current status:

- The Web version already has structured data and detail display.
- The mobile version is being aligned with the Web content.

Design reference:

- `web_design/Implemented_design/03-音标-方案A.html`

### 4.3 Pronunciation and Vocabulary Associative Memory

Core function:

- Vocabulary should be connected with audio and pronunciation points.
- Textbook text converted into speech can be saved into the sentence library.
- Textbook, vocabulary, sentence, and audio data should be connected.

Value:

- Textbook content can become audio-based learning material.
- Vocabulary should not be learned as an isolated word list.

Current status:

- The business logic is not yet implemented.
- UI/UX design drafts have been created.

### 4.4 Linkage among Textbooks, Audio, Vocabulary, and Notes

Long-term ideal design:

1. Interactive pronunciation symbols on vocabulary cards.
   - Pronunciation symbols should not be static text only.
   - Learners can tap a specific pronunciation symbol or the whole pronunciation string to hear it.
   - If a learner has weak pronunciation points, those symbols can be visually highlighted when they appear in a word.

2. Pronunciation anchors for correction.
   - When a learner scores poorly in word recording practice, the system should analyze the likely pronunciation source of the problem.
   - Feedback should point to the exact pronunciation anchor instead of only saying “try again”.

3. Textbook-to-vocabulary linkage.
   - Words appearing in textbooks can be saved to the user vocabulary list.
   - Sentences from textbooks can be saved to the sentence library.
   - The learning history should connect textbooks, vocabulary, sentences, audio, and notes.

### 4.5 Local-First User Textbooks

The current textbook direction is user-uploaded PDF rather than unlicensed built-in textbooks.

Value:

- Avoids copyright risk in the early stage.
- Allows users to use their own textbooks.
- Makes the product suitable for different schools and materials.

Current status:

- The Web version supports local PDF upload, rendering, text extraction, and page-level AI Q&A.
- PDF data is stored locally in the browser through IndexedDB.

### 4.6 One Set of Learning Data across Devices

Long-term direction:

- Web, iPhone, and iPad should use the same account and the same learning data.
- Learning progress, user vocabulary, user sentences, textbook library, notes, favorites, and AI history should be synchronized.

Dependency:

- User account system.
- User data ownership model.
- Cross-device synchronization design.

### 4.7 Global Multilingual Learning and Internationalization

Hanbu's long-term goal is to serve Korean beginners from different native-language backgrounds.

Multilingual support should include:

- Interface language.
- Pronunciation explanations.
- Vocabulary meanings.
- Sentence translations.
- AI assistant answer language.
- Learning guidance.

The first version should validate the learning loop in Chinese. After the Chinese version is stable, Hanbu can gradually expand to other languages.

## 5. Product Principles

1. Do not overwhelm beginners with too many choices.
2. Provide a clear starting path before adding complex functions.
3. Treat training as more important than displaying information.
4. Keep AI inside the learning context.
5. Let textbooks, vocabulary, sentences, audio, and notes connect with each other.
6. Keep the current version lightweight and reliable.
7. Build the foundation for cross-device and multilingual expansion.

## 6. What Not to Do

The current version does not aim to:

- Sell courses.
- Build a class, teacher, homework, or institution backend.
- Build a community content feed.
- Claim to provide a real personalized learning plan without login and user data.
- Provide unauthorized built-in textbook resources by default.
- Treat TTS as the final standard pronunciation material.
- Complete all global languages in one stage.
