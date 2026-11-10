export default function AnswerExplanation({ explanation, id }) {
  return (
    <aside id={id} className="answer-explanation" role="status">
      <h3>Why this answer is correct</h3>
      <p>{explanation}</p>
    </aside>
  );
}
