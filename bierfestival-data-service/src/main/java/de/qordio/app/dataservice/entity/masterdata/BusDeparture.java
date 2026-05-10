package de.qordio.app.dataservice.entity.masterdata;

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

import java.time.OffsetDateTime;

@Entity
@Table(name = "bus_departure")
public class BusDeparture extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bus_line_id")
    public BusLine busLine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bus_stop_id")
    public BusStop busStop;

    @Column(nullable = false)
    public String direction; // 'HINFAHRT' or 'RUECKFAHRT'

    @Column(name = "departure_time", nullable = false)
    public OffsetDateTime departureTime;
}
