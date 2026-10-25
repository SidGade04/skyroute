package io.skyroute.api.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SniperPoller {

    private static final long FIFTEEN_MINUTES = 15 * 60 * 1000L;

    private final SniperService snipers;

    public SniperPoller(SniperService snipers) {
        this.snipers = snipers;
    }

    @Scheduled(fixedDelay = FIFTEEN_MINUTES, initialDelay = FIFTEEN_MINUTES)
    public void poll() {
        snipers.poll();
    }
}
