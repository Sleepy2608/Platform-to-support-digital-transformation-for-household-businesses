export default function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card__title">{title}</div>}
      <div className="card__body">{children}</div>
    </div>
  )
}
