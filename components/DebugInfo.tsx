'use client'

import React from 'react'
import { ProcessingMode } from '@/types/processing-mode'

interface DebugInfoProps {
  viewMode: string
  processingMode: ProcessingMode
  multiListMode: boolean
  isListView: boolean
  isPrioritized: boolean
  shouldShowMultiList: boolean
}

export default function DebugInfo({ 
  viewMode, 
  processingMode, 
  multiListMode,
  isListView,
  isPrioritized,
  shouldShowMultiList
}: DebugInfoProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-black text-green-400 p-4 rounded-lg shadow-lg font-mono text-xs max-w-sm">
      <div className="space-y-1">
        <div>View Mode: {viewMode}</div>
        <div>Processing Mode: {processingMode.type}</div>
        <div>Processing Value: {processingMode.value}</div>
        <div>Display Name: {processingMode.displayName}</div>
        <div>Multi-List Setting: {multiListMode ? 'ON' : 'OFF'}</div>
        <div>Is List View: {isListView ? 'YES' : 'NO'}</div>
        <div>Is Prioritized: {isPrioritized ? 'YES' : 'NO'}</div>
        <div className="pt-2 border-t border-green-600">
          Should Show Multi-List: {shouldShowMultiList ? 'YES' : 'NO'}
        </div>
      </div>
    </div>
  )
}