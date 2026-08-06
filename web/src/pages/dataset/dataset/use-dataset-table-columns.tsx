import { FileIcon } from '@/components/icon-font';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigatePage } from '@/hooks/logic-hooks/navigate-hooks';
import { useSetDocumentObsolete, useSetDocumentStatus } from '@/hooks/use-document-request';
import { IDocumentInfo } from '@/interfaces/database/document';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { ColumnDef } from '@tanstack/table-core';
import { ArrowUpDown, FilePlus2, FolderClosed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { MetadataType } from '../components/metedata/constant';
import { ShowManageMetadataModalProps } from '../components/metedata/interface';
import { RunningStatus } from './constant';
import { DatasetActionCell } from './dataset-action-cell';
import { ParseDropdownButton, ParsingStatusCell } from './parsing-status-cell';
import { UseChangeDocumentParserShowType } from './use-change-document-parser';
import { UseRenameDocumentShowType } from './use-rename-document';

type UseDatasetTableColumnsType = UseChangeDocumentParserShowType &
  UseRenameDocumentShowType & {
    showLog: (record: IDocumentInfo) => void;
    showManageMetadataModal: (config: ShowManageMetadataModalProps) => void;
    onOpenCategory: (record: IDocumentInfo) => void;
    categories: IDocumentInfo[];
  };

const isObsolete = (value: unknown) => value === true || value === 1 || value === '1' || value === 'true';
const isCategory = (record: IDocumentInfo) => record.type === 'folder' || record.type === 'virtual';
const isEmptyCategory = (record: IDocumentInfo) => record.type === 'virtual';

function ObsoleteSwitch({ datasetId, documentId, value }: { datasetId?: string; documentId: string; value: unknown }) {
  const [checked, setChecked] = useState(() => isObsolete(value));
  const { loading, setDocumentObsolete } = useSetDocumentObsolete();
  useEffect(() => setChecked(isObsolete(value)), [value]);
  const onCheckedChange = async (obsolete: boolean) => {
    if (!datasetId) return;
    setChecked(obsolete);
    try {
      const result = await setDocumentObsolete({ obsolete, documentId, datasetId });
      if (result?.code !== 0) setChecked(!obsolete);
    } catch {
      setChecked(!obsolete);
    }
  };
  return <Switch checked={checked} disabled={loading || !datasetId} onCheckedChange={onCheckedChange} />;
}

export function useDatasetTableColumns({
  showChangeParserModal,
  showRenameModal,
  showManageMetadataModal,
  showLog,
  onOpenCategory,
  categories,
}: UseDatasetTableColumnsType) {
  const { t } = useTranslation('translation', {
    keyPrefix: 'knowledgeDetails',
  });
  // const { dataSourceInfo } = useDataSourceInfo();
  const { navigateToChunkParsedResult } = useNavigatePage();
  const { setDocumentStatus } = useSetDocumentStatus();
  const { id: datasetId } = useParams();

  const columns: ColumnDef<IDocumentInfo>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            {t('name')}

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              <ArrowUpDown />
            </Button>
          </div>
        );
      },
      meta: { cellClassName: 'max-w-[20vw]' },
      cell: ({ row }) => {
        const name: string = row.getValue('name');
        const category = isCategory(row.original);

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={category ? () => onOpenCategory(row.original) : navigateToChunkParsedResult(row.original.id, row.original.dataset_id)}
              >
                {row.original.type === 'folder' ? <FolderClosed className="size-4 shrink-0 text-accent-primary" /> : row.original.type === 'virtual' ? <FilePlus2 className="size-4 shrink-0 text-accent-primary" /> : <FileIcon name={name} />}
                <span className={cn('truncate')}>{name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{name}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'create_time',
      header: ({ column }) => {
        return (
          <div className="flex items-center gap-1">
            {t('uploadDate')}

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
            >
              <ArrowUpDown />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => (
        <time
          className="lowercase"
          dateTime={new Date(row.getValue('create_time')).toISOString()}
        >
          {formatDate(row.getValue('create_time'))}
        </time>
      ),
    },
    /*
    {
      accessorKey: 'source_from',
      header: t('source'),
      cell: ({ row }) => (
        <div className="text-text-primary">
          {row.original.source_type === 'local' ||
          row.original.source_type === '' ? (
            <div className="bg-accent-primary-5 w-6 h-6 rounded-full flex items-center justify-center">
              <MonitorUp className="text-accent-primary" size={16} />
            </div>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              {
                dataSourceInfo[
                  row.original.source_type as keyof typeof dataSourceInfo
                ]?.icon
              }
            </div>
          )}
        </div>
      ),
    },
    */
    {
      accessorKey: 'status',
      header: t('enabled'),
      cell: ({ row }) => {
        if (isEmptyCategory(row.original)) return <span>—</span>;
        const id = row.original.id;
        const obsolete = isObsolete(row.getValue('is_obsolete'));
        const enabled = row.getValue('status') === '1';
        const parsingIncomplete =
          !isCategory(row.original) && row.original.run !== RunningStatus.DONE;
        const disabled = obsolete || (parsingIncomplete && !enabled);
        const statusSwitch = (
          <Switch
            checked={!obsolete && enabled}
            disabled={disabled}
            onCheckedChange={(e) => {
              setDocumentStatus({
                status: e,
                documentId: id,
                datasetId: datasetId!,
              });
            }}
          />
        );
        if (parsingIncomplete && !enabled) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{statusSwitch}</span>
              </TooltipTrigger>
              <TooltipContent>
                {t('enableAfterParsing')}
              </TooltipContent>
            </Tooltip>
          );
        }
        return (
          statusSwitch
        );
      },
    },
    {
      accessorKey: 'is_obsolete',
      header: t('obsolete'),
      cell: ({ row }) => isEmptyCategory(row.original) ? <span>—</span> : <ObsoleteSwitch datasetId={datasetId} documentId={row.original.id} value={row.getValue('is_obsolete')} />,
    },
    {
      accessorKey: 'chunk_count',
      header: t('chunkNumber'),
      cell: ({ row }) => isCategory(row.original) ? <span>—</span> : <div className="capitalize">{row.getValue('chunk_count')}</div>,
    },
    {
      accessorKey: 'meta_fields',
      header: t('metadata.metadata'),
      cell: ({ row }) => {
        if (isCategory(row.original)) return <span>—</span>;
        const length = Object.keys(row.getValue('meta_fields') || {}).length;
        return (
          <Button
            variant="static"
            size="auto"
            onClick={() => {
              showManageMetadataModal({
                // metadata: util.JSONToMetaDataTableData(
                //   row.original.meta_fields || {},
                // ),
                isEditField: false,
                isCanAdd: true,
                isAddValue: true,
                type: MetadataType.UpdateSingle,
                record: row.original,
                title: (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="text-base font-normal">
                      {t('metadata.editMetadata')}
                    </div>
                    {/* <div className="text-sm text-text-secondary w-full truncate">
                      {t('metadata.editMetadataForDataset')}
                      {row.original.name}
                    </div> */}
                  </div>
                ),
                secondTitle: (
                  <div className="w-full flex gap-1 text-sm text-text-secondary">
                    <FileIcon name={row.original.name}></FileIcon>
                    <div className="truncate">{row.original.name}</div>
                  </div>
                ),
                isDeleteSingleValue: true,
                documentIds: [row.original.id],
              });
            }}
          >
            {length + ' fields'}
          </Button>
        );
      },
    },
    {
      accessorKey: 'run',
      header: t('Parse'),
      // meta: { cellClassName: 'min-w-[20vw]' },
      cell: ({ row }) => {
        if (isCategory(row.original)) return <span>—</span>;
        return (
          <ParseDropdownButton
            record={row.original}
            showChangeParserModal={showChangeParserModal}
          />
        );
      },
    },
    {
      id: 'run-status',
      header: '',
      cell: ({ row }) => {
        if (isCategory(row.original)) return null;
        return (
          <ParsingStatusCell
            record={row.original}
            showChangeParserModal={showChangeParserModal}
            showLog={showLog}
          />
        );
      },
    },
    {
      id: 'actions',
      header: t('action'),
      enableHiding: false,
      cell: ({ row }) => {
        const record = row.original;

        return (
          <DatasetActionCell
            record={record}
            showRenameModal={showRenameModal}
            categories={categories}
          />
        );
      },
    },
  ];

  return columns;
}
