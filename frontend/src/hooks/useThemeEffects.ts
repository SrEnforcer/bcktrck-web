import { useEffect, useState } from 'react'

type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

const resolveSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

type UseThemeEffectsInput = {
  readonly themePreference: ThemePreference
}

/**
 * Derive and synchronize theme state with system preference and document root.
 */
export const useThemeEffects = (input: UseThemeEffectsInput): { readonly systemTheme: ResolvedTheme; readonly resolvedTheme: ResolvedTheme } => {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => resolveSystemTheme())
  const resolvedTheme: ResolvedTheme = input.themePreference === 'system' ? systemTheme : input.themePreference

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    handleChange()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  return { systemTheme, resolvedTheme }
}
