package io.skyroute.api.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "airports", schema = "skyroute")
public class AirportEntity {

    @Id
    @Column(name = "iata", length = 3, nullable = false)
    private String iata;

    @Column(name = "icao", length = 4)
    private String icao;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "country", length = 2, nullable = false)
    private String country;

    @Column(name = "timezone", nullable = false)
    private String timezone;

    @Column(name = "lat")
    private double lat;

    @Column(name = "lon")
    private double lon;

    @Column(name = "downtown_minutes")
    private int downtown_minutes;

    @Column(name = "is_major_hub", nullable = false)
    private boolean is_major_hub;

    @Column(name = "search_blob", insertable = false, updatable = false)
    private String search_blob = "";

    protected AirportEntity() {}

    public AirportEntity(String iata, String icao, String name, String city, String country, String timezone, double lat, double lon, int downtown_minutes, boolean is_major_hub) {
        this.iata = iata;
        this.icao = icao;
        this.name = name;
        this.city = city;
        this.country = country;
        this.timezone = timezone;
        this.lat = lat;
        this.lon = lon;
        this.downtown_minutes = downtown_minutes;
        this.is_major_hub = is_major_hub;
        this.search_blob = (iata + " " + city + " " + name + " " + country).toUpperCase();
    }

    public String getIata() {
        return iata;
    }
    public String getIcao() {
        return icao;
    }
    public String getName() {
        return name;
    }
    public String getCity() {
        return city;
    }
    public String getCountry() {
        return country;
    }
    public String getTimezone() {
        return timezone;
    }
    public double getLat() {
        return lat;
    }
    public double getLon() {
        return lon;
    }
    public int getDowntownMinutes() {
        return downtown_minutes;
    }
    public boolean isMajorHub() {
        return is_major_hub;
    }
    public String getSearchBlob() {
        return search_blob;
    }
}
