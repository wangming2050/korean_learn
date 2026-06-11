/* global React, ReactDOM */
/* 词汇页 — 卡片学习 / 测试 / 收藏复习
   数据来源：后端 /api/vocabulary（词 + 关联例句）
   音频：例句优先用 window.playAudio 播放真实音频，词本身退回浏览器朗读 */
const { useState, useEffect, useMemo } = React;

/* ── 离线兜底数据（仅当后端不可用时显示） ── */
const VOCAB_FALLBACK = [
  { id: 1, korean: "안녕하세요", chinese: "你好", pos: "感叹语", sentence_korean: "안녕하세요.", sentence_chinese: "你好。", audio_url: "" },
  { id: 2, korean: "어디", chinese: "哪里", pos: "代词", sentence_korean: "지하철역이 어디예요?", sentence_chinese: "地铁站在哪里？", audio_url: "" },
  { id: 3, korean: "얼마", chinese: "多少", pos: "名词", sentence_korean: "이거 얼마예요?", sentence_chinese: "这个多少钱？", audio_url: "" },
  { id: 4, korean: "주세요", chinese: "请给我", pos: "动词表达", sentence_korean: "김치찌개 하나 주세요.", sentence_chinese: "请给我一份泡菜汤。", audio_url: "" },
];

const MODES = [
  { id: "cn2ko", label: "看中文 · 选韩文", desc: "给出中文，选择对应的韩语", prompt: "cn", answer: "ko", listen: false },
  { id: "ko2cn", label: "看韩文 · 选中文", desc: "给出韩语，选择对应的中文", prompt: "ko", answer: "cn", listen: false },
  { id: "listen2cn", label: "听韩文 · 选中文", desc: "听发音，选择对应的中文", prompt: "audio", answer: "cn", listen: true },
  { id: "listen2ko", label: "听韩文 · 选韩文", desc: "听发音，选择对应的韩语", prompt: "audio", answer: "ko", listen: true },
];

/* ── 工具 ── */
function speakKo(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) { /* noop */ }
}
/* 词的发音：有例句音频就播例句，否则浏览器朗读这个词 */
function playWord(word) {
  const ex = (word.examples || []).find((e) => e.audio);
  if (ex && typeof window.playAudio === "function") window.playAudio(ex.audio);
  else if (ex) { try { new Audio(ex.audio).play(); } catch (e) { speakKo(word.ko); } }
  else speakKo(word.ko);
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
async function fetchJson(url) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("请求失败");
  return res.json();
}

/* 后端按 (词 × 例句) 返回多行，这里按词 id 合并成 {id, ko, cn, pos, examples:[...]} */
function groupVocab(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!map.has(r.id)) {
      map.set(r.id, { id: r.id, ko: r.korean, cn: r.chinese, pos: r.pos || "", examples: [] });
    }
    if (r.sentence_korean) {
      map.get(r.id).examples.push({ ko: r.sentence_korean, cn: r.sentence_chinese || "", audio: r.audio_url || "" });
    }
  });
  return Array.from(map.values());
}

const LS = "vocabAppV2";
function loadState() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
function saveState(s) { try { localStorage.setItem(LS, JSON.stringify(s)); } catch (e) { /* noop */ } }

/* ── 图标 ── */
const Svg = (p) => React.createElement("svg", Object.assign({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }, p));
const PlayIcon = () => <Svg fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></Svg>;
const HeartIcon = ({ filled }) => <Svg fill={filled ? "currentColor" : "none"}><path d="M12 20.5C12 20.5 4 16 4 9.8 4 7.1 6 5.5 8.2 5.5c1.6 0 2.9.9 3.8 2.2.9-1.3 2.2-2.2 3.8-2.2C20 5.5 22 7.1 22 9.8 22 16 12 20.5 12 20.5z" /></Svg>;
const ShuffleIcon = () => <Svg><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.6-9.6c.8-1.1 2-1.7 3.3-1.7H22" /><path d="m18 2 4 4-4 4" /><path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l6.6 9.6c.8 1.1 2 1.7 3.3 1.7H22" /><path d="m18 14 4 4-4 4" /></Svg>;
const ArrowLeft = () => <Svg><path d="M15 6l-6 6 6 6" /></Svg>;
const ArrowRight = () => <Svg><path d="M9 6l6 6-6 6" /></Svg>;
const CheckIcon = () => <Svg><path d="M5 12l4 4 10-10" /></Svg>;
const SpeakerIcon = () => <Svg><path d="M11 5L6 9H3v6h3l5 4V5z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" /></Svg>;
const CloseIcon = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>;

/* ── 单词卡工具栏 ── */
function CardTools({ word, isFav, onFav, randomMode, onToggleRandom }) {
  return (
    <div className="flashcard-tools" onClick={(e) => e.stopPropagation()}>
      <button className="vocab-iconbtn" title="播放发音 / 例句" onClick={() => playWord(word)}><PlayIcon /></button>
      <button className={"vocab-iconbtn" + (isFav ? " active" : "")} title="收藏" onClick={onFav}><HeartIcon filled={isFav} /></button>
      <button className={"vocab-iconbtn" + (randomMode ? " active" : "")} title={randomMode ? "顺序：随机切换" : "顺序：按顺序"} onClick={onToggleRandom}><ShuffleIcon /></button>
    </div>
  );
}

/* ── 测验 ── */
function buildQuestions(pool, bank, modes) {
  const words = shuffle(pool).slice(0, Math.min(8, pool.length));
  return words.map((w) => {
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const field = mode.answer;
    const correct = w[field];
    const distract = [];
    const seen = new Set([correct]);
    for (const o of shuffle(bank)) {
      if (!seen.has(o[field])) { seen.add(o[field]); distract.push(o[field]); }
      if (distract.length >= 3) break;
    }
    const options = shuffle([{ text: correct, correct: true }].concat(distract.map((t) => ({ text: t, correct: false }))));
    return { word: w, mode, options };
  });
}

function Quiz({ pool, bank, modes, title, onWrong, onCorrect, reviewMode, onExit }) {
  const questions = useMemo(() => buildQuestions(pool, bank, modes), []);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const q = questions[qi];

  useEffect(() => {
    if (q && q.mode.listen) { const t = setTimeout(() => playWord(q.word), 250); return () => clearTimeout(t); }
  }, [qi]);

  if (questions.length === 0) {
    return <div className="quiz"><div className="vocab-empty">没有可测试的单词。</div><button className="vocab-cta" onClick={onExit}>返回</button></div>;
  }

  if (qi >= questions.length) {
    return (
      <div className="quiz">
        <div className="quiz-result">
          <div className="score">{score}<small> / {questions.length}</small></div>
          <p>{score === questions.length
            ? (reviewMode ? "全部答对！这些单词已移出收藏集。" : "全部答对，太棒了！")
            : (reviewMode ? "答对的单词已移出收藏集，答错的仍保留在集中。" : "答错的单词已加入收藏集，方便复习。")}</p>
          <div className="quiz-result-actions">
            <button className="vocab-switch-btn vocab-cta" onClick={onExit}>完成</button>
          </div>
        </div>
      </div>
    );
  }

  function choose(opt) {
    if (picked) return;
    setPicked(opt);
    if (opt.correct) { setScore((s) => s + 1); if (onCorrect) onCorrect(q.word); }
    else if (onWrong) onWrong(q.word);
  }
  function next() { setPicked(null); setQi((i) => i + 1); }

  const promptIsAudio = q.mode.prompt === "audio";
  const promptText = q.mode.prompt === "cn" ? q.word.cn : q.word.ko;

  return (
    <div className="quiz">
      <div className="quiz-bar">
        <span className="quiz-title">{title} · {q.mode.label}</span>
        <span className="quiz-count">{qi + 1} / {questions.length}</span>
        <button className="quiz-exit" onClick={onExit}>退出</button>
      </div>
      <div className="quiz-track"><i style={{ width: ((qi) / questions.length) * 100 + "%" }} /></div>

      <div className="quiz-prompt">
        <span className="quiz-prompt-label">{promptIsAudio ? "听发音" : (q.mode.prompt === "cn" ? "中文" : "한국어")}</span>
        {promptIsAudio
          ? <button className="quiz-speaker" onClick={() => playWord(q.word)}><SpeakerIcon /></button>
          : <span className="quiz-prompt-text" lang={q.mode.prompt === "ko" ? "ko" : undefined}>{promptText}</span>}
      </div>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let cls = "quiz-option";
          if (picked) {
            if (opt.correct) cls += " correct";
            else if (opt === picked) cls += " wrong";
          }
          return (
            <button key={i} className={cls} disabled={!!picked} lang={q.mode.answer === "ko" ? "ko" : undefined} onClick={() => choose(opt)}>
              {opt.text}
            </button>
          );
        })}
      </div>

      {picked && <button className="vocab-cta" onClick={next}>{qi + 1 >= questions.length ? "查看结果" : "下一题"}</button>}
    </div>
  );
}

/* ── 主应用 ── */
function VocabApp() {
  const saved = loadState();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [anim, setAnim] = useState(false);
  const [view, setView] = useState("study");
  const [favorites, setFavorites] = useState(saved.favorites || {});
  const [wrongs, setWrongs] = useState(saved.wrongs || {});
  const [modeSel, setModeSel] = useState(["ko2cn"]);
  const [randomMode, setRandomMode] = useState(false);
  const [reviewModes, setReviewModes] = useState(["ko2cn"]);
  const [reviewTypes, setReviewTypes] = useState(["fav", "wrong"]);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchJson("/api/vocabulary");
        if (!alive) return;
        setWords(groupVocab(res.data || []));
      } catch (e) {
        if (!alive) return;
        setOffline(true);
        setWords(groupVocab(VOCAB_FALLBACK));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const word = words[index];
  const keyOf = (w) => "v::" + w.id;
  const curKey = word ? keyOf(word) : "";
  const isFav = !!favorites[curKey];

  useEffect(() => { saveState({ favorites, wrongs }); }, [favorites, wrongs]);

  useEffect(() => {
    function onKey(e) {
      const sec = document.getElementById("vocabulary");
      if (!sec || !sec.classList.contains("active")) return;
      if (view !== "study") return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") { e.preventDefault(); flip(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function go(d) {
    setFlipped(false);
    if (words.length < 2) return;
    if (randomMode) {
      let n = index;
      while (n === index) n = Math.floor(Math.random() * words.length);
      setIndex(n);
    } else {
      setIndex((i) => (i + d + words.length) % words.length);
    }
  }
  function toggleRandom() { setRandomMode((r) => !r); }
  function flip() {
    if (anim) return;
    setAnim(true);
    setTimeout(() => setFlipped((f) => !f), 200);
    setTimeout(() => setAnim(false), 420);
  }
  function toggleFav() {
    if (!word) return;
    setFavorites((f) => {
      const n = Object.assign({}, f);
      if (n[curKey]) delete n[curKey];
      else n[curKey] = Object.assign({}, word);
      return n;
    });
  }
  function toggleMode(id) { setModeSel((m) => (m.includes(id) ? m.filter((x) => x !== id) : m.concat(id))); }
  function addWrong(w) { setWrongs((x) => Object.assign({}, x, { [keyOf(w)]: Object.assign({}, w) })); }

  function startTest() {
    if (modeSel.length === 0 || words.length === 0) return;
    const sel = MODES.filter((m) => modeSel.includes(m.id));
    setQuiz({ pool: words, bank: words, modes: sel, title: "测试" });
    setView("quiz");
  }
  function toggleReviewMode(id) { setReviewModes((m) => (m.includes(id) ? m.filter((x) => x !== id) : m.concat(id))); }
  function toggleReviewType(id) { setReviewTypes((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.concat(id))); }
  function reviewPool() {
    return collectItems()
      .filter((it) => (reviewTypes.includes("fav") && it.fav) || (reviewTypes.includes("wrong") && it.wrong))
      .map((it) => Object.assign({}, it.word, { _collectKey: it.key }));
  }
  function startReview() {
    const pool = reviewPool();
    if (pool.length === 0 || reviewModes.length === 0) return;
    const sel = MODES.filter((m) => reviewModes.includes(m.id));
    setQuiz({ pool, bank: pool.length >= 4 ? pool : words, modes: sel, title: "复习测试", removeOnCorrect: true });
    setView("quiz");
  }

  function collectItems() {
    const favKeys = Object.keys(favorites);
    const wrongKeys = Object.keys(wrongs);
    const all = Array.from(new Set(favKeys.concat(wrongKeys)));
    return all.map((k) => ({ key: k, word: favorites[k] || wrongs[k], fav: !!favorites[k], wrong: !!wrongs[k] }));
  }
  function removeCollect(key) {
    setFavorites((f) => { const n = Object.assign({}, f); delete n[key]; return n; });
    setWrongs((w) => { const n = Object.assign({}, w); delete n[key]; return n; });
  }

  const navItems = {
    study: [{ label: "测试模式", onClick: () => setView("test") }, { label: "全部单词", onClick: () => setView("all") }, { label: "收藏集", onClick: () => setView("fav") }],
    test: [{ label: "学习模式", onClick: () => setView("study"), primary: true }, { label: "全部单词", onClick: () => setView("all") }, { label: "收藏集", onClick: () => setView("fav") }],
    all: [{ label: "测试模式", onClick: () => setView("test") }, { label: "返回学习", onClick: () => setView("study"), primary: true }, { label: "收藏集", onClick: () => setView("fav") }],
    fav: [{ label: "测试模式", onClick: () => setView("test") }, { label: "全部单词", onClick: () => setView("all") }, { label: "复习测试", onClick: () => setView("review"), primary: true }],
    review: [{ label: "测试模式", onClick: () => setView("test") }, { label: "全部单词", onClick: () => setView("all") }, { label: "收藏集", onClick: () => setView("fav") }],
  };

  function Switch({ items }) {
    return (
      <div className="vocab-switch">
        {items.map((it, i) => (
          <button key={i} className={(it.active ? "active " : "") + (it.primary ? "primary" : "")} onClick={it.onClick}>{it.label}</button>
        ))}
      </div>
    );
  }

  if (loading) {
    return <div className="vocab"><div className="vocab-empty">正在加载词汇……</div></div>;
  }
  if (words.length === 0) {
    return <div className="vocab"><div className="vocab-empty">还没有词汇，请先到后台管理页新增。</div></div>;
  }

  /* ── 视图 ── */
  if (view === "quiz" && quiz) {
    return (
      <div className="vocab">
        <Quiz pool={quiz.pool} bank={quiz.bank} modes={quiz.modes} title={quiz.title}
          reviewMode={!!quiz.removeOnCorrect}
          onWrong={quiz.removeOnCorrect ? null : addWrong}
          onCorrect={quiz.removeOnCorrect ? (w) => removeCollect(w._collectKey) : null}
          onExit={() => { setQuiz(null); setView(quiz.removeOnCorrect ? "fav" : "study"); }} />
      </div>
    );
  }

  if (view === "study") {
    const ex = (word.examples || [])[0];
    return (
      <div className="vocab">
        {offline && <div className="vocab-offline">未连接到后端，当前显示示例数据。部署到本地服务器后会自动加载真实词汇与例句音频。</div>}
        <div className="flashcard-stage">
          <button className="vocab-arrow" aria-label="上一个" onClick={() => go(-1)}><ArrowLeft /></button>
          <div className={"flashcard" + (anim ? " anim" : "")} onClick={flip}>
            <div className="flashcard-face">
              <CardTools word={word} isFav={isFav} onFav={toggleFav} randomMode={randomMode} onToggleRandom={toggleRandom} />
              {flipped ? (
                <React.Fragment>
                  <div className="flashcard-word back" lang="ko">{word.ko}</div>
                  {word.pos && <div className="flashcard-ro">{word.pos}</div>}
                  <div className="flashcard-mean">{word.cn}</div>
                  {ex && (
                    <div className="flashcard-example">
                      <p lang="ko">{ex.ko}</p>
                      <span>{ex.cn}</span>
                    </div>
                  )}
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className="flashcard-word" lang="ko">{word.ko}</div>
                  <div className="flashcard-hint">点击卡片查看释义</div>
                </React.Fragment>
              )}
            </div>
          </div>
          <button className="vocab-arrow" aria-label="下一个" onClick={() => go(1)}><ArrowRight /></button>
        </div>
        <div className="vocab-progress">{index + 1} / {words.length}</div>
        <Switch items={navItems.study} />
      </div>
    );
  }

  if (view === "test") {
    return (
      <div className="vocab">
        <h3 className="vocab-h">选择测试模式</h3>
        <p className="vocab-sub">可同时选择多种模式，至少选择一种</p>
        <div className="testmode-grid">
          {MODES.map((m) => {
            const sel = modeSel.includes(m.id);
            return (
              <button key={m.id} className={"testmode-card" + (sel ? " selected" : "")} onClick={() => toggleMode(m.id)}>
                <span className="tm-check">{sel ? <CheckIcon /> : null}</span>
                <strong>{m.label}</strong>
                <span className="tm-desc">{m.desc}</span>
              </button>
            );
          })}
        </div>
        <button className="vocab-cta" disabled={modeSel.length === 0} onClick={startTest}>开始测试</button>
        <Switch items={navItems.test} />
      </div>
    );
  }

  if (view === "all") {
    return (
      <div className="vocab">
        <h3 className="vocab-h">全部单词 · {words.length}</h3>
        <div className="wordlist">
          {words.map((w, i) => (
            <button key={w.id} className="wordlist-item" lang="ko" onClick={() => { setIndex(i); setFlipped(false); setView("study"); }}>{w.ko}</button>
          ))}
        </div>
        <Switch items={navItems.all} />
      </div>
    );
  }

  if (view === "review") {
    const items = collectItems();
    const favCount = items.filter((i) => i.fav).length;
    const wrongCount = items.filter((i) => i.wrong).length;
    const poolCount = items.filter((it) => (reviewTypes.includes("fav") && it.fav) || (reviewTypes.includes("wrong") && it.wrong)).length;
    const canStart = reviewModes.length > 0 && reviewTypes.length > 0 && poolCount > 0;
    const TYPES = [
      { id: "fav", label: "收藏", desc: "我主动收藏的单词", count: favCount },
      { id: "wrong", label: "错词", desc: "测试中答错的单词", count: wrongCount },
    ];
    return (
      <div className="vocab">
        <h3 className="vocab-h">复习测试</h3>
        <p className="vocab-sub">选择测试模式与要复习的单词类型</p>
        <div className="review-label">测试模式 · 可多选</div>
        <div className="testmode-grid">
          {MODES.map((m) => {
            const sel = reviewModes.includes(m.id);
            return (
              <button key={m.id} className={"testmode-card" + (sel ? " selected" : "")} onClick={() => toggleReviewMode(m.id)}>
                <span className="tm-check">{sel ? <CheckIcon /> : null}</span>
                <strong>{m.label}</strong>
                <span className="tm-desc">{m.desc}</span>
              </button>
            );
          })}
        </div>
        <div className="review-label">单词类型 · 可多选</div>
        <div className="review-types">
          {TYPES.map((t) => {
            const sel = reviewTypes.includes(t.id);
            return (
              <button key={t.id} className={"testmode-card" + (sel ? " selected" : "")} onClick={() => toggleReviewType(t.id)}>
                <span className="tm-check">{sel ? <CheckIcon /> : null}</span>
                <strong>{t.label} <span className="rt-count">{t.count}</span></strong>
                <span className="tm-desc">{t.desc}</span>
              </button>
            );
          })}
        </div>
        <button className="vocab-cta" disabled={!canStart} onClick={startReview}>
          {poolCount > 0 ? "开始测试 · " + poolCount + " 词" : "暂无可复习的单词"}
        </button>
        <Switch items={navItems.review} />
      </div>
    );
  }

  if (view === "fav") {
    const items = collectItems();
    return (
      <div className="vocab">
        <h3 className="vocab-h">收藏集</h3>
        <p className="vocab-sub">主动收藏的单词，以及测试中答错的单词</p>
        {items.length === 0
          ? <div className="vocab-empty">还没有收藏或错词。<br />在学习卡片上点 ♥ 收藏，或在测试中答错即可加入。</div>
          : (
            <div className="collect-list">
              {items.map((it) => (
                <div key={it.key} className="collect-item">
                  <div className="collect-main"><strong lang="ko">{it.word.ko}</strong><span>{it.word.cn}</span></div>
                  <div className="collect-tags">
                    {it.wrong && <em className="tag-wrong">错词</em>}
                    {it.fav && <em className="tag-fav">收藏</em>}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button className="vocab-iconbtn" title="播放" onClick={() => playWord(it.word)}><PlayIcon /></button>
                    <button className="vocab-iconbtn" title="移除" onClick={() => removeCollect(it.key)}><CloseIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        <Switch items={navItems.fav} />
      </div>
    );
  }

  return null;
}

ReactDOM.createRoot(document.getElementById("vocab-root")).render(<VocabApp />);
