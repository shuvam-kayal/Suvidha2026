/**
 * Accessible Button - WCAG compliant button with loading and disabled states
 */

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    loadingText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    fullWidth?: boolean;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            loadingText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            children,
            className = '',
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading;

        // Base styles
        const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-kiosk
      transition-all duration-200
      focus:outline-none focus:ring-4
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

        // Variant styles
        const variantStyles = {
            primary: `
        bg-primary-600 text-white
        hover:bg-primary-500
        focus:ring-primary-400/50
        active:bg-primary-700
      `,
            secondary: `
        bg-secondary-600 text-white
        hover:bg-secondary-500
        focus:ring-secondary-400/50
        active:bg-secondary-700
      `,
            outline: `
        border-2 border-kiosk-border text-white
        hover:bg-white/5 hover:border-primary-400
        focus:ring-primary-400/50
        active:bg-white/10
      `,
            danger: `
        bg-red-600 text-white
        hover:bg-red-500
        focus:ring-red-400/50
        active:bg-red-700
      `,
        };

        // Size styles (WCAG minimum 48px touch target)
        const sizeStyles = {
            sm: 'min-h-[48px] min-w-[48px] px-4 py-2 text-sm',
            md: 'min-h-[56px] min-w-[56px] px-6 py-3 text-base',
            lg: 'min-h-[64px] min-w-[64px] px-8 py-4 text-lg',
        };

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                aria-busy={isLoading}
                className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2
                            className="w-5 h-5 animate-spin"
                            aria-hidden="true"
                        />
                        <span>{loadingText || 'Loading...'}</span>
                    </>
                ) : (
                    <>
                        {leftIcon && (
                            <span aria-hidden="true">{leftIcon}</span>
                        )}
                        {children}
                        {rightIcon && (
                            <span aria-hidden="true">{rightIcon}</span>
                        )}
                    </>
                )}
            </button>
        );
    }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
