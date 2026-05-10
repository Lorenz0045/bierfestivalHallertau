package de.qordio.app.dataservice.entity.masterdata;

import de.qordio.app.dataservice.entity.lookups.City;
import de.qordio.app.dataservice.entity.lookups.GastronomyType;
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
@Table(name = "gastronomy")
public class Gastronomy extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_id")
    public City city;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gastronomy_type_id")
    public GastronomyType gastronomyType;

    public String website;

    @Column(name = "img_url")
    public String imgUrl;

    public Double lat;
    public Double lon;
}