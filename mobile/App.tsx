import { Ionicons } from "@expo/vector-icons";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
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
import { fetchWebLearningData, getApiBaseUrl, getFallbackLearningData, WebLearningData } from "./src/api/webData";
import { LetterExample, LetterItem, LearningTab } from "./src/data/learning";
import { colors, radius, shadow, spacing } from "./src/theme/tokens";

type RecordingState = {
  recording: any | null;
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

type LetterCategory = "辅音" | "元音" | "收音" | "双元音";

async function loadExpoAudio(): Promise<any | null> {
  return null;
}

const tabs: Array<{ id: LearningTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: "letters", label: "音标", icon: "grid-outline" },
  { id: "review", label: "词汇", icon: "chatbubble-ellipses-outline" },
  { id: "textbook", label: "教材", icon: "book-outline" }
];

export default function App() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 820;
  const fallbackData = useMemo(() => getFallbackLearningData(), []);
  const [learningData, setLearningData] = useState<WebLearningData>(fallbackData);
  const [dataSource, setDataSource] = useState<"web" | "offline">("offline");
  const [activeTab, setActiveTab] = useState<LearningTab>("letters");
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(
    fallbackData.letterSections[0]?.groups[0]?.letters[0] || null
  );
  const [repeatCount, setRepeatCount] = useState(1);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [recordingState, setRecordingState] = useState<RecordingState>({
    recording: null,
    uri: "",
    activeSentenceId: ""
  });
  const practiceSoundRef = useRef<any | null>(null);
  const ttsRequestCacheRef = useRef<Map<string, Promise<string>>>(new Map());

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
        setSelectedLetter(fallbackData.letterSections[0]?.groups[0]?.letters[0] || null);
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
    practiceSoundRef.current?.remove?.();
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
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true
      });
      practiceSoundRef.current?.remove?.();

      const player = createAudioPlayer(url, { updateInterval: 120 });
      practiceSoundRef.current = player;

      const played = await new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (success: boolean) => {
          if (settled) {
            return;
          }
          settled = true;
          subscription?.remove?.();
          resolve(success);
        };
        const subscription = (player as any).addListener?.("playbackStatusUpdate", (status: any) => {
          if (status?.didJustFinish) {
            finish(true);
          }
          if (status?.error) {
            finish(false);
          }
        });

        player.play();
        setTimeout(() => {
          if (player.duration > 0 && player.currentTime >= player.duration) {
            finish(true);
          }
        }, Math.max(1500, (player.duration || 0) * 1000 + 500));
        setTimeout(() => finish(false), 20000);
      });

      player.remove();
      if (practiceSoundRef.current === player) {
        practiceSoundRef.current = null;
      }
      return played;
    } catch {
      return false;
    }
  };

  const synthesizeKoreanSpeech = async (text: string, slow = false) => {
    const normalizedText = String(text || "").trim();
    if (!normalizedText) {
      return "";
    }

    const cacheKey = JSON.stringify({ text: normalizedText, slow });
    if (!ttsRequestCacheRef.current.has(cacheKey)) {
      ttsRequestCacheRef.current.set(cacheKey, (async () => {
        const response = await fetch(`${getApiBaseUrl()}/api/tts/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: normalizedText,
            slow,
            speakingRate: slow ? 0.75 : 1
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "TTS 生成失败");
        }
        const audioUrl = payload.audioUrl || "";
        return audioUrl.startsWith("/") ? `${getApiBaseUrl()}${audioUrl}` : audioUrl;
      })());
    }

    return ttsRequestCacheRef.current.get(cacheKey) || "";
  };

  const playTtsUnit = async (text: string, rate = 0.74, slow = false) => {
    try {
      const audioUrl = await synthesizeKoreanSpeech(text, slow);
      if (audioUrl && await playAudioOnce(audioUrl)) {
        await wait(420);
        return;
      }
    } catch {
      // Fall back to device speech below.
    }

    speak(text, rate);
    await wait(Math.max(820, text.length * 180));
  };

  const playLetterUnit = async (letter: LetterItem) => {
    const text = letter.playbackText || letter.sound || letter.name || letter.letter;
    if (letter.letterAudioUrl && await playAudioOnce(letter.letterAudioUrl)) {
      await wait(420);
      return;
    }

    await playTtsUnit(text, 0.72, false);
  };

  const playWordUnit = async (word: string) => {
    await playTtsUnit(word, 0.74, false);
  };

  const playLetterPractice = async (letter: LetterItem) => {
    practiceSoundRef.current?.remove?.();
    Speech.stop();
    for (let index = 0; index < repeatCount; index += 1) {
      await playLetterUnit(letter);
    }
  };

  const playLetterExample = async (example: LetterExample) => {
    practiceSoundRef.current?.remove?.();
    Speech.stop();
    for (let index = 0; index < repeatCount; index += 1) {
      await playWordUnit(example.word);
    }
  };

  const startRecording = async (sentenceId: string) => {
    try {
      const AudioModule = await loadExpoAudio();
      if (!AudioModule) {
        Alert.alert("录音暂不可用", "当前 Expo Go 没有加载音频原生模块，可以先查看页面内容。");
        return;
      }

      const permission = await AudioModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("需要麦克风权限", "允许录音后才能进行跟读回放。");
        return;
      }

      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });
      const recording = new AudioModule.Recording();
      await recording.prepareToRecordAsync(AudioModule.RecordingOptionsPresets.HIGH_QUALITY);
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

    const AudioModule = await loadExpoAudio();
    if (!AudioModule) {
      Alert.alert("回放暂不可用", "当前 Expo Go 没有加载音频原生模块。");
      return;
    }

    const { sound } = await AudioModule.Sound.createAsync({ uri: recordingState.uri });
    await sound.playAsync();
  };

  const content = activeTab === "letters" ? (
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
  ) : (
    <ScrollView
      style={styles.contentScroll}
      contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
    >
      {activeTab === "review" && (
        <ReviewScreen
          vocabularyItems={learningData.vocabularyItems}
          savedItems={savedItems}
          onSave={toggleSavedItem}
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
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
              size={22}
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
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 430);
  const horizontalInset = width < 360 ? 18 : width < 390 ? 22 : 28;
  const gridGap = width < 360 ? 8 : 10;
  const gridWidth = pageWidth - horizontalInset * 2;
  const minCellSize = width < 360 ? 50 : 54;
  const maxCellSize = 64;
  const gridColumns = Math.max(4, Math.floor((gridWidth + gridGap) / (minCellSize + gridGap)));
  const letterCellSize = Math.floor((gridWidth - gridGap * (gridColumns - 1)) / gridColumns);
  const clampedLetterCellSize = Math.min(maxCellSize, letterCellSize);
  const sectionFrameStyle = {
    width: pageWidth,
    alignSelf: "center" as const,
    paddingHorizontal: horizontalInset
  };
  const cardFrameStyle = {
    width: pageWidth - horizontalInset * 2,
    alignSelf: "center" as const
  };

  void repeatCount;
  void onRepeatChange;
  void isTablet;

  // 音标详情页面状态
  const [showDetail, setShowDetail] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // 音标分类 tabs
  const [activeCategory, setActiveCategory] = useState<LetterCategory>("辅音");
  const categoryTabs: LetterCategory[] = ["辅音", "元音", "收音", "双元音"];

  // 获取当前分类下的所有字母
  const currentLetters = useMemo(() => {
    const letters: LetterItem[] = [];
    letterSections.forEach(section => {
      section.groups.forEach(group => {
        const groupId = group.id.toLowerCase();
        const isDoubleVowelGroup = groupId.includes("double-vowel") || group.title.includes("双元音");

        if (activeCategory === "辅音" && !group.letters.some(letter => letter.kind === "consonant")) {
          return;
        }
        if (activeCategory === "元音" && (!group.letters.some(letter => letter.kind === "vowel") || isDoubleVowelGroup)) {
          return;
        }
        if (activeCategory === "双元音" && !isDoubleVowelGroup) {
          return;
        }
        if (activeCategory === "收音" && !group.letters.some(letter => letter.kind === "batchim")) {
          return;
        }

        letters.push(...group.letters.filter((letter) => {
          if (activeCategory === "辅音") return letter.kind === "consonant";
          if (activeCategory === "元音") return letter.kind === "vowel";
          if (activeCategory === "双元音") return letter.kind === "vowel";
          return letter.kind === "batchim";
        }));
      });
    });
    return letters;
  }, [letterSections, activeCategory]);

  // 获取音标类型标签
  const getLetterTypeTag = (letter: LetterItem): string => {
    if (letter.kind === "vowel") {
      return letter.group.includes("双") ? "双元音" : "单元音";
    }
    if (letter.kind === "batchim") {
      return "收音";
    }
    // 辅音分类
    if (letter.group.includes("松")) return "松音";
    if (letter.group.includes("紧")) return "紧音";
    if (letter.group.includes("送")) return "送气音";
    if (letter.kind === "consonant") return "辅音";
    return letter.group;
  };

  // 打开音标详情页面
  const openLetterDetail = (letter: LetterItem) => {
    onSelectLetter(letter);
    setIsFavorite(savedItems.includes(letter.letter));
    setShowDetail(true);
  };

  // 关闭音标详情页面
  const closeLetterDetail = () => {
    setShowDetail(false);
  };

  // 处理收藏
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (selectedLetter) {
      onSave(selectedLetter.letter);
    }
  };

  // 获取所有字母的索引
  const allLetters = useMemo(() => {
    const letters: LetterItem[] = [];
    letterSections.forEach(section => {
      section.groups.forEach(group => {
        group.letters.forEach(letter => {
          letters.push(letter);
        });
      });
    });
    return letters;
  }, [letterSections]);

  const currentIndex = useMemo(() => {
    if (!selectedLetter) return 0;
    return allLetters.findIndex(l => l.id === selectedLetter.id);
  }, [selectedLetter, allLetters]);

  const totalCount = allLetters.length;

  return (
    <View style={styles.lettersContainer}>
      {/* Header */}
      <View style={[styles.lettersHeader, sectionFrameStyle]}>
        <View>
          <View style={styles.lettersHeaderBadge}>
            <View style={styles.lettersBadgeDot} />
            <Text style={styles.lettersBadgeText}>Korean AI Learn</Text>
          </View>
          <Text style={styles.lettersTitle}>韩语音标</Text>
          <Text style={styles.lettersSubtitle}>掌握韩文字母和发音规则</Text>
        </View>
        <Pressable style={styles.lettersAiBtn}>
          <Ionicons name="sparkles-outline" size={20} color={colors.tint} />
        </Pressable>
      </View>

      {/* Divider */}
      <View style={[styles.lettersDivider, cardFrameStyle]} />

      {/* Scroll Content */}
      <ScrollView style={styles.lettersScroll} contentContainerStyle={styles.lettersScrollContent}>
        {/* 当前音标卡片 */}
        {selectedLetter && (
          <View style={[styles.currentCard, cardFrameStyle]}>
            <View style={styles.currentCardHead}>
              <Text style={styles.currentLabel}>当前音标</Text>
            </View>
            <View style={styles.currentMain}>
              <Pressable
                style={styles.letterBox}
                onPress={() => onPlay(selectedLetter)}
              >
                <Text style={styles.letterBoxText}>{selectedLetter.letter}</Text>
              </Pressable>
              <View style={styles.currentInfo}>
                <Text style={styles.phoneticName}>
                  {selectedLetter.letter} <Text style={styles.phoneticNameSpan}>| {selectedLetter.name}</Text>
                </Text>
                <View style={styles.phoneticTag}>
                  <Text style={styles.phoneticTagText}>{getLetterTypeTag(selectedLetter)}</Text>
                </View>
                {selectedLetter.tips.length > 0 && (
                  <>
                    <Text style={styles.tipTitle}>发音提示</Text>
                    <Text style={styles.tipText}>{selectedLetter.tips[0]}</Text>
                  </>
                )}
              </View>
            </View>
            <Pressable
              style={styles.actionBtnPrimary}
              onPress={() => onPlay(selectedLetter)}
            >
              <Ionicons name="volume-high-outline" size={15} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>开始跟读</Text>
            </Pressable>
            <Text style={styles.listenHint}>点击音标或当前卡片可试听</Text>
          </View>
        )}

        {/* 音标分类 Tabs */}
        <View style={[styles.categorySection, sectionFrameStyle]}>
          <Text style={styles.sectionLabel}>音标分类</Text>
          <View style={styles.categoryTabs}>
            {categoryTabs.map((tab) => (
              <Pressable
                key={tab}
                style={[styles.categoryTab, activeCategory === tab && styles.categoryTabActive]}
                onPress={() => setActiveCategory(tab)}
              >
                <Text style={[styles.categoryTabText, activeCategory === tab && styles.categoryTabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 字母网格 */}
        <View style={[styles.letterGridSection, sectionFrameStyle]}>
          <View style={styles.groupTitleRow}>
            <Text style={styles.groupTitleStrong}>{activeCategory}</Text>
            <Text style={styles.groupTitleSpan}>点击音标查看详情</Text>
          </View>
          <View style={[styles.letterGrid, { gap: gridGap }]}>
            {currentLetters.map((letter) => (
              <Pressable
                key={letter.id}
                style={[
                  styles.letterCell,
                  { width: clampedLetterCellSize, height: clampedLetterCellSize },
                  selectedLetter?.id === letter.id && styles.letterCellActive
                ]}
                onPress={() => openLetterDetail(letter)}
              >
                <Text style={[
                  styles.letterCellText,
                  selectedLetter?.id === letter.id && styles.letterCellTextActive
                ]}>
                  {letter.letter}
                </Text>
                {selectedLetter?.id === letter.id && <View style={styles.letterCellDot} />}
              </Pressable>
            ))}
          </View>

          {/* 查看全部按钮 */}
          <Pressable style={styles.fullTableBtn}>
            <View style={styles.fullTableLeft}>
              <View style={styles.fullTableIcon}>
                <Ionicons name="grid-outline" size={17} color={colors.tint} />
              </View>
              <Text style={styles.fullTableText}>查看全部音标表</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.tint} />
          </Pressable>
        </View>
      </ScrollView>

      {/* 音标详情页面覆盖层 */}
      {showDetail && selectedLetter && (
        <View style={styles.detailOverlay}>
          {/* 顶部栏 */}
          <View style={styles.detailTopbar}>
            <Pressable style={styles.detailTopBtn} onPress={closeLetterDetail}>
              <Ionicons name="chevron-back" size={14} color={colors.tint} />
            </Pressable>
            <View style={styles.detailCounter}>
              <Text style={styles.detailCounterText}>{currentIndex + 1} / {totalCount}</Text>
            </View>
            <Pressable style={styles.detailTopBtn} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorite ? "bookmark" : "bookmark-outline"}
                size={15}
                color={isFavorite ? colors.tint : colors.tint}
              />
            </Pressable>
          </View>

          {/* 内容区域 */}
          <ScrollView style={styles.detailContent} contentContainerStyle={styles.detailContentInner}>
            {/* 大字音标 */}
            <View style={styles.detailGlyphArea}>
              <Pressable
                style={styles.detailGlyph}
                onPress={() => onPlay(selectedLetter)}
              >
                <Text style={styles.detailGlyphText}>{selectedLetter.letter}</Text>
              </Pressable>

              {/* 名称行 */}
              <View style={styles.detailNameRow}>
                <Text style={styles.detailRoman}>{selectedLetter.name}</Text>
                <View style={styles.detailTags}>
                  <View style={styles.detailTag}>
                    <Text style={styles.detailTagText}>{getLetterTypeTag(selectedLetter)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 发音技巧提示 */}
            {selectedLetter.tips.length > 0 && (
              <View style={styles.detailTipBlock}>
                <View style={styles.detailTipRow}>
                  <View style={styles.detailTipIcon}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.tint} />
                  </View>
                  <View style={styles.detailTipCopy}>
                    <Text style={styles.detailTipStrong}>发音技巧</Text>
                    <Text style={styles.detailTipText}>{selectedLetter.tips[0]}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 示例词汇 */}
            {selectedLetter.examples.length > 0 && (
              <View style={styles.detailExamples}>
                <Text style={styles.detailExampleTitle}>示例词汇</Text>
                <View style={styles.detailExampleList}>
                  {selectedLetter.examples.slice(0, 4).map((example, index) => (
                    <Pressable
                      key={`${selectedLetter.id}-ex-${index}`}
                      style={styles.detailExampleItem}
                      onPress={() => onPlayExample(example)}
                    >
                      <Text style={styles.detailExampleKorean}>{example.word}</Text>
                      <Text style={styles.detailExampleChinese}>{example.meaning}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 位置说明 */}
            {selectedLetter.positionNotes.length > 0 && (
              <View style={styles.detailPositionBlock}>
                <Text style={styles.detailPositionStrong}>位置说明</Text>
                {selectedLetter.positionNotes.map((note, index) => (
                  <Text key={index} style={styles.detailPositionText}>{note}</Text>
                ))}
              </View>
            )}
          </ScrollView>

          {/* 底部按钮 */}
          <View style={styles.detailBottom}>
            <Pressable
              style={styles.detailReadBtn}
              onPress={() => onPlay(selectedLetter)}
            >
              <Ionicons name="mic-outline" size={15} color="#fff" />
              <Text style={styles.detailReadBtnText}>开始跟读</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  const textbookSoundRef = useRef<any | null>(null);

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
    const AudioModule = await loadExpoAudio();
    if (!AudioModule) {
      Alert.alert("音频暂不可用", "当前 Expo Go 没有加载音频原生模块，可以先查看教材内容。");
      return;
    }

    const { sound } = await AudioModule.Sound.createAsync({ uri: url }, { shouldPlay: true });
    textbookSoundRef.current = sound;
    setActiveAudioId(audioId);
    sound.setOnPlaybackStatusUpdate((status: any) => {
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
    "grid-outline": "grid",
    "chatbubble-ellipses-outline": "chatbubble-ellipses",
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
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.panelRaised
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  tabText: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: "500"
  },
  tabTextActive: {
    color: colors.tint
  },
  contentScroll: {
    flex: 1
  },
  content: {
    gap: spacing.lg,
    padding: 28,
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
  },
  // === 音标首页新样式 ===
  lettersContainer: {
    flex: 1,
    backgroundColor: colors.page
  },
  lettersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 28,
    paddingTop: 6
  },
  lettersHeaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3
  },
  lettersBadgeDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.tint,
    borderRadius: 3
  },
  lettersBadgeText: {
    fontSize: 12,
    color: colors.tint,
    fontWeight: "500"
  },
  lettersTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5
  },
  lettersSubtitle: {
    fontSize: 13,
    color: colors.faint,
    marginTop: 2
  },
  lettersAiBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.brandSoft,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4
  },
  lettersDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginTop: 16
  },
  lettersScroll: {
    flex: 1
  },
  lettersScrollContent: {
    paddingBottom: 14
  },
  currentCard: {
    marginTop: 16,
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 15
  },
  currentCardHead: {
    marginBottom: 14
  },
  currentLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.tint
  },
  currentMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  letterBox: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.tint,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 0
  },
  letterBoxText: {
    fontSize: 42,
    fontWeight: "700",
    color: colors.ink
  },
  currentInfo: {
    flex: 1
  },
  phoneticName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink
  },
  phoneticNameSpan: {
    fontSize: 13,
    color: colors.faint,
    fontWeight: "500"
  },
  phoneticTag: {
    flexDirection: "row",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.brandSoft,
    borderRadius: 8,
    marginTop: 6
  },
  phoneticTagText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.tint
  },
  tipTitle: {
    fontSize: 12,
    color: "#4A7A62",
    fontWeight: "600",
    marginTop: 8
  },
  tipText: {
    fontSize: 12,
    color: "#6F897D",
    lineHeight: 18,
    marginTop: 2
  },
  actionBtnPrimary: {
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.tint,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 14
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.panelRaised
  },
  listenHint: {
    textAlign: "center",
    fontSize: 12,
    color: colors.faint,
    marginTop: 10
  },
  categorySection: {
    paddingHorizontal: 28,
    paddingTop: 16
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.faint,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10
  },
  categoryTabs: {
    flexDirection: "row",
    gap: 10
  },
  categoryTab: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panelRaised,
    alignItems: "center",
    justifyContent: "center"
  },
  categoryTabActive: {
    backgroundColor: colors.tint,
    borderColor: colors.tint
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A7A62"
  },
  categoryTabTextActive: {
    color: colors.panelRaised
  },
  letterGridSection: {
    paddingHorizontal: 28,
    paddingTop: 16
  },
  groupTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 7,
    marginBottom: 10
  },
  groupTitleStrong: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink
  },
  groupTitleSpan: {
    fontSize: 12,
    color: colors.faint
  },
  letterGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  letterCell: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  letterCellActive: {
    borderColor: colors.tint,
    backgroundColor: "#F2FBF7"
  },
  letterCellText: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.ink
  },
  letterCellTextActive: {
    color: colors.tint
  },
  letterCellDot: {
    position: "absolute",
    bottom: 7,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.tint
  },
  fullTableBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.panelRaised,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  fullTableLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  fullTableIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  fullTableText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.tint
  },
  // === 音标详情页面样式 ===
  detailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.page,
    zIndex: 100
  },
  detailTopbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 20
  },
  detailTopBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.panelRaised
  },
  detailCounter: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.panelRaised
  },
  detailCounterText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.tint
  },
  detailContent: {
    flex: 1
  },
  detailContentInner: {
    paddingHorizontal: 28,
    paddingBottom: 12
  },
  detailGlyphArea: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 16
  },
  detailGlyph: {
    marginBottom: 16
  },
  detailGlyphText: {
    fontSize: 104,
    fontWeight: "300",
    color: colors.ink,
    letterSpacing: -3,
    textAlign: "center"
  },
  detailNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14
  },
  detailRoman: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0.5
  },
  detailTags: {
    flexDirection: "row",
    gap: 6
  },
  detailTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.brandSoft
  },
  detailTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.tint
  },
  detailTipBlock: {
    width: "100%",
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.panel
  },
  detailTipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  detailTipIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.brandSoft
  },
  detailTipCopy: {
    flex: 1,
    gap: 5
  },
  detailTipStrong: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink
  },
  detailTipText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 21
  },
  detailExamples: {
    marginTop: 20
  },
  detailExampleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 10
  },
  detailExampleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  detailExampleItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.panelRaised,
    minWidth: 80,
    alignItems: "center"
  },
  detailExampleKorean: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 4
  },
  detailExampleChinese: {
    fontSize: 12,
    color: colors.faint
  },
  detailPositionBlock: {
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.panel
  },
  detailPositionStrong: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 5
  },
  detailPositionText: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 21
  },
  detailBottom: {
    alignItems: "center",
    height: 72,
    paddingHorizontal: 20,
    paddingBottom: 14,
    justifyContent: "flex-end"
  },
  detailReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    height: 46,
    borderWidth: 0,
    borderRadius: 13,
    backgroundColor: colors.tint
  },
  detailReadBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.panelRaised
  }
});
