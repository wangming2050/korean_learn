import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as Speech from "expo-speech";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Chip } from "./src/components/Chip";
import { SectionCard } from "./src/components/SectionCard";
import { fetchWebLearningData, getFallbackLearningData, WebLearningData } from "./src/api/webData";
import { LetterExample, LetterItem, LearningTab } from "./src/data/learning";
import { colors, radius, shadow, spacing } from "./src/theme/tokens";

type RecordingState = {
  recording: Audio.Recording | null;
  uri: string;
  activeSentenceId: string;
};

type TextbookMark = {
  id: string;
  page: number;
  type: "highlight" | "underline" | "note";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
};

type UploadedPdf = {
  id: string;
  name: string;
  uri: string;
};

const tabs: Array<{ id: LearningTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: "today", label: "今日", icon: "sunny-outline" },
  { id: "letters", label: "音标", icon: "grid-outline" },
  { id: "scenes", label: "练习", icon: "mic-outline" },
  { id: "review", label: "复习", icon: "albums-outline" },
  { id: "textbook", label: "教材", icon: "book-outline" }
];

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 820;
  const fallbackData = useMemo(() => getFallbackLearningData(), []);
  const [learningData, setLearningData] = useState<WebLearningData>(fallbackData);
  const [dataSource, setDataSource] = useState<"web" | "offline">("offline");
  const [activeTab, setActiveTab] = useState<LearningTab>("today");
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(null);
  const [repeatCount, setRepeatCount] = useState(2);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [recordingState, setRecordingState] = useState<RecordingState>({
    recording: null,
    uri: "",
    activeSentenceId: ""
  });
  const practiceSoundRef = useRef<Audio.Sound | null>(null);

  const selectedPage = useMemo(
    () => learningData.textbookPages.find((page) => page.id === selectedPageId) || learningData.textbookPages[0] || null,
    [learningData.textbookPages, selectedPageId]
  );

  useEffect(() => {
    let mounted = true;

    fetchWebLearningData()
      .then((data) => {
        if (!mounted) {
          return;
        }
        setLearningData(data);
        setDataSource("web");
        setSelectedLetter(data.letterSections[0]?.groups[0]?.letters[0] || null);
        setSelectedPageId(data.textbookPages[0]?.id || "");
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setLearningData(fallbackData);
        setDataSource("offline");
        setSelectedLetter(null);
        setSelectedPageId("");
      });

    return () => {
      mounted = false;
    };
  }, [fallbackData]);

  const toggleSavedItem = (label: string) => {
    setSavedItems((items) => (
      items.includes(label) ? items.filter((item) => item !== label) : [...items, label]
    ));
  };

  useEffect(() => () => {
    practiceSoundRef.current?.unloadAsync();
  }, []);

  const speak = (text: string, rate = 0.78) => {
    Speech.stop();
    Speech.speak(text, {
      language: "ko-KR",
      rate,
      pitch: 1.0
    });
  };

  const playAudioOnce = async (url: string) => {
    if (!url) {
      return false;
    }
    try {
      Speech.stop();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true
      });
      await practiceSoundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      practiceSoundRef.current = sound;
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve();
          }
        });
      });
      await sound.unloadAsync();
      if (practiceSoundRef.current === sound) {
        practiceSoundRef.current = null;
      }
      return true;
    } catch {
      return false;
    }
  };

  const playKoreanUnit = async (text: string, audioUrl = "", rate = 0.74) => {
    if (audioUrl && await playAudioOnce(audioUrl)) {
      await wait(420);
      return;
    }
    speak(text, rate);
    await wait(Math.max(820, text.length * 180));
  };

  const playLetterPractice = async (letter: LetterItem) => {
    await practiceSoundRef.current?.unloadAsync();
    Speech.stop();
    for (let index = 0; index < repeatCount; index += 1) {
      await playKoreanUnit(letter.playbackText || letter.sound || letter.name, letter.letterAudioUrl, 0.72);
    }
    for (const example of letter.examples) {
      for (let index = 0; index < repeatCount; index += 1) {
        await playKoreanUnit(example.word, example.audioUrl, 0.74);
      }
      await wait(360);
    }
  };

  const playLetterExample = async (example: LetterExample) => {
    await practiceSoundRef.current?.unloadAsync();
    Speech.stop();
    for (let index = 0; index < repeatCount; index += 1) {
      await playKoreanUnit(example.word, example.audioUrl, 0.74);
    }
  };

  const startRecording = async (sentenceId: string) => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("需要麦克风权限", "允许录音后才能进行跟读回放。");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecordingState({ recording, uri: "", activeSentenceId: sentenceId });
    } catch {
      Alert.alert("录音失败", "请确认麦克风权限和设备录音能力。");
    }
  };

  const stopRecording = async () => {
    if (!recordingState.recording) {
      return;
    }

    await recordingState.recording.stopAndUnloadAsync();
    const uri = recordingState.recording.getURI() || "";
    setRecordingState((state) => ({ ...state, recording: null, uri }));
  };

  const playRecording = async () => {
    if (!recordingState.uri) {
      Alert.alert("还没有录音", "先录一遍，再回放对比。");
      return;
    }

    const { sound } = await Audio.Sound.createAsync({ uri: recordingState.uri });
    await sound.playAsync();
  };

  const content = (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
    >
      {activeTab === "today" && (
        <TodayScreen
          isTablet={isTablet}
          savedCount={savedItems.length}
          dataSource={dataSource}
          learningData={learningData}
          onOpenTab={setActiveTab}
        />
      )}
      {activeTab === "letters" && (
        <LettersScreen
          letterSections={learningData.letterSections}
          selectedLetter={selectedLetter}
          repeatCount={repeatCount}
          onRepeatChange={setRepeatCount}
          onSelectLetter={setSelectedLetter}
          onPlay={playLetterPractice}
          onPlayExample={playLetterExample}
          onSave={toggleSavedItem}
          savedItems={savedItems}
          isTablet={isTablet}
        />
      )}
      {activeTab === "review" && (
        <ReviewScreen
          vocabularyItems={learningData.vocabularyItems}
          savedItems={savedItems}
          onSave={toggleSavedItem}
        />
      )}
      {activeTab === "scenes" && (
        <ScenesScreen
          scenes={learningData.scenePractices}
          recordingState={recordingState}
          onSpeak={speak}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onPlayRecording={playRecording}
        />
      )}
      {activeTab === "textbook" && (
        <TextbookScreen
          isTablet={isTablet}
          pages={learningData.textbookPages}
          selectedPageId={selectedPageId}
          selectedPage={selectedPage}
          onSelectPage={setSelectedPageId}
        />
      )}
    </ScrollView>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.shell}>
          {content}
          <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function BottomTabBar({
  activeTab,
  onChange
}: {
  activeTab: LearningTab;
  onChange: (tab: LearningTab) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.id)}
            style={styles.tabButton}
          >
            <Ionicons
              name={active ? selectedIcon(tab.icon) : tab.icon}
              size={23}
              color={active ? colors.tint : colors.faint}
            />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TodayScreen({
  isTablet,
  savedCount,
  dataSource,
  learningData,
  onOpenTab
}: {
  isTablet: boolean;
  savedCount: number;
  dataSource: "web" | "offline";
  learningData: WebLearningData;
  onOpenTab: (tab: LearningTab) => void;
}) {
  const letterCount = learningData.letterGroups.reduce((sum, group) => sum + group.letters.length, 0);
  const sceneCount = learningData.scenePractices.length;
  const sentenceCount = learningData.scenePractices.reduce((sum, scene) => sum + scene.sentences.length, 0);
  const textbookCount = learningData.textbookPages.length;
  const tasks = [
    { id: "letters", title: "音标", detail: `${letterCount} 个音标。`, tab: "letters" as LearningTab },
    { id: "scenes", title: "场景", detail: `${sceneCount} 个场景，${sentenceCount} 个句子。`, tab: "scenes" as LearningTab },
    { id: "review", title: "词汇", detail: `${learningData.vocabularyItems.length} 个词汇。`, tab: "review" as LearningTab },
    { id: "textbook", title: "教材", detail: `${textbookCount} 个章节入口。`, tab: "textbook" as LearningTab }
  ];

  return (
    <View style={styles.stack}>
      <View style={styles.largeTitleBlock}>
        <Text style={styles.brandEyebrow}>Korean Learn</Text>
        <Text style={styles.largeTitle}>今天</Text>
      </View>

      <View style={styles.continueCard}>
        <View style={styles.continueText}>
          <Text style={styles.continueLabel}>继续学习</Text>
          <Text style={styles.continueTitle}>选择一个小任务</Text>
          <Text style={styles.continueDetail}>从音标、句子、词汇或教材里选一项，完成一段清晰的练习。</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => onOpenTab("letters")} style={styles.primaryCircleButton}>
          <Ionicons name="play" size={22} color={colors.panelRaised} />
        </Pressable>
      </View>

      <SectionCard
        title="今日动作"
        subtitle="每次只做一小段。"
      >
        <View style={styles.taskList}>
          {tasks.map((task) => (
            <Pressable key={task.id} style={styles.taskItem} onPress={() => onOpenTab(task.tab)}>
              <View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDetail}>{task.detail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <View style={[styles.summaryGrid, isTablet && styles.summaryGridTablet]}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{letterCount} 个</Text>
          <Text style={styles.summaryLabel}>音标</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{savedCount} 个</Text>
          <Text style={styles.summaryLabel}>收藏复习</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{sentenceCount} 句</Text>
          <Text style={styles.summaryLabel}>场景句</Text>
        </View>
      </View>

      <Text style={styles.dataSourceNote}>
        {dataSource === "web" ? "数据已连接。" : "未连接数据服务，请先启动本地服务。"}
      </Text>
    </View>
  );
}

function LettersScreen({
  letterSections,
  selectedLetter,
  repeatCount,
  onRepeatChange,
  onSelectLetter,
  onPlay,
  onPlayExample,
  onSave,
  savedItems,
  isTablet
}: {
  letterSections: WebLearningData["letterSections"];
  selectedLetter: LetterItem | null;
  repeatCount: number;
  onRepeatChange: (count: number) => void;
  onSelectLetter: (letter: LetterItem) => void;
  onPlay: (letter: LetterItem) => void;
  onPlayExample: (example: LetterExample) => void;
  onSave: (label: string) => void;
  savedItems: string[];
  isTablet: boolean;
}) {
  if (!selectedLetter) {
    return (
      <EmptyState
        title="还没有读取到音标数据"
        detail="请先启动本地服务。"
      />
    );
  }

  const detail = (
    <LetterDetail
      letter={selectedLetter}
      onPlay={() => onPlay(selectedLetter)}
      onPlayExample={onPlayExample}
      onSave={onSave}
      savedItems={savedItems}
    />
  );

  const letterGrid = (
    <SectionCard title="音标发音训练" subtitle="先选音，再听示范词。">
      <View style={styles.repeatRow}>
        <Chip label="音标" active />
        <Chip label="示范词" active />
        <View style={styles.repeatControl}>
          <Text style={styles.smallLabel}>次数</Text>
          <TextInput
            keyboardType="number-pad"
            value={String(repeatCount)}
            onChangeText={(value) => onRepeatChange(Math.max(1, Number(value) || 1))}
            style={styles.repeatInput}
          />
        </View>
      </View>
      {letterSections.map((section) => (
        <View key={section.id} style={styles.letterSection}>
          <View style={styles.letterSectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.groupDescription}>{section.description}</Text>
          </View>
          {section.groups.map((group) => (
            <View key={group.id} style={styles.letterGroup}>
              {group.categoryLabel ? (
                <View style={styles.categoryNote}>
                  <Text style={styles.categoryLabel}>{group.categoryLabel}</Text>
                  <Text style={styles.groupDescription}>{group.categoryNote}</Text>
                </View>
              ) : null}
              <View>
                <Text style={styles.groupTitle}>{group.title}</Text>
                <Text style={styles.groupDescription}>{group.description}</Text>
              </View>
              <View style={styles.letterGrid}>
                {group.letters.map((letter) => (
                  <Pressable
                    key={letter.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${letter.letter} ${letter.sound}`}
                    onPress={() => {
                      onSelectLetter(letter);
                      onPlay(letter);
                    }}
                    style={[
                      styles.letterButton,
                      selectedLetter.id === letter.id && styles.letterButtonActive
                    ]}
                  >
                    <Text style={[styles.letterGlyph, letter.type === "rule" && styles.ruleGlyph]}>{letter.letter}</Text>
                  </Pressable>
                ))}
              </View>
              {!isTablet && group.letters.some((letter) => letter.id === selectedLetter.id) ? (
                <View style={styles.inlineLetterDetail}>
                  {detail}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </SectionCard>
  );

  return (
    <View style={[styles.responsiveGrid, isTablet && styles.responsiveGridTablet]}>
      <View style={isTablet ? styles.letterGridPane : undefined}>{letterGrid}</View>
      {isTablet ? <View style={styles.letterDetailPane}>{detail}</View> : null}
    </View>
  );
}

function LetterDetail({
  letter,
  onPlay,
  onPlayExample,
  onSave,
  savedItems
}: {
  letter: LetterItem;
  onPlay: () => void;
  onPlayExample: (example: LetterExample) => void;
  onSave: (label: string) => void;
  savedItems: string[];
}) {
  const exampleTitle = letter.type === "rule" ? "规则例词" : letter.kind === "vowel" ? "示范词汇" : "位置示范";

  return (
    <SectionCard
      title={`${letter.letter} ${letter.sound}`}
      subtitle={`${letter.group} · 发音技巧、位置和示范词`}
      action={<IconButton icon="volume-high-outline" label="播放" onPress={onPlay} />}
    >
      <View style={styles.guidanceGrid}>
        {letter.tips.length ? <Guidance title="发音技巧" items={letter.tips} tone="brand" /> : null}
        {letter.positionNotes.length ? <Guidance title="位置说明" items={letter.positionNotes} tone="blue" /> : null}
        {!letter.contrast && letter.contrastNote ? (
          <Guidance title="对比说明" items={[letter.contrastNote]} tone="amber" />
        ) : null}
      </View>

      <Text style={styles.blockTitle}>{exampleTitle}</Text>
      <View style={styles.wordGrid}>
        {letter.examples.map((example) => (
          <WordCard
            key={`${letter.id}-${example.word}`}
            label={example.label}
            korean={example.word}
            chinese={example.meaning}
            saved={savedItems.includes(example.word)}
            onSave={() => onSave(example.word)}
            onPress={() => onPlayExample(example)}
          />
        ))}
      </View>

      {letter.contrast ? (
        <>
          <Text style={styles.blockTitle}>对比词汇</Text>
          <View style={styles.wordGrid}>
            {letter.contrast.map((item) => (
              <WordCard
                key={`${letter.id}-${item.letter}`}
                label={`${item.letter} ${item.label}`}
                korean={item.word}
                chinese={item.meaning}
                saved={savedItems.includes(item.word)}
                onSave={() => onSave(item.word)}
                onPress={() => onPlayExample(item)}
              />
            ))}
          </View>
        </>
      ) : null}
    </SectionCard>
  );
}

function ReviewScreen({
  vocabularyItems,
  savedItems,
  onSave
}: {
  vocabularyItems: WebLearningData["vocabularyItems"];
  savedItems: string[];
  onSave: (label: string) => void;
}) {
  if (!vocabularyItems.length) {
    return (
      <EmptyState
        title="还没有词汇数据"
        detail="请先启动本地服务。"
      />
    );
  }

  return (
    <View style={styles.stack}>
      <SectionCard title="复习队列" subtitle="收藏不是仓库，它会成为下一次训练入口。">
        <View style={styles.wordGrid}>
          {vocabularyItems.map((item) => (
            <WordCard
              key={item.id}
              label={item.nextReview}
              korean={item.korean}
              chinese={`${item.chinese} · ${item.source}`}
              saved={savedItems.includes(item.korean)}
              onSave={() => onSave(item.korean)}
            />
          ))}
        </View>
      </SectionCard>
      <SectionCard title="复习方式" subtitle="第一版先用轻量自评，后续再接发音评分。">
        <View style={styles.taskList}>
          <StaticRow title="认识" detail="看到韩语能想起中文。" />
          <StaticRow title="听懂" detail="听原音能认出词。" />
          <StaticRow title="能说" detail="能跟读，并用录音回放对比。" />
        </View>
      </SectionCard>
    </View>
  );
}

function ScenesScreen({
  scenes,
  recordingState,
  onSpeak,
  onStartRecording,
  onStopRecording,
  onPlayRecording
}: {
  scenes: WebLearningData["scenePractices"];
  recordingState: RecordingState;
  onSpeak: (text: string, rate?: number) => void;
  onStartRecording: (sentenceId: string) => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
}) {
  if (!scenes.length) {
    return (
      <EmptyState
        title="还没有读取到场景数据"
        detail="请先启动本地服务。"
      />
    );
  }

  return (
    <View style={styles.stack}>
      {scenes.map((scene) => (
        <SectionCard key={scene.id} title={scene.title} subtitle={scene.goal}>
          <View style={styles.taskList}>
            {scene.sentences.map((sentence) => {
              const isRecording = recordingState.activeSentenceId === sentence.id && Boolean(recordingState.recording);
              return (
                <View key={sentence.id} style={styles.sentenceCard}>
                  <View style={styles.sentenceTextBlock}>
                    <Text style={styles.koreanSentence}>{sentence.korean}</Text>
                    <Text style={styles.chineseSentence}>{sentence.chinese}</Text>
                    <Text style={styles.taskDetail}>{sentence.hint}</Text>
                  </View>
                  <View style={styles.sentenceActions}>
                    <IconButton icon="volume-high-outline" label="听" onPress={() => onSpeak(sentence.korean, 0.74)} />
                    <IconButton
                      icon={isRecording ? "stop-circle-outline" : "mic-outline"}
                      label={isRecording ? "停" : "录"}
                      onPress={() => (isRecording ? onStopRecording() : onStartRecording(sentence.id))}
                    />
                    <IconButton icon="play-circle-outline" label="回放" onPress={onPlayRecording} />
                  </View>
                </View>
              );
            })}
          </View>
        </SectionCard>
      ))}
    </View>
  );
}

function TextbookScreen({
  isTablet,
  pages,
  selectedPageId,
  selectedPage,
  onSelectPage
}: {
  isTablet: boolean;
  pages: WebLearningData["textbookPages"];
  selectedPageId: string;
  selectedPage: WebLearningData["textbookPages"][number] | null;
  onSelectPage: (id: string) => void;
}) {
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerPage, setReaderPage] = useState(selectedPage?.page || 1);
  const [markMode, setMarkMode] = useState<"highlight" | "underline" | "note">("highlight");
  const [noteDraft, setNoteDraft] = useState("");
  const [marks, setMarks] = useState<TextbookMark[]>([]);
  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdf[]>([]);
  const [activeAudioId, setActiveAudioId] = useState("");
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const textbookSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (selectedPage) {
      setReaderPage(selectedPage.page);
    }
  }, [selectedPage?.id]);

  useEffect(() => () => {
    textbookSoundRef.current?.unloadAsync();
  }, []);

  const textbookGroups = useMemo(() => groupTextbookPages(pages), [pages]);

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setUploadedPdfs((items) => [
      ...items,
      {
        id: `${asset.name}-${Date.now()}`,
        name: asset.name || "教材 PDF",
        uri: asset.uri
      }
    ]);
  };

  const openPdf = async (pdf: UploadedPdf) => {
    const canOpen = await Linking.canOpenURL(pdf.uri);
    if (!canOpen) {
      Alert.alert("无法打开 PDF", "当前模拟器不能直接预览这个文件。");
      return;
    }
    await Linking.openURL(pdf.uri);
  };

  const openReader = (page: WebLearningData["textbookPages"][number]) => {
    onSelectPage(page.id);
    setReaderPage(page.page);
    setReaderOpen(true);
  };

  if (!readerOpen || !selectedPage) {
    return (
      <View style={styles.stack}>
        <View style={styles.largeTitleBlock}>
          <Text style={styles.brandEyebrow}>TEXTBOOK</Text>
          <Text style={styles.largeTitle}>教材</Text>
        </View>

        <SectionCard
          title="教材库"
          subtitle={pages.length ? `${textbookGroups.length} 本教材` : "还没有教材资源"}
          action={<IconButton icon="cloud-upload-outline" label="上传 PDF" onPress={pickPdf} />}
        >
          <View style={[styles.textbookLibraryGrid, isTablet && styles.textbookLibraryGridTablet]}>
            {textbookGroups.map((book) => (
              <Pressable key={book.id} style={styles.textbookBookCard} onPress={() => openReader(book.firstPage)}>
                <View style={styles.textbookBookIcon}>
                  <Ionicons name="book-outline" size={24} color={colors.brandDark} />
                </View>
                <Text style={styles.taskTitle}>{book.title}</Text>
                <Text style={styles.taskDetail}>{book.startPage}-{book.endPage} 页 · {book.unitCount} 个章节</Text>
              </Pressable>
            ))}
            {uploadedPdfs.map((pdf) => (
              <Pressable key={pdf.id} style={styles.textbookBookCard} onPress={() => openPdf(pdf)}>
                <View style={styles.textbookBookIcon}>
                  <Ionicons name="document-text-outline" size={24} color={colors.brandDark} />
                </View>
                <Text style={styles.taskTitle}>{pdf.name}</Text>
                <Text style={styles.taskDetail}>本地 PDF</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>
      </View>
    );
  }

  const currentPageMarks = marks.filter((mark) => mark.page === readerPage);
  const currentPageAudio = selectedPage.audioByPage[String(readerPage)] || [];
  const pageText = String(readerPage).padStart(3, "0");
  const pageUri = selectedPage.pageImageUrlTemplate
    .replace("{page}", pageText)
    .replace("{pageNumber}", String(readerPage));
  const canGoPrev = readerPage > 1;
  const canGoNext = readerPage < selectedPage.pageCount;

  const playTextbookAudio = async (audioId: string, url: string) => {
    if (!url) {
      Alert.alert("无法播放", "这个音频还没有可用地址。");
      return;
    }

    await textbookSoundRef.current?.unloadAsync();
    const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
    textbookSoundRef.current = sound;
    setActiveAudioId(audioId);
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setActiveAudioId("");
        sound.unloadAsync();
      }
    });
  };

  const undoCurrentPageMark = () => {
    const index = [...marks].reverse().findIndex((mark) => mark.page === readerPage);
    if (index < 0) {
      return;
    }
    const targetIndex = marks.length - 1 - index;
    setMarks((items) => items.filter((_, itemIndex) => itemIndex !== targetIndex));
  };

  const addMark = (x: number, y: number) => {
    if (markMode === "note" && !noteDraft.trim()) {
      Alert.alert("先输入备注", "写一点备注内容后，再点页面放置批注。");
      return;
    }

    const normalizedX = Math.max(0, Math.min(1, x / canvasSize.width));
    const normalizedY = Math.max(0, Math.min(1, y / canvasSize.height));

    setMarks((items) => [
      ...items,
      {
        id: `${readerPage}-${Date.now()}`,
        page: readerPage,
        type: markMode,
        x: normalizedX,
        y: normalizedY,
        width: markMode === "note" ? undefined : 0.26,
        height: markMode === "highlight" ? 0.035 : undefined,
        text: markMode === "note" ? noteDraft.trim() : undefined
      }
    ]);
    if (markMode === "note") {
      setNoteDraft("");
    }
  };

  return (
    <View style={styles.stack}>
      <SectionCard
        title={selectedPage.title}
        subtitle={`第 ${readerPage} / ${selectedPage.pageCount} 页`}
        action={<IconButton icon="albums-outline" label="教材库" onPress={() => setReaderOpen(false)} />}
      >
        <View style={styles.readerToolbar}>
          <View style={styles.pageStepper}>
            <IconButton
              icon="chevron-back"
              label="上一页"
              onPress={() => canGoPrev && setReaderPage((page) => Math.max(1, page - 1))}
            />
            <Text style={styles.pageCounter}>{readerPage}</Text>
            <IconButton
              icon="chevron-forward"
              label="下一页"
              onPress={() => canGoNext && setReaderPage((page) => Math.min(selectedPage.pageCount, page + 1))}
            />
          </View>
          <View style={styles.readerTools}>
            <Chip label="高亮" active={markMode === "highlight"} onPress={() => setMarkMode("highlight")} />
            <Chip label="划线" active={markMode === "underline"} onPress={() => setMarkMode("underline")} />
            <Chip label="批注" active={markMode === "note"} onPress={() => setMarkMode("note")} />
            <Chip label="撤销" onPress={undoCurrentPageMark} />
            <Chip label="清除本页" onPress={() => setMarks((items) => items.filter((mark) => mark.page !== readerPage))} />
          </View>
        </View>

        {markMode === "note" ? (
          <TextInput
            value={noteDraft}
            onChangeText={setNoteDraft}
            placeholder="输入批注内容，然后点页面放置"
            placeholderTextColor={colors.faint}
            style={styles.annotationInput}
          />
        ) : null}

        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={`教材第 ${readerPage} 页`}
          onPress={(event) => addMark(event.nativeEvent.locationX, event.nativeEvent.locationY)}
          onLayout={(event) => setCanvasSize(event.nativeEvent.layout)}
          style={styles.textbookPageCanvas}
        >
          <Image source={{ uri: pageUri }} resizeMode="contain" style={styles.textbookPageImage} />
          {currentPageMarks.map((mark) => (
            mark.type === "note" ? (
              <View
                key={mark.id}
                style={[
                  styles.noteMark,
                  {
                    left: Math.max(8, mark.x * canvasSize.width),
                    top: Math.max(8, mark.y * canvasSize.height)
                  }
                ]}
              >
                <Text style={styles.noteMarkText}>{mark.text}</Text>
              </View>
            ) : (
              <View
                key={mark.id}
                style={[
                  mark.type === "highlight" ? styles.highlightMark : styles.underlineMark,
                  {
                    left: Math.max(8, (mark.x - 0.13) * canvasSize.width),
                    top: Math.max(8, mark.y * canvasSize.height),
                    width: (mark.width || 0.22) * canvasSize.width,
                    height: mark.type === "highlight" ? (mark.height || 0.035) * canvasSize.height : 5
                  }
                ]}
              />
            )
          ))}
        </Pressable>

        <TextbookAudioPanel
          audioEntries={currentPageAudio}
          activeAudioId={activeAudioId}
          onPlay={playTextbookAudio}
        />

        <View style={styles.pageTabs}>
          {pages.map((page) => (
            <Chip
              key={page.id}
              label={`${page.page}-${page.endPage}`}
              active={selectedPageId === page.id}
              onPress={() => onSelectPage(page.id)}
            />
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.stack}>
      <SectionCard title={title} subtitle={detail}>
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.faint} />
          <Text style={styles.taskDetail}>启动服务后刷新页面。</Text>
        </View>
      </SectionCard>
    </View>
  );
}

function TextbookAudioPanel({
  audioEntries,
  activeAudioId,
  onPlay
}: {
  audioEntries: WebLearningData["textbookPages"][number]["audioByPage"][string];
  activeAudioId: string;
  onPlay: (audioId: string, url: string) => void;
}) {
  if (!audioEntries.length) {
    return (
      <View style={styles.audioPanel}>
        <Text style={styles.blockTitle}>听力</Text>
        <Text style={styles.taskDetail}>本页暂无听力。</Text>
      </View>
    );
  }

  return (
    <View style={styles.audioPanel}>
      <Text style={styles.blockTitle}>听力与原文</Text>
      {audioEntries.map((entry) => (
        <View key={entry.id} style={styles.audioEntry}>
          <View style={styles.audioEntryHead}>
            <Text style={styles.taskTitle}>{entry.title}</Text>
            <Text style={styles.taskDetail}>{entry.audioTitle}</Text>
          </View>
          <View style={styles.sentenceActions}>
            {(entry.audios.length ? entry.audios : [{ id: entry.id, title: entry.audioTitle || "播放", url: entry.url }]).map((audio) => (
              <IconButton
                key={`${entry.id}-${audio.id}`}
                icon={activeAudioId === audio.id ? "pause-circle-outline" : "play-circle-outline"}
                label={activeAudioId === audio.id ? "播放中" : audio.title}
                onPress={() => onPlay(audio.id, audio.url)}
              />
            ))}
          </View>
          {entry.transcript ? (
            <Text style={styles.transcriptText}>{entry.transcript}</Text>
          ) : entry.transcriptNote ? (
            <Text style={styles.taskDetail}>{entry.transcriptNote}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function groupTextbookPages(pages: WebLearningData["textbookPages"]) {
  const groups = new Map<string, {
    id: string;
    title: string;
    firstPage: WebLearningData["textbookPages"][number];
    startPage: number;
    endPage: number;
    unitCount: number;
  }>();

  pages.forEach((page) => {
    const title = page.title.split(" · ")[0] || page.title;
    const id = title;
    const existing = groups.get(id);
    if (!existing) {
      groups.set(id, {
        id,
        title,
        firstPage: page,
        startPage: page.page,
        endPage: page.endPage,
        unitCount: 1
      });
      return;
    }

    existing.startPage = Math.min(existing.startPage, page.page);
    existing.endPage = Math.max(existing.endPage, page.endPage);
    existing.unitCount += 1;
  });

  return [...groups.values()];
}

function Guidance({ title, items, tone }: { title: string; items: string[]; tone: "brand" | "blue" | "amber" }) {
  return (
    <View style={[styles.guidance, tone === "blue" && styles.guidanceBlue, tone === "amber" && styles.guidanceAmber]}>
      <Text style={styles.guidanceTitle}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.guidanceText}>{item}</Text>
      ))}
    </View>
  );
}

function WordCard({
  label,
  korean,
  chinese,
  saved,
  onSave,
  onPress
}: {
  label: string;
  korean: string;
  chinese: string;
  saved: boolean;
  onSave: () => void;
  onPress?: () => void;
}) {
  return (
    <Pressable style={[styles.wordCard, saved && styles.wordCardSaved]} onPress={onPress || onSave}>
      <View style={styles.wordCardTop}>
        <Text style={styles.wordLabel}>{label}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="收藏" onPress={onSave} hitSlop={10}>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={16} color={saved ? colors.brandDark : colors.faint} />
        </Pressable>
      </View>
      <Text style={styles.wordKorean}>{korean}</Text>
      <Text style={styles.wordChinese}>{chinese}</Text>
    </Pressable>
  );
}

function StaticRow({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <View style={styles.staticRow}>
      <View style={styles.staticRowText}>
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.taskDetail}>{detail}</Text>
      </View>
      {action}
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <Ionicons name={icon} size={18} color={colors.brandDark} />
      <Text style={styles.iconButtonText}>{label}</Text>
    </Pressable>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function selectedIcon(icon: keyof typeof Ionicons.glyphMap): keyof typeof Ionicons.glyphMap {
  const map: Partial<Record<keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap>> = {
    "sunny-outline": "sunny",
    "grid-outline": "grid",
    "mic-outline": "mic",
    "albums-outline": "albums",
    "book-outline": "book"
  };

  return map[icon] || icon;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page
  },
  shell: {
    flex: 1,
    backgroundColor: colors.page
  },
  brandEyebrow: {
    color: colors.tint,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  tabBar: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.panelRaised
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  tabText: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: "700"
  },
  tabTextActive: {
    color: colors.tint
  },
  contentScroll: {
    flex: 1
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: 92
  },
  contentTablet: {
    flexGrow: 1,
    maxWidth: 1180,
    width: "100%",
    alignSelf: "center",
    padding: spacing.xl,
    paddingBottom: 108
  },
  stack: {
    gap: spacing.lg
  },
  largeTitleBlock: {
    gap: spacing.xs,
    paddingTop: spacing.sm
  },
  largeTitle: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900"
  },
  continueCard: {
    minHeight: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.soft
  },
  continueText: {
    flex: 1,
    gap: spacing.xs
  },
  continueLabel: {
    color: colors.tint,
    fontSize: 12,
    fontWeight: "800"
  },
  continueTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900"
  },
  continueDetail: {
    maxWidth: 560,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  primaryCircleButton: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: colors.tint
  },
  summaryGrid: {
    gap: spacing.sm
  },
  summaryGridTablet: {
    flexDirection: "row"
  },
  summaryItem: {
    flex: 1,
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  dataSourceNote: {
    color: colors.faint,
    fontSize: 12,
    lineHeight: 18
  },
  emptyState: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg
  },
  taskList: {
    gap: spacing.sm
  },
  taskItem: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised
  },
  taskTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  taskDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  responsiveGrid: {
    gap: spacing.lg
  },
  responsiveGridTablet: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  letterGridPane: {
    flex: 1,
    minWidth: 0
  },
  letterDetailPane: {
    width: 360,
    flexShrink: 0
  },
  inlineLetterDetail: {
    marginTop: spacing.sm
  },
  textbookGridTablet: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  textbookLibraryGrid: {
    gap: spacing.sm
  },
  textbookLibraryGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  textbookBookCard: {
    minHeight: 132,
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised,
    flexGrow: 1,
    flexBasis: 220
  },
  textbookBookIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft
  },
  repeatRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  repeatControl: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.panelRaised
  },
  smallLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  repeatInput: {
    minWidth: 36,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center"
  },
  letterGroup: {
    gap: spacing.sm
  },
  letterSection: {
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line
  },
  letterSectionHeader: {
    gap: spacing.xs
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  categoryNote: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.line
  },
  categoryLabel: {
    color: colors.brandDark,
    fontSize: 13,
    fontWeight: "900"
  },
  groupTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  groupDescription: {
    color: colors.muted,
    fontSize: 13
  },
  letterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  letterButton: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised
  },
  letterButtonActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  letterGlyph: {
    color: colors.brandDark,
    fontSize: 28,
    fontWeight: "900"
  },
  ruleGlyph: {
    fontSize: 22
  },
  guidanceGrid: {
    gap: spacing.sm
  },
  guidance: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft
  },
  guidanceBlue: {
    backgroundColor: colors.blueSoft
  },
  guidanceAmber: {
    backgroundColor: colors.amberSoft
  },
  guidanceTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  guidanceText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  blockTitle: {
    marginTop: spacing.sm,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  wordCard: {
    minWidth: 138,
    flexGrow: 1,
    flexBasis: 138,
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised
  },
  wordCardSaved: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft
  },
  wordCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  wordLabel: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800"
  },
  wordKorean: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  wordChinese: {
    color: colors.muted,
    fontSize: 13
  },
  sentenceCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised
  },
  sentenceTextBlock: {
    gap: spacing.xs
  },
  koreanSentence: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900"
  },
  chineseSentence: {
    color: colors.muted,
    fontSize: 14
  },
  sentenceActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  iconButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.panelRaised
  },
  iconButtonText: {
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: "800"
  },
  staticRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised
  },
  staticRowText: {
    flex: 1,
    gap: 2
  },
  readerToolbar: {
    gap: spacing.sm
  },
  pageStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  pageCounter: {
    minWidth: 58,
    textAlign: "center",
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  readerTools: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  annotationInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    color: colors.ink,
    backgroundColor: colors.panelRaised,
    fontSize: 14
  },
  textbookPageCanvas: {
    width: "100%",
    aspectRatio: 0.707,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: "#fbfaf6"
  },
  textbookPageImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%"
  },
  highlightMark: {
    position: "absolute",
    borderRadius: radius.sm,
    backgroundColor: "rgba(244, 183, 88, 0.36)"
  },
  underlineMark: {
    position: "absolute",
    borderRadius: radius.pill,
    backgroundColor: "rgba(244, 183, 88, 0.78)"
  },
  noteMark: {
    position: "absolute",
    maxWidth: 190,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: radius.sm,
    backgroundColor: colors.amberSoft
  },
  noteMarkText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  pageTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  audioPanel: {
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  audioEntry: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.panelRaised
  },
  audioEntryHead: {
    gap: 2
  },
  transcriptText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 24
  }
});
