/**
 * Button dung chung cho toan bo ung dung (Employee, Owner, Admin, Public).
 * Bien the: primary (mac dinh), secondary, danger.
 */
export default function Button({
  children,
  variant = 'primary',
  href,
  type = 'button',
  disabled = false,
  onClick,
}) {
  const className = `btn btn--${variant}`

  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    )
  }

  return (
    <button className={className} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
