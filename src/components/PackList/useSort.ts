/**
 * Hook to make a pack list item sortable with dnd-kit
 */

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface UseSortReturn {
  attributes: ReturnType<typeof useSortable>['attributes']
  listeners: ReturnType<typeof useSortable>['listeners']
  setNodeRef: ReturnType<typeof useSortable>['setNodeRef']
  transform: string | undefined
  transition: string | null | undefined
  isDragging: boolean
}

export function useSort(id: string): UseSortReturn {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return {
    attributes,
    listeners,
    setNodeRef,
    transform: CSS.Transform.toString(transform),
    transition,
    isDragging,
  }
}
