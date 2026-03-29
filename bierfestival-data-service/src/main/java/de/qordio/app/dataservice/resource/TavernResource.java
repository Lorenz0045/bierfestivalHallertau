package de.qordio.app.dataservice.resource;

import de.qordio.app.dataservice.entity.masterdata.Tavern;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/taverns")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TavernResource {

    @GET
    @PermitAll
    public List<Tavern> getAllTaverns() {
        return Tavern.listAll();
    }

    @GET
    @Path("/unmapped")
    @RolesAllowed("admin")
    public List<Tavern> getUnmappedTaverns() {
        return Tavern.list("lat is null and lon is null");
    }

    @POST
    @Transactional
    @RolesAllowed("admin")
    public Response createTavern(Tavern tavern) {
        tavern.persist();
        return Response.status(Response.Status.CREATED).entity(tavern).build();
    }

    @PATCH
    @Path("/{id}/coordinates")
    @Transactional
    @RolesAllowed("admin")
    public Response updateCoordinates(@PathParam("id") Long id, CoordinateDTO coords) {
        Tavern tavern = Tavern.findById(id);
        if (tavern == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        tavern.lat = coords.lat;
        tavern.lon = coords.lon;
        return Response.ok(tavern).build();
    }

    public static class CoordinateDTO {
        public Double lat;
        public Double lon;
    }
}