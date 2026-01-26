import { useState, useCallback } from 'react'

interface ContextMenuState {
  position: { x: number; y: number } | null
  type: 'image' | 'folder' | null
  data: any
}

export function useContextMenu() {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    position: null,
    type: null,
    data: null
  })

  const showMenu = useCallback((e: React.MouseEvent, type: 'image' | 'folder', data: any) => {
    e.preventDefault()
    e.stopPropagation()

    setMenuState({
      position: { x: e.clientX, y: e.clientY },
      type,
      data
    })
  }, [])

  const hideMenu = useCallback(() => {
    setMenuState({
      position: null,
      type: null,
      data: null
    })
  }, [])

  return {
    menuPosition: menuState.position,
    menuType: menuState.type,
    menuData: menuState.data,
    showMenu,
    hideMenu
  }
}
