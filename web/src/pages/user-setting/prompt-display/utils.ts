const presetPromptOrder = [
  'task_analysis',
  'plan_generation',
  'reflection',
  'citation_guidelines',
];

const selectedPresetPromptStorageKey = 'ragflow.selected-preset-prompt';

export const getSavedPresetPromptKey = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(selectedPresetPromptStorageKey) ?? '';
};

export const savePresetPromptKey = (key: string) => {
  window.localStorage.setItem(selectedPresetPromptStorageKey, key);
};

export const sortPresetPromptKeys = (keys: string[]) => {
  const order = new Map(presetPromptOrder.map((key, index) => [key, index]));

  return [...keys].sort((left, right) => {
    const leftIndex = order.get(left) ?? presetPromptOrder.length;
    const rightIndex = order.get(right) ?? presetPromptOrder.length;

    return leftIndex - rightIndex || left.localeCompare(right);
  });
};
