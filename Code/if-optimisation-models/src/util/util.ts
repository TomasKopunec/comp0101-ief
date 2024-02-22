
export const fixFloat = (num: number, precision: number = 2): number => {
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
};
