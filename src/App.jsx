import { useEffect, useMemo, useReducer, useState } from "react";
import { ORDERED_QUESTIONS, QUESTIONS } from "./questions";
import { score } from "./scoring";
import { DIMENSION_BLURBS, TYPES } from "./types";

const STORAGE_KEY = "codex-mbti-h5-progress";
const HISTORY_KEY = "codex-mbti-h5-history";
const SCALE = [
  "非常不同意",
  "不同意",
  "有点不同意",
  "不确定",
  "有点同意",
  "同意",
  "非常同意"
];

const DIMENSION_META = {
  EI: { label: "能量来源", left: "E 外向", right: "I 内向" },
  SN: { label: "信息获取", left: "S 实感", right: "N 直觉" },
  TF: { label: "决策方式", left: "T 思考", right: "F 情感" },
  JP: { label: "生活方式", left: "J 判断", right: "P 知觉" }
};

const initialState = {
  view: "home",
  currentIndex: 0,
  answers: {},
  resultRecord: null
};

function reducer(state, action) {
  switch (action.type) {
    case "START":
      return { ...initialState, view: "quiz" };
    case "RESTORE":
      return { ...initialState, ...action.payload, view: "quiz" };
    case "ANSWER": {
      const answers = { ...state.answers, [action.questionId]: action.value };
      const answeredCount = Object.keys(answers).length;
      const isComplete = answeredCount === QUESTIONS.length;
      return {
        ...state,
        view: isComplete ? "profile" : "quiz",
        currentIndex: isComplete ? state.currentIndex : Math.min(state.currentIndex + 1, ORDERED_QUESTIONS.length - 1),
        answers
      };
    }
    case "PREV":
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };
    case "NEXT":
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, ORDERED_QUESTIONS.length - 1) };
    case "RESULT":
      return { ...state, view: "profile" };
    case "BACK_TO_QUIZ":
      return { ...state, view: "quiz", currentIndex: ORDERED_QUESTIONS.length - 1 };
    case "SUBMITTED":
      return { ...state, view: "result", resultRecord: action.record };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }
}

function clearStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage may be unavailable in private browsing modes.
  }
}

function getShareUrl(id) {
  if (!id) return "";
  return `${window.location.origin}${window.location.pathname}?result=${encodeURIComponent(id)}`;
}

async function readApiPayload(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      error: response.ok ? "后台响应格式错误。" : `后台接口异常（HTTP ${response.status}）。`
    };
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [savedProgress, setSavedProgress] = useState(() => readStorage(STORAGE_KEY, null));
  const [history, setHistory] = useState(() => readStorage(HISTORY_KEY, []));
  const [sharedResult, setSharedResult] = useState({ loading: false, error: "", record: null });

  const answeredCount = Object.keys(state.answers).length;
  const canShowResult = answeredCount === QUESTIONS.length;
  const result = useMemo(() => (canShowResult ? score(state.answers) : null), [canShowResult, state.answers]);

  useEffect(() => {
    const sharedId = new URLSearchParams(window.location.search).get("result");
    if (!sharedId) return;

    let active = true;
    setSharedResult({ loading: true, error: "", record: null });

    fetch(`/api/results?id=${encodeURIComponent(sharedId)}`)
      .then(async (response) => {
        const payload = await readApiPayload(response);
        if (!response.ok) throw new Error(payload.error || "分享结果读取失败。");
        return payload.record;
      })
      .then((record) => {
        if (active) setSharedResult({ loading: false, error: "", record });
      })
      .catch((error) => {
        if (active) setSharedResult({ loading: false, error: error.message, record: null });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.view === "quiz" && answeredCount > 0) {
      const payload = {
        currentIndex: state.currentIndex,
        answers: state.answers,
        updatedAt: Date.now()
      };
      writeStorage(STORAGE_KEY, payload);
      setSavedProgress(payload);
    }

    if (state.view === "profile" || state.view === "result") {
      clearStorage(STORAGE_KEY);
      setSavedProgress(null);
    }
  }, [answeredCount, state.answers, state.currentIndex, state.view]);

  function startFresh() {
    clearStorage(STORAGE_KEY);
    window.history.replaceState({}, "", window.location.pathname);
    setSavedProgress(null);
    setSharedResult({ loading: false, error: "", record: null });
    dispatch({ type: "START" });
  }

  function restoreProgress() {
    if (!savedProgress) return;
    setSharedResult({ loading: false, error: "", record: null });
    dispatch({ type: "RESTORE", payload: savedProgress });
  }

  function saveHistory(record) {
    const entry = {
      ...record.result,
      id: record.id,
      nickname: record.profile.nickname,
      savedAt: Date.now()
    };
    const nextHistory = [entry, ...history].slice(0, 5);
    writeStorage(HISTORY_KEY, nextHistory);
    setHistory(nextHistory);
  }

  async function submitProfile(profile) {
    if (!result) throw new Error("测试结果尚未生成。");

    const response = await fetch("/api/results", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        profile,
        answers: state.answers,
        result
      })
    });

    const payload = await readApiPayload(response);
    if (!response.ok) throw new Error(payload.error || "提交失败，请稍后重试。");

    saveHistory(payload.record);
    window.history.replaceState({}, "", `?result=${encodeURIComponent(payload.id)}`);
    dispatch({ type: "SUBMITTED", record: payload.record });
  }

  const sharedRecord = sharedResult.record;
  if (sharedResult.loading) {
    return (
      <main className="app-shell">
        <LoadingScreen />
      </main>
    );
  }

  if (sharedResult.error) {
    return (
      <main className="app-shell">
        <ErrorScreen error={sharedResult.error} onStart={startFresh} />
      </main>
    );
  }

  if (sharedRecord) {
    return (
      <main className="app-shell">
        <ResultScreen
          history={history}
          isShared
          onReset={startFresh}
          record={sharedRecord}
          result={sharedRecord.result}
          shareUrl={getShareUrl(sharedRecord.id)}
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      {state.view === "home" && (
        <HomeScreen
          history={history}
          onRestore={restoreProgress}
          onStart={startFresh}
          savedProgress={savedProgress}
        />
      )}
      {state.view === "quiz" && (
        <QuizScreen
          answers={state.answers}
          currentIndex={state.currentIndex}
          dispatch={dispatch}
        />
      )}
      {state.view === "profile" && result && (
        <ProfileScreen
          onBack={() => dispatch({ type: "BACK_TO_QUIZ" })}
          onSubmit={submitProfile}
          result={result}
        />
      )}
      {state.view === "result" && result && state.resultRecord && (
        <ResultScreen
          history={history}
          onReset={startFresh}
          record={state.resultRecord}
          result={result}
          shareUrl={getShareUrl(state.resultRecord.id)}
        />
      )}
    </main>
  );
}

function HomeScreen({ history, onRestore, onStart, savedProgress }) {
  const progressCount = savedProgress ? Object.keys(savedProgress.answers ?? {}).length : 0;

  return (
    <section className="screen home-screen">
      <div className="hero-mark">MBTI</div>
      <p className="eyebrow">36 题 · 7 级量表 · 四维度独立计分</p>
      <h1>找到你更自然的性格倾向</h1>
      <p className="intro">
        根据真实生活情境作答，无对错之分。测试约 5-7 分钟，提交昵称和手机号后可生成可转发结果链接与分享海报。
      </p>

      <div className="home-actions">
        <button className="primary-button" type="button" onClick={onStart}>
          开始测试
        </button>
        {savedProgress && (
          <button className="secondary-button" type="button" onClick={onRestore}>
            继续上次测试（{progressCount}/36）
          </button>
        )}
      </div>

      <div className="info-grid" aria-label="测试设计说明">
        <InfoCard value="36" label="题以内题量" />
        <InfoCard value="4x9" label="四维度均衡" />
        <InfoCard value="7" label="级李克特量表" />
      </div>

      {history.length > 0 && (
        <div className="history-strip">
          <span>最近保存</span>
          <strong>{history[0].type}</strong>
          <small>{history[0].nickname ? `${history[0].nickname} · ` : ""}{TYPES[history[0].type]?.nickname}</small>
        </div>
      )}
    </section>
  );
}

function InfoCard({ value, label }) {
  return (
    <div className="info-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <section className="screen centered-screen">
      <div className="hero-mark">MBTI</div>
      <p className="eyebrow">正在读取分享结果</p>
      <h1>稍等一下</h1>
      <p className="intro">正在从后台加载这份 MBTI 结果。</p>
    </section>
  );
}

function ErrorScreen({ error, onStart }) {
  return (
    <section className="screen centered-screen">
      <div className="hero-mark">MBTI</div>
      <p className="eyebrow">分享结果不可用</p>
      <h1>读取失败</h1>
      <p className="intro">{error}</p>
      <button className="primary-button" type="button" onClick={onStart}>
        重新测试
      </button>
    </section>
  );
}

function QuizScreen({ answers, currentIndex, dispatch }) {
  const question = ORDERED_QUESTIONS[currentIndex];
  const currentValue = answers[question.id];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / ORDERED_QUESTIONS.length) * 100);

  return (
    <section className="screen quiz-screen">
      <header className="quiz-header">
        <div>
          <p className="eyebrow">第 {currentIndex + 1} 题 / 36</p>
          <strong>{progress}% 完成</strong>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </header>

      <article className="question-panel" key={question.id}>
        <p className="question-kicker">{DIMENSION_META[question.dimension].label}</p>
        <h2>{question.text}</h2>
      </article>

      <div className="scale-list" role="radiogroup" aria-label="请选择同意程度">
        {SCALE.map((label, index) => {
          const value = index + 1;
          const active = currentValue === value;
          return (
            <button
              aria-checked={active}
              className={active ? "scale-option active" : "scale-option"}
              key={label}
              onClick={() => dispatch({ type: "ANSWER", questionId: question.id, value })}
              role="radio"
              type="button"
            >
              <span className="scale-number">{value}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <footer className="quiz-footer">
        <button
          className="ghost-button"
          disabled={currentIndex === 0}
          onClick={() => dispatch({ type: "PREV" })}
          type="button"
        >
          上一题
        </button>
        <button
          className="ghost-button"
          disabled={!currentValue}
          onClick={() => dispatch({ type: currentIndex === ORDERED_QUESTIONS.length - 1 ? "RESULT" : "NEXT" })}
          type="button"
        >
          {currentIndex === ORDERED_QUESTIONS.length - 1 ? "填写信息" : "下一题"}
        </button>
      </footer>
    </section>
  );
}

function ProfileScreen({ onBack, onSubmit }) {
  const [profile, setProfile] = useState({ nickname: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nickname = profile.nickname.trim();
    const phone = profile.phone.trim();

    if (!nickname) {
      setError("请输入昵称。");
      return;
    }

    if (!/^[0-9+\-\s()]{6,24}$/.test(phone)) {
      setError("请输入有效手机号。");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmit({ nickname, phone });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="screen profile-screen">
      <p className="eyebrow">最后一步</p>
      <h1>填写信息后查看结果</h1>
      <p className="intro">
        提交后会写入后台记录，并生成可转发的结果链接和分享海报。你的结果会在提交成功后展示。
      </p>

      <form className="profile-form" onSubmit={handleSubmit}>
        <label>
          <span>昵称</span>
          <input
            autoComplete="nickname"
            maxLength={24}
            onChange={(event) => setProfile((value) => ({ ...value, nickname: event.target.value }))}
            placeholder="请输入昵称"
            type="text"
            value={profile.nickname}
          />
        </label>
        <label>
          <span>手机号</span>
          <input
            autoComplete="tel"
            inputMode="tel"
            maxLength={24}
            onChange={(event) => setProfile((value) => ({ ...value, phone: event.target.value }))}
            placeholder="请输入手机号"
            type="tel"
            value={profile.phone}
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="result-actions">
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "提交中..." : "查看结果"}
          </button>
          <button className="secondary-button" disabled={submitting} onClick={onBack} type="button">
            返回修改
          </button>
        </div>
      </form>
    </section>
  );
}

function ResultScreen({ history, isShared = false, onReset, record, result, shareUrl }) {
  const typeCopy = TYPES[result.type];
  const [notice, setNotice] = useState("");

  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("分享链接已复制。");
    } catch {
      setNotice("复制失败，请手动复制页面地址。");
    }
  }

  function createPoster() {
    downloadPoster({ record, result, shareUrl });
    setNotice("分享海报已生成并开始下载。");
  }

  return (
    <section className="screen result-screen">
      <p className="eyebrow">{isShared ? "TA 的 MBTI 倾向" : "你的 MBTI 倾向"}</p>
      <div className="result-title">
        <h1>{result.type}</h1>
        <p>{typeCopy.nickname}</p>
      </div>

      {record?.profile?.nickname && (
        <div className="profile-summary">
          <span>测试人</span>
          <strong>{record.profile.nickname}</strong>
          {record.profile.phoneMasked && <small>{record.profile.phoneMasked}</small>}
        </div>
      )}

      <div className="dimension-list">
        {Object.entries(result.dimensions).map(([dimension, item]) => (
          <DimensionBar dimension={dimension} item={item} key={dimension} />
        ))}
      </div>

      <div className="copy-section">
        <h2>优势</h2>
        <p>{typeCopy.strengths}</p>
      </div>
      <div className="copy-section">
        <h2>可能盲点</h2>
        <p>{typeCopy.blindspots}</p>
      </div>
      <div className="copy-section">
        <h2>适合职业方向</h2>
        <p>{typeCopy.careers}</p>
      </div>

      <div className="share-box">
        <span>结果分享链接</span>
        <p>{shareUrl}</p>
      </div>

      <div className="result-actions">
        <button className="primary-button" type="button" onClick={copyShareUrl}>
          复制分享链接
        </button>
        <button className="secondary-button" type="button" onClick={createPoster}>
          生成分享海报
        </button>
        <button className="ghost-button wide" type="button" onClick={onReset}>
          重新测试
        </button>
      </div>
      {notice && <p className="notice">{notice}</p>}

      {!isShared && history.length > 0 && (
        <div className="history-list">
          <h2>本地历史</h2>
          {history.map((entry) => (
            <div className="history-item" key={`${entry.savedAt}-${entry.type}`}>
              <strong>{entry.type}</strong>
              <span>{entry.nickname ? `${entry.nickname} · ` : ""}{TYPES[entry.type]?.nickname}</span>
              <time>{new Date(entry.savedAt).toLocaleDateString("zh-CN")}</time>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DimensionBar({ dimension, item }) {
  const meta = DIMENSION_META[dimension];
  const [leftPole, rightPole] = meta.left.split(" ")[0] === item.letter ? [meta.left, meta.right] : [meta.right, meta.left];
  const indicatorOffset = item.letter === meta.left.charAt(0) ? 50 - item.strength / 2 : 50 + item.strength / 2;

  return (
    <article className="dimension-card">
      <div className="dimension-head">
        <span>{meta.label}</span>
        <strong>{item.letter} · {item.strength}%</strong>
      </div>
      <div className="bar-labels">
        <span>{meta.left}</span>
        <span>{meta.right}</span>
      </div>
      <div className="dimension-track">
        <span className="center-line" />
        <span className="indicator" style={{ left: `${indicatorOffset}%` }} />
      </div>
      <p>{DIMENSION_BLURBS[item.letter]}</p>
      {item.unclear && <small>该维度倾向不明显，建议结合生活情境综合理解。</small>}
      <span className="sr-only">
        {leftPole} 相对 {rightPole} 的倾向强度为 {item.strength}%
      </span>
    </article>
  );
}

function downloadPoster({ record, result, shareUrl }) {
  const canvas = document.createElement("canvas");
  const scale = window.devicePixelRatio || 1;
  const width = 1080;
  const height = 1620;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  const typeCopy = TYPES[result.type];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f6fbf8");
  gradient.addColorStop(1, "#d9f0e2");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#173a2a";
  ctx.font = "700 42px sans-serif";
  ctx.fillText("MBTI 性格测试结果", 72, 110);

  ctx.fillStyle = "#1f7a50";
  ctx.font = "800 156px sans-serif";
  ctx.fillText(result.type, 72, 290);

  ctx.fillStyle = "#173a2a";
  ctx.font = "700 48px sans-serif";
  ctx.fillText(typeCopy.nickname, 72, 365);

  ctx.fillStyle = "#53645c";
  ctx.font = "400 34px sans-serif";
  ctx.fillText(`测试人：${record.profile.nickname}`, 72, 455);
  if (record.profile.phoneMasked) {
    ctx.fillText(`手机号：${record.profile.phoneMasked}`, 72, 510);
  }

  let y = 610;
  Object.entries(result.dimensions).forEach(([dimension, item]) => {
    const meta = DIMENSION_META[dimension];
    ctx.fillStyle = "#173a2a";
    ctx.font = "700 34px sans-serif";
    ctx.fillText(`${meta.label}  ${item.letter} · ${item.strength}%`, 72, y);

    ctx.fillStyle = "#dcece3";
    roundRect(ctx, 72, y + 26, 760, 18, 9);
    ctx.fill();

    ctx.fillStyle = "#2d9363";
    const barWidth = Math.max(24, Math.round((item.strength / 100) * 760));
    roundRect(ctx, 72, y + 26, barWidth, 18, 9);
    ctx.fill();
    y += 118;
  });

  ctx.fillStyle = "#26382f";
  ctx.font = "400 36px sans-serif";
  wrapText(ctx, typeCopy.strengths, 72, 1110, 880, 56, 4);

  ctx.fillStyle = "#53645c";
  ctx.font = "400 30px sans-serif";
  wrapText(ctx, `查看完整结果：${shareUrl}`, 72, 1430, 880, 44, 3);

  const link = document.createElement("a");
  link.download = `MBTI-${result.type}-${record.profile.nickname}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = Array.from(text);
  let line = "";
  let lines = 0;

  chars.forEach((char, index) => {
    if (lines >= maxLines) return;
    const next = line + char;
    const isLast = index === chars.length - 1;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = char;
    } else {
      line = next;
    }

    if (isLast && line && lines < maxLines) {
      ctx.fillText(line, x, y);
    }
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
