import { create } from 'zustand'

type ActiveTab = 'inbox' | 'mentions' | 'spam'
type Channel = 'whatsapp' | 'email' | 'phone' | 'sms' | 'in_person'

interface OmnideskState {
  activeConversationId: string | null
  isInternalNote: boolean
  selectedChannel: Channel
  activeTab: ActiveTab
  setActiveConversationId: (id: string | null) => void
  setIsInternalNote: (val: boolean) => void
  setSelectedChannel: (channel: Channel) => void
  setActiveTab: (tab: ActiveTab) => void
}

export const useOmnideskStore = create<OmnideskState>((set) => ({
  activeConversationId: null,
  isInternalNote: false,
  selectedChannel: 'whatsapp',
  activeTab: 'inbox',
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setIsInternalNote: (val) => set({ isInternalNote: val }),
  setSelectedChannel: (channel) => set({ selectedChannel: channel }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
