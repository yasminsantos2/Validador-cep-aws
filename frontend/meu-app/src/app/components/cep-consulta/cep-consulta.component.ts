import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import {
  CepResponse,
  ConsultaResult,
  FlowStep,
  FlowStepStatus,
} from '../../models/cep.models';
import { CepService } from '../../services/cep.service';

@Component({
  selector: 'app-cep-consulta',
  imports: [FormsModule, JsonPipe],
  templateUrl: './cep-consulta.component.html',
  styleUrl: './cep-consulta.component.css',
})
export class CepConsultaComponent {
  private readonly cepService = inject(CepService);

  protected readonly awsApiUrl = environment.awsApiUrl;
  protected readonly springUrl = 'http://localhost:8080';

  protected cepInput = '';
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);
  protected result = signal<ConsultaResult | null>(null);
  protected steps = signal<FlowStep[]>(this.initialSteps());

  protected consultar(): void {
    const cep = this.cepInput.replace(/\D/g, '');

    if (cep.length !== 8) {
      this.errorMessage.set('Informe um CEP com 8 dígitos.');
      this.result.set(null);
      this.steps.set(this.stepsWithError('frontend'));
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);
    this.steps.set(this.stepsActiveUntil('frontend'));

    const started = performance.now();
    const requestUrl = `${this.springUrl}/cep/${cep}`;

    this.cepService.consultar(cep).subscribe({
      next: (response) => {
        const durationMs = Math.round(performance.now() - started);
        const rawBody = response.body ?? '';
        let body: CepResponse | null = null;

        try {
          body = rawBody ? (JSON.parse(rawBody) as CepResponse) : null;
        } catch {
          body = null;
        }

        const status = response.status;
        this.result.set({ status, durationMs, requestUrl, body, rawBody });
        this.steps.set(this.stepsFromStatus(status, body));

        if (status >= 400) {
          this.errorMessage.set(this.messageForStatus(status, body));
        }

        this.loading.set(false);
      },
      error: () => {
        const durationMs = Math.round(performance.now() - started);
        this.result.set({
          status: 0,
          durationMs,
          requestUrl,
          body: null,
          rawBody: '',
        });
        this.steps.set(this.stepsFromStatus(0, null));
        this.errorMessage.set(
          'Não foi possível contactar o backend. Verifique se o Spring está rodando em http://localhost:8080.',
        );
        this.loading.set(false);
      },
    });
  }

  private messageForStatus(status: number, body: CepResponse | null): string {
    if (body?.erro) {
      return body.erro;
    }
    if (status === 404) {
      return 'CEP não encontrado ou rota indisponível (404).';
    }
    if (status === 400) {
      return 'CEP inválido. Informe 8 dígitos.';
    }
    if (status === 502 || status === 503) {
      return 'Falha ao contactar a API na AWS. Verifique o Terraform apply.';
    }
    if (status === 0) {
      return 'Backend offline. Inicie o Spring Boot na porta 8080.';
    }
    return `Requisição retornou status ${status}.`;
  }

  protected formatCep(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) {
      return digits;
    }
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  protected onCepInput(value: string): void {
    this.cepInput = this.formatCep(value);
  }

  private initialSteps(): FlowStep[] {
    return [
      {
        id: 'frontend',
        label: '1. Angular',
        detail: 'Envia GET para o Spring Boot',
        status: 'idle',
      },
      {
        id: 'spring',
        label: '2. Spring Boot',
        detail: 'Valida CEP e chama API Gateway',
        status: 'idle',
      },
      {
        id: 'apigw',
        label: '3. API Gateway',
        detail: 'Roteia para a Lambda',
        status: 'idle',
      },
      {
        id: 'lambda',
        label: '4. Lambda',
        detail: 'Processa requisição na AWS',
        status: 'idle',
      },
      {
        id: 'viacep',
        label: '5. ViaCEP',
        detail: 'Consulta endereço pelo CEP',
        status: 'idle',
      },
    ];
  }

  private stepsActiveUntil(activeId: string): FlowStep[] {
    const order = ['frontend', 'spring', 'apigw', 'lambda', 'viacep'];
    const activeIndex = order.indexOf(activeId);

    return this.initialSteps().map((step, index) => ({
      ...step,
      status: (index < activeIndex
        ? 'done'
        : index === activeIndex
          ? 'active'
          : 'idle') as FlowStepStatus,
    }));
  }

  private stepsWithError(errorStepId: string): FlowStep[] {
    const order = ['frontend', 'spring', 'apigw', 'lambda', 'viacep'];
    const errorIndex = order.indexOf(errorStepId);

    return this.initialSteps().map((step, index) => {
      if (index < errorIndex) {
        return { ...step, status: 'done' as FlowStepStatus };
      }
      if (index === errorIndex) {
        return { ...step, status: 'error' as FlowStepStatus };
      }
      return { ...step, status: 'idle' as FlowStepStatus };
    });
  }

  private stepsFromStatus(status: number, body: CepResponse | null): FlowStep[] {
    if (status === 0) {
      return this.stepsWithError('spring');
    }
    if (status === 400) {
      const msg = body?.erro ?? '';
      if (msg.includes('8 digitos') || msg.includes('8 dígitos')) {
        return this.stepsWithError('spring');
      }
      return this.stepsWithError('lambda');
    }
    if (status === 404) {
      return this.stepsWithError('viacep');
    }
    if (status === 502 || status === 503) {
      return this.stepsWithError('apigw');
    }
    if (status >= 200 && status < 300 && body?.valido) {
      return this.initialSteps().map((step) => ({
        ...step,
        status: 'done' as FlowStepStatus,
      }));
    }
    if (status >= 500) {
      return this.stepsWithError('lambda');
    }
    return this.stepsWithError('spring');
  }
}
