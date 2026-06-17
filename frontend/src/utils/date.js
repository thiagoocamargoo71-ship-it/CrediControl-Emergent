export const parseLocalDate = (dateString) => {
  if (!dateString) return null;

  const [year, month, day] = dateString.split('-');

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
};

export const formatDateBR = (dateString) => {
  if (!dateString) return '-';

  const [year, month, day] = dateString.split('-');

  return `${day}/${month}/${year}`;
};