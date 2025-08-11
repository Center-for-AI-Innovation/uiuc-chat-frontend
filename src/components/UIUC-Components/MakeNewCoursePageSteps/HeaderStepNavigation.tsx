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
      <div className="step_header">
        {project_name && (
          <div className="-mx-8 -mt-8 mb-4">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap rounded-t-md bg-[--background-faded] px-8 py-1">
              {project_name}
            </div>
          </div>
        )}

        {title && (
          <h4 className="overflow-hidden text-ellipsis whitespace-nowrap text-lg font-semibold">
            {title}
          </h4>
        )}

        {description && (
          <div className="text-sm text-[--foreground-faded]">{description}</div>
        )}
      </div>
    </>
  )
}

const componentClasses = {}

export default HeaderStepNavigation
