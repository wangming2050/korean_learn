export type LearningTab = "today" | "letters" | "review" | "scenes" | "textbook";

export type LetterExample = {
  label: string;
  word: string;
  meaning: string;
  audioUrl?: string;
};

export type LetterItem = {
  id: string;
  type: "letter" | "rule";
  kind: "consonant" | "vowel" | "batchim";
  letter: string;
  name: string;
  group: string;
  sound: string;
  playbackText?: string;
  letterAudioUrl?: string;
  tips: string[];
  positionNotes: string[];
  contrastNote?: string;
  examples: LetterExample[];
  contrast?: Array<LetterExample & {
    letter: string;
  }>;
};

export type LetterGroup = {
  id: string;
  title: string;
  description: string;
  categoryLabel?: string;
  categoryNote?: string;
  letters: LetterItem[];
};

export type LetterSection = {
  id: string;
  title: string;
  description: string;
  groups: LetterGroup[];
};

export type VocabularyItem = {
  id: string;
  korean: string;
  chinese: string;
  source: string;
  nextReview: string;
  example: string;
};

export type SceneSentence = {
  id: string;
  korean: string;
  chinese: string;
  hint: string;
};

export type ScenePractice = {
  id: string;
  title: string;
  goal: string;
  sentences: SceneSentence[];
};

export type TextbookPage = {
  id: string;
  title: string;
  page: number;
  endPage: number;
  pageCount: number;
  pageImageUrlTemplate: string;
  audioByPage: Record<string, TextbookAudio[]>;
};

export type TextbookAudio = {
  id: string;
  title: string;
  audioTitle: string;
  url: string;
  audios: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  transcript: string;
  transcriptNote?: string;
};
