// 例句 · 方案B — 目录式首页 + 左侧情景导航栏（主从布局）
const { useState, useEffect, useRef, useCallback } = React;

const FAV_KEY = "sent_favs_v1";       // 与方案A 共用收藏
const THEME_KEY = "sent_theme_v1";    // 与方案A 共用主题
const pad = (n) => String(n).padStart(2, "0");

const IPlay = () => <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>;
const IStop = () => <svg viewBox="0 0 24 24" style={{ fill: "currentColor", stroke: "none" }}><rect x="7" y="7" width="10" height="10" rx="2"></rect></svg>;
const IHeart = () => <svg viewBox="0 0 24 24"><path d="M12 20.5l-1.4-1.3C5.4 14.5 2.5 11.9 2.5 8.7 2.5 6.2 4.4 4.3 6.9 4.3c1.5 0 2.9.7 3.8 1.8l1.3 1.5 1.3-1.5c.9-1.1 2.3-1.8 3.8-1.8 2.5 0 4.4 1.9 4.4 4.4 0 3.2-2.9 5.8-8.1 10.5L12 20.5z"></path></svg>;
const IBack = () => <svg viewBox="0 0 24 24" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M15 6l-6 6 6 6"></path></svg>;
const IChev = () => <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"></path></svg>;
const ISun = () => <svg viewBox="0 0 24 24" style={{ fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" }}><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"></path></svg>;
const IMoon = () => <svg viewBox="0 0 24 24" style={{ fill: "currentColor", stroke: "none" }}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"></path></svg>;

function Navbar({ theme, onToggleTheme }) {
  const links = ["首页", "音标", "词汇", "例句", "教材"];
  return (
    <nav className="nav">
      <div className="nav-logo"><span className="a">한</span><span className="b">步</span></div>
      <div className="nav-links">
        {links.map((l) => (
          <button key={l} className={"nav-link" + (l === "例句" ? " active" : "")}>{l}</button>
        ))}
      </div>
      <button className="nav-theme" onClick={onToggleTheme} aria-label="切换主题">
        {theme === "dark" ? <ISun /> : <IMoon />}
      </button>
    </nav>
  );
}

function SentenceRow({ item, isFav, isPlaying, onPlay, onFav }) {
  return (
    <div className={"sent-row" + (isPlaying ? " playing" : "")}>
      <div className="txt">
        <div className="ko" lang="ko">{item.ko}</div>
        <div className="cn">{item.cn}</div>
      </div>
      <div className="acts">
        <button className="icon-btn play" onClick={() => onPlay(item)} aria-label="播放">
          {isPlaying ? <IStop /> : <IPlay />}
        </button>
        <button className={"icon-btn fav" + (isFav ? " on" : "")} onClick={() => onFav(item.id)} aria-label="收藏">
          <IHeart />
        </button>
      </div>
    </div>
  );
}

// ── 目录式首页 ──
function DirHome({ scenes, favCount, onPick, onFavs }) {
  const total = scenes.reduce((n, s) => n + s.sentenceCount, 0);
  return (
    <div className="wrap">
      <header className="sc-head">
        <div className="titles">
          <div className="sc-eyebrow">例句 · Sentences</div>
          <h1 className="sc-title">选择场景</h1>
          <div className="sc-sub">{scenes.length} 个场景 · 共 {total} 个例句，按真实情景学说话</div>
        </div>
        <button className="fav-btn" onClick={onFavs}>
          <IHeart /> 收藏夹 <span className="cnt">{favCount}</span>
        </button>
      </header>
      <div className="dir">
        {scenes.map((sc, i) => (
          <button key={sc.id} className="dir-row" style={{ "--h": sc.hue }} onClick={() => onPick(sc)}>
            <span className="idx">{pad(i + 1)}</span>
            <span className="bar"></span>
            <span className="body">
              <span className="name-line">
                <span className="name">{sc.name}</span>
                <span className="en">{sc.en}</span>
              </span>
              <span className="sits">{sc.situations.map((s) => s.name).join("  ·  ")}</span>
            </span>
            <span className="count"><b>{sc.sentenceCount}</b> 句 · {sc.situations.length} 情景</span>
            <span className="chev"><IChev /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 主从详情：左侧情景栏 ──
function MasterDetail({ scene, favs, slow, loop, onSlow, onLoop, onBack, playingId, onPlay, onFav }) {
  const [active, setActive] = useState(-1); // -1 = 全部
  useEffect(() => { setActive(-1); }, [scene]);
  const shown = active === -1 ? scene.situations : [scene.situations[active]];
  return (
    <div className="wrap" style={{ "--h": scene.hue }}>
      <div className="sd-top">
        <button className="back-btn" onClick={onBack}><IBack /> 返回</button>
        <div className="sd-id">
          <span className="dot"></span>
          <span className="name">{scene.name}</span>
          <span className="cnt">{scene.sentenceCount} 个例句 · {scene.situations.length} 个情景</span>
        </div>
        <div className="sd-controls">
          <button className={"pill" + (slow ? " on" : "")} onClick={onSlow}><span className="box"></span><span className="lbl">慢速</span></button>
          <button className={"pill" + (loop ? " on" : "")} onClick={onLoop}><span className="box"></span><span className="lbl">单句循环</span></button>
        </div>
      </div>

      <div className="md">
        <aside className="md-rail">
          <div className="rail-cap">具体情景</div>
          <button className={"rail-item" + (active === -1 ? " on" : "")} onClick={() => setActive(-1)}>
            <span className="rnum">·</span>
            <span className="rlabel">全部</span>
            <span className="rn">{scene.sentenceCount}</span>
          </button>
          {scene.situations.map((sit, si) => (
            <button key={sit.name} className={"rail-item" + (active === si ? " on" : "")} onClick={() => setActive(si)}>
              <span className="rnum">{pad(si + 1)}</span>
              <span className="rlabel">{sit.name}</span>
              <span className="rn">{sit.items.length}</span>
            </button>
          ))}
        </aside>

        <div className="md-main">
          {shown.map((sit, idx) => {
            const realIndex = active === -1 ? idx : active;
            return (
              <section className="sit" key={sit.name}>
                <div className="sit-head">
                  <span className="num">{pad(realIndex + 1)}</span>
                  <span className="label">{sit.name}</span>
                  <span className="n">{sit.items.length} 句</span>
                </div>
                <div className="sit-list">
                  {sit.items.map((it) => (
                    <SentenceRow key={it.id} item={it} isFav={favs.has(it.id)} isPlaying={playingId === it.id} onPlay={onPlay} onFav={onFav} />
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

// ── 收藏夹 ──
function FavView({ scenes, favs, slow, loop, onSlow, onLoop, onBack, playingId, onPlay, onFav }) {
  const byScene = {};
  scenes.forEach((sc) => sc.situations.forEach((sit) => sit.items.forEach((it) => {
    if (favs.has(it.id)) (byScene[it.sceneName] = byScene[it.sceneName] || []).push(it);
  })));
  const names = Object.keys(byScene);
  const total = names.reduce((n, k) => n + byScene[k].length, 0);
  return (
    <div className="wrap">
      <div className="sd-top">
        <button className="back-btn" onClick={onBack}><IBack /> 返回</button>
        <div className="sd-id"><span className="name">收藏夹</span><span className="cnt">{total} 个例句</span></div>
        <div className="sd-controls">
          <button className={"pill" + (slow ? " on" : "")} onClick={onSlow}><span className="box"></span><span className="lbl">慢速</span></button>
          <button className={"pill" + (loop ? " on" : "")} onClick={onLoop}><span className="box"></span><span className="lbl">单句循环</span></button>
        </div>
      </div>
      {total === 0 ? (
        <div className="empty">
          <div className="big">还没有收藏的例句</div>
          <div className="sm">在任意场景里点击 ♥ 把句子加入收藏夹</div>
        </div>
      ) : names.map((name, si) => {
        const hue = scenes.find((s) => s.name === name).hue;
        return (
          <section className="sit" key={name} style={{ "--h": hue }}>
            <div className="sit-head">
              <span className="num">{pad(si + 1)}</span>
              <span className="label">{name}</span>
              <span className="n">{byScene[name].length} 句</span>
            </div>
            <div className="sit-list">
              {byScene[name].map((it) => (
                <SentenceRow key={it.id} item={it} isFav={true} isPlaying={playingId === it.id} onPlay={onPlay} onFav={onFav} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function App() {
  const scenes = window.SENT_SCENES;
  const [view, setView] = useState("home");
  const [scene, setScene] = useState(null);
  const [favs, setFavs] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch { return new Set(); } });
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [slow, setSlow] = useState(false);
  const [loop, setLoop] = useState(false);
  const [playingId, setPlayingId] = useState(null);

  const loopRef = useRef(loop), slowRef = useRef(slow);
  useEffect(() => { loopRef.current = loop; }, [loop]);
  useEffect(() => { slowRef.current = slow; }, [slow]);
  useEffect(() => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch {} }, [favs]);
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);

  const stopSpeak = useCallback(() => { if (window.speechSynthesis) window.speechSynthesis.cancel(); setPlayingId(null); }, []);
  const speak = useCallback((item) => {
    if (!window.speechSynthesis) { setPlayingId(item.id); setTimeout(() => setPlayingId(null), 1200); return; }
    window.speechSynthesis.cancel();
    const say = () => {
      const u = new SpeechSynthesisUtterance(item.ko);
      u.lang = "ko-KR"; u.rate = slowRef.current ? 0.6 : 0.95;
      const ko = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("ko"));
      if (ko) u.voice = ko;
      u.onend = () => { if (loopRef.current) setTimeout(() => { if (loopRef.current) say(); }, 500); else setPlayingId(null); };
      u.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(u);
    };
    setPlayingId(item.id); say();
  }, []);
  const onPlay = useCallback((item) => { if (playingId === item.id) { stopSpeak(); return; } speak(item); }, [playingId, speak, stopSpeak]);
  const onFav = useCallback((id) => { setFavs((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }, []);

  const goHome = () => { stopSpeak(); setView("home"); setScene(null); };
  const pickScene = (sc) => { stopSpeak(); setScene(sc); setView("scene"); window.scrollTo(0, 0); };
  const goFavs = () => { stopSpeak(); setView("favs"); window.scrollTo(0, 0); };

  return (
    <div className={"sent-app" + (theme === "dark" ? " dark" : "")}>
      <Navbar theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
      {view === "home" && <DirHome scenes={scenes} favCount={favs.size} onPick={pickScene} onFavs={goFavs} />}
      {view === "scene" && scene && (
        <MasterDetail scene={scene} favs={favs} slow={slow} loop={loop}
          onSlow={() => setSlow((s) => !s)} onLoop={() => setLoop((s) => !s)}
          onBack={goHome} playingId={playingId} onPlay={onPlay} onFav={onFav} />
      )}
      {view === "favs" && (
        <FavView scenes={scenes} favs={favs} slow={slow} loop={loop}
          onSlow={() => setSlow((s) => !s)} onLoop={() => setLoop((s) => !s)}
          onBack={goHome} playingId={playingId} onPlay={onPlay} onFav={onFav} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
