package com.validar.cep.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class CepProxyService {

    private final RestClient restClient;
    private final String configuredBaseUrl;

    public CepProxyService(@Value("${aws.cep.api-base-url}") String baseUrl) {
        this.configuredBaseUrl = baseUrl == null ? "" : baseUrl.trim();
        String normalizedBaseUrl = this.configuredBaseUrl.replaceAll("/+$", "");
        this.restClient = RestClient.builder()
                .baseUrl(normalizedBaseUrl)
                .build();
    }

    public ResponseEntity<String> consultarCep(String cep) {
        if (!cep.matches("\\d{8}")) {
            return ResponseEntity.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"erro\":\"CEP deve conter 8 digitos.\"}");
        }

        if (configuredBaseUrl == null || configuredBaseUrl.isBlank() || configuredBaseUrl.contains("SEU_API_ID")) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"erro\":\"Configure AWS_CEP_API_BASE_URL com o endpoint real do API Gateway.\"}");
        }

        try {
            return restClient.get()
                    .uri("/cep/{cep}", cep)
                    .exchange((request, response) -> {
                        String body = "";
                        try {
                            InputStream responseBody = response.getBody();
                            if (responseBody != null) {
                                body = new String(responseBody.readAllBytes(), StandardCharsets.UTF_8);
                            }
                        } catch (IOException e) {
                            throw new RuntimeException("Falha ao ler resposta da API AWS.", e);
                        }

                        if (body.isBlank()) {
                            body = "{}";
                        }

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);

                        HttpStatus status = HttpStatus.valueOf(response.getStatusCode().value());
                        return new ResponseEntity<>(body, headers, status);
                    });
        } catch (RestClientException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"erro\":\"Falha ao chamar API AWS.\"}");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"erro\":\"Erro interno inesperado.\"}");
        }
    }
}
