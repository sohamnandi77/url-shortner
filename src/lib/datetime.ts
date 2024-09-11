export const parseDateTime = (str: string | Date) => {
  if (str instanceof Date) return str;
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
};
