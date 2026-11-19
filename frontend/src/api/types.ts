
export interface User {
  id_usuario: string;
  nome: string;
  email: string;
  telefone: string | null;
  data_nascimento: string | null;
  tipo_usuario: 'CLIENTE' | 'GUIA' | 'GESTOR_HOSPEDAGEM' | 'OPERADOR_SAC' | 'ADMIN';
  status: string;
}

export interface Registration {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  telefone?: string | null;
  data_nascimento?: string | null;
}

export interface GuideRegistration extends Registration {
  descricao?: string;
  especialidade?: string;
  area_atuacao?: string;
  servicos_oferecidos?: string;
}

export interface GuideRegistrationResult {
  user: User;
  status_aprovacao: 'PENDENTE';
  message: string;
}

export type ProfilePatch = Pick<User, 'nome' | 'telefone' | 'data_nascimento'>;

export interface HotelRecord {
  id_hotel: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  classificacao: number | null;
  comodidades: string[] | string | null;
  checkin_inicio: string | null;
  checkout_fim: string | null;
  status: string;
}

export interface RoomRecord {
  id_tipo_quarto: string;
  id_hotel: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  capacidade: number;
  quantidade_camas: number | null;
  tamanho_m2: number | string | null;
  valor_diaria: string | number;
  quantidade_disponivel: number;
  status: string;
}

export interface GuideRecord {
  id_guia: string;
  nome: string;
  descricao: string | null;
  especialidade: string | null;
  area_atuacao: string | null;
  servicos_oferecidos: string | null;
  valor_diaria: string | number | null;
  status: string;
  status_aprovacao: string;
}

export interface ReservationRecord {
  id_reserva: string;
  codigo_confirmacao: string;
  status_codigo: string;
  checkin: string;
  checkout: string;
  quantidade_hospedes: number;
  valor_total: number | string;
  taxas: number | string;
  observacoes: string | null;
}

export type ReservationDraft = Pick<
  ReservationRecord,
  'checkin' | 'checkout' | 'quantidade_hospedes' | 'observacoes'
>;
