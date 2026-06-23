import {
  LetterExample,
  LetterGroup,
  LetterItem,
  LetterSection,
  ScenePractice,
  TextbookAudio,
  TextbookPage,
  VocabularyItem
} from "../data/learning";

import Constants from "expo-constants";

declare const process: {
  env?: {
    EXPO_PUBLIC_API_BASE_URL?: string;
  };
};

export type WebLearningData = {
  letterSections: LetterSection[];
  letterGroups: Array<{ title: string; description: string; letters: LetterItem[] }>;
  vocabularyItems: VocabularyItem[];
  scenePractices: ScenePractice[];
  textbookPages: TextbookPage[];
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const STATIC_PREFIX = "/static/";

const LETTER_SOUNDS: Record<string, string> = {
  "ㄱ": "기역",
  "ㄴ": "니은",
  "ㄷ": "디귿",
  "ㄹ": "리을",
  "ㅁ": "미음",
  "ㅂ": "비읍",
  "ㅅ": "시옷",
  "ㅇ": "이응",
  "ㅈ": "지읒",
  "ㅊ": "치읓",
  "ㅋ": "키읔",
  "ㅌ": "티읕",
  "ㅍ": "피읖",
  "ㅎ": "히읗",
  "ㄲ": "쌍기역",
  "ㄸ": "쌍디귿",
  "ㅃ": "쌍비읍",
  "ㅆ": "쌍시옷",
  "ㅉ": "쌍지읒",
  "ㅏ": "아",
  "ㅑ": "야",
  "ㅓ": "어",
  "ㅕ": "여",
  "ㅗ": "오",
  "ㅛ": "요",
  "ㅜ": "우",
  "ㅠ": "유",
  "ㅡ": "으",
  "ㅣ": "이",
  "ㅐ": "애",
  "ㅒ": "얘",
  "ㅔ": "에",
  "ㅖ": "예",
  "ㅘ": "와",
  "ㅙ": "왜",
  "ㅚ": "외",
  "ㅝ": "워",
  "ㅞ": "웨",
  "ㅟ": "위",
  "ㅢ": "의"
};

type LetterDetail = {
  sound: string;
  tips?: string[];
  positionNotes?: string[];
  contrastNote?: string;
  examples: Array<[string, string] | { label?: string; word: string; meaning: string }>;
  contrastGroup?: keyof typeof CONTRAST_GROUPS;
};

const LETTER_DETAILS: Record<string, LetterDetail> = {
  "ㄱ": { sound: "기역", tips: ["词首偏 k，但不强送气，不要读成 ㅋ。在元音之间常听起来偏 g。作收音时短促收住，近似 k，不释放元音。"], examples: [{ label: "词首", word: "가방", meaning: "书包" }, { label: "词中", word: "고기", meaning: "肉" }, { label: "收音", word: "국", meaning: "汤/国" }], contrastGroup: "g" },
  "ㄴ": { sound: "니은", examples: [["나무", "树"], ["누나", "姐姐"], ["나라", "国家"], ["노래", "歌曲"]] },
  "ㄷ": { sound: "디귿", tips: ["词首偏 t/d 之间，但不强送气。", "在元音之间常听起来偏 d。", "作收音时舌尖短促收住，归到 ㄷ 类。"], examples: [{ label: "词首", word: "다리", meaning: "腿/桥" }, { label: "词中", word: "바다", meaning: "大海" }, { label: "收音", word: "곧", meaning: "马上" }], contrastGroup: "d" },
  "ㄹ": { sound: "리을", examples: [["라면", "拉面"], ["리본", "丝带"], ["로봇", "机器人"], ["러시아", "俄罗斯"]] },
  "ㅁ": { sound: "미음", examples: [["모자", "帽子"], ["물", "水"], ["마을", "村庄"], ["문", "门"]] },
  "ㅂ": { sound: "비읍", tips: ["词首偏 p/b 之间，但不要明显送气。", "在元音之间常听起来偏 b。", "作收音时双唇闭合收住，归到 ㅂ 类。"], examples: [{ label: "词首", word: "바다", meaning: "大海" }, { label: "词中", word: "아버지", meaning: "爸爸/父亲" }, { label: "收音", word: "밥", meaning: "饭" }], contrastGroup: "b" },
  "ㅅ": { sound: "시옷", tips: ["词首气流较轻，注意不要读成紧音 ㅆ。", "遇到 ㅣ 或 y 类元音时，听感会更接近 shi。", "作收音时不读 s，归到 ㄷ 类收音。"], examples: [{ label: "词首", word: "사과", meaning: "苹果" }, { label: "词中", word: "의사", meaning: "医生" }, { label: "收音", word: "옷", meaning: "衣服" }], contrastGroup: "s" },
  "ㅇ": { sound: "이응", examples: [["아이", "孩子"], ["우유", "牛奶"], ["오이", "黄瓜"], ["이름", "名字"]] },
  "ㅈ": { sound: "지읒", tips: ["词首偏 j/ch 之间，但不明显送气。", "在元音之间听起来更柔和。", "作收音时归到 ㄷ 类。"], examples: [{ label: "词首", word: "지도", meaning: "地图" }, { label: "词中", word: "여자", meaning: "女人" }, { label: "收音", word: "낮", meaning: "白天" }], contrastGroup: "j" },
  "ㅊ": { sound: "치읓", tips: ["送气明显，气流比 ㅈ 更强。", "不要读成紧音 ㅉ。", "作收音时归到 ㄷ 类。"], examples: [{ label: "词首", word: "차", meaning: "车/茶" }, { label: "词中", word: "기차", meaning: "火车" }, { label: "收音", word: "꽃", meaning: "花" }], contrastGroup: "j" },
  "ㅋ": { sound: "키읔", tips: ["送气明显，气流比 ㄱ 更强。", "不要读成紧音 ㄲ。", "作收音时归到 ㄱ 类。"], examples: [{ label: "词首", word: "코", meaning: "鼻子" }, { label: "词中", word: "커피", meaning: "咖啡" }, { label: "收音", word: "부엌", meaning: "厨房" }], contrastGroup: "g" },
  "ㅌ": { sound: "티읕", tips: ["送气明显，气流比 ㄷ 更强。", "不要读成紧音 ㄸ。", "作收音时归到 ㄷ 类。"], examples: [{ label: "词首", word: "타다", meaning: "乘坐" }, { label: "词中", word: "토마토", meaning: "番茄" }, { label: "收音", word: "밭", meaning: "田地" }], contrastGroup: "d" },
  "ㅍ": { sound: "피읖", tips: ["送气明显，双唇打开时气流更强。", "不要读成紧音 ㅃ。", "作收音时归到 ㅂ 类。"], examples: [{ label: "词首", word: "파도", meaning: "波浪" }, { label: "词中", word: "커피", meaning: "咖啡" }, { label: "收音", word: "앞", meaning: "前面" }], contrastGroup: "b" },
  "ㅎ": { sound: "히읗", examples: [["하늘", "天空"], ["학교", "学校"], ["한국", "韩国"], ["호텔", "酒店"]] },
  "ㄲ": { sound: "쌍기역", tips: ["紧音更用力、更紧，几乎不送气。", "不要读成送气音 ㅋ。", "作收音时归到 ㄱ 类。"], examples: [{ label: "词首", word: "까치", meaning: "喜鹊" }, { label: "词中", word: "토끼", meaning: "兔子" }, { label: "收音", word: "밖", meaning: "外面" }], contrastGroup: "g" },
  "ㄸ": { sound: "쌍디귿", tips: ["紧音更紧，不明显送气。", "不要读成送气音 ㅌ。", "韩语里 ㄸ 不作普通收音使用。"], examples: [{ label: "词首", word: "딸기", meaning: "草莓" }, { label: "词中", word: "따뜻해요", meaning: "暖和" }], contrastGroup: "d" },
  "ㅃ": { sound: "쌍비읍", tips: ["双唇更紧，几乎不送气。", "不要读成送气音 ㅍ。", "韩语里 ㅃ 不作普通收音使用。"], examples: [{ label: "词首", word: "빵", meaning: "面包" }, { label: "词中", word: "뽀뽀", meaning: "亲亲" }], contrastGroup: "b" },
  "ㅆ": { sound: "쌍시옷", tips: ["紧音更用力，声音更紧。", "不要读成松音 ㅅ。", "作收音时归到 ㄷ 类。"], examples: [{ label: "词首", word: "쌀", meaning: "米" }, { label: "词中", word: "싸다", meaning: "便宜" }, { label: "收音", word: "있다", meaning: "有/在" }], contrastGroup: "s" },
  "ㅉ": { sound: "쌍지읒", tips: ["紧音更紧，不明显送气。", "不要读成送气音 ㅊ。", "韩语里 ㅉ 不作普通收音使用。"], examples: [{ label: "词首", word: "짜다", meaning: "咸" }, { label: "词中", word: "찌개", meaning: "炖汤" }], contrastGroup: "j" },
  "ㅏ": { sound: "아", examples: [["아기", "婴儿"], ["아빠", "爸爸"], ["바다", "大海"], ["사과", "苹果"]] },
  "ㅑ": { sound: "야", examples: [["야구", "棒球"], ["야채", "蔬菜"], ["이야기", "故事"], ["야간", "夜间"]] },
  "ㅓ": { sound: "어", examples: [["어머니", "妈妈"], ["어디", "哪里"], ["버스", "公交车"], ["저", "我/那个"]] },
  "ㅕ": { sound: "여", examples: [["여자", "女人"], ["여름", "夏天"], ["병원", "医院"], ["여행", "旅行"]] },
  "ㅗ": { sound: "오", examples: [["오이", "黄瓜"], ["오늘", "今天"], ["고기", "肉"], ["모자", "帽子"]] },
  "ㅛ": { sound: "요", examples: [["요리", "料理"], ["요일", "星期"], ["교실", "教室"], ["표", "票/表"]] },
  "ㅜ": { sound: "우", examples: [["우유", "牛奶"], ["문", "门"], ["구두", "皮鞋"], ["누나", "姐姐"]] },
  "ㅠ": { sound: "유", examples: [["유리", "玻璃"], ["휴지", "纸巾"], ["유명해요", "有名"], ["뉴스", "新闻"]] },
  "ㅡ": { sound: "으", examples: [["음악", "音乐"], ["은행", "银行"], ["흐리다", "阴沉"], ["그", "那个"]] },
  "ㅣ": { sound: "이", examples: [["이름", "名字"], ["이불", "被子"], ["기차", "火车"], ["지도", "地图"]] },
  "ㅐ": { sound: "애", examples: [["개", "狗"], ["새", "鸟/新"], ["책", "书"], ["배", "梨/船"]] },
  "ㅒ": { sound: "얘", examples: [["얘기", "故事/聊天"], ["얘", "这个孩子"], ["걔", "那个孩子"], ["쟤", "那个孩子"]] },
  "ㅔ": { sound: "에", examples: [["게", "螃蟹"], ["세수", "洗脸"], ["메뉴", "菜单"], ["네", "是"]] },
  "ㅖ": { sound: "예", examples: [["예", "是/例"], ["시계", "钟表"], ["계단", "楼梯"], ["예약", "预约"]] },
  "ㅘ": { sound: "와", examples: [["과자", "点心"], ["사과", "苹果"], ["화장실", "洗手间"], ["와요", "来"]] },
  "ㅙ": { sound: "왜", examples: [["왜", "为什么"], ["돼지", "猪"], ["괜찮아요", "没关系"], ["왜요", "为什么呢"]] },
  "ㅚ": { sound: "외", examples: [["외국", "外国"], ["회사", "公司"], ["죄송합니다", "对不起"], ["외워요", "背诵"]] },
  "ㅝ": { sound: "워", examples: [["워터", "水/water"], ["원", "韩元/圆"], ["권", "册/权"], ["뭐", "什么"]] },
  "ㅞ": { sound: "웨", examples: [["웨이터", "服务员"], ["웬일", "怎么回事"], ["궤도", "轨道"], ["웨딩", "婚礼"]] },
  "ㅟ": { sound: "위", examples: [["위", "上面"], ["귀", "耳朵"], ["쉬다", "休息"], ["뒤", "后面"]] },
  "ㅢ": { sound: "의", examples: [["의자", "椅子"], ["의사", "医生"], ["회의", "会议"], ["의미", "意思"]] }
};

const LETTER_GUIDANCE: Record<string, Partial<Pick<LetterItem, "tips" | "positionNotes" | "contrastNote">>> = {
  "ㄱ": { positionNotes: ["词首听感偏 k，词中常更接近 g，收音时收成短促的 ㄱ 类，不要读出额外元音。"] },
  "ㄴ": { tips: ["舌尖抵住上齿龈，声音从鼻腔出来。", "不要把 ㄴ 和 ㄹ 混在一起，ㄴ 更稳定、更鼻音。"], positionNotes: ["词首、词中、收音都保持 n 的听感，收音时舌尖停住，不要加 으。"], contrastNote: "ㄴ 没有紧音或送气音对比，重点练鼻音位置和收音停住。" },
  "ㄷ": { positionNotes: ["词首不强送气，词中更柔和，收音统一归到 ㄷ 类，舌尖短促收住。"] },
  "ㄹ": { tips: ["词首和元音之间更像轻轻弹一下舌尖，不是英语 r。", "作收音时更接近 l 的收住感，但不要拖长。"], positionNotes: ["词首/词中练轻弹舌，收音练舌尖停住。ㄹ 的位置变化比多数辅音更明显。"], contrastNote: "ㄹ 没有紧音或送气音对比，重点比较词首轻弹和收音收住。" },
  "ㅁ": { tips: ["双唇自然闭合，声音从鼻腔出来。", "不要读成带爆破的 b/p，ㅁ 是稳定鼻音。"], positionNotes: ["词首、词中、收音都保持 m 的听感；收音时嘴唇闭住即可，不要补一个 으。"], contrastNote: "ㅁ 没有紧音或送气音对比，重点练双唇鼻音。" },
  "ㅂ": { positionNotes: ["词首不强送气，词中更接近 b，收音时双唇闭合归到 ㅂ 类。"] },
  "ㅅ": { positionNotes: ["词首保持轻擦音，遇 ㅣ/y 类元音会更接近 shi；收音不读 s，统一收成 ㄷ 类。"] },
  "ㅇ": { tips: ["在音节开头只是占位，不发音。", "在收音位置读 ng，舌根收住，声音从鼻腔出来。"], positionNotes: ["词首的 ㅇ 不发音，例如 아이 读作以元音开始；词尾/收音的 ㅇ 要读成 ng，例如 방、강。"], contrastNote: "ㅇ 没有紧音或送气音对比，它的重点是区分开头无声和收音 ng。" },
  "ㅈ": { positionNotes: ["词首不明显送气，词中更柔和；收音时归到 ㄷ 类。"] },
  "ㅊ": { positionNotes: ["词首和词中都要听到明显送气；收音位置归到 ㄷ 类，不保留 ch 的释放。"] },
  "ㅋ": { positionNotes: ["词首/词中气流明显；收音位置归到 ㄱ 类，短促收住。"] },
  "ㅌ": { positionNotes: ["词首/词中气流明显；收音位置归到 ㄷ 类，舌尖收住。"] },
  "ㅍ": { positionNotes: ["词首/词中双唇打开时有明显气流；收音位置归到 ㅂ 类，双唇闭住。"] },
  "ㅎ": { tips: ["像轻轻呼气的 h，气流要出来，但不要用力过猛。", "在一些连读环境里会弱化或影响后面辅音送气，入门阶段先听词里的实际读法。"], positionNotes: ["词首常读 h；词中可能变弱；作收音时经常影响后面的辅音，不建议只按单个 ㅎ 死记。"], contrastNote: "ㅎ 不属于松音/紧音/送气音三组对比，重点听呼气感和连读里的变化。" },
  "ㄲ": { positionNotes: ["词首和词中都要收紧发音，几乎不送气；收音时归到 ㄱ 类。"] },
  "ㄸ": { positionNotes: ["ㄸ 主要出现在词首或词中，不作普通收音；练习时重点听紧、不送气。"] },
  "ㅃ": { positionNotes: ["ㅃ 主要出现在词首或词中，不作普通收音；双唇先收紧再打开。"] },
  "ㅆ": { positionNotes: ["词首/词中更紧更用力；收音时不读 ss，归到 ㄷ 类。"] },
  "ㅉ": { positionNotes: ["ㅉ 主要出现在词首或词中，不作普通收音；声音紧，不要读成送气 ㅊ。"] },
  "ㅏ": { tips: ["嘴自然张开，发明亮的 a。", "不要收得太扁，也不要读成 ㅓ。"] },
  "ㅑ": { tips: ["先有短促 y 滑音，再到 ㅏ。", "练习时可以慢慢从 이 过渡到 아。"] },
  "ㅓ": { tips: ["嘴张开但声音更靠后，中文学习者容易和 ㅗ/ㅏ 混。", "不要把它读成普通 a。"] },
  "ㅕ": { tips: ["先有 y 滑音，再到 ㅓ。", "重点听 여 和 야 的开口差异。"] },
  "ㅗ": { tips: ["嘴唇收圆，声音靠后。", "不要读成 ㅓ，也不要把嘴张太大。"] },
  "ㅛ": { tips: ["先有 y 滑音，再到圆唇 ㅗ。", "嘴型从轻微前移过渡到圆唇。"] },
  "ㅜ": { tips: ["嘴唇收圆，声音比 ㅗ 更高、更收。", "注意和 ㅡ 区分，ㅜ 有明显圆唇。"] },
  "ㅠ": { tips: ["先有 y 滑音，再到圆唇 ㅜ。", "不要把 유 读成单纯 우，开头要有滑动。"] },
  "ㅡ": { tips: ["嘴唇放平，舌位较高，声音短而收。", "不要读成中文的“呃”或圆唇的 ㅜ。"] },
  "ㅣ": { tips: ["嘴角自然展开，舌位高。", "声音要干净，不要加前面的 y。"] },
  "ㅐ": { tips: ["现代韩语里常和 ㅔ 接近，但入门仍建议先分开练。", "嘴型比 ㅏ 更扁一些。"] },
  "ㅔ": { tips: ["现代韩语里常和 ㅐ 接近，先通过词汇多听多记。", "不要读成 ㅣ，嘴型要稍微打开。"] },
  "ㅒ": { tips: ["由 y 滑向 ㅐ，实际使用频率不高。", "先听清 얘、걔、쟤 这类常见词。"] },
  "ㅖ": { tips: ["由 y 滑向 ㅔ，有些词里听感会弱化。", "예、계、시계 是优先练习词。"] },
  "ㅘ": { tips: ["由 ㅗ 快速滑到 ㅏ，嘴型从圆到开。", "不要拆成两个很长的音。"] },
  "ㅙ": { tips: ["由 ㅗ 滑到 ㅐ，常见于 왜、돼。", "和 ㅞ、ㅚ 在现代发音里可能接近，先靠词记。"] },
  "ㅚ": { tips: ["现代口语里常接近 we 的听感。", "保留外/会社等常见词的整体听感。"] },
  "ㅝ": { tips: ["由 ㅜ 滑到 ㅓ，嘴型从圆到稍开。", "뭐、원、권 是优先听的词。"] },
  "ㅞ": { tips: ["由 ㅜ 滑到 ㅔ，和 ㅙ/ㅚ 容易接近。", "入门阶段先用常见词建立听感。"] },
  "ㅟ": { tips: ["嘴唇先圆，声音向 ㅣ 收。", "注意 귀、위、뒤 的滑动，不要读成单纯 이。"] },
  "ㅢ": { tips: ["标准音从 ㅡ 滑到 ㅣ，但实际词中会有变化。", "의자、의사 先按 의 练；助词 의 后续可单独学习。"] }
};

const CONSONANT_LETTERS = new Set(["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"]);

const CONTRAST_GROUPS = {
  g: [{ letter: "ㄱ", label: "松音", word: "가방", meaning: "书包" }, { letter: "ㅋ", label: "送气音", word: "카메라", meaning: "相机" }, { letter: "ㄲ", label: "紧音", word: "까치", meaning: "喜鹊" }],
  d: [{ letter: "ㄷ", label: "松音", word: "다리", meaning: "腿/桥" }, { letter: "ㅌ", label: "送气音", word: "타다", meaning: "乘坐" }, { letter: "ㄸ", label: "紧音", word: "딸기", meaning: "草莓" }],
  b: [{ letter: "ㅂ", label: "松音", word: "바다", meaning: "大海" }, { letter: "ㅍ", label: "送气音", word: "파도", meaning: "波浪" }, { letter: "ㅃ", label: "紧音", word: "빵", meaning: "面包" }],
  j: [{ letter: "ㅈ", label: "松音", word: "지도", meaning: "地图" }, { letter: "ㅊ", label: "送气音", word: "차", meaning: "车/茶" }, { letter: "ㅉ", label: "紧音", word: "짜다", meaning: "咸" }],
  s: [{ letter: "ㅅ", label: "松音", word: "사과", meaning: "苹果" }, { letter: "ㅆ", label: "紧音", word: "쌀", meaning: "米" }]
};

type PhoneticGroupSource = {
  id: string;
  label: string;
  note: string;
  kind: "consonant" | "vowel" | "batchim";
  categoryLabel?: string;
  categoryNote?: string;
  letters?: string[];
  items?: Array<{
    letter: string;
    sound: string;
    word: string;
    meaning: string;
    examples: Array<[string, string]>;
    tips: string[];
  }>;
};

const PHONETIC_SECTIONS: Array<{ id: string; label: string; note: string; groups: PhoneticGroupSource[] }> = [
  { id: "consonants", label: "辅音", note: "先选一个音，听发音，再看位置和对比。", groups: [
    { id: "plain", label: "松音", note: "基础听感，不强送气", kind: "consonant", letters: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ"] },
    { id: "tense", label: "紧音", note: "声音更紧，气流更短", kind: "consonant", letters: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"] },
    { id: "aspirated", label: "送气音", note: "气流更明显", kind: "consonant", letters: ["ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] }
  ] },
  { id: "vowels", label: "元音", note: "重点看口型，不按词首词尾区分。", groups: [
    { id: "single-vowels", label: "单元音", note: "先稳定一个口型", kind: "vowel", letters: ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ", "ㅐ", "ㅔ"] },
    { id: "double-vowels", label: "双元音", note: "听清滑动方向", kind: "vowel", letters: ["ㅒ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"] }
  ] },
  { id: "batchim", label: "收音", note: "先记 7 个代表音，再练双收音。", groups: [
    { id: "base-batchim", label: "基础收音", note: "写法很多，实际先归到 7 类", kind: "batchim", items: [
      { letter: "ㄱ 类", sound: "实际读 ㄱ", word: "ㄱ ㄲ ㅋ", meaning: "국, 밖, 부엌", examples: [["국", "收成 ㄱ"], ["밖", "ㄲ 作收音读 ㄱ"], ["부엌", "ㅋ 作收音读 ㄱ"]], tips: ["包含写法：ㄱ ㄲ ㅋ", "发音短促收住，不要加 으 或 이。"] },
      { letter: "ㄴ 类", sound: "实际读 ㄴ", word: "ㄴ", meaning: "문, 산", examples: [["문", "门"], ["산", "山"]], tips: ["舌尖抵住上齿龈，声音从鼻腔出来。"] },
      { letter: "ㄷ 类", sound: "实际读 ㄷ", word: "ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ", meaning: "옷, 낮, 꽃", examples: [["옷", "ㅅ 作收音读 ㄷ"], ["낮", "ㅈ 作收音读 ㄷ"], ["꽃", "ㅊ 作收音读 ㄷ"]], tips: ["这一类写法最多，先统一收成 ㄷ 的听感。"] },
      { letter: "ㄹ 类", sound: "实际读 ㄹ", word: "ㄹ", meaning: "달, 길", examples: [["달", "月亮"], ["길", "路"]], tips: ["舌尖轻轻收住，不要拖成长音。"] },
      { letter: "ㅁ 类", sound: "实际读 ㅁ", word: "ㅁ", meaning: "밤, 마음", examples: [["밤", "夜晚/栗子"], ["마음", "心"]], tips: ["双唇闭合，声音从鼻腔出来。"] },
      { letter: "ㅂ 类", sound: "实际读 ㅂ", word: "ㅂ ㅍ", meaning: "집, 앞", examples: [["집", "家"], ["앞", "ㅍ 作收音读 ㅂ"]], tips: ["双唇闭合收住，不要读出完整的 브。"] },
      { letter: "ㅇ 类", sound: "实际读 ㅇ", word: "ㅇ", meaning: "방, 강", examples: [["방", "房间"], ["강", "江/河"]], tips: ["舌根收住，声音从鼻腔出来。"] }
    ] },
    { id: "double-front", categoryLabel: "双收音", categoryNote: "双收音先判断读前一个还是后一个；后接元音时后续再单独练连音。", label: "多数读前一个", note: "先按前一个辅音收住", kind: "batchim", items: [
      { letter: "ㄳ", sound: "读前一个：ㄱ", word: "넋", meaning: "넋 → 넉", examples: [["넋", "灵魂，收成 ㄱ"]], tips: ["后面的 ㅅ 不单独读出来。"] },
      { letter: "ㄵ", sound: "读前一个：ㄴ", word: "앉다", meaning: "앉다 → 안따", examples: [["앉다", "坐，收成 ㄴ"]], tips: ["先记作 ㄴ 类收音。"] },
      { letter: "ㄶ", sound: "读前一个：ㄴ", word: "많다", meaning: "많다 → 만타", examples: [["많다", "多，收成 ㄴ"]], tips: ["ㅎ 后续会影响后面的音，这里先记默认收音。"] },
      { letter: "ㄼ", sound: "多数读前一个：ㄹ", word: "여덟", meaning: "여덟 → 여덜", examples: [["여덟", "八，收成 ㄹ"], ["넓다", "宽，常读 널따"]], tips: ["ㄼ 多数按 ㄹ 收住，但 밟다 类要单独记。"] },
      { letter: "ㄽ", sound: "读前一个：ㄹ", word: "외곬", meaning: "외곬 → 외골", examples: [["외곬", "单一路径，收成 ㄹ"]], tips: ["后面的 ㅅ 不单独读出来。"] },
      { letter: "ㄾ", sound: "读前一个：ㄹ", word: "핥다", meaning: "핥다 → 할따", examples: [["핥다", "舔，收成 ㄹ"]], tips: ["先按 ㄹ 收住，再观察后续辅音变化。"] },
      { letter: "ㅀ", sound: "读前一个：ㄹ", word: "싫다", meaning: "싫다 → 실타", examples: [["싫다", "不喜欢，收成 ㄹ"]], tips: ["ㅎ 会影响后面的 ㄷ，先把收音归到 ㄹ。"] },
      { letter: "ㅄ", sound: "读前一个：ㅂ", word: "값", meaning: "값 → 갑", examples: [["값", "价格，收成 ㅂ"], ["없다", "没有，收成 ㅂ"]], tips: ["后面的 ㅅ 不单独读出来。"] }
    ] },
    { id: "double-back", label: "少数读后一个", note: "这几个需要完整记住", kind: "batchim", items: [
      { letter: "ㄺ", sound: "读后一个：ㄱ", word: "닭", meaning: "닭 → 닥", examples: [["닭", "鸡，收成 ㄱ"], ["읽다", "读，常收成 ㄱ"], ["맑다", "清澈，常收成 ㄱ"]], tips: ["不要按前面的 ㄹ 收住，默认听到 ㄱ 类收音。"] },
      { letter: "ㄻ", sound: "读后一个：ㅁ", word: "삶", meaning: "삶 → 삼", examples: [["삶", "人生，收成 ㅁ"], ["젊다", "年轻，收成 ㅁ"]], tips: ["看到 ㄻ，优先记作 ㅁ 类听感。"] },
      { letter: "ㄿ", sound: "读后一个：ㅂ", word: "읊다", meaning: "읊다 → 읍따", examples: [["읊다", "吟诵，收成 ㅂ"]], tips: ["ㅍ 作收音时归到 ㅂ 类。"] }
    ] },
    { id: "double-special", label: "特殊发音", note: "容易和默认规则混淆", kind: "batchim", items: [
      { letter: "ㄼ", sound: "밟다 类读 ㅂ", word: "밟다", meaning: "밟다 → 밥따", examples: [["밟다", "踩，读 밥따"], ["밟고", "读 밥꼬"], ["밟지", "读 밥찌"]], tips: ["ㄼ 多数读 ㄹ，但 밟다 这一类常读 ㅂ，需要单独记。"] }
    ] }
  ] }
];

type WebLetter = {
  letter: string;
  word: string;
  meaning: string;
  audio_url?: string;
  letter_audio_url?: string;
};

type WebVocabulary = {
  id: number;
  korean: string;
  chinese: string;
  pos?: string;
  sentence_korean?: string;
};

type WebScene = {
  id: number;
  name: string;
};

type WebSentence = {
  id: number;
  korean: string;
  chinese: string;
  scene_id: number;
  scene_name?: string;
};

type WebTextbookIndex = {
  textbooks?: Array<{
    id?: string;
    title?: string;
    subtitle?: string;
    manifestUrl?: string;
    pageCount?: number;
    audioCount?: number;
    courseCount?: number;
    sectionCount?: number;
  }>;
};

type WebAppConfig = {
  assetBaseUrl?: string;
};

type WebTextbookManifest = {
  id?: string;
  title?: string;
  pageCount?: number;
  pageImageUrlTemplate?: string;
  pageAudio?: Record<string, WebTextbookAudio[]>;
  units?: Array<{
    unit?: number;
    title?: string;
    startPage?: number;
    endPage?: number;
    sections?: Array<{ title?: string; startPage?: number; endPage?: number; page?: number }>;
    tracks?: Array<{ title?: string; url?: string }>;
  }>;
};

type WebTextbookAudio = {
  id?: string;
  title?: string;
  audioTitle?: string;
  url?: string;
  audios?: Array<{ id?: string; title?: string; url?: string }>;
  transcript?: string;
  transcriptNote?: string;
};

export async function fetchWebLearningData(): Promise<WebLearningData> {
  const baseUrl = getApiBaseUrl();
  const [letters, vocabulary, scenes, sentences, textbookIndex, appConfig] = await Promise.all([
    fetchJson<{ data: WebLetter[] }>(`${baseUrl}/api/letters`),
    fetchJson<{ data: WebVocabulary[] }>(`${baseUrl}/api/vocabulary`),
    fetchJson<{ data: WebScene[] }>(`${baseUrl}/api/scenes`),
    fetchJson<{ data: WebSentence[] }>(`${baseUrl}/api/sentences`),
    fetchJson<WebTextbookIndex>(`${baseUrl}/static/textbooks/index.json`).catch(() => ({ textbooks: [] })),
    fetchJson<WebAppConfig>(`${baseUrl}/api/config`).catch(() => ({ assetBaseUrl: "" }))
  ]);
  const assetBaseUrl = normalizeAssetBaseUrl(appConfig.assetBaseUrl || "");
  const textbookManifests = await fetchTextbookManifests(baseUrl, assetBaseUrl, textbookIndex);

  const letterSections = buildLetterSections(letters.data || [], baseUrl);

  return {
    letterSections,
    letterGroups: flattenLetterSections(letterSections),
    vocabularyItems: buildVocabularyItems(vocabulary.data || []),
    scenePractices: buildScenePractices(scenes.data || [], sentences.data || []),
    textbookPages: buildTextbookPages(textbookIndex, textbookManifests)
  };
}

export function getFallbackLearningData(): WebLearningData {
  const letterSections = buildLetterSections([], DEFAULT_API_BASE_URL);

  return {
    letterSections,
    letterGroups: flattenLetterSections(letterSections),
    vocabularyItems: [],
    scenePractices: [],
    textbookPages: []
  };
}

export function getApiBaseUrl() {
  // Try env variable first, then app.json extra config, then default
  const envUrl = process.env?.EXPO_PUBLIC_API_BASE_URL;
  const extraUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  const url = envUrl || extraUrl || DEFAULT_API_BASE_URL;
  return url.replace(/\/$/, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }
  return response.json() as Promise<T>;
}

function buildLetterSections(letters: WebLetter[], baseUrl: string): LetterSection[] {
  const byLetter = new Map(letters.map((item) => [item.letter, item]));
  const wordAudio = new Map<string, string>();
  letters.forEach((item) => {
    if (item.word && item.audio_url) {
      wordAudio.set(item.word, resolveStaticAssetUrl(baseUrl, item.audio_url));
    }
  });

  return PHONETIC_SECTIONS.map((section) => ({
    id: section.id,
    title: section.label,
    description: section.note,
    groups: section.groups
      .map((group): LetterGroup => ({
        id: group.id,
        title: group.label,
        description: group.note,
        categoryLabel: group.categoryLabel,
        categoryNote: group.categoryNote,
        letters: group.letters
          ? group.letters
            .map((symbol) => normalizeLetterItem(symbol, group, byLetter.get(symbol), wordAudio, baseUrl))
            .filter((item): item is LetterItem => Boolean(item))
          : (group.items || []).map((item) => normalizeRuleItem(item, group))
      }))
      .filter((group) => group.letters.length > 0)
  })).filter((section) => section.groups.length > 0);
}

function flattenLetterSections(sections: LetterSection[]): WebLearningData["letterGroups"] {
  return sections.flatMap((section) => section.groups.map((group) => ({
    title: group.title,
    description: group.description,
    letters: group.letters
  })));
}

function normalizeLetterItem(
  symbol: string,
  group: PhoneticGroupSource,
  apiItem: WebLetter | undefined,
  wordAudio: Map<string, string>,
  baseUrl: string
): LetterItem | null {
  const detail = LETTER_DETAILS[symbol];
  if (!detail && !apiItem) {
    return null;
  }

  const guidance = LETTER_GUIDANCE[symbol] || {};
  const kind = group.kind;
  const primaryExample = apiItem ? {
    label: "",
    word: apiItem.word,
    meaning: apiItem.meaning,
    audioUrl: apiItem.audio_url ? resolveStaticAssetUrl(baseUrl, apiItem.audio_url) : ""
  } : null;
  const fallbackExample = primaryExample ? [{ label: "示范", word: primaryExample.word, meaning: primaryExample.meaning }] : [];
  const examples = (detail?.examples || fallbackExample).map((example, index) => normalizeExample(
    example,
    index,
    apiItem?.audio_url ? resolveStaticAssetUrl(baseUrl, apiItem.audio_url) : "",
    wordAudio
  ));

  if (primaryExample && !examples.some((example) => example.word === primaryExample.word)) {
    examples.unshift(primaryExample);
  }

  const contrast = detail?.contrastGroup
    ? CONTRAST_GROUPS[detail.contrastGroup].map((item) => ({
      ...item,
      audioUrl: wordAudio.get(item.word) || ""
    }))
    : undefined;

  return {
    id: `web-letter-${symbol}`,
    type: "letter",
    kind,
    letter: symbol,
    name: detail?.sound || LETTER_SOUNDS[symbol] || symbol,
    group: group.label,
    sound: detail?.sound || LETTER_SOUNDS[symbol] || symbol,
    letterAudioUrl: apiItem?.letter_audio_url ? resolveStaticAssetUrl(baseUrl, apiItem.letter_audio_url) : "",
    tips: [...(detail?.tips || []), ...(guidance.tips || [])].filter(Boolean),
    positionNotes: guidance.positionNotes || getDefaultPositionNotes(kind),
    contrastNote: guidance.contrastNote || getDefaultContrastNote(kind),
    examples,
    contrast
  };
}

function normalizeRuleItem(
  item: NonNullable<PhoneticGroupSource["items"]>[number],
  group: PhoneticGroupSource
): LetterItem {
  return {
    id: `web-rule-${group.id}-${item.letter}`,
    type: "rule",
    kind: "batchim",
    letter: item.letter,
    name: item.sound,
    group: group.label,
    sound: item.sound,
    playbackText: item.examples[0]?.[0] || item.word,
    tips: item.tips,
    positionNotes: item.sound ? [item.sound] : [],
    contrastNote: "",
    examples: item.examples.map(([word, meaning], index) => ({
      label: index === 0 ? "示范" : "",
      word,
      meaning
    }))
  };
}

function getDefaultPositionNotes(kind: LetterItem["kind"]) {
  if (kind === "vowel") {
    return ["元音不分词首、词中、词尾辅音位置；重点练口型，以及和辅音组合后的稳定音色。"];
  }

  return ["这个辅音的实际听感会受词首、词中、收音位置影响；先听示范词，再跟读模仿。"];
}

function getDefaultContrastNote(kind: LetterItem["kind"]) {
  if (kind === "vowel") {
    return "元音不参与松音、紧音、送气音对比；重点比较口型、圆唇和双元音滑动。";
  }

  return "这个音标没有成套的松音/紧音/送气音对比，先把自身发音位置练稳。";
}

function normalizeExample(
  rawExample: LetterDetail["examples"][number],
  index: number,
  fallbackAudioUrl: string,
  wordAudio: Map<string, string>
): LetterExample {
  if (Array.isArray(rawExample)) {
    const [word, meaning] = rawExample;
    return {
      label: index === 0 ? "示范" : "",
      word,
      meaning,
      audioUrl: wordAudio.get(word) || (index === 0 ? fallbackAudioUrl : "")
    };
  }

  return {
    label: rawExample.label || (index === 0 ? "示范" : ""),
    word: rawExample.word,
    meaning: rawExample.meaning,
    audioUrl: wordAudio.get(rawExample.word) || (index === 0 ? fallbackAudioUrl : "")
  };
}

function buildVocabularyItems(items: WebVocabulary[]): VocabularyItem[] {
  const unique = new Map<string, VocabularyItem>();

  items.forEach((item) => {
    if (unique.has(item.korean)) {
      return;
    }
    unique.set(item.korean, {
      id: `web-vocab-${item.id}`,
      korean: item.korean,
      chinese: item.chinese,
      source: item.pos || "词汇",
      nextReview: "待复习",
      example: item.sentence_korean || ""
    });
  });

  return [...unique.values()];
}

function buildScenePractices(scenes: WebScene[], sentences: WebSentence[]): ScenePractice[] {
  return scenes.map((scene) => {
    const sceneSentences = sentences.filter((sentence) => Number(sentence.scene_id) === Number(scene.id));
    return {
      id: `web-scene-${scene.id}`,
      title: scene.name,
      goal: "听一句，跟读一句，录音回放对比。",
      sentences: sceneSentences.map((sentence) => ({
        id: `web-sentence-${sentence.id}`,
        korean: sentence.korean,
        chinese: sentence.chinese,
        hint: sentence.scene_name ? sentence.scene_name : "场景句"
      }))
    };
  }).filter((scene) => scene.sentences.length > 0);
}

async function fetchTextbookManifests(baseUrl: string, assetBaseUrl: string, index: WebTextbookIndex) {
  const textbooks = index.textbooks || [];
  return Promise.all(textbooks.map(async (book) => {
    if (!book.manifestUrl) {
      return { book, manifest: null, baseUrl, assetBaseUrl };
    }

    const manifestUrl = book.manifestUrl.startsWith("http")
      ? book.manifestUrl
      : `${baseUrl}${book.manifestUrl}`;
    const manifest = await fetchJson<WebTextbookManifest>(manifestUrl).catch(() => null);
    return { book, manifest, baseUrl, assetBaseUrl };
  }));
}

function buildTextbookPages(
  index: WebTextbookIndex,
  manifests: Array<{
    book: NonNullable<WebTextbookIndex["textbooks"]>[number];
    manifest: WebTextbookManifest | null;
    baseUrl: string;
    assetBaseUrl: string;
  }>
): TextbookPage[] {
  if (!index.textbooks?.length) {
    return [];
  }

  const pages = manifests.flatMap(({ book, manifest, baseUrl, assetBaseUrl }, bookIndex) => {
    const pageImageUrlTemplate = resolveTextbookAssetUrl(
      baseUrl,
      assetBaseUrl,
      manifest?.pageImageUrlTemplate || ""
    );
    if (!pageImageUrlTemplate) {
      return [];
    }

    const audioByPage = buildAudioByPage(manifest?.pageAudio || {}, baseUrl, assetBaseUrl);
    const units = manifest?.units || [];
    if (!units.length) {
      return [{
        id: `web-textbook-${book.id || bookIndex}`,
        title: book.title || "教材",
        page: 1,
        endPage: manifest?.pageCount || book.pageCount || 1,
        pageCount: manifest?.pageCount || book.pageCount || 1,
        pageImageUrlTemplate,
        audioByPage
      }];
    }

    return units.slice(0, 10).map((unit, unitIndex) => ({
      id: `web-textbook-${book.id || bookIndex}-unit-${unit.unit || unitIndex + 1}`,
      title: `${book.title || manifest?.title || "教材"} · ${unit.title || `第 ${unitIndex + 1} 课`}`,
      page: unit.startPage || unit.sections?.[0]?.startPage || unit.sections?.[0]?.page || 1,
      endPage: unit.endPage || unit.startPage || 1,
      pageCount: manifest?.pageCount || book.pageCount || 1,
      pageImageUrlTemplate,
      audioByPage
    }));
  });

  return pages;
}

function buildAudioByPage(
  rawAudioByPage: Record<string, WebTextbookAudio[]>,
  baseUrl: string,
  assetBaseUrl: string
) {
  return Object.fromEntries(Object.entries(rawAudioByPage).map(([page, entries]) => [
    page,
    (entries || []).map((entry, index): TextbookAudio => {
      const audios = (entry.audios?.length ? entry.audios : [{
        id: entry.id || `audio-${page}-${index}`,
        title: entry.audioTitle || entry.title || `音频 ${index + 1}`,
        url: entry.url || ""
      }]).map((audio, audioIndex) => ({
        id: audio.id || `${entry.id || page}-${audioIndex}`,
        title: audio.title || `音频 ${audioIndex + 1}`,
        url: resolveTextbookAssetUrl(baseUrl, assetBaseUrl, audio.url || "")
      }));

      return {
        id: entry.id || `page-${page}-audio-${index}`,
        title: entry.title || `第 ${page} 页听力`,
        audioTitle: entry.audioTitle || audios.map((audio) => audio.title).join(" / "),
        url: resolveTextbookAssetUrl(baseUrl, assetBaseUrl, entry.url || audios[0]?.url || ""),
        audios,
        transcript: entry.transcript || "",
        transcriptNote: entry.transcriptNote
      };
    })
  ]));
}

function normalizeAssetBaseUrl(value: string) {
  return String(value || "").replace(/\/+$/, "");
}

function resolveTextbookAssetUrl(baseUrl: string, assetBaseUrl: string, template: string) {
  if (!template) {
    return "";
  }
  if (template.startsWith("http")) {
    return template;
  }
  if (assetBaseUrl && template.startsWith(STATIC_PREFIX)) {
    return `${assetBaseUrl}/${template.slice(STATIC_PREFIX.length)}`;
  }
  return `${baseUrl}${template}`;
}

function resolveStaticAssetUrl(baseUrl: string, url: string) {
  if (!url) {
    return "";
  }
  if (url.startsWith("http")) {
    return url;
  }
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}
