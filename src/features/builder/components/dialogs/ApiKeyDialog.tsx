import React from 'react';
import { Key, X } from 'lucide-react';
import { useLanguage as useUiLanguage } from '../../../../context/LanguageContext';
import { useBuilder } from '../../context/BuilderContext';
import { Modal } from '../../../../components/Modal';
import { ApiKeyForm } from './ApiKeyForm';
import { ApiKeyResult } from './ApiKeyResult';

export const ApiKeyDialog: React.FC = () => {
  const { tr: ui } = useUiLanguage();
  const {
    showNewKeyModal,
    setShowNewKeyModal,
    createdApiKey,
    setCreatedApiKey,
    newKeyName,
    setNewKeyName,
    copiedKey,
    handleCopyKey,
    generateKeyError,
    isGeneratingKey,
    handleGenerateApiKeySubmit
  } = useBuilder();

  const dismiss = () => {
    setShowNewKeyModal(false);
    setCreatedApiKey(null);
    setNewKeyName('');
  };

  return (
    <Modal
      open={showNewKeyModal}
      onClose={dismiss}
      label={createdApiKey ? ui('API Key Generated') : ui('Generate Studio API Key')}
    >
      <div className="bg-neutral-50 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-neutral-900">
              {createdApiKey ? ui("API Key Generated") : ui("Generate Studio API Key")}
            </h3>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-neutral-600 hover:text-neutral-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdApiKey ? (
          <ApiKeyResult
            apiKey={createdApiKey}
            copied={copiedKey}
            labels={{
              notice: ui("Make sure to copy your API key now."),
              noticeDetail: ui("You won't be able to see it again! Store it in an environment variable or secrets manager."),
              keyLabel: ui("Your Live Secret Key"),
              copy: ui("Copy"),
              copied: ui("Copied"),
              done: ui("Done")
            }}
            onCopy={handleCopyKey}
            onDone={dismiss}
          />
        ) : (
          <ApiKeyForm
            keyName={newKeyName}
            error={generateKeyError}
            generating={isGeneratingKey}
            labels={{
              nameLabel: ui("Key Name / Description"),
              namePlaceholder: ui("e.g., Zapier Sync, Mobile App Integration"),
              nameHelp: ui("Give your API key a recognizable name so you can track where it is being used."),
              cancel: ui("Cancel"),
              generate: ui("Generate Key"),
              generating: ui("Generating...")
            }}
            onKeyNameChange={setNewKeyName}
            onCancel={() => setShowNewKeyModal(false)}
            onSubmit={handleGenerateApiKeySubmit}
          />
        )}
      </div>
    </Modal>
  );
};
