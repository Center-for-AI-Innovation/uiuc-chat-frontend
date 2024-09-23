import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { FolderInterface, FolderWithConversation } from '~/types/folder'
import {
  deleteFolderFromServer,
  fetchFolders,
  saveFolderToServer,
} from '~/utils/app/folders'

// const queryClient = useQueryClient();

export function useFetchFolders(user_email: string) {
  return useQuery({
    queryKey: ['folders', user_email],
    queryFn: async () => (user_email ? fetchFolders(user_email) : []),
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
    mutationKey: ['createFolder', user_email],
    mutationFn: async (newFolder: FolderWithConversation) =>
      saveFolderToServer(newFolder, user_email),
    onMutate: async (newFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', user_email] })

      queryClient.setQueryData(
        ['folders', user_email],
        (oldData: FolderInterface[]) => {
          return [newFolder, ...oldData]
        },
      )

      const oldFolders = queryClient.getQueryData(['folders', user_email])

      return { newFolder, oldFolders }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['folders', user_email], context?.oldFolders)
      console.error('Error saving updated folder to server:', error, context)
    },
    onSuccess: (data, variables, context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', user_email] })
    },
  })
}

export function useUpdateFolder(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['updateFolder', user_email],
    mutationFn: async (folder: FolderWithConversation) =>
      saveFolderToServer(folder, user_email),
    onMutate: async (updatedFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', user_email] })

      queryClient.setQueryData(
        ['folders', user_email],
        (oldData: FolderWithConversation[]) => {
          return oldData.map((f: FolderWithConversation) => {
            if (f.id === updatedFolder.id) {
              return updatedFolder
            }
            return f
          })
        },
      )

      const oldFolder = queryClient.getQueryData(['folders', user_email])

      return { oldFolder, updatedFolder }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['folders', user_email], context?.oldFolder)
      console.error('Error saving updated folder to server:', error, context)
    },
    onSuccess: (data, variables, context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', user_email] })
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', user_email, course_name],
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
    mutationKey: ['deleteFolder', user_email],
    mutationFn: async (deletedFolder: FolderWithConversation) =>
      deleteFolderFromServer(deletedFolder),
    onMutate: async (deletedFolder: FolderWithConversation) => {
      await queryClient.cancelQueries({ queryKey: ['folders', user_email] })

      queryClient.setQueryData(
        ['folders', user_email],
        (oldData: FolderWithConversation[]) => {
          return oldData.filter(
            (f: FolderWithConversation) => f.id !== deletedFolder.id,
          )
        },
      )

      const oldFolder = queryClient.getQueryData(['folders', user_email])

      return { oldFolder, deletedFolder }
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(['folders', user_email], context?.oldFolder)
      console.error('Error deleting folder from server:', error, context)
    },
    onSuccess: (data, variables, context) => {
      // No need to do anything here because the folders query will be invalidated
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['folders', user_email] })
      queryClient.invalidateQueries({
        queryKey: ['conversationHistory', user_email, course_name],
      })
    },
  })
}
