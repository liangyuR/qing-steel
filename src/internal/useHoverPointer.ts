import { useState, type HTMLAttributes, type PointerEvent } from 'react';

type PointerHandlers<T extends HTMLElement> = Pick<
  HTMLAttributes<T>,
  'onPointerEnter' | 'onPointerMove' | 'onPointerDown'
>;

export function useHoverPointer<T extends HTMLElement>(
  enabled: boolean,
  handlers: PointerHandlers<T>,
) {
  const [pointer, setPointer] = useState<'mouse' | 'touch'>();
  const track = (event: PointerEvent<T>) => {
    if (enabled) setPointer(event.pointerType === 'mouse' ? 'mouse' : 'touch');
  };
  return {
    'data-qs-hover-pointer': enabled ? pointer : undefined,
    onPointerEnter: (event: PointerEvent<T>) => {
      track(event);
      handlers.onPointerEnter?.(event);
    },
    onPointerMove: (event: PointerEvent<T>) => {
      track(event);
      handlers.onPointerMove?.(event);
    },
    onPointerDown: (event: PointerEvent<T>) => {
      track(event);
      handlers.onPointerDown?.(event);
    },
  };
}
