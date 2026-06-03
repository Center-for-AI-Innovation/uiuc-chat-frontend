import { useId } from 'react'

import { montserrat_heading, montserrat_paragraph } from 'fonts'

const HeaderStepNavigation = ({
  project_name,
  title,
  description,
}: {
  project_name: string
  title: string
  description: string
}) => {
  const descriptionId = useId()

  return (
    <div className="step_header mb-6">
      {project_name && (
        <p
          className={`mb-2 text-xs font-medium uppercase tracking-wider text-[--foreground-faded] ${montserrat_paragraph.variable} font-montserratParagraph`}
        >
          {project_name}
        </p>
      )}

      {title && (
        <h2
          className={`text-2xl font-bold tracking-tight text-[--foreground] sm:text-3xl ${montserrat_heading.variable} font-montserratHeading`}
          aria-describedby={description ? descriptionId : undefined}
        >
          {title}
        </h2>
      )}

      {description && (
        <p
          id={descriptionId}
          className={`mt-1.5 text-sm text-[--foreground-faded] sm:text-base ${montserrat_paragraph.variable} font-montserratParagraph`}
        >
          {description}
        </p>
      )}
    </div>
  )
}

export default HeaderStepNavigation
