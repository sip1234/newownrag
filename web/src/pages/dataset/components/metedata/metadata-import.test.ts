import { mergeImportedMetadata, parseImportedMetadata } from './metadata-import';

describe('parseImportedMetadata', () => {
  it('accepts the dataset metadata config format', () => {
    expect(
      parseImportedMetadata({
        metadata: [
          { key: 'department', type: 'string', description: 'Owning team', enum: ['Finance', 'HR'] },
          { key: 'published_at', type: 'time' },
        ],
      }),
    ).toEqual([
      {
        field: 'department',
        valueType: 'string',
        description: 'Owning team',
        values: ['Finance', 'HR'],
        restrictDefinedValues: true,
      },
      {
        field: 'published_at',
        valueType: 'time',
        description: '',
        values: [],
        restrictDefinedValues: false,
      },
    ]);
  });

  it('rejects invalid names and types', () => {
    expect(() => parseImportedMetadata([{ key: 'display name', type: 'string' }])).toThrow('invalid field name');
    expect(() => parseImportedMetadata([{ key: 'department', type: 'boolean' }])).toThrow('unsupported type');
  });

  it('updates an existing field without duplicating it', () => {
    const existing = parseImportedMetadata([{ key: 'department', type: 'string', enum: ['Old'] }]);
    const imported = parseImportedMetadata([
      { key: 'department', type: 'list', enum: ['Finance'] },
      { key: 'year', type: 'number' },
    ]);

    expect(mergeImportedMetadata(existing, imported)).toEqual([
      {
        field: 'department',
        valueType: 'list',
        description: '',
        values: ['Finance'],
        restrictDefinedValues: true,
      },
      {
        field: 'year',
        valueType: 'number',
        description: '',
        values: [],
        restrictDefinedValues: false,
      },
    ]);
  });
});
