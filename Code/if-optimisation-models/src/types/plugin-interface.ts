import {ConfigParams, PluginParams} from './common';

/**
 * Base interface for plugins.
 */
export type PluginInterface = {
  execute: (
    inputs: PluginParams[],
    config?: ConfigParams
  ) => Promise<PluginParams[]>;
  metadata: {
    kind: string;
  };
  [key: string]: any;
};