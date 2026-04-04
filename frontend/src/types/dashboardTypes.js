export const HEALTH_STATUS = {
  SAUDAVEL: 'saudavel',
  ESTAVEL: 'estavel',
  ATENCAO: 'atencao',
  CRITICO: 'critico',
};

export const CASHFLOW_STATUS = {
  POSITIVO: 'positivo',
  ESTAVEL: 'estavel',
  PRESSIONADO: 'pressionado',
};

export const TREND_DIRECTION = {
  SUBINDO: 'subindo',
  ESTAVEL: 'estavel',
  CAINDO: 'caindo',
};

export const MAIN_RISK_TYPE = {
  ATRASO_CRITICO: 'atraso_critico',
  CAIXA: 'caixa',
  CONCENTRACAO: 'concentracao',
  INADIMPLENCIA_CRESCENTE: 'inadimplencia_crescente',
  VENCIMENTOS_HOJE: 'vencimentos_hoje',
  NENHUM: 'nenhum',
};

export const MAIN_OPPORTUNITY_TYPE = {
  NOVAS_CONCESSOES: 'novas_concessoes',
  CLIENTES_RECORRENTES: 'clientes_recorrentes',
  EXPANSAO_CONTROLADA: 'expansao_controlada',
  PRESERVAR_CARTEIRA: 'preservar_carteira',
  NENHUMA: 'nenhuma',
};

export function createEmptyDashboardHomeData() {
  return {
    portfolio: {
      totalLoaned: 0,
      totalOpenBalance: 0,
      activeCustomers: 0,
      delinquencyRate: 0,
      overdueInstallments: 0,
      installmentsDueToday: 0,
      installmentsDueNext7Days: 0,
    },
    cashflow: {
      expectedToday: 0,
      expectedNext7Days: 0,
      overdueReceivables: 0,
      atRiskReceivables: 0,
      projectedCashStatus: CASHFLOW_STATUS.ESTAVEL,
    },
    risk: {
      criticalRiskCustomers: 0,
      recurringLateCustomers: 0,
      concentrationTopCustomersPercent: 0,
      delinquencyTrend: TREND_DIRECTION.ESTAVEL,
      recentRenegotiations: 0,
      mainRiskType: MAIN_RISK_TYPE.NENHUM,
    },
    opportunity: {
      goodPayers: 0,
      customersFinishingLoansSoon: 0,
      eligibleForNewCredit: 0,
      safeGrowthCapacity: 'baixa',
      mainOpportunityType: MAIN_OPPORTUNITY_TYPE.NENHUMA,
    },
    trends: {
      averageLoanTicketTrend: TREND_DIRECTION.ESTAVEL,
      averageInterestRateTrend: TREND_DIRECTION.ESTAVEL,
      delinquency30dTrend: TREND_DIRECTION.ESTAVEL,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function createEmptyExecutiveSummary() {
  return {
    score: 0,
    status: HEALTH_STATUS.ESTAVEL,
    headline: '',
    mainAlert: '',
    mainOpportunity: '',
    recommendedAction: '',
    metrics: {
      expectedReceipts7d: 0,
      delinquencyRate: 0,
      riskyClients: 0,
      overdueInstallments: 0,
    },
  };
}