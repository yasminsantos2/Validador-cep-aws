variable "aws_region" {
  description = "Região AWS onde os recursos serão criados."
  type        = string
  default     = "sa-east-1"
}

variable "project_name" {
  description = "Nome base dos recursos (prefixo)."
  type        = string
  default     = "validador-cep"
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "lambda_timeout" {
  description = "Timeout da Lambda em segundos."
  type        = number
  default     = 10
}

variable "lambda_memory_size" {
  description = "Memória da Lambda em MB."
  type        = number
  default     = 128
}

variable "log_retention_days" {
  description = "Dias de retenção dos logs no CloudWatch."
  type        = number
  default     = 7
}
