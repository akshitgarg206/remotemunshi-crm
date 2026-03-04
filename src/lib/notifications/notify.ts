/**
 * Browser Notification API utility for activity timer.
 * Sends a desktop notification when the 15-minute block completes.
 */

/** Request notification permission. Call on first timer start. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Send a timer-complete notification. Fails silently if not permitted. */
export function sendTimerNotification(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    const n = new Notification('Activity Timer', {
      body: 'Your 15-minute block is complete. Log your activity!',
      icon: '/next.svg',
      tag: 'activity-timer', // replaces previous notification with same tag
      requireInteraction: true, // stays visible until user interacts
    })

    // Focus the tab when notification is clicked
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    // Notification constructor can throw in some environments
  }
}
