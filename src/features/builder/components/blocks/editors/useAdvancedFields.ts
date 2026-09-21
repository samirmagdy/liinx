import { type ProfileBlock } from '../../../../../types';
import { useBuilder } from '../../../context/BuilderContext';

export interface AdvancedFields {
  advanced: Record<string, any>;
  updateAdvanced: (key: string, value: unknown) => void;
}

export function useAdvancedFields(block: ProfileBlock): AdvancedFields {
  const { handleUpdateBlockExtra } = useBuilder();
  return {
    advanced: block as Record<string, any>,
    updateAdvanced: (key, value) => handleUpdateBlockExtra(block.id, { [key]: value })
  };
}
