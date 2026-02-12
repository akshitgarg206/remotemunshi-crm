import { create } from 'zustand'

type ActiveTab = 'inbox' | 'mentions' | 'spam'
export type Channel = 'whatsapp' | 'email' | 'phone' | 'sms' | 'in_person'

interface OmnideskState {
  activeConversationId: string | null
  isInternalNote: boolean
  selectedChannel: Channel | null // null = "All" channels
  selectedPhoneNumberId: string | null
  activeTab: ActiveTab
  setActiveConversationId: (id: string | null) => void
  setIsInternalNote: (val: boolean) => void
  setSelectedChannel: (channel: Channel | null) => void
  setSelectedPhoneNumberId: (id: string | null) => void
  setActiveTab: (tab: ActiveTab) => void
}

export const useOmnideskStore = create<OmnideskState>((set) => ({
  activeConversationId: null,
  isInternalNote: false,
  selectedChannel: null,
  selectedPhoneNumberId: null,
  activeTab: 'inbox',
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setIsInternalNote: (val) => set({ isInternalNote: val }),
  setSelectedChannel: (channel) => set({
    selectedChannel: channel,
    // Auto-clear phone number filter when switching away from whatsapp
    selectedPhoneNumberId: channel === 'whatsapp' ? undefined : null,
  }),
  setSelectedPhoneNumberId: (id) => set({ selectedPhoneNumberId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
