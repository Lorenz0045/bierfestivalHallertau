package de.qordio.app.dataservice.resource;

import de.qordio.app.dataservice.entity.lookups.BeerType;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/beer-types")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BeerTypeResource {

    @GET
    @PermitAll
    public List<BeerType> getAll() {
        return BeerType.listAll();
    }

    @POST
    @Transactional
    @RolesAllowed("admin")
    public Response create(BeerType beerType) {
        beerType.persist();
        return Response.status(Response.Status.CREATED).entity(beerType).build();
    }
}