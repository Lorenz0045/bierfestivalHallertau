package de.qordio.app.dataservice.entity.tracking;

import java.time.Instant;

import de.qordio.app.dataservice.entity.masterdata.Beer;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "user_beer_interaction", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"device_id", "beer_id"})
})
public class UserBeerInteraction extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "device_id", nullable = false)
    public String deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beer_id", nullable = false)
    public Beer beer;

    @Column(name = "is_on_merkliste")
    public Boolean isOnMerkliste = false;

    @Column(name = "merkliste_added_at")
    public Instant merklisteAddedAt;

    @Column(name = "rating")
    public Integer rating; // 1 to 5, nullable if not rated

    @Column(name = "rated_at")
    public Instant ratedAt;

    // Helper for finding a specific interaction easily
    public static UserBeerInteraction findByDeviceAndBeer(String deviceId, Long beerId) {
        return find("deviceId = ?1 and beer.id = ?2", deviceId, beerId).firstResult();
    }
}
