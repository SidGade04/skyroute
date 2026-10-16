package io.skyroute.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.math.BigDecimal;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class FxServiceTest {

    private FxService serviceReturning(String json) {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://fx").defaultUriVariables(Map.of("key", "k"));
        MockRestServiceServer.bindTo(builder).build()
                .expect(requestTo("http://fx/latest?access_key=k"))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
        return new FxService(builder.build());
    }

    @Test
    void stripsProviderEnvelope() {
        var r = serviceReturning("""
                {"success":true,"timestamp":1,"base":"EUR","date":"2026-10-16","rates":{"USD":1.08,"AED":3.97}}
                """).getLatest();
        assertEquals("EUR", r.base());
        assertEquals("2026-10-16", r.date());
        assertEquals(new BigDecimal("3.97"), r.rates().get("AED"));
    }

    @Test
    void throwsOnProviderError() {
        var svc = serviceReturning("""
                {"success":false,"error":{"code":101,"type":"invalid_access_key"}}
                """);
        assertThrows(IllegalStateException.class, svc::getLatest);
    }
}
