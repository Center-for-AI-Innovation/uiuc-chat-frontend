import { type QueryClient, useMutation } from '@tanstack/react-query'
import { type FolderWithConversation } from '~/types/folder'
import { saveFolderToServer } from '@/hooks/__internal__/folders'

export function useUpdateFolder(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['updateFolder', user_email, course_name],
    mutationFn: async (folder: FolderWithConversation) =>
      saveFolderToServer(folder, course_name, user_email),
    onMutate: async (updatedFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', course_name] })

      const oldFolder = queryClient.getQueryData(['folders', course_name])

      queryClient.setQueryData(
        ['folders', course_name],
        (oldData: FolderWithConversation[] | undefined) => {
          const safeOld = Array.isArray(oldData) ? oldData : []
          return safeOld.map((f: FolderWithConversation) => {
            if (f.id === updatedFolder.id) {
              return updatedFolder
            }
            return f
          })
        },
      )

      return { oldFolder, updatedFolder }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['folders', course_name], context?.oldFolder)
      console.error('Error saving updated folder to server:', error, context)
    },
    onSuccess: (_data, _variables, _context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (_data, _error, _variables, _context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', course_name] })
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', course_name],
      })
    },
  })
}
