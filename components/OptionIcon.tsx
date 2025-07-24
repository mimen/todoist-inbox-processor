import React from 'react'
import { DropdownOption } from '@/types/dropdown'
import PriorityFlag from './PriorityFlag'
import LabelIcon from './LabelIcon'

interface OptionIconProps {
  option: DropdownOption
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Renders the appropriate icon for a dropdown option based on its type
 */
const OptionIcon: React.FC<OptionIconProps> = ({ 
  option, 
  size = 'md',
  className 
}) => {
  // Size classes mapping
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const iconSize = className || sizeClasses[size]

  switch (option.type) {
    case 'project':
      // Project dot with color
      return (
        <div 
          className={`${iconSize} rounded-full flex-shrink-0`}
          style={{ backgroundColor: option.iconColor || '#808080' }}
        />
      )

    case 'priority':
      // Priority flag component
      const priority = option.metadata?.priority as 1 | 2 | 3 | 4
      return <PriorityFlag priority={priority} className={iconSize} />

    case 'label':
      // Label icon with color
      return <LabelIcon color={option.iconColor} className={iconSize} />

    case 'date':
    case 'deadline':
    case 'preset':
    case 'filter':
    case 'all':
      // Text-based icons (emojis)
      if (typeof option.icon === 'string') {
        return (
          <span 
            className={`inline-flex items-center justify-center ${iconSize}`}
            style={{ fontSize: size === 'sm' ? '12px' : size === 'lg' ? '18px' : '16px' }}
          >
            {option.icon}
          </span>
        )
      }
      break

    case 'custom':
      // For custom queues, could be emoji or component
      if (typeof option.icon === 'string') {
        return (
          <span 
            className={`inline-flex items-center justify-center ${iconSize}`}
            style={{ fontSize: size === 'sm' ? '12px' : size === 'lg' ? '18px' : '16px' }}
          >
            {option.icon}
          </span>
        )
      } else if (React.isValidElement(option.icon)) {
        return <>{option.icon}</>
      }
      break
  }

  // Default: render icon if it's a React element
  if (React.isValidElement(option.icon)) {
    return <>{option.icon}</>
  }

  // Fallback for string icons
  if (typeof option.icon === 'string') {
    return <span className={iconSize}>{option.icon}</span>
  }

  // No icon
  return null
}

export default OptionIcon