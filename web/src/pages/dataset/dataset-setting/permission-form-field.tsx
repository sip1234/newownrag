import { SelectWithSearch } from '@/components/originui/select-with-search';
import { RAGFlowFormItem } from '@/components/ragflow-form';
import { PermissionRole } from '@/constants/permission';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function PermissionFormField() {
  const { t } = useTranslation();
  const controlOptions = useMemo(() => {
    return [PermissionRole.Me, PermissionRole.Team].map((x) => ({
      label: t('knowledgeConfiguration.' + x),
      value: x,
    }));
  }, [t]);
  const viewOptions = useMemo(() => {
    return Object.values(PermissionRole).map((x) => ({
      label: t('knowledgeConfiguration.' + x),
      value: x,
    }));
  }, [t]);

  return (
    <>
      <RAGFlowFormItem
        name="control_permission"
        label={t('knowledgeConfiguration.controlPermissions')}
        tooltip={t('knowledgeConfiguration.controlPermissionsTip')}
        horizontal
      >
        <SelectWithSearch
          options={controlOptions}
          triggerClassName="w-full"
          testId="ds-settings-control-permissions-select"
        />
      </RAGFlowFormItem>
      <RAGFlowFormItem
        name="view_permission"
        label={t('knowledgeConfiguration.viewPermissions')}
        tooltip={t('knowledgeConfiguration.viewPermissionsTip')}
        horizontal
      >
        <SelectWithSearch
          options={viewOptions}
          triggerClassName="w-full"
          testId="ds-settings-view-permissions-select"
        />
      </RAGFlowFormItem>
    </>
  );
}
