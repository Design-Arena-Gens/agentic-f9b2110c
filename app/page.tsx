"use client";

import { useMemo, useState } from 'react';

type Scores = {
  tokenCount: number;
  uniqueWords: number;
  readability: number; // Flesch-like 0-100
  jargonDensity: number; // 0-1
  structureScore: number; // 0-1
  noveltyScore: number; // 0-1
  grokAdvantage: number; // 0-100
};

const JARGON = new Set([
  'synergy','leverage','robust','scalable','paradigm','disrupt','optimize','vertical','mission','vision','framework','ai','ml','llm','blockchain','cloud','microservice','kpi','okr','holistic','granular','bandwidth','roadmap','deliverable','stakeholder','onboarding','pipeline','latency','throughput','compliance','observability','telemetry','orchestration','container','platform','ecosystem','monolith','serverless','edge','zero-trust'
]);

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function splitWords(text: string): string[] {
  return (text.toLowerCase().match(/[a-zA-Z']+/g) || []);
}

function estimateSyllables(word: string): number {
  const m = word.toLowerCase().replace(/e$/,'').match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

function computeScores(text: string): Scores {
  const words = splitWords(text);
  const sentences = splitSentences(text);
  const tokenCount = words.length;
  const uniqueWords = new Set(words).size;

  // Readability (Flesch Reading Ease approximation)
  const totalSyllables = words.reduce((sum, w) => sum + estimateSyllables(w), 0);
  const sentenceCount = Math.max(1, sentences.length);
  const wordsPerSentence = tokenCount / sentenceCount;
  const syllablesPerWord = tokenCount ? totalSyllables / tokenCount : 0;
  let readability = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  readability = Math.max(0, Math.min(100, readability));

  // Jargon density
  const jargonHits = words.filter(w => JARGON.has(w)).length;
  const jargonDensity = tokenCount ? jargonHits / tokenCount : 0;

  // Structure score: presence of headings, lists, short sentences
  const hasBullets = /(^|\n)\s*[-*?]/m.test(text);
  const shortSentenceShare = sentenceCount ? sentences.filter(s => splitWords(s).length <= 18).length / sentenceCount : 1;
  const structureScore = (hasBullets ? 0.2 : 0) + 0.8 * shortSentenceShare; // 0-1

  // Novelty score: rare word ratio
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  let rareCount = 0;
  for (const [w, c] of freq) if (c === 1 && w.length > 6) rareCount++;
  const noveltyScore = tokenCount ? Math.min(1, rareCount / Math.max(20, tokenCount)) : 0;

  // Aggregate: "Grok Advantage" balances clarity vs originality
  const clarity = (readability / 100) * (1 - jargonDensity) * structureScore; // 0-1
  const originality = 0.5 * noveltyScore + 0.5 * (uniqueWords / Math.max(1, tokenCount));
  const grokAdvantage = Math.round(100 * (0.65 * clarity + 0.35 * originality));

  return { tokenCount, uniqueWords, readability, jargonDensity, structureScore, noveltyScore, grokAdvantage };
}

function adviceFromScores(s: Scores): string[] {
  const tips: string[] = [];
  if (s.readability < 55) tips.push('Shorten sentences and reduce syllables per word.');
  if (s.jargonDensity > 0.06) tips.push('Replace jargon with concrete, specific language.');
  if (s.structureScore < 0.6) tips.push('Use headings, bullets, and focused paragraphs.');
  if (s.noveltyScore < 0.05) tips.push('Add concrete examples or surprising insights.');
  if (s.uniqueWords / Math.max(1, s.tokenCount) < 0.35) tips.push('Increase vocabulary variety; avoid repetition.');
  if (!tips.length) tips.push('Strong clarity and originality. Consider adding visuals or data.');
  return tips;
}

export default function Page() {
  const [text, setText] = useState<string>('');

  const scores = useMemo(() => computeScores(text), [text]);
  const tips = useMemo(() => adviceFromScores(scores), [scores]);

  return (
    <main className="container">
      <header className="header">
        <h1>Super Heavy Grok Advantage</h1>
        <p className="tag">Maximize clarity, structure, and originality.</p>
      </header>

      <section className="grid">
        <div className="panel">
          <label htmlFor="input" className="label">Your content</label>
          <textarea
            id="input"
            className="input"
            placeholder="Paste or write content to analyze..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="hint">Analysis runs locally in your browser.</div>
        </div>

        <div className="panel">
          <div className="scorecard">
            <div className="score">
              <div className="meter">
                <div className="bar" style={{ width: `${scores.grokAdvantage}%` }} />
              </div>
              <div className="score-line">
                <span className="score-value">{scores.grokAdvantage}</span>
                <span className="score-label">Grok Advantage</span>
              </div>
            </div>

            <div className="metrics">
              <div className="metric"><span>Tokens</span><b>{scores.tokenCount}</b></div>
              <div className="metric"><span>Unique</span><b>{scores.uniqueWords}</b></div>
              <div className="metric"><span>Readability</span><b>{Math.round(scores.readability)}</b></div>
              <div className="metric"><span>Jargon</span><b>{(scores.jargonDensity * 100).toFixed(1)}%</b></div>
              <div className="metric"><span>Structure</span><b>{Math.round(scores.structureScore * 100)}</b></div>
              <div className="metric"><span>Novelty</span><b>{Math.round(scores.noveltyScore * 100)}</b></div>
            </div>
          </div>

          <div className="tips">
            <h3>Recommendations</h3>
            <ul>
              {tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>Local-only analysis ? No data leaves your device</span>
      </footer>
    </main>
  );
}
