package de.qordio.app.dataservice.entity.masterdata;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "bus_line")
public class BusLine extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "line_number", unique = true, nullable = false)
    public Integer lineNumber;

    @Column(nullable = false)
    public String name;

    @Column(name = "route_description", columnDefinition = "TEXT")
    public String routeDescription;

    @Column(name = "price_eur")
    public BigDecimal priceEur;
}
