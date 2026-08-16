import message from '@/components/ui/message';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { usePatchChat } from '@/hooks/use-chat-request';
import { IDialog } from '@/interfaces/database/chat';
import chatService from '@/services/next-chat-service';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileSettingWrapperCard } from '../components/user-setting-header';
import {
  getSavedPresetPromptKey,
  getCustomPrompts,
  saveCustomPrompt,
  savePresetPromptKey,
  sortPresetPromptKeys,
} from './utils';

const PromptDisplay = () => {
  const { t } = useTranslation();
  const { data: prompts, loading } = useFetchPrompt();
  const { patchChat, loading: applying } = usePatchChat();
  const { data: chatData, isFetching: chatsLoading } = useQuery<{
    chats: IDialog[];
    total: number;
  }>({
    queryKey: ['prompt-display-chat-list'],
    initialData: { chats: [], total: 0 },
    queryFn: async () => {
      const { data } = await chatService.listChats(
        { params: { page: 1, page_size: 100 }, data: {} },
        true,
      );
      return data?.data ?? { chats: [], total: 0 };
    },
  });
  const [selectedPromptKey, setSelectedPromptKey] = useState('');
  const [selectedChatId, setSelectedChatId] = useState('');
  const [savedPromptKey, setSavedPromptKey] = useState(() =>
    getSavedPresetPromptKey(),
  );
  const [customPrompts, setCustomPrompts] = useState(getCustomPrompts);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [editedPromptContent, setEditedPromptContent] = useState('');

  const allPrompts = useMemo(
    () => ({ ...(prompts ?? {}), ...customPrompts }),
    [customPrompts, prompts],
  );

  const promptKeys = useMemo(
    () => sortPresetPromptKeys(Object.keys(allPrompts)),
    [allPrompts],
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
  const selectedPrompt = allPrompts[selectedPromptKey] ?? '';
  const hasPromptChanges = editedPromptContent !== selectedPrompt;
  const selectedChat = chatData.chats.find(
    (chat) => chat.id === selectedChatId,
  );

  useEffect(() => {
    setEditedPromptContent(selectedPrompt);
  }, [selectedPrompt, selectedPromptKey]);

  const handleUpdatePrompt = () => {
    const content = editedPromptContent.trim();
    if (!content) {
      message.error(t('setting.promptContentRequired'));
      return;
    }

    saveCustomPrompt(selectedPromptKey, content);
    setCustomPrompts(getCustomPrompts());
    setEditedPromptContent(content);
    message.success(t('setting.promptUpdated'));
  };

  const handleSave = async () => {
    if (!selectedChatId) {
      message.error(t('setting.selectChatAssistantRequired'));
      return;
    }

    const code = await patchChat({
      chatId: selectedChatId,
      params: { prompt_config: { system: editedPromptContent.trim() } },
    });
    if (code !== 0) return;

    savePresetPromptKey(selectedPromptKey);
    setSavedPromptKey(selectedPromptKey);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewPromptName('');
    setNewPromptContent('');
  };

  const handleCreatePrompt = () => {
    const name = newPromptName.trim();
    const content = newPromptContent.trim();
    if (!name || !content) {
      message.error(t('setting.promptRequiredFields'));
      return;
    }
    if (Object.prototype.hasOwnProperty.call(allPrompts, name)) {
      message.error(t('setting.promptTypeAlreadyExists'));
      return;
    }

    saveCustomPrompt(name, content);
    setCustomPrompts(getCustomPrompts());
    setSelectedPromptKey(name);
    message.success(t('setting.promptCreated'));
    closeCreateDialog();
  };

  return (
    <ProfileSettingWrapperCard
      header={
        <header className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium text-text-primary">
              {t('setting.promptDisplay')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t('setting.promptDisplayDescription')}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4" />
            {t('setting.addPrompt')}
          </Button>
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

            <section className="flex flex-col">
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
                className="min-h-80 whitespace-pre-wrap font-mono leading-6"
                value={editedPromptContent}
                onChange={(event) =>
                  setEditedPromptContent(event.target.value)
                }
                resize="vertical"
              />
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  disabled={!hasPromptChanges || !editedPromptContent.trim()}
                  onClick={handleUpdatePrompt}
                  data-testid="save-prompt-changes"
                >
                  {t('setting.savePromptChanges')}
                </Button>
              </div>
            </section>

            <section className="max-w-xl">
              <label
                className="mb-2 block text-sm font-medium text-text-primary"
                htmlFor="target-chat-assistant"
              >
                {t('setting.targetChatAssistant')}
              </label>
              <Select
                value={selectedChatId}
                onValueChange={setSelectedChatId}
                disabled={chatsLoading || !chatData.chats.length}
              >
                <SelectTrigger id="target-chat-assistant">
                  <SelectValue
                    placeholder={
                      chatsLoading
                        ? t('common.loading')
                        : t('setting.selectChatAssistant')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {chatData.chats.map((chat) => (
                    <SelectItem key={chat.id} value={chat.id}>
                      {chat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-text-secondary">
                {selectedChat
                  ? t('setting.applyPromptDescription', {
                      name: selectedChat.name,
                    })
                  : t('setting.applyPromptTip')}
              </p>
            </section>

            <footer className="flex justify-end border-t border-border-button pt-5">
              <Button
                disabled={
                  !selectedChatId || applying || !editedPromptContent.trim()
                }
                onClick={handleSave}
                data-testid="save-preset-prompt-selection"
              >
                {applying
                  ? t('common.loading')
                  : t('setting.applyToChatAssistant')}
              </Button>
            </footer>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-text-secondary">
            {t('setting.noPresetPrompts')}
          </div>
        )}
      </div>
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => !open && closeCreateDialog()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('setting.addPrompt')}</DialogTitle>
            <DialogDescription>
              {t('setting.addPromptDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-text-primary"
                htmlFor="new-prompt-name"
              >
                {t('setting.promptTypeName')}
              </label>
              <Input
                id="new-prompt-name"
                value={newPromptName}
                onChange={(event) => setNewPromptName(event.target.value)}
                placeholder={t('setting.promptTypeNamePlaceholder')}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium text-text-primary"
                htmlFor="new-prompt-content"
              >
                {t('setting.promptContent')}
              </label>
              <Textarea
                id="new-prompt-content"
                className="min-h-64 font-mono leading-6"
                value={newPromptContent}
                onChange={(event) => setNewPromptContent(event.target.value)}
                placeholder={t('setting.promptContentPlaceholder')}
                resize="vertical"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDialog}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreatePrompt}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileSettingWrapperCard>
  );
};

export default PromptDisplay;
