import * as React from "react"
import { cn } from "@/lib/utils"

export interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({
    className,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    containerClassName,
    id,
    ...props
  }, ref) => {
    const inputId = id || `floating-${label.toLowerCase().replace(/\s+/g, '-')}`
    const hasValue = props.value !== undefined && props.value !== ''
    const [focused, setFocused] = React.useState(false)

    return (
      <div className={cn("relative", containerClassName)}>
        <div
          className={cn(
            "relative flex items-center rounded-xl border bg-background transition-all duration-200",
            error
              ? "border-destructive/50 ring-2 ring-destructive/10"
              : focused
                ? "border-primary ring-2 ring-primary/10"
                : "border-border hover:border-muted-foreground/30",
          )}
        >
          {leftIcon && (
            <span className={cn(
              "pl-3 text-muted-foreground transition-colors duration-200",
              focused && "text-primary",
            )}>
              {leftIcon}
            </span>
          )}
          <div className="relative flex-1">
            <input
              ref={ref}
              id={inputId}
              onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
              onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
              className={cn(
                "peer w-full bg-transparent pt-4 pb-1.5 text-sm text-foreground outline-none",
                "placeholder:text-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                leftIcon ? "pl-2" : "pl-3",
                rightIcon ? "pr-10" : "pr-3",
                className,
              )}
              placeholder={label}
              {...props}
            />
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
                "pointer-events-none transition-all duration-200",
                "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary",
                "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm",
                (hasValue || focused) && "top-2 text-xs",
                hasValue && !focused && "text-muted-foreground",
                focused && "text-primary",
                error && "peer-focus:text-destructive",
              )}
            >
              {label}
            </label>
          </div>
          {rightIcon && (
            <span className="pr-3 text-muted-foreground">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-destructive animate-fade-in">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)
FloatingLabelInput.displayName = "FloatingLabelInput"

export interface FloatingLabelSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const FloatingLabelSelect = React.forwardRef<HTMLSelectElement, FloatingLabelSelectProps>(
  ({
    className,
    label,
    error,
    options,
    placeholder = "Seleccionar...",
    id,
    ...props
  }, ref) => {
    const selectId = id || `floating-select-${label.toLowerCase().replace(/\s+/g, '-')}`
    const hasValue = props.value !== undefined && props.value !== ''
    const [focused, setFocused] = React.useState(false)

    return (
      <div className="relative">
        <div
          className={cn(
            "relative rounded-xl border bg-background transition-all duration-200",
            error
              ? "border-destructive/50 ring-2 ring-destructive/10"
              : focused
                ? "border-primary ring-2 ring-primary/10"
                : "border-border hover:border-muted-foreground/30",
          )}
        >
          <select
            ref={ref}
            id={selectId}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            className={cn(
              "peer w-full bg-transparent pt-4 pb-1.5 pl-3 pr-10 text-sm text-foreground outline-none appearance-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className,
            )}
            {...props}
          >
            <option value="" disabled>{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label
            htmlFor={selectId}
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
              "pointer-events-none transition-all duration-200",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary",
              (hasValue || focused) && "top-2 text-xs",
              focused && "text-primary",
              error && "peer-focus:text-destructive",
            )}
          >
            {label}
          </label>
          {/* Chevron icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-destructive animate-fade-in">{error}</p>
        )}
      </div>
    )
  }
)
FloatingLabelSelect.displayName = "FloatingLabelSelect"

export interface FloatingLabelTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

const FloatingLabelTextarea = React.forwardRef<HTMLTextAreaElement, FloatingLabelTextareaProps>(
  ({
    className,
    label,
    error,
    id,
    ...props
  }, ref) => {
    const textareaId = id || `floating-textarea-${label.toLowerCase().replace(/\s+/g, '-')}`
    const hasValue = props.value !== undefined && props.value !== ''
    const [focused, setFocused] = React.useState(false)

    return (
      <div className="relative">
        <div
          className={cn(
            "relative rounded-xl border bg-background transition-all duration-200",
            error
              ? "border-destructive/50 ring-2 ring-destructive/10"
              : focused
                ? "border-primary ring-2 ring-primary/10"
                : "border-border hover:border-muted-foreground/30",
          )}
        >
          <textarea
            ref={ref}
            id={textareaId}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            className={cn(
              "peer w-full bg-transparent pt-5 pb-2 pl-3 pr-3 text-sm text-foreground outline-none resize-y min-h-[80px]",
              "placeholder:text-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className,
            )}
            placeholder={label}
            {...props}
          />
          <label
            htmlFor={textareaId}
            className={cn(
              "absolute left-3 top-3 text-sm text-muted-foreground",
              "pointer-events-none transition-all duration-200",
              "peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary",
              "peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm",
              (hasValue || focused) && "top-1.5 text-xs",
              focused && "text-primary",
              error && "peer-focus:text-destructive",
            )}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1 text-xs text-destructive animate-fade-in">{error}</p>
        )}
      </div>
    )
  }
)
FloatingLabelTextarea.displayName = "FloatingLabelTextarea"

export { FloatingLabelInput, FloatingLabelSelect, FloatingLabelTextarea }