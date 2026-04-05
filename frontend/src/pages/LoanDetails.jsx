import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useParams, useNavigate } from 'react-router-dom';
import { API, formatApiErrorDetail } from '../App';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [loanRes, installmentsRes] = await Promise.all([
        axios.get(`${API}/loans/${id}`),
        axios.get(`${API}/installments/loan/${id}`),
      ]);

      setLoan(loanRes.data);
      setInstallments(installmentsRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados do empréstimo');
      navigate('/loans');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (installmentId) => {
    setPayingId(installmentId);

    try {
      await axios.post(`${API}/installments/${installmentId}/pay`);
      toast.success('Pagamento registrado com sucesso!');
      fetchData();
    } catch (error) {
      toast.error(
        formatApiErrorDetail(error.response?.data?.detail) ||
          'Erro ao registrar pagamento'
      );
    } finally {
      setPayingId(null);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: {
        label: 'Pago',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },
      pending: {
        label: 'Pendente',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      },
      overdue: {
        label: 'Atrasado',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return <Badge className={`${config.className} border font-medium`}>{config.label}</Badge>;
  };

  const getStatusIcon = (status) => {
    const icons = {
      paid: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      pending: <Clock className="h-5 w-5 text-amber-500" />,
      overdue: <AlertTriangle className="h-5 w-5 text-rose-500" />,
    };

    return icons[status] || icons.pending;
  };

  const handleGenerateContract = () => {
    if (!loan) {
      toast.error('Dados do empréstimo não encontrados');
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const customerName = loan.customer_name || 'Cliente';
      const contractDate = loan.start_date ? formatDate(loan.start_date) : formatDate(new Date());
      const principalAmount = Number(loan.amount || 0);
      const totalAmount = Number(loan.total_amount || 0);
      const interestRate = Number(loan.interest_rate || 0);
      const numberOfInstallments = Number(loan.number_of_installments || installments.length || 1);
      const totalInterest = totalAmount - principalAmount;

      const installmentValue =
        installments.length > 0
          ? Number(installments[0]?.amount || installments[0]?.updated_amount || 0)
          : totalAmount / numberOfInstallments;

      const addParagraph = (text, x, y, maxWidth, lineHeight = 6) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * lineHeight;
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
      doc.text('Contrato Simplificado de Empréstimo Particular', 14, 21);

      doc.setFillColor(79, 70, 229);
      doc.roundedRect(pageWidth - 58, 8, 44, 10, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('Contrato PDF', pageWidth - 49, 14.5);

      let y = 42;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Resumo da contratação', 14, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Cliente: ${customerName}`, 14, y);
      y += 5;
      doc.text(`Data da contratação: ${contractDate}`, 14, y);

      y += 10;

      const cardX = 14;
      const cardY = y;
      const cardW = pageWidth - 28;
      const cardH = 42;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Valor contratado', cardX + 5, cardY + 8);
      doc.text('Juros aplicado', cardX + 55, cardY + 8);
      doc.text('Parcelas', cardX + 95, cardY + 8);
      doc.text('Valor por parcela', cardX + 125, cardY + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(principalAmount), cardX + 5, cardY + 17);
      doc.text(`${interestRate}%`, cardX + 55, cardY + 17);
      doc.text(String(numberOfInstallments), cardX + 95, cardY + 17);
      doc.text(formatCurrency(installmentValue), cardX + 125, cardY + 17);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Juros total', cardX + 5, cardY + 31);
      doc.text('Valor final', cardX + 55, cardY + 31);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(totalInterest), cardX + 5, cardY + 39);
      doc.setTextColor(5, 150, 105);
      doc.text(formatCurrency(totalAmount), cardX + 55, cardY + 39);

      y += 56;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      y = addParagraph(
        'O presente contrato tem por objeto a concessão de empréstimo financeiro ao CONTRATADO, no valor e nas condições descritas neste documento, para fins de registro, ciência e compromisso de pagamento.',
        14,
        y,
        180
      );

      y += 6;

      y = addParagraph(
        `O presente documento registra que ${customerName} contratou junto ao CrediControl, em ${contractDate}, um empréstimo no valor de ${formatCurrency(
          principalAmount
        )}, com aplicação de juros de ${interestRate}%, totalizando ${formatCurrency(
          totalAmount
        )}, a ser pago em ${numberOfInstallments} parcelas de ${formatCurrency(
          installmentValue
        )}.`,
        14,
        y,
        180
      );

      y += 6;

      y = addParagraph(
        'O cliente declara estar ciente e de acordo com as condições aqui registradas.',
        14,
        y,
        180
      );

      y += 6;

      y = addParagraph(
        'Em caso de atraso no pagamento de qualquer parcela, o cliente deverá ser contatado para ciência do atraso e para esclarecimento de eventuais dúvidas relacionadas ao pagamento pendente.',
        14,
        y,
        180
      );

      y += 6;

      y = addParagraph(
        'Este contrato tem caráter de registro formal da operação realizada entre as partes, servindo como comprovante das condições acordadas no momento da contratação.',
        14,
        y,
        180
      );

      y += 18;

      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, pageWidth - 14, y);
      y += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`CREDICONTROL - ${contractDate}`, 14, y);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('CrediControl • Contrato de Empréstimo', 14, pageHeight - 7);
      doc.text('Página 1 de 1', pageWidth - 32, pageHeight - 7);

      const safeCustomerName = customerName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();

      doc.save(`contrato-${safeCustomerName || 'cliente'}.pdf`);
      toast.success('Contrato gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar contrato');
    }
  };

  const paidCount = installments.filter((i) => i.status === 'paid').length;
  const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;
  const totalPaid = installments
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.updated_amount, 0);
  const totalPending = installments
    .filter((i) => i.status !== 'paid')
    .reduce((acc, i) => acc + i.updated_amount, 0);

  const rightAction = (
    <div className="hidden sm:flex items-center gap-2">
      <Button
        onClick={handleGenerateContract}
        className="h-11 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:opacity-95"
        data-testid="generate-contract-button"
      >
        <FileText className="mr-2 h-4 w-4" />
        Emitir Contrato
      </Button>

      <Button
        variant="ghost"
        onClick={() => navigate('/loans')}
        className="h-11 rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white"
        data-testid="back-to-loans"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
    </div>
  );

  if (loading) {
    return (
      <AppShell
        title="Detalhes do Empréstimo"
        subtitle="Acompanhe o resumo financeiro e as parcelas"
        rightAction={rightAction}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Empréstimo - ${loan?.customer_name || ''}`}
      subtitle="Detalhes e parcelas do empréstimo"
      rightAction={rightAction}
    >
      <div data-testid="loan-details-page">
        <div className="mb-4 flex flex-col gap-3 sm:hidden">
          <Button
            onClick={handleGenerateContract}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white hover:opacity-95"
            data-testid="generate-contract-button-mobile"
          >
            <FileText className="mr-2 h-4 w-4" />
            Emitir Contrato
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate('/loans')}
            className="rounded-2xl text-neutral-400 hover:bg-neutral-900 hover:text-neutral-50"
            data-testid="back-to-loans-mobile"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Empréstimos
          </Button>
        </div>

        <div className="mb-6 hidden lg:block">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-50">
            Empréstimo - {loan?.customer_name}
          </h1>
          <p className="mt-1 text-neutral-400">Detalhes e parcelas do empréstimo</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 xl:col-span-2">
            <h2 className="mb-6 font-heading text-xl font-semibold text-neutral-50">
              Resumo do Empréstimo
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-neutral-500">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Valor Principal</span>
                </div>
                <p className="text-xl font-semibold text-neutral-50">
                  {formatCurrency(loan?.amount)}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2 text-neutral-500">
                  <Percent className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Juros Mensal</span>
                </div>
                <p className="text-xl font-semibold text-neutral-50">{loan?.interest_rate}%</p>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2 text-neutral-500">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Valor Total</span>
                </div>
                <p className="text-xl font-semibold text-emerald-500">
                  {formatCurrency(loan?.total_amount)}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2 text-neutral-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Data Início</span>
                </div>
                <p className="text-xl font-semibold text-neutral-50">
                  {loan?.start_date && formatDate(loan.start_date)}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-neutral-800 pt-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm text-neutral-400">Progresso de Pagamento</span>
                <span className="text-sm text-neutral-50">
                  {paidCount}/{installments.length} parcelas
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            <h3 className="mb-4 font-heading text-lg font-semibold text-neutral-50">
              Situação Financeira
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-400">Total Recebido</span>
                <span className="font-semibold text-emerald-500">
                  {formatCurrency(totalPaid)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-400">Total Pendente</span>
                <span className="font-semibold text-amber-500">
                  {formatCurrency(totalPending)}
                </span>
              </div>

              <div className="border-t border-neutral-800 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-neutral-50">Lucro</span>
                  <span className="font-semibold text-blue-500">
                    {formatCurrency((loan?.total_amount || 0) - (loan?.amount || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-5 py-4 sm:px-6">
            <h2 className="font-heading text-xl font-semibold text-neutral-50">Parcelas</h2>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Nº
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Valor Original
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Valor Atualizado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Vencimento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Atraso
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {installments.map((installment) => (
                  <tr
                    key={installment.id}
                    className="border-b border-neutral-800/50 transition-colors hover:bg-neutral-800/30"
                    data-testid={`installment-row-${installment.number}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(installment.status)}
                        <span className="font-medium text-neutral-50">
                          Parcela {installment.number}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-neutral-400">
                      {formatCurrency(installment.amount)}
                    </td>

                    <td className="px-6 py-4 font-semibold">
                      <span
                        className={
                          installment.status === 'overdue'
                            ? 'text-rose-500'
                            : 'text-neutral-50'
                        }
                      >
                        {formatCurrency(installment.updated_amount)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-neutral-300">
                      {formatDate(installment.due_date)}
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(installment.status)}</td>

                    <td className="px-6 py-4 text-neutral-400">
                      {installment.days_overdue > 0 ? (
                        <span className="font-medium text-rose-500">
                          {installment.days_overdue} dias
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {installment.status !== 'paid' ? (
                        <Button
                          size="sm"
                          onClick={() => handlePayInstallment(installment.id)}
                          disabled={payingId === installment.id}
                          className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                          data-testid={`pay-installment-${installment.number}`}
                        >
                          {payingId === installment.id
                            ? 'Registrando...'
                            : 'Registrar Pagamento'}
                        </Button>
                      ) : (
                        <span className="text-sm text-emerald-500">
                          Pago em {installment.paid_at && formatDate(installment.paid_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {installments.map((installment) => (
              <div
                key={installment.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                data-testid={`installment-row-${installment.number}`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(installment.status)}
                      <p className="font-semibold text-neutral-50">
                        Parcela {installment.number}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      Vencimento: {formatDate(installment.due_date)}
                    </p>
                  </div>

                  {getStatusBadge(installment.status)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">
                      Original
                    </p>
                    <p className="mt-1 text-neutral-300">
                      {formatCurrency(installment.amount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">
                      Atualizado
                    </p>
                    <p
                      className={`mt-1 font-semibold ${
                        installment.status === 'overdue'
                          ? 'text-rose-500'
                          : 'text-neutral-50'
                      }`}
                    >
                      {formatCurrency(installment.updated_amount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">
                      Atraso
                    </p>
                    <p className="mt-1 text-neutral-300">
                      {installment.days_overdue > 0
                        ? `${installment.days_overdue} dias`
                        : '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-500">
                      Situação
                    </p>
                    <p className="mt-1 text-neutral-300">
                      {installment.status === 'paid' && installment.paid_at
                        ? `Pago em ${formatDate(installment.paid_at)}`
                        : 'Em aberto'}
                    </p>
                  </div>
                </div>

                {installment.status !== 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => handlePayInstallment(installment.id)}
                    disabled={payingId === installment.id}
                    className="mt-4 w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                    data-testid={`pay-installment-${installment.number}`}
                  >
                    {payingId === installment.id ? 'Registrando...' : 'Registrar Pagamento'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default LoanDetails;