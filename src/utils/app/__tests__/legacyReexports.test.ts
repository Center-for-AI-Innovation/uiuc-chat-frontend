import { describe, expect, it } from 'vitest'
import * as conversation from '../conversation'
import * as folders from '../folders'
import * as message from '../message'

describe('legacy utils/app re-export shims', () => {
  it('re-exports internal conversation/folder/message helpers', () => {
    expect(typeof conversation.fetchConversationHistory).toBe('function')
    expect(typeof conversation.saveConversationToServer).toBe('function')
    expect(typeof folders.fetchFolders).toBe('function')
    expect(typeof message.deleteMessagesFromServer).toBe('function')
  })
})
