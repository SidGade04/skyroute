package io.skyroute.api.config;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
public class FxConfig {

    @Value("${fx.api.base-url:https://api.exchangeratesapi.io/v1}")
    private String baseUrl;

    @Value("${fx.api.key}")
    private String key;

    @Bean
    public RestClient fxRestClient() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultUriVariables(Map.of("key", key))
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
