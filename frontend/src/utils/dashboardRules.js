import {
  CASHFLOW_STATUS,
} from './dashboardTypes';

const DAY_MS = 1000 * 60 * 60 * 24;

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseDateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function diffInDays(from, to) {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.floor((b - a) / DAY_MS);
}

export function isOverdue(installment, today = new Date()) {
  if (!installment || installment.status === 'paid') return false;
  if (installment.status === 'overdue') return true;

  const due = parseDateOnly(installment.due_date);
  return startOfDay(due).getTime() < startOfDay(today).getTime();
}

export function getDaysOverdue(installment, today = new Date()) {
  if (!isOverdue(installment, today)) return 0;

  if (typeof installment.days_overdue === 'number') {
    return installment.days_overdue;
  }

  const due = parseDateOnly(installment.due_date);
  return diffInDays(due, today);
}

export function isCriticalDelay(installment, today = new Date()) {
  return getDaysOverdue(installment, today) > 7;
}

export function isDueToday(installment, today = new Date()) {
  if (!installment || !installment.due_date) return false;
  const due = parseDateOnly(installment.due_date);
  return isSameDay(due, today);
}

export function isDueInNext7Days(installment, today = new Date()) {
  if (!installment || !installment.due_date || installment.status === 'paid') {
    return false;
  }

  const due = parseDateOnly(installment.due_date);
  const days = diffInDays(today, due);
  return days >= 0 && days <= 7;
}

export function getCustomerLoans(customerId, loans) {
  return (loans || []).filter((loan) => loan.customer_id === customerId);
}

export function getCustomerInstallments(customerId, loans, installments) {
  const customerLoanIds = getCustomerLoans(customerId, loans).map((loan) => loan.id);

  return (installments || []).filter((item) =>
    customerLoanIds.includes(item.loan_id)
  );
}

export function getCustomerOverdueInstallments(
  customerId,
  loans,
  installments,
  today = new Date()
) {
  return getCustomerInstallments(customerId, loans, installments).filter((item) =>
    isOverdue(item, today)
  );
}

export function isGoodPayer(customerId, loans, installments, today = new Date()) {
  const customerInstallments = getCustomerInstallments(
    customerId,
    loans,
    installments
  );

  if (!customerInstallments.length) return false;

  const overdue = customerInstallments.filter((item) => isOverdue(item, today));
  const critical = overdue.filter((item) => isCriticalDelay(item, today));
  const paidCount = customerInstallments.filter((item) => item.status === 'paid').length;

  return paidCount >= 3 && overdue.length <= 1 && critical.length === 0;
}

export function isEligibleForNewCredit(
  customerId,
  loans,
  installments,
  today = new Date()
) {
  const customerInstallments = getCustomerInstallments(
    customerId,
    loans,
    installments
  );

  if (!customerInstallments.length) return false;

  const overdue = customerInstallments.filter((item) => isOverdue(item, today));
  const critical = overdue.filter((item) => isCriticalDelay(item, today));
  const paidCount = customerInstallments.filter((item) => item.status === 'paid').length;

  return paidCount >= 3 && overdue.length === 0 && critical.length === 0;
}

export function getProjectedCashStatus(params) {
  const expectedNext7Days = params?.expectedNext7Days || 0;
  const overdueReceivables = params?.overdueReceivables || 0;
  const atRiskReceivables = params?.atRiskReceivables || 0;

  if (expectedNext7Days <= 0) return CASHFLOW_STATUS.PRESSIONADO;

  const riskRatio = (overdueReceivables + atRiskReceivables) / expectedNext7Days;

  if (riskRatio >= 0.7) return CASHFLOW_STATUS.PRESSIONADO;
  if (riskRatio >= 0.35) return CASHFLOW_STATUS.ESTAVEL;
  return CASHFLOW_STATUS.POSITIVO;
}

export function calculateDelinquencyRate(params) {
  const totalOpenBalance = params?.totalOpenBalance || 0;
  const overdueReceivables = params?.overdueReceivables || 0;

  if (totalOpenBalance <= 0) return 0;
  return Number(((overdueReceivables / totalOpenBalance) * 100).toFixed(2));
}

export function calculateTopCustomersConcentration(loans) {
  if (!loans || !loans.length) return 0;

  const totalOpen = loans.reduce(
    (sum, loan) => sum + (loan.total_amount || loan.openBalance || loan.amount || 0),
    0
  );

  if (totalOpen <= 0) return 0;

  const grouped = new Map();

  for (const loan of loans) {
    const current = grouped.get(loan.customer_id) || 0;
    grouped.set(
      loan.customer_id,
      current + (loan.total_amount || loan.openBalance || loan.amount || 0)
    );
  }

  const sortedBalances = Array.from(grouped.values()).sort((a, b) => b - a);
  const top3 = sortedBalances.slice(0, 3).reduce((sum, value) => sum + value, 0);

  return Number(((top3 / totalOpen) * 100).toFixed(2));
}