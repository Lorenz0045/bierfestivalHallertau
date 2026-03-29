package de.qordio.app.dataservice.resource;

import java.util.List;

import de.qordio.app.dataservice.entity.lookups.FacilityType;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/facility-types")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class FacilityTypeResource {

    @GET
    @PermitAll
    public List<FacilityType> getAllFacilityTypes() {
        return FacilityType.listAll();
    }

    @POST
    @Transactional
    @RolesAllowed("admin")
    public Response createFacilityType(FacilityType type) {
        type.persist();
        return Response.status(Response.Status.CREATED).entity(type).build();
    }
}