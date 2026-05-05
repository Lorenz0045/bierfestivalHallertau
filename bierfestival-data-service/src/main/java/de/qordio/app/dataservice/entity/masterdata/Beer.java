package de.qordio.app.dataservice.entity.masterdata;

import java.math.BigDecimal;

import de.qordio.app.dataservice.entity.lookups.BeerType;
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
@Table(name = "beer")
public class Beer extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "brewery_id")
    public Brewery brewery;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "beer_type_id")
    public BeerType beerType;

    @Column(name = "alcohol_percentage")
    public BigDecimal alcoholPercentage;

    @Column(name = "original_gravity")
    public BigDecimal originalGravity;

    @Column(name = "is_non_alcoholic")
    public Boolean isNonAlcoholic = false;

    @Column(columnDefinition = "TEXT")
    public String description;

    @Column(name = "rating_count")
    public Integer ratingCount = 0;

    @Column(name = "rating_average")
    public BigDecimal ratingAverage = new BigDecimal("0.00");
}