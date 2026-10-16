package io.skyroute.api.repository;

import java.util.List;

import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import io.skyroute.api.model.entity.AirportEntity;

@Repository
public interface AirportRepository extends JpaRepository<AirportEntity, String> {

    @Query("""
        SELECT a FROM AirportEntity a
        WHERE a.search_blob LIKE CONCAT('%', UPPER(:q), '%')
        ORDER BY a.is_major_hub DESC, a.city
        """)    
    List<AirportEntity> autocomplete(@Param("q") String q, Pageable pageable);

    @Query("SELECT a FROM AirportEntity a")
    List<AirportEntity> findAll();

    @Query("SELECT a FROM AirportEntity a WHERE a.is_major_hub = true")
    List<AirportEntity> findMajorHubs();

    @Query("""
        SELECT a FROM AirportEntity a
        ORDER BY a.is_major_hub DESC, a.city
        """)
    List<AirportEntity> findPopular(Pageable pageable);
}
