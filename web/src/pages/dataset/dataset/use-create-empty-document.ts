import { useSetModalState } from '@/hooks/common-hooks';
import { useCreateDocument } from '@/hooks/use-document-request';
import { useCallback } from 'react';

export const useCreateEmptyDocument = (type: 'empty' | 'folder', parentId?: string) => {
  const { createDocument, loading } = useCreateDocument(parentId);

  const {
    visible: createVisible,
    hideModal: hideCreateModal,
    showModal: showCreateModal,
  } = useSetModalState();

  const onCreateOk = useCallback(
    async (name: string) => {
      const ret = await createDocument({ name, type });
      if (ret === 0) {
        hideCreateModal();
      }
    },
    [hideCreateModal, createDocument],
  );

  return {
    createLoading: loading,
    onCreateOk,
    createVisible,
    hideCreateModal,
    showCreateModal,
  };
};
