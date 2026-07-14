export type PlanningRuleWeights = {
  lqChange: number;
  startDateDeviation: number;
  zpg2dChange: number;
  zpg3dChange: number;
  loadImbalance: number;
};

export type PlanningRules = {
  version: string;
  groupBySteelType: boolean;
  preserveOperationOrder: boolean;
  useStatus: boolean;
  startDateToleranceDays: number;
  weights: PlanningRuleWeights;
};

export const DEFAULT_PLANNING_RULES: PlanningRules = Object.freeze({
  version: 'LQ-FIRST-v1',
  groupBySteelType: true,
  preserveOperationOrder: true,
  useStatus: false,
  startDateToleranceDays: 0,
  weights: {
    lqChange: 1000,
    startDateDeviation: 300,
    zpg2dChange: 100,
    zpg3dChange: 50,
    loadImbalance: 20,
  },
});

