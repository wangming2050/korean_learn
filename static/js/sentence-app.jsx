/* global React, ReactDOM */
/* 句子页 — 场景卡（一级） → 场景内例句（二级） → 收藏夹
   数据来源：后端 /api/scenes 与 /api/sentences
   音频：复用 app.js 的 window.playAudio(url, start, end, loop, slow)，按片段播放真实音频 */
const { useState: useStateS, useEffect: useEffectS } = React;

/* ── 离线兜底数据（仅当后端不可用时显示，结构与后端一致） ── */
const SCENE_FALLBACK = {
  scenes: [
    { id: 1, name: "学校" },
    { id: 2, name: "医院" },
    { id: 3, name: "交通" },
    { id: 4, name: "餐厅" },
  ],
  sentences: [
    { id: 1, korean: "선생님, 안녕하세요?", chinese: "老师，您好？", situation: "教室问候", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 1 },
    { id: 2, korean: "숙제는 어디에 내면 돼요?", chinese: "作业交到哪里就可以？", situation: "提交作业", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 1 },
    { id: 3, korean: "목이 아프고 열이 나요.", chinese: "我嗓子疼，而且发烧。", situation: "描述症状", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 2 },
    { id: 4, korean: "지하철역이 어디에 있어요?", chinese: "地铁站在哪里？", situation: "问路", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 3 },
    { id: 5, korean: "비빔밥 하나하고 물 한 잔 주세요.", chinese: "请给我一份拌饭和一杯水。", situation: "点餐", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 4 },
  ],
};

/* ── 工具 ── */
function speakKoScene(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) { /* noop */ }
}

/* 优先播放真实音频片段；没有音频地址时退回浏览器朗读 */
function playLine(line, { loop = false, slow = false } = {}) {
  if (line.audio && typeof window.playAudio === "function") {
    window.playAudio(line.audio, line.start || 0, line.end || 0, loop, slow);
  } else if (line.audio) {
    try {
      const a = new Audio(line.audio);
      a.playbackRate = slow ? 0.75 : 1;
      a.play();
    } catch (e) { speakKoScene(line.ko); }
  } else {
    speakKoScene(line.ko);
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("请求失败");
  return res.json();
}

const LS_SCENE = "sceneAppV2";
function loadFavs() { try { return JSON.parse(localStorage.getItem(LS_SCENE)) || {}; } catch (e) { return {}; } }
function saveFavs(f) { try { localStorage.setItem(LS_SCENE, JSON.stringify(f)); } catch (e) { /* noop */ } }

/* 把后端句子行整理成 {id, ko, cn, audio, start, end} */
function normalizeLine(row) {
  return {
    id: row.id,
    ko: row.korean,
    cn: row.chinese,
    situation: row.situation || "常用表达",
    audio: row.audio_url || "",
    start: Number(row.audio_start) || 0,
    end: Number(row.audio_end) || 0,
  };
}

function groupBySituation(lines) {
  const groups = [];
  const byName = new Map();
  lines.forEach((line) => {
    const name = line.situation || "常用表达";
    if (!byName.has(name)) {
      const group = { name, lines: [] };
      byName.set(name, group);
      groups.push(group);
    }
    byName.get(name).lines.push(line);
  });
  return groups;
}

/* ── 图标 ── */
const SvgS = (p) => React.createElement("svg", Object.assign({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }, p));
const PlayIconS = () => <SvgS fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></SvgS>;
const HeartIconS = ({ filled }) => <SvgS fill={filled ? "currentColor" : "none"}><path d="M12 20.5C12 20.5 4 16 4 9.8 4 7.1 6 5.5 8.2 5.5c1.6 0 2.9.9 3.8 2.2.9-1.3 2.2-2.2 3.8-2.2C20 5.5 22 7.1 22 9.8 22 16 12 20.5 12 20.5z" /></SvgS>;
const BackIconS = () => <SvgS><path d="M15 6l-6 6 6 6" /></SvgS>;
const StarIconS = ({ filled }) => <SvgS fill={filled ? "currentColor" : "none"}><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9z" /></SvgS>;
const TrashIconS = () => <SvgS><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" /></SvgS>;
const CheckIconS = () => <SvgS><path d="M5 12l4 4 10-10" /></SvgS>;

/* ── 例句卡 ── */
function LineCard({ line, isFav, onFav, playOpts }) {
  const [playing, setPlaying] = useStateS(false);
  function play() {
    playLine(line, playOpts);
    setPlaying(true);
    setTimeout(() => setPlaying(false), 900);
  }
  return (
    <div className="scn-line">
      <div className="scn-line-text">
        <p className="scn-line-ko" lang="ko">{line.ko}</p>
        <p className="scn-line-cn">{line.cn}</p>
      </div>
      <div className="scn-line-tools">
        <button className={"scn-iconbtn" + (playing ? " playing" : "")} title="播放发音" onClick={play}><PlayIconS /></button>
        <button className={"scn-iconbtn" + (isFav ? " active" : "")} title={isFav ? "取消收藏" : "收藏"} onClick={onFav}><HeartIconS filled={isFav} /></button>
      </div>
    </div>
  );
}

/* ── 主应用 ── */
function SceneApp() {
  const [view, setView] = useStateS("scenes");   // scenes | detail | fav
  const [scenes, setScenes] = useStateS([]);
  const [byScene, setByScene] = useStateS({});     // scene_id -> [line]
  const [activeId, setActiveId] = useStateS(null);
  const [favs, setFavs] = useStateS(loadFavs());
  const [loading, setLoading] = useStateS(true);
  const [offline, setOffline] = useStateS(false);
  const [slow, setSlow] = useStateS(false);
  const [loop, setLoop] = useStateS(false);

  useEffectS(() => { saveFavs(favs); }, [favs]);

  useEffectS(() => {
    let alive = true;
    (async () => {
      try {
        const [sc, st] = await Promise.all([
          fetchJson("/api/scenes"),
          fetchJson("/api/sentences"),
        ]);
        if (!alive) return;
        ingest(sc.data || [], st.data || []);
      } catch (e) {
        if (!alive) return;
        setOffline(true);
        ingest(SCENE_FALLBACK.scenes, SCENE_FALLBACK.sentences);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffectS(() => {
    function resetModule(event) {
      if (event.detail?.page !== "scenes") return;
      setView("scenes");
      setActiveId(null);
      window.scrollTo(0, 0);
    }
    window.addEventListener("korean-learn:reset-module", resetModule);
    return () => window.removeEventListener("korean-learn:reset-module", resetModule);
  }, []);

  function ingest(sceneRows, sentenceRows) {
    const groups = {};
    sentenceRows.forEach((row) => {
      const sid = row.scene_id;
      (groups[sid] = groups[sid] || []).push(normalizeLine(row));
    });
    setByScene(groups);
    // 只保留有句子的场景，避免空卡片
    setScenes(sceneRows.filter((s) => (groups[s.id] || []).length > 0));
  }

  const playOpts = { slow, loop };
  const scene = scenes.find((s) => s.id === activeId);
  const lines = scene ? (byScene[scene.id] || []) : [];
  const situationGroups = groupBySituation(lines);
  const favCount = Object.keys(favs).length;

  function openScene(id) { setActiveId(id); setView("detail"); window.scrollTo(0, 0); }
  function toggleFav(line, sceneName) {
    const k = String(line.id);
    setFavs((f) => {
      const n = Object.assign({}, f);
      if (n[k]) delete n[k];
      else n[k] = Object.assign({}, line, { sceneName });
      return n;
    });
  }
  function removeFav(k) { setFavs((f) => { const n = Object.assign({}, f); delete n[k]; return n; }); }

  if (loading) {
    return <div className="scn"><div className="scn-empty">正在加载场景……</div></div>;
  }

  /* ── 一级：场景网格 ── */
  if (view === "scenes") {
    return (
      <div className="scn">
        <div className="scn-top">
          <div className="scn-top-title">
            <span className="scn-eyebrow">Scenes</span>
            <h2>选择场景</h2>
          </div>
          <button className="scn-fav-btn" onClick={() => { setView("fav"); window.scrollTo(0, 0); }}>
            <StarIconS filled={false} />
            <span>收藏夹</span>
            {favCount > 0 && <em>{favCount}</em>}
          </button>
        </div>
        {offline && <div className="scn-offline">未连接到后端，当前显示示例数据。部署到本地服务器后会自动加载真实场景与音频。</div>}
        {scenes.length === 0 ? (
          <div className="scn-empty">还没有场景，请先到后台管理页新增。</div>
        ) : (
          <div className="scn-grid">
            {scenes.map((s) => {
              const count = (byScene[s.id] || []).length;
              return (
                <button key={s.id} className="scn-card" onClick={() => openScene(s.id)}>
                  <span className="scn-card-ko">{s.name}</span>
                  <span className="scn-card-meta">{count} 句</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── 二级：场景内例句 ── */
  if (view === "detail" && scene) {
    return (
      <div className="scn">
        <div className="scn-detail-head">
          <button className="scn-back" onClick={() => { setView("scenes"); window.scrollTo(0, 0); }}>
            <BackIconS /><span>返回</span>
          </button>
          <div className="scn-detail-title">
            <span className="scn-detail-ko">{scene.name}</span>
            <h2>{lines.length} 个例句</h2>
          </div>
          <div className="scn-playopts">
            <button className={"scn-chip" + (slow ? " on" : "")} onClick={() => setSlow((v) => !v)}>
              <span className="scn-chip-box">{slow ? <CheckIconS /> : null}</span>慢速
            </button>
            <button className={"scn-chip" + (loop ? " on" : "")} onClick={() => setLoop((v) => !v)}>
              <span className="scn-chip-box">{loop ? <CheckIconS /> : null}</span>单句循环
            </button>
          </div>
        </div>
        <div className="scn-groups">
          {situationGroups.map((group, index) => (
            <section className="scn-group" key={group.name}>
              <div className="scn-group-head">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{group.name}</h3>
              </div>
              <div className="scn-lines">
                {group.lines.map((l) => (
                  <LineCard key={l.id} line={l} playOpts={playOpts}
                    isFav={!!favs[String(l.id)]}
                    onFav={() => toggleFav(l, scene.name + " · " + group.name)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  /* ── 收藏夹 ── */
  if (view === "fav") {
    const items = Object.entries(favs);
    return (
      <div className="scn">
        <div className="scn-detail-head">
          <button className="scn-back" onClick={() => { setView("scenes"); window.scrollTo(0, 0); }}>
            <BackIconS /><span>返回</span>
          </button>
          <div className="scn-detail-title">
            <span className="scn-detail-ko">즐겨찾기</span>
            <h2>收藏夹 · {items.length}</h2>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="scn-empty">还没有收藏的例句。<br />进入场景，点 ♥ 即可把例句加入收藏夹。</div>
        ) : (
          <div className="scn-fav-list">
            {items.map(([k, l]) => (
              <div key={k} className="scn-line scn-fav-item">
                <div className="scn-line-text">
                  {l.sceneName && <span className="scn-fav-tag">{l.sceneName}</span>}
                  <p className="scn-line-ko" lang="ko">{l.ko}</p>
                  <p className="scn-line-cn">{l.cn}</p>
                </div>
                <div className="scn-line-tools">
                  <button className="scn-iconbtn" title="播放发音" onClick={() => playLine(l, playOpts)}><PlayIconS /></button>
                  <button className="scn-iconbtn" title="移出收藏" onClick={() => removeFav(k)}><TrashIconS /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

ReactDOM.createRoot(document.getElementById("scene-root")).render(<SceneApp />);
