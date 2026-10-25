package io.skyroute.api.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import io.skyroute.api.model.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    @Query(value = """
            select exists(
                select 1 from skyroute.users
                where phone is not null
                  and replace(phone, ' ', '') = :phone
            )
            """, nativeQuery = true)
    boolean phoneTaken(@Param("phone") String phone);

    @Query(value = """
            select exists(
                select 1 from skyroute.users
                where phone is not null
                  and replace(phone, ' ', '') = :phone
                  and id <> :id
            )
            """, nativeQuery = true)
    boolean phoneTakenByOther(@Param("phone") String phone, @Param("id") UUID id);
}
