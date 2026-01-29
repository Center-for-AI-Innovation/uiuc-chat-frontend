import HeaderStepNavigation from './HeaderStepNavigation'
import APIKeyInputForm from '../api-inputs/LLMsApiKeyInputForm'

const StepLLM = ({ project_name }: { project_name: string }) => {
  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name={project_name}
          title="Configure AI Models"
          description="Set up API keys for the LLM providers you want to use."
        />

        <div className="step_content">
          {/* TODO: fix spacing */}
          <APIKeyInputForm projectName={project_name} isEmbedded={true} />
        </div>
      </div>
    </>
  )
}

export default StepLLM
