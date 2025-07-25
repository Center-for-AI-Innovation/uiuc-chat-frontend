import { type CustomSystemPrompt } from '~/types/courseMetadata'

// Utility function to fetch custom GPTs for a course
export const fetchCustomGPTsForCourse = async (courseName: string): Promise<CustomSystemPrompt[]> => {
  try {
    const response = await fetch(`/api/UIUC-api/getCustomGPTs?projectName=${encodeURIComponent(courseName)}`)
    if (response.ok) {
      const data = await response.json()
      return data.custom_gpts || []
    }
    return []
  } catch (error) {
    console.error('Error fetching custom GPTs for course:', error)
    return []
  }
}

// Utility function to fetch specific custom GPTs by IDs
export const fetchCustomGPTsByIds = async (gptIds: string[]): Promise<CustomSystemPrompt[]> => {
  try {
    if (!gptIds || gptIds.length === 0) {
      return []
    }
    
    const response = await fetch(`/api/UIUC-api/getCustomGPTs?gptIds=${gptIds.map(id => encodeURIComponent(id)).join(',')}`)
    if (response.ok) {
      const data = await response.json()
      return data.custom_gpts || []
    }
    return []
  } catch (error) {
    console.error('Error fetching custom GPTs by IDs:', error)
    return []
  }
}

// Utility function to save a custom GPT (uses upsert pattern)
export const callUpsertCustomGPT = async (
  customGPT: CustomSystemPrompt,
  projectName: string,
): Promise<{ success: boolean; gptId?: string }> => {
  try {
    const endpoint = '/api/UIUC-api/upsertCustomGPT'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customGPT, projectName }),
    })
    const data = await response.json()

    if (data.success) {
      console.debug('Custom GPT upserted successfully', {
        project_name: projectName,
        gpt_id: data.gptId,
      })
      return { success: true, gptId: data.gptId }
    } else {
      console.error('Error upserting custom GPT', {
        project_name: projectName,
        error: data.error,
      })
      return { success: false }
    }
  } catch (error) {
    console.error('Error upserting custom GPT', {
      project_name: projectName,
      error,
    })
    return { success: false }
  }
}

// Legacy function for backward compatibility
export const saveCustomGPT = async (customGPT: CustomSystemPrompt, projectName: string): Promise<{ success: boolean; gptId?: string }> => {
  return callUpsertCustomGPT(customGPT, projectName)
}

// Utility function to delete a custom GPT
export const deleteCustomGPT = async (gptId: string, projectName: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/UIUC-api/deleteCustomGPT?gptId=${encodeURIComponent(gptId)}&projectName=${encodeURIComponent(projectName)}`, {
      method: 'DELETE',
    })
    
    return response.ok
  } catch (error) {
    console.error('Error deleting custom GPT:', error)
    return false
  }
}

// Utility function to find a custom GPT by ID
export const findCustomGPTById = (customGPTs: CustomSystemPrompt[], gptId: string): CustomSystemPrompt | undefined => {
  return customGPTs.find(gpt => gpt.id === gptId || gpt.gpt_id === gptId)
}

// Utility function to update course metadata with new custom GPT IDs
export const updateCourseMetadataWithGPTIds = async (courseName: string, gptIds: string[]): Promise<boolean> => {
  try {
    const response = await fetch('/api/UIUC-api/upsertCourseMetadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseName,
        courseMetadata: { custom_gpt_ids: gptIds }
      }),
    })
    
    return response.ok
  } catch (error) {
    console.error('Error updating course metadata with GPT IDs:', error)
    return false
  }
}

// Utility function to set custom GPT pinned status
export const callSetCustomGPTPinned = async (
  gptId: string,
  projectName: string,
  isPinned: boolean,
): Promise<boolean> => {
  try {
    const endpoint = '/api/UIUC-api/setCustomGPTPinned'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gptId, projectName, isPinned }),
    })
    const data = await response.json()

    if (data.success) {
      console.debug('Custom GPT pinned status updated successfully', {
        gpt_id: gptId,
        project_name: projectName,
        is_pinned: isPinned,
      })
      return true
    } else {
      console.error('Error updating custom GPT pinned status', {
        gpt_id: gptId,
        project_name: projectName,
        error: data.error,
      })
      return false
    }
  } catch (error) {
    console.error('Error updating custom GPT pinned status', {
      gpt_id: gptId,
      project_name: projectName,
      error,
    })
    return false
  }
} 