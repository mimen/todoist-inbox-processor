/**
 * Labels that should be excluded from:
 * - Label dropdown options
 * - Label overlay selection
 * - Task filtering (tasks with these labels are filtered out globally)
 */
export const EXCLUDED_LABELS = [
  'area-of-responsibility',
  'project-type', 
  'project-metadata'
] as const;

/**
 * Check if a label should be excluded from user interaction
 */
export function isExcludedLabel(labelName: string): boolean {
  return EXCLUDED_LABELS.includes(labelName as any);
}

/**
 * Filter out excluded labels from a list
 */
export function filterExcludedLabels(labels: string[]): string[] {
  return labels.filter(label => !isExcludedLabel(label));
}