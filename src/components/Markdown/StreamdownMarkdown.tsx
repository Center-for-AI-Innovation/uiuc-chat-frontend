import { memo } from 'react'
import { Streamdown, type StreamdownProps } from 'streamdown'

export type StreamdownMarkdownProps = StreamdownProps

export const StreamdownMarkdown = memo(Streamdown)
StreamdownMarkdown.displayName = 'StreamdownMarkdown'
