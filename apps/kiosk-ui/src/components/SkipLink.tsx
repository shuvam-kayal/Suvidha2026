/**
 * Skip Link - Accessibility navigation for keyboard users
 * Allows users to skip to main content
 */

import { useState } from 'react';

interface SkipLinkProps {
    targetId?: string;
    children?: React.ReactNode;
}

export default function SkipLink({
    targetId = 'main-content',
    children = 'Skip to main content'
}: SkipLinkProps) {
    const [isFocused, setIsFocused] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
        fixed top-4 left-4 z-[9999]
        px-6 py-3 rounded-kiosk
        bg-primary-600 text-white font-semibold
        transform transition-transform duration-200
        focus:outline-none focus:ring-4 focus:ring-primary-400/50
        ${isFocused ? 'translate-y-0' : '-translate-y-full opacity-0'}
      `}
            style={{ pointerEvents: isFocused ? 'auto' : 'none' }}
        >
            {children}
        </a>
    );
}
