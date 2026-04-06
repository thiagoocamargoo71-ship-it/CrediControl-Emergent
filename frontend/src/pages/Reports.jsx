import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API, formatApiErrorDetail } from '../App';
import AppShell from '../components/AppShell';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  DollarSign,
  AlertTriangle,
  FileText,
  CalendarDays,
  Wallet,
  BarChart3,
} from 'lucide-react';

const getCurrentMonth = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
};

const Reports = () => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await axios.get(`${API}/installments/report/all`, {
        withCredentials: true,
      });
      setInstallments(response.data || []);
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) || 'Erro ao carregar relatórios'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);

  const formatDate = (dateValue) => {
    if (!dateValue) return '-';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);

    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const getStatusLabel = (status) => {
    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Atrasado',
    };

    return labels[status] || status;
  };

  const getPeriodLabel = () => {
    if (period === 'all') return 'todos';
    if (period === '7days') return '7-dias';
    if (period === '30days') return '30-dias';
    if (period === '60days') return '60-dias';
    if (period === '90days') return '90-dias';
    if (period === 'month') return selectedMonth || 'mes';
    return 'relatorio';
  };

  const getPeriodDisplayLabel = () => {
    if (period === 'all') return 'Todos os registros';
    if (period === '7days') return 'Próximos 7 dias';
    if (period === '30days') return 'Próximos 30 dias';
    if (period === '60days') return 'Próximos 60 dias';
    if (period === '90days') return 'Próximos 90 dias';
    if (period === 'month') {
      if (!selectedMonth) return 'Filtro mensal';
      return formatMonthLabel(selectedMonth);
    }
    return 'Relatório';
  };

  const filteredInstallments = useMemo(() => {
    if (period === 'all') return installments;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return installments.filter((item) => {
      const date = new Date(item.due_date);
      const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (period === '7days') {
        const limitDate = new Date(startOfToday);
        limitDate.setDate(limitDate.getDate() + 7);
        return itemDate >= startOfToday && itemDate <= limitDate;
      }

      if (period === '30days') {
        const limitDate = new Date(startOfToday);
        limitDate.setDate(limitDate.getDate() + 30);
        return itemDate >= startOfToday && itemDate <= limitDate;
      }

      if (period === '60days') {
        const limitDate = new Date(startOfToday);
        limitDate.setDate(limitDate.getDate() + 60);
        return itemDate >= startOfToday && itemDate <= limitDate;
      }

      if (period === '90days') {
        const limitDate = new Date(startOfToday);
        limitDate.setDate(limitDate.getDate() + 90);
        return itemDate >= startOfToday && itemDate <= limitDate;
      }

      if (period === 'month') {
        if (!selectedMonth) return true;

        const [year, month] = selectedMonth.split('-');
        return (
          itemDate.getFullYear() === Number(year) &&
          itemDate.getMonth() + 1 === Number(month)
        );
      }

      return true;
    });
  }, [installments, period, selectedMonth]);

  const summary = useMemo(() => {
    const totalReceived = filteredInstallments
      .filter((item) => item.status === 'paid')
      .reduce((acc, item) => acc + (item.updated_amount || 0), 0);

    const totalOpen = filteredInstallments
      .filter((item) => item.status === 'pending' || item.status === 'overdue')
      .reduce((acc, item) => acc + (item.updated_amount || 0), 0);

    const totalCount = filteredInstallments.length;
    const overdueCount = filteredInstallments.filter((item) => item.status === 'overdue').length;

    return {
      totalReceived,
      totalOpen,
      totalCount,
      overdueCount,
    };
  }, [filteredInstallments]);

  const monthlySummary = useMemo(() => {
    const grouped = {};

    filteredInstallments.forEach((item) => {
      const baseDate = item.paid_at || item.due_date;
      if (!baseDate) return;

      const date = new Date(baseDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthKey,
          received: 0,
          open: 0,
          count: 0,
        };
      }

      if (item.status === 'paid') {
        grouped[monthKey].received += item.updated_amount || 0;
      } else {
        grouped[monthKey].open += item.updated_amount || 0;
      }

      grouped[monthKey].count += 1;
    });

    return Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredInstallments]);

  const handleExportExcel = () => {
    try {
      if (!filteredInstallments.length) {
        toast.error('Não há dados para exportar no período selecionado');
        return;
      }

      const reportRows = filteredInstallments.map((item) => ({
        Cliente: item.customer_name || '-',
        'ID Empréstimo': item.loan_id || '-',
        Parcela: item.number || '-',
        'Valor Original': Number(item.amount || 0),
        'Valor Atualizado': Number(item.updated_amount || 0),
        Vencimento: item.due_date ? new Date(item.due_date) : '',
        Status: getStatusLabel(item.status),
        'Data Pagamento': item.paid_at ? new Date(item.paid_at) : '',
        'Dias de Atraso': Number(item.days_overdue || 0),
        'Taxa de Juros (%)': Number(item.interest_rate || 0),
        'Valor Empréstimo': Number(item.loan_amount || 0),
        'Total Empréstimo': Number(item.loan_total || 0),
      }));

      const summaryRows = [
        { Indicador: 'Total Recebido', Valor: Number(summary.totalReceived || 0) },
        { Indicador: 'Total em Aberto', Valor: Number(summary.totalOpen || 0) },
        { Indicador: 'Quantidade de Parcelas', Valor: Number(summary.totalCount || 0) },
        { Indicador: 'Quantidade Atrasadas', Valor: Number(summary.overdueCount || 0) },
      ];

      const monthlyRows = monthlySummary.map((item) => ({
        Mês: formatMonthLabel(item.month),
        'Total Recebido': Number(item.received || 0),
        'Total em Aberto': Number(item.open || 0),
        Quantidade: Number(item.count || 0),
      }));

      const workbook = XLSX.utils.book_new();

      const detailsSheet = XLSX.utils.json_to_sheet(reportRows);
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyRows);

      detailsSheet['!cols'] = [
        { wch: 22 },
        { wch: 20 },
        { wch: 10 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
      ];

      summarySheet['!cols'] = [{ wch: 26 }, { wch: 18 }];
      monthlySheet['!cols'] = [
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Resumo Mensal');
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Parcelas');

      XLSX.writeFile(workbook, `relatorio-credicontrol-${getPeriodLabel()}.xlsx`);
      toast.success('Relatório Excel exportado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      if (!filteredInstallments.length) {
        toast.error('Não há dados para exportar no período selecionado');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      const drawKpiCard = ({ x, y, w, h, title, value }) => {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, w, h, 4, 4, 'F');

        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, w, h, 4, 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(title, x + 4, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(String(value), x + 4, y + 15);
      };

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 30, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('CrediControl', 14, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text('Relatório Financeiro Premium', 14, 21);

      doc.setFillColor(59, 130, 246);
      doc.roundedRect(pageWidth - 62, 8, 48, 10, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('Período filtrado', pageWidth - 54, 14.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Visão geral do relatório', 14, 40);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Filtro aplicado: ${getPeriodDisplayLabel()}`, 14, 46);
      doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 51);

      const kpiY = 58;
      const cardGap = 4;
      const cardWidth = (pageWidth - 28 - cardGap) / 2;
      const cardHeight = 20;

      drawKpiCard({
        x: 14,
        y: kpiY,
        w: cardWidth,
        h: cardHeight,
        title: 'Total Recebido',
        value: formatCurrency(summary.totalReceived),
      });

      drawKpiCard({
        x: 14 + cardWidth + cardGap,
        y: kpiY,
        w: cardWidth,
        h: cardHeight,
        title: 'Total em Aberto',
        value: formatCurrency(summary.totalOpen),
      });

      drawKpiCard({
        x: 14,
        y: kpiY + cardHeight + 6,
        w: cardWidth,
        h: cardHeight,
        title: 'Quantidade de Parcelas',
        value: summary.totalCount,
      });

      drawKpiCard({
        x: 14 + cardWidth + cardGap,
        y: kpiY + cardHeight + 6,
        w: cardWidth,
        h: cardHeight,
        title: 'Parcelas Atrasadas',
        value: summary.overdueCount,
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Detalhamento das parcelas', 14, 111);

      autoTable(doc, {
        startY: 116,
        head: [['Cliente', 'Parcela', 'Status', 'Vencimento', 'Atualizado', 'Atraso']],
        body: filteredInstallments.map((item) => [
          item.customer_name || '-',
          `#${item.number}`,
          getStatusLabel(item.status),
          formatDate(item.due_date),
          formatCurrency(item.updated_amount || 0),
          item.days_overdue ? `${item.days_overdue} dias` : '-',
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [31, 41, 55],
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          overflow: 'linebreak',
        },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 34, halign: 'right' },
          5: { cellWidth: 24, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      doc.addPage();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Resumo Mensal', 14, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Consolidado financeiro do período selecionado', 14, 34);

      autoTable(doc, {
        startY: 40,
        head: [['Mês', 'Total Recebido', 'Total em Aberto', 'Quantidade']],
        body: monthlySummary.map((item) => [
          formatMonthLabel(item.month),
          formatCurrency(item.received),
          formatCurrency(item.open),
          String(item.count),
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [31, 41, 55],
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 28, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setDrawColor(226, 232, 240);
        doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('CrediControl • Relatório Financeiro', 14, pageHeight - 7);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 34, pageHeight - 7);
      }

      doc.save(`relatorio-credicontrol-${getPeriodLabel()}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const getFilterButtonClass = (value) => {
    const isActive = period === value;

    return isActive
      ? 'border-transparent bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-900/30 hover:opacity-95'
      : 'border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white';
  };

  const rightAction = (
    <Button
      onClick={handleExportPDF}
      disabled={!filteredInstallments.length}
      className="h-11 rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 px-4 text-white shadow-[0_10px_30px_rgba(56,189,248,0.28)] transition-transform transition-colors duration-200 hover:-translate-y-[1px] hover:from-sky-300 hover:via-blue-400 hover:to-blue-500 hover:shadow-[0_14px_36px_rgba(96,165,250,0.34)]"
    >
      <FileText className="mr-2 h-4 w-4" />
      Baixar PDF
    </Button>
  );

  if (loading) {
    return (
      <AppShell
        title="Visualize o desempenho financeiro e acompanhe sua operação por período."
        rightAction={rightAction}
        headerVariant="premium"
        headerIcon={BarChart3}
        headerBadge="Análise por período"
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Visualize o desempenho financeiro e acompanhe sua operação por período."
      rightAction={rightAction}
      headerVariant="premium"
      headerIcon={BarChart3}
      headerBadge="Análise por período"
    >
      <div data-testid="reports-page" className="space-y-8 lg:space-y-10">
        
        <section className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                onClick={() => setPeriod('all')}
                className={`rounded-2xl px-4 py-2 transition-colors ${getFilterButtonClass('all')}`}
              >
                Todos
              </Button>

              <Button
                onClick={() => setPeriod('7days')}
                className={`rounded-2xl px-4 py-2 transition-colors ${getFilterButtonClass('7days')}`}
              >
                7 dias
              </Button>

              <Button
                onClick={() => setPeriod('30days')}
                className={`rounded-2xl px-4 py-2 transition-colors ${getFilterButtonClass('30days')}`}
              >
                30 dias
              </Button>

              <Button
                onClick={() => setPeriod('60days')}
                className={`rounded-2xl px-4 py-2 transition-colors ${getFilterButtonClass('60days')}`}
              >
                60 dias
              </Button>

              <Button
                onClick={() => setPeriod('90days')}
                className={`rounded-2xl px-4 py-2 transition-colors ${getFilterButtonClass('90days')}`}
              >
                90 dias
              </Button>

              <Button
                onClick={() => setPeriod('month')}
                className={`rounded-2xl px-4 py-2 transition-colors ${getFilterButtonClass('month')}`}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Por mês
              </Button>

              {period === 'month' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-11 rounded-2xl border border-neutral-700 bg-neutral-900 px-4 text-neutral-200 outline-none transition-colors focus:border-blue-500"
                />
              )}
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5">
              <p className="text-sm text-neutral-400">
                Filtro atual:{' '}
                <span className="font-medium text-neutral-200">{getPeriodDisplayLabel()}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-3xl border-neutral-800 bg-neutral-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Total Recebido
                    </p>
                    <p className="mt-2 break-words text-2xl font-bold text-emerald-400">
                      {formatCurrency(summary.totalReceived)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <Wallet className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-neutral-800 bg-neutral-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Total em Aberto
                    </p>
                    <p className="mt-2 break-words text-2xl font-bold text-amber-400">
                      {formatCurrency(summary.totalOpen)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                    <DollarSign className="h-5 w-5 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-neutral-800 bg-neutral-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Quantidade
                    </p>
                    <p className="mt-2 text-2xl font-bold text-neutral-50">
                      {summary.totalCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-neutral-800 bg-neutral-900">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Em Atraso
                    </p>
                    <p className="mt-2 text-2xl font-bold text-rose-400">
                      {summary.overdueCount}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-neutral-50">Detalhamento das parcelas</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Visualização consolidada das parcelas filtradas
            </p>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Parcela
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Vencimento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Atualizado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Atraso
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInstallments.map((item, index) => (
                  <tr
                    key={`${item.loan_id}-${item.number}-${index}`}
                    className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/30"
                  >
                    <td className="px-6 py-4 text-neutral-50">{item.customer_name || '-'}</td>
                    <td className="px-6 py-4 text-neutral-300">#{item.number}</td>
                    <td className="px-6 py-4 text-neutral-300">{getStatusLabel(item.status)}</td>
                    <td className="px-6 py-4 text-neutral-300">{formatDate(item.due_date)}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                      {formatCurrency(item.updated_amount || 0)}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {item.days_overdue ? `${item.days_overdue} dias` : '-'}
                    </td>
                  </tr>
                ))}

                {filteredInstallments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                      Nenhum dado encontrado para o período selecionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {filteredInstallments.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-center text-neutral-500">
                Nenhum dado encontrado para o período selecionado
              </div>
            ) : (
              filteredInstallments.map((item, index) => (
                <div
                  key={`${item.loan_id}-${item.number}-${index}`}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-neutral-50">
                        {item.customer_name || '-'}
                      </p>
                      <p className="text-sm text-neutral-500">Parcela #{item.number}</p>
                    </div>
                    <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-300">
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-neutral-500">Vencimento</p>
                      <p className="mt-1 text-neutral-200">{formatDate(item.due_date)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Atualizado</p>
                      <p className="mt-1 font-mono font-semibold text-emerald-400">
                        {formatCurrency(item.updated_amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Atraso</p>
                      <p className="mt-1 text-neutral-200">
                        {item.days_overdue ? `${item.days_overdue} dias` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Pagamento</p>
                      <p className="mt-1 text-neutral-200">{formatDate(item.paid_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold text-neutral-50">Resumo mensal</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Consolidado financeiro do período selecionado
            </p>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Mês
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total Recebido
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total em Aberto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map((item) => (
                  <tr
                    key={item.month}
                    className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/30"
                  >
                    <td className="px-6 py-4 font-medium capitalize text-neutral-50">
                      {formatMonthLabel(item.month)}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                      {formatCurrency(item.received)}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-amber-400">
                      {formatCurrency(item.open)}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">{item.count}</td>
                  </tr>
                ))}

                {monthlySummary.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-neutral-500">
                      Nenhum dado encontrado para o período selecionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {monthlySummary.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-center text-neutral-500">
                Nenhum dado encontrado para o período selecionado
              </div>
            ) : (
              monthlySummary.map((item) => (
                <div
                  key={item.month}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <div className="mb-3">
                    <p className="font-semibold capitalize text-neutral-50">
                      {formatMonthLabel(item.month)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-neutral-500">Recebido</p>
                      <p className="mt-1 font-mono font-semibold text-emerald-400">
                        {formatCurrency(item.received)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Em aberto</p>
                      <p className="mt-1 font-mono font-semibold text-amber-400">
                        {formatCurrency(item.open)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">Quantidade</p>
                      <p className="mt-1 text-neutral-200">{item.count}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Reports;