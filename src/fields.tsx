import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useEffect,
  useLayoutEffect,
  useRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cx, useControllable, useTheme } from './core';
import SelectionTrack from './internal/SelectionTrack';

interface FieldMeta {
  id: string;
  descriptionId?: string;
  invalid: boolean;
  required?: boolean;
}
const FieldContext = createContext<FieldMeta | null>(null);
export interface FormFieldProps {
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}
export function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const descriptionId = error || description ? `${controlId}-help` : undefined;
  return (
    <FieldContext.Provider value={{ id: controlId, descriptionId, invalid: !!error, required }}>
      <div className={cx('qs-field', !!error && 'qs-invalid', className)}>
        {label && (
          <label htmlFor={controlId}>
            {label}
            {required && <span aria-hidden="true"> *</span>}
          </label>
        )}
        {children}
        {descriptionId && (
          <small id={descriptionId} className={error ? 'qs-error' : 'qs-muted'}>
            {error || description}
          </small>
        )}
      </div>
    </FieldContext.Provider>
  );
}
function useFieldProps(props: {
  id?: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: InputHTMLAttributes<HTMLInputElement>['aria-invalid'];
}) {
  const context = useContext(FieldContext);
  return {
    id: props.id ?? context?.id,
    required: props.required ?? context?.required,
    'aria-describedby':
      [props['aria-describedby'], context?.descriptionId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': props['aria-invalid'] ?? (context?.invalid || undefined),
  };
}
type FieldDecoration = Pick<FormFieldProps, 'label' | 'description' | 'error'>;
export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement>, FieldDecoration {
  leading?: ReactNode;
  trailing?: ReactNode;
}
const InputControl = forwardRef<HTMLInputElement, Omit<TextFieldProps, keyof FieldDecoration>>(
  function InputControl({ leading, trailing, className, ...props }, ref) {
    const field = useFieldProps(props);
    return (
      <div className={cx('qs-input', props.disabled && 'qs-disabled', className)}>
        {leading}
        <input {...props} {...field} ref={ref} />
        {trailing}
      </div>
    );
  },
);
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, description, error, ...props },
  ref,
) {
  const control = <InputControl {...props} ref={ref} />;
  return label || description || error ? (
    <FormField
      id={props.id}
      label={label}
      description={description}
      error={error}
      required={props.required}
    >
      {control}
    </FormField>
  ) : (
    control
  );
});
export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldDecoration {}
const AreaControl = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AreaControl({ className, ...props }, ref) {
    const field = useFieldProps(props);
    return (
      <textarea rows={3} {...props} {...field} ref={ref} className={cx('qs-textarea', className)} />
    );
  },
);
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, description, error, ...props },
  ref,
) {
  const control = <AreaControl {...props} ref={ref} />;
  return label || description || error ? (
    <FormField
      id={props.id}
      label={label}
      description={description}
      error={error}
      required={props.required}
    >
      {control}
    </FormField>
  ) : (
    control
  );
});
export interface NumberFieldProps extends Omit<
  TextFieldProps,
  'value' | 'defaultValue' | 'type' | 'onChange' | 'step'
> {
  value?: number | '';
  defaultValue?: number | '';
  onValueChange?: (value: number | '') => void;
  step?: number;
  precision?: number;
  unit?: string;
}
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    value,
    defaultValue = '',
    onValueChange,
    precision,
    unit,
    min,
    max,
    step = 1,
    onBlur,
    ...props
  },
  ref,
) {
  const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
  return (
    <TextField
      {...props}
      ref={ref}
      type="number"
      inputMode="decimal"
      value={current}
      min={min}
      max={max}
      step={step}
      className={cx('num', props.className)}
      trailing={unit ? <span className="unit">{unit}</span> : props.trailing}
      onChange={(event) =>
        setCurrent(
          event.target.value === '' || Number.isNaN(event.target.valueAsNumber)
            ? ''
            : event.target.valueAsNumber,
        )
      }
      onBlur={(event) => {
        if (current !== '') {
          let next = current;
          if (precision !== undefined)
            next = Number(next.toFixed(Math.max(0, Math.min(20, precision))));
          if (min !== undefined) next = Math.max(Number(min), next);
          if (max !== undefined) next = Math.min(Number(max), next);
          if (next !== current) setCurrent(next);
        }
        onBlur?.(event);
      }}
    />
  );
});
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface SelectGroup {
  label: string;
  options: SelectOption[];
}
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldDecoration {
  options: (SelectOption | SelectGroup)[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
}
function NativeSelectControl({
  options,
  placeholder,
  onValueChange,
  className,
  onChange,
  ...props
}: Omit<SelectProps, keyof FieldDecoration>) {
  const field = useFieldProps(props);
  const option = (item: SelectOption) => (
    <option key={item.value} value={item.value} disabled={item.disabled}>
      {item.label}
    </option>
  );
  return (
    <div className={cx('qs-input', props.disabled && 'qs-disabled', className)}>
      <select
        {...props}
        {...field}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((item) =>
          'options' in item ? (
            <optgroup key={item.label} label={item.label}>
              {item.options.map(option)}
            </optgroup>
          ) : (
            option(item)
          ),
        )}
      </select>
    </div>
  );
}
function StyledSelectControl({
  options,
  placeholder,
  onValueChange,
  className,
  onChange,
  value,
  defaultValue,
  ...props
}: Omit<SelectProps, keyof FieldDecoration>) {
  const field = useFieldProps(props);
  const { container } = useTheme();
  const nativeRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const flat = options.flatMap((item) => ('options' in item ? item.options : [item]));
  const initial = String(
    defaultValue ?? (placeholder ? '' : (flat.find((item) => !item.disabled)?.value ?? '')),
  );
  const [current, setCurrent] = useControllable(
    value === undefined ? undefined : String(value),
    initial,
    onValueChange,
  );
  useLayoutEffect(() => {
    if (nativeRef.current) nativeRef.current.value = current;
  });
  useEffect(() => {
    const form = nativeRef.current?.form;
    const reset = (event: Event) => {
      // Native reset runs after the event. Restore the React value after that default action.
      queueMicrotask(() => {
        if (event.defaultPrevented || !nativeRef.current) return;
        nativeRef.current.value = value === undefined ? initial : String(value);
        if (value === undefined) setCurrent(initial);
      });
    };
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [value, initial, setCurrent]);
  const item = (option: SelectOption) => (
    <SelectPrimitive.Item
      className="qs-select-item"
      key={option.value}
      value={`option:${option.value}`}
      disabled={option.disabled}
    >
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="qs-select-check">✓</SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
  return (
    <div className={cx('qs-select', props.disabled && 'qs-disabled', className)}>
      <select
        {...props}
        {...field}
        ref={nativeRef}
        id={field.id ? `${field.id}-native` : undefined}
        className="qs-select-native"
        tabIndex={-1}
        aria-hidden="true"
        defaultValue={initial}
        onInvalid={(event) => {
          props.onInvalid?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            triggerRef.current?.focus();
          }
        }}
        onChange={(event) => {
          setCurrent(event.target.value);
          onChange?.(event);
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {flat.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <SelectPrimitive.Root
        disabled={props.disabled}
        value={flat.some((option) => option.value === current) ? `option:${current}` : ''}
        onValueChange={(next) => {
          const native = nativeRef.current;
          if (!native) return;
          Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(
            native,
            next.slice(7),
          );
          native.dispatchEvent(new Event('change', { bubbles: true }));
          if (value !== undefined) native.value = String(value);
        }}
      >
        <SelectPrimitive.Trigger
          ref={triggerRef}
          className="qs-select-trigger"
          id={field.id}
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={field['aria-describedby']}
          aria-invalid={field['aria-invalid']}
          aria-required={field.required}
          autoFocus={props.autoFocus}
          title={props.title}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="qs-select-chevron" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal container={container}>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className="qs-select-content"
          >
            <SelectPrimitive.ScrollUpButton className="qs-select-scroll">
              ⌃
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="qs-select-viewport">
              {options.map((option, index) =>
                'options' in option ? (
                  <SelectPrimitive.Group key={`${option.label}-${index}`}>
                    <SelectPrimitive.Label className="qs-select-label">
                      {option.label}
                    </SelectPrimitive.Label>
                    {option.options.map(item)}
                  </SelectPrimitive.Group>
                ) : (
                  item(option)
                ),
              )}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="qs-select-scroll">
              ⌄
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
export function Select({ label, description, error, ...props }: SelectProps) {
  const control =
    props.multiple || (props.size !== undefined && props.size > 1) ? (
      <NativeSelectControl {...props} />
    ) : (
      <StyledSelectControl {...props} />
    );
  return label || description || error ? (
    <FormField
      id={props.id}
      label={label}
      description={description}
      error={error}
      required={props.required}
    >
      {control}
    </FormField>
  ) : (
    control
  );
}
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
export function Checkbox({
  label,
  indeterminate,
  onCheckedChange,
  onChange,
  className,
  ...props
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <label className={cx('qs-choice', props.disabled && 'qs-disabled', className)}>
      <input
        {...props}
        ref={ref}
        type="checkbox"
        aria-checked={indeterminate ? 'mixed' : undefined}
        onChange={(event) => {
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
      />
      <span>{label}</span>
    </label>
  );
}
export function Switch({
  label,
  onCheckedChange,
  onChange,
  className,
  ...props
}: Omit<CheckboxProps, 'indeterminate'>) {
  return (
    <label className={cx('qs-choice', 'qs-switch', props.disabled && 'qs-disabled', className)}>
      <input
        {...props}
        type="checkbox"
        role="switch"
        onChange={(event) => {
          onChange?.(event);
          onCheckedChange?.(event.target.checked);
        }}
      />
      <span className="qs-switch-track" aria-hidden="true">
        <span />
      </span>
      <span>{label}</span>
    </label>
  );
}
export interface RadioGroupProps {
  label: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  direction?: 'row' | 'column';
}
export function RadioGroup({
  label,
  name,
  value,
  defaultValue = '',
  onValueChange,
  options,
  disabled,
  required,
  direction = 'row',
}: RadioGroupProps) {
  const id = useId();
  const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
  return (
    <fieldset className="qs-radio-group" disabled={disabled}>
      <legend>{label}</legend>
      <div className="qs-stack" style={{ flexDirection: direction, gap: 16 }}>
        {options.map((option) => (
          <label key={option.value} className={cx('qs-choice', option.disabled && 'qs-disabled')}>
            <input
              type="radio"
              name={name ?? id}
              value={option.value}
              checked={current === option.value}
              disabled={option.disabled}
              required={required}
              onChange={() => setCurrent(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
type SegmentedBase = {
  label: string;
  options: SelectOption[];
  disabled?: boolean;
  size?: 'sm' | 'md';
};
export type SegmentedControlProps = SegmentedBase &
  (
    | {
        multiple?: false;
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string) => void;
      }
    | {
        multiple: true;
        value?: string[];
        defaultValue?: string[];
        onValueChange?: (value: string[]) => void;
      }
  );
export function SegmentedControl(props: SegmentedControlProps) {
  const [current, setCurrent] = useControllable<string | string[]>(
    props.value,
    props.defaultValue ?? (props.multiple ? [] : ''),
    (next) => {
      if (props.multiple) props.onValueChange?.(next as string[]);
      else props.onValueChange?.(next as string);
    },
  );
  return (
    <SelectionTrack
      activeKey={Array.isArray(current) ? current.join(',') : current}
      className={cx('qs-seg', props.size === 'sm' && 'sm')}
      role="group"
      aria-label={props.label}
    >
      {props.options.map((option) => {
        const selected = Array.isArray(current)
          ? current.includes(option.value)
          : current === option.value;
        return (
          <button
            type="button"
            key={option.value}
            className={selected && !props.multiple ? 'active' : undefined}
            disabled={props.disabled || option.disabled}
            aria-pressed={selected}
            onClick={() =>
              setCurrent(
                props.multiple
                  ? selected
                    ? (current as string[]).filter((v) => v !== option.value)
                    : [...(current as string[]), option.value]
                  : option.value,
              )
            }
          >
            {option.label}
          </button>
        );
      })}
    </SelectionTrack>
  );
}
