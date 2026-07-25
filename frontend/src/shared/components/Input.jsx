export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
}) {
  return (
    <div className="form-field">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className={`input ${error ? 'input--error' : ''}`}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
