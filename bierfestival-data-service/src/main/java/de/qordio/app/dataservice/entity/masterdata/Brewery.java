package de.qordio.app.dataservice.entity.masterdata;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "brewery")
public class Brewery extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false)
    public String name;

    public String city;
    public String region;

    @Column(name = "is_hallertau")
    public Boolean isHallertau = false;

    public String website;

    @Column(name = "img_url")
    public String imgUrl;
}