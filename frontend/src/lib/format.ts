export const money = (value: string | number) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const shortDate = (value: string) => {
  const date = value.slice(0, 10).split('-');
  return date.length === 3 ? `${date[2]}/${date[1]}/${date[0]}` : value;
};
export function amenitiesOf(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value.filter(x => typeof x === 'string');
  if (typeof value !== 'string') return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []; }
  catch { return []; }
}
