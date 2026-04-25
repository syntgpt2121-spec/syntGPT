import { useState, useCallback } from 'react'

export interface NLEditResult {
  success: boolean
  description: string
  reasoning?: string
  code?: string
}

interface UseNLEditOptions {
  onSuccess?: (result: NLEditResult) => void
  onError?: (error: string) => void
}

export function useNLEdit(options: UseNLEditOptions = {}) {
  const [isEditing, setIsEditing] = useState(false)

  const edit = useCallback(async (input: string, _context: { code: string, nodes: any[] }) => {
    setIsEditing(true)
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const result: NLEditResult = {
        success: true,
        description: `"${input}" komutu işlendi.`,
        reasoning: `AI, "${input}" isteğini analiz etti ve değişiklik önerisi oluşturdu.`
      }
      
      options.onSuccess?.(result)
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata'
      options.onError?.(errorMsg)
      return { success: false, description: errorMsg }
    } finally {
      setIsEditing(false)
    }
  }, [options])

  return { edit, isEditing }
}
