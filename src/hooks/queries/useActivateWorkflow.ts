import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useActivateWorkflow(n8nApiKey: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      const response = await fetch(
        `/api/UIUC-api/tools/activateWorkflow?api_key=${n8nApiKey}&id=${id}&activate=${checked}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      return data
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['tools', n8nApiKey],
      })
    },
  })
}
