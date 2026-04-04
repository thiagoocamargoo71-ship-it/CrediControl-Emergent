function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function diffInDays(from, to) {
  const DAY_MS = 1000 * 60 * 60 * 24;
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.floor((b - a) / DAY_MS);
}

function isDueToday(dueDate, today) {
  return isSameDay(parseDateOnly(dueDate), today);
}

function isDueInNext7Days(dueDate, today) {
  const due = parseDateOnly(dueDate);
  const days = diffInDays(today, due);
  return days >= 0 && days <= 7;
}

function isCriticalInstallment(installment) {
  return installment.status === 'overdue' && installment.days_overdue > 7;
}

function calculateDelinquencyRate(totalOpenBalance, overdueReceivables) {
  if (totalOpenBalance <= 0) return 0;
  return Number(((overdueReceivables / totalOpenBalance) * 100).toFixed(2));
}

function calculateTopCustomersConcentration(loans) {
  if (!loans || !loans.length) return 0;

  const grouped = new Map();

  for (const loan of loans) {
    const current = grouped.get(loan.customer_id) || 0;
    grouped.set(loan.customer_id, current + (loan.total_amount || 0));
  }

  const values = Array.from(grouped.values());
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0) return 0;

  const top3 = values
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, value) => sum + value, 0);

  return Number(((top3 / total) * 100).toFixed(2));
}

function buildInstallmentsByCustomer(loans, installments) {
  const mapByCustomer = new Map();

  for (const loan of loans || []) {
    if (!mapByCustomer.has(loan.customer_id)) {
      mapByCustomer.set(loan.customer_id, []);
    }

    const relatedInstallments = (installments || []).filter(
      (item) => item.loan_id === loan.id
    );

    const currentItems = mapByCustomer.get(loan.customer_id) || [];
    mapByCustomer.set(loan.customer_id, [...currentItems, ...relatedInstallments]);
  }

  return mapByCustomer;
}

function countGoodPayers(input) {
  const mapByCustomer = buildInstallmentsByCustomer(input.loans, input.installments);
  let count = 0;

  for (const customer of input.customers || []) {
    const items = mapByCustomer.get(customer.id) || [];
    if (!items.length) continue;

    const paid = items.filter((item) => item.status === 'paid').length;
    const overdue = items.filter((item) => item.status === 'overdue').length;
    const critical = items.filter((item) => isCriticalInstallment(item)).length;

    if (paid >= 3 && overdue <= 1 && critical === 0) {
      count += 1;
    }
  }

  return count;
}

function countEligibleForNewCredit(input) {
  const mapByCustomer = buildInstallmentsByCustomer(input.loans, input.installments);
  let count = 0;

  for (const customer of input.customers || []) {
    const items = mapByCustomer.get(customer.id) || [];
    if (!items.length) continue;

    const paid = items.filter((item) => item.status === 'paid').length;
    const overdue = items.filter((item) => item.status === 'overdue').length;
    const critical = items.filter((item) => isCriticalInstallment(item)).length;

    if (paid >= 3 && overdue === 0 && critical === 0) {
      count += 1;
    }
  }

  return count;
}

function countCustomersFinishingLoansSoon(loans, installments) {
  let count = 0;

  for (const loan of loans || []) {
    const related = (installments || [])
      .filter((item) => item.loan_id === loan.id)
      .sort((a, b) => a.number - b.number);

    if (!related.length) continue;

    const paidCount = related.filter((item) => item.status === 'paid').length;
    const remaining = (loan.number_of_installments || 0) - paidCount;

    if (remaining > 0 && remaining <= 2) {
      count += 1;
    }
  }

  return count;
}

function detectMainRiskType(params) {
  if (params.criticalRiskCustomers > 0) return 'atraso_critico';
  if (params.projectedCashStatus === 'pressionado') return 'caixa';
  if (params.concentrationTopCustomersPercent > 40) return 'concentracao';
  if (params.delinquencyRate > 10) return 'inadimplencia_crescente';
  if (params.installmentsDueToday > 0) return 'vencimentos_hoje';
  return 'nenhum';
}

function detectMainOpportunityType(params) {
  if (params.eligibleForNewCredit > 0) return 'novas_concessoes';
  if (params.goodPayers > 0) return 'clientes_recorrentes';
  if (
    params.safeGrowthCapacity === 'alta' ||
    params.safeGrowthCapacity === 'moderada'
  ) {
    return 'expansao_controlada';
  }
  return 'preservar_carteira';
}

export function buildDashboardHomeData(input) {
  const today = startOfDay(new Date());
  const customers = input?.customers || [];
  const customerStatuses = input?.customerStatuses || {};
  const loans = input?.loans || [];
  const installments = input?.installments || [];
  const installmentStats = input?.installmentStats || null;

  const totalLoaned = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);

  const totalOpenBalance =
    installmentStats && typeof installmentStats.pending_amount === 'number'
      ? installmentStats.pending_amount + (installmentStats.overdue_amount || 0)
      : installments
          .filter((item) => item.status !== 'paid')
          .reduce((sum, item) => sum + (item.updated_amount || item.amount || 0), 0);

  const overdueInstallments = installments.filter(
    (item) => item.status === 'overdue'
  ).length;

  const installmentsDueToday = installments.filter(
    (item) => item.status !== 'paid' && isDueToday(item.due_date, today)
  ).length;

  const installmentsDueNext7Days = installments.filter(
    (item) => item.status !== 'paid' && isDueInNext7Days(item.due_date, today)
  ).length;

  const expectedToday = installments
    .filter((item) => item.status === 'pending' && isDueToday(item.due_date, today))
    .reduce((sum, item) => sum + (item.updated_amount || item.amount || 0), 0);

  const expectedNext7Days = installments
    .filter(
      (item) => item.status === 'pending' && isDueInNext7Days(item.due_date, today)
    )
    .reduce((sum, item) => sum + (item.updated_amount || item.amount || 0), 0);

  const overdueReceivables =
    installmentStats && typeof installmentStats.overdue_amount === 'number'
      ? installmentStats.overdue_amount
      : installments
          .filter((item) => item.status === 'overdue')
          .reduce((sum, item) => sum + (item.updated_amount || item.amount || 0), 0);

  const atRiskReceivables = installments
    .filter((item) => item.status === 'pending' && item.number > 1)
    .reduce((sum, item) => sum + (item.updated_amount || item.amount || 0), 0);

  const delinquencyRate = calculateDelinquencyRate(
    totalOpenBalance,
    overdueReceivables
  );

  let projectedCashStatus = 'positivo';

  if (expectedNext7Days <= 0) {
    projectedCashStatus = 'pressionado';
  } else if (overdueReceivables + atRiskReceivables > expectedNext7Days * 0.7) {
    projectedCashStatus = 'pressionado';
  } else if (overdueReceivables + atRiskReceivables > expectedNext7Days * 0.35) {
    projectedCashStatus = 'estavel';
  }

  const criticalRiskCustomers = Object.values(customerStatuses).filter(
    (item) => item && item.status === 'overdue'
  ).length;

  const recurringLateCustomers = Object.values(customerStatuses).filter(
    (item) => item && (item.total_overdue || 0) >= 2
  ).length;

  const concentrationTopCustomersPercent =
    calculateTopCustomersConcentration(loans);

  const goodPayers = countGoodPayers({
    customers,
    loans,
    installments,
  });

  const eligibleForNewCredit = countEligibleForNewCredit({
    customers,
    loans,
    installments,
  });

  const customersFinishingLoansSoon = countCustomersFinishingLoansSoon(
    loans,
    installments
  );

  let safeGrowthCapacity = 'baixa';

  if (projectedCashStatus === 'positivo' && delinquencyRate < 5) {
    safeGrowthCapacity = 'alta';
  } else if (projectedCashStatus !== 'pressionado' && delinquencyRate < 10) {
    safeGrowthCapacity = 'moderada';
  }

  const mainRiskType = detectMainRiskType({
    criticalRiskCustomers,
    projectedCashStatus,
    concentrationTopCustomersPercent,
    delinquencyRate,
    installmentsDueToday,
  });

  const mainOpportunityType = detectMainOpportunityType({
    eligibleForNewCredit,
    goodPayers,
    safeGrowthCapacity,
  });

  return {
    portfolio: {
      totalLoaned: Number(totalLoaned.toFixed(2)),
      totalOpenBalance: Number(totalOpenBalance.toFixed(2)),
      activeCustomers: customers.length,
      delinquencyRate,
      overdueInstallments,
      installmentsDueToday,
      installmentsDueNext7Days,
    },
    cashflow: {
      expectedToday: Number(expectedToday.toFixed(2)),
      expectedNext7Days: Number(expectedNext7Days.toFixed(2)),
      overdueReceivables: Number(overdueReceivables.toFixed(2)),
      atRiskReceivables: Number(atRiskReceivables.toFixed(2)),
      projectedCashStatus,
    },
    risk: {
      criticalRiskCustomers,
      recurringLateCustomers,
      concentrationTopCustomersPercent,
      delinquencyTrend: 'estavel',
      recentRenegotiations: 0,
      mainRiskType,
    },
    opportunity: {
      goodPayers,
      customersFinishingLoansSoon,
      eligibleForNewCredit,
      safeGrowthCapacity,
      mainOpportunityType,
    },
    trends: {
      averageLoanTicketTrend: 'estavel',
      averageInterestRateTrend: 'estavel',
      delinquency30dTrend: 'estavel',
    },
    generatedAt: new Date().toISOString(),
  };
}