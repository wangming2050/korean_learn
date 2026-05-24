/*
  app.js

  前端不使用 Vue / React / jQuery 等框架。
  所有页面切换、接口请求、音频播放都用原生 JavaScript 完成。
*/

// 获取全站唯一的 audio 播放器。后面所有播放按钮都会复用它。
const player = document.querySelector("#player");

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
    note: "先听松音，再对比紧音和送气音。",
    groups: [
      { id: "plain", label: "松音", note: "先按基础辅音建立听感", kind: "consonant", letters: ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ"] },
      { id: "tense", label: "紧音", note: "声音更紧，气流更短", kind: "consonant", letters: ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ"] },
      { id: "aspirated", label: "送气音", note: "重点听明显送气", kind: "consonant", letters: ["ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] },
    ],
  },
  {
    id: "vowels",
    label: "元音",
    note: "先稳定单元音，再练组合后的双元音。",
    groups: [
      { id: "single-vowels", label: "单元音", note: "先练清楚口型和舌位", kind: "vowel", letters: ["ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ", "ㅐ", "ㅔ"] },
      { id: "double-vowels", label: "双元音", note: "听清开头到结尾的滑动", kind: "vowel", letters: ["ㅒ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"] },
    ],
  },
  {
    id: "batchim",
    label: "收音",
    note: "收音先按 7 类代表音练，再看双收音读前还是读后。",
    groups: [
      {
        id: "base-batchim",
        label: "基础收音",
        note: "写法很多，实际先归到 7 类",
        kind: "batchim",
        items: [
          { letter: "ㄱ 类", sound: "实际读 ㄱ", word: "ㄱ ㄲ ㅋ", meaning: "국, 밖, 부엌", examples: [["국", "收成 ㄱ"], ["밖", "ㄲ 作收音读 ㄱ"], ["부엌", "ㅋ 作收音读 ㄱ"]], tips: ["包含写法：ㄱ ㄲ ㅋ", "发音短促收住，不要加 으 或 이。"] },
          { letter: "ㄴ 类", sound: "实际读 ㄴ", word: "ㄴ", meaning: "문, 산", examples: [["문", "门"], ["산", "山"]], tips: ["舌尖抵住上齿龈，声音从鼻腔出来。"] },
          { letter: "ㄷ 类", sound: "实际读 ㄷ", word: "ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ", meaning: "옷, 낮, 꽃", examples: [["옷", "ㅅ 作收音读 ㄷ"], ["낮", "ㅈ 作收音读 ㄷ"], ["꽃", "ㅊ 作收音读 ㄷ"]], tips: ["这一类写法最多，先统一收成 ㄷ 的听感。"] },
          { letter: "ㄹ 类", sound: "实际读 ㄹ", word: "ㄹ", meaning: "달, 길", examples: [["달", "月亮"], ["길", "路"]], tips: ["舌尖轻轻收住，不要拖成长音。"] },
          { letter: "ㅁ 类", sound: "实际读 ㅁ", word: "ㅁ", meaning: "밤, 마음", examples: [["밤", "夜晚/栗子"], ["마음", "心"]], tips: ["双唇闭合，声音从鼻腔出来。"] },
          { letter: "ㅂ 类", sound: "实际读 ㅂ", word: "ㅂ ㅍ", meaning: "집, 앞", examples: [["집", "家"], ["앞", "ㅍ 作收音读 ㅂ"]], tips: ["双唇闭合收住，不要读出完整的 브。"] },
          { letter: "ㅇ 类", sound: "实际读 ㅇ", word: "ㅇ", meaning: "방, 강", examples: [["방", "房间"], ["강", "江/河"]], tips: ["舌根收住，声音从鼻腔出来。"] },
        ],
      },
      {
        id: "double-front",
        categoryLabel: "双收音",
        categoryNote: "双收音先判断读前一个还是后一个；后接元音时后续再单独练连音。",
        label: "多数读前一个",
        note: "先按前一个辅音收住",
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
        note: "这几个需要完整记住",
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
        note: "容易和默认规则混淆",
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

// 保存当前正在做“片段循环”的结束时间，timeupdate 事件里会用到。
let currentLoopEnd = 0;

// 保存当前片段的开始时间，循环时需要跳回这里。
let currentLoopStart = 0;

// 标记当前是否开启片段循环。
let loopEnabled = false;

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

  stopPlaybackQueue();
  currentLoopStart = Number(start) || 0;
  currentLoopEnd = Number(end) || 0;
  loopEnabled = shouldLoop;

  // 如果切换了新的音频文件，先设置 src；如果还是同一个文件，只跳转时间即可。
  if (player.getAttribute("src") !== audioUrl) {
    player.src = audioUrl;
  }

  player.playbackRate = slow ? 0.75 : 1;
  player.currentTime = currentLoopStart;
  player.play();
}


function stopPlaybackQueue() {
  playbackRunId += 1;
  player.pause();
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

  if (item.audioUrl) {
    played = await playUrlOnce(item.audioUrl, runId);
  }

  if (!played && item.text) {
    played = await speakKorean(item.text, runId);
  }

  return played;
}


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
});


/**
 * 切换页面栏目。
 */
function activatePage(pageId) {
  document.querySelectorAll(".tab").forEach((item) => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.body.dataset.activePage = pageId;
}


function initDefaultPage() {
  const hasSeenGuide = localStorage.getItem("hasSeenGuide") === "true";
  const defaultPage = hasSeenGuide ? "letters" : "guide";

  activatePage(defaultPage);

  if (!hasSeenGuide) {
    localStorage.setItem("hasSeenGuide", "true");
  }
}


/**
 * 初始化顶部 tab 切换。
 */
function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => activatePage(tab.dataset.page));
  });

  document.querySelectorAll("[data-open-page]").forEach((button) => {
    button.addEventListener("click", () => activatePage(button.dataset.openPage));
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
    tips: details.tips || [],
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
  };
}


function getCardAriaLabel(item) {
  if (item.type === "rule") {
    return `查看 ${item.letter} 收音规则`;
  }

  return `播放 ${item.letter}，查看 ${item.word} 示例`;
}


function renderPracticeCard(item, index) {
  const metaText = item.type === "rule" ? item.sound : `${item.examples.length} 个示例`;

  return `
    <article
      class="letter-card ${item.kind}${item.type === "rule" ? " rule-card" : ""}"
      data-index="${index}"
      role="button"
      tabindex="0"
      aria-label="${getCardAriaLabel(item)}"
    >
      <strong>${item.letter}</strong>
      <span class="letter-word">${item.word}</span>
      <span>${item.meaning}</span>
      <small>${metaText}</small>
    </article>
  `;
}


function renderTipList(tips) {
  if (!tips.length) {
    return "";
  }

  return `
    <div class="detail-tips">
      ${tips.map((tip) => `<span>${tip}</span>`).join("")}
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
        <span>点击词卡单独播放</span>
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
        <span class="eyebrow">Selected Sound</span>
        <h3>${letterData.letter} <span>${letterData.sound}</span></h3>
      </div>
      <button class="detail-close" type="button" aria-label="收起示范详情">×</button>
    </div>
    ${renderTipList(letterData.tips || [])}
    ${renderExampleSection(letterData.type === "rule" ? "例词" : "位置示范", letterData.examples, "example", letterData)}
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
  playLetterQueue(letterData);
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
        <span>${section.note}</span>
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
                  <span>${group.categoryNote || ""}</span>
                </div>
              ` : ""}
              <div class="letter-subgroup-head">
                <div>
                  <span class="letter-type-badge ${group.kind}">${group.label}</span>
                  <h4>${group.label}</h4>
                </div>
                <span>${group.note}，共 ${indexedItems.length} 个</span>
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
 * 加载教材列表。
 * 用户选择教材后，再读取单个教材的完整 content 时间轴。
 */
async function loadMaterials() {
  const result = await api("/api/materials");
  const select = document.querySelector("#materialSelect");

  select.innerHTML = result.data.map((item) => (
    `<option value="${item.id}">${item.title} ${item.chapter || ""}</option>`
  )).join("");

  if (result.data.length > 0) {
    await loadMaterial(result.data[0].id);
  } else {
    document.querySelector("#materialContent").innerHTML = "<p>还没有教材，请先到管理页新增。</p>";
  }
}


/**
 * 加载单个教材，并把每一句渲染成可点击的时间轴项目。
 */
async function loadMaterial(materialId) {
  const result = await api(`/api/materials?id=${encodeURIComponent(materialId)}`);
  const material = result.data;
  const list = document.querySelector("#materialContent");

  list.innerHTML = material.content.map((line) => `
    <article class="sentence-card">
      <div>
        <h3>${line.text}</h3>
        <div class="meta">${line.start || 0}s - ${line.end || "音频结束"}s</div>
      </div>
      <button
        data-audio="${material.audio_url || ""}"
        data-start="${line.start || 0}"
        data-end="${line.end || 0}"
      >播放</button>
    </article>
  `).join("");

  list.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      playAudio(
        button.dataset.audio,
        button.dataset.start,
        button.dataset.end,
        document.querySelector("#materialLoop").checked,
      );
    });
  });
}


/**
 * 初始化页面中的 change / input 事件。
 */
function initEvents() {
  document.querySelector("#sceneSelect").addEventListener("change", (event) => {
    loadSentences(event.target.value);
  });

  document.querySelector("#materialSelect").addEventListener("change", (event) => {
    loadMaterial(event.target.value);
  });

  document.querySelector("#vocabSearch").addEventListener("input", (event) => {
    loadVocabulary(event.target.value);
  });
}

/**
 * 页面启动函数。
 * DOMContentLoaded 表示 HTML 已经被浏览器解析完成，可以安全地 querySelector。
 */
document.addEventListener("DOMContentLoaded", async () => {
  initTabs();
  initDefaultPage();
  initThemeToggle();
  initEvents();

  try {
    await loadLetters();
    await loadScenes();
    await loadVocabulary();
    await loadMaterials();
  } catch (error) {
    // 常见原因是 MySQL 没启动、数据库没创建、pymysql 没安装。
    console.error(error);
    alert(`初始化失败：${error.message}`);
  }
});
