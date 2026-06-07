export default function ActionButton({
  children,
  icon: Icon,
  variant = "primary",
  size = "regular",
  className = "",
  ...props
}) {
  return (
    <button className={`action-button ${variant} ${size} ${className}`} {...props}>
      {Icon ? <Icon size={size === "compact" ? 17 : 20} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
