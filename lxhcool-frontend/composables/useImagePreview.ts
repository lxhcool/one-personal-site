export type PreviewImage = {
  src: string;
  alt?: string;
  caption?: string;
};

type ImagePreviewState = {
  open: boolean;
  images: PreviewImage[];
  index: number;
};

export function useImagePreview() {
  const state = useState<ImagePreviewState>('global-image-preview', () => ({
    open: false,
    images: [],
    index: 0,
  }));

  const current = computed(() => state.value.images[state.value.index]);

  function open(images: PreviewImage[], index = 0) {
    const validImages = images.filter((image) => typeof image.src === 'string' && image.src.trim());
    if (validImages.length === 0) return;
    state.value = {
      open: true,
      images: validImages,
      index: Math.min(Math.max(index, 0), validImages.length - 1),
    };
  }

  function close() {
    state.value.open = false;
  }

  function previous() {
    const count = state.value.images.length;
    if (count < 2) return;
    state.value.index = (state.value.index - 1 + count) % count;
  }

  function next() {
    const count = state.value.images.length;
    if (count < 2) return;
    state.value.index = (state.value.index + 1) % count;
  }

  return { state, current, open, close, previous, next };
}
