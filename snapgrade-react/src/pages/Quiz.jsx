import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { toast }               from 'react-toastify';
import { saveQuiz }            from '../services/quizService';

export default function Quiz() {
  const navigate = useNavigate();
  const [quizData,  setQuizData]  = useState(null);
  const [answers,   setAnswers]   = useState([]);
  const [currentQ,  setCurrentQ]  = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [answered,  setAnswered]  = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('active_quiz');
    if (!raw) { navigate('/home'); return; }
    setQuizData(JSON.parse(raw));
  }, []);

  if (!quizData) return null;

  const question = quizData.questions[currentQ];
  const total    = quizData.questions.length;
  const progress = (currentQ / total) * 100;
  const isLast   = currentQ + 1 >= total;

  function pickAnswer(choice) {
    if (answered) return;
    setSelected(choice);
    setAnswered(true);
  }

  function handleNext() {
    const newAnswers = [...answers, {
      question: question.question, choices: question.choices,
      correct: question.answer, userAnswer: selected,
    }];
    if (isLast) {
      const score     = newAnswers.filter(a => a.userAnswer?.charAt(0) === a.correct).length;
      const completed = { ...quizData, answers: newAnswers, score, completed: true };
      saveQuiz(completed);
      sessionStorage.setItem('quiz_results', JSON.stringify({ ...completed, completedAt: new Date().toISOString() }));
      sessionStorage.removeItem('active_quiz');
      navigate('/results');
    } else {
      setAnswers(newAnswers);
      setCurrentQ(q => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  function getChoiceClass(choice) {
    const letter = choice.charAt(0);
    if (!answered) return selected === choice ? 'choice-btn selected' : 'choice-btn';
    if (letter === question.answer) return 'choice-btn correct answered';
    if (choice === selected)        return 'choice-btn wrong answered';
    return 'choice-btn dimmed answered';
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-bold text-gray-400">
            Question {currentQ + 1} <span className="text-purple-200">/ {total}</span>
          </span>
          <span className="text-sm font-black text-indigo-500">{Math.round(progress)}% done</span>
        </div>
        <div className="bg-indigo-100 rounded-sm h-2 overflow-hidden">
          <div className="progress-fill" style={{ width: `${progress}%` }}/>
        </div>
      </div>
      <div className="card mb-4" style={{ borderLeft: '4px solid #667eea' }}>
        <p className="text-base font-bold text-indigo-950 leading-relaxed">{question.question}</p>
      </div>
      <div className="flex flex-col gap-3 mb-5">
        {question.choices.map((choice, i) => {
          const letter  = choice.charAt(0);
          const isRight = answered && letter === question.answer;
          const isWrong = answered && choice === selected && letter !== question.answer;
          return (
            <button key={i} className={getChoiceClass(choice)} onClick={() => pickAnswer(choice)}>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0
                ${isRight ? 'bg-green-200 text-green-800' : isWrong ? 'bg-red-200 text-red-800'
                  : selected === choice && !answered ? 'bg-indigo-200 text-indigo-800' : 'bg-indigo-100 text-gray-500'}`}>
                {letter}
              </span>
              <span className="flex-1">{choice.substring(3)}</span>
              {isRight && <span className="ml-auto text-green-600 font-black">✓</span>}
              {isWrong && <span className="ml-auto text-red-500 font-black">✗</span>}
            </button>
          );
        })}
      </div>
      {answered
        ? <button className="btn-primary" onClick={handleNext}>
            {isLast ? '🎉 See My Results' : 'Next Question →'}
          </button>
        : <p className="text-center text-sm font-semibold" style={{ color: '#c4b5fd' }}>Tap an answer to continue</p>
      }
    </div>
  );
}
