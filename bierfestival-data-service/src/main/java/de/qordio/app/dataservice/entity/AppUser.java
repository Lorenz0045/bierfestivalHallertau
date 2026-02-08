package de.qordio.app.dataservice.entity; 

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_user") 
public class AppUser extends PanacheEntityBase {

    @Id
    @Column(name = "keycloak_id", unique = true, nullable = false) // Eindeutige ID von Keycloak (sub Claim)
    public String id;

    // Fachliche Daten
    @Column(name = "location_limit")
    public int locationLimit;


    public AppUser() {
    }

    public AppUser(String id) {
        this.id = id;
    }

    // Getter und Setter
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getLocationLimit() {
        return locationLimit;
    }

    public void setLocationLimit(int locationLimit) {
        this.locationLimit = locationLimit;
    }

    
}