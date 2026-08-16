import {
  getCustomPrompts,
  getSavedPresetPromptKey,
  saveCustomPrompt,
  savePresetPromptKey,
  sortPresetPromptKeys,
} from './utils';

describe('sortPresetPromptKeys', () => {
  it('places known presets in their display order and keeps unknown presets', () => {
    expect(
      sortPresetPromptKeys([
        'reflection',
        'custom_prompt',
        'citation_guidelines',
        'task_analysis',
        'plan_generation',
      ]),
    ).toEqual([
      'task_analysis',
      'plan_generation',
      'reflection',
      'citation_guidelines',
      'custom_prompt',
    ]);
  });

  it('does not mutate the response keys', () => {
    const keys = ['reflection', 'task_analysis'];

    sortPresetPromptKeys(keys);

    expect(keys).toEqual(['reflection', 'task_analysis']);
  });

  it('persists the confirmed preset selection', () => {
    savePresetPromptKey('reflection');

    expect(getSavedPresetPromptKey()).toBe('reflection');
  });

  it('persists custom prompts', () => {
    saveCustomPrompt('摘要生成', '请生成简洁摘要');

    expect(getCustomPrompts()).toEqual({ 摘要生成: '请生成简洁摘要' });
  });

  it('updates an existing prompt', () => {
    saveCustomPrompt('task_analysis', '修改后的任务分析提示词');
    saveCustomPrompt('task_analysis', '第二版任务分析提示词');

    expect(getCustomPrompts().task_analysis).toBe('第二版任务分析提示词');
  });

  it('returns an empty object for invalid custom prompt storage', () => {
    window.localStorage.setItem('ragflow.custom-prompts', 'invalid-json');

    expect(getCustomPrompts()).toEqual({});
  });
});
