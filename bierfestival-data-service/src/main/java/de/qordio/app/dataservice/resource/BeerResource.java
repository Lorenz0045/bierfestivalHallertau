package de.qordio.app.dataservice.resource;

import java.util.List;

import de.qordio.app.dataservice.entity.masterdata.Beer;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/beers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BeerResource {

    @GET
    @PermitAll
    public List<Beer> getAll() {
        return Beer.listAll();
    }

    @POST
    @Transactional
    @RolesAllowed("admin")
    public Response create(Beer beer) {
        // Quarkus/Hibernate mappt die IDs aus dem JSON automatisch auf die verknüpften Entitäten, 
        // solange das Frontend ein Objekt mit der entsprechenden ID übergibt: { "brewery": { "id": 1 } }
        beer.persist();
        return Response.status(Response.Status.CREATED).entity(beer).build();
    }
    
    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("admin")
    public Response delete(@PathParam("id") Long id) {
        boolean deleted = Beer.deleteById(id);
        return deleted ? Response.noContent().build() : Response.status(Response.Status.NOT_FOUND).build();
    }
}