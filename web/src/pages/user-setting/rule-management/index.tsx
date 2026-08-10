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
import message from '@/components/ui/message';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import outputRuleService, {
  OutputRule,
  OutputRuleAction,
  OutputRulePayload,
} from '@/services/output-rule-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileSettingWrapperCard } from '../components/user-setting-header';

const initialRule = (): OutputRulePayload => ({
  name: '',
  keywords: [],
  regex_patterns: [],
  action_type: 'reject',
  response_content: '',
  priority: 100,
  enabled: true,
});

const actions: OutputRuleAction[] = ['reject', 'guidance', 'direct_answer'];

const RuleManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isFetching } = useQuery<{ rules: OutputRule[] }>({
    queryKey: ['output-rules'],
    initialData: { rules: [] },
    queryFn: async () =>
      (await outputRuleService.list()).data?.data ?? { rules: [] },
  });
  const [draft, setDraft] = useState<OutputRulePayload>(initialRule);
  const [editingId, setEditingId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [regex, setRegex] = useState('');
  const [saving, setSaving] = useState(false);

  const rules = useMemo(
    () => [...(data?.rules ?? [])].sort((a, b) => a.priority - b.priority),
    [data?.rules],
  );
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['output-rules'] });
  const closeEditor = () => {
    setOpen(false);
    setEditingId(undefined);
    setDraft(initialRule());
    setKeyword('');
    setRegex('');
  };
  const openCreate = () => {
    setDraft(initialRule());
    setEditingId(undefined);
    setOpen(true);
  };
  const openEdit = (rule: OutputRule) => {
    const { id, ...payload } = rule;
    setDraft(payload);
    setEditingId(id);
    setOpen(true);
  };
  const addCondition = (field: 'keywords' | 'regex_patterns') => {
    const value = (field === 'keywords' ? keyword : regex).trim();
    if (!value || draft[field].includes(value)) return;
    setDraft((previous) => ({
      ...previous,
      [field]: [...previous[field], value],
    }));
    if (field === 'keywords') {
      setKeyword('');
    } else {
      setRegex('');
    }
  };
  const removeCondition = (
    field: 'keywords' | 'regex_patterns',
    value: string,
  ) =>
    setDraft((previous) => ({
      ...previous,
      [field]: previous[field].filter((item) => item !== value),
    }));
  const save = async () => {
    if (
      !draft.name.trim() ||
      (!draft.keywords.length && !draft.regex_patterns.length) ||
      (draft.action_type !== 'direct_answer' && !draft.response_content.trim())
    ) {
      message.error(t('setting.ruleRequiredFields'));
      return;
    }
    setSaving(true);
    try {
      const response = editingId
        ? await outputRuleService.update({ ...draft, id: editingId })
        : await outputRuleService.create(draft);
      if (response.data?.code !== 0) {
        message.error(response.data?.message || t('message.error'));
        return;
      }
      message.success(t(editingId ? 'message.updated' : 'message.created'));
      closeEditor();
      refresh();
    } finally {
      setSaving(false);
    }
  };
  const deleteRule = async (id: string) => {
    const response = await outputRuleService.delete(id);
    if (response.data?.code === 0) {
      message.success(t('message.deleted'));
      refresh();
    } else {
      message.error(response.data?.message || t('message.error'));
    }
  };
  const toggleRule = async (rule: OutputRule) => {
    const response = await outputRuleService.update({
      ...rule,
      enabled: !rule.enabled,
    });
    if (response.data?.code === 0) refresh();
    else message.error(response.data?.message || t('message.error'));
  };

  return (
    <ProfileSettingWrapperCard
      header={
        <header className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium text-text-primary">
              {t('setting.ruleManagement')}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {t('setting.ruleManagementDescription')}
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            {t('setting.addRule')}
          </Button>
        </header>
      }
    >
      <div className="h-full overflow-y-auto p-5">
        <p className="mb-4 rounded-md border border-border-button bg-bg-input p-3 text-xs text-text-secondary">
          {t('setting.ruleExecutionNote')}
        </p>
        {isFetching ? (
          <div className="text-sm text-text-secondary">
            {t('common.loading')}
          </div>
        ) : rules.length ? (
          <div className="space-y-3">
            {rules.map((rule) => (
              <article
                key={rule.id}
                className="rounded-lg border border-border-button bg-bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-text-primary">
                        {rule.name}
                      </h3>
                      <span className="rounded bg-bg-input px-2 py-0.5 text-xs text-text-secondary">
                        {t('setting.priority')}: {rule.priority}
                      </span>
                      <span className="rounded bg-bg-input px-2 py-0.5 text-xs text-text-secondary">
                        {t(`setting.ruleActions.${rule.action_type}`)}
                      </span>
                    </div>
                    {rule.action_type !== 'direct_answer' && (
                      <p className="mt-2 text-sm text-text-secondary">
                        {t('setting.ruleResponse')}: {rule.response_content}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rule.keywords.map((item) => (
                        <span
                          key={`k-${item}`}
                          className="rounded border border-border-button px-2 py-1 text-xs"
                        >
                          {t('setting.keyword')}: {item}
                        </span>
                      ))}
                      {rule.regex_patterns.map((item) => (
                        <span
                          key={`r-${item}`}
                          className="rounded border border-border-button px-2 py-1 text-xs"
                        >
                          Regex: {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule)}
                      aria-label={t('setting.enableRule')}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(rule)}
                      aria-label={t('common.edit')}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRule(rule.id)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border-button text-sm text-text-secondary">
            {t('setting.noRules')}
          </div>
        )}
      </div>
      <Dialog open={open} onOpenChange={(value) => !value && closeEditor()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t(editingId ? 'setting.editRule' : 'setting.addRule')}
            </DialogTitle>
            <DialogDescription>
              {t('setting.ruleEditorDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <label className="block text-sm">
              {t('setting.ruleName')}
              <Input
                className="mt-1"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: String(event.target.value) })
                }
              />
            </label>
            <label className="block text-sm">
              {t('setting.priority')}
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={draft.priority}
                onChange={(event) =>
                  setDraft({ ...draft, priority: Number(event.target.value) })
                }
              />
            </label>
            <ConditionField
              label={t('setting.keywords')}
              value={keyword}
              values={draft.keywords}
              onChange={setKeyword}
              onAdd={() => addCondition('keywords')}
              onRemove={(item) => removeCondition('keywords', item)}
              placeholder={t('setting.keywordPlaceholder')}
            />
            <ConditionField
              label={t('setting.regexPatterns')}
              value={regex}
              values={draft.regex_patterns}
              onChange={setRegex}
              onAdd={() => addCondition('regex_patterns')}
              onRemove={(item) => removeCondition('regex_patterns', item)}
              placeholder={t('setting.regexPlaceholder')}
            />
            <label className="block text-sm">
              {t('setting.ruleAction')}
              <Select
                value={draft.action_type}
                onValueChange={(value) => {
                  const action = value as OutputRuleAction;
                  setDraft({
                    ...draft,
                    action_type: action,
                    response_content:
                      action === 'direct_answer' ? '' : draft.response_content,
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {t(`setting.ruleActions.${action}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            {draft.action_type !== 'direct_answer' && (
              <label className="block text-sm">
                {t('setting.ruleResponse')}
                <Textarea
                  className="mt-1 min-h-28"
                  value={draft.response_content}
                  onChange={(event) =>
                    setDraft({ ...draft, response_content: event.target.value })
                  }
                />
              </label>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('setting.enableRule')}</span>
              <Switch
                checked={draft.enabled}
                onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditor}>
              {t('common.cancel')}
            </Button>
            <Button onClick={save} disabled={saving}>
              {t('setting.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileSettingWrapperCard>
  );
};

const ConditionField = ({
  label,
  value,
  values,
  onChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
  placeholder: string;
}) => {
  const { t } = useTranslation();
  return (
    <section>
      <p className="text-sm">{label}</p>
      <div className="mt-1 flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(String(event.target.value))}
          placeholder={placeholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={onAdd}>
          {t('common.add')}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded border border-border-button px-2 py-1 text-xs"
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(item)}
              aria-label="remove"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
};

export default RuleManagement;
