/*
  app.js

  前端不使用 Vue / React / jQuery 等框架。
  所有页面切换、接口请求、音频播放都用原生 JavaScript 完成。
*/

// 获取全站唯一的 audio 播放器。后面所有播放按钮都会复用它。
const player = document.querySelector("#player");

const LETTER_DETAILS = {
  "ㄱ": { sound: "기역", examples: [["가방", "书包"], ["고기", "肉"], ["기차", "火车"], ["가게", "商店"]] },
  "ㄴ": { sound: "니은", examples: [["나무", "树"], ["누나", "姐姐"], ["나라", "国家"], ["노래", "歌曲"]] },
  "ㄷ": { sound: "디귿", examples: [["다리", "腿/桥"], ["두부", "豆腐"], ["도서관", "图书馆"], ["달", "月亮"]] },
  "ㄹ": { sound: "리을", examples: [["라면", "拉面"], ["리본", "丝带"], ["로봇", "机器人"], ["러시아", "俄罗斯"]] },
  "ㅁ": { sound: "미음", examples: [["모자", "帽子"], ["물", "水"], ["마을", "村庄"], ["문", "门"]] },
  "ㅂ": { sound: "비읍", examples: [["바다", "大海"], ["바지", "裤子"], ["밥", "饭"], ["버스", "公交车"]] },
  "ㅅ": { sound: "시옷", examples: [["사과", "苹果"], ["산", "山"], ["손", "手"], ["선생님", "老师"]] },
  "ㅇ": { sound: "이응", examples: [["아이", "孩子"], ["우유", "牛奶"], ["오이", "黄瓜"], ["이름", "名字"]] },
  "ㅈ": { sound: "지읒", examples: [["지도", "地图"], ["지하철", "地铁"], ["전화", "电话"], ["집", "家"]] },
  "ㅊ": { sound: "치읓", examples: [["차", "车/茶"], ["친구", "朋友"], ["책", "书"], ["치마", "裙子"]] },
  "ㅋ": { sound: "키읔", examples: [["코", "鼻子"], ["커피", "咖啡"], ["카드", "卡片"], ["키", "身高/钥匙"]] },
  "ㅌ": { sound: "티읕", examples: [["토마토", "番茄"], ["택시", "出租车"], ["텔레비전", "电视"], ["타다", "乘坐"]] },
  "ㅍ": { sound: "피읖", examples: [["포도", "葡萄"], ["피자", "披萨"], ["팔", "胳膊/八"], ["편지", "信"]] },
  "ㅎ": { sound: "히읗", examples: [["하늘", "天空"], ["학교", "学校"], ["한국", "韩国"], ["호텔", "酒店"]] },
  "ㄲ": { sound: "쌍기역", examples: [["꼬리", "尾巴"], ["꽃", "花"], ["꿈", "梦"], ["까치", "喜鹊"]] },
  "ㄸ": { sound: "쌍디귿", examples: [["딸기", "草莓"], ["떡", "年糕"], ["따뜻해요", "暖和"], ["뜨다", "浮起"]] },
  "ㅃ": { sound: "쌍비읍", examples: [["빵", "面包"], ["뿌리", "根"], ["빨래", "洗衣"], ["뽀뽀", "亲亲"]] },
  "ㅆ": { sound: "쌍시옷", examples: [["쌀", "米"], ["쓰다", "写/苦"], ["씨", "先生/种子"], ["싸다", "便宜"]] },
  "ㅉ": { sound: "쌍지읒", examples: [["짜다", "咸"], ["찌개", "炖汤"], ["쪽", "页/边"], ["짝", "只/双的一方"]] },
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
      text: letterData.sound,
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
  const primaryExample = {
    word: item.word,
    meaning: item.meaning,
    audioUrl: item.audio_url || "",
    primary: true,
  };

  const examples = (details.examples || [[item.word, item.meaning]]).map(([word, meaning], index) => ({
    word,
    meaning,
    audioUrl: index === 0 ? item.audio_url || "" : "",
    primary: index === 0,
  }));

  if (!examples.some((example) => example.word === primaryExample.word)) {
    examples.unshift(primaryExample);
  }

  return {
    ...item,
    sound: details.sound || item.letter,
    letterAudioUrl: item.letter_audio_url || "",
    examples,
  };
}


function renderLetterDetail(letterData) {
  const detail = document.querySelector("#letterDetail");
  if (!detail) {
    return;
  }

  detail.hidden = false;
  detail.innerHTML = `
    <div class="letter-detail-head">
      <div>
        <span class="eyebrow">Selected Sound</span>
        <h3>${letterData.letter} <span>${letterData.sound}</span></h3>
      </div>
      <button class="detail-close" type="button" aria-label="收起示范详情">×</button>
    </div>
    <div class="detail-summary">
      <span>当前点击卡片会按上方设置依次朗读。</span>
      <span>示例单词共 ${letterData.examples.length} 个。</span>
    </div>
    <div class="example-list">
      ${letterData.examples.map((example) => `
        <article class="example-word${example.primary ? " primary" : ""}">
          <strong>${example.word}</strong>
          <span>${example.meaning}</span>
        </article>
      `).join("")}
    </div>
  `;

  detail.querySelector(".detail-close").addEventListener("click", () => {
    selectedLetterIndex = null;
    detail.hidden = true;
    document.querySelectorAll(".letter-card").forEach((card) => card.classList.remove("selected"));
    stopPlaybackQueue();
  });
}


function selectLetter(index) {
  const detail = document.querySelector("#letterDetail");

  if (selectedLetterIndex === index) {
    selectedLetterIndex = null;
    if (detail) {
      detail.hidden = true;
    }
    document.querySelectorAll(".letter-card").forEach((card) => card.classList.remove("selected"));
    stopPlaybackQueue();
    return;
  }

  selectedLetterIndex = index;
  const letterData = letterItems[index];

  document.querySelectorAll(".letter-card").forEach((card) => {
    card.classList.toggle("selected", Number(card.dataset.index) === index);
  });

  renderLetterDetail(letterData);
  playLetterQueue(letterData);
}


/**
 * 加载 40 个韩文字母。
 * 字母数据由 /api/letters 返回，点击卡片播放对应音频。
 */
async function loadLetters() {
  const result = await api("/api/letters");
  const grid = document.querySelector("#letterGrid");
  letterItems = result.data.map(normalizeLetterItem);

  grid.innerHTML = letterItems.map((item, index) => `
    <article class="letter-card" data-index="${index}">
      <strong>${item.letter}</strong>
      <span class="letter-word">${item.word}</span>
      <span>${item.meaning}</span>
      <small>${item.examples.length} 个示例</small>
    </article>
  `).join("");

  grid.querySelectorAll(".letter-card").forEach((card) => {
    card.addEventListener("click", () => {
      selectLetter(Number(card.dataset.index));
    });
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
