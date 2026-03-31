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

@Entity
@Table(name = "tavern_beer")
public class TavernBeer extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tavern_id")
    public Tavern tavern;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "beer_id")
    public Beer beer;

    @Column(name = "sort_order")
    public Integer sortOrder;
}