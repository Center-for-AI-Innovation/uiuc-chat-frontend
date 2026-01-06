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
      saveFolderToServer(newFolder, course_name),
    onMutate: async (newFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', course_name] })

      queryClient.setQueryData(
        ['folders', course_name],
        (oldData: FolderInterface[]) => {
          return [newFolder, ...oldData]
        },
      )

      const oldFolders = queryClient.getQueryData(['folders', course_name])

      return { newFolder, oldFolders }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['folders', course_name], context?.oldFolders)
      console.error('Error saving updated folder to server:', error, context)
    },
    onSuccess: (data, variables, context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', course_name] })
    },
  })
}
