import { useRouter } from 'next/router'
import { createStyles, rem, Title, useMantineTheme, Text } from '@mantine/core'
import React, { useState } from 'react'
import { Montserrat } from 'next/font/google'

const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
    maxWidth: '340px',
    width: '100%',
  },

  button: {
    width: '100%',
    border: 'none',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    '--btn-text-case': 'none',
    height: '48px',
  },
}))

export default function ResumeToChat({
  course_name,
}: {
  course_name?: string
}) {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    router.push(`/${course_name}/chat`)
  }

  if (!course_name) {
    return null
  }

  return (
    <div className={classes.wrapper}>
      <button
        onClick={handleClick}
        className={`btn rounded-full ${classes.button}`}
        style={{
          backgroundColor: 'transparent',
          outline: `solid 1.5px var(--button)`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = 'var(--button-hover)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-xs"></span>
          </>
        ) : (
          <>
            <Text
              size={theme.fontSizes.sm}
              color={
                theme.colorScheme === 'dark'
                  ? theme.colors.gray[0]
                  : theme.black
              }
            >
              Back to Chat with Documents
            </Text>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 11h.01M8 11h.01M16 11h.01m-3.72 6.998C18.096 17.934 21 15.918 21 11c0-5-3-7-9-7s-9 2-9 7c0 3.077 1.136 5.018 3.409 6.056L5 21l7.29-3.002Z"
                stroke="#FFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}
