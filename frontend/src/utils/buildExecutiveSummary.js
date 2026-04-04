function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getHealthStatus(score) {
  if (score >= 85) return 'saudavel';
  if (score >= 70) return 'estavel';
  if (score >= 50) return 'atencao';
  return 'critico';
}

function buildScore(data) {
  let score = 100;

  if (data.portfolio.delinquencyRate > 10) {
    score -= 20;
  } else if (data.portfolio.delinquencyRate > 5) {
    score -= 10;
  }

  if (data.risk.criticalRiskCustomers > 3) {
    score -= 15;
  } else if (data.risk.criticalRiskCustomers > 0) {
    score -= 8;
  }

  if (data.risk.concentrationTopCustomersPercent > 40) {
    score -= 15;
  }

  if (data.cashflow.projectedCashStatus === 'pressionado') {
    score -= 10;
  } else if (data.cashflow.projectedCashStatus === 'estavel') {
    score -= 4;
  }

  if (data.risk.delinquencyTrend === 'subindo') {
    score -= 10;
  }

  if (data.cashflow.expectedNext7Days > data.cashflow.overdueReceivables) {
    score += 5;
  }

  if (data.opportunity.eligibleForNewCredit > 0) {
    score += 5;
  }

  if (data.risk.delinquencyTrend === 'caindo') {
    score += 5;
  }

  return clampScore(score);
}

function buildMainAlert(data) {
  switch (data.risk.mainRiskType) {
    case 'atraso_critico':
      return data.risk.criticalRiskCustomers === 1
        ? 'Há 1 cliente em atraso crítico exigindo ação imediata.'
        : `Há ${data.risk.criticalRiskCustomers} clientes em atraso crítico exigindo ação imediata.`;

    case 'caixa':
      return 'O caixa projetado está pressionado pelos valores em atraso e pelo risco dos próximos recebimentos.';

    case 'concentracao':
      return `A carteira está concentrada: ${data.risk.concentrationTopCustomersPercent}% do volume está nos principais clientes.`;

    case 'inadimplencia_crescente':
      return `A inadimplência atual está em ${data.portfolio.delinquencyRate.toFixed(
        1
      )}%, acima do ideal para uma operação saudável.`;

    case 'vencimentos_hoje':
      return data.portfolio.installmentsDueToday === 1
        ? 'Há 1 parcela vencendo hoje que merece acompanhamento preventivo.'
        : `Há ${data.portfolio.installmentsDueToday} parcelas vencendo hoje que merecem acompanhamento preventivo.`;

    default:
      return 'No momento, a operação não apresenta um alerta crítico dominante.';
  }
}

function buildMainOpportunity(data) {
  switch (data.opportunity.mainOpportunityType) {
    case 'novas_concessoes':
      return data.opportunity.eligibleForNewCredit === 1
        ? 'Existe 1 cliente com perfil favorável para nova concessão de crédito.'
        : `Existem ${data.opportunity.eligibleForNewCredit} clientes com perfil favorável para nova concessão de crédito.`;

    case 'clientes_recorrentes':
      return data.opportunity.goodPayers === 1
        ? 'Há 1 bom pagador que pode sustentar novas ações comerciais com baixo risco.'
        : `Há ${data.opportunity.goodPayers} bons pagadores que podem sustentar novas ações comerciais com baixo risco.`;

    case 'expansao_controlada':
      return 'A operação apresenta espaço para crescimento controlado sem pressionar o risco da carteira.';

    default:
      return 'A melhor oportunidade agora é preservar a qualidade da carteira antes de expandir.';
  }
}

function buildRecommendedAction(data) {
  switch (data.risk.mainRiskType) {
    case 'atraso_critico':
      return 'Priorize cobranças imediatas nos clientes em atraso crítico e acompanhe os vencimentos mais sensíveis.';

    case 'caixa':
      return 'Reduza a exposição no curto prazo, fortaleça a cobrança e adie concessões mais arriscadas até o caixa estabilizar.';

    case 'concentracao':
      return 'Revise a exposição dos maiores clientes e busque diluir o risco da carteira antes de ampliar o volume emprestado.';

    case 'inadimplencia_crescente':
      return 'Reforce a cobrança preventiva e revise critérios de concessão para conter o avanço da inadimplência.';

    case 'vencimentos_hoje':
      return 'Atue preventivamente nos vencimentos de hoje para evitar que atrasos pontuais se transformem em inadimplência.';

    default:
      if (data.opportunity.eligibleForNewCredit > 0) {
        return 'Aproveite o cenário atual para explorar concessões seguras em clientes já validados.';
      }

      return 'Mantenha o acompanhamento da carteira e preserve o equilíbrio entre crescimento e risco.';
  }
}

function buildFinancialContext(data, status) {
  const expected7d = data.cashflow.expectedNext7Days.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  if (status === 'saudavel') {
    return `com ${expected7d} previstos para os próximos 7 dias e inadimplência sob controle`;
  }

  if (status === 'estavel') {
    return `com ${expected7d} previstos para os próximos 7 dias e pontos de atenção ainda controlados`;
  }

  if (status === 'atencao') {
    return `com ${expected7d} previstos para os próximos 7 dias, mas com pressão operacional crescente`;
  }

  return `com ${expected7d} previstos para os próximos 7 dias, porém insuficientes para compensar o nível atual de risco`;
}

function buildHeadline(params) {
  const openingMap = {
    saudavel: 'Sua operação está saudável',
    estavel: 'Sua operação está estável',
    atencao: 'Sua carteira exige atenção',
    critico: 'Sua operação está em nível crítico',
  };

  return `${openingMap[params.status]}, ${params.financialContext}. ${params.mainAlert} ${params.mainOpportunity} Recomendamos: ${params.recommendedAction}`;
}

export function buildExecutiveSummary(data) {
  const score = buildScore(data);
  const status = getHealthStatus(score);
  const mainAlert = buildMainAlert(data);
  const mainOpportunity = buildMainOpportunity(data);
  const recommendedAction = buildRecommendedAction(data);
  const financialContext = buildFinancialContext(data, status);
  const headline = buildHeadline({
    status,
    financialContext,
    mainAlert,
    mainOpportunity,
    recommendedAction,
  });

  return {
    score,
    status,
    headline,
    mainAlert,
    mainOpportunity,
    recommendedAction,
    metrics: {
      expectedReceipts7d: Number(data.cashflow.expectedNext7Days.toFixed(2)),
      delinquencyRate: Number(data.portfolio.delinquencyRate.toFixed(2)),
      riskyClients: data.risk.criticalRiskCustomers,
      overdueInstallments: data.portfolio.overdueInstallments,
    },
  };
}

export function getExecutiveStatusMeta(status) {
  const map = {
    saudavel: {
      label: 'Saudável',
      description: 'Operação equilibrada',
    },
    estavel: {
      label: 'Estável',
      description: 'Com pontos de atenção',
    },
    atencao: {
      label: 'Atenção',
      description: 'Pressão operacional crescente',
    },
    critico: {
      label: 'Crítico',
      description: 'Ação imediata recomendada',
    },
  };

  return map[status] || map.estavel;
}