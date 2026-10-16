package io.skyroute.api.service;

import io.skyroute.api.exception.DuffelApiException;
import io.skyroute.api.model.dto.request.DuffelOfferRequest;
import io.skyroute.api.model.dto.response.DuffelRawResponse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class DuffelClientService {

    private final RestClient duffelRestClient;

    public DuffelClientService(RestClient duffelRestClient) {
        this.duffelRestClient = duffelRestClient;
    }

    public String fetchOffersRaw(DuffelOfferRequest requestPayload) {
        return duffelRestClient.post()
                .uri("/air/offer_requests?return_offers=true")
                .body(requestPayload)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new DuffelApiException(
                        "Duffel API error: " + resp.getStatusText(),
                        resp.getStatusCode().value()
                    );
                })
                .body(String.class);
    }

    // key = route/dates/pax/cabin only (DuffelOfferRequest has no bags/page)
    @Cacheable(cacheNames = "duffelOffers", key = "#requestPayload.toString()")
    public DuffelRawResponse fetchOffers(DuffelOfferRequest requestPayload) {
        return duffelRestClient.post()
                .uri("/air/offer_requests?return_offers=true")
                .body(requestPayload)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new DuffelApiException(
                        "Duffel API error: " + resp.getStatusText(),
                        resp.getStatusCode().value()
                    );
                })
                .body(DuffelRawResponse.class);
    }
}
