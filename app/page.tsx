"use client";

import { useEffect, useMemo, useState } from "react";
import {
  wordCategories,
  words,
  type WordCard,
  type WordCategory,
} from "./words";

type StageType = "normal" | "miniBoss" | "finalBoss";
type LearningMode = "ordered" | "mixed";
type Stage = {
  id: string;
  type: StageType;
  zone: number;
  level?: number;
  title: string;
  subtitle: string;
  words: WordCard[];
  questionCount: number;
  passScore: number;
};
type Progress = {
  current: number;
  completed: string[];
  stars: number;
  scores: Record<string, number>;
};

const zones = [
  { name: "翡翠森林", icon: "🌳", className: "forest", monster: "🕷️" },
  { name: "閃亮河谷", icon: "🌊", className: "river", monster: "🐊" },
  { name: "黃金沙漠", icon: "🏜️", className: "desert", monster: "🦂" },
  { name: "冰晶雪山", icon: "🏔️", className: "snow", monster: "👹" },
  { name: "烈焰火山", icon: "🌋", className: "volcano", monster: "🐲" },
  { name: "黑曜魔王城", icon: "🏰", className: "castle", monster: "👑" },
];

const zoneScenery = [
  ["🌲", "🍄", "🌼", "🪵", "🌳"],
  ["💧", "🐟", "🪷", "🪨", "🌊"],
  ["🌵", "🪨", "☀️", "🐪", "🏺"],
  ["❄️", "🌲", "🧊", "⛄", "🏔️"],
  ["🔥", "🪨", "🌋", "💎", "☁️"],
  ["🕯️", "🦇", "🪦", "⚔️", "🏰"],
];

const windingRoute =
  "M 19 7 C 36 7, 45 16, 61 22 S 84 31, 76 41 S 48 49, 52 59 S 29 68, 22 76 S 43 90, 62 93";

function fixedSample(pool: WordCard[], count: number, seed: number) {
  const result: WordCard[] = [];
  let cursor = seed % pool.length;
  while (result.length < count) {
    const card = pool[cursor % pool.length];
    if (!result.includes(card)) result.push(card);
    cursor += 7;
  }
  return result;
}

function seededShuffle(source: WordCard[]) {
  const shuffled = [...source];
  let seed = 20260717;
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildStages(learningWords: WordCard[]) {
  const result: Stage[] = [];
  for (let level = 1; level <= 30; level++) {
    const zone = Math.floor((level - 1) / 5);
    const stageWords = learningWords.slice((level - 1) * 10, level * 10);
    result.push({
      id: `stage-${level}`,
      type: "normal",
      zone,
      level,
      title: `第 ${level} 關`,
      subtitle: `固定單字 ${stageWords.length} 個`,
      words: stageWords,
      questionCount: 10,
      passScore: 8,
    });
    if (level % 5 === 0 && level < 30) {
      const review = learningWords.slice((level - 5) * 10, level * 10);
      result.push({
        id: `boss-${level / 5}`,
        type: "miniBoss",
        zone,
        title: `第 ${level / 5} 區小魔王`,
        subtitle: "複習前面 5 關",
        words: fixedSample(review, 15, level),
        questionCount: 15,
        passScore: 12,
      });
    }
  }
  result.push({
    id: "final-boss",
    type: "finalBoss",
    zone: 5,
    title: "最終大魔王",
    subtitle: "300 字終極挑戰",
    words: fixedSample(learningWords, 30, 31),
    questionCount: 30,
    passScore: 24,
  });
  return result;
}
const stageSets: Record<LearningMode, Stage[]> = {
  ordered: buildStages(words.slice(0, 300)),
  mixed: buildStages(seededShuffle(words.slice(0, 300))),
};

function selectNaturalVoice(voices: SpeechSynthesisVoice[]) {
  const preferred = [
    "samantha",
    "ava",
    "allison",
    "google us english",
    "microsoft aria",
    "microsoft jenny",
    "serena",
    "karen",
  ];
  const blocked = [
    "eddy",
    "reed",
    "rocko",
    "grandma",
    "grandpa",
    "zarvox",
    "trinoids",
    "whisper",
    "wobble",
  ];
  const english = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith("en") &&
      !blocked.some((name) => v.name.toLowerCase().includes(name)),
  );
  for (const name of preferred) {
    const match = english.find((v) => v.name.toLowerCase().includes(name));
    if (match) return match;
  }
  return (
    english.find((v) => v.lang.toLowerCase() === "en-us" && v.localService) ||
    english.find((v) => v.lang.toLowerCase() === "en-us") ||
    english[0]
  );
}
function speakWord(word: string, retry = false) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  if (!voices.length && !retry) {
    let done = false;
    const play = () => {
      if (done) return;
      done = true;
      synth.removeEventListener("voiceschanged", play);
      speakWord(word, true);
    };
    synth.addEventListener("voiceschanged", play, { once: true });
    window.setTimeout(play, 450);
    return;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.voice = selectNaturalVoice(voices) || null;
  synth.speak(utterance);
}
function WordPicture({ card }: { card: WordCard }) {
  return card.image ? (
    <img className="word-image" src={card.image} alt={card.zh} />
  ) : (
    <span>{card.emoji}</span>
  );
}

export default function Home() {
  const [mode, setMode] = useState<LearningMode>("mixed");
  const [progress, setProgress] = useState<Progress>({
    current: 0,
    completed: [],
    stars: 120,
    scores: {},
  });
  const [active, setActive] = useState<Stage | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [moving, setMoving] = useState(false);
  const [ready, setReady] = useState(false);
  const stages = stageSets[mode];
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem("word-quest-map-mode");
      const selected: LearningMode =
        storedMode === "ordered" ? "ordered" : "mixed";
      setMode(selected);
      const raw =
        localStorage.getItem(`word-quest-map-progress-${selected}`) ||
        (selected === "ordered"
          ? localStorage.getItem("word-quest-map-progress")
          : null);
      if (raw) setProgress(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);
  const saveProgress = (next: Progress) => {
    setProgress(next);
    localStorage.setItem(
      `word-quest-map-progress-${mode}`,
      JSON.stringify(next),
    );
  };
  const switchMode = (nextMode: LearningMode) => {
    if (nextMode === mode) return;
    setActive(null);
    setMoving(false);
    setMode(nextMode);
    localStorage.setItem("word-quest-map-mode", nextMode);
    try {
      const raw =
        localStorage.getItem(`word-quest-map-progress-${nextMode}`) ||
        (nextMode === "ordered"
          ? localStorage.getItem("word-quest-map-progress")
          : null);
      setProgress(
        raw
          ? JSON.parse(raw)
          : { current: 0, completed: [], stars: 120, scores: {} },
      );
    } catch {
      setProgress({ current: 0, completed: [], stars: 120, scores: {} });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const completeStage = (score: number) => {
    if (!active) return;
    const index = stages.findIndex((stage) => stage.id === active.id);
    const firstClear = !progress.completed.includes(active.id);
    const completed = firstClear
      ? [...progress.completed, active.id]
      : progress.completed;
    const nextIndex = Math.max(
      progress.current,
      Math.min(index + 1, stages.length - 1),
    );
    const next = {
      ...progress,
      current: nextIndex,
      completed,
      stars: progress.stars + (firstClear ? score * 2 : score),
      scores: {
        ...progress.scores,
        [active.id]: Math.max(score, progress.scores[active.id] || 0),
      },
    };
    setActive(null);
    setMoving(true);
    window.setTimeout(() => {
      saveProgress(next);
      setMoving(false);
      document
        .querySelector(`[data-stage="${stages[nextIndex]?.id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 1450);
  };
  const reset = () => {
    if (window.confirm("確定要重新開始冒險嗎？所有通關紀錄會清除。")) {
      const next = { current: 0, completed: [], stars: 120, scores: {} };
      saveProgress(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  if (!ready) return <main className="loading-map">🧭 正在展開冒險地圖…</main>;
  return (
    <main className="adventure-app">
      <header className="map-header">
        <div className="brand">
          <span>🧭</span>
          <div>
            <b>Word Quest</b>
            <small>英文大富翁冒險</small>
          </div>
        </div>
        <div className="map-actions">
          <button onClick={() => setShowLibrary(true)}>
            📚 單字圖鑑 <small>{words.length}</small>
          </button>
          <div className="star-pill">⭐ {progress.stars}</div>
          <button className="reset-button" onClick={reset} title="重新開始">
            ↻
          </button>
        </div>
      </header>
      <section className="map-hero">
        <div>
          <span className="map-kicker">
            30 STAGES・5 MINI BOSSES・1 FINAL BOSS
          </span>
          <h1>踏上英文尋寶之旅！</h1>
          <p>每關固定學習 10 個單字，通過挑戰才能前往下一站。</p>
          <div className="mode-switch" role="group" aria-label="單字排列方式">
            <span>單字路線</span>
            <button
              className={mode === "mixed" ? "active" : ""}
              onClick={() => switchMode("mixed")}
            >
              🔀 混合模式<small>各類單字打散</small>
            </button>
            <button
              className={mode === "ordered" ? "active" : ""}
              onClick={() => switchMode("ordered")}
            >
              🗂️ 主題順序<small>依分類學習</small>
            </button>
          </div>
        </div>
        <div className="journey-status">
          <span>目前位置・{mode === "mixed" ? "混合模式" : "主題順序"}</span>
          <b>{stages[progress.current]?.title}</b>
          <div>
            <i
              style={{
                width: `${Math.round((progress.completed.length / stages.length) * 100)}%`,
              }}
            />
          </div>
          <small>
            {progress.completed.length} / {stages.length} 關完成
          </small>
        </div>
      </section>
      <section className="world-map">
        {zones.map((zone, zoneIndex) => {
          const zoneStages = stages.filter((stage) => stage.zone === zoneIndex);
          return (
            <section className={`zone ${zone.className}`} key={zone.name}>
              <header>
                <span>{zone.icon}</span>
                <div>
                  <small>WORLD {zoneIndex + 1}</small>
                  <h2>{zone.name}</h2>
                </div>
              </header>
              <div
                className={`map-path ${zoneIndex % 2 === 1 ? "route-reverse" : ""}`}
              >
                <svg
                  className="winding-route"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path className="route-shadow" d={windingRoute} />
                  <path className="route-road" d={windingRoute} />
                  <path className="route-dashes" d={windingRoute} />
                </svg>
                <div className="map-scenery" aria-hidden="true">
                  {zoneScenery[zoneIndex].map((item, sceneryIndex) => (
                    <span
                      className={`scenery scenery-${sceneryIndex}`}
                      key={`${item}-${sceneryIndex}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {zoneStages.map((stage, localIndex) => {
                  const index = stages.findIndex(
                    (item) => item.id === stage.id,
                  );
                  const unlocked = index <= progress.current;
                  const completed = progress.completed.includes(stage.id);
                  const current = index === progress.current;
                  return (
                    <div
                      className={`stage-stop bend-${localIndex} ${stage.type} ${completed ? "completed" : ""} ${current ? "current" : ""} ${!unlocked ? "locked" : ""}`}
                      key={stage.id}
                      data-stage={stage.id}
                    >
                      <div className="trail-segment" />
                      <button
                        disabled={!unlocked}
                        onClick={() => setActive(stage)}
                        aria-label={`${stage.title} ${unlocked ? "可挑戰" : "尚未解鎖"}`}
                      >
                        <span className="node-icon">
                          {stage.type === "normal"
                            ? completed
                              ? "✓"
                              : stage.level
                            : stage.type === "miniBoss"
                              ? zone.monster
                              : "🐉"}
                        </span>
                        <span className="node-copy">
                          <b>{stage.title}</b>
                          <small>
                            {completed
                              ? `最佳 ${progress.scores[stage.id]}/${stage.questionCount}`
                              : stage.subtitle}
                          </small>
                        </span>
                        {!unlocked && <i>🔒</i>}
                      </button>
                      {current && (
                        <div
                          className={`map-avatar ${moving ? "walking" : ""}`}
                        >
                          <span>🧑‍🚀</span>
                          <small>{moving ? "前進中！" : "我在這裡"}</small>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>
      {moving && (
        <div className="moving-toast">
          <span>🚶</span>
          <b>挑戰成功！前往下一關…</b>
        </div>
      )}
      {active && (
        <StageGame
          key={active.id}
          stage={active}
          onClose={() => setActive(null)}
          onPass={completeStage}
        />
      )}
      {showLibrary && <WordLibrary onClose={() => setShowLibrary(false)} />}
    </main>
  );
}

function StageGame({
  stage,
  onClose,
  onPass,
}: {
  stage: Stage;
  onClose: () => void;
  onPass: (score: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const current = stage.words[step];
  const passed = score >= stage.passScore;
  const choices = useMemo(() => {
    const pool = words.filter((card) => card.word !== current.word);
    const distractors = [
      pool[(step * 11 + 3) % pool.length],
      pool[(step * 17 + 9) % pool.length],
    ];
    return [current, ...distractors].sort(
      (a, b) =>
        ((a.word.charCodeAt(0) + step) % 7) -
        ((b.word.charCodeAt(0) + step) % 7),
    );
  }, [current, step]);
  const choose = (word: string) => {
    if (picked) return;
    setPicked(word);
    const correct = word === current.word;
    if (correct) setScore((value) => value + 1);
    window.setTimeout(() => {
      if (step === stage.questionCount - 1) setFinished(true);
      else {
        setStep((value) => value + 1);
        setPicked(null);
      }
    }, 750);
  };
  const retry = () => {
    setStep(0);
    setScore(0);
    setPicked(null);
    setFinished(false);
  };
  return (
    <div
      className="game-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={stage.title}
    >
      <section className={`stage-game ${stage.type}`}>
        <button className="close-game" onClick={onClose}>
          ×
        </button>
        {finished ? (
          <div className={`stage-result ${passed ? "win" : "lose"}`}>
            <div className="result-character">
              {passed ? (stage.type === "normal" ? "🏆" : "⚔️") : "💪"}
            </div>
            <span>{passed ? "STAGE CLEAR!" : "TRY AGAIN!"}</span>
            <h2>{passed ? "挑戰成功！" : "差一點就成功！"}</h2>
            <p>
              答對 <b>{score}</b> / {stage.questionCount} 題・通過需要{" "}
              {stage.passScore} 題
            </p>
            <div className="result-stars">
              {"⭐".repeat(
                Math.max(1, Math.ceil((score / stage.questionCount) * 3)),
              )}
            </div>
            {passed ? (
              <button className="next-stage" onClick={() => onPass(score)}>
                前進下一個節點 →
              </button>
            ) : (
              <div className="retry-actions">
                <button onClick={retry}>再挑戰一次</button>
                <button onClick={onClose}>回到地圖</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <header className="game-title">
              <div>
                <span>
                  {stage.type === "normal"
                    ? "WORD CHALLENGE"
                    : stage.type === "miniBoss"
                      ? "MINI BOSS"
                      : "FINAL BOSS"}
                </span>
                <h2>{stage.title}</h2>
              </div>
              <div>
                <b>
                  {step + 1}/{stage.questionCount}
                </b>
                <small>答對 {score} 題</small>
              </div>
            </header>
            <div className="quiz-progress">
              <i
                style={{
                  width: `${((step + 1) / stage.questionCount) * 100}%`,
                }}
              />
            </div>
            <div className="quiz-card">
              <button
                className="quiz-picture"
                onClick={() => speakWord(current.word)}
                aria-label={`播放 ${current.word} 發音`}
              >
                <WordPicture card={current} />
                <i>🔊</i>
              </button>
              <p>這張圖的英文是什麼？需要時可點圖片上的 🔊 聽發音。</p>
              <div className="quiz-answers">
                {choices.map((card) => (
                  <button
                    key={card.word}
                    className={
                      picked
                        ? card.word === current.word
                          ? "correct"
                          : card.word === picked
                            ? "wrong"
                            : "muted"
                        : ""
                    }
                    onClick={() => choose(card.word)}
                  >
                    {card.word}
                    <small>
                      {picked && card.word === current.word
                        ? card.zh
                        : "選擇答案"}
                    </small>
                  </button>
                ))}
              </div>
            </div>
            <footer>
              本關固定範圍：
              {stage.words
                .slice(0, 10)
                .map((card) => card.word)
                .join("・")}
              {stage.words.length > 10 ? "…" : ""}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function WordLibrary({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | WordCategory>("all");
  const filtered = useMemo(() => {
    const key = search.trim().toLowerCase();
    return words.filter(
      (card) =>
        (category === "all" || card.category === category) &&
        (!key ||
          card.word.toLowerCase().includes(key) ||
          card.zh.includes(key)),
    );
  }, [search, category]);
  return (
    <div
      className="library-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="單字圖鑑"
    >
      <section className="library-panel">
        <header>
          <div>
            <span>MY WORD BOOK</span>
            <h2>📚 單字圖鑑</h2>
            <p>{words.length} 個核心單字・點圖卡聽發音</p>
          </div>
          <button onClick={onClose}>×</button>
        </header>
        <div className="library-tools">
          <label>
            🔎
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋英文或中文…"
              aria-label="搜尋單字"
            />
          </label>
          <div>
            <button
              className={category === "all" ? "active" : ""}
              onClick={() => setCategory("all")}
            >
              全部
            </button>
            {wordCategories.map((item) => (
              <button
                key={item.id}
                className={category === item.id ? "active" : ""}
                onClick={() => setCategory(item.id)}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
        <p className="word-count">找到 {filtered.length} 個單字</p>
        <div className="word-grid">
          {filtered.map((card) => (
            <button key={card.word} onClick={() => speakWord(card.word)}>
              <div>
                <WordPicture card={card} />
                <i>🔊</i>
              </div>
              <b>{card.word}</b>
              <span>{card.zh}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
