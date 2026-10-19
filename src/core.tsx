import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

export const cx = (...values: (string | false | undefined)[]) => values.filter(Boolean).join(' ');
export type Size = 'sm' | 'md';
export type Tone = 'info' | 'ok' | 'warn' | 'ng' | 'fault';
export type Theme = 'dark' | 'light' | 'system';
export type TokenOverrides = CSSProperties & { [key: `--${string}`]: string | number };
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  container: HTMLDivElement | null;
}>({ theme: 'dark', setTheme: () => {}, container: null });

export function useControllable<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value === undefined ? internal : value;
  return [
    current,
    (next: T) => {
      if (value === undefined) setInternal(next);
      onChange?.(next);
    },
  ] as const;
}

export function ThemeProvider({
  children,
  theme,
  defaultTheme = 'dark',
  onThemeChange,
  tokens,
  className,
}: {
  children: ReactNode;
  theme?: Theme;
  defaultTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  tokens?: TokenOverrides;
  className?: string;
}) {
  const [current, setTheme] = useControllable(theme, defaultTheme, onThemeChange);
  const [system, setSystem] = useState<'dark' | 'light'>('dark');
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const update = () => setSystem(query.matches ? 'light' : 'dark');
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const resolved = current === 'system' ? system : current;
  return (
    <ThemeContext.Provider value={{ theme: current, setTheme, container }}>
      <div
        ref={setContainer}
        className={cx('qs-root', `qs-scheme-${resolved}`, className)}
        style={tokens}
        data-theme={resolved}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
