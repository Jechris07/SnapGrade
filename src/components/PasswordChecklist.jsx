// ─────────────────────────────────────────────────────────────────
//  components/PasswordChecklist.jsx
//  Purpose : Live password strength checklist shown while
//            the student types their password on Register.
// ─────────────────────────────────────────────────────────────────

export default function PasswordChecklist({ password }) {
  if (!password) return null;

  const rules = [
    ['12–15 characters long',                  password.length >= 12 && password.length <= 15],
    ['At least one capital letter (A–Z)',       /[A-Z]/.test(password)],
    ['At least one lowercase letter (a–z)',     /[a-z]/.test(password)],
    ['At least one number (0–9)',               /[0-9]/.test(password)],
    ['At least one symbol (e.g. @, #, $, !)',  /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)],
  ];

  return (
    <div className="pw-check">
      {rules.map(([text, isMet]) => (
        <div key={text} className={`pw-rule ${isMet ? 'met' : 'unmet'}`}>
          <span className={`pw-dot ${isMet ? 'met' : 'unmet'}`}>
            {isMet ? '✓' : '·'}
          </span>
          {text}
        </div>
      ))}
    </div>
  );
}
