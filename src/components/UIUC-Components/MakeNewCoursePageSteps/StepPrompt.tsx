import HeaderStepNavigation from './HeaderStepNavigation'
import PromptEditorEmbed from '../PromptEditorEmbed'

const StepPrompt = ({ project_name }: { project_name: string }) => {
  return (
    <>
      <div className="step">
        <HeaderStepNavigation
          project_name={project_name}
          title="System Prompt & Behavior"
          description="Define how your chatbot responds and behaves."
        />

        <div className="step_content">
          <PromptEditorEmbed
            project_name={project_name}
            isEmbedded={true}
            showHeader={false}
          />
        </div>
      </div>
    </>
  )
}

export default StepPrompt
