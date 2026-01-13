/**
 * Accessible Input - WCAG compliant form input with validation
 */

import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface AccessibleInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    error?: string;
    success?: string;
    hint?: string;
    leftIcon?: ReactNode;
    size?: 'md' | 'lg';
    showPasswordToggle?: boolean;
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
    (
        {
            label,
            error,
            success,
            hint,
            leftIcon,
            size = 'lg',
            showPasswordToggle = false,
            type = 'text',
            id,
            className = '',
            disabled,
            required,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
        const errorId = `${inputId}-error`;
        const hintId = `${inputId}-hint`;

        const hasError = !!error;
        const hasSuccess = !!success && !error;
        const isPassword = type === 'password';

        const sizeStyles = {
            md: 'min-h-[48px] py-3 text-base',
            lg: 'min-h-[56px] py-4 text-kiosk-lg',
        };

        return (
            <div className={`w-full ${className}`}>
                {/* Label */}
                <label
                    htmlFor={inputId}
                    className="block text-kiosk-sm font-medium text-kiosk-muted mb-2"
                >
                    {label}
                    {required && (
                        <span className="text-red-400 ml-1" aria-hidden="true">*</span>
                    )}
                </label>

                {/* Input Container */}
                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <span
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-kiosk-muted"
                            aria-hidden="true"
                        >
                            {leftIcon}
                        </span>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        id={inputId}
                        type={isPassword && showPassword ? 'text' : type}
                        disabled={disabled}
                        required={required}
                        aria-invalid={hasError}
                        aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
                        className={`
              w-full rounded-kiosk
              bg-kiosk-card border-2
              ${sizeStyles[size]}
              ${leftIcon ? 'pl-12' : 'pl-4'}
              ${(isPassword && showPasswordToggle) || hasError || hasSuccess ? 'pr-12' : 'pr-4'}
              transition-colors duration-200
              focus:outline-none focus:ring-4
              ${hasError
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : hasSuccess
                                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                                    : 'border-kiosk-border focus:border-primary-500 focus:ring-primary-500/20'
                            }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                        {...props}
                    />

                    {/* Right Side Icons */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {/* Password Toggle */}
                        {isPassword && showPasswordToggle && (
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1 text-kiosk-muted hover:text-white transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        )}

                        {/* Status Icons */}
                        {hasError && !isPassword && (
                            <AlertCircle className="w-5 h-5 text-red-400" aria-hidden="true" />
                        )}
                        {hasSuccess && !isPassword && (
                            <CheckCircle className="w-5 h-5 text-green-400" aria-hidden="true" />
                        )}
                    </div>
                </div>

                {/* Hint Text */}
                {hint && !error && (
                    <p id={hintId} className="mt-2 text-kiosk-sm text-kiosk-muted">
                        {hint}
                    </p>
                )}

                {/* Error Message */}
                {error && (
                    <p
                        id={errorId}
                        className="mt-2 text-kiosk-sm text-red-400 flex items-center gap-1"
                        role="alert"
                    >
                        <AlertCircle className="w-4 h-4" aria-hidden="true" />
                        {error}
                    </p>
                )}

                {/* Success Message */}
                {success && !error && (
                    <p className="mt-2 text-kiosk-sm text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" aria-hidden="true" />
                        {success}
                    </p>
                )}
            </div>
        );
    }
);

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
