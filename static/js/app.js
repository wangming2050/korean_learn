/*
  app.js

  前端不使用 Vue / React / jQuery 等框架。
  所有页面切换、接口请求、音频播放都用原生 JavaScript 完成。
*/

// 获取全站唯一的 audio 播放器。后面所有播放按钮都会复用它。
const player = document.querySelector("#player");
const STATIC_PREFIX = "/static/";
const TEXTBOOK_CACHE_LIMIT = 2;
const TEXTBOOK_PREFETCH_RADIUS = 2;
const PDFJS_MODULE_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs";
const PDFJS_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";
const LOCAL_TEXTBOOK_DB_NAME = "korean-learn-local-textbooks";
const LOCAL_TEXTBOOK_DB_VERSION = 2;
const LOCAL_TEXTBOOK_DOC_STORE = "documents";
const LOCAL_TEXTBOOK_PAGE_STORE = "pages";
const LOCAL_TEXTBOOK_TEXT_STORE = "pageTexts";
const LOCAL_TEXTBOOK_MAX_FILE_SIZE = 300 * 1024 * 1024;
const LOCAL_TEXTBOOK_MAX_PAGES = 600;
const LOCAL_TEXTBOOK_IMAGE_WIDTH = 1320;
const LOCAL_TEXTBOOK_THUMB_WIDTH = 560;
const LOCAL_PAGE_URL_PREFIX = "indexeddb-page://";
const LOCAL_TEXTBOOK_TEXT_SCAN_PAGES = 80;
const LOCAL_TEXTBOOK_TOC_SCAN_PAGES = 30;
const LOCAL_TEXTBOOK_TOC_PARSE_PAGES = 8;
const LOCAL_TEXTBOOK_TOC_IMAGE_WIDTH = 1000;
const ASSISTANT_CONTEXT_RADIUS = 2;
const ASSISTANT_TEXT_IMAGE_THRESHOLD = 80;

let appConfig = {
  assetBaseUrl: "",
};

const LETTER_DETAILS = {
  "ㄱ": {
    sound: "기역",
    tips: [
      "词首偏 k，但不强送气，不要读成 ㅋ。在元音之间常听起来偏 g。作收音时短促收住，近似 k，不释放元音。",
    ],
    examples: [
      { label: "词首", word: "가방", meaning: "书包" },
      { label: "词中", word: "고기", meaning: "肉" },
      { label: "收音", word: "국", meaning: "汤/国" },
    ],
    contrastGroup: "g",
  },
  "ㄴ": { sound: "니은", examples: [["나무", "树"], ["누나", "姐姐"], ["나라", "国家"], ["노래", "歌曲"]] },
  "ㄷ": {
    sound: "디귿",
    tips: [
      "词首偏 t/d 之间，但不强送气。",
      "在元音之间常听起来偏 d。",
      "作收音时舌尖短促收住，归到 ㄷ 类。",
    ],
    examples: [
      { label: "词首", word: "다리", meaning: "腿/桥" },
      { label: "词中", word: "바다", meaning: "大海" },
      { label: "收音", word: "곧", meaning: "马上" },
    ],
    contrastGroup: "d",
  },
  "ㄹ": { sound: "리을", examples: [["라면", "拉面"], ["리본", "丝带"], ["로봇", "机器人"], ["러시아", "俄罗斯"]] },
  "ㅁ": { sound: "미음", examples: [["모자", "帽子"], ["물", "水"], ["마을", "村庄"], ["문", "门"]] },
  "ㅂ": {
    sound: "비읍",
    tips: [
      "词首偏 p/b 之间，但不要明显送气。",
      "在元音之间常听起来偏 b。",
      "作收音时双唇闭合收住，归到 ㅂ 类。",
    ],
    examples: [
      { label: "词首", word: "바다", meaning: "大海" },
      { label: "词中", word: "아버지", meaning: "爸爸/父亲" },
      { label: "收音", word: "밥", meaning: "饭" },
    ],
    contrastGroup: "b",
  },
  "ㅅ": {
    sound: "시옷",
    tips: [
      "词首气流较轻，注意不要读成紧音 ㅆ。",
      "遇到 ㅣ 或 y 类元音时，听感会更接近 shi。",
      "作收音时不读 s，归到 ㄷ 类收音。",
    ],
    examples: [
      { label: "词首", word: "사과", meaning: "苹果" },
      { label: "词中", word: "의사", meaning: "医生" },
      { label: "收音", word: "옷", meaning: "衣服" },
    ],
    contrastGroup: "s",
  },
  "ㅇ": { sound: "이응", examples: [["아이", "孩子"], ["우유", "牛奶"], ["오이", "黄瓜"], ["이름", "名字"]] },
  "ㅈ": {
    sound: "지읒",
    tips: [
      "词首偏 j/ch 之间，但不明显送气。",
      "在元音之间听起来更柔和。",
      "作收音时归到 ㄷ 类。",
    ],
    examples: [
      { label: "词首", word: "지도", meaning: "地图" },
      { label: "词中", word: "여자", meaning: "女人" },
      { label: "收音", word: "낮", meaning: "白天" },
    ],
    contrastGroup: "j",
  },
  "ㅊ": {
    sound: "치읓",
    tips: [
      "送气明显，气流比 ㅈ 更强。",
      "不要读成紧音 ㅉ。",
      "作收音时归到 ㄷ 类。",
    ],
    examples: [
      { label: "词首", word: "차", meaning: "车/茶" },
      { label: "词中", word: "기차", meaning: "火车" },
      { label: "收音", word: "꽃", meaning: "花" },
    ],
    contrastGroup: "j",
  },
  "ㅋ": {
    sound: "키읔",
    tips: [
      "送气明显，气流比 ㄱ 更强。",
      "不要读成紧音 ㄲ。",
      "作收音时归到 ㄱ 类。",
    ],
    examples: [
      { label: "词首", word: "코", meaning: "鼻子" },
      { label: "词中", word: "커피", meaning: "咖啡" },
      { label: "收音", word: "부엌", meaning: "厨房" },
    ],
    contrastGroup: "g",
  },
  "ㅌ": {
    sound: "티읕",
    tips: [
      "送气明显，气流比 ㄷ 更强。",
      "不要读成紧音 ㄸ。",
      "作收音时归到 ㄷ 类。",
    ],
    examples: [
      { label: "词首", word: "타다", meaning: "乘坐" },
      { label: "词中", word: "토마토", meaning: "番茄" },
      { label: "收音", word: "밭", meaning: "田地" },
    ],
    contrastGroup: "d",
  },
  "ㅍ": {
    sound: "피읖",
    tips: [
      "送气明显，双唇打开时气流更强。",
      "不要读成紧音 ㅃ。",
      "作收音时归到 ㅂ 类。",
    ],
    examples: [
      { label: "词首", word: "파도", meaning: "波浪" },
      { label: "词中", word: "커피", meaning: "咖啡" },
      { label: "收音", word: "앞", meaning: "前面" },
    ],
    contrastGroup: "b",
  },
  "ㅎ": { sound: "히읗", examples: [["하늘", "天空"], ["학교", "学校"], ["한국", "韩国"], ["호텔", "酒店"]] },
  "ㄲ": {
    sound: "쌍기역",
    tips: [
      "紧音更用力、更紧，几乎不送气。",
      "不要读成送气音 ㅋ。",
      "作收音时归到 ㄱ 类。",
    ],
    examples: [
      { label: "词首", word: "까치", meaning: "喜鹊" },
      { label: "词中", word: "토끼", meaning: "兔子" },
      { label: "收音", word: "밖", meaning: "外面" },
    ],
    contrastGroup: "g",
  },
  "ㄸ": {
    sound: "쌍디귿",
    tips: [
      "紧音更紧，不明显送气。",
      "不要读成送气音 ㅌ。",
      "韩语里 ㄸ 不作普通收音使用。",
    ],
    examples: [
      { label: "词首", word: "딸기", meaning: "草莓" },
      { label: "词中", word: "따뜻해요", meaning: "暖和" },
    ],
    contrastGroup: "d",
  },
  "ㅃ": {
    sound: "쌍비읍",
    tips: [
      "双唇更紧，几乎不送气。",
      "不要读成送气音 ㅍ。",
      "韩语里 ㅃ 不作普通收音使用。",
    ],
    examples: [
      { label: "词首", word: "빵", meaning: "面包" },
      { label: "词中", word: "뽀뽀", meaning: "亲亲" },
    ],
    contrastGroup: "b",
  },
  "ㅆ": {
    sound: "쌍시옷",
    tips: [
      "紧音更用力，声音更紧。",
      "不要读成松音 ㅅ。",
      "作收音时归到 ㄷ 类。",
    ],
    examples: [
      { label: "词首", word: "쌀", meaning: "米" },
      { label: "词中", word: "싸다", meaning: "便宜" },
      { label: "收音", word: "있다", meaning: "有/在" },
    ],
    contrastGroup: "s",
  },
  "ㅉ": {
    sound: "쌍지읒",
    tips: [
      "紧音更紧，不明显送气。",
      "不要读成送气音 ㅊ。",
      "韩语里 ㅉ 不作普通收音使用。",
    ],
    examples: [
      { label: "词首", word: "짜다", meaning: "咸" },
      { label: "词中", word: "찌개", meaning: "炖汤" },
    ],
    contrastGroup: "j",
  },
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
  "ㅢ": { sound: "의", examples: [["의자", "椅子"], ["의사", "医生"], ["회의", "会议"], ["의미", "意思"]] },
};

const LETTER_GUIDANCE = {
  "ㄱ": {
    positionNotes: ["词首听感偏 k，词中常更接近 g，收音时收成短促的 ㄱ 类，不要读出额外元音。"],
  },
  "ㄴ": {
    tips: ["舌尖抵住上齿龈，声音从鼻腔出来。", "不要把 ㄴ 和 ㄹ 混在一起，ㄴ 更稳定、更鼻音。"],
    positionNotes: ["词首、词中、收音都保持 n 的听感，收音时舌尖停住，不要加 으。"],
    contrastNote: "ㄴ 没有紧音或送气音对比，重点练鼻音位置和收音停住。",
  },
  "ㄷ": {
    positionNotes: ["词首不强送气，词中更柔和，收音统一归到 ㄷ 类，舌尖短促收住。"],
  },
  "ㄹ": {
    tips: ["词首和元音之间更像轻轻弹一下舌尖，不是英语 r。", "作收音时更接近 l 的收住感，但不要拖长。"],
    positionNotes: ["词首/词中练轻弹舌，收音练舌尖停住。ㄹ 的位置变化比多数辅音更明显。"],
    contrastNote: "ㄹ 没有紧音或送气音对比，重点比较词首轻弹和收音收住。",
  },
  "ㅁ": {
    tips: ["双唇自然闭合，声音从鼻腔出来。", "不要读成带爆破的 b/p，ㅁ 是稳定鼻音。"],
    positionNotes: ["词首、词中、收音都保持 m 的听感；收音时嘴唇闭住即可，不要补一个 으。"],
    contrastNote: "ㅁ 没有紧音或送气音对比，重点练双唇鼻音。",
  },
  "ㅂ": {
    positionNotes: ["词首不强送气，词中更接近 b，收音时双唇闭合归到 ㅂ 类。"],
  },
  "ㅅ": {
    positionNotes: ["词首保持轻擦音，遇 ㅣ/y 类元音会更接近 shi；收音不读 s，统一收成 ㄷ 类。"],
  },
  "ㅇ": {
    tips: ["在音节开头只是占位，不发音。", "在收音位置读 ng，舌根收住，声音从鼻腔出来。"],
    positionNotes: ["词首的 ㅇ 不发音，例如 아이 读作以元音开始；词尾/收音的 ㅇ 要读成 ng，例如 방、강。"],
    contrastNote: "ㅇ 没有紧音或送气音对比，它的重点是区分开头无声和收音 ng。",
  },
  "ㅈ": {
    positionNotes: ["词首不明显送气，词中更柔和；收音时归到 ㄷ 类。"],
  },
  "ㅊ": {
    positionNotes: ["词首和词中都要听到明显送气；收音位置归到 ㄷ 类，不保留 ch 的释放。"],
  },
  "ㅋ": {
    positionNotes: ["词首/词中气流明显；收音位置归到 ㄱ 类，短促收住。"],
  },
  "ㅌ": {
    positionNotes: ["词首/词中气流明显；收音位置归到 ㄷ 类，舌尖收住。"],
  },
  "ㅍ": {
    positionNotes: ["词首/词中双唇打开时有明显气流；收音位置归到 ㅂ 类，双唇闭住。"],
  },
  "ㅎ": {
    tips: ["像轻轻呼气的 h，气流要出来，但不要用力过猛。", "在一些连读环境里会弱化或影响后面辅音送气，入门阶段先听词里的实际读法。"],
    positionNotes: ["词首常读 h；词中可能变弱；作收音时经常影响后面的辅音，不建议只按单个 ㅎ 死记。"],
    contrastNote: "ㅎ 不属于松音/紧音/送气音三组对比，重点听呼气感和连读里的变化。",
  },
  "ㄲ": {
    positionNotes: ["词首和词中都要收紧发音，几乎不送气；收音时归到 ㄱ 类。"],
  },
  "ㄸ": {
    positionNotes: ["ㄸ 主要出现在词首或词中，不作普通收音；练习时重点听紧、不送气。"],
  },
  "ㅃ": {
    positionNotes: ["ㅃ 主要出现在词首或词中，不作普通收音；双唇先收紧再打开。"],
  },
  "ㅆ": {
    positionNotes: ["词首/词中更紧更用力；收音时不读 ss，归到 ㄷ 类。"],
  },
  "ㅉ": {
    positionNotes: ["ㅉ 主要出现在词首或词中，不作普通收音；声音紧，不要读成送气 ㅊ。"],
  },
  "ㅏ": { tips: ["嘴自然张开，发明亮的 a。", "不要收得太扁，也不要读成 ㅓ。"] },
  "ㅑ": { tips: ["先有短促 y 滑音，再到 ㅏ。", "练习时可以慢慢从 이 过渡到 아。"] },
  "ㅓ": { tips: ["嘴张开但声音更靠后，中文学习者容易和 ㅗ/ㅏ 混。", "不要把它读成普通 a。"] },
  "ㅕ": { tips: ["先有 y 滑音，再到 ㅓ。", "重点听 여 和 야 的开口差异。"] },
  "ㅗ": { tips: ["嘴唇收圆，声音靠后。", "不要读成 ㅓ，也不要把嘴张太大。"] },
  "ㅛ": { tips: ["先有 y 滑音，再到圆唇 ㅗ。", "嘴型从轻微前移过渡到圆唇。"] },
  "ㅜ": { tips: ["嘴唇收圆，声音比 ㅗ 更高、更收。", "注意和 ㅡ 区分，ㅜ 有明显圆唇。"] },
  "ㅠ": { tips: ["先有 y 滑音，再到圆唇 ㅜ。", "不要把 유 读成 단순 우，开头要有滑动。"] },
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
  "ㅢ": { tips: ["标准音从 ㅡ 滑到 ㅣ，但实际词中会有变化。", "의자、의사 先按 의 练；助词 의 后续可单独学习。"] },
};

const CONSONANT_LETTERS = new Set([
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ",
]);

const CONTRAST_GROUPS = {
  g: [
    { letter: "ㄱ", label: "松音", word: "가방", meaning: "书包" },
    { letter: "ㅋ", label: "送气音", word: "카메라", meaning: "相机" },
    { letter: "ㄲ", label: "紧音", word: "까치", meaning: "喜鹊" },
  ],
  d: [
    { letter: "ㄷ", label: "松音", word: "다리", meaning: "腿/桥" },
    { letter: "ㅌ", label: "送气音", word: "타다", meaning: "乘坐" },
    { letter: "ㄸ", label: "紧音", word: "딸기", meaning: "草莓" },
  ],
  b: [
    { letter: "ㅂ", label: "松音", word: "바다", meaning: "大海" },
    { letter: "ㅍ", label: "送气音", word: "파도", meaning: "波浪" },
    { letter: "ㅃ", label: "紧音", word: "빵", meaning: "面包" },
  ],
  j: [
    { letter: "ㅈ", label: "松音", word: "지도", meaning: "地图" },
    { letter: "ㅊ", label: "送气音", word: "차", meaning: "车/茶" },
    { letter: "ㅉ", label: "紧音", word: "짜다", meaning: "咸" },
  ],
  s: [
    { letter: "ㅅ", label: "松音", word: "사과", meaning: "苹果" },
    { letter: "ㅆ", label: "紧音", word: "쌀", meaning: "米" },
  ],
};

const PHONETIC_SECTIONS = [
  {
    id: "consonants",
    label: "辅音",
    groups: [
      { id: "plain", label: "松音", kind: "consonant", letters: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ"] },
      { id: "tense", label: "紧音", kind: "consonant", letters: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"] },
      { id: "aspirated", label: "送气音", kind: "consonant", letters: ["ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] },
    ],
  },
  {
    id: "vowels",
    label: "元音",
    groups: [
      { id: "single-vowels", label: "单元音", kind: "vowel", letters: ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ", "ㅐ", "ㅔ"] },
      { id: "double-vowels", label: "双元音", kind: "vowel", letters: ["ㅒ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"] },
    ],
  },
  {
    id: "batchim",
    label: "收音",
    groups: [
      {
        id: "base-batchim",
        label: "基础收音",
        kind: "batchim",
        items: [
          { letter: "ㄱ", sound: "实际读 ㄱ", word: "ㄱ ㄲ ㅋ", meaning: "국, 밖, 부엌", examples: [["국", "收成 ㄱ"], ["밖", "ㄲ 作收音读 ㄱ"], ["부엌", "ㅋ 作收音读 ㄱ"]], tips: ["包含写法：ㄱ ㄲ ㅋ", "发音短促收住，不要加 으 或 이。"] },
          { letter: "ㄴ", sound: "实际读 ㄴ", word: "ㄴ", meaning: "문, 산", examples: [["문", "门"], ["산", "山"]], tips: ["舌尖抵住上齿龈，声音从鼻腔出来。"] },
          { letter: "ㄷ", sound: "实际读 ㄷ", word: "ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ", meaning: "옷, 낮, 꽃", examples: [["옷", "ㅅ 作收音读 ㄷ"], ["낮", "ㅈ 作收音读 ㄷ"], ["꽃", "ㅊ 作收音读 ㄷ"]], tips: ["这一类写法最多，先统一收成 ㄷ 的听感。"] },
          { letter: "ㄹ", sound: "实际读 ㄹ", word: "ㄹ", meaning: "달, 길", examples: [["달", "月亮"], ["길", "路"]], tips: ["舌尖轻轻收住，不要拖成长音。"] },
          { letter: "ㅁ", sound: "实际读 ㅁ", word: "ㅁ", meaning: "밤, 마음", examples: [["밤", "夜晚/栗子"], ["마음", "心"]], tips: ["双唇闭合，声音从鼻腔出来。"] },
          { letter: "ㅂ", sound: "实际读 ㅂ", word: "ㅂ ㅍ", meaning: "집, 앞", examples: [["집", "家"], ["앞", "ㅍ 作收音读 ㅂ"]], tips: ["双唇闭合收住，不要读出完整的 브。"] },
          { letter: "ㅇ", sound: "实际读 ㅇ", word: "ㅇ", meaning: "방, 강", examples: [["방", "房间"], ["강", "江/河"]], tips: ["舌根收住，声音从鼻腔出来。"] },
        ],
      },
      {
        id: "double-front",
        categoryLabel: "双收音",
        label: "多数读前一个",
        kind: "batchim",
        items: [
          { letter: "ㄳ", sound: "读前一个：ㄱ", word: "넋", meaning: "넋 → 넉", examples: [["넋", "灵魂，收成 ㄱ"]], tips: ["后面的 ㅅ 不单独读出来。"] },
          { letter: "ㄵ", sound: "读前一个：ㄴ", word: "앉다", meaning: "앉다 → 안따", examples: [["앉다", "坐，收成 ㄴ"]], tips: ["先记作 ㄴ 类收音。"] },
          { letter: "ㄶ", sound: "读前一个：ㄴ", word: "많다", meaning: "많다 → 만타", examples: [["많다", "多，收成 ㄴ"]], tips: ["ㅎ 后续会影响后面的音，这里先记默认收音。"] },
          { letter: "ㄼ", sound: "多数读前一个：ㄹ", word: "여덟", meaning: "여덟 → 여덜", examples: [["여덟", "八，收成 ㄹ"], ["넓다", "宽，常读 널따"]], tips: ["ㄼ 多数按 ㄹ 收住，但 밟다 类要单独记。"] },
          { letter: "ㄽ", sound: "读前一个：ㄹ", word: "외곬", meaning: "외곬 → 외골", examples: [["외곬", "单一路径，收成 ㄹ"]], tips: ["后面的 ㅅ 不单独读出来。"] },
          { letter: "ㄾ", sound: "读前一个：ㄹ", word: "핥다", meaning: "핥다 → 할따", examples: [["핥다", "舔，收成 ㄹ"]], tips: ["先按 ㄹ 收住，再观察后续辅音变化。"] },
          { letter: "ㅀ", sound: "读前一个：ㄹ", word: "싫다", meaning: "싫다 → 실타", examples: [["싫다", "不喜欢，收成 ㄹ"]], tips: ["ㅎ 会影响后面的 ㄷ，先把收音归到 ㄹ。"] },
          { letter: "ㅄ", sound: "读前一个：ㅂ", word: "값", meaning: "값 → 갑", examples: [["값", "价格，收成 ㅂ"], ["없다", "没有，收成 ㅂ"]], tips: ["后面的 ㅅ 不单独读出来。"] },
        ],
      },
      {
        id: "double-back",
        label: "少数读后一个",
        kind: "batchim",
        items: [
          { letter: "ㄺ", sound: "读后一个：ㄱ", word: "닭", meaning: "닭 → 닥", examples: [["닭", "鸡，收成 ㄱ"], ["읽다", "读，常收成 ㄱ"], ["맑다", "清澈，常收成 ㄱ"]], tips: ["不要按前面的 ㄹ 收住，默认听到 ㄱ 类收音。"] },
          { letter: "ㄻ", sound: "读后一个：ㅁ", word: "삶", meaning: "삶 → 삼", examples: [["삶", "人生，收成 ㅁ"], ["젊다", "年轻，收成 ㅁ"]], tips: ["看到 ㄻ，优先记作 ㅁ 类听感。"] },
          { letter: "ㄿ", sound: "读后一个：ㅂ", word: "읊다", meaning: "읊다 → 읍따", examples: [["읊다", "吟诵，收成 ㅂ"]], tips: ["ㅍ 作收音时归到 ㅂ 类。"] },
        ],
      },
      {
        id: "double-special",
        label: "特殊发音",
        kind: "batchim",
        items: [
          { letter: "ㄼ", sound: "밟다 类读 ㅂ", word: "밟다", meaning: "밟다 → 밥따", examples: [["밟다", "踩，读 밥따"], ["밟고", "读 밥꼬"], ["밟지", "读 밥찌"]], tips: ["ㄼ 多数读 ㄹ，但 밟다 这一类常读 ㅂ，需要单独记。"] },
        ],
      },
    ],
  },
];

let letterItems = [];
let selectedLetterIndex = null;
let playbackRunId = 0;
let textbookList = [];
let activeTextbook = null;
let activeTextbookPage = 1;
let activeTextbookCacheEntry = null;
let activeTextbookRenderRunId = 0;
let activeTextbookImageRunId = 0;
let activeTextbookLoadRunId = 0;
let activeTextbookLoadStatus = "idle";
let textbookCacheVersion = 0;
const textbookCache = new Map();
let localTextbookList = [];
let localTextbookOrder = JSON.parse(localStorage.getItem("localTextbookOrder") || "null") || [];
let textbookBatchMode = false;
let textbookSelectedIds = new Set();
let localTextbookDbPromise = null;
let pdfJsModulePromise = null;
let localTextbookJobVersion = 0;
const localTextbookJobs = new Map();
const localTextbookObjectUrls = new Map();
let pdfAssistantMessages = [];
let pdfAssistantRequestId = 0;
let pdfAssistantExpanded = false;
let pdfAssistantHistory = [];
let pdfAssistantHistoryView = localStorage.getItem("pdfAssistantHistoryView") === "all" ? "all" : "page";
const pdfAssistantExpandedHistoryPages = new Set();
const pdfAssistantExpandedHistoryItems = new Set();
let pdfAssistantScrollTarget = null;

// 保存当前正在做“片段循环”的结束时间，timeupdate 事件里会用到。
let currentLoopEnd = 0;

// 保存当前片段的开始时间，循环时需要跳回这里。
let currentLoopStart = 0;

// 标记当前是否开启片段循环。
let loopEnabled = false;

// 教材听力循环开关，只影响教材阅读器里的听力按钮。
let materialAudioLoopEnabled = false;

// 明暗背景偏好保存在浏览器本地；刷新页面后保持上次选择。
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.dataset.theme = "dark";
}

function getWordAudioUrl(word, fallbackUrl = "") {
  return window.WORD_AUDIO_URLS?.[word] || fallbackUrl || "";
}


function normalizeExample(rawExample, index, fallbackAudioUrl = "") {
  if (Array.isArray(rawExample)) {
    const [word, meaning] = rawExample;
    return {
      word,
      meaning,
      label: "",
      audioUrl: getWordAudioUrl(word, index === 0 ? fallbackAudioUrl : ""),
      primary: index === 0,
    };
  }

  return {
    word: rawExample.word,
    meaning: rawExample.meaning,
    label: rawExample.label || "",
    audioUrl: getWordAudioUrl(rawExample.word, index === 0 ? fallbackAudioUrl : ""),
    primary: index === 0,
  };
}


/**
 * 封装 fetch，统一处理 JSON。
 * @param {string} url 请求地址
 * @param {object} options fetch 选项，例如 method、body、headers
 * @returns {Promise<object>} 后端返回的 JSON 对象
 */
async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }

  return data;
}


function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}


function formatTranscriptHtml(transcript) {
  const speakerPattern = /^(?:김 선생님|선생님|아저씨|마리아|리에|웨이|제임스|민철|민절|정희|정회|미선|영수|유진|로라|리카|세르게이|토마스|왕명|왕영|과장|주인|주민|손님|슨님|가|나)$/;
  const speakerPrefixPattern = /^((?:김 선생님|선생님|아저씨|마리아|리에|웨이|제임스|민철|민절|정희|정회|미선|영수|유진|로라|리카|세르게이|토마스|왕명|왕영|과장|주인|주민|손님|슨님|가|나))\s+(?!씨(?:\b|[가-힣,.，、]))(.+)$/;
  const sectionPattern = /^\d+\.$/;
  const suffixLinePattern = /^(?:씨[,.，、]?|요[,.，、]?|예요[,.，、]?|입니다[,.，、]?)/;
  const lines = String(transcript || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (speakerPattern.test(line) && lines[index + 1]) {
      if (speakerPattern.test(lines[index + 1]) && suffixLinePattern.test(lines[index + 2] || "")) {
        blocks.push({ speaker: line, text: `${lines[index + 1]} ${lines[index + 2]}` });
        index += 2;
        continue;
      }

      const utterance = [];
      index += 1;
      while (index < lines.length && !speakerPattern.test(lines[index]) && !speakerPrefixPattern.test(lines[index]) && !sectionPattern.test(lines[index])) {
        utterance.push(lines[index]);
        index += 1;
      }
      index -= 1;
      blocks.push({ speaker: line, text: utterance.join(" ") });
      continue;
    }

    const speakerMatch = line.match(speakerPrefixPattern);
    if (speakerMatch) {
      blocks.push({ speaker: speakerMatch[1], text: speakerMatch[2] });
    } else {
      blocks.push({ text: line });
    }
  }

  return blocks.map((block) => {
    if (!block.speaker) {
      if (sectionPattern.test(block.text)) {
        return `<div class="transcript-section-number">${escapeHtml(block.text)}</div>`;
      }

      return `<div class="transcript-line"><span>${escapeHtml(block.text)}</span></div>`;
    }

    return `
      <div class="transcript-line">
        <strong class="transcript-speaker">${escapeHtml(block.speaker)}</strong>
        <span>${escapeHtml(block.text)}</span>
      </div>
    `;
  })
    .join("");
}


function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const restSeconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${restSeconds}`;
}


function getAudioButtonLabel(audios, index) {
  return audios.length > 1 ? `播放听力${index + 1}` : "播放听力";
}


function getChapterSectionTitle(section) {
  const match = String(section.title || "").match(/(\d+)单元/);
  return match ? `${match[1]}单元` : (section.title || "");
}


function setRangeFill(input, value = Number(input.value) || 0) {
  input.style.setProperty("--range-fill", `${Math.min(Math.max(value, 0), 100)}%`);
}


function seekMaterialAudio(progress) {
  if (!Number.isFinite(player.duration) || player.duration <= 0) {
    return;
  }

  const progressValue = Math.min(Math.max(Number(progress.value) || 0, 0), 100);
  const targetTime = (progressValue / 100) * player.duration;
  if (typeof player.fastSeek === "function") {
    player.fastSeek(targetTime);
  } else {
    player.currentTime = targetTime;
  }
  setRangeFill(progress, progressValue);
}


function syncMaterialAudioControls() {
  const currentSrc = player.currentSrc || player.getAttribute("src") || "";
  const duration = Number.isFinite(player.duration) ? player.duration : 0;
  const currentTime = Number.isFinite(player.currentTime) ? player.currentTime : 0;
  const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0;

  document.querySelectorAll(".audio-card").forEach((card) => {
    const isActive = Boolean(currentSrc) && Array.from(card.querySelectorAll("[data-audio]")).some((button) => {
      const url = button.dataset.audio || "";
      return currentSrc.endsWith(url) || currentSrc === url;
    });
    const progress = card.querySelector("[data-audio-progress]");
    const time = card.querySelector("[data-audio-time]");
    const volume = card.querySelector("[data-audio-volume]");
    const muteButton = card.querySelector("[data-audio-mute]");
    const pauseButton = card.querySelector("[data-audio-pause]");
    const loopButton = card.querySelector("[data-audio-loop]");

    card.classList.toggle("is-playing", isActive && !player.paused);
    if (progress && !progress.dataset.seeking) {
      const nextValue = isActive ? progressValue : 0;
      progress.value = String(nextValue);
      setRangeFill(progress, nextValue);
      progress.disabled = !isActive || duration <= 0;
    }
    if (time) {
      time.textContent = isActive ? `${formatAudioTime(currentTime)} / ${formatAudioTime(duration)}` : "0:00 / 0:00";
    }
    if (volume) {
      const volumeValue = Math.round(player.volume * 100);
      volume.value = String(volumeValue);
      setRangeFill(volume, volumeValue);
    }
    if (muteButton) {
      muteButton.setAttribute("aria-label", player.muted ? "取消静音" : "静音");
      muteButton.classList.toggle("is-muted", player.muted || player.volume === 0);
    }
    if (pauseButton) {
      pauseButton.disabled = !isActive;
      pauseButton.setAttribute("aria-label", player.paused ? "继续播放" : "暂停听力");
      pauseButton.classList.toggle("is-paused", isActive && player.paused);
    }
    if (loopButton) {
      loopButton.setAttribute("aria-pressed", String(materialAudioLoopEnabled));
      loopButton.setAttribute("aria-label", materialAudioLoopEnabled ? "关闭循环播放" : "开启循环播放");
      loopButton.classList.toggle("is-looping", materialAudioLoopEnabled);
    }
  });
}


/**
 * 播放一个音频地址。
 * start/end 用于教材时间轴或句子片段播放。
 * slow=true 时播放速度变成 0.75 倍，方便跟读。
 */
function playAudio(audioUrl, start = 0, end = 0, shouldLoop = false, slow = false) {
  if (!audioUrl) {
    alert("这条内容还没有配置音频地址。");
    return;
  }

  const isSameAudio = player.getAttribute("src") === audioUrl || player.currentSrc.endsWith(audioUrl);
  stopPlaybackQueue();
  player.loop = false;
  currentLoopStart = Number(start) || 0;
  currentLoopEnd = Number(end) || 0;
  loopEnabled = shouldLoop;

  // 如果切换了新的音频文件，先设置 src；如果还是同一个文件，只跳转时间即可。
  if (player.getAttribute("src") !== audioUrl) {
    player.src = audioUrl;
  }

  player.playbackRate = slow ? 0.75 : 1;
  if (!isSameAudio || currentLoopStart > 0) {
    player.currentTime = currentLoopStart;
  }
  player.play();
  syncMaterialAudioControls();
}


function playMaterialAudio(audioUrl) {
  playAudio(audioUrl);
  player.loop = materialAudioLoopEnabled;
  syncMaterialAudioControls();
}


function stopPlaybackQueue() {
  playbackRunId += 1;
  player.pause();
  stopKoreanTextPlayback();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}


function wait(ms, runId) {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(playbackRunId === runId);
    }, ms);
  });
}


function playUrlOnce(audioUrl, runId) {
  return new Promise((resolve) => {
    if (!audioUrl || playbackRunId !== runId) {
      resolve(false);
      return;
    }

    player.loop = false;
    loopEnabled = false;
    player.playbackRate = 1;
    player.src = audioUrl;
    player.currentTime = 0;

    const cleanup = () => {
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("error", onError);
    };

    const onEnded = () => {
      cleanup();
      resolve(true);
    };

    const onError = () => {
      cleanup();
      resolve(false);
    };

    player.addEventListener("ended", onEnded, { once: true });
    player.addEventListener("error", onError, { once: true });

    player.play().catch(() => {
      cleanup();
      resolve(false);
    });
  });
}

const ttsRequestCache = new Map();
let generatedTextPlaybackRunId = 0;


function stopKoreanTextPlayback() {
  generatedTextPlaybackRunId += 1;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}


async function synthesizeKoreanSpeech(text, { slow = false, voice = "" } = {}) {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    return "";
  }

  const cacheKey = JSON.stringify({ text: normalizedText, slow, voice });
  if (!ttsRequestCache.has(cacheKey)) {
    ttsRequestCache.set(cacheKey, (async () => {
      const response = await fetch("/api/tts/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: normalizedText,
          slow,
          voice,
          speakingRate: slow ? 0.75 : 1,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "TTS 生成失败");
      }
      return payload.audioUrl || "";
    })());
  }

  return ttsRequestCache.get(cacheKey);
}


function playAudioWithCallbacks(audioUrl, { slow = false, loop = false, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!audioUrl) {
      resolve(false);
      return;
    }

    player.pause();
    player.loop = !!loop;
    loopEnabled = !!loop;
    player.playbackRate = slow ? 0.75 : 1;
    player.src = audioUrl;
    player.currentTime = 0;

    const cleanup = () => {
      player.removeEventListener("ended", onEnded);
      player.removeEventListener("error", onError);
    };

    const onEnded = () => {
      cleanup();
      onEnd?.();
      resolve(true);
    };

    const onError = () => {
      cleanup();
      resolve(false);
    };

    player.addEventListener("ended", onEnded, { once: true });
    player.addEventListener("error", onError, { once: true });
    player.play().then(() => {
      if (loop) {
        resolve(true);
      }
    }).catch(() => {
      cleanup();
      resolve(false);
    });
  });
}


function speakKoreanInBrowser(text, { slow = false, loop = false, onEnd } = {}) {
  return new Promise((resolve) => {
    if (!text || !("speechSynthesis" in window)) {
      resolve(false);
      return;
    }

    const runId = generatedTextPlaybackRunId;
    const speakOnce = () => {
      if (runId !== generatedTextPlaybackRunId) {
        resolve(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = slow ? 0.68 : 0.9;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const koreanVoice = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ko"));
      if (koreanVoice) {
        utterance.voice = koreanVoice;
      }

      utterance.onend = () => {
        if (runId !== generatedTextPlaybackRunId) {
          resolve(false);
          return;
        }
        if (loop) {
          window.setTimeout(speakOnce, 450);
        } else {
          onEnd?.();
          resolve(true);
        }
      };
      utterance.onerror = () => {
        onEnd?.();
        resolve(false);
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    speakOnce();
  });
}


async function playKoreanText(text, { slow = false, loop = false, onEnd, voice = "" } = {}) {
  const normalizedText = String(text || "").trim();
  if (!normalizedText) {
    onEnd?.();
    return false;
  }

  stopKoreanTextPlayback();
  const runId = generatedTextPlaybackRunId;
  try {
    const audioUrl = await synthesizeKoreanSpeech(normalizedText, { slow, voice });
    if (runId !== generatedTextPlaybackRunId) {
      return false;
    }
    const played = await playAudioWithCallbacks(audioUrl, { slow, loop, onEnd });
    if (played) {
      return true;
    }
  } catch (error) {
    console.info("服务端 TTS 不可用，退回浏览器朗读。", error.message);
  }

  if (runId !== generatedTextPlaybackRunId) {
    return false;
  }
  return speakKoreanInBrowser(normalizedText, { slow, loop, onEnd });
}


function speakKorean(text, runId) {
  return new Promise((resolve) => {
    if (!text || playbackRunId !== runId || !("speechSynthesis" in window)) {
      resolve(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.86;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const koreanVoice = voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ko"));
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}


async function playPronunciationItem(item, runId) {
  let played = false;

  if (item.preferTts && item.text) {
    played = await playKoreanText(item.text, { slow: item.slow });
    if (playbackRunId !== runId) {
      return false;
    }
  }

  if (!played && item.audioUrl) {
    played = await playUrlOnce(item.audioUrl, runId);
  }

  if (!played && item.text) {
    played = await speakKorean(item.text, runId);
  }

  return played;
}


window.synthesizeKoreanSpeech = synthesizeKoreanSpeech;
window.playKoreanText = playKoreanText;
window.stopKoreanTextPlayback = stopKoreanTextPlayback;


function getRepeatCount() {
  const input = document.querySelector("#letterRepeatCount");
  const count = Number.parseInt(input?.value || "1", 10);

  if (!Number.isFinite(count) || count < 1) {
    if (input) {
      input.value = "1";
    }
    return 1;
  }

  return count;
}


function buildLetterPlaybackQueue(letterData) {
  const includeLetter = document.querySelector("#playLetterSound")?.checked;
  const includeWords = document.querySelector("#playExampleWords")?.checked;
  const queue = [];

  if (includeLetter) {
    queue.push({
      label: "音标",
      text: letterData.playbackText || letterData.sound,
      audioUrl: letterData.letterAudioUrl,
    });
  }

  if (includeWords) {
    letterData.examples.forEach((example) => {
      queue.push({
        label: "示例单词",
        text: example.word,
        audioUrl: example.audioUrl,
        preferTts: true,
      });
    });
  }

  return queue;
}


async function playLetterQueue(letterData) {
  stopPlaybackQueue();

  const runId = playbackRunId;
  const repeatCount = getRepeatCount();
  const queue = buildLetterPlaybackQueue(letterData);

  if (queue.length === 0) {
    alert("请至少选择“音标”或“示例单词”。");
    return;
  }

  for (const item of queue) {
    for (let index = 0; index < repeatCount; index += 1) {
      if (playbackRunId !== runId) {
        return;
      }

      await playPronunciationItem(item, runId);

      if (playbackRunId !== runId) {
        return;
      }

      await wait(1300, runId);
    }

    await wait(500, runId);
  }
}


// timeupdate 会在音频播放过程中持续触发。
// 如果开启了单句循环，并且播放到片段结束时间，就跳回片段开始时间。
player.addEventListener("timeupdate", () => {
  if (loopEnabled && currentLoopEnd > 0 && player.currentTime >= currentLoopEnd) {
    player.currentTime = currentLoopStart;
    player.play();
  }

  syncMaterialAudioControls();
});

player.addEventListener("loadedmetadata", syncMaterialAudioControls);
player.addEventListener("play", syncMaterialAudioControls);
player.addEventListener("pause", syncMaterialAudioControls);
player.addEventListener("ended", syncMaterialAudioControls);
player.addEventListener("volumechange", syncMaterialAudioControls);


/**
 * 切换页面栏目。
 */
function resetPageState(pageId) {
  if (pageId === "letters") {
    closeLetterDetail();
  }

  if (pageId === "materials") {
    resetTextbookReaderToLibrary();
  }

  window.dispatchEvent(new CustomEvent("korean-learn:reset-module", {
    detail: { page: pageId },
  }));
}


function activatePage(pageId, options = {}) {
  document.querySelectorAll(".tab").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.body.dataset.activePage = pageId;

  if (options.reset) {
    resetPageState(pageId);
  }
}


function initDefaultPage() {
  activatePage("guide", { reset: true });
}


/**
 * 初始化顶部 tab 切换。
 */
function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activatePage(tab.dataset.page, { reset: true }));
  });

  document.querySelectorAll("[data-open-page]").forEach((button) => {
    button.addEventListener("click", () => activatePage(button.dataset.openPage, { reset: true }));
  });
}

function initThemeToggle() {
  const themeToggle = document.querySelector(".theme-toggle");
  if (!themeToggle) {
    return;
  }

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.dataset.theme === "dark";
    document.body.dataset.theme = isDark ? "light" : "dark";
    localStorage.setItem("theme", document.body.dataset.theme);
  });
}


function normalizeLetterItem(item) {
  const details = LETTER_DETAILS[item.letter] || {};
  const guidance = LETTER_GUIDANCE[item.letter] || {};
  const kind = CONSONANT_LETTERS.has(item.letter) ? "consonant" : "vowel";
  const primaryExample = {
    word: item.word,
    meaning: item.meaning,
    label: "",
    audioUrl: getWordAudioUrl(item.word, item.audio_url || ""),
    primary: true,
  };

  const examples = (details.examples || [[item.word, item.meaning]])
    .map((example, index) => normalizeExample(example, index, item.audio_url || ""));

  if (!examples.some((example) => example.word === primaryExample.word)) {
    examples.unshift(primaryExample);
  }

  return {
    ...item,
    type: "letter",
    kind,
    sound: details.sound || item.letter,
    letterAudioUrl: item.letter_audio_url || "",
    examples,
    tips: [
      ...(details.tips || []),
      ...(guidance.tips || []),
    ],
    positionNotes: guidance.positionNotes || getDefaultPositionNotes(kind),
    contrastNote: guidance.contrastNote || getDefaultContrastNote(kind),
    contrastGroup: details.contrastGroup || "",
  };
}


function normalizeRuleItem(item, group) {
  const examples = (item.examples || []).map((example, index) => normalizeExample(example, index));

  return {
    type: "rule",
    kind: group.kind,
    letter: item.letter,
    word: item.word,
    meaning: item.meaning,
    sound: item.sound,
    playbackText: examples[0]?.word || item.letter,
    letterAudioUrl: "",
    examples,
    tips: item.tips || [],
    positionNotes: item.sound ? [item.sound] : [],
    contrastNote: "",
  };
}


function getDefaultPositionNotes(kind) {
  if (kind === "vowel") {
    return ["元音不分词首、词中、词尾辅音位置；重点练口型，以及和辅音组合后的稳定音色。"];
  }

  return ["这个辅音的实际听感会受词首、词中、收音位置影响；先听示范词，再跟读模仿。"];
}


function getDefaultContrastNote(kind) {
  if (kind === "vowel") {
    return "元音不参与松音、紧音、送气音对比；重点比较口型、圆唇和双元音滑动。";
  }

  return "这个音标没有成套的松音/紧音/送气音对比，先把自身发音位置练稳。";
}


function getCardAriaLabel(item) {
  if (item.type === "rule") {
    return `查看 ${item.letter} 收音规则`;
  }

  return `播放 ${item.letter}，查看 ${item.word} 示例`;
}


function renderPracticeCard(item, index) {
  return `
    <article
      class="letter-card ${item.kind}${item.type === "rule" ? " rule-card" : ""}"
      data-index="${index}"
      role="button"
      tabindex="0"
      aria-label="${getCardAriaLabel(item)}"
    >
      <strong>${item.letter}</strong>
    </article>
  `;
}


function renderGuidanceBlock(title, notes, variant = "") {
  if (!notes.length) {
    return "";
  }

  return `
    <div class="detail-guidance ${variant}">
      <h4>${title}</h4>
      <div>
        ${notes.map((note) => `<span>${note}</span>`).join("")}
      </div>
    </div>
  `;
}


function getContrastItems(letterData) {
  return (CONTRAST_GROUPS[letterData.contrastGroup] || []).map((item, index) => ({
    ...item,
    audioUrl: getWordAudioUrl(item.word),
    primary: item.letter === letterData.letter,
    contrastIndex: index,
  }));
}


function renderWordButton(item, index, options = {}) {
  const label = item.label ? `<span class="word-label">${item.label}</span>` : "";
  const current = options.current ? " current" : "";
  const primary = item.primary ? " primary" : "";
  const letter = item.letter ? `<span class="word-letter">${item.letter}</span>` : "";
  const dataset = options.kind === "contrast" ? `data-contrast-index="${index}"` : `data-example-index="${index}"`;

  return `
    <button class="example-word${primary}${current}" type="button" ${dataset}>
      ${label}
      <strong>${letter}${item.word}</strong>
      <span>${item.meaning}</span>
    </button>
  `;
}


function renderExampleSection(title, items, kind, letterData) {
  if (!items.length) {
    return "";
  }

  return `
    <div class="detail-block">
      <div class="detail-block-head">
        <h4>${title}</h4>
      </div>
      <div class="example-list">
        ${items.map((item, index) => renderWordButton(item, index, {
          kind,
          current: kind === "contrast" && item.letter === letterData.letter,
        })).join("")}
      </div>
    </div>
  `;
}


function getExampleSectionTitle(letterData) {
  if (letterData.type === "rule") {
    return "规则例词";
  }

  if (letterData.kind === "vowel") {
    return "示范词汇";
  }

  return "位置示范";
}


async function playWordOnly(item) {
  stopPlaybackQueue();

  const runId = playbackRunId;
  const repeatCount = getRepeatCount();

  for (let index = 0; index < repeatCount; index += 1) {
    if (playbackRunId !== runId) {
      return;
    }

    await playPronunciationItem({
      text: item.word,
      audioUrl: item.audioUrl,
      preferTts: true,
    }, runId);

    if (index < repeatCount - 1) {
      await wait(520, runId);
    }
  }
}


function bindDetailWordPlayback(detail, letterData, contrastItems) {
  detail.querySelectorAll("[data-example-index]").forEach((button) => {
    button.addEventListener("click", () => {
      playWordOnly(letterData.examples[Number(button.dataset.exampleIndex)]);
    });
  });

  detail.querySelectorAll("[data-contrast-index]").forEach((button) => {
    button.addEventListener("click", () => {
      playWordOnly(contrastItems[Number(button.dataset.contrastIndex)]);
    });
  });
}


function closeLetterDetail() {
  const detail = document.querySelector("#letterDetail");
  if (!detail) {
    return;
  }

  selectedLetterIndex = null;
  detail.hidden = true;
  document.querySelector("#letters")?.appendChild(detail);
  document.querySelectorAll(".letter-card").forEach((card) => card.classList.remove("selected"));
  stopPlaybackQueue();
}


function moveLetterDetailAfterSelectedRow(detail, selectedCard) {
  const groupGrid = selectedCard.closest(".letter-group-grid");
  if (!groupGrid) {
    return;
  }

  const selectedTop = selectedCard.offsetTop;
  const rowCards = Array.from(groupGrid.querySelectorAll(".letter-card"))
    .filter((card) => Math.abs(card.offsetTop - selectedTop) < 2);
  const lastRowCard = rowCards[rowCards.length - 1] || selectedCard;

  lastRowCard.insertAdjacentElement("afterend", detail);
}


function renderLetterDetail(letterData, selectedCard) {
  const detail = document.querySelector("#letterDetail");
  if (!detail || !selectedCard) {
    return;
  }

  const contrastItems = getContrastItems(letterData);

  detail.hidden = true;
  moveLetterDetailAfterSelectedRow(detail, selectedCard);
  detail.hidden = false;
  detail.innerHTML = `
    <div class="letter-detail-head">
      <div>
        <span class="eyebrow">Sound Detail</span>
        <h3>${letterData.letter} <span>${letterData.sound}</span></h3>
      </div>
      <div class="letter-detail-actions">
        <button class="detail-close" type="button" aria-label="收起示范详情">×</button>
      </div>
    </div>
    <div class="detail-guidance-grid">
      ${renderGuidanceBlock("发音技巧", letterData.tips || [], "primary")}
      ${renderGuidanceBlock("位置说明", letterData.positionNotes || [], "position")}
      ${contrastItems.length ? "" : renderGuidanceBlock("对比说明", letterData.contrastNote ? [letterData.contrastNote] : [], "contrast")}
    </div>
    ${renderExampleSection(getExampleSectionTitle(letterData), letterData.examples, "example", letterData)}
    ${renderExampleSection("对比词汇", contrastItems, "contrast", letterData)}
  `;

  detail.querySelector(".detail-close").addEventListener("click", () => {
    closeLetterDetail();
  });

  bindDetailWordPlayback(detail, letterData, contrastItems);
}


function selectLetter(index) {
  const detail = document.querySelector("#letterDetail");
  const selectedCard = document.querySelector(`.letter-card[data-index="${index}"]`);

  if (selectedLetterIndex === index) {
    closeLetterDetail();
    return;
  }

  if (detail) {
    detail.hidden = true;
  }

  selectedLetterIndex = index;
  const letterData = letterItems[index];

  document.querySelectorAll(".letter-card").forEach((card) => {
    card.classList.toggle("selected", Number(card.dataset.index) === index);
  });

  renderLetterDetail(letterData, selectedCard);
}


/**
 * 加载 40 个韩文字母。
 * 字母数据由 /api/letters 返回，点击卡片播放对应音频。
 */
async function loadLetters() {
  const result = await api("/api/letters");
  const grid = document.querySelector("#letterGrid");
  const normalizedLetters = result.data.map(normalizeLetterItem);
  const lettersBySymbol = new Map(normalizedLetters.map((item) => [item.letter, item]));
  letterItems = [];

  grid.innerHTML = PHONETIC_SECTIONS.map((section) => `
    <section class="letter-section" data-section="${section.id}">
      <div class="letter-section-head">
        <div>
          <span class="eyebrow">${section.id === "batchim" ? "Batchim" : "Hangul"}</span>
          <h3>${section.label}</h3>
        </div>
      </div>
      <div class="letter-subgroups">
        ${section.groups.map((group) => {
          const groupItems = (group.letters || [])
            .map((letter) => lettersBySymbol.get(letter))
            .filter(Boolean)
            .concat((group.items || []).map((item) => normalizeRuleItem(item, group)));

          const indexedItems = groupItems.map((item) => {
            const index = letterItems.length;
            letterItems.push(item);
            return { item, index };
          });

          return `
            <section class="letter-subgroup" data-group="${group.id}">
              ${group.categoryLabel ? `
                <div class="letter-category-head">
                  <div>
                    <span class="eyebrow">Double Batchim</span>
                    <h4>${group.categoryLabel}</h4>
                  </div>
                </div>
              ` : ""}
              <div class="letter-subgroup-head">
                <div>
                  <h4>${group.label}</h4>
                </div>
              </div>
              <div class="letter-group-grid">
                ${indexedItems.map(({ item, index }) => renderPracticeCard(item, index)).join("")}
              </div>
            </section>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");

  grid.querySelectorAll(".letter-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectLetter(Number(card.dataset.index));
    });
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      selectLetter(Number(card.dataset.index));
    });
  });

  window.addEventListener("resize", () => {
    if (selectedLetterIndex === null) {
      return;
    }

    const selectedCard = document.querySelector(`.letter-card[data-index="${selectedLetterIndex}"]`);
    const detail = document.querySelector("#letterDetail");
    if (selectedCard && detail && !detail.hidden) {
      moveLetterDetailAfterSelectedRow(detail, selectedCard);
    }
  });
}


/**
 * 加载场景下拉框。
 * 这里同时更新场景页和管理页的 select，避免用户新增句子时不知道场景 id。
 */
async function loadScenes() {
  const result = await api("/api/scenes");
  const sceneSelect = document.querySelector("#sceneSelect");

  const options = result.data.map((scene) => (
    `<option value="${scene.id}">${scene.name}</option>`
  )).join("");

  sceneSelect.innerHTML = options;

  if (result.data.length > 0) {
    await loadSentences(result.data[0].id);
  } else {
    document.querySelector("#sentenceList").innerHTML = "<p>还没有场景，请先到管理页新增。</p>";
  }
}

/**
 * 按场景加载句子。
 * 每个句子显示韩文、中文和播放按钮。
 */
async function loadSentences(sceneId) {
  const result = await api(`/api/sentences?scene_id=${encodeURIComponent(sceneId)}`);
  const list = document.querySelector("#sentenceList");

  if (result.data.length === 0) {
    list.innerHTML = "<p>这个场景还没有句子。</p>";
    return;
  }

  list.innerHTML = result.data.map((item) => `
    <article class="sentence-card">
      <div>
        <h3>${item.korean}</h3>
        <p>${item.chinese}</p>
        <div class="meta">片段：${item.audio_start || 0}s - ${item.audio_end || "音频结束"}s</div>
      </div>
      <button
        data-audio="${item.audio_url || ""}"
        data-start="${item.audio_start || 0}"
        data-end="${item.audio_end || 0}"
      >播放</button>
    </article>
  `).join("");
  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      playAudio(
        button.dataset.audio,
        button.dataset.start,
        button.dataset.end,
        document.querySelector("#sentenceLoop").checked,
        document.querySelector("#sentenceSlow").checked,
      );
    });
  });
}


/**
 * 加载词汇。
 * 词汇不是孤立展示，而是通过关联例句出现。
 */
async function loadVocabulary(keyword = "") {
  const result = await api(`/api/vocabulary?q=${encodeURIComponent(keyword)}`);
  const list = document.querySelector("#vocabList");

  if (result.data.length === 0) {
    list.innerHTML = "<p>没有找到相关词汇。</p>";
    return;
  }

  list.innerHTML = result.data.map((item) => `
    <article class="sentence-card">
      <div>
        <h3>${item.korean} <small>${item.pos || ""}</small></h3>
        <p>${item.chinese}</p>
        <div class="meta">${item.sentence_korean || "暂未找到包含该词的例句"}</div>
        <div class="meta">${item.sentence_chinese || ""}</div>
      </div>
      <button data-audio="${item.audio_url || ""}">播放例句</button>
    </article>
  `).join("");

  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => playAudio(button.dataset.audio));
  });
}


/**
 * 加载教材入口列表。
 */
async function loadMaterials() {
  await loadAppConfig();
  textbookList = [];
  localTextbookList = await loadLocalTextbookDocuments();
  renderTextbookLibrary();
}


function openLocalTextbookDb() {
  if (localTextbookDbPromise) {
    return localTextbookDbPromise;
  }

  localTextbookDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_TEXTBOOK_DB_NAME, LOCAL_TEXTBOOK_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LOCAL_TEXTBOOK_DOC_STORE)) {
        db.createObjectStore(LOCAL_TEXTBOOK_DOC_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(LOCAL_TEXTBOOK_PAGE_STORE)) {
        const store = db.createObjectStore(LOCAL_TEXTBOOK_PAGE_STORE, { keyPath: ["documentId", "pageNumber", "kind"] });
        store.createIndex("byDocument", "documentId");
      }
      if (!db.objectStoreNames.contains(LOCAL_TEXTBOOK_TEXT_STORE)) {
        const store = db.createObjectStore(LOCAL_TEXTBOOK_TEXT_STORE, { keyPath: ["documentId", "pageNumber"] });
        store.createIndex("byDocument", "documentId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return localTextbookDbPromise;
}


async function runLocalTextbookStore(storeName, mode, callback) {
  const db = await openLocalTextbookDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    result = callback(store);
  });
}


function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}


async function loadLocalTextbookDocuments() {
  if (!("indexedDB" in window)) {
    return [];
  }

  const documents = await runLocalTextbookStore(LOCAL_TEXTBOOK_DOC_STORE, "readonly", (store) => requestToPromise(store.getAll()));
  return documents
    .map(normalizeLocalTextbookDocument)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}


function normalizeLocalTextbookDocument(document) {
  return {
    ...document,
    title: document.title || document.fileName || "本地 PDF 教材",
    pageCount: document.pageCount || 1,
    generatedPages: document.generatedPages || 0,
    textPages: document.textPages || 0,
    outlineStatus: document.outlineStatus || "pending",
    outlineError: document.outlineError || "",
    outlineDebugSummary: document.outlineDebugSummary || "",
    units: document.units || [],
    assistantHistory: Array.isArray(document.assistantHistory) ? document.assistantHistory : [],
    status: document.status || "processing",
    source: "local-upload",
  };
}


async function saveLocalTextbookDocument(document) {
  await runLocalTextbookStore(LOCAL_TEXTBOOK_DOC_STORE, "readwrite", (store) => store.put(document));
  localTextbookList = await loadLocalTextbookDocuments();
}


async function getLocalTextbookDocument(documentId) {
  const document = await runLocalTextbookStore(LOCAL_TEXTBOOK_DOC_STORE, "readonly", (store) => requestToPromise(store.get(documentId)));
  return document ? normalizeLocalTextbookDocument(document) : null;
}


function getPdfAssistantHistoryStorageKey(textbook = activeTextbook) {
  if (!textbook) {
    return "";
  }
  if (textbook.source === "local-upload") {
    return textbook.id || "";
  }
  return textbook.manifestUrl || textbook.id || textbook.title || "";
}


function normalizePdfAssistantHistoryItem(item, textbookId = "") {
  if (!item || typeof item !== "object") {
    return null;
  }
  const page = Math.max(1, Number(item.page) || 1);
  const createdAt = Number(item.createdAt) || Date.now();
  const question = String(item.question || "").trim();
  const answer = String(item.answer || "").trim();
  if (!question && !answer) {
    return null;
  }
  return {
    id: String(item.id || `assistant-${createdAt}-${Math.random().toString(36).slice(2, 8)}`),
    textbookId: String(item.textbookId || textbookId || ""),
    page,
    question,
    answer,
    createdAt,
    updatedAt: Number(item.updatedAt) || createdAt,
    truncated: Boolean(item.truncated),
  };
}


function normalizePdfAssistantHistory(history, textbookId = "") {
  return (Array.isArray(history) ? history : [])
    .map((item) => normalizePdfAssistantHistoryItem(item, textbookId))
    .filter(Boolean)
    .sort((a, b) => a.createdAt - b.createdAt);
}


function loadStoredPdfAssistantHistory(textbook = activeTextbook) {
  const storageKey = getPdfAssistantHistoryStorageKey(textbook);
  if (!storageKey || textbook?.source === "local-upload") {
    return [];
  }
  try {
    return normalizePdfAssistantHistory(
      JSON.parse(localStorage.getItem(`pdfAssistantHistory:${storageKey}`) || "[]"),
      storageKey,
    );
  } catch (error) {
    return [];
  }
}


async function persistPdfAssistantHistory() {
  const storageKey = getPdfAssistantHistoryStorageKey();
  if (!activeTextbook || !storageKey) {
    return;
  }

  const nextHistory = normalizePdfAssistantHistory(pdfAssistantHistory, storageKey);
  pdfAssistantHistory = nextHistory;
  if (activeTextbook.source === "local-upload") {
    const documentRecord = await getLocalTextbookDocument(activeTextbook.id);
    if (!documentRecord) {
      return;
    }
    await saveLocalTextbookDocument({
      ...documentRecord,
      assistantHistory: nextHistory,
      updatedAt: Date.now(),
    });
  } else {
    localStorage.setItem(`pdfAssistantHistory:${storageKey}`, JSON.stringify(nextHistory));
  }
}


async function addPdfAssistantHistoryItem(question, answer, truncated = false, page = activeTextbookPage) {
  const textbookId = getPdfAssistantHistoryStorageKey();
  if (!activeTextbook || !textbookId) {
    return null;
  }
  const now = Date.now();
  const historyItem = {
    id: `assistant-${now}-${Math.random().toString(36).slice(2, 8)}`,
    textbookId,
    page: Math.max(1, Number(page) || activeTextbookPage || 1),
    question,
    answer,
    createdAt: now,
    updatedAt: now,
    truncated,
  };
  pdfAssistantHistory.push(historyItem);
  try {
    await persistPdfAssistantHistory();
  } catch (error) {
    console.warn("AI 助教历史保存失败。", error);
  }
  return historyItem;
}


async function deletePdfAssistantHistoryItem(historyId) {
  pdfAssistantHistory = pdfAssistantHistory.filter((item) => item.id !== historyId);
  try {
    await persistPdfAssistantHistory();
  } catch (error) {
    console.warn("AI 助教历史删除保存失败。", error);
  }
  renderPdfAssistantPanel();
}


async function clearPdfAssistantHistory() {
  if (!activeTextbook) {
    return;
  }
  const confirmed = window.confirm("确定清空本教材的全部 AI 助教历史吗？");
  if (!confirmed) {
    return;
  }
  pdfAssistantHistory = [];
  try {
    await persistPdfAssistantHistory();
  } catch (error) {
    console.warn("AI 助教历史清空保存失败。", error);
  }
  renderPdfAssistantPanel();
}


async function saveLocalTextbookPage(documentId, pageNumber, kind, blob) {
  await runLocalTextbookStore(LOCAL_TEXTBOOK_PAGE_STORE, "readwrite", (store) => store.put({
    documentId,
    pageNumber,
    kind,
    blob,
    updatedAt: Date.now(),
  }));
}


async function getLocalTextbookPage(documentId, pageNumber, kind) {
  return runLocalTextbookStore(LOCAL_TEXTBOOK_PAGE_STORE, "readonly", (store) => (
    requestToPromise(store.get([documentId, Number(pageNumber), kind]))
  ));
}


async function saveLocalTextbookPageText(documentId, pageNumber, text, outlineTitle = "") {
  await runLocalTextbookStore(LOCAL_TEXTBOOK_TEXT_STORE, "readwrite", (store) => store.put({
    documentId,
    pageNumber,
    text,
    textStatus: text ? "ready" : "empty",
    outlineTitle,
    updatedAt: Date.now(),
  }));
}


async function getLocalTextbookPageText(documentId, pageNumber) {
  return runLocalTextbookStore(LOCAL_TEXTBOOK_TEXT_STORE, "readonly", (store) => (
    requestToPromise(store.get([documentId, Number(pageNumber)]))
  ));
}


async function deleteLocalTextbookPages(documentId) {
  const db = await openLocalTextbookDb();
  await deleteLocalTextbookStoreByDocument(db, LOCAL_TEXTBOOK_PAGE_STORE, documentId);
  await deleteLocalTextbookStoreByDocument(db, LOCAL_TEXTBOOK_TEXT_STORE, documentId);
}


function deleteLocalTextbookStoreByDocument(db, storeName, documentId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const index = transaction.objectStore(storeName).index("byDocument");
    const request = index.openCursor(IDBKeyRange.only(documentId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}


async function deleteLocalTextbook(documentId) {
  stopPlaybackQueue();
  activeTextbookRenderRunId += 1;
  activeTextbookImageRunId += 1;
  activeTextbookLoadRunId += 1;
  localTextbookJobs.delete(documentId);
  revokeLocalTextbookObjectUrls(documentId);
  await deleteLocalTextbookPages(documentId);
  await runLocalTextbookStore(LOCAL_TEXTBOOK_DOC_STORE, "readwrite", (store) => store.delete(documentId));
  localTextbookList = await loadLocalTextbookDocuments();
  if (activeTextbook?.id === documentId) {
    activeTextbook = null;
    activeTextbookCacheEntry = null;
  }
  renderTextbookLibrary();
}


function createLocalTextbookManifest(document) {
  return {
    id: document.id,
    title: document.title || "本地 PDF 教材",
    subtitle: document.status === "ready" ? "本机缓存" : "正在转换",
    pageCount: document.pageCount || 1,
    pageWidth: document.pageWidth || 589,
    pageHeight: document.pageHeight || 807,
    pageImageUrlTemplate: `${LOCAL_PAGE_URL_PREFIX}${document.id}/image/{pageNumber}`,
    pageThumbUrlTemplate: `${LOCAL_PAGE_URL_PREFIX}${document.id}/thumb/{pageNumber}`,
    units: document.units || [],
    pageAudio: {},
    source: "local-upload",
    generatedPages: document.generatedPages || 0,
    textPages: document.textPages || 0,
    outlineStatus: document.outlineStatus || "pending",
    outlineError: document.outlineError || "",
    outlineDebugSummary: document.outlineDebugSummary || "",
    status: document.status || "processing",
  };
}


function createLocalTextbookListItem(document) {
  return {
    id: document.id,
    title: document.title || "本地 PDF 教材",
    subtitle: document.status === "ready" ? "本机 PDF 页图缓存" : "正在本机转换 PDF",
    pageCount: document.pageCount || 1,
    generatedPages: document.generatedPages || 0,
    status: document.status || "processing",
    source: "local-upload",
  };
}


function isLocalTextbookPageUrl(url) {
  return String(url || "").startsWith(LOCAL_PAGE_URL_PREFIX);
}


function parseLocalTextbookPageUrl(url) {
  const value = String(url || "").slice(LOCAL_PAGE_URL_PREFIX.length);
  const [documentId, kind, pageText] = value.split("/");
  return {
    documentId,
    kind,
    pageNumber: Number(pageText),
  };
}


async function getLocalTextbookPageObjectUrl(url) {
  const { documentId, kind, pageNumber } = parseLocalTextbookPageUrl(url);
  if (!documentId || !kind || !pageNumber) {
    return "";
  }

  const cacheKey = `${documentId}:${kind}:${pageNumber}`;
  if (localTextbookObjectUrls.has(cacheKey)) {
    return localTextbookObjectUrls.get(cacheKey);
  }

  let page = await getLocalTextbookPage(documentId, pageNumber, kind);
  if (!page && kind === "thumb") {
    page = await getLocalTextbookPage(documentId, pageNumber, "image");
  }
  if (!page && kind === "image") {
    await ensureLocalTextbookPageRendered(documentId, pageNumber);
    page = await getLocalTextbookPage(documentId, pageNumber, kind);
  }
  if (!page?.blob) {
    return "";
  }

  const objectUrl = URL.createObjectURL(page.blob);
  localTextbookObjectUrls.set(cacheKey, objectUrl);
  return objectUrl;
}


function revokeLocalTextbookObjectUrls(documentId = "") {
  for (const [key, url] of localTextbookObjectUrls.entries()) {
    if (!documentId || key.startsWith(`${documentId}:`)) {
      URL.revokeObjectURL(url);
      localTextbookObjectUrls.delete(key);
    }
  }
}


async function loadPdfJs() {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import(PDFJS_MODULE_URL).then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return pdfjs;
    });
  }
  return pdfJsModulePromise;
}


async function loadLocalPdfDocument(document) {
  if (!document.sourcePdfBlob) {
    throw new Error("本地 PDF 源文件不可用，请重新上传。");
  }

  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await document.sourcePdfBlob.arrayBuffer());
  return pdfjs.getDocument({ data }).promise;
}


async function extractPdfPageText(page) {
  const content = await page.getTextContent();
  return content.items
    .map((item) => String(item.str || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}


async function buildPdfOutlineUnits(pdfDocument) {
  const outline = await pdfDocument.getOutline();
  if (!outline?.length) {
    return [];
  }

  const entries = [];
  await collectPdfOutlineEntries(pdfDocument, outline, entries);
  const uniqueEntries = dedupeChapterEntries(entries)
    .sort((a, b) => a.page - b.page);

  if (uniqueEntries.length === 0) {
    return [];
  }

  return chapterEntriesToUnits(uniqueEntries, pdfDocument.numPages);
}


async function collectPdfOutlineEntries(pdfDocument, items, entries, parentTitle = "") {
  for (const item of items || []) {
    const page = await resolvePdfOutlinePage(pdfDocument, item.dest);
    const title = String(item.title || "").trim();
    if (page && title) {
      entries.push({
        title,
        page,
        level: parentTitle ? 2 : 1,
        parentTitle,
      });
    }
    if (item.items?.length) {
      await collectPdfOutlineEntries(pdfDocument, item.items, entries, title || parentTitle);
    }
  }
}


async function resolvePdfOutlinePage(pdfDocument, dest) {
  if (!dest) {
    return null;
  }

  const destination = typeof dest === "string" ? await pdfDocument.getDestination(dest) : dest;
  const ref = Array.isArray(destination) ? destination[0] : null;
  if (!ref) {
    return null;
  }

  try {
    const index = await pdfDocument.getPageIndex(ref);
    return index + 1;
  } catch (error) {
    return null;
  }
}


function dedupeChapterEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.page}:${entry.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}


function chapterEntriesToUnits(entries, totalPages) {
  const topLevelEntries = entries.filter((entry) => entry.level === 1);
  if (topLevelEntries.length >= 2) {
    return topLevelEntries.map((entry, index) => {
      const nextTop = topLevelEntries[index + 1];
      const childEntries = entries.filter((candidate) => (
        candidate.level > 1
        && candidate.page >= entry.page
        && (!nextTop || candidate.page < nextTop.page)
      ));
      return {
        unit: index + 1,
        title: entry.title,
        startPage: entry.page,
        endPage: (nextTop?.page || totalPages + 1) - 1,
        sections: childEntries.map((child, childIndex) => ({
          id: `local-section-${index + 1}-${childIndex + 1}`,
          title: child.title,
          page: child.page,
          startPage: child.page,
          endPage: (childEntries[childIndex + 1]?.page || nextTop?.page || totalPages + 1) - 1,
        })),
      };
    });
  }

  return entries.map((entry, index) => ({
    unit: index + 1,
    title: entry.title,
    startPage: entry.page,
    endPage: (entries[index + 1]?.page || totalPages + 1) - 1,
    sections: [],
  }));
}


async function buildPdfBlockTocResult(pdfDocument) {
  const pageResults = [];
  const maxPages = Math.min(pdfDocument.numPages, LOCAL_TEXTBOOK_TOC_SCAN_PAGES);

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const lines = await extractPdfPageTextLines(page);
    const entries = parseBlockTocEntries(lines, pdfDocument.numPages);
    const chapterCount = entries.filter((entry) => entry.type === "chapter").length;
    if (entries.length >= 3 && chapterCount >= 2) {
      pageResults.push({
        pageNumber,
        entries,
        chapterCount,
      });
    }
  }

  if (pageResults.length === 0) {
    return {
      units: [],
      status: "none",
      debugSummary: "未找到可解析的 block 目录页。",
    };
  }

  const bestResult = pageResults
    .sort((a, b) => (b.chapterCount - a.chapterCount) || (b.entries.length - a.entries.length))[0];
  const lastTocPage = Math.max(...pageResults.map((result) => result.pageNumber));
  const normalizedEntries = normalizeSequentialYonseiTocEntries(bestResult.entries);
  const mappedEntries = mapBlockTocEntriesToPdfPages(normalizedEntries, bestResult.pageNumber, lastTocPage, pdfDocument.numPages);

  return {
    units: chapterEntriesToUnits(mappedEntries, pdfDocument.numPages),
    status: "block-toc",
    debugSummary: `block 目录页：第 ${bestResult.pageNumber} 页，识别 ${mappedEntries.length} 个条目。`,
  };
}


async function extractPdfPageTextLines(page) {
  const content = await page.getTextContent();
  const rawItems = (content.items || [])
    .map((item) => {
      const text = String(item.str || "").replace(/\s+/g, " ").trim();
      const transform = item.transform || [];
      return {
        text,
        x: Number(transform[4]) || 0,
        y: Number(transform[5]) || 0,
        width: Number(item.width) || 0,
        height: Number(item.height) || Math.abs(Number(transform[3]) || 0) || 10,
      };
    })
    .filter((item) => item.text);

  const lines = [];
  const yTolerance = 5;
  for (const item of rawItems.sort((a, b) => b.y - a.y || a.x - b.x)) {
    let line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= yTolerance);
    if (!line) {
      line = {
        y: item.y,
        minX: item.x,
        maxX: item.x + item.width,
        items: [],
      };
      lines.push(line);
    }
    line.items.push(item);
    line.y = (line.y * (line.items.length - 1) + item.y) / line.items.length;
    line.minX = Math.min(line.minX, item.x);
    line.maxX = Math.max(line.maxX, item.x + item.width);
  }

  return lines
    .map((line) => {
      const sortedItems = line.items.sort((a, b) => a.x - b.x);
      const segments = [];
      let previousRight = null;
      for (const item of sortedItems) {
        const gap = previousRight === null ? 0 : item.x - previousRight;
        if (gap > 18) {
          segments.push(" ");
        }
        segments.push(item.text);
        previousRight = item.x + item.width;
      }
      const text = segments.join("").replace(/\s+/g, " ").trim();
      return {
        ...line,
        items: sortedItems,
        text,
      };
    })
    .filter((line) => line.text)
    .sort((a, b) => b.y - a.y || a.minX - b.minX);
}


function parseBlockTocEntries(lines, totalPages) {
  const entries = [];
  for (const line of lines) {
    const lineEntries = parseBlockTocLine(line, totalPages);
    entries.push(...lineEntries);
  }

  entries.push(...parseBlockTocEntriesByPageOrder(lines, totalPages));

  return dedupeTocEntriesByTitle(entries)
    .filter((entry) => entry.title && entry.printedPage > 0 && entry.printedPage <= totalPages + 80)
    .filter((entry) => !isProbablyGarbledText(entry.title))
    .sort((a, b) => a.printedPage - b.printedPage)
    .slice(0, 80);
}


function normalizeSequentialYonseiTocEntries(entries) {
  const chapterEntries = entries
    .map((entry) => ({
      ...entry,
      chapterNumber: extractChapterNumber(entry.title),
    }))
    .filter((entry) => entry.type === "chapter" && entry.chapterNumber > 0 && entry.chapterNumber <= 20);
  const maxChapterNumber = Math.max(...chapterEntries.map((entry) => entry.chapterNumber), 0);
  if (maxChapterNumber < 3) {
    return entries;
  }

  const printedPages = [...new Set(chapterEntries
    .map((entry) => entry.printedPage)
    .filter((page) => page > 0))]
    .sort((a, b) => a - b);
  if (printedPages[0] > 1) {
    printedPages.unshift(1);
  }
  if (printedPages.length < maxChapterNumber) {
    return entries;
  }

  const normalizedChapters = [];
  for (let chapterNumber = 1; chapterNumber <= maxChapterNumber; chapterNumber += 1) {
    const candidates = chapterEntries.filter((entry) => entry.chapterNumber === chapterNumber);
    if (!candidates.length) {
      continue;
    }
    const bestTitle = candidates
      .map((entry) => cleanSequentialTocTitle(entry.title))
      .sort((a, b) => b.length - a.length)[0];
    normalizedChapters.push({
      title: bestTitle,
      printedPage: printedPages[chapterNumber - 1],
      page: printedPages[chapterNumber - 1],
      level: 1,
      type: "chapter",
    });
  }

  const lastChapterPrintedPage = printedPages[maxChapterNumber - 1] || 0;
  const normalizedAppendices = Object.values(entries
    .filter((entry) => entry.type !== "chapter" && entry.printedPage > lastChapterPrintedPage)
    .reduce((acc, entry) => {
      const title = cleanSequentialTocTitle(entry.title);
      if (!title) {
        return acc;
      }
      const key = normalizeSearchText(title);
      if (!acc[key] || entry.printedPage < acc[key].printedPage) {
        acc[key] = {
          ...entry,
          title,
          level: 1,
        };
      }
      return acc;
    }, {}))
    .sort((a, b) => a.printedPage - b.printedPage);

  return [...normalizedChapters, ...normalizedAppendices];
}


function cleanSequentialTocTitle(title) {
  return String(title || "")
    .replace(/[‘’“”"']/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*$/g, "")
    .trim();
}


function parseBlockTocLine(line, totalPages) {
  const normalizedLine = normalizeTocLineNoise(line.text);
  const titleMatch = normalizedLine.match(/(?:제|저)\s*\d{1,2}\s*과\s*[-_＿]?\s*[^0-9]{1,60}|第\s*\d{1,2}\s*(?:课|課|果|i果)\s*[-_＿]?\s*[^0-9]{1,60}/i);
  const appendixMatch = normalizedLine.match(/(?:듣기\s*지문|문화\s*번역|참고\s*답안|색인|听力\s*原文|聽力\s*原文|文化\s*译文|文化\s*譯文|参考\s*答案|參考\s*答案|索引)[^0-9]{0,24}/i);
  const rawTitle = titleMatch?.[0] || appendixMatch?.[0] || "";
  if (!rawTitle) {
    return [];
  }

  const printedPage = extractPrintedPageFromTocLine(line, rawTitle);
  if (!printedPage || printedPage > totalPages + 80) {
    return [];
  }

  const cleanedTitle = normalizeYonseiTocTitle(rawTitle);
  if (!cleanedTitle) {
    return [];
  }

  return [{
    title: cleanedTitle,
    page: Math.min(Math.max(printedPage, 1), totalPages),
    printedPage,
    level: getTocEntryLevel(cleanedTitle),
    type: appendixMatch ? "appendix" : "chapter",
  }];
}


function parseBlockTocEntriesByPageOrder(lines, totalPages) {
  const orderedLines = lines
    .filter((line) => isLikelyTocContentLine(line.text))
    .sort((a, b) => b.y - a.y || a.minX - b.minX);
  const titleEntries = orderedLines
    .map((line) => {
      const normalizedLine = normalizeTocLineNoise(line.text);
      const titleMatch = normalizedLine.match(/(?:제|저)\s*\d{1,2}\s*과\s*[-_＿]?\s*[^0-9]{1,60}|第\s*\d{1,2}\s*(?:课|課|果|i果)\s*[-_＿]?\s*[^0-9]{1,60}/i);
      const appendixMatch = normalizedLine.match(/(?:듣기\s*지문|문화\s*번역|참고\s*답안|색인|听力\s*原文|聽力\s*原文|文化\s*译文|文化\s*譯文|参考\s*答案|參考\s*答案|索引)[^0-9]{0,24}/i);
      const rawTitle = titleMatch?.[0] || appendixMatch?.[0] || "";
      const title = normalizeYonseiTocTitle(rawTitle);
      return title
        ? {
            title,
            line,
            type: appendixMatch ? "appendix" : "chapter",
          }
        : null;
    })
    .filter(Boolean);
  const printedPages = orderedLines
    .map((line) => extractTocPrintedPageCandidate(line))
    .filter((value) => value > 0 && value <= totalPages + 80);

  const likelyPrintedPages = printedPages
    .filter((value, index, all) => all.indexOf(value) === index)
    .filter((value, index, all) => (
      index === 0 || value > all[index - 1]
    ));
  const firstChapterNumber = extractChapterNumber(titleEntries.find((entry) => entry.type === "chapter")?.title || "");
  if (firstChapterNumber === 1 && likelyPrintedPages[0] > 1) {
    likelyPrintedPages.unshift(1);
  }

  if (titleEntries.length < 3 || likelyPrintedPages.length < 3) {
    return [];
  }

  const chapterNumbers = titleEntries
    .filter((entry) => entry.type === "chapter")
    .map((entry) => extractChapterNumber(entry.title))
    .filter(Boolean);
  const hasSequentialChapters = chapterNumbers.length >= 3
    && chapterNumbers.some((number, index, all) => index > 0 && number === all[index - 1] + 1);
  if (!hasSequentialChapters) {
    return [];
  }

  return titleEntries
    .map((entry, index) => {
      const printedPage = likelyPrintedPages[index];
      if (!printedPage) {
        return null;
      }
      return {
        title: entry.title,
        printedPage,
        page: printedPage,
        level: getTocEntryLevel(entry.title),
        type: entry.type,
      };
    })
    .filter(Boolean);
}


function extractTocPrintedPageCandidate(line) {
  const normalizedLine = normalizeTocLineNoise(line.text);
  const titleMatch = normalizedLine.match(/(?:제|저)\s*\d{1,2}\s*과\s*[-_＿]?\s*[^0-9]{1,60}|第\s*\d{1,2}\s*(?:课|課|果|i果)\s*[-_＿]?\s*[^0-9]{1,60}|(?:듣기\s*지문|문화\s*번역|참고\s*답안|색인|听力\s*原文|聽力\s*原文|文化\s*译文|文化\s*譯文|参考\s*答案|參考\s*答案|索引)[^0-9]{0,24}/i);
  const rawTitle = titleMatch?.[0] || "";
  if (!rawTitle) {
    return 0;
  }
  return extractPrintedPageFromTocLine(line, rawTitle);
}


function isLikelyTocContentLine(text) {
  const value = normalizeTocLineNoise(text);
  return /(?:제|저)\s*\d{1,2}\s*과|第\s*\d{1,2}\s*(?:课|課|果|i果)|듣기\s*지문|문화\s*번역|참고\s*답안|색인|听力\s*原文|聽力\s*原文|参考\s*答案|參考\s*答案|索引/i.test(value);
}


function extractChapterNumber(title) {
  const match = normalizeTocLineNoise(title).match(/(?:제|第)\s*(\d{1,2})\s*(?:과|课|課)/i);
  return match ? Number(match[1]) : 0;
}


function dedupeTocEntriesByTitle(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.title}:${entry.printedPage}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}


function extractPrintedPageFromTocLine(line, rawTitle) {
  const rightSideText = line.items
    .filter((item) => item.x > line.minX + 180)
    .sort((a, b) => a.x - b.x)
    .map((item) => String(item.text || ""))
    .join("");
  const rightSideNumber = (rightSideText.match(/\d{1,3}/g) || [])
    .map(Number)
    .filter((value) => value > 0)
    .pop();
  if (rightSideNumber) {
    return rightSideNumber;
  }

  const normalizedLine = normalizeTocLineNoise(line.text);
  const titleIndex = normalizedLine.indexOf(rawTitle);
  const afterTitle = titleIndex >= 0 ? normalizedLine.slice(titleIndex + rawTitle.length) : "";
  const trailingNumbers = afterTitle.match(/\d{1,3}/g) || [];
  return Number(trailingNumbers.at(-1)) || 0;
}


function normalizeTocLineNoise(value) {
  return String(value || "")
    .replace(/[＿_]+/g, "_")
    .replace(/[–—－]+/g, "-")
    .replace(/第\s*([1-9])\s*[iI!l|]?\s*果/g, "第$1课")
    .replace(/第\s*([sS])\s*[iI!l|]?\s*果/g, "第5课")
    .replace(/저\s*1([1-9])\s*과/g, "제$1과")
    .replace(/저\s*110\s*과/g, "제10과")
    .replace(/저\s*10\s*과/g, "제10과")
    .replace(/저\s*(\d{1,2})\s*과/g, "제$1과")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeYonseiTocTitle(title) {
  return normalizeTocLineNoise(title)
    .replace(/^(제\s*\d{1,2}\s*과)\s*[-_＿]?\s*/i, (_, label) => `${label.replace(/\s+/g, "")}_ `)
    .replace(/^(第\s*\d{1,2}\s*[课課])\s*[-_＿]?\s*/i, (_, label) => `${label.replace(/\s+/g, "")}_ `)
    .replace(/\.{2,}|…+|-{2,}/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+\d{1,3}$/g, "")
    .replace(/[_＿]\s*$/g, "")
    .trim()
    .slice(0, 90);
}


function mapBlockTocEntriesToPdfPages(entries, tocPageNumber, lastTocPage, totalPages) {
  const firstPrintedPage = entries.find((entry) => entry.type === "chapter")?.printedPage || entries[0]?.printedPage || 1;
  const fallbackOffset = Math.max(lastTocPage + 1 - firstPrintedPage, 0);
  return entries.map((entry) => ({
    ...entry,
    page: Math.min(Math.max(entry.printedPage + fallbackOffset, 1), totalPages),
    confidence: "block-toc",
  }));
}


async function buildPdfTocResult(pdfDocument, documentId) {
  const tocPages = await findPdfTocPages(pdfDocument, documentId);
  if (tocPages.length && !tocPages.every((page) => isProbablyGarbledText(page.text))) {
    const entries = dedupeChapterEntries(parseTocEntries(tocPages, pdfDocument.numPages));
    if (entries.length) {
      const adjustedEntries = await calibrateTocEntries(pdfDocument, documentId, entries);
      return {
        units: chapterEntriesToUnits(adjustedEntries, pdfDocument.numPages),
        status: "toc",
      };
    }
  }

  return { units: [], status: "none" };
}


async function buildVisualPdfTocResult(pdfDocument, documentId) {
  const candidates = await findVisualTocCandidatePages(pdfDocument, documentId);
  const candidatePages = [...candidates.strong, ...candidates.weak];
  const hadStrongCandidate = candidates.strong.length > 0;

  for (const pageNumber of candidatePages) {
    const image = await renderPdfPageDataUrl(pdfDocument, pageNumber, LOCAL_TEXTBOOK_TOC_IMAGE_WIDTH, 0.68);
    if (!image) {
      continue;
    }
    const entries = await requestVisualTocEntries(image, pageNumber, pdfDocument.numPages);
    if (entries.length < 3) {
      continue;
    }
    const mappedEntries = await mapVisualTocEntriesToPdfPages(pdfDocument, documentId, entries, pageNumber);
    if (mappedEntries.length) {
      return {
        units: chapterEntriesToUnits(mappedEntries, pdfDocument.numPages),
        hadStrongCandidate,
      };
    }
  }
  return { units: [], hadStrongCandidate };
}


async function findVisualTocCandidatePages(pdfDocument, documentId) {
  const maxPages = Math.min(pdfDocument.numPages, LOCAL_TEXTBOOK_TOC_SCAN_PAGES);
  const strongCandidates = [];
  const weakCandidates = [];

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const text = await getOrExtractLocalPageText(pdfDocument, documentId, pageNumber);
    if (isLikelyVisualTocText(text)) {
      strongCandidates.push(pageNumber);
    } else if (pageNumber >= 3 && (isProbablyGarbledText(text) || text.length < 80)) {
      weakCandidates.push(pageNumber);
    } else if (pageNumber >= 8 && pageNumber <= 20) {
      weakCandidates.push(pageNumber);
    }
  }

  return {
    strong: [...new Set(strongCandidates)].slice(0, 8),
    weak: [...new Set(weakCandidates)].slice(0, 10),
  };
}


function isLikelyVisualTocText(text) {
  const value = String(text || "");
  return /(目录|目錄|contents|table of contents|차례|목차|머리말|일러두기|내용\s*구성|나오는\s*사람|듣기\s*지문|참고\s*답안|색인)/i.test(value);
}


function isProbablyGarbledText(text) {
  const value = String(text || "").trim();
  if (!value) {
    return false;
  }
  const compact = value.replace(/\s+/g, "");
  if (compact.length < 20) {
    return false;
  }
  const readable = compact.match(/[\p{Script=Hangul}\p{Script=Han}A-Za-z0-9]/gu) || [];
  const symbols = compact.match(/[^\p{Script=Hangul}\p{Script=Han}A-Za-z0-9]/gu) || [];
  const oddRuns = compact.match(/[~@#$%^&*_=+|\\/<>{}\[\]`]{2,}/g) || [];
  return readable.length / compact.length < 0.55 || symbols.length / compact.length > 0.45 || oddRuns.length >= 2;
}


async function renderPdfPageDataUrl(pdfDocument, pageNumber, targetWidth, quality = 0.7) {
  const page = await pdfDocument.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch (error) {
    return "";
  }
}


async function requestVisualTocEntries(image, pageNumber, pageCount) {
  try {
    const response = await fetch("/api/pdf-assistant/extract-toc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, pageNumber, pageCount }),
    });
    const result = await response.json();
    if (!response.ok) {
      console.warn("视觉目录识别失败。", result.error || response.statusText);
      return [];
    }
    return normalizeVisualTocEntries(result.entries || []);
  } catch (error) {
    console.warn("视觉目录识别请求失败。", error);
    return [];
  }
}


function normalizeVisualTocEntries(entries) {
  return entries
    .map((entry) => ({
      title: cleanTocDisplayTitle(entry.title),
      printedPage: Number(entry.printedPage),
      type: String(entry.type || "chapter").toLowerCase(),
    }))
    .filter((entry) => entry.title && entry.printedPage > 0 && !isProbablyGarbledText(entry.title))
    .slice(0, 80);
}


function cleanTocDisplayTitle(title) {
  return String(title || "")
    .replace(/\.{2,}|…+|-{2,}/g, " ")
    .replace(/\s*[_＿]\s*/g, "_ ")
    .replace(/^(제\s*\d+\s*과)\s+/i, "$1_ ")
    .replace(/^(第\s*\d+\s*[课課])\s+/i, "$1_ ")
    .replace(/\s+/g, " ")
    .replace(/\s+\d{1,3}$/g, "")
    .replace(/[_＿]\s*$/g, "")
    .trim()
    .slice(0, 90);
}


async function mapVisualTocEntriesToPdfPages(pdfDocument, documentId, entries, tocPageNumber) {
  const pageLabelMap = await getPdfPageLabelMap(pdfDocument);
  let mapped = mapEntriesByPageLabels(entries, pageLabelMap);
  if (mapped.length >= Math.min(entries.length, 3)) {
    return mapped;
  }

  mapped = await calibrateTocEntries(pdfDocument, documentId, entries.map((entry) => ({
    title: entry.title,
    printedPage: entry.printedPage,
    page: entry.printedPage,
    level: getVisualTocEntryLevel(entry),
    type: entry.type,
  })));
  const calibratedCount = mapped.filter((entry) => entry.confidence === "calibrated").length;
  if (calibratedCount >= 2) {
    return mapped;
  }

  const firstPrintedPage = entries.find((entry) => entry.type === "chapter")?.printedPage || entries[0]?.printedPage || 1;
  const fallbackOffset = Math.max(tocPageNumber + 3 - firstPrintedPage, 0);
  return entries
    .map((entry) => ({
      title: entry.title,
      printedPage: entry.printedPage,
      page: Math.min(Math.max(entry.printedPage + fallbackOffset, 1), pdfDocument.numPages),
      level: getVisualTocEntryLevel(entry),
      confidence: "visual-low",
    }))
    .sort((a, b) => a.page - b.page);
}


async function getPdfPageLabelMap(pdfDocument) {
  if (typeof pdfDocument.getPageLabels !== "function") {
    return new Map();
  }
  try {
    const labels = await pdfDocument.getPageLabels();
    const map = new Map();
    (labels || []).forEach((label, index) => {
      const normalized = String(label || "").trim();
      if (/^\d+$/.test(normalized) && !map.has(Number(normalized))) {
        map.set(Number(normalized), index + 1);
      }
    });
    return map;
  } catch (error) {
    return new Map();
  }
}


function mapEntriesByPageLabels(entries, pageLabelMap) {
  return entries
    .filter((entry) => pageLabelMap.has(entry.printedPage))
    .map((entry) => ({
      title: entry.title,
      printedPage: entry.printedPage,
      page: pageLabelMap.get(entry.printedPage),
      level: getVisualTocEntryLevel(entry),
      confidence: "label",
    }))
    .sort((a, b) => a.page - b.page);
}


function getVisualTocEntryLevel(entry) {
  if (entry.type === "chapter" || /^(第\s*\d+\s*[课課章]|Chapter\s+\d+|Unit\s+\d+|제\s*\d+\s*과|\d+\s*과)\b/i.test(entry.title)) {
    return 1;
  }
  if (entry.type === "section") {
    return 2;
  }
  return 1;
}


async function findPdfTocPages(pdfDocument, documentId) {
  const maxPages = Math.min(pdfDocument.numPages, LOCAL_TEXTBOOK_TOC_SCAN_PAGES);
  const tocStartPages = [];

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const text = await getOrExtractLocalPageText(pdfDocument, documentId, pageNumber);
    if (isLikelyTocPage(text)) {
      tocStartPages.push(pageNumber);
    }
  }

  if (!tocStartPages.length) {
    return [];
  }

  const firstTocPage = tocStartPages[0];
  const lastTocPage = Math.min(pdfDocument.numPages, firstTocPage + LOCAL_TEXTBOOK_TOC_PARSE_PAGES - 1);
  const tocPages = [];
  for (let pageNumber = firstTocPage; pageNumber <= lastTocPage; pageNumber += 1) {
    const text = await getOrExtractLocalPageText(pdfDocument, documentId, pageNumber);
    tocPages.push({ pageNumber, text });
  }
  return tocPages;
}


async function getOrExtractLocalPageText(pdfDocument, documentId, pageNumber) {
  const pageText = await getLocalTextbookPageText(documentId, pageNumber);
  if (pageText?.text) {
    return pageText.text;
  }

  const page = await pdfDocument.getPage(pageNumber);
  const text = await extractPdfPageText(page);
  await saveLocalTextbookPageText(documentId, pageNumber, text);
  return text;
}


function isLikelyTocPage(text) {
  const value = String(text || "").trim();
  if (!value) {
    return false;
  }

  if (/(目录|目錄|contents|table of contents|차례|목차)/i.test(value.slice(0, 1200))) {
    return true;
  }

  const matches = value.match(/(?:\.{2,}|…{1,}|-{2,}|\s{2,})\s*\d{1,3}(?=\s|$)/g) || [];
  return matches.length >= 4;
}


function parseTocEntries(tocPages, totalPages) {
  const entries = [];
  for (const tocPage of tocPages) {
    const lines = splitTocTextIntoLines(tocPage.text);
    for (const line of lines) {
      const entry = parseTocLine(line, totalPages);
      if (entry) {
        entries.push(entry);
      }
    }
  }

  return entries
    .filter((entry, index, all) => (
      all.findIndex((candidate) => candidate.title === entry.title && candidate.printedPage === entry.printedPage) === index
    ))
    .filter((entry) => !isProbablyGarbledText(entry.title))
    .slice(0, 80);
}


function splitTocTextIntoLines(text) {
  return String(text || "")
    .replace(/([。!?])\s+/g, "$1\n")
    .replace(/(\d{1,3})\s+(?=(?:第\s*\d+\s*[课課章單单]|Chapter\s+\d+|Unit\s+\d+|Lesson\s+\d+|\d+\s*과))/gi, "$1\n")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}


function parseTocLine(line, totalPages) {
  const cleaned = String(line || "")
    .replace(/^(目录|目錄|contents|table of contents|차례|목차)\s*[:：-]?\s*/i, "")
    .trim();
  if (cleaned.length < 4) {
    return null;
  }

  const match = cleaned.match(/^(.*?)\s*(?:\.{2,}|…{1,}|-{2,}|\s{2,}|\s)\s*(\d{1,3})\s*$/);
  if (!match) {
    return null;
  }

  const title = normalizeTocTitle(match[1]);
  const printedPage = Number(match[2]);
  if (!title || !printedPage || printedPage > totalPages + 30) {
    return null;
  }

  return {
    title,
    page: Math.min(Math.max(printedPage, 1), totalPages),
    printedPage,
    level: getTocEntryLevel(title),
  };
}


function normalizeTocTitle(title) {
  return String(title || "")
    .replace(/[·•●◦▪▫]+\s*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}


function getTocEntryLevel(title) {
  if (/^(第\s*\d+\s*[课課章]|Chapter\s+\d+|Unit\s+\d+|제\s*\d+\s*과|\d+\s*과)\b/i.test(title)) {
    return 1;
  }
  if (/^\d+(?:[.-]\d+)*\s+/.test(title)) {
    return 1;
  }
  return 2;
}


async function calibrateTocEntries(pdfDocument, documentId, entries) {
  const offsets = [];
  const sampleEntries = entries.slice(0, 12);
  const maxSearchPage = Math.min(pdfDocument.numPages, LOCAL_TEXTBOOK_TEXT_SCAN_PAGES);

  for (const entry of sampleEntries) {
    const titleKey = normalizeSearchText(entry.title);
    if (titleKey.length < 3) {
      continue;
    }
    const searchStart = Math.max(1, entry.printedPage - 8);
    const searchEnd = Math.min(maxSearchPage, entry.printedPage + 18);
    for (let pageNumber = searchStart; pageNumber <= searchEnd; pageNumber += 1) {
      const text = await getOrExtractLocalPageText(pdfDocument, documentId, pageNumber);
      if (normalizeSearchText(text).includes(titleKey)) {
        offsets.push(pageNumber - entry.printedPage);
        break;
      }
    }
  }

  const offset = offsets.length >= 2 ? medianNumber(offsets) : 0;
  return entries
    .map((entry) => ({
      ...entry,
      page: Math.min(Math.max(entry.printedPage + offset, 1), pdfDocument.numPages),
      confidence: offsets.length >= 2 ? "calibrated" : "toc",
    }))
    .sort((a, b) => a.page - b.page);
}


function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}


function medianNumber(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] || 0;
}


function detectTitleFromPageText(text) {
  const normalizedText = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalizedText) {
    return "";
  }

  const lines = normalizedText
    .split(/(?=第\s*\d+\s*[课章單单])|(?=Chapter\s+\d+)|(?=Unit\s+\d+)|(?=Lesson\s+\d+)/i)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = [
    /第\s*\d+\s*[课課章單单][^。.!?]{0,40}/,
    /(?:Chapter|Unit|Lesson)\s+\d+[^。.!?]{0,50}/i,
    /\d+\s*[과과][^。.!?]{0,40}/,
  ];

  for (const line of lines.slice(0, 8)) {
    for (const pattern of candidates) {
      const match = line.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
  }

  return "";
}


async function buildScannedTitleUnits(pdfDocument, documentId) {
  const entries = [];
  const maxPages = Math.min(pdfDocument.numPages, LOCAL_TEXTBOOK_TEXT_SCAN_PAGES);
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    const text = await getOrExtractLocalPageText(pdfDocument, documentId, pageNumber);
    const title = detectTitleFromPageText(text);
    if (title && !isProbablyGarbledText(title)) {
      entries.push({ title, page: pageNumber, level: 1 });
    }
  }

  const uniqueEntries = dedupeChapterEntries(entries);
  return uniqueEntries.length >= 3 ? chapterEntriesToUnits(uniqueEntries, pdfDocument.numPages) : [];
}


async function initializeLocalPdfOutline(job) {
  if (job.outlineInitialized) {
    return job.document.units || [];
  }

  job.outlineInitialized = true;
  let units = [];
  let outlineStatus = "none";
  let outlineError = "";
  let outlineDebugSummary = "";
  try {
    units = await buildPdfOutlineUnits(job.pdfDocument);
    outlineStatus = units.length ? "outline" : "none";
    if (units.length === 0) {
      const blockTocResult = await buildPdfBlockTocResult(job.pdfDocument);
      units = blockTocResult.units;
      outlineStatus = blockTocResult.status;
      outlineDebugSummary = blockTocResult.debugSummary || "";
    }
    if (units.length === 0) {
      const tocResult = await buildPdfTocResult(job.pdfDocument, job.document.id);
      units = tocResult.units;
      outlineStatus = tocResult.status;
    }
    if (units.length === 0) {
      units = await buildScannedTitleUnits(job.pdfDocument, job.document.id);
      outlineStatus = units.length ? "scanned" : "none";
    }
    if (units.length === 0) {
      const visualResult = await buildVisualPdfTocResult(job.pdfDocument, job.document.id);
      units = visualResult.units;
      outlineStatus = units.length ? "visual" : "none";
    }
    if (!outlineDebugSummary) {
      outlineDebugSummary = units.length
        ? `目录识别成功：${outlineStatus}，${units.length} 个入口。`
        : "未识别到可用目录。";
    }
  } catch (error) {
    console.warn("目录识别失败。", error);
    units = [];
    outlineStatus = "failed";
    outlineError = error?.message || "目录识别过程中出现未知错误。";
    outlineDebugSummary = outlineError;
  }

  job.document = {
    ...job.document,
    units,
    outlineStatus,
    outlineError,
    outlineDebugSummary,
    updatedAt: Date.now(),
  };
  await saveLocalTextbookDocument(job.document);

  if (activeTextbook?.id === job.document.id) {
    activeTextbook = {
      ...activeTextbook,
      units,
      outlineStatus,
      outlineError,
      outlineDebugSummary,
    };
    renderChapterMenu();
  }

  return units;
}


async function renderPdfPageBlob(pdfDocument, pageNumber, targetWidth, quality) {
  const page = await pdfDocument.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;

  const blob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/webp", quality);
  });
  if (blob) {
    return { blob, width: viewport.width, height: viewport.height };
  }

  const fallbackBlob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
  });
  return { blob: fallbackBlob, width: viewport.width, height: viewport.height };
}


async function renderAndStoreLocalPdfPage(job, pageNumber) {
  if (job.renderedPages.has(pageNumber) || job.renderingPages.has(pageNumber)) {
    return;
  }

  job.renderingPages.add(pageNumber);
  try {
    const page = await job.pdfDocument.getPage(pageNumber);
    const text = await extractPdfPageText(page);
    await saveLocalTextbookPageText(job.document.id, pageNumber, text);

    const thumb = await renderPdfPageBlob(job.pdfDocument, pageNumber, LOCAL_TEXTBOOK_THUMB_WIDTH, 0.62);
    const image = await renderPdfPageBlob(job.pdfDocument, pageNumber, LOCAL_TEXTBOOK_IMAGE_WIDTH, 0.8);
    await saveLocalTextbookPage(job.document.id, pageNumber, "thumb", thumb.blob);
    await saveLocalTextbookPage(job.document.id, pageNumber, "image", image.blob);
    job.renderedPages.add(pageNumber);

    const generatedPages = Math.max(job.document.generatedPages || 0, job.renderedPages.size);
    const textPages = Math.max(job.document.textPages || 0, job.renderedPages.size);
    job.document = {
      ...job.document,
      generatedPages,
      textPages,
      status: generatedPages >= job.document.pageCount ? "ready" : "processing",
      updatedAt: Date.now(),
    };
    await saveLocalTextbookDocument(job.document);

    if (activeTextbook?.id === job.document.id) {
      activeTextbook = {
        ...activeTextbook,
        status: job.document.status,
        generatedPages: job.document.generatedPages,
        textPages: job.document.textPages,
      };
      activeTextbookLoadStatus = "ready";
      syncTextbookControls();
      renderPdfAssistantPanel();
      if (activeTextbookPage === pageNumber) {
        showTextbookPagePreview(pageNumber);
      }
    }
  } finally {
    job.renderingPages.delete(pageNumber);
  }
}


async function createLocalTextbookJob(document) {
  const existingJob = localTextbookJobs.get(document.id);
  if (existingJob) {
    return existingJob;
  }

  const pdfDocument = await loadLocalPdfDocument(document);
  const job = {
    id: document.id,
    document,
    pdfDocument,
    renderedPages: new Set(),
    renderingPages: new Set(),
    runId: ++localTextbookJobVersion,
  };
  localTextbookJobs.set(document.id, job);
  return job;
}


async function ensureLocalTextbookPageRendered(documentId, pageNumber) {
  const document = await getLocalTextbookDocument(documentId);
  if (!document) {
    return;
  }

  const existingPage = await getLocalTextbookPage(documentId, pageNumber, "image");
  const existingText = await getLocalTextbookPageText(documentId, pageNumber);
  if (existingPage?.blob && existingText) {
    return;
  }

  const job = await createLocalTextbookJob(document);
  await renderAndStoreLocalPdfPage(job, Number(pageNumber));
}


async function processLocalPdfDocument(document) {
  const job = await createLocalTextbookJob(document);
  await initializeLocalPdfOutline(job);
  for (let pageNumber = 1; pageNumber <= job.document.pageCount; pageNumber += 1) {
    if (!localTextbookJobs.has(job.document.id) || localTextbookJobs.get(job.document.id)?.runId !== job.runId) {
      return;
    }
    await renderAndStoreLocalPdfPage(job, pageNumber);
  }
}


async function handleLocalPdfUpload(file) {
  if (!file) {
    return;
  }

  if (!("indexedDB" in window)) {
    alert("当前浏览器不支持本机教材缓存。");
    return;
  }

  if (file.type && file.type !== "application/pdf") {
    alert("请选择 PDF 文件。");
    return;
  }

  if (file.size > LOCAL_TEXTBOOK_MAX_FILE_SIZE) {
    alert("PDF 文件不能超过 300MB。");
    return;
  }

  const now = Date.now();
  const documentRecord = {
    id: `local-${now}-${Math.random().toString(36).slice(2, 10)}`,
    title: file.name.replace(/\.pdf$/i, "") || "本地 PDF 教材",
    fileName: file.name,
    pageCount: 1,
    generatedPages: 0,
    status: "processing",
    source: "local-upload",
    sourcePdfBlob: file,
    createdAt: now,
    updatedAt: now,
  };

  await saveLocalTextbookDocument(documentRecord);
  localTextbookList = await loadLocalTextbookDocuments();
  renderTextbookLibrary();
  openLocalTextbook(documentRecord.id);

  try {
    const pdfDocument = await loadLocalPdfDocument(documentRecord);
    if (pdfDocument.numPages > LOCAL_TEXTBOOK_MAX_PAGES) {
      throw new Error(`PDF 页数不能超过 ${LOCAL_TEXTBOOK_MAX_PAGES} 页。`);
    }

    const firstPage = await pdfDocument.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1 });
    const updatedDocument = {
      ...documentRecord,
      pageCount: pdfDocument.numPages,
      pageWidth: viewport.width,
      pageHeight: viewport.height,
      updatedAt: Date.now(),
    };
    await saveLocalTextbookDocument(updatedDocument);
    const job = {
      id: updatedDocument.id,
      document: updatedDocument,
      pdfDocument,
      renderedPages: new Set(),
      renderingPages: new Set(),
      runId: ++localTextbookJobVersion,
    };
    localTextbookJobs.set(updatedDocument.id, job);
    await initializeLocalPdfOutline(job);

    if (activeTextbook?.id === updatedDocument.id) {
      activeTextbook = createLocalTextbookManifest(job.document);
      activeTextbookLoadStatus = "ready";
      document.querySelector("#materialPageInput").max = getTextbookPageTotal();
      applyTextbookStageAspectRatio();
      renderChapterMenu();
      renderTextbookPage(activeTextbookPage);
    }

    processLocalPdfDocument(updatedDocument).catch((error) => {
      markLocalTextbookFailed(updatedDocument.id, error.message || "PDF 转换失败。");
    });
  } catch (error) {
    await markLocalTextbookFailed(documentRecord.id, error.message || "PDF 转换失败。");
  }
}


async function markLocalTextbookFailed(documentId, message) {
  const document = await getLocalTextbookDocument(documentId);
  if (!document) {
    return;
  }

  const failedDocument = {
    ...document,
    status: "failed",
    errorMessage: message,
    updatedAt: Date.now(),
  };
  await saveLocalTextbookDocument(failedDocument);
  if (activeTextbook?.id === documentId) {
    activeTextbook = createLocalTextbookManifest(failedDocument);
    activeTextbookLoadStatus = "failed";
    showTextbookPageSkeleton(activeTextbookPage, message || "PDF 转换失败。");
    renderChapterMenu("failed");
    renderPdfAssistantPanel();
  }
  renderTextbookLibrary();
}


async function loadAppConfig() {
  if (appConfig.loaded) {
    return;
  }

  const response = await fetch("/api/config");
  if (response.ok) {
    const result = await response.json();
    appConfig.assetBaseUrl = normalizeAssetBaseUrl(result.assetBaseUrl || "");
  }

  appConfig.loaded = true;
}


function normalizeAssetBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}


function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(String(url || ""));
}


function resolveTextbookAssetUrl(url) {
  if (!url || isAbsoluteUrl(url) || !appConfig.assetBaseUrl) {
    return url || "";
  }

  if (url.startsWith(STATIC_PREFIX)) {
    return `${appConfig.assetBaseUrl}/${url.slice(STATIC_PREFIX.length)}`;
  }

  return url;
}


function resolveTextbookAssetUrls(value) {
  if (Array.isArray(value)) {
    return value.map(resolveTextbookAssetUrls);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    key === "url" || key === "pageImageUrlTemplate" || key === "pageThumbUrlTemplate"
      ? resolveTextbookAssetUrl(entry)
      : resolveTextbookAssetUrls(entry),
  ]));
}


function getSortedLocalTextbookList() {
  if (!localTextbookOrder.length) return localTextbookList;
  const orderMap = new Map(localTextbookOrder.map((id, i) => [id, i]));
  return [...localTextbookList].sort((a, b) => {
    const ia = orderMap.has(a.id) ? orderMap.get(a.id) : 9999;
    const ib = orderMap.has(b.id) ? orderMap.get(b.id) : 9999;
    return ia - ib;
  });
}

function saveLocalTextbookOrder() {
  const sorted = getSortedLocalTextbookList();
  localTextbookOrder = sorted.map((b) => b.id);
  localStorage.setItem("localTextbookOrder", JSON.stringify(localTextbookOrder));
}


function resetTextbookReaderToLibrary() {
  stopPlaybackQueue();
  activeTextbookRenderRunId += 1;
  activeTextbookImageRunId += 1;
  activeTextbookLoadRunId += 1;
  activeTextbook = null;
  activeTextbookCacheEntry = null;
  activeTextbookLoadStatus = "idle";
  pdfAssistantMessages = [];
  pdfAssistantHistory = [];
  pdfAssistantExpanded = false;
  closeChapterMenu();
  document.querySelector("#materials")?.classList.remove("reader-open");
  document.querySelector("#textbookReader")?.classList.remove("is-focus-mode", "is-assistant-expanded");
  const focusExitButton = document.querySelector("#readerFocusExitButton");
  if (focusExitButton) {
    focusExitButton.hidden = true;
  }
  renderTextbookLibrary();
}


function renderTextbookLibrary() {
  const library = document.querySelector("#textbookLibrary");
  const reader = document.querySelector("#textbookReader");
  document.querySelector("#materials").classList.remove("reader-open");
  reader.classList.remove("is-assistant-expanded");
  reader.hidden = true;
  library.hidden = false;

  const sortedLocal = getSortedLocalTextbookList();
  const selCount = textbookSelectedIds.size;

  library.innerHTML = `
    <div class="textbook-library-actions">
      <button id="localPdfUploadButton" class="secondary-action" type="button">上传 PDF</button>
      <input id="localPdfUploadInput" type="file" accept="application/pdf" hidden>
      <button id="textbookBatchToggle" class="textbook-batch-toggle" type="button">${textbookBatchMode ? "完成" : "批量管理"}</button>
    </div>
    ${textbookBatchMode ? `
      <div class="textbook-batch-bar">
        <span class="textbook-batch-bar-count">
          ${selCount > 0 ? `已选 <strong>${selCount}</strong> 项` : "点击卡片选择，拖动卡片排序"}
        </span>
        <button class="textbook-batch-delete" type="button" id="textbookBatchDelete" ${selCount === 0 ? "disabled" : ""}>删除所选</button>
      </div>
    ` : ""}
    ${sortedLocal.length === 0 && textbookList.length === 0 ? `
      <p class="textbook-empty-state">还没有本地教材。上传 PDF 后会在这里出现。</p>
    ` : ""}
    <div class="textbook-grid" id="textbookGrid">
      ${sortedLocal.map((book) => {
        const sel = textbookSelectedIds.has(book.id);
        return `
          <article class="textbook-card local-textbook-card${textbookBatchMode ? " is-selectable" : ""}${sel ? " is-selected" : ""}"
            data-local-document="${escapeHtml(book.id)}"
            ${textbookBatchMode ? `draggable="true" data-drag-id="${escapeHtml(book.id)}"` : ""}>
            <button type="button" ${textbookBatchMode ? 'tabindex="-1"' : ""} data-open-local="${escapeHtml(book.id)}" style="pointer-events:${textbookBatchMode ? "none" : "auto"}">
              <strong>${escapeHtml(book.title)}</strong>
              <span>${escapeHtml(getLocalTextbookStatusText(book))}</span>
              <small>${book.pageCount || 0} 页 · 已缓存 ${book.generatedPages || 0} 页</small>
            </button>
            ${textbookBatchMode
              ? `<div class="textbook-card-check" aria-hidden="true"></div>`
              : `<button class="textbook-delete-button" type="button" data-delete-local-document="${escapeHtml(book.id)}">删除</button>`
            }
          </article>
        `;
      }).join("")}
      ${textbookList.map((book) => `
        <button class="textbook-card" type="button" data-manifest="${escapeHtml(book.manifestUrl)}">
          <strong>${escapeHtml(book.title)}</strong>
          <span>${escapeHtml(book.subtitle)}</span>
          <small>${book.courseCount || 0} 课 · ${book.sectionCount || 0} 单元 · ${book.pageCount || 0} 页 · ${book.audioCount || 0} 段听力</small>
        </button>
      `).join("")}
    </div>
  `;

  // 上传按钮
  const uploadBtn = library.querySelector("#localPdfUploadButton");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => library.querySelector("#localPdfUploadInput").click());
    library.querySelector("#localPdfUploadInput").addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      event.target.value = "";
      handleLocalPdfUpload(file);
    });
  }

  // 批量管理切换
  library.querySelector("#textbookBatchToggle")?.addEventListener("click", () => {
    textbookBatchMode = !textbookBatchMode;
    textbookSelectedIds.clear();
    renderTextbookLibrary();
  });

  // 批量删除
  library.querySelector("#textbookBatchDelete")?.addEventListener("click", () => {
    if (textbookSelectedIds.size === 0) return;
    const names = [...textbookSelectedIds]
      .map((id) => localTextbookList.find((b) => b.id === id)?.title || "未命名")
      .join("、");
    if (!confirm(`确认删除以下 ${textbookSelectedIds.size} 本教材的本机缓存？\n\n${names}`)) return;
    const ids = [...textbookSelectedIds];
    textbookSelectedIds.clear();
    Promise.all(ids.map((id) => deleteLocalTextbook(id))).catch((err) => {
      console.warn("批量删除失败", err);
      alert("部分教材删除失败，请稍后重试。");
    });
  });

  // 批量模式卡片点击（选择/取消选择）
  if (textbookBatchMode) {
    library.querySelectorAll(".is-selectable[data-local-document]").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.localDocument;
        if (textbookSelectedIds.has(id)) {
          textbookSelectedIds.delete(id);
        } else {
          textbookSelectedIds.add(id);
        }
        renderTextbookLibrary();
      });
    });

    // 拖拽排序
    let dragSrcId = null;
    library.querySelectorAll("[data-drag-id]").forEach((card) => {
      card.addEventListener("dragstart", (e) => {
        dragSrcId = card.dataset.dragId;
        card.classList.add("is-dragging");
        e.dataTransfer.effectAllowed = "move";
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
        library.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      });
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (card.dataset.dragId !== dragSrcId) {
          library.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
          card.classList.add("drag-over");
        }
      });
      card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        const targetId = card.dataset.dragId;
        if (!dragSrcId || dragSrcId === targetId) return;
        const list = getSortedLocalTextbookList();
        const srcIdx = list.findIndex((b) => b.id === dragSrcId);
        const tgtIdx = list.findIndex((b) => b.id === targetId);
        if (srcIdx < 0 || tgtIdx < 0) return;
        const [moved] = list.splice(srcIdx, 1);
        list.splice(tgtIdx, 0, moved);
        localTextbookOrder = list.map((b) => b.id);
        localStorage.setItem("localTextbookOrder", JSON.stringify(localTextbookOrder));
        renderTextbookLibrary();
      });
    });
  } else {
    // 普通模式：点击卡片打开
    library.querySelectorAll("[data-open-local]").forEach((btn) => {
      btn.addEventListener("click", () => openLocalTextbook(btn.dataset.openLocal));
    });

    // 单个删除
    library.querySelectorAll("[data-delete-local-document]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const documentId = button.dataset.deleteLocalDocument;
        const book = localTextbookList.find((item) => item.id === documentId);
        if (confirm(`删除《${book?.title || "本地教材"}》的本机缓存？`)) {
          deleteLocalTextbook(documentId).catch((error) => {
            console.warn("本地教材删除失败。", error);
            alert("删除失败，请稍后重试。");
          });
        }
      });
    });
  }

  // 服务器教材卡片
  library.querySelectorAll(".textbook-card[data-manifest]").forEach((card) => {
    card.addEventListener("click", () => openTextbook(card.dataset.manifest));
    card.addEventListener("mouseenter", () => warmTextbookAssets(card.dataset.manifest, 1, 2));
    card.addEventListener("focus", () => warmTextbookAssets(card.dataset.manifest, 1, 2));
    card.addEventListener("touchstart", () => warmTextbookAssets(card.dataset.manifest, 1, 2), { passive: true });
    warmTextbookAssets(card.dataset.manifest, 1, 0);
  });
}


function getLocalTextbookStatusText(book) {
  if (book.status === "ready") {
    return "已完成本机页图缓存";
  }
  if (book.status === "failed") {
    return book.errorMessage || "转换失败，请重新上传";
  }
  return "正在本机转换 PDF";
}


async function openLocalTextbook(documentId) {
  const loadRunId = ++activeTextbookLoadRunId;
  const documentRecord = await getLocalTextbookDocument(documentId);
  if (!documentRecord || loadRunId !== activeTextbookLoadRunId) {
    return;
  }

  activeTextbookCacheEntry = null;
  activeTextbook = createLocalTextbookManifest(documentRecord);
  activeTextbookPage = 1;
  activeTextbookLoadStatus = documentRecord.status === "failed" ? "failed" : "ready";
  pdfAssistantMessages = [];
  pdfAssistantHistory = normalizePdfAssistantHistory(documentRecord.assistantHistory || [], documentRecord.id);
  pdfAssistantExpanded = false;

  document.querySelector("#textbookLibrary").hidden = true;
  document.querySelector("#textbookReader").hidden = false;
  document.querySelector("#materials").classList.add("reader-open");
  document.querySelector("#materialPageInput").max = getTextbookPageTotal();
  closeChapterMenu();
  renderChapterMenu(activeTextbookLoadStatus);
  renderTextbookPage(activeTextbookPage);

  if (documentRecord.status === "ready" && documentRecord.outlineStatus === "pending") {
    repairLocalTextbookOutline(documentRecord).catch((error) => {
      console.warn("本地教材目录修复失败。", error);
    });
  }

  if (documentRecord.status !== "ready") {
    createLocalTextbookJob(documentRecord)
      .then(() => Promise.all([
        ensureLocalTextbookPageRendered(documentRecord.id, activeTextbookPage),
        processLocalPdfDocument(documentRecord),
      ]))
      .catch((error) => markLocalTextbookFailed(documentRecord.id, error.message || "PDF 转换失败。"));
  }
}


async function repairLocalTextbookOutline(documentRecord) {
  const job = await createLocalTextbookJob(documentRecord);
  job.outlineInitialized = false;
  await initializeLocalPdfOutline(job);
}


function openTextbook(manifestUrl) {
  const loadRunId = ++activeTextbookLoadRunId;
  const libraryBook = textbookList.find((book) => book.manifestUrl === manifestUrl);
  activeTextbookCacheEntry = null;
  activeTextbook = createPendingTextbook(libraryBook, manifestUrl);
  activeTextbookPage = 1;
  activeTextbookLoadStatus = "loading";
  pdfAssistantMessages = [];
  pdfAssistantHistory = loadStoredPdfAssistantHistory(activeTextbook);
  pdfAssistantExpanded = false;

  document.querySelector("#textbookLibrary").hidden = true;
  document.querySelector("#textbookReader").hidden = false;
  document.querySelector("#materials").classList.add("reader-open");
  document.querySelector("#materialPageInput").max = getTextbookPageTotal();
  closeChapterMenu();
  renderChapterMenu("loading");
  renderTextbookPage(activeTextbookPage);

  getTextbookCacheEntry(manifestUrl)
    .then((entry) => {
      if (loadRunId !== activeTextbookLoadRunId) {
        return;
      }

      activeTextbookCacheEntry = entry;
      activeTextbook = entry.textbook;
      pdfAssistantHistory = loadStoredPdfAssistantHistory(activeTextbook);
      activeTextbookLoadStatus = "ready";
      activeTextbookCacheEntry.lastOpenedAt = ++textbookCacheVersion;
      document.querySelector("#materialPageInput").max = getTextbookPageTotal();
      renderChapterMenu();
      renderTextbookPage(activeTextbookPage);
      prefetchTextbookPages(activeTextbookPage, 1);
    })
    .catch((error) => {
      if (loadRunId !== activeTextbookLoadRunId) {
        return;
      }

      activeTextbookCacheEntry = null;
      activeTextbookLoadStatus = "failed";
      renderChapterMenu("failed");
      showTextbookPageSkeleton(activeTextbookPage, "教材信息加载失败，请稍后重试");
      syncTextbookControls();
      renderPdfAssistantPanel();
      console.warn("教材信息加载失败。", error);
    });
}


function createPendingTextbook(book = {}, manifestUrl = "") {
  return {
    id: book.id || "",
    title: book.title || "教材",
    subtitle: book.subtitle || "",
    manifestUrl,
    pageCount: book.pageCount || 1,
    units: [],
    pageAudio: {},
    isPending: true,
  };
}


async function getTextbookCacheEntry(manifestUrl) {
  const cachedEntry = textbookCache.get(manifestUrl);
  if (cachedEntry) {
    cachedEntry.lastOpenedAt = ++textbookCacheVersion;
    return cachedEntry;
  }

  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error("教材清单加载失败。");
  }

  const textbook = resolveTextbookAssetUrls(await response.json());
  const entry = {
    manifestUrl,
    textbook,
    warmedPages: new Set(),
    lastOpenedAt: ++textbookCacheVersion,
  };
  textbookCache.set(manifestUrl, entry);
  trimTextbookCache();
  return entry;
}


function trimTextbookCache() {
  if (textbookCache.size <= TEXTBOOK_CACHE_LIMIT) {
    return;
  }

  const entries = [...textbookCache.values()]
    .filter((entry) => entry !== activeTextbookCacheEntry)
    .sort((a, b) => a.lastOpenedAt - b.lastOpenedAt);

  while (textbookCache.size > TEXTBOOK_CACHE_LIMIT && entries.length > 0) {
    const entry = entries.shift();
    textbookCache.delete(entry.manifestUrl);
  }
}


function prefetchTextbookPages(centerPage, radius = TEXTBOOK_PREFETCH_RADIUS) {
  if (!activeTextbook) {
    return;
  }

  const firstPage = Math.max(Number(centerPage) - radius, 1);
  const lastPage = Math.min(Number(centerPage) + radius, getTextbookPageTotal());
  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    preloadTextbookPageImage(pageNumber);
  }
}


async function warmTextbookAssets(manifestUrl, centerPage = 1, radius = 0) {
  try {
    const entry = await getTextbookCacheEntry(manifestUrl);
    warmTextbookEntryImages(entry, centerPage, radius);
  } catch (error) {
    console.warn("教材预热失败。", error);
  }
}


function warmTextbookEntryImages(entry, centerPage = 1, radius = 0) {
  const total = entry.textbook.pageCount || 1;
  const firstPage = Math.max(Number(centerPage) - radius, 1);
  const lastPage = Math.min(Number(centerPage) + radius, total);
  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    preloadTextbookPageImage(pageNumber, entry);
  }
}


function getTextbookPageTotal() {
  return activeTextbook?.pageCount || 1;
}


function getTextbookPageAssetUrl(pageNumber, template) {
  if (!template) {
    return "";
  }

  const pageText = String(pageNumber).padStart(3, "0");
  return template
    .replace("{page}", pageText)
    .replace("{pageNumber}", String(pageNumber));
}


function getTextbookPageImageUrl(pageNumber, entry = activeTextbookCacheEntry) {
  return getTextbookPageAssetUrl(pageNumber, entry?.textbook?.pageImageUrlTemplate || activeTextbook?.pageImageUrlTemplate);
}


function getTextbookPageThumbUrl(pageNumber, entry = activeTextbookCacheEntry) {
  return getTextbookPageAssetUrl(pageNumber, entry?.textbook?.pageThumbUrlTemplate || activeTextbook?.pageThumbUrlTemplate);
}


function preloadTextbookPageImage(pageNumber, entry = activeTextbookCacheEntry) {
  if (!entry && activeTextbook?.source !== "local-upload") {
    return;
  }

  const cacheKey = String(pageNumber);
  if (entry?.warmedPages?.has(cacheKey)) {
    return;
  }

  entry?.warmedPages?.add(cacheKey);
  [getTextbookPageThumbUrl(pageNumber, entry), getTextbookPageImageUrl(pageNumber, entry)]
    .filter(Boolean)
    .forEach(async (url) => {
      if (isLocalTextbookPageUrl(url)) {
        const objectUrl = await getLocalTextbookPageObjectUrl(url);
        if (!objectUrl) {
          return;
        }
        url = objectUrl;
      }
      const image = new Image();
      image.decoding = "async";
      image.src = url;
    });
}


function showTextbookPagePreview(pageNumber) {
  const preview = document.querySelector("#materialPagePreview");
  const imageRunId = ++activeTextbookImageRunId;
  const thumbUrl = getTextbookPageThumbUrl(pageNumber);
  const imageUrl = getTextbookPageImageUrl(pageNumber);

  applyTextbookStageAspectRatio();
  showTextbookPageSkeleton(pageNumber, getTextbookSkeletonStatus());
  preview.hidden = true;

  if (!thumbUrl && !imageUrl) {
    return;
  }

  loadTextbookPreviewImage(thumbUrl, pageNumber, imageRunId)
    .then((thumbLoaded) => loadTextbookPreviewImage(imageUrl, pageNumber, imageRunId)
      .then((imageLoaded) => {
        if (!thumbLoaded && !imageLoaded && imageRunId === activeTextbookImageRunId && pageNumber === activeTextbookPage) {
          showTextbookPageSkeleton(pageNumber, getTextbookSkeletonStatus());
        }
      }));
}


function getTextbookSkeletonStatus() {
  if (activeTextbookLoadStatus === "failed") {
    return activeTextbook?.status === "failed" ? "PDF 转换失败，请重新上传" : "教材信息加载失败，请稍后重试";
  }
  if (activeTextbook?.source === "local-upload" && activeTextbook?.status !== "ready") {
    return "正在本机转换页面……";
  }
  return "加载中……";
}


function applyTextbookStageAspectRatio() {
  const stage = document.querySelector(".pdf-stage");
  const width = Number(activeTextbook?.pageWidth) || 589;
  const height = Number(activeTextbook?.pageHeight) || 807;
  stage.style.aspectRatio = `${width} / ${height}`;
}


function showTextbookPageSkeleton(pageNumber, status = "加载中……") {
  const skeleton = document.querySelector("#materialPageSkeleton");
  const label = document.querySelector("#materialPageSkeletonLabel");
  const statusLabel = document.querySelector("#materialPageSkeletonStatus");
  label.textContent = `第 ${pageNumber} 页`;
  statusLabel.textContent = status;
  skeleton.hidden = false;
}


function hideTextbookPageSkeleton() {
  document.querySelector("#materialPageSkeleton").hidden = true;
}


function loadTextbookPreviewImage(url, pageNumber, imageRunId) {
  if (!url) {
    return Promise.resolve(false);
  }

  return Promise.resolve(url)
    .then((nextUrl) => (isLocalTextbookPageUrl(nextUrl) ? getLocalTextbookPageObjectUrl(nextUrl) : nextUrl))
    .then((resolvedUrl) => new Promise((resolve) => {
      if (!resolvedUrl) {
        resolve(false);
        return;
      }

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (imageRunId === activeTextbookImageRunId && pageNumber === activeTextbookPage) {
        const preview = document.querySelector("#materialPagePreview");
        preview.src = resolvedUrl;
        preview.alt = `${activeTextbook?.title || "教材"} 第 ${pageNumber} 页预览`;
        preview.hidden = false;
        hideTextbookPageSkeleton();
      }
      resolve(true);
    };
    image.onerror = () => resolve(false);
    image.src = resolvedUrl;
  }));
}


function renderChapterMenu(state = activeTextbookLoadStatus) {
  const button = document.querySelector("#chapterMenuButton");
  const panel = document.querySelector("#chapterMenuPanel");
  const hasChapters = (activeTextbook?.units || []).length > 0;
  const isReady = state === "ready";
  button.disabled = false;
  button.title = hasChapters ? "选择章节" : "目录状态";
  button.setAttribute("aria-label", hasChapters ? "选择章节" : "目录状态");

  if (!isReady || !hasChapters) {
    const message = getChapterMenuEmptyMessage(state);
    panel.innerHTML = `
      <p class="chapter-menu-empty">${escapeHtml(message)}</p>
      ${canReidentifyLocalToc() ? `<button id="chapterReidentifyButton" class="chapter-reidentify-button" type="button">重新识别目录</button>` : ""}
    `;
    const reidentifyButton = panel.querySelector("#chapterReidentifyButton");
    if (reidentifyButton) {
      reidentifyButton.addEventListener("click", () => {
        reidentifyLocalTextbookOutline().catch((error) => {
          console.warn("重新识别目录失败。", error);
        });
      });
    }
    button.setAttribute("aria-expanded", "false");
    return;
  }

  panel.innerHTML = `
    ${canReidentifyLocalToc() ? `<button id="chapterReidentifyButton" class="chapter-reidentify-button" type="button">重新识别目录</button>` : ""}
    ${(activeTextbook.units || []).map((unit) => `
    <section class="chapter-group">
      <button class="chapter-unit" type="button" data-page="${unit.startPage}">
        ${escapeHtml(unit.title)}
      </button>
      <div class="chapter-lessons">
        ${(unit.sections || unit.lessons || []).map((section) => `
          <button type="button" data-page="${section.page}">
            ${escapeHtml(getChapterSectionTitle(section))}
          </button>
        `).join("")}
      </div>
    </section>
  `).join("")}
  `;

  const reidentifyButton = panel.querySelector("#chapterReidentifyButton");
  if (reidentifyButton) {
    reidentifyButton.addEventListener("click", () => {
      reidentifyLocalTextbookOutline().catch((error) => {
        console.warn("重新识别目录失败。", error);
      });
    });
  }

  panel.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      closeChapterMenu();
      renderTextbookPage(button.dataset.page);
    });
  });
}


function getChapterMenuEmptyMessage(state = activeTextbookLoadStatus) {
  if (state === "failed") {
    return "教材信息加载失败，请稍后重试。";
  }
  const outlineStatus = activeTextbook?.outlineStatus || "none";
  if (state === "loading" || outlineStatus === "pending") {
    return "正在识别目录页……";
  }
  if (outlineStatus === "failed") {
    const detail = activeTextbook?.outlineError || activeTextbook?.outlineDebugSummary || "";
    return detail
      ? `目录识别失败：${detail} 可重新识别或使用页码跳转。`
      : "目录识别失败，可重新识别或使用页码跳转。";
  }
  if (activeTextbook?.outlineDebugSummary && outlineStatus !== "none") {
    return activeTextbook.outlineDebugSummary;
  }
  return "未识别到目录，可使用页码跳转。";
}


function canReidentifyLocalToc() {
  return activeTextbook?.source === "local-upload" && activeTextbook?.id && activeTextbookLoadStatus !== "failed";
}


async function reidentifyLocalTextbookOutline() {
  if (!canReidentifyLocalToc()) {
    return;
  }

  const documentRecord = await getLocalTextbookDocument(activeTextbook.id);
  if (!documentRecord) {
    return;
  }

  const nextDocument = {
    ...documentRecord,
    units: [],
    outlineStatus: "pending",
    outlineError: "",
    outlineDebugSummary: "",
    updatedAt: Date.now(),
  };
  await saveLocalTextbookDocument(nextDocument);
  activeTextbook = {
    ...activeTextbook,
    units: [],
    outlineStatus: "pending",
    outlineError: "",
    outlineDebugSummary: "",
  };
  renderChapterMenu("ready");

  const job = await createLocalTextbookJob(nextDocument);
  job.document = nextDocument;
  job.outlineInitialized = false;
  await initializeLocalPdfOutline(job);
}


function toggleChapterMenu() {
  const button = document.querySelector("#chapterMenuButton");
  const panel = document.querySelector("#chapterMenuPanel");

  const nextOpen = panel.hidden;
  panel.hidden = !nextOpen;
  button.setAttribute("aria-expanded", String(nextOpen));
}


function closeChapterMenu() {
  document.querySelector("#chapterMenuPanel").hidden = true;
  document.querySelector("#chapterMenuButton").setAttribute("aria-expanded", "false");
}


function renderTextbookPage(pageNumber) {
  if (!activeTextbook) {
    return;
  }

  const totalPages = getTextbookPageTotal();
  const nextPage = Math.min(Math.max(Number(pageNumber) || 1, 1), totalPages);
  const pageChanged = nextPage !== activeTextbookPage;
  if (pageChanged) {
    stopPlaybackQueue();
  }
  activeTextbookPage = nextPage;

  activeTextbookRenderRunId += 1;
  showTextbookPagePreview(activeTextbookPage);
  syncTextbookControls();
  renderPdfAssistantPanel();
  prefetchTextbookPages(activeTextbookPage);
}


function syncTextbookControls() {
  const total = getTextbookPageTotal();
  document.querySelector("#materialPageInput").value = activeTextbookPage;
  document.querySelector("#materialPageLabel").textContent = `/ ${total} 页`;
  document.querySelector("#materialPrevPage").disabled = activeTextbookPage <= 1;
  document.querySelector("#materialNextPage").disabled = activeTextbookPage >= total;
}


function setReaderFocusMode(enabled) {
  const reader = document.querySelector("#textbookReader");
  reader.classList.toggle("is-focus-mode", enabled);
  document.querySelector("#readerFocusExitButton").hidden = !enabled;
  closeChapterMenu();
  renderTextbookPage(activeTextbookPage);
}


function shouldIgnoreReaderKey(event) {
  const target = event.target;
  if (!target) {
    return false;
  }

  const tagName = target.tagName ? target.tagName.toLowerCase() : "";
  return target.isContentEditable || ["input", "textarea", "select"].includes(tagName);
}


function getCurrentTextbookUnit() {
  if (!activeTextbook) {
    return null;
  }

  return (activeTextbook.units || []).find((unit) => (
    activeTextbookPage >= unit.startPage && activeTextbookPage <= unit.endPage
  )) || null;
}


function getCurrentPageAudioItems() {
  if (!activeTextbook) {
    return [];
  }

  return (activeTextbook.pageAudio || {})[String(activeTextbookPage)] || [];
}


function formatAssistantHistoryTime(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}-${day} ${hours}:${minutes}`;
}


function getVisiblePdfAssistantHistory() {
  const history = normalizePdfAssistantHistory(pdfAssistantHistory, getPdfAssistantHistoryStorageKey());
  if (pdfAssistantHistoryView === "all") {
    return history.sort((a, b) => (a.page - b.page) || (a.createdAt - b.createdAt));
  }
  return history
    .filter((item) => item.page === activeTextbookPage)
    .sort((a, b) => a.createdAt - b.createdAt);
}


function renderPdfAssistantHistory() {
  const visibleHistory = getVisiblePdfAssistantHistory();
  if (!visibleHistory.length) {
    return "";
  }

  if (pdfAssistantHistoryView === "all") {
    return renderPdfAssistantAllHistory(visibleHistory);
  }

  return visibleHistory.map((item) => renderPdfAssistantHistoryItem(item)).join("");
}


function groupPdfAssistantHistoryByPage(history) {
  const pageMap = new Map();
  history.forEach((item) => {
    if (!pageMap.has(item.page)) {
      pageMap.set(item.page, []);
    }
    pageMap.get(item.page).push(item);
  });

  return Array.from(pageMap.entries())
    .sort(([pageA], [pageB]) => pageA - pageB)
    .map(([page, items]) => ({
      page,
      items: items.sort((a, b) => a.createdAt - b.createdAt),
    }));
}


function renderPdfAssistantHistoryItem(item) {
  return `
    <article class="pdf-assistant-history-item" data-assistant-history-item="${escapeHtml(item.id)}">
      <div class="pdf-assistant-history-meta">
        <button type="button" class="pdf-assistant-history-page" data-assistant-history-page="${escapeHtml(item.page)}">第 ${escapeHtml(item.page)} 页</button>
        <span>${escapeHtml(formatAssistantHistoryTime(item.createdAt))}</span>
        <button type="button" class="pdf-assistant-history-delete" data-assistant-history-delete="${escapeHtml(item.id)}" aria-label="删除这条历史">删除</button>
      </div>
      <div class="pdf-assistant-history-question">
        <strong>你</strong>
        <p>${escapeHtml(item.question)}</p>
      </div>
      <div class="pdf-assistant-history-answer">
        <strong>AI 助教</strong>
        <div class="pdf-assistant-content">${renderAssistantMessageContent(item.answer)}</div>
        ${item.truncated ? `<span class="pdf-assistant-truncated">回答可能被截断，可继续追问“请继续”。</span>` : ""}
      </div>
    </article>
  `;
}


function renderPdfAssistantAllHistory(history) {
  const chunks = [];
  groupPdfAssistantHistoryByPage(history).forEach(({ page, items }) => {
    const isExpanded = pdfAssistantExpandedHistoryPages.has(String(page));
    chunks.push(`
      <section class="pdf-assistant-history-page-group${isExpanded ? " is-expanded" : ""}">
        <button type="button" class="pdf-assistant-history-page-toggle" data-assistant-history-toggle-page="${escapeHtml(page)}" aria-expanded="${String(isExpanded)}">
          <span class="pdf-assistant-history-chevron" aria-hidden="true">›</span>
          <span>第 ${escapeHtml(page)} 页</span>
          <em>${escapeHtml(items.length)} 条对话</em>
        </button>
        ${isExpanded ? `
          <div class="pdf-assistant-history-page-body">
            ${items.map((item) => {
              const isItemExpanded = pdfAssistantExpandedHistoryItems.has(String(item.id));
              return `
                <article class="pdf-assistant-history-question-group${isItemExpanded ? " is-expanded" : ""}" data-assistant-history-item="${escapeHtml(item.id)}">
                  <div class="pdf-assistant-history-question-head">
                    <button type="button" class="pdf-assistant-history-question-toggle" data-assistant-history-toggle-item="${escapeHtml(item.id)}" aria-expanded="${String(isItemExpanded)}">
                      <span class="pdf-assistant-history-chevron" aria-hidden="true">›</span>
                      <span class="pdf-assistant-history-question-preview">${escapeHtml(item.question)}</span>
                      <em>${escapeHtml(formatAssistantHistoryTime(item.createdAt))}</em>
                    </button>
                    <button type="button" class="pdf-assistant-history-delete" data-assistant-history-delete="${escapeHtml(item.id)}" aria-label="删除这条历史">删除</button>
                  </div>
                  ${isItemExpanded ? `
                    <div class="pdf-assistant-history-meta">
                      <button type="button" class="pdf-assistant-history-page" data-assistant-history-page="${escapeHtml(item.page)}">第 ${escapeHtml(item.page)} 页</button>
                    </div>
                    <div class="pdf-assistant-history-question">
                      <strong>你</strong>
                      <p>${escapeHtml(item.question)}</p>
                    </div>
                    <div class="pdf-assistant-history-answer">
                      <strong>AI 助教</strong>
                      <div class="pdf-assistant-content">${renderAssistantMessageContent(item.answer)}</div>
                      ${item.truncated ? `<span class="pdf-assistant-truncated">回答可能被截断，可继续追问“请继续”。</span>` : ""}
                    </div>
                  ` : ""}
                </article>
              `;
            }).join("")}
          </div>
        ` : ""}
      </section>
    `);
  });
  return chunks.join("");
}


function escapeAssistantSelectorValue(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}


function queuePdfAssistantScrollTarget(selector, block = "start") {
  pdfAssistantScrollTarget = { selector, block };
}


function applyPdfAssistantScrollTarget(messages, previousScrollTop) {
  if (!messages) {
    pdfAssistantScrollTarget = null;
    return;
  }
  const target = pdfAssistantScrollTarget;
  pdfAssistantScrollTarget = null;

  if (!target?.selector) {
    messages.scrollTop = previousScrollTop;
    return;
  }

  const targetElement = messages.querySelector(target.selector);
  if (!targetElement) {
    messages.scrollTop = previousScrollTop;
    return;
  }

  const messageRect = messages.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const topPadding = 8;
  const targetTop = targetRect.top - messageRect.top + messages.scrollTop - topPadding;
  const targetBottom = targetRect.bottom - messageRect.bottom + messages.scrollTop + topPadding;
  messages.scrollTop = target.block === "nearest"
    ? Math.max(Math.min(messages.scrollTop, targetTop), targetBottom)
    : Math.max(0, targetTop);
}


function renderPdfAssistantPanel() {
  const reader = document.querySelector("#textbookReader");
  const panel = document.querySelector(".reader-assistant-panel");
  const status = document.querySelector("#pdfAssistantStatus");
  const messages = document.querySelector("#pdfAssistantMessages");
  const question = document.querySelector("#pdfAssistantQuestion");
  const sendButton = document.querySelector("#pdfAssistantSendButton");
  const expandButton = document.querySelector("#pdfAssistantExpandButton");
  panel.hidden = false;
  reader.classList.toggle("is-assistant-expanded", pdfAssistantExpanded);
  panel.classList.toggle("is-expanded", pdfAssistantExpanded);
  const expandLabel = expandButton.querySelector(".pdf-assistant-expand-label");
  if (expandLabel) {
    expandLabel.textContent = pdfAssistantExpanded ? "收起" : "AI 助教";
  } else {
    expandButton.textContent = pdfAssistantExpanded ? "收起" : "AI 助教";
  }
  expandButton.setAttribute("aria-label", pdfAssistantExpanded ? "收起 AI 助教" : "展开 AI 助教");
  expandButton.setAttribute("title", pdfAssistantExpanded ? "收起 AI 助教" : "AI 助教");
  expandButton.setAttribute("aria-pressed", String(pdfAssistantExpanded));

  if (!activeTextbook) {
    status.textContent = "打开 PDF 后可以提问。";
    question.disabled = true;
    sendButton.disabled = true;
  } else if (activeTextbookLoadStatus === "failed") {
    status.textContent = "PDF 当前不可用，暂时不能提问。";
    question.disabled = true;
    sendButton.disabled = true;
  } else {
    status.textContent = `将参考第 ${activeTextbookPage} 页及相邻页面回答。`;
    question.disabled = false;
    sendButton.disabled = false;
  }

  const pageChip = document.querySelector("#pdfAssistantPageChip");
  if (pageChip) {
    if (activeTextbook && activeTextbookLoadStatus !== "failed") {
      pageChip.textContent = `正在参考 第 ${activeTextbookPage} 页`;
      pageChip.hidden = false;
    } else {
      pageChip.hidden = true;
    }
  }

  document.querySelectorAll("[data-assistant-history-view]").forEach((button) => {
    const isActive = button.dataset.assistantHistoryView === pdfAssistantHistoryView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  const clearHistoryButton = document.querySelector("#pdfAssistantHistoryClear");
  if (clearHistoryButton) {
    clearHistoryButton.disabled = !pdfAssistantHistory.length;
  }

  const previousScrollTop = messages.scrollTop;
  const historyHtml = renderPdfAssistantHistory();
  const transientMessagesHtml = pdfAssistantMessages.length === 0
    ? ""
    : pdfAssistantMessages.map((message, index) => `
      <article class="pdf-assistant-message pdf-assistant-message-${escapeHtml(message.role)}" data-assistant-transient-role="${escapeHtml(message.role)}" data-assistant-transient-index="${escapeHtml(index)}">
        <strong>${message.role === "user" ? "你" : "AI 助教"}</strong>
        <div class="pdf-assistant-content">${renderAssistantMessageContent(message.content)}</div>
        ${message.truncated ? `<span class="pdf-assistant-truncated">回答可能被截断，可继续追问“请继续”。</span>` : ""}
      </article>
    `).join("");
  messages.innerHTML = `${historyHtml}${transientMessagesHtml}`;
  applyPdfAssistantScrollTarget(messages, previousScrollTop);
}


function renderAssistantMessageContent(content) {
  const lines = String(content || "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const parts = [];
  let listType = "";

  function closeList() {
    if (!listType) return;
    parts.push(`</${listType}>`);
    listType = "";
  }

  function openList(type) {
    if (listType === type) return;
    closeList();
    listType = type;
    parts.push(`<${type}>`);
  }

  function renderInline(text) {
    return escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || /^-{2,}$/.test(trimmed)) {
      closeList();
      return;
    }

    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      closeList();
      parts.push(`<h4>${renderInline(headingMatch[1])}</h4>`);
      return;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      openList("ul");
      parts.push(`<li>${renderInline(bulletMatch[1])}</li>`);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      openList("ol");
      parts.push(`<li>${renderInline(orderedMatch[1])}</li>`);
      return;
    }

    closeList();
    parts.push(`<p>${renderInline(trimmed)}</p>`);
  });

  closeList();
  return parts.join("");
}


function isLikelyTruncatedAnswer(content) {
  const text = String(content || "").trim();
  if (text.length < 2000) {
    return false;
  }
  const lastChar = text.slice(-1);
  const openParenCount = (text.match(/[（(「『《【]/g) || []).length;
  const closeParenCount = (text.match(/[）)」』》】]/g) || []).length;
  const endsWithIncompleteList = /(?:^|\n)\s*(?:[-*]|\d+[.)])\s+\S[^。.!?！？」』）)]*$/.test(text);
  return !/[。.!?！？」』）)]$/.test(lastChar) || openParenCount > closeParenCount || endsWithIncompleteList;
}


function containAssistantMessageWheel(event) {
  if (!pdfAssistantExpanded) {
    return;
  }

  const messages = event.currentTarget;
  if (!messages || messages.scrollHeight <= messages.clientHeight) {
    return;
  }

  const atTop = messages.scrollTop <= 0;
  const atBottom = messages.scrollTop + messages.clientHeight >= messages.scrollHeight - 1;
  const scrollingUp = event.deltaY < 0;
  const scrollingDown = event.deltaY > 0;

  if ((scrollingUp && !atTop) || (scrollingDown && !atBottom)) {
    event.stopPropagation();
  }
}


async function getPdfAssistantContextPages() {
  if (!activeTextbook?.id) {
    return [];
  }

  const firstPage = Math.max(activeTextbookPage - ASSISTANT_CONTEXT_RADIUS, 1);
  const lastPage = Math.min(activeTextbookPage + ASSISTANT_CONTEXT_RADIUS, getTextbookPageTotal());
  const pages = [];
  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    if (activeTextbook.source === "local-upload") {
      await ensureLocalTextbookPageRendered(activeTextbook.id, pageNumber);
    }
    const textRecord = await getLocalTextbookPageText(activeTextbook.id, pageNumber);
    pages.push({
      pageNumber,
      text: textRecord?.text || "",
      isCurrent: pageNumber === activeTextbookPage,
    });
  }
  return pages;
}


async function getCurrentPageScreenshotDataUrl() {
  const preview = document.querySelector("#materialPagePreview");
  if (!preview || preview.hidden || !preview.complete || !preview.naturalWidth) {
    return "";
  }

  const maxWidth = 900;
  const scale = Math.min(maxWidth / preview.naturalWidth, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(Math.round(preview.naturalWidth * scale), 1);
  canvas.height = Math.max(Math.round(preview.naturalHeight * scale), 1);
  const context = canvas.getContext("2d");
  context.drawImage(preview, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch (error) {
    return "";
  }
}


async function sendPdfAssistantQuestion() {
  const input = document.querySelector("#pdfAssistantQuestion");
  const question = input.value.trim();
  if (!question || !activeTextbook) {
    return;
  }

  const requestId = ++pdfAssistantRequestId;
  const requestPage = activeTextbookPage;
  input.value = "";
  pdfAssistantMessages.push({ role: "user", content: question });
  pdfAssistantMessages.push({ role: "assistant", content: "正在阅读当前页……" });
  queuePdfAssistantScrollTarget('[data-assistant-transient-role="user"]');
  renderPdfAssistantPanel();

  try {
    const contextPages = await getPdfAssistantContextPages();
    const currentPageText = contextPages.find((page) => page.isCurrent)?.text || "";
    const screenshot = currentPageText.trim().length < ASSISTANT_TEXT_IMAGE_THRESHOLD || isProbablyGarbledText(currentPageText)
      ? await getCurrentPageScreenshotDataUrl()
      : "";
    const response = await fetch("/api/pdf-assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        documentTitle: activeTextbook.title || "本地 PDF 教材",
        pageNumber: activeTextbookPage,
        pageCount: getTextbookPageTotal(),
        contextPages,
        screenshot,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "AI 助教暂时不可用。");
    }
    if (requestId === pdfAssistantRequestId) {
      const answer = result.answer || "我没有生成有效回答。";
      const truncated = isLikelyTruncatedAnswer(answer);
      pdfAssistantMessages[pdfAssistantMessages.length - 1] = {
        role: "assistant",
        content: answer,
        truncated,
      };
      const historyItem = await addPdfAssistantHistoryItem(question, answer, truncated, requestPage);
      pdfAssistantMessages = [];
      if (historyItem?.id) {
        queuePdfAssistantScrollTarget(`[data-assistant-history-item="${escapeAssistantSelectorValue(historyItem.id)}"]`);
      }
    }
  } catch (error) {
    const errorMessage = error.message || "AI 助教暂时不可用。";
    if (requestId === pdfAssistantRequestId) {
      pdfAssistantMessages[pdfAssistantMessages.length - 1] = {
        role: "assistant",
        content: errorMessage,
      };
      const historyItem = await addPdfAssistantHistoryItem(question, errorMessage, false, requestPage);
      pdfAssistantMessages = [];
      if (historyItem?.id) {
        queuePdfAssistantScrollTarget(`[data-assistant-history-item="${escapeAssistantSelectorValue(historyItem.id)}"]`);
      }
    }
  }

  renderPdfAssistantPanel();
}


/**
 * 初始化页面中的 change / input 事件。
 */
function initEvents() {
  // 句子页已由 React 应用（sentence-app.jsx）接管，旧的下拉框可能不存在，做空值保护。
  document.querySelector("#sceneSelect")?.addEventListener("change", (event) => {
    loadSentences(event.target.value);
  });

  document.querySelector("#textbookBackButton").addEventListener("click", () => {
    resetTextbookReaderToLibrary();
  });

  document.querySelector("#readerFocusButton").addEventListener("click", () => {
    setReaderFocusMode(true);
  });

  document.querySelector("#readerFocusExitButton").addEventListener("click", () => {
    setReaderFocusMode(false);
  });

  document.querySelector("#materialPrevPage").addEventListener("click", () => {
    renderTextbookPage(activeTextbookPage - 1);
  });

  document.querySelector("#materialNextPage").addEventListener("click", () => {
    renderTextbookPage(activeTextbookPage + 1);
  });

  document.querySelector("#materialPageInput").addEventListener("change", (event) => {
    renderTextbookPage(event.target.value);
  });

  document.querySelector("#materialPageInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      renderTextbookPage(event.target.value);
    }
  });

  document.querySelector("#chapterMenuButton").addEventListener("click", () => {
    toggleChapterMenu();
  });

  document.querySelector("#pdfAssistantForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sendPdfAssistantQuestion();
  });
  document.querySelector("#pdfAssistantQuestion").addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }
    event.preventDefault();
    sendPdfAssistantQuestion();
  });
  document.querySelector("#pdfAssistantMessages").addEventListener("wheel", containAssistantMessageWheel, { passive: true });
  document.querySelector("#pdfAssistantExpandButton").addEventListener("click", () => {
    pdfAssistantExpanded = !pdfAssistantExpanded;
    renderPdfAssistantPanel();
  });
  document.querySelector("#pdfAssistantHistoryBar")?.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-assistant-history-view]");
    if (viewButton) {
      pdfAssistantHistoryView = viewButton.dataset.assistantHistoryView === "all" ? "all" : "page";
      localStorage.setItem("pdfAssistantHistoryView", pdfAssistantHistoryView);
      renderPdfAssistantPanel();
      return;
    }

    if (event.target.closest("#pdfAssistantHistoryClear")) {
      clearPdfAssistantHistory();
    }
  });
  document.querySelector("#pdfAssistantMessages").addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-assistant-history-page]");
    if (pageButton) {
      renderTextbookPage(pageButton.dataset.assistantHistoryPage);
      return;
    }

    const deleteButton = event.target.closest("[data-assistant-history-delete]");
    if (deleteButton) {
      deletePdfAssistantHistoryItem(deleteButton.dataset.assistantHistoryDelete);
      return;
    }

    const itemToggleButton = event.target.closest("[data-assistant-history-toggle-item]");
    if (itemToggleButton) {
      const itemId = String(itemToggleButton.dataset.assistantHistoryToggleItem || "");
      if (pdfAssistantExpandedHistoryItems.has(itemId)) {
        pdfAssistantExpandedHistoryItems.delete(itemId);
      } else if (itemId) {
        pdfAssistantExpandedHistoryItems.add(itemId);
        queuePdfAssistantScrollTarget(`[data-assistant-history-item="${escapeAssistantSelectorValue(itemId)}"]`);
      }
      renderPdfAssistantPanel();
      return;
    }

    const toggleButton = event.target.closest("[data-assistant-history-toggle-page]");
    if (toggleButton) {
      const page = String(toggleButton.dataset.assistantHistoryTogglePage || "");
      if (pdfAssistantExpandedHistoryPages.has(page)) {
        pdfAssistantExpandedHistoryPages.delete(page);
      } else if (page) {
        pdfAssistantExpandedHistoryPages.add(page);
      }
      renderPdfAssistantPanel();
      return;
    }
  });
  document.querySelectorAll(".pdf-assistant-quick").forEach((quickButton) => {
    quickButton.addEventListener("click", () => {
      const input = document.querySelector("#pdfAssistantQuestion");
      if (!input || input.disabled) return;
      input.value = quickButton.getAttribute("data-prompt") || quickButton.textContent.trim();
      sendPdfAssistantQuestion();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!activeTextbook || document.querySelector("#textbookReader").hidden || shouldIgnoreReaderKey(event)) {
      return;
    }

    if (event.key === "Escape" && document.querySelector("#textbookReader").classList.contains("is-focus-mode")) {
      event.preventDefault();
      setReaderFocusMode(false);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      renderTextbookPage(activeTextbookPage - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      renderTextbookPage(activeTextbookPage + 1);
    }
  });

  window.addEventListener("resize", () => {
    if (activeTextbook && !document.querySelector("#textbookReader").hidden) {
      renderTextbookPage(activeTextbookPage);
    }
  });

  // 词汇页已由 React 应用（vocab-app.jsx）接管，旧的搜索框可能不存在，做空值保护。
  document.querySelector("#vocabSearch")?.addEventListener("input", (event) => {
    loadVocabulary(event.target.value);
  });
}


function initTopbarScrollState() {
  const topbar = document.querySelector(".topbar");
  if (!topbar) {
    return;
  }

  const updateTopbarState = () => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  updateTopbarState();
  window.addEventListener("scroll", updateTopbarState, { passive: true });
}

/**
 * 页面启动函数。
 * DOMContentLoaded 表示 HTML 已经被浏览器解析完成，可以安全地 querySelector。
 */
document.addEventListener("DOMContentLoaded", async () => {
  initTabs();
  initDefaultPage();
  initThemeToggle();
  initTopbarScrollState();
  initEvents();

  // 场景（句子）和词汇改由各自的 React 应用加载，这里不再启动旧的渲染逻辑。
  const startupTasks = [
    ["音标", loadLetters],
    ["教材", loadMaterials],
  ];

  const results = await Promise.allSettled(startupTasks.map(([, task]) => task()));
  const failed = results
    .map((result, index) => ({ result, name: startupTasks[index][0] }))
    .filter((item) => item.result.status === "rejected");

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`${item.name}初始化失败`, item.result.reason));
    console.warn(`部分模块初始化失败：${failed.map((item) => item.name).join("、")}`);
  }
});
