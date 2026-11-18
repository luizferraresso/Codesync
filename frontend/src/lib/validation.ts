export function isValidCpf(value: string): boolean {
  const raw = value.trim();
  const cpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(raw) ? raw.replace(/[.-]/g, '') : raw;
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const size of [9, 10]) {
    const sum = [...cpf.slice(0, size)].reduce((total, digit, i) => total + Number(digit) * (size + 1 - i), 0);
    const remainder = sum % 11;
    if (Number(cpf[size]) !== (remainder < 2 ? 0 : 11 - remainder)) return false;
  }
  return true;
}
export function passwordError(value: string): string | null {
  if (value.length < 10) return 'A senha precisa ter pelo menos 10 caracteres.';
  if (new TextEncoder().encode(value).length > 72) return 'A senha ultrapassa o limite de 72 bytes. Reduza seu tamanho.';
  return null;
}
export function draftError(checkin: string, checkout: string, guests: number, today = new Date().toISOString().slice(0, 10)): string | null {
  const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date + 'T00:00:00Z')) && new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date;
  if (!validDate(checkin) || !validDate(checkout)) return 'Informe datas válidas para entrada e saída.';
  if (checkin <= today) return 'O check-in precisa ser a partir de amanhã (referência UTC).';
  if (checkout <= checkin) return 'A saída precisa ser posterior à entrada.';
  if (!Number.isInteger(guests) || guests < 1 || guests > 100) return 'Informe entre 1 e 100 hóspedes.';
  return null;
}
