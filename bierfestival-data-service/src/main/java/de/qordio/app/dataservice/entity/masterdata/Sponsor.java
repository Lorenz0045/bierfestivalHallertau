package de.qordio.app.dataservice.entity.masterdata;

import de.qordio.app.dataservice.entity.lookups.City;
import de.qordio.app.dataservice.entity.lookups.SponsorTier;
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
@Table(name = "sponsor")
public class Sponsor extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_id")
    public City city;

    public String website;
    public String description;

    @Column(name = "img_url")
    public String imgUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sponsor_tier_id")
    public SponsorTier tier;
}