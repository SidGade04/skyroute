package io.skyroute.api.exception;

public class DuffelApiException extends RuntimeException {
    private final int statusCode;

    public DuffelApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}