"use client";

import { useEffect, useMemo, useState } from "react";

type QuestId = "picture" | "spell" | "match" | "quick";
type Quest = { id:QuestId; title:string; en:string; desc:string; icon:string; tone:string };

const quests:Quest[] = [
  { id:"picture",title:"看圖選單字",en:"Picture Pick",desc:"看圖選出正確的單字！",icon:"🍎",tone:"green" },
  { id:"spell",title:"拼字挑戰",en:"Spelling Quest",desc:"依照圖片拼出正確單字！",icon:"🔤",tone:"orange" },
  { id:"match",title:"配對翻牌",en:"Match Cards",desc:"翻牌配對，找出一樣的意思！",icon:"🃏",tone:"blue" },
  { id:"quick",title:"快問快答",en:"Quick Quiz",desc:"快速回答，贏得星星獎勵！",icon:"⚡",tone:"coral" },
];
const words = [
  {emoji:"🍎",word:"apple",zh:"蘋果"},{emoji:"🐶",word:"dog",zh:"狗"},{emoji:"📚",word:"book",zh:"書"},
  {emoji:"🌞",word:"sun",zh:"太陽"},{emoji:"🐱",word:"cat",zh:"貓"},{emoji:"🚲",word:"bike",zh:"腳踏車"},
  {emoji:"🌳",word:"tree",zh:"樹"},{emoji:"🥛",word:"milk",zh:"牛奶"},{emoji:"🐟",word:"fish",zh:"魚"},
  {emoji:"🏠",word:"house",zh:"房子"},{emoji:"✏️",word:"pencil",zh:"鉛筆"},{emoji:"🌸",word:"flower",zh:"花"},
];

export default function Home(){
  const [active,setActive]=useState<Quest|null>(null);
  const [stars,setStars]=useState(120);
  const [completed,setCompleted]=useState<Record<string,number>>({picture:0,spell:0,match:0,quick:0});
  useEffect(()=>{try{const saved=localStorage.getItem("word-quest-progress");if(saved){const p=JSON.parse(saved);setStars(p.stars??120);setCompleted(p.completed??completed)}}catch{}},[]);
  const save=(id:QuestId,earned:number)=>{const next={...completed,[id]:Math.min(3,(completed[id]||0)+1)};const nextStars=stars+earned;setCompleted(next);setStars(nextStars);localStorage.setItem("word-quest-progress",JSON.stringify({stars:nextStars,completed:next}));};
  return <main className="quest-map">
    <div className="leaf leaf-one">☘</div><div className="leaf leaf-two">❧</div>
    <header className="topbar"><div className="logo" aria-label="Word Quest 英文探險隊"><span className="compass">🧭</span><span><b>Word</b><b>Quest</b></span></div><div className="stats" aria-label="學習紀錄"><div className="stat"><span>🔥</span><span>連續學習 <b>3</b> 天</span></div><div className="stat"><span>⭐</span><b>{stars}</b></div></div></header>
    <section className="hero"><div className="intro"><span className="eyebrow">ENGLISH ADVENTURE</span><h1>今天想挑戰<br/>哪一關？</h1><p>選擇喜歡的挑戰，開心學單字，<br/>一起成為英文小探險家！</p><div className="explorer" aria-hidden="true"><span className="hat">⌒</span><span className="face">🐯</span><span className="glass">🔭</span></div></div>
      <div className="quest-grid">{quests.map((q,index)=><article className={`quest-card ${q.tone}`} key={q.id} style={{"--delay":`${index*90}ms`} as React.CSSProperties}><div className="badge" aria-hidden="true"><span>{q.icon}</span></div><div className="card-copy"><span className="english-label">{q.en}</span><h2>{q.title}</h2><p>{q.desc}</p><div className="progress" aria-label={`已完成 ${completed[q.id]||0} 個進度`}>{[0,1,2].map(d=><span key={d} className={d<(completed[q.id]||0)?"done":""}/>)}</div><button type="button" data-quest={q.id} onClick={()=>setActive(q)}>開始挑戰 <span>→</span></button></div></article>)}</div>
    </section><div className="trail" aria-hidden="true"><i/><i/><i/><i/><i/></div><footer>每天學 10 分鐘，英文進步看得見！</footer>
    {active&&<GameModal quest={active} onClose={()=>setActive(null)} onWin={(earned)=>save(active.id,earned)}/>} 
  </main>
}

function GameModal({quest,onClose,onWin}:{quest:Quest;onClose:()=>void;onWin:(n:number)=>void}){
  const [step,setStep]=useState(0),[score,setScore]=useState(0),[picked,setPicked]=useState<string|null>(null),[finished,setFinished]=useState(false);
  const set=useMemo(()=>words.slice(quest.id==="quick"?6:0,quest.id==="quick"?11:5),[quest.id]);
  const current=set[step%set.length];
  const choices=useMemo(()=>[current,...words.filter(w=>w.word!==current.word).slice(step+1,step+3)].sort((a,b)=>a.word.localeCompare(b.word)),[current,step]);
  const [letters,setLetters]=useState<string[]>([]);
  const advance=(correct:boolean)=>{if(correct)setScore(s=>s+1);setTimeout(()=>{if(step>=4){setFinished(true);onWin((score+(correct?1:0))*2)}else{setStep(s=>s+1);setPicked(null);setLetters([])}},550)};
  const choose=(value:string,answer:string)=>{if(picked)return;setPicked(value);advance(value===answer)};
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={quest.title}><section className={`game-panel ${quest.tone}`}><button className="close" onClick={onClose} aria-label="關閉遊戲">×</button>{finished?<div className="result"><div className="treasure">🏆</div><span className="eyebrow">QUEST COMPLETE</span><h2>闖關完成！</h2><p>你答對了 <b>{score}</b> / 5 題</p><div className="earned">⭐ 獲得 {score*2} 顆星星</div><button onClick={onClose}>回到尋寶地圖</button></div>:<><div className="game-head"><div><span>{quest.en}</span><h2>{quest.title}</h2></div><strong>{step+1} / 5</strong></div><div className="game-progress"><i style={{width:`${(step+1)*20}%`}}/></div>{quest.id==="spell"?<SpellRound current={current} letters={letters} setLetters={setLetters} picked={picked} onSubmit={()=>choose(letters.join(""),current.word)}/>:quest.id==="match"?<MatchRound current={current} choices={choices} picked={picked} choose={choose}/>:<ChoiceRound current={current} choices={choices} picked={picked} choose={choose} quick={quest.id==="quick"}/>}<p className="hint">答對一題可以獲得 2 顆星星 ⭐</p></>}</section></div>
}

function ChoiceRound({current,choices,picked,choose,quick}:{current:typeof words[0];choices:typeof words;picked:string|null;choose:(a:string,b:string)=>void;quick:boolean}){return <div className="round"><div className="prompt"><span className="big-emoji">{quick?"💬":current.emoji}</span><p>{quick?<>「{current.zh}」的英文是什麼？</>:"這張圖的英文是什麼？"}</p></div><div className="answers">{choices.map(c=><button key={c.word} className={picked?(c.word===current.word?"correct":c.word===picked?"wrong":"muted"):""} onClick={()=>choose(c.word,current.word)}>{c.word}</button>)}</div></div>}
function SpellRound({current,letters,setLetters,picked,onSubmit}:{current:typeof words[0];letters:string[];setLetters:(x:string[])=>void;picked:string|null;onSubmit:()=>void}){const pool=useMemo(()=>current.word.split("").sort((a,b)=>a.localeCompare(b)),[current]);return <div className="round"><div className="prompt"><span className="big-emoji">{current.emoji}</span><p>請拼出「{current.zh}」</p></div><div className={`spell-box ${picked?(picked===current.word?"correct":"wrong"):""}`}>{letters.join("")||"_ ".repeat(current.word.length)}</div><div className="letter-pool">{pool.map((l,i)=><button key={`${l}-${i}`} disabled={letters.length>=current.word.length} onClick={()=>setLetters([...letters,l])}>{l.toUpperCase()}</button>)}</div><div className="spell-actions"><button onClick={()=>setLetters([])}>清除</button><button className="submit" disabled={letters.length!==current.word.length||!!picked} onClick={onSubmit}>送出答案</button></div></div>}
function MatchRound({current,choices,picked,choose}:{current:typeof words[0];choices:typeof words;picked:string|null;choose:(a:string,b:string)=>void}){return <div className="round"><div className="prompt"><span className="big-emoji">{current.emoji}</span><p>找出和圖片配對的中文</p></div><div className="answers">{choices.map(c=><button key={c.word} className={picked?(c.word===current.word?"correct":c.word===picked?"wrong":"muted"):""} onClick={()=>choose(c.word,current.word)}>{c.zh}<small>{c.word}</small></button>)}</div></div>}
