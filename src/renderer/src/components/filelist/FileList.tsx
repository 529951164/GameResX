import { useAppStore } from '@/stores/useAppStore'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ContextMenu } from '@/components/common/ContextMenu'
import { useImageContextMenu } from '@/components/menus/ImageContextMenu'
import { FileItem } from './FileItem'
import { ImageOff } from 'lucide-react'

export function FileList() {
  const { imageList, selectedImage, selectedFolderPath, setSelectedImage } = useAppStore()
  const { menuPosition, menuType, menuData, showMenu, hideMenu } = useContextMenu()

  const handleContextMenu = (e: React.MouseEvent, image: any) => {
    showMenu(e, 'image', image)
  }

  const imageMenuItems = useImageContextMenu({
    image: menuData,
    onClose: hideMenu
  })

  if (!selectedFolderPath) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <ImageOff size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">请选择一个文件夹</p>
        </div>
      </div>
    )
  }

  if (imageList.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <ImageOff size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">此文件夹没有图片</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-2 grid grid-cols-2 gap-2">
        {imageList.map((image) => (
          <FileItem
            key={image.id}
            image={image}
            isSelected={selectedImage?.id === image.id}
            onClick={() => setSelectedImage(image)}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {menuPosition && menuType === 'image' && menuData && (
        <ContextMenu position={menuPosition} items={imageMenuItems} onClose={hideMenu} />
      )}
    </>
  )
}
