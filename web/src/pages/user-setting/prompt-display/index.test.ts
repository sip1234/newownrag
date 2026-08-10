import {
  getSavedPresetPromptKey,
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
});
