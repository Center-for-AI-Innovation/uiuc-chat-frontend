import HeaderStepNavigation from './HeaderStepNavigation'
import BrandingForm from '../BrandingForm'

const StepBranding = ({
  project_name,
  user_id,
}: {
  project_name: string
  user_id: string
}) => {
  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name={project_name}
          title="Chat Identity and Branding"
          description="Choose how your bot appears to the world."
        />

        {/* step content - core step information */}
        <div className="step_content">
          <BrandingForm
            project_name={project_name}
            user_id={user_id}
          ></BrandingForm>
        </div>
      </div>
    </>
  )
}

export default StepBranding
