type IconProps = { className?: string }

export function UsersRoundIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M54 63C54 56.6348 51.4714 50.5303 46.9706 46.0294C42.4697 41.5286 36.3652 39 30 39M30 39C23.6348 39 17.5303 41.5286 13.0294 46.0294C8.52856 50.5303 6 56.6348 6 63M30 39C38.2843 39 45 32.2843 45 24C45 15.7157 38.2843 9 30 9C21.7157 9 15 15.7157 15 24C15 32.2843 21.7157 39 30 39ZM66.0001 59.9999C66.0001 49.8899 60.0001 40.4999 54.0001 35.9999C55.9724 34.5202 57.5495 32.5771 58.5919 30.3427C59.6342 28.1082 60.1097 25.6513 59.9762 23.1893C59.8427 20.7273 59.1044 18.3361 57.8266 16.2275C56.5487 14.1188 54.7708 12.3576 52.6501 11.0999"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
