/**
 * Тема оформления: светлая, тёмная или как в системе.
 *
 * Выбор хранится в localStorage, а на <html> всегда стоит итоговый класс
 * theme-light или theme-dark — от него зависят CSS-переменные в app/globals.css.
 * Класс ставит THEME_SCRIPT в <head> до первой отрисовки, поэтому страница не мигает.
 */

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'uniktap-theme'
export const THEME_CHANGE_EVENT = 'uniktap-theme-change'

/** Цвет панели браузера и статус-бара — совпадает с --canvas. */
const THEME_COLORS: Record<ResolvedTheme, string> = { light: '#F5F7FA', dark: '#0B1220' }

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(preference: ThemePreference) {
  const theme = resolveTheme(preference)
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(`theme-${theme}`)
  root.style.colorScheme = theme
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = THEME_COLORS[theme]
  })
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // приватный режим — тема просто не запомнится
  }
  applyTheme(preference)
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
}

/**
 * То же, что applyTheme, но строкой для <script> в <head>: выполняется до React.
 * Заодно следит за сменой системной темы, если выбран режим «как в системе».
 */
export const THEME_SCRIPT = `(function(){
var k=${JSON.stringify(THEME_STORAGE_KEY)},c=${JSON.stringify(THEME_COLORS)};
function p(){try{var v=localStorage.getItem(k);return v==='light'||v==='dark'?v:'system'}catch(e){return 'system'}}
var q=window.matchMedia('(prefers-color-scheme: dark)');
function a(){var s=p(),t=s==='system'?(q.matches?'dark':'light'):s,r=document.documentElement;
r.classList.remove('theme-light','theme-dark');r.classList.add('theme-'+t);r.style.colorScheme=t;
var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].content=c[t]}
a();
if(q.addEventListener)q.addEventListener('change',function(){if(p()==='system')a()});
document.addEventListener('DOMContentLoaded',a);
})()`
