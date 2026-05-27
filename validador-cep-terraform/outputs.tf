output "api_endpoint" {
  description = "URL base da API HTTP."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "validar_cep_url" {
  description = "Exemplo de chamada: substitua {cep} pelo CEP desejado."
  value       = "${aws_apigatewayv2_stage.default.invoke_url}/cep/{cep}"
}

output "lambda_function_name" {
  description = "Nome da função Lambda."
  value       = aws_lambda_function.validador_cep.function_name
}

output "lambda_function_arn" {
  description = "ARN da função Lambda."
  value       = aws_lambda_function.validador_cep.arn
}
