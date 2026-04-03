import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API, formatApiErrorDetail } from '../App';
import Sidebar from '../components/Sidebar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  CalendarDays,
  Wallet,
  BarChart3
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
        withCredentials: true
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

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
      year: 'numeric'
    }).format(date);
  };

  const getStatusLabel = (status) => {
    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      overdue: 'Atrasado'
    };

    return labels[status] || status;
  };

  const getPeriodLabel = () => {
    if (period === 'all') return 'todos';
    if (period === '7days') return '7-dias';
    if (period === '30days') return '30-dias';
    if (period === 'month') return selectedMonth || 'mes';
    return 'relatorio';
  };

  const getPeriodDisplayLabel = () => {
    if (period === 'all') return 'Todos os registros';
    if (period === '7days') return 'Próximos 7 dias';
    if (period === '30days') return 'Próximos 30 dias';
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
      overdueCount
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
          count: 0
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
        'Total Empréstimo': Number(item.loan_total || 0)
      }));

      const summaryRows = [
        { Indicador: 'Total Recebido', Valor: Number(summary.totalReceived || 0) },
        { Indicador: 'Total em Aberto', Valor: Number(summary.totalOpen || 0) },
        { Indicador: 'Quantidade de Parcelas', Valor: Number(summary.totalCount || 0) },
        { Indicador: 'Quantidade Atrasadas', Valor: Number(summary.overdueCount || 0) }
      ];

      const monthlyRows = monthlySummary.map((item) => ({
        Mês: formatMonthLabel(item.month),
        'Total Recebido': Number(item.received || 0),
        'Total em Aberto': Number(item.open || 0),
        Quantidade: Number(item.count || 0)
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
        { wch: 18 }
      ];

      summarySheet['!cols'] = [
        { wch: 26 },
        { wch: 18 }
      ];

      monthlySheet['!cols'] = [
        { wch: 22 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 }
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Resumo Mensal');
      XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Parcelas');

      const fileName = `relatorio-credicontrol-${getPeriodLabel()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

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
        value: formatCurrency(summary.totalReceived)
      });

      drawKpiCard({
        x: 14 + cardWidth + cardGap,
        y: kpiY,
        w: cardWidth,
        h: cardHeight,
        title: 'Total em Aberto',
        value: formatCurrency(summary.totalOpen)
      });

      drawKpiCard({
        x: 14,
        y: kpiY + cardHeight + 6,
        w: cardWidth,
        h: cardHeight,
        title: 'Quantidade de Parcelas',
        value: summary.totalCount
      });

      drawKpiCard({
        x: 14 + cardWidth + cardGap,
        y: kpiY + cardHeight + 6,
        w: cardWidth,
        h: cardHeight,
        title: 'Parcelas Atrasadas',
        value: summary.overdueCount
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Detalhamento das parcelas', 14, 111);

      autoTable(doc, {
        startY: 116,
        head: [[
          'Cliente',
          'Parcela',
          'Status',
          'Vencimento',
          'Atualizado',
          'Atraso'
        ]],
        body: filteredInstallments.map((item) => [
          item.customer_name || '-',
          `#${item.number}`,
          getStatusLabel(item.status),
          formatDate(item.due_date),
          formatCurrency(item.updated_amount || 0),
          item.days_overdue ? `${item.days_overdue} dias` : '-'
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [31, 41, 55],
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 26, halign: 'center' },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 34, halign: 'right' },
          5: { cellWidth: 24, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
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
        head: [[
          'Mês',
          'Total Recebido',
          'Total em Aberto',
          'Quantidade'
        ]],
        body: monthlySummary.map((item) => [
          formatMonthLabel(item.month),
          formatCurrency(item.received),
          formatCurrency(item.open),
          String(item.count)
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [31, 41, 55],
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        styles: {
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 28, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
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

      const fileName = `relatorio-credicontrol-${getPeriodLabel()}.pdf`;
      doc.save(fileName);

      toast.success('Relatório PDF exportado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const getFilterButtonClass = (value) => {
    const isActive = period === value;

    return isActive
      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-lg shadow-blue-900/30 hover:opacity-95'
      : 'bg-neutral-900 text-neutral-300 border border-neutral-700 hover:bg-neutral-800 hover:text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <Sidebar />

      <main className="ml-64 p-8" data-testid="reports-page">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs font-medium mb-4">
            <BarChart3 className="h-4 w-4" />
            Painel de Relatórios
          </div>

          <h1 className="font-heading text-3xl font-bold text-neutral-50 tracking-tight">
            Relatórios
          </h1>
          <p className="text-neutral-400 mt-1">
            Visualize o desempenho financeiro e acompanhe sua operação por período.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setPeriod('all')}
              className={`rounded-xl px-4 py-2 transition-all ${getFilterButtonClass('all')}`}
            >
              Todos
            </Button>

            <Button
              onClick={() => setPeriod('7days')}
              className={`rounded-xl px-4 py-2 transition-all ${getFilterButtonClass('7days')}`}
            >
              7 dias
            </Button>

            <Button
              onClick={() => setPeriod('30days')}
              className={`rounded-xl px-4 py-2 transition-all ${getFilterButtonClass('30days')}`}
            >
              30 dias
            </Button>

            <Button
              onClick={() => setPeriod('month')}
              className={`rounded-xl px-4 py-2 transition-all ${getFilterButtonClass('month')}`}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Por mês
            </Button>

            {period === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-100 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="rounded-xl border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 gap-2 shadow-lg shadow-emerald-950/20"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>

            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="rounded-xl border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 gap-2 shadow-lg shadow-rose-950/20"
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <Card className="bg-neutral-900 border-neutral-800 rounded-2xl shadow-xl shadow-black/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Recebido
                </span>
              </div>
              <p className="text-sm text-neutral-400 mb-1">Total recebido</p>
              <p className="text-2xl font-semibold text-emerald-400">
                {formatCurrency(summary.totalReceived)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 rounded-2xl shadow-xl shadow-black/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-amber-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Em aberto
                </span>
              </div>
              <p className="text-sm text-neutral-400 mb-1">Total pendente</p>
              <p className="text-2xl font-semibold text-amber-400">
                {formatCurrency(summary.totalOpen)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 rounded-2xl shadow-xl shadow-black/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Volume
                </span>
              </div>
              <p className="text-sm text-neutral-400 mb-1">Total de parcelas</p>
              <p className="text-2xl font-semibold text-neutral-50">
                {summary.totalCount}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800 rounded-2xl shadow-xl shadow-black/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-rose-400" />
                </div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                  Risco
                </span>
              </div>
              <p className="text-sm text-neutral-400 mb-1">Parcelas atrasadas</p>
              <p className="text-2xl font-semibold text-rose-400">
                {summary.overdueCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold text-neutral-50">
                Resumo Mensal
              </h2>
              <p className="text-sm text-neutral-400 mt-1">
                Consolidado financeiro com base no período filtrado.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Mês
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Total Recebido
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Total em Aberto
                  </th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map((item) => (
                  <tr
                    key={item.month}
                    className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-neutral-50 font-medium capitalize">
                      {formatMonthLabel(item.month)}
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-mono font-semibold">
                      {formatCurrency(item.received)}
                    </td>
                    <td className="px-6 py-4 text-amber-400 font-mono font-semibold">
                      {formatCurrency(item.open)}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {item.count}
                    </td>
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
        </div>
      </main>
    </div>
  );
};

export default Reports;