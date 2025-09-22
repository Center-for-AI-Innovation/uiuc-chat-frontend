import {
  type QueryClient,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import {
  type FolderInterface,
  type FolderWithConversation,
} from '~/types/folder'
import {
  deleteFolderFromServer,
  fetchFolders,
  saveFolderToServer,
} from '~/utils/app/folders'

// const queryClient = useQueryClient();

export function useFetchFolders(user_email: string, course_name: string) {
  return useQuery({
    queryKey: ['folders', course_name],
    queryFn: async () => (user_email ? fetchFolders(course_name) : []),
    enabled: !!user_email,
    refetchInterval: 20_000,
  })
}

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

export function useUpdateFolder(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['updateFolder', user_email, course_name],
    mutationFn: async (folder: FolderWithConversation) =>
      saveFolderToServer(folder, course_name),
    onMutate: async (updatedFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', course_name] })

      queryClient.setQueryData(
        ['folders', course_name],
        (oldData: FolderWithConversation[]) => {
          return oldData.map((f: FolderWithConversation) => {
            if (f.id === updatedFolder.id) {
              return updatedFolder
            }
            return f
          })
        },
      )

      const oldFolder = queryClient.getQueryData(['folders', course_name])

      return { oldFolder, updatedFolder }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['folders', course_name], context?.oldFolder)
      console.error('Error saving updated folder to server:', error, context)
    },
    onSuccess: (data, variables, context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', course_name] })
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', course_name],
      })
    },
  })
}

export function useDeleteFolder(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['deleteFolder', user_email, course_name],
    mutationFn: async (deletedFolder: FolderWithConversation) =>
      deleteFolderFromServer(deletedFolder, course_name),
    onMutate: async (deletedFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', course_name] })

      queryClient.setQueryData(
        ['folders', course_name],
        (oldData: FolderWithConversation[]) => {
          return oldData.filter(
            (f: FolderWithConversation) => f.id !== deletedFolder.id,
          )
        },
      )

      const oldFolder = queryClient.getQueryData(['folders', course_name])

      return { oldFolder, deletedFolder }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['folders', course_name], context?.oldFolder)
      console.error('Error deleting folder from server:', error, context)
    },
    onSuccess: (data, variables, context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', course_name] })
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', course_name],
      })
    },
  })
}
