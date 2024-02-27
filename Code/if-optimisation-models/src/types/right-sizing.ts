import { CloudInstance } from '../lib/right-sizing/CPUFamily';


export interface InstanceData {
    instance: CloudInstance;
    cpuUtil: number;
    memUtil: number;
    price: number;
    priceDifference: number;
}

export interface CombinationData {
    optimalRAM: number;
    exceedCPUs: number;
    lowestCost: number;
    optimalCombination: InstanceData[];
}

export interface CurrentData {
    combination: CloudInstance[];
    currentCPUs: number;
    currentRAM: number;
    currentCost: number;
}

export interface OriginalData {
    originalCost: number;
    originalRAM: number;
    requiredvCPUs: number;
    targetUtil: number;
    targetRAM: number;
    region: string;
}
