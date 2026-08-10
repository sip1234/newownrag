import message from '@/components/ui/message';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFetchPrompt } from '@/hooks/use-agent-request';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileSettingWrapperCard } from '../components/user-setting-header';
import {
  getSavedPresetPromptKey,
  savePresetPromptKey,
  sortPresetPromptKeys,
} from './utils';

const PromptDisplay = () => {
  const { t } = useTranslation();
  const { data: prompts, loading } = useFetchPrompt();
  const [selectedPromptKey, setSelectedPromptKey] = useState('');
  const [savedPromptKey, setSavedPromptKey] = useState(() =>
    getSavedPresetPromptKey(),
  );

  const promptKeys = useMemo(
    () => sortPresetPromptKeys(Object.keys(prompts ?? {})),
    [prompts],
  );

  useEffect(() => {
    if (!promptKeys.length) {
      setSelectedPromptKey('');
      return;
    }

    const savedKey = getSavedPresetPromptKey();
    const defaultKey = promptKeys.includes(savedKey)
      ? savedKey
      : promptKeys[0];

    if (!promptKeys.includes(selectedPromptKey)) {
      setSelectedPromptKey(defaultKey);
    }

    if (!promptKeys.includes(savedPromptKey)) {
      setSavedPromptKey(defaultKey);
    }
  }, [promptKeys, savedPromptKey, selectedPromptKey]);

  const getPromptLabel = (key: string) =>
    t(`setting.promptTypes.${key}`, { defaultValue: key });
  const selectedPrompt = prompts?.[selectedPromptKey] ?? '';
  const hasUnsavedSelection = selectedPromptKey !== savedPromptKey;

  const handleSave = () => {
    savePresetPromptKey(selectedPromptKey);
    setSavedPromptKey(selectedPromptKey);
    message.success(t('setting.promptSelectionSaved'));
  };

  return (
    <ProfileSettingWrapperCard
      header={
        <header>
          <h2 className="text-2xl font-medium text-text-primary">
            {t('setting.promptDisplay')}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {t('setting.promptDisplayDescription')}
          </p>
        </header>
      }
    >
      <div className="h-full overflow-y-auto p-5">
        {loading ? (
          <div className="flex flex-col gap-4" aria-label="loading">
            <Skeleton className="h-8 w-full max-w-xl" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : promptKeys.length ? (
          <div className="flex min-h-full flex-col gap-6">
            <section className="max-w-xl">
              <label
                className="mb-2 block text-sm font-medium text-text-primary"
                htmlFor="preset-prompt-type"
              >
                {t('setting.presetPromptType')}
              </label>
              <Select
                value={selectedPromptKey}
                onValueChange={setSelectedPromptKey}
              >
                <SelectTrigger id="preset-prompt-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {promptKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {getPromptLabel(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section className="flex min-h-0 flex-1 flex-col">
              <label
                className="text-sm font-medium text-text-primary"
                htmlFor="preset-prompt-content"
              >
                {t('setting.promptContent')}
              </label>
              <p className="mb-2 mt-1 text-xs text-text-secondary">
                {t('setting.promptContentDescription')}
              </p>
              <Textarea
                id="preset-prompt-content"
                className="min-h-80 flex-1 resize-none whitespace-pre-wrap font-mono leading-6"
                value={selectedPrompt}
                readOnly
                aria-readonly="true"
              />
            </section>

            <footer className="flex justify-end border-t border-border-button pt-5">
              <Button
                disabled={!hasUnsavedSelection}
                onClick={handleSave}
                data-testid="save-preset-prompt-selection"
              >
                {t('setting.save')}
              </Button>
            </footer>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-text-secondary">
            {t('setting.noPresetPrompts')}
          </div>
        )}
      </div>
    </ProfileSettingWrapperCard>
  );
};

export default PromptDisplay;
