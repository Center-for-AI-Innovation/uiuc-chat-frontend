import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { useMutation } from '@tanstack/react-query'
import SettingsLayout, {
  getInitialCollapsedState,
} from '~/components/Layout/SettingsLayout'
import GlobalFooter from '~/components/UIUC-Components/GlobalFooter'
import { LoadingPlaceholderForAdminPages } from '~/components/UIUC-Components/MainPageBackground'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { type CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { initiateSignIn } from '~/utils/authHelpers'
import { useGetProjectLLMProviders } from '~/hooks/useProjectAPIKeys'
import { useGetDocumentGroups } from '~/hooks/docGroupsQueries'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import type { GenericSupportedModel } from '~/utils/modelProviders/LLMProvider'
import type { EvaluationRequest, EvaluationResponse } from '~/types/evaluation'
import { IconPlus, IconTrash, IconChartBar, IconUpload, IconX, IconChevronDown, IconCheck } from '@tabler/icons-react'
import { parseEvaluationFile } from '~/utils/evaluationFileParser'
import { useDropzone } from 'react-dropzone'

const EvaluatePage: NextPage = () => {
  const router = useRouter()
  const auth = useAuth()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [courseName, setCourseName] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsedState())

  // Form state
  const [questionAnswerPairs, setQuestionAnswerPairs] = useState<Array<{ question: string; answer: string }>>([{ question: '', answer: '' }])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedJudges, setSelectedJudges] = useState<string[]>([])
  const [selectedDocGroups, setSelectedDocGroups] = useState<string[]>([])
  const [allDocumentsSelected, setAllDocumentsSelected] = useState(true)
  const [temperature, setTemperature] = useState<number>(0.1)
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResponse | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Dropdown states
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [judgeDropdownOpen, setJudgeDropdownOpen] = useState(false)
  const [docGroupDropdownOpen, setDocGroupDropdownOpen] = useState(false)

  // Dropdown refs for click-outside detection
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const judgeDropdownRef = useRef<HTMLDivElement>(null)
  const docGroupDropdownRef = useRef<HTMLDivElement>(null)
  
  // QA pairs scroll container ref
  const qaPairsContainerRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false)
      }
      if (judgeDropdownRef.current && !judgeDropdownRef.current.contains(event.target as Node)) {
        setJudgeDropdownOpen(false)
      }
      if (docGroupDropdownRef.current && !docGroupDropdownRef.current.contains(event.target as Node)) {
        setDocGroupDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCurrentPageName = () => router.query.course_name as string

  // Fetch course metadata
  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const local_course_name = getCurrentPageName()
      const metadata: CourseMetadata = await fetchCourseMetadata(local_course_name)
      if (metadata === null) {
        await router.push('/new?course_name=' + local_course_name)
        return
      }
      setCourseName(local_course_name)
      setCourseMetadata(metadata)
      setIsLoading(false)
    }
    fetchCourseData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  // Check permissions
  useEffect(() => {
    if (auth.isLoading || !auth.isAuthenticated || courseName == null) return
    const handlePermissionsAndData = async () => {
      try {
        if (!courseMetadata || !auth.isAuthenticated) return
        const permission_str = get_user_permission(courseMetadata, auth)
        if (permission_str !== 'edit') {
          await router.replace(`/${courseName}/not_authorized`)
        }
      } catch (error) {
        console.error('Error handling permissions and data: ', error)
      }
    }
    handlePermissionsAndData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseMetadata, auth.isAuthenticated, courseName])

  const { data: llmProviders, isLoading: isLoadingModels } = useGetProjectLLMProviders({ projectName: courseName || '' })
  const { data: documentGroups, isLoading: isLoadingDocGroups } = useGetDocumentGroups(courseName || '')

  const availableModels: GenericSupportedModel[] = useMemo(() => {
    if (!llmProviders) return []
    return Object.values(llmProviders)
      .filter((provider) => provider.enabled)
      .flatMap((provider) => provider.models || [])
      .filter((model) => model.enabled)
      .filter((model) => !webLLMModels.some((webLLMModel) => webLLMModel.id === model.id))
  }, [llmProviders])

  const enabledDocGroups = useMemo(() => documentGroups?.filter((group) => group.enabled) || [], [documentGroups])

  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      const defaultModel = availableModels.find((m) => m.default) || availableModels[0]
      if (defaultModel) setSelectedModel(defaultModel.id)
    }
  }, [availableModels, selectedModel])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null)
    const file = acceptedFiles[0]
    if (!file) return
    try {
      const result = await parseEvaluationFile(file)
      if (result.errors.length > 0) setUploadError(result.errors.join('; '))
      if (result.pairs.length > 0) setQuestionAnswerPairs(result.pairs)
    } catch (error) {
      setUploadError(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] },
    maxFiles: 1,
  })

  const evaluationMutation = useMutation({
    mutationFn: async (request: EvaluationRequest): Promise<EvaluationResponse> => {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Evaluation failed')
      }
      return response.json()
    },
    onSuccess: (data) => setEvaluationResults(data),
    onError: (error) => alert(`Evaluation failed: ${error instanceof Error ? error.message : String(error)}`),
  })

  const handleAddQuestion = () => {
    setQuestionAnswerPairs([...questionAnswerPairs, { question: '', answer: '' }])
    // Scroll to bottom after state update
    setTimeout(() => {
      if (qaPairsContainerRef.current) {
        qaPairsContainerRef.current.scrollTo({
          top: qaPairsContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 50)
  }
  const handleRemoveQuestion = (index: number) => setQuestionAnswerPairs(questionAnswerPairs.filter((_, i) => i !== index))
  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...questionAnswerPairs]
    const pair = updated[index]
    if (pair) { pair.question = value; setQuestionAnswerPairs(updated) }
  }
  const handleAnswerChange = (index: number, value: string) => {
    const updated = [...questionAnswerPairs]
    const pair = updated[index]
    if (pair) { pair.answer = value; setQuestionAnswerPairs(updated) }
  }

  const handleSubmit = () => {
    if (!selectedModel) return alert('Please select a model to evaluate')
    if (selectedJudges.length === 0) return alert('Please select at least one judge model')
    if (!allDocumentsSelected && selectedDocGroups.length === 0) return alert('Please select document groups or "All Documents"')
    const validPairs = questionAnswerPairs.filter((pair) => pair.question.trim() && pair.answer.trim())
    if (validPairs.length === 0) return alert('Please add at least one question-answer pair')
    if (!courseName) return alert('Course name is required')

    const questionAnswerRecord: Record<string, string> = {}
    validPairs.forEach((pair) => { questionAnswerRecord[pair.question.trim()] = pair.answer.trim() })

    evaluationMutation.mutate({
      questionAnswerPairs: questionAnswerRecord,
      judge: selectedJudges,
      course_name: courseName,
      model: selectedModel,
      temperature,
      doc_groups: allDocumentsSelected ? ['All Documents'] : selectedDocGroups,
    })
  }

  const toggleJudge = (modelId: string) => {
    setSelectedJudges((prev) => prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId])
  }

  const toggleDocGroup = (groupName: string) => {
    // When selecting individual groups, turn off "All Documents"
    setAllDocumentsSelected(false)
    setSelectedDocGroups((prev) => prev.includes(groupName) ? prev.filter((name) => name !== groupName) : [...prev, groupName])
  }

  const toggleAllDocuments = () => {
    if (allDocumentsSelected) {
      // Turn off "All Documents", clear individual selections
      setAllDocumentsSelected(false)
      setSelectedDocGroups([])
    } else {
      // Turn on "All Documents", clear individual selections
      setAllDocumentsSelected(true)
      setSelectedDocGroups([])
    }
  }

  const selectedModelName = availableModels.find((m) => m.id === selectedModel)?.name || 'Select model...'

  if (isLoading || courseName == null || isLoadingModels || isLoadingDocGroups) {
    return <LoadingPlaceholderForAdminPages />
  }

  if (!auth.user || !auth.isAuthenticated) {
    void router.push(`/new?course_name=${courseName}`)
    void initiateSignIn(auth, router.asPath)
    return null
  }

  return (
    <SettingsLayout
      course_name={router.query.course_name as string}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    >
      <main className="min-h-screen bg-[--background]">
        <div className="mx-auto py-8 px-4 md:px-6 lg:px-8 xl:px-12 max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-[--foreground]">
              <IconChartBar className="h-8 w-8 text-[--primary]" />
              RAG Evaluation
            </h1>
            <p className="text-[--muted-foreground] mt-2">
              Evaluate your RAG system performance using ragas metrics
            </p>
          </div>

          <div className="space-y-6">
            {/* Two column layout for larger screens */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Question-Answer Pairs */}
            <div className="bg-[--dashboard-background-faded] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[--foreground] mb-1">Question-Answer Pairs</h2>
              <p className="text-sm text-[--muted-foreground] mb-4">Upload a CSV/JSON file or add pairs manually</p>

              {/* File Upload */}
              <div
                {...getRootProps()}
                className={`rounded-lg p-6 text-center cursor-pointer transition-all border-2 border-dashed ${
                  isDragActive 
                    ? 'border-[--primary] bg-[--primary]/5' 
                    : 'border-[--dashboard-border] hover:border-[--primary] hover:bg-[--primary]/5'
                }`}
              >
                <input {...getInputProps()} />
                <IconUpload className={`h-10 w-10 mx-auto mb-3 ${isDragActive ? 'text-[--primary]' : 'text-[--muted-foreground]'}`} />
                <p className="text-sm font-medium text-[--foreground]">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV or JSON file'}
                </p>
                <p className="text-xs text-[--muted-foreground] mt-1">or click to browse</p>
              </div>

              {uploadError && (
                <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
                  <IconX className="h-5 w-5 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-500">Upload Error</p>
                    <p className="text-xs text-red-500/80 mt-1">{uploadError}</p>
                  </div>
                </div>
              )}

              {/* QA Pairs - scrollable container */}
              <div ref={qaPairsContainerRef} className="mt-6 space-y-4 max-h-[400px] xl:max-h-[500px] overflow-y-auto pr-2">
                {questionAnswerPairs.map((pair, index) => (
                  <div key={index} className="bg-[--background] rounded-lg p-4 shadow-sm border border-[--dashboard-border]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-[--foreground]">Question {index + 1}</span>
                      {questionAnswerPairs.length > 1 && (
                        <button onClick={() => handleRemoveQuestion(index)} className="text-red-500 hover:text-red-600 p-1">
                          <IconTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={pair.question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2 rounded-lg border border-[--dashboard-border] bg-[--background] text-[--foreground] placeholder-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent text-sm"
                    />
                    <label className="block text-sm font-medium text-[--foreground] mt-3 mb-1">Ground Truth Answer</label>
                    <textarea
                      value={pair.answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="Enter the expected answer..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-[--dashboard-border] bg-[--background] text-[--foreground] placeholder-[--muted-foreground] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent text-sm resize-none"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddQuestion}
                className="mt-4 w-full py-2 px-4 rounded-lg border-2 border-dashed border-[--dashboard-border] text-[--muted-foreground] hover:border-[--primary] hover:text-[--primary] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <IconPlus className="h-4 w-4" />
                Add Question
              </button>
            </div>

            {/* Right column: Config sections stacked */}
            <div className="space-y-6">
              {/* Model Configuration */}
              <div className="bg-[--dashboard-background-faded] rounded-xl p-6">
                <h2 className="text-xl font-bold text-[--foreground] mb-1">Model Configuration</h2>
                <p className="text-sm text-[--muted-foreground] mb-4">Select the model to evaluate and set parameters</p>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
                  {/* Model to Evaluate */}
                  <div>
                    <label className="block text-sm font-semibold text-[--foreground] mb-2">Model to Evaluate</label>
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[--dashboard-border] bg-[--background] text-left text-[--foreground] hover:border-[--primary] transition-colors flex items-center justify-between text-sm"
                      >
                        <span>{selectedModelName}</span>
                        <IconChevronDown className={`h-4 w-4 text-[--muted-foreground] transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {modelDropdownOpen && (
                        <div className="absolute z-50 mt-1 w-full bg-[--background] rounded-lg shadow-lg border border-[--dashboard-border] max-h-60 overflow-y-auto">
                          {availableModels.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => { setSelectedModel(model.id); setModelDropdownOpen(false) }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-[--dashboard-background-faded] flex items-center justify-between ${
                                selectedModel === model.id ? 'bg-[--primary]/10 text-[--primary]' : 'text-[--foreground]'
                              }`}
                            >
                              <span>{model.name}</span>
                              {selectedModel === model.id && <IconCheck className="h-4 w-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-semibold text-[--foreground] mb-2">Temperature</label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.1)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[--dashboard-border] bg-[--background] text-[--foreground] focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Judge Models */}
            <div className="bg-[--dashboard-background-faded] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[--foreground] mb-1">Judge Models</h2>
              <p className="text-sm text-[--muted-foreground] mb-4">Select models to evaluate the responses</p>

              <div className="relative" ref={judgeDropdownRef}>
                <button
                  onClick={() => setJudgeDropdownOpen(!judgeDropdownOpen)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[--dashboard-border] bg-[--background] text-left text-[--foreground] hover:border-[--primary] transition-colors flex items-center justify-between text-sm"
                >
                  <span className={selectedJudges.length === 0 ? 'text-[--muted-foreground]' : ''}>
                    {selectedJudges.length === 0 
                      ? 'Select judge models...' 
                      : `${selectedJudges.length} model${selectedJudges.length > 1 ? 's' : ''} selected`}
                  </span>
                  <IconChevronDown className={`h-4 w-4 text-[--muted-foreground] transition-transform ${judgeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {judgeDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-[--background] rounded-lg shadow-lg border border-[--dashboard-border] max-h-60 overflow-y-auto">
                    {availableModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => toggleJudge(model.id)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-[--dashboard-background-faded] flex items-center justify-between ${
                          selectedJudges.includes(model.id) ? 'bg-[--primary]/10 text-[--primary]' : 'text-[--foreground]'
                        }`}
                      >
                        <span>{model.name}</span>
                        {selectedJudges.includes(model.id) && <IconCheck className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Judge Pills */}
              {selectedJudges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedJudges.map((judgeId) => {
                    const model = availableModels.find((m) => m.id === judgeId)
                    return (
                      <span key={judgeId} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[--primary] text-white text-sm font-medium">
                        {model?.name || judgeId}
                        <button onClick={() => toggleJudge(judgeId)} className="hover:bg-white/20 rounded-full p-0.5">
                          <IconX className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Document Groups */}
            <div className="bg-[--dashboard-background-faded] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[--foreground] mb-1">Document Groups</h2>
              <p className="text-sm text-[--muted-foreground] mb-4">Select document groups for context retrieval</p>

              <div className="relative" ref={docGroupDropdownRef}>
                <button
                  onClick={() => setDocGroupDropdownOpen(!docGroupDropdownOpen)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[--dashboard-border] bg-[--background] text-left text-[--foreground] hover:border-[--primary] transition-colors flex items-center justify-between text-sm"
                >
                  <span className={!allDocumentsSelected && selectedDocGroups.length === 0 ? 'text-[--muted-foreground]' : ''}>
                    {allDocumentsSelected 
                      ? 'All Documents' 
                      : selectedDocGroups.length === 0 
                        ? 'Select document groups...' 
                        : `${selectedDocGroups.length} group${selectedDocGroups.length > 1 ? 's' : ''} selected`}
                  </span>
                  <IconChevronDown className={`h-4 w-4 text-[--muted-foreground] transition-transform ${docGroupDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {docGroupDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-[--background] rounded-lg shadow-lg border border-[--dashboard-border] max-h-60 overflow-y-auto">
                    {/* All Documents Option */}
                    <button
                      onClick={toggleAllDocuments}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[--dashboard-background-faded] flex items-center justify-between border-b border-[--dashboard-border] font-medium ${
                        allDocumentsSelected ? 'bg-[--primary]/10 text-[--primary]' : 'text-[--foreground]'
                      }`}
                    >
                      <span>All Documents</span>
                      {allDocumentsSelected && <IconCheck className="h-4 w-4" />}
                    </button>
                    {/* Individual Doc Groups - not highlighted when All Documents is selected */}
                    {enabledDocGroups.map((group) => {
                      const isSelected = !allDocumentsSelected && selectedDocGroups.includes(group.name)
                      return (
                        <button
                          key={group.name}
                          onClick={() => toggleDocGroup(group.name)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[--dashboard-background-faded] flex items-center justify-between ${
                            isSelected ? 'bg-[--primary]/10 text-[--primary]' : 'text-[--foreground]'
                          }`}
                        >
                          <span>{group.name}</span>
                          {isSelected && <IconCheck className="h-4 w-4" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Selected Doc Group Pills */}
              {(allDocumentsSelected || selectedDocGroups.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {allDocumentsSelected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[--primary] text-white text-sm font-medium">
                      All Documents
                      <button onClick={toggleAllDocuments} className="hover:bg-white/20 rounded-full p-0.5">
                        <IconX className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : (
                    selectedDocGroups.map((groupName) => (
                      <span key={groupName} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[--primary] text-white text-sm font-medium">
                        {groupName.length > 25 ? groupName.slice(0, 25) + '...' : groupName}
                        <button onClick={() => toggleDocGroup(groupName)} className="hover:bg-white/20 rounded-full p-0.5">
                          <IconX className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>
            </div>{/* End right column */}
            </div>{/* End two-column grid */}

            {/* Run Evaluation Button */}
            <button
              onClick={handleSubmit}
              disabled={evaluationMutation.isPending}
              className="w-full py-3 px-6 rounded-xl bg-[--primary] text-white font-semibold text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {evaluationMutation.isPending ? 'Running Evaluation...' : 'Run Evaluation'}
            </button>

            {/* Results */}
            {evaluationResults && (
              <div className="bg-[--dashboard-background-faded] rounded-xl p-6">
                <h2 className="text-xl font-bold text-[--foreground] mb-1">Evaluation Results</h2>
                <p className="text-sm text-[--muted-foreground] mb-4">Metrics computed by ragas evaluation framework</p>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[--foreground]">
                        <th className="text-left py-3 px-4 font-bold text-[--foreground]">Judge Model</th>
                        <th className="text-left py-3 px-4 font-bold text-[--foreground]">Context Precision</th>
                        <th className="text-left py-3 px-4 font-bold text-[--foreground]">Context Recall</th>
                        <th className="text-left py-3 px-4 font-bold text-[--foreground]">Answer Relevancy</th>
                        <th className="text-left py-3 px-4 font-bold text-[--foreground]">Faithfulness</th>
                        <th className="text-left py-3 px-4 font-bold text-[--foreground]">Factual Correctness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(evaluationResults.results).map(([judge, metrics]) => (
                        <tr key={judge} className="border-b border-[--dashboard-border] hover:bg-[--background]">
                          <td className="py-3 px-4 font-semibold text-[--foreground]">{judge}</td>
                          <td className="py-3 px-4 text-[--foreground]">{metrics.context_precision?.toFixed(3) || 'N/A'}</td>
                          <td className="py-3 px-4 text-[--foreground]">{metrics.context_recall?.toFixed(3) || 'N/A'}</td>
                          <td className="py-3 px-4 text-[--foreground]">{metrics.answer_relevancy?.toFixed(3) || 'N/A'}</td>
                          <td className="py-3 px-4 text-[--foreground]">{metrics.faithfulness?.toFixed(3) || 'N/A'}</td>
                          <td className="py-3 px-4 text-[--foreground]">{metrics.factual_correctness?.toFixed(3) || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        <GlobalFooter />
      </main>
    </SettingsLayout>
  )
}

export default EvaluatePage
