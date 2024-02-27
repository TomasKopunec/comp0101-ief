import {spawnSync, SpawnSyncReturns} from 'child_process';
import {loadAll, dump} from 'js-yaml';
import {z} from 'zod';

import { PluginInterface } from '../../types/plugin-interface';
import {ConfigParams, PluginParams} from '../../types/common';

<<<<<<< HEAD
import {validate} from '../../util/validations';
import {ERRORS} from '../../util/errors';
=======
import { ModelParams, ModelPluginInterface } from '../../types/legacy';
>>>>>>> e1ed6250577c2918c59afab8f6c0810594675d71

const {InputValidationError} = ERRORS;

export const Visualizer = (globalConfig: ConfigParams): PluginInterface => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Calculate the total emissions for a list of inputs.
   */
  const execute = async (inputs: PluginParams[]): Promise<any[]> => {
    const inputWithConfig: PluginParams = Object.assign(
      {},
      inputs[0],
      globalConfig
    );
    const command = validateSingleInput(inputWithConfig).command;
    const inputAsString: string = dump(inputs, {indent: 2});
    const results = runModelInShell(inputAsString, command);

    return results.outputs;
  };

  /**
   * Checks for required fields in input.
   */
  const validateSingleInput = (input: PluginParams) => {
    const schema = z.object({
      command: z.string(),
    });

    return validate<z.infer<typeof schema>>(schema, input);
  };

  /**
   * Runs the model in a shell. Spawns a child process to run an external IMP,
   * an executable with a CLI exposing two methods: `--execute` and `--manifest`.
   * The shell command then calls the `--command` method passing var manifest as the path to the desired manifest file.
   */
  const runModelInShell = (input: string, command: string) => {
    try {
      const [executable, ...args] = command.split(' ');

      const result: SpawnSyncReturns<string> = spawnSync(executable, args, {
        input,
        encoding: 'utf8',
      });
      const outputs = loadAll(result.stdout);

      return {outputs: outputs};
    } catch (error: any) {
      throw new InputValidationError(error.message);
    }
  };

  return {
    metadata,
    execute,
  };
};