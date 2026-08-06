import { DEFAULT_VALUE_TYPE } from './constant';
import { IMetaDataTableData, MetadataValueType } from './interface';

const supportedValueTypes = new Set<MetadataValueType>([
  'string',
  'list',
  'time',
  'number',
]);

type ImportedMetadataField = {
  key?: unknown;
  name?: unknown;
  field?: unknown;
  type?: unknown;
  valueType?: unknown;
  description?: unknown;
  enum?: unknown;
  values?: unknown;
};

const getImportFields = (input: unknown): ImportedMetadataField[] => {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object' && Array.isArray((input as { metadata?: unknown }).metadata)) {
    return (input as { metadata: ImportedMetadataField[] }).metadata;
  }
  throw new Error('Metadata import must be a JSON array or an object with a metadata array.');
};

const getStringValues = (value: unknown, field: string): string[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' && typeof item !== 'number')) {
    throw new Error(`The values for "${field}" must be an array of strings or numbers.`);
  }
  return [...new Set(value.map((item) => String(item)))];
};

export const parseImportedMetadata = (input: unknown): IMetaDataTableData[] => {
  const imported = getImportFields(input);
  if (!imported.length) {
    throw new Error('Metadata import does not contain any fields.');
  }

  const fields = new Map<string, IMetaDataTableData>();
  imported.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Metadata entry ${index + 1} must be an object.`);
    }
    const field = item.key ?? item.name ?? item.field;
    if (typeof field !== 'string' || !/^[a-zA-Z_]+$/.test(field)) {
      throw new Error(`Metadata entry ${index + 1} has an invalid field name.`);
    }
    const rawType = item.type ?? item.valueType ?? DEFAULT_VALUE_TYPE;
    if (typeof rawType !== 'string' || !supportedValueTypes.has(rawType.toLowerCase() as MetadataValueType)) {
      throw new Error(`Metadata field "${field}" has an unsupported type.`);
    }
    if (item.description !== undefined && typeof item.description !== 'string') {
      throw new Error(`The description for "${field}" must be a string.`);
    }
    const valueType = rawType.toLowerCase() as MetadataValueType;
    fields.set(field, {
      field,
      valueType,
      description: item.description || '',
      values: getStringValues(item.enum ?? item.values, field),
      restrictDefinedValues: Array.isArray(item.enum ?? item.values) && (item.enum ?? item.values).length > 0,
    });
  });
  return [...fields.values()];
};

export const mergeImportedMetadata = (
  current: IMetaDataTableData[],
  imported: IMetaDataTableData[],
): IMetaDataTableData[] => {
  const importedByField = new Map(imported.map((item) => [item.field, item]));
  const merged = current.map((item) => importedByField.get(item.field) || item);
  imported.forEach((item) => {
    if (!current.some((currentItem) => currentItem.field === item.field)) {
      merged.push(item);
    }
  });
  return merged;
};
