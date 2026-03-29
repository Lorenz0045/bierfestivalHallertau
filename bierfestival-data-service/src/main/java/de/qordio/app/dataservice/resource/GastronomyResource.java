package de.qordio.app.dataservice.resource;

import java.util.List;

import de.qordio.app.dataservice.entity.masterdata.Gastronomy;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/gastronomies")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GastronomyResource {

    @GET
    @PermitAll
    public List<Gastronomy> getAll() {
        return Gastronomy.listAll();
    }

    @GET
    @Path("/unmapped")
    @RolesAllowed("admin")
    public List<Gastronomy> getUnmapped() {
        return Gastronomy.list("lat is null and lon is null");
    }

    @POST
    @Transactional
    @RolesAllowed("admin")
    public Response create(Gastronomy gastronomy) {
        gastronomy.persist();
        return Response.status(Response.Status.CREATED).entity(gastronomy).build();
    }

    @PATCH
    @Path("/{id}/coordinates")
    @Transactional
    @RolesAllowed("admin")
    public Response updateCoordinates(@PathParam("id") Long id, CoordinateDTO coords) {
        Gastronomy gastronomy = Gastronomy.findById(id);
        if (gastronomy == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        gastronomy.lat = coords.lat;
        gastronomy.lon = coords.lon;
        return Response.ok(gastronomy).build();
    }

    public static class CoordinateDTO {
        public Double lat;
        public Double lon;
    }
}