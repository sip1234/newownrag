const presetPromptOrder = [
  'task_analysis',
  'plan_generation',
  'reflection',
  'citation_guidelines',
];

const selectedPresetPromptStorageKey = 'ragflow.selected-preset-prompt';
const customPromptsStorageKey = 'ragflow.custom-prompts';

export type CustomPrompts = Record<string, string>;

export const getSavedPresetPromptKey = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(selectedPresetPromptStorageKey) ?? '';
};

export const savePresetPromptKey = (key: string) => {
  window.localStorage.setItem(selectedPresetPromptStorageKey, key);
};

export const getCustomPrompts = (): CustomPrompts => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const prompts = JSON.parse(
      window.localStorage.getItem(customPromptsStorageKey) ?? '{}',
    );
    return prompts && typeof prompts === 'object' && !Array.isArray(prompts)
      ? prompts
      : {};
  } catch {
    return {};
  }
};

export const saveCustomPrompt = (name: string, content: string) => {
  const prompts = getCustomPrompts();
  prompts[name] = content;
  window.localStorage.setItem(customPromptsStorageKey, JSON.stringify(prompts));
};

export const sortPresetPromptKeys = (keys: string[]) => {
  const order = new Map(presetPromptOrder.map((key, index) => [key, index]));

  return [...keys].sort((left, right) => {
    const leftIndex = order.get(left) ?? presetPromptOrder.length;
    const rightIndex = order.get(right) ?? presetPromptOrder.length;

    return leftIndex - rightIndex || left.localeCompare(right);
  });
};
