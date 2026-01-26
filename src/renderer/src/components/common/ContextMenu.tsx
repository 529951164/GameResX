import { useEffect, useRef } from 'react'

export interface MenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  divider?: boolean
  disabled?: boolean
  submenu?: MenuItem[]
}

interface ContextMenuProps {
  position: { x: number; y: number }
  items: MenuItem[]
  onClose: () => void
}

export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // 调整菜单位置避免超出屏幕
  useEffect(() => {
    if (!menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let { x, y } = position

    // 检查是否超出右边界
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10
    }

    // 检查是否超出底部边界
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10
    }

    // 确保不超出左上边界
    x = Math.max(10, x)
    y = Math.max(10, y)

    menu.style.left = `${x}px`
    menu.style.top = `${y}px`
  }, [position])

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled || item.submenu) return
    item.onClick?.()
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-content-bg border border-border rounded-lg shadow-2xl py-1"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="h-px bg-border my-1" />
        }

        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`w-full px-3 py-2 flex items-center gap-2 text-sm text-left transition-colors ${
                item.disabled
                  ? 'text-text-secondary opacity-50 cursor-not-allowed'
                  : 'text-text-primary hover:bg-hover cursor-pointer'
              }`}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.submenu && (
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* 子菜单 */}
            {item.submenu && (
              <div className="absolute left-full top-0 ml-1 hidden group-hover:block">
                <div className="min-w-[160px] bg-content-bg border border-border rounded-lg shadow-2xl py-1">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleItemClick(subItem)}
                      disabled={subItem.disabled}
                      className={`w-full px-3 py-2 flex items-center gap-2 text-sm text-left transition-colors ${
                        subItem.disabled
                          ? 'text-text-secondary opacity-50 cursor-not-allowed'
                          : 'text-text-primary hover:bg-hover cursor-pointer'
                      }`}
                    >
                      {subItem.icon && <span className="w-4 h-4 flex-shrink-0">{subItem.icon}</span>}
                      <span className="flex-1">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
