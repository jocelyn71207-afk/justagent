declare module 'vue3-drag-resize' {
  import { DefineComponent } from 'vue'

  interface Vue3DragResizeProps {
    // 基本控制屬性
    isActive?: boolean
    preventActiveBehavior?: boolean
    parentLimitation?: boolean
    parentScaleX?: number
    parentScaleY?: number
    isDraggable?: boolean
    isResizable?: boolean
    aspectRatio?: boolean

    // 父容器屬性
    parentW?: number
    parentH?: number

    // 尺寸屬性
    w?: number | string  // 可以是 'auto'
    h?: number | string  // 可以是 'auto'
    minw?: number
    minh?: number

    // 位置屬性
    x?: number
    y?: number
    z?: number | string  // 可以是 'auto'

    // 網格對齊
    snapToGrid?: boolean
    gridX?: number
    gridY?: number

    // 操控手柄
    sticks?: string[]
    stickSize?: number

    // 拖拽限制
    axis?: 'x' | 'y' | 'both' | 'none'
    dragHandle?: string
    dragCancel?: string

    // 樣式
    contentClass?: string

    // 事件回調 (Vue 3 風格)
    onClicked?: (ev: MouseEvent) => void
    onActivated?: () => void
    onDeactivated?: () => void
    onDragging?: (rect: { left: number, top: number, width: number, height: number }) => void
    onDragstop?: (rect: { left: number, top: number, width: number, height: number }) => void
    onResizing?: (rect: { left: number, top: number, width: number, height: number }) => void
    onResizestop?: (rect: { left: number, top: number, width: number, height: number }) => void
  }

  const Vue3DragResize: DefineComponent<Vue3DragResizeProps>
  export default Vue3DragResize
}
