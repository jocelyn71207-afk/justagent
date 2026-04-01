declare module '@gausszhou/vue3-drag-resize-rotate' {
  import { DefineComponent } from 'vue'

  interface VueDragResizeRotateProps {
    active?: boolean
    'enable-native-drag'?: boolean
    z?: number
    x?: number
    y?: number
    w?: number
    h?: number
    'min-width'?: number
    'min-height'?: number
    parentScaleX?: number
    parentScaleY?: number
    snapToGrid?: boolean
    grid?: [number, number]
    aspectRatio?: boolean
    axis?: string
    stickSize?: number
    rotatable?: boolean
    draggable?: boolean
    resizable?: boolean
  }

  const VueDragResizeRotate: DefineComponent<VueDragResizeRotateProps>
  export default VueDragResizeRotate
}
