import { type QueryClient, useMutation } from '@tanstack/react-query'
import {
  type FolderWithConversation,
  type FolderInterface,
} from '~/types/folder'
import { saveFolderToServer } from '@/hooks/__internal__/folders'

export function useCreateFolder(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['createFolder', user_email, course_name],
    mutationFn: async (newFolder: FolderWithConversation) =>
      saveFolderToServer(newFolder, course_name, user_email),
    onMutate: async (newFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', course_name] })

      const oldFolders = queryClient.getQueryData(['folders', course_name])

      queryClient.setQueryData(
        ['folders', course_name],
        (oldData: FolderInterface[] | undefined) => {
          const safeOld = Array.isArray(oldData) ? oldData : []
          return [newFolder, ...safeOld]
        },
      )

      return { newFolder, oldFolders }
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['folders', course_name], context?.oldFolders)
      console.error('Error saving updated folder to server:', error, context)
    },
    onSuccess: (_data, _variables, _context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (_data, _error, _variables, _context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', course_name] })
    },
  })
}
