'use client'

import React, { useState, useRef, useCallback } from 'react'

interface TooltipProps {
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
}

export default function Tooltip({ content, side = 'top', children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(true)
  }, [])

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 120)
  }, [])

  const positionStyles: Record<string, React.CSSProperties> = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 8,
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 8,
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 8,
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 8,
    },
  }

  const arrowStyles: Record<string, React.CSSProperties> = {
    top: {
      bottom: -5,
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
    },
    bottom: {
      top: -5,
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
    },
    left: {
      right: -5,
      top: '50%',
      transform: 'translateY(-50%) rotate(45deg)',
    },
    right: {
      left: -5,
      top: '50%',
      transform: 'translateY(-50%) rotate(45deg)',
    },
  }

  const trigger = children ?? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.25)',
        color: '#8a8ab0',
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
        cursor: 'help',
        userSelect: 'none',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      ?
    </span>
  )

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span role="button" tabIndex={0} aria-describedby={visible ? 'tooltip-popup' : undefined}>
        {trigger}
      </span>

      <span
        id="tooltip-popup"
        role="tooltip"
        style={{
          position: 'absolute',
          ...positionStyles[side],
          zIndex: 99999,
          maxWidth: 280,
          padding: '8px 12px',
          background: '#1a1a2e',
          color: '#e0e0e0',
          fontSize: 12,
          lineHeight: 1.5,
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          visibility: visible ? 'visible' : 'hidden',
          transition: 'opacity 0.15s ease, visibility 0.15s ease',
        }}
      >
        {content}
        {/* Arrow */}
        <span
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderTop: side === 'top' ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderLeft: side === 'left' ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderRight: side === 'right' || side === 'top' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderBottom: side === 'bottom' || side === 'left' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            ...arrowStyles[side],
          }}
        />
      </span>
    </span>
  )
}
