import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cx, useControllable, useTheme } from './core';
import { TextField, type SelectOption } from './fields';

interface SliderBase {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  name?: string;
  marks?: { value: number; label?: ReactNode }[];
  formatValue?: (value: number) => string;
  className?: string;
}
export type SliderProps = SliderBase &
  (
    | {
        range?: false;
        value?: number;
        defaultValue?: number;
        onValueChange?: (value: number) => void;
        onValueCommit?: (value: number) => void;
      }
    | {
        range: true;
        value?: [number, number];
        defaultValue?: [number, number];
        onValueChange?: (value: [number, number]) => void;
        onValueCommit?: (value: [number, number]) => void;
      }
  );
export function Slider(props: SliderProps) {
  const {
    label,
    min = 0,
    max = 100,
    step = 1,
    disabled,
    name,
    marks,
    formatValue = String,
    className,
  } = props;
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [value, setValue] = useControllable<number | [number, number]>(
    props.value,
    props.defaultValue ?? (props.range ? [min, max] : min),
    (next) => {
      if (props.range) props.onValueChange?.(next as [number, number]);
      else props.onValueChange?.(next as number);
    },
  );
  const values = Array.isArray(value) ? value : [value];
  return (
    <div className={cx('qs-slider-field', disabled && 'qs-disabled', className)}>
      <div className="qs-slider-label">
        <span id={id}>{label}</span>
        <output className="qs-num">{values.map(formatValue).join(' – ')}</output>
      </div>
      <SliderPrimitive.Root
        className="qs-slider"
        data-dragging={!disabled && dragging ? '' : undefined}
        onPointerDownCapture={(event) => {
          if (!disabled && event.button === 0) setDragging(true);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onLostPointerCapture={() => setDragging(false)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        name={name}
        value={values}
        onValueChange={(next) => setValue(props.range ? (next as [number, number]) : next[0])}
        onValueCommit={(next) => {
          if (props.range) props.onValueCommit?.(next as [number, number]);
          else props.onValueCommit?.(next[0]);
        }}
      >
        <SliderPrimitive.Track className="qs-slider-track">
          <SliderPrimitive.Range className="qs-slider-range" />
        </SliderPrimitive.Track>
        {values.map((item, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className="qs-slider-thumb"
            aria-label={props.range ? `${label}${index === 0 ? '下限' : '上限'}` : label}
            aria-valuetext={formatValue(item)}
          >
            <span className="qs-slider-value" aria-hidden="true">
              {formatValue(item)}
            </span>
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
      {marks && (
        <div className="qs-slider-marks" aria-hidden="true">
          {marks
            .filter((mark) => mark.value >= min && mark.value <= max)
            .map((mark) => (
              <span
                key={mark.value}
                style={{ left: `${max === min ? 0 : ((mark.value - min) / (max - min)) * 100}%` }}
              >
                {mark.label ?? mark.value}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

export interface AutocompleteProps {
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (query: string) => void;
  loading?: boolean;
  filterOptions?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  placeholder?: string;
  description?: ReactNode;
  error?: ReactNode;
  emptyMessage?: string;
  className?: string;
}
export function Autocomplete({
  label,
  options,
  value,
  defaultValue = '',
  onValueChange,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  loading = false,
  filterOptions = true,
  disabled,
  readOnly,
  required,
  name,
  placeholder,
  description,
  error,
  emptyMessage = '没有匹配的选项',
  className,
}: AutocompleteProps) {
  const { container } = useTheme();
  const id = useId();
  const listId = `${id}-list`;
  const [selected, setSelected] = useControllable(value, defaultValue, onValueChange);
  const [query, setQuery] = useControllable(
    inputValue,
    defaultInputValue ??
      options.find((option) => option.value === (value ?? defaultValue))?.label ??
      '',
    onInputValueChange,
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [editing, setEditing] = useState(defaultInputValue !== undefined);
  const input = useRef<HTMLInputElement>(null);
  const [selectedOption, setSelectedOption] = useState<SelectOption | undefined>();
  const currentOption = options.find((option) => option.value === selected);
  const display =
    editing || inputValue !== undefined
      ? query
      : (currentOption?.label ?? (selectedOption?.value === selected ? selectedOption.label : ''));
  const candidates = options.filter(
    (option) =>
      !filterOptions ||
      !editing ||
      option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const enabled = loading ? [] : candidates.filter((option) => !option.disabled);
  const activeIndex = candidates.findIndex((option) => option.value === active && !option.disabled);
  const expanded = open && !disabled && !readOnly;
  useEffect(() => {
    input.current?.setCustomValidity(
      required && !selected && !!display ? '请选择建议列表中的选项' : '',
    );
  }, [required, selected, display]);
  useEffect(() => {
    if (expanded && activeIndex >= 0)
      document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [expanded, activeIndex, id]);
  const choose = (option: SelectOption) => {
    setSelected(option.value);
    setSelectedOption(option);
    setQuery(option.label);
    setEditing(false);
    setOpen(false);
    setActive(null);
  };
  const dismiss = () => {
    setOpen(false);
    setActive(null);
    setEditing(false);
    if (editing) setQuery(currentOption?.label ?? '');
  };
  const move = (direction: 1 | -1) => {
    setOpen(true);
    const index = enabled.findIndex((option) => option.value === active);
    const next =
      index < 0
        ? direction === 1
          ? 0
          : enabled.length - 1
        : (index + direction + enabled.length) % enabled.length;
    setActive(enabled[next]?.value ?? null);
  };
  return (
    <PopoverPrimitive.Root
      open={expanded}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <div className={cx('qs-autocomplete', className)}>
        <PopoverPrimitive.Anchor asChild>
          <div>
            <TextField
              id={id}
              ref={input}
              label={label}
              description={description}
              error={error}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              value={display}
              role="combobox"
              autoComplete="off"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-expanded={expanded}
              aria-controls={expanded ? listId : undefined}
              aria-activedescendant={
                expanded && activeIndex >= 0 && !loading ? `${id}-option-${activeIndex}` : undefined
              }
              onFocus={() => {
                if (!readOnly) setOpen(true);
              }}
              onClick={() => {
                if (!readOnly) setOpen(true);
              }}
              onChange={(event) => {
                setEditing(true);
                setQuery(event.target.value);
                if (selected) setSelected('');
                setOpen(true);
                setActive(null);
              }}
              onBlur={dismiss}
              onKeyDown={(event) => {
                if (disabled || readOnly || event.nativeEvent.isComposing) return;
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  move(event.key === 'ArrowDown' ? 1 : -1);
                } else if (event.key === 'Enter' && expanded) {
                  event.preventDefault();
                  const option = enabled.find((option) => option.value === active);
                  if (option) choose(option);
                } else if (event.key === 'Escape' && expanded) {
                  event.preventDefault();
                  event.stopPropagation();
                  dismiss();
                } else if (event.key === 'Tab') dismiss();
              }}
              trailing={
                <span aria-hidden="true" className="qs-muted">
                  ⌄
                </span>
              }
            />
          </div>
        </PopoverPrimitive.Anchor>
        {name && <input type="hidden" name={name} value={selected} disabled={disabled} />}
      </div>
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Content
          className="qs-autocomplete-popup"
          sideOffset={6}
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (event.target === input.current) event.preventDefault();
          }}
          onEscapeKeyDown={dismiss}
          role="presentation"
        >
          <div role="listbox" id={listId} aria-label={`${label}建议`} aria-busy={loading}>
            {!loading &&
              candidates.map((option, index) => (
                <div
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={selected === option.value}
                  aria-disabled={option.disabled || undefined}
                  className={cx('qs-autocomplete-option', active === option.value && 'active')}
                  onPointerMove={() => {
                    if (!option.disabled) setActive(option.value);
                  }}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (!option.disabled) choose(option);
                  }}
                >
                  <span>{option.label}</span>
                  {selected === option.value && <span aria-hidden="true">✓</span>}
                </div>
              ))}
          </div>
          {(loading || !candidates.length) && (
            <div className="qs-autocomplete-message" role="status">
              {loading ? '正在加载…' : emptyMessage}
            </div>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export { DatePicker, TimePicker } from './date-time';
export type { DateTimePickerProps } from './date-time';
