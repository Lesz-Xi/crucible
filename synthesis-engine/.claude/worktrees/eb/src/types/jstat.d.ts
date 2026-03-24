declare module "jstat" {
  export const jStat: {
    studentt: {
      cdf: (x: number, dof: number) => number;
    };
  };
}
