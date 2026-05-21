type IconProps = { className?: string }

export function MicroscopeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 54H42M9 66H63M42 66C47.5695 66 52.911 63.7875 56.8492 59.8492C60.7875 55.911 63 50.5695 63 45C63 39.4305 60.7875 34.089 56.8492 30.1508C52.911 26.2125 47.5695 24 42 24H39M27 42H33M36 18V9C36 8.20435 35.6839 7.44129 35.1213 6.87868C34.5587 6.31607 33.7956 6 33 6H27C26.2044 6 25.4413 6.31607 24.8787 6.87868C24.3161 7.44129 24 8.20435 24 9V18M27 36C25.4087 36 23.8826 35.3679 22.7574 34.2426C21.6321 33.1174 21 31.5913 21 30V18H39V30C39 31.5913 38.3679 33.1174 37.2426 34.2426C36.1174 35.3679 34.5913 36 33 36H27Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
