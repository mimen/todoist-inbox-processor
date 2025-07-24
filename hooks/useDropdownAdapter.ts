import { useMemo } from 'react'

/**
 * Adapter hook to standardize value handling between single/multi select modes
 * This allows parent components to always work with arrays internally
 * while the UnifiedDropdown gets the correct value format
 */
export function useDropdownAdapter(
  isMultiSelect: boolean,
  arrayValue: string[],
  onChange: (values: string[], displayName: string) => void
) {
  // Convert array to appropriate format for UnifiedDropdown
  const dropdownValue = useMemo(() => {
    if (isMultiSelect) {
      return arrayValue
    } else {
      // Single select: return first item or empty string
      return arrayValue[0] || ''
    }
  }, [isMultiSelect, arrayValue])

  // Convert UnifiedDropdown onChange to always use arrays
  const handleDropdownChange = (value: string | string[], displayName: string) => {
    if (Array.isArray(value)) {
      onChange(value, displayName)
    } else {
      // Single select: wrap in array
      onChange(value ? [value] : [], displayName)
    }
  }

  return {
    dropdownValue,
    handleDropdownChange
  }
}