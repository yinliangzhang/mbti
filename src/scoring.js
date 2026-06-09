import { QUESTIONS } from "./questions.js";

const POLES = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"]
};

export function score(answers) {
  const dims = { EI: [], SN: [], TF: [], JP: [] };

  QUESTIONS.forEach((question) => {
    const raw = answers[question.id];
    if (raw == null) return;
    const value = question.reverse ? 8 - raw : raw;
    dims[question.dimension].push(value);
  });

  const result = {};
  let type = "";

  Object.entries(dims).forEach(([dimension, values]) => {
    const sum = values.reduce((total, value) => total + value, 0);
    const n = values.length;
    const min = n;
    const max = n * 7;
    const mid = (min + max) / 2;
    const [positivePole, negativePole] = POLES[dimension];
    const letter = sum >= mid ? positivePole : negativePole;
    const strength = Math.round((Math.abs(sum - mid) / (max - mid)) * 100);

    result[dimension] = {
      letter,
      strength,
      unclear: strength < 10,
      score: sum,
      max,
      mid
    };
    type += letter;
  });

  return { type, dimensions: result };
}

export function validateQuestionBank(questions = QUESTIONS) {
  const summary = questions.reduce((acc, question) => {
    const entry = acc[question.dimension] ?? { total: 0, reverse: 0, forward: 0 };
    entry.total += 1;
    entry[question.reverse ? "reverse" : "forward"] += 1;
    acc[question.dimension] = entry;
    return acc;
  }, {});

  return {
    total: questions.length,
    dimensions: summary,
    valid:
      questions.length === 36 &&
      Object.values(summary).every((entry) => entry.total === 9 && entry.forward >= 4 && entry.reverse >= 4)
  };
}
