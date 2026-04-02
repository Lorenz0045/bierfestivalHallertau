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

@Entity
@Table(name = "user_drink_event")
public class UserDrinkEvent extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "device_id", nullable = false)
    public String deviceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beer_id", nullable = false)
    public Beer beer;

    @Column(name = "consumed_at", nullable = false)
    public Instant consumedAt;

    public static UserDrinkEvent create(String deviceId, Beer beer, Instant time) {
        UserDrinkEvent event = new UserDrinkEvent();
        event.deviceId = deviceId;
        event.beer = beer;
        event.consumedAt = time;
        return event;
    }
}
