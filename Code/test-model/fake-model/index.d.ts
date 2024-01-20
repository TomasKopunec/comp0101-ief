import { ModelPluginInterface } from '@grnsft/if-models/build/interfaces';
import { ModelParams } from '@grnsft/if-models/build/types/common';
export declare class FakeModel implements ModelPluginInterface {
    private energyMetrics;
    /**
     * Configures the SCI-E Plugin.
     */
    configure(): Promise<ModelPluginInterface>;
    /**
     * Calculate the total emissions for a list of inputs.
     */
    execute(inputs: ModelParams[]): Promise<ModelParams[]>;
    /**
     * Checks for required fields in input.
     */
    private validateSingleInput;
    /**
     * Calculates the sum of the energy components.
     */
    private calculateEnergy;
}
