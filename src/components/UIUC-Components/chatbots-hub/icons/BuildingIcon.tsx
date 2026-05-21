type IconProps = { className?: string }

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M27 66V54H45V66M24 18H24.03M48 18H48.03M36 18H36.03M36 30H36.03M36 42H36.03M48 30H48.03M48 42H48.03M24 30H24.03M24 42H24.03M18 6H54C57.3137 6 60 8.68629 60 12V60C60 63.3137 57.3137 66 54 66H18C14.6863 66 12 63.3137 12 60V12C12 8.68629 14.6863 6 18 6Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
