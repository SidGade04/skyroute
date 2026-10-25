package io.skyroute.api.service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Currency;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import io.skyroute.api.model.dto.request.SniperCondition;
import io.skyroute.api.model.entity.SniperEntity;
import io.skyroute.api.model.entity.UserEntity;

@Component
public class SniperMailer {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.US);

    private final String key;
    private final String from;
    private final String appUrl;
    private String hitTemplate;
    private String armedTemplate;
    private String disarmedTemplate;

    public SniperMailer(
            @Value("${sniper.mail.resend-key:}") String key,
            @Value("${sniper.mail.from:SkyRoute <onboarding@resend.dev>}") String from,
            @Value("${sniper.app-url:http://localhost:3000}") String appUrl
    ) {
        this.key = key == null ? "" : key.trim();
        this.from = from;
        this.appUrl = appUrl == null ? "http://localhost:3000" : appUrl.replaceAll("/+$", "");
    }

    public boolean configured() {
        return !key.isBlank();
    }

    public void sendArmed(SniperEntity sniper, UserEntity user, List<SniperCondition> conditions) {
        String html = armedTemplate()
                .replace("{{origin}}", sniper.getOrigin())
                .replace("{{destination}}", sniper.getDestination())
                .replace("{{firstName}}", esc(name(user)))
                .replace("{{armedPrice}}", money(sniper.getSnapshotPrice(), sniper.getCurrency()))
                .replace("{{trigger}}", esc(trigger(conditions, sniper.getMatchMode())))
                .replace("{{windowStart}}", sniper.getWindowStart().format(DAY))
                .replace("{{windowEnd}}", sniper.getWindowEnd().format(DAY))
                .replace("{{alertsUrl}}", appUrl + "/alerts")
                .replace("{{email}}", esc(user.getEmail()));
        post(user.getEmail(), "Sniper armed: " + sniper.getOrigin() + " to " + sniper.getDestination(), html);
    }

    public void sendDisarmed(SniperEntity sniper, UserEntity user) {
        String html = disarmedTemplate()
                .replace("{{origin}}", sniper.getOrigin())
                .replace("{{destination}}", sniper.getDestination())
                .replace("{{firstName}}", esc(name(user)))
                .replace("{{windowStart}}", sniper.getWindowStart().format(DAY))
                .replace("{{windowEnd}}", sniper.getWindowEnd().format(DAY))
                .replace("{{alertsUrl}}", appUrl + "/alerts")
                .replace("{{email}}", esc(user.getEmail()));
        post(user.getEmail(), "Sniper disarmed: " + sniper.getOrigin() + " to " + sniper.getDestination(), html);
    }

    public void sendHit(SniperEntity sniper, UserEntity user, List<SniperCondition> conditions) {
        String hit = money(sniper.getTriggeredPrice(), sniper.getCurrency());
        java.time.LocalDate cheapest = sniper.getCheapestDate() != null ? sniper.getCheapestDate() : sniper.getWindowStart();
        String html = hitTemplate()
                .replace("{{origin}}", sniper.getOrigin())
                .replace("{{destination}}", sniper.getDestination())
                .replace("{{firstName}}", esc(name(user)))
                .replace("{{armedPrice}}", money(sniper.getSnapshotPrice(), sniper.getCurrency()))
                .replace("{{hitPrice}}", hit)
                .replace("{{saved}}", money(sniper.getSnapshotPrice().subtract(sniper.getTriggeredPrice()), sniper.getCurrency()))
                .replace("{{dropPct}}", dropPct(sniper.getSnapshotPrice(), sniper.getTriggeredPrice()))
                .replace("{{windowStart}}", sniper.getWindowStart().format(DAY))
                .replace("{{windowEnd}}", sniper.getWindowEnd().format(DAY))
                .replace("{{cheapestDate}}", cheapest.format(DAY))
                .replace("{{trigger}}", esc(trigger(conditions, sniper.getMatchMode())))
                .replace("{{searchUrl}}", searchUrl(sniper))
                .replace("{{alertsUrl}}", appUrl + "/alerts")
                .replace("{{email}}", esc(user.getEmail()));
        post(user.getEmail(), "Headshot: " + sniper.getOrigin() + " to " + sniper.getDestination() + " now " + hit, html);
    }

    private void post(String to, String subject, String html) {
        RestClient.create().post()
                .uri("https://api.resend.com/emails")
                .header("Authorization", "Bearer " + key)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", from,
                        "to", List.of(to),
                        "subject", subject,
                        "html", html
                ))
                .retrieve()
                .toBodilessEntity();
    }

    private String searchUrl(SniperEntity sniper) {
        return appUrl
                + "/?origin=" + sniper.getOrigin()
                + "&destination=" + sniper.getDestination()
                + "&departureDate=" + (sniper.getCheapestDate() != null ? sniper.getCheapestDate() : sniper.getWindowStart());
    }

    private String hitTemplate() {
        if (hitTemplate == null) hitTemplate = load("mail/sniper-hit.html");
        return hitTemplate;
    }

    private String armedTemplate() {
        if (armedTemplate == null) armedTemplate = load("mail/sniper-armed.html");
        return armedTemplate;
    }

    private String disarmedTemplate() {
        if (disarmedTemplate == null) disarmedTemplate = load("mail/sniper-disarmed.html");
        return disarmedTemplate;
    }

    private static String load(String path) {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException(path + " missing", e);
        }
    }

    private static String trigger(List<SniperCondition> conditions, String matchMode) {
        String glue = "ALL".equals(matchMode) ? " and " : " or ";
        return String.join(glue, conditions.stream().map(SniperMailer::one).toList());
    }

    private static String one(SniperCondition condition) {
        return switch (condition.op()) {
            case "LTE" -> "at or below " + condition.amount().toPlainString();
            case "LT" -> "below " + condition.amount().toPlainString();
            case "BETWEEN" -> "between " + condition.min().toPlainString() + " and " + condition.max().toPlainString();
            case "PCT_BELOW" -> condition.pct() + "% below " + ("USER".equals(condition.basis())
                    ? condition.amount().toPlainString()
                    : "the armed fare");
            default -> condition.op();
        };
    }

    private static String dropPct(BigDecimal armed, BigDecimal hit) {
        if (armed.signum() <= 0) return "0";
        return armed.subtract(hit).multiply(BigDecimal.valueOf(100))
                .divide(armed, 0, RoundingMode.HALF_UP)
                .toPlainString();
    }

    private static String money(BigDecimal amount, String currency) {
        var format = java.text.NumberFormat.getCurrencyInstance(Locale.US);
        format.setCurrency(Currency.getInstance(currency));
        format.setMaximumFractionDigits(0);
        return format.format(amount);
    }

    private static String name(UserEntity user) {
        String first = user.getFirstName();
        return first == null || first.isBlank() ? "there" : first;
    }

    private static String esc(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
