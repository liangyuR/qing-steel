import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cx, useControllable, useTheme } from './core';
import SelectionTrack from './internal/SelectionTrack';
import { CheckMark, ChevronMark, ErrorMark, UploadMark } from './internal/marks';

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
          <small
            key={error ? 'error' : 'help'}
            id={descriptionId}
            className={error ? 'qs-error' : 'qs-muted'}
          >
            {error && <ErrorMark />}
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
  step?: number | 'any';
  precision?: number;
  unit?: string;
  clamp?: boolean;
  rangeError?: ReactNode | ((range: { min?: number; max?: number; unit?: string }) => ReactNode);
}
function bound(value: number | string | undefined) {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
function defaultRangeError({ min, max, unit }: { min?: number; max?: number; unit?: string }) {
  const suffix = unit ? ` ${unit}` : '';
  if (min !== undefined && max !== undefined) return `应在 ${min}–${max}${suffix} 之间`;
  return min !== undefined ? `不能小于 ${min}${suffix}` : `不能大于 ${max}${suffix}`;
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
    clamp = true,
    rangeError,
    onBlur,
    error,
    ...props
  },
  ref,
) {
  const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
  const lower = bound(min);
  const upper = bound(max);
  const outOfRange =
    !clamp &&
    current !== '' &&
    ((lower !== undefined && current < lower) || (upper !== undefined && current > upper));
  const rangeMessage = outOfRange
    ? typeof rangeError === 'function'
      ? rangeError({ min: lower, max: upper, unit })
      : (rangeError ?? defaultRangeError({ min: lower, max: upper, unit }))
    : undefined;
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
      error={error || (props.label || props.description ? rangeMessage : undefined)}
      aria-invalid={props['aria-invalid'] ?? (outOfRange || undefined)}
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
          if (clamp && lower !== undefined) next = Math.max(lower, next);
          if (clamp && upper !== undefined) next = Math.min(upper, next);
          if (next !== current) setCurrent(next);
        }
        onBlur?.(event);
      }}
    />
  );
});
export interface SelectOption<Label extends ReactNode = string> {
  value: string;
  label: Label;
  disabled?: boolean;
  textValue?: string;
  'aria-label'?: string;
}
export interface SelectGroup<Label extends ReactNode = string> {
  label: string;
  options: SelectOption<Label>[];
}
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldDecoration {
  options: (SelectOption<ReactNode> | SelectGroup<ReactNode>)[];
  placeholder?: string;
  onValueChange?: (value: string) => void;
}
const optionText = (option: SelectOption<ReactNode>) =>
  option.textValue ??
  (typeof option.label === 'string' || typeof option.label === 'number'
    ? String(option.label)
    : (option['aria-label'] ?? option.value));
const blockWhenDisabled = (event: SyntheticEvent<HTMLButtonElement>) => {
  if (event.currentTarget.matches(':disabled')) event.preventDefault();
};
function NativeSelectControl({
  options,
  placeholder,
  onValueChange,
  className,
  onChange,
  ...props
}: Omit<SelectProps, keyof FieldDecoration>) {
  const field = useFieldProps(props);
  const option = (item: SelectOption<ReactNode>) => (
    <option
      key={item.value}
      value={item.value}
      disabled={item.disabled}
      aria-label={item['aria-label']}
    >
      {optionText(item)}
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
  const [navigation, setNavigation] = useState<'pointer' | 'keyboard'>('pointer');
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
  const item = (option: SelectOption<ReactNode>) => (
    <SelectPrimitive.Item
      className="qs-select-item"
      key={option.value}
      value={`option:${option.value}`}
      disabled={option.disabled}
      textValue={option.textValue}
      {...(option['aria-label'] && {
        'aria-label': option['aria-label'],
        'aria-labelledby': undefined,
      })}
    >
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="qs-select-check">
        <CheckMark />
      </SelectPrimitive.ItemIndicator>
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
            {optionText(option)}
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
          data-value={current}
          aria-label={props['aria-label']}
          aria-labelledby={props['aria-labelledby']}
          aria-describedby={field['aria-describedby']}
          aria-invalid={field['aria-invalid']}
          aria-required={field.required}
          autoFocus={props.autoFocus}
          title={props.title}
          onPointerDown={(event) => {
            blockWhenDisabled(event);
            setNavigation('pointer');
          }}
          onClick={blockWhenDisabled}
          onKeyDown={(event) => {
            blockWhenDisabled(event);
            setNavigation('keyboard');
          }}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="qs-select-chevron">
            <ChevronMark />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal container={container}>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className="qs-select-content"
            data-nav={navigation}
            onPointerMove={() => setNavigation('pointer')}
            onKeyDown={() => setNavigation('keyboard')}
          >
            <SelectPrimitive.ScrollUpButton className="qs-select-scroll up">
              <ChevronMark />
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
              <ChevronMark />
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
    <label className={cx('qs-choice', 'qs-checkbox', props.disabled && 'qs-disabled', className)}>
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
      <span className="qs-checkbox-box" aria-hidden="true">
        <svg viewBox="0 0 18 18" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className="qs-checkbox-check" d="m4.75 9.25 2.75 2.75 5.75-6.5" />
          <path className="qs-checkbox-dash" d="M5 9h8" />
        </svg>
      </span>
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
        <span className="qs-switch-thumb" />
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
          <label
            key={option.value}
            className={cx('qs-choice', 'qs-radio', option.disabled && 'qs-disabled')}
          >
            <input
              type="radio"
              name={name ?? id}
              value={option.value}
              checked={current === option.value}
              disabled={option.disabled}
              required={required}
              aria-label={option['aria-label']}
              onChange={() => setCurrent(option.value)}
            />
            <span className="qs-radio-mark" aria-hidden="true" />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
type SegmentedBase = {
  label: string;
  options: SelectOption<ReactNode>[];
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
            aria-label={option['aria-label']}
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
export interface FileInputProps
  extends
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'children' | 'placeholder'
    >,
    FieldDecoration {
  files?: readonly File[];
  onFilesChange?: (files: File[]) => void;
  dropzone?: boolean;
  buttonLabel?: ReactNode;
  placeholder?: ReactNode;
}
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const [size, unit] = bytes < 1024 * 1024 ? [bytes / 1024, 'KB'] : [bytes / 1024 / 1024, 'MB'];
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${unit}`;
}
const carriesFiles = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');
const FileControl = forwardRef<HTMLInputElement, Omit<FileInputProps, keyof FieldDecoration>>(
  function FileControl(
    {
      files,
      onFilesChange,
      dropzone,
      buttonLabel = '选择文件',
      placeholder,
      className,
      onChange,
      title,
      ...props
    },
    forwardedRef,
  ) {
    const field = useFieldProps(props);
    const input = useRef<HTMLInputElement | null>(null);
    const [picked, setPicked] = useState<File[]>([]);
    const [over, setOver] = useState(false);
    const shown = files ?? picked;
    const latest = useRef({ files, onFilesChange });
    useLayoutEffect(() => {
      latest.current = { files, onFilesChange };
    });
    const commit = useCallback((next: File[]) => {
      if (latest.current.files === undefined) setPicked(next);
      latest.current.onFilesChange?.(next);
    }, []);
    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        input.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    useLayoutEffect(() => {
      if (files && !files.length && input.current?.value) input.current.value = '';
    }, [files]);
    useEffect(() => {
      const form = input.current?.form;
      const reset = (event: Event) =>
        queueMicrotask(() => {
          if (!event.defaultPrevented) commit([]);
        });
      form?.addEventListener('reset', reset);
      return () => form?.removeEventListener('reset', reset);
    }, [commit]);
    const blocked = () => !input.current || input.current.matches(':disabled');
    const names = shown.map((file) => file.name).join('、');
    return (
      <div
        className={cx(
          'qs-file',
          dropzone && 'dropzone',
          over && 'dragging',
          shown.length > 0 && 'has-files',
          props.disabled && 'qs-disabled',
          className,
        )}
        onDragOver={(event) => {
          if (!carriesFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = blocked() ? 'none' : 'copy';
          if (!blocked()) setOver(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
        }}
        onDrop={(event) => {
          if (!carriesFiles(event)) return;
          event.preventDefault();
          setOver(false);
          const native = input.current;
          if (!native || blocked()) return;
          const dropped = Array.from(event.dataTransfer.files).slice(
            0,
            props.multiple ? undefined : 1,
          );
          if (!dropped.length) return;
          if (typeof DataTransfer !== 'undefined') {
            const transfer = new DataTransfer();
            dropped.forEach((file) => transfer.items.add(file));
            native.files = transfer.files;
            native.dispatchEvent(new Event('input', { bubbles: true }));
            native.dispatchEvent(new Event('change', { bubbles: true }));
          } else commit(dropped);
        }}
      >
        <input
          {...props}
          {...field}
          ref={setRef}
          type="file"
          className="qs-file-native"
          title={title ?? names}
          onChange={(event) => {
            const next = Array.from(event.target.files ?? []);
            onChange?.(event);
            commit(next);
          }}
        />
        {dropzone ? (
          <>
            <span className="qs-file-prompt" aria-hidden="true">
              <span className="qs-file-icon">
                <UploadMark size={22} />
              </span>
              <span>
                {placeholder ?? '拖放文件到此处，或'} <b>{buttonLabel}</b>
              </span>
            </span>
            {shown.length > 0 && (
              <ul className="qs-file-list">
                {shown.map((file, index) => (
                  <li key={`${index}-${file.name}`}>
                    <span className="qs-file-name">{file.name}</span>
                    <span className="qs-file-size">{formatFileSize(file.size)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <span className="qs-file-button" aria-hidden="true">
              <UploadMark size={16} />
              {buttonLabel}
            </span>
            {shown.length ? (
              <span className="qs-file-summary">
                <span className="qs-file-name">{names}</span>
                <span className="qs-file-size">
                  {shown.length > 1 ? `${shown.length} 个文件` : formatFileSize(shown[0].size)}
                </span>
              </span>
            ) : (
              <span className="qs-file-summary empty">{placeholder ?? '未选择文件'}</span>
            )}
          </>
        )}
      </div>
    );
  },
);
export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  { label, description, error, ...props },
  ref,
) {
  const control = <FileControl {...props} ref={ref} />;
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
