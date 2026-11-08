// Theme handling: the chosen theme is remembered on this device.
// "auto" follows the phone: Trailhead in light mode, Alpenglow in dark mode.
import { useEffect, useState } from 'react'

export const THEMES = [
  { id: 'auto', name: 'Auto', blurb: 'Light by day, dark at night. Follows your phone.', swatch: ['#FBF7F0', '#1F4D3A', '#13122A', '#FF5E8A'] },
  { id: 'trailhead', name: 'Trailhead', blurb: 'Warm cream, forest green, sunrise orange', swatch: ['#FBF7F0', '#1F4D3A', '#F26B3A'] },
  { id: 'alpenglow', name: 'Alpenglow', blurb: 'Dark and soft with a sunset glow', swatch: ['#13122A', '#FF7A59', '#FF5E8A'] },
  { id: 'basecamp', name: 'Basecamp', blurb: 'Clean white, teal and amber', swatch: ['#F5F8FA', '#0E9F9A', '#F5A524'] },
  { id: 'classic', name: 'Classic', blurb: 'The original black and orange', swatch: ['#080808', '#FF6B00', '#f0f0f0'] },
]

const KEY = 'dropbag-theme'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function readChoice() {
  try {
    const v = localStorage.getItem(KEY)
    return THEMES.some(t => t.id === v) ? v : 'auto'
  } catch {
    return 'auto'
  }
}

function resolve(choice) {
  if (choice !== 'auto') return choice
  return darkQuery().matches ? 'alpenglow' : 'trailhead'
}

function apply(choice) {
  const theme = resolve(choice)
  document.documentElement.dataset.theme = theme
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#FBF7F0')
}

// Call once before the first render so the page never flashes the wrong theme.
export function initTheme() {
  apply(readChoice())
  darkQuery().addEventListener('change', () => apply(readChoice()))
}

export function useTheme() {
  const [choice, setChoice] = useState(readChoice)
  useEffect(() => { apply(choice) }, [choice])
  return [choice, next => {
    try { localStorage.setItem(KEY, next) } catch { /* private mode: still applies for this visit */ }
    setChoice(next)
  }]
}
