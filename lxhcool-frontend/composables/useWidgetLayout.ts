import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import type {
  SiteWidget,
  WidgetArea,
  WidgetVerticalPosition,
} from '~/entities/widget/model/types';
import type { WidgetStrategy } from '~/components/widgets/strategies/types';

type UseWidgetLayoutOptions = {
  isWidgetEditor: ComputedRef<boolean>;
  widgetsData: Ref<SiteWidget[] | null | undefined>;
  isLoggedIn: ComputedRef<boolean>;
  adminUrl: string;
  refreshWidgets: () => void | Promise<unknown>;
  getStrategy: (type: SiteWidget['type']) => WidgetStrategy;
};

type DragSession = {
  id: string;
  pointerId: number;
  grabX: number;
  grabY: number;
  width: number;
  height: number;
};

const WIDGET_DESIGN_VIEWPORT_WIDTH = 2560;
const MAX_WIDGET_DESIGN_WIDTH = 620;

export function useWidgetLayout(options: UseWidgetLayoutOptions) {
  const editorWidgets = ref<SiteWidget[] | null>(null);
  const editorOverrides = ref<Record<string, Partial<SiteWidget>>>({});
  const activeEditorWidgetId = ref<string | null>(null);
  const dragSession = ref<DragSession | null>(null);
  const widgetScale = ref(1);
  const editorOrigin = resolveOrigin(options.adminUrl);

  const widgets = computed(() => {
    const source = options.isWidgetEditor.value && editorWidgets.value
      ? editorWidgets.value
      : options.widgetsData.value ?? [];
    const all = source.map((widget) => ({
      ...widget,
      ...(editorOverrides.value[widget.id] ?? {}),
    }));

    if (options.isWidgetEditor.value || options.isLoggedIn.value) return all;
    return all.filter((widget) => !options.getStrategy(widget.type).requiresAuth);
  });

  function refreshWidgetPositions() {
    void options.refreshWidgets();
  }

  function refreshVisibleWidgetPositions() {
    if (document.visibilityState === 'visible') refreshWidgetPositions();
  }

  function updateResponsiveWidgetScale() {
    if (!import.meta.client) return;
    if (window.innerWidth < 768) {
      widgetScale.value = 0;
      return;
    }

    const content = document.querySelector<HTMLElement>('.content-column');
    const contentWidth = content?.getBoundingClientRect().width ?? 680;
    const sideSpace = Math.max(0, (window.innerWidth - contentWidth) / 2);
    const viewportScale = window.innerWidth / WIDGET_DESIGN_VIEWPORT_WIDTH;
    const safeAreaScale = Math.max(0.08, (sideSpace - 12) / MAX_WIDGET_DESIGN_WIDTH);
    widgetScale.value = Math.min(1, viewportScale, safeAreaScale);
  }

  function postEditorMessage(message: Record<string, unknown>) {
    if (!options.isWidgetEditor.value || !import.meta.client) return;
    window.parent.postMessage(message, editorOrigin);
  }

  function handleEditorMessage(event: MessageEvent) {
    if (
      !options.isWidgetEditor.value
      || event.source !== window.parent
      || event.origin !== editorOrigin
    ) return;

    const message = event.data as { type?: string; widgets?: unknown } | null;
    if (message?.type !== 'widget-editor-sync' || !Array.isArray(message.widgets)) return;

    editorWidgets.value = message.widgets as SiteWidget[];
    editorOverrides.value = {};
  }

  function getSafeHorizontalBounds() {
    const content = document.querySelector<HTMLElement>('.content-column');
    const rect = content?.getBoundingClientRect();
    if (rect) return { left: rect.left - 16, right: rect.right + 16 };
    return {
      left: (window.innerWidth - 680) / 2 - 16,
      right: (window.innerWidth + 680) / 2 + 16,
    };
  }

  function placeEditorWidget(
    widget: SiteWidget,
    desiredLeft: number,
    desiredTop: number,
    width: number,
    height: number,
  ) {
    const scale = Math.max(widgetScale.value, 0.01);
    const safe = getSafeHorizontalBounds();
    const margin = 12;
    const centerX = desiredLeft + width / 2;
    const centerY = desiredTop + height / 2;
    const area: WidgetArea = centerX < window.innerWidth / 2 ? 'LEFT' : 'RIGHT';
    const verticalPosition: WidgetVerticalPosition =
      centerY < window.innerHeight / 2 ? 'TOP' : 'BOTTOM';

    const left = area === 'LEFT'
      ? clamp(desiredLeft, margin, safe.left - width)
      : clamp(desiredLeft, safe.right, window.innerWidth - width - margin);
    const top = clamp(desiredTop, margin, window.innerHeight - height - margin);
    const horizontalOffset = area === 'LEFT'
      ? left / scale
      : (window.innerWidth - left - width) / scale;
    const verticalOffset = verticalPosition === 'TOP'
      ? top / scale
      : (window.innerHeight - top - height) / scale;
    const payload = {
      area,
      verticalPosition,
      horizontalOffset: Math.round(horizontalOffset),
      verticalOffset: Math.round(verticalOffset),
    };

    editorOverrides.value = {
      ...editorOverrides.value,
      [widget.id]: { ...(editorOverrides.value[widget.id] ?? {}), ...payload },
    };
    return payload;
  }

  function handleWidgetPointerDown(event: PointerEvent, widget: SiteWidget) {
    if (!options.isWidgetEditor.value || window.innerWidth < 768 || event.button !== 0) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    event.preventDefault();
    target.setPointerCapture?.(event.pointerId);
    activeEditorWidgetId.value = widget.id;
    dragSession.value = {
      id: widget.id,
      pointerId: event.pointerId,
      grabX: event.clientX - rect.left,
      grabY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  function handleWidgetPointerMove(event: PointerEvent) {
    const drag = dragSession.value;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const widget = widgets.value.find((item) => item.id === drag.id);
    if (!widget) return;
    event.preventDefault();
    const payload = placeEditorWidget(
      widget,
      event.clientX - drag.grabX,
      event.clientY - drag.grabY,
      drag.width,
      drag.height,
    );
    postEditorMessage({ type: 'widget-editor-change', id: widget.id, payload });
  }

  function finishWidgetDrag(event: PointerEvent) {
    const drag = dragSession.value;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const widget = widgets.value.find((item) => item.id === drag.id);
    const payload = editorOverrides.value[drag.id];
    dragSession.value = null;
    if (widget && payload) {
      postEditorMessage({ type: 'widget-editor-change', id: widget.id, payload });
    }
  }

  function handleWidgetKeydown(event: KeyboardEvent, widget: SiteWidget) {
    if (!options.isWidgetEditor.value || !event.key.startsWith('Arrow')) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const step = event.shiftKey ? 10 : 1;
    const deltaX = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const deltaY = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    if (!deltaX && !deltaY) return;
    event.preventDefault();
    activeEditorWidgetId.value = widget.id;
    const payload = placeEditorWidget(
      widget,
      rect.left + deltaX,
      rect.top + deltaY,
      rect.width,
      rect.height,
    );
    postEditorMessage({ type: 'widget-editor-change', id: widget.id, payload });
  }

  function getWidgetPosition(widget: SiteWidget): Record<string, string> {
    const area: WidgetArea = widget.area === 'RIGHT' ? 'RIGHT' : 'LEFT';
    const verticalPosition: WidgetVerticalPosition =
      widget.verticalPosition === 'BOTTOM' ? 'BOTTOM' : 'TOP';
    const rawHorizontalOffset = Number(widget.horizontalOffset);
    const rawVerticalOffset = Number(widget.verticalOffset);
    const horizontalOffset = Number.isFinite(rawHorizontalOffset)
      ? clamp(rawHorizontalOffset, -1000, 3000)
      : area === 'LEFT' ? 24 : 20;
    const verticalOffset = Number.isFinite(rawVerticalOffset)
      ? clamp(rawVerticalOffset, -1000, 3000)
      : verticalPosition === 'TOP'
        ? area === 'RIGHT' ? 82 : 22
        : area === 'LEFT' ? 16 : 28;
    const scale = widgetScale.value || 1;

    return {
      '--widget-rotation': `${getWidgetRotation(widget)}deg`,
      '--widget-scale': String(scale),
      [area === 'LEFT' ? 'left' : 'right']: `${horizontalOffset * scale}px`,
      [verticalPosition === 'TOP' ? 'top' : 'bottom']: `${verticalOffset * scale}px`,
    };
  }

  function getWidgetAnchorClasses(widget: SiteWidget) {
    const area = widget.area === 'RIGHT' ? 'right' : 'left';
    const vertical = widget.verticalPosition === 'BOTTOM' ? 'bottom' : 'top';
    return [`widget-anchor-${area}-${vertical}`, {
      'widget-editor-item': options.isWidgetEditor.value,
      'widget-editor-active': activeEditorWidgetId.value === widget.id,
      'widget-editor-disabled': options.isWidgetEditor.value && !widget.enabled,
    }];
  }

  function normalizeWidget(widget: SiteWidget) {
    return options.getStrategy(widget.type).normalize(widget.config ?? {});
  }

  onMounted(() => {
    window.addEventListener('focus', refreshWidgetPositions);
    window.addEventListener('resize', updateResponsiveWidgetScale);
    window.addEventListener('message', handleEditorMessage);
    window.addEventListener('pointermove', handleWidgetPointerMove, { passive: false });
    window.addEventListener('pointerup', finishWidgetDrag);
    window.addEventListener('pointercancel', finishWidgetDrag);
    document.addEventListener('visibilitychange', refreshVisibleWidgetPositions);
    nextTick(() => {
      updateResponsiveWidgetScale();
      postEditorMessage({ type: 'widget-editor-ready' });
    });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('focus', refreshWidgetPositions);
    window.removeEventListener('resize', updateResponsiveWidgetScale);
    window.removeEventListener('message', handleEditorMessage);
    window.removeEventListener('pointermove', handleWidgetPointerMove);
    window.removeEventListener('pointerup', finishWidgetDrag);
    window.removeEventListener('pointercancel', finishWidgetDrag);
    document.removeEventListener('visibilitychange', refreshVisibleWidgetPositions);
  });

  return {
    activeEditorWidgetId,
    finishWidgetDrag,
    getWidgetAnchorClasses,
    getWidgetPosition,
    handleWidgetKeydown,
    handleWidgetPointerDown,
    normalizeWidget,
    widgets,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getWidgetRotation(widget: SiteWidget) {
  const rotation = Number(widget.rotation);
  return Number.isFinite(rotation) ? clamp(rotation, -45, 45) : 0;
}

function resolveOrigin(url: string) {
  try {
    return new URL(url, import.meta.client ? window.location.origin : 'http://localhost').origin;
  } catch {
    throw new Error(`Invalid admin URL for Widget editor messaging: ${url}`);
  }
}
