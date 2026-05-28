# Validador CEP AWS

Solução completa para **validação e consulta de CEP** usando arquitetura serverless na AWS, com backend em Java (Spring Boot), frontend em Angular e infraestrutura provisionada com Terraform.

## Visão geral

O usuário informa um CEP na interface web. O fluxo percorre:

1. **Angular** (`localhost:4200`) — interface e simulador do fluxo
2. **Spring Boot** (`localhost:8080`) — proxy e validação local
3. **API Gateway HTTP** — entrada na AWS
4. **Lambda** (Python) — regras de negócio e integração
5. **ViaCEP** — consulta do endereço

```
[Angular] → [Spring Boot] → [API Gateway] → [Lambda] → [ViaCEP]
```

## Estrutura do repositório

```
Validador-cep-aws/
├── cep/                          # Backend Spring Boot (proxy para API AWS)
├── frontend/meu-app/             # Frontend Angular
├── validador-cep-terraform/      # Infraestrutura AWS (Terraform)
└── README.md
```

| Pasta | Descrição |
|-------|-----------|
| `validador-cep-terraform/` | Lambda, API Gateway, IAM, CloudWatch Logs |
| `cep/` | API REST `GET /cep/{cep}` + Swagger |
| `frontend/meu-app/` | Tela de consulta com visualização do fluxo |

## Pré-requisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5 (**windows_amd64** no Windows)
- [AWS CLI](https://aws.amazon.com/cli/) configurado (`aws configure`)
- Conta AWS com permissões para Lambda, API Gateway, IAM e CloudWatch
- **Java 17** e Maven (ou use `.\mvnw` na pasta `cep`)
- **Node.js** 20+ e npm (frontend)

## 1. Infraestrutura (Terraform)

```powershell
cd validador-cep-terraform
terraform init
terraform plan
terraform apply
```

Confirme com `yes`. Ao final, anote os outputs:

```powershell
terraform output api_endpoint
terraform output validar_cep_url
```

Recursos criados (região padrão: **sa-east-1**):

- Lambda `validador-cep-dev` (Python 3.12)
- API Gateway HTTP — rota `GET /cep/{cep}`
- IAM Role e CloudWatch Log Group

### Destruir infraestrutura

```powershell
terraform destroy
```

## 2. Configurar URL da API no backend

Em `cep/src/main/resources/application.properties`:

```properties
aws.cep.api-base-url=https://SEU-ID.execute-api.sa-east-1.amazonaws.com
```

Use a URL do `terraform output api_endpoint` **sem barra no final** (ou com barra — o código normaliza).

## 3. Backend (Spring Boot)

```powershell
cd cep
.\mvnw spring-boot:run
```

Aguarde: `Tomcat started on port 8080`.

### Teste direto

```powershell
Invoke-RestMethod "http://localhost:8080/cep/01310100"
```

### Swagger

Com o Spring rodando: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Porta 8080 ocupada

```powershell
netstat -ano | findstr :8080
taskkill /PID NUMERO_DO_PID /F
```

## 4. Frontend (Angular)

Em **outro terminal**:

```powershell
cd frontend/meu-app
npm install
npm start
```

Acesse: [http://localhost:4200](http://localhost:4200)

O front chama `http://localhost:8080/cep/{cep}` (CORS habilitado no Spring).

## Respostas da API

| HTTP | Situação |
|------|----------|
| 200 | CEP válido e encontrado |
| 400 | CEP com formato inválido (menos de 8 dígitos) |
| 404 | CEP não encontrado no ViaCEP |
| 502/503 | Falha ou indisponibilidade do ViaCEP |

Exemplo de sucesso:

```json
{
  "valido": true,
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP",
  "ibge": "3550308"
}
```

## Ordem recomendada para subir tudo

| Ordem | Terminal | Comando |
|-------|----------|---------|
| 1 | Terraform | `terraform apply` em `validador-cep-terraform/` |
| 2 | Spring | `.\mvnw spring-boot:run` em `cep/` |
| 3 | Angular | `npm start` em `frontend/meu-app/` |

## Logs na AWS

```powershell
aws logs tail /aws/lambda/validador-cep-dev --follow --region sa-east-1
```

## Variáveis Terraform (opcional)

Copie o exemplo e ajuste se necessário:

```powershell
copy validador-cep-terraform\terraform.tfvars.example validador-cep-terraform\terraform.tfvars
```

Principais variáveis em `variables.tf`: `aws_region`, `project_name`, `environment`.

## Políticas IAM

Exemplos de policies para o usuário IAM estão em:

- `validador-cep-terraform/iam-policy-terraform-validador-cep.json`
- `validador-cep-terraform/iam-policy-terraform-validador-cep-completa.json`

## Tecnologias

- **IaC:** Terraform, AWS Provider
- **Cloud:** Lambda, API Gateway v2, IAM, CloudWatch Logs
- **Backend:** Spring Boot 4, Java 17, springdoc-openapi
- **Frontend:** Angular 21
- **Integração externa:** ViaCEP

## Licença

Projeto educacional / portfólio. Ajuste a licença conforme necessário.
