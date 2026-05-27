export type FlowStepStatus = 'idle' | 'active' | 'done' | 'error';

export interface FlowStep {
  id: string;
  label: string;
  detail: string;
  status: FlowStepStatus;
}

export interface CepResponse {
  valido?: boolean;
  erro?: string;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  cep_informado?: string;
}

export interface ConsultaResult {
  status: number;
  durationMs: number;
  requestUrl: string;
  body: CepResponse | null;
  rawBody: string;
}
