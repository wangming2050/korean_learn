/* global React, ReactDOM */
/* 例句页 — 目录式场景首页 → 左侧情景导航 → 收藏夹
   数据来源仍为 /api/scenes 与 /api/sentences；不接入设计稿独立 Navbar/主题。 */
const { useState: useStateS, useEffect: useEffectS } = React;

const MIN_SCENE_FALLBACK = {
  scenes: [
    { id: 1, name: "学校", en: "Campus" },
    { id: 2, name: "医院", en: "Clinic" },
    { id: 3, name: "交通", en: "Transit" },
    { id: 4, name: "餐厅", en: "Dining" },
    { id: 5, name: "购物", en: "Shopping" },
    { id: 6, name: "住宿", en: "Stay" },
  ],
  sentences: [
    { id: 1, korean: "선생님, 안녕하세요?", chinese: "老师，您好？", situation: "教室问候", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 1 },
    { id: 2, korean: "오늘 수업은 몇 시에 시작해요?", chinese: "今天的课几点开始？", situation: "教室问候", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 1 },
    { id: 3, korean: "목이 아프고 열이 나요.", chinese: "我嗓子疼，而且发烧。", situation: "描述症状", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 2 },
    { id: 4, korean: "지하철역이 어디에 있어요?", chinese: "地铁站在哪里？", situation: "问路", audio_url: "", audio_start: 0, audio_end: 0, scene_id: 3 },
  ],
};

const SCENE_META = {
  学校: { en: "Campus", hue: 258 },
  医院: { en: "Clinic", hue: 152 },
  交通: { en: "Transit", hue: 205 },
  餐厅: { en: "Dining", hue: 28 },
  购物: { en: "Shopping", hue: 320 },
  住宿: { en: "Stay", hue: 88 },
};

const LS_SCENE = "sceneAppV2";
const padScene = (n) => String(n).padStart(2, "0");

let sceneSpeechRunId = 0;

function stopScenePlayback() {
  sceneSpeechRunId += 1;
  const player = document.querySelector("#player");
  if (player) {
    player.pause();
  }
  window.stopKoreanTextPlayback?.();
  try {
    window.speechSynthesis.cancel();
  } catch (e) { /* noop */ }
}

function speakKoScene(text, { loop = false, slow = false, onEnd } = {}) {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  const runId = sceneSpeechRunId;
  const speakOnce = () => {
    if (sceneSpeechRunId !== runId) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = slow ? 0.68 : 0.92;
    const koVoice = window.speechSynthesis.getVoices()
      .find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("ko"));
    if (koVoice) utterance.voice = koVoice;
    utterance.onend = () => {
      if (sceneSpeechRunId !== runId) return;
      if (loop) {
        window.setTimeout(speakOnce, 450);
      } else {
        onEnd?.();
      }
    };
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  window.speechSynthesis.cancel();
  speakOnce();
}

function playLine(line, { loop = false, slow = false, onEnd } = {}) {
  stopScenePlayback();
  if (line.audio && typeof window.playAudio === "function") {
    window.playAudio(line.audio, line.start || 0, line.end || 0, loop, slow);
    return;
  }
  if (line.audio) {
    try {
      const audio = new Audio(line.audio);
      audio.playbackRate = slow ? 0.75 : 1;
      audio.loop = loop;
      audio.onended = () => onEnd?.();
      audio.play();
      return;
    } catch (e) { /* fallback to speech */ }
  }
  if (typeof window.playKoreanText === "function") {
    window.playKoreanText(line.ko, { slow, loop, onEnd });
    return;
  }
  speakKoScene(line.ko, { loop, slow, onEnd });
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("请求失败");
  return res.json();
}

async function loadSeedFallbackRows() {
  const seed = await fetchJson("/static/data/sentences-seed.json");
  const scenes = seed.map((scene) => ({ id: scene.id, name: scene.name, en: scene.en || "Scene" }));
  const sentences = [];
  let sentenceId = 1;
  seed.forEach((scene) => {
    scene.situations.forEach((situation) => {
      situation.sentences.forEach((sentence) => {
        sentences.push({
          id: sentenceId,
          scene_id: scene.id,
          scene_name: scene.name,
          situation: situation.name,
          korean: sentence.korean,
          chinese: sentence.chinese,
          audio_url: sentence.audio_url || "",
          audio_start: sentence.audio_start || 0,
          audio_end: sentence.audio_end || 0,
        });
        sentenceId += 1;
      });
    });
  });
  return { scenes, sentences };
}

function shouldUseSeedRows(sceneRows, sentenceRows, seedRows) {
  return (
    seedRows
    && (
      (sceneRows || []).length < seedRows.scenes.length
      || (sentenceRows || []).length < seedRows.sentences.length
    )
  );
}

function mergeSeedSituations(sentenceRows, seedRows) {
  if (!seedRows) return sentenceRows;
  const situationByText = new Map();
  seedRows.sentences.forEach((sentence) => {
    situationByText.set(`${sentence.scene_id}:${sentence.korean}:${sentence.chinese}`, sentence.situation);
  });
  return sentenceRows.map((sentence) => {
    if (sentence.situation) return sentence;
    const situation = situationByText.get(`${sentence.scene_id}:${sentence.korean}:${sentence.chinese}`);
    return situation ? { ...sentence, situation } : sentence;
  });
}

function loadFavs() {
  try {
    return JSON.parse(localStorage.getItem(LS_SCENE)) || {};
  } catch (e) {
    return {};
  }
}

function saveFavs(favs) {
  try {
    localStorage.setItem(LS_SCENE, JSON.stringify(favs));
  } catch (e) { /* noop */ }
}

function normalizeLine(row, sceneName) {
  return {
    id: String(row.id),
    ko: row.korean,
    cn: row.chinese,
    situation: row.situation || "常用表达",
    sceneId: row.scene_id,
    sceneName: row.scene_name || sceneName || "",
    audio: row.audio_url || "",
    start: Number(row.audio_start) || 0,
    end: Number(row.audio_end) || 0,
  };
}

function buildSceneRows(sceneRows, sentenceRows) {
  const byScene = new Map();
  sceneRows.forEach((scene) => {
    byScene.set(String(scene.id), {
      ...(SCENE_META[scene.name] || { en: "Scene", hue: 258 }),
      ...scene,
      en: scene.en || (SCENE_META[scene.name] || { en: "Scene" }).en,
      situations: [],
      sentenceCount: 0,
    });
  });

  const situationMap = new Map();
  sentenceRows.forEach((row) => {
    const sceneKey = String(row.scene_id);
    const scene = byScene.get(sceneKey);
    if (!scene) return;
    const situationName = row.situation || "常用表达";
    const situationKey = `${sceneKey}:${situationName}`;
    if (!situationMap.has(situationKey)) {
      const situation = { name: situationName, lines: [] };
      situationMap.set(situationKey, situation);
      scene.situations.push(situation);
    }
    situationMap.get(situationKey).lines.push(normalizeLine(row, scene.name));
    scene.sentenceCount += 1;
  });

  return Array.from(byScene.values()).filter((scene) => scene.sentenceCount > 0);
}

const SvgS = (p) => React.createElement("svg", Object.assign({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
}, p));
const PlayIconS = () => <SvgS fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></SvgS>;
const StopIconS = () => <SvgS fill="currentColor" stroke="none"><rect x="7" y="7" width="10" height="10" rx="2" /></SvgS>;
const HeartIconS = ({ filled }) => <SvgS fill={filled ? "currentColor" : "none"}><path d="M12 20.5C12 20.5 4 16 4 9.8 4 7.1 6 5.5 8.2 5.5c1.6 0 2.9.9 3.8 2.2.9-1.3 2.2-2.2 3.8-2.2C20 5.5 22 7.1 22 9.8 22 16 12 20.5 12 20.5z" /></SvgS>;
const BackIconS = () => <SvgS><path d="M15 6l-6 6 6 6" /></SvgS>;
const ChevronIconS = () => <SvgS><path d="M9 6l6 6-6 6" /></SvgS>;
const CheckIconS = () => <SvgS><path d="M5 12l4 4 10-10" /></SvgS>;
const TrashIconS = () => <SvgS><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" /></SvgS>;

function SentenceRow({ line, isFav, isPlaying, onPlay, onFav, onRemove }) {
  return (
    <div className={"scn-line" + (isPlaying ? " playing" : "")}>
      <div className="scn-line-text">
        <p className="scn-line-ko" lang="ko">{line.ko}</p>
        <p className="scn-line-cn">{line.cn}</p>
      </div>
      <div className="scn-line-tools">
        <button className={"scn-iconbtn" + (isPlaying ? " playing" : "")} title={isPlaying ? "停止播放" : "播放发音"} onClick={() => onPlay(line)}>
          {isPlaying ? <StopIconS /> : <PlayIconS />}
        </button>
        <button className={"scn-iconbtn" + (isFav ? " active" : "")} title={isFav ? "取消收藏" : "收藏"} onClick={() => onFav(line)}>
          {onRemove ? <TrashIconS /> : <HeartIconS filled={isFav} />}
        </button>
      </div>
    </div>
  );
}

function SceneDirectory({ scenes, favCount, offline, onPick, onFavs }) {
  const total = scenes.reduce((sum, scene) => sum + scene.sentenceCount, 0);
  return (
    <div className="scn">
      <div className="scn-top">
        <div className="scn-top-title">
          <span className="scn-eyebrow">Sentences</span>
          <h2>选择场景</h2>
          <p>{scenes.length} 个场景 · 共 {total} 个例句</p>
        </div>
        <button className="scn-fav-btn" onClick={onFavs}>
          <HeartIconS filled={false} />
          <span>收藏夹</span>
          {favCount > 0 && <em>{favCount}</em>}
        </button>
      </div>
      {offline && <div className="scn-offline">未连接到后端，当前显示示例数据。</div>}
      {scenes.length === 0 ? (
        <div className="scn-empty">还没有场景，请先到后台管理页新增。</div>
      ) : (
        <div className="scn-dir">
          {scenes.map((scene, index) => (
            <button key={scene.id} className="scn-dir-row" style={{ "--scene-hue": scene.hue }} onClick={() => onPick(scene.id)}>
              <span className="scn-dir-index">{padScene(index + 1)}</span>
              <span className="scn-dir-bar" aria-hidden="true"></span>
              <span className="scn-dir-body">
                <span className="scn-dir-name-line">
                  <span className="scn-dir-name">{scene.name}</span>
                  <span className="scn-dir-en">{scene.en}</span>
                </span>
                <span className="scn-dir-situations">{scene.situations.map((item) => item.name).join("  ·  ")}</span>
              </span>
              <span className="scn-dir-count"><b>{scene.sentenceCount}</b> 句 · {scene.situations.length} 情景</span>
              <span className="scn-dir-chevron"><ChevronIconS /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayOptions({ slow, loop, onSlow, onLoop }) {
  return (
    <div className="scn-playopts">
      <button className={"scn-chip" + (slow ? " on" : "")} onClick={onSlow}>
        <span className="scn-chip-box">{slow ? <CheckIconS /> : null}</span>
        <span>慢速</span>
      </button>
      <button className={"scn-chip" + (loop ? " on" : "")} onClick={onLoop}>
        <span className="scn-chip-box">{loop ? <CheckIconS /> : null}</span>
        <span>单句循环</span>
      </button>
    </div>
  );
}

function SceneDetail({ scene, favs, slow, loop, playingId, onBack, onPlay, onFav, onSlow, onLoop }) {
  const [activeSituation, setActiveSituation] = useStateS(-1);
  useEffectS(() => { setActiveSituation(-1); }, [scene?.id]);
  const shown = activeSituation === -1 ? scene.situations : [scene.situations[activeSituation]];

  return (
    <div className="scn" style={{ "--scene-hue": scene.hue }}>
      <div className="scn-detail-head">
        <button className="scn-back" onClick={onBack}><BackIconS /><span>返回</span></button>
        <div className="scn-detail-title">
          <span className="scn-detail-ko">{scene.name}</span>
          <h2>{scene.sentenceCount} 个例句 · {scene.situations.length} 个情景</h2>
        </div>
        <PlayOptions slow={slow} loop={loop} onSlow={onSlow} onLoop={onLoop} />
      </div>

      <div className="scn-master-detail">
        <aside className="scn-rail">
          <div className="scn-rail-cap">具体情景</div>
          <button className={"scn-rail-item" + (activeSituation === -1 ? " on" : "")} onClick={() => setActiveSituation(-1)}>
            <span className="scn-rail-num">·</span>
            <span className="scn-rail-label">全部</span>
            <span className="scn-rail-count">{scene.sentenceCount}</span>
          </button>
          {scene.situations.map((situation, index) => (
            <button key={situation.name} className={"scn-rail-item" + (activeSituation === index ? " on" : "")} onClick={() => setActiveSituation(index)}>
              <span className="scn-rail-num">{padScene(index + 1)}</span>
              <span className="scn-rail-label">{situation.name}</span>
              <span className="scn-rail-count">{situation.lines.length}</span>
            </button>
          ))}
        </aside>

        <div className="scn-detail-main">
          {shown.map((situation, index) => {
            const realIndex = activeSituation === -1 ? index : activeSituation;
            return (
              <section className="scn-group" key={situation.name}>
                <div className="scn-group-head">
                  <span>{padScene(realIndex + 1)}</span>
                  <h3>{situation.name}</h3>
                  <em>{situation.lines.length} 句</em>
                </div>
                <div className="scn-lines">
                  {situation.lines.map((line) => (
                    <SentenceRow
                      key={line.id}
                      line={line}
                      isFav={!!favs[line.id]}
                      isPlaying={playingId === line.id}
                      onPlay={onPlay}
                      onFav={onFav}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function groupFavoriteLines(items) {
  const sceneMap = new Map();
  items.forEach(([key, line]) => {
    const sceneName = line.sceneName || "未分类场景";
    const situationName = line.situation || "常用表达";
    if (!sceneMap.has(sceneName)) {
      sceneMap.set(sceneName, { name: sceneName, count: 0, situations: new Map() });
    }

    const sceneGroup = sceneMap.get(sceneName);
    sceneGroup.count += 1;
    if (!sceneGroup.situations.has(situationName)) {
      sceneGroup.situations.set(situationName, { name: situationName, lines: [] });
    }
    sceneGroup.situations.get(situationName).lines.push({ key, line });
  });

  return Array.from(sceneMap.values()).map((sceneGroup) => ({
    ...sceneGroup,
    situations: Array.from(sceneGroup.situations.values()),
  }));
}

function FavoriteView({ favs, slow, loop, playingId, onBack, onPlay, onFav, onSlow, onLoop }) {
  const items = Object.entries(favs);
  const groups = groupFavoriteLines(items);
  return (
    <div className="scn">
      <div className="scn-detail-head">
        <button className="scn-back" onClick={onBack}><BackIconS /><span>返回</span></button>
        <div className="scn-detail-title">
          <span className="scn-detail-ko">즐겨찾기</span>
          <h2>收藏夹 · {items.length}</h2>
        </div>
        <PlayOptions slow={slow} loop={loop} onSlow={onSlow} onLoop={onLoop} />
      </div>
      {items.length === 0 ? (
        <div className="scn-empty">还没有收藏的例句。<br />进入场景，点 ♥ 即可把例句加入收藏夹。</div>
      ) : (
        <div className="scn-fav-list">
          {groups.map((sceneGroup) => (
            <section key={sceneGroup.name} className="scn-fav-scene">
              <div className="scn-fav-scene-head">
                <h3>{sceneGroup.name}</h3>
                <span>{sceneGroup.count} 句</span>
              </div>
              {sceneGroup.situations.map((situation) => (
                <section key={`${sceneGroup.name}:${situation.name}`} className="scn-fav-situation">
                  <div className="scn-fav-situation-head">
                    <h4>{situation.name}</h4>
                    <span>{situation.lines.length} 句</span>
                  </div>
                  <div className="scn-fav-items">
                    {situation.lines.map(({ key, line }) => (
                      <div key={key} className="scn-fav-item">
                        <SentenceRow
                          line={line}
                          isFav
                          isPlaying={playingId === line.id}
                          onPlay={onPlay}
                          onFav={onFav}
                          onRemove
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SceneApp() {
  const [view, setView] = useStateS("scenes");
  const [scenes, setScenes] = useStateS([]);
  const [activeId, setActiveId] = useStateS(null);
  const [favs, setFavs] = useStateS(loadFavs());
  const [loading, setLoading] = useStateS(true);
  const [offline, setOffline] = useStateS(false);
  const [slow, setSlow] = useStateS(false);
  const [loop, setLoop] = useStateS(false);
  const [playingId, setPlayingId] = useStateS(null);

  useEffectS(() => { saveFavs(favs); }, [favs]);

  useEffectS(() => {
    let alive = true;
    (async () => {
      try {
        const [sceneResult, sentenceResult, seedRows] = await Promise.all([
          fetchJson("/api/scenes"),
          fetchJson("/api/sentences"),
          loadSeedFallbackRows().catch(() => null),
        ]);
        if (!alive) return;
        const sceneRows = sceneResult.data || [];
        const sentenceRows = sentenceResult.data || [];
        if (shouldUseSeedRows(sceneRows, sentenceRows, seedRows)) {
          setScenes(buildSceneRows(seedRows.scenes, seedRows.sentences));
          return;
        }
        setScenes(buildSceneRows(sceneRows, mergeSeedSituations(sentenceRows, seedRows)));
      } catch (e) {
        if (!alive) return;
        setOffline(true);
        try {
          const fallbackRows = await loadSeedFallbackRows();
          if (!alive) return;
          setScenes(buildSceneRows(fallbackRows.scenes, fallbackRows.sentences));
        } catch (fallbackError) {
          if (!alive) return;
          setScenes(buildSceneRows(MIN_SCENE_FALLBACK.scenes, MIN_SCENE_FALLBACK.sentences));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffectS(() => {
    function resetModule(event) {
      if (event.detail?.page !== "scenes") return;
      stopScenePlayback();
      setView("scenes");
      setActiveId(null);
      setPlayingId(null);
      window.scrollTo(0, 0);
    }
    window.addEventListener("korean-learn:reset-module", resetModule);
    return () => window.removeEventListener("korean-learn:reset-module", resetModule);
  }, []);

  function openScene(id) {
    stopScenePlayback();
    setActiveId(id);
    setPlayingId(null);
    setView("detail");
    window.scrollTo(0, 0);
  }

  function goHome() {
    stopScenePlayback();
    setPlayingId(null);
    setView("scenes");
    setActiveId(null);
    window.scrollTo(0, 0);
  }

  function goFavs() {
    stopScenePlayback();
    setPlayingId(null);
    setView("fav");
    window.scrollTo(0, 0);
  }

  function toggleFav(line) {
    setFavs((current) => {
      const next = { ...current };
      if (next[line.id]) {
        delete next[line.id];
      } else {
        next[line.id] = line;
      }
      return next;
    });
  }

  function handlePlay(line) {
    if (playingId === line.id) {
      stopScenePlayback();
      setPlayingId(null);
      return;
    }
    setPlayingId(line.id);
    playLine(line, {
      slow,
      loop,
      onEnd: () => setPlayingId(null),
    });
  }

  if (loading) {
    return <div className="scn"><div className="scn-empty">正在加载场景……</div></div>;
  }

  const activeScene = scenes.find((scene) => String(scene.id) === String(activeId));
  const favCount = Object.keys(favs).length;

  if (view === "scenes") {
    return <SceneDirectory scenes={scenes} favCount={favCount} offline={offline} onPick={openScene} onFavs={goFavs} />;
  }

  if (view === "detail" && activeScene) {
    return (
      <SceneDetail
        scene={activeScene}
        favs={favs}
        slow={slow}
        loop={loop}
        playingId={playingId}
        onBack={goHome}
        onPlay={handlePlay}
        onFav={toggleFav}
        onSlow={() => setSlow((value) => !value)}
        onLoop={() => setLoop((value) => !value)}
      />
    );
  }

  if (view === "fav") {
    return (
      <FavoriteView
        favs={favs}
        slow={slow}
        loop={loop}
        playingId={playingId}
        onBack={goHome}
        onPlay={handlePlay}
        onFav={toggleFav}
        onSlow={() => setSlow((value) => !value)}
        onLoop={() => setLoop((value) => !value)}
      />
    );
  }

  return null;
}

ReactDOM.createRoot(document.getElementById("scene-root")).render(<SceneApp />);
