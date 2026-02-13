import { montserrat_heading } from 'fonts'

const HeaderStepNavigation = ({
  project_name,
  title,
  description,
}: {
  project_name: string
  title: string
  description: string
}) => {
  return (
    <>
      <div className={`step_header mb-8`}>
        {/* TODO: add new project name display */}
        {/* {project_name && (
          <div className="-mx-8 -mt-8 mb-4">
            <div className="flex flex-wrap items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-t-md bg-[--background-faded] px-8 py-1">
              <div className="text-[--foreground-faded]">CHATBOT:</div>
              <div>{project_name}</div>
            </div>
          </div>
        )} */}

        {title && (
          <h4
            className={`${montserrat_heading.className} overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-semibold`}
          >
            {title}
          </h4>
        )}

        {description && (
          <div className="mt-2 text-sm text-[--foreground-faded]">
            {description}
          </div>
        )}
      </div>
    </>
  )
}

export default HeaderStepNavigation
