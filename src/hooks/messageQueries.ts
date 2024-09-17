import { QueryClient, useMutation } from '@tanstack/react-query'
import { Message } from '~/types/chat'
import { deleteMessagesFromServer } from '~/utils/app/message'

// this will only be used for Regenerate Response or Edit a previous message when x number of messages should be deleted
//
export function useDeleteMessages(
  user_email: string,
  queryClient: QueryClient,
  course_name: string,
) {
  return useMutation({
    mutationKey: ['deleteMessages', user_email],
    mutationFn: async ({
      convoId,
      deletedMessages,
    }: {
      convoId: string
      deletedMessages: Message[]
    }) =>
      deleteMessagesFromServer(
        deletedMessages.map((message) => message.id) || [],
        user_email,
        course_name,
      ),
    onMutate: async ({
      convoId,
      deletedMessages,
    }: {
      convoId: string
      deletedMessages: Message[]
    }) => {
      console.log('In onMutate for deleteMessages')
      console.log('convoId: ', convoId)
      console.log('deletedMessages: ', deletedMessages)
    },
    // Step 1: Cancel the query to prevent it from refetching
    // await queryClient.cancelQueries({
    //   queryKey: ['MessagesHistory', user_email, course_name, search_term],
    // })
    // Step 2: Perform the optimistic update
    // queryClient.setQueryData(
    //   ['MessagesHistory', user_email, course_name, search_term],
    //   (oldData: Message[] | undefined) => {
    //     if (!oldData) return oldData
    //     console.log('oldData: ', oldData)
    //     return oldData.filter(
    //       (message: Message) => !deletedMessages.includes(message),
    //     )
    //   },
    // )
    // Step 3: Create a context object with the deleted Messages
    // const oldMessages = queryClient.getQueryData([
    //   'MessagesHistory',
    //   user_email,
    onError: (error, variables, context) => {
      console.error('Error saving updated Messages to server:', error, context)
    },
    onSuccess: (data, variables, context) => {},
    onSettled: (data, error, variables, context) => {},
  })
}
